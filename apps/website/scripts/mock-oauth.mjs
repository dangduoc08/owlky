// Mock GitHub and Google OAuth providers for local runs and e2e (ADR-0071: no real accounts).
// The website sends its provider requests here when `OWLKY_OAUTH_MOCK` is set
// (src/server/oauth-mock.ts maps `https://github.com/…` to `<mock>/github/…`).
//
//   node scripts/mock-oauth.mjs            # http://localhost:4499 (MOCK_OAUTH_PORT to change it)
//
// The authorize page lists test people; choosing one redirects back with a code, like a real
// consent screen. Nothing is persisted. Never deploy this.
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

/** Test people, the same on both providers (account linking by verified email). */
export const PEOPLE = {
  ada: { id: 1001, login: "ada", name: "Ada Lovelace", email: "ada@example.com" },
  grace: { id: 1002, login: "grace", name: "Grace Hopper", email: "grace@example.com" },
  alan: { id: 1003, login: "alan", name: "Alan Turing", email: "alan@example.com" },
};
const CLIENT_ID = "mock-client";
const CLIENT_SECRET = "mock-secret";

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const b64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
/** An ID token Better Auth decodes after the code exchange (the exchange itself is the trust). */
const idToken = (person, nonce) =>
  [
    b64url({ alg: "RS256", typ: "JWT", kid: "mock" }),
    b64url({
      iss: "https://accounts.google.com",
      aud: CLIENT_ID,
      sub: String(person.id),
      email: person.email,
      email_verified: true,
      name: person.name,
      picture: `https://example.com/avatars/${person.login}.png`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...(nonce ? { nonce } : {}),
    }),
    "mock-signature",
  ].join(".");

async function body(request) {
  let text = "";
  for await (const chunk of request) text += chunk;
  const type = request.headers["content-type"] ?? "";
  if (type.includes("application/json")) return text ? JSON.parse(text) : {};
  return Object.fromEntries(new URLSearchParams(text));
}

/** Starts the mock on `port` (0: any free port). Resolves to `{ origin, close }`. */
export function startMockOAuth(port = Number(process.env.MOCK_OAUTH_PORT ?? 4499)) {
  const codes = new Map();
  const tokens = new Map();

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const send = (status, value, headers = {}) => {
      const json = typeof value !== "string";
      response.writeHead(status, {
        "content-type": json ? "application/json" : "text/html; charset=utf-8",
        ...headers,
      });
      response.end(json ? JSON.stringify(value) : value);
    };
    const provider = url.pathname.startsWith("/github")
      ? "GitHub"
      : url.pathname.startsWith("/google")
        ? "Google"
        : null;
    try {
      // Authorization pages: pick a person.
      if (
        url.pathname === "/github/login/oauth/authorize" ||
        url.pathname === "/google/o/oauth2/v2/auth"
      ) {
        if (url.searchParams.get("client_id") !== CLIENT_ID)
          return send(400, "<p>Unknown client_id</p>");
        const query = url.searchParams.toString();
        const links = Object.entries(PEOPLE)
          .map(
            ([key, person]) =>
              `<li><a href="/approve?${escapeHtml(query)}&amp;person=${key}&amp;provider=${provider}">Continue as ${escapeHtml(person.name)}</a></li>`,
          )
          .join("");
        return send(
          200,
          `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Mock ${provider} sign-in</title></head><body><main><h1>Mock ${provider} sign-in</h1><p>Test accounts only.</p><ul>${links}</ul><p><a href="/deny?${escapeHtml(query)}">Cancel</a></p></main></body></html>`,
        );
      }
      if (url.pathname === "/approve" || url.pathname === "/deny") {
        const redirect = new URL(url.searchParams.get("redirect_uri") ?? "");
        const state = url.searchParams.get("state");
        if (state) redirect.searchParams.set("state", state);
        if (url.pathname === "/deny") redirect.searchParams.set("error", "access_denied");
        else {
          const person = PEOPLE[url.searchParams.get("person") ?? ""];
          if (!person) return send(400, "<p>Unknown person</p>");
          const code = randomBytes(12).toString("hex");
          codes.set(code, {
            person,
            redirectUri: url.searchParams.get("redirect_uri"),
            nonce: url.searchParams.get("nonce"),
          });
          redirect.searchParams.set("code", code);
        }
        return send(302, "", { location: redirect.toString() });
      }
      // Code exchange (both providers).
      if (
        request.method === "POST" &&
        (url.pathname === "/github/login/oauth/access_token" ||
          url.pathname === "/google-oauth2/token")
      ) {
        const form = await body(request);
        const basic = request.headers.authorization?.startsWith("Basic ")
          ? Buffer.from(request.headers.authorization.slice(6), "base64").toString().split(":")
          : [];
        const clientId = form.client_id ?? basic[0];
        const clientSecret = form.client_secret ?? basic[1];
        const grant = codes.get(form.code);
        codes.delete(form.code);
        if (clientId !== CLIENT_ID || clientSecret !== CLIENT_SECRET || !grant)
          return send(400, { error: "invalid_grant" });
        if (grant.redirectUri !== form.redirect_uri) return send(400, { error: "invalid_grant" });
        const accessToken = `mock_${randomBytes(16).toString("hex")}`;
        tokens.set(accessToken, grant.person);
        return send(200, {
          access_token: accessToken,
          token_type: "bearer",
          scope: "read:user user:email",
          ...(url.pathname.startsWith("/google")
            ? { expires_in: 3600, id_token: idToken(grant.person, grant.nonce) }
            : {}),
        });
      }
      // GitHub's user API.
      const person = tokens.get(
        (request.headers.authorization ?? "").replace(/^(Bearer|token)\s+/i, ""),
      );
      if (url.pathname === "/github-api/user") {
        if (!person) return send(401, { message: "Bad credentials" });
        return send(200, {
          id: person.id,
          login: person.login,
          name: person.name,
          email: null,
          avatar_url: `https://example.com/avatars/${person.login}.png`,
        });
      }
      if (url.pathname === "/github-api/user/emails") {
        if (!person) return send(401, { message: "Bad credentials" });
        return send(200, [{ email: person.email, primary: true, verified: true }]);
      }
      return send(404, { error: "not_found" });
    } catch (error) {
      return send(500, { error: String(error) });
    }
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { origin } = await startMockOAuth();
  console.log(`mock OAuth providers: ${origin}`);
}
