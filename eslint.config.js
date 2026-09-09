import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "tools", "tmp_ai_pdf_preview"]),
  {
    files: ["**/*.{js,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["test/**/*.mjs", "scripts/**/*.mjs", "*.config.js"],
    languageOptions: { globals: globals.node },
  },
]);
