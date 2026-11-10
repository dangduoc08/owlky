import { expect, type Page, test } from "@playwright/test";
import { normalizeStory, openStory, repaintFromScratch, storyId } from "./helpers.js";

/**
 * React ↔ HTML parity: the same story in both implementations must produce the same DOM
 * anatomy and the same pixels. This is the contract that lets both share one stylesheet.
 */
const pairs: [component: string, story: string][] = [
  ["datagrid", "basic"],
  ["datagrid", "custom"],
  ["datagrid", "advanced"],
  ["datagrid", "large"],
  ["datagrid", "server"],
  ["datagrid", "layout"],
  ["datagrid", "validation"],
  ["datagrid", "tree-data"],
  ["datagrid", "master-detail"],
  ["datagrid", "ordering"],
  ["datagrid", "column-groups"],
  ["datagrid", "list-view"],
  ["datagrid", "lazy-loading"],
  ["datagrid", "row-grouping"],
  ["datagrid", "pivoting"],
  ["datagrid", "cell-selection"],
  ["datagrid", "charts"],
  ["motion", "in-view"],
  ["motion", "text"],
  ["motion", "scroll"],
  ["motion", "dialog-story"],
  ["motion", "background"],
  ["motion", "tap-hover"],
  ["motion", "path"],
  ["motion", "count-up-story"],
  ["motion", "logo"],
  ["motion", "avatar-story"],
  ["motion", "border"],
  ["autocomplete", "playground"],
  ["autocomplete", "country"],
  ...["grouped", "asynchronous", "single-value", "virtualization"].map(
    (s) => ["autocomplete", s] as [string, string],
  ),
  ["date-pickers", "date-story"],
  ["date-pickers", "calendars"],
  ["date-pickers", "validation"],
  ["date-pickers", "shortcuts"],
  ["date-pickers", "localization"],
  ["date-pickers", "time"],
  ["date-pickers", "date-time"],
  ["date-pickers", "clocks"],
  ["date-pickers", "time-validation"],
  ["date-pickers", "range"],
  ["date-pickers", "range-fields"],
  ["date-pickers", "range-calendars"],
  ["date-pickers", "time-ranges"],
  ["date-pickers", "range-shortcuts"],
  ["date-pickers", "time-zones"],
  ["date-pickers", "date-libraries"],
  ["date-pickers", "calendar-systems"],
  ["date-pickers", "right-to-left"],
  ["date-pickers", "customization"],
  ["transfer-list", "simple"],
  ["transfer-list", "enhanced"],
  ["tree-view", "simple"],
  ["tree-view", "rich"],
  ["tree-view", "custom-icons"],
  ["tree-view", "checkbox"],
  ["tree-view", "custom-styling"],
  ["timeline", "left"],
  ["timeline", "right"],
  ["timeline", "alternating"],
  ["timeline", "filled"],
  ["timeline", "outlined"],
  ["timeline", "opposite"],
  ["timeline", "customized"],
  ["organization-chart", "simple"],
  ["organization-chart", "standard"],
  ["organization-chart", "group"],
  ["organization-chart", "lines"],
  ["image", "list"],
  ["image", "aspect-ratio"],
  ["image", "overlay"],
  ["image", "fit-and-position"],
  ["image", "loading"],
  ["chart", "line"],
  ["chart", "area"],
  ["chart", "column-single"],
  ["chart", "column-multiple"],
  ["chart", "column-stacked"],
  ["chart", "column-negative"],
  ["chart", "bar"],
  ["chart", "mixed"],
  ["chart", "scatter"],
  ["chart", "pie"],
  ["chart", "donut"],
  ["chart", "radial-bar"],
  ["chart", "radar"],
  ["chart", "semi-circle-gauge"],
  ["chart", "stroked-gauge"],
  ["chart", "box-plot"],
  ["chart", "heatmap"],
  ["chart", "treemap"],
  ["chart", "bubble"],
  ["chart", "range-area"],
  ["chart", "funnel"],
  ["chart", "pyramid"],
  ["chart", "slope"],
  ["chart", "sparklines"],
  ["chart", "live-data"],
  ["chart", "candlestick"],
  ["chart", "range-bar"],
  ["chart", "timeline"],
  ["chart", "polar-area"],
  ["chart", "zoom"],
  ["chart", "synchronized"],
  ["chart", "brush"],
  ["chart", "annotations"],
  ["chart", "data-labels"],
  ["chart", "donut-legend"],
  ["chart", "heatmap-ranges"],
  ["chart", "box-plot-horizontal"],
  ["chart", "localized"],
  ["chart", "animations"],
  ["chart", "sankey"],
  ["chart", "sankey-vertical"],
  ["chart", "sankey-cycles"],
  ["chart", "sankey-alluvial"],
  ["chart", "sankey-links"],
  ["chart", "stock"],
  ["chart", "stock-overlays"],
  ["chart", "stock-oscillators"],
  ["chart", "stock-line"],
  ["rating", "controlled"],
  ["rating", "read-only"],
  ["rating", "disabled"],
  ["rating", "custom"],
  ["rating", "ten-stars"],
  ["rating", "hover"],
  ["rating", "half"],
  ["rating", "sizes"],
  ["slider", "volume"],
  ["slider", "disabled"],
  ["slider", "temperature"],
  ["slider", "sizes"],
  ["slider", "small-steps"],
  ["slider", "custom-marks"],
  ["slider", "restricted"],
  ["slider", "range"],
  ["slider", "vertical"],
  ["slider", "colors"],
  ["slider", "non-linear"],
  ["tabs", "text"],
  ["tabs", "icon"],
  ["tabs", "colors"],
  ["tabs", "scrollable"],
  ["tabs", "vertical"],
  ["tabs", "custom"],
  ["breadcrumbs", "text"],
  ["breadcrumbs", "with-icon"],
  ["breadcrumbs", "customized"],
  ["stepper", "horizontal"],
  ["stepper", "alternative-label"],
  ["stepper", "vertical"],
  ["stepper", "customized"],
  ["stepper", "mobile"],
  ["button", "contained"],
  ["button", "outlined"],
  ["button", "text"],
  ["button", "soft"],
  ["icon-button", "base"],
  ["icon-button", "colors"],
  ["icon-button", "sizes"],
  ["icon-button", "with-animate"],
  ["fab", "default"],
  ["fab", "outlined"],
  ["fab", "soft"],
  ["fab", "with-animate"],
  ["button-group", "contained"],
  ["button-group", "outlined"],
  ["button-group", "text"],
  ["button-group", "soft"],
  ["button-group", "sizes"],
  ["button-group", "orientation"],
  ["toggle-button", "exclusive"],
  ["toggle-button", "multiple"],
  ["toggle-button", "sizes"],
  ["toggle-button", "disabled"],
  ["toggle-button", "colors"],
  ["toggle-button", "vertical"],
  ["accordion", "simple"],
  ["accordion", "controlled"],
  ["accordion", "custom-styles"],
  ["alert", "standard"],
  ["alert", "filled"],
  ["alert", "outlined"],
  ["alert", "description"],
  ["alert", "actions"],
  ["drawer", "anchor"],
  ["drawer", "variants"],
  ["sortable", "grid"],
  ["pagination", "shapes"],
  ["pagination", "variants"],
  ["pagination", "sizes"],
  ["pagination", "buttons"],
  ["pagination", "ranges"],
  ["pagination", "custom-icons"],
  ["pagination", "table"],
  ["pagination", "items"],
  ["table", "basic"],
  ["table", "sorting-selecting"],
  ["table", "grouping-fixed-header"],
  ["table", "collapsible"],
  ["table", "pagination-with-api"],
  ["table", "table-pagination-with-api"],
  ["scrollbar", "vertical"],
  ["scrollbar", "horizontal"],
  ["scrollbar", "layout"],
  ["sortable", "vertical"],
  ["sortable", "horizontal"],
  ["circular-progress", "indeterminate"],
  ["circular-progress", "determinate"],
  ["circular-progress", "sizes"],
  ["linear-progress", "indeterminate"],
  ["linear-progress", "determinate"],
  ["linear-progress", "buffer"],
  ["linear-progress", "query"],
  ["linear-progress", "with-label"],
  ["checkbox", "basic"],
  ["checkbox", "sizes"],
  ["checkbox", "custom-icons"],
  ["checkbox", "placement"],
  ["checkbox", "colors"],
  ["checkbox", "indeterminate"],
  ["switch", "basic"],
  ["switch", "sizes"],
  ["switch", "placements"],
  ["switch", "colors"],
  ["switch", "customization"],
  ["radio", "basic"],
  ["radio", "sizes"],
  ["radio", "placement"],
  ["radio", "colors"],
  ["form-control", "radios"],
  ["form-control", "checkboxes"],
  ["form-control", "switches"],
  ["form-control", "show-error"],
  ["form-control", "states"],
  ["form-control", "standalone"],
  ["text-field", "outlined"],
  ["text-field", "filled"],
  ["text-field", "standard"],
  ["select", "basic"],
  ["select", "variants"],
  ["select", "labels-helper-text"],
  ["select", "auto-width"],
  ["select", "small-size"],
  ["select", "other-props"],
  ["select", "native-select"],
  ["select", "multiple-default"],
  ["select", "selection-indicators"],
  ["select", "chips"],
  ["select", "placeholder"],
  ["select", "multiple-native"],
  ["select", "open-state"],
  ["select", "with-dialog"],
  ["select", "grouping"],
  ["avatar", "image"],
  ["avatar", "icon"],
  ["avatar", "letter"],
  ["avatar", "variant"],
  ["avatar", "grouped"],
  ["avatar", "with-badge"],
  ["avatar", "sizes"],
  ["badge", "standard"],
  ["badge", "dot"],
  ["badge", "status"],
  ["badge", "maximum-value"],
  ["badge", "badge-overlap"],
  ["chip", "filled"],
  ["chip", "outlined"],
  ["chip", "soft"],
  ["typography", "usage"],
  ["typography", "theme-keys"],
  ["typography", "semantic-element"],
  ["typography", "colors"],
  ["typography", "alignment"],
  ["link", "basic-links"],
  ["link", "underline"],
  ["link", "colors"],
  ["link", "accessibility"],
  ["label", "filled"],
  ["label", "outlined"],
  ["label", "soft"],
  ["label", "inverted"],
  ["label", "with-icon"],
  ["divider", "variants"],
  ["divider", "orientation"],
  ["divider", "flex-item"],
  ["divider", "with-children"],
  ["divider", "icon-grouping"],
  ["paper", "basic"],
  ["paper", "elevation"],
  ["paper", "variants"],
  ["paper", "corners"],
  ["card", "basics"],
  ["card", "outlined"],
  ["card", "complex-interaction"],
  ["card", "media"],
  ["card", "primary-action"],
  ["card", "ui-controls"],
  ["card", "active-state"],
  ["list", "simple"],
  ["list", "nested"],
  ["list", "folder"],
  ["list", "selected"],
  ["list", "controls"],
  ["list", "switch"],
  ["popover", "click-hover"],
  ["popover", "custom-arrow"],
  ["tooltip", "simple"],
  ["tooltip", "arrow"],
  ["tooltip", "variable-width"],
  ["tooltip", "transitions"],
  ["tooltip", "positioned"],
  ["menu", "simple"],
  ["menu", "selected"],
  ["menu", "max-height"],
  ["dialog", "simple"],
  ["dialog", "alerts"],
  ["dialog", "transitions"],
  ["dialog", "form"],
  ["dialog", "full-screen"],
  ["dialog", "max-width"],
  ["dialog", "scrolling-content"],
  ["snackbar", "default"],
  ["snackbar", "status"],
  ["snackbar", "custom"],
  ["snackbar", "anchor-origin"],
  ["backdrop", "example"],
  ["collapse", "simple-collapse"],
  ["editor", "basic"],
  ...[
    "align",
    "progress",
    "opacity",
    "scale",
    "fade",
    "parallax",
    "autoplay",
    "auto-scroll",
    "thumbs-x",
    "thumbs-y",
    "variable-widths",
    "auto-height",
    "y-axis",
    "dots-number",
    "animation",
    "custom",
    "drag-free",
    "slides-to-scroll",
    "right-to-left",
  ].map((story) => ["carousel", story] as [string, string]),
  ["lightbox", "basic"],
  ["lightbox", "inline"],
  ["lightbox", "toolbar"],
  ...["single", "multiple", "avatar", "box", "validation", "states", "open-dialog"].map(
    (story) => ["upload", story] as [string, string],
  ),
  ["walktour", "basic"],
  ["walktour", "beacons"],
  ...[
    "basic",
    "timeline-views",
    "milestones",
    "dependency-types",
    "baseline",
    "critical-path",
    "working-calendar",
    "project-boundary",
    "bar-labels",
    "custom-colors",
    "selection",
    "task-list-columns",
    "editing",
    "large-project",
  ].map((story) => ["gantt", story] as [string, string]),
  ...["all", "errors", "states", "account", "dashboard", "shapes"].map(
    (story) => ["illustrations", story] as [string, string],
  ),
  ["code-editor", "editor"],
  ["code-editor", "diff"],
  ["code-editor", "multi-model"],
  ["code-editor", "validation"],
  ["map", "change-theme"],
  ["map", "markers-popups"],
  ["map", "draggable-markers"],
  ["map", "geojson-animation"],
  ["map", "clusters"],
  ["map", "interaction"],
  ["map", "viewport-animation"],
  ["map", "highlight-by-filter"],
  ["map", "heatmap"],
  ["map", "side-by-side"],
  ["markdown", "html-content"],
  ["markdown", "markdown-content"],
];

