import registryData from "../../../registry.json";
import type { Registry, RegistryEntry } from "@hmrbot/hub-registry";

// The committed root registry.json is built by `pnpm build:registry` (and, from
// phase 4, includes federated sources). CI fails the build if it is stale.
const REGISTRY = registryData as Registry;

export function getRegistry(): Registry {
  return REGISTRY;
}

export function getSkills(): RegistryEntry[] {
  return REGISTRY.skills;
}

export const CATEGORY_LABEL: Record<string, string> = {
  prompting: "پرامپت‌نویسی",
  rag: "RAG",
  agents: "ایجنت",
  coding: "کدنویسی",
  content: "محتوا",
  seo: "سئو",
  data: "داده",
  automation: "اتوماسیون",
  research: "پژوهش",
};

export const SOURCE_LABEL: Record<string, string> = {
  hmrbot: "hmrbot",
  microsoft: "microsoft/skills",
  anthropic: "anthropics/skills",
  openai: "openai/codex",
};

export function githubUrlFor(entry: RegistryEntry): string {
  return (
    entry.upstream_url ??
    `https://github.com/hmrbot/skill-hub/tree/main/content/skills/${entry.slug}`
  );
}

export type { RegistryEntry, Registry };
