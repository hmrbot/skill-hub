/**
 * Content validation for the hmrbot Hub.
 *
 * The pure frontmatter schema lives in ./schema (no fs — importable from the
 * Astro config and the browser build). This module adds the filesystem checks:
 * name == folder, category in taxonomy, length cap, recommended headings.
 *
 * `skill`, `prompt` and `software` share the same frontmatter; only the file
 * name and the recommended body headings differ.
 */

import { readFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import matter from "gray-matter";
import { CATEGORIES, isCategory, type Section } from "@hmrbot/hub-taxonomy";
import { skillFrontmatter, MAX_LINES, type SkillFrontmatter } from "./schema.js";

export * from "./schema.js";

export const SECTION_FILE: Record<Section, string> = {
  skill: "SKILL.md",
  prompt: "PROMPT.md",
  software: "ENTRY.md",
};

const HEADING_HINTS: Record<Section, RegExp[]> = {
  skill: [/^##\s+.*(when to use|چه وقت)/im, /^##\s+.*(procedure|steps|روش)/im],
  prompt: [/^##\s+.*(prompt|پرامپت)/im, /^##\s+.*(use|when|کاربرد|چه وقت)/im],
  software: [],
};

export interface ContentDoc {
  slug: string;
  section: Section;
  frontmatter: SkillFrontmatter;
  body: string;
}

export interface ValidationIssue {
  level: "error" | "warning";
  message: string;
}

export interface ValidationResult {
  slug: string;
  section: Section;
  ok: boolean;
  issues: ValidationIssue[];
  doc?: ContentDoc;
}

/**
 * Validate one content directory. Returns issues rather than throwing so a
 * caller can report every problem across every entry in one pass.
 */
export function validateContentDir(dir: string, section: Section): ValidationResult {
  const slug = basename(dir);
  const file = SECTION_FILE[section];
  const issues: ValidationIssue[] = [];
  const err = (message: string) => issues.push({ level: "error", message });
  const warn = (message: string) => issues.push({ level: "warning", message });

  const filePath = join(dir, file);
  if (!existsSync(filePath)) {
    err(`missing ${file}`);
    return { slug, section, ok: false, issues };
  }

  const raw = readFileSync(filePath, "utf8");
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (e) {
    err(`unparseable frontmatter: ${(e as Error).message}`);
    return { slug, section, ok: false, issues };
  }

  const fm = skillFrontmatter.safeParse(parsed.data);
  if (!fm.success) {
    for (const issue of fm.error.issues) {
      err(`frontmatter ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    return { slug, section, ok: false, issues };
  }

  const frontmatter = fm.data;

  if (frontmatter.name !== slug) {
    err(`name "${frontmatter.name}" must equal the folder name "${slug}"`);
  }

  const category = frontmatter.metadata?.["hmrbot.category"];
  if (category !== undefined && !isCategory(category)) {
    err(`hmrbot.category "${category}" is not in the taxonomy (${CATEGORIES.join(", ")})`);
  }

  const declaredSection = frontmatter.metadata?.["hmrbot.section"];
  if (declaredSection !== undefined && declaredSection !== section) {
    warn(`hmrbot.section is "${declaredSection}" for a file under content/${section}s/`);
  }

  const lineCount = parsed.content.split("\n").length;
  if (lineCount > MAX_LINES) {
    err(`${file} body is ${lineCount} lines (max ${MAX_LINES}); move detail into references/`);
  }

  for (const re of HEADING_HINTS[section]) {
    if (!re.test(parsed.content)) {
      warn(`no heading matching ${re.source} found`);
    }
  }

  return {
    slug,
    section,
    ok: issues.every((i) => i.level !== "error"),
    issues,
    doc: { slug, section, frontmatter, body: parsed.content },
  };
}

/** Back-compat: validate a skill directory. */
export function validateSkillDir(dir: string): ValidationResult {
  return validateContentDir(dir, "skill");
}
