import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

for (const impl of implementations) {
  test.describe(`icon button, fab and button group (${impl})`, () => {
    test("icon buttons activate with pointer and keyboard and show a focus outline", async ({
      page,
      isMobile,
      browserName,
    }) => {
      await openStory(page, storyId(impl, "icon-button", "colors"));
      const button = page.getByRole("button", { name: "Primary" });
      await page.evaluate(() => {
        (window as unknown as { clicks: number }).clicks = 0;
        document.addEventListener("click", () => {
          (window as unknown as { clicks: number }).clicks += 1;
        });
      });
      if (isMobile) await button.tap();
      else await button.click();
      await button.focus();
      await page.keyboard.press("Enter");
      expect(await page.evaluate(() => (window as unknown as { clicks: number }).clicks)).toBe(2);
      test.skip(browserName === "webkit", "WebKit's default Tab skips buttons (macOS setting).");
      await page.getByRole("button", { name: "Inherit" }).focus();
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toHaveCSS("outline-width", "2px");
    });

    test("fabs darken on hover (hover-capable devices)", async ({ page, isMobile }) => {
      test.skip(isMobile, "No hover on touch devices.");
      await openStory(page, storyId(impl, "fab", "default"));
      const fab = page.getByRole("button", { name: "Primary" }).first();
      await fab.hover();
      await expect(fab).toHaveCSS("background-color", "rgb(79, 57, 246)");
      await expect(fab).toHaveCSS("box-shadow", "none");
    });

    test("disabled fabs and grouped buttons can't be activated", async ({ page }) => {
      await openStory(page, storyId(impl, "fab", "default"));
      for (const fab of await page.getByRole("button", { name: "Disabled" }).all()) {
        await expect(fab).toBeDisabled();
      }
      await openStory(page, storyId(impl, "button-group", "contained"));
      const disabled = page.getByRole("group", { name: "Disabled" });
      for (const button of await disabled.getByRole("button").all())
        await expect(button).toBeDisabled();
    });

    test("button groups are joined: no gap between buttons", async ({ page }) => {
      await openStory(page, storyId(impl, "button-group", "outlined"));
      const buttons = page.getByRole("group", { name: "Primary" }).getByRole("button");
      const a = await buttons.nth(0).boundingBox();
      const b = await buttons.nth(1).boundingBox();
      expect(Math.abs((b?.x ?? 0) - ((a?.x ?? 0) + (a?.width ?? 0)))).toBeLessThan(0.5);
    });
  });
}