/** Stories whose rows load after the first render (scripts, data sources): wait for them. */
const LOADS = new Set(["datagrid/large", "datagrid/server", "datagrid/lazy-loading"]);

/**
 * Image stories (and Markdown, whose pictures are Images): lazy pictures load while the network is
 * busy; once it is idle, every Image's `data-ok-state` matches its picture (pictures far below
 * stay `loading` in both implementations).
 */
async function imagesSettled(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() =>
    [...document.querySelectorAll("[data-ok-image]")].every((root) => {
      const img = root.querySelector(":scope > img") as HTMLImageElement | null;
      if (!img) return true;
      const expected = !img.complete ? "loading" : img.naturalWidth > 0 ? "loaded" : "error";
      return root.getAttribute("data-ok-state") === expected;
    }),
  );
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50))));
}

async function loaded(page: Page, key: string) {
  if (key.startsWith("image/")) {
    await imagesSettled(page);
    return;
  }
  if (key.startsWith("walktour/")) {
    // The tour opens its first step (or beacon) once mounted; pictures move the targets.
    await page.waitForFunction(() =>
      [...document.querySelectorAll("[data-ok-walktour]")].every((root) =>
        root.hasAttribute("data-ok-status"),
      ),
    );
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));
    // The featured card's picture is an Image: its load state settles after the picture.
    await imagesSettled(page);
    return;
  }
  if (key.startsWith("lightbox/")) {
    // The lightbox's slide pictures load lazily (in a closed dialog): wait for the others.
    await page.waitForFunction(() =>
      [...document.querySelectorAll("[data-ok-lightbox]")].every((root) =>
        root.hasAttribute("data-ok-ready"),
      ),
    );
    await page.waitForFunction(() =>
      [...document.images].every((image) => {
        if (image.complete) return true;
        // Lazy pictures off screen (closed dialog, other slides) don't load.
        const box = image.getBoundingClientRect();
        const shown = image.checkVisibility() && box.right > 0 && box.left < innerWidth;
        return image.loading === "lazy" && !shown;
      }),
    );
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50))));
    return;
  }
  if (key.startsWith("card/")) {
    // Card pictures change the card heights as they load; the Media story's Image settles after.
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));
    await imagesSettled(page);
    return;
  }
  if (key.startsWith("carousel/")) {
    // Carousels measure once mounted; pictures change slide sizes as they load.
    await page.waitForFunction(() =>
      [...document.querySelectorAll("[data-ok-carousel]")].every((root) =>
        root.hasAttribute("data-ok-ready"),
      ),
    );
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50))));
    return;
  }
  if (key.startsWith("map/")) {
    // Every map drew its first frame (offline style, e2e helpers) and placed its overlays.
    await expect(page.locator("[data-ok-map]").first()).toBeVisible();
    await expect(page.locator("[data-ok-map]:not([data-ok-loaded])")).toHaveCount(0);
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
    return;
  }
  if (key === "editor/basic") {
    // The HTML story registers the editor and Markdown in its page script: wait for both.
    await expect(page.locator('[data-ok-editor-content][contenteditable="true"]')).toHaveCount(1);
    await expect(page.locator(".sb-editor-preview [data-ok-markdown] h4")).toBeVisible();
    await expect(page.locator(".hljs-keyword").first()).toBeVisible();
    return;
  }
  if (key.startsWith("markdown/")) {
    // The HTML story registers Markdown in its page script: wait for the render and the image.
    await expect(page.locator("[data-ok-markdown] h1")).toBeVisible();
    await expect(page.locator("[data-ok-markdown] .hljs-keyword").first()).toBeVisible();
    await imagesSettled(page);
    return;
  }
  if (key.startsWith("code-editor/")) {
    // Monaco loads on demand: wait for every editor, its fonts and (Validation) the markers.
    for (const root of await page.locator("[data-ok-code-editor], [data-ok-diff-editor]").all())
      await expect(root).toHaveAttribute("data-ok-status", "ready");
    if (key === "code-editor/validation")
      await expect(page.locator(".sb-code-editor-problems li").first()).toContainText("Line");
    if (key === "code-editor/diff")
      await expect(page.locator("[data-ok-diff-editor] .char-insert").first()).toBeAttached();
    await page.evaluate(() => document.fonts.ready);
    // Monaco shows its scrollbars after a layout, then fades them out: wait until they're hidden.
    await expect(page.locator(".monaco-editor .scrollbar.visible")).toHaveCount(0);
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
    return;
  }
  if (key === "date-pickers/customization") {
    // The HTML story sets its day renderer in a page script: wait for the event dots.
    await expect(page.locator(".sb-day-dot")).toHaveCount(5);
    return;
  }
  if (!LOADS.has(key)) return;
  const grid = page.getByRole("grid");
  await expect(grid.locator('[data-ok-data-grid-body] > [role="row"]').first()).toBeVisible();
  await expect(grid).not.toHaveAttribute("aria-busy", "true");
}

