import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const STORIES = [
  "line",
  "area",
  "column-single",
  "column-multiple",
  "column-stacked",
  "column-negative",
  "bar",
  "mixed",
  "scatter",
  "pie",
  "donut",
  "radial-bar",
  "radar",
  "semi-circle-gauge",
  "stroked-gauge",
];

/** The SVG as plain data (gradient ids normalized): parity doesn't walk into SVG. */
function svgTree(page: Page) {
  return page.evaluate(() => {
    const walk = (element: Element): unknown => ({
      tag: element.localName,
      attrs: Object.fromEntries(
        [...element.attributes]
          .filter((a) => a.name !== "id")
          .map((a) => [a.name, a.value.replace(/url\(#[^)]*\)/, "url(#)")])
          .sort(),
      ),
      text: element.children.length === 0 ? element.textContent : undefined,
      children: [...element.children].map(walk),
    });
    return [...document.querySelectorAll("[data-ok-chart-svg]")].map(walk);
  });
}

const plot = (page: Page) => page.locator("[data-ok-chart-plot]").first();
const tooltip = (page: Page) => page.locator("[data-ok-chart-tooltip]").first();

for (const story of STORIES) {
  test(`chart ${story}: React and HTML draw the same SVG`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Structure is browser-independent.");
    await openStory(page, storyId("react", "chart", story));
    const react = await svgTree(page);
    await openStory(page, storyId("html", "chart", story));
    const html = await svgTree(page);
    expect(react.length).toBeGreaterThan(0);
    expect(html).toEqual(react);
  });
}

for (const impl of implementations) {
  test.describe(`chart (${impl})`, () => {
    test("pointer: the tooltip follows the categories, leaving hides it", async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "Mouse hover.");
      await openStory(page, storyId(impl, "chart", "line"));
      const box = (await plot(page).boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      await page.mouse.move(box.x + box.width - 4, box.y + box.height / 2);
      await expect(tooltip(page)).toBeVisible();
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-title]")).toHaveText("Sep");
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-row]")).toHaveText([
        "Series A100",
        "Series B60",
      ]);
      // The tooltip stays inside the plot.
      const tip = (await tooltip(page).boundingBox()) as { x: number; width: number };
      expect(tip.x + tip.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height + 200);
      await expect(tooltip(page)).toBeHidden();
    });

    test("touch: a tap shows the values of the category", async ({ browser, browserName }) => {
      test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();
      await openStory(page, storyId(impl, "chart", "column-single"));
      const box = (await plot(page).boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await expect(tooltip(page)).toBeVisible();
      await expect(page.locator("[data-ok-chart-band]")).toHaveCount(1);
      await context.close();
    });

    test("keyboard: Tab shows the first category, arrows move, Escape hides", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "column-multiple"));
      await plot(page).focus();
      await page.keyboard.press("End");
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-title]")).toHaveText("Sep");
      await page.keyboard.press("ArrowLeft");
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-title]")).toHaveText("Aug");
      await page.keyboard.press("Home");
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-title]")).toHaveText("Jan");
      await page.keyboard.press("Escape");
      await expect(tooltip(page)).toBeHidden();
    });

    test("legend: a series hides and shows again; the axis fits what is left", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "column-stacked"));
      const series = page.locator("[data-ok-chart-series]");
      await expect(series).toHaveCount(4);
      const top = page.locator("[data-ok-chart-axis='y'] text").last();
      const before = await top.textContent();
      const a = page.getByRole("button", { name: "Series A" });
      await a.click();
      await expect(a).toHaveAttribute("aria-pressed", "false");
      await expect(series).toHaveCount(3);
      await expect(top).not.toHaveText(before as string);
      await a.click();
      await expect(series).toHaveCount(4);
    });

    test("scatter: the nearest point", async ({ page, isMobile }) => {
      test.skip(isMobile, "Mouse hover.");
      await openStory(page, storyId(impl, "chart", "scatter"));
      const marker = page.locator("[data-ok-chart-marker]").first();
      const box = (await marker.boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-row]")).toHaveCount(1);
      await expect(page.locator("[data-ok-chart-active-marker]")).toHaveCount(1);
    });

    test("pie: a slice under the pointer or tap shows its value; the legend hides it", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "chart", "pie"));
      const box = (await plot(page).boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      // Up and right of the center: the first slice.
      await page.mouse.click(box.x + box.width / 2 + 30, box.y + box.height / 2 - 40);
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-title]")).toHaveText("Series A");
      await expect(page.locator("[data-ok-chart-active-slice]")).toHaveCount(1);
      await page.getByRole("button", { name: "Series B" }).click();
      await expect(page.locator("[data-ok-chart-slice]")).toHaveCount(3);
      await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(4);
    });

    test("radar and gauges: keyboard reaches every category", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "radar"));
      await plot(page).focus();
      await page.keyboard.press("End");
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-title]")).toHaveText("2016");
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-row]")).toHaveCount(3);
      await openStory(page, storyId(impl, "chart", "semi-circle-gauge"));
      await plot(page).focus();
      await page.keyboard.press("Home");
      await expect(tooltip(page)).toContainText("75%");
      await expect(page.locator("[data-ok-chart-center-value]")).toHaveText("75%");
    });

    test("the data table is read by assistive technologies", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "bar"));
      const table = page.getByRole("table", { name: "Net profit by country" });
      await expect(table.getByRole("rowheader")).toHaveCount(10);
      await expect(table.getByRole("cell").last()).toHaveText("1,370");
    });
  });
}
