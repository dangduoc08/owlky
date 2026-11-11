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
  "box-plot",
  "heatmap",
  "treemap",
  "bubble",
  "range-area",
  "funnel",
  "pyramid",
  "slope",
  "sparklines",
  "live-data",
  "candlestick",
  "range-bar",
  "timeline",
  "polar-area",
  "zoom",
  "synchronized",
  "brush",
  "annotations",
  "data-labels",
  "donut-legend",
  "heatmap-ranges",
  "box-plot-horizontal",
  "localized",
  "animations",
  "sankey",
  "sankey-vertical",
  "sankey-cycles",
  "sankey-alluvial",
  "sankey-links",
  "stock",
  "stock-overlays",
  "stock-oscillators",
  "stock-line",
  "multiple-y-axes",
  "axis-scales",
  "selection",
  "column-stacked-100",
  "stack-totals",
  "column-data-labels",
  "column-ranges",
  "marker-shapes",
  "dashed-lines",
  "patterns",
  "color-blind",
  "tooltip",
  "tooltip-custom",
  "legend",
  "grid",
  "waterfall",
  "dumbbell",
  "tree",
  "sunburst",
  "icicle",
  "violin",
  "streamgraph",
  "crossfilter",
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

test("chart live-data: after the same clicks, React and HTML draw the same SVG and table", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Structure is browser-independent.");
  const after = async (impl: "react" | "html") => {
    await openStory(page, storyId(impl, "chart", "live-data"));
    const add = page.getByRole("button", { name: "Add a point" });
    for (let i = 0; i < 3; i++) await add.click();
    const rows = page.getByRole("table").locator("tbody tr");
    await expect(rows).toHaveCount(12);
    await expect(rows.last().locator("th")).toHaveText("10:01:10");
    return { svg: await svgTree(page), first: await rows.first().textContent() };
  };
  const react = await after("react");
  const html = await after("html");
  expect(html).toEqual(react);
  expect(react.first).toBe("10:00:1559");
});

for (const impl of implementations) {
  test.describe(`chart phase 3 (${impl})`, () => {
    test("live data: the tooltip stays on its category and shows the new value", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "chart", "live-data"));
      await plot(page).focus();
      await page.keyboard.press("End");
      const title = tooltip(page).locator("[data-ok-chart-tooltip-title]");
      await expect(title).toHaveText("10:00:55");
      await page.getByRole("button", { name: "Add a point" }).click();
      await plot(page).focus();
      await page.keyboard.press("End");
      await expect(title).toHaveText("10:01:00");
      await page.getByRole("button", { name: "Reset" }).click();
      await expect(page.getByRole("table").locator("tbody tr").last().locator("th")).toHaveText(
        "10:00:55",
      );
    });

    test("heatmap: arrows move between cells, Escape hides", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "heatmap"));
      await plot(page).focus();
      await page.keyboard.press("Home");
      await expect(tooltip(page)).toContainText("Metric 6");
      await page.keyboard.press("ArrowRight");
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-title]")).toHaveText("10:30");
      await page.keyboard.press("ArrowDown");
      await expect(tooltip(page)).toContainText("Metric 5");
      await expect(page.locator("[data-ok-chart-active-cell]")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(tooltip(page)).toBeHidden();
    });

    test("treemap: a tap or a click on a cell shows its value", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "treemap"));
      const cell = page.locator("[data-ok-chart-cell]").first();
      await cell.click();
      await expect(tooltip(page)).toBeVisible();
      await expect(page.locator("[data-ok-chart-active-cell]")).toHaveCount(1);
    });

    test("box plot: the tooltip lists the five values", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "box-plot"));
      await plot(page).focus();
      await page.keyboard.press("Home");
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-row]")).toHaveText([
        "Minimum54",
        "Q166",
        "Median69",
        "Q375",
        "Maximum88",
      ]);
      await expect(page.getByRole("table").locator("thead tr")).toHaveCount(2);
    });
  });
}

