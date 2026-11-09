import { defineProject } from "vitest/config";
import { browser } from "../../vitest.browser.js";

export default defineProject({
  test: { name: "core", include: ["src/**/*.test.ts"], browser },
  // Adapter tests (ADR-0030) load the date libraries: pre-bundle them so Vite never reloads mid-run.
  optimizeDeps: {
    include: [
      "@date-fns/tz",
      "dayjs",
      "dayjs/plugin/timezone.js",
      "dayjs/plugin/utc.js",
      "luxon",
      "moment",
      "moment-timezone",
      // Code editor tests load Monaco (ADR-0034).
      "monaco-editor",
    ],
  },
});
