import { expect, type Locator, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Indexes (1-based labels) of the selected slides. */
const snapped = (page: Page) =>
  page
    .locator("[data-ok-carousel-slide][data-ok-snapped]")
    .evaluateAll((slides) => slides.map((slide) => slide.getAttribute("aria-label")));

const press = async (page: Page, target: Locator) => {
  const touch = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
  if (touch) await target.tap();
  else await target.click();
};

for (const impl of implementations) {
  test.describe(`carousel (${impl})`, () => {
    test("arrows, dots, keys and the live region", async ({ page }) => {
      await openStory(page, storyId(impl, "carousel", "align"));
      const next = page.getByRole("button", { name: "Next slide" });
      const prev = page.getByRole("button", { name: "Previous slide" });
      await expect(prev).toHaveAttribute("aria-disabled", "true");
      await press(page, next);
      await expect.poll(() => snapped(page)).toEqual(["2 of 4"]);
      await expect(page.locator("[data-ok-carousel-live]")).toHaveText("slide 2 of 4");
      await expect(page.getByRole("button", { name: "Go to slide 2" })).toHaveAttribute(
        "aria-current",
        "true",
      );
      await press(page, page.getByRole("button", { name: "Go to slide 4" }));
      await expect.poll(() => snapped(page)).toEqual(["4 of 4"]);
      await expect(next).toHaveAttribute("aria-disabled", "true");
      // A disabled arrow keeps focus and does nothing.
      await next.focus();
      await page.keyboard.press("Enter");
      await expect(next).toBeFocused();
      await page.locator("[data-ok-carousel-viewport]").focus();
      await page.keyboard.press("Home");
      await expect.poll(() => snapped(page)).toEqual(["1 of 4"]);
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => snapped(page)).toEqual(["2 of 4"]);
      await page.keyboard.press("End");
      await expect.poll(() => snapped(page)).toEqual(["4 of 4"]);
    });

    test("loops forward and back", async ({ page }) => {
      await openStory(page, storyId(impl, "carousel", "opacity"));
      await expect(page.locator("[data-ok-carousel]")).toHaveAttribute("data-ok-looping", "");
      await press(page, page.getByRole("button", { name: "Previous slide" }));
      await expect.poll(() => snapped(page)).toEqual(["4 of 4"]);
      for (const label of ["1 of 4", "2 of 4"]) {
        await press(page, page.getByRole("button", { name: "Next slide" }));
        await expect.poll(() => snapped(page)).toEqual([label]);
      }
      // Each slide is in the DOM once, in order.
      const labels = await page
        .locator("[data-ok-carousel-slide]")
        .evaluateAll((s) => s.map((x) => x.getAttribute("aria-label")));
      expect(labels).toEqual(["1 of 4", "2 of 4", "3 of 4", "4 of 4"]);
    });

    test("scrolling the viewport (a swipe) selects the nearest slide", async ({ page }) => {
      await openStory(page, storyId(impl, "carousel", "progress"));
      const viewport = page.locator("[data-ok-carousel-viewport]");
      await viewport.evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
      await expect.poll(() => snapped(page)).toEqual(["4 of 4"]);
      const progress = await page
        .locator("[data-ok-carousel-progress]")
        .evaluate((el) => (el as HTMLElement).style.getPropertyValue("--_ok-carousel-progress"));
      expect(Number(progress)).toBeGreaterThan(0.9);
    });

    test("drags with the mouse", async ({ page, browserName }, info) => {
      test.skip(info.project.name === "mobile", "Mouse dragging (touch scrolls natively).");
      test.skip(browserName === "webkit", "WebKit's synthetic drags start a text selection.");
      await openStory(page, storyId(impl, "carousel", "align"));
      const box = await page.locator("[data-ok-carousel-viewport]").boundingBox();
      if (!box) throw new Error("no viewport");
      await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 8 });
      await page.mouse.up();
      await expect.poll(() => snapped(page)).toEqual(["2 of 4"]);
    });

    test("fades between slides; hidden slides can't be reached", async ({ page }) => {
      await openStory(page, storyId(impl, "carousel", "fade"));
      await press(page, page.getByRole("button", { name: "Next slide" }));
      await expect.poll(() => snapped(page)).toEqual(["2 of 4"]);
      const hidden = await page
        .locator("[data-ok-carousel-slide]:not([data-ok-snapped])")
        .evaluateAll((slides) => slides.map((slide) => getComputedStyle(slide).visibility));
      expect(hidden).toEqual(["hidden", "hidden", "hidden"]);
    });

    test("thumbnails select and follow the slides", async ({ page }) => {
      await openStory(page, storyId(impl, "carousel", "thumbs-x"));
      const thumbs = page.locator("[data-ok-carousel-thumb]");
      await press(page, thumbs.nth(5));
      await expect.poll(() => snapped(page)).toEqual(["6 of 8"]);
      await expect(page.locator("[data-ok-carousel-counter]")).toHaveText("6/8");
      await expect(thumbs.nth(5)).toHaveAttribute("aria-current", "true");
      await press(page, page.getByRole("button", { name: "Next slide" }));
      await expect(thumbs.nth(6)).toHaveAttribute("aria-current", "true");
    });

    test("autoplay waits for the play button with reduced motion, then plays and pauses", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "carousel", "autoplay"));
      const root = page.locator("[data-ok-carousel]");
      await expect(root).not.toHaveAttribute("data-ok-playing", "");
      const play = page.getByRole("button", { name: "Play" });
      await press(page, play);
      await expect(root).toHaveAttribute("data-ok-playing", "");
      await expect(page.locator("[data-ok-carousel-live]")).toHaveAttribute("aria-live", "off");
      await page.mouse.move(0, 0);
      await expect.poll(() => snapped(page), { timeout: 9000 }).toEqual(["2 of 4"]);
      await press(page, page.getByRole("button", { name: "Pause" }));
      await expect(root).not.toHaveAttribute("data-ok-playing", "");
    });

    test("vertical and right-to-left carousels answer their keys", async ({ page }) => {
      await openStory(page, storyId(impl, "carousel", "y-axis"));
      await page.locator("[data-ok-carousel-viewport]").focus();
      await page.keyboard.press("ArrowDown");
      await expect.poll(() => snapped(page)).toEqual(["2 of 4"]);
      await openStory(page, storyId(impl, "carousel", "right-to-left"));
      await page.locator("[data-ok-carousel-viewport]").focus();
      await page.keyboard.press("ArrowLeft");
      await expect.poll(() => snapped(page)).toEqual(["2 of 4"]);
    });

    test("tab into a slide scrolls to it", async ({ page, browserName }) => {
      test.skip(browserName === "webkit", "WebKit doesn't Tab to buttons (AGENTS.md).");
      await openStory(page, storyId(impl, "carousel", "dots-number"));
      await page.locator("[data-ok-carousel-viewport]").focus();
      for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
      const focused = await page.evaluate(
        () =>
          document.activeElement?.closest("[data-ok-carousel-slide]")?.getAttribute("aria-label") ??
          null,
      );
      expect(focused).not.toBeNull();
      await expect.poll(() => snapped(page)).toContain(focused);
    });
  });
}
