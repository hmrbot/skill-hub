# Contributing a skill

A skill is a folder under `content/skills/` containing a `SKILL.md` file, in the
[`agentskills.io`](https://agentskills.io/specification) format.

## Steps

1. **Scaffold**

   ```bash
   pnpm new:skill <slug>
   ```

   `<slug>`: lowercase letters, digits, single hyphens. This creates
   `content/skills/<slug>/SKILL.md` from the template with `name` pre-filled.

2. **Write `SKILL.md`**

   Frontmatter:

   ```yaml
   ---
   name: <slug>                       # must equal the folder name
   description: >-
     One or two sentences: what it does + when to use it + keywords.
   license: Apache-2.0
   metadata:
     hmrbot.section: skill
     hmrbot.category: <category>       # from packages/taxonomy
     hmrbot.tags: "tag-a, tag-b"
     hmrbot.version: "1.0.0"
     hmrbot.locale: fa
     hmrbot.maintainer: hmrbot
   ---
   ```

   Body — house structure:

   ```markdown
   ## When to use
   ## Procedure
   ## Example
   ## Pitfalls
   ## Verification
   ```

3. **Optional supporting files** (one level deep, referenced by relative path):

   - `references/` — detail the agent loads on demand
   - `scripts/` — runnable code
   - `assets/` — templates, data

4. **Validate**

   ```bash
   pnpm validate
   ```

5. **Commit** one skill per commit:

   ```bash
   git add content/skills/<slug>
   git commit -m "add <slug> skill"
   ```

## Rules the validator enforces

| Rule | |
|---|---|
| `name` == folder name | required |
| `name` charset | `^[a-z0-9]+(-[a-z0-9]+)*$`, max 64 |
| `description` | non-empty, max 1024 chars |
| `hmrbot.category` | must exist in `packages/taxonomy` |
| `hmrbot.version` | semver `x.y.z` |
| `SKILL.md` length | under 500 lines |
| body headings | `When to use` + `Procedure` recommended (warning if missing) |

## Versioning

Bump `hmrbot.version` on any content change. `npx hmrbot-hub skill update` compares
this to the installed copy.

## Bytes, not a hub server

There is no backend. The folder in git **is** the registration — `registry.json`
and the catalog site are regenerated from `content/` on every push.
