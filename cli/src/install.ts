import {
  mkdirSync,
  writeFileSync,
  existsSync,
  rmSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { HOME_REPO, GITHUB_TOKEN, AGENT_TARGETS, DEFAULT_AGENT } from "./config.js";
import type { RegistryEntry, InstalledMeta } from "./types.js";

interface GhSource {
  owner: string;
  repo: string;
  ref: string;
  dir: string; // repo-relative dir of the skill folder
}

/** Resolve a registry entry to a GitHub folder location. */
export function resolveSource(entry: RegistryEntry): GhSource {
  if (entry.source === "hmrbot") {
    return {
      ...HOME_REPO,
      dir: (entry.path ?? `content/skills/${entry.slug}/`).replace(/\/$/, ""),
    };
  }
  // federated: upstream_url is a github tree URL
  //   https://github.com/<owner>/<repo>/tree/<ref>/<dir...>
  const m = entry.upstream_url?.match(
    /github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/,
  );
  if (!m) throw new Error(`cannot resolve source for "${entry.slug}" (${entry.source})`);
  return { owner: m[1]!, repo: m[2]!, ref: m[3]!, dir: m[4]!.replace(/\/$/, "") };
}

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = { "user-agent": "hmrbot-cli" };
  if (GITHUB_TOKEN) h.authorization = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

interface GhContentNode {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
}

async function ghContents(src: GhSource, path: string): Promise<GhContentNode[]> {
  const url = `https://api.github.com/repos/${src.owner}/${src.repo}/contents/${path}?ref=${src.ref}`;
  const res = await fetch(url, { headers: { ...ghHeaders(), accept: "application/vnd.github+json" } });
  if (res.status === 404) throw new Error(`not found: ${src.owner}/${src.repo}/${path}@${src.ref}`);
  if (res.status === 403) {
    throw new Error(
      `GitHub API 403 for ${src.owner}/${src.repo}. ` +
        (GITHUB_TOKEN
          ? "Token lacks access, or the repo is private."
          : "Rate-limited or private repo — set GITHUB_TOKEN."),
    );
  }
  if (!res.ok) throw new Error(`GitHub contents API failed: ${res.status}`);
  const body = await res.json();
  return Array.isArray(body) ? (body as GhContentNode[]) : [body as GhContentNode];
}

/** Download every file under `src.dir` into `destDir` (recurses subdirs). */
export async function downloadSkill(src: GhSource, destDir: string): Promise<number> {
  let count = 0;
  const walk = async (repoPath: string, relBase: string): Promise<void> => {
    const nodes = await ghContents(src, repoPath);
    for (const node of nodes) {
      const rel = relBase ? `${relBase}/${node.name}` : node.name;
      if (node.type === "dir") {
        await walk(node.path, rel);
      } else if (node.type !== "file") {
        process.stderr.write(`  ! skipped ${node.path} (${node.type})\n`);
      } else if (node.download_url) {
        const r = await fetch(node.download_url, { headers: ghHeaders() });
        if (!r.ok) throw new Error(`download failed (${r.status}): ${node.path}`);
        const out = join(destDir, rel);
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, Buffer.from(await r.arrayBuffer()));
        count++;
      }
    }
  };
  await walk(src.dir.replace(/\/$/, ""), "");
  if (count === 0) throw new Error(`no files at ${src.dir} in ${src.owner}/${src.repo}`);
  return count;
}

/** Copy a skill folder from a local checkout (used when --registry is a local path). */
export function copyLocalSkill(repoRoot: string, src: GhSource, destDir: string): number {
  const from = join(repoRoot, src.dir);
  if (!existsSync(from)) throw new Error(`local skill not found: ${from}`);
  let count = 0;
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else {
        const out = join(destDir, relative(from, p));
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, readFileSync(p));
        count++;
      }
    }
  };
  walk(from);
  return count;
}

/** Where a skill should be installed. */
export function resolveTarget(opts: { agent?: string; dir?: string }): string {
  if (opts.dir) return resolve(opts.dir);
  const key = opts.agent ?? detectAgent() ?? DEFAULT_AGENT;
  const preset = AGENT_TARGETS[key];
  if (!preset) throw new Error(`unknown --agent "${key}" (${Object.keys(AGENT_TARGETS).join(", ")})`);
  return resolve(preset);
}

function detectAgent(): string | null {
  if (existsSync(resolve(".claude"))) return "claude";
  if (existsSync(resolve(".agents"))) return "agents";
  if (existsSync(resolve(".opencode"))) return "opencode";
  return null;
}

export function writeMeta(destDir: string, meta: InstalledMeta): void {
  writeFileSync(join(destDir, ".hmrbot-meta.json"), JSON.stringify(meta, null, 2) + "\n");
}

export function readMeta(dir: string): InstalledMeta | null {
  const p = join(dir, ".hmrbot-meta.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as InstalledMeta;
  } catch {
    return null;
  }
}

export function removeDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
