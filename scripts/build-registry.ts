/**
 * pnpm build:registry  —  regenerate registry.json from content/.
 *
 * Fails if any skill has a validation error (a broken skill must never reach
 * the registry). Phase 1: local skills only; federation lands in phase 4.
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRegistry } from "@hmrbot/hub-registry";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const { registry, errors } = buildRegistry(repoRoot);

if (errors.length > 0) {
  console.error("registry build aborted — skills with errors:");
  for (const e of errors) console.error(`  ${e.slug}: ${e.message}`);
  process.exit(1);
}

const out = join(repoRoot, "registry.json");
writeFileSync(out, JSON.stringify(registry, null, 2) + "\n");
console.log(`wrote ${out} — ${registry.count} skill(s)`);
