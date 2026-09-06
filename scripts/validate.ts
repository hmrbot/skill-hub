/**
 * pnpm validate  —  the CI gate.
 *
 * Validates every entry under content/skills/ and content/prompts/ and exits
 * non-zero on any error. Warnings are printed but do not fail the build.
 */

import { readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateContentDir } from "@hmrbot/hub-schema";
import type { Section } from "@hmrbot/hub-taxonomy";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const SECTIONS: Section[] = ["skill", "prompt"];

function dirs(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((n) => !n.startsWith("_") && !n.startsWith("."))
    .map((n) => join(root, n))
    .filter((p) => {
      try {
        return statSync(p).isDirectory();
      } catch {
        return false;
      }
    });
}

let errorCount = 0;
let warningCount = 0;
let total = 0;

for (const section of SECTIONS) {
  const list = dirs(join(repoRoot, "content", `${section}s`));
  if (list.length === 0) continue;
  console.log(`\n${section}s:`);
  for (const dir of list) {
    total++;
    const res = validateContentDir(dir, section);
    const errs = res.issues.filter((i) => i.level === "error");
    const warns = res.issues.filter((i) => i.level === "warning");
    errorCount += errs.length;
    warningCount += warns.length;

    if (errs.length === 0 && warns.length === 0) {
      console.log(`  ok    ${res.slug}`);
      continue;
    }
    console.log(`  ${errs.length ? "FAIL" : "warn"}  ${res.slug}`);
    for (const e of errs) console.log(`          error:   ${e.message}`);
    for (const w of warns) console.log(`          warning: ${w.message}`);
  }
}

console.log(`\n${total} entr${total === 1 ? "y" : "ies"} · ${errorCount} error(s) · ${warningCount} warning(s)`);

if (total === 0) {
  console.error("no content found under content/skills/ or content/prompts/");
  process.exit(1);
}
process.exit(errorCount > 0 ? 1 : 0);
