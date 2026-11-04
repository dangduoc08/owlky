import { expect, test } from "@playwright/test";

/** The published artifacts (dist) on a page with no framework and no build step. */
test.describe("plain HTML page with the CDN bundle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/plain-html/index.html");
    await page.waitForFunction(() => Boolean(window.Owlky));
  });

  test("applies the design tokens and exposes exactly one global", async ({ page }) => {
    await expect(page.locator("#primary-main")).toHaveCSS("background-color", "rgb(0, 167, 111)");
    const globals = await page.evaluate(() =>
      Object.keys(window).filter((key) => /owlky/i.test(key)),
    );
    expect(globals).toEqual(["Owlky"]);
    expect(await page.evaluate(() => window.Owlky?.active)).toBe(true);
  });

  test("loading the runtime script twice keeps a single runtime", async ({ page }) => {
    const before = await page.evaluate(() => window.Owlky?.version);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "../../packages/html/dist/owlky.js";
          script.onload = () => resolve();
          document.head.append(script);
        }),
    );
    const same = await page.evaluate(() => {
      const slot = (globalThis as unknown as Record<symbol, { runtime: unknown }>)[
        Symbol.for("owlky.runtime")
      ];
      return slot?.runtime === window.Owlky;
    });
    expect(same).toBe(true);
    expect(await page.evaluate(() => window.Owlky?.version)).toBe(before);
  });

  test("dark mode switches the token values", async ({ page }) => {
    await page.getByRole("button", { name: "Dark mode" }).click();
    expect(await page.evaluate(() => document.documentElement.dataset["okTheme"])).toBe("dark");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(20, 26, 33)");
  });
});

declare global {
  interface Window {
    Owlky?: { version: string; active: boolean };
  }
}
