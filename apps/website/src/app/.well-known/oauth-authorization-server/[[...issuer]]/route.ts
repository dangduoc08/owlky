import { getServer } from "../../../../server/auth.js";
import { authorizationServerMetadata } from "../../../../server/metadata.js";

// RFC 8414 authorization-server metadata for the issuer at /api/auth.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ issuer?: string[] }> };

export async function GET(request: Request, { params }: Context) {
  const segments = (await params).issuer ?? [];
  return authorizationServerMetadata(await getServer(), request, segments, "oauth");
}
