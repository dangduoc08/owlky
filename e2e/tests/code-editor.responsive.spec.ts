import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

interface Box {
  width: number;
  height: number;
}

/** No page overflow, editors inside the viewport, Monaco filling its frame, targets ≥ 24px. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const roots = [
      ...document.querySelectorAll<HTMLElement>("[data-ok-code-editor], [data-ok-diff-editor]"),
    ];
    for (const [i, root] of roots.entries()) {
      const box = root.getBoundingClientRect();
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`editor #${i}: beyond viewport`);
      const monaco = root.querySelector<HTMLElement>(".monaco-editor, .monaco-diff-editor");
      const inner = monaco?.getBoundingClientRect();
      // Monaco follows its frame (automaticLayout): same width, inside the 1px border.
      if (!inner || Math.abs(inner.width - (box.width - 2)) > 1.5)
        problems.push(`editor #${i}: Monaco is ${inner?.width}px in a ${box.width}px frame`);
    }
    const targets = [
      ...document.querySelectorAll<HTMLElement>(
        ".sb-code-editor-settings select, .sb-code-editor-settings button, [data-ok-toggle-button]",
      ),
    ].filter((t) => t.getClientRects().length > 0);
    for (const [i, target] of targets.entries()) {
      const box = target.getBoundingClientRect();
      if (box.height < 24 || box.width < 24)
        problems.push(`target #${i}: ${box.width}×${box.height}`);
    }
    const boxes: Box[] = roots.map((e) => ({
      width: Math.round(e.getBoundingClientRect().width),
      height: Math.round(e.getBoundingClientRect().height),
    }));
    const cells = [...document.querySelectorAll<HTMLElement>(".sb-code-editor-demo > *")];
    const rows = new Set(cells.map((e) => Math.round(e.getBoundingClientRect().top))).size;
    return { problems, boxes, rows };
  });
}

for (const viewport of viewports) {
  test.describe(`code editor responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const story of ["editor", "diff", "multi-model", "validation"]) {
      test(`${story}: layout checks pass and React matches HTML`, async ({
        browser,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.touch,
          isMobile: viewport.touch,
        });
        const results: Record<string, Box[]> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "code-editor", story));
          for (const root of await page
            .locator("[data-ok-code-editor], [data-ok-diff-editor]")
            .all())
            await expect(root).toHaveAttribute("data-ok-status", "ready");
          await page.evaluate(() => document.fonts.ready);
          // Monaco relayouts on a ResizeObserver: let it settle.
          await page.evaluate(
            () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
          );
          const { problems, boxes, rows } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          // Editor and settings sit side by side from 900px, stacked below.
          if (story === "editor") expect(rows, `${impl} rows`).toBe(viewport.width >= 900 ? 1 : 2);
          results[impl] = boxes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
