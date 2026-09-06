/**
 * Shared taxonomy for the hmrbot Hub.
 *
 * One list, imported by the schema validator, the registry build, and (later)
 * the catalog site and the CLI — so skill / prompt / software tags can never
 * drift apart.
 */

export const SECTIONS = ["skill", "prompt", "software"] as const;
export type Section = (typeof SECTIONS)[number];

/** Topic categories. Two axes: this is *topic*; content type is `section`. */
export const CATEGORIES = [
  "prompting",
  "rag",
  "agents",
  "coding",
  "content",
  "seo",
  "data",
  "automation",
  "research",
] as const;
export type Category = (typeof CATEGORIES)[number];

export function isSection(v: string): v is Section {
  return (SECTIONS as readonly string[]).includes(v);
}

export function isCategory(v: string): v is Category {
  return (CATEGORIES as readonly string[]).includes(v);
}

/** Parse the comma-separated `hmrbot.tags` string into a clean array. */
export function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}
