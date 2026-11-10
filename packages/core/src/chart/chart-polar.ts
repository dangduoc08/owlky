import { chartPatternDefs } from "./chart-cues.js";
import type { ChartFormat } from "./chart-format.js";
import {
  type ChartArc,
  type ChartLayout,
  type ChartLayoutOptions,
  type ChartMark,
  type ChartNode,
  type ChartSlot,
  chartTextWidth,
  dataLabel,
  FONT,
  fmt,
  node,
  r2,
} from "./chart-layout.js";
import { type ChartColor, type ChartData, lighterTone } from "./chart-model.js";

export { lighterTone };

import { niceScale, scaleLinear, stepDecimals } from "./chart-scale.js";

/*
 * Polar layouts (ADR-0024, phase 2): pie, donut, radial bar (gauges) and radar. Same contract as
 * `layoutChart`: data + size → SVG nodes and the positions of every drawn value. Angles are in
 * degrees, clockwise from 12 o'clock.
 */

type Pt = readonly [number, number];

/** The point at `angle` on a circle. */
export const polarPoint = (cx: number, cy: number, r: number, angle: number): Pt => {
  const rad = (angle * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
};

const at = (p: Pt) => `${fmt(p[0])},${fmt(p[1])}`;

/**
 * An arc command between `a0` and `a1` (`a1` > `a0`) from the current point: clockwise to `a1`,
 * or `reverse` counterclockwise to `a0`.
 */
function arc(cx: number, cy: number, r: number, a0: number, a1: number, reverse = false): string {
  const to = polarPoint(cx, cy, r, reverse ? a0 : a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `A${fmt(r)},${fmt(r)} 0 ${large} ${reverse ? 0 : 1} ${at(to)}`;
}

/**
 * A pie slice (`inner` 0) or a donut segment between `a0` and `a1`. A full turn is drawn as two
 * half circles (an SVG arc can't start and end at the same point).
 */
export function slicePath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  a0: number,
  a1: number,
): string {
  if (a1 - a0 >= 359.99) {
    const disc = `M${at(polarPoint(cx, cy, outer, 0))}${arc(cx, cy, outer, 0, 180)}${arc(cx, cy, outer, 180, 360)}Z`;
    return inner > 0 ? `${disc}${holeRing(cx, cy, inner)}` : disc;
  }
  const start = `M${at(polarPoint(cx, cy, outer, a0))}${arc(cx, cy, outer, a0, a1)}`;
  if (inner <= 0) return `${start}L${at([cx, cy])}Z`;
  return `${start}L${at(polarPoint(cx, cy, inner, a1))}${arc(cx, cy, inner, a0, a1, true)}Z`;
}

/** A counterclockwise circle: cuts a hole into a clockwise one (nonzero fill rule). */
const holeRing = (cx: number, cy: number, r: number) =>
  `M${at(polarPoint(cx, cy, r, 0))}${arc(cx, cy, r, 180, 360, true)}${arc(cx, cy, r, 0, 180, true)}Z`;

/** An open arc (radial bars and their tracks: drawn with a stroke). */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const start = `M${at(polarPoint(cx, cy, r, a0))}`;
  if (a1 - a0 >= 359.99) {
    const mid = a0 + 180;
    return `${start}${arc(cx, cy, r, a0, mid)}${arc(cx, cy, r, mid, a0 + 359.99)}`;
  }
  return `${start}${arc(cx, cy, r, a0, a1)}`;
}

/** Start and end angles: `end` after `start`, at most one turn. */
function angles(options: ChartLayoutOptions): readonly [number, number] {
  const start = options.startAngle ?? 0;
  const end = options.endAngle ?? 360;
  const span = Math.min(360, Math.max(0, end - start));
  return [start, start + span];
}

const centerText = (
  x: number,
  y: number,
  text: string,
  part: "data-ok-chart-center-label" | "data-ok-chart-center-value",
): ChartNode =>
  node(
    "text",
    { x: fmt(x), y: fmt(y), dy: "0.35em", "text-anchor": "middle", [part]: "" },
    undefined,
    text,
  );

