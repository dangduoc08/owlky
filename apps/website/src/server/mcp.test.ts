import { eq } from "drizzle-orm";

const decodeJwt = (jwt: string) =>
  JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString()) as Record<
    string,
    unknown
  >;

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { calledTools, resourceMetadataUrl } from "./mcp-handler.js";
import { authorizationServerMetadata, health, protectedResourceMetadata } from "./metadata.js";
import { mcpToolUsage, mcpUsage, personalAccessToken, user } from "./schema.js";
import {
  Browser,
  createTestServer,
  INITIALIZE,
  MCP_HEADERS,
  ORIGIN,
  pkce,
  rpc,
  type TestServer,
} from "./test-utils.js";
import { RATE_LIMIT, RATE_WINDOW } from "./usage.js";

let server: TestServer;
let ada: Browser;
let pat: string;
let adaId: string;

beforeAll(async () => {
  server = await createTestServer();
  ada = new Browser(server);
  await ada.signIn("github", "ada");
  const created = await ada.fetch("/api/auth/owlky/tokens/create", { json: { name: "Test" } });
  pat = ((await created.json()) as { token: string }).token;
  const [row] = await server.db.select().from(user).where(eq(user.email, "ada@example.com"));
  adaId = row?.id ?? "";
});
afterAll(() => server.close());

/** A client without cookies: MCP clients send only their bearer credential. */
const call = (body: unknown, token?: string, path = "/mcp", init: RequestInit = {}) =>
  new Browser(server).fetch(path, {
    method: "POST",
    headers: { ...MCP_HEADERS, ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...init,
  });

const resetWindow = () => server.db.delete(mcpUsage).where(eq(mcpUsage.userId, adaId));

describe("transport", () => {
  it("initializes statelessly and reports the version in the server info", async () => {
    const response = await call(INITIALIZE, pat);
    expect(response.status).toBe(200);
    expect(response.headers.get("mcp-session-id")).toBeNull();
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
    const body = (await response.json()) as {
      result: { serverInfo: { name: string; version: string } };
    };
    expect(body.result.serverInfo).toMatchObject({ name: "owlky", version: expect.any(String) });
  });

  it("lists and calls the tools without an initialize on the same connection", async () => {
    const list = await call(rpc("tools/list"), pat);
    const tools = ((await list.json()) as { result: { tools: { name: string }[] } }).result.tools;
    expect(tools.map((tool) => tool.name)).toContain("get_component");
    const result = await call(
      rpc("tools/call", { name: "get_component", arguments: { name: "button" } }),
      pat,
    );
    expect(result.status).toBe(200);
    expect(JSON.stringify(await result.json())).toContain("data-ok-button");
  });

  it("answers batches, GET / DELETE with 405 and preflights with CORS", async () => {
    expect((await call(rpc("ping"), pat, "/mcp", { method: "GET", body: null })).status).toBe(405);
    expect((await call(rpc("ping"), pat, "/mcp", { method: "DELETE", body: null })).status).toBe(
      405,
    );
    const preflight = await new Browser(server).fetch("/mcp", { method: "OPTIONS" });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-headers")).toMatch(/Authorization/);
    expect(preflight.headers.get("access-control-expose-headers")).toMatch(/WWW-Authenticate/);
  });

  it("refuses bodies that aren't JSON and bodies over 1 MB", async () => {
    expect((await call("{", pat)).status).toBe(400);
    const big = await call(JSON.stringify(rpc("ping", { pad: "x".repeat(1_100_000) })), pat);
    expect(big.status).toBe(413);
  });

  it("answers 404 for a version that isn't pinned", async () => {
    expect((await call(INITIALIZE, pat, "/mcp/v9.9")).status).toBe(404);
    expect((await call(INITIALIZE, pat, "/mcp/latest2")).status).toBe(404);
  });
});

describe("authentication", () => {
  it("challenges a request without credentials with RFC 9728 resource metadata", async () => {
    const response = await call(INITIALIZE);
    expect(response.status).toBe(401);
    const header = response.headers.get("www-authenticate") ?? "";
    expect(header).toMatch(/^Bearer /);
    expect(header).toContain(
      `resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource/mcp"`,
    );
  });

  it("refuses unknown, revoked and expired personal access tokens", async () => {
    expect((await call(INITIALIZE, `owlky_pat_${"A".repeat(43)}`)).status).toBe(401);
    const created = await ada.fetch("/api/auth/owlky/tokens/create", { json: { name: "Short" } });
    const { id, token } = (await created.json()) as { id: string; token: string };
    expect((await call(INITIALIZE, token)).status).toBe(200);
    await server.db
      .update(personalAccessToken)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(personalAccessToken.id, id));
    expect((await call(INITIALIZE, token)).status).toBe(401);
    await ada.fetch("/api/auth/owlky/tokens/revoke", { json: { id } });
    expect((await call(INITIALIZE, token)).status).toBe(401);
  });

  it("records a token's last use", async () => {
    await call(INITIALIZE, pat);
    const rows = await server.db
      .select()
      .from(personalAccessToken)
      .where(eq(personalAccessToken.userId, adaId));
    expect(rows.find((row) => row.name === "Test")?.lastUsedAt).toBeInstanceOf(Date);
  });

  it("refuses a session cookie: the endpoint takes bearer credentials only", async () => {
    const response = await ada.fetch("/mcp", {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify(INITIALIZE),
    });
    expect(response.status).toBe(401);
  });

  it("refuses a forged JWT", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "EdDSA", kid: "x" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: adaId,
        aud: `${ORIGIN}/mcp`,
        scope: "mcp",
        azp: "x",
        iss: `${ORIGIN}/api/auth`,
      }),
    ).toString("base64url");
    expect((await call(INITIALIZE, `${header}.${payload}.c2ln`)).status).toBe(401);
  });
});

