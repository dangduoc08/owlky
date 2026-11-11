import { type ChartLayout, type ChartNode, chartTextWidth, fmt, node } from "./chart-layout.js";
import type { ChartAnnotationHit } from "./chart-measure.js";
import { type ChartColor, type ChartData, chartColors, parseChartNumber } from "./chart-model.js";
import { toTimestamp } from "./chart-scale.js";
import { chartPxOf } from "./chart-zoom.js";

/*
 * Annotations (ADR-0031, phase 4): lines, bands and points with a label, drawn over vertical charts
 * with an x axis. React takes them as a prop; HTML authors list them in
 * `ul[data-ok-chart-annotations]` (one `li` each, its text the label). React renders the same
 * list: it is visually hidden once the chart is drawn and stays readable by assistive technologies.
 */

export type ChartAnnotationAxis = "x" | "y" | "point" | "text";
/** How a text annotation lines up with its position (ApexCharts `annotations.texts.textAnchor`). */
export const chartAnnotationAnchors = ["start", "middle", "end"] as const;
export type ChartAnnotationAnchor = (typeof chartAnnotationAnchors)[number];

export interface ChartAnnotation {
  /**
   * `x`: a vertical line (or band to `x2`); `y`: a horizontal line (or band to `y2`); `point`; `text`:
   * the label alone at (`x`, `y`, in data coordinates).
   */
  readonly axis: ChartAnnotationAxis;
  /** A category label, a date (date axes) or a number (numeric axes; category indexes too). */
  readonly x?: string | number | Date | undefined;
  readonly x2?: string | number | Date | undefined;
  readonly y?: number | undefined;
  readonly y2?: number | undefined;
  readonly label?: string | undefined;
  /** Palette color (default `info`). */
  readonly color?: ChartColor | undefined;
  /** Text annotations: how the label lines up with its position. Default `middle`. */
  readonly textAnchor?: ChartAnnotationAnchor | undefined;
  /** The annotation can be moved by a drag, or by the keyboard (4.18.20). */
  readonly draggable?: boolean | undefined;
}

const AXES: readonly ChartAnnotationAxis[] = ["x", "y", "point", "text"];
const isColor = (value: unknown): value is ChartColor => chartColors.includes(value as ChartColor);

const xText = (value: string | number | Date | undefined) =>
  value === undefined
    ? undefined
    : value instanceof Date
      ? Number.isFinite(value.getTime())
        ? value.toISOString()
        : undefined
      : String(value).slice(0, 100);

/** Keeps the valid annotations (unknown axes, colors and values are dropped). */
export function chartAnnotations(list: readonly ChartAnnotation[] | undefined): ChartAnnotation[] {
  return (list ?? []).flatMap((entry): ChartAnnotation[] => {
    if (!entry || !AXES.includes(entry.axis)) return [];
    const y = parseChartNumber(entry.y);
    const y2 = parseChartNumber(entry.y2);
    const x = xText(entry.x);
    const x2 = xText(entry.x2);
    if (entry.axis !== "y" && x === undefined) return [];
    if (entry.axis !== "x" && y === null) return [];
    if (entry.axis === "text" && !entry.label) return [];
    return [
      {
        axis: entry.axis,
        ...(x !== undefined && entry.axis !== "y" ? { x } : {}),
        ...(x2 !== undefined && entry.axis === "x" ? { x2 } : {}),
        ...(y !== null && entry.axis !== "x" ? { y } : {}),
        ...(y2 !== null && entry.axis === "y" ? { y2 } : {}),
        ...(entry.label ? { label: String(entry.label).slice(0, 200) } : {}),
        ...(isColor(entry.color) ? { color: entry.color } : {}),
        ...(entry.axis === "text" && chartAnnotationAnchors.includes(entry.textAnchor as "start")
          ? { textAnchor: entry.textAnchor }
          : {}),
        ...(entry.draggable === true ? { draggable: true } : {}),
      },
    ];
  });
}

/** The positions in `list` of the annotations `chartAnnotations` keeps (moves report these). */
export function chartAnnotationIndexes(list: readonly ChartAnnotation[] | undefined): number[] {
  return (list ?? []).flatMap((entry, index) => (chartAnnotations([entry]).length ? [index] : []));
}

