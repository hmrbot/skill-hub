# پلن اجرای hmrbot Hub

> نسخه ۲ — ۶ سپتامبر ۲۰۲۶ (تصمیم‌های ساختار، دامنه و میزبانی قفل شد)
> این پوشه (`D:\.hmr.com\skill-hub`) نسخهٔ کاری محلیِ مخزن `github.com/hmrbot/skill-hub` است.
> متن فارسی؛ همهٔ شناسه‌های فنی به Latin.

---

## ۱. هدف و دامنه

یک **hub** باز با سه بخش که همه یک الگو، یک taxonomy، یک کاتالوگ و یک CLI را به اشتراک می‌گذارند:

| بخش | محتوا | مسیر | فرمت فایل |
|---|---|---|---|
| Skill | agent skillها | `hub.hmrbot.com/skill` | `SKILL.md` (استاندارد `agentskills.io`) |
| Prompt | پرامپت‌های آماده | `hub.hmrbot.com/prompt` | `PROMPT.md` (فاز ۵) |
| Software | دایرکتوری نرم‌افزار | `hub.hmrbot.com/software` | `ENTRY.md` (فاز بعد) |

سه لایه در هر بخش:

1. **مخزن** — محتوا به‌صورت فولدرهای Markdown در git. بدون دیتابیس. منبع حقیقت = خودِ فایل‌ها.
2. **کاتالوگ وب** — سایت static قابل‌مرور/جست‌وجو، ساخته‌شده از همان فایل‌ها در زمان build.
3. **نصب‌کننده** — `npx hmrbot skill add …` / `npx hmrbot prompt add …` (software فقط مرور).

به‌علاوه **federation**: نمایش و نصب skillهای مخازن دیگر (Anthropic, Microsoft, OpenAI, …) **بدون کپی** — همیشه از upstream و به‌روز.

**زبان محتوا:** فارسی. اسکریپت‌ها، frontmatter keys، دستورها: Latin.

**فاز ۱ فقط Skill است.** Prompt و Software همین الگو را در فازهای بعد می‌گیرند.

---

## ۲. تصمیم‌های قفل‌شده

| مورد | تصمیم | دلیل |
|---|---|---|
| ساختار git | **monorepo واحد** `github.com/hmrbot/skill-hub` | بخش ۲.۱ |
| package manager | pnpm workspace (هم‌راستا با `site-emd-blog`) | یکدستی، ابزار مشترک |
| دامنه | `hub.hmrbot.com` با مسیر (`/skill`, `/prompt`, `/software`) | تصمیم کاربر |
| میزبانی کاتالوگ | **GitHub Pages** (رایگان) | بخش ۲.۲ |
| فرمت skill | `SKILL.md` استاندارد `agentskills.io` | تعامل‌پذیری با Claude Code / Hermes / Codex |
| ذخیرهٔ محتوا | فایل در git — بدون دیتابیس، بدون بک‌اند | نسخه‌بندی رایگان، صفر عملیات |
| کاتالوگ | Astro static — الگو از `microsoft/skills/docs-site` | |
| CLI | پکیج `hmrbot` روی npm (fallback: `@hmrbot/cli`) | زیرفرمان برای هر بخش |
| مخازن خارجی | federation زنده، نه کپی | همیشه به‌روز |
| License | فقط OSI-permissive (MIT / Apache-2.0)، skill‑به‑skill | بخش ۱۲ |
| `site-hub` فعلی | فعلاً می‌ماند؛ بعد از تکمیل و تست این hub بازنشسته می‌شود | تصمیم کاربر |

### ۲.۱ چرا monorepo (نه چند مخزن جدا)

