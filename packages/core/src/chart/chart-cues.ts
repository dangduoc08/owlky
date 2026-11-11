import type { ChartNode } from "./chart-layout.js";
import {
  type ChartColor,
  type ChartData,
  type ChartMarkerShape,
  type ChartPattern,
  chartColors,
  chartMarkerShapes,
  chartPatterns,
  isChartMarkerShape,
  parseChartNumber,
} from "./chart-model.js";

export {
  type ChartMarkerShape,
  type ChartPattern,
  chartMarkerShapes,
  chartPatterns,
  isChartMarkerShape,
  isChartPattern,
} from "./chart-model.js";

/*
 * Non-color series cues (roadmap 4.18.62, WCAG 1.4.1; ApexCharts `markers.shape`,
 * `markers.discrete`, `fill.pattern`, `stroke.width` / `dashArray`, `colorBlindMode`): marker
 * shapes, pattern fills and dashes per series, so series differ by more than their color. Every
 * cue is SVG nodes in the shared tree (patterns are `<pattern>` definitions with ids unique per
 * chart); colors come from the palette tokens through `data-ok-color`.
 */

/** `colorBlindMode` dashes per series in turn (the first series stays solid). */
export const chartCueDashes: readonly (string | undefined)[] = [
  undefined,
  "6 4",
  "2 3",
  "8 3 2 3",
  "12 4",
];

/** A marker drawn on one point whatever the series' markers (ApexCharts `markers.discrete`). */
export interface ChartDiscreteMarker {
  readonly seriesIndex: number;
  /** The category index, or the point's position among the series' values on numeric axes. */
  readonly dataPointIndex: number;
  /** Fill color (palette name). Default the series color. */
  readonly color?: ChartColor | undefined;
  /** Radius in px. Default the series' marker size, at least 5. */
  readonly size?: number | undefined;
  /** Default the series' shape. */
  readonly shape?: ChartMarkerShape | undefined;
}

const isColor = (value: unknown): value is ChartColor => chartColors.includes(value as ChartColor);

const n2 = (value: number) => String(Math.round(value * 100) / 100);

/**
 * A marker of `shape` centered on (x, y) with radius `r`: a `circle`, or a `path` with
 * `data-ok-shape` (cross and plus are strokes).
 */
export function chartMarkerNode(
  shape: ChartMarkerShape | undefined,
  x: number,
  y: number,
  r: number,
  attrs: Readonly<Record<string, string>>,
): ChartNode {
  if (!shape || shape === "circle")
    return { tag: "circle", attrs: { cx: n2(x), cy: n2(y), r: n2(r), ...attrs } };
  const p = (dx: number, dy: number) => `${n2(x + dx)},${n2(y + dy)}`;
  let d: string;
  if (shape === "square") {
    const s = r * 0.9;
    d = `M${p(-s, -s)}L${p(s, -s)}L${p(s, s)}L${p(-s, s)}Z`;
  } else if (shape === "triangle")
    d = `M${p(0, -r * 1.2)}L${p(r * 1.1, r * 0.8)}L${p(-r * 1.1, r * 0.8)}Z`;
  else if (shape === "diamond")
    d = `M${p(0, -r * 1.25)}L${p(r * 1.25, 0)}L${p(0, r * 1.25)}L${p(-r * 1.25, 0)}Z`;
  else if (shape === "cross") d = `M${p(-r, -r)}L${p(r, r)}M${p(r, -r)}L${p(-r, r)}`;
  else if (shape === "plus")
    d = `M${p(-r * 1.2, 0)}L${p(r * 1.2, 0)}M${p(0, -r * 1.2)}L${p(0, r * 1.2)}`;
  else {
    // A five-pointed star: outer radius 1.3r, inner 0.55r.
    const points = Array.from({ length: 10 }, (_, i) => {
      const radius = i % 2 === 0 ? r * 1.3 : r * 0.55;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      return p(Math.cos(angle) * radius, Math.sin(angle) * radius);
    });
    d = `M${points.join("L")}Z`;
  }
  return { tag: "path", attrs: { d, ...attrs, "data-ok-shape": shape } };
}

