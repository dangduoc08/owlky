import { defineConfig } from "vitest/config";

// Each package owns its Vitest project (environment: node or real browser).
export default defineConfig({
  test: {
    projects: ["packages/*"],
  },
});
