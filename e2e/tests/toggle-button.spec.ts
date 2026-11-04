import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

for (const impl of implementations) {
  test.describe(`toggle button interactions (${impl})`, () => {
    test("exclusive group: one pressed value, cleared when pressed again", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "toggle-button", "exclusive"));
      const group = page.getByRole("group", { name: "Text alignment" });
      const press = (name: string) => {
        const button = group.getByRole("button", { name, exact: true });
        return isMobile ? button.tap() : button.click();
      };
      await expect(group.getByRole("button", { name: "Left" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await press("Center");
      await expect(group.getByRole("button", { name: "Center" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(group.getByRole("button", { name: "Left" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await press("Center");
      await expect(group.locator('[aria-pressed="true"]')).toHaveCount(0);
      await expect(group.getByRole("button", { name: "Justify" })).toBeDisabled();
    });

    test("multiple group toggles with the keyboard", async ({ page }) => {
      await openStory(page, storyId(impl, "toggle-button", "multiple"));
      const underline = page.getByRole("button", { name: "Underline" });
      await underline.focus();
      await page.keyboard.press("Space");
      await expect(underline).toHaveAttribute("aria-pressed", "true");
      await page.keyboard.press("Enter");
      await expect(underline).toHaveAttribute("aria-pressed", "false");
      await expect(page.getByRole("button", { name: "Bold" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    test("standalone buttons toggle; disabled ones don't", async ({ page }) => {
      await openStory(page, storyId(impl, "toggle-button", "disabled"));
      const disabled = page.getByRole("button", { name: "Disabled pressed" });
      await expect(disabled).toBeDisabled();
      await openStory(page, storyId(impl, "toggle-button", "sizes"));
      const small = page.getByRole("button", { name: "Small", exact: true });
      await small.click();
      await expect(small).toHaveAttribute("aria-pressed", "true");
      await small.click();
      await expect(small).toHaveAttribute("aria-pressed", "false");
    });
  });
}
