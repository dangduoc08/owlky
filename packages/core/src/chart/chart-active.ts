import type { ChartFormat } from "./chart-format.js";
import type { ChartLayout, ChartNode } from "./chart-layout.js";
import type { ChartColor, ChartData } from "./chart-model.js";

/*
 * Chart interaction (ADR-0024): which category or point is active for a pointer position or a
 * key, the hover nodes and the tooltip content. Owns no state: React keeps the active item in
 * state, the HTML runtime in its instance.
 */

/** The active category (index charts) or point (scatter: `mark` is its index in `layout.marks`). */
export type ChartActive =
  | { readonly kind: "index"; readonly index: number }
  | { readonly kind: "mark"; readonly mark: number };

/** Whether two active items are the same category or point. */
export function sameChartActive(a: ChartActive | null, b: ChartActive | null): boolean {
  if (a === null || b === null) return a === b;
  return a.kind === "index"
    ? b.kind === "index" && a.index === b.index
    : b.kind === "mark" && a.mark === b.mark;
}

/** Pointer position in SVG px → the active item, or `null` outside the plot. */
export function chartActiveAt(layout: ChartLayout, x: number, y: number): ChartActive | null {
  const { plot } = layout;
  const slack = 8;
  if (
    x < plot.x - slack ||
    x > plot.x + plot.width + slack ||
    y < plot.y - slack ||
    y > plot.y + plot.height + slack
  ) {
    return null;
  }
  if (layout.mode === "point") {
    let best = -1;
    let distance = 24 * 24;
    layout.marks.forEach((mark, index) => {
      const d = (mark.px - x) ** 2 + (mark.py - y) ** 2;
      if (d <= distance) {
        distance = d;
        best = index;
      }
    });
    return best < 0 ? null : { kind: "mark", mark: best };
  }
  if (layout.slots.length === 0) return null;
  const along = layout.horizontal ? y : x;
  let best = layout.slots[0] as (typeof layout.slots)[number];
  for (const slot of layout.slots)
    if (Math.abs(slot.pos - along) < Math.abs(best.pos - along)) best = slot;
  return { kind: "index", index: best.index };
}

/** Marks in reading order (left to right, then top to bottom) for keyboard navigation. */
const order = (layout: ChartLayout) =>
  layout.marks
    .map((mark, index) => ({ mark, index }))
    .sort((a, b) => a.mark.px - b.mark.px || a.mark.py - b.mark.py);

/** The item a key moves to (arrows, Home, End); `undefined` when the key isn't a chart key. */
export function nextChartActive(
  layout: ChartLayout,
  active: ChartActive | null,
  key: string,
): ChartActive | null | undefined {
  const forward = key === "ArrowRight" || key === "ArrowDown";
  const backward = key === "ArrowLeft" || key === "ArrowUp";
  if (!forward && !backward && key !== "Home" && key !== "End") return undefined;
  if (layout.mode === "point") {
    const sorted = order(layout);
    if (sorted.length === 0) return null;
    const at =
      active?.kind === "mark" ? sorted.findIndex((entry) => entry.index === active.mark) : -1;
    const next =
      key === "Home"
        ? 0
        : key === "End"
          ? sorted.length - 1
          : at < 0
            ? 0
            : Math.min(sorted.length - 1, Math.max(0, at + (forward ? 1 : -1)));
    return { kind: "mark", mark: (sorted[next] as (typeof sorted)[number]).index };
  }
  const count = layout.slots.length;
  if (count === 0) return null;
  const at = active?.kind === "index" ? active.index : -1;
  const next =
    key === "Home"
      ? 0
      : key === "End"
        ? count - 1
        : at < 0
          ? 0
          : Math.min(count - 1, Math.max(0, at + (forward ? 1 : -1)));
  return { kind: "index", index: next };
}

const circle = (cx: number, cy: number, r: number, color: ChartColor): ChartNode => ({
  tag: "circle",
  attrs: {
    cx: String(cx),
    cy: String(cy),
    r: String(r),
    "data-ok-chart-active-marker": "",
    "data-ok-color": color,
  },
});

/**
 * Hover nodes: `under` goes into the crosshair group (behind the series: the category band or a
 * dashed line), `over` into the active group (bigger markers).
 */