/**
 * Map stories: the WebGL canvas can render tiles at different moments in two page loads, so it is
 * hidden for the pixel comparison; markers, popups, panels and controls are compared (spec: parity
 * notes). The anatomy test compares the DOM, MapLibre's canvas container included.
 */
const SCREENSHOT_CSS: Record<string, string> = {
  map: "[data-ok-map-view] canvas { visibility: hidden !important; }",
};

for (const [component, story] of pairs) {
  test.describe(`${component} / ${story}`, () => {
    test("has identical anatomy in React and HTML", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Structure is browser-independent.");
      await openStory(page, storyId("react", component, story));
      await loaded(page, `${component}/${story}`);
      const react = await normalizeStory(page);
      await openStory(page, storyId("html", component, story));
      await loaded(page, `${component}/${story}`);
      const html = await normalizeStory(page);
      expect(react).toEqual(html);
    });

    test("renders identical pixels in React and HTML", async ({ page }) => {
      for (const theme of ["light", "dark"] as const) {
        await openStory(page, storyId("react", component, story), theme);
        await loaded(page, `${component}/${story}`);
        await repaintFromScratch(page);
        const css = SCREENSHOT_CSS[component];
        const options = { animations: "disabled" as const, ...(css ? { style: css } : {}) };
        const react = await page.locator("#storybook-root").screenshot(options);
        await openStory(page, storyId("html", component, story), theme);
        await loaded(page, `${component}/${story}`);
        await repaintFromScratch(page);
        const html = await page.locator("#storybook-root").screenshot(options);
        expect(html.equals(react), `${theme} theme screenshots differ`).toBe(true);
      }
    });
  });
}
