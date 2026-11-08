import { defineConfig, devices } from "@playwright/test";

// `PORT` lets parallel worktrees (Multi-URL mode) each serve their own build.
const PORT = Number(process.env["PORT"] ?? 4321);

/**
 * E2E runs against the *built* Storybook (pnpm storybook:build) and the plain-HTML example
 * (pnpm build). Visual tests (@visual) only run inside the Playwright Docker image, where fonts
 * and rendering are deterministic — see docs/testing.md.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 2 : 0,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" } },
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
    command: "node serve.mjs",
    port: PORT,
    reuseExistingServer: !process.env["CI"],
    env: { PORT: String(PORT) },
  },
});
