import { expect, type Locator, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Opens a code editor story and waits until every editor in it has mounted Monaco. */
async function open(
  page: Page,
  impl: (typeof implementations)[number],
  story: string,
  theme: "light" | "dark" = "light",
) {
  await openStory(page, storyId(impl, "code-editor", story), theme);
  const roots = page.locator("[data-ok-code-editor], [data-ok-diff-editor]");
  await expect(roots.first()).toBeVisible();
  for (const root of await roots.all())
    await expect(root).toHaveAttribute("data-ok-status", "ready");
}

/** Monaco's text area (EditContext div or textarea) inside an editor root. */
const textbox = (root: Locator) => root.locator(".monaco-editor [role='textbox']").first();
const lines = (root: Locator) => root.locator(".view-lines").first();
const background = (root: Locator) =>
  root
    .locator(".monaco-editor-background")
    .first()
    .evaluate((e) => getComputedStyle(e).backgroundColor);

for (const impl of implementations) {
  test.describe(`code editor (${impl})`, () => {
    test("edits, changes language and theme, applies options", async ({ page, browserName }) => {
      await open(page, impl, "editor");
      const editor = page.locator("[data-ok-code-editor]").first();
      await expect(lines(editor)).toContainText("openTitles");
      await expect(textbox(editor)).toHaveAttribute("aria-label", /Source/);
      // Light Owlky theme: the paper background.
      expect(await background(editor)).toBe("rgb(255, 255, 255)");
      await page.getByLabel("Language").selectOption("python");
      await expect(editor).toHaveAttribute("data-ok-language", "python");
      await page.getByLabel("Theme").selectOption("vs-dark");
      await expect.poll(() => background(editor)).toBe("rgb(30, 30, 30)");
      await page.getByLabel("Theme").selectOption("auto");
      await expect.poll(() => background(editor)).toBe("rgb(255, 255, 255)");
      // Options: turn the minimap off through the JSON editor.
      await expect(editor.locator(".minimap").first()).toBeVisible();
      const options = page.locator("[data-ok-code-editor]").nth(1);
      // Select the word `true` (the only one) with the keyboard (touch has no double click).
      await lines(options).getByText("true", { exact: true }).click();
      // Word moves: Alt on macOS (Monaco reads WebKit as macOS here), Ctrl elsewhere.
      const word = browserName === "webkit" ? "Alt" : "Control";
      await page.keyboard.press(`${word}+ArrowLeft`);
      await page.keyboard.press(`${word}+Shift+ArrowRight`);
      await page.keyboard.insertText("false");
      await expect(lines(options)).toContainText('"enabled": false');
      await page.getByRole("button", { name: "Apply" }).click();
      await expect(editor).toHaveAttribute("data-ok-options", /"minimap":\{"enabled":false\}/);
      await expect
        .poll(() => editor.locator(".minimap").evaluate((e) => e.getBoundingClientRect().width))
        .toBe(0);
      // Invalid JSON is reported, not applied.
      await textbox(options).focus();
      await page.keyboard.press("ControlOrMeta+End");
      await page.keyboard.insertText(",");
      await page.getByRole("button", { name: "Apply" }).click();
      // Monaco has live regions of its own (role=alert): find ours by its text.
      await expect(
        page.getByRole("alert").filter({ hasText: "The options aren't valid JSON." }),
      ).toBeVisible();
    });

    test("typing reaches the editor; Ctrl+M lets Tab leave it", async ({ page, browserName }) => {
      await open(page, impl, "multi-model");
      const editor = page.locator("[data-ok-code-editor]");
      await lines(editor).getByText("Hello, Owlky").click();
      await page.keyboard.press("Home");
      await page.keyboard.type("// Greeting");
      await expect(lines(editor)).toContainText("// Greeting");
      // Shift+Tab outdents while focus stays inside Monaco.
      await page.keyboard.press("Shift+Tab");
      await expect(editor.locator(":focus")).toHaveCount(1);
      // Ctrl+M (macOS: Ctrl+Shift+M) turns "Tab moves focus" on: Shift+Tab reaches the File select.
      // (Monaco reads WebKit's user agent as macOS here.)
      await page.keyboard.press(browserName === "webkit" ? "Control+Shift+M" : "Control+M");
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByLabel("File", { exact: true }).first()).toBeFocused();
    });

    test("lists validation problems from the JSON worker", async ({ page }) => {
      await open(page, impl, "validation");
      const problems = page.locator(".sb-code-editor-problems li");
      await expect(problems.first()).toContainText(/Line 6, column \d+: Trailing comma/);
      await expect(page.locator("[data-ok-code-editor] .squiggly-error").first()).toBeAttached();
    });

    test("switches models and keeps each file's edits", async ({ page }) => {
      await open(page, impl, "multi-model");
      const editor = page.locator("[data-ok-code-editor]");
      await expect(lines(editor)).toContainText("Hello, Owlky");
      await lines(editor).getByText("Hello, Owlky").click();
      await page.keyboard.press("End");
      await page.keyboard.type(" // edited");
      await page.getByLabel("File", { exact: true }).first().selectOption("style.css");
      await expect(editor).toHaveAttribute("data-ok-path", "file:///style.css");
      await expect(lines(editor)).toContainText("font-family");
      await page.getByLabel("File", { exact: true }).first().selectOption("index.html");
      await expect(lines(editor)).toContainText("<h1>Hello</h1>");
      await page.getByLabel("File", { exact: true }).first().selectOption("script.js");
      await expect(lines(editor)).toContainText("// edited");
    });

    test("compares two texts in the diff editor", async ({ page }) => {
      await open(page, impl, "diff");
      const diff = page.locator("[data-ok-diff-editor]");
      await expect(diff.locator(".editor.original .view-lines")).toContainText(
        "Run the unit tests",
      );
      await expect(diff.locator(".editor.modified .view-lines")).toContainText(
        "Build the packages",
      );
      await expect(diff.locator(".line-insert, .char-insert").first()).toBeAttached();
      await expect(diff.locator(".line-delete, .char-delete").first()).toBeAttached();
    });

    test("follows the dark theme of the page", async ({ page }) => {
      await open(page, impl, "diff", "dark");
      const diff = page.locator("[data-ok-diff-editor]");
      // Dark Owlky theme: the dark paper background.
      expect(await background(diff)).toBe("rgb(28, 37, 46)");
    });
  });
}

test("the touch screen can place the cursor and type", async ({ page, browserName, isMobile }) => {
  test.skip(!isMobile || browserName !== "chromium", "Touch: the mobile project.");
  await open(page, "react", "validation");
  const editor = page.locator("[data-ok-code-editor]");
  await lines(editor).getByText('"private"').tap();
  await page.keyboard.type("x");
  await expect(lines(editor)).toContainText("x");
});
