import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["vertical", "horizontal", "layout"] as const;

/** The thumb color in effect, resolved by the engine (both scrollbar paths). */
const thumb = (page: Page) =>
  page.locator("#storybook-root [data-ok-scrollbar]").evaluate((area) => {
    const probe = document.createElement("i");
    probe.style.color = "var(--_ok-scrollbar-now)";
    area.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });

for (const impl of implementations) {
  test.describe(`scrollbar (${impl})`, () => {
    test("keyboard focus scrolls the area and shows the thumb", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "scrollbar", "vertical"));
      const area = page.getByRole("region", { name: "scrollable content" });
      if (!isMobile) expect(await thumb(page)).toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
      await area.focus();
      await expect(area).toBeFocused();
      await page.keyboard.press("PageDown");
      await expect.poll(() => area.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
      expect(await thumb(page)).toMatch(/145,? 158,? 171/);
    });

    test("horizontal content scrolls sideways", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "scrollbar", "horizontal"));
      const area = page.getByRole("region", { name: "scrollable content" });
      const { scrollWidth, clientWidth } = await area.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(scrollWidth).toBeGreaterThan(clientWidth);
      if (isMobile) {
        // Playwright has no touch-pan gesture: scroll programmatically on touch projects.
        await area.evaluate((el) => el.scrollBy({ left: 200 }));
      } else {
        await area.hover();
        await page.mouse.wheel(200, 0);
      }
      await expect.poll(() => area.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    });

    test("the dark theme uses the dark thumb tone", async ({ page }) => {
      await openStory(page, storyId(impl, "scrollbar", "vertical"), "dark", "autoHide:!false");
      expect(await thumb(page)).toMatch(/99,? 115,? 129/);
    });
  });

  test.describe(`scrollbar responsive (${impl})`, () => {
    for (const viewport of viewports) {
      test(`${viewport.name}: no page overflow, areas scroll inside, layout stacks below 900px`, async ({
        page,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "Layout matrix runs once.");
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const story of STORIES) {
          await openStory(page, storyId(impl, "scrollbar", story));
          const result = await page.evaluate(() => {
            const problems: string[] = [];
            if (document.documentElement.scrollWidth > window.innerWidth)
              problems.push("page overflows");
            const area = document.querySelector<HTMLElement>("#storybook-root [data-ok-scrollbar]");
            if (!area) return { problems: ["no area"], box: null, columns: 0 };
            const box = area.getBoundingClientRect();
            if (box.right > window.innerWidth + 0.5) problems.push("area beyond viewport");
            if (area.scrollHeight <= area.clientHeight && area.scrollWidth <= area.clientWidth)
              problems.push("area doesn't scroll");
            for (const p of area.querySelectorAll("p:not(.sb-wide)"))
              if (p.scrollWidth > p.clientWidth + 1) problems.push("text overflows its box");
            const layout = document.querySelector<HTMLElement>(".sb-layout");
            const columns = layout
              ? getComputedStyle(layout).gridTemplateColumns.split(" ").length
              : 0;
            return {
              problems,
              box: { width: Math.round(box.width), height: Math.round(box.height) },
              columns,
            };
          });
          expect(result.problems, `${story}`).toEqual([]);
          if (story === "layout") expect(result.columns).toBe(viewport.width >= 900 ? 3 : 1);
        }
      });
    }

    test("React and HTML measure the same", async ({ page, browserName }) => {
      test.skip(impl !== "html" || browserName !== "chromium", "Compared once.");
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const story of STORIES) {
          const boxes: string[] = [];
          for (const side of implementations) {
            await openStory(page, storyId(side, "scrollbar", story));
            const box = await page.locator("#storybook-root [data-ok-scrollbar]").evaluate((el) => {
              const r = el.getBoundingClientRect();
              return `${Math.round(r.width)}×${Math.round(r.height)} ${el.scrollWidth}×${el.scrollHeight}`;
            });
            boxes.push(box);
          }
          expect(boxes[0], `${viewport.name} ${story}`).toBe(boxes[1]);
        }
      }
    });
  });
}
