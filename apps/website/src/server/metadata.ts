import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider";
import { sql } from "drizzle-orm";
import type { Server } from "./auth.js";
import { manifestFor, pinnedVersions, VERSION_PATTERN } from "./manifests.js";
import { resourceUrl } from "./mcp-handler.js";
import { MCP_SCOPE } from "./tokens.js";

/*
 * Discovery documents for MCP clients (ADR-0071 § 3) and the health check.
 *
 *   - `/.well-known/oauth-protected-resource/mcp[/v0.1]` (RFC 9728): which authorization server
 *     protects each MCP endpoint and with which scope;
 *   - `/.well-known/oauth-authorization-server/api/auth` (RFC 8414) and
 *     `/.well-known/openid-configuration/api/auth`: the authorization server's endpoints,
 *     answered by Better Auth.
 */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=300",
  // Public documents: browser-based clients may read them (no credentials involved).
  "Access-Control-Allow-Origin": "*",
};

const notFound = () =>
  new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: JSON_HEADERS });

/** `segments` is the path after the well-known prefix: `["mcp"]`, `["mcp", "v0.1"]` or `[]`. */
export async function protectedResourceMetadata(server: Server, segments: readonly string[]) {
  const [first, version, ...rest] = segments;
  // The bare well-known URL describes the latest endpoint (clients that skip the path suffix).
  const target = first === undefined ? "latest" : first === "mcp" ? (version ?? "latest") : null;
  if (target === null || rest.length) return notFound();
  if (target !== "latest" && !(VERSION_PATTERN.test(target) && pinnedVersions().includes(target)))
    return notFound();
  const { baseURL } = await server.auth.$context;
  const { url } = server.env;
  return new Response(
    JSON.stringify({
      resource: resourceUrl(url, target),
      authorization_servers: [baseURL],
      bearer_methods_supported: ["header"],
      scopes_supported: [MCP_SCOPE],
      resource_name: target === "latest" ? "Owlky MCP" : `Owlky MCP ${target}`,
      resource_documentation: `${url}/get-started/`,
      resource_policy_uri: `${url}/privacy/`,
      resource_tos_uri: `${url}/terms/`,
    }),
    { headers: JSON_HEADERS },
  );
}

/** `segments` after `/.well-known/oauth-authorization-server`: must name the issuer path. */
export function authorizationServerMetadata(
  server: Server,
  request: Request,
  segments: readonly string[],
  kind: "oauth" | "openid",
) {
  if (segments.join("/") !== "api/auth" && segments.length) return notFound();
  const handler =
    kind === "oauth"
      ? oauthProviderAuthServerMetadata(server.auth, {
          headers: { "Access-Control-Allow-Origin": "*" },
        })
      : oauthProviderOpenIdConfigMetadata(server.auth, {
          headers: { "Access-Control-Allow-Origin": "*" },
        });
  return handler(request);
}

/** Liveness and versions; no account data. */
export async function health(server: Server) {
  let database = "ok";
  try {
    await server.db.execute(sql`select 1`);
  } catch {
    database = "unavailable";
  }
  const body = {
    status: database === "ok" ? "ok" : "degraded",
    mcp: { latest: manifestFor("latest")?.version ?? null, pinned: pinnedVersions() },
    database,
  };
  return new Response(JSON.stringify(body), {
    status: database === "ok" ? 200 : 503,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