- **استاندارد اکوسیستم.** `anthropics/skills` و `microsoft/skills` هر دو monorepo هستند. `microsoft/skills` — که الگوی توست — skill + prompt + agent + سایت کاتالوگ + `.claude-plugin` را همه در **یک مخزن** دارد. دقیقاً همان چیزی که تو می‌سازی.
- **مقیاس مسئله نیست.** محتوا Markdown کوچک است؛ ۱۰٬۰۰۰ skill ≈ ۵۰ مگابایت. سقف نرم مخزن گیت‌هاب ~۵ گیگ است. برای این کاربرد دهه‌ها جا هست.
- **بدون محدودیت برای این طرح.** GitHub Pages «یک سایت به‌ازای هر مخزن» می‌دهد — و تو دقیقاً یک سایت می‌خواهی (`hub.hmrbot.com` که همه‌چیز را با مسیر سرو کند). monorepo ↔ یک سایت، انطباق کامل.
- **ارتقاپذیری.** taxonomy و schema مشترک بین skill/prompt/software در `packages/` یک‌بار تعریف می‌شود؛ تغییر هماهنگ بین بخش‌ها در یک commit؛ یک CI؛ یک deploy؛ یک نسخهٔ CLI که همهٔ بخش‌ها را می‌شناسد.
- **CLI بدون دردسر.** در monorepo، پوشهٔ `cli/` یک workspace package است که مستقل به npm publish می‌شود — روش استاندارد (همان کاری که هزاران monorepo می‌کنند).
- **کِی monorepo بد می‌شود:** وقتی بخش‌ها مالک، چرخهٔ انتشار و کنترل دسترسی جدا دارند. مورد تو نیست (یک نفر، یک hub).

### ۲.۲ چرا GitHub Pages

- رایگان، صفر تنظیم زیرساخت، HTTPS خودکار برای دامنهٔ سفارشی.
- محدودیت‌ها: حجم سایت ۱ گیگ، پهنای‌باند نرم ۱۰۰ گیگ/ماه، ۱۰ build در ساعت. برای یک کاتالوگ static هیچ‌کدام به تو نمی‌خورد.
- `hub.hmrbot.com` روی Pages پشتیبانی می‌شود (بخش ۹).
- **تنها قید:** Pages صرفاً static است — نه Worker، نه Function. طرح فعلی (جست‌وجو/فیلتر سمت‌کلاینت، صفر بک‌اند) با این کاملاً می‌خواند. اگر روزی `/software` به API یا فرم submission نیاز داشت → همان خروجی `dist/` را بی هیچ تغییری روی **Cloudflare Pages + Functions** ببر. مهاجرت = صفر تغییر در مخزن.

### ۲.۳ تنها تصمیم باز

- [ ] **claim کردن نام npm.** اول `hmrbot` (بدون scope) را امتحان کن؛ اگر گرفته شده `@hmrbot/cli`. تا قبل از فاز ۳ لازم است.

---

## ۳. معماری

```
                        ┌──────────────────────────────────────┐
 نویسنده ── git push ───▶│ github.com/hmrbot/skill-hub   (monorepo)    │
                        │  content/skills/<slug>/SKILL.md       │ ← منبع حقیقت
                        │  content/prompts/  content/software/  │
                        │  sources.yaml                         │ ← فهرست federation
                        │  registry.json  (خروجی build)          │ ← index تولیدشده
                        └──────┬───────────────────┬────────────┘
                               │ CI                │ CI
                    ┌──────────▼───────┐  ┌────────▼────────────────────┐
                    │ validate         │  │ @hmrbot/hub-registry         │
                    │ skills-ref +     │  │  اسکن content/ (gray-matter) │
                    │ چک‌های سفارشی      │  │  + fetch metadata فدرال      │
                    └──────────────────┘  │  + فیلتر license             │
                                          └────────┬────────────────────┘
                                                   │ build + deploy
                                       ┌───────────▼─────────────┐
                                       │ کاتالوگ Astro (static)   │  hub.hmrbot.com
                                       │  /  /skill  /prompt      │  (GitHub Pages)
                                       │  /software  /registry.json│
                                       └─────────────────────────┘

 کاربر ── npx hmrbot skill add <slug> ──▶ CLI (پکیج npm: hmrbot)
              │ registry.json را می‌گیرد → resolve → source
              │ فولدر SKILL.md را دانلود می‌کند
              │   بومی → raw hmrbot/skill-hub    ·    فدرال → upstream repo
              ▼ کپی به  .claude/skills/  |  ~/.hermes/skills/  |  .agents/skills/
                + .hmrbot-meta.json برای update
```

