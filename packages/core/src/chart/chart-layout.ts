import type { ChartFormat } from "./chart-format.js";
import {
  type ChartColor,
  type ChartCurve,
  type ChartData,
  type ChartDataSeries,
  type ChartFill,
  type ChartType,
  lighterTone,
} from "./chart-model.js";
import {
  type DateLabel,
  type DateUnit,
  niceScale,
  scaleLinear,
  stepDecimals,
  unitIndex,
} from "./chart-scale.js";
import { timeTicks } from "./chart-time.js";

/*
 * Chart layout (ADR-0024): data + size → a tree of SVG nodes and the positions of every drawn
 * value. React turns the nodes into elements, the HTML runtime builds them with createElement:
 * attribute names are SVG's own, values are plain text (never markup).
 */

export type ChartNodeTag =
  | "svg"
  | "g"
  | "path"
  | "line"
  | "rect"
  | "circle"
  | "text"
  | "defs"
  | "linearGradient"
  | "stop";

export interface ChartNode {
  readonly tag: ChartNodeTag;
  readonly attrs: Readonly<Record<string, string>>;
  readonly children?: readonly ChartNode[] | undefined;
  /** Text content (`text` nodes only). */
  readonly text?: string | undefined;
}

export interface ChartLayoutOptions {
  readonly width: number;
  readonly height: number;
  readonly format: ChartFormat;
  /** Unique per chart: prefixes gradient ids. */
  readonly idPrefix: string;
  readonly curve?: ChartCurve | undefined;
  readonly fill?: ChartFill | undefined;
  readonly stacked?: boolean | undefined;
  readonly horizontal?: boolean | undefined;
  /** Marker radius of line and area series (default 0: none); scatter points default to 5. */
  readonly markerSize?: number | undefined;
  /** Bar width in % of a category (vertical bars). Default 40. */
  readonly columnWidth?: number | undefined;
  /** Bar thickness in % of a category (horizontal bars). Default 40. */
  readonly barHeight?: number | undefined;
  readonly yMin?: number | undefined;
  readonly yMax?: number | undefined;
  readonly yTitle?: string | undefined;
  /** Series hidden through the legend (by index; categories for pie, donut and radial bar). */
  readonly hidden?: readonly number[] | undefined;
  /** Prints values on the chart (percentages on pie and donut slices). */
  readonly dataLabels?: boolean | undefined;
  /** Circular charts: where the slices or rings start and end, in degrees clockwise from 12 o'clock. */
  readonly startAngle?: number | undefined;
  readonly endAngle?: number | undefined;
  /** Dash length of lines and radial bars in px (default solid). */
  readonly dashArray?: number | undefined;
  /** Radial bar track thickness in % of the bar. Default 50. */
  readonly trackWidth?: number | undefined;
  /** Donut and radial bar center: the total's label ("Total"); shown only when given. */
  readonly totalLabel?: string | undefined;
  /** Donut and radial bar center: the total shown (default the sum; radial bars the average). */
  readonly total?: number | undefined;
  /** No axes, grid or legend: the plot fills the SVG (charts in cards and table cells). */
  readonly sparkline?: boolean | undefined;
  /** Box plots: the box above the median (default the series color). */
  readonly boxUpperColor?: ChartColor | undefined;
  /** Box plots: the box below the median (default a lighter tone of the series color). */
  readonly boxLowerColor?: ChartColor | undefined;
  /** Candlesticks: rising and falling candles (default `success` and `error`). */
  readonly candleUpColor?: ChartColor | undefined;
  readonly candleDownColor?: ChartColor | undefined;
  /** Donut hole in % of the radius. Default 72. */
  readonly donutSize?: number | undefined;
  /** Heatmaps and treemaps: values in a range take its color (full strength). */
  readonly colorRanges?: readonly ChartColorRange[] | undefined;
  /**
   * The visible part of the x axis (vertical charts with an x axis): category indexes, or x
   * values on numeric axes. The value axis keeps the whole data's scale.
   */
  readonly zoom?: { readonly min: number; readonly max: number } | null | undefined;
}

/** A heatmap / treemap color range: values from `from` to `to` (inclusive) take `color`. */
export interface ChartColorRange {
  readonly from: number;
  readonly to: number;
  readonly color: ChartColor;
  readonly name?: string | undefined;
}

/**
 * How an axis maps values to SVG px (`from` is the px of `min`, `to` of `max`). `index`: category
 * indexes (centers of the first and last visible categories); `value`: numbers.
 */
export interface ChartAxisMap {
  readonly kind: "index" | "value";
  readonly min: number;
  readonly max: number;
  readonly from: number;
  readonly to: number;
  /** Banded categories (bars): the band width in px. */
  readonly band?: number | undefined;
}

/** A rectangle in SVG px (heatmap and treemap cells). */
export interface ChartRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A slice or ring of a circular chart: angles in degrees clockwise from 12 o'clock. */
export interface ChartArc {
  readonly cx: number;
  readonly cy: number;
  readonly start: number;
  readonly end: number;
  readonly inner: number;
  readonly outer: number;
}

/** A drawn value: what the tooltip and keyboard navigation point at. */
export interface ChartMark {
  readonly series: number;
  readonly type: ChartType;
  /** Category index (index charts) or the point's position in its series (scatter). */
  readonly index: number;
  /** The x value: category index or numeric x. */
  readonly x: number;
  readonly value: number;
  readonly px: number;
  readonly py: number;
  readonly color: ChartColor;
  /** Circular charts: the area that activates the mark (a slice, or a ring's whole track). */
  readonly arc?: ChartArc | undefined;
  /** Box plots (five values) and range areas (low, high): every value of the point. */
  readonly range?: readonly number[] | undefined;
  /** Bubbles: the size value and the drawn radius. */
  readonly z?: number | undefined;
  readonly r?: number | undefined;
  /** Heatmaps and treemaps: the cell that activates the mark. */
  readonly cell?: ChartRect | undefined;
}

