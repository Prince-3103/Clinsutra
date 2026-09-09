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
    // Proxy API + voice WebSocket to the backend so the browser only ever talks
    // to the (same-origin) dev server. This is what lets the kiosk work through
    // a forwarded/tunnelled port on a phone: no `localhost` (which would be the
    // phone), no cross-origin, no mixed-content. Override the target with
    // BACKEND_URL when the backend runs elsewhere.
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL ?? "http://localhost:8000",
        changeOrigin: true,
        ws: true,
      },
    },
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
