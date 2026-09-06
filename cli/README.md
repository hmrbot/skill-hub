# hmrbot-hub

Install agent skills and prompts from the [hmrbot Hub](https://hub.hmrbot.com).
(The package is `hmrbot-hub`; the installed command is `hmrbot`.)

```bash
npx hmrbot-hub skill add rag-basics
```

## Commands

```
npx hmrbot-hub skill add <slug> [options]    install a skill
npx hmrbot-hub skill remove <slug>           uninstall
npx hmrbot-hub skill update [<slug>]         update one, or all hmrbot-installed skills
npx hmrbot-hub skill search <query>          search the catalog
npx hmrbot-hub skill list                    list installed skills
npx hmrbot-hub registry                      catalog summary
npx hmrbot-hub open [skill|prompt|software]  open the catalog
```

## Options

| flag | |
|---|---|
| `--agent <claude\|hermes\|codex\|opencode\|agents>` | install target (default: auto-detect, else `agents`) |
| `--dir <path>` | explicit install directory |
| `--force` | overwrite a folder not installed by hmrbot |
| `--refresh` | bypass the 6h registry cache |
| `--registry <url\|path>` | use a specific registry |

## Install targets

| agent | path |
|---|---|
| `claude` | `.claude/skills/` |
| `agents` | `.agents/skills/` |
| `hermes` | `~/.hermes/skills/` |
| `codex` | `~/.codex/skills/` |
| `opencode` | `.opencode/skills/` |

Auto-detect looks for `.claude/`, `.agents/`, or `.opencode/` in the current
directory; otherwise it uses `.agents/skills/`.

Each installed skill gets a `.hmrbot-meta.json` recording its source and version
so `update` and `remove` know what they're touching.

## Env

| var | |
|---|---|
| `HMRBOT_REGISTRY` | default registry source |
| `GITHUB_TOKEN` | raise the GitHub API rate limit / reach private sources |

## How it works

The registry (`https://hub.hmrbot.com/registry.json`) is a flat list of skills
built from [`hmrbot/skill-hub`](https://github.com/hmrbot/skill-hub) plus
federated sources. `add` downloads the skill folder from its source repo via the
GitHub Contents API — nothing is proxied through hmrbot.