هیچ محتوایی از مخازن فدرال داخل `hmrbot/skill-hub` ذخیره نمی‌شود — فقط `name`, `description`, `license`, لینک upstream در `registry.json`.

---

## ۴. ساختار مخزن `hmrbot/skill-hub`

```
hmrbot/skill-hub/                          → D:\.hmr.com\skill-hub
├── pnpm-workspace.yaml
├── package.json                     # root، private، اسکریپت‌های سطح‌بالا
├── LICENSE                          # Apache-2.0 (محتوای بومی)
├── README.md                        # روش افزودن محتوا + روش نصب
├── sources.yaml                     # منابع federation
├── registry.json                    # خروجی build — دستی ویرایش نشود
│
├── content/
│   ├── skills/
│   │   ├── _template/SKILL.md
│   │   └── <slug>/
│   │       ├── SKILL.md
│   │       ├── references/          # اختیاری
│   │       ├── scripts/             # اختیاری
│   │       └── assets/              # اختیاری
│   ├── prompts/                     # فاز ۵ — <slug>/PROMPT.md
│   └── software/                    # فاز بعد — <slug>/ENTRY.md
│
├── packages/
│   ├── schema/                      # @hmrbot/hub-schema — Zod schema برای SKILL/PROMPT/ENTRY
│   ├── taxonomy/                    # @hmrbot/hub-taxonomy — دسته‌ها و تگ‌ها (مشترک site + cli + schema)
│   └── registry/                    # @hmrbot/hub-registry — منطق build: اسکن content/ + federation + فیلتر license → registry.json
│
├── site/                            # @hmrbot/hub-site (private) — Astro، خروجی به hub.hmrbot.com
│   ├── package.json
│   ├── astro.config.mjs             # site: 'https://hub.hmrbot.com'  (بدون base)
│   ├── public/
│   │   └── CNAME                    # محتوا: hub.hmrbot.com   (برای GitHub Pages)
│   └── src/
│       ├── pages/
│       │   ├── index.astro          # صفحهٔ اصلی hub (سه کارت بخش)
│       │   ├── skill/index.astro    ·  skill/[slug].astro
│       │   ├── prompt/index.astro   ·  prompt/[slug].astro     (فاز ۵)
│       │   ├── software/index.astro ·  software/[slug].astro   (فاز بعد)
│       │   ├── registry.json.ts     # سرو registry.json
│       │   ├── llms.txt.ts  ·  llms-full.txt.ts
│       │   └── sitemap.xml.ts
│       ├── components/
│       ├── layouts/
│       └── styles/tokens.css        # رنگ/فونت hmrbot — نه توکن‌های microsoft
│
├── cli/                             # پکیج npm: hmrbot  (bin: { "hmrbot": "dist/index.js" })
│   ├── package.json
│   ├── tsup.config.ts
│   └── src/
│       ├── index.ts                 # arg parsing + زیرفرمان‌ها (skill / prompt / …)
│       ├── registry.ts              # گرفتن/کش registry.json
│       ├── resolve.ts               # slug → source → URL
│       ├── install.ts               # download فولدر + copy + meta
│       └── agents.ts                # تشخیص مقصد (claude / hermes / codex / opencode)
│
├── .claude-plugin/
│   └── marketplace.json             # تا Claude Code marketplace هم باشد
│
└── .github/workflows/
    ├── validate.yml                 # روی PR — skills-ref + چک‌های سفارشی
    ├── build-deploy.yml             # روی push به main — registry + کاتالوگ → GitHub Pages ؛ publish cli اگر نسخه عوض شد
    └── federation-sync.yml          # cron روزانه — تازه‌سازی metadata فدرال
```

