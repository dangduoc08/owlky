import { defineProject } from "vitest/config";
import { browser } from "../../vitest.browser.js";

export default defineProject({
  test: { name: "core", include: ["src/**/*.test.ts"], browser },
});
