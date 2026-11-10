import type { ChartFormat } from "./chart-format.js";
import {
  type ChartDirection,
  type ChartHierarchy,
  type ChartTreeAxis,
  type ChartZoomType,
  chartHierarchyPath,
  chartHierarchyRows,
  chartHierarchyTitle,
} from "./chart-hierarchy.js";
import {
  type ChartLayout,
  type ChartMark,
  type ChartNode,
  FONT,
  fmt,
  node,
  r2,
} from "./chart-layout.js";
import {
  actionOf,
  type ChartPartitionOptions,
  drillState,
  fits,
  labelOf,
  relatives,
  result,
  type Span,
  spanPaint,
  split,
  tone,
} from "./chart-partition.js";
import { fitChartText } from "./chart-sankey.js";

/*
 * Icicle charts (ADR-0058, ApexCharts v8 `icicle`): the sunburst's partition in bands, one per
 * level from the root's side. A drilled branch fills the width; `zoomType: "value"` keeps its
 * ancestors as full bands above it, `both` makes it the top level.
 */

export interface ChartIcicleOptions extends ChartPartitionOptions {
  /** Where the root sits (`radial` draws from the top). Default `"top"`. */
  readonly direction?: ChartDirection | undefined;
  /** A drilled branch keeps its ancestors as bands (`value`, the default) or becomes the top (`both`). */
  readonly zoomType?: ChartZoomType | undefined;
}

/** Lays out an icicle: one band per level from the root's side, cells sized by value. */
export function layoutIcicle(
  hierarchy: ChartHierarchy,
  options: ChartIcicleOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const { index: drill, state } = drillState(hierarchy, "icicle", options);
  const direction = options.direction === "radial" ? "top" : (options.direction ?? "top");
  const vertical = direction === "top" || direction === "bottom";
  const breadth = vertical ? width : height;
  const depthExtent = vertical ? height : width;
  const spans: Span[] = [];
  if (drill < 0) split(hierarchy, hierarchy.roots, 0, breadth, 0, spans);
  else {
    // `value` (default): the ancestors stay as full bands above the branch.
    const path = options.zoomType === "both" ? [drill] : chartHierarchyPath(hierarchy, drill);
    path.forEach((item, level) => {
      spans.push({ item, a0: 0, a1: breadth, level });
    });
    split(hierarchy, hierarchy.items[drill]?.children ?? [], 0, breadth, path.length, spans);
  }
  const levels = Math.max(0, ...spans.map((span) => span.level)) + 1;
  const band = depthExtent / levels;
  const extend = options.leaf === "extend";
  const family = relatives(hierarchy, spans);
  const axis: ChartTreeAxis =
    direction === "top"
      ? "down"
      : direction === "bottom"
        ? "up"
        : direction === "left"
          ? "right"
          : "left";
  const shapes: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const marks: ChartMark[] = [];
  spans.forEach((span, i) => {
    const entry = hierarchy.items[span.item] as ChartHierarchy["items"][number];
    const d0 = span.level * band;
    const d1 = extend && entry.children.length === 0 ? depthExtent : d0 + band;
    const [x, y, w, h] = vertical
      ? [span.a0, direction === "top" ? d0 : height - d1, span.a1 - span.a0, d1 - d0]
      : [direction === "left" ? d0 : width - d1, span.a0, d1 - d0, span.a1 - span.a0];
    const { opacity, spacing } = spanPaint(hierarchy, span, options);
    shapes.push(
      node("rect", {
        x: fmt(x),
        y: fmt(y),
        width: fmt(w),
        height: fmt(h),
        rx: "2",
        "fill-opacity": String(opacity),
        "stroke-width": spacing,
        "data-ok-chart-icicle-cell": "",
        "data-ok-color": entry.color,
      }),
    );
    // Labels: centered in cells at least 30px wide and a line tall.
    const text = labelOf(hierarchy, span.item, format, options.dataLabels);
    const room = w - 8;
    if (w >= 30 && h >= FONT + 6 && fits(room, text))
      labels.push(
        node(
          "text",
          {
            x: fmt(x + w / 2),
            y: fmt(y + h / 2),
            dy: "0.35em",
            "text-anchor": "middle",
            "data-ok-chart-partition-label": tone(opacity),
          },
          undefined,
          fitChartText(text, room),
        ),
      );
    const relation = family[i] as (typeof family)[number];
    marks.push({
      series: 0,
      type: "icicle",
      index: span.item,
      x: span.item,
      value: entry.value,
      px: r2(x + w / 2),
      py: r2(y + h / 2),
      color: entry.color,
      tree: {
        id: entry.id,
        depth: span.level,
        parent: relation.parent,
        children: relation.children,
        cross: r2(span.a0),
        axis,
        hit: { kind: "rect", x: r2(x), y: r2(y), width: r2(w), height: r2(h) },
        outline: node("rect", {
          x: fmt(x + 1),
          y: fmt(y + 1),
          width: fmt(Math.max(0, w - 2)),
          height: fmt(Math.max(0, h - 2)),
          rx: "2",
          "data-ok-chart-active-node": "",
        }),
        action: actionOf(hierarchy, span, drill, options),
        path: chartHierarchyPath(hierarchy, span.item).map((at) => hierarchy.items[at]?.name ?? ""),
        title: chartHierarchyTitle(hierarchy, span.item),
        rows: chartHierarchyRows(hierarchy, span.item, format),
      },
    });
  });
  return result(width, height, "icicle", marks, shapes, labels, state);
}
