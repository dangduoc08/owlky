/**
 * The lazy modules of the CDN bundle (ADR-0068 §2, roadmap-size.md decision 9): `owlky.js` holds
 * the runtime and the light components; each module below is `modules/<name>.js` next to it,
 * loaded when the page holds a root its selector matches. `definitions` are the runtime names
 * the module registers (`modules.test.ts` checks both against the real definitions).
 *
 * `stylesheet`: the module has its own `modules/<name>.css`, attached before its code runs. Off
 * for every module until the CSS split (S4): `owlky.css` still holds every component.
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
  },
  "data-grid": { selector: "[data-ok-data-grid]", definitions: ["data-grid"] },
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
  },
  gantt: { selector: "[data-ok-gantt]", definitions: ["gantt"] },
  carousel: {
    selector: "[data-ok-carousel],[data-ok-lightbox]",
    definitions: ["carousel", "lightbox"],
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
  },
  "organization-chart": {
    selector: "[data-ok-organization-chart]",
    definitions: ["organization-chart"],
  },
  upload: { selector: "[data-ok-upload]", definitions: ["upload"] },
  walktour: { selector: "[data-ok-walktour]", definitions: ["walktour"] },
  "tree-view": { selector: "[data-ok-tree-view]", definitions: ["tree-view"] },
  sortable: { selector: "[data-ok-sortable]", definitions: ["sortable"] },
  autocomplete: { selector: "[data-ok-autocomplete]", definitions: ["autocomplete"] },
  "transfer-list": { selector: "[data-ok-transfer-list]", definitions: ["transfer-list"] },
  // The opt-in engines (ADR-0023, 0025, 0034, 0035, 0041, 0061), on the same loader.
  editor: { selector: "[data-ok-editor]", definitions: ["editor"] },
  map: { selector: "[data-ok-map]", definitions: ["map"] },
  markdown: { selector: "[data-ok-markdown]", definitions: ["markdown"] },
  "code-editor": {
    selector: "[data-ok-code-editor],[data-ok-diff-editor]",
    definitions: ["code-editor", "diff-editor"],
  },
  "phone-input": { selector: "[data-ok-phone-input]", definitions: ["phone-input"] },
  illustration: { selector: "svg[data-ok-illustration]", definitions: ["illustration"] },
} as const satisfies Record<string, LazyModule>;

export type LazyModuleName = keyof typeof LAZY_MODULES;
