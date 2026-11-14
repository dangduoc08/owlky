import { defineProject } from "vitest/config";

// Server code of the website (ADR-0071): accounts, tokens, the MCP endpoint. Node, PGlite in
// memory, mock OAuth providers on a free port.
export default defineProject({
  test: {
    name: "website",
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
