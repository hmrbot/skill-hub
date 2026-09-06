import type { APIRoute } from "astro";
import { getEntries } from "../lib/content";

export const GET: APIRoute = ({ site }) => {
  const base = site?.href.replace(/\/$/, "") ?? "https://hub.hmrbot.com";
  const local = getEntries().filter((e) => e.source === "hmrbot");
  const urls = [
    "/",
    "/skill",
    ...(local.some((e) => e.section === "prompt") ? ["/prompt"] : []),
    "/image-prompt",
    ...local.map((e) => `/${e.section}/${e.slug}`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
