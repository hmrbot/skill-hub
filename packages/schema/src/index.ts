/**
 * SKILL.md validation for the hmrbot Hub.
 *
 * `agentskills.io` requires only `name` + `description`. The hmrbot layer adds
 * `metadata.hmrbot.*` conventions and a few repo rules (name == folder,
 * category in taxonomy, length cap).
 */

import { readFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { CATEGORIES, SECTIONS, isCategory } from "@hmrbot/hub-taxonomy";

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const MAX_LINES = 500;

/** agentskills.io frontmatter + hmrbot metadata conventions. */
export const skillFrontmatter = z
  .object({
    name: z
      .string()
      .min(1)
      .max(64)
      .regex(SLUG_RE, "lowercase a-z 0-9 with single hyphens only, no leading/trailing hyphen"),
    description: z.string().min(1).max(1024),
    license: z.string().max(200).optional(),
    compatibility: z.string().min(1).max(500).optional(),
    "allowed-tools": z.string().optional(),
    metadata: z
      .object({
        "hmrbot.section": z.enum(SECTIONS).optional(),
        "hmrbot.category": z.string().optional(),
        "hmrbot.tags": z.string().optional(),
        "hmrbot.version": z.string().regex(SEMVER_RE, "must be semver x.y.z").optional(),
        "hmrbot.locale": z.string().optional(),
        "hmrbot.maintainer": z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type SkillFrontmatter = z.infer<typeof skillFrontmatter>;

export interface SkillDoc {
  slug: string;
  frontmatter: SkillFrontmatter;
  body: string;
}

export interface ValidationIssue {
  level: "error" | "warning";
  message: string;
}

export interface ValidationResult {
  slug: string;
  ok: boolean;
  issues: ValidationIssue[];
  doc?: SkillDoc;
}

/**
 * Validate one skill directory. Returns issues rather than throwing so a caller
 * can report every problem across every skill in one pass.
 */
export function validateSkillDir(dir: string): ValidationResult {
  const slug = basename(dir);
  const issues: ValidationIssue[] = [];
  const err = (message: string) => issues.push({ level: "error", message });
  const warn = (message: string) => issues.push({ level: "warning", message });

  const skillPath = join(dir, "SKILL.md");
  if (!existsSync(skillPath)) {
    err(`missing SKILL.md`);
    return { slug, ok: false, issues };
  }

  const raw = readFileSync(skillPath, "utf8");
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (e) {
    err(`unparseable frontmatter: ${(e as Error).message}`);
    return { slug, ok: false, issues };
  }

  const fm = skillFrontmatter.safeParse(parsed.data);
  if (!fm.success) {
    for (const issue of fm.error.issues) {
      err(`frontmatter ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    return { slug, ok: false, issues };
  }

  const frontmatter = fm.data;

  if (frontmatter.name !== slug) {
    err(`name "${frontmatter.name}" must equal the folder name "${slug}"`);
  }

  const category = frontmatter.metadata?.["hmrbot.category"];
  if (category !== undefined && !isCategory(category)) {
    err(`hmrbot.category "${category}" is not in the taxonomy (${CATEGORIES.join(", ")})`);
  }

  const section = frontmatter.metadata?.["hmrbot.section"];
  if (section !== undefined && section !== "skill") {
    warn(`hmrbot.section is "${section}" for a file under content/skills/`);
  }

  const lineCount = parsed.content.split("\n").length;
  if (lineCount > MAX_LINES) {
    err(`SKILL.md body is ${lineCount} lines (max ${MAX_LINES}); move detail into references/`);
  }

  const body = parsed.content;
  if (!/^##\s+.*(when to use|چه وقت)/im.test(body)) {
    warn(`no "When to use" / "چه وقت استفاده شود" heading found`);
  }
  if (!/^##\s+.*(procedure|steps|روش)/im.test(body)) {
    warn(`no "Procedure" / "روش" heading found`);
  }

  return {
    slug,
    ok: issues.every((i) => i.level !== "error"),
    issues,
    doc: { slug, frontmatter, body },
  };
}
