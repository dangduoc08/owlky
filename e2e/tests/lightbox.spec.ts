import { expect, type Locator, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const lightbox = (page: Page) => page.locator("dialog[data-ok-lightbox]");
const counter = (page: Page) => page.locator("dialog[open] [data-ok-lightbox-counter]");
const current = (page: Page) =>
  page.locator("dialog[open] [data-ok-carousel-slide]:not([inert])").getAttribute("aria-label");

const press = async (page: Page, target: Locator) => {
  const touch = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
  if (touch) await target.tap();
  else await target.click();
};

/** Waits for the pictures of the open lightbox (zoom limits come from their natural sizes). */
const pictures = (page: Page) =>
  page.waitForFunction(() =>
    [
      ...document.querySelectorAll<HTMLImageElement>(
        "dialog[open] [data-ok-carousel-slide]:not([inert]) img",
      ),
    ].every((image) => image.complete && image.naturalWidth > 0),
  );

for (const impl of implementations) {
  test.describe(`lightbox (${impl})`, () => {
    test("opens at a picture, moves, counts and closes back to the trigger", async ({ page }) => {
      await openStory(page, storyId(impl, "lightbox", "basic"));
      const trigger = page.getByRole("button", { name: "Forest in the fog" });
      await press(page, trigger);
      await expect(lightbox(page)).toHaveAttribute("open", "");
      await expect(page.getByRole("dialog", { name: "Lightbox" })).toBeVisible();
      await expect(counter(page)).toHaveText("3 / 5");
      await expect.poll(() => current(page)).toBe("3 of 5");
      await expect(page.getByRole("heading", { name: "Forest in the fog" })).toBeVisible();
      await press(page, page.getByRole("button", { name: "Next", exact: true }));
      await expect(counter(page)).toHaveText("4 / 5");
      await page.keyboard.press("ArrowLeft");
      await expect(counter(page)).toHaveText("3 / 5");
      // Thumbnails jump to their slide.
      await press(page, page.getByRole("button", { name: "5 of 5" }));
      await expect(counter(page)).toHaveText("5 / 5");
      await expect(page.locator("dialog[open] video")).toBeVisible();
      // Loops around.
      await press(page, page.getByRole("button", { name: "Next", exact: true }));
      await expect(counter(page)).toHaveText("1 / 5");
      await page.keyboard.press("Escape");
      await expect(lightbox(page)).not.toHaveAttribute("open", "");
      await expect(trigger).toBeFocused();
    });

    test("zooms with the toolbar and the keyboard, then pans", async ({ page }) => {
      await openStory(page, storyId(impl, "lightbox", "basic"));
      await press(page, page.getByRole("button", { name: "Mountain lake at sunrise" }));
      await pictures(page);
      const zoomIn = page.getByRole("button", { name: "Zoom in" });
      const zoomOut = page.getByRole("button", { name: "Zoom out" });
      await expect(zoomOut).toHaveAttribute("aria-disabled", "true");
      await expect(zoomIn).not.toHaveAttribute("aria-disabled", "true");
      await press(page, zoomIn);
      await expect(lightbox(page)).toHaveAttribute("data-ok-zoomed", "");
      await expect(page.locator("[data-ok-lightbox-live]")).toHaveText(/^Zoom \d+%$/);
      const frame = page.locator(
        "dialog[open] [data-ok-carousel-slide]:not([inert]) [data-ok-lightbox-zoom]",
      );
      // Safari doesn't focus clicked buttons: keys go to the slides.
      await page.locator("dialog[open] [data-ok-carousel-viewport]").focus();
      // The zoomed picture overflows its frame on one axis at least (the zoom limit depends on
      // the screen's pixel ratio): the arrow keys pan it instead of changing slides.
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() =>
          frame.evaluate((e) => {
            const style = (e as HTMLElement).style;
            return `${style.getPropertyValue("--_ok-lightbox-x")} ${style.getPropertyValue("--_ok-lightbox-y")}`;
          }),
        )
        .not.toBe("0px 0px");
      // Panning doesn't change slides.
      await expect(counter(page)).toHaveText("1 / 5");
      await page.keyboard.press("-");
      await expect(lightbox(page)).not.toHaveAttribute("data-ok-zoomed", "");
    });

    test("plays the slideshow and toggles the captions and thumbnails", async ({ page }) => {
      await openStory(page, storyId(impl, "lightbox", "toolbar"), "light", "slideshowDelay:200");
      await press(page, page.getByRole("button", { name: "Neon arches" }));
      await press(page, page.getByRole("button", { name: "Play" }));
      await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
      await expect(counter(page)).toHaveText("3 / 4");
      await press(page, page.getByRole("button", { name: "Pause" }));
      await press(page, page.getByRole("button", { name: "Hide captions" }));
      await expect(page.locator("dialog[open] [data-ok-lightbox-caption]").first()).toBeHidden();
      await press(page, page.getByRole("button", { name: "Show captions" }));
      await press(page, page.getByRole("button", { name: "Hide thumbnails" }));
      await expect(page.locator("dialog[open] [data-ok-lightbox-thumbnails]")).toBeHidden();
      // Rotate keeps the picture inside the slide.
      await press(page, page.getByRole("button", { name: "Rotate clockwise" }));
      await expect(
        page.locator("dialog[open] [data-ok-carousel-slide]:not([inert])"),
      ).toHaveAttribute("data-ok-rotation", "90");
      // A click beside the image closes it (closeOnBackdropClick).
      const slide = page.locator("dialog[open] [data-ok-carousel-slide]:not([inert])");
      const box = (await slide.boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      await page.mouse.click(box.x + 4, box.y + box.height * 0.7);
      await expect(lightbox(page)).not.toHaveAttribute("open", "");
    });

    test("downloads the current picture", async ({ page, browserName }) => {
      test.skip(browserName === "webkit", "WebKit downloads open in the page in Playwright.");
      await openStory(page, storyId(impl, "lightbox", "toolbar"));
      await press(page, page.getByRole("button", { name: "Desert road" }));
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        press(page, page.getByRole("button", { name: "Download" })),
      ]);
      expect(download.suggestedFilename()).toBe("photo-4.svg");
    });

    test("the inline lightbox is a carousel in the page", async ({ page }) => {
      await openStory(page, storyId(impl, "lightbox", "inline"));
      const root = page.locator("[data-ok-lightbox][data-ok-inline]");
      await expect(root).toBeVisible();
      await expect(root.locator("[data-ok-lightbox-close]")).toBeHidden();
      await press(page, root.getByRole("button", { name: "Next", exact: true }));
      await expect(root.locator("[data-ok-lightbox-counter]")).toHaveText("2 / 4");
    });

    test("scrolls between slides on touch screens and pulls down to close", async ({ page }) => {
      const touch = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
      test.skip(!touch, "Touch screens only (mobile project).");
      await openStory(page, storyId(impl, "lightbox", "toolbar"));
      await page.getByRole("button", { name: "Mountain lake at sunrise" }).tap();
      await expect(counter(page)).toHaveText("1 / 4");
      // A swipe is the viewport's native scroll (once the opening jump has settled).
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
      const viewport = page.locator("dialog[open] [data-ok-carousel-viewport]");
      await viewport.evaluate((element) =>
        element.scrollBy({ left: element.clientWidth, behavior: "instant" }),
      );
      await expect(counter(page)).toHaveText("2 / 4");
      // Pull the slide down with a touch pointer.
      await page
        .locator("dialog[open] [data-ok-carousel-slide]:not([inert]) [data-ok-lightbox-zoom]")
        .evaluate((frame) => {
          const box = frame.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const send = (type: string, y: number) =>
            frame.dispatchEvent(
              new PointerEvent(type, {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                pointerId: 5,
                pointerType: "touch",
                isPrimary: true,
              }),
            );
          send("pointerdown", box.top + 40);
          for (let step = 1; step <= 6; step++) send("pointermove", box.top + 40 + step * 50);
          send("pointerup", box.top + 340);
        });
      await expect(lightbox(page)).not.toHaveAttribute("open", "");
    });
  });
}
