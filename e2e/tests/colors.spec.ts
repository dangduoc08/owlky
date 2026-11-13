import { defaultTheme, greyShades, hexToRgb, paletteColorNames } from "@owlky/tokens";
import { expect, test } from "@playwright/test";
import { openStory } from "./helpers.js";

const SHADES = ["lighter", "light", "main", "dark", "darker"] as const;
const palettes = [
  ...paletteColorNames.map((color) => ({
    story: color === "error" ? "error-palette" : color,
    swatches: SHADES.map((shade) => ({
      hex: defaultTheme.palette[color][shade],
      variable: `--ok-palette-${color}-${shade}`,
    })),
  })),
  {
    story: "grey",
    swatches: greyShades.map((shade) => ({
      hex: defaultTheme.grey[shade],
      variable: `--ok-palette-grey-${shade}`,
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
    await page.getByRole("button", { name: /^Main\s*#615FFF/ }).click();
    await expect(page.getByRole("status")).toHaveText("Copied #615FFF");
    await expect(page.getByRole("button", { name: /^Copied!/ })).toBeVisible();
    if (browserName === "chromium") {
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("#615FFF");
    }
  });

  test("swatches are keyboard operable", async ({ page, context, browserName }) => {
    test.skip(browserName === "webkit", "WebKit's default Tab skips buttons (macOS setting).");
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await openStory(page, "foundations-colors--primary");
    await page.getByRole("button", { name: /^Lighter\s*#E0E7FF/ }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /^Light\s*#A3B3FF/ })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toHaveText(/#A3B3FF/);
  });

  test("Gradient: tokens paint text, borders, fills and paper; presets and themes change them", async ({
    page,
  }) => {
    const read = () =>
      page.evaluate(() => {
        const root = document.querySelector("#storybook-root") as HTMLElement;
        const title = root.querySelector("p") as HTMLElement;
        const fill = root.querySelector('[role="img"]') as HTMLElement;
        const paper = root.querySelector("[data-ok-paper]") as HTMLElement;
        return {
          title: getComputedStyle(title).backgroundImage,
          clip: getComputedStyle(title).backgroundClip,
          fill: getComputedStyle(fill).backgroundImage,
          paper: getComputedStyle(paper).backgroundImage,
        };
      });
    await openStory(page, "foundations-colors--gradient");
    const light = await read();
    expect(light.clip).toBe("text");
    expect(light.title).toBe("linear-gradient(90deg, rgb(79, 57, 246), rgb(49, 44, 133))");
    expect(light.fill).toBe("linear-gradient(135deg, rgb(163, 179, 255), rgb(97, 95, 255))");
    expect(light.paper).toMatch(/radial-gradient/);
    await openStory(page, "foundations-colors--gradient", "dark");
    const dark = await read();
    expect(dark.title).toBe("linear-gradient(90deg, rgb(163, 179, 255), rgb(224, 231, 255))");
    expect(dark.paper).not.toBe(light.paper);
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
