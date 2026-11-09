import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const STORIES = [
  "basic",
  "timeline-views",
  "milestones",
  "dependency-types",
  "baseline",
  "critical-path",
  "working-calendar",
  "project-boundary",
  "bar-labels",
  "custom-colors",
  "selection",
  "task-list-columns",
];

/** The background SVGs as plain data: parity doesn't walk into SVG. */
function svgTrees(page: Page) {
  return page.evaluate(() => {
    const walk = (element: Element): unknown => ({
      tag: element.localName,
      attrs: Object.fromEntries([...element.attributes].map((a) => [a.name, a.value]).sort()),
      children: [...element.children].map(walk),
    });
    return [...document.querySelectorAll("[data-ok-gantt-canvas]")].map(walk);
  });
}

/** Positions of every bar, label and tick (private properties) per Gantt. */
function geometry(page: Page) {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "[data-ok-gantt-bar], [data-ok-gantt-tick], [data-ok-gantt-label]",
      ),
    ].map((element) => element.getAttribute("style")),
  );
}

for (const story of STORIES)
  test(`${story}: React and HTML draw the same SVG and positions`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Layout is computed by core, browser-independent.");
    const results: unknown[] = [];
    for (const impl of implementations) {
      await openStory(page, storyId(impl, "gantt", story));
      results.push({ svg: await svgTrees(page), geometry: await geometry(page) });
    }
    expect(results[1]).toEqual(results[0]);
  });

for (const impl of implementations) {
  test.describe(`gantt (${impl})`, () => {
    test("moves through rows, collapses parents and shows tooltips with the keyboard", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "gantt", "basic"));
      const grid = page.getByRole("treegrid", { name: "Website relaunch" });
      await expect(grid).toBeVisible();
      // Tab into the grid: the first row holds the tab stop.
      await page.getByRole("button", { name: "Zoom in" }).focus();
      await page.keyboard.press("Tab");
      const discovery = grid.getByRole("row", { name: /^Discovery/ });
      await expect(discovery).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(discovery).toHaveAttribute("aria-expanded", "false");
      await expect(grid.getByRole("row", { name: /^User research/ })).toHaveCount(0);
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      const research = grid.getByRole("row", { name: /^User research/ });
      await expect(research).toBeFocused();
      const tooltip = page.locator("[data-ok-gantt-tooltip]");
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText("User research");
      await page.keyboard.press("Escape");
      await expect(tooltip).toBeHidden();
      await page.keyboard.press("End");
      await expect(grid.getByRole("row", { name: /^Launch/ })).toBeFocused();
      await page.keyboard.press("Home");
      await expect(discovery).toBeFocused();
      // The grid is one tab stop: Shift + Tab leaves it in one step (Firefox keeps the focus when
      // Tab leaves a document's last control, so the test goes backwards).
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByRole("button", { name: "Zoom in" })).toBeFocused();
    });

    test("zooms with the toolbar and keeps the focused task in view", async ({ page }) => {
      await openStory(page, storyId(impl, "gantt", "basic"));
      const ticks = page.locator("[data-ok-gantt-tier='bottom'] [data-ok-gantt-tick]");
      await expect(ticks.first()).toHaveText("Feb 24");
      await page.getByRole("button", { name: "Zoom in" }).click();
      await page.getByRole("button", { name: "Zoom in" }).click();
      await page.getByRole("button", { name: "Zoom in" }).click();
      await expect(ticks.first()).toHaveText("2");
      await page.getByRole("button", { name: "Zoom out" }).click();
      await page.getByRole("button", { name: "Zoom out" }).click();
      await page.getByRole("button", { name: "Zoom out" }).click();
      await page.getByRole("button", { name: "Zoom out" }).click();
      await page.getByRole("button", { name: "Zoom out" }).click();
      await page.getByRole("button", { name: "Zoom out" }).click();
      await expect(ticks.first()).toHaveText("Feb");
      const launch = page.getByRole("row", { name: /^Launch/ });
      await launch.click();
      await page.keyboard.press("Home");
      await page.keyboard.press("End");
      const viewport = page.locator("[data-ok-gantt-viewport]");
      const bar = launch.locator("[data-ok-gantt-bar]");
      const [box, view] = [await bar.boundingBox(), await viewport.boundingBox()];
      expect(box && view && box.x + box.width <= view.x + view.width + 1).toBe(true);
    });

    test("selects rows with clicks and the keyboard", async ({ page }) => {
      await openStory(page, storyId(impl, "gantt", "selection"));
      const grid = page.getByRole("treegrid");
      await expect(grid).toHaveAttribute("aria-multiselectable", "true");
      const selected = grid.locator('[aria-selected="true"]');
      await expect(selected).toHaveCount(2);
      await grid.getByRole("row", { name: /^Back end/ }).click();
      await expect(selected).toHaveCount(1);
      await page.keyboard.press("Shift+ArrowDown");
      await expect(selected).toHaveCount(2);
      await page.keyboard.press("ControlOrMeta+a");
      await expect(selected).toHaveCount(13);
      await page.keyboard.press("Space");
      await expect(selected).toHaveCount(12);
    });
  });
}

test("touch: taps select rows and toggle parents", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  for (const impl of implementations) {
    const page = await context.newPage();
    await openStory(page, storyId(impl, "gantt", "selection"));
    const grid = page.getByRole("treegrid");
    const toggle = grid.getByRole("row", { name: /^Design/ }).locator("[data-ok-gantt-toggle]");
    await toggle.tap();
    await expect(grid.getByRole("row", { name: /^Design/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await grid
      .getByRole("row", { name: /^Launch/ })
      .locator('[data-ok-gantt-cell="name"]')
      .tap();
    await expect(grid.locator('[aria-selected="true"]')).toHaveCount(1);
    await expect(grid.getByRole("row", { name: /^Launch/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.close();
  }
  await context.close();
});

for (const impl of implementations)
  test(`editing (${impl}): drag, keyboard and the edit form change tasks`, async ({ page }) => {
    await openStory(page, storyId(impl, "gantt", "editing"));
    const grid = page.getByRole("treegrid", { name: "Editable plan" });
    const design = grid.getByRole("row", { name: /^Design/ });
    const start = design.locator('[data-ok-gantt-cell="startTime"]');
    await expect(start).toHaveText("Mar 6, 2025");
    // Drag the bar two days later (day view: 36 px per day).
    const bar = design.locator("[data-ok-gantt-bar]");
    await bar.scrollIntoViewIfNeeded();
    const box = (await bar.boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, y, { steps: 4 });
    await page.mouse.move(box.x + box.width / 2 + 72, y, { steps: 4 });
    await page.mouse.up();
    await expect(start).toHaveText("Mar 8, 2025");
    // Keyboard: Enter, one day earlier, 10% more, Enter.
    await design.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-ok-gantt-status]")).toContainText("Editing Design");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("PageUp");
    await page.keyboard.press("Enter");
    await expect(start).toHaveText("Mar 7, 2025");
    await expect(design.locator('[data-ok-gantt-cell="progress"]')).toHaveText("50%");
    // F2 opens the form; a double click is the single-pointer way.
    await page.keyboard.press("F2");
    const dialog = page.getByRole("dialog", { name: "Edit Design" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Progress (%)").fill("80");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toBeHidden();
    await expect(design.locator('[data-ok-gantt-cell="progress"]')).toHaveText("80%");
    await grid
      .getByRole("row", { name: /^Build/ })
      .locator("[data-ok-gantt-bar]")
      .dblclick();
    await expect(page.getByRole("dialog", { name: "Edit Build" })).toBeVisible();
  });
