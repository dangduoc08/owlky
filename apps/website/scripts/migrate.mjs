// Applies drizzle/*.sql to the Postgres database at DATABASE_URL (ADR-0071 § 5): run before a
// deploy that changes the schema (`pnpm --filter @owlky/website db:migrate`). PGlite databases
// (local runs, tests) migrate themselves when opened.
import { join } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { app } from "./content.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("db:migrate: set DATABASE_URL (the Neon connection string)");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle({ client: pool }), { migrationsFolder: join(app, "drizzle") });
  console.log("db:migrate: the database is up to date");
} finally {
  await pool.end();
}
