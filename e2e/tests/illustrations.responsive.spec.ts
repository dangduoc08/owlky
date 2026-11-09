import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["all", "errors", "states", "account", "dashboard", "shapes"];

/**
 * No page overflow, every illustration inside the page and its container, the 4:3 canvas (or the
 * shape's own) kept, never wider than 480px without a size; the boxes to compare React with HTML.
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const boxes = [...document.querySelectorAll<SVGSVGElement>("svg[data-ok-illustration]")].map(
      (svg) => {
        const box = svg.getBoundingClientRect();
        const parent = (svg.parentElement as HTMLElement).getBoundingClientRect();
        const [, , width, height] = (svg.getAttribute("viewBox") ?? "").split(" ").map(Number);
        const name = svg.getAttribute("data-ok-illustration");
        if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
          problems.push(`${name} outside the page`);
        if (box.width > parent.width + 0.5) problems.push(`${name} wider than its container`);
        if (box.width > 480.5) problems.push(`${name} wider than 480px`);
        if (Math.abs(box.height - (box.width * (height as number)) / (width as number)) > 1)
          problems.push(`${name} lost its aspect ratio`);
        return { width: Math.round(box.width), height: Math.round(box.height) };
      },
    );
    if (boxes.length === 0) problems.push("no illustration");
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`illustrations responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const story of STORIES) {
      test(`${story}: scales down without overflow, and React matches HTML`, async ({
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
          await openStory(page, storyId(impl, "illustrations", story));
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = boxes;
          // The size option (Controls) still never pushes past a narrow screen.
          await openStory(page, storyId(impl, "illustrations", story), "light", "size:800");
          const sized = await measure(page);
          expect(
            sized.problems.filter((problem) => !problem.includes("wider than 480px")),
            `${impl} ${story} size 800`,
          ).toEqual([]);
          await page.close();
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}

test.describe("illustrations follow the theme", () => {
  test("brand tones follow the preset and color; neutral tones the scheme (both frameworks)", async ({
    page,
  }) => {
    for (const impl of implementations) {
      for (const theme of ["light", "dark"] as const) {
        await openStory(page, storyId(impl, "illustrations", "errors"), theme, "", "preset:purple");
        const colors = await page.evaluate(() => {
          const svg = document.querySelector("svg[data-ok-illustration]") as SVGSVGElement;
          const probe = document.createElement("span");
          svg.parentElement?.append(probe);
          const token = (value: string) => {
            probe.style.color = value;
            return getComputedStyle(probe).color;
          };
          const fill = (tone: string) =>
            getComputedStyle(
              svg.querySelector(`[data-ok-tone="${tone}"]:not([data-ok-stroke])`) as Element,
            ).fill;
          const result = {
            main: [fill("main"), token("var(--ok-palette-primary-main)")],
            neutral: [fill("neutral"), token("var(--ok-bg-neutral)")],
            hidden: svg.getAttribute("aria-hidden"),
          };
          probe.remove();
          return result;
        });
        expect(colors.main[0], `${impl} ${theme}`).toBe(colors.main[1]);
        expect(colors.neutral[0], `${impl} ${theme}`).toBe(colors.neutral[1]);
        expect(colors.hidden).toBe("true");
      }
    }
  });
});

test.describe("illustrations: the All story", () => {
  test("shows every picture of the category stories once (both frameworks)", async ({ page }) => {
    const names = () =>
      page.evaluate(() =>
        [...document.querySelectorAll("svg[data-ok-illustration]")].map(
          (svg) => svg.getAttribute("data-ok-illustration") ?? "",
        ),
      );
    for (const impl of implementations) {
      const expected: string[] = [];
      for (const story of STORIES.filter((name) => name !== "all")) {
        await openStory(page, storyId(impl, "illustrations", story));
        expected.push(...(await names()));
      }
      await openStory(page, storyId(impl, "illustrations", "all"));
      const all = await names();
      expect(new Set(all).size, impl).toBe(all.length);
      expect([...all].sort(), impl).toEqual([...expected].sort());
    }
  });
});