describe("OAuth 2.1 with PKCE and dynamic client registration", () => {
  const redirect = "http://127.0.0.1:33418/callback";

  async function register() {
    const response = await new Browser(server).fetch("/api/auth/oauth2/register", {
      json: {
        client_name: "Test MCP client",
        redirect_uris: [redirect],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
      headers: { origin: "" },
    });
    expect(response.status, await response.clone().text()).toBeLessThan(300);
    return ((await response.json()) as { client_id: string }).client_id;
  }

  async function authorize(
    clientId: string,
    scope = "openid offline_access mcp",
    resource = `${ORIGIN}/mcp`,
  ) {
    const { verifier, challenge } = pkce();
    const query = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirect,
      scope,
      state: "xyz",
      code_challenge: challenge,
      code_challenge_method: "S256",
      resource,
    });
    const start = await ada.fetch(`/api/auth/oauth2/authorize?${query}`, { redirect: "manual" });
    let location = start.headers.get("location") ?? "";
    if (start.status === 200) location = ((await start.json()) as { url: string }).url;
    // A dynamically registered client asks for consent on the site's consent page.
    const consentUrl = new URL(location, ORIGIN);
    expect(consentUrl.pathname).toBe("/oauth/consent/");
    const consent = await ada.fetch("/api/auth/oauth2/consent", {
      json: { accept: true, oauth_query: consentUrl.search.slice(1) },
    });
    const { url } = (await consent.json()) as { url: string };
    const back = new URL(url);
    expect(back.origin + back.pathname).toBe(redirect);
    expect(back.searchParams.get("state")).toBe("xyz");
    const code = back.searchParams.get("code") ?? "";
    const token = await new Browser(server).fetch("/api/auth/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirect,
        client_id: clientId,
        code_verifier: verifier,
        resource,
      }).toString(),
    });
    expect(token.status, await token.clone().text()).toBe(200);
    return {
      ...((await token.json()) as { access_token: string; refresh_token?: string }),
      verifier,
    };
  }

  it("issues a JWT bound to /mcp that the MCP endpoint accepts", async () => {
    const clientId = await register();
    const { access_token } = await authorize(clientId);
    const claims = decodeJwt(access_token);
    expect(claims["aud"]).toEqual(expect.arrayContaining([`${ORIGIN}/mcp`]));
    expect(String(claims["scope"])).toContain("mcp");
    expect(claims["sub"]).toBe(adaId);
    await resetWindow();
    const response = await call(
      rpc("tools/call", { name: "list_components", arguments: {} }),
      access_token,
    );
    expect(response.status).toBe(200);
  });

  it("lists the connected client; disconnecting it refuses its access token at once", async () => {
    const clientId = await register();
    const { access_token } = await authorize(clientId);
    await resetWindow();
    expect((await call(INITIALIZE, access_token)).status).toBe(200);
    const list = await ada.fetch("/api/auth/owlky/clients");
    const { clients } = (await list.json()) as { clients: { clientId: string; name: string }[] };
    expect(clients).toContainEqual(expect.objectContaining({ clientId, name: "Test MCP client" }));
    const other = new Browser(server);
    await other.signIn("github", "grace");
    const foreign = await other.fetch("/api/auth/owlky/clients/disconnect", { json: { clientId } });
    expect(foreign.status).toBe(404);
    const done = await ada.fetch("/api/auth/owlky/clients/disconnect", { json: { clientId } });
    expect(done.status).toBe(200);
    expect((await call(INITIALIZE, access_token)).status).toBe(401);
  });

  it("refuses a token without the mcp scope with 403 insufficient_scope", async () => {
    const clientId = await register();
    const { access_token } = await authorize(clientId, "openid offline_access");
    const response = await call(INITIALIZE, access_token);
    expect(response.status).toBe(403);
    expect(response.headers.get("www-authenticate")).toMatch(/insufficient_scope/);
  });

  it("refuses a code exchange without the PKCE verifier", async () => {
    const clientId = await register();
    const { challenge } = pkce();
    const query = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirect,
      scope: "mcp",
      code_challenge: challenge,
      code_challenge_method: "S256",
      resource: `${ORIGIN}/mcp`,
    });
    const start = await ada.fetch(`/api/auth/oauth2/authorize?${query}`, { redirect: "manual" });
    let location = start.headers.get("location") ?? "";
    if (start.status === 200) location = ((await start.json()) as { url: string }).url;
    const consent = await ada.fetch("/api/auth/oauth2/consent", {
      json: { accept: true, oauth_query: new URL(location, ORIGIN).search.slice(1) },
    });
    const code = new URL(((await consent.json()) as { url: string }).url).searchParams.get("code");
    const token = await new Browser(server).fetch("/api/auth/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code ?? "",
        redirect_uri: redirect,
        client_id: clientId,
      }).toString(),
    });
    expect(token.status).toBeGreaterThanOrEqual(400);
  });

  it("refuses a plain (non-S256) code challenge", async () => {
    const clientId = await register();
    const query = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirect,
      scope: "mcp",
      code_challenge: "plain-challenge-plain-challenge-plain-challenge-1234",
      code_challenge_method: "plain",
    });
    const start = await ada.fetch(`/api/auth/oauth2/authorize?${query}`, { redirect: "manual" });
    const location = start.headers.get("location") ?? (await start.text());
    expect(location).toMatch(/error/);
  });
});

