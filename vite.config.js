import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Expand quote data instead of emitting a single long JSON.parse string.
  json: { stringify: false },
  build: {
    // Keep deployed assets readable when opened directly in the browser.
    minify: false,
    cssMinify: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
            },
            {
              name: "motion",
              test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
              priority: 30,
            },
          ],
        },
      },
    },
  },
});
