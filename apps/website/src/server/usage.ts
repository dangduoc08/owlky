import { desc, eq, sql } from "drizzle-orm";
import type { Db } from "./db.js";
import { mcpToolUsage, mcpUsage } from "./schema.js";

/*
 * MCP rate limit and use counts (ADR-0071 § 6–7). A fixed window per account, counted in
 * Postgres by one atomic upsert per request (no extra service until traffic needs one). The tool
 * counts store a tool name the server knows, a number and a date: never prompts, arguments or
 * results.
 */

/** Requests per window and account. */
export const RATE_LIMIT = 60;
/** Window length in seconds. */
export const RATE_WINDOW = 60;

export type RateResult =
  | { readonly allowed: true; readonly remaining: number; readonly reset: number }
  | { readonly allowed: false; readonly retryAfter: number; readonly reset: number }
  /** The account doesn't exist (any more): the credential is stale. */
  | { readonly allowed: false; readonly unknownAccount: true };

const rowsOf = <T>(result: unknown): T[] => (result as { rows: T[] }).rows;

/** Counts one request and says whether it fits the account's window. */
export async function countRequest(db: Db, userId: string, now = new Date()): Promise<RateResult> {
  const seconds = Math.floor(now.getTime() / 1000);
  const windowStart = seconds - (seconds % RATE_WINDOW);
  const reset = windowStart + RATE_WINDOW;
  // INSERT … SELECT from "user": a deleted account inserts nothing and returns no row.
  const result = await db.execute(sql`
    insert into ${mcpUsage} (user_id, window_start, window_count, last_used_at)
    select ${userId}, ${windowStart}, 1, ${now.toISOString()}::timestamptz
    from "user" where id = ${userId}
    on conflict (user_id) do update set
      window_count = case when ${mcpUsage}.window_start = excluded.window_start
        then ${mcpUsage}.window_count + 1 else 1 end,
      window_start = excluded.window_start,
      last_used_at = excluded.last_used_at
    returning window_count`);
  const [row] = rowsOf<{ window_count: number }>(result);
  if (!row) return { allowed: false, unknownAccount: true };
  const count = Number(row.window_count);
  if (count > RATE_LIMIT)
    return { allowed: false, retryAfter: Math.max(1, reset - seconds), reset };
  return { allowed: true, remaining: RATE_LIMIT - count, reset };
}

/** Adds one call to each tool named (the names come from the server's own tool list). */
export async function countTools(
  db: Db,
  userId: string,
  tools: readonly string[],
  now = new Date(),
): Promise<void> {
  const counts = new Map<string, number>();
  for (const tool of tools) counts.set(tool, (counts.get(tool) ?? 0) + 1);
  for (const [tool, calls] of counts)
    await db
      .insert(mcpToolUsage)
      .values({ userId, tool, calls, lastUsedAt: now })
      .onConflictDoUpdate({
        target: [mcpToolUsage.userId, mcpToolUsage.tool],
        set: { calls: sql`${mcpToolUsage.calls} + ${calls}`, lastUsedAt: now },
      });
}

export interface UsageSummary {
  readonly lastUsedAt: string | null;
  readonly tools: readonly { tool: string; calls: number; lastUsedAt: string }[];
}

export async function usageSummary(db: Db, userId: string): Promise<UsageSummary> {
  const [account] = await db.select().from(mcpUsage).where(eq(mcpUsage.userId, userId));
  const tools = await db
    .select()
    .from(mcpToolUsage)
    .where(eq(mcpToolUsage.userId, userId))
    .orderBy(desc(mcpToolUsage.calls), mcpToolUsage.tool);
  return {
    lastUsedAt: account?.lastUsedAt.toISOString() ?? null,
    tools: tools.map((row) => ({
      tool: row.tool,
      calls: row.calls,
      lastUsedAt: row.lastUsedAt.toISOString(),
    })),
  };
}
