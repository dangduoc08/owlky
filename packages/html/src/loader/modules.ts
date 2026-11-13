/**
 * The lazy modules of the CDN bundle (ADR-0068 §2, roadmap-size.md decision 9): `owlky.js` holds
 * the runtime and the light components; each module below is `modules/<name>.js` next to it,
 * loaded when the page holds a root its selector matches. `definitions` are the runtime names
 * the module registers (`modules.test.ts` checks both against the real definitions).
 *
 * `stylesheet`: the module has its own `modules/<name>.css` (the files of its family in
 * `@owlky/styles/families.json`, ADR-0068 §5), attached before its code runs, after the core
 * `owlky.css` and in the order of this table. The table's key order is that file's key order
 * (`styles.test.ts` checks it): a module that composes another usually comes after it, so its
 * sheet restyles the child. The one exception is the Data grid, which comes before the date
 * pickers it shows in cells: the pickers' own rules must win over the grid's broad ones.
 */
export interface LazyModule {
  /** Root selectors of the module's components, comma-separated. */
  readonly selector: string;
  /** Runtime names of the components the module registers. */
  readonly definitions: readonly string[];
  readonly stylesheet?: boolean;
}

export const LAZY_MODULES = {
  chart: {
    selector: "[data-ok-chart],[data-ok-chart-trellis]",
    definitions: ["chart", "chart-trellis"],
    stylesheet: true,
  },
  illustration: {
    selector: "svg[data-ok-illustration]",
    definitions: ["illustration"],
    stylesheet: true,
  },
  "data-grid": { selector: "[data-ok-data-grid]", definitions: ["data-grid"], stylesheet: true },
  "date-picker": {
    selector:
      "[data-ok-date-field],[data-ok-date-calendar],[data-ok-date-picker],[data-ok-date-range-calendar],[data-ok-date-range-picker],[data-ok-time-clock],[data-ok-digital-clock],[data-ok-multi-section-digital-clock],[data-ok-month-calendar]:not([data-ok-date-calendar] *),[data-ok-year-calendar]:not([data-ok-date-calendar] *),[data-ok-multi-input-range-field]",
    definitions: [
      "date-field",
      "date-calendar",
      "date-picker",
      "date-range-calendar",
      "date-range-picker",
      "time-clock",
      "digital-clock",
      "multi-section-digital-clock",
      "month-calendar",
      "year-calendar",
      "multi-input-range-field",
    ],
    stylesheet: true,
  },
  gantt: { selector: "[data-ok-gantt]", definitions: ["gantt"], stylesheet: true },
  carousel: {
    selector: "[data-ok-carousel],[data-ok-lightbox]",
    definitions: ["carousel", "lightbox"],
    stylesheet: true,
  },
  motion: {
    selector:
      "[data-ok-motion],[data-ok-motion-group],[data-ok-motion-text],[data-ok-motion-border],[data-ok-count-up],[data-ok-scroll-progress]",
    definitions: [
      "motion",
      "motion-group",
      "motion-text",
      "motion-border",
      "count-up",
      "scroll-progress",
    ],
    stylesheet: true,
  },
  "organization-chart": {
    selector: "[data-ok-organization-chart]",
    definitions: ["organization-chart"],
    stylesheet: true,
  },
  upload: { selector: "[data-ok-upload]", definitions: ["upload"], stylesheet: true },
  walktour: { selector: "[data-ok-walktour]", definitions: ["walktour"], stylesheet: true },
  "tree-view": { selector: "[data-ok-tree-view]", definitions: ["tree-view"], stylesheet: true },
  sortable: { selector: "[data-ok-sortable]", definitions: ["sortable"], stylesheet: true },
  autocomplete: {
    selector: "[data-ok-autocomplete]",
    definitions: ["autocomplete"],
    stylesheet: true,
  },
  "transfer-list": {
    selector: "[data-ok-transfer-list]",
    definitions: ["transfer-list"],
    stylesheet: true,
  },
  // The opt-in engines (ADR-0023, 0025, 0034, 0035, 0041, 0061), on the same loader.
  markdown: { selector: "[data-ok-markdown]", definitions: ["markdown"], stylesheet: true },
  editor: { selector: "[data-ok-editor]", definitions: ["editor"], stylesheet: true },
  map: { selector: "[data-ok-map]", definitions: ["map"], stylesheet: true },
  "code-editor": {
    selector: "[data-ok-code-editor],[data-ok-diff-editor]",
    definitions: ["code-editor", "diff-editor"],
    stylesheet: true,
  },
  "phone-input": {
    selector: "[data-ok-phone-input]",
    definitions: ["phone-input"],
    stylesheet: true,
  },
} as const satisfies Record<string, LazyModule>;

export type LazyModuleName = keyof typeof LAZY_MODULES;