/** The id of a pattern of `style` in `color` (one definition per pair and chart). */
export const chartPatternId = (prefix: string, style: ChartPattern, color: ChartColor) =>
  `${prefix}-pattern-${style}-${color}`;

/**
 * A `<pattern>` definition: an 8px tile with a faint tint of `color` (an attribute: CSS never
 * sets its opacity) and lines, squares or dots in it.
 */
export function chartPatternNode(id: string, style: ChartPattern, color: ChartColor): ChartNode {
  const mark: ChartNode =
    style === "circles"
      ? { tag: "circle", attrs: { cx: "4", cy: "4", r: "1.75", "data-ok-chart-pattern-mark": "" } }
      : {
          tag: "path",
          attrs: {
            d:
              style === "squares"
                ? "M1,1H4.5V4.5H1Z"
                : style === "verticalLines"
                  ? "M4,0V8"
                  : style === "horizontalLines"
                    ? "M0,4H8"
                    : "M-2,2L2,-2M0,8L8,0M6,10L10,6",
            "data-ok-chart-pattern-mark": "",
          },
        };
  return {
    tag: "pattern",
    attrs: {
      id,
      patternUnits: "userSpaceOnUse",
      width: "8",
      height: "8",
      "data-ok-chart-pattern": style,
      "data-ok-color": color,
    },
    children: [
      {
        tag: "rect",
        attrs: {
          width: "8",
          height: "8",
          "fill-opacity": "0.24",
          "data-ok-chart-pattern-tint": "",
        },
      },
      mark,
    ],
  };
}

/** Collects the pattern definitions of one render and returns `fill` values for them. */
export function chartPatternDefs(prefix: string) {
  const defs = new Map<string, ChartNode>();
  return {
    /** `url(#…)` of the pattern (defined once). */
    fill(style: ChartPattern, color: ChartColor): string {
      const id = chartPatternId(prefix, style, color);
      if (!defs.has(id)) defs.set(id, chartPatternNode(id, style, color));
      return `url(#${id})`;
    },
    nodes: (): ChartNode[] => [...defs.values()],
  };
}

export interface ChartCueOptions {
  readonly type?: string | undefined;
  readonly fill?: string | undefined;
  readonly markerShape?: ChartMarkerShape | undefined;
  readonly fillPattern?: ChartPattern | undefined;
  readonly markerSize?: number | undefined;
  readonly colorBlindMode?: boolean | undefined;
  readonly dashArray?: number | undefined;
  readonly strokeWidth?: number | undefined;
}

/** Series types whose fills take a pattern. */
const PATTERNED: readonly string[] = ["bar", "area", "streamgraph", "violin"];

/** Whether a chart draws pattern fills: `fill="pattern"`, a `fillPattern` or `colorBlindMode`. */
export const chartPatternsOn = (options: ChartCueOptions) =>
  options.fill === "pattern" ||
  options.fillPattern !== undefined ||
  options.colorBlindMode === true;

/** The pattern of the n-th series or slice when patterns are on. */
export const chartPatternAt = (
  options: ChartCueOptions,
  index: number,
): ChartPattern | undefined =>
  chartPatternsOn(options)
    ? (options.fillPattern ?? (chartPatterns[index % chartPatterns.length] as ChartPattern))
    : undefined;

/**
 * Resolves each series' cues: its marker `shape` (where markers are drawn), `pattern` (bars and
 * areas), `dash` and `width` (lines), from the series' own fields, the chart's options and
 * `colorBlindMode` (a distinct shape, pattern and dash per series in turn).
 */