---

## ۵. قرارداد `SKILL.md`

### frontmatter

```yaml
---
name: rag-basics                    # = نام فولدر ؛ فقط a-z 0-9 و «-» ؛ ≤۶۴ ؛ بدون -- و بدون - اول/آخر
description: >-
  توضیح می‌دهد retrieval-augmented generation چیست و چطور یک pipeline پایه بسازیم.
  وقتی کاربر از RAG، جست‌وجوی معنایی، یا grounding مدل با دادهٔ خودش می‌پرسد استفاده شود.
license: Apache-2.0
metadata:
  hmrbot.section: skill
  hmrbot.category: rag              # از @hmrbot/hub-taxonomy
  hmrbot.tags: "rag, embeddings, persian"
  hmrbot.version: "1.0.0"           # semver ؛ با هر تغییر محتوایی بالا برود
  hmrbot.locale: fa
  hmrbot.maintainer: hmrbot
---
```

`name` و `description` تنها فیلدهای اجباریِ استاندارد‌اند؛ بقیه در `metadata` (نقشهٔ string→string). `description` مهم‌ترین فیلد است — agent فقط با همین تصمیم می‌گیرد skill را باز کند: «چه می‌کند + چه وقت» + کلیدواژه.

### بدنه (قالب استاندارد hmrbot)

```markdown
## چه وقت استفاده شود
## روش
## مثال
## خطاهای رایج
## بررسی نتیجه
```

### قواعد

- `SKILL.md` زیر ۵۰۰ خط / ~۵٬۰۰۰ توکن. جزئیات سنگین → `references/REFERENCE.md`.
- ارجاع داخلی با مسیر نسبی، یک سطح عمق.
- `hmrbot.category` باید در `@hmrbot/hub-taxonomy` باشد؛ دسته‌های اولیه: `prompting`, `rag`, `agents`, `coding`, `content`, `seo`, `data`, `automation`, `research`.
- هر تغییر محتوایی → `hmrbot.version` بالا برود (CLIِ `update` به همین نگاه می‌کند).
- `content/skills/_template/` را کپی کن، اسمش را عوض کن، پرش کن.

---

## ۶. `sources.yaml` — federation

```yaml
version: 1
sections:
  skill:
    sources:
      - id: hmrbot
        type: local
        path: content/skills/

      - id: anthropic
        type: github
        repo: anthropics/skills
        ref: main
        path: skills/
        license_policy: per-skill          # هر skill یک LICENSE.txt جدا
        license_allow: [Apache-2.0, MIT]
        exclude: [pdf, docx, pptx, xlsx]    # © All rights reserved — ممنوع

      - id: microsoft
        type: github
        repo: microsoft/skills
        ref: main
        path: .github/skills/
        license_policy: repo               # کل مخزن MIT
        license: MIT

      - id: openai
        type: github
        repo: openai/codex
        ref: main
        path: ""                            # مسیر skillها باید تأیید شود
        license_policy: per-skill
        license_allow: [Apache-2.0, MIT]
        enabled: false
```

رفتار `@hmrbot/hub-registry` برای هر source خارجی:

1. درخت repo را via GitHub API می‌گیرد، فولدرهای حاوی `SKILL.md` را می‌یابد.
2. `name`, `description` از frontmatter؛ `license` از `LICENSE.txt` همان فولدر یا `LICENSE` ریشه.
3. اگر `license` در `license_allow` نبود یا در `exclude` بود → **رد**، در لاگ.
4. رکورد `registry.json`: `{ slug, section, name, description, category?, tags?, source, license, upstream_url, install }`.
5. **هیچ فایلی دانلود/ذخیره نمی‌شود** — فقط metadata.

---

## ۷. کاتالوگ وب (`site/`)

