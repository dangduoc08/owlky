import { createMcpProtectedRequestHandler } from "@better-auth/mcp";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createOwlkyServer, TOOL_NAMES } from "@owlky/mcp-server";
import type { Server } from "./auth.js";
import { hasConsent } from "./clients.js";
import { manifestFor } from "./manifests.js";
import { looksLikeToken, MCP_SCOPE, verifyToken } from "./tokens.js";
import { countRequest, countTools, RATE_LIMIT } from "./usage.js";

/*
 * The remote MCP endpoint (ADR-0071 § 2, 4, 7, 8): Streamable HTTP, stateless (a new server and
 * transport per request, JSON responses, no sessions, no SSE stream), behind two credentials:
 *
 *   - an OAuth access token from this site's authorization server: a JWT bound to this resource
 *     (`aud`), checked against the site's own signing keys, with the `mcp` scope;
 *   - a personal access token (`owlky_pat_…`) from the account page.
 *
 * Unauthenticated requests get 401 with an RFC 9728 `WWW-Authenticate` challenge that points to
 * the protected-resource metadata, so MCP clients start the browser sign-in themselves. Each
 * request then counts against the account's window (60 per minute, 429 + Retry-After above it)
 * and `tools/call` requests add to the account's per-tool counts. Nothing of the request body is
 * stored or logged.
 */

/** Largest request body read (validate_markup's input is far smaller). */
export const MAX_BODY = 1_048_576;
const TOOLS = new Set<string>(TOOL_NAMES);

const CORS = {
  // Bearer credentials only (no cookies), so any origin may call it (browser-based clients).
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers":
    "WWW-Authenticate, Retry-After, Mcp-Session-Id, X-RateLimit-Limit, X-RateLimit-Remaining",
  "Access-Control-Max-Age": "86400",
} as const;

const jsonRpcError = (status: number, code: number, message: string, headers: HeadersInit = {}) =>
  new Response(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...headers },
  });

const withHeaders = (response: Response, headers: Record<string, string>) => {
  const merged = new Headers(response.headers);
  for (const [name, value] of Object.entries({ ...CORS, ...headers })) merged.set(name, value);
  return new Response(response.body, { status: response.status, headers: merged });
};

/** The resource URL of a version: `/mcp` (latest) or `/mcp/v0.1`. */
export const resourceUrl = (origin: string, version: string) =>
  version === "latest" ? `${origin}/mcp` : `${origin}/mcp/${version}`;

/** RFC 9728 § 3.1: the metadata URL inserts the well-known path before the resource's path. */
export const resourceMetadataUrl = (resource: string) => {
  const url = new URL(resource);
  return `${url.origin}/.well-known/oauth-protected-resource${url.pathname}`;
};

const challenge = (resource: string, description: string) =>
  jsonRpcError(401, -32001, description, {
    "WWW-Authenticate": `Bearer error="invalid_token", error_description="${description}", resource_metadata="${resourceMetadataUrl(resource)}", scope="${MCP_SCOPE}"`,
  });

/** Tool names of the `tools/call` messages in a JSON-RPC body (one message or a batch). */
export function calledTools(body: unknown): string[] {
  const messages = Array.isArray(body) ? body : [body];
  const tools: string[] = [];
  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    const { method, params } = message as { method?: unknown; params?: { name?: unknown } };
    if (method === "tools/call" && typeof params?.name === "string" && TOOLS.has(params.name))
      tools.push(params.name);
  }
  return tools;
}

type Verified = { userId: string; scopes: string[]; clientId: string; token: string };

// One key source per auth instance: the verifier caches key sets per source for five minutes.
const keySources = new WeakMap<Server["auth"], () => Promise<unknown>>();
const keySource = (server: Server) => {
  let source = keySources.get(server.auth);
  if (!source) {
    // The keys come from the auth instance itself, not over HTTP from the site's own /jwks.
    source = () => server.auth.api.getJwks();
    keySources.set(server.auth, source);
  }
  return source;
};

