import { getServer } from "../../../../server/auth.js";
import { authorizationServerMetadata } from "../../../../server/metadata.js";

// OpenID Connect discovery for the issuer at /api/auth (clients that look here first).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ issuer?: string[] }> };

export async function GET(request: Request, { params }: Context) {
  const segments = (await params).issuer ?? [];
  return authorizationServerMetadata(await getServer(), request, segments, "openid");
}
