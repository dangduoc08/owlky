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
  provider: playwright({
    launchOptions: {
      // CI runners have no GPU: Firefox sometimes starts without WebGL, and every map test then
      // times out waiting for MapLibre. Always allow software WebGL.
      firefoxUserPrefs: {
        "webgl.force-enabled": true,
        "webgl.disable-fail-if-major-performance-caveat": true,
      },
    },
  }),
  screenshotFailures: false,
  instances: names.map((browser) => ({ browser })),
};
