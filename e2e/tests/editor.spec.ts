import { expect, type Page, test } from "@playwright/test";
import { editorSelected, implementations, openStory, storyId } from "./helpers.js";

/** Both implementations of the story mounted: the editor and its preview (Markdown). */
async function open(page: Page, impl: (typeof implementations)[number]) {
  await openStory(page, storyId(impl, "editor", "basic"));
  const content = page.getByRole("textbox", { name: "Content" });
  await expect(content).toHaveAttribute("contenteditable", "true");
  await expect(page.locator(".sb-editor-preview [data-ok-markdown] h4")).toBeVisible();
  return content;
}

for (const impl of implementations) {
  test.describe(`editor (${impl})`, () => {
    test("formats text from the toolbar and shows it in the preview", async ({ page }) => {
      const content = await open(page, impl);
      await content.focus();
      await content.getByText("Plan the release").click();
      await page.keyboard.press("End");
      await page.keyboard.press("Shift+Home");
      await editorSelected(content);
      await page.getByRole("button", { name: "Italic" }).click();
      await expect(page.getByRole("button", { name: "Italic" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(content.locator("h4 em")).toHaveText("Plan the release");
      const preview = page.locator(".sb-editor-preview [data-ok-markdown]");
      await expect(preview.locator("h4 em")).toHaveText("Plan the release");
    });

    test("types, undoes and changes the block from the heading menu", async ({ page }) => {
      const content = await open(page, impl);
      // A double click on a one-word element selects it in every engine; End leaves the line.
      await content.focus();
      await content.locator("p > code").dblclick();
      await editorSelected(content);
      await page.keyboard.press("End");
      await page.keyboard.type(" Done.");
      await expect(content).toContainText("adds the packages. Done.");
      await page.keyboard.press("ControlOrMeta+z");
      await expect(content).not.toContainText("Done.");
      await page.getByRole("button", { name: "Paragraph" }).click();
      await page.getByRole("menuitem", { name: "Heading 2" }).click();
      await expect(content.locator("h2")).toContainText("adds the packages");
      await expect(page.getByRole("button", { name: "Heading 2" })).toBeVisible();
    });

    test("links the selection through the link dialog", async ({ page }) => {
      const content = await open(page, impl);
      // Focus first: on focus, ProseMirror restores its own selection in WebKit.
      await content.focus();
      await content.locator("strong").first().dblclick();
      await editorSelected(content);
      await page.getByRole("button", { name: "Insert link" }).click();
      const dialog = page.getByRole("dialog", { name: "Link URL" });
      await expect(dialog).toBeVisible();
      const field = dialog.getByRole("textbox");
      await field.fill("javascript:alert(1)");
      await expect(dialog.getByRole("button", { name: "Apply" })).toBeDisabled();
      await field.fill("example.com/design");
      await field.press("Enter");
      await expect(dialog).toBeHidden();
      await expect(content.locator('a[href="https://example.com/design"]')).toHaveText("Owlky");
    });

    test("is one tab stop with arrow keys; fullscreen leaves with Escape", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName === "webkit", "WebKit on macOS doesn't Tab to buttons (AGENTS.md).");
      await open(page, impl);
      const heading = page.getByRole("button", { name: "Heading 4" });
      await page.getByRole("switch", { name: "Full item" }).focus();
      await page.keyboard.press("Tab");
      await expect(heading).toBeFocused();
      await page.keyboard.press("End");
      const fullscreen = page.getByRole("button", { name: "Fullscreen" });
      await expect(fullscreen).toBeFocused();
      await page.keyboard.press("Enter");
      const root = page.locator("[data-ok-editor]").first();
      await expect(root).toHaveAttribute("data-ok-fullscreen", "");
      await expect(root).toHaveCSS("position", "fixed");
      // The page behind is dimmed and out of reach: Tab from the textbox wraps to the toolbar.
      const backdrop = root.locator(":scope > [data-ok-backdrop]");
      await expect(backdrop).toHaveAttribute("data-ok-open", "");
      await expect(backdrop).toBeVisible();
      await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("textbox", { name: "Content" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("combobox", { name: "Language" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(fullscreen).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(root).not.toHaveAttribute("data-ok-fullscreen", "");
      await expect(backdrop).toBeHidden();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("textbox", { name: "Content" })).toBeFocused();
    });

    test("keeps text transforms and lists heading levels in their own type", async ({ page }) => {
      const content = await open(page, impl);
      await expect(content.locator("strong > span")).toHaveCSS("text-transform", "uppercase");
      await expect(content.locator("p > span").first()).toHaveCSS("text-transform", "capitalize");
      await page.getByRole("button", { name: "Heading 4" }).click();
      const size = (name: string) =>
        page
          .getByRole("menuitem", { name })
          .evaluate((item) => Number.parseFloat(getComputedStyle(item).fontSize));
      expect(await size("Heading 1")).toBe(17);
      expect(await size("Heading 6")).toBe(12);
      expect(await size("Paragraph")).toBe(14);
    });

    test("the Full item switch hides the extra groups", async ({ page }) => {
      await open(page, impl);
      await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
      await page.getByRole("switch", { name: "Full item" }).click();
      await expect(page.getByRole("button", { name: "Undo" })).toBeHidden();
      await expect(page.getByRole("button", { name: "Code block" })).toBeHidden();
      await expect(page.getByRole("button", { name: "Bold" })).toBeVisible();
    });

    test("works with touch on a phone", async ({ browser, browserName }) => {
      test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();
      const content = await open(page, impl);
      await content.getByText("keeps").tap();
      await page.getByRole("button", { name: "Bullet list" }).tap();
      await expect(content.locator("ul li")).toContainText("keeps");
      await expect(page.getByRole("button", { name: "Bullet list" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await context.close();
    });
  });
}
