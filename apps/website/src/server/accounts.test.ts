import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { account, mcpToolUsage, mcpUsage, personalAccessToken, session, user } from "./schema.js";
import { Browser, createTestServer, type TestServer } from "./test-utils.js";
import { hashToken } from "./tokens.js";
import { countRequest, countTools } from "./usage.js";

interface AccountBody {
  user: {
    name: string;
    email: string;
    providers: string[];
    marketingOptIn: boolean;
    marketingOptInAt: string;
  };
  tokens: { name: string }[];
}

let server: TestServer;
beforeAll(async () => {
  server = await createTestServer();
});
afterAll(() => server.close());

const accountOf = async (browser: Browser) => {
  const response = await browser.fetch("/api/auth/owlky/account");
  return { status: response.status, body: (await response.json()) as AccountBody };
};

describe("sign-in with the mock providers", () => {
  it("signs in with GitHub, stores the person, and keeps no IP address or user agent", async () => {
    const browser = new Browser(server);
    const { done, location } = await browser.signIn("github", "ada");
    expect(done.status).toBe(302);
    expect(location).toBe("/account/");
    const { status, body } = await accountOf(browser);
    expect(status).toBe(200);
    expect(body.user).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      providers: ["github"],
      marketingOptIn: false,
      marketingOptInAt: null,
      entitlements: [],
    });
    const sessions = await server.db.select().from(session);
    expect(sessions.length).toBeGreaterThan(0);
    for (const row of sessions) {
      expect(row.ipAddress).toBeNull();
      expect(row.userAgent).toBeNull();
    }
    // The provider's tokens served the sign-in only.
    for (const row of await server.db.select().from(account)) {
      expect(row.accessToken).toBeNull();
      expect(row.refreshToken).toBeNull();
      expect(row.idToken).toBeNull();
    }
  });

  it("links Google to the same account when the verified email matches", async () => {
    const browser = new Browser(server);
    await browser.signIn("google", "ada");
    const { body } = await accountOf(browser);
    expect(body.user.providers).toEqual(["github", "google"]);
    expect(
      await server.db.select().from(user).where(eq(user.email, "ada@example.com")),
    ).toHaveLength(1);
  });

  it("sets HttpOnly, SameSite=Lax session cookies with the owlky prefix", async () => {
    const browser = new Browser(server);
    const { done } = await browser.signIn("github", "grace");
    const cookies = done.headers.getSetCookie().join("\n");
    expect(cookies).toMatch(/owlky\.session_token=/);
    for (const line of done.headers.getSetCookie().filter((c) => c.includes("session_token"))) {
      expect(line).toMatch(/HttpOnly/i);
      expect(line).toMatch(/SameSite=Lax/i);
    }
  });

  it("answers 401 to the account endpoint without a session", async () => {
    expect((await accountOf(new Browser(server))).status).toBe(401);
  });

  it("signs out", async () => {
    const browser = new Browser(server);
    await browser.signIn("github", "grace");
    expect((await browser.fetch("/api/auth/sign-out", { json: {} })).status).toBe(200);
    expect((await accountOf(browser)).status).toBe(401);
  });

  it("offers only the providers that have credentials", async () => {
    const response = await new Browser(server).fetch("/api/auth/owlky/providers");
    expect(await response.json()).toEqual({ providers: ["github", "google"] });
  });
});

