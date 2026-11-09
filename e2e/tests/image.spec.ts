import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

for (const impl of implementations) {
  test.describe(`image (${impl})`, () => {
    test("shows the placeholder until the picture arrives, then the picture", async ({ page }) => {
      // Hold the first picture of the List story until the test releases it.
      let release: () => void = () => {};
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(/\/images\/image-1\.svg$/, async (route) => {
        await held;
        await route.continue();
      });
      await openStory(page, storyId(impl, "image", "list"));
      const picture = page.getByRole("img", { name: "Red and blue waves at dusk" });
      const root = page.locator("[data-ok-image]").filter({ has: picture });
      await expect(root).toHaveAttribute("data-ok-state", "loading");
      await expect(picture).toHaveCSS("opacity", "0");
      await expect(root.locator("[data-ok-image-placeholder]")).toHaveCSS("opacity", "1");
      // Other pictures loaded meanwhile.
      await expect(
        page.locator("[data-ok-image]").filter({
          has: page.getByRole("img", { name: "Neon chevrons in the dark" }),
        }),
      ).toHaveAttribute("data-ok-state", "loaded");
      release();
      await expect(root).toHaveAttribute("data-ok-state", "loaded");
      await expect(picture).toHaveCSS("opacity", "1");
      await expect(root.locator("[data-ok-image-placeholder]")).toHaveCSS("opacity", "0");
    });

    test("a broken picture keeps its name and shows the icon", async ({ page }) => {
      await openStory(page, storyId(impl, "image", "loading"));
      const broken = page.getByRole("img", { name: "Harbor at dawn, unavailable" });
      const root = page.locator("[data-ok-image]").filter({ has: broken });
      await expect(root).toHaveAttribute("data-ok-state", "error");
      await expect(root.locator("[data-ok-image-icon]")).toBeVisible();
      await expect(root.locator("[data-ok-image-icon]")).toHaveAttribute("aria-hidden", "true");
      await expect(broken).toHaveCSS("opacity", "0");
      // Visible by default: loaded eagerly, no placeholder.
      const hero = page.getByRole("img", { name: "Sunrise over soft hills" });
      await expect(hero).toHaveAttribute("loading", "eager");
      await expect(
        page
          .locator("[data-ok-image]")
          .filter({ has: hero })
          .locator("[data-ok-image-placeholder]"),
      ).toBeHidden();
    });

    test("crops to the ratio and paints the overlays", async ({ page }) => {
      await openStory(page, storyId(impl, "image", "overlay"));
      const overlays = page.locator("[data-ok-image-overlay]");
      await expect(overlays).toHaveCount(4);
      await expect(overlays.nth(0)).toHaveCSS("background-color", "rgba(20, 26, 33, 0.48)");
      await expect(overlays.nth(2)).toHaveCSS("background-image", /linear-gradient\(to top/);
      for (const box of await page.locator("[data-ok-image]").all()) {
        const size = await box.boundingBox();
        expect(Math.abs((size?.width ?? 0) - (size?.height ?? 1))).toBeLessThan(1);
      }
    });
  });
}

test("HTML reports ok:image:load and ok:image:error", async ({ page }) => {
  await page.route(/\/images\/image-5\.svg$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await openStory(page, storyId("html", "image", "loading"));
  const detail = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        document.addEventListener("ok:image:load", (event) => {
          const src = (event as CustomEvent<{ src: string }>).detail.src;
          if (src.endsWith("image-5.svg")) resolve(src);
        });
      }),
  );
  expect(detail).toMatch(/images\/image-5\.svg$/);
  const state = await page.evaluate(() => {
    const root = document.querySelector("[data-ok-image]:has(> img[src$='missing.svg'])");
    return root?.getAttribute("data-ok-state");
  });
  expect(state).toBe("error");
});
