import { defineConfig, devices } from "@playwright/test";

// `PORT` lets parallel worktrees each serve their own build.
const PORT = Number(process.env["PORT"] ?? 4400);

/**
 * Website e2e (ADR-0040 decision 11, ADR-0071): runs against the production build
 * (`pnpm build && pnpm website:build`) served by `next start`, with PGlite in memory and the mock
 * OAuth providers (scripts/mock-oauth.mjs): no real accounts or services.
 */
export default defineConfig({
  testDir: "./website",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 2 : 0,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "node ../apps/website/scripts/serve.mjs --mock",
    port: PORT,
    reuseExistingServer: !process.env["CI"],
    env: {
      PORT: String(PORT),
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-0123",
      OWLKY_PGLITE_DIR: "memory://",
      OWLKY_AUTH_RATE_LIMIT: "off",
    },
  },
});