- **Astro static.** الگو از `microsoft/skills/docs-site` (Astro + `gray-matter` + prebuild). همهٔ توکن‌های ظاهری و متن‌ها با نسخهٔ hmrbot جایگزین؛ Azure-specificها حذف.
- `packages/registry` قبل از `astro build` اجرا می‌شود → `registry.json` در ریشه.
- `astro.config.mjs`: `site: 'https://hub.hmrbot.com'`، **بدون `base`** (چون روی root subdomain سرو می‌شود).
- صفحات:
  - `/` — صفحهٔ اصلی hub: سه کارت (Skill / Prompt / Software) + جست‌وجوی سراسری.
  - `/skill` — گرید کارت skillها + فیلتر **سمت‌کلاینت** (دسته، منبع، تگ) روی `registry.json`.
  - `/skill/<slug>` — رندر `SKILL.md` بومی؛ فدرال‌ها: description + «مشاهده در `<repo>`» + دستور نصب.
  - `/prompt`, `/prompt/<slug>` — فاز ۵.
  - `/software`, `/software/<slug>` — فاز بعد.
  - `/registry.json` — برای مصرف CLI.
  - `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`.
- RTL فارسی؛ رنگ/فونت `site/src/styles/tokens.css`.
- هر کارت skill: نام، `description`، دستهٔ رنگی، **badge منبع**، **badge license**، دکمهٔ کپی برای `npx hmrbot skill add <slug>`.

---

## ۸. `npx hmrbot` — CLI

پکیج npm: `hmrbot` (fallback `@hmrbot/cli`). bin: `hmrbot`. Node ≥ ۲۰، TypeScript، build با `tsup`. بدون وابستگی سنگین.

### دستورها

```bash
npx hmrbot skill add <slug> [--agent claude|hermes|codex|opencode] [--dir <path>] [--force]
npx hmrbot skill search <query>
npx hmrbot skill list                     # نصب‌شده‌های محلی
npx hmrbot skill update [<slug> | --all]
npx hmrbot skill remove <slug>
npx hmrbot prompt add <slug> [...]        # فاز ۵ — کپی PROMPT.md به پروژه
npx hmrbot registry [--refresh]           # نمایش/تازه‌سازی کش
npx hmrbot open [skill|prompt|software]    # باز کردن کاتالوگ در مرورگر
```

`skill add <slug>`:

1. `registry.json` را از `https://hub.hmrbot.com/registry.json` می‌گیرد (کش `~/.cache/hmrbot/`، TTL ۶ ساعت؛ `--refresh` اجباری).
2. `<slug>` را resolve → `source` و `upstream_url`.
3. **کل فولدر** skill را دانلود:
   - `source: hmrbot` → `raw.githubusercontent.com/hmrbot/skill-hub/main/content/skills/<slug>/…`
   - فدرال → از `upstream_url`.
4. مقصد: `--dir` صریح → `--agent` → auto-detect (`.claude/` → `.claude/skills/` ؛ `~/.hermes/` → `~/.hermes/skills/` ؛ وگرنه `.agents/skills/`).
5. کپی + `<slug>/.hmrbot-meta.json`: `{ section, source, version, upstream_url, installed_at, dest }`.
6. skill موجودِ بدون `.hmrbot-meta.json` → بدون `--force` رد.

`skill update`: `hmrbot.version` رکورد registry با `.hmrbot-meta.json` مقایسه؛ skill دستی‌ویرایش‌شده (hash عوض‌شده) بدون `--force` رد.

**سازگاری رو به عقب:** بعداً یک پکیج نازک `@hmrbot/skills` منتشر کن که فقط `hmrbot skill …` را صدا بزند، تا `npx @hmrbot/skills add …` هم کار کند.

---

## ۹. `hub.hmrbot.com` روی GitHub Pages

