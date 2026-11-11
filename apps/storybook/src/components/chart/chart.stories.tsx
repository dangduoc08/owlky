import { Chart } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { chartExamples } from "./chart-data.js";
import { ChartDocs } from "./chart-docs.js";
import { CHART_CONTROLS, CHART_FILES, chartCode, chartStories } from "./chart-examples.js";
import liveSource from "./chart-live.tsx?raw";
import { GEO_SCRIPT_SOURCE, geoScript, LIVE_SCRIPT_SOURCE, liveScript } from "./chart-scripts.js";
import tooltipSource from "./chart-tooltip.tsx?raw";

const controls: StoryControls = { ...CHART_CONTROLS, target: Chart };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/chart/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["chart.css"], true);
const SETUP_BUTTON = htmlSetup(["chart.css", "button.css"], true);

const story = (name: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, CHART_FILES[name] ?? [], SETUP, CHART_CONTROLS),
    react: reactGroupsStory(
      chartStories[name] ?? [],
      controls,
      chartExamples[name] ? chartCode(chartExamples[name]) : undefined,
    ),
  }),
  name: chartExamples[name]?.title ?? name,
});

/** Live data: a stateful React demo and an HTML page script (no Controls). */
const liveStory = (name: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, CHART_FILES[name] ?? [], SETUP_BUTTON, undefined, {
      group: { script: liveScript, scriptSource: LIVE_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory(chartStories[name] ?? [], undefined, liveSource),
  }),
  name: chartExamples[name]?.title ?? name,
});

/** The Code panel of a geo story: the shapes the demo adds, as a React user would import them. */
const geoCode = (code: string) =>
  `import usStates from "./us-states.json";\n${code.replace("<Chart\n", "<Chart\n      geometry={usStates}\n")}`;

/**
 * Geo charts: the same geometry on both sides. HTML has it from a page script, so the markup
 * stays the table of regions; React passes it as a prop.
 */
const geoStory = (name: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, CHART_FILES[name] ?? [], SETUP, undefined, {
      group: { script: geoScript, scriptSource: GEO_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory(
      chartStories[name] ?? [],
      undefined,
      chartExamples[name] ? geoCode(chartCode(chartExamples[name])) : undefined,
    ),
  }),
  name: chartExamples[name]?.title ?? name,
});

/** Custom tooltip: a React render prop and an HTML template (no Controls). */
const customStory = (name: string, source: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, CHART_FILES[name] ?? [], SETUP),
    react: reactGroupsStory(chartStories[name] ?? [], undefined, source),
  }),
  name: chartExamples[name]?.title ?? name,
});

