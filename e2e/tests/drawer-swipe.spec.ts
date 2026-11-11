import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const drawer = (page: Page, label: string) =>
  page.getByRole("dialog", { name: `${label} swipeable drawer` });

/**
 * A touch swipe: real touch events (CDP) on the mobile Chromium project; elsewhere synthetic
 * touch `PointerEvent`s on the element under the start point (desktop browsers have no touch).
 */
async function swipe(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  touch: boolean,
) {
  const steps = 8;
  if (touch) {
    const client = await page.context().newCDPSession(page);
    const point = (x: number, y: number) => [{ x: Math.round(x), y: Math.round(y) }];
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: point(from.x, from.y),
    });
    for (let i = 1; i <= steps; i++)
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: point(
          from.x + ((to.x - from.x) * i) / steps,
          from.y + ((to.y - from.y) * i) / steps,
        ),
      });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await client.detach();
    return;
  }
  await page.evaluate(
    async ({ from, to, steps }) => {
      const event = (type: string, x: number, y: number) =>
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          pointerId: 11,
          pointerType: "touch",
          isPrimary: true,
          button: 0,
        });
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      // The strip is hidden without a coarse pointer: start on it by reference.
      const target =
        from.x < 20
          ? (document.querySelector("dialog:not([open]) + [data-ok-drawer-swipe-area]") as Element)
          : (document.elementFromPoint(from.x, from.y) as Element);
      target.dispatchEvent(event("pointerdown", from.x, from.y));
      for (let i = 1; i <= steps; i++) {
        await frame();
        window.dispatchEvent(
          event(
            "pointermove",
            from.x + ((to.x - from.x) * i) / steps,
            from.y + ((to.y - from.y) * i) / steps,
          ),
        );
      }
      await frame();
      window.dispatchEvent(event("pointerup", to.x, to.y));
    },
    { from, to, steps },
  );
}

for (const impl of implementations) {
  test.describe(`drawer swipe (${impl})`, () => {
    test.beforeEach(async ({ page }) => {
      await openStory(page, storyId(impl, "drawer", "swipeable"));
    });

    test("opens from the left edge and closes towards it", async ({ page, isMobile }) => {
      const left = drawer(page, "Left");
      const { height } = page.viewportSize() as { width: number; height: number };
      await swipe(page, { x: 5, y: height / 2 }, { x: 300, y: height / 2 }, isMobile);
      await expect(left).toBeVisible();
      await expect.poll(() => left.evaluate((dialog) => dialog.matches(":modal"))).toBe(true);
      await expect
        .poll(() => left.evaluate((dialog) => dialog.hasAttribute("data-ok-swipe-settling")))
        .toBe(false);
      // Focus moved into the drawer, as with its button.
      await expect
        .poll(() => left.evaluate((dialog) => dialog.contains(document.activeElement)))
        .toBe(true);
      const paper = await left.locator("[data-ok-drawer-content]").boundingBox();
      const y = (paper?.y ?? 0) + 40;
      await swipe(page, { x: (paper?.width ?? 200) - 20, y }, { x: 0, y }, isMobile);
      await expect(left).toBeHidden();
    });

    test("closes the bottom drawer with a swipe down; the button still opens it", async ({
      page,
      isMobile,
    }) => {
      const trigger = page.getByRole("button", { name: "Bottom", exact: true });
      if (isMobile) await trigger.tap();
      else await trigger.click();
      const bottom = drawer(page, "Bottom");
      await expect(bottom).toBeVisible();
      // On its title: a vertical swipe on the scrolling list scrolls the list.
      const title = await bottom.getByRole("heading", { name: "Mailbox" }).boundingBox();
      const x = (title?.x ?? 0) + (title?.width ?? 0) / 2;
      const top = (title?.y ?? 0) + (title?.height ?? 0) / 2;
      await swipe(page, { x, y: top }, { x, y: top + 400 }, isMobile);
      await expect(bottom).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  });
}
