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
  optimizeDeps: { include: ["dayjs", "monaco-editor"] },
});
