import { expect, test } from "@playwright/test";

/** The published artifacts (dist) on a page with no framework and no build step. */
test.describe("plain HTML page with the CDN bundle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/plain-html/index.html");
    await page.waitForFunction(() => Boolean(window.MinimalTailwind));
  });

  test("applies the design tokens and exposes exactly one global", async ({ page }) => {
    await expect(page.locator("#primary-main")).toHaveCSS("background-color", "rgb(0, 167, 111)");
    const globals = await page.evaluate(() =>
      Object.keys(window).filter((key) => /minimal/i.test(key)),
    );
    expect(globals).toEqual(["MinimalTailwind"]);
    expect(await page.evaluate(() => window.MinimalTailwind?.active)).toBe(true);
  });

  test("loading the runtime script twice keeps a single runtime", async ({ page }) => {
    const before = await page.evaluate(() => window.MinimalTailwind?.version);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "../../packages/html/dist/minimal-tailwind.js";
          script.onload = () => resolve();
          document.head.append(script);
        }),
    );
    const same = await page.evaluate(() => {
      const slot = (globalThis as unknown as Record<symbol, { runtime: unknown }>)[
        Symbol.for("minimal-tailwind.runtime")
      ];
      return slot?.runtime === window.MinimalTailwind;
    });
    expect(same).toBe(true);
    expect(await page.evaluate(() => window.MinimalTailwind?.version)).toBe(before);
  });

  test("dark mode switches the token values", async ({ page }) => {
    await page.getByRole("button", { name: "Dark mode" }).click();
    expect(await page.evaluate(() => document.documentElement.dataset["mtTheme"])).toBe("dark");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(20, 26, 33)");
  });
});

declare global {
  interface Window {
    MinimalTailwind?: { version: string; active: boolean };
  }
}