1. مخزن `hmrbot/skill-hub` → Settings → Pages → Source: **GitHub Actions**.
2. `site/public/CNAME` با محتوای `hub.hmrbot.com` (Astro پوشهٔ `public/` را به `dist/` کپی می‌کند).
3. در **Cloudflare DNS** (که nameserverهای `hmrbot.com` را دارد): رکورد
   `CNAME   hub   →   hmrbot.github.io`   — حالت **Proxied** (ابر نارنجی؛ caching و analytics رایگان). اگر گواهی گیر کرد، موقتاً DNS-only کن تا GitHub گواهی بدهد، بعد Proxied.
4. در **GitHub → org `hmrbot` → Settings → Pages → "Verified domains"**: `hmrbot.com` را verify کن (رکورد `TXT` که می‌دهد) — جلوی takeover زیردامنه را می‌گیرد.
5. GitHub خودکار برای `hub.hmrbot.com` گواهی HTTPS صادر می‌کند.
6. Cloudflare → SSL/TLS mode: **Full**.

**توزیع‌های موازی (بدون کد اضافه):**
- `npx skills add hmrbot/skill-hub` — نصب‌کنندهٔ عمومی community.
- Claude Code marketplace: `/plugin marketplace add hmrbot/skill-hub` (نیازمند `.claude-plugin/marketplace.json`).
- Hermes tap: `hermes skills tap add hmrbot/skill-hub`.

---

## ۱۰. CI/CD

### `validate.yml` (روی هر PR)

```yaml
- pip install skills-ref
- skills-ref validate content/skills/*/
- چک سفارشی: name == نام فولدر ؛ frontmatter معتبر ؛ ≤500 خط ؛ لینک نسبی یک‌سطحی ؛
  hmrbot.category در taxonomy ؛ hmrbot.version معتبر (semver)
- (فاز ۵) همین برای content/prompts/*
```

### `build-deploy.yml` (روی push به `main`)

```yaml
- pnpm -F @hmrbot/hub-registry build         # → registry.json  (commit اگر تغییر کرد)
- pnpm -F @hmrbot/hub-site build              # کاتالوگ Astro → site/dist
- actions/deploy-pages@v4  (from site/dist)   # → hub.hmrbot.com
- اگر cli/package.json نسخه‌اش عوض شد:
    pnpm -F hmrbot build && (cd cli && npm publish --provenance --access public)
```

### `federation-sync.yml` (cron روزانه، `0 3 * * *`)

```yaml
- pnpm -F @hmrbot/hub-registry build --federation-only
- git commit registry.json  (اگر diff بود)
- خلاصه: چند skill جدید، چند به‌خاطر license رد شد، چند slug مرده
```

---

## ۱۱. License و انطباق

- **محتوای بومی hmrbot:** `LICENSE` = Apache-2.0 در ریشه. هر skill بومی نیازی به `LICENSE.txt` جدا ندارد.
- **federation = فقط index (name/description/link).** redistribution نیست؛ برای هر محتوای عمومی مجاز است.
- **`anthropics/skills`:** هر skill `LICENSE.txt` مستقل. build فقط `Apache-2.0`/`MIT`. `pdf`, `docx`, `pptx`, `xlsx` صریحاً exclude (متن license: کپی/extract/derivative/distribute ممنوع).
- **`microsoft/skills`:** کل مخزن MIT — همه‌چیز مجاز با attribution.
- **در کاتالوگ:** روی هر کارت فدرال، badge license + «source: `<repo>`» + لینک به upstream.
- **trademark:** نام/لوگوی Microsoft/Anthropic/OpenAI به‌عنوان برند hub به کار نرود؛ hub «رسمی <X>» جا زده نشود؛ ارجاع اسمی مجاز.
- **پیش‌فرض:** license مبهم → **رد**. skill مشکوک → فقط لینک، حتی fetch هم نه.

> این مشاورهٔ حقوقی نیست؛ چارچوب عملی است.

---

## ۱۲. فازبندی

### فاز ۰ — راه‌اندازی  ✅ (۲۰۲۶-۰۹-۰۶)

