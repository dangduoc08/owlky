import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const ANCHORS = ["Left", "Right", "Top", "Bottom"] as const;

const drawerFor = (page: Page, label: string) =>
  page.getByRole("dialog", { name: `${label} drawer` });

async function open(page: Page, label: string, tap: boolean) {
  const trigger = page.getByRole("button", { name: label, exact: true });
  if (tap) await trigger.tap();
  else await trigger.click();
  const drawer = drawerFor(page, label);
  await expect(drawer).toBeVisible();
  return { trigger, drawer };
}

/** Paper box, viewport and the first menu item's size, for layout and parity checks. */
function measure(page: Page, label: string) {
  return drawerFor(page, label).evaluate((dialog) => {
    const paper = dialog.querySelector("[data-ok-drawer-content]") as HTMLElement;
    const box = paper.getBoundingClientRect();
    const item = (paper.querySelector("button") as HTMLElement).getBoundingClientRect();
    return {
      box: [box.left, box.top, box.right, box.bottom].map(Math.round),
      viewport: [window.innerWidth, window.innerHeight],
      item: [Math.round(item.width), Math.round(item.height)],
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
}

for (const impl of implementations) {
  test.describe(`drawer (${impl})`, () => {
    test.beforeEach(async ({ page }) => {
      await openStory(page, storyId(impl, "drawer", "anchor"));
    });

    test("opens at each edge, focuses inside and Escape returns focus", async ({
      page,
      isMobile,
      browserName,
    }) => {
      for (const label of ANCHORS) {
        const { trigger, drawer } = await open(page, label, isMobile);
        await expect(drawer.getByRole("button", { name: "Inbox" })).toBeFocused();
        const { box, viewport } = await measure(page, label);
        const [w, h] = viewport as [number, number];
        if (label === "Left") expect([box[0], box[1], box[3]]).toEqual([0, 0, h]);
        if (label === "Right") expect([box[2], box[1], box[3]]).toEqual([w, 0, h]);
        if (label === "Top") expect([box[0], box[1], box[2]]).toEqual([0, 0, w]);
        if (label === "Bottom") expect([box[0], box[2], box[3]]).toEqual([0, w, h]);
        await page.keyboard.press("Escape");
        await expect(drawer).toBeHidden();
        if (browserName !== "webkit") await expect(trigger).toBeFocused();
      }
    });

    test("a click or tap on the backdrop closes it", async ({ page, isMobile }) => {
      const { drawer } = await open(page, "Left", isMobile);
      const { viewport } = await measure(page, "Left");
      const [w] = viewport as [number, number];
      if (isMobile) await page.touchscreen.tap(w - 10, 200);
      else await page.mouse.click(w - 10, 200);
      await expect(drawer).toBeHidden();
    });

    test("Tab never reaches the page behind", async ({ page, isMobile }) => {
      await open(page, "Right", isMobile);
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Tab");
        const behind = await page.evaluate(
          () =>
            document.activeElement?.closest("[data-ok-drawer]") === null &&
            document.activeElement !== document.body,
        );
        expect(behind).toBe(false);
      }
    });

    test("has no WCAG 2.2 AA violations while open", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "axe results are engine-independent.");
      for (const theme of ["light", "dark"] as const) {
        await openStory(page, storyId(impl, "drawer", "anchor"), theme);
        await open(page, "Bottom", false);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
      }
    });
  });
}

for (const viewport of viewports) {
  test(`drawer responsive @ ${viewport.name} ${viewport.width}×${viewport.height}: fits, leaves the backdrop, React matches HTML`, async ({
    browser,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
      isMobile: viewport.touch,
    });
    const results: Record<string, unknown[]> = {};
    for (const impl of implementations) {
      const page = await context.newPage();
      await openStory(page, storyId(impl, "drawer", "anchor"));
      results[impl] = [];
      for (const label of ANCHORS) {
        const { drawer } = await open(page, label, viewport.touch);
        const m = await measure(page, label);
        const [left, top, right, bottom] = m.box as [number, number, number, number];
        const [w, h] = m.viewport as [number, number];
        expect(m.overflow, `${impl} ${label} overflow`).toBe(false);
        expect(
          left >= 0 && top >= 0 && right <= w && bottom <= h,
          `${impl} ${label} in viewport`,
        ).toBe(true);
        // At least 56px of backdrop stays reachable across the drawer's axis.
        if (label === "Left" || label === "Right")
          expect(w - (right - left)).toBeGreaterThanOrEqual(56);
        else expect(h - (bottom - top)).toBeGreaterThanOrEqual(56);
        expect(m.item[1], `${impl} ${label} target`).toBeGreaterThanOrEqual(24);
        results[impl]?.push(m);
        await page.keyboard.press("Escape");
        await expect(drawer).toBeHidden();
      }
      await page.close();
    }
    expect(results["react"]).toEqual(results["html"]);
    await context.close();
  });
}
