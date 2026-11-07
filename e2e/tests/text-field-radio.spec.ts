import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const labelScale = (locator: import("@playwright/test").Locator) =>
  locator.evaluate((input) => {
    const label = input
      .closest("[data-ok-text-field]")
      ?.querySelector("[data-ok-text-field-label]") as Element;
    return new DOMMatrix(getComputedStyle(label).transform).a;
  });

for (const impl of implementations) {
  test.describe(`text field and radio interactions (${impl})`, () => {
    test("text field: typing floats the label; Tab moves between fields", async ({ page }) => {
      await openStory(page, storyId(impl, "text-field", "outlined"));
      const inactive = page.getByRole("textbox", { name: "Inactive" });
      expect(await labelScale(inactive)).toBe(1);
      await inactive.click();
      await page.keyboard.type("Ada");
      await expect(inactive).toHaveValue("Ada");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("textbox", { name: /Activated/ })).toBeFocused();
      await expect.poll(() => labelScale(inactive)).toBe(0.75);
      await expect(page.getByRole("textbox", { name: "Disabled" }).first()).toBeDisabled();
    });

    test("text field: select changes; helper text describes the input", async ({ page }) => {
      await openStory(page, storyId(impl, "text-field", "filled"));
      const select = page.getByRole("combobox", { name: "Select", exact: true });
      await select.selectOption("USD");
      await expect(select).toHaveValue("USD");
      await expect(select).toHaveAccessibleDescription("Please select your currency");
      await expect(page.getByRole("textbox", { name: "Error" })).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    test("radio: click and arrow keys keep one selected", async ({ page }) => {
      await openStory(page, storyId(impl, "radio", "placement"));
      const top = page.getByRole("radio", { name: "Top" });
      const start = page.getByRole("radio", { name: "Start" });
      await expect(top).toBeChecked();
      await page.getByText("Start", { exact: true }).click();
      await expect(start).toBeChecked();
      await expect(top).not.toBeChecked();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("radio", { name: "Bottom" })).toBeChecked();
    });
  });
}

test("HTML: the reveal button shows the password", async ({ page }) => {
  await openStory(page, storyId("html", "text-field", "outlined"));
  const button = page.getByRole("button", { name: "Show password" });
  const input = page.locator("#outlined-adorned-password");
  await expect(input).toHaveAttribute("type", "password");
  await button.click();
  await expect(input).toHaveAttribute("type", "text");
  await expect(button).toHaveAttribute("aria-pressed", "true");
});

test("touch: tapping focuses a field and selects a radio", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  for (const impl of implementations) {
    const page = await context.newPage();
    await openStory(page, storyId(impl, "text-field", "standard"));
    const field = page.getByRole("textbox", { name: "Inactive" });
    await field.tap();
    await expect(field).toBeFocused();
    await openStory(page, storyId(impl, "radio", "sizes"));
    const small = page.getByRole("radio", { name: "Small" });
    await small.tap();
    await expect(small).toBeChecked();
  }
  await context.close();
});
