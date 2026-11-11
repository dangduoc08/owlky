import { expect, type Locator, type Page, test } from "@playwright/test";
import { implementations, openStory, routeMapTiles, storyId } from "./helpers.js";

/** Opens a map story and waits until every map on it drew its first frame (offline style). */
async function openMap(page: Page, impl: "react" | "html", story: string) {
  await openStory(page, storyId(impl, "map", story));
  await expect(page.locator("[data-ok-map]").first()).toHaveAttribute("data-ok-loaded", "");
}
const scaleWidth = (scale: Locator) =>
  scale.evaluate((element) =>
    (element as HTMLElement).style.getPropertyValue("--_ok-map-scale-width"),
  );

for (const impl of implementations) {
  test.describe(`map (${impl})`, () => {
    test("labels the map and describes it", async ({ page }) => {
      await openMap(page, impl, "change-theme");
      const canvas = page.getByRole("region", { name: "Map of the United States" });
      await expect(canvas).toHaveAttribute("aria-roledescription", "map");
      const described = await canvas.getAttribute("aria-describedby");
      await expect(page.locator(`#${described}`)).toContainText("contiguous United States");
      await expect(page.locator("[data-ok-map-attribution-text]")).toHaveText("Natural Earth");
    });

    test("zooms with the buttons and the keyboard", async ({ page }) => {
      await openMap(page, impl, "change-theme");
      const scale = page.locator("[data-ok-map-scale]");
      const before = await scale.textContent();
      await page.getByRole("button", { name: "Zoom in" }).click();
      await expect(scale).not.toHaveText(before as string);
      const zoomed = await scale.textContent();
      await page.getByRole("button", { name: "Zoom out" }).click();
      await expect(scale).not.toHaveText(zoomed as string);
      // The map itself takes the keyboard.
      const canvas = page.getByRole("region", { name: "Map of the United States" });
      await canvas.focus();
      const width = await scaleWidth(scale);
      await page.keyboard.press("Equal");
      await expect.poll(() => scaleWidth(scale)).not.toBe(width);
    });

    test("switches the map style from the panel", async ({ page }) => {
      await openMap(page, impl, "change-theme");
      const root = page.locator("[data-ok-map]");
      await page.getByRole("radio", { name: "Dark" }).check();
      await expect(root).toHaveAttribute("data-ok-map-style", /\/styles\/dark$/);
      await page.getByRole("radio", { name: "Streets" }).check();
      await expect(root).toHaveAttribute("data-ok-map-style", /\/styles\/liberty$/);
    });

    test("opens a marker's popup, closes it with Escape and returns focus", async ({ page }) => {
      await openMap(page, impl, "markers-popups");
      const marker = page.getByRole("button", { name: "Kenya" });
      await marker.click();
      const popup = page.getByRole("dialog", { name: "Kenya" });
      await expect(popup).toBeVisible();
      await expect(popup).toContainText("Capital: Nairobi");
      await expect(popup.getByRole("button", { name: "Close" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(popup).toBeHidden();
      await expect(marker).toBeFocused();
      // Keyboard: Enter on a marker opens it too.
      await page.getByRole("button", { name: "Peru" }).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog", { name: "Peru" })).toBeVisible();
      await page
        .getByRole("dialog", { name: "Peru" })
        .getByRole("button", { name: "Close" })
        .click();
      await expect(page.getByRole("dialog", { name: "Peru" })).toBeHidden();
    });

    test("moves a draggable marker with the keyboard and the pointer", async ({
      page,
      browserName,
    }) => {
      await openMap(page, impl, "draggable-markers");
      const marker = page.getByRole("button", { name: "Draggable marker" });
      const fields = page.locator(".sb-map-events dd");
      await marker.focus();
      await page.keyboard.press("ArrowRight");
      await expect(fields.nth(2)).toHaveText(/^-?\d+\.\d{5}, -?\d+\.\d{5}$/);
      const afterKeys = await fields.nth(2).textContent();
      test.skip(
        browserName === "webkit" && test.info().project.name === "mobile",
        "No mouse drag.",
      );
      const box = (await marker.boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 80, box.y + 40, { steps: 6 });
      await page.mouse.up();
      await expect(fields.nth(0)).not.toHaveText("None");
      await expect(fields.nth(2)).not.toHaveText(afterKeys as string);
    });

    test("pauses and plays the animated point", async ({ page }) => {
      await openMap(page, impl, "geojson-animation");
      // Reduced motion (the e2e default): it starts paused.
      const button = page.locator("[data-ok-map-panel] button");
      await expect(button).toHaveText("Play");
      await button.click();
      await expect(button).toHaveText("Pause");
      await button.click();
      await expect(button).toHaveText("Play");
    });

    test("turns interaction handlers off from the panel", async ({ page }) => {
      await openMap(page, impl, "interaction");
      const root = page.locator("[data-ok-map]");
      await page.getByRole("switch", { name: "Scroll zoom" }).click();
      await expect(root).toHaveAttribute("data-ok-scroll-zoom", "false");
      await page.getByRole("switch", { name: "Scroll zoom" }).click();
      await expect(root).not.toHaveAttribute("data-ok-scroll-zoom", "false");
    });

    test("flies to a city", async ({ page }) => {
      await openMap(page, impl, "viewport-animation");
      const scale = page.locator("[data-ok-map-scale]");
      const width = await scaleWidth(scale);
      await page.getByRole("radio", { name: "Tokyo" }).check();
      await expect.poll(() => scaleWidth(scale)).not.toBe(width);
    });

    test("highlights a region under the pointer", async ({ page }, info) => {
      test.skip(info.project.name === "mobile", "Hover needs a mouse.");
      await openMap(page, impl, "highlight-by-filter");
      const box = (await page.locator("[data-ok-map-view]").boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width / 2 + 2, box.y + box.height / 2 + 2);
      const tooltip = page.getByRole("tooltip");
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText("Region:");
      await page.mouse.move(0, 0);
      await expect(tooltip).toBeHidden();
    });

    test("filters the heatmap by day", async ({ page }) => {
      await openMap(page, impl, "heatmap");
      const slider = page.getByRole("slider");
      await expect(slider).toBeDisabled();
      await page.getByRole("switch", { name: "All days" }).click();
      await expect(slider).toBeEnabled();
      await slider.focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.locator("#map-heatmap-day")).toHaveText("Each day: 09 Oct 2025");
    });

    test("splits the screen between the two maps", async ({ page }) => {
      await openStory(page, storyId(impl, "map", "side-by-side"));
      await expect(page.locator("[data-ok-map][data-ok-loaded]")).toHaveCount(2);
      const compare = page.locator(".sb-map-compare");
      await page.getByRole("button", { name: "Split screen" }).click();
      await expect(compare).toHaveClass(/sb-map-compare--split-screen/);
      await expect(page.getByRole("button", { name: "Split screen" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    test("enters and leaves fullscreen", async ({ page }) => {
      await openMap(page, impl, "change-theme");
      const root = page.locator("[data-ok-map]");
      await page.getByRole("button", { name: "Enter fullscreen" }).click();
      await expect(root).toHaveAttribute("data-ok-fullscreen", "");
      await page.getByRole("button", { name: "Exit fullscreen" }).click();
      await expect(root).not.toHaveAttribute("data-ok-fullscreen", "");
    });

    test("lists the choropleth's regions for the keyboard and selects one", async ({ page }) => {
      await openMap(page, impl, "choropleth");
      const legend = page.getByRole("group", { name: "Population (millions)" });
      await expect(legend.getByRole("button")).toHaveCount(5);
      await expect(
        page.getByRole("table", { name: "Population by state, 2020 census" }),
      ).toBeAttached();
      const list = page.getByRole("listbox", { name: "States" });
      await expect(list.getByRole("option")).toHaveCount(51);
      // Tab from the map reaches the regions list; its active region shows over the map.
      await page.getByRole("region", { name: "Map of US states by population" }).focus();
      await page.keyboard.press("Tab");
      await expect(list).toBeFocused();
      const active = page.locator("[data-ok-map-region][data-ok-active]");
      await expect(active).toHaveText("Alabama: 5.02 million");
      await expect(active).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await expect(active).toHaveText("Alaska: 0.73 million");
      await page.keyboard.press("t");
      await expect(active).toHaveText("Tennessee: 6.91 million");
      await page.keyboard.press("Enter");
      await expect(list.getByRole("option", { name: "Tennessee: 6.91 million" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    test("mutes regions outside the pressed legend classes", async ({ page }) => {
      await openMap(page, impl, "choropleth");
      const legend = page.getByRole("group", { name: "Population (millions)" });
      const first = legend.getByRole("button").first();
      await first.click();
      await expect(first).toHaveAttribute("aria-pressed", "true");
      // The other swatches fade like their regions.
      await expect(legend.locator("[data-ok-map-legend-swatch]").nth(1)).toHaveCSS(
        "opacity",
        "0.32",
      );
      await first.press("Enter");
      await expect(first).toHaveAttribute("aria-pressed", "false");
    });

    test("names the region under the pointer", async ({ page }, info) => {
      test.skip(info.project.name === "mobile", "Hover needs a mouse.");
      await openMap(page, impl, "choropleth");
      const box = (await page.locator("[data-ok-map-view]").boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      const hovered = page.locator("[data-ok-map-region][data-ok-hovered]");
      await expect
        .poll(async () => {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.move(box.x + box.width / 2 + 2, box.y + box.height / 2 + 2);
          return hovered.count();
        })
        .toBe(1);
      await expect(hovered).toBeVisible();
      await expect(hovered).toContainText("million");
      await page.mouse.move(0, 0);
      await expect(hovered).toHaveCount(0);
    });

    test("drills into a region from the list and back with the breadcrumb", async ({ page }) => {
      await openMap(page, impl, "region-drilldown");
      const list = page.getByRole("listbox", { name: "Regions" });
      await expect(list.getByRole("option")).toHaveCount(4);
      await list.focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("Enter");
      const states = page.getByRole("listbox", { name: "States of the Northeast" });
      await expect(states.getByRole("option")).toHaveCount(9);
      await expect(states.getByRole("option", { name: /^New York: / })).toBeAttached();
      const crumbs = page.getByRole("navigation", { name: "Map level" });
      await expect(crumbs.locator('[aria-current="page"]')).toHaveText("Northeast");
      const root = crumbs.getByRole("button", { name: "United States" });
      await root.click();
      await expect(page.getByRole("listbox", { name: "Regions" }).getByRole("option")).toHaveCount(
        4,
      );
      await expect(root).toHaveAttribute("aria-current", "page");
      await expect(root).toBeFocused();
    });

    test("draws the great circle routes", async ({ page }) => {
      await openMap(page, impl, "great-circles");
      const canvas = page.getByRole("region", { name: "Flight routes from Singapore" });
      await expect(canvas).toHaveAttribute("aria-roledescription", "map");
    });

    test("downloads the map as a PNG", async ({ page }) => {
      await openMap(page, impl, "export-map");
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Download PNG" }).click(),
      ]);
      expect(download.suggestedFilename()).toBe("united-states.png");
      await expect(page.locator("[data-ok-map-panel]").getByRole("status")).toHaveText(
        "Saved united-states.png.",
      );
    });

    test("shows the choropleth's table without WebGL", async ({ page }) => {
      await page.addInitScript(() => {
        HTMLCanvasElement.prototype.getContext = () => null;
      });
      await openStory(page, storyId(impl, "map", "choropleth"));
      await expect(page.locator("[data-ok-map]")).toHaveAttribute("data-ok-fallback", "");
      const table = page.getByRole("table", { name: "Population by state, 2020 census" });
      await expect(table).toBeVisible();
      await expect(table.getByRole("row", { name: /California/ })).toContainText("39.54 million");
    });

    test("shows the fallback and the description without WebGL", async ({ page }) => {
      await page.addInitScript(() => {
        HTMLCanvasElement.prototype.getContext = () => null;
      });
      await openStory(page, storyId(impl, "map", "markers-popups"));
      const root = page.locator("[data-ok-map]");
      await expect(root).toHaveAttribute("data-ok-fallback", "");
      await expect(page.locator("[data-ok-map-fallback]")).toContainText("WebGL");
      await expect(page.locator("[data-ok-map-description]")).toBeVisible();
      await expect(page.getByRole("button", { name: "Kenya" })).toBeHidden();
    });
  });
}

/** S6: the map (owlky-map.js and its worker) runs under a strict CSP without inline code or styles. */
test("map under a strict CSP: no violations", async ({ page }) => {
  await routeMapTiles(page);
  await page.addInitScript(() => {
    (window as unknown as { violations: string[] }).violations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { violations: string[] }).violations.push(
        `${event.violatedDirective}: ${event.blockedURI}`,
      );
    });
  });
  await page.goto("/examples/csp/map.html");
  const root = page.locator("[data-ok-map]");
  await expect(root).toHaveAttribute("data-ok-loaded", "");
  await expect(root).not.toHaveAttribute("data-ok-fallback", "");
  await page.getByRole("button", { name: "Paris" }).click();
  await expect(page.getByRole("dialog", { name: "Paris" })).toBeVisible();
  await page.getByRole("button", { name: "Zoom in" }).click();
  expect(
    await page.evaluate(() => (window as unknown as { violations: string[] }).violations),
  ).toEqual([]);
});
