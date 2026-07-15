import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
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
            {
              name: "gsap",
              test: /node_modules[\\/]gsap[\\/]/,
              priority: 20,
            },
            {
              name: "supabase",
              test: /node_modules[\\/]@supabase[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
})
