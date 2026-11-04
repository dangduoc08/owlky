import { defaultTheme, shadowNames, typographyVariants } from "@minimal-tailwind/tokens";
import { expect, test } from "@playwright/test";
import { openStory, storyIds } from "./helpers.js";

/** Storybook id of an export name: "H1" → "h-1", "Subtitle1" → "subtitle-1". */
const typographyStory = (variant: string) =>
  `foundations-typography--${variant.replace(/(\d)$/, "-$1")}`;

test.describe("Foundations / Typography", () => {
  for (const variant of typographyVariants) {
    test(`${variant} renders from its tokens with its definition`, async ({ page }) => {
      await openStory(page, typographyStory(variant));
      const style = defaultTheme.typography.variants[variant];
      await expect(page.locator(`[data-variant="${variant}"]`)).toHaveCSS(
        "font-weight",
        String(style.fontWeight),
      );
      await expect(page.locator("#storybook-root pre")).toContainText(
        `"fontWeight": ${style.fontWeight}`,
      );
    });
  }

  test("headings are responsive and use the display font", async ({ page }) => {
    const sample = page.locator('[data-variant="h1"]');
    await page.setViewportSize({ width: 1440, height: 900 });
    await openStory(page, typographyStory("h1"));
    await expect(sample).toHaveCSS("font-size", "64px");
    await expect(sample).toHaveCSS("font-family", /^"?Barlow/);
    await expect(page.locator("#storybook-root pre")).toContainText('"@media (min-width:1200px)"');
    await page.setViewportSize({ width: 375, height: 800 });
    await expect(sample).toHaveCSS("font-size", "40px");

    await openStory(page, typographyStory("h4"));
    await expect(page.locator('[data-variant="h4"]')).toHaveCSS(
      "font-family",
      /^"?Public Sans Variable/,
    );
  });
});

test.describe("Foundations / Shadows", () => {
  test("renders system, custom and colored shadows from the tokens", async ({ page }) => {
    await openStory(page, "foundations-shadows--system");
    await expect(page.locator("[data-shadow]")).toHaveCount(defaultTheme.elevation.length);
    // Engines serialize color-mix() differently (rgba() or color(srgb …)): check alpha + geometry.
    await expect(page.locator('[data-shadow="--mt-elevation-1"]')).toHaveCSS(
      "box-shadow",
      /0\.2\) 0px 2px 1px -1px, .*0\.14\) 0px 1px 1px 0px, .*0\.12\) 0px 1px 3px 0px$/,
    );
    await openStory(page, "foundations-shadows--custom");
    await expect(page.locator("[data-shadow]")).toHaveCount(shadowNames.length);
    await expect(page.locator('[data-shadow="--mt-shadow-z8"]')).toHaveCSS(
      "box-shadow",
      /0\.16\) 0px 8px 16px 0px$/,
    );
    await openStory(page, "foundations-shadows--colors");
    await expect(page.locator("[data-shadow]")).toHaveCount(12);
  });
});

test.describe("Foundations / Grid", () => {
  test("spacing and columns follow the story args", async ({ page }) => {
    await openStory(page, "foundations-grid--spacing");
    await expect(page.getByTestId("spacing-demo")).toHaveCSS("gap", "16px");
    await page.goto(
      "/apps/storybook/storybook-static/iframe.html?id=foundations-grid--spacing&viewMode=story&args=spacing:5",
    );
    await expect(page.getByTestId("spacing-demo")).toHaveCSS("gap", "40px");

    await page.goto(
      "/apps/storybook/storybook-static/iframe.html?id=foundations-grid--column&viewMode=story&args=columns:12",
    );
    const columns = await page
      .getByTestId("column-demo")
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(12);
  });
});

test.describe("Foundations / Icons", () => {
  test("decorative icons are hidden from assistive technology", async ({ page }) => {
    for (const id of storyIds("foundations-icons--")) {
      await openStory(page, id);
      expect(await page.locator('#storybook-root svg:not([aria-hidden="true"])').count()).toBe(0);
    }
  });
});

for (const id of storyIds("foundations-")) {
  test(`${id} fits small screens without horizontal scrolling`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await openStory(page, id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
  });
}
