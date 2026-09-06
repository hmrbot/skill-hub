/**
 * Federation: harvest skill metadata (name, description, license) from external
 * repos. No content is copied — only an index entry with a link. The CLI
 * downloads federated skills straight from upstream at install time.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import matter from "gray-matter";
import type { RegistryEntry } from "./index.js";

export interface GithubSource {
  id: string;
  type: "github";
  repo: string;
  ref: string;
  path: string;
  license_policy: "repo" | "per-skill";
  license?: string;
  license_allow?: string[];
  exclude?: string[];
  enabled?: boolean;
}

export interface Rejection {
  source: string;
  slug: string;
  reason: string;
}

const TOKEN = process.env.HMRBOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";
const TEMPLATE_SLUGS = new Set(["template", "_template", "skill-template"]);

function ghHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = { "user-agent": "hmrbot-hub-registry" };
  if (TOKEN) h.authorization = `Bearer ${TOKEN}`;
  if (json) h.accept = "application/vnd.github+json";
  return h;
}

async function ghJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: ghHeaders(true) });
  if (!res.ok) throw new Error(`GitHub ${res.status} ${url}`);
  return (await res.json()) as T;
}

async function raw(repo: string, ref: string, path: string): Promise<string | null> {
  const res = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${path}`, {
    headers: ghHeaders(),
  });
  return res.ok ? await res.text() : null;
}

/** Best-effort SPDX-ish classification of a LICENSE file's text. */
export function classifyLicense(text: string | null): string {
  if (!text) return "unknown";
  const t = text.toLowerCase();
  if (t.includes("apache license") && t.includes("version 2.0")) return "Apache-2.0";
  if (/\bmit license\b/.test(t) || (t.includes("permission is hereby granted, free of charge"))) return "MIT";
  if (t.includes("bsd ") && t.includes("redistribution")) return "BSD";
  if (
    t.includes("all rights reserved") ||
    t.includes("may not") ||
    t.includes("proprietary") ||
    t.includes("reverse engineer")
  ) {
    return "proprietary";
  }
  return "unknown";
}

/** Read sources.yaml and return the enabled github sources for a section. */
export function readSources(repoRoot: string, section = "skill"): GithubSource[] {
  const raw = readFileSync(join(repoRoot, "sources.yaml"), "utf8");
  const cfg = parseYaml(raw) as {
    sections: Record<string, { sources: (GithubSource & { type: string })[] }>;
  };
  const list = cfg.sections?.[section]?.sources ?? [];
  return list.filter((s): s is GithubSource => s.type === "github" && s.enabled === true);
}

async function listSkillDirs(
  src: GithubSource,
): Promise<{ slug: string; dir: string }[]> {
  const tree = await ghJson<{
    truncated: boolean;
    tree: { path: string; type: string }[];
  }>(`https://api.github.com/repos/${src.repo}/git/trees/${src.ref}?recursive=1`);

  const prefix = src.path.replace(/\/$/, "") + "/";
  const seen = new Set<string>();
  const out: { slug: string; dir: string }[] = [];

  for (const node of tree.tree) {
    if (node.type !== "blob" || !node.path.endsWith("/SKILL.md")) continue;
    if (!node.path.startsWith(prefix)) continue;
    const dir = node.path.slice(0, -"/SKILL.md".length);
    const slug = dir.split("/").pop()!;
    if (TEMPLATE_SLUGS.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, dir });
  }

  if (tree.truncated) {
    process.stderr.write(
      `  ! ${src.repo} tree was truncated — some skills may be missing\n`,
    );
  }
  return out;
}

/** Run `fn` over `items` with bounded concurrency. */
async function mapPool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]!);
      }
    }),
  );
  return out;
}

export async function harvestSource(
  src: GithubSource,
): Promise<{ entries: RegistryEntry[]; rejected: Rejection[] }> {
  const rejected: Rejection[] = [];
  const dirs = await listSkillDirs(src);
  const allow = new Set(src.license_allow ?? ["Apache-2.0", "MIT", "BSD"]);
  const exclude = new Set(src.exclude ?? []);

  const results = await mapPool(dirs, 12, async ({ slug, dir }) => {
    if (exclude.has(slug)) return { slug, reject: "excluded" as const };

    const skillMd = await raw(src.repo, src.ref, `${dir}/SKILL.md`);
    if (!skillMd) return { slug, reject: "SKILL.md unreadable" as const };

    let fm: Record<string, unknown>;
    try {
      fm = matter(skillMd).data;
    } catch {
      return { slug, reject: "unparseable frontmatter" as const };
    }
    const description = typeof fm.description === "string" ? fm.description.trim() : "";
    if (!description) return { slug, reject: "no description" as const };

    let license = "unknown";
    if (src.license_policy === "repo") {
      license = src.license ?? "unknown";
    } else {
      const lic =
        (await raw(src.repo, src.ref, `${dir}/LICENSE.txt`)) ??
        (await raw(src.repo, src.ref, `${dir}/LICENSE`));
      license = classifyLicense(lic);
    }
    if (!allow.has(license)) return { slug, reject: `license ${license} not allowed` };

    const entry: RegistryEntry = {
      slug,
      section: "skill",
      name: typeof fm.name === "string" ? fm.name : slug,
      description,
      category: null,
      tags: [],
      version: typeof fm.version === "string" ? fm.version : null,
      locale: "en",
      source: src.id,
      license,
      path: null,
      upstream_url: `https://github.com/${src.repo}/tree/${src.ref}/${dir}`,
      install: `npx hmrbot skill add ${slug}`,
    };
    return { slug, entry };
  });

  const entries: RegistryEntry[] = [];
  for (const r of results) {
    if ("entry" in r && r.entry) entries.push(r.entry);
    else if ("reject" in r) rejected.push({ source: src.id, slug: r.slug, reason: r.reject });
  }
  return { entries, rejected };
}

export async function harvestAll(repoRoot: string): Promise<{
  entries: RegistryEntry[];
  rejected: Rejection[];
}> {
  const sources = readSources(repoRoot, "skill");
  const entries: RegistryEntry[] = [];
  const rejected: Rejection[] = [];
  for (const src of sources) {
    process.stderr.write(`  federating ${src.id} (${src.repo}) …\n`);
    const r = await harvestSource(src);
    entries.push(...r.entries);
    rejected.push(...r.rejected);
    process.stderr.write(`    +${r.entries.length} skills, ${r.rejected.length} rejected\n`);
  }
  return { entries, rejected };
}
