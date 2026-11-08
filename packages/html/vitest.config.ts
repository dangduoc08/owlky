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
  optimizeDeps: { include: ["dayjs"] },
});
