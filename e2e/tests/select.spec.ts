import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

for (const impl of implementations) {
  test.describe(`select (${impl})`, () => {
    test("basic: opens on a press, picks an option, the label floats, focus returns", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "select", "basic"));
      const field = page.getByRole("combobox", { name: "Age" });
      await expect(field).toHaveAttribute("aria-expanded", "false");
      if (isMobile) await field.tap();
      else await field.click();
      const listbox = page.getByRole("listbox", { name: "Age" });
      await expect(listbox).toBeVisible();
      await expect(field).toHaveAttribute("aria-expanded", "true");
      await expect(listbox.getByRole("option", { name: "Ten" })).toBeFocused();
      const option = listbox.getByRole("option", { name: "Twenty" });
      if (isMobile) await option.tap();
      else await option.click();
      await expect(listbox).toBeHidden();
      await expect(field).toHaveText("Twenty");
      await expect(field).toBeFocused();
      const label = page.locator("[data-ok-input-label]").first();
      const box = await label.boundingBox();
      const fieldBox = await field.boundingBox();
      expect((box?.y ?? 0) < (fieldBox?.y ?? 0)).toBe(true);
    });

    test("keyboard: arrows, Home, End, typeahead, Enter, Escape and Tab", async ({ page }) => {
      await openStory(page, storyId(impl, "select", "small-size"));
      const field = page.getByRole("combobox", { name: "Age" });
      await field.focus();
      await page.keyboard.press("ArrowDown");
      const listbox = page.getByRole("listbox", { name: "Age" });
      await expect(listbox.getByRole("option", { name: "None" })).toBeFocused();
      await page.keyboard.press("End");
      await expect(listbox.getByRole("option", { name: "Thirty" })).toBeFocused();
      await page.keyboard.press("Home");
      await page.keyboard.press("t");
      await expect(listbox.getByRole("option", { name: "Ten" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(field).toHaveText("Ten");
      await expect(field).toBeFocused();
      await page.keyboard.press("Space");
      await expect(listbox).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(listbox).toBeHidden();
      await expect(field).toBeFocused();
      await page.keyboard.press("End");
      await expect(listbox.getByRole("option", { name: "Thirty" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(listbox).toBeHidden();
      await expect(field).toBeFocused();
    });

    test("other props: disabled and read-only stay closed; error and required are exposed", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "select", "other-props"));
      const disabled = page.locator("#select-disabled");
      await expect(disabled).toHaveAttribute("aria-disabled", "true");
      await disabled.click({ force: true });
      await expect(disabled).toHaveAttribute("aria-expanded", "false");
      const readOnly = page.locator("#select-readonly");
      await readOnly.click();
      await expect(readOnly).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("#select-error")).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator("#select-error")).toHaveAccessibleDescription("Error");
      await expect(page.locator("#select-required")).toHaveAttribute("aria-required", "true");
    });

    test("multiple chips: options toggle and the menu stays open", async ({ page }) => {
      await openStory(page, storyId(impl, "select", "chips"));
      const field = page.locator("#select-chip");
      await field.click();
      const listbox = page.getByRole("listbox", { name: "Chip" });
      await listbox.getByRole("option", { name: "April Tucker" }).click();
      await expect(listbox).toBeVisible();
      await listbox.getByRole("option", { name: "Oliver Hansen" }).click();
      await page.keyboard.press("Escape");
      await expect(field.locator("[data-ok-chip-label]")).toHaveText(["Van Henry", "April Tucker"]);
    });

    test("selection indicators: the option's checkbox follows the value", async ({ page }) => {
      await openStory(page, storyId(impl, "select", "selection-indicators"));
      const field = page.locator("#select-checkmarks");
      await field.click();
      const option = page.getByRole("option", { name: "Omar Alexander" });
      await option.click();
      await expect(option.locator("input")).toBeChecked();
      await expect(field).toHaveText("Van Henry, Omar Alexander");
    });

    test("controlling the open state: a button opens the select", async ({ page }) => {
      await openStory(page, storyId(impl, "select", "open-state"));
      await page.getByRole("button", { name: "Open the select" }).click();
      const listbox = page.getByRole("listbox", { name: "Age" });
      await expect(listbox).toBeVisible();
      await listbox.getByRole("option", { name: "Thirty" }).click();
      await expect(page.locator("#select-open")).toHaveText("Thirty");
    });

    test("with a dialog: the menu opens over the modal dialog", async ({ page }) => {
      await openStory(page, storyId(impl, "select", "with-dialog"));
      await page.getByRole("button", { name: "Open select dialog" }).click();
      const dialog = page.getByRole("dialog", { name: "Fill the form" });
      await expect(dialog).toBeVisible();
      await dialog.locator("#select-dialog-age").click();
      await page
        .getByRole("listbox", { name: "Age" })
        .getByRole("option", { name: "Twenty" })
        .click();
      await expect(dialog.locator("#select-dialog-age")).toHaveText("Twenty");
      await expect(dialog).toBeVisible();
    });

    test("grouping: subheaders aren't options", async ({ page }) => {
      await openStory(page, storyId(impl, "select", "grouping"));
      await page.locator("#select-grouped").click();
      const listbox = page.getByRole("listbox", { name: "Grouping" });
      await expect(listbox.getByRole("option")).toHaveCount(5);
      await page.keyboard.press("ArrowDown");
      await expect(listbox.getByRole("option", { name: "Option 1" })).toBeFocused();
    });

    test("text field: the listbox select in a text field and a form control", async ({ page }) => {
      await openStory(page, storyId(impl, "text-field", "outlined"));
      const field = page.getByRole("combobox", { name: "Select", exact: true });
      await expect(field).toHaveAccessibleDescription("Please select your currency");
      await field.click();
      await page
        .getByRole("listbox", { name: "Select", exact: true })
        .getByRole("option", { name: "$" })
        .click();
      await expect(field).toHaveText("$");
      const form = page.getByRole("combobox", { name: "Form control select", exact: true });
      await form.click();
      await page
        .getByRole("listbox", { name: "Form control select", exact: true })
        .getByRole("option", { name: "¥" })
        .click();
      await expect(form).toHaveText("¥");
    });

    test("pagination items: the select changes the page size", async ({ page }) => {
      await openStory(page, storyId(impl, "pagination", "items"));
      await expect(page.locator(".sb-pagination-grid > li")).toHaveCount(12);
      await page.getByRole("combobox", { name: "Items per page" }).click();
      await page.getByRole("option", { name: "24" }).click();
      await expect(page.locator(".sb-pagination-grid > li")).toHaveCount(24);
      await expect(page.getByRole("button", { name: "Go to page 5" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Go to page 6" })).toHaveCount(0);
    });

    test("table pagination with API: category search and rows per page", async ({ page }) => {
      await openStory(page, storyId(impl, "table", "table-pagination-with-api"));
      const rows = page.locator("#table-api tbody tr:not([hidden])");
      await expect(rows).toHaveCount(5);
      await page.getByRole("combobox", { name: "Rows per page:" }).click();
      await page.getByRole("option", { name: "10", exact: true }).click();
      await expect(rows).toHaveCount(10);
      await page.getByRole("combobox", { name: "Category" }).click();
      await page.getByRole("option", { name: "Shoes" }).click();
      await page.getByRole("button", { name: "Search" }).click();
      await expect(rows).toHaveCount(10);
      for (const text of await rows.locator("td:nth-child(3)").allTextContents())
        expect(text).toBe("Shoes");
      await expect(page.getByText("1–10 of 16")).toBeVisible();
    });
  });
}
