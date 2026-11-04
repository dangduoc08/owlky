import AxeBuilder from "@axe-core/playwright";
import { primaryPresetNames, primaryPresets } from "@owlky/tokens";
import { expect, test } from "@playwright/test";
import { CONTRAST_EXEMPT, openStory, storyId } from "./helpers.js";

/** Stories where primary shows up: fills, outlined / soft text, selection, the preset gallery. */
const STORIES = [
  storyId("react", "button", "contained"),
  storyId("html", "button", "soft"),
  storyId("html", "toggle-button", "colors"),
  "react-table--sorting-selecting",
  "foundations-settings--presets",
];

const rgb = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

test.describe("theme settings (ADR-0017)", () => {
  // Each test scans several stories with axe.
  test.describe.configure({ timeout: 120_000 });
  test.skip(({ browserName }) => browserName !== "chromium", "axe results are engine-independent.");

  for (const preset of primaryPresetNames) {
    for (const theme of ["light", "dark"] as const) {
      test(`${preset} (${theme}): no WCAG 2.2 AA violations`, async ({ page }) => {
        for (const id of STORIES) {
          await openStory(page, id, theme, "", `preset:${preset}`);
          const html = page.locator("html");
          if (preset === "default") await expect(html).not.toHaveAttribute("data-ok-preset");
          else await expect(html).toHaveAttribute("data-ok-preset", preset);
          let axe = new AxeBuilder({ page })
            .include("#storybook-root")
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
          for (const selector of CONTRAST_EXEMPT) axe = axe.exclude(selector);
          const { violations } = await axe.analyze();
          expect(
            violations.map((v) => `${v.id}: ${v.help}`),
            id,
          ).toEqual([]);
        }
      });
    }
  }

  test("one attribute recolors every component", async ({ page }) => {
    await openStory(page, storyId("react", "button", "contained"), "light", "", "preset:purple");
    const button = page.getByRole("button", { name: "Primary" }).first();
    await expect(button).toHaveCSS("background-color", rgb(primaryPresets.purple.main));
    await openStory(page, storyId("react", "button", "contained"), "light", "", "preset:default");
    await expect(page.locator("html")).not.toHaveAttribute("data-ok-preset");
    await expect(button).toHaveCSS("background-color", rgb(primaryPresets.default.main));
  });

  test("font family and root font size", async ({ page }) => {
    await openStory(page, "foundations-typography--body-1", "light", "", "font:inter;fontSize:20");
    await expect(page.locator("html")).toHaveAttribute("data-ok-font", "inter");
    await expect(page.locator("html")).toHaveCSS("font-size", "20px");
    await expect(page.locator("#storybook-root p").first()).toHaveCSS("font-family", /Inter/);
  });

  for (const fontSize of [12, 20]) {
    test(`font size ${fontSize}px: no page overflow at 375px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      for (const id of [
        "react-table--basic",
        "react-alert--actions",
        "html-button-button-group--sizes",
      ]) {
        await openStory(page, id, "light", "", `fontSize:${fontSize}`);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, id).toBeLessThanOrEqual(0);
      }
    });
  }
});