1. ~~مخزن `hmrbot/skill-hub` روی GitHub~~ — کد آماده و commit شد؛ ساخت repo + push منتظر احراز هویت `hmrbot` است.
2. ✅ `git init` در `D:\.hmr.com\skill-hub` (branch `main`، commit `0bb2da5`).
3. ✅ `pnpm-workspace.yaml` + ساختار بخش ۴ + `LICENSE` + `README.md` + `CONTRIBUTING.md` + `.gitattributes` + `tsconfig.json`.
4. ✅ `sources.yaml` (فقط `hmrbot` فعال؛ بقیه `enabled: false` تا فاز ۴).
5. ⬜ claim نام npm (`hmrbot` یا `@hmrbot/cli`) — قبل از فاز ۳.
6. ✅ `content/skills/_template/SKILL.md` + اسکریپت `pnpm new:skill <slug>`.
7. ⬜ اولین push (بعد از احراز هویت `hmrbot`).

### فاز ۱ — مخزن Skill + validation  ✅ (۲۰۲۶-۰۹-۰۶)

1. ✅ قرارداد `SKILL.md` (بخش ۵) پیاده شد در `packages/schema` (Zod).
2. ✅ `packages/taxonomy` + `packages/schema` + `packages/registry`.
3. ✅ سه skill بومی واقعی فارسی: `rag-basics`, `persian-prompt-structure`, `agent-skill-authoring`.
4. ✅ `.github/workflows/validate.yml` (قواعد hmrbot + `skills-ref` informational + چک stale بودن `registry.json`).
5. ✅ تست‌شده: `pnpm validate` روی skill با `name` غلط، exit 1 می‌دهد.
6. ✅ `pnpm build:registry` → `registry.json` (۳ skill).
7. ✅ `.claude-plugin/marketplace.json` (پایه).

**باقی‌مانده‌ی فاز ۱:** فقط push بعد از احراز هویت.

### فاز ۲ — کاتالوگ وب  ✅ محلی (۲۰۲۶-۰۹-۰۶) — commit `68898c2`

1. ✅ `site/` — Astro static، RTL فارسی، Vazirmatn (self-hosted via `@fontsource-variable`). طراحی/توکن‌های hmrbot، نه microsoft.
2. ✅ سایت `registry.json` کامیت‌شده را می‌خواند؛ content collection فقط برای رندر بدنهٔ `SKILL.md` در صفحهٔ جزئیات.
3. ✅ صفحات: `/`، `/skill`، `/skill/[slug]`، `/registry.json`، `/llms.txt`، `/sitemap.xml`.
4. ✅ جست‌وجو/فیلتر سمت‌کلاینت (search, category, source, tag, sort) — وانیلا JS.
5. ✅ `site/public/CNAME` + `.github/workflows/build-deploy.yml` (validate → build → deploy Pages).
   ⬜ فعال‌سازی سمت GitHub: Settings → Pages → Source: GitHub Actions (نیاز به احراز هویت `hmrbot`).
6. ⬜ public کردن مخزن (بعد از فعال‌شدن Pages و تست).

**تست‌شده محلی:** `pnpm validate` + `build:registry` + site build همه سبز؛ `astro preview` — `/`، `/skill`، `/skill/rag-basics` درست رندر می‌شوند.

**registry.json حالا قطعی (deterministic) است** (بدون `generated_at`) تا CI بتواند stale بودنش را چک کند.

**باقی‌ماندهٔ فاز ۲:** push + فعال‌سازی Pages در تنظیمات GitHub + سوییچ CNAME به Proxied (بخش ۹) + public کردن مخزن.

### فاز ۳ — CLI `npx hmrbot` (~۳–۵ روز)

1. `cli/` — `skill add|search|list|update|remove`, `registry`, `open`.
2. تشخیص agent + مقصد + `.hmrbot-meta.json`.
3. publish به npm؛ تست `npx hmrbot skill add rag-basics` روی کانتینر تمیز.
4. `.claude-plugin/marketplace.json`.

### فاز ۴ — federation (~۳–۵ روز)

