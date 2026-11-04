import { defineProject } from "vitest/config";

export default defineProject({
  test: { name: "styles", environment: "node", include: ["src/**/*.test.ts"] },
});
