import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// First-party content lives in ../content/<section>s/<slug>/<FILE> (outside site/).
// These collections are only used to render bodies on detail pages; the
// canonical index + validation is registry.json / `pnpm validate`.
const frontmatter = z.object({
  name: z.string(),
  description: z.string(),
  license: z.string().optional(),
  compatibility: z.string().optional(),
  "allowed-tools": z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export const collections = {
  skills: defineCollection({
    loader: glob({
      pattern: ["*/SKILL.md", "!_template/**"],
      base: "../content/skills",
      generateId: ({ entry }) => entry.split("/")[0],
    }),
    schema: frontmatter,
  }),
  prompts: defineCollection({
    loader: glob({
      pattern: ["*/PROMPT.md", "!_template/**"],
      base: "../content/prompts",
      generateId: ({ entry }) => entry.split("/")[0],
    }),
    schema: frontmatter,
  }),
};
