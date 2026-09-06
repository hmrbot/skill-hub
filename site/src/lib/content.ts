import registryData from "../../../registry.json";
import type { Registry, RegistryEntry } from "@hmrbot/hub-registry";

// The committed root registry.json is built by `pnpm build:registry` (and, from
// phase 4, includes federated skill sources). CI fails the build if it is stale.
const REGISTRY = registryData as Registry;

export type Section = "skill" | "prompt" | "software";

export function getRegistry(): Registry {
  return REGISTRY;
}

export function getEntries(section?: Section): RegistryEntry[] {
  return section ? REGISTRY.skills.filter((e) => e.section === section) : REGISTRY.skills;
}

export const getSkills = () => getEntries("skill");
export const getPrompts = () => getEntries("prompt");

export const SECTION_META: Record<
  Section,
  { title: string; one: string; en: string; install: string; blurb: string }
> = {
  skill: {
    title: "مهارت‌ها",
    one: "مهارت",
    en: "Skills",
    install: "npx hmrbot-hub skill add",
    blurb:
      "بسته‌های دستورالعمل با فرمت استاندارد agentskills.io — قابل نصب در Claude Code، Hermes، Codex و بقیه.",
  },
  prompt: {
    title: "پرامپت‌ها",
    one: "پرامپت",
    en: "Prompts",
    install: "npx hmrbot-hub prompt add",
    blurb: "پرامپت‌های آمادهٔ فارسی، ساختاریافته و تست‌شده.",
  },
  software: {
    title: "نرم‌افزار",
    one: "مورد",
    en: "Software",
    install: "",
    blurb: "دایرکتوری ابزارها و سرویس‌های هوش مصنوعی.",
  },
};

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
    `https://github.com/hmrbot/skill-hub/tree/main/${(entry.path ?? "").replace(/\/$/, "")}`
  );
}

export type { RegistryEntry, Registry };
