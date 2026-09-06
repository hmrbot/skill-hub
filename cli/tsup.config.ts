import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  minify: false,
  // add a shebang so `dist/index.js` is directly executable
  banner: { js: "#!/usr/bin/env node" },
});