export interface ChartSlot {
  readonly index: number;
  /** Center along the category axis (x for vertical charts, y for horizontal bars). */
  readonly pos: number;
}

export interface ChartLayout {
  readonly width: number;
  readonly height: number;
  readonly plot: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  /**
   * `index`: one tooltip per category; `point`: one per point (scatter, bubble); `slice`: one per
   * slice or ring (pie, donut, radial bar); `cell`: one per cell (heatmap, treemap; arrow keys
   * move in their direction).
   */
  readonly mode: "index" | "point" | "slice" | "cell";
  /** Radar: center and radius; slots are categories and `pos` their angle in degrees. */
  readonly polar?: { readonly cx: number; readonly cy: number; readonly r: number } | undefined;
  readonly horizontal: boolean;
  /** Bars are drawn: categories are bands (the hover highlight covers the band). */
  readonly banded: boolean;
  readonly band: number;
  readonly slots: readonly ChartSlot[];
  readonly marks: readonly ChartMark[];
  /** Radius of hover markers (0: none; bars only). */
  readonly activeRadius: number;
  readonly nodes: readonly ChartNode[];
  /** Vertical charts with an x axis (phase 4): x values → px (zoom, brush, annotations). */
  readonly x?: ChartAxisMap | undefined;
  /** The value axis: values → px (annotations). */
  readonly y?: ChartAxisMap | undefined;
}

export const FONT = 12;
/** Glyph widths of the UI font in em, by class (narrow, wide and currency signs, minus, digits, capitals, others). */
const glyph = (c: string): number =>
  /[ .,:;'!|il1jtfI()[\]]/.test(c)
    ? 0.32
    : /[%MWmw@$€£¥]/.test(c)
      ? 0.9
      : c === "-"
        ? 0.45
        : /\d/.test(c)
          ? 0.6
          : /[A-Z]/.test(c)
            ? 0.66
            : 0.56;

/**
 * Estimated width of a label at `FONT` px. An estimate (not a measurement), so the server, React
 * and the HTML runtime lay out identically; it errs on the wide side.
 */
export const chartTextWidth = (text: string, size = FONT): number => {
  let em = 0;
  for (const c of text) em += glyph(c);
  return Math.ceil(em * size);
};

export const r2 = (value: number) => Math.round(value * 100) / 100;
export const fmt = (value: number) => String(r2(value));
export const node = (
  tag: ChartNodeTag,
  attrs: Record<string, string>,
  children?: ChartNode[],
  text?: string,
): ChartNode => ({
  tag,
  attrs,
  ...(children ? { children } : {}),
  ...(text !== undefined ? { text } : {}),
});

/**
 * A value printed on the chart: `inside` a filled shape (white), `outside` above a point, or
 * `plain` on a faint cell (primary text).
 */
export const dataLabel = (
  x: number,
  y: number,
  text: string,
  place: "inside" | "outside" | "plain",
) =>
  node(
    "text",
    {
      x: fmt(x),
      y: fmt(y),
      dy: "0.35em",
      "text-anchor": "middle",
      "data-ok-chart-data-label": place,
    },
    undefined,
    text,
  );

// --- Paths ----------------------------------------------------------------------------------

type Pt = readonly [number, number];

/** A line through points: straight, smooth (horizontal tangents, no overshoot) or stepped. */
export function linePath(
  points: readonly Pt[],
  curve: ChartCurve = "smooth",
  horizontal = false,
): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points as [Pt, ...Pt[]];
  let d = `M${fmt(first[0])},${fmt(first[1])}`;
  let [px, py] = first;
  for (const [x, y] of rest) {
    if (curve === "straight") d += `L${fmt(x)},${fmt(y)}`;
    else if (curve === "stepline") {
      d += horizontal
        ? `L${fmt(px)},${fmt(y)}L${fmt(x)},${fmt(y)}`
        : `L${fmt(x)},${fmt(py)}L${fmt(x)},${fmt(y)}`;
    } else if (horizontal) {
      const dy = (y - py) * 0.35;
      d += `C${fmt(px)},${fmt(py + dy)} ${fmt(x)},${fmt(y - dy)} ${fmt(x)},${fmt(y)}`;
    } else {
      const dx = (x - px) * 0.35;
      d += `C${fmt(px + dx)},${fmt(py)} ${fmt(x - dx)},${fmt(y)} ${fmt(x)},${fmt(y)}`;
    }
    px = x;
    py = y;
  }
  return d;
}

