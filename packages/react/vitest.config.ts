import { defineProject } from "vitest/config";
import { browser } from "../../vitest.browser.js";

export default defineProject({
  test: {
    name: "react",
    include: ["src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    browser,
  },
  // Adapter tests (ADR-0030) load Day.js: pre-bundle it so Vite never reloads mid-run.
  // Code editor tests load Monaco (ADR-0034): pre-bundled for the same reason.
  optimizeDeps: {
    include: ["dayjs", "dayjs/plugin/timezone.js", "dayjs/plugin/utc.js", "monaco-editor"],
  },
});
