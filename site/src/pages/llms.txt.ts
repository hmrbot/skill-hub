import type { APIRoute } from "astro";
import { getSkills, CATEGORY_LABEL, SOURCE_LABEL, githubUrlFor } from "../lib/skills";

export const GET: APIRoute = ({ site }) => {
  const base = site?.href.replace(/\/$/, "") ?? "https://hub.hmrbot.com";
  const skills = getSkills();
  const local = skills.filter((s) => s.source === "hmrbot");
  const federated = skills.filter((s) => s.source !== "hmrbot");

  const lines: string[] = [
    "# hmrbot Hub",
    "",
    "> Open library of agent skills, in the agentskills.io SKILL.md format.",
    "> Install any skill with: npx hmrbot skill add <slug>",
    "",
    `## hmrbot skills (${local.length})`,
    "",
  ];
  for (const s of local) {
    const cat = s.category ? ` [${CATEGORY_LABEL[s.category] ?? s.category}]` : "";
    lines.push(`- [${s.slug}](${base}/skill/${s.slug})${cat}: ${s.description}`);
  }

  if (federated.length) {
    lines.push("", `## Federated (${federated.length})`, "");
    for (const s of federated) {
      lines.push(`- [${s.slug}](${githubUrlFor(s)}) (${SOURCE_LABEL[s.source] ?? s.source}): ${s.description}`);
    }
  }

  lines.push("", "## Machine-readable", "", `- Registry: ${base}/registry.json`, "");

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
