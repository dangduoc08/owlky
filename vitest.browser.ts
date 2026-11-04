import { playwright } from "@vitest/browser-playwright";

/**
 * Shared Vitest browser-mode settings. Component tests run in real browsers because jsdom does
 * not implement the top layer, <dialog>.showModal(), the Popover API or real focus/keyboard.
 * Set VITEST_BROWSERS=chromium,firefox,webkit to widen the matrix (CI does).
 */
const names = (process.env["VITEST_BROWSERS"] ?? "chromium").split(",") as (
  | "chromium"
  | "firefox"
  | "webkit"
)[];

export const browser = {
  enabled: true,
  headless: true,
  provider: playwright(),
  screenshotFailures: false,
  instances: names.map((browser) => ({ browser })),
};
