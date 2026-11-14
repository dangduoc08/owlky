// HTTP smoke test of the remote MCP server (ADR-0071 M4), against the production build
// (`pnpm website:build` first). It starts the mock OAuth providers and `next start` with PGlite in
// memory, then talks HTTP like a real client: discovery, a 401 challenge, sign-in through the
// mock GitHub, a personal access token, the OAuth 2.1 flow (dynamic registration, PKCE, consent,
// token) and MCP calls with both credentials. No secrets, no network beyond localhost.
//
//   pnpm --filter @owlky/website smoke:mcp          # PORT (default 4398) to change the port
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { join } from "node:path";
import { app } from "./content.mjs";
import { startMockOAuth } from "./mock-oauth.mjs";

const port = Number(process.env.PORT ?? 4398);
const base = `http://localhost:${port}`;
const mock = await startMockOAuth(0);
const server = spawn(join(app, "node_modules/.bin/next"), ["start", "-p", String(port)], {
  cwd: app,
  env: {
    ...process.env,
    PORT: String(port),
    BETTER_AUTH_URL: base,
    BETTER_AUTH_SECRET: "smoke-secret-smoke-secret-smoke-secret-0",
    OWLKY_PGLITE_DIR: "memory://",
    OWLKY_OAUTH_MOCK: mock.origin,
    NEXT_TELEMETRY_DISABLED: "1",
  },
  stdio: ["ignore", "inherit", "inherit"],
});

let failures = 0;
const check = (condition, label, detail = "") => {
  console.log(
    `${condition ? "ok  " : "FAIL"} ${label}${!condition && detail ? `: ${detail}` : ""}`,
  );
  if (!condition) failures++;
};