for (const impl of implementations) {
  test.describe(`chart phase 4 (${impl})`, () => {
    const ticks = (page: Page, nth = 0) =>
      page.locator("[data-ok-chart]").nth(nth).locator("[data-ok-chart-axis='x'] text");

    test("zoom: a drag (mouse) or the toolbar zooms, reset shows everything", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "chart", "zoom"));
      const before = await ticks(page).allTextContents();
      if (!isMobile) {
        const box = (await plot(page).boundingBox()) as { x: number; y: number; width: number };
        await page.mouse.move(box.x + box.width * 0.3, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.5, box.y + 100, { steps: 4 });
        await expect(page.locator("[data-ok-chart-selection]")).toHaveCount(1);
        await page.mouse.up();
      } else await page.getByRole("button", { name: "Zoom in" }).tap();
      await expect(page.locator("[data-ok-chart-selection]")).toHaveCount(0);
      await expect(ticks(page)).not.toHaveText(before);
      await page.getByRole("button", { name: "Reset zoom" }).click();
      await expect(ticks(page)).toHaveText(before);
    });

    test("zoom: keys zoom and pan; the download of a CSV starts on a click", async ({
      page,
      browserName,
    }) => {
      await openStory(page, storyId(impl, "chart", "zoom"));
      const before = await ticks(page).allTextContents();
      await plot(page).focus();
      await page.keyboard.press("+");
      await expect(ticks(page)).not.toHaveText(before);
      // Panning by a day may keep the weekly labels: compare the drawn line.
      const line = page.locator("[data-ok-chart-line]").first();
      const zoomed = (await line.getAttribute("d")) as string;
      await page.keyboard.press("Shift+ArrowRight");
      await expect(line).not.toHaveAttribute("d", zoomed);
      test.skip(browserName === "webkit", "WebKit's headless downloads are not reported.");
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download CSV" }).click();
      expect((await download).suggestedFilename()).toBe("daily-active-users.csv");
    });

    test("synchronized: the other charts show the same category and zoom", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "synchronized"));
      await plot(page).focus();
      await page.keyboard.press("End");
      await expect(page.locator("[data-ok-chart-tooltip-title]")).toHaveText([
        "10:29",
        "10:29",
        "10:29",
      ]);
      const before = await ticks(page, 1).allTextContents();
      await page.keyboard.press("+");
      await expect(ticks(page, 1)).not.toHaveText(before);
    });

    test("brush: keys and drags on the overview zoom the main chart", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "chart", "brush"));
      const before = await ticks(page).allTextContents();
      const overview = page.locator("[data-ok-chart-plot]").nth(1);
      await overview.focus();
      await page.keyboard.press("+");
      await expect(ticks(page)).not.toHaveText(before);
      const selection = page.locator("[data-ok-chart-selection]");
      const x = await selection.getAttribute("x");
      if (!isMobile) {
        const box = (await selection.boundingBox()) as {
          x: number;
          y: number;
          width: number;
          height: number;
        };
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 4 });
        await page.mouse.up();
        await expect(selection).not.toHaveAttribute("x", x as string);
      }
      await overview.focus();
      await page.keyboard.press("0");
      await expect(ticks(page)).toHaveText(before);
    });

    test("annotations: drawn and listed for assistive technologies", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "annotations"));
      const labels = ["Deploy", "Recovery", "Threshold", "Peak"];
      await expect(page.locator("[data-ok-chart-annotation-label]")).toHaveText(labels);
      await expect(page.getByRole("listitem")).toHaveText(labels);
    });

    test("candlestick and timeline: the tooltip lists every value", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "candlestick"));
      await plot(page).focus();
      await page.keyboard.press("Home");
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-row]")).toHaveCount(4);
      await openStory(page, storyId(impl, "chart", "timeline"));
      await plot(page).focus();
      await page.keyboard.press("Home");
      await expect(tooltip(page)).toContainText("02 Mar 2026 – 13 Mar 2026");
    });
  });
}

