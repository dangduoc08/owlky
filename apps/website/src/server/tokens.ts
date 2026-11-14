import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import type { Db } from "./db.js";
import { personalAccessToken } from "./schema.js";

/*
 * Personal access tokens (ADR-0071 § 4) for MCP clients without OAuth. A token is
 * `owlky_pat_` + 32 random bytes (base64url). It is shown once, at creation; the database keeps a
 * SHA-256 of it (a fast hash is enough for 256 bits of entropy: there is nothing to brute-force)
 * and the first characters, so the list can tell tokens apart.
 */

export const TOKEN_PREFIX = "owlky_pat_";
/** The only scope now: use the MCP server. */
export const MCP_SCOPE = "mcp";
/** Tokens per account. */
export const MAX_TOKENS = 20;
export const MAX_TOKEN_NAME = 60;
/** Characters of the token kept in clear for the list (`owlky_pat_` + 6). */
const SHOWN = TOKEN_PREFIX.length + 6;
const SHAPE = /^owlky_pat_[A-Za-z0-9_-]{43}$/;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const looksLikeToken = (value: string) => value.startsWith(TOKEN_PREFIX);

export interface TokenSummary {
  readonly id: string;
  readonly name: string;
  readonly prefix: string;
  readonly scopes: string;
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
  readonly expiresAt: string | null;
}

const summary = (row: typeof personalAccessToken.$inferSelect): TokenSummary => ({
  id: row.id,
  name: row.name,
  prefix: row.prefix,
  scopes: row.scopes,
  createdAt: row.createdAt.toISOString(),
  lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  expiresAt: row.expiresAt?.toISOString() ?? null,
});

export class TokenError extends Error {}

/** Creates a token; the returned `token` is the only copy of the secret. */
export async function createToken(
  db: Db,
  userId: string,
  input: { name: string; expiresInDays?: number | null | undefined },
  now = new Date(),
): Promise<TokenSummary & { token: string }> {
  const name = input.name.trim();
  if (!name || name.length > MAX_TOKEN_NAME)
    throw new TokenError(`Name the token in 1 to ${MAX_TOKEN_NAME} characters.`);
  const days = input.expiresInDays ?? null;
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 366))
    throw new TokenError("A token expires after 1 to 366 days, or never.");
  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(personalAccessToken)
    .where(eq(personalAccessToken.userId, userId));
  if (count >= MAX_TOKENS) throw new TokenError(`An account holds at most ${MAX_TOKENS} tokens.`);
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  const [row] = await db
    .insert(personalAccessToken)
    .values({
      id: randomUUID(),
      userId,
      name,
      prefix: token.slice(0, SHOWN),
      hash: hashToken(token),
      scopes: MCP_SCOPE,
      createdAt: now,
      expiresAt: days === null ? null : new Date(now.getTime() + days * 86_400_000),
    })
    .returning();
  if (!row) throw new TokenError("The token could not be saved.");
  return { ...summary(row), token };
}

export async function listTokens(db: Db, userId: string): Promise<TokenSummary[]> {
  const rows = await db
    .select()
    .from(personalAccessToken)
    .where(eq(personalAccessToken.userId, userId))
    .orderBy(desc(personalAccessToken.createdAt));
  return rows.map(summary);
}

/** Revoking deletes the row. Returns false when the account has no such token. */
export async function revokeToken(db: Db, userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(personalAccessToken)
    .where(and(eq(personalAccessToken.id, id), eq(personalAccessToken.userId, userId)))
    .returning({ id: personalAccessToken.id });
  return rows.length > 0;
}

/** The account and scopes of a valid, unexpired token (and records its use), or null. */
export async function verifyToken(
  db: Db,
  token: string,
  now = new Date(),
): Promise<{ userId: string; scopes: string[] } | null> {
  if (!SHAPE.test(token)) return null;
  const [row] = await db
    .update(personalAccessToken)
    .set({ lastUsedAt: now })
    .where(
      and(
        eq(personalAccessToken.hash, hashToken(token)),
        or(isNull(personalAccessToken.expiresAt), gt(personalAccessToken.expiresAt, now)),
      ),
    )
    .returning({ userId: personalAccessToken.userId, scopes: personalAccessToken.scopes });
  return row ? { userId: row.userId, scopes: row.scopes.split(" ") } : null;
}