/** The annotation list items React renders and HTML authors write (`li` attributes and text). */
export function chartAnnotationItems(
  list: readonly ChartAnnotation[],
): { attrs: Record<string, string>; text: string }[] {
  return chartAnnotations(list).map((entry) => ({
    attrs: {
      "data-ok-annotation": entry.axis,
      ...(entry.x !== undefined ? { "data-ok-x": String(entry.x) } : {}),
      ...(entry.x2 !== undefined ? { "data-ok-x2": String(entry.x2) } : {}),
      ...(entry.y !== undefined ? { "data-ok-y": String(entry.y) } : {}),
      ...(entry.y2 !== undefined ? { "data-ok-y2": String(entry.y2) } : {}),
      ...(entry.color ? { "data-ok-color": entry.color } : {}),
      ...(entry.textAnchor ? { "data-ok-text-anchor": entry.textAnchor } : {}),
      ...(entry.draggable ? { "data-ok-draggable": "" } : {}),
    },
    text: entry.label ?? "",
  }));
}

/** One annotation list item as written (not validated). */
export function readChartAnnotation(item: Element): ChartAnnotation {
  const attr = (name: string) => item.getAttribute(name) ?? undefined;
  return {
    axis: attr("data-ok-annotation") as ChartAnnotationAxis,
    x: attr("data-ok-x"),
    x2: attr("data-ok-x2"),
    y: attr("data-ok-y") as unknown as number,
    y2: attr("data-ok-y2") as unknown as number,
    label: item.textContent?.trim() || undefined,
    color: attr("data-ok-color") as ChartColor,
    textAnchor: attr("data-ok-text-anchor") as ChartAnnotationAnchor,
    draggable: item.hasAttribute("data-ok-draggable"),
  };
}

/** Reads the annotations of a `ul[data-ok-chart-annotations]` (HTML). */
export function readChartAnnotations(list: Element | null): ChartAnnotation[] {
  if (!list) return [];
  return chartAnnotations([...list.children].map(readChartAnnotation));
}

/** An x value's position on the axis: a category, a date between categories or a number. */
function xValue(data: ChartData, raw: string | number | Date): number | undefined {
  if (data.xType === "numeric") return parseChartNumber(raw) ?? undefined;
  if (data.xType === "category") {
    const found = data.categories.indexOf(String(raw));
    if (found >= 0) return found;
    const index = parseChartNumber(raw);
    return index === null ? undefined : index;
  }
  // Dates: interpolated between the two categories around them.
  const time = toTimestamp(raw);
  const times = data.categories as readonly number[];
  if (time === undefined || times.length === 0) return undefined;
  for (let i = 0; i < times.length - 1; i++) {
    const a = times[i] as number;
    const b = times[i + 1] as number;
    if (time >= a && time <= b) return b > a ? i + (time - a) / (b - a) : i;
  }
  return time < (times[0] as number) ? -1 : times.length;
}

