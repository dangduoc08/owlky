import { defineConfig } from "vitest/config";

// Each package owns its Vitest project (environment: node or real browser).
const COMPONENT_THRESHOLDS = { statements: 95, branches: 95, functions: 100, lines: 95 };

export default defineConfig({
  test: {
    projects: ["packages/*"],
    // Packages may have no tests while their first component is being built.
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "**/test-utils.{ts,tsx}", "packages/html/src/cdn.ts"],
      reporter: ["text-summary", "text"],
      // Component floor (see .claude/commands/component.md → Coverage matrix). Add each new
      // component's files here.
      thresholds: {
        "packages/core/src/anatomy/**": COMPONENT_THRESHOLDS,
        "packages/core/src/modal/**": COMPONENT_THRESHOLDS,
        "packages/core/src/options/**": COMPONENT_THRESHOLDS,
        "packages/core/src/sortable/**": COMPONENT_THRESHOLDS,
        "packages/core/src/toggle/**": COMPONENT_THRESHOLDS,
        "packages/react/src/button/**": COMPONENT_THRESHOLDS,
        "packages/react/src/button-group/**": COMPONENT_THRESHOLDS,
        "packages/react/src/drawer/**": COMPONENT_THRESHOLDS,
        "packages/react/src/fab/**": COMPONENT_THRESHOLDS,
        "packages/react/src/icon-button/**": COMPONENT_THRESHOLDS,
        "packages/react/src/sortable/**": COMPONENT_THRESHOLDS,
        "packages/react/src/toggle-button/**": COMPONENT_THRESHOLDS,
        "packages/react/src/utils/**": COMPONENT_THRESHOLDS,
        "packages/html/src/components/drawer/**": COMPONENT_THRESHOLDS,
        "packages/html/src/components/sortable/**": COMPONENT_THRESHOLDS,
        "packages/html/src/components/toggle-button/**": COMPONENT_THRESHOLDS,
        "packages/html/src/components/toggle-group/**": COMPONENT_THRESHOLDS,
      },
    },
  },
});
