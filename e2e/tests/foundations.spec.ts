import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { optionSchemas } from "@owlky/core";
import { defaultTheme, shadowNames, typographyVariants } from "@owlky/tokens";
import { expect, test } from "@playwright/test";
import { CONTRAST_EXEMPT, openStory, routeMapTiles, storyIds } from "./helpers.js";

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
    await expect(page.locator('[data-shadow="--ok-elevation-1"]')).toHaveCSS(
      "box-shadow",
      /0\.2\) 0px 2px 1px -1px, .*0\.14\) 0px 1px 1px 0px, .*0\.12\) 0px 1px 3px 0px$/,
    );
    await openStory(page, "foundations-shadows--custom");
    await expect(page.locator("[data-shadow]")).toHaveCount(shadowNames.length);
    await expect(page.locator('[data-shadow="--ok-shadow-z8"]')).toHaveCSS(
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

/** Docs pages with a usage guide: id and the last section's heading (rendered = page ready). */
const GUIDES = [
  ["introduction--docs", "Accessibility"],
  ["foundations-colors--docs", "Accessibility"],
  ["foundations-typography--docs", "Accessibility"],
  ["foundations-shadows--docs", "Accessibility"],
  ["foundations-grid--docs", "Accessibility"],
  ["foundations-icons--docs", "Accessibility"],
  ["foundations-settings--docs", "Accessibility"],
  ["foundations-illustrations--docs", "Credits"],
  ["components-accordion--docs", "Accessibility"],
  ["components-alert--docs", "Accessibility"],
  ["components-avatar--docs", "Accessibility"],
  ["components-badge--docs", "Accessibility"],
  ["components-button-button--docs", "Accessibility"],
  ["components-checkbox--docs", "Accessibility"],
  ["components-chip--docs", "Accessibility"],
  ["components-button-button-group--docs", "Accessibility"],
  ["components-button-fab--docs", "Accessibility"],
  ["components-button-icon-button--docs", "Accessibility"],
  ["components-button-toggle-button--docs", "Accessibility"],
  ["components-divider--docs", "Accessibility"],
  ["components-paper--docs", "Accessibility"],
  ["components-typography--docs", "Accessibility"],
  ["components-link--docs", "Accessibility"],
  ["components-card--docs", "Accessibility"],
  ["components-drawer--docs", "Accessibility"],
  ["components-label--docs", "Accessibility"],
  ["components-list--docs", "Accessibility"],
  ["components-snackbar--docs", "Accessibility"],
  ["components-dialog--docs", "Accessibility"],
  ["components-backdrop--docs", "Accessibility"],
  ["components-collapse--docs", "Accessibility"],
  ["components-menu--docs", "Accessibility"],
  ["components-tooltip--docs", "Accessibility"],
  ["components-popover--docs", "Accessibility"],
  ["components-pagination--docs", "Accessibility"],
  ["components-progress-circular-progress--docs", "Accessibility"],
  ["components-progress-linear-progress--docs", "Accessibility"],
  ["components-radio--docs", "Accessibility"],
  ["components-form-control--docs", "Accessibility"],
  ["components-scrollbar--docs", "Accessibility"],
  ["components-sortable--docs", "Accessibility"],
  ["components-switch--docs", "Accessibility"],
  ["components-table--docs", "Accessibility"],
  ["components-text-field--docs", "Accessibility"],
  ["components-select--docs", "Accessibility"],
  ["components-tabs--docs", "Accessibility"],
  ["components-breadcrumbs--docs", "Accessibility"],
  ["components-stepper--docs", "Accessibility"],
  ["components-timeline--docs", "Accessibility"],
  ["components-organization-chart--docs", "Accessibility"],
  ["components-image--docs", "Accessibility"],
  ["components-rating--docs", "Accessibility"],
  ["components-chart--docs", "Accessibility"],
  ["components-gantt--docs", "Accessibility"],
  ["components-carousel--docs", "Accessibility"],
  ["components-lightbox--docs", "Accessibility"],
  ["components-upload--docs", "Accessibility"],
  ["components-walktour--docs", "Accessibility"],
  ["components-slider--docs", "Accessibility"],
  ["components-transfer-list--docs", "Accessibility"],
  ["components-tree-view--docs", "Accessibility"],
  ["components-autocomplete--docs", "Accessibility"],
  ["components-date-pickers--docs", "Accessibility"],
  ["components-motion--docs", "Accessibility"],
  ["components-datagrid--docs", "Accessibility"],
  ["components-editor--docs", "Accessibility"],
  ["components-markdown--docs", "Accessibility"],
  ["components-phone-input--docs", "Accessibility"],
  ["components-code-editor--docs", "Accessibility"],
  ["components-map--docs", "Accessibility"],
] as const;

/** Component docs pages and their option schema: the Options table lists every option. */
const OPTION_TABLES: [string, (keyof typeof optionSchemas)[]][] = [
  ["components-accordion--docs", ["accordion", "accordion-actions"]],
  ["components-alert--docs", ["alert"]],
  ["components-avatar--docs", ["avatar", "avatar-group"]],
  ["components-badge--docs", ["badge"]],
  ["components-editor--docs", ["editor"]],
  ["components-markdown--docs", ["markdown"]],
  ["components-phone-input--docs", ["phone-input"]],
  ["components-code-editor--docs", ["code-editor", "diff-editor"]],
  [
    "components-map--docs",
    [
      "map",
      "map-marker",
      "map-popup",
      "map-navigation",
      "map-geolocate",
      "map-scale",
      "map-attribution",
      "map-legend",
    ],
  ],
  ["components-button-button--docs", ["button"]],
  ["components-checkbox--docs", ["checkbox", "form-control-label"]],
  ["components-chip--docs", ["chip"]],
  ["components-button-button-group--docs", ["button-group"]],
  ["components-button-fab--docs", ["fab"]],
  ["components-button-icon-button--docs", ["icon-button"]],
  ["components-button-toggle-button--docs", ["toggle-button", "toggle-group"]],
  ["components-divider--docs", ["divider"]],
  ["components-paper--docs", ["paper"]],
  ["components-typography--docs", ["typography"]],
  ["components-link--docs", ["link"]],
  ["components-card--docs", ["card", "card-actions"]],
  ["components-drawer--docs", ["drawer"]],
  ["components-label--docs", ["label"]],
  ["components-popover--docs", ["popover"]],
  ["components-tooltip--docs", ["tooltip"]],
  ["components-menu--docs", ["menu", "menu-item", "popover"]],
  ["components-dialog--docs", ["dialog"]],
  ["components-backdrop--docs", ["backdrop"]],
  ["components-collapse--docs", ["collapse"]],
  ["components-snackbar--docs", ["toaster"]],
  [
    "components-list--docs",
    ["list", "list-item", "list-item-button", "list-item-text", "list-subheader"],
  ],
  ["components-pagination--docs", ["pagination"]],
  ["components-progress-circular-progress--docs", ["circular-progress"]],
  ["components-progress-linear-progress--docs", ["linear-progress"]],
  ["components-radio--docs", ["radio", "radio-group", "form-control-label"]],
  [
    "components-form-control--docs",
    ["form-control", "form-label", "form-group", "form-helper-text"],
  ],
  ["components-scrollbar--docs", ["scrollbar"]],
  ["components-sortable--docs", ["sortable"]],
  ["components-switch--docs", ["switch", "form-control-label"]],
  ["components-table--docs", ["table", "table-sort-label"]],
  ["components-text-field--docs", ["text-field", "number-field"]],
  ["components-select--docs", ["select", "input-label"]],
  ["components-tabs--docs", ["tabs", "tab"]],
  ["components-breadcrumbs--docs", ["breadcrumbs"]],
  ["components-stepper--docs", ["stepper", "step", "step-label", "mobile-stepper"]],
  ["components-timeline--docs", ["timeline", "timeline-item", "timeline-dot"]],
  ["components-organization-chart--docs", ["organization-chart", "organization-chart-node"]],
  ["components-image--docs", ["image"]],
  ["components-rating--docs", ["rating"]],
  ["components-chart--docs", ["chart"]],
  ["components-gantt--docs", ["gantt"]],
  [
    "components-carousel--docs",
    ["carousel", "carousel-arrows", "carousel-dots", "carousel-progress", "carousel-thumbs"],
  ],
  ["components-lightbox--docs", ["lightbox"]],
  ["components-upload--docs", ["upload"]],
  ["foundations-illustrations--docs", ["illustration"]],
  ["components-walktour--docs", ["walktour", "walktour-step"]],
  ["components-slider--docs", ["slider"]],
  ["components-transfer-list--docs", ["transfer-list"]],
  ["components-tree-view--docs", ["tree-view"]],
  ["components-autocomplete--docs", ["autocomplete"]],
  [
    "components-date-pickers--docs",
    [
      "date-picker",
      "date-calendar",
      "date-field",
      "time-clock",
      "digital-clock",
      "multi-section-digital-clock",
      "date-range-picker",
      "date-range-calendar",
    ],
  ],
  [
    "components-motion--docs",
    ["motion", "motion-group", "motion-text", "count-up", "countdown", "motion-border"],
  ],
  ["components-datagrid--docs", ["data-grid"]],
];

for (const [id, schemaNames] of OPTION_TABLES) {
  test(`${id}: the Options table lists every schema option`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Content check runs once.");
    await page.goto(`/apps/storybook/storybook-static/iframe.html?id=${id}&viewMode=docs`);
    const rows = page.locator("[data-docs-option]");
    await expect(rows.first()).toBeVisible();
    const keys = await rows.evaluateAll((all) =>
      all.map((row) => row.getAttribute("data-docs-option")),
    );
    expect(keys).toEqual(schemaNames.flatMap((name) => Object.keys(optionSchemas[name].options)));
  });
}

