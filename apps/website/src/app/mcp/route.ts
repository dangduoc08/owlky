import { getServer } from "../../server/auth.js";
import { handleMcp } from "../../server/mcp-handler.js";

// The remote MCP server, latest version (ADR-0071 § 2, 8).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handle = async (request: Request) => handleMcp(request, "latest", await getServer());

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
export const OPTIONS = handle;
