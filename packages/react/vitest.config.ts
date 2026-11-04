import { defineProject } from "vitest/config";
import { browser } from "../../vitest.browser.js";

export default defineProject({
  test: {
    name: "react",
    include: ["src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    browser,
  },
});