/**
 * Component docs pages and the API references they show (ADR-0049): the "API reference" section
 * renders one row per prop, option, part, event, method, type and CSS variable of the generated
 * `apps/docs-content/src/api/<component>.json` (roadmap 3.4).
 */
const API_PAGES: [string, string[]][] = [
  ...OPTION_TABLES.map(([id]) => id)
    .filter((id) => id.startsWith("components-"))
    .map((id): [string, string[]] => {
      const page = id.replace(/^components-(button-|progress-)?|--docs$/g, "");
      const spec = { "date-pickers": "date-picker", datagrid: "data-grid" }[page] ?? page;
      return [
        id,
        ["checkbox", "radio", "switch"].includes(spec) ? [spec, "form-control-label"] : [spec],
      ];
    }),
  ["components-list--docs", ["list"]] as [string, string[]],
  ["components-gantt--docs", ["gantt"]] as [string, string[]],
  ["foundations-illustrations--docs", ["illustration"]] as [string, string[]],
].filter(([id], index, all) => all.findIndex(([other]) => other === id) === index);

interface ApiJson {
  entries: {
    name: string;
    react?: { props: { name: string }[] };
    html?: {
      options?: { name: string }[];
      parts?: { name: string }[];
      events?: { name: string }[];
      methods?: { name: string }[];
    };
  }[];
  types?: { name: string; framework?: string }[];
  css?: { name: string }[];
}