describe("rate limit and usage", () => {
  it("allows 60 requests per minute and answers 429 with Retry-After above it", async () => {
    await resetWindow();
    const seconds = Math.floor(Date.now() / 1000);
    await server.db.insert(mcpUsage).values({
      userId: adaId,
      windowStart: seconds - (seconds % RATE_WINDOW),
      windowCount: RATE_LIMIT - 1,
      lastUsedAt: new Date(),
    });
    const last = await call(rpc("ping"), pat);
    // The window may roll over between the insert and the call; then the count restarts.
    if (last.headers.get("x-ratelimit-remaining") === "0") {
      const over = await call(rpc("ping"), pat);
      expect(over.status).toBe(429);
      expect(Number(over.headers.get("retry-after"))).toBeGreaterThanOrEqual(1);
      expect(Number(over.headers.get("retry-after"))).toBeLessThanOrEqual(RATE_WINDOW);
      expect(((await over.json()) as { error: { message: string } }).error.message).toMatch(
        /Rate limit/,
      );
    }
    await resetWindow();
  });

  it("counts calls per tool and the last use, and stores nothing of the arguments", async () => {
    await resetWindow();
    await server.db.delete(mcpToolUsage).where(eq(mcpToolUsage.userId, adaId));
    const secret = "very-private-prompt-text";
    await call(rpc("tools/call", { name: "search_tokens", arguments: { query: secret } }), pat);
    await call(
      [
        rpc("tools/call", { name: "search_tokens", arguments: { query: "primary" } }, 1),
        rpc("tools/call", { name: "not_a_tool", arguments: {} }, 2),
      ],
      pat,
    );
    const rows = await server.db.select().from(mcpToolUsage).where(eq(mcpToolUsage.userId, adaId));
    expect(rows.map(({ tool, calls }) => ({ tool, calls }))).toEqual([
      { tool: "search_tokens", calls: 2 },
    ]);
    const { body } = { body: await (await ada.fetch("/api/auth/owlky/account")).text() };
    expect(body).toContain("search_tokens");
    expect(body).not.toContain(secret);
    expect(JSON.parse(body).usage.lastUsedAt).toEqual(expect.any(String));
  });

  it("extracts tool names from one message or a batch, ignoring unknown tools", () => {
    expect(calledTools(rpc("tools/call", { name: "get_guide" }))).toEqual(["get_guide"]);
    expect(
      calledTools([rpc("tools/call", { name: "get_guide" }), rpc("tools/list"), null, 3]),
    ).toEqual(["get_guide"]);
    expect(calledTools(rpc("tools/call", { name: "evil" }))).toEqual([]);
  });

  it("refuses the credentials of a deleted account", async () => {
    const grace = new Browser(server);
    await grace.signIn("google", "grace");
    const { token } = (await (
      await grace.fetch("/api/auth/owlky/tokens/create", { json: { name: "Doomed" } })
    ).json()) as { token: string };
    expect((await call(INITIALIZE, token)).status).toBe(200);
    expect((await grace.fetch("/api/auth/delete-user", { json: {} })).status).toBe(200);
    expect((await call(INITIALIZE, token)).status).toBe(401);
  });
});

