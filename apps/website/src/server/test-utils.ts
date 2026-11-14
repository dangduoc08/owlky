import { createHash, randomBytes } from "node:crypto";
// @ts-expect-error: a plain JavaScript script (no declarations).
import { startMockOAuth } from "../../scripts/mock-oauth.mjs";
import { createAuth, type Server } from "./auth.js";
import { openPglite } from "./db.js";
import { readEnv } from "./env.js";
import { handleMcp } from "./mcp-handler.js";

/*
 * An in-process website server for unit tests: PGlite in memory, the mock OAuth providers on a
 * free port, and a cookie jar that drives Better Auth's handler and the MCP handler with
 * web-standard Requests (no HTTP server for the app itself).
 */

export const ORIGIN = "http://localhost:4000";

export interface TestServer extends Server {
  readonly mockOrigin: string;
  close(): Promise<void>;
}

export async function createTestServer(): Promise<TestServer> {
  const mock = (await startMockOAuth(0)) as { origin: string; close(): Promise<void> };
  const env = readEnv({
    BETTER_AUTH_URL: ORIGIN,
    BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0123",
    OWLKY_PGLITE_DIR: "memory://",
    OWLKY_OAUTH_MOCK: mock.origin,
    OWLKY_AUTH_RATE_LIMIT: "off",
  });
  const db = await openPglite("memory://");
  return { env, db, auth: createAuth(env, db), mockOrigin: mock.origin, close: mock.close };
}

/** A browser: cookies kept across requests, `Origin` sent on writes like a same-site page. */
export class Browser {
  readonly cookies = new Map<string, string>();
  constructor(readonly server: TestServer) {}

  cookieHeader() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  keep(response: Response) {
    for (const line of response.headers.getSetCookie()) {
      const [pair = ""] = line.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (!value || /max-age=0/i.test(line)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return response;
  }

  /** A request to the app: `/api/auth/*` → Better Auth, `/mcp*` → the MCP handler. */
  async fetch(path: string, init: RequestInit & { json?: unknown } = {}) {
    const headers = new Headers(init.headers);
    if (this.cookies.size) headers.set("cookie", this.cookieHeader());
    const method = init.method ?? (init.json === undefined ? "GET" : "POST");
    if (method !== "GET" && !headers.has("origin")) headers.set("origin", ORIGIN);
    let body = init.body ?? null;
    if (init.json !== undefined) {
      headers.set("content-type", "application/json");
      body = JSON.stringify(init.json);
    }
    const request = new Request(new URL(path, ORIGIN), { ...init, method, headers, body });
    const url = new URL(request.url);
    const response = url.pathname.startsWith("/mcp")
      ? await handleMcp(request, url.pathname.split("/")[2] ?? "latest", this.server)
      : await this.server.auth.handler(request);
    return this.keep(response);
  }

  /** Signs in through the mock provider as `person`, like the sign-in page does. */
  async signIn(provider: "github" | "google", person: "ada" | "grace", callbackURL = "/account/") {
    const start = await this.fetch("/api/auth/sign-in/social", { json: { provider, callbackURL } });
    const started = (await start.clone().json()) as { url?: string };
    const url = started.url;
    if (!url) throw new Error(`sign-in: ${start.status} ${JSON.stringify(started)}`);
    const page = await fetch(url);
    const html = await page.text();
    const link = html.match(new RegExp(`href="(/approve[^"]*person=${person}[^"]*)"`))?.[1];
    if (!link) throw new Error(`mock: no approve link for ${person}`);
    const approve = await fetch(new URL(link.replaceAll("&amp;", "&"), url), {
      redirect: "manual",
    });
    const callback = approve.headers.get("location") ?? "";
    const done = await this.fetch(callback.replace(ORIGIN, ""));
    return { start, done, location: done.headers.get("location") };
  }
}

/** PKCE pair (S256). */
export function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** A JSON-RPC call to the MCP endpoint. */
export const rpc = (method: string, params: unknown = {}, id: number | string = 1) => ({
  jsonrpc: "2.0",
  id,
  method,
  params,
});

export const MCP_HEADERS = {
  accept: "application/json, text/event-stream",
  "content-type": "application/json",
  "mcp-protocol-version": "2025-06-18",
};

export const INITIALIZE = rpc("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "test", version: "1.0.0" },
});