/** The `data-docs-api-row` values the reference of `spec` renders. */
function apiRows(spec: string): string[] {
  const data = JSON.parse(
    readFileSync(new URL(`../../apps/docs-content/src/api/${spec}.json`, import.meta.url), "utf8"),
  ) as ApiJson;
  return [
    ...data.entries.flatMap(({ name, react, html }) => [
      ...(react?.props ?? []).map((prop) => `prop:${name}:${prop.name}`),
      ...(html?.options ?? []).map((option) => `option:${name}:${option.name}`),
      ...(html?.parts ?? []).map((part) => `part:${name}:${part.name}`),
      ...(html?.events ?? []).map((event) => `event:${name}:${event.name}`),
      ...(html?.methods ?? []).map((method) => `method:${name}:${method.name}`),
    ]),
    ...(data.types ?? []).map(
      (type) => `type:${type.name}${type.framework ? `:${type.framework}` : ""}`,
    ),
    ...(data.css ?? []).map((variable) => `css:${variable.name}`),
  ];
}

for (const [id, specs] of API_PAGES) {
  test(`${id}: the API reference lists every prop, attribute, event, method and variable`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Content check runs once.");
    await page.goto(`/apps/storybook/storybook-static/iframe.html?id=${id}&viewMode=docs`);
    await expect(page.locator("[data-docs-api]").first()).toBeVisible();
    const rows = await page
      .locator("[data-docs-api-row]")
      .evaluateAll((all) => all.map((row) => row.getAttribute("data-docs-api-row")));
    expect(rows.sort()).toEqual(specs.flatMap(apiRows).sort());
  });
}

