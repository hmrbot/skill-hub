---
name: agent-skill-authoring
description: >-
  نوشتن یک SKILL.md استاندارد (فرمت agentskills.io) که agent واقعاً در زمان
  درست فعالش کند: قواعد frontmatter، نوشتن description قابل‌کشف، ساختار بدنه،
  progressive disclosure و فایل‌های references. وقتی کاربر می‌خواهد یک skill
  بسازد یا یک skill که فعال نمی‌شود را درست کند استفاده شود.
  keywords: SKILL.md, agent skill, authoring, agentskills.io, frontmatter.
license: Apache-2.0
metadata:
  hmrbot.section: skill
  hmrbot.category: agents
  hmrbot.tags: "agents, skills, authoring, agentskills"
  hmrbot.version: "1.0.0"
  hmrbot.locale: fa
  hmrbot.maintainer: hmrbot
---

## چه وقت استفاده شود

- کاربر می‌خواهد یک agent skill جدید بسازد.
- یک skill نوشته شده ولی agent هیچ‌وقت فعالش نمی‌کند.
- یک `SKILL.md` بیش از حد بزرگ شده و باید تقسیم شود.

## روش

۱. **یک پوشه، یک `SKILL.md`.**
   ```
   my-skill/
   ├── SKILL.md
   ├── references/   (اختیاری)
   ├── scripts/      (اختیاری)
   └── assets/       (اختیاری)
   ```

۲. **frontmatter** — فقط `name` و `description` اجباری‌اند:
   - `name`: فقط `a-z 0-9 -`، حداکثر ۶۴، بدون `--` و بدون `-` در ابتدا/انتها،
     و **دقیقاً برابر نام پوشه**.
   - `description`: حداکثر ۱۰۲۴ کاراکتر.
   - بقیه (`license`, `metadata`, …) اختیاری. `metadata` نقشهٔ رشته→رشته است؛
     کلیدها را یکتا کن (مثل `hmrbot.category`).

۳. **`description` را برای کشف بنویس، نه برای تبلیغ.** agent در startup فقط
   `name` و `description` هر skill را می‌خواند و *فقط با همین* تصمیم می‌گیرد
   بدنه را باز کند. پس:
   - «چه می‌کند» + «چه وقت استفاده شود» را صریح بگو.
   - کلیدواژه‌هایی بگذار که در درخواست واقعی کاربر می‌آیند (هم فارسی هم انگلیسی).
   - بد: «به پرامپت‌ها کمک می‌کند». خوب: «ساختاردهی prompt فارسی… وقتی کاربر
     می‌خواهد یک prompt بنویسد یا بهتر کند».

۴. **بدنه** — Markdown آزاد. ساختار پیشنهادی:
   `چه وقت استفاده شود` · `روش` · `مثال` · `خطاهای رایج` · `بررسی نتیجه`.

۵. **progressive disclosure.** `SKILL.md` را زیر ۵۰۰ خط / ~۵۰۰۰ توکن نگه دار.
   جزئیات سنگین (جدول‌های بزرگ، مرجع API) → فایل جدا در `references/` که با
   مسیر نسبی و یک سطح عمق ارجاع بده: `references/api.md`. agent این‌ها را فقط
   وقتی لازم شد می‌خواند.

۶. **اعتبارسنجی.**
   ```
   pip install skills-ref
   skills-ref validate ./my-skill
   ```
   در این مخزن: `pnpm new:skill <slug>` بعد `pnpm validate`.

## مثال

کمینه‌ترین `SKILL.md` معتبر:

```markdown
---
name: pdf-forms
description: پر کردن فرم‌های PDF با داده. وقتی کاربر از PDF قابل‌ویرایش یا فرم می‌پرسد.
---

## روش
۱. ...
```

## خطاهای رایج

- **`name` ≠ نام پوشه** → skill بارگذاری نمی‌شود.
- **`description` عمومی** → agent هیچ‌وقت فعالش نمی‌کند حتی اگر بدنه عالی باشد.
- **`SKILL.md` غول‌پیکر** → همهٔ توکن context را اول می‌خورد. جزئیات → `references/`.
- **حروف بزرگ یا `_` در `name`** → خلاف spec.
- **ارجاع تودرتوی عمیق به فایل‌ها** → یک سطح عمق کافی است.
- **نوشتن `metadata` به‌صورت لیست یا آبجکت تودرتو** → باید رشته→رشته باشد.

## بررسی نتیجه

- `skills-ref validate` بدون خطا رد می‌شود؟
- یک درخواست واقعیِ کاربر را تصور کن؛ آیا `description` آن را پوشش می‌دهد؟
- بدنه را به کسی بده که مسئله را بلد نیست؛ آیا می‌تواند طبق آن کار را انجام دهد؟
