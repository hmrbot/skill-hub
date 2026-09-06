/**
 * Pure SKILL.md frontmatter schema — no filesystem, safe to import anywhere
 * (Astro content config, the CLI, the browser build).
 */

import { z } from "zod";
import { SECTIONS } from "@hmrbot/hub-taxonomy";

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SEMVER_RE = /^\d+\.\d+\.\d+$/;
export const MAX_LINES = 500;

/** agentskills.io frontmatter + hmrbot `metadata.hmrbot.*` conventions. */
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