/** A bar from `base` to `end` across `[a, a + size]`, rounded (radius `r`) at the value end. */
export function barPath(
  a: number,
  size: number,
  base: number,
  end: number,
  r: number,
  horizontal: boolean,
): string {
  const length = Math.abs(end - base);
  const radius = Math.max(0, Math.min(r, size / 2, length));
  const dir = end < base ? -1 : 1;
  const b = a + size;
  if (!horizontal) {
    // Vertical: along y; `dir` -1 = upward (positive values).
    const turn = end - dir * radius;
    const sweep = dir < 0 ? 1 : 0;
    return radius === 0
      ? `M${fmt(a)},${fmt(base)}V${fmt(end)}H${fmt(b)}V${fmt(base)}Z`
      : `M${fmt(a)},${fmt(base)}V${fmt(turn)}A${fmt(radius)},${fmt(radius)} 0 0 ${sweep} ${fmt(a + radius)},${fmt(end)}H${fmt(b - radius)}A${fmt(radius)},${fmt(radius)} 0 0 ${sweep} ${fmt(b)},${fmt(turn)}V${fmt(base)}Z`;
  }
  const turn = end - dir * radius;
  const sweep = dir > 0 ? 1 : 0;
  return radius === 0
    ? `M${fmt(base)},${fmt(a)}H${fmt(end)}V${fmt(b)}H${fmt(base)}Z`
    : `M${fmt(base)},${fmt(a)}H${fmt(turn)}A${fmt(radius)},${fmt(radius)} 0 0 ${sweep} ${fmt(end)},${fmt(a + radius)}V${fmt(b - radius)}A${fmt(radius)},${fmt(radius)} 0 0 ${sweep} ${fmt(turn)},${fmt(b)}H${fmt(base)}Z`;
}

// --- Label thinning ---------------------------------------------------------------------------

const STEPS: Record<DateUnit | "index", readonly number[]> = {
  index: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100],
  day: [1, 2, 7, 14, 28],
  month: [1, 2, 3, 4, 6, 12, 24, 60, 120],
  year: [1, 2, 5, 10, 20, 50, 100],
};

/** Which categories get a label so that labels `width` px wide never overlap. */
export function shownLabels(
  count: number,
  spacing: number,
  width: number,
  unit: DateUnit | "index",
  key: (index: number) => number,
): (index: number) => boolean {
  const steps = STEPS[unit];
  // The computed step always fits: it ends the list of candidates.
  const fallback = Math.ceil((width + 8) / Math.max(spacing, 1));
  const step = [...steps, fallback].find((s) => s * spacing >= width + 8) as number;
  if (step <= 1) return () => true;
  return (index) => index < count && key(index) % step === 0;
}

/** A scale from `min` to `max` without ticks (sparklines); a flat range opens upward. */
const flatScale = (min: number, max: number) => {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return { min: lo, max: hi > lo ? hi : lo + 1, step: 1, ticks: [] as number[] };
};

// --- Layout -----------------------------------------------------------------------------------