/** Shared shape of a polar layout result. */
function result(
  width: number,
  height: number,
  rest: Pick<ChartLayout, "mode" | "slots" | "marks" | "nodes" | "activeRadius"> &
    Partial<Pick<ChartLayout, "polar">>,
): ChartLayout {
  return {
    width,
    height,
    plot: { x: 0, y: 0, width, height },
    horizontal: false,
    banded: false,
    band: 0,
    ...rest,
  };
}

const groups = (series: ChartNode[], labels: ChartNode[], extra: ChartNode[] = []) => [
  ...extra,
  node("g", { "data-ok-chart-crosshair": "" }, []),
  node("g", { "data-ok-chart-series-group": "" }, series),
  ...(labels.length ? [node("g", { "data-ok-chart-data-labels": "" }, labels)] : []),
  node("g", { "data-ok-chart-active": "" }, []),
];

/** Pie, donut and radial bar: the first series' values, one slice or ring per category. */
export function layoutCircular(
  data: ChartData,
  options: ChartLayoutOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const hidden = new Set(options.hidden ?? []);
  const series = data.series[0];
  const cx = width / 2;
  const cy = height / 2;
  const outer = Math.max(4, Math.min(width, height) / 2 - 4);
  const [a0, a1] = angles(options);
  const marks: ChartMark[] = [];
  const slots: ChartSlot[] = [];
  const shapes: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const defs: ChartNode[] = [];
  const center: ChartNode[] = [];
  // Polar areas: value rings and their ticks.
  const grid: ChartNode[] = [];
  const ticks: ChartNode[] = [];
  const points = (series?.points ?? []).filter(
    (point): point is typeof point & { y: number } =>
      !hidden.has(point.x) && point.y !== null && point.y >= 0,
  );
  // `chartData` colors every point of a circular chart.
  const color = (point: { color?: ChartColor | undefined }) => point.color as ChartColor;
  // Pattern fills per slice (4.18.62): one definition per pattern and color.
  const patterns = chartPatternDefs(options.idPrefix);
  const patternOf = (point: { x: number; color?: ChartColor | undefined }) => {
    const pattern = options.slicePatterns?.[point.x];
    return pattern
      ? { cue: { pattern }, fill: { fill: patterns.fill(pattern, color(point)) } }
      : { cue: {}, fill: {} };
  };

  if (data.type === "radialBar") {
    const n = points.length;
    const full = options.yMax !== undefined && options.yMax > 0 ? options.yMax : 100;
    // Ring thickness and gap from the radius: one ring is a gauge, more get thinner.
    const thickness = Math.min(outer * 0.19, (outer * 0.47) / Math.max(1, n + (n - 1) * 0.66));
    const gap = thickness * 0.66;
    const track = (thickness * Math.min(100, Math.max(0, options.trackWidth ?? 50))) / 100;
    const gradient = options.fill !== "solid";
    points.forEach((point, ring) => {
      const r = outer - thickness / 2 - ring * (thickness + gap);
      const tone = color(point);
      const end = a0 + (a1 - a0) * Math.min(1, Math.max(0, point.y / full));
      const tip = polarPoint(cx, cy, r, end);
      marks.push({
        series: 0,
        type: "radialBar",
        index: point.x,
        x: point.x,
        value: point.y,
        px: r2(tip[0]),
        py: r2(tip[1]),
        color: tone,
        arc: {
          cx: r2(cx),
          cy: r2(cy),
          start: a0,
          end: a1,
          inner: r2(r - thickness / 2),
          outer: r2(r + thickness / 2),
        },
      });
      slots.push({ index: point.x, pos: point.x });
      const id = `${options.idPrefix}-radial-${point.x}`;
      if (gradient)
        defs.push(
          node("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" }, [
            node("stop", {
              offset: "0",
              "stop-opacity": "1",
              "data-ok-chart-stop": "",
              "data-ok-color": lighterTone(tone),
            }),
            node("stop", {
              offset: "1",
              "stop-opacity": "1",
              "data-ok-chart-stop": "",
              "data-ok-color": tone,
            }),
          ]),
        );
      const children = [
        node("path", {
          d: arcPath(cx, cy, r, a0, a1),
          "stroke-width": fmt(track),
          "data-ok-chart-track": "",
        }),
      ];
      if (end > a0)
        children.push(
          node("path", {
            d: arcPath(cx, cy, r, a0, end),
            "stroke-width": fmt(thickness),
            "data-ok-chart-radial": "",
            "data-ok-color": tone,
            ...(gradient ? { stroke: `url(#${id})` } : {}),
            ...(options.dashArray ? { "stroke-dasharray": fmt(options.dashArray) } : {}),
          }),
        );
      shapes.push(...children);
    });
    // Center: one ring shows its value and name; several show the total when it has a label.
    if (n === 1) {
      const only = points[0] as (typeof points)[number];
      center.push(
        centerText(cx, cy - 8, format.value(only.y, 0), "data-ok-chart-center-value"),
        centerText(
          cx,
          cy + 20,
          format.title(data.categories[only.x] ?? String(only.x + 1)),
          "data-ok-chart-center-label",
        ),
      );
    } else if (n > 1 && options.totalLabel) {
      const average = points.reduce((sum, point) => sum + point.y, 0) / n;
      center.push(...totalTexts(cx, cy, options, format, average));
    }
  } else if (data.type === "polarArea") {
    // Polar area (phase 4): equal angles, the radius grows with the value on rings of a nice scale.
    const max = Math.max(0, ...points.map((point) => point.y));
    const scale = niceScale(
      0,
      max > 0 ? max : 1,
      Math.max(2, Math.min(6, Math.round(outer / 30))),
      {
        min: 0,
        max: options.yMax,
      },
    );
    const decimals = stepDecimals(scale.step);
    const radius = (value: number) =>
      Math.max(0, Math.min(outer, scaleLinear(value, 0, scale.max, 0, outer)));
    const sweep = points.length ? (a1 - a0) / points.length : 0;
    for (const tick of scale.ticks) {
      const rr = radius(tick);
      if (rr <= 0) continue;
      grid.push(node("path", { d: holeRing(cx, cy, rr), "data-ok-chart-web": "" }));
      ticks.push(
        node(
          "text",
          {
            x: fmt(cx + 4),
            y: fmt(cy - rr),
            dy: "0.71em",
            "text-anchor": "start",
            "data-ok-chart-tick": "",
          },
          undefined,
          format.tick(tick, decimals),
        ),
      );
    }
    points.forEach((point, i) => {
      const start = a0 + sweep * i;
      const r = radius(point.y);
      const mid = start + sweep / 2;
      const [px, py] = polarPoint(cx, cy, Math.max(r * 0.6, 0), mid);
      marks.push({
        series: 0,
        type: "polarArea",
        index: point.x,
        x: point.x,
        value: point.y,
        px: r2(px),
        py: r2(py),
        color: color(point),
        arc: {
          cx: r2(cx),
          cy: r2(cy),
          start: r2(start),
          end: r2(start + sweep),
          inner: 0,
          outer: r2(r),
        },
        ...patternOf(point).cue,
      });
      slots.push({ index: point.x, pos: point.x });
      if (r > 0)
        shapes.push(
          node("path", {
            d: slicePath(cx, cy, 0, r, start, start + sweep),
            "data-ok-chart-slice": "",
            "data-ok-color": color(point),
            ...patternOf(point).fill,
          }),
        );
      if (options.dataLabels && r >= FONT * 2 && sweep >= 12)
        labels.push(
          dataLabel(
            px,
            py,
            format.dataLabel(point.y, 0, point.x, format.value(point.y, 0)),
            "inside",
          ),
        );
    });
  } else {
    const donut = data.type === "donut";
    const hole = Math.min(95, Math.max(10, options.donutSize ?? 72));
    const inner = donut ? (outer * hole) / 100 : 0;
    const total = points.reduce((sum, point) => sum + point.y, 0);
    const percent = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    let angle = a0;
    for (const point of points) {
      if (point.y === 0 || total === 0 || a1 <= a0) continue;
      const sweep = ((a1 - a0) * point.y) / total;
      const mid = angle + sweep / 2;
      const [px, py] = polarPoint(cx, cy, donut ? (inner + outer) / 2 : outer * 0.75, mid);
      const sliceArc: ChartArc = {
        cx: r2(cx),
        cy: r2(cy),
        start: r2(angle),
        end: r2(angle + sweep),
        inner: r2(inner),
        outer: r2(outer),
      };
      marks.push({
        series: 0,
        type: data.type,
        index: point.x,
        x: point.x,
        value: point.y,
        px: r2(px),
        py: r2(py),
        color: color(point),
        arc: sliceArc,
        ...patternOf(point).cue,
      });
      slots.push({ index: point.x, pos: point.x });
      shapes.push(
        node("path", {
          d: slicePath(cx, cy, inner, outer, angle, angle + sweep),
          "data-ok-chart-slice": "",
          "data-ok-color": color(point),
          ...patternOf(point).fill,
        }),
      );
      // Percentages on slices wide enough for them.
      if (options.dataLabels && sweep >= 12) {
        const share = (point.y / total) * 100;
        const text = format.dataLabel(share, 0, point.x, `${percent.format(share)}%`);
        labels.push(dataLabel(px, py, text, "inside"));
      }
      angle += sweep;
    }
    if (donut && options.totalLabel) center.push(...totalTexts(cx, cy, options, format, total));
  }

  const nodes: ChartNode[] = [];
  defs.push(...patterns.nodes());
  if (defs.length) nodes.push(node("defs", {}, defs));
  if (grid.length) nodes.push(node("g", { "data-ok-chart-grid": "" }, grid));
  nodes.push(
    ...groups(
      [
        node(
          "g",
          {
            "data-ok-chart-series": "",
            "data-ok-type": data.type,
            "data-ok-color": series?.color ?? "primary",
            "data-ok-index": "0",
            ...(data.type === "radialBar" && options.dashArray ? { "data-ok-dashed": "" } : {}),
          },
          shapes,
        ),
      ],
      labels,
    ),
  );
  if (center.length) nodes.push(node("g", { "data-ok-chart-center": "" }, center));
  if (ticks.length) nodes.push(node("g", { "data-ok-chart-axis": "y" }, ticks));
  return result(width, height, { mode: "slice", slots, marks, nodes, activeRadius: 0 });
}

