import { defineProject } from "vitest/config";
import { browser } from "../../vitest.browser.js";

export default defineProject({
  test: {
    name: "html",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    browser,
  },
  // Adapter tests (ADR-0030) load Day.js: pre-bundle it so Vite never reloads mid-run.
  // Code editor tests load Monaco (ADR-0034): pre-bundled for the same reason.
  // The phone input (ADR-0061) loads libphonenumber-js.
  optimizeDeps: {
    include: [
      "dayjs",
      "monaco-editor",
      "@owlky/core > maplibre-gl",
      "@owlky/core > libphonenumber-js/core",
      "@owlky/core > libphonenumber-js/min/metadata",
    ],
  },
});
