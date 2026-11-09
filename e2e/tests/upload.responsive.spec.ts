import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["single", "multiple", "avatar", "box", "validation", "states", "open-dialog"];
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** Adds the same files to every enabled input (several to multiple ones). */
async function addFiles(page: Page) {
  const inputs = page.locator("[data-ok-upload-input]:not(:disabled)");
  for (let i = 0; i < (await inputs.count()); i++) {
    const input = inputs.nth(i);
    const multiple = await input.evaluate((e: HTMLInputElement) => e.multiple);
    await input.setInputFiles(
      multiple
        ? [
            {
              name: "a-very-long-file-name-that-should-be-cut-with-an-ellipsis-on-small-screens.png",
              mimeType: "image/png",
              buffer: PNG,
            },
            { name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(2048) },
          ]
        : [{ name: "photo.png", mimeType: "image/png", buffer: PNG }],
    );
  }
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50))));
}

/**
 * No page overflow, no part wider than the upload, remove and action buttons at least 24px and
 * uncovered, file names cut with an ellipsis (never overflowing their row), and the boxes to
 * compare React with HTML.
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    for (const root of document.querySelectorAll<HTMLElement>("[data-ok-upload]")) {
      const outer = root.getBoundingClientRect();
      for (const part of root.querySelectorAll<HTMLElement>(
        "[data-ok-upload-zone], [data-ok-upload-item], [data-ok-upload-actions], [data-ok-upload-rejections]",
      )) {
        if (!part.checkVisibility()) continue;
        const box = part.getBoundingClientRect();
        if (box.right > outer.right + 0.5 || box.left < outer.left - 0.5)
          problems.push(
            `${part.getAttribute("data-ok-upload-item") ?? "part"} wider than the upload`,
          );
      }
      for (const name of root.querySelectorAll<HTMLElement>("[data-ok-upload-item-name]")) {
        const row = name.closest("[data-ok-upload-item]")?.getBoundingClientRect();
        const box = name.getBoundingClientRect();
        if (row && name.checkVisibility() && box.right > row.right) problems.push("name overflows");
      }
    }
    for (const target of document.querySelectorAll<HTMLElement>(
      "[data-ok-upload-remove], [data-ok-upload-actions] button, [data-ok-upload-open]",
    )) {
      if (!target.checkVisibility()) continue;
      const box = target.getBoundingClientRect();
      if (box.width < 24 || box.height < 24) problems.push(`target ${box.width}×${box.height}`);
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      if (!hit || !target.contains(hit)) problems.push(`target covered by ${hit?.tagName}`);
    }
    const boxes = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-ok-upload-zone], [data-ok-upload-item], [data-ok-upload-preview], [data-ok-upload-actions]",
      ),
    ].map((element) => {
      const box = element.getBoundingClientRect();
      return { width: Math.round(box.width), height: Math.round(box.height) };
    });
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`upload responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const story of STORIES) {
      test(`${story}: layout checks pass, with and without files, and React matches HTML`, async ({
        browser,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.touch,
          isMobile: viewport.touch,
        });
        const results: Record<string, unknown> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "upload", story));
          await page.evaluate(() => document.fonts.ready);
          const empty = await measure(page);
          expect(empty.problems, `${impl} ${story} empty`).toEqual([]);
          await addFiles(page);
          const full = await measure(page);
          expect(full.problems, `${impl} ${story} with files`).toEqual([]);
          results[impl] = [empty.boxes, full.boxes];
          if (viewport.touch && story === "multiple") {
            // Touch: a tap on a remove button removes its file.
            await page.locator("[data-ok-upload-list] [data-ok-upload-remove]").first().tap();
            await expect(page.locator("[data-ok-upload-item]")).toHaveCount(1);
          }
          await page.close();
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