for (const impl of implementations) {
  test.describe(`chart sankey (${impl})`, () => {
    test("pointer and touch: a node shows its totals and highlights its links", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "chart", "sankey"));
      const building = page.locator("[data-ok-chart-node]").nth(1);
      const box = (await building.boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      if (isMobile) await page.touchscreen.tap(x, y);
      else await page.mouse.move(x, y);
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-title]")).toHaveText("Building");
      await expect(tooltip(page).locator("[data-ok-chart-tooltip-row]")).toHaveText([
        "Incoming121 MWh",
        "Outgoing121 MWh",
      ]);
      await expect(page.locator("[data-ok-chart-active-link]")).toHaveCount(8);
    });

    test("keyboard: nodes and links column by column; the table lists every link", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "chart", "sankey-cycles"));
      await plot(page).focus();
      await page.keyboard.press("Home");
      const title = tooltip(page).locator("[data-ok-chart-tooltip-title]");
      await expect(title).toHaveText("New material");
      await page.keyboard.press("ArrowRight");
      await expect(title).toHaveText("New material → Production");
      await page.keyboard.press("Escape");
      await expect(tooltip(page)).toBeHidden();
      const table = page.getByRole("table", { name: "Packaging material flow, tonnes" });
      await expect(table.getByRole("row")).toHaveCount(6);
      await expect(table.getByRole("columnheader")).toHaveText(["From", "To", "Value"]);
    });
  });
}

for (const impl of implementations) {
  test.describe(`chart stock (${impl})`, () => {
    test("keyboard: one readout of every pane; zoom keys move the navigator", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "stock-oscillators"));
      await plot(page).focus();
      await page.keyboard.press("End");
      const rows = tooltip(page).locator("[data-ok-chart-tooltip-row] > span:nth-child(2)");
      await expect(rows).toHaveText([
        "Open",
        "High",
        "Low",
        "Close",
        "RSI 14",
        "Histogram",
        "MACD 12, 26",
        "Signal 9",
        "%K 14",
        "%D 3",
      ]);
      const selection = page.locator("[data-ok-chart-navigator] [data-ok-chart-selection]");
      const width = Number(await selection.getAttribute("width"));
      await page.keyboard.press("Escape");
      await page.keyboard.press("+");
      await expect
        .poll(async () => Number(await selection.getAttribute("width")))
        .toBeLessThan(width * 0.75);
    });

    test("navigator: a drag draws a window that zooms every pane", async ({ page, isMobile }) => {
      test.skip(isMobile, "Mouse drag.");
      await openStory(page, storyId(impl, "chart", "stock"));
      const frame = page.locator("[data-ok-chart-navigator-frame]");
      const box = (await frame.boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      const ticks = page.locator("[data-ok-chart-axis='x'] text");
      const before = await ticks.allTextContents();
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();
      await expect(ticks).not.toHaveText(before);
      const width = Number(
        await page
          .locator("[data-ok-chart-navigator] [data-ok-chart-selection]")
          .getAttribute("width"),
      );
      expect(width).toBeLessThan(box.width * 0.4);
    });

    test("the data table lists the indicator values", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "stock"));
      const table = page.getByRole("table", { name: "ACME share price, first half of 2025" });
      await expect(table.locator("th[data-ok-indicator]")).toHaveText(["SMA 20"]);
      await expect(table.getByRole("row")).toHaveCount(132);
    });
  });
}

