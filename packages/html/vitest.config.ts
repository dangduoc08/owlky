import { defineProject } from "vitest/config";
import { browser } from "../../vitest.browser.js";

export default defineProject({
  test: {
    name: "html",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    browser,
  },
});