export function chartActiveNodes(
  layout: ChartLayout,
  active: ChartActive | null,
): { under: ChartNode[]; over: ChartNode[] } {
  if (!active) return { under: [], over: [] };
  const { plot } = layout;
  if (active.kind === "mark") {
    const mark = layout.marks[active.mark];
    return mark
      ? { under: [], over: [circle(mark.px, mark.py, layout.activeRadius, mark.color)] }
      : { under: [], over: [] };
  }
  const slot = layout.slots[active.index];
  if (!slot) return { under: [], over: [] };
  const under: ChartNode[] = [];
  if (layout.banded) {
    const half = layout.band / 2;
    under.push({
      tag: "rect",
      attrs: layout.horizontal
        ? {
            x: String(plot.x),
            y: String(Math.round((slot.pos - half) * 100) / 100),
            width: String(plot.width),
            height: String(layout.band),
            "data-ok-chart-band": "",
          }
        : {
            x: String(Math.round((slot.pos - half) * 100) / 100),
            y: String(plot.y),
            width: String(layout.band),
            height: String(plot.height),
            "data-ok-chart-band": "",
          },
    });
  } else {
    under.push({
      tag: "line",
      attrs: {
        x1: String(slot.pos),
        x2: String(slot.pos),
        y1: String(plot.y),
        y2: String(plot.y + plot.height),
        "data-ok-chart-crosshair-line": "",
      },
    });
  }
  const over =
    layout.activeRadius > 0
      ? layout.marks
          .filter((mark) => mark.index === active.index && mark.type !== "bar")
          .map((mark) => circle(mark.px, mark.py, layout.activeRadius, mark.color))
      : [];
  return { under, over };
}

export interface ChartTooltipRow {
  readonly name: string;
  readonly value: string;
  readonly color: ChartColor;
}

export interface ChartTooltip {
  readonly title: string;
  readonly rows: readonly ChartTooltipRow[];
  /** Where the tooltip points, in SVG px. */
  readonly x: number;
  readonly y: number;
}

/** Tooltip content for the active item. */
export function chartTooltip(
  data: ChartData,
  layout: ChartLayout,
  format: ChartFormat,
  active: ChartActive | null,
): ChartTooltip | null {
  if (!active) return null;
  if (active.kind === "mark") {
    const mark = layout.marks[active.mark];
    const series = mark && data.series[mark.series];
    if (!mark || !series) return null;
    return {
      title: format.title(mark.x),
      rows: [
        { name: series.name, value: format.value(mark.value, mark.series), color: mark.color },
      ],
      x: mark.px,
      y: mark.py,
    };
  }
  const slot = layout.slots[active.index];
  if (!slot) return null;
  const marks = layout.marks.filter((mark) => mark.index === active.index);
  const rows = marks.map((mark) => ({
    name: (data.series[mark.series] as (typeof data.series)[number]).name,
    value: format.value(mark.value, mark.series),
    color: (data.series[mark.series] as (typeof data.series)[number]).color,
  }));
  const x =
    data.xType === "datetime"
      ? (data.categories[active.index] as number)
      : (data.categories[active.index] ?? String(active.index + 1));
  const reach = marks.length
    ? layout.horizontal
      ? Math.max(...marks.map((m) => m.px))
      : Math.min(...marks.map((m) => m.py))
    : 0;
  return {
    title: format.title(x),
    rows,
    x: layout.horizontal ? reach : slot.pos,
    y: layout.horizontal ? slot.pos : marks.length ? reach : layout.plot.y,
  };
}

/**
 * Tooltip position inside the plot box: beside the anchor (right, or left when there's no
 * room), vertically centered on it, kept inside `[0, width] × [0, height]`.
 */
export function placeChartTooltip(
  anchor: { x: number; y: number },
  size: { width: number; height: number },
  box: { width: number; height: number },
): { left: number; top: number } {
  const gap = 16;
  let left = anchor.x + gap;
  if (left + size.width > box.width) left = anchor.x - gap - size.width;
  left = Math.max(0, Math.min(left, box.width - size.width));
  const top = Math.max(0, Math.min(anchor.y - size.height / 2, box.height - size.height));
  return { left: Math.round(left), top: Math.round(top) };
}
