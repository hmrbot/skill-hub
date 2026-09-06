// @ts-check
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

// Static catalog for hub.hmrbot.com — served at the subdomain root, so no `base`.
// Deployed to GitHub Pages (see .github/workflows/build-deploy.yml).
export default defineConfig({
  site: "https://hub.hmrbot.com",
  trailingSlash: "never",
  build: { format: "directory" },
  markdown: {
    shikiConfig: { theme: "github-dark", wrap: true },
  },
  vite: {
    server: { fs: { allow: [repoRoot] } },
  },
});
