/*
 * Mock OAuth providers for local runs and e2e (`OWLKY_OAUTH_MOCK`, refused on Vercel by env.ts).
 * Better Auth's GitHub and Google providers call fixed URLs, so in mock mode the server sends
 * those requests to `scripts/mock-oauth.mjs` instead, and the sign-in redirect points the browser
 * there too. Nothing else changes: the same provider code, state, PKCE and callbacks run.
 */

const HOSTS: Record<string, string> = {
  "github.com": "github",
  "api.github.com": "github-api",
  "accounts.google.com": "google",
  "oauth2.googleapis.com": "google-oauth2",
  "www.googleapis.com": "google-api",
};

/** `https://github.com/login/oauth/authorize?…` → `<mock>/github/login/oauth/authorize?…`. */
export function mockUrl(mock: string, value: string): string {
  if (!URL.canParse(value)) return value;
  const url = new URL(value);
  const prefix = url.protocol === "https:" ? HOSTS[url.hostname] : undefined;
  return prefix ? `${mock}/${prefix}${url.pathname}${url.search}` : value;
}

let installed: string | undefined;

/** Routes the server's provider requests to the mock (once per process). */
export function installMockFetch(mock: string): void {
  if (installed === mock) return;
  if (installed) throw new Error("website: the OAuth mock is already installed for another origin");
  installed = mock;
  const original = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const href = input instanceof Request ? input.url : String(input);
    const target = mockUrl(mock, href);
    if (target === href) return original(input, init);
    return original(input instanceof Request ? new Request(target, input) : target, init);
  }) as typeof fetch;
}
