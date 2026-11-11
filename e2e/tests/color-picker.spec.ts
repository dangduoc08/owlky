import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Color pickers (roadmap 4.23): Radio and Checkbox swatches, Avatar color dots. */
for (const impl of implementations) {
  test.describe(`color pickers (${impl})`, () => {
    test("single: arrow keys and clicks pick one color; the swatch shows it", async ({ page }) => {
      await openStory(page, storyId(impl, "radio", "color-picker"));
      const orange = page.getByRole("radio", { name: "Orange" });
      const purple = page.getByRole("radio", { name: "Deep purple" });
      await expect(orange).toBeChecked();
      const swatch = (name: string) =>
        page
          .locator("[data-ok-radio]")
          .filter({ has: page.getByRole("radio", { name }) })
          .locator("[data-ok-radio-swatch]");
      await expect(swatch("Orange")).toHaveCSS("background-color", "rgb(255, 152, 0)");
      await expect(swatch("Orange")).toHaveCSS("width", "28px");
      await expect(swatch("Deep purple")).toHaveCSS("width", "20px");
      // Keyboard: the radio group's arrow keys.
      await orange.focus();
      await page.keyboard.press("ArrowRight");
      await expect(purple).toBeChecked();
      await expect(page.locator("#color-picker-value")).toHaveText("#673AB7");
      // Pointer.
      await page.getByRole("radio", { name: "Teal" }).click();
      await expect(page.locator("#color-picker-value")).toHaveText("#009688");
      await expect(swatch("Teal").locator("svg")).toBeVisible();
      await expect(swatch("Orange").locator("svg")).toBeHidden();
    });

    test("multiple: Space and clicks toggle colors, in the palette's order", async ({ page }) => {
      await openStory(page, storyId(impl, "checkbox", "color-picker"));
      const values = page.locator("#color-picker-values");
      await expect(values).toHaveText("#4CAF50, #00BCD4");
      const pink = page.getByRole("checkbox", { name: "Pink" });
      await pink.focus();
      await page.keyboard.press("Space");
      await expect(pink).toBeChecked();
      await expect(values).toHaveText("#4CAF50, #00BCD4, #E91E63");
      await page.getByRole("checkbox", { name: "Orange", exact: true }).click();
      await expect(values).toHaveText("#FF9800, #4CAF50, #00BCD4, #E91E63");
      await page.getByRole("checkbox", { name: "Green", exact: true }).click();
      await expect(values).toHaveText("#FF9800, #00BCD4, #E91E63");
      const lime = page
        .locator("[data-ok-checkbox]")
        .filter({ has: page.getByRole("checkbox", { name: "Lime" }) })
        .locator("[data-ok-checkbox-swatch]");
      await expect(lime).toHaveCSS("background-color", "rgb(205, 220, 57)");
      await expect(lime).toHaveCSS("border-radius", "6px");
    });

    test("preview: color dots and a text surplus, named as a whole", async ({ page }) => {
      await openStory(page, storyId(impl, "avatar", "color-preview"));
      const group = page.getByRole("img", { name: /^19 colors: Orange/ });
      await expect(group).toBeVisible();
      const dots = group.locator("[data-ok-swatch]");
      await expect(dots).toHaveCount(6);
      await expect(dots.first()).toHaveCSS("background-color", "rgb(255, 152, 0)");
      await expect(dots.first()).toHaveCSS("width", "16px");
      await expect(group.locator("[data-ok-avatar-surplus]")).toHaveText("+13");
      await expect(group.locator("[data-ok-avatar-surplus]")).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
    });
  });
}
