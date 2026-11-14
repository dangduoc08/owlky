import { defineConfig } from "drizzle-kit";

// `pnpm --filter @owlky/website db:generate` writes a migration in drizzle/ from
// src/server/schema.ts (ADR-0071 § 5).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/schema.ts",
  out: "./drizzle",
});