// Roadmap 4.18.60: data point selection.
for (const impl of implementations) {
  test.describe(`chart selection (${impl})`, () => {
    test("a click or Enter selects a column; the outline and the tooltip show it", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "chart", "selection"));
      const first = page.locator("[data-ok-chart]").first();
      const outlines = first.locator("[data-ok-chart-selected-mark]");
      await first.locator("[data-ok-chart-bar]").nth(3).click();
      await expect(outlines).toHaveCount(1);
      await expect(first.locator("[data-ok-chart-tooltip-state]")).toHaveText("Selected");
      await plot(page).focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("Enter");
      // One at a time: Monday replaces Thursday.
      await expect(outlines).toHaveCount(1);
      await expect(first.locator("[data-ok-chart-tooltip-state]")).toHaveText("Selected");
      await page.keyboard.press("Space");
      await expect(outlines).toHaveCount(0);
    });

    test("donut: several slices, the legend still hides them", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "selection"));
      const donut = page.locator("[data-ok-chart]").nth(1);
      const slices = donut.locator("[data-ok-chart-slice]");
      await donut.locator("[data-ok-chart-plot]").focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Space");
      await expect(donut.locator("[data-ok-chart-selected-mark]")).toHaveCount(2);
      await donut.getByRole("button", { name: "Tablet" }).click();
      await expect(slices).toHaveCount(2);
      await expect(donut.locator("[data-ok-chart-selected-mark]")).toHaveCount(2);
    });
  });
}

test("chart selection: after the same clicks, React and HTML draw the same SVG", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Structure is browser-independent.");
  const after = async (impl: "react" | "html") => {
    await openStory(page, storyId(impl, "chart", "selection"));
    await page.locator("[data-ok-chart-bar]").nth(1).click();
    await page.locator("[data-ok-chart-plot]").nth(1).focus();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await page.mouse.move(0, 0);
    await expect(page.locator("[data-ok-chart-selected-mark]")).toHaveCount(2);
    return svgTree(page);
  };
  const react = await after("react");
  const html = await after("html");
  expect(html).toEqual(react);
});

// Roadmap 4.18.21: waterfall charts.
for (const impl of implementations) {
  test.describe(`chart waterfall (${impl})`, () => {
    test("the keyboard reads each signed step and the running total", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "waterfall"));
      const first = page.locator("[data-ok-chart]").first();
      await expect(first.locator("[data-ok-chart-connector]")).toHaveCount(7);
      await first.locator("[data-ok-chart-plot]").focus();
      await page.keyboard.press("Home");
      for (let step = 0; step < 3; step++) await page.keyboard.press("ArrowRight");
      await expect(first.locator("[data-ok-chart-tooltip-row]")).toHaveText([
        "Cash-190",
        "Total275",
      ]);
      await page.keyboard.press("End");
      await expect(first.locator("[data-ok-chart-tooltip-row]")).toHaveText(["Cash170"]);
    });
  });

  // Roadmap 4.18.21: dumbbell charts.
  test.describe(`chart dumbbell (${impl})`, () => {
    test("a click selects a dumbbell; the keyboard reads both ends", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "dumbbell"));
      const first = page.locator("[data-ok-chart]").first();
      await expect(first.locator("[data-ok-chart-dumbbell-line]")).toHaveCount(5);
      await first.locator('[data-ok-chart-dumbbell="end"]').nth(2).click();
      await expect(first.locator("[data-ok-chart-selected-mark]")).toHaveCount(1);
      await first.locator("[data-ok-chart-plot]").focus();
      await page.keyboard.press("Home");
      await expect(first.locator("[data-ok-chart-tooltip-row]")).toHaveText([
        "Before3.2",
        "After1.8",
      ]);
    });
  });

  // Roadmap 4.18.7 (ADR-0058): tree charts.
  test.describe(`chart tree (${impl})`, () => {
    test("arrows walk the hierarchy; Enter and clicks collapse nodes", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "tree"));
      const first = page.locator("[data-ok-chart]").first();
      const title = first.locator("[data-ok-chart-tooltip-title]");
      await expect(first.locator("[data-ok-chart-tree-node]")).toHaveCount(11);
      await first.locator("[data-ok-chart-plot]").focus();
      await page.keyboard.press("Home");
      await expect(title).toHaveText("Product");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowRight");
      await expect(title).toHaveText("Product › Mobile");
      await page.keyboard.press("Enter");
      await expect(first.locator("[data-ok-chart-tree-node]")).toHaveCount(9);
      await expect(first.locator("[data-ok-chart-tooltip-row]")).toHaveText([
        "Value10",
        "Level2",
        "Collapsed2",
      ]);
      await first.locator("[data-ok-chart-tree-node][data-ok-collapsed]").click();
      await expect(first.locator("[data-ok-chart-tree-node]")).toHaveCount(11);
      const table = page.getByRole("table", { name: "Product teams and their engineers" });
      await expect(table.getByRole("columnheader")).toHaveText(["Name", "Parent", "Value"]);
      await expect(table.getByRole("row")).toHaveCount(12);
    });
  });

  // Roadmap 4.18.19: crossfilter (ADR-0054).
  test.describe(`chart crossfilter (${impl})`, () => {
    test("clicks filter and highlight the group; Clear filter clears it", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "crossfilter"));
      const charts = page.locator("[data-ok-chart]");
      const orders = charts.nth(0);
      const revenue = charts.nth(1);
      const returns = charts.nth(2);
      await expect(revenue.getByRole("button", { name: "Clear filter" })).toBeHidden();
      await orders.locator("[data-ok-chart-bar]").nth(3).click();
      await orders.locator("[data-ok-chart-bar]").nth(0).click();
      await expect(revenue.locator("[data-ok-chart-bar]")).toHaveCount(2);
      await expect(returns.locator("[data-ok-chart-slice]")).toHaveCount(2);
      await expect(orders.locator("[data-ok-chart-filter-status]")).toHaveText(
        "Filter: North, West",
      );
      // A slice replaces the filter; the column chart is highlighted.
      await returns.locator("[data-ok-chart-plot]").focus();
      await page.keyboard.press("Home");
      // The slice is active before Enter selects it (slow WebKit runs).
      await expect(returns.locator("[data-ok-chart-tooltip]")).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(orders.locator("[data-ok-chart-filter-band]")).toHaveCount(1);
      await revenue.getByRole("button", { name: "Clear filter" }).click();
      await expect(revenue.locator("[data-ok-chart-bar]")).toHaveCount(5);
      await expect(returns.locator("[data-ok-chart-selected-mark]")).toHaveCount(0);
      await expect(orders.getByRole("button", { name: "Clear filter" })).toBeHidden();
    });
  });
}

