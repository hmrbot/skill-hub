import { homedir } from "node:os";
import { join } from "node:path";

/** Where the registry is published (the catalog site serves it), plus a raw
 *  GitHub fallback so the CLI works even if the site is down. */
export const REGISTRY_URLS = [
  "https://hub.hmrbot.com/registry.json",
  "https://raw.githubusercontent.com/hmrbot/skill-hub/main/registry.json",
];

/** The repo that holds first-party (`source: "hmrbot"`) content. */
export const HOME_REPO = { owner: "hmrbot", repo: "skill-hub", ref: "main" };

export const CACHE_DIR = join(homedir(), ".hmrbot", "cache");
export const REGISTRY_CACHE = join(CACHE_DIR, "registry.json");
export const REGISTRY_TTL_MS = 6 * 60 * 60 * 1000; // 6h

/** Optional GitHub token to raise the 60/hr unauthenticated API limit. */
export const GITHUB_TOKEN =
  process.env.HMRBOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";

/** Base dir per agent preset. Section (`skills` / `prompts`) is appended.
 *  Relative paths resolve against cwd. */
export const AGENT_BASES: Record<string, string> = {
  claude: ".claude",
  agents: ".agents",
  hermes: join(homedir(), ".hermes"),
  codex: join(homedir(), ".codex"),
  opencode: ".opencode",
};

export const DEFAULT_AGENT = "agents";
