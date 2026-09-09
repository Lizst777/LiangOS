import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Independent preview build. The existing production entry stays untouched.
export default defineConfig({
  root: fileURLToPath(new URL("./prototypes/fold/", import.meta.url)),
  publicDir: false,
  envDir: false,
  base: "./",
  build: {
    outDir: fileURLToPath(new URL("./dist-fold/", import.meta.url)),
    emptyOutDir: true,
    minify: false,
    cssMinify: false,
  },
});
