import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

/** Names of the visible body rows (second cell). */
const names = (page: Page) =>
  page
    .locator("#storybook-root [data-ok-table] > tbody > tr:visible > td:nth-child(2)")
    .allTextContents();

async function press(page: Page, name: string, tap: boolean) {
  const target = page.getByRole("button", { name, exact: true });
  if (tap) await target.tap();
  else await target.click();
}

for (const impl of implementations) {
  test.describe(`table (${impl})`, () => {
    test("sorting, selecting and paging", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "table", "sorting-selecting"));
      expect(await names(page)).toEqual([
        "Frozen yoghurt",
        "Ice cream sandwich",
        "Eclair",
        "Cupcake",
        "Marshmallow",
      ]);
      // Calories: active ascending → descending.
      await press(page, "Calories", isMobile);
      await expect(page.getByRole("columnheader", { name: "Calories" })).toHaveAttribute(
        "aria-sort",
        "descending",
      );
      expect((await names(page))[0]).toBe("KitKat");
      // Name column starts ascending.
      await press(page, "Dessert (100g serving)", isMobile);
      expect((await names(page))[0]).toBe("Cupcake");
      await expect(page.getByRole("columnheader", { name: "Calories" })).not.toHaveAttribute(
        "aria-sort",
        /./,
      );
      // Paging.
      await press(page, "Go to next page", isMobile);
      await expect(page.getByText("6–10 of 12")).toBeVisible();
      expect((await names(page))[0]).toBe("Honeycomb");
      await page.getByRole("combobox", { name: "Rows per page:" }).selectOption("10");
      await expect(page.getByText("1–10 of 12")).toBeVisible();
      // Selection.
      const all = page.getByRole("checkbox", { name: "Select all desserts" });
      await all.check();
      await expect(page.locator("tbody > tr[data-ok-selected]:visible")).toHaveCount(10);
      await all.uncheck();
      await expect(page.locator("tbody > tr[data-ok-selected]")).toHaveCount(0);
      await page.getByRole("checkbox", { name: "Select Donut" }).check();
      expect(await all.evaluate((el) => (el as HTMLInputElement).indeterminate)).toBe(true);
    });

    test("pagination with API pages the rows", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "table", "pagination-with-api"));
      const first = () =>
        page
          .locator("#storybook-root [data-ok-table] > tbody > tr:visible > td:first-child")
          .allTextContents();
      expect(await first()).toEqual([
        "Frozen yoghurt",
        "Ice cream sandwich",
        "Eclair",
        "Cupcake",
        "Gingerbread",
      ]);
      await press(page, "Go to page 3", isMobile);
      expect(await first()).toEqual(["Marshmallow", "Nougat"]);
      await expect(page.getByRole("button", { name: "page 3" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(page.getByRole("button", { name: "Go to next page" })).toBeDisabled();
      await press(page, "Go to previous page", isMobile);
      expect((await first())[0]).toBe("Donut");
    });

    test("collapsible rows open and close", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "table", "collapsible"));
      const button = page.getByRole("button", { name: "Purchase history of Eclair" });
      const history = page.getByRole("table", { name: "Purchase history of Eclair" });
      await expect(history).toBeHidden();
      await press(page, "Purchase history of Eclair", isMobile);
      await expect(history).toBeVisible();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(history).toBeHidden();
    });

    test("fixed header stays visible while the container scrolls", async ({ page }) => {
      await openStory(page, storyId(impl, "table", "grouping-fixed-header"));
      const container = page.getByRole("region", { name: "Countries" });
      await container.evaluate((el) => {
        el.scrollTop = 200;
      });
      const [head, box] = await Promise.all([
        page.getByRole("columnheader", { name: "Population" }).boundingBox(),
        container.boundingBox(),
      ]);
      expect(head && box && head.y >= box.y && head.y < box.y + 120).toBe(true);
    });
  });

  test.describe(`table responsive (${impl})`, () => {
    for (const viewport of viewports) {
      test(`${viewport.name}: page never overflows, table scrolls inside, targets ≥ 24px`, async ({
        page,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "Layout matrix runs once.");
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const story of [
          "basic",
          "sorting-selecting",
          "grouping-fixed-header",
          "collapsible",
        ]) {
          await openStory(page, storyId(impl, "table", story));
          const result = await page.evaluate(() => {
            const out: string[] = [];
            if (document.documentElement.scrollWidth > window.innerWidth)
              out.push("page overflows");
            for (const el of document.querySelectorAll<HTMLElement>(
              "#storybook-root [data-ok-table-container], #storybook-root [data-ok-table-pagination]",
            )) {
              const box = el.getBoundingClientRect();
              if (box.right > window.innerWidth + 0.5) out.push(`${el.localName} beyond viewport`);
            }
            for (const el of document.querySelectorAll<HTMLElement>(
              "#storybook-root button, #storybook-root select",
            )) {
              const box = el.getBoundingClientRect();
              if (box.width === 0) continue;
              if (box.height < 24 || box.width < 24) out.push(`target ${box.width}×${box.height}`);
            }
            const pagination = document.querySelector("[data-ok-table-pagination]");
            return {
              out,
              paginationHeight: pagination?.getBoundingClientRect().height ?? 0,
            };
          });
          expect(result.out, story).toEqual([]);
          if (result.paginationHeight) expect(result.paginationHeight).toBeGreaterThanOrEqual(64);
        }
      });
    }
  });
}
