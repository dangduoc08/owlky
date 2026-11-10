import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Pixel columns where each children list's line down meets its children's lines. */
function connectorGaps(page: Page) {
  return page.evaluate(() => {
    const gaps: number[] = [];
    for (const list of document.querySelectorAll<HTMLElement>(
      "[data-ok-organization-chart-children]",
    )) {
      // Collapsed children (and lists inside them) draw no lines.
      if (list.getClientRects().length === 0) continue;
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

/** A node's toggle button, by its `data-ok-node-id`. */
const toggleOf = (page: Page, id: string) =>
  page.locator(`[data-ok-node-id="${id}"] > [data-ok-organization-chart-toggle]`);

for (const impl of implementations) {
  test.describe(`organization chart (${impl})`, () => {
    test("every line down starts at its label's center", async ({ page }) => {
      for (const story of [
        "simple",
        "standard",
        "group",
        "lines",
        "collapsible",
        "lazy-children",
      ]) {
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

    test("toggles collapse and expand branches by pointer, label and keyboard", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "organization-chart", "collapsible"));
      // Elias starts collapsed: his toggle names the three people it hides.
      await expect(page.getByRole("button", { name: "Elias Novak's reports 3" })).toBeVisible();
      // The name changes with the count: follow the toggles by node from here.
      const elias = toggleOf(page, "elias");
      await expect(elias).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByText("Sofia Marchetti", { exact: true })).toBeHidden();
      await elias.scrollIntoViewIfNeeded();
      if (isMobile) await elias.tap();
      else await elias.click();
      await expect(elias).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByText("Sofia Marchetti", { exact: true })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Elias Novak's reports", exact: true }),
      ).toHaveCount(1);
      // A click on a card toggles it too.
      await page.getByText("Jonah Pereira", { exact: true }).click();
      await expect(page.getByText("Aiko Tanaka", { exact: true })).toBeHidden();
      await expect(page.getByRole("button", { name: "Jonah Pereira's reports 1" })).toBeVisible();
      const jonah = toggleOf(page, "jonah");
      await expect(jonah).toHaveAttribute("aria-expanded", "false");
      // Keyboard: the toggle is a button.
      await jonah.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByText("Aiko Tanaka", { exact: true })).toBeVisible();
      await page.keyboard.press("Space");
      await expect(page.getByText("Aiko Tanaka", { exact: true })).toBeHidden();
      await expect(jonah).toBeFocused();
      // The methods: collapse all, then the leads only.
      await page.getByRole("button", { name: "Collapse all" }).click();
      await expect(page.getByText("Priya Raman", { exact: true })).toBeHidden();
      await expect(page.getByRole("button", { name: "Maya Lindqvist's reports 10" })).toBeVisible();
      await page.getByRole("button", { name: "Show the leads only" }).click();
      await expect(page.getByText("Priya Raman", { exact: true })).toBeVisible();
      await expect(page.getByText("Elias Novak", { exact: true })).toBeHidden();
      await page.getByRole("button", { name: "Expand all" }).click();
      await expect(page.getByText("Tomás Rivera", { exact: true })).toBeVisible();
      const gaps = await connectorGaps(page);
      for (const gap of gaps) expect(gap).toBeLessThan(1.5);
    });

    test("lazy children load on the first expand", async ({ page }) => {
      await openStory(page, storyId(impl, "organization-chart", "lazy-children"));
      const priya = toggleOf(page, "priya");
      await expect(priya).toHaveAccessibleName("Priya Raman's reports");
      await expect(priya).toHaveAttribute("aria-expanded", "false");
      await priya.scrollIntoViewIfNeeded();
      await priya.click();
      await expect(priya).toHaveAttribute("aria-busy", "true");
      await expect(page.getByText("Elias Novak", { exact: true })).toBeVisible();
      await expect(priya).not.toHaveAttribute("aria-busy", "true");
      await expect(priya).toHaveAttribute("aria-expanded", "true");
      // Loaded nodes collapse like the others.
      const elias = toggleOf(page, "elias");
      await elias.click();
      await expect(page.getByText("Sofia Marchetti", { exact: true })).toBeHidden();
      await expect(page.getByRole("button", { name: "Elias Novak's reports 3" })).toBeVisible();
      // Collapsed again and reopened: no second load.
      await priya.click();
      await priya.click();
      await expect(priya).not.toHaveAttribute("aria-busy", "true");
      await expect(page.getByText("Elias Novak", { exact: true })).toBeVisible();
    });
  });
}
