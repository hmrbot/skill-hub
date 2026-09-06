import { parseArgs } from "node:util";
import {
  cmdAdd,
  cmdList,
  cmdSearch,
  cmdRegistry,
  cmdRemove,
  cmdUpdate,
  cmdOpen,
} from "./commands.js";

const VERSION = "0.1.0";

const HELP = `hmrbot — install agent skills from the hmrbot Hub (hub.hmrbot.com)

usage:
  npx hmrbot skill add <slug> [options]     install a skill
  npx hmrbot skill remove <slug>            uninstall a skill
  npx hmrbot skill update [<slug>]          update one, or all hmrbot-installed skills
  npx hmrbot skill search <query>           search the catalog
  npx hmrbot skill list                     list installed skills
  npx hmrbot registry                       show catalog summary
  npx hmrbot open [skill|prompt|software]   open the catalog in a browser

options:
  --agent <claude|hermes|codex|opencode|agents>   install target (default: auto-detect, else "agents")
  --dir <path>                                     explicit install directory
  --force                                          overwrite a non-hmrbot folder
  --refresh                                         bypass the registry cache
  --registry <url|path>                             use a specific registry (or HMRBOT_REGISTRY)
  -h, --help        -v, --version

env:
  HMRBOT_REGISTRY   default registry source
  GITHUB_TOKEN      raise the GitHub API rate limit / access private sources
`;

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      agent: { type: "string" },
      dir: { type: "string" },
      registry: { type: "string" },
      force: { type: "boolean" },
      refresh: { type: "boolean" },
      all: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (values.version) {
    console.log(VERSION);
    return 0;
  }
  if (values.help || positionals.length === 0) {
    console.log(HELP);
    return positionals.length === 0 && !values.help ? 1 : 0;
  }

  const ctx = {
    registrySource: values.registry,
    refresh: values.refresh,
    agent: values.agent,
    dir: values.dir,
    force: values.force,
    all: values.all,
  };

  // `skill <sub>` or a bare top-level command
  let [a, b, c] = positionals;
  if (a === "skill" || a === "prompt") [a, b, c] = [b, c, positionals[3]];

  switch (a) {
    case "add":
      await cmdAdd(b!, ctx);
      return 0;
    case "remove":
    case "rm":
      await cmdRemove(b!, ctx);
      return 0;
    case "update":
    case "up":
      await cmdUpdate(b, ctx);
      return 0;
    case "search":
      await cmdSearch(b!, ctx);
      return 0;
    case "list":
    case "ls":
      await cmdList(ctx);
      return 0;
    case "registry":
      await cmdRegistry(ctx);
      return 0;
    case "open":
      cmdOpen(b);
      return 0;
    default:
      console.error(`unknown command: ${positionals.join(" ")}\n`);
      console.log(HELP);
      return 1;
  }
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    process.stderr.write(`\n✗ ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