1. `packages/registry` را گسترش بده: fetch از GitHub API (`microsoft` اول، بعد `anthropic` با فیلتر per-skill).
2. منطق فیلتر license + لاگ رد‌شده‌ها.
3. `federation-sync.yml` (cron).
4. کارت‌های فدرال در کاتالوگ با badge منبع/license.
5. `skill add` برای slugهای فدرال از upstream دانلود کند.

### فاز ۵ — Prompt + تثبیت (~۳–۵ روز)

1. `content/prompts/<slug>/PROMPT.md` با همان الگو؛ schema و taxonomy مشترک.
2. `/prompt`, `/prompt/[slug]` در کاتالوگ (تب دوم).
3. `npx hmrbot prompt add <slug>`.
4. `tests/scenarios/<slug>/` برای skillهای بومی.

### فاز ۶ — Software Directory (بعداً)

1. `content/software/<slug>/ENTRY.md` (نام، توضیح، لینک، دسته، پلتفرم، قیمت‌گذاری).
2. `/software`, `/software/[slug]` — فقط مرور، بدون نصب.
3. اگر submission لازم شد → مهاجرت کاتالوگ به Cloudflare Pages + Functions (بخش ۲.۲).

---

## ۱۳. ریسک‌ها و پاسخ

| ریسک | پاسخ |
|---|---|
| تغییر فرمت `agentskills.io` | pin کردن spec version؛ اتکا به `skills-ref` |
| rate limit گیت‌هاب در `federation-sync` | `GITHUB_TOKEN`؛ کش ETag؛ فقط درختی که `sha` عوض شده |
| license مبهم در مخزن ثالث | پیش‌فرض «رد»؛ گزارش برای بازبینی دستی |
| نام npm گرفته شده | fallback `@hmrbot/cli`؛ همهٔ اسناد جایگزین |
| پهنای‌باند GitHub Pages | اگر رد شد → همان `dist/` روی Cloudflare Pages، صفر تغییر مخزن |
| گواهی HTTPS دامنهٔ سفارشی گیر کند | موقتاً DNS-only، بعد از صدور گواهی Proxied |
| کاتالوگ فدرال سنگین | صفحه‌بندی/lazy؛ `registry.json` را per-section هم منتشر کن |
| skill فدرال حذف/جابه‌جا شود | `skill add` خطای واضح؛ `federation-sync` slug مرده را flag کند |
| دوگانگی با `site-hub` | بعد از فاز ۲ و تست، بازنشستگی `site-hub` |

---

## ۱۴. تعریف «انجام‌شده» (فاز ۱–۴)

- [ ] `npx hmrbot skill add <slug>` یک skill بومی را در Claude Code نصب کند و کار کند.
- [ ] `hub.hmrbot.com/skill` کاتالوگ را نشان دهد؛ جست‌وجو/فیلتر کار کند؛ Lighthouse سبز.
- [ ] PR با skill نامعتبر خودکار رد شود.
- [ ] حداقل یک skill فدرال از `microsoft/skills` در کاتالوگ ظاهر و قابل‌نصب باشد.
- [ ] هیچ skill با license غیرمجاز در `registry.json` نباشد.
- [ ] `README.md` روش افزودن محتوا و روش نصب را کامل توضیح دهد.

---

## ۱۵. اولین اقدام‌ها (چک‌لیست فاز ۰)

1. [ ] مخزن `hmrbot/skill-hub` روی GitHub (private).
2. [ ] `hmrbot` یا `@hmrbot/cli` روی npm claim/رزرو.
3. [ ] در این پوشه: `pnpm-workspace.yaml` + ساختار بخش ۴ + `LICENSE` + `README.md` + `sources.yaml` + `content/skills/_template/`.
4. [ ] `git remote add origin` + اولین commit + push.
5. [ ] نوشتن اولین skill واقعی (`rag-basics`).
6. [ ] در Cloudflare DNS: رکورد `CNAME hub → hmrbot.github.io` (فعلاً می‌تواند بماند تا فاز ۲).
