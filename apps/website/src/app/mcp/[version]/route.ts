import { getServer } from "../../../server/auth.js";
import { handleMcp } from "../../../server/mcp-handler.js";

// The remote MCP server pinned to a release: `/mcp/v0.1` (ADR-0071 § 8).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ version: string }> };

const handle = async (request: Request, { params }: Context) =>
  handleMcp(request, (await params).version, await getServer());

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
export const OPTIONS = handle;
