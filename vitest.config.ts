import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({ test: {
  passWithNoTests: false,
  projects: ["unit", "integration"].map(name => ({ resolve: { alias: { "client-only": fileURLToPath(new URL("./tests/unit/client-only.ts", import.meta.url)) } }, test: { name, include: [`tests/${name}/**/*.test.ts`], environment: "node" } })),
} });
