import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CLIENT_TTL,
  clientAddress,
  countRegistration,
  deleteAbandonedClients,
  REGISTRATION_LIMIT,
  REGISTRATION_WINDOW,
} from "./registrations.js";
import { oauthClient, oauthConsent, oauthRegistrationWindow, user } from "./schema.js";
import { Browser, createTestServer, type TestServer } from "./test-utils.js";

let server: TestServer;
let adaId: string;

beforeAll(async () => {
  server = await createTestServer();
  await new Browser(server).signIn("github", "ada");
  const [row] = await server.db.select().from(user).where(eq(user.email, "ada@example.com"));
  adaId = row?.id ?? "";
});
afterAll(() => server.close());

const register = (address: string, name = "Test MCP client") =>
  new Browser(server).fetch("/api/auth/oauth2/register", {
    json: {
      client_name: name,
      redirect_uris: ["http://127.0.0.1:33418/callback"],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    headers: { origin: "", "x-forwarded-for": `${address}, 10.0.0.1` },
  });

const clientIdOf = async (response: Response) =>
  ((await response.json()) as { client_id: string }).client_id;

describe("client address", () => {
  it("reads the proxy's headers", () => {
    expect(clientAddress(new Headers({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientAddress(new Headers({ "x-forwarded-for": " 203.0.113.8 , 10.0.0.1" }))).toBe(
      "203.0.113.8",
    );
    expect(clientAddress(new Headers())).toBe("unknown");
  });
});

describe("registration limit per address", () => {
  it(`accepts ${REGISTRATION_LIMIT} registrations per window, then answers 429`, async () => {
    for (let i = 0; i < REGISTRATION_LIMIT; i++)
      expect((await register("198.51.100.1")).status).toBeLessThan(300);
    const refused = await register("198.51.100.1");
    expect(refused.status).toBe(429);
    const retryAfter = Number(refused.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(REGISTRATION_WINDOW);
    expect(await refused.json()).toMatchObject({ error: "too_many_requests" });
    // Another address has its own window.
    expect((await register("198.51.100.2")).status).toBeLessThan(300);
  });

  it("stores a keyed hash, never the address", async () => {
    const rows = await server.db.select().from(oauthRegistrationWindow);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.key).toMatch(/^[0-9a-f]{64}$/);
      expect(row.key).not.toContain("198.51.100");
    }
  });

  it("starts a new window and deletes the rows of past ones", async () => {
    const address = "192.0.2.50";
    const now = new Date("2030-01-01T10:00:00Z");
    for (let i = 0; i < REGISTRATION_LIMIT; i++)
      expect(await countRegistration(server.db, "s".repeat(32), address, now)).toMatchObject({
        allowed: true,
      });
    expect(await countRegistration(server.db, "s".repeat(32), address, now)).toEqual({
      allowed: false,
      retryAfter: REGISTRATION_WINDOW,
    });
    const later = new Date(now.getTime() + REGISTRATION_WINDOW * 1000);
    expect(await countRegistration(server.db, "s".repeat(32), address, later)).toEqual({
      allowed: true,
      remaining: REGISTRATION_LIMIT - 1,
    });
    // Only the current window is left (the earlier tests' rows were in older windows).
    const starts = new Set(
      (await server.db.select().from(oauthRegistrationWindow)).map((row) => row.windowStart),
    );
    expect([...starts]).toEqual([Math.floor(later.getTime() / 1000)]);
  });
});

describe("clients without consent", () => {
  it("are deleted a day after they registered, by the next registration", async () => {
    const abandoned = await clientIdOf(await register("192.0.2.1", "Abandoned"));
    const consented = await clientIdOf(await register("192.0.2.1", "Consented"));
    const fresh = await clientIdOf(await register("192.0.2.1", "Fresh"));
    const old = new Date(Date.now() - CLIENT_TTL - 60_000);
    await server.db
      .update(oauthClient)
      .set({ createdAt: old })
      .where(inArray(oauthClient.clientId, [abandoned, consented]));
    await server.db.insert(oauthConsent).values({
      id: randomUUID(),
      clientId: consented,
      userId: adaId,
      scopes: ["openid", "mcp"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect((await register("192.0.2.2", "Trigger")).status).toBeLessThan(300);
    const left = (
      await server.db
        .select({ clientId: oauthClient.clientId })
        .from(oauthClient)
        .where(inArray(oauthClient.clientId, [abandoned, consented, fresh]))
    ).map((row) => row.clientId);
    expect(left.sort()).toEqual([consented, fresh].sort());
  });

  it("keeps clients that an account registered", async () => {
    const id = await clientIdOf(await register("192.0.2.3", "Owned"));
    await server.db
      .update(oauthClient)
      .set({ userId: adaId, createdAt: new Date(Date.now() - 2 * CLIENT_TTL) })
      .where(eq(oauthClient.clientId, id));
    expect(await deleteAbandonedClients(server.db)).toBe(0);
    const [row] = await server.db.select().from(oauthClient).where(eq(oauthClient.clientId, id));
    expect(row).toBeDefined();
  });
});
