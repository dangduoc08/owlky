import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

for (const impl of implementations) {
  test.describe(`motion (${impl})`, () => {
    test("in view: the entrance plays; reduced motion shows the content at once", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "motion", "in-view"));
      const cards = page.locator("[data-ok-motion]:has(> [data-ok-card])");
      await expect(cards).toHaveCount(5);
      for (const card of await cards.all())
        await expect(card).toHaveAttribute("data-ok-state", "enter");
      // Reduced motion (set by openStory): already in place and opaque.
      await expect(cards.first()).toHaveCSS("opacity", "1");
      await expect(cards.last()).toHaveCSS("transform", "none");
    });

    test("scroll: items enter as they scroll into view", async ({ page }) => {
      await openStory(page, storyId(impl, "motion", "scroll"));
      const last = page.locator("[data-ok-motion]:has(> [data-ok-card])").last();
      // Not seen yet: waiting at the start of its entrance (faded out).
      await expect(last).toHaveAttribute("data-ok-state", "initial");
      await expect(last).toHaveCSS("opacity", "0");
      await page.locator("[data-ok-scrollbar]").evaluate((area) => {
        area.scrollTop = area.scrollHeight;
      });
      await expect(last).toHaveAttribute("data-ok-state", "enter");
      await expect(last).toHaveCSS("opacity", "1");
    });

    test("text: read whole, letters hidden from assistive technologies", async ({ page }) => {
      await openStory(page, storyId(impl, "motion", "text"));
      await expect(page.getByRole("heading", { name: "Owlky moves" })).toBeVisible();
      await expect(page.locator("[data-ok-motion-char]")).toHaveCount(10);
      await expect(page.locator("[data-ok-motion-text] > [aria-hidden='true']")).toHaveCount(1);
    });

    test("dialog: the paper plays its entrance when the dialog opens", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "motion", "dialog-story"));
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const trigger = page.getByRole("button", { name: "Zoom in" });
      if (isMobile) await trigger.tap();
      else await trigger.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const paper = dialog.locator("[data-ok-dialog-paper]");
      await expect(paper).toHaveAttribute("data-ok-variant", "zoomIn");
      await expect(paper).toHaveAttribute("data-ok-state", "enter");
      await expect(paper).toHaveCSS("animation-name", "ok-motion");
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });

    test("background: loops run without reduced motion and pause with paused", async ({ page }) => {
      await openStory(page, storyId(impl, "motion", "background"));
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const loops = page.locator("[data-ok-motion]");
      await expect(loops.first()).toHaveCSS("animation-name", "ok-motion-kenburns");
      await expect(loops.first()).toHaveCSS("animation-play-state", "running");
      await openStory(page, storyId(impl, "motion", "background"), "light", "paused:!true");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      for (const loop of await loops.all())
        await expect(loop).toHaveCSS("animation-play-state", "paused");
    });

    test("tap & hover: hover scales up, a press scales down", async ({ page, isMobile }) => {
      test.skip(isMobile, "Hover needs a mouse.");
      await openStory(page, storyId(impl, "motion", "tap-hover"));
      const button = page.locator("[data-ok-variant='interactive']").filter({ hasText: "Large" });
      await button.hover();
      await expect(button).toHaveCSS("transform", "matrix(1.09, 0, 0, 1.09, 0, 0)");
      await page.mouse.down();
      await expect(button).toHaveCSS("transform", "matrix(0.97, 0, 0, 0.97, 0, 0)");
      await page.mouse.up();
    });

    test("path: the strokes are traced, the logo keeps its name", async ({ page }) => {
      await openStory(page, storyId(impl, "motion", "path"));
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(page.getByRole("img", { name: "Owlky logo" })).toBeVisible();
      await expect(page.locator("[data-ok-variant='draw'] path").first()).toHaveCSS(
        "animation-name",
        "ok-motion-draw",
      );
    });

    test("count up: reaches the end; screen readers read the end value", async ({ page }) => {
      await openStory(page, storyId(impl, "motion", "count-up-story"));
      const values = page.locator("[data-ok-count-up-value]");
      await expect(values.first()).toHaveText("500");
      await expect(values.last()).toHaveText("500.14");
      await expect(page.locator("[data-ok-count-up-label]").last()).toHaveText("500.14k");
    });

    test("countdown: counts, pauses with the toggle and restarts with Start", async ({ page }) => {
      const start = Date.parse("2026-11-09T09:30:15Z");
      await page.clock.install({ time: start });
      await openStory(page, storyId(impl, "motion", "countdown-story"));
      const launch = page.getByRole("timer", { name: "Time until the launch" });
      const values = launch.locator("[data-ok-countdown-value]");
      await expect(values.first()).toHaveText("52");
      // Stop the flow of time: from here only runFor moves the clock.
      await page.clock.pauseAt(start + 60_000);
      const seconds = async () => Number(await values.last().textContent());
      const before = await seconds();
      await page.clock.runFor(2000);
      expect(await seconds()).toBe((before + 58) % 60);
      // Keyboard: the pause toggle (WCAG 2.2.2).
      const toggle = page.getByRole("button", { name: "Pause the countdown" });
      await toggle.focus();
      await page.keyboard.press("Space");
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(launch).toHaveAttribute("data-ok-paused", "");
      const paused = await seconds();
      await page.clock.runFor(3000);
      expect(await seconds()).toBe(paused);
      await page.keyboard.press("Enter");
      await expect(launch).not.toHaveAttribute("data-ok-paused");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      // A date countdown shows the real time left when it resumes.
      await expect(values.last()).toHaveText(String((paused + 57) % 60).padStart(2, "0"));

      // Pointer: Start runs the seconds countdown, which announces the end.
      const code = page.getByRole("timer", { name: "Time left to enter the code" });
      const value = code.locator("[data-ok-countdown-value]");
      await expect(value).toHaveText("10");
      await page.getByRole("button", { name: "Start" }).click();
      await page.clock.runFor(1000);
      await expect(value).toHaveText("9");
      await page.clock.runFor(9000);
      await expect(value).toHaveText("0");
      await expect(code.getByRole("status")).toHaveText("Time's up");
      await page.getByRole("button", { name: "Start" }).click();
      await expect(value).toHaveText("10");
    });

    test("border: turns, pauses with paused, stops with reduced motion", async ({ page }) => {
      await openStory(page, storyId(impl, "motion", "border"));
      const border = page.locator("[data-ok-motion-border]").first();
      await expect(border).toHaveCSS("animation-name", "none");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(border).toHaveCSS("animation-name", "ok-motion-border");
      await openStory(page, storyId(impl, "motion", "border"), "light", "paused:!true");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(border).toHaveCSS("animation-play-state", "paused");
    });

    test("border: two lights over a track; edges and corners from CSS", async ({ page }) => {
      await openStory(page, storyId(impl, "motion", "border"));
      const tiles = page.locator(".sb-motion-tiles > [data-ok-motion-border]");
      await expect(tiles).toHaveCount(12);
      // Secondary (purple) and error (red-orange) lights, and the track's translucent stops.
      const twoLights = await tiles.nth(2).evaluate((el) => getComputedStyle(el).backgroundImage);
      expect(twoLights).toMatch(/rgb\(255, 86, 48\).*rgb\(142, 51, 255\)/);
      expect(twoLights).toMatch(/0\.08\).*0\.24\)/);
      const corner = tiles.nth(4);
      await expect(corner).toHaveCSS("border-right-width", "0px");
      await expect(corner).toHaveCSS("border-top-width", "4px");
      await expect(corner).toHaveCSS("border-top-left-radius", "32px");
    });
  });
}
