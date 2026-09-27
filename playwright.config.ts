import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser", fullyParallel: false, workers: 1, retries: 0,
  use: { baseURL: "http://localhost:3100", trace: "off" },
  webServer: { command: "npm run start -- --port 3100", url: "http://localhost:3100", reuseExistingServer: false, timeout: 120_000 },
});
