/**
 * pnpm build:registry           — local skills + federation (sources.yaml)
 * pnpm build:registry --local   — first-party only (fast, offline, deterministic)
 *
 * Fails if any first-party skill has a validation error.
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRegistry } from "@hmrbot/hub-registry";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const localOnly = process.argv.includes("--local") || process.argv.includes("--local-only");

const { registry, errors, rejected } = await buildRegistry(repoRoot, {
  federation: !localOnly,
});

if (errors.length > 0) {
  console.error("registry build aborted — first-party skills with errors:");
  for (const e of errors) console.error(`  ${e.slug}: ${e.message}`);
  process.exit(1);
}

if (rejected.length > 0) {
  console.error(`\n${rejected.length} federated skill(s) rejected:`);
  const byReason = new Map<string, number>();
  for (const r of rejected) byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1);
  for (const [reason, n] of [...byReason].sort()) console.error(`  ${n.toString().padStart(4)}  ${reason}`);
}

const out = join(repoRoot, "registry.json");
writeFileSync(out, JSON.stringify(registry, null, 2) + "\n");
const bySource = new Map<string, number>();
for (const s of registry.skills) bySource.set(s.source, (bySource.get(s.source) ?? 0) + 1);
console.log(
  `\nwrote ${out} — ${registry.count} skills (${[...bySource].map(([k, v]) => `${k}:${v}`).join(", ")})`,
);
