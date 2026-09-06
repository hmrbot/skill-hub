/**
 * pnpm new:skill <slug>   /   pnpm new:prompt <slug>
 *
 * Scaffolds content/<section>s/<slug>/ from the template with `name` pre-filled.
 */

import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SLUG_RE } from "@hmrbot/hub-schema";
import { SECTION_FILE } from "@hmrbot/hub-schema";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const section = process.argv[2] as "skill" | "prompt" | "software";
const slug = process.argv[3];

if (!["skill", "prompt", "software"].includes(section)) {
  console.error("usage: pnpm new:skill <slug>  |  pnpm new:prompt <slug>");
  process.exit(1);
}
if (!slug) {
  console.error(`usage: pnpm new:${section} <slug>`);
  process.exit(1);
}
if (!SLUG_RE.test(slug) || slug.length > 64) {
  console.error(`invalid slug "${slug}" — lowercase a-z 0-9 with single hyphens, max 64`);
  process.exit(1);
}

const file = SECTION_FILE[section];
const dest = join(repoRoot, "content", `${section}s`, slug);
if (existsSync(dest)) {
  console.error(`content/${section}s/${slug} already exists`);
  process.exit(1);
}

const template = join(repoRoot, "content", `${section}s`, "_template");
if (!existsSync(template)) {
  console.error(`missing template: content/${section}s/_template/`);
  process.exit(1);
}
cpSync(template, dest, { recursive: true });

const md = join(dest, file);
writeFileSync(md, readFileSync(md, "utf8").replace(/^name:\s.*$/m, `name: ${slug}`));

console.log(`created content/${section}s/${slug}/${file}`);
console.log(`next: edit it, then run  pnpm validate`);
