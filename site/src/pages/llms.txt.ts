import type { APIRoute } from "astro";
import { getSkills, CATEGORY_LABEL } from "../lib/skills";

export const GET: APIRoute = ({ site }) => {
  const base = site?.href.replace(/\/$/, "") ?? "https://hub.hmrbot.com";
  const skills = getSkills();

  const lines: string[] = [
    "# hmrbot Hub",
    "",
    "> Open library of agent skills (Persian-first), in the agentskills.io SKILL.md format.",
    "> Install any skill with: npx hmrbot skill add <slug>",
    "",
    `## Skills (${skills.length})`,
    "",
  ];

  for (const s of skills) {
    const cat = s.category ? ` [${CATEGORY_LABEL[s.category] ?? s.category}]` : "";
    lines.push(`- [${s.slug}](${base}/skill/${s.slug})${cat}: ${s.description}`);
  }

  lines.push("", "## Machine-readable", "", `- Registry: ${base}/registry.json`, "");

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