/** Annotation shapes over the series (empty for charts without an x axis). */
export function chartAnnotationNodes(
  data: ChartData,
  layout: ChartLayout,
  list: readonly ChartAnnotation[],
  /** The annotation the keyboard picked up (4.18.20): drawn with `data-ok-picked`. */
  picked?: number,
): ChartNode[] {
  const { x: xMap, y: yMap, plot } = layout;
  if (!xMap || !yMap || list.length === 0) return [];
  const right = plot.x + plot.width;
  const bottom = plot.y + plot.height;
  const inX = (px: number) => px >= plot.x - 0.5 && px <= right + 0.5;
  const inY = (py: number) => py >= plot.y - 0.5 && py <= bottom + 0.5;
  const half = xMap.band ? xMap.band / 2 : 0;
  const pxOf = (raw: string | number | Date | undefined) => {
    if (raw === undefined) return undefined;
    const value = xValue(data, raw);
    return value === undefined ? undefined : chartPxOf(xMap, value);
  };
  const pyOf = (value: number) => chartPxOf(yMap, value);
  /** A label tag: a filled rounded box with the text, kept inside the SVG. */
  const tag = (x: number, y: number, text: string, anchor: "start" | "end" | "middle") => {
    const width = chartTextWidth(text) + 12;
    let left = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
    left = Math.max(0, Math.min(left, layout.width - width));
    const top = Math.max(0, Math.min(y, layout.height - 18));
    return [
      node("rect", {
        x: fmt(left),
        y: fmt(top),
        width: fmt(width),
        height: "18",
        rx: "4",
        "data-ok-chart-annotation-tag": "",
      }),
      node(
        "text",
        {
          x: fmt(left + width / 2),
          y: fmt(top + 9),
          dy: "0.35em",
          "text-anchor": "middle",
          "data-ok-chart-annotation-label": "",
        },
        undefined,
        text,
      ),
    ];
  };
  const groups: ChartNode[] = [];
  /** Draggable annotations say so (a grab cursor); the picked one is outlined. */
  const marks = (entry: ChartAnnotation, index: number) => ({
    ...(entry.draggable ? { "data-ok-draggable": "" } : {}),
    ...(picked === index ? { "data-ok-picked": "" } : {}),
  });
  for (const [index, entry] of list.entries()) {
    const children: ChartNode[] = [];
    if (entry.axis === "x") {
      const a = pxOf(entry.x);
      if (a === undefined) continue;
      const b = pxOf(entry.x2);
      if (b !== undefined) {
        const lo = Math.max(plot.x, Math.min(a, b) - half);
        const hi = Math.min(right, Math.max(a, b) + half);
        if (hi <= lo) continue;
        children.push(
          node("rect", {
            x: fmt(lo),
            y: fmt(plot.y),
            width: fmt(hi - lo),
            height: fmt(plot.height),
            "data-ok-chart-annotation-band": "",
          }),
        );
        if (entry.label) children.push(...tag(lo + 4, plot.y + 4, entry.label, "start"));
      } else {
        if (!inX(a)) continue;
        children.push(
          node("line", {
            x1: fmt(a),
            x2: fmt(a),
            y1: fmt(plot.y),
            y2: fmt(bottom),
            "data-ok-chart-annotation-line": "",
          }),
        );
        if (entry.label) {
          const width = chartTextWidth(entry.label) + 12;
          const room = a + 4 + width <= layout.width;
          children.push(
            ...tag(room ? a + 4 : a - 4, plot.y + 4, entry.label, room ? "start" : "end"),
          );
        }
      }
    } else if (entry.axis === "y") {
      const a = pyOf(entry.y as number);
      if (entry.y2 !== undefined) {
        const b = pyOf(entry.y2);
        const lo = Math.max(plot.y, Math.min(a, b));
        const hi = Math.min(bottom, Math.max(a, b));
        if (hi <= lo) continue;
        children.push(
          node("rect", {
            x: fmt(plot.x),
            y: fmt(lo),
            width: fmt(plot.width),
            height: fmt(hi - lo),
            "data-ok-chart-annotation-band": "",
          }),
        );
        if (entry.label) children.push(...tag(right - 4, lo + 4, entry.label, "end"));
      } else {
        if (!inY(a)) continue;
        children.push(
          node("line", {
            x1: fmt(plot.x),
            x2: fmt(right),
            y1: fmt(a),
            y2: fmt(a),
            "data-ok-chart-annotation-line": "",
          }),
        );
        if (entry.label) children.push(...tag(right - 4, a - 22, entry.label, "end"));
      }
    } else {
      const px = pxOf(entry.x);
      const py = pyOf(entry.y as number);
      if (px === undefined || !inX(px) || !inY(py)) continue;
      if (entry.axis === "text") {
        children.push(
          node(
            "text",
            {
              x: fmt(px),
              y: fmt(py),
              dy: "0.35em",
              "text-anchor": entry.textAnchor ?? "middle",
              "data-ok-chart-annotation-text": "",
            },
            undefined,
            entry.label,
          ),
        );
        groups.push(
          node(
            "g",
            {
              "data-ok-chart-annotation": "text",
              "data-ok-color": entry.color ?? "info",
              ...marks(entry, index),
            },
            children,
          ),
        );
        continue;
      }
      children.push(
        node("circle", {
          cx: fmt(px),
          cy: fmt(py),
          r: "5",
          "data-ok-chart-annotation-marker": "",
        }),
      );
      if (entry.label) children.push(...tag(px, py - 30, entry.label, "middle"));
    }
    groups.push(
      node(
        "g",
        {
          "data-ok-chart-annotation": entry.axis,
          "data-ok-color": entry.color ?? "info",
          ...marks(entry, index),
        },
        children,
      ),
    );
  }
  return groups.length ? [node("g", { "data-ok-chart-annotation-layer": "" }, groups)] : [];
}

/** Where the draggable annotations are drawn (4.18.20): lines by one coordinate, points by both. */
export function chartAnnotationHits(
  data: ChartData,
  layout: ChartLayout,
  list: readonly ChartAnnotation[],
): ChartAnnotationHit[] {
  const { x: xMap, y: yMap } = layout;
  if (!xMap || !yMap) return [];
  return list.flatMap((entry, index): ChartAnnotationHit[] => {
    if (!entry.draggable) return [];
    const at = entry.x === undefined ? undefined : xValue(data, entry.x);
    const px = at === undefined ? undefined : chartPxOf(xMap, at);
    const py = entry.y === undefined ? undefined : chartPxOf(yMap, entry.y);
    if (entry.axis === "x") return px === undefined ? [] : [{ index, axis: "x", px }];
    if (entry.axis === "y") return py === undefined ? [] : [{ index, axis: "y", py }];
    return px === undefined || py === undefined ? [] : [{ index, axis: entry.axis, px, py }];
  });
}
