"use client";

import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { createAuthClient } from "better-auth/react";

/*
 * The browser side of the accounts (ADR-0071): sign-in, sign-out, deletion and the OAuth consent
 * step. `oauthProviderClient` carries an MCP client's authorization request through sign-in and
 * consent, then sends the browser back to the client.
 */
export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [oauthProviderClient()],
});

/** Owlky's account endpoints (src/server/account-plugin.ts): same-origin JSON. */
export async function accountApi<T>(
  path: string,
  json?: unknown,
): Promise<{ status: number; data: T }> {
  const response = await fetch(`/api/auth/owlky/${path}`, {
    method: json === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: json === undefined ? {} : { "content-type": "application/json" },
    body: json === undefined ? null : JSON.stringify(json),
  });
  const data = (await response.json().catch(() => ({}))) as T;
  return { status: response.status, data };
}

/** A path on this site to go to after sign-in (`?next=`), never another origin. */
export function safeNext(value: string | null, fallback = "/account/"): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