const cookies = new Map();
const keep = (response) => {
  for (const line of response.headers.getSetCookie()) {
    const [pair = ""] = line.split(";");
    const at = pair.indexOf("=");
    const value = pair.slice(at + 1);
    if (!value || /max-age=0/i.test(line)) cookies.delete(pair.slice(0, at));
    else cookies.set(pair.slice(0, at), value);
  }
  return response;
};
const site = async (path, { json, form, headers = {}, browser = true, ...init } = {}) => {
  const all = { ...headers };
  if (browser && cookies.size) all.cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  if (json !== undefined || form !== undefined) all.origin ??= base;
  if (json !== undefined) all["content-type"] = "application/json";
  if (form !== undefined) all["content-type"] = "application/x-www-form-urlencoded";
  const body =
    json !== undefined ? JSON.stringify(json) : form ? new URLSearchParams(form) : init.body;
  const method = init.method ?? (body === undefined ? "GET" : "POST");
  const response = await fetch(new URL(path, base), {
    ...init,
    method,
    headers: all,
    body,
    redirect: "manual",
  });
  return browser ? keep(response) : response;
};
const MCP = {
  accept: "application/json, text/event-stream",
  "content-type": "application/json",
  "mcp-protocol-version": "2025-06-18",
};
const rpc = (method, params = {}, id = 1) => JSON.stringify({ jsonrpc: "2.0", id, method, params });
const mcp = (body, token, path = "/mcp") =>
  site(path, {
    method: "POST",
    body,
    browser: false,
    headers: { ...MCP, ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${base}/api/health`)).status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("smoke: the server didn't start");
}

try {
  await waitForServer();
  const health = await (await site("/api/health", { browser: false })).json();
  check(health.status === "ok" && health.database === "ok", "health check", JSON.stringify(health));

  // Discovery from a 401, as MCP clients do it.
  const challenge = await mcp(rpc("initialize"));
  const header = challenge.headers.get("www-authenticate") ?? "";
  check(challenge.status === 401, "POST /mcp without credentials is 401");
  const metadataUrl = header.match(/resource_metadata="([^"]+)"/)?.[1] ?? "";
  check(
    metadataUrl === `${base}/.well-known/oauth-protected-resource/mcp`,
    "challenge names the resource metadata",
    header,
  );
  const resource = await (await fetch(metadataUrl)).json();
  check(
    resource.resource === `${base}/mcp`,
    "protected-resource metadata",
    JSON.stringify(resource),
  );
  const issuer = resource.authorization_servers?.[0] ?? "";
  const asUrl = `${new URL(issuer).origin}/.well-known/oauth-authorization-server${new URL(issuer).pathname}`;
  const as = await (await fetch(asUrl)).json();
  check(
    Boolean(as.registration_endpoint) && as.code_challenge_methods_supported?.includes("S256"),
    "authorization-server metadata",
    JSON.stringify(as).slice(0, 200),
  );
  check(
    (await fetch(`${base}/mcp/v9.9`, { method: "POST" })).status === 404,
    "unknown version is 404",
  );
  const page = await fetch(`${base}/components/button`, { redirect: "manual" });
  check(
    page.status === 308 && page.headers.get("location")?.endsWith("/components/button/"),
    "pages keep the trailing-slash redirect",
  );
  check((await fetch(`${base}/llms.txt`)).status === 200, "llms.txt is served");

  // Sign in through the mock GitHub.
  const start = await (
    await site("/api/auth/sign-in/social", {
      json: { provider: "github", callbackURL: "/account/" },
    })
  ).json();
  const consentPage = await (await fetch(start.url)).text();
  const approve = consentPage
    .match(/href="(\/approve[^"]*person=ada[^"]*)"/)?.[1]
    ?.replaceAll("&amp;", "&");
  const back = await fetch(new URL(approve, start.url), { redirect: "manual" });
  const signedIn = await site(
    new URL(back.headers.get("location")).pathname + new URL(back.headers.get("location")).search,
  );
  check(
    signedIn.status === 302 && [...cookies.keys()].some((k) => k.includes("session_token")),
    "sign-in with the mock GitHub",
  );

  // A personal access token.
  const created = await (
    await site("/api/auth/owlky/tokens/create", { json: { name: "Smoke" } })
  ).json();
  check(/^owlky_pat_/.test(created.token ?? ""), "personal access token created");
  const init = await mcp(
    rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "smoke", version: "1" },
    }),
    created.token,
  );
  const info = (await init.json()).result?.serverInfo;
  check(
    init.status === 200 && info?.name === "owlky" && typeof info.version === "string",
    "initialize with the token",
    JSON.stringify(info),
  );
  const tools = (await (await mcp(rpc("tools/list"), created.token)).json()).result?.tools ?? [];
  check(tools.length === 6, "tools/list returns six tools", String(tools.length));
  const call = await (
    await mcp(
      rpc("tools/call", { name: "get_component", arguments: { name: "button" } }),
      created.token,
    )
  ).json();
  check(JSON.stringify(call).includes("data-ok-button"), "tools/call get_component");

  // OAuth 2.1: dynamic registration, PKCE, consent, token.
  const redirect = "http://127.0.0.1:33418/callback";
  const client = await (
    await site(as.registration_endpoint, {
      json: {
        client_name: "Smoke client",
        redirect_uris: [redirect],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
      browser: false,
      headers: { origin: "" },
    })
  ).json();
  check(
    Boolean(client.client_id),
    "dynamic client registration",
    JSON.stringify(client).slice(0, 200),
  );
  const verifier = randomBytes(32).toString("base64url");
  const challengeValue = createHash("sha256").update(verifier).digest("base64url");
  const query = new URLSearchParams({
    response_type: "code",
    client_id: client.client_id,
    redirect_uri: redirect,
    scope: "openid offline_access mcp",
    state: "s1",
    code_challenge: challengeValue,
    code_challenge_method: "S256",
    resource: `${base}/mcp`,
  });
  const authorize = await site(`${as.authorization_endpoint.replace(base, "")}?${query}`);
  // A redirect for browsers; JSON (`{ redirect, url }`) for script clients.
  const next =
    authorize.headers.get("location") ??
    (authorize.status === 200 ? (await authorize.clone().json()).url : "/");
  const consentLocation = new URL(next, base);
  check(
    consentLocation.pathname === "/oauth/consent/",
    "authorize sends the browser to the consent page",
    `${authorize.status} ${consentLocation.href}`,
  );
  check((await site(consentLocation.pathname)).status === 200, "the consent page renders");
  const consent = await (
    await site("/api/auth/oauth2/consent", {
      json: { accept: true, oauth_query: consentLocation.search.slice(1) },
    })
  ).json();
  const code = new URL(consent.url).searchParams.get("code");
  const token = await (
    await site(as.token_endpoint.replace(base, ""), {
      form: {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirect,
        client_id: client.client_id,
        code_verifier: verifier,
        resource: `${base}/mcp`,
      },
      browser: false,
      headers: { origin: "" },
    })
  ).json();
  check(
    Boolean(token.access_token) && Boolean(token.refresh_token),
    "token endpoint issues access and refresh tokens",
    JSON.stringify(token).slice(0, 200),
  );
  const oauthCall = await mcp(
    rpc("tools/call", { name: "list_components", arguments: {} }),
    token.access_token,
  );
  check(oauthCall.status === 200, "tools/call with the OAuth access token");

  // Revocation.
  await site("/api/auth/owlky/tokens/revoke", { json: { id: created.id } });
  check((await mcp(rpc("ping"), created.token)).status === 401, "a revoked token is refused");
} catch (error) {
  failures++;
  console.error(error);
} finally {
  server.kill("SIGTERM");
  await mock.close();
}
console.log(failures ? `smoke:mcp: ${failures} failed` : "smoke:mcp: every check passed");
process.exit(failures ? 1 : 0);
