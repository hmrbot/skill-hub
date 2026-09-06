import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Local skills live in ../content/skills/<slug>/SKILL.md (outside site/).
// This collection is only used to render skill bodies on /skill/<slug>.
// The canonical index + validation is registry.json / `pnpm validate`.
export const collections = {
  skills: defineCollection({
    loader: glob({
      pattern: ["*/SKILL.md", "!_template/**"],
      base: "../content/skills",
      generateId: ({ entry }) => entry.split("/")[0],
    }),
    schema: z.object({
      name: z.string(),
      description: z.string(),
      license: z.string().optional(),
      compatibility: z.string().optional(),
      "allowed-tools": z.string().optional(),
      metadata: z.record(z.string()).optional(),
    }),
  }),
};