/** The total's label and value in the center (an explicit `total` is printed as a number). */
function totalTexts(
  cx: number,
  cy: number,
  options: ChartLayoutOptions,
  format: ChartFormat,
  fallback: number,
): ChartNode[] {
  const value =
    options.total !== undefined ? format.number(options.total) : format.value(fallback, 0);
  return [
    centerText(cx, cy - 14, options.totalLabel as string, "data-ok-chart-center-label"),
    centerText(cx, cy + 14, value, "data-ok-chart-center-value"),
  ];
}

/** Radar: one axis per category around the center, one closed shape per series. */
export function layoutRadar(
  data: ChartData,
  options: ChartLayoutOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const hidden = new Set(options.hidden ?? []);
  const visible = data.series
    .map((series, index) => ({ series, index }))
    .filter(({ index }) => !hidden.has(index));
  const count = Math.max(data.categories.length, ...data.series.map((s) => s.points.length), 0);
  const labelsText = Array.from(
    { length: count },
    (_, i) => format.axis(data.categories[i] ?? String(i + 1)).text,
  );
  const widest = Math.max(0, ...labelsText.map((text) => chartTextWidth(text)));
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.max(10, Math.min(width / 2 - widest - 16, height / 2 - FONT - 18));
  let lo = 0;
  let hi = Number.NEGATIVE_INFINITY;
  for (const { series } of visible)
    for (const point of series.points)
      if (point.y !== null) {
        lo = Math.min(lo, point.y);
        hi = Math.max(hi, point.y);
      }
  if (hi === Number.NEGATIVE_INFINITY) hi = 1;
  const scale = niceScale(lo, hi, Math.max(2, Math.min(6, Math.round(r / 20))), {
    min: options.yMin,
    max: options.yMax,
  });
  const decimals = stepDecimals(scale.step);
  const radius = (value: number) =>
    Math.max(0, Math.min(r, scaleLinear(value, scale.min, scale.max, 0, r)));
  const angleOf = (i: number) => (360 * i) / Math.max(1, count);

  const grid: ChartNode[] = [];
  const axisX: ChartNode[] = [];
  const axisY: ChartNode[] = [];
  for (const tick of scale.ticks) {
    const rr = radius(tick);
    if (rr > 0 && count > 0) {
      const ring = Array.from({ length: count }, (_, i) => at(polarPoint(cx, cy, rr, angleOf(i))));
      grid.push(node("path", { d: `M${ring.join("L")}Z`, "data-ok-chart-web": "" }));
    }
    axisY.push(
      node(
        "text",
        {
          x: fmt(cx + 6),
          y: fmt(cy - rr),
          dy: "0.35em",
          "text-anchor": "start",
          "data-ok-chart-tick": "",
        },
        undefined,
        format.tick(tick, decimals),
      ),
    );
  }
  const slots: ChartSlot[] = [];
  for (let i = 0; i < count; i++) {
    const angle = angleOf(i);
    const [x, y] = polarPoint(cx, cy, r, angle);
    grid.push(
      node("line", {
        x1: fmt(cx),
        y1: fmt(cy),
        x2: fmt(x),
        y2: fmt(y),
        "data-ok-chart-web": "",
      }),
    );
    const sin = Math.sin((angle * Math.PI) / 180);
    const cos = Math.cos((angle * Math.PI) / 180);
    const [lx, ly] = polarPoint(cx, cy, r + (Math.abs(sin) < 0.1 ? 14 : 10), angle);
    axisX.push(
      node(
        "text",
        {
          x: fmt(lx),
          y: fmt(ly),
          dy: cos > 0.1 ? "0" : cos < -0.1 ? "0.71em" : "0.35em",
          "text-anchor": Math.abs(sin) < 0.1 ? "middle" : sin > 0 ? "start" : "end",
          "data-ok-chart-tick": "",
        },
        undefined,
        labelsText[i] as string,
      ),
    );
    slots.push({ index: i, pos: r2(angle) });
  }

  const marks: ChartMark[] = [];
  const shapes: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const markerSize = Math.max(0, options.markerSize ?? 0);
  for (const { series, index } of visible) {
    const pts = series.points
      .filter((point) => point.x < count)
      .map((point) => {
        const p = polarPoint(cx, cy, radius(point.y ?? scale.min), angleOf(point.x));
        if (point.y !== null) {
          marks.push({
            series: index,
            type: "radar",
            index: point.x,
            x: point.x,
            value: point.y,
            px: r2(p[0]),
            py: r2(p[1]),
            color: series.color,
          });
          if (options.dataLabels)
            labels.push(
              dataLabel(
                p[0],
                p[1] - 12,
                format.dataLabel(point.y, index, point.x, format.value(point.y, index)),
                "outside",
              ),
            );
        }
        return p;
      });
    const d = pts.length ? `M${pts.map(at).join("L")}Z` : "";
    const children: ChartNode[] = [
      node("path", { d, "data-ok-chart-area": "" }),
      node("path", {
        d,
        "data-ok-chart-line": "",
        ...(options.dashArray ? { "stroke-dasharray": fmt(options.dashArray) } : {}),
      }),
    ];
    if (markerSize > 0)
      for (const p of pts)
        children.push(
          node("circle", {
            cx: fmt(p[0]),
            cy: fmt(p[1]),
            r: fmt(markerSize),
            "data-ok-chart-marker": "",
          }),
        );
    shapes.push(
      node(
        "g",
        {
          "data-ok-chart-series": "",
          "data-ok-type": "radar",
          "data-ok-color": series.color,
          "data-ok-index": String(index),
        },
        children,
      ),
    );
  }
  const nodes = [
    node("g", { "data-ok-chart-grid": "" }, grid),
    node("g", { "data-ok-chart-axis": "x" }, axisX),
    node("g", { "data-ok-chart-axis": "y" }, axisY),
    ...groups(shapes, labels),
  ];
  return result(width, height, {
    mode: "index",
    slots,
    marks,
    nodes,
    activeRadius: Math.max(markerSize + 2, 5),
    polar: { cx: r2(cx), cy: r2(cy), r: r2(r) },
  });
}
