import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,
    port: Number(process.env.PORT ?? 5173),
  },
  preview: {
    host: true,
    port: Number(process.env.PORT ?? 4173),
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
})
