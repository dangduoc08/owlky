import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Counts click events on the element matching `selector` (registered in the page). */
async function trackClicks(page: Page, name: string) {
  await page.evaluate((label) => {
    const target = [...document.querySelectorAll("[data-ok-button]")].find(
      (element) => element.textContent?.trim() === label,
    );
    (window as unknown as { clicks: number }).clicks = 0;
    target?.addEventListener("click", () => {
      (window as unknown as { clicks: number }).clicks += 1;
    });
  }, name);
  return () => page.evaluate(() => (window as unknown as { clicks: number }).clicks);
}

for (const impl of implementations) {
  test.describe(`button interactions (${impl})`, () => {
    test.beforeEach(async ({ page }) => {
      await openStory(page, storyId(impl, "button", "contained"));
    });

    test("activates with pointer, Enter and Space", async ({ page, isMobile }) => {
      const clicks = await trackClicks(page, "Primary");
      const button = page.getByRole("button", { name: "Primary", exact: true }).first();
      if (isMobile) await button.tap();
      else await button.click();
      await button.focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Space");
      expect(await clicks()).toBe(3);
    });

    test("disabled and loading buttons can't be activated or focused", async ({ page }) => {
      for (const name of ["Disabled", "Submit"]) {
        const button = page.getByRole("button", { name, exact: true }).first();
        await expect(button).toBeDisabled();
        await button.evaluate((element) => (element as HTMLElement).focus());
        await expect(button).not.toBeFocused();
      }
      await expect(
        page.getByRole("button", { name: "Submit", exact: true }).first(),
      ).toHaveAttribute("aria-busy", "true");
    });

    test("the link variant is a real link", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Documentation" }).first()).toHaveAttribute(
        "href",
        "/docs",
      );
    });

    test("hover darkens contained buttons on hover-capable devices", async ({ page, isMobile }) => {
      test.skip(isMobile, "No hover on touch devices.");
      const button = page.getByRole("button", { name: "Primary", exact: true }).first();
      await button.hover();
      await expect(button).toHaveCSS("background-color", "rgb(0, 120, 103)");
    });

    test("keyboard focus shows a visible outline", async ({ page, browserName }) => {
      test.skip(browserName === "webkit", "WebKit's default Tab skips buttons (macOS setting).");
      await page.getByRole("button", { name: "Inherit", exact: true }).first().focus();
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus");
      await expect(focused).toHaveCSS("outline-style", "solid");
      await expect(focused).toHaveCSS("outline-width", "2px");
    });
  });
}
