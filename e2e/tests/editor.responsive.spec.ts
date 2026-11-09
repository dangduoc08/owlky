import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

interface Box {
  width: number;
  height: number;
}

/** No page overflow, toolbar and content inside the editor, targets ≥ 24px and uncovered. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    // The editor and its preview (Markdown).
    const editors = [
      ...document.querySelectorAll<HTMLElement>("[data-ok-editor], [data-ok-markdown]"),
    ];
    for (const [i, editor] of editors.entries()) {
      const box = editor.getBoundingClientRect();
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`editor #${i}: beyond viewport`);
      for (const part of editor.querySelectorAll<HTMLElement>(
        "[data-ok-editor-toolbar], [data-ok-editor-content], pre",
      )) {
        if (part.getClientRects().length === 0) continue;
        if (part.scrollWidth > part.clientWidth + 1)
          problems.push(`editor #${i}: clipped ${part.tagName}`);
      }
    }
    const targets = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-ok-editor-toolbar] button, [data-ok-switch] input",
      ),
    ].filter((t) => t.getClientRects().length > 0);
    const boxes = targets.map((t) => t.getBoundingClientRect());
    for (const [i, target] of targets.entries()) {
      const box = boxes[i] as DOMRect;
      if (box.height < 24 || box.width < 24)
        problems.push(`target #${i}: ${box.width}×${box.height}`);
      for (const [j, other] of boxes.entries()) {
        if (j <= i) continue;
        const overlap =
          box.left < other.right - 0.5 &&
          other.left < box.right - 0.5 &&
          box.top < other.bottom - 0.5 &&
          other.top < box.bottom - 0.5;
        if (overlap) problems.push(`targets #${i} and #${j} overlap`);
      }
      target.scrollIntoView({ block: "center" });
      const c = target.getBoundingClientRect();
      const hit = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2);
      if (
        !hit ||
        !(target.contains(hit) || hit.contains(target) || target.parentElement?.contains(hit))
      )
        problems.push(`target #${i}: covered by ${hit?.tagName}`);
    }
    const result: Box[] = [
      ...editors,
      ...document.querySelectorAll<HTMLElement>("[data-ok-editor-toolbar]"),
    ].map((e) => ({
      width: Math.round(e.getBoundingClientRect().width),
      height: Math.round(e.getBoundingClientRect().height),
    }));
    const cells = [...document.querySelectorAll<HTMLElement>(".sb-editor-columns > *")];
    const columns = new Set(cells.map((e) => Math.round(e.getBoundingClientRect().top))).size;
    return { problems, boxes: result, columns };
  });
}

for (const viewport of viewports) {
  test.describe(`editor responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    test("layout checks pass and React matches HTML", async ({ browser, browserName }) => {
      test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        hasTouch: viewport.touch,
        isMobile: viewport.touch,
      });
      const results: Record<string, Box[]> = {};
      for (const impl of implementations) {
        const page = await context.newPage();
        await openStory(page, storyId(impl, "editor", "basic"));
        await expect(page.locator(".sb-editor-preview [data-ok-markdown] h4")).toBeVisible();
        await expect(page.locator(".hljs-keyword").first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const { problems, boxes, columns } = await measure(page);
        expect(problems, `${impl} editor`).toEqual([]);
        // Editor and preview sit side by side from 900px (the story's layout), stacked below.
        expect(columns, `${impl} columns`).toBe(viewport.width >= 900 ? 1 : 2);
        results[impl] = boxes;
      }
      expect(results["html"]).toEqual(results["react"]);
      await context.close();
    });
  });
}
