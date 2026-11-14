import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { afterAll, describe, expect, it } from "vitest";
import { mcpResources } from "./auth.js";
import { DEVELOPMENT_SECRET, readEnv } from "./env.js";
import { manifestFor, pinnedVersions } from "./manifests.js";
import { mockUrl } from "./oauth-mock.js";
import { hashToken, looksLikeToken } from "./tokens.js";

const SECRET = "s".repeat(32);

describe("environment", () => {
  it("works locally with no variables: PGlite, the development secret, no providers", () => {
    const env = readEnv({});
    expect(env).toMatchObject({
      url: "http://localhost:3000",
      secret: DEVELOPMENT_SECRET,
      databaseUrl: undefined,
      github: undefined,
      google: undefined,
      authRateLimit: true,
      hosted: false,
    });
    expect(readEnv({ PORT: "4369" }).url).toBe("http://localhost:4369");
  });

  it("refuses the development shortcuts on Vercel", () => {
    const hosted = {
      VERCEL: "1",
      BETTER_AUTH_URL: "https://owlky.com",
      BETTER_AUTH_SECRET: SECRET,
      DATABASE_URL: "postgres://user:password@host/db",
    };
    expect(readEnv(hosted).hosted).toBe(true);
    expect(() => readEnv({ ...hosted, BETTER_AUTH_SECRET: undefined })).toThrow(/SECRET/);
    expect(() => readEnv({ ...hosted, BETTER_AUTH_SECRET: DEVELOPMENT_SECRET })).toThrow(
      /development/,
    );
    expect(() => readEnv({ ...hosted, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
    expect(() => readEnv({ ...hosted, OWLKY_OAUTH_MOCK: "http://127.0.0.1:1" })).toThrow(/local/);
    expect(() => readEnv({ ...hosted, OWLKY_AUTH_RATE_LIMIT: "off" })).toThrow(/local/);
    expect(() => readEnv({ ...hosted, BETTER_AUTH_URL: "http://owlky.com" })).toThrow(/https/);
  });

  it("checks the URL, the secret length and provider pairs", () => {
    expect(() => readEnv({ BETTER_AUTH_URL: "https://owlky.com/docs" })).toThrow(/origin/);
    expect(() => readEnv({ BETTER_AUTH_SECRET: "short" })).toThrow(/32/);
    expect(() => readEnv({ GITHUB_CLIENT_ID: "id" })).toThrow(/both/);
    expect(readEnv({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" }).google).toEqual({
      clientId: "id",
      clientSecret: "secret",
    });
  });
});

describe("pinned manifests", () => {
  const dir = mkdtempSync(join(tmpdir(), "owlky-manifests-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const pin = (name: string, value: unknown) =>
    writeFileSync(join(dir, `${name}.json.gz`), gzipSync(JSON.stringify(value)));

  it("lists versions in release order and serves each pinned manifest", () => {
    mkdirSync(dir, { recursive: true });
    pin("v0.10", { format: 1, version: "0.10.0" });
    pin("v0.2", { format: 1, version: "0.2.3" });
    pin("v1.0", { format: 2, version: "1.0.0" });
    writeFileSync(join(dir, "notes.txt"), "");
    expect(pinnedVersions(dir)).toEqual(["v0.2", "v0.10", "v1.0"]);
    expect(manifestFor("v0.2", dir)?.version).toBe("0.2.3");
    expect(manifestFor("v0.3", dir)).toBeUndefined();
    expect(manifestFor("../etc", dir)).toBeUndefined();
    expect(() => manifestFor("v1.0", dir)).toThrow(/format/);
    expect(pinnedVersions(join(dir, "missing"))).toEqual([]);
  });

  it("names one OAuth resource per version", () => {
    expect(mcpResources("https://owlky.com", ["v0.1"])).toEqual({
      latest: "https://owlky.com/mcp",
      pinned: ["https://owlky.com/mcp/v0.1"],
    });
  });
});

describe("helpers", () => {
  it("maps only the providers' HTTPS hosts to the mock", () => {
    const mock = "http://127.0.0.1:4499";
    expect(mockUrl(mock, "https://github.com/login/oauth/authorize?a=1")).toBe(
      `${mock}/github/login/oauth/authorize?a=1`,
    );
    expect(mockUrl(mock, "https://oauth2.googleapis.com/token")).toBe(
      `${mock}/google-oauth2/token`,
    );
    expect(mockUrl(mock, "https://example.com/")).toBe("https://example.com/");
    expect(mockUrl(mock, "http://github.com/")).toBe("http://github.com/");
    expect(mockUrl(mock, "/relative")).toBe("/relative");
  });

  it("hashes tokens with SHA-256 and recognizes their prefix", () => {
    expect(hashToken("owlky_pat_x")).toMatch(/^[0-9a-f]{64}$/);
    expect(looksLikeToken("owlky_pat_abc")).toBe(true);
    expect(looksLikeToken("eyJhbGciOi")).toBe(false);
  });
});
