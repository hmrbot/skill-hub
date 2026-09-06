import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { AGENT_TARGETS } from "./config.js";
import { loadRegistry } from "./registry.js";
import {
  resolveSource,
  resolveTarget,
  downloadSkill,
  copyLocalSkill,
  writeMeta,
  readMeta,
  removeDir,
} from "./install.js";
import type { RegistryEntry } from "./types.js";

interface Ctx {
  registrySource?: string;
  refresh?: boolean;
  agent?: string;
  dir?: string;
  force?: boolean;
  all?: boolean;
}

const localRepoRoot = (src?: string) =>
  src && !/^(https?|file):\/\//.test(src) ? dirname(resolve(src)) : null;

const existsSkillDir = (root: string, dir: string) => existsSync(join(root, dir));

function findEntry(skills: RegistryEntry[], slug: string): RegistryEntry {
  const e = skills.find((s) => s.slug === slug);
  if (!e) {
    const near = skills
      .filter((s) => s.slug.includes(slug) || s.name.includes(slug))
      .slice(0, 5)
      .map((s) => s.slug);
    throw new Error(
      `no skill "${slug}"` + (near.length ? `\n  did you mean: ${near.join(", ")}` : ""),
    );
  }
  return e;
}

export async function cmdAdd(slug: string, ctx: Ctx): Promise<void> {
  if (!slug) throw new Error("usage: hmrbot skill add <slug>");
  const reg = await loadRegistry({ source: ctx.registrySource, refresh: ctx.refresh });
  const entry = findEntry(reg.skills, slug);
  const target = resolveTarget({ agent: ctx.agent, dir: ctx.dir });
  const destDir = join(target, entry.slug);

  if (existsSync(destDir)) {
    const meta = readMeta(destDir);
    if (!meta && !ctx.force) {
      throw new Error(
        `${destDir} already exists and was not installed by hmrbot.\n  pass --force to overwrite.`,
      );
    }
    removeDir(destDir);
  }

  const src = resolveSource(entry);
  // A local checkout only helps for first-party skills; federated ones always
  // download from their upstream repo.
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

  console.log(`✓ installed ${entry.slug} (${n} file${n === 1 ? "" : "s"}) → ${destDir}`);
}

export async function cmdList(ctx: Ctx): Promise<void> {
  const roots = ctx.dir
    ? [resolve(ctx.dir)]
    : ctx.agent && AGENT_TARGETS[ctx.agent]
      ? [resolve(AGENT_TARGETS[ctx.agent]!)]
      : Object.values(AGENT_TARGETS).map((p) => resolve(p));

  let found = 0;
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) {
      const dir = join(root, name);
      if (!statSync(dir).isDirectory()) continue;
      const meta = readMeta(dir);
      if (!meta) continue;
      found++;
      console.log(`${meta.slug.padEnd(28)} ${(meta.version ?? "-").padEnd(8)} ${root}`);
    }
  }
  if (found === 0) console.log("no hmrbot-installed skills found");
}

export async function cmdSearch(query: string, ctx: Ctx): Promise<void> {
  const reg = await loadRegistry({ source: ctx.registrySource, refresh: ctx.refresh });
  const q = (query ?? "").toLowerCase();
  const hits = reg.skills.filter((s) =>
    `${s.slug} ${s.name} ${s.description} ${s.tags.join(" ")}`.toLowerCase().includes(q),
  );
  if (hits.length === 0) {
    console.log(`no matches for "${query}"`);
    return;
  }
  for (const s of hits) {
    console.log(`\n${s.slug}  ${s.category ? `[${s.category}]` : ""}  ${s.source}`);
    console.log(`  ${s.description.slice(0, 200)}`);
  }
  console.log(`\n${hits.length} result${hits.length === 1 ? "" : "s"}`);
}

export async function cmdRegistry(ctx: Ctx): Promise<void> {
  const reg = await loadRegistry({ source: ctx.registrySource, refresh: ctx.refresh });
  console.log(`${reg.count} skill${reg.count === 1 ? "" : "s"}`);
  const byCat = new Map<string, number>();
  for (const s of reg.skills) byCat.set(s.category ?? "—", (byCat.get(s.category ?? "—") ?? 0) + 1);
  for (const [cat, n] of [...byCat].sort()) console.log(`  ${cat.padEnd(14)} ${n}`);
}

export async function cmdRemove(slug: string, ctx: Ctx): Promise<void> {
  if (!slug) throw new Error("usage: hmrbot skill remove <slug>");
  const target = resolveTarget({ agent: ctx.agent, dir: ctx.dir });
  const destDir = join(target, slug);
  if (!existsSync(destDir)) throw new Error(`not installed at ${destDir}`);
  if (!readMeta(destDir) && !ctx.force) {
    throw new Error(`${destDir} was not installed by hmrbot; pass --force`);
  }
  removeDir(destDir);
  console.log(`✓ removed ${slug}`);
}

export async function cmdUpdate(slug: string | undefined, ctx: Ctx): Promise<void> {
  const reg = await loadRegistry({ source: ctx.registrySource, refresh: true });
  const target = resolveTarget({ agent: ctx.agent, dir: ctx.dir });
  const slugs: string[] = [];

  if (slug) slugs.push(slug);
  else if (existsSync(target)) {
    for (const name of readdirSync(target)) {
      if (readMeta(join(target, name))) slugs.push(name);
    }
  }
  if (slugs.length === 0) {
    console.log("nothing to update");
    return;
  }

  for (const s of slugs) {
    const entry = reg.skills.find((e) => e.slug === s);
    const meta = readMeta(join(target, s));
    if (!entry || !meta) {
      console.log(`- ${s}: skipped (not in registry / no meta)`);
      continue;
    }
    if (entry.version && meta.version && entry.version === meta.version) {
      console.log(`= ${s}: up to date (v${meta.version})`);
      continue;
    }
    await cmdAdd(s, { ...ctx, force: true });
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
