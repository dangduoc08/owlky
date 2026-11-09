import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** A Markdown story, rendered (HTML: by its page script). */
async function open(page: Page, impl: (typeof implementations)[number], story: string) {
  await openStory(page, storyId(impl, "markdown", story));
  const root = page.locator("[data-ok-markdown]").first();
  await expect(root.getByRole("heading", { level: 1 })).toHaveText("h1");
  await expect(root.locator(".hljs-keyword").first()).toBeVisible();
  return root;
}

for (const impl of implementations) {
  test.describe(`markdown (${impl})`, () => {
    for (const story of ["markdown-content", "html-content"]) {
      test(`${story}: renders every block of the reference`, async ({ page }) => {
        const root = await open(page, impl, story);
        await expect(root.getByRole("heading", { level: 2 })).toHaveText("h2");
        await expect(root.getByRole("heading", { level: 6 })).toHaveText(["List", "A table:"]);
        const boxes = root.getByRole("checkbox");
        await expect(boxes).toHaveCount(3);
        await expect(root.getByRole("checkbox", { name: "Draft the release notes" })).toBeChecked();
        await expect(
          root.getByRole("checkbox", { name: "Update the changelog" }),
        ).not.toBeChecked();
        await expect(boxes.first()).toBeDisabled();
        await expect(root.getByRole("cell", { name: "Here's this" })).toHaveCSS(
          "text-align",
          "right",
        );
        await expect(root.getByRole("columnheader", { name: "Description" })).toHaveCSS(
          "text-align",
          "center",
        );
        await expect(root.locator("pre code.hljs.language-javascript")).toContainText("FizzBuzz");
        await expect(root.locator("p > code")).toHaveText("Code inline");
        const image = root.getByRole("img", { name: "Abstract waves at dusk" });
        await expect(image).toBeVisible();
        expect(
          await image.evaluate((img) => (img as HTMLImageElement).naturalWidth),
        ).toBeGreaterThan(0);
        await expect(root.locator("blockquote :is(del, s)")).toHaveText("strikethrough");
        const link = root.getByRole("link", { name: "Link (https://www.example.com/)" });
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    }

    test("links are reachable by keyboard", async ({ page }) => {
      const root = await open(page, impl, "markdown-content");
      const link = root.getByRole("link").first();
      // Task boxes are disabled: the content's first tab stop is its first link.
      for (let i = 0; i < 5 && !(await link.evaluate((a) => a === document.activeElement)); i++)
        await page.keyboard.press("Tab");
      await expect(link).toBeFocused();
      await expect(link).toHaveCSS("text-decoration-line", "underline");
      const box = await link.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThan(0);
    });

    test("malicious content never runs script (S1, S3, S15)", async ({ page }) => {
      let dialogs = 0;
      page.on("dialog", (dialog) => {
        dialogs++;
        void dialog.dismiss();
      });
      await open(page, impl, "html-content");
      const evil = [
        '<img src="x" onerror="alert(1)">',
        '<a href="javascript:alert(2)" id="evil">evil</a>',
        "<script>alert(3)</script>",
        "<svg><script>alert(4)</script></svg>",
        '<iframe src="javascript:alert(5)"></iframe>',
        "[md](javascript:alert(6))",
      ].join("\n\n");
      // HTML: new source text renders at once. React: the story's content (same pipeline; unit
      // tests feed it the same inputs).
      if (impl === "html") {
        await page.evaluate((text) => {
          const source = document.querySelector("[data-ok-markdown-source]") as HTMLElement;
          source.textContent = text;
        }, evil);
        await expect(page.locator("[data-ok-markdown] a").first()).toHaveText("evil");
        for (const link of await page.locator("[data-ok-markdown] a").all()) {
          await expect(link).not.toHaveAttribute("href", /javascript/i);
          await link.click();
        }
        await expect(page.locator("[data-ok-markdown] :is(script, iframe, [onerror])")).toHaveCount(
          0,
        );
      } else {
        await expect(page.locator("[data-ok-markdown] :is(script, iframe, [onerror])")).toHaveCount(
          0,
        );
      }
      await page.waitForTimeout(100);
      expect(dialogs).toBe(0);
    });
  });
}
