import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { loadRegistry } from "./registry.js";
import {
  resolveSource,
  resolveTarget,
  agentRoots,
  downloadSkill,
  copyLocalSkill,
  writeMeta,
  readMeta,
  removeDir,
} from "./install.js";
import type { RegistryEntry } from "./types.js";

type SectionArg = "skill" | "prompt" | undefined;

interface Ctx {
  section?: SectionArg;
  registrySource?: string;
  refresh?: boolean;
  agent?: string;
  dir?: string;
  force?: boolean;
}

const localRepoRoot = (src?: string) =>
  src && !/^(https?|file):\/\//.test(src) ? dirname(resolve(src)) : null;

const existsSkillDir = (root: string, dir: string) => existsSync(join(root, dir));

function findEntry(skills: RegistryEntry[], slug: string, section: SectionArg): RegistryEntry {
  const pool = section ? skills.filter((s) => s.section === section) : skills;
  const e = pool.find((s) => s.slug === slug);
  if (!e) {
    const near = pool
      .filter((s) => s.slug.includes(slug) || s.name.includes(slug))
      .slice(0, 5)
      .map((s) => s.slug);
    throw new Error(
      `no ${section ?? "entry"} "${slug}"` + (near.length ? `\n  did you mean: ${near.join(", ")}` : ""),
    );
  }
  return e;
}

export async function cmdAdd(slug: string, ctx: Ctx): Promise<void> {
  if (!slug) throw new Error(`usage: hmrbot ${ctx.section ?? "skill"} add <slug>`);
  const reg = await loadRegistry({ source: ctx.registrySource, refresh: ctx.refresh });
  const entry = findEntry(reg.skills, slug, ctx.section);
  const target = resolveTarget({ section: entry.section, agent: ctx.agent, dir: ctx.dir });
  const destDir = join(target, entry.slug);

  if (existsSync(destDir)) {
    if (!readMeta(destDir) && !ctx.force) {
      throw new Error(`${destDir} already exists and was not installed by hmrbot.\n  pass --force to overwrite.`);
    }
    removeDir(destDir);
  }

  const src = resolveSource(entry);
  const repoRoot = entry.source === "hmrbot" ? localRepoRoot(ctx.registrySource) : null;
  const n =
    repoRoot && existsSkillDir(repoRoot, src.dir)
      ? copyLocalSkill(repoRoot, src, destDir)
      : await downloadSkill(src, destDir);

  writeMeta(destDir, {
    slug: entry.slug,
    section: entry.section,
    source: entry.source,
    version: entry.version,
    installed_at: new Date().toISOString(),
    installed_from: `${src.owner}/${src.repo}@${src.ref}:${src.dir}`,
  });

  console.log(`✓ installed ${entry.section} ${entry.slug} (${n} file${n === 1 ? "" : "s"}) → ${destDir}`);
}

function scanInstalled(roots: string[]) {
  const out: { root: string; name: string; meta: ReturnType<typeof readMeta> }[] = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) {
      const dir = join(root, name);
      try {
        if (!statSync(dir).isDirectory()) continue;
      } catch {
        continue;
      }
      const meta = readMeta(dir);
      if (meta) out.push({ root, name, meta });
    }
  }
  return out;
}

export async function cmdList(ctx: Ctx): Promise<void> {
  const sections: ("skill" | "prompt")[] = ctx.section ? [ctx.section] : ["skill", "prompt"];
  const roots = ctx.dir
    ? [resolve(ctx.dir)]
    : sections.flatMap((s) => agentRoots(s));

  const found = scanInstalled(roots);
  if (found.length === 0) {
    console.log("no hmrbot-installed content found");
    return;
  }
  for (const { root, meta } of found) {
    console.log(`${meta!.section.padEnd(7)} ${meta!.slug.padEnd(28)} ${(meta!.version ?? "-").padEnd(8)} ${root}`);
  }
}

export async function cmdSearch(query: string, ctx: Ctx): Promise<void> {
  const reg = await loadRegistry({ source: ctx.registrySource, refresh: ctx.refresh });
  const q = (query ?? "").toLowerCase();
  const pool = ctx.section ? reg.skills.filter((s) => s.section === ctx.section) : reg.skills;
  const hits = pool.filter((s) =>
    `${s.slug} ${s.name} ${s.description} ${s.tags.join(" ")}`.toLowerCase().includes(q),
  );
  if (hits.length === 0) {
    console.log(`no matches for "${query}"`);
    return;
  }
  for (const s of hits) {
    console.log(`\n${s.section}  ${s.slug}  ${s.category ? `[${s.category}]` : ""}  ${s.source}`);
    console.log(`  ${s.description.slice(0, 200)}`);
  }
  console.log(`\n${hits.length} result${hits.length === 1 ? "" : "s"}`);
}

export async function cmdRegistry(ctx: Ctx): Promise<void> {
  const reg = await loadRegistry({ source: ctx.registrySource, refresh: ctx.refresh });
  const bySection = new Map<string, number>();
  for (const s of reg.skills) bySection.set(s.section, (bySection.get(s.section) ?? 0) + 1);
  console.log(`${reg.count} entries — ${[...bySection].map(([k, v]) => `${k}:${v}`).join(", ")}`);
}

export async function cmdRemove(slug: string, ctx: Ctx): Promise<void> {
  if (!slug) throw new Error("usage: hmrbot <skill|prompt> remove <slug>");
  const sections: ("skill" | "prompt")[] = ctx.section ? [ctx.section] : ["skill", "prompt"];
  const roots = ctx.dir ? [resolve(ctx.dir)] : sections.flatMap((s) => agentRoots(s));

  let removed = 0;
  for (const root of roots) {
    const destDir = join(root, slug);
    if (!existsSync(destDir)) continue;
    if (!readMeta(destDir) && !ctx.force) {
      throw new Error(`${destDir} was not installed by hmrbot; pass --force`);
    }
    removeDir(destDir);
    removed++;
  }
  if (removed === 0) throw new Error(`"${slug}" is not installed under the known locations`);
  console.log(`✓ removed ${slug}`);
}

export async function cmdUpdate(slug: string | undefined, ctx: Ctx): Promise<void> {
  const reg = await loadRegistry({ source: ctx.registrySource, refresh: true });
  const sections: ("skill" | "prompt")[] = ctx.section ? [ctx.section] : ["skill", "prompt"];
  const roots = ctx.dir ? [resolve(ctx.dir)] : sections.flatMap((s) => agentRoots(s));

  const targets = slug
    ? scanInstalled(roots).filter((x) => x.name === slug)
    : scanInstalled(roots);

  if (targets.length === 0) {
    console.log("nothing to update");
    return;
  }

  for (const { name, meta } of targets) {
    const entry = reg.skills.find((e) => e.slug === name && e.section === meta!.section);
    if (!entry) {
      console.log(`- ${name}: skipped (not in registry)`);
      continue;
    }
    if (entry.version && meta!.version && entry.version === meta!.version) {
      console.log(`= ${name}: up to date (v${meta!.version})`);
      continue;
    }
    await cmdAdd(name, { ...ctx, section: meta!.section as SectionArg, force: true });
  }
}

export function cmdOpen(what: string | undefined): void {
  const path = what && ["skill", "prompt", "software"].includes(what) ? `/${what}` : "";
  const url = `https://hub.hmrbot.com${path}`;
  const cmd =
    process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
  import("node:child_process").then(({ spawn }) => {
    spawn(cmd, [url], { shell: true, stdio: "ignore", detached: true }).unref();
  });
  console.log(url);
}