describe("CSRF", () => {
  it("refuses a cookie-carrying write from another origin", async () => {
    const browser = new Browser(server);
    await browser.signIn("github", "grace");
    const response = await browser.fetch("/api/auth/owlky/tokens/create", {
      json: { name: "Evil" },
      headers: { origin: "https://evil.example" },
    });
    expect(response.status).toBe(403);
    expect(
      await server.db
        .select()
        .from(personalAccessToken)
        .where(eq(personalAccessToken.name, "Evil")),
    ).toHaveLength(0);
  });

  it("refuses form-encoded bodies (no cross-site form posts)", async () => {
    const browser = new Browser(server);
    await browser.signIn("github", "grace");
    const response = await browser.fetch("/api/auth/owlky/tokens/create", {
      method: "POST",
      body: "name=Form",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(
      await server.db
        .select()
        .from(personalAccessToken)
        .where(eq(personalAccessToken.name, "Form")),
    ).toHaveLength(0);
  });

  it("refuses a redirect to another origin after sign-in", async () => {
    const browser = new Browser(server);
    const response = await browser.fetch("/api/auth/sign-in/social", {
      json: { provider: "github", callbackURL: "https://evil.example/" },
    });
    expect(response.status).toBe(403);
  });
});

describe("personal access tokens", () => {
  it("creates, lists, uses and revokes a token; only its hash is stored", async () => {
    const browser = new Browser(server);
    await browser.signIn("github", "grace");
    const created = await browser.fetch("/api/auth/owlky/tokens/create", {
      json: { name: "Laptop", expiresInDays: 30 },
    });
    expect(created.status).toBe(200);
    expect(created.headers.get("cache-control")).toBe("no-store");
    const token = (await created.json()) as { id: string; token: string; prefix: string };
    expect(token.token).toMatch(/^owlky_pat_[A-Za-z0-9_-]{43}$/);
    expect(token.token.startsWith(token.prefix)).toBe(true);

    const [row] = await server.db
      .select()
      .from(personalAccessToken)
      .where(eq(personalAccessToken.id, token.id));
    expect(row?.hash).toBe(hashToken(token.token));
    expect(JSON.stringify(row)).not.toContain(token.token);

    const { body } = await accountOf(browser);
    expect(body.tokens.map((t) => t.name)).toContain("Laptop");
    expect(JSON.stringify(body.tokens)).not.toContain(token.token);

    const revoked = await browser.fetch("/api/auth/owlky/tokens/revoke", {
      json: { id: token.id },
    });
    expect(revoked.status).toBe(200);
    expect(
      await server.db
        .select()
        .from(personalAccessToken)
        .where(eq(personalAccessToken.id, token.id)),
    ).toHaveLength(0);
    const again = await browser.fetch("/api/auth/owlky/tokens/revoke", { json: { id: token.id } });
    expect(again.status).toBe(404);
  });

  it("can't revoke another account's token", async () => {
    const owner = new Browser(server);
    await owner.signIn("github", "ada");
    const { id } = (await (
      await owner.fetch("/api/auth/owlky/tokens/create", { json: { name: "Mine" } })
    ).json()) as { id: string };
    const other = new Browser(server);
    await other.signIn("github", "grace");
    expect((await other.fetch("/api/auth/owlky/tokens/revoke", { json: { id } })).status).toBe(404);
    expect(
      await server.db.select().from(personalAccessToken).where(eq(personalAccessToken.id, id)),
    ).toHaveLength(1);
  });

  it("rejects empty or long names and bad lifetimes", async () => {
    const browser = new Browser(server);
    await browser.signIn("github", "grace");
    for (const json of [
      { name: " " },
      { name: "x".repeat(61) },
      { name: "Bad", expiresInDays: 0 },
      { name: "Bad", expiresInDays: 400 },
    ]) {
      const response = await browser.fetch("/api/auth/owlky/tokens/create", { json });
      expect(response.status, JSON.stringify(json)).toBe(400);
    }
  });
});

describe("marketing opt-in", () => {
  it("is off by default and stores the date of each change", async () => {
    const browser = new Browser(server);
    await browser.signIn("github", "grace");
    const on = await browser.fetch("/api/auth/owlky/marketing", { json: { optIn: true } });
    expect(on.status).toBe(200);
    let { body } = await accountOf(browser);
    expect(body.user.marketingOptIn).toBe(true);
    expect(Date.parse(body.user.marketingOptInAt)).toBeGreaterThan(Date.now() - 60_000);
    await browser.fetch("/api/auth/owlky/marketing", { json: { optIn: false } });
    ({ body } = await accountOf(browser));
    expect(body.user.marketingOptIn).toBe(false);
  });
});

describe("account deletion", () => {
  it("removes the account and every row that belongs to it", async () => {
    const browser = new Browser(server);
    // A person of their own, so other tests keep theirs.
    await browser.signIn("google", "grace");
    const { body } = await accountOf(browser);
    const [{ id } = { id: "" }] = await server.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, body.user.email));
    await browser.fetch("/api/auth/owlky/tokens/create", { json: { name: "Gone" } });
    await countRequest(server.db, id);
    await countTools(server.db, id, ["get_component"]);

    const deleted = await browser.fetch("/api/auth/delete-user", { json: {} });
    expect(deleted.status).toBe(200);
    for (const [table, column] of [
      [user, user.id],
      [session, session.userId],
      [account, account.userId],
      [personalAccessToken, personalAccessToken.userId],
      [mcpUsage, mcpUsage.userId],
      [mcpToolUsage, mcpToolUsage.userId],
    ] as const)
      expect(await server.db.select().from(table).where(eq(column, id))).toHaveLength(0);
    expect((await accountOf(browser)).status).toBe(401);
  });
});
