/*
 * Server configuration (ADR-0071), read once from the environment. Every variable is listed in
 * apps/website/.env.example with what it is for; none has a real value in the repository.
 *
 * Locally (no `VERCEL`), everything has a working default: PGlite instead of Postgres, a fixed
 * development secret and no OAuth credentials (or the mock providers with `OWLKY_OAUTH_MOCK`).
 * On Vercel the production values are required and the development shortcuts are refused.
 */

export interface ServerEnv {
  /** The site's origin, without a trailing slash: `https://owlky.com`. */
  readonly url: string;
  /** Signs cookies and encrypts the token-signing keys. */
  readonly secret: string;
  /** `postgres://…` (Neon), or undefined for PGlite. */
  readonly databaseUrl: string | undefined;
  /** PGlite's data directory, or `memory://` (tests, e2e). */
  readonly pgliteDir: string;
  readonly github: { readonly clientId: string; readonly clientSecret: string } | undefined;
  readonly google: { readonly clientId: string; readonly clientSecret: string } | undefined;
  /** Origin of the mock OAuth providers (`scripts/mock-oauth.mjs`): local runs and e2e only. */
  readonly oauthMock: string | undefined;
  /** Better Auth's sign-in rate limits; `OWLKY_AUTH_RATE_LIMIT=off` turns them off locally (e2e). */
  readonly authRateLimit: boolean;
  /** True on Vercel (preview or production), where the development shortcuts are refused. */
  readonly hosted: boolean;
}

/** A fixed secret for local runs only (refused when hosted). */
export const DEVELOPMENT_SECRET = "owlky-local-development-secret-not-for-deploys";

const origin = (value: string) => {
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash)
    throw new Error(`BETTER_AUTH_URL must be an origin without a path: ${value}`);
  return url.origin;
};

const pair = (id: string | undefined, secret: string | undefined, name: string) => {
  if (!id && !secret) return undefined;
  if (!id || !secret) throw new Error(`${name}: set both the client id and the client secret`);
  return { clientId: id, clientSecret: secret };
};

export function readEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
  const hosted = Boolean(source["VERCEL"]);
  const port = source["PORT"] ?? "3000";
  const url = origin(source["BETTER_AUTH_URL"] ?? `http://localhost:${port}`);
  const secret = source["BETTER_AUTH_SECRET"] ?? (hosted ? undefined : DEVELOPMENT_SECRET);
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required on Vercel");
  if (hosted && secret === DEVELOPMENT_SECRET)
    throw new Error("BETTER_AUTH_SECRET must not be the development secret on Vercel");
  if (secret.length < 32) throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
  const databaseUrl = source["DATABASE_URL"] || undefined;
  if (hosted && !databaseUrl) throw new Error("DATABASE_URL is required on Vercel");
  const oauthMock = source["OWLKY_OAUTH_MOCK"] ? origin(source["OWLKY_OAUTH_MOCK"]) : undefined;
  if (hosted && oauthMock) throw new Error("OWLKY_OAUTH_MOCK is for local runs only");
  if (hosted && !url.startsWith("https://")) throw new Error("BETTER_AUTH_URL must use https");
  const authRateLimit = source["OWLKY_AUTH_RATE_LIMIT"] !== "off";
  if (hosted && !authRateLimit) throw new Error("OWLKY_AUTH_RATE_LIMIT=off is for local runs only");
  const mockPair = oauthMock ? { clientId: "mock-client", clientSecret: "mock-secret" } : undefined;
  return {
    url,
    secret,
    databaseUrl,
    pgliteDir: source["OWLKY_PGLITE_DIR"] ?? ".data/pglite",
    github:
      pair(source["GITHUB_CLIENT_ID"], source["GITHUB_CLIENT_SECRET"], "GitHub OAuth") ?? mockPair,
    google:
      pair(source["GOOGLE_CLIENT_ID"], source["GOOGLE_CLIENT_SECRET"], "Google OAuth") ?? mockPair,
    oauthMock,
    authRateLimit,
    hosted,
  };
}
