import { type IconData, iconTree } from "../icons/icon.js";
import {
  closeLinear,
  magnifierZoomInLinear,
  magnifierZoomOutLinear,
  moveLinear,
  restartLinear,
  rulerLinear,
} from "../icons/solar.js";
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

const ICONS: Partial<Record<ChartTool, IconData>> = {
  zoomIn: magnifierZoomInLinear,
  zoomOut: magnifierZoomOutLinear,
  reset: restartLinear,
  pan: moveLinear,
  measure: rulerLinear,
  clearMeasures: closeLinear,
};

const icon = (data: IconData): ChartNode =>
  iconTree(data, { width: "20", height: "20", "data-ok-chart-tool-icon": "" });

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
        { tool: "zoomIn", label: label("zoomIn"), icon: icon(ICONS.zoomIn as IconData) },
        {
          tool: "zoomOut",
          label: label("zoomOut"),
          icon: icon(ICONS.zoomOut as IconData),
          disabled: !state.zoomed,
        },
        {
          tool: "reset",
          label: label("reset"),
          icon: icon(ICONS.reset as IconData),
          disabled: !state.zoomed,
        },
        { tool: "pan", label: label("pan"), icon: icon(ICONS.pan as IconData), pressed: state.pan },
      ]
    : [];
  const measureTools: ChartToolItem[] = state.measure
    ? [
        {
          tool: "measure",
          label: label("measure"),
          icon: icon(ICONS.measure as IconData),
          pressed: state.measuring === true,
        },
        {
          tool: "clearMeasures",
          label: label("clearMeasures"),
          icon: icon(ICONS.clearMeasures as IconData),
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
