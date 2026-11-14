import { createHash, randomBytes } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { CONTRAST_EXEMPT } from "../tests/helpers.js";

/*
 * Accounts and the gated MCP server (ADR-0071 M2–M4), against the production build with the
 * mock OAuth providers (scripts/mock-oauth.mjs) and PGlite in memory: guests read the docs,
 * sign-in through GitHub and Google, tokens, the email opt-in, sign-out, deletion, and an MCP
 * client's OAuth sign-in resumed through the login and consent pages.
 *
 * The tests share one server (and its test people), so they run in order.
 */
test.describe.configure({ mode: "serial" });

async function signIn(
  page: Page,
  provider: "GitHub" | "Google",
  person: string,
  start = "/sign-in/",
) {
  await page.goto(start, { waitUntil: "networkidle" });
  const button = page.getByRole("button", { name: `Continue with ${provider}` });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByRole("heading", { name: `Mock ${provider} sign-in` })).toBeVisible();
  await page.getByRole("link", { name: `Continue as ${person}` }).click();
}

async function axe(page: Page) {
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
  ]);
  for (const selector of CONTRAST_EXEMPT) builder = builder.exclude(selector);
  const results = await builder.analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
  ).toEqual([]);
}

test("guests read the docs without an account; only the MCP server asks for one", async ({
  page,
  request,
}) => {
  for (const path of ["/", "/components/button/", "/get-started/", "/privacy/", "/terms/"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    expect(new URL(page.url()).pathname).toBe(path);
  }
  await expect(page.getByText("Draft for review")).toBeVisible();
  const mcp = await request.post("/mcp", { data: { jsonrpc: "2.0", id: 1, method: "tools/list" } });
  expect(mcp.status()).toBe(401);
  expect(mcp.headers()["www-authenticate"]).toContain("resource_metadata=");
  await page.goto("/account/", { waitUntil: "commit" });
  await expect(page).toHaveURL(/\/sign-in\/\?next=%2Faccount%2F|\/sign-in\/\?next=\/account\//);
});

test("the sign-in, privacy and terms pages have no axe violations", async ({ page }) => {
  for (const path of ["/sign-in/", "/privacy/", "/terms/"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await axe(page);
  }
});

test("signs in with GitHub, manages tokens and the email opt-in, and signs out", async ({
  page,
}) => {
  await signIn(page, "GitHub", "Ada Lovelace");
  await expect(page).toHaveURL(/\/account\/$/);
  await expect(page.getByRole("heading", { name: "Your account", level: 1 })).toBeVisible();
  await expect(page.getByText("Ada Lovelace · ada@example.com")).toBeVisible();
  await axe(page);

  // The opt-in is unticked until the person ticks it; the date is stored.
  const optIn = page.getByRole("checkbox", {
    name: "Email me about new Owlky features and offers",
  });
  await expect(optIn).not.toBeChecked();
  await optIn.check();
  await expect(page.getByText(/^Last changed on /)).toBeVisible();
  await expect(optIn).toBeChecked();

  // A token is shown once, then listed by its prefix only.
  await page.getByLabel("Token name").fill("Laptop");
  await page.getByRole("button", { name: "Create token" }).click();
  const secret = page.locator("[data-site-new-token]");
  await expect(secret).toHaveText(/^owlky_pat_/);
  const token = (await secret.textContent()) ?? "";
  const row = page.getByRole("row", { name: /Laptop/ });
  await expect(row).toBeVisible();
  await expect(row).not.toContainText(token);

  // The token opens the MCP server; the per-tool count appears on the account page.
  const call = await page.request.post("/mcp", {
    headers: { authorization: `Bearer ${token}`, accept: "application/json, text/event-stream" },
    data: {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "list_components", arguments: {} },
    },
  });
  expect(call.status()).toBe(200);
  await page.reload();
  await expect(page.getByRole("row", { name: /list_components/ })).toBeVisible();

  await page.getByRole("button", { name: "Revoke Laptop" }).click();
  const dialog = page.getByRole("dialog", { name: "Revoke this token?" });
  await dialog.getByRole("button", { name: "Revoke" }).click();
  await expect(page.getByRole("row", { name: /Laptop/ })).toHaveCount(0);
  const refused = await page.request.post("/mcp", {
    headers: { authorization: `Bearer ${token}` },
    data: { jsonrpc: "2.0", id: 1, method: "tools/list" },
  });
  expect(refused.status()).toBe(401);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/^http:\/\/[^/]+\/$/);
  await page.goto("/account/", { waitUntil: "commit" });
  await expect(page).toHaveURL(/\/sign-in\//);
});

test("signing in with Google and the same email opens the same account", async ({ page }) => {
  await signIn(page, "Google", "Ada Lovelace");
  await expect(page).toHaveURL(/\/account\/$/);
  await expect(page.getByText(/Signed in with GitHub and Google/)).toBeVisible();
});

test("a cancelled sign-in comes back with an error", async ({ page }) => {
  await page.goto("/sign-in/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Continue with GitHub" }).click();
  await page.getByRole("link", { name: "Cancel" }).click();
  await expect(page).toHaveURL(/\/sign-in\/\?error=/);
  await expect(
    page.getByRole("alert").filter({ hasText: "Sign-in didn't complete" }),
  ).toBeVisible();
});

test("an MCP client signs in through the browser: login, consent, code, token", async ({
  page,
  request,
}) => {
  const redirect = "http://127.0.0.1:33418/callback";
  const registered = await request.post("/api/auth/oauth2/register", {
    data: {
      client_name: "E2E MCP client",
      redirect_uris: [redirect],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
  });
  expect(registered.status()).toBeLessThan(300);
  const { client_id: clientId } = (await registered.json()) as { client_id: string };
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const origin = test.info().project.use.baseURL ?? "";
  const query = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirect,
    scope: "openid offline_access mcp",
    state: "e2e",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: `${origin}/mcp`,
  });
  // The client's redirect target isn't running: catch it.
  let code = "";
  await page.route(`${redirect}**`, async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get("state")).toBe("e2e");
    code = url.searchParams.get("code") ?? "";
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<title>Done</title><p>Done</p>",
    });
  });

  // Signed out: the authorization server sends the browser to the sign-in page first.
  await page.goto(`/api/auth/oauth2/authorize?${query}`);
  await expect(page).toHaveURL(/\/sign-in\/\?/);
  await page.getByRole("button", { name: "Continue with GitHub" }).click();
  await page.getByRole("link", { name: "Continue as Grace Hopper" }).click();
  // Then to the consent page, which names the client.
  await expect(page).toHaveURL(/\/oauth\/consent\/\?/);
  await expect(page.getByText("E2E MCP client")).toBeVisible();
  await expect(page.getByText("Use the Owlky MCP server with your account")).toBeVisible();
  await axe(page);
  await page.getByRole("button", { name: "Allow" }).click();
  await expect.poll(() => code).not.toBe("");

  const token = await request.post("/api/auth/oauth2/token", {
    form: {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirect,
      client_id: clientId,
      code_verifier: verifier,
      resource: `${origin}/mcp`,
    },
  });
  expect(token.status()).toBe(200);
  const { access_token: accessToken } = (await token.json()) as { access_token: string };
  const call = await request.post("/mcp", {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json, text/event-stream",
    },
    data: { jsonrpc: "2.0", id: 1, method: "tools/list" },
  });
  expect(call.status()).toBe(200);

  // The account page lists the client; disconnecting it refuses the token at once.
  await page.goto("/account/", { waitUntil: "commit" });
  await page.getByRole("button", { name: "Disconnect E2E MCP client" }).click();
  await expect(page.getByRole("button", { name: "Disconnect E2E MCP client" })).toHaveCount(0);
  const refused = await request.post("/mcp", {
    headers: { authorization: `Bearer ${accessToken}` },
    data: { jsonrpc: "2.0", id: 1, method: "tools/list" },
  });
  expect(refused.status()).toBe(401);
});

test("deleting the account removes it; signing in again starts a new one", async ({ page }) => {
  await signIn(page, "Google", "Alan Turing");
  await page
    .getByRole("checkbox", { name: "Email me about new Owlky features and offers" })
    .check();
  await expect(page.getByText(/^Last changed on /)).toBeVisible();
  await page.getByRole("button", { name: "Delete account" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  await dialog.getByRole("button", { name: "Delete account" }).click();
  await expect(page).toHaveURL(/\/\?account=deleted$/);
  await page.goto("/account/", { waitUntil: "commit" });
  await expect(page).toHaveURL(/\/sign-in\//);
  await signIn(page, "Google", "Alan Turing");
  await expect(
    page.getByRole("checkbox", { name: "Email me about new Owlky features and offers" }),
  ).not.toBeChecked();
});
