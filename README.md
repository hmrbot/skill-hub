# hmrbot Hub

Agent skills, prompts, and a software directory — as plain Markdown folders in
git. No database. The web catalog and the CLI are both generated from these
files.

- **Catalog:** https://hub.hmrbot.com  ·  `/skill`  ·  `/prompt`  ·  `/software`
- **Format:** the open [`agentskills.io`](https://agentskills.io/specification) `SKILL.md` standard
- **Install:** `npx hmrbot skill add <slug>` (from phase 3)

Status: **phase 1** — skill repository + validation. Prompt and software
sections, the catalog site, and the CLI come in later phases. See `PLAN.md`.

---

## Repository layout

```
content/
  skills/<slug>/SKILL.md      # the skills
  skills/_template/           # copy this to start a new skill
packages/
  taxonomy/                   # shared category list
  schema/                     # SKILL.md validation (Zod)
  registry/                   # scan content/ + federation -> registry.json
scripts/
  validate.ts                 # pnpm validate   (runs in CI)
  build-registry.ts           # pnpm build:registry
  new-skill.ts                # pnpm new:skill <slug>
sources.yaml                  # federation config
registry.json                 # GENERATED — do not edit by hand
```

## Add a skill

```bash
pnpm new:skill my-skill-slug
# edit content/skills/my-skill-slug/SKILL.md
pnpm validate
git add content/skills/my-skill-slug && git commit -m "add my-skill-slug skill"
```

Rules (enforced by `pnpm validate` + CI):

- `name` in the frontmatter **must equal the folder name**; lowercase `a-z 0-9 -`
  only, no leading/trailing/`--`, max 64 chars.
- `description` (max 1024): what the skill does **and when to use it**, with
  keywords the agent can match on.
- `metadata.hmrbot.category` must be one of the categories in
  `packages/taxonomy`.
- `SKILL.md` under ~500 lines; move detail into `references/`.

See `content/skills/_template/SKILL.md` and `CONTRIBUTING.md`.

## Local development

```bash
pnpm install
pnpm validate          # validate every skill
pnpm build:registry    # regenerate registry.json
```

## License

- **This repo's own content and code:** Apache-2.0 (`LICENSE`).
- **Federated skills** (phase 4): only shown/indexed, never copied. Each keeps
  its upstream license, shown as a badge in the catalog. Sources whose license
  is not permissive are dropped by the registry build.
