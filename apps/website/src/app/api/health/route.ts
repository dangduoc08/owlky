import { getServer } from "../../../server/auth.js";
import { health } from "../../../server/metadata.js";

// Health check: the database answers and the MCP versions it serves.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return health(await getServer());
}
