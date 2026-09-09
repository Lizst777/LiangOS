import { defineConfig } from "vite";

export default defineConfig({
  // Fold does not use the old site's environment variables.
  envDir: false,
  build: { minify: false, cssMinify: false },
});
