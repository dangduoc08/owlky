import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

for (const impl of implementations) {
  test.describe(`list (${impl})`, () => {
    test("simple: rows are 40px buttons with icons, 38px without", async ({ page }) => {
      await openStory(page, storyId(impl, "list", "simple"));
      const rows = page.locator("[data-ok-list-item-button]");
      await expect(rows).toHaveCount(4);
      const heights = await rows.evaluateAll((all) =>
        all.map((r) => Math.round(r.getBoundingClientRect().height)),
      );
      expect(heights).toEqual([40, 40, 38, 38]);
      await expect(page.getByRole("navigation", { name: "Main mailbox folders" })).toBeVisible();
    });

    test("nested: the Inbox button closes and opens the nested list", async ({ page }) => {
      await openStory(page, storyId(impl, "list", "nested"));
      const inbox = page.getByRole("button", { name: "Inbox" });
      const starred = page.getByRole("button", { name: "Starred" });
      await expect(inbox).toHaveAttribute("aria-expanded", "true");
      await expect(starred).toBeVisible();
      await inbox.click();
      await expect(inbox).toHaveAttribute("aria-expanded", "false");
      await expect(starred).toBeHidden();
      await inbox.press("Enter");
      await expect(inbox).toHaveAttribute("aria-expanded", "true");
      await expect(starred).toBeVisible();
    });

    test("selected: primary tint, marked with aria-current", async ({ page }) => {
      await openStory(page, storyId(impl, "list", "selected"));
      const drafts = page.getByRole("button", { name: "Drafts" });
      await expect(drafts).toHaveAttribute("aria-current", "true");
      await expect(drafts).toHaveCSS("background-color", "rgba(0, 167, 111, 0.08)");
    });

    test("controls: the row text labels the checkbox; the switch is labelled by its row", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "list", "controls"));
      const second = page.getByRole("checkbox", { name: "Line item 2" });
      await expect(second).not.toBeChecked();
      await page.getByText("Line item 2").click();
      await expect(second).toBeChecked();
      await expect(page.getByRole("button", { name: "Comments on line item 1" })).toBeVisible();
      await openStory(page, storyId(impl, "list", "switch"));
      await expect(page.getByRole("switch", { name: "Wi-Fi" })).toBeChecked();
      await expect(page.getByRole("switch", { name: "Bluetooth" })).not.toBeChecked();
      await expect(page.getByRole("list", { name: "Settings" })).toBeVisible();
    });

    test("drawer and divider stories use the List", async ({ page }) => {
      await openStory(page, storyId(impl, "drawer", "variants"));
      await expect(page.locator("nav > [data-ok-list]").first()).toBeAttached();
      await openStory(page, storyId(impl, "divider", "variants"));
      await expect(page.locator("[data-ok-list] > li > [data-ok-divider]")).toHaveCount(3);
    });
  });
}

test.describe("list touch", () => {
  test.use({ hasTouch: true });
  for (const impl of implementations) {
    test(`${impl}: a tap opens and closes the nested list`, async ({ page }) => {
      await openStory(page, storyId(impl, "list", "nested"));
      const inbox = page.getByRole("button", { name: "Inbox" });
      await inbox.tap();
      await expect(inbox).toHaveAttribute("aria-expanded", "false");
      await inbox.tap();
      await expect(inbox).toHaveAttribute("aria-expanded", "true");
    });
  }
});
