import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Db } from "./db.js";
import { oauthClient, oauthConsent, oauthRegistrationWindow } from "./schema.js";

/*
 * Dynamic client registration is open to anyone (MCP clients register before anyone signs in),
 * so two limits keep the client table small, both in Postgres (serverless instances share no
 * memory) and both run by the registration request itself (no cron):
 *
 * - At most REGISTRATION_LIMIT registrations per network address and REGISTRATION_WINDOW,
 *   counted by one atomic upsert keyed by an HMAC of the address (the address isn't stored).
 * - Clients that hold no consent CLIENT_TTL after they registered are deleted: nobody finished
 *   signing in with them, or every account disconnected them. Their tokens go with them
 *   (`on delete cascade`).
 */

/** Registrations per address and window. */
export const REGISTRATION_LIMIT = 10;
/** Window length in seconds. */
export const REGISTRATION_WINDOW = 3600;
/** How long a client may wait for its first consent, in milliseconds. */
export const CLIENT_TTL = 24 * 3600 * 1000;

const rowsOf = <T>(result: unknown): T[] => (result as { rows: T[] }).rows;

/**
 * The client's address as the host's proxy reports it (Vercel sets `x-real-ip` and the first
 * `x-forwarded-for` entry), or `unknown` without a proxy (local runs share one window).
 */
export function clientAddress(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

export type RegistrationResult =
  | { readonly allowed: true; readonly remaining: number }
  | { readonly allowed: false; readonly retryAfter: number };

/** Counts one registration from `address` and says whether it fits the window. */
export async function countRegistration(
  db: Db,
  secret: string,
  address: string,
  now = new Date(),
): Promise<RegistrationResult> {
  const seconds = Math.floor(now.getTime() / 1000);
  const windowStart = seconds - (seconds % REGISTRATION_WINDOW);
  const key = createHmac("sha256", secret).update(`registration:${address}`).digest("hex");
  await db.execute(
    sql`delete from ${oauthRegistrationWindow} where window_start < ${windowStart}`,
  );
  const result = await db.execute(sql`
    insert into ${oauthRegistrationWindow} (key, window_start, window_count)
    values (${key}, ${windowStart}, 1)
    on conflict (key) do update set
      window_count = case when ${oauthRegistrationWindow}.window_start = excluded.window_start
        then ${oauthRegistrationWindow}.window_count + 1 else 1 end,
      window_start = excluded.window_start
    returning window_count`);
  const count = Number(rowsOf<{ window_count: number }>(result)[0]?.window_count ?? 1);
  if (count > REGISTRATION_LIMIT)
    return {
      allowed: false,
      retryAfter: Math.max(1, windowStart + REGISTRATION_WINDOW - seconds),
    };
  return { allowed: true, remaining: REGISTRATION_LIMIT - count };
}

/**
 * Deletes the clients registered without an account more than CLIENT_TTL ago that hold no
 * consent. Returns how many went.
 */
export async function deleteAbandonedClients(db: Db, now = new Date()): Promise<number> {
  const before = new Date(now.getTime() - CLIENT_TTL).toISOString();
  const result = await db.execute(sql`
    delete from ${oauthClient}
    where ${oauthClient.userId} is null
      and ${oauthClient.createdAt} < ${before}::timestamptz
      and not exists (
        select 1 from ${oauthConsent} where ${oauthConsent.clientId} = ${oauthClient.clientId}
      )
    returning ${oauthClient.clientId}`);
  return rowsOf(result).length;
}
