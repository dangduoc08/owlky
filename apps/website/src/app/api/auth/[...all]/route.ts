import { getServer } from "../../../../server/auth.js";

// Better Auth: sign-in, callbacks, sessions, account endpoints and the OAuth 2.1 server.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handle = async (request: Request) => (await getServer()).auth.handler(request);

export const GET = handle;
export const POST = handle;
