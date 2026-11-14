import { mcp } from "@better-auth/mcp";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import { accountPlugin } from "./account-plugin.js";
import { type Db, openDb } from "./db.js";
import { readEnv, type ServerEnv } from "./env.js";
import { pinnedVersions } from "./manifests.js";
import { installMockFetch, mockUrl } from "./oauth-mock.js";
import { schema } from "./schema.js";
import { MCP_SCOPE } from "./tokens.js";

/*
 * Accounts (ADR-0071 § 3): Better Auth with GitHub and Google, the `jwt` plugin (keys that sign
 * MCP access tokens) and `mcp`, the OAuth 2.1 authorization server MCP clients sign in through:
 * PKCE (S256 only), dynamic client registration (RFC 7591), authorization-server metadata
 * (RFC 8414) and protected-resource metadata (RFC 9728). Security notes: ADR-0071, "M2–M4 notes".
 */

export const AUTH_BASE_PATH = "/api/auth";
const NO_PROVIDER_TOKENS = {
  accessToken: null,
  refreshToken: null,
  idToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
};
/** Session lifetime and how often a used session is extended. */
const SESSION_DAYS = 30;

/** The MCP resources: `/mcp` (latest) and one per pinned version (`/mcp/v0.1`). */
export function mcpResources(url: string, versions = pinnedVersions()) {
  return { latest: `${url}/mcp`, pinned: versions.map((version) => `${url}/mcp/${version}`) };
}

export function createAuth(env: ServerEnv, db: Db) {
  if (env.oauthMock) installMockFetch(env.oauthMock);
  const resources = mcpResources(env.url);
  const providers = [
    ...(env.github ? ["github" as const] : []),
    ...(env.google ? ["google" as const] : []),
  ];
  return betterAuth({
    appName: "Owlky",
    baseURL: env.url,
    basePath: AUTH_BASE_PATH,
    secret: env.secret,
    trustedOrigins: [env.url],
    database: drizzleAdapter(db, { provider: "pg", schema }),
    // No usage data leaves the server (ADR-0071 § 6).
    telemetry: { enabled: false },
    // The jwt plugin's session-token route: browser sessions never get a JWT signed with the
    // access-token keys.
    disabledPaths: ["/token"],
    socialProviders: {
      ...(env.github ? { github: env.github } : {}),
      ...(env.google ? { google: { ...env.google, prompt: "select_account" as const } } : {}),
    },
    account: {
      // The same verified email from GitHub and Google is one account.
      accountLinking: { enabled: true, trustedProviders: ["github", "google"] },
      // Provider tokens aren't stored (databaseHooks); encrypted if a future change keeps one.
      encryptOAuthTokens: true,
    },
    user: { deleteUser: { enabled: true } },
    session: { expiresIn: SESSION_DAYS * 86_400, updateAge: 86_400 },
    // Sign-in rate limits in memory (per instance): no IP address is written to the database.
    rateLimit: { enabled: env.authRateLimit, storage: "memory", window: 60, max: 60 },
    advanced: {
      cookiePrefix: "owlky",
      // Explicit: Better Auth turns these checks off under NODE_ENV=test, so tests see production.
      disableOriginCheck: false,
      disableCSRFCheck: false,
      useSecureCookies: env.url.startsWith("https://"),
      defaultCookieAttributes: { sameSite: "lax", httpOnly: true },
    },
    databaseHooks: {
      // Sessions keep neither the IP address nor the user agent (not in ADR-0071 § 6's list).
      session: {
        create: {
          before: async (session) => ({ data: { ...session, ipAddress: null, userAgent: null } }),
        },
      },
      // The providers' tokens are only needed to read the profile at sign-in: never stored.
      account: {
        create: { before: async (row) => ({ data: { ...row, ...NO_PROVIDER_TOKENS } }) },
        update: { before: async (row) => ({ data: { ...row, ...NO_PROVIDER_TOKENS } }) },
      },
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        // Mock mode: send the browser to the mock provider instead of github.com / google.com.
        if (!env.oauthMock || ctx.path !== "/sign-in/social") return undefined;
        const returned = ctx.context.returned as { url?: unknown } | undefined;
        if (!returned || typeof returned.url !== "string") return undefined;
        return ctx.json({ ...returned, url: mockUrl(env.oauthMock, returned.url) });
      }),
    },
    plugins: [
      jwt({ disableSettingJwtHeader: true }),
      mcp({
        resource: resources.latest,
        resources: resources.pinned,
        clientRegistrationDefaultResources: resources.pinned,
        loginPage: "/sign-in/",
        consentPage: "/oauth/consent/",
        scopes: ["openid", "profile", "email", "offline_access", MCP_SCOPE],
        clientRegistrationDefaultScopes: ["openid", "offline_access", MCP_SCOPE],
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        clientRegistrationDefaultApplicationType: "infer",
        clientRegistrationRequirePKCE: true,
      }),
      accountPlugin(db, { providers }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

export interface Server {
  readonly env: ServerEnv;
  readonly db: Db;
  readonly auth: Auth;
}

/*
 * One instance per process, kept on globalThis: Next.js may load a module once per route bundle
 * (and again on every dev reload), and a second PGlite on the same data would be another
 * database. Website code only; the library's global-state rule (ADR-0007) is about packages.
 */
const SLOT = Symbol.for("owlky.website.server");
const slots = globalThis as unknown as { [SLOT]?: Promise<Server> };

/** The process's database and auth instance, opened on first use. */
export function getServer(): Promise<Server> {
  let server = slots[SLOT];
  if (!server) {
    server = (async () => {
      const env = readEnv();
      const db = await openDb(env);
      return { env, db, auth: createAuth(env, db) };
    })();
    slots[SLOT] = server;
    server.catch(() => {
      if (slots[SLOT] === server) delete slots[SLOT];
    });
  }
  return server;
}
