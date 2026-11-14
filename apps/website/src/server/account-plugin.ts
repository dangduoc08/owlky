import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { connectedClients, disconnectClient } from "./clients.js";
import type { Db } from "./db.js";
import { account, user } from "./schema.js";
import { createToken, listTokens, revokeToken, TokenError } from "./tokens.js";
import { usageSummary } from "./usage.js";

/*
 * Owlky's account endpoints, as a Better Auth plugin under /api/auth/owlky/* so they share its
 * session check and its CSRF defenses: every non-GET request that carries cookies must come from
 * a trusted origin, and only `application/json` bodies are accepted (no cross-site form posts).
 * GET endpoints only read.
 */

export interface AccountPluginOptions {
  /** Sign-in providers that have credentials (the sign-in page offers only those). */
  readonly providers: readonly ("github" | "google")[];
}

const fail = (error: unknown): never => {
  if (error instanceof TokenError) throw new APIError("BAD_REQUEST", { message: error.message });
  throw error;
};

export const accountPlugin = (db: Db, options: AccountPluginOptions) =>
  ({
    id: "owlky-account",
    endpoints: {
      owlkyProviders: createAuthEndpoint("/owlky/providers", { method: "GET" }, async (ctx) =>
        ctx.json({ providers: options.providers }),
      ),
      owlkyAccount: createAuthEndpoint(
        "/owlky/account",
        { method: "GET", use: [sessionMiddleware] },
        async (ctx) => {
          const id = ctx.context.session.user.id;
          const [row] = await db.select().from(user).where(eq(user.id, id));
          if (!row) throw new APIError("NOT_FOUND");
          const providers = await db
            .select({ providerId: account.providerId })
            .from(account)
            .where(eq(account.userId, id));
          return ctx.json({
            user: {
              name: row.name,
              email: row.email,
              image: row.image,
              createdAt: row.createdAt.toISOString(),
              providers: [...new Set(providers.map((p) => p.providerId))].sort(),
              marketingOptIn: row.marketingOptIn,
              marketingOptInAt: row.marketingOptInAt?.toISOString() ?? null,
              entitlements: row.entitlements,
            },
            tokens: await listTokens(db, id),
            usage: await usageSummary(db, id),
          });
        },
      ),
      owlkyMarketing: createAuthEndpoint(
        "/owlky/marketing",
        { method: "POST", use: [sessionMiddleware], body: z.object({ optIn: z.boolean() }) },
        async (ctx) => {
          const now = new Date();
          await db
            .update(user)
            .set({ marketingOptIn: ctx.body.optIn, marketingOptInAt: now })
            .where(eq(user.id, ctx.context.session.user.id));
          return ctx.json({ marketingOptIn: ctx.body.optIn, marketingOptInAt: now.toISOString() });
        },
      ),
      owlkyCreateToken: createAuthEndpoint(
        "/owlky/tokens/create",
        {
          method: "POST",
          use: [sessionMiddleware],
          body: z.object({
            name: z.string(),
            expiresInDays: z.number().int().nullable().optional(),
          }),
        },
        async (ctx) => {
          const created = await createToken(db, ctx.context.session.user.id, ctx.body).catch(fail);
          // The secret is in this response only: never cache it.
          ctx.setHeader("Cache-Control", "no-store");
          return ctx.json(created);
        },
      ),
      owlkyClients: createAuthEndpoint(
        "/owlky/clients",
        { method: "GET", use: [sessionMiddleware] },
        async (ctx) =>
          ctx.json({ clients: await connectedClients(db, ctx.context.session.user.id) }),
      ),
      owlkyDisconnectClient: createAuthEndpoint(
        "/owlky/clients/disconnect",
        {
          method: "POST",
          use: [sessionMiddleware],
          body: z.object({ clientId: z.string().max(200) }),
        },
        async (ctx) => {
          if (!(await disconnectClient(db, ctx.context.session.user.id, ctx.body.clientId)))
            throw new APIError("NOT_FOUND", { message: "No such client." });
          return ctx.json({ disconnected: true });
        },
      ),
      owlkyRevokeToken: createAuthEndpoint(
        "/owlky/tokens/revoke",
        { method: "POST", use: [sessionMiddleware], body: z.object({ id: z.string().max(64) }) },
        async (ctx) => {
          if (!(await revokeToken(db, ctx.context.session.user.id, ctx.body.id)))
            throw new APIError("NOT_FOUND", { message: "No such token." });
          return ctx.json({ revoked: true });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
