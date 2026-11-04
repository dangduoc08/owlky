import { defaultTheme, greyShades, hexToRgb, paletteColorNames } from "@minimal-tailwind/tokens";
import { expect, test } from "@playwright/test";
import { openStory } from "./helpers.js";

const SHADES = ["lighter", "light", "main", "dark", "darker"] as const;
const palettes = [
  ...paletteColorNames.map((color) => ({
    story: color === "error" ? "error-palette" : color,
    swatches: SHADES.map((shade) => ({
      hex: defaultTheme.palette[color][shade],
      variable: `--mt-palette-${color}-${shade}`,
    })),
  })),
  {
    story: "grey",
    swatches: greyShades.map((shade) => ({
      hex: defaultTheme.grey[shade],
      variable: `--mt-palette-grey-${shade}`,
    })),
  },
];

test.describe("Foundations / Colors", () => {
  for (const { story, swatches } of palettes) {
    test(`${story}: every shade shows hex, rgb and variable, painted from the CSS variable`, async ({
      page,
    }) => {
      await openStory(page, `foundations-colors--${story}`);
      const tiles = page.locator("#storybook-root button");
      await expect(tiles).toHaveCount(swatches.length);
      for (const [index, { hex, variable }] of swatches.entries()) {
        const tile = tiles.nth(index);
        const [r, g, b] = hexToRgb(hex);
        await expect(tile).toContainText(hex);
        await expect(tile).toContainText(`${r} ${g} ${b}`);
        await expect(tile).toContainText(variable);
        await expect(tile).toHaveCSS("background-color", `rgb(${r}, ${g}, ${b})`);
      }
    });
  }

  test("clicking a swatch copies its hex and announces it", async ({
    page,
    context,
    browserName,
  }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await openStory(page, "foundations-colors--primary");
    await page.getByRole("button", { name: /^Main\s*#00A76F/ }).click();
    await expect(page.getByRole("status")).toHaveText("Copied #00A76F");
    await expect(page.getByRole("button", { name: /^Copied!/ })).toBeVisible();
    if (browserName === "chromium") {
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("#00A76F");
    }
  });

  test("swatches are keyboard operable", async ({ page, context, browserName }) => {
    test.skip(browserName === "webkit", "WebKit's default Tab skips buttons (macOS setting).");
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await openStory(page, "foundations-colors--primary");
    await page.getByRole("button", { name: /^Lighter\s*#C8FAD6/ }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /^Light\s*#5BE49B/ })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toHaveText(/#5BE49B/);
  });

  test("uses one column on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await openStory(page, "foundations-colors--primary");
    const columns = await page
      .locator("#storybook-root .grid")
      .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(1);
  });
});
