import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

/**
 * Layout checks, closed and open: the page never scrolls sideways, every collapse stays inside the
 * viewport, open collapses show their whole card (nothing clipped), the switch is a 24px target
 * that nothing covers.
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const boxes = [...document.querySelectorAll<HTMLElement>("[data-ok-collapse]")].map(
      (element, i) => {
        const box = element.getBoundingClientRect();
        if (box.right > window.innerWidth + 0.5) problems.push(`collapse ${i} leaves the viewport`);
        if (!element.hidden && element.scrollHeight > element.clientHeight + 1)
          problems.push(`collapse ${i} is clipped`);
        return [Math.round(box.width), Math.round(box.height)];
      },
    );
    const input = document.querySelector<HTMLElement>("[data-ok-switch]");
    const target = input?.getBoundingClientRect();
    if (!target || target.width < 24 || target.height < 24) problems.push("switch under 24px");
    else {
      const hit = document.elementFromPoint(
        target.left + target.width / 2,
        target.top + target.height / 2,
      );
      if (!input?.contains(hit)) problems.push("switch covered");
    }
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test(`collapse: layout at ${viewport.name} (${viewport.width}px), React = HTML`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
    });
    const page = await context.newPage();
    const results: Record<string, unknown> = {};
    for (const impl of implementations) {
      await openStory(page, storyId(impl, "collapse", "simple-collapse"));
      const closed = await measure(page);
      const show = page.getByRole("switch", { name: "Show" });
      if (viewport.touch) await page.getByText("Show", { exact: true }).tap();
      else await show.check();
      await expect(show).toBeChecked();
      const open = await measure(page);
      expect([...closed.problems, ...open.problems], impl).toEqual([]);
      results[impl] = { closed: closed.boxes, open: open.boxes };
    }
    expect(results["html"]).toEqual(results["react"]);
    await context.close();
  });
}
