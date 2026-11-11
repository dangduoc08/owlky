import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/**
 * Text field utilities (roadmap batch F): copy to clipboard (4.20) and number input (4.24) in
 * both implementations.
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

for (const impl of implementations) {
  test.describe(`text field: number input (${impl})`, () => {
    test("the buttons step the value and stop at min", async ({ page }) => {
      await openStory(page, storyId(impl, "text-field", "number-input"));
      const field = page.getByRole("spinbutton", { name: "Quantity" });
      const root = page.locator("[data-ok-number-field]").first();
      const decrease = root.getByRole("button", { name: "Decrease" });
      const increase = root.getByRole("button", { name: "Increase" });
      await expect(field).toHaveValue("0");
      await expect(decrease).toBeDisabled();
      await increase.click();
      await increase.click();
      await expect(field).toHaveValue("2");
      await expect(field).toHaveAttribute("aria-valuenow", "2");
      await decrease.click();
      await expect(field).toHaveValue("1");
      await expect(decrease).toBeEnabled();
      // The buttons stay out of the tab order: Tab from the field leaves the group.
      await field.focus();
      await page.keyboard.press("Tab");
      await expect(increase).not.toBeFocused();
    });

    test("the keys step, jump to the bounds and typed text commits", async ({ page }) => {
      await openStory(page, storyId(impl, "text-field", "number-input"));
      const field = page.getByRole("spinbutton", { name: "Bedrooms" }).first();
      await field.focus();
      await page.keyboard.press("ArrowUp");
      await expect(field).toHaveValue("1");
      await page.keyboard.press("End");
      await expect(field).toHaveValue("10");
      await expect(page.getByRole("button", { name: "Increase" }).nth(1)).toBeDisabled();
      await page.keyboard.press("PageDown");
      await expect(field).toHaveValue("0");
      await page.keyboard.press("Shift+ArrowUp");
      await expect(field).toHaveValue("10");
      await page.keyboard.press("Home");
      await expect(field).toHaveValue("0");
      await field.fill("25");
      await page.keyboard.press("Enter");
      await expect(field).toHaveValue("10");
      await field.fill("x");
      // Shift+Tab: Firefox keeps the focus when Tab leaves the page's last control.
      await page.keyboard.press("Shift+Tab");
      await expect(field).toHaveValue("10");
      await expect(field).toHaveAccessibleDescription("Helper text");
    });

    test("a disabled field ignores its buttons", async ({ page }) => {
      await openStory(page, storyId(impl, "text-field", "number-input"));
      const field = page.getByRole("spinbutton", { name: "Bedrooms" }).nth(1);
      await expect(field).toBeDisabled();
      const root = page.locator("[data-ok-number-field]").nth(2);
      await expect(root.getByRole("button", { name: "Increase" })).toBeDisabled();
      await expect(root.getByRole("button", { name: "Decrease" })).toBeDisabled();
    });
  });
}

test("touch: tapping the number buttons steps the value", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  for (const impl of implementations) {
    const page = await context.newPage();
    await openStory(page, storyId(impl, "text-field", "number-input"));
    const root = page.locator("[data-ok-number-field]").first();
    await root.getByRole("button", { name: "Increase" }).tap();
    await expect(root.getByRole("spinbutton")).toHaveValue("1");
    const box = await root.getByRole("button", { name: "Increase" }).boundingBox();
    // Touch targets of at least 24 × 24 px (WCAG 2.5.8).
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await context.close();
});