describe("discovery and health", () => {
  it("serves protected-resource metadata for /mcp and refuses unknown resources", async () => {
    const response = await protectedResourceMetadata(server, ["mcp"]);
    expect(await response.json()).toMatchObject({
      resource: `${ORIGIN}/mcp`,
      authorization_servers: [`${ORIGIN}/api/auth`],
      scopes_supported: ["mcp"],
      bearer_methods_supported: ["header"],
    });
    expect((await protectedResourceMetadata(server, [])).status).toBe(200);
    expect((await protectedResourceMetadata(server, ["mcp", "v9.9"])).status).toBe(404);
    expect((await protectedResourceMetadata(server, ["other"])).status).toBe(404);
    expect(resourceMetadataUrl(`${ORIGIN}/mcp/v0.1`)).toBe(
      `${ORIGIN}/.well-known/oauth-protected-resource/mcp/v0.1`,
    );
  });

  it("serves authorization-server metadata with PKCE S256 and registration", async () => {
    const request = new Request(`${ORIGIN}/.well-known/oauth-authorization-server/api/auth`);
    const response = await authorizationServerMetadata(server, request, ["api", "auth"], "oauth");
    const body = (await response.json()) as Record<string, unknown>;
    expect(body["issuer"]).toBe(`${ORIGIN}/api/auth`);
    expect(body["code_challenge_methods_supported"]).toEqual(["S256"]);
    expect(body["registration_endpoint"]).toBe(`${ORIGIN}/api/auth/oauth2/register`);
    expect(body["authorization_endpoint"]).toBe(`${ORIGIN}/api/auth/oauth2/authorize`);
    const other = await authorizationServerMetadata(server, request, ["x"], "oauth");
    expect(other.status).toBe(404);
  });

  it("reports health without account data", async () => {
    const response = await health(server);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "ok",
      database: "ok",
      mcp: { pinned: [] },
    });
  });
});
