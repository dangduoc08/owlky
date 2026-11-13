import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Phone input (roadmap 4.25, ADR-0061): typing, country changes and keyboard in both implementations. */
const demo = (page: Page, id: string) =>
  page.locator(".sb-phone-demo").filter({ has: page.locator(`#${id}`) });

/** The story's lists are built (React renders them; the HTML runtime fills them). */
const ready = (page: Page) =>
  expect(page.locator("[data-ok-phone-input-country] [role=option]").first()).toBeAttached();

for (const impl of implementations) {
  test.describe(`phone input (${impl})`, () => {
    test("formats as you type and selects the country of the number", async ({ page }) => {
      await openStory(page, storyId(impl, "phone-input", "phone-input"));
      await ready(page);
      const auto = demo(page, "phone-auto");
      const input = auto.getByRole("textbox", { name: "Phone number" });
      await input.pressSequentially("84912345678");
      await expect(input).toHaveValue("+84 912 345 678");
      await expect(auto.getByRole("combobox", { name: "Country" })).toContainText("Vietnam");
      await expect(auto.locator(".sb-phone-national")).toHaveText("0912 345 678");
      await expect(auto.locator(".sb-phone-raw")).toHaveText("+84912345678");
      // Backspace after a space removes the digit before it.
      await input.press("End");
      for (let i = 0; i < 3; i++) await input.press("Backspace");
      await expect(input).toHaveValue("+84 912 345");
      await input.press("Backspace");
      await expect(input).toHaveValue("+84 912 34");
    });

    test("picks a country with the keyboard and moves to the input", async ({ page }) => {
      await openStory(page, storyId(impl, "phone-input", "phone-input"));
      await ready(page);
      const field = demo(page, "phone-default-country");
      const select = field.getByRole("combobox", { name: "Country" });
      await expect(select).toContainText("Germany");
      await select.focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("listbox").filter({ visible: true })).toBeVisible();
      await page.keyboard.type("Austral", { delay: 20 });
      await expect(page.getByRole("option", { name: /^Australia/ })).toBeFocused();
      await page.keyboard.press("Enter");
      const input = field.getByRole("textbox", { name: "Phone number" });
      await expect(input).toBeFocused();
      await expect(select).toContainText("Australia");
      await page.keyboard.type("0298765432");
      await expect(input).toHaveValue("(02) 9876 5432");
      await expect(field.locator(".sb-phone-international")).toHaveText("+61 2 9876 5432");
    });

    test("keeps a fixed country and its calling code", async ({ page }) => {
      await openStory(page, storyId(impl, "phone-input", "phone-input"));
      await ready(page);
      const fixed = demo(page, "phone-fixed-international");
      await expect(fixed.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
      const input = fixed.getByRole("textbox", { name: "Phone number" });
      await input.fill("");
      await expect(input).toHaveValue("+61");
      await input.pressSequentially("31234");
      await expect(input).toHaveValue("+61 3 1234");
      await expect(demo(page, "phone-hide-select").getByRole("combobox")).toHaveCount(0);
    });

    test("shows the validation state in the helper text", async ({ page }) => {
      await openStory(page, storyId(impl, "phone-input", "validation"));
      await ready(page);
      const field = demo(page, "phone-validation");
      const input = field.getByRole("textbox", { name: "Phone number" });
      await input.pressSequentially("213");
      await input.press("Tab");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(field.getByText("Enter a valid phone number")).toBeVisible();
      await input.focus();
      await input.press("End");
      await page.keyboard.type("3734253");
      await expect(input).not.toHaveAttribute("aria-invalid", "true");
      await expect(field.getByText("We only call about your order")).toBeVisible();
    });

    test("draws image flags from the folder", async ({ page }) => {
      await openStory(page, storyId(impl, "phone-input", "image-flags"));
      await ready(page);
      const field = demo(page, "phone-image-flags");
      const trigger = field.getByRole("combobox", { name: "Country" });
      const flag = trigger.locator("img[data-ok-phone-input-flag-image]");
      await expect(flag).toHaveAttribute("src", "flags/au.svg");
      await expect(flag).toHaveAttribute("alt", "");
      await expect
        .poll(() => flag.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
      await trigger.click();
      const option = page.locator('[role="option"][data-ok-value="VN"]');
      await option.scrollIntoViewIfNeeded();
      await expect(option.locator("img")).toHaveAttribute("src", "flags/vn.svg");
      await option.click();
      await expect(trigger.locator("img")).toHaveAttribute("src", "flags/vn.svg");
    });
  });
}
