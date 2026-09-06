/**
 * pnpm validate  —  the CI gate.
 *
 * Validates every skill under content/skills/ and exits non-zero on any error.
 * Warnings are printed but do not fail the build.
 */

import { readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSkillDir } from "@hmrbot/hub-schema";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = join(repoRoot, "content", "skills");

const dirs = readdirSync(skillsRoot)
  .filter((n) => !n.startsWith("_") && !n.startsWith("."))
  .map((n) => join(skillsRoot, n))
  .filter((p) => {
    try {
      return statSync(p).isDirectory();
    } catch {
      return false;
    }
  });

let errorCount = 0;
let warningCount = 0;

for (const dir of dirs) {
  const res = validateSkillDir(dir);
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

console.log(
  `\n${dirs.length} skill(s) · ${errorCount} error(s) · ${warningCount} warning(s)`,
);

if (dirs.length === 0) {
  console.error("no skills found under content/skills/");
  process.exit(1);
}
process.exit(errorCount > 0 ? 1 : 0);
