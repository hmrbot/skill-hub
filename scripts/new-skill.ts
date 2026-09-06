/**
 * pnpm new:skill <slug>  —  scaffold content/skills/<slug>/ from the template
 * with `name` pre-filled.
 */

import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SLUG_RE } from "@hmrbot/hub-schema";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];

if (!slug) {
  console.error("usage: pnpm new:skill <slug>");
  process.exit(1);
}
if (!SLUG_RE.test(slug) || slug.length > 64) {
  console.error(`invalid slug "${slug}" — lowercase a-z 0-9 with single hyphens, max 64`);
  process.exit(1);
}

const dest = join(repoRoot, "content", "skills", slug);
if (existsSync(dest)) {
  console.error(`content/skills/${slug} already exists`);
  process.exit(1);
}

const template = join(repoRoot, "content", "skills", "_template");
cpSync(template, dest, { recursive: true });

const skillMd = join(dest, "SKILL.md");
const filled = readFileSync(skillMd, "utf8").replace(/^name:\s.*$/m, `name: ${slug}`);
writeFileSync(skillMd, filled);

console.log(`created content/skills/${slug}/SKILL.md`);
console.log(`next: edit it, then run  pnpm validate`);
