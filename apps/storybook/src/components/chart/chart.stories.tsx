import { Chart } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { chartExamples } from "./chart-data.js";
import { ChartDocs } from "./chart-docs.js";
import { CHART_CONTROLS, CHART_FILES, chartCode, chartStories } from "./chart-examples.js";
import liveSource from "./chart-live.tsx?raw";
import { LIVE_SCRIPT_SOURCE, liveScript } from "./chart-scripts.js";

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
