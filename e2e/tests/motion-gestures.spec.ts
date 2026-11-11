import { expect, type Locator, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** The translate of a Motion, in px. */
const translate = (locator: Locator) =>
  locator.evaluate((element) => {
    const value = getComputedStyle(element).translate;
    if (value === "none") return { x: 0, y: 0 };
    const [x = "0", y = "0"] = value.split(" ");
    return { x: Number.parseFloat(x), y: Number.parseFloat(y) };
  });

const center = async (locator: Locator) => {
  const box = (await locator.boundingBox()) as {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

/** A real drag: the mouse on desktop, CDP touch events on the mobile (Chromium) project. */
async function dragBy(page: Page, locator: Locator, dx: number, dy: number, touch: boolean) {
  const from = await center(locator);
  const steps = 8;
  if (!touch) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let i = 1; i <= steps; i++)
      await page.mouse.move(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
    await page.mouse.up();
    return;
  }
  const client = await page.context().newCDPSession(page);
  const point = (x: number, y: number) => [{ x: Math.round(x), y: Math.round(y) }];
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: point(from.x, from.y),
  });
  for (let i = 1; i <= steps; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: point(from.x + (dx * i) / steps, from.y + (dy * i) / steps),
    });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}

for (const impl of implementations) {
  test.describe(`motion gestures (${impl})`, () => {
    test.beforeEach(async ({ page }) => {
      await openStory(page, storyId(impl, "motion", "gestures"));
    });

    test("drags a card inside its stage, also with a touch", async ({ page, isMobile }) => {
      const card = page.getByRole("group", { name: "Movable card" });
      await card.scrollIntoViewIfNeeded();
      await dragBy(page, card, 60, 40, isMobile);
      // Reduced motion (openStory): no glide, the card stops where it was let go.
      await expect.poll(() => translate(card)).toEqual({ x: 60, y: 40 });
      // Far past the stage: it stays inside (elastic overdrag springs back at once).
      await dragBy(page, card, 2000, 0, isMobile);
      const stage = await page.locator("#gesture-drag-stage").boundingBox();
      const box = await card.boundingBox();
      expect(Math.round((box?.x ?? 0) + (box?.width ?? 0))).toBeLessThanOrEqual(
        Math.round((stage?.x ?? 0) + (stage?.width ?? 0)) + 1,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

    test("moves the focused card with the arrow keys", async ({ page }) => {
      const card = page.getByRole("group", { name: "Movable card" });
      await card.focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowDown");
      await expect.poll(() => translate(card)).toEqual({ x: 10, y: 10 });
      await page.keyboard.press("Shift+ArrowRight");
      await expect.poll(() => translate(card)).toEqual({ x: 60, y: 10 });
      // Its stage stops it: the stage's padding (24px) is as far left as it goes.
      await page.keyboard.press("Shift+ArrowLeft");
      await page.keyboard.press("Shift+ArrowLeft");
      await page.keyboard.press("Shift+ArrowLeft");
      await expect.poll(async () => Math.round((await translate(card)).x)).toBe(-24);
    });

    test("keeps a horizontal card on its axis", async ({ page, isMobile }) => {
      const card = page.getByRole("group", { name: "Card that moves left and right" });
      await card.scrollIntoViewIfNeeded();
      await dragBy(page, card, 40, 60, isMobile);
      const moved = await translate(card);
      expect(moved.y).toBe(0);
      expect(moved.x).toBeGreaterThan(0);
    });

    test("springs a button on hover and press", async ({ page, isMobile }) => {
      test.skip(isMobile, "Hover states follow a mouse or a pen only.");
      const button = page.getByRole("button", { name: "Spring" });
      const motion = button.locator("xpath=..");
      await button.hover();
      await expect
        .poll(() => motion.evaluate((element) => getComputedStyle(element).scale))
        .toBe("1.1");
      await page.mouse.down();
      await expect
        .poll(() => motion.evaluate((element) => getComputedStyle(element).scale))
        .toBe("0.9");
      await page.mouse.up();
      await page.mouse.move(0, 0);
      await expect
        .poll(() => motion.evaluate((element) => getComputedStyle(element).scale))
        .toBe("none");
    });
  });
}