const meta = {
  title: "Components/Chart",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ChartDocs,
      description: {
        component:
          "Charts show values as lines, areas, columns, bars, points, slices, rings, radars, box plots, cells, bubbles, funnels or slopes, with a legend, a tooltip and the data as a table.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Line: StoryObj = story("line");
export const Area: StoryObj = story("area");
export const ColumnSingle: StoryObj = story("column-single");
export const ColumnMultiple: StoryObj = story("column-multiple");
export const ColumnStacked: StoryObj = story("column-stacked");
export const ColumnNegative: StoryObj = story("column-negative");
export const Bar: StoryObj = story("bar");
export const Mixed: StoryObj = story("mixed");
export const Scatter: StoryObj = story("scatter");
export const Pie: StoryObj = story("pie");
export const Donut: StoryObj = story("donut");
export const RadialBar: StoryObj = story("radial-bar");
export const Radar: StoryObj = story("radar");
export const SemiCircleGauge: StoryObj = story("semi-circle-gauge");
export const StrokedGauge: StoryObj = story("stroked-gauge");
export const BoxPlot: StoryObj = story("box-plot");
export const Heatmap: StoryObj = story("heatmap");
export const Treemap: StoryObj = story("treemap");
export const Bubble: StoryObj = story("bubble");
export const RangeArea: StoryObj = story("range-area");
export const Funnel: StoryObj = story("funnel");
export const Pyramid: StoryObj = story("pyramid");
export const Slope: StoryObj = story("slope");
export const Sparklines: StoryObj = story("sparklines");
export const LiveData: StoryObj = liveStory("live-data");
// Phase 4 (ADR-0027, ADR-0031): every ApexCharts type and feature beyond the reference.
export const Candlestick: StoryObj = story("candlestick");
export const RangeBar: StoryObj = story("range-bar");
export const Timeline: StoryObj = story("timeline");
export const PolarArea: StoryObj = story("polar-area");
export const Zoom: StoryObj = story("zoom");
export const Synchronized: StoryObj = story("synchronized");
export const Brush: StoryObj = story("brush");
export const Annotations: StoryObj = story("annotations");
export const DataLabels: StoryObj = story("data-labels");
export const DonutLegend: StoryObj = story("donut-legend");
export const HeatmapRanges: StoryObj = story("heatmap-ranges");
export const BoxPlotHorizontal: StoryObj = story("box-plot-horizontal");
export const Localized: StoryObj = story("localized");
export const Animations: StoryObj = story("animations");
// Roadmap 4.18.59: value axes and axis titles.
export const MultipleYAxes: StoryObj = story("multiple-y-axes");
export const AxisScales: StoryObj = story("axis-scales");
// Roadmap 4.18.60: data point selection.
export const Selection: StoryObj = story("selection");
// Roadmap 4.18.61: stack types and totals, label positions, value ranges, background bars.
export const ColumnStacked100: StoryObj = story("column-stacked-100");
export const StackTotals: StoryObj = story("stack-totals");
export const ColumnDataLabels: StoryObj = story("column-data-labels");
export const ColumnRanges: StoryObj = story("column-ranges");
// Roadmap 4.18.62: non-color series cues.
export const MarkerShapes: StoryObj = story("marker-shapes");
export const DashedLines: StoryObj = story("dashed-lines");
export const Patterns: StoryObj = story("patterns");
export const ColorBlind: StoryObj = story("color-blind");
// Roadmap 4.18.63: tooltip modes, fixed tooltips and custom content.
export const Tooltip: StoryObj = story("tooltip");
export const TooltipCustom: StoryObj = customStory("tooltip-custom", tooltipSource);
// Roadmap 4.18.64: legend and grid options.
export const Legend: StoryObj = story("legend");
export const Grid: StoryObj = story("grid");
// Phase 2.1 (ADR-0047): Sankey charts.
export const Sankey: StoryObj = story("sankey");
export const SankeyVertical: StoryObj = story("sankey-vertical");
export const SankeyCycles: StoryObj = story("sankey-cycles");
export const SankeyAlluvial: StoryObj = story("sankey-alluvial");
export const SankeyLinks: StoryObj = story("sankey-links");
// Phase 2.2 (ADR-0047): stock charts.
export const Stock: StoryObj = story("stock");
export const StockOverlays: StoryObj = story("stock-overlays");
export const StockOscillators: StoryObj = story("stock-oscillators");
export const StockLine: StoryObj = story("stock-line");
// Roadmap 4.18.21: waterfall and dumbbell charts.
export const Waterfall: StoryObj = story("waterfall");
export const Dumbbell: StoryObj = story("dumbbell");
// Roadmap 4.18.7 (ADR-0058): tree charts.
export const Tree: StoryObj = story("tree");
// Roadmap 4.18.86: tree label placement (ApexTree `externalLabel`).
export const TreeLabels: StoryObj = story("tree-labels");
// Roadmap 4.18.21 (ADR-0058): sunburst charts.
export const Sunburst: StoryObj = story("sunburst");
// Roadmap 4.18.21 (ADR-0058): icicle charts.
export const Icicle: StoryObj = story("icicle");
// Roadmap 4.18.17 (ADR-0059): offline SVG geo maps.
export const Geo: StoryObj = geoStory("geo");
export const GeoProjections: StoryObj = geoStory("geo-projections");
export const GeoHex: StoryObj = story("geo-hex");
// Roadmap 4.18.96: pixel maps.
export const GeoPixel: StoryObj = geoStory("geo-pixel");
// Roadmap 4.18.19: crossfilter between the charts of a group.
export const Crossfilter: StoryObj = story("crossfilter");
export const Streamgraph: StoryObj = story("streamgraph");
export const Violin: StoryObj = story("violin");
export const Beeswarm: StoryObj = story("beeswarm");
export const Waffle: StoryObj = story("waffle");
export const Unit: StoryObj = story("unit");
// Roadmap 4.18.65: x axis groups, rotation and fixed windows; forecasts, no data, text annotations.
export const XAxisGroups: StoryObj = story("x-axis-groups");
export const XAxisRotation: StoryObj = story("x-axis-rotation");
export const XAxisWindow: StoryObj = story("x-axis-window");
export const Forecast: StoryObj = story("forecast");
export const NoData: StoryObj = story("no-data");
export const AnnotationsText: StoryObj = story("annotations-text");
export const BrushTargets: StoryObj = story("brush-targets");
// Roadmap 4.18.66: data reduction of long lines.
export const DataReducer: StoryObj = story("data-reducer");
// Roadmap 4.18.67: timeline rows and zero bars of grouped columns.
export const TimelineRows: StoryObj = story("timeline-rows");
export const ColumnZeroBars: StoryObj = story("column-zero-bars");
// Roadmap 4.18.20: measure rulers and draggable annotations.
export const Measure: StoryObj = story("measure");
export const AnnotationsDrag: StoryObj = story("annotations-drag");
// Roadmap 4.18.68 (ADR-0060): drilldown levels and trellis small multiples.
export const Drilldown: StoryObj = story("drilldown");
export const Trellis: StoryObj = story("trellis");
