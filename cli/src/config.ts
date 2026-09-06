import { homedir } from "node:os";
import { join } from "node:path";

/** Where the registry is published (the catalog site serves it). */
export const DEFAULT_REGISTRY_URL = "https://hub.hmrbot.com/registry.json";

/** The repo that holds first-party (`source: "hmrbot"`) skills. */
export const HOME_REPO = { owner: "hmrbot", repo: "skill-hub", ref: "main" };

export const CACHE_DIR = join(homedir(), ".hmrbot", "cache");
export const REGISTRY_CACHE = join(CACHE_DIR, "registry.json");
export const REGISTRY_TTL_MS = 6 * 60 * 60 * 1000; // 6h

/** Optional GitHub token to raise the 60/hr unauthenticated API limit. */
export const GITHUB_TOKEN =
  process.env.HMRBOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";

/** Install-target presets. Relative paths resolve against cwd. */
export const AGENT_TARGETS: Record<string, string> = {
  claude: ".claude/skills",
  agents: ".agents/skills",
  hermes: join(homedir(), ".hermes", "skills"),
  codex: join(homedir(), ".codex", "skills"),
  opencode: ".opencode/skills",
};

export const DEFAULT_AGENT = "agents";
