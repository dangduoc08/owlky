import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Sizes of the four collapses of the story: [width, height] rounded. */
const sizes = (page: Page) =>
  page.locator("[data-ok-collapse]").evaluateAll((all) =>
    all.map((element) => {
      const box = element.getBoundingClientRect();
      return [Math.round(box.width), Math.round(box.height)];
    }),
  );

/**
 * Records every `data-ok-state` the collapses matching `selector` go through (the animation is
 * short: polling for the transient attribute can miss it on a busy machine).
 */
const recordStates = (page: Page, selector: string) =>
  page.evaluate((target) => {
    const seen: string[] = [];
    (window as unknown as { okStates: string[] }).okStates = seen;
    for (const element of document.querySelectorAll(target))
      new MutationObserver(() => {
        const state = element.getAttribute("data-ok-state");
        if (state) seen.push(state);
      }).observe(element, { attributes: true, attributeFilter: ["data-ok-state"] });
  }, selector);
const states = (page: Page) =>
  page.evaluate(() => (window as unknown as { okStates: string[] }).okStates);

for (const impl of implementations) {
  test.describe(`collapse (${impl})`, () => {
    test("the switch opens and closes the four collapses (reduced motion: at once)", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "collapse", "simple-collapse"));
      const show = page.getByRole("switch", { name: "Show" });
      const collapses = page.locator("[data-ok-collapse]");
      await expect(collapses).toHaveCount(4);
      // Closed: the plain ones are gone, the 40px ones show a 40px slice.
      await expect(collapses.nth(0)).toBeHidden();
      await expect(collapses.nth(2)).toBeHidden();
      const closed = await sizes(page);
      expect([closed[0], closed[1]?.[1], closed[2], closed[3]?.[0]]).toEqual([
        [0, 0],
        40,
        [0, 0],
        40,
      ]);
      await show.check();
      await expect(collapses.nth(0)).toBeVisible();
      // Each collapse holds a Paper at elevation 4 (the reference's raised card).
      const papers = page.locator('[data-ok-collapse] > [data-ok-paper][data-ok-elevation="4"]');
      await expect(papers).toHaveCount(4);
      expect(
        await papers.evaluateAll((all) => all.map((p) => getComputedStyle(p).boxShadow !== "none")),
      ).toEqual([true, true, true, true]);
      // Open: the card (100px + 2 × 8px margin); vertical ones stretch to the 120px row (as MUI).
      expect(await sizes(page)).toEqual([
        [116, 120],
        [116, 120],
        [116, 116],
        [116, 116],
      ]);
      await show.uncheck();
      await expect(collapses.nth(0)).toBeHidden();
      expect((await sizes(page))[1]?.[1]).toBe(40);
    });

    test("with motion: the height animates, then the collapse rests open", async ({ page }) => {
      await openStory(page, storyId(impl, "collapse", "simple-collapse"));
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const first = page.locator("[data-ok-collapse]").first();
      await recordStates(page, "#collapse-1");
      await page.getByRole("switch", { name: "Show" }).check();
      await expect(first).not.toHaveAttribute("data-ok-state");
      await expect.poll(() => first.evaluate((e) => e.getAnimations().length)).toBe(0);
      expect(Math.round((await first.boundingBox())?.height ?? 0)).toBe(120);
      await page.getByRole("switch", { name: "Show" }).uncheck();
      await expect(first).toBeHidden();
      expect(await states(page)).toEqual(["entering", "exiting"]);
    });

    test("touch: a tap on the label toggles the collapses", async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        hasTouch: true,
      });
      const page = await context.newPage();
      await openStory(page, storyId(impl, "collapse", "simple-collapse"));
      await page.getByText("Show", { exact: true }).tap();
      await expect(page.locator("[data-ok-collapse]").first()).toBeVisible();
      await context.close();
    });

    test("integrations: nested list, tree view groups and step content are collapses", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "list", "nested"));
      const nested = page.locator("#list-nested-inbox");
      await expect(nested).toHaveAttribute("data-ok-collapse", "");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await recordStates(page, "#list-nested-inbox");
      await page.getByRole("button", { name: "Inbox" }).click();
      await expect(nested).toBeHidden();
      expect(await states(page)).toEqual(["exiting"]);

      await openStory(page, storyId(impl, "tree-view", "simple"));
      await expect(
        page.locator("[data-ok-tree-item-group][data-ok-collapse]").first(),
      ).toBeAttached();

      await openStory(page, storyId(impl, "stepper", "vertical"));
      const contents = page.locator("[data-ok-step-content][data-ok-collapse]");
      await expect(contents).toHaveCount(3);
      await expect(contents.nth(0)).toBeVisible();
      await expect(contents.nth(1)).toBeHidden();
      await page.getByRole("button", { name: "Continue" }).first().click();
      await expect(contents.nth(0)).toBeHidden();
      await expect(contents.nth(1)).toBeVisible();
    });
  });
}
