import type { APIRoute } from "astro";
import { getRegistry } from "../lib/content";

// The index the CLI (`npx hmrbot`) fetches from https://hub.hmrbot.com/registry.json
export const GET: APIRoute = () => {
  return new Response(JSON.stringify(getRegistry(), null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};