/** Series types that `horizontal` turns (left to right). */
const TURNABLE: readonly ChartType[] = ["bar", "boxPlot", "rangeBar"];
/** Series types drawn in category bands. */
const BANDED: readonly ChartType[] = ["bar", "boxPlot", "candlestick", "rangeBar", "timeline"];
/** Series types that fit the value scale to their data (no zero baseline). */
const FITTED: readonly ChartType[] = [
  "boxPlot",
  "rangeArea",
  "bubble",
  "candlestick",
  "rangeBar",
  "timeline",
];
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Lays out a chart. `width` and `height` are the SVG size in px. */
export function layoutChart(data: ChartData, options: ChartLayoutOptions): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(options.sparkline ? 8 : 40, Math.round(options.height));
  const { format } = options;
  const hidden = new Set(options.hidden ?? []);
  const visible = data.series
    .map((series, index) => ({ series, index }))
    .filter(({ index }) => !hidden.has(index));
  const typeOf = (s: ChartDataSeries): ChartType => s.type;
  // Timelines are horizontal range bars; bars, box plots and range bars may turn horizontal.
  const timeline = data.type === "timeline";
  const horizontal =
    timeline ||
    (options.horizontal === true &&
      visible.every(({ series }) => TURNABLE.includes(typeOf(series))));
  const numeric = data.xType === "numeric";
  const mode =
    data.series.length > 0 && data.series.every((s) => s.type === "scatter" || s.type === "bubble")
      ? "point"
      : "index";
  const banded = !numeric && visible.some(({ series }) => BANDED.includes(series.type));
  const stacked = options.stacked === true;
  const sparkline = options.sparkline === true;
  const count = numeric
    ? 0
    : Math.max(data.categories.length, ...data.series.map((s) => s.points.length), 0);
  // Zoom (phase 4): vertical charts show a window of their categories (or x values).
  const zoom = horizontal ? undefined : (options.zoom ?? undefined);
  const first = !numeric && zoom && count > 0 ? clamp(Math.round(zoom.min), 0, count - 1) : 0;
  const last =
    !numeric && zoom && count > 0 ? clamp(Math.round(zoom.max), first, count - 1) : count - 1;
  const shown = Math.max(0, last - first + 1);
  const inView = (x: number) =>
    numeric ? !zoom || (x >= zoom.min && x <= zoom.max) : x >= first && x <= last;

  // Stacked values: running totals per category, positives and negatives apart.
  const pos = new Array<number>(count).fill(0);
  const neg = new Array<number>(count).fill(0);
  const stack = new Map<string, readonly [number, number]>();
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  let xlo = Number.POSITIVE_INFINITY;
  let xhi = Number.NEGATIVE_INFINITY;
  for (const { series, index } of visible) {
    for (const point of series.points) {
      if (numeric) {
        xlo = Math.min(xlo, point.x);
        xhi = Math.max(xhi, point.x);
      }
      if (point.y === null) continue;
      if (point.range) {
        // Box plots, ranges and candles span their values (never stacked).
        lo = Math.min(lo, ...point.range);
        hi = Math.max(hi, ...point.range);
      } else if (stacked && !numeric) {
        const totals = point.y >= 0 ? pos : neg;
        const start = totals[point.x] as number;
        totals[point.x] = start + point.y;
        stack.set(`${index}:${point.x}`, [start, start + point.y]);
        lo = Math.min(lo, start + point.y, start);
        hi = Math.max(hi, start + point.y, start);
      } else {
        lo = Math.min(lo, point.y);
        hi = Math.max(hi, point.y);
      }
    }
  }
  if (lo === Number.POSITIVE_INFINITY) {
    lo = 0;
    hi = 1;
  }
  // Values start at zero, except where box plots, range areas, bubbles or sparkline lines fit the
  // scale to their data (bars and areas, filled from zero, keep it).
  const fitted = sparkline || visible.some(({ series }) => FITTED.includes(series.type));
  const zeroBased = visible.some(({ series }) =>
    fitted
      ? series.type === "bar" || series.type === "area"
      : ["line", "area", "bar", "scatter"].includes(series.type),
  );
  if (zeroBased || visible.length === 0) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }

  const gap = 12;
  const labelHeight = sparkline ? 0 : FONT + gap + 6;
  const top = sparkline ? 0 : 10;
  const yTitleSpace = options.yTitle && !sparkline ? FONT + 10 : 0;

  // Value axis ticks: about one per 48px of height (vertical) or 200px of width (horizontal).
  // Sparklines have no ticks: their scale is the data's own range.
  const valueSpan = horizontal ? width : height - top - labelHeight;
  // Timelines: dates along the value axis, on whole minutes, hours, days, months or years.
  const timeScale = () => {
    const end = hi > lo ? hi : lo + 86_400_000;
    return {
      min: lo,
      max: end,
      step: 1,
      ticks: timeTicks(lo, end, Math.max(2, Math.floor(valueSpan / 110)), format.timeUnit),
    };
  };
  const valueScale = sparkline
    ? flatScale(options.yMin ?? lo, options.yMax ?? hi)
    : timeline
      ? timeScale()
      : niceScale(lo, hi, Math.max(2, Math.round(valueSpan / (horizontal ? 200 : 48))), {
          min: options.yMin,
          max: options.yMax,
        });
  const decimals = stepDecimals(valueScale.step);
  const tickTexts = valueScale.ticks.map((tick) =>
    timeline ? format.timeTick(tick).text : format.tick(tick, decimals),
  );
  const nodes: ChartNode[] = [];
  const marks: ChartMark[] = [];
  const slots: ChartSlot[] = [];

  let plot: ChartLayout["plot"];
  let band = 0;
  let toValue: (value: number) => number;
  let toCat: (index: number) => number;
  let xMin = 0;
  let xMax = 1;

  const grid: ChartNode[] = [];
  const axisX: ChartNode[] = [];
  const axisY: ChartNode[] = [];
  const tickNode = (
    x: number,
    y: number,
    anchor: string,
    text: string,
    major = false,
    dy = "0.35em",
  ) =>
    node(
      "text",
      {
        x: fmt(x),
        y: fmt(y),
        dy,
        "text-anchor": anchor,
        "data-ok-chart-tick": "",
        ...(major ? { "data-ok-major": "" } : {}),
      },
      undefined,
      text,
    );
  const categoryLabels = Array.from({ length: count }, (_, index) =>
    format.axis(
      data.xType === "datetime"
        ? (data.categories[index] as number)
        : (data.categories[index] ?? String(index + 1)),
    ),
  );

  if (sparkline) {
    // No axes: the plot fills the SVG, less room for line strokes and markers.
    const pad = banded ? 1 : Math.max(3, (options.markerSize ?? 0) + 1);
    plot = {
      x: pad,
      y: pad,
      width: Math.max(10, width - pad * 2),
      height: Math.max(10, height - pad * 2),
    };
    if (numeric) {
      xMin = zoom ? zoom.min : xlo === Number.POSITIVE_INFINITY ? 0 : xlo;
      xMax = zoom ? zoom.max : xhi === Number.NEGATIVE_INFINITY || xhi === xMin ? xMin + 1 : xhi;
    }
    const along = horizontal ? plot.height : plot.width;
    band = banded ? along / Math.max(1, shown) : shown > 1 ? along / (shown - 1) : along;
    const start = horizontal ? plot.y : plot.x;
    toCat = (index) =>
      banded
        ? start + band * (index - first + 0.5)
        : shown > 1
          ? start + band * (index - first)
          : start + along / 2;
    toValue = horizontal
      ? (value) => scaleLinear(value, valueScale.min, valueScale.max, plot.x, plot.x + plot.width)
      : (value) => scaleLinear(value, valueScale.min, valueScale.max, plot.y + plot.height, plot.y);
  } else if (horizontal) {
    // Categories down the left, values along the bottom.
    const catWidth = Math.max(0, ...categoryLabels.map((label) => chartTextWidth(label.text)));
    const left = catWidth + 16 + yTitleSpace;
    const right = Math.max(8, Math.ceil(chartTextWidth(tickTexts.at(-1) ?? "") / 2));
    plot = {
      x: left,
      y: top,
      width: Math.max(10, width - left - right),
      height: Math.max(10, height - top - labelHeight),
    };
    band = plot.height / Math.max(1, count);
    toValue = (value) =>
      scaleLinear(value, valueScale.min, valueScale.max, plot.x, plot.x + plot.width);
    toCat = (index) => plot.y + band * (index + 0.5);
    for (let i = 0; i <= count; i++) {
      const y = fmt(plot.y + band * i);
      grid.push(
        node("line", {
          x1: fmt(plot.x),
          x2: fmt(plot.x + plot.width),
          y1: y,
          y2: y,
          "data-ok-chart-grid-line": "",
        }),
      );
    }
    valueScale.ticks.forEach((tick, i) => {
      axisX.push(
        tickNode(
          toValue(tick),
          plot.y + plot.height + gap,
          "middle",
          tickTexts[i] as string,
          timeline && format.timeTick(tick).major,
          "0.71em",
        ),
      );
    });
    const show = shownLabels(count, band, FONT, "index", (i) => i);
    categoryLabels.forEach((label, i) => {
      if (show(i)) axisY.push(tickNode(plot.x - 12, toCat(i), "end", label.text, label.major));
    });
  } else {
    const valueWidth = Math.max(...tickTexts.map((text) => chartTextWidth(text)));
    const left = valueWidth + 14 + yTitleSpace;
    let xTicks: number[] = [];
    let xDecimals = 0;
    let right = 8;
    if (numeric) {
      if (xlo === Number.POSITIVE_INFINITY) {
        xlo = 0;
        xhi = 1;
      }
      const xCount = Math.max(2, Math.round((width - left) / 90));
      const xScale = zoom
        ? niceScale(zoom.min, zoom.max, xCount, { min: zoom.min, max: zoom.max })
        : niceScale(xlo, xhi, xCount);
      xTicks = [...xScale.ticks];
      xDecimals = stepDecimals(xScale.step);
      right = Math.max(8, Math.ceil(chartTextWidth(format.axis(xScale.max, xDecimals).text) / 2));
      plot = {
        x: left,
        y: top,
        width: Math.max(10, width - left - right),
        height: Math.max(10, height - top - labelHeight),
      };
      xMin = xScale.min;
      xMax = xScale.max;
    } else {
      if (!banded && shown > 1) {
        right = Math.max(
          8,
          Math.ceil(chartTextWidth((categoryLabels[last] as DateLabel).text) / 2),
        );
      }
      plot = {
        x: left,
        y: top,
        width: Math.max(10, width - left - right),
        height: Math.max(10, height - top - labelHeight),
      };
    }
    band = banded
      ? plot.width / Math.max(1, shown)
      : shown > 1
        ? plot.width / (shown - 1)
        : plot.width;
    toValue = (value) =>
      scaleLinear(value, valueScale.min, valueScale.max, plot.y + plot.height, plot.y);
    toCat = (index) =>
      banded
        ? plot.x + band * (index - first + 0.5)
        : shown > 1
          ? plot.x + (plot.width * (index - first)) / (shown - 1)
          : plot.x + plot.width / 2;
    valueScale.ticks.forEach((tick, i) => {
      const y = fmt(toValue(tick));
      grid.push(
        node("line", {
          x1: fmt(plot.x),
          x2: fmt(plot.x + plot.width),
          y1: y,
          y2: y,
          "data-ok-chart-grid-line": "",
        }),
      );
      axisY.push(tickNode(plot.x - 14, toValue(tick), "end", tickTexts[i] as string));
    });
    const labelY = plot.y + plot.height + gap;
    if (numeric) {
      for (const tick of xTicks)
        axisX.push(
          tickNode(toX(tick), labelY, "middle", format.axis(tick, xDecimals).text, false, "0.71em"),
        );
    } else {
      const inWindow = categoryLabels.slice(first, last + 1);
      const widest = Math.max(0, ...inWindow.map((label) => chartTextWidth(label.text)));
      const unit = data.xType === "datetime" ? format.dateUnit : "index";
      const key = (i: number) =>
        data.xType === "datetime" ? unitIndex(data.categories[i] as number, format.dateUnit) : i;
      const show = shownLabels(count, band, widest, unit, key);
      inWindow.forEach((label, offset) => {
        const i = first + offset;
        if (show(i))
          axisX.push(tickNode(toCat(i), labelY, "middle", label.text, label.major, "0.71em"));
      });
    }
  }

  // Hoisted: numeric axes call it while laying out their ticks (after `plot` is set).
  function toX(x: number): number {
    return scaleLinear(x, xMin, xMax, plot.x, plot.x + plot.width);
  }
  for (let i = first; i <= last; i++) slots.push({ index: i, pos: r2(toCat(i)) });

  const base = toValue(Math.min(Math.max(0, valueScale.min), valueScale.max));
  const defs: ChartNode[] = [];
  const areas: ChartNode[] = [];
  const bars: ChartNode[] = [];
  const lines: ChartNode[] = [];
  const scatters: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const barSeries = visible.filter(({ series }) => series.type === "bar").map(({ index }) => index);
  const groupSize =
    (band *
      Math.min(100, Math.max(1, (horizontal ? options.barHeight : options.columnWidth) ?? 40))) /
    100;
  const markerSize = Math.max(0, options.markerSize ?? 0);
  const indexesOf = (types: readonly ChartType[]) =>
    visible.filter(({ series }) => types.includes(series.type)).map(({ index }) => index);
  const boxSeries = indexesOf(["boxPlot"]);
  const candleSeries = indexesOf(["candlestick"]);
  const rangeSeries = indexesOf(["rangeBar", "timeline"]);
  /** A rectangle across `[a, a + size]` between two value positions (either axis). */
  const span = (a: number, size: number, v0: number, v1: number, least = 0) => {
    const lo = Math.min(v0, v1);
    const length = Math.max(least, Math.abs(v1 - v0));
    return horizontal
      ? { x: fmt(lo), y: fmt(a), width: fmt(length), height: fmt(size) }
      : { x: fmt(a), y: fmt(lo), width: fmt(size), height: fmt(length) };
  };
  // Bubbles: the largest size gets a tenth of the plot's smaller side (at least 8px).
  let zMax = 0;
  for (const { series } of visible)
    if (series.type === "bubble")
      for (const point of series.points)
        if (point.y !== null && point.z !== undefined) zMax = Math.max(zMax, Math.abs(point.z));
  const bubbleMax = Math.max(8, Math.min(plot.width, plot.height) / 10);

  // Topmost / bottommost stacked bar per category: only stack ends are rounded.
  const ends = new Map<string, number>();
  if (stacked) {
    for (const index of barSeries) {
      for (const point of (data.series[index] as ChartDataSeries).points) {
        if (point.y === null || point.y === 0) continue;
        ends.set(`${point.y > 0 ? "+" : "-"}${point.x}`, index);
      }
    }
  }

  for (const { series, index } of visible) {
    const seriesAttrs = {
      "data-ok-chart-series": "",
      "data-ok-type": series.type,
      "data-ok-color": series.color,
      "data-ok-index": String(index),
    };
    // Zoomed charts draw the points in their window only.
    const points = zoom ? series.points.filter((point) => inView(point.x)) : series.points;
    const stackedValue = (point: { x: number; y: number }) =>
      stacked && !numeric
        ? (stack.get(`${index}:${point.x}`) as readonly [number, number])[1]
        : point.y;
    if (series.type === "bar" && !numeric) {
      const slot = barSeries.indexOf(index);
      const size = stacked ? groupSize : groupSize / Math.max(1, barSeries.length);
      const offset = stacked ? 0 : slot * size;
      const children: ChartNode[] = [];
      for (const point of points) {
        if (point.y === null) continue;
        const [from, to] = stacked
          ? (stack.get(`${index}:${point.x}`) as readonly [number, number])
          : [0, point.y];
        const a = toCat(point.x) - groupSize / 2 + offset;
        const start = toValue(from);
        const end = toValue(to);
        const rounded = !stacked || ends.get(`${point.y > 0 ? "+" : "-"}${point.x}`) === index;
        const color = point.color ?? series.color;
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: point.y,
          px: r2(horizontal ? end : a + size / 2),
          py: r2(horizontal ? a + size / 2 : end),
          color,
        });
        if (from === to) continue;
        if (options.dataLabels) {
          // Inside the bar, only where the value fits.
          const text = format.dataLabel(point.y, index, point.x, format.value(point.y, index));
          const length = Math.abs(end - start);
          const fits = horizontal
            ? length >= chartTextWidth(text) + 8 && size >= FONT + 2
            : length >= FONT + 6 && size >= chartTextWidth(text) + 4;
          if (fits) {
            const mid = (start + end) / 2;
            const across = a + size / 2;
            labels.push(
              dataLabel(horizontal ? mid : across, horizontal ? across : mid, text, "inside"),
            );
          }
        }
        children.push(
          node("path", {
            d: barPath(a, size, start, end, rounded ? 4 : 0, horizontal),
            "data-ok-chart-bar": "",
            ...(point.color ? { "data-ok-color": point.color } : {}),
          }),
        );
      }
      bars.push(node("g", seriesAttrs, children));
      continue;
    }
    const posOf = (x: number) => (numeric ? toX(x) : toCat(x));
    if (series.type === "boxPlot") {
      // Whiskers from the minimum to Q1 and Q3 to the maximum, two boxes split at the median.
      const slot = boxSeries.indexOf(index);
      const size = groupSize / Math.max(1, boxSeries.length);
      const upper = options.boxUpperColor ?? series.color;
      const lower = options.boxLowerColor ?? lighterTone(series.color);
      const children: ChartNode[] = [];
      for (const point of points) {
        if (!point.range) continue;
        const [min, q1, median, q3, max] = point.range.map(toValue) as [
          number,
          number,
          number,
          number,
          number,
        ];
        const a = posOf(point.x) - groupSize / 2 + slot * size;
        const c = a + size / 2;
        const cap = size / 4;
        // Horizontal box plots (phase 4): values along x, categories down the side.
        const at = (across: number, value: number): Pt =>
          horizontal ? [value, across] : [across, value];
        const [px, py] = at(c, max);
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: point.y as number,
          px: r2(px),
          py: r2(py),
          color: upper,
          range: point.range,
        });
        const whisker = (from: Pt, to: Pt) =>
          node("line", {
            x1: fmt(from[0]),
            y1: fmt(from[1]),
            x2: fmt(to[0]),
            y2: fmt(to[1]),
            "data-ok-chart-whisker": "",
          });
        children.push(
          whisker(at(c, max), at(c, q3)),
          whisker(at(c, q1), at(c, min)),
          whisker(at(c - cap, max), at(c + cap, max)),
          whisker(at(c - cap, min), at(c + cap, min)),
          node("rect", {
            ...span(a, size, q3, median),
            "data-ok-chart-box": "upper",
            "data-ok-color": upper,
          }),
          node("rect", {
            ...span(a, size, median, q1),
            "data-ok-chart-box": "lower",
            "data-ok-color": lower,
          }),
        );
      }
      bars.push(node("g", seriesAttrs, children));
      continue;
    }
    if (series.type === "candlestick") {
      // A wick from the high to the low, a body from the open to the close (phase 4).
      const slot = candleSeries.indexOf(index);
      const size = groupSize / Math.max(1, candleSeries.length);
      const children: ChartNode[] = [];
      for (const point of points) {
        if (!point.range) continue;
        const [open, high, low, close] = point.range as [number, number, number, number];
        const rising = close >= open;
        const color =
          point.color ??
          (rising ? (options.candleUpColor ?? "success") : (options.candleDownColor ?? "error"));
        const a = posOf(point.x) - groupSize / 2 + slot * size;
        const c = a + size / 2;
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: close,
          px: r2(c),
          py: r2(toValue(high)),
          color,
          range: point.range,
        });
        const top = Math.min(toValue(open), toValue(close));
        children.push(
          node("line", {
            x1: fmt(c),
            y1: fmt(toValue(high)),
            x2: fmt(c),
            y2: fmt(toValue(low)),
            "data-ok-chart-wick": "",
            "data-ok-color": color,
          }),
          node("rect", {
            x: fmt(a),
            y: fmt(top),
            width: fmt(size),
            // A candle that opens and closes alike (a doji) is still a line.
            height: fmt(Math.max(1, Math.abs(toValue(open) - toValue(close)))),
            "data-ok-chart-candle": rising ? "up" : "down",
            "data-ok-color": color,
          }),
        );
      }
      bars.push(node("g", seriesAttrs, children));
      continue;
    }
    if (series.type === "rangeBar" || series.type === "timeline") {
      // Bars from the start to the end value, rounded at both ends; timelines run left to right.
      const slot = rangeSeries.indexOf(index);
      const size = groupSize / Math.max(1, rangeSeries.length);
      const children: ChartNode[] = [];
      for (const point of points) {
        if (!point.range) continue;
        const [from, to] = point.range.map(toValue) as [number, number];
        const a = posOf(point.x) - groupSize / 2 + slot * size;
        const length = Math.abs(to - from);
        const end = horizontal ? Math.max(from, to) : Math.min(from, to);
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: point.range[1] as number,
          px: r2(horizontal ? end : a + size / 2),
          py: r2(horizontal ? a + size / 2 : end),
          color: point.color ?? series.color,
          range: point.range,
        });
        children.push(
          node("rect", {
            ...span(a, size, from, to, 1),
            rx: fmt(Math.min(4, size / 2, length / 2)),
            "data-ok-chart-bar": "",
            ...(point.color ? { "data-ok-color": point.color } : {}),
          }),
        );
        if (options.dataLabels) {
          const [s, e] = point.range as [number, number];
          const text = format.dataLabel(
            e - s,
            index,
            point.x,
            `${format.value(s, index)} – ${format.value(e, index)}`,
          );
          const fits = horizontal
            ? length >= chartTextWidth(text) + 8 && size >= FONT + 2
            : length >= FONT + 6 && size >= chartTextWidth(text) + 4;
          const mid = (from + to) / 2;
          const across = a + size / 2;
          if (fits)
            labels.push(
              dataLabel(horizontal ? mid : across, horizontal ? across : mid, text, "inside"),
            );
        }
      }
      bars.push(node("g", seriesAttrs, children));
      continue;
    }
    if (series.type === "rangeArea") {
      // A band between the low and high values, outlined at both edges; gaps break it.
      const segments: { high: Pt; low: Pt }[][] = [];
      let current: { high: Pt; low: Pt }[] = [];
      for (const point of [...points].sort((a, b) => a.x - b.x)) {
        if (!point.range) {
          if (current.length) segments.push(current);
          current = [];
          continue;
        }
        const x = posOf(point.x);
        const [low, high] = point.range as [number, number];
        current.push({ high: [x, toValue(high)], low: [x, toValue(low)] });
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: high,
          px: r2(x),
          py: r2(toValue(high)),
          color: series.color,
          range: point.range,
        });
      }
      if (current.length) segments.push(current);
      const curve = options.curve ?? "smooth";
      const children: ChartNode[] = [];
      for (const segment of segments) {
        const highs = segment.map((p) => p.high);
        const lows = segment.map((p) => p.low).reverse();
        children.push(
          node("path", {
            d: `${linePath(highs, curve)}L${linePath(lows, curve).slice(1)}Z`,
            "data-ok-chart-area": "",
          }),
        );
      }
      for (const segment of segments)
        for (const edge of ["high", "low"] as const)
          children.push(
            node("path", {
              d: linePath(
                segment.map((p) => p[edge]),
                curve,
              ),
              "data-ok-chart-line": "",
            }),
          );
      areas.push(node("g", seriesAttrs, children));
      continue;
    }
    if (series.type === "bubble") {
      // Radius by the square root of the size, so areas compare like the values.
      const children: ChartNode[] = [];
      for (const point of points) {
        if (point.y === null) continue;
        const px = posOf(point.x);
        const py = toValue(point.y);
        const r =
          zMax > 0 && point.z !== undefined
            ? Math.max(4, bubbleMax * Math.sqrt(Math.abs(point.z) / zMax))
            : 4;
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: point.y,
          px: r2(px),
          py: r2(py),
          color: point.color ?? series.color,
          r: r2(r),
          ...(point.z !== undefined ? { z: point.z } : {}),
        });
        children.push(
          node("circle", {
            cx: fmt(px),
            cy: fmt(py),
            r: fmt(r),
            "data-ok-chart-bubble": "",
            ...(point.color ? { "data-ok-color": point.color } : {}),
          }),
        );
      }
      scatters.push(node("g", seriesAttrs, children));
      continue;
    }
    const pts: { x: number; y: number }[] = points.filter(
      (p): p is { x: number; y: number } => p.y !== null,
    );
    const at = (point: { x: number; y: number }): Pt =>
      numeric ? [toX(point.x), toValue(point.y)] : [toCat(point.x), toValue(stackedValue(point))];
    for (const point of pts) {
      const [px, py] = at(point);
      marks.push({
        series: index,
        type: series.type,
        index: point.x,
        x: point.x,
        value: point.y,
        px: r2(px),
        py: r2(py),
        color: series.color,
      });
      if (options.dataLabels && series.type !== "scatter")
        labels.push(
          dataLabel(
            px,
            Math.max(FONT / 2, py - 12),
            format.dataLabel(point.y, index, point.x, format.value(point.y, index)),
            "outside",
          ),
        );
    }
    if (series.type === "scatter") {
      const radius = options.markerSize ?? 5;
      scatters.push(
        node(
          "g",
          seriesAttrs,
          points
            .filter((p) => p.y !== null)
            .map((p) => {
              const [px, py] = at(p as { x: number; y: number });
              return node("circle", {
                cx: fmt(px),
                cy: fmt(py),
                r: fmt(radius),
                "data-ok-chart-marker": "",
                ...(p.color ? { "data-ok-color": p.color } : {}),
              });
            }),
        ),
      );
      continue;
    }
    // Lines break at gaps (null values).
    const segments: Pt[][] = [];
    let current: Pt[] = [];
    const sorted = [...points].sort((a, b) => a.x - b.x);
    for (const point of sorted) {
      if (point.y === null) {
        if (current.length) segments.push(current);
        current = [];
      } else current.push(at(point as { x: number; y: number }));
    }
    if (current.length) segments.push(current);
    const curve = options.curve ?? "smooth";
    const children: ChartNode[] = [];
    if (series.type === "area") {
      const gradient = options.fill !== "solid";
      const id = `${options.idPrefix}-area-${index}`;
      if (gradient) {
        defs.push(
          node(
            "linearGradient",
            { id, x1: "0", y1: "0", x2: "0", y2: "1", "data-ok-color": series.color },
            [
              node("stop", { offset: "0", "stop-opacity": "0.4", "data-ok-chart-stop": "" }),
              node("stop", { offset: "1", "stop-opacity": "0", "data-ok-chart-stop": "" }),
            ],
          ),
        );
      }
      for (const segment of segments) {
        const first = segment[0] as Pt;
        const last = segment[segment.length - 1] as Pt;
        // Areas close on the zero line (or the axis edge when zero is out of range).
        const close = `L${fmt(last[0])},${fmt(base)}L${fmt(first[0])},${fmt(base)}Z`;
        children.push(
          node("path", {
            d: linePath(segment, curve) + close,
            "data-ok-chart-area": "",
            ...(gradient ? { fill: `url(#${id})` } : {}),
          }),
        );
      }
    }
    const dash = options.dashArray ? { "stroke-dasharray": fmt(options.dashArray) } : {};
    for (const segment of segments) {
      children.push(
        node("path", { d: linePath(segment, curve), "data-ok-chart-line": "", ...dash }),
      );
    }
    if (markerSize > 0) {
      for (const segment of segments) {
        for (const [px, py] of segment) {
          children.push(
            node("circle", {
              cx: fmt(px),
              cy: fmt(py),
              r: fmt(markerSize),
              "data-ok-chart-marker": "",
            }),
          );
        }
      }
    }
    (series.type === "area" ? areas : lines).push(node("g", seriesAttrs, children));
  }

  if (defs.length) nodes.push(node("defs", {}, defs));
  if (!sparkline) nodes.push(node("g", { "data-ok-chart-grid": "" }, grid));
  if (options.yTitle && !sparkline) {
    const x = FONT;
    const y = plot.y + plot.height / 2;
    nodes.push(
      node(
        "text",
        {
          x: fmt(x),
          y: fmt(y),
          dy: "0.35em",
          "text-anchor": "middle",
          transform: `rotate(-90 ${fmt(x)} ${fmt(y)})`,
          "data-ok-chart-axis-title": "",
        },
        undefined,
        options.yTitle,
      ),
    );
  }
  if (!sparkline) {
    nodes.push(node("g", { "data-ok-chart-axis": "x" }, axisX));
    nodes.push(node("g", { "data-ok-chart-axis": "y" }, axisY));
  }
  nodes.push(node("g", { "data-ok-chart-crosshair": "" }, []));
  nodes.push(
    node("g", { "data-ok-chart-series-group": "" }, [...areas, ...bars, ...lines, ...scatters]),
  );
  if (labels.length) nodes.push(node("g", { "data-ok-chart-data-labels": "" }, labels));
  nodes.push(node("g", { "data-ok-chart-active": "" }, []));

  return {
    width,
    height,
    plot: { x: r2(plot.x), y: r2(plot.y), width: r2(plot.width), height: r2(plot.height) },
    mode,
    horizontal,
    banded,
    band: r2(band),
    slots,
    marks,
    activeRadius:
      mode === "point"
        ? (options.markerSize ?? 5) + 2
        : visible.every(({ series }) => BANDED.includes(series.type))
          ? 0
          : Math.max(markerSize + 2, 5),
    nodes,
    ...(horizontal
      ? {}
      : {
          x: numeric
            ? { kind: "value", min: xMin, max: xMax, from: plot.x, to: plot.x + plot.width }
            : {
                kind: "index",
                min: first,
                max: Math.max(first, last),
                from: r2(toCat(first)),
                to: r2(toCat(Math.max(first, last))),
                ...(banded ? { band: r2(band) } : {}),
              },
          y: {
            kind: "value",
            min: valueScale.min,
            max: valueScale.max,
            from: r2(plot.y + plot.height),
            to: r2(plot.y),
          },
        }),
  };
}
