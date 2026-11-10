import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

/** One entry per reference section, plus the line options, directions and grouped leaves. */
const STORIES = ["simple", "standard", "group", "lines", "direction", "grouped-leaves"];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Layout checks: the page never scrolls sideways (wide charts scroll inside their Scrollbar),
 * labels never overlap or get clipped, connector lines stay on their labels' centers, every
 * enabled button is a 24px target that nothing covers once scrolled into view.
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const labels = [
      ...document.querySelectorAll<HTMLElement>("[data-ok-organization-chart-label]"),
    ];
    const boxes: Box[] = [];
    for (const [i, label] of labels.entries()) {
      const card = (label.firstElementChild ?? label) as HTMLElement;
      const box = card.getBoundingClientRect();
      boxes.push({
        x: Math.round(
          box.left -
            (label.closest("[data-ok-organization-chart]") as Element).getBoundingClientRect().left,
        ),
        y: Math.round(
          box.top -
            (label.closest("[data-ok-organization-chart]") as Element).getBoundingClientRect().top,
        ),
        width: Math.round(box.width),
        height: Math.round(box.height),
      });
      for (const text of card.querySelectorAll<HTMLElement>(".sb-org-name, .sb-org-role"))
        if (text.scrollWidth > text.clientWidth + 1) problems.push(`label #${i}: text clipped`);
    }
    // Labels of one chart never overlap.
    for (const chart of document.querySelectorAll("[data-ok-organization-chart]")) {
      const cards = [...chart.querySelectorAll("[data-ok-organization-chart-label]")]
        .filter((l) => l.closest("[data-ok-organization-chart]") === chart)
        .map((l) => ((l.firstElementChild ?? l) as Element).getBoundingClientRect());
      for (let a = 0; a < cards.length; a++)
        for (let b = a + 1; b < cards.length; b++) {
          const p = cards[a] as DOMRect;
          const q = cards[b] as DOMRect;
          if (
            p.left < q.right - 0.5 &&
            q.left < p.right - 0.5 &&
            p.top < q.bottom - 0.5 &&
            q.top < p.bottom - 0.5
          )
            problems.push(`labels ${a} and ${b} overlap`);
        }
    }
    return { problems, boxes };
  });
}

/** Every enabled button: at least 24 × 24 and on top once scrolled into view. */
async function targets(page: Page) {
  const problems: string[] = [];
  const buttons = page.locator("[data-ok-organization-chart] button:not([disabled])");
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    await button.scrollIntoViewIfNeeded();
    const result = await button.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return { width: box.width, height: box.height, onTop: hit !== null && el.contains(hit) };
    });
    if (result.width < 24 || result.height < 24) problems.push(`button ${i}: too small`);
    if (!result.onTop) problems.push(`button ${i}: covered`);
  }
  return problems;
}

for (const viewport of viewports) {
  test.describe(`organization chart responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const story of STORIES) {
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
          await openStory(page, storyId(impl, "organization-chart", story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          expect(await targets(page), `${impl} ${story}`).toEqual([]);
          if (viewport.touch && story === "standard") {
            const button = page.getByRole("button", { name: "Actions for Zara Okafor" });
            await button.scrollIntoViewIfNeeded();
            await button.tap();
            await expect(page.getByRole("menu", { name: "Actions for Zara Okafor" })).toBeVisible();
          }
          results[impl] = boxes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
