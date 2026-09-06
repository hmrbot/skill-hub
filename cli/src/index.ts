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

const VERSION = "0.1.1";

const HELP = `hmrbot — install agent skills & prompts from the hmrbot Hub (hub.hmrbot.com)

usage:
  npx hmrbot-hub skill  add <slug> [options]     install a skill
  npx hmrbot-hub prompt add <slug> [options]     install a prompt
  npx hmrbot-hub <skill|prompt> remove <slug>    uninstall
  npx hmrbot-hub <skill|prompt> update [<slug>]  update one, or all installed
  npx hmrbot-hub <skill|prompt> search <query>   search the catalog
  npx hmrbot-hub <skill|prompt> list             list installed
  npx hmrbot-hub registry                        catalog summary
  npx hmrbot-hub open [skill|prompt|software]    open the catalog in a browser

  (the section word is optional for search/list/registry/update — omit to span both)

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

  // `<section> <verb> …` or a bare top-level command
  let section: "skill" | "prompt" | undefined;
  let [a, b] = positionals;
  if (a === "skill" || a === "prompt") {
    section = a;
    [a, b] = [positionals[1], positionals[2]];
  }

  const ctx = {
    section,
    registrySource: values.registry,
    refresh: values.refresh,
    agent: values.agent,
    dir: values.dir,
    force: values.force,
  };

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