test("chart crossfilter: after the same actions, React and HTML draw the same SVG", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Structure is browser-independent.");
  const after = async (impl: "react" | "html") => {
    await openStory(page, storyId(impl, "chart", "crossfilter"));
    await page.locator("[data-ok-chart]").first().locator("[data-ok-chart-bar]").nth(1).click();
    await page.locator("[data-ok-chart-plot]").nth(2).focus();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await page.mouse.move(0, 0);
    await expect(page.locator("[data-ok-chart-filter-band]")).toHaveCount(1);
    return svgTree(page);
  };
  const react = await after("react");
  const html = await after("html");
  expect(html).toEqual(react);
});

// Roadmap 4.18.21 (ADR-0058): sunburst charts.
for (const impl of implementations) {
  test.describe(`chart sunburst (${impl})`, () => {
    test("Enter and clicks zoom into a branch; Escape and Back zoom out", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "sunburst"));
      const first = page.locator("[data-ok-chart]").first();
      const title = first.locator("[data-ok-chart-tooltip-title]");
      const back = first.getByRole("button", { name: "Back" });
      await expect(first.locator("[data-ok-chart-arc]")).toHaveCount(14);
      await expect(back).toBeHidden();
      await first.locator("[data-ok-chart-plot]").focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowDown");
      await expect(title).toHaveText("Storage");
      await page.keyboard.press("Enter");
      await expect(first.locator("[data-ok-chart-arc]")).toHaveCount(6);
      await expect(first.locator("[data-ok-chart-drill-path]")).toHaveText("Storage");
      await expect(back).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(first.locator("[data-ok-chart-arc]")).toHaveCount(14);
      await first.locator("[data-ok-chart-arc]").nth(10).click();
      await expect(first.locator("[data-ok-chart-drill-path]")).toHaveText("Network");
      await back.click();
      await expect(first.locator("[data-ok-chart-arc]")).toHaveCount(14);
      await expect(back).toBeHidden();
      const table = page.getByRole("table", { name: /^Cloud spend by service/ });
      await expect(table.getByRole("row")).toHaveCount(15);
    });
  });
}

