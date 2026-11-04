import { defineConfig } from "vitest/config";

// Each package owns its Vitest project (environment: node or real browser).
export default defineConfig({
  test: {
    projects: ["packages/*"],
    // Packages may have no tests while their first component is being built.
    passWithNoTests: true,
  },
});
