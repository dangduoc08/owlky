import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

for (const impl of implementations) {
  test.describe(`checkbox and switch interactions (${impl})`, () => {
    test("checkbox: click, label click and Space toggle; disabled doesn't", async ({ page }) => {
      await openStory(page, storyId(impl, "checkbox", "sizes"));
      const medium = page.getByRole("checkbox", { name: "Medium" });
      await expect(medium).toBeChecked();
      await page.getByText("Medium", { exact: true }).click();
      await expect(medium).not.toBeChecked();
      await medium.focus();
      await page.keyboard.press("Space");
      await expect(medium).toBeChecked();
      await openStory(page, storyId(impl, "checkbox", "basic"));
      const disabled = page.getByRole("checkbox", { name: "Disabled", exact: true });
      await disabled.click({ force: true });
      await expect(disabled).not.toBeChecked();
      // Mixed is exposed to assistive technology.
      await expect(
        page.getByRole("checkbox", { name: "Indeterminate", exact: true }),
      ).toHaveJSProperty("indeterminate", true);
    });

    test("switch: the thumb shows the icon for the state", async ({ page }) => {
      await openStory(page, storyId(impl, "switch", "customization"));
      const control = page.getByRole("switch", { name: "Icons", exact: true });
      const root = page.locator("[data-ok-switch]").filter({ has: control });
      await expect(root.locator("[data-ok-switch-checked-icon]")).toBeVisible();
      await expect(root.locator("[data-ok-switch-icon]")).toBeHidden();
      await control.click();
      await expect(root.locator("[data-ok-switch-icon]")).toBeVisible();
      await expect(root.locator("[data-ok-switch-checked-icon]")).toBeHidden();
    });

    test("checkbox: the parent selects all and shows mixed", async ({ page }) => {
      await openStory(page, storyId(impl, "checkbox", "indeterminate"));
      const parent = page.getByRole("checkbox", { name: "Parent" });
      const one = page.getByRole("checkbox", { name: "Child 1" });
      const two = page.getByRole("checkbox", { name: "Child 2" });
      await expect(parent).toHaveJSProperty("indeterminate", true);
      await two.click();
      await expect(parent).toBeChecked();
      await expect(parent).toHaveJSProperty("indeterminate", false);
      await parent.click();
      await expect(one).not.toBeChecked();
      await expect(two).not.toBeChecked();
      await one.click();
      await expect(parent).toHaveJSProperty("indeterminate", true);
    });

    test("switch: click, label click and Space toggle", async ({ page }) => {
      await openStory(page, storyId(impl, "switch", "sizes"));
      const small = page.getByRole("switch", { name: "Small" });
      await small.click();
      await expect(small).toBeChecked();
      await page.getByText("Small", { exact: true }).click();
      await expect(small).not.toBeChecked();
      await small.focus();
      await page.keyboard.press("Space");
      await expect(small).toBeChecked();
    });

    test("table: small checkboxes select rows; the Dense switch shrinks rows", async ({ page }) => {
      await openStory(page, storyId(impl, "table", "sorting-selecting"));
      const all = page.getByRole("checkbox", { name: "Select all desserts" });
      await expect(all).toHaveJSProperty("indeterminate", true);
      const box = all.locator("xpath=..");
      await expect(box).toHaveAttribute("data-ok-size", "small");
      await all.click();
      await expect(page.locator("tr[data-ok-selected]").first()).toBeVisible();
      const table = page.locator("table[data-ok-table]");
      await expect(table).toHaveAttribute("data-ok-size", "medium");
      await page.getByRole("switch", { name: "Dense" }).click();
      await expect(table).toHaveAttribute("data-ok-size", "small");
    });
  });
}

test("touch: tapping toggles a checkbox and a switch", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  for (const impl of implementations) {
    const page = await context.newPage();
    await openStory(page, storyId(impl, "checkbox", "placement"));
    const top = page.getByRole("checkbox", { name: "Top" });
    await top.tap();
    await expect(top).toBeChecked();
    await openStory(page, storyId(impl, "switch", "placements"));
    const end = page.getByRole("switch", { name: "End" });
    await end.tap();
    await expect(end).toBeChecked();
  }
  await context.close();
});
