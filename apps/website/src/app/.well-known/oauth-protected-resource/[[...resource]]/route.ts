import { getServer } from "../../../../server/auth.js";
import { protectedResourceMetadata } from "../../../../server/metadata.js";

// RFC 9728 protected-resource metadata for /mcp and the pinned versions.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ resource?: string[] }> };

export async function GET(_request: Request, { params }: Context) {
  return protectedResourceMetadata(await getServer(), (await params).resource ?? []);
}
