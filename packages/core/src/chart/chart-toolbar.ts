import type { ChartNode } from "./chart-layout.js";
import type { ChartPart } from "./chart-model.js";

/*
 * Chart toolbar (ADR-0031, phase 4): zoom buttons (charts with `zoom`) and downloads (SVG, PNG,
 * CSV). The items and their icons come from here, so React and the HTML runtime render the same
 * buttons. Icons are static paths written in the repo.
 */

export type ChartTool =
  | "zoomIn"
  | "zoomOut"
  | "reset"
  | "pan"
  | "measure"
  | "clearMeasures"
  | "svg"
  | "png"
  | "csv";
export const chartTools: readonly ChartTool[] = [
  "zoomIn",
  "zoomOut",
  "reset",
  "pan",
  "measure",
  "clearMeasures",
  "svg",
  "png",
  "csv",
];

/** Texts a chart shows or announces (localizable): part labels, tool names and messages. */
export type ChartLocaleText = Readonly<
  Partial<
    Record<
      | ChartPart
      | ChartTool
      | "toolbar"
      | "exportFailed"
      | "selected"
      // Crossfilter controls (4.18.19, ADR-0054).
      | "clearFilter"
      | "filter"
      | "filterCleared"
      // Drill controls of sunburst and icicle charts (ADR-0058).
      | "drillUp"
      // Drilldown and trellis controls (4.18.68).
      | "drilldownRoot"
      | "allPanels"
      // Measure rulers and draggable annotations (4.18.20).
      | "measureFrom"
      | "annotation"
      | "annotationDropped",
      string
    >
  >
>;

export const chartToolLabels: Readonly<
  Record<
    ChartTool | "toolbar" | "exportFailed" | "selected" | "measureFrom" | "annotationDropped",
    string
  >
> = {
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  reset: "Reset zoom",
  pan: "Pan",
  svg: "Download SVG",
  png: "Download PNG",
  csv: "Download CSV",
  // Measure rulers (4.18.20).
  measure: "Measure",
  clearMeasures: "Clear measures",
  toolbar: "Chart tools",
  exportFailed: "The download failed.",
  // The tooltip's state line when its item is selected (4.18.60).
  selected: "Selected",
  // Announced by the keyboard alternatives of rulers and annotation drags (4.18.20).
  measureFrom: "Measure from",
  annotationDropped: "Annotation placed",
};

export interface ChartToolItem {
  readonly tool: ChartTool;
  /** Accessible name. */
  readonly label: string;
  /** Visible text (downloads: the format), or an icon. */
  readonly text?: string | undefined;
  readonly icon?: ChartNode | undefined;
  /** Toggle tools (pan): `aria-pressed`. */
  readonly pressed?: boolean | undefined;
  readonly disabled?: boolean | undefined;
}

const MAGNIFIER = "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14ZM20 20l-4-4";
const PATHS: Partial<Record<ChartTool, string>> = {
  zoomIn: `${MAGNIFIER}M8 11h6M11 8v6`,
  zoomOut: `${MAGNIFIER}M8 11h6`,
  reset: "M4 12a8 8 0 1 0 2.34-5.66M4 4v4h4",
  pan: "M12 3v18M3 12h18M9 6l3-3l3 3M9 18l3 3l3-3M6 9l-3 3l3 3M18 9l3 3l-3 3",
  measure: "M3 17L17 3l4 4L7 21ZM7 13l2 2M10 10l2 2M13 7l2 2",
  clearMeasures: "M6 6l12 12M18 6L6 18",
};

const icon = (d: string): ChartNode => ({
  tag: "svg",
  attrs: {
    viewBox: "0 0 24 24",
    width: "20",
    height: "20",
    "aria-hidden": "true",
    focusable: "false",
    "data-ok-chart-tool-icon": "",
  },
  children: [{ tag: "path", attrs: { d } }],
});

/** The toolbar's buttons in order. */
export function chartToolbar(state: {
  /** The chart can zoom (an x axis and `zoom` on). */
  readonly zoom: boolean;
  readonly zoomed: boolean;
  readonly pan: boolean;
  readonly text?: ChartLocaleText | undefined;
  /** Measure rulers (4.18.20): the tools, whether measure mode is on and whether rulers exist. */
  readonly measure?: boolean | undefined;
  readonly measuring?: boolean | undefined;
  readonly measured?: boolean | undefined;
  /** `false`: no download buttons (a toolbar shown for the measure tools only). */
  readonly downloads?: boolean | undefined;
}): ChartToolItem[] {
  const label = (tool: ChartTool) => state.text?.[tool] ?? chartToolLabels[tool];
  const zoomTools: ChartToolItem[] = state.zoom
    ? [
        { tool: "zoomIn", label: label("zoomIn"), icon: icon(PATHS.zoomIn as string) },
        {
          tool: "zoomOut",
          label: label("zoomOut"),
          icon: icon(PATHS.zoomOut as string),
          disabled: !state.zoomed,
        },
        {
          tool: "reset",
          label: label("reset"),
          icon: icon(PATHS.reset as string),
          disabled: !state.zoomed,
        },
        { tool: "pan", label: label("pan"), icon: icon(PATHS.pan as string), pressed: state.pan },
      ]
    : [];
  const measureTools: ChartToolItem[] = state.measure
    ? [
        {
          tool: "measure",
          label: label("measure"),
          icon: icon(PATHS.measure as string),
          pressed: state.measuring === true,
        },
        {
          tool: "clearMeasures",
          label: label("clearMeasures"),
          icon: icon(PATHS.clearMeasures as string),
          disabled: !state.measured,
        },
      ]
    : [];
  return [
    ...zoomTools,
    ...measureTools,
    ...(state.downloads === false
      ? []
      : ([
          { tool: "svg", label: label("svg"), text: "SVG" },
          { tool: "png", label: label("png"), text: "PNG" },
          { tool: "csv", label: label("csv"), text: "CSV" },
        ] as const)),
  ];
}
