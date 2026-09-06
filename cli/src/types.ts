/** Mirror of @hmrbot/hub-registry's shape — kept local so the published
 *  `hmrbot` package has zero runtime dependencies. */

export interface RegistryEntry {
  slug: string;
  section: "skill" | "prompt" | "software";
  name: string;
  description: string;
  category: string | null;
  tags: string[];
  version: string | null;
  locale: string | null;
  source: string;
  license: string | null;
  path: string | null;
  upstream_url: string | null;
  install: string;
}

export interface Registry {
  _note?: string;
  count: number;
  skills: RegistryEntry[];
}

/** Written next to an installed skill so `update` / `remove` know its origin. */
export interface InstalledMeta {
  slug: string;
  section: string;
  source: string;
  version: string | null;
  installed_at: string;
  installed_from: string;
}