const THEME_CSS = readFileSync(
  new URL("../../packages/styles/src/theme.css", import.meta.url),
  "utf8",
);
/** Tailwind utilities that come from the Owlky theme: their token must exist in theme.css. */
const TOKEN_UTILITY = /^(bg|text|border|shadow|font)-([a-z]+(?:-[a-z0-9]+)*)$/;
const NAMESPACES: Record<string, string[]> = {
  bg: ["color"],
  text: ["color", "text"],
  border: ["color"],
  shadow: ["shadow"],
  font: ["font"],
};
const LAYOUT_WORDS = new Set(["solid", "dashed", "0", "2", "l", "b", "semibold", "bold", "mono"]);

for (const [id, lastHeading] of GUIDES) {
  test.describe(`Docs guide ${id}`, () => {
    const openDocs = async (page: import("@playwright/test").Page, theme = "light") => {
      // Live previews animate (Motion): reduced motion shows their end state at once.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await routeMapTiles(page);
      await page.goto(
        `/apps/storybook/storybook-static/iframe.html?id=${id}&viewMode=docs&globals=theme:${theme};a11y.manual:!true`,
      );
      await expect(page.getByRole("heading", { name: lastHeading })).toBeVisible();
    };

    test("every token and Tailwind token class in the examples exists", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "Content check runs once.");
      await openDocs(page);
      const code =
        // The API reference lists variables as data (color bindings exist per element only).
        (
          await page
            .locator("[data-docs-code] pre, .sb-docs-guide code:not([data-docs-api] code)")
            .allTextContents()
        ).join("\n");
      const variables = [...new Set(code.match(/--ok-[a-z0-9-]*[a-z0-9]\b(?!-)/g) ?? [])];
      const missing = await page.evaluate(
        (names) =>
          names.filter(
            (name) => getComputedStyle(document.documentElement).getPropertyValue(name) === "",
          ),
        variables,
      );
      expect(missing).toEqual([]);
      const classes = [...code.matchAll(/class(?:Name)?="([^"]*)"/g)].flatMap((m) =>
        (m[1] as string).split(/\s+/).map((c) => c.split(":").at(-1) as string),
      );
      const unknown = classes.filter((name) => {
        const match = TOKEN_UTILITY.exec(name);
        if (!match || LAYOUT_WORDS.has(match[2] as string)) return false;
        return !(NAMESPACES[match[1] as string] ?? []).some((ns) =>
          THEME_CSS.includes(`--${ns}-${match[2]}:`),
        );
      });
      expect(unknown).toEqual([]);
    });

    for (const theme of ["light", "dark"] as const) {
      test(`has no WCAG 2.2 AA violations (${theme})`, async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "axe results are engine-independent.");
        // The longest guides (data grid, date pickers: full examples and the API reference) take
        // axe more than the default 30 s on the mobile CI runners.
        test.setTimeout(120_000);
        await openDocs(page, theme);
        // Brand-colored examples follow the reference (ADR-0014); demo pairs that show a failing
        // combination on purpose are marked data-demo-disabled.
        let axe = new AxeBuilder({ page })
          .include("#storybook-docs")
          .exclude("[data-demo-disabled]")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
        for (const selector of CONTRAST_EXEMPT) axe = axe.exclude(selector);
        const results = await axe.analyze();
        expect(
          results.violations.map(
            (v) =>
              `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes.map((n) => n.target).join(" | ")}`,
          ),
        ).toEqual([]);
      });
    }

    test("fits a phone without horizontal page scrolling", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await openDocs(page);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    });
  });
}
