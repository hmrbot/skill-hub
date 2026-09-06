/**
 * SKILL.md validation for the hmrbot Hub.
 *
 * The pure frontmatter schema lives in ./schema (no fs — importable from the
 * Astro config and the browser build). This module adds the filesystem checks:
 * name == folder, category in taxonomy, length cap, recommended headings.
 */

import { readFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import matter from "gray-matter";
import { CATEGORIES, isCategory } from "@hmrbot/hub-taxonomy";
import { skillFrontmatter, MAX_LINES, type SkillFrontmatter } from "./schema.js";

export * from "./schema.js";

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
