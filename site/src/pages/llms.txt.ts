import type { APIRoute } from "astro";
import { getEntries, CATEGORY_LABEL, SOURCE_LABEL, githubUrlFor } from "../lib/content";

export const GET: APIRoute = ({ site }) => {
  const base = site?.href.replace(/\/$/, "") ?? "https://hub.hmrbot.com";
  const all = getEntries();

  const lines: string[] = [
    "# hmrbot Hub",
    "",
    "> Open library of agent skills and prompts, in the agentskills.io SKILL.md format.",
    "> Install: npx hmrbot skill add <slug>  /  npx hmrbot prompt add <slug>",
    "",
  ];

  for (const section of ["skill", "prompt"] as const) {
    const local = all.filter((e) => e.section === section && e.source === "hmrbot");
    if (local.length === 0) continue;
    lines.push(`## ${section}s (${local.length})`, "");
    for (const s of local) {
      const cat = s.category ? ` [${CATEGORY_LABEL[s.category] ?? s.category}]` : "";
      lines.push(`- [${s.slug}](${base}/${section}/${s.slug})${cat}: ${s.description}`);
    }
    lines.push("");
  }

  const federated = all.filter((e) => e.source !== "hmrbot");
  if (federated.length) {
    lines.push(`## Federated skills (${federated.length})`, "");
    for (const s of federated) {
      lines.push(`- [${s.slug}](${githubUrlFor(s)}) (${SOURCE_LABEL[s.source] ?? s.source}): ${s.description}`);
    }
    lines.push("");
  }

  lines.push("## Machine-readable", "", `- Registry: ${base}/registry.json`, "");

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
