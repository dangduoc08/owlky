import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { CONTRAST_EXEMPT } from "../tests/helpers.js";

/*
 * The website's static build (ADR-0040 decision 11): every page renders, axe in light and dark,
 * phone width, internal links, the Copy button, search, the HTML sandbox and the Markdown copies.
 */

const PAGES = [
  { path: "/", heading: "Owlky" },
  { path: "/get-started/", heading: "Get started" },
  { path: "/foundations/colors/", heading: "Colors" },
  { path: "/components/button/", heading: "Button" },
  { path: "/search/", heading: "Search" },
];

/** Opens a page with its scripts settled (hydrated: the theme menus show the saved values). */
async function open(page: Page, path: string, mode: "light" | "dark" = "light") {
  await page.addInitScript((theme) => {
    localStorage.setItem(
      "owlky:theme-settings",
      JSON.stringify({ mode: theme, preset: "default", font: "public-sans", fontSize: 16 }),
    );
  }, mode);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto(path, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-ok-theme", mode);
}

for (const { path, heading } of PAGES) {
  test(`${path} renders its content without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await open(page, path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.getByRole("navigation", { name: "Docs" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  for (const mode of ["light", "dark"] as const)
    test(`${path} has no axe violations (${mode})`, async ({ page }) => {
      await open(page, path, mode);
      let axe = new AxeBuilder({ page })
        .exclude("[data-demo-disabled]")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
      for (const selector of CONTRAST_EXEMPT) axe = axe.exclude(selector);
      const results = await axe.analyze();
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.help} ${v.nodes.map((n) => n.target).join(" | ")}`,
        ),
      ).toEqual([]);
    });

  test(`${path} fits a phone without horizontal scrolling`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page, path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
  });
}

test("internal links and Markdown copies resolve", async ({ page, request }) => {
  const links = new Set<string>(["/llms.txt", "/llms-full.txt"]);
  for (const { path } of PAGES) {
    await open(page, path);
    for (const href of await page
      .locator('a[href^="/"]')
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href") ?? "")))
      links.add(href.split("#")[0] ?? href);
  }
  const index = await (await request.get("/llms.txt")).text();
  for (const [, url] of index.matchAll(/\]\(https:\/\/owlky\.com(\/[^)]+)\)/g))
    links.add(url ?? "");
  expect(links.size).toBeGreaterThan(8);
  for (const link of links) {
    const response = await request.get(link);
    expect(response.status(), link).toBe(200);
  }
  expect(index).toContain("components/button.md");
  const button = await (await request.get("/components/button.md")).text();
  expect(button).toContain("| `variant` | `data-ok-variant` |");
});

test("the Copy button copies the code of the selected tab", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Clipboard permissions are Chromium-only in Playwright");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "/components/button/");
  const section = page.locator("[data-docs-code]").first();
  await section.getByRole("tab", { name: "HTML" }).click();
  const copy = section.getByRole("tabpanel").getByRole("button", { name: "Copy code" });
  await copy.click();
  await expect(copy).toHaveAttribute("data-docs-copy", "copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    '<button type="button" data-ok-button data-ok-variant="contained"',
  );
});

test("search finds the Button page", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("searchbox", { name: "Search the docs" }).fill("button");
  await page.getByRole("searchbox", { name: "Search the docs" }).press("Enter");
  await expect(page).toHaveURL(/\/search\/\?q=button/);
  await expect(
    page.locator("[data-site-results]").getByRole("link", { name: "Button" }),
  ).toHaveAttribute("href", "/components/button/");
});

test("Open HTML demo shows the example on its own page with the CDN bundle", async ({ page }) => {
  await open(page, "/components/button/", "dark");
  await page.getByRole("button", { name: "Open HTML demo" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const frame = page.frameLocator('iframe[title$="HTML demo"]');
  await expect(frame.locator("html")).toHaveAttribute("data-ok-theme", "dark");
  await expect(frame.locator("[data-ok-button]").first()).toBeVisible();
  // The sandbox runs the HTML runtime; the website itself never loads it.
  expect(await page.evaluate(() => "Owlky" in window)).toBe(false);
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
});

test("the theme menus switch and remember the theme", async ({ page }) => {
  // No seeded settings: the reload must read what the menus stored.
  await page.goto("/foundations/colors/", { waitUntil: "networkidle" });
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-ok-theme", "dark");
  await page.getByLabel("Preset", { exact: true }).selectOption("cyan");
  await expect(page.locator("html")).toHaveAttribute("data-ok-preset", "cyan");
  await page.getByRole("link", { name: "Button" }).first().click();
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-ok-preset", "cyan");
});
