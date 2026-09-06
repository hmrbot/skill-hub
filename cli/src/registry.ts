import { mkdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { REGISTRY_URLS, REGISTRY_CACHE, REGISTRY_TTL_MS } from "./config.js";
import type { Registry } from "./types.js";

function readLocal(path: string): Registry {
  const fsPath = path.startsWith("file://") ? fileURLToPath(path) : path;
  return JSON.parse(readFileSync(fsPath, "utf8")) as Registry;
}

async function fetchRemote(url: string): Promise<Registry> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`registry fetch failed: ${res.status} ${url}`);
  return (await res.json()) as Registry;
}

/**
 * Load the registry. Precedence:
 *   1. explicit `source` (--registry / HMRBOT_REGISTRY) — file path, file://, or http(s)
 *   2. fresh cache (< TTL)
 *   3. fetch the default URL, then cache it
 *   4. stale cache, if the fetch failed
 */
export async function loadRegistry(opts: {
  source?: string;
  refresh?: boolean;
}): Promise<Registry> {
  const source = opts.source ?? process.env.HMRBOT_REGISTRY;

  if (source && !/^https?:\/\//.test(source)) {
    return readLocal(source);
  }
  const urls = source ? [source] : REGISTRY_URLS;

  if (!opts.refresh && existsSync(REGISTRY_CACHE)) {
    const age = Date.now() - statSync(REGISTRY_CACHE).mtimeMs;
    if (age < REGISTRY_TTL_MS) return readLocal(REGISTRY_CACHE);
  }

  let lastErr: unknown;
  for (const url of urls) {
    try {
      const reg = await fetchRemote(url);
      mkdirSync(dirname(REGISTRY_CACHE), { recursive: true });
      writeFileSync(REGISTRY_CACHE, JSON.stringify(reg));
      return reg;
    } catch (err) {
      lastErr = err;
    }
  }
  if (existsSync(REGISTRY_CACHE)) {
    process.stderr.write(`! registry fetch failed, using cached copy\n`);
    return readLocal(REGISTRY_CACHE);
  }
  throw lastErr;
}
