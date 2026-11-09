import { expect, type Locator, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const step = (page: Page) => page.locator("[data-ok-walktour-step][data-ok-open]");
const beacon = (page: Page) => page.locator("[data-ok-walktour-beacon]");
const action = (page: Page, name: string) =>
  step(page).locator(`[data-ok-walktour-action="${name}"]`);

const press = async (page: Page, target: Locator) => {
  const touch = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
  if (touch) await target.tap();
  else await target.click();
};

for (const impl of implementations) {
  test.describe(`walktour (${impl})`, () => {
    test("walks through the reference tour with Next, Back and Done", async ({ page }) => {
      await openStory(page, storyId(impl, "walktour", "basic"));
      await expect(step(page)).toHaveAttribute("aria-labelledby", /step-1-title$/);
      await expect(action(page, "primary")).toBeFocused();
      await expect(action(page, "primary")).toHaveText("Next (1/5)");
      await expect(action(page, "back")).toBeHidden();
      await expect(page.locator("[data-ok-walktour-live]")).toHaveText("Step 1 of 5");
      // The overlay leaves a cut-out around the welcome card.
      await expect(page.locator("[data-ok-walktour-hole]")).toHaveAttribute("d", /^M/);
      await press(page, action(page, "primary"));
      await expect(step(page)).toHaveAttribute("aria-labelledby", /step-2-title$/);
      await expect(action(page, "back")).toBeVisible();
      await press(page, action(page, "back"));
      await expect(step(page)).toHaveAttribute("aria-labelledby", /step-1-title$/);
      for (let i = 0; i < 4; i++) await press(page, action(page, "primary"));
      await expect(step(page)).toHaveAttribute("aria-labelledby", /step-5-title$/);
      await expect(step(page)).toHaveAttribute("data-ok-theme", "dark");
      await expect(action(page, "primary")).toHaveText("Done");
      await expect(action(page, "skip")).toBeHidden();
      await press(page, action(page, "primary"));
      await expect(step(page)).toHaveCount(0);
      await expect(page.locator("[data-ok-walktour-overlay]")).toBeHidden();
    });

    test("keeps Tab inside a step, closes with Escape and restarts from the button", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "walktour", "basic"));
      await expect(action(page, "primary")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(action(page, "close")).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(action(page, "primary")).toBeFocused();
      await page.keyboard.press("Escape");
      // Closing shows the next step's beacon (beacons are off in this tour: its tooltip).
      await expect(step(page)).toHaveAttribute("aria-labelledby", /step-2-title$/);
      await press(page, action(page, "skip"));
      await expect(step(page)).toHaveCount(0);
      await press(page, page.getByRole("button", { name: "Restart the tour" }));
      await expect(step(page)).toHaveAttribute("aria-labelledby", /step-1-title$/);
    });

    test("blocks the page under the overlay", async ({ page }) => {
      await openStory(page, storyId(impl, "walktour", "basic"));
      const box = (await page
        .getByRole("button", { name: "Restart the tour" })
        .boundingBox()) as NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;
      const hit = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x as number, y as number)?.localName,
        [box.x + box.width / 2, box.y + box.height / 2],
      );
      expect(hit).toBe("path");
    });

    test("opens steps from beacons, centers a step and lets the spotlight be clicked", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "walktour", "beacons"));
      await expect(step(page)).toHaveAttribute("data-ok-centered", "");
      await expect(action(page, "primary")).toHaveAccessibleName("Close");
      await press(page, action(page, "primary"));
      await expect(step(page)).toHaveCount(0);
      await expect(beacon(page)).toBeVisible();
      await expect(beacon(page)).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(step(page)).toBeVisible();
      await expect(step(page)).not.toHaveAttribute("aria-modal", "true");
      // Spotlight clicks: the button in the spotlight can be pressed.
      const request = page.getByRole("button", { name: "Request" });
      const box = (await request.boundingBox()) as NonNullable<
        Awaited<ReturnType<Locator["boundingBox"]>>
      >;
      const hit = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x as number, y as number)?.textContent,
        [box.x + box.width / 2, box.y + box.height / 2],
      );
      expect(hit).toBe("Request");
      await press(page, action(page, "primary"));
      await press(page, beacon(page));
      // No overlay on the last step.
      await expect(step(page)).toBeVisible();
      await expect(page.locator("[data-ok-walktour-overlay]")).toBeHidden();
    });
  });
}
