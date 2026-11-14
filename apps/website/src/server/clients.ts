import { and, desc, eq } from "drizzle-orm";
import type { Db } from "./db.js";
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken } from "./schema.js";

/*
 * MCP clients connected through OAuth: one consent row per account and client. Disconnecting
 * deletes the consent and the client's tokens for that account, and the MCP endpoint accepts an
 * access token only while its consent exists (hasConsent), so a disconnect takes effect at once
 * rather than when the token expires.
 */

export interface ConnectedClient {
  readonly clientId: string;
  readonly name: string;
  readonly scopes: readonly string[];
  readonly connectedAt: string | null;
}

export async function connectedClients(db: Db, userId: string): Promise<ConnectedClient[]> {
  const rows = await db
    .select({
      clientId: oauthConsent.clientId,
      name: oauthClient.name,
      scopes: oauthConsent.scopes,
      createdAt: oauthConsent.createdAt,
    })
    .from(oauthConsent)
    .leftJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
    .where(eq(oauthConsent.userId, userId))
    .orderBy(desc(oauthConsent.createdAt));
  return rows.map((row) => ({
    clientId: row.clientId,
    name: row.name || "Unnamed client",
    scopes: row.scopes,
    connectedAt: row.createdAt?.toISOString() ?? null,
  }));
}

export async function disconnectClient(db: Db, userId: string, clientId: string) {
  const removed = await db
    .delete(oauthConsent)
    .where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)))
    .returning({ id: oauthConsent.id });
  await db
    .delete(oauthAccessToken)
    .where(and(eq(oauthAccessToken.userId, userId), eq(oauthAccessToken.clientId, clientId)));
  await db
    .delete(oauthRefreshToken)
    .where(and(eq(oauthRefreshToken.userId, userId), eq(oauthRefreshToken.clientId, clientId)));
  return removed.length > 0;
}

export async function hasConsent(db: Db, userId: string, clientId: string) {
  const [row] = await db
    .select({ id: oauthConsent.id })
    .from(oauthConsent)
    .where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)))
    .limit(1);
  return Boolean(row);
}
