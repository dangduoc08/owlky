import { expect, test } from "@playwright/test";

/** The published artifacts (dist) on a page with no framework and no build step. */
test.describe("plain HTML page with the CDN bundle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/plain-html/index.html");
    await page.waitForFunction(() => Boolean(window.MinimalTailwind));
  });

  test("applies the CSS and exposes exactly one global", async ({ page }) => {
    const bg = await page
      .getByRole("button", { name: "Primary" })
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(0, 167, 111)");
    const globals = await page.evaluate(() =>
      Object.keys(window).filter((key) => /minimal/i.test(key)),
    );
    expect(globals).toEqual(["MinimalTailwind"]);
  });

  test("dialog works with zero custom JavaScript", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open dialog" });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Delete project?" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("loading the runtime script twice creates no duplicate listeners", async ({ page }) => {
    const first = await page.evaluate(() => window.MinimalTailwind);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "../../packages/html/dist/minimal-tailwind.js";
          script.onload = () => resolve();
          document.head.append(script);
        }),
    );
    const opens = await page.evaluate(() => {
      let count = 0;
      document.addEventListener("mt:dialog:open", () => count++);
      (document.querySelector("[data-mt-dialog-open]") as HTMLElement).click();
      return count;
    });
    expect(opens).toBe(1);
    expect(await page.evaluate(() => window.MinimalTailwind)).toEqual(first);
  });

  test("the theme switch toggles dark mode", async ({ page }) => {
    await page.getByRole("switch", { name: "Dark mode" }).check();
    expect(await page.evaluate(() => document.documentElement.dataset["mtTheme"])).toBe("dark");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(20, 26, 33)");
  });
});

declare global {
  interface Window {
    MinimalTailwind?: { version: string };
  }
}
