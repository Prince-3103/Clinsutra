import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

// Vitest reuses the React plugin and the "@" alias so tests import exactly like
// the app does. jsdom gives hooks/components a DOM to render into.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
