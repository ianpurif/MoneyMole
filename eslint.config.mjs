import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals, ...nextTypescript,
  globalIgnores([".next/**", ".local/**", "managed/**", "reports/**", "coverage/**", "next-env.d.ts"]),
  { files: ["src/**/*.{ts,tsx}"], rules: { "no-console": "error" } },
  { files: ["src/lib/server/**/*.ts", "src/app/api/**/*.ts"], rules: {
    "no-restricted-imports": ["error", { patterns: [{ group: ["**/midnight/**", "**/private-state/**", "@midnight-ntwrk/*"], message: "Wallet authorization, witnesses and private state stay client-side." }] }],
  } },
]);