export function withChartCues(data: ChartData, options: ChartCueOptions): ChartData {
  const blind = options.colorBlindMode === true;
  const lineMarkers = (options.markerSize ?? 0) > 0 || blind;
  const patterns = chartPatternsOn(options);
  let changed = false;
  const series = data.series.map((entry, index) => {
    const shape =
      entry.markerShape ??
      options.markerShape ??
      (blind ? chartMarkerShapes[index % chartMarkerShapes.length] : undefined);
    const drawsMarkers =
      entry.type === "scatter" ||
      entry.type === "violin" ||
      (lineMarkers && (entry.type === "line" || entry.type === "area"));
    const pattern = entry.fillPattern ?? (patterns ? chartPatternAt(options, index) : undefined);
    const dash =
      entry.dashArray !== undefined
        ? n2(entry.dashArray)
        : options.dashArray === undefined && blind
          ? chartCueDashes[index % chartCueDashes.length]
          : undefined;
    const width = entry.strokeWidth ?? options.strokeWidth;
    const cues = {
      ...(drawsMarkers && shape && shape !== "circle" ? { shape } : {}),
      ...(PATTERNED.includes(entry.type) && pattern ? { pattern } : {}),
      ...(dash ? { dash } : {}),
      ...(width !== undefined ? { width } : {}),
    };
    if (Object.keys(cues).length === 0) return entry;
    changed = true;
    return { ...entry, ...cues };
  });
  return changed ? { ...data, series } : data;
}

/** Valid discrete markers (untrusted input), at most 1000. */
export function chartDiscreteMarkers(
  list: readonly ChartDiscreteMarker[] | null | undefined,
): ChartDiscreteMarker[] {
  return (list ?? []).slice(0, 1000).flatMap((entry): ChartDiscreteMarker[] => {
    const seriesIndex = Number(entry?.seriesIndex);
    const dataPointIndex = Number(entry?.dataPointIndex);
    if (!Number.isInteger(seriesIndex) || !Number.isInteger(dataPointIndex)) return [];
    if (seriesIndex < 0 || dataPointIndex < 0) return [];
    const size = parseChartNumber(entry.size);
    return [
      {
        seriesIndex,
        dataPointIndex,
        ...(isColor(entry.color) ? { color: entry.color } : {}),
        ...(size !== null && size > 0 && size <= 50 ? { size } : {}),
        ...(isChartMarkerShape(entry.shape) ? { shape: entry.shape } : {}),
      },
    ];
  });
}

/** Discrete markers as attribute text: `"<series> <point> [color] [shape] [size]; …"`. */
export function chartDiscreteMarkersText(list: readonly ChartDiscreteMarker[] | undefined): string {
  return chartDiscreteMarkers(list)
    .map((entry) =>
      [entry.seriesIndex, entry.dataPointIndex, entry.color, entry.shape, entry.size]
        .filter((part) => part !== undefined)
        .join(" "),
    )
    .join("; ");
}

/** Discrete markers from attribute text (`chartDiscreteMarkersText`); words in any order after the indexes. */
export function parseChartDiscreteMarkers(text: string | null | undefined): ChartDiscreteMarker[] {
  if (!text || text.length > 20_000) return [];
  return chartDiscreteMarkers(
    text.split(";").flatMap((group): ChartDiscreteMarker[] => {
      const [series, point, ...words] = group.trim().split(/\s+/);
      if (
        series === undefined ||
        point === undefined ||
        !/^\d+$/.test(series) ||
        !/^\d+$/.test(point)
      )
        return [];
      let color: ChartColor | undefined;
      let shape: ChartMarkerShape | undefined;
      let size: number | undefined;
      for (const word of words) {
        if (isColor(word)) color = word;
        else if (isChartMarkerShape(word)) shape = word;
        else if (parseChartNumber(word) !== null) size = parseChartNumber(word) as number;
      }
      return [{ seriesIndex: Number(series), dataPointIndex: Number(point), color, shape, size }];
    }),
  );
}