// Roadmap 4.18.21 (ADR-0058): icicle charts.
for (const impl of implementations) {
  test.describe(`chart icicle (${impl})`, () => {
    test("Enter zooms into a branch; its ancestor band and Back zoom out", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "icicle"));
      const first = page.locator("[data-ok-chart]").first();
      const cells = first.locator("[data-ok-chart-icicle-cell]");
      await expect(cells).toHaveCount(13);
      await first.locator("[data-ok-chart-plot]").focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowRight");
      await expect(first.locator("[data-ok-chart-tooltip-title]")).toHaveText(
        "Page load › Scripts",
      );
      await page.keyboard.press("Enter");
      await expect(cells).toHaveCount(6);
      await expect(first.locator("[data-ok-chart-drill-path]")).toHaveText("Page load › Scripts");
      await first.getByRole("button", { name: "Back" }).click();
      await expect(cells).toHaveCount(13);
      await cells.nth(5).click();
      await expect(first.locator("[data-ok-chart-drill-path]")).toHaveText("Page load › Scripts");
      await cells.first().click();
      await expect(first.locator("[data-ok-chart-drill-path]")).toHaveText("Page load");
    });
  });
}

test("chart sunburst: after drilling, React and HTML draw the same SVG", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Structure is browser-independent.");
  const after = async (impl: "react" | "html") => {
    await openStory(page, storyId(impl, "chart", "sunburst"));
    await page.locator("[data-ok-chart-plot]").first().focus();
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-ok-chart-drill-path]").first()).toHaveText("Storage");
    // Leaving the plot hides the tooltip and its highlight.
    await page.locator("[data-ok-chart-plot]").first().blur();
    return svgTree(page);
  };
  const react = await after("react");
  const html = await after("html");
  expect(html).toEqual(react);
});

// Roadmap 4.18.21: streamgraphs.
for (const impl of implementations) {
  test.describe(`chart streamgraph (${impl})`, () => {
    test("the keyboard reads every band and the total", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "streamgraph"));
      const first = page.locator("[data-ok-chart]").first();
      await expect(first.locator("[data-ok-chart-stream-band]")).toHaveCount(5);
      await first.locator("[data-ok-chart-plot]").focus();
      await page.keyboard.press("Home");
      await expect(first.locator("[data-ok-chart-tooltip-title]")).toHaveText("Jan");
      const rows = first.locator("[data-ok-chart-tooltip-row]");
      await expect(rows).toHaveCount(6);
      await expect(rows.last()).toHaveText("Total122k");
    });

    test("a legend item removes its band and the baseline follows", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "streamgraph"));
      const first = page.locator("[data-ok-chart]").first();
      const band = first.locator("[data-ok-chart-stream-band]").first();
      const before = await band.getAttribute("d");
      await first.locator("[data-ok-chart-legend-item]").first().click();
      await expect(first.locator("[data-ok-chart-stream-band]")).toHaveCount(4);
      expect(await first.locator("[data-ok-chart-stream-band]").first().getAttribute("d")).not.toBe(
        before,
      );
    });
  });
}

// Roadmap 4.18.21: violin charts.
for (const impl of implementations) {
  test.describe(`chart violin (${impl})`, () => {
    test("the keyboard reads the five numbers and the count", async ({ page }) => {
      await openStory(page, storyId(impl, "chart", "violin"));
      const first = page.locator("[data-ok-chart]").first();
      await expect(first.locator("[data-ok-chart-violin]")).toHaveCount(3);
      await first.locator("[data-ok-chart-plot]").focus();
      await page.keyboard.press("Home");
      await expect(first.locator("[data-ok-chart-tooltip-title]")).toHaveText("Basic");
      const rows = first.locator("[data-ok-chart-tooltip-row]");
      await expect(rows).toHaveCount(6);
      await expect(rows.last()).toHaveText("Count16");
    });
  });
}
