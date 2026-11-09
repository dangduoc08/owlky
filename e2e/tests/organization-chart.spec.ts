import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Pixel columns where each children list's line down meets its children's lines. */
function connectorGaps(page: Page) {
  return page.evaluate(() => {
    const gaps: number[] = [];
    for (const list of document.querySelectorAll("[data-ok-organization-chart-children]")) {
      const down = getComputedStyle(list, "::before");
      const listBox = list.getBoundingClientRect();
      const x = listBox.left + Number.parseFloat(down.left);
      // The label's center above the list.
      const label = (list.parentElement as Element).querySelector(
        ":scope > [data-ok-organization-chart-label] > *",
      ) as Element;
      const box = label.getBoundingClientRect();
      gaps.push(Math.abs(x - (box.left + box.width / 2)));
    }
    return gaps;
  });
}

for (const impl of implementations) {
  test.describe(`organization chart (${impl})`, () => {
    test("every line down starts at its label's center", async ({ page }) => {
      for (const story of ["simple", "standard", "group", "lines"]) {
        await openStory(page, storyId(impl, "organization-chart", story));
        const gaps = await connectorGaps(page);
        expect(gaps.length).toBeGreaterThan(0);
        for (const gap of gaps) expect(gap, story).toBeLessThan(1.5);
      }
    });

    test("a card's menu opens from its button, by pointer and keyboard", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "organization-chart", "standard"));
      const button = page.getByRole("button", { name: "Actions for Priya Raman" });
      await button.scrollIntoViewIfNeeded();
      if (isMobile) await button.tap();
      else await button.click();
      const menu = page.getByRole("menu", { name: "Actions for Priya Raman" });
      await expect(menu).toBeVisible();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(menu.getByRole("menuitem")).toHaveText(["Delete", "Edit"]);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(button).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("menuitem").first()).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(menu.getByRole("menuitem").nth(1)).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(menu).toBeHidden();
    });

    test("wide charts scroll inside their area, from the first node", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await openStory(page, storyId(impl, "organization-chart", "group"));
      const area = page.getByRole("region", { name: "Organization chart by team, scrollable" });
      const sizes = await area.evaluate((el) => ({
        scroll: el.scrollWidth,
        client: el.clientWidth,
        page: document.documentElement.scrollWidth,
      }));
      expect(sizes.scroll).toBeGreaterThan(sizes.client);
      expect(sizes.page).toBeLessThanOrEqual(375);
      // The first team is reachable at the start (not cut off by centering).
      const first = await page
        .getByText("Product design", { exact: true })
        .evaluate((el) => el.getBoundingClientRect().left);
      const start = await area.evaluate((el) => el.getBoundingClientRect().left);
      expect(first).toBeGreaterThanOrEqual(start);
      // The keyboard scrolls the focused area.
      await area.focus();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => area.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    });

    test("the disabled root action can't be pressed", async ({ page }) => {
      await openStory(page, storyId(impl, "organization-chart", "group"));
      await expect(page.getByRole("button", { name: "Actions for Maya Lindqvist" })).toBeDisabled();
    });
  });
}
