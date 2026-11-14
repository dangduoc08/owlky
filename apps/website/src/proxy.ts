import { type NextRequest, NextResponse } from "next/server";

/*
 * Pages end with a slash (`/components/button/`, `trailingSlash`), but Next.js's automatic
 * redirect is off (`skipTrailingSlashRedirect`): MCP clients POST to `/mcp` and OAuth providers
 * call `/api/auth/callback/github` exactly as registered. This adds the slash to page paths only
 * (308, so the method is kept). The matcher keeps it off the API, MCP, metadata and file paths.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = new URL(request.url);
  if (pathname.endsWith("/")) return NextResponse.next();
  return NextResponse.redirect(new URL(`${pathname}/${search}`, request.url), 308);
}

export const config = {
  matcher: ["/((?!api(?:/|$)|mcp(?:/|$)|_next/|\\.well-known/|.*\\.[^/]*$).+)"],
};