/** Verifies an OAuth access token for `resource`, then calls `next` (or answers 401 / 403). */
async function oauthCheck(
  server: Server,
  request: Request,
  resource: string,
  next: (request: Request, verified: Verified) => Promise<Response>,
) {
  const { baseURL } = await server.auth.$context;
  return createMcpProtectedRequestHandler(
    {
      issuer: baseURL,
      audience: resource,
      jwtVerifyOptions: { requiredClaims: ["azp", "sub"] },
      // The verifier accepts a function as the key source (typed as a URL only).
      jwksUrl: keySource(server) as unknown as string,
      requiredScopes: [MCP_SCOPE],
    },
    async (req, claims) => {
      // Disconnected on the account page (or the account is gone): refuse before expiry.
      if (!(await hasConsent(server.db, String(claims["sub"]), String(claims["azp"]))))
        return challenge(resource, "The client was disconnected from this account.");
      return next(req, {
        userId: String(claims["sub"]),
        scopes: String(claims["scope"] ?? "").split(" "),
        clientId: String(claims["azp"]),
        token: "",
      });
    },
  )(request);
}

/** Answers one HTTP request to `/mcp` (`version` "latest") or `/mcp/<version>`. */
export async function handleMcp(request: Request, version: string, server: Server) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const manifest = manifestFor(version);
  if (!manifest) return jsonRpcError(404, -32002, `MCP version ${version} isn't available.`);
  if (request.method !== "POST")
    return jsonRpcError(405, -32000, "This MCP server is stateless: send JSON-RPC with POST.", {
      Allow: "POST, OPTIONS",
    });
  const resource = resourceUrl(server.env.url, version);

  const serve = async (req: Request, verified: Verified): Promise<Response> => {
    const rate = await countRequest(server.db, verified.userId);
    if (!rate.allowed) {
      if ("unknownAccount" in rate) return challenge(resource, "The account no longer exists.");
      return jsonRpcError(
        429,
        -32003,
        `Rate limit: ${RATE_LIMIT} requests per minute. Retry in ${rate.retryAfter} s.`,
        {
          "Retry-After": String(rate.retryAfter),
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
        },
      );
    }
    const length = Number(req.headers.get("content-length") ?? 0);
    if (length > MAX_BODY) return jsonRpcError(413, -32600, "Request body too large.");
    const text = await req.text();
    if (text.length > MAX_BODY) return jsonRpcError(413, -32600, "Request body too large.");
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return jsonRpcError(400, -32700, "Parse error: the body isn't JSON.");
    }
    const mcp = createOwlkyServer({ manifest });
    // No session id generator: stateless.
    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    await mcp.connect(transport);
    const authInfo: AuthInfo = {
      token: verified.token,
      clientId: verified.clientId,
      scopes: verified.scopes,
      extra: { userId: verified.userId },
    };
    try {
      const response = await transport.handleRequest(req, { parsedBody: body, authInfo });
      const answer = await response.arrayBuffer();
      const tools = calledTools(body);
      if (tools.length && response.ok) await countTools(server.db, verified.userId, tools);
      return withHeaders(new Response(answer, response), {
        "X-RateLimit-Limit": String(RATE_LIMIT),
        "X-RateLimit-Remaining": String(rate.remaining),
        "Cache-Control": "no-store",
      });
    } finally {
      await mcp.close();
    }
  };

  const authorization = request.headers.get("authorization") ?? "";
  const [scheme = "", credential = ""] = authorization.split(/\s+/, 2);
  if (scheme.toLowerCase() === "bearer" && looksLikeToken(credential)) {
    const found = await verifyToken(server.db, credential);
    if (!found) return challenge(resource, "The personal access token is invalid or expired.");
    if (!found.scopes.includes(MCP_SCOPE))
      return challenge(resource, "The personal access token lacks the mcp scope.");
    return serve(request, { ...found, clientId: "personal-access-token", token: "" });
  }
  return withHeaders(await oauthCheck(server, request, resource, serve), {});
}
