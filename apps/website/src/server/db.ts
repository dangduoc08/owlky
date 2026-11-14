import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { ServerEnv } from "./env.js";
import { schema } from "./schema.js";

/*
 * The database (ADR-0071 § 5): node-postgres against `DATABASE_URL` (Neon, or any Postgres), or
 * PGlite (Postgres compiled to WebAssembly, in process) when no URL is set. Both run the same
 * Drizzle schema and migrations, so tests and e2e exercise the production SQL.
 *
 * PGlite databases are migrated when opened. A Postgres database is migrated by
 * `pnpm --filter @owlky/website db:migrate` before a deploy, never by a request.
 */

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/** `drizzle/` next to the app, from the app (`next start`) or the repository root (Vitest). */
export function migrationsFolder(cwd = process.cwd()): string {
  for (const candidate of [join(cwd, "drizzle"), join(cwd, "apps/website/drizzle")])
    if (existsSync(join(candidate, "meta/_journal.json"))) return candidate;
  throw new Error("website: no drizzle/ migrations folder found");
}

/** Opens and migrates a PGlite database (`memory://` keeps it in memory). */
export async function openPglite(dir: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const memory = dir.startsWith("memory://");
  if (!memory) mkdirSync(resolve(dir), { recursive: true });
  const client = new PGlite(memory ? undefined : resolve(dir));
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: migrationsFolder() });
  return db as unknown as Db;
}

async function openPostgres(url: string): Promise<Db> {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  // Small pool: serverless functions run many instances, each with a few connections.
  const pool = new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000 });
  return drizzle({ client: pool, schema }) as unknown as Db;
}

export function openDb(env: Pick<ServerEnv, "databaseUrl" | "pgliteDir">): Promise<Db> {
  return env.databaseUrl ? openPostgres(env.databaseUrl) : openPglite(env.pgliteDir);
}
