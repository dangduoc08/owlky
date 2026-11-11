import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/**
 * Text field utilities (roadmap batch F): copy to clipboard (4.20) in both implementations.
 * The clipboard is stubbed before the page loads: a real write could open a browser prompt.
 */
async function stubClipboard(page: Page, refuse = false) {
  await page.addInitScript((refused) => {
    const copied: string[] = [];
    Object.defineProperty(window, "__copied", { value: copied });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          if (refused) return Promise.reject(new DOMException("No", "NotAllowedError"));
          copied.push(text);
          return Promise.resolve();
        },
      },
    });
    // The copy command is the fallback after a refusal: refuse it too.
    if (refused) document.execCommand = () => false;
  }, refuse);
}

const copied = (page: Page) =>
  page.evaluate(() => (window as unknown as { __copied: string[] }).__copied.slice());

for (const impl of implementations) {
  test.describe(`text field: copy to clipboard (${impl})`, () => {
    test("the copy button copies the field's value and a toast announces it", async ({ page }) => {
      await stubClipboard(page);
      await openStory(page, storyId(impl, "text-field", "copy-to-clipboard"));
      const field = page.getByRole("textbox", { name: "Link" });
      await field.fill("https://example.com/typed");
      await page.getByRole("button", { name: "Copy", exact: true }).click();
      const toaster = page.locator("[data-ok-toaster-list][aria-live='polite']").first();
      await expect(toaster).toContainText("Copied!");
      expect(await copied(page)).toEqual(["https://example.com/typed"]);
    });

    test("the keyboard reaches the copy buttons", async ({ page }) => {
      await stubClipboard(page);
      await openStory(page, storyId(impl, "text-field", "copy-to-clipboard"));
      await page.getByRole("textbox", { name: "Link" }).focus();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Copy", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect.poll(() => copied(page)).toEqual(["https://www.npmjs.com/package/@owlky/react"]);
      await page.getByRole("button", { name: "Copy text" }).focus();
      await page.keyboard.press("Space");
      await expect
        .poll(async () => (await copied(page)).at(-1))
        .toMatch(/^Vestibulum ante .* non dolor\.$/);
    });

    test("a double click copies the paragraph, a single click doesn't", async ({ page }) => {
      await stubClipboard(page);
      await openStory(page, storyId(impl, "text-field", "copy-to-clipboard"));
      const paragraph = page.locator("#copy-text");
      await paragraph.click();
      await page.waitForTimeout(100);
      expect(await copied(page)).toEqual([]);
      await paragraph.dblclick();
      await expect.poll(() => copied(page)).toHaveLength(1);
      expect((await copied(page))[0]).toBe(
        (await paragraph.textContent())?.replace(/\s+/g, " ").trim(),
      );
    });

    test("a refused copy shows the error toast", async ({ page }) => {
      await stubClipboard(page, true);
      await openStory(page, storyId(impl, "text-field", "copy-to-clipboard"));
      await page.getByRole("button", { name: "Copy", exact: true }).click();
      await expect(page.locator("[data-ok-toaster-list]").first()).toContainText(
        "Couldn't copy. Select the text and copy it yourself.",
      );
    });
  });
}
