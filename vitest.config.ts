import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({ test: {
  passWithNoTests: false,
  projects: [{ resolve: { alias: { "client-only": fileURLToPath(new URL("./tests/unit/client-only.ts", import.meta.url)) } }, test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" } }],
} });
