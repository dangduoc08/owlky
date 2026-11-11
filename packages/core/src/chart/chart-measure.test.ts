import { afterEach, describe, expect, it } from "vitest";
import { type ChartRenderInput, renderChart } from "./chart.js";
import {
  chartAnnotationIndexes,
  chartAnnotationItems,
  readChartAnnotations,
} from "./chart-annotations.js";
import { createChartGestures } from "./chart-gestures.js";
import type { ChartNode } from "./chart-layout.js";
import {
  chartAnnotationAt,
  chartAnnotationKey,
  chartAnnotationText,
  chartAnnotationX,
  chartMeasureActive,
  chartMeasureAt,
  chartMeasureBetween,
  chartMeasures,
  chartMeasureText,
  dragChartAnnotation,
  moveChartAnnotation,
} from "./chart-measure.js";
import { chartData } from "./chart-model.js";
import { chartToolbar } from "./chart-toolbar.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const base: ChartRenderInput = {
  categories: MONTHS,
  series: [{ name: "A", data: [10, 20, 15, 30, 25, 40] }],
  width: 640,
  height: 320,
  idPrefix: "t",
};
const all = (nodes: readonly ChartNode[]): ChartNode[] =>
  nodes.flatMap((item) => [item, ...all(item.children ?? [])]);

describe("measure rulers", () => {
  it("validates rulers and keeps the last 20", () => {
    expect(chartMeasures([{ x1: 0, y1: 1, x2: Number.NaN, y2: 2 }])).toEqual([]);
    const many = Array.from({ length: 25 }, (_, i) => ({ x1: i, y1: 0, x2: i, y2: 1 }));
    expect(chartMeasures(many)).toHaveLength(20);
    expect(chartMeasures(many)[0]?.x1).toBe(5);
    expect(chartMeasures(undefined)).toEqual([]);
  });

  it("turns px into data positions and reads span values from the series", () => {
    const { layout } = renderChart(base);
    const slot = layout.slots[1] as { pos: number };
    const at = chartMeasureAt(layout, slot.pos + 3, layout.plot.y);
    expect(at?.x).toBe(1);
    expect(at?.y).toBeCloseTo(layout.y?.max as number, 0);
    const span = chartMeasureBetween(layout, "span", { x: 1, y: 0 }, { x: 3, y: 0 });
    expect(span).toEqual({ x1: 1, y1: 20, x2: 3, y2: 30 });
    expect(chartMeasureBetween(layout, "free", { x: 1, y: 5 }, { x: 3, y: 6 })).toEqual({
      x1: 1,
      y1: 5,
      x2: 3,
      y2: 6,
    });
    expect(chartMeasureAt(renderChart({ ...base, type: "pie" }).layout, 1, 1)).toBeNull();
  });

  it("reads keyboard positions", () => {
    const { layout } = renderChart(base);
    expect(chartMeasureActive(layout, { kind: "index", index: 2 })).toEqual({ x: 2, y: 15 });
    expect(chartMeasureActive(layout, { kind: "mark", mark: 3 })).toEqual({ x: 3, y: 30 });
    expect(chartMeasureActive(layout, null)).toBeNull();
    expect(chartMeasureActive(layout, { kind: "mark", mark: 99 })).toBeNull();
  });

  it("writes the change as text", () => {
    const render = renderChart(base);
    expect(chartMeasureText(render.data, render.format, { x1: 1, y1: 20, x2: 3, y2: 30 })).toBe(
      "Feb → Apr: +10 (+50%)",
    );
    expect(chartMeasureText(render.data, render.format, { x1: 0, y1: 0, x2: 1, y2: -5 })).toBe(
      "Jan → Feb: -5",
    );
    const points = renderChart({
      ...base,
      type: "scatter",
      categories: undefined,
      series: [
        {
          name: "A",
          data: [
            [1, 2],
            [3, 4],
          ],
        },
      ],
    });
    expect(chartMeasureText(points.data, points.format, { x1: 1, y1: 2, x2: 3, y2: 4 })).toBe(
      "1 → 3: +2 (+100%)",
    );
  });

  it("draws span bands and free lines under the hover layer", () => {
    const measures = [{ x1: 1, y1: 20, x2: 3, y2: 30 }];
    const span = renderChart({ ...base, measures, measureMode: "span" }).layout.nodes;
    const at = span.findIndex((n) => n.attrs["data-ok-chart-measures"] !== undefined);
    expect(at).toBe(span.findIndex((n) => n.attrs["data-ok-chart-active"] !== undefined) - 1);
    expect(all(span).some((n) => n.attrs["data-ok-chart-measure-band"] !== undefined)).toBe(true);
    const label = all(span).find((n) => n.attrs["data-ok-chart-measure-label"] !== undefined);
    expect(label?.text).toBe("Feb → Apr: +10 (+50%)");
    expect(label?.attrs["data-ok-trend"]).toBe("up");
    const free = all(renderChart({ ...base, measures, measureMode: "free" }).layout.nodes);
    expect(free.some((n) => n.attrs["data-ok-chart-measure-line"] !== undefined)).toBe(true);
    expect(free.filter((n) => n.attrs["data-ok-chart-measure-end"] !== undefined)).toHaveLength(2);
    const flat = all(
      renderChart({ ...base, measures: [{ x1: 0, y1: 1, x2: 1, y2: 1 }] }).layout.nodes,
    );
    expect(flat.find((n) => n.attrs["data-ok-trend"])?.attrs["data-ok-trend"]).toBe("flat");
  });

  it("adds the measure tools to the toolbar", () => {
    const tools = chartToolbar({
      zoom: false,
      zoomed: false,
      pan: false,
      measure: true,
      measuring: true,
      downloads: false,
    });
    expect(tools.map((t) => t.tool)).toEqual(["measure", "clearMeasures"]);
    expect(tools[0]?.pressed).toBe(true);
    expect(tools[1]?.disabled).toBe(true);
    expect(chartToolbar({ zoom: false, zoomed: false, pan: false }).map((t) => t.tool)).toEqual([
      "svg",
      "png",
      "csv",
    ]);
  });
});

describe("draggable annotations", () => {
  const notes = [
    { axis: "y" as const, y: 20, label: "Target", draggable: true },
    { axis: "x" as const, x: "Mar", x2: "Apr", label: "Band", draggable: true },
    { axis: "point" as const, x: "Feb", y: 20, label: "Fixed" },
    { axis: "text" as const, x: "May", y: 30, label: "Note", draggable: true },
  ];

  it("writes, reads and indexes the draggable flag", () => {
    const items = chartAnnotationItems(notes);
    expect(items[0]?.attrs["data-ok-draggable"]).toBe("");
    expect(items[2]?.attrs["data-ok-draggable"]).toBeUndefined();
    const list = document.createElement("ul");
    for (const item of items) {
      const li = document.createElement("li");
      for (const [name, value] of Object.entries(item.attrs)) li.setAttribute(name, value);
      li.textContent = item.text;
      list.append(li);
    }
    expect(readChartAnnotations(list).map((n) => n.draggable === true)).toEqual([
      true,
      true,
      false,
      true,
    ]);
    expect(chartAnnotationIndexes([{ axis: "x" }, ...notes])).toEqual([1, 2, 3, 4]);
  });

  it("finds draggable annotations under the pointer and marks the picked one", () => {
    const render = renderChart({ ...base, annotations: notes, pickedAnnotation: 0 });
    const hits = render.annotationHits ?? [];
    expect(hits.map((hit) => hit.index)).toEqual([0, 1, 3]);
    const target = hits[0] as { py: number };
    expect(chartAnnotationAt(hits, 100, target.py + 3)).toBe(0);
    expect(chartAnnotationAt(hits, 100, target.py + 30)).toBeUndefined();
    const groups = all(render.layout.nodes).filter(
      (n) => n.attrs["data-ok-chart-annotation"] !== undefined,
    );
    expect(groups[0]?.attrs["data-ok-picked"]).toBe("");
    expect(groups[2]?.attrs["data-ok-draggable"]).toBeUndefined();
    expect(renderChart(base).annotationHits).toBeUndefined();
  });

  it("moves lines along one axis, bands whole and points both ways", () => {
    const data = chartData({ categories: MONTHS, series: [] });
    expect(moveChartAnnotation(data, notes[0] as never, 1, 5)).toMatchObject({ y: 25 });
    expect(moveChartAnnotation(data, notes[1] as never, 1, 5)).toMatchObject({
      x: "Apr",
      x2: "May",
    });
    expect(moveChartAnnotation(data, notes[3] as never, -9, 1)).toMatchObject({ x: "Jan", y: 31 });
    const numeric = chartData({
      type: "scatter",
      series: [
        {
          name: "A",
          data: [
            [0, 0],
            [10, 10],
          ],
        },
      ],
    });
    expect(moveChartAnnotation(numeric, { axis: "x", x: 2 }, 1.234, 0)).toMatchObject({ x: 3.23 });
    const dates = chartData({
      xType: "datetime",
      categories: ["2025-01-01", "2025-02-01"],
      series: [],
    });
    expect(moveChartAnnotation(dates, { axis: "x", x: "2025-01-01" }, 1, 0)).toMatchObject({
      x: "2025-02-01",
    });
    expect(chartAnnotationX(dates, undefined)).toBeUndefined();
    expect(chartAnnotationX(data, "2")).toBe(2);
  });

  it("drags by px and moves with keys", () => {
    const render = renderChart({ ...base, annotations: notes });
    const { layout, data } = render;
    const moved = dragChartAnnotation(
      layout,
      data,
      notes[3] as never,
      { px: 100, py: 100 },
      { px: 100 + layout.band, py: 100 },
    );
    expect(moved.x).toBe("Jun");
    expect(chartAnnotationKey(layout, data, notes[0] as never, "ArrowUp")?.y).toBeGreaterThan(20);
    expect(chartAnnotationKey(layout, data, notes[3] as never, "ArrowLeft")?.x).toBe("Apr");
    expect(chartAnnotationKey(layout, data, notes[0] as never, "Home")).toBeUndefined();
    expect(chartAnnotationText({ axis: "point", x: "Mar", y: 40, label: "Peak" })).toBe(
      "Peak: Mar, 40",
    );
    expect(chartAnnotationText({ axis: "y", y: 1 })).toBe("Annotation: 1");
  });

  it("keeps positions it can't move, and falls back on axes without categories", () => {
    const numeric = chartData({ type: "scatter", series: [{ name: "A", data: [[0, 0]] }] });
    // A numeric axis can't place "abc": the annotation keeps its x.
    expect(moveChartAnnotation(numeric, { axis: "x", x: "abc" }, 1, 0).x).toBe("abc");
    // A point without y moves along x only.
    const data = chartData({ categories: MONTHS, series: [] });
    expect(moveChartAnnotation(data, { axis: "point", x: "Feb" }, 1, 5)).toEqual({
      axis: "point",
      x: "Mar",
      y: undefined,
    });
    // A category axis with no categories: positions clamp to the first slot.
    const empty = chartData({ categories: [], series: [] });
    expect(moveChartAnnotation(empty, { axis: "x", x: 2 }, 1, 0).x).toBe(0);
  });

  it("picks the nearest of several annotations in reach; text notes reach three times as far", () => {
    const hits = [
      { index: 0, axis: "y" as const, py: 100 },
      { index: 1, axis: "y" as const, py: 104 },
      { index: 2, axis: "text" as const, px: 300, py: 50 },
    ];
    expect(chartAnnotationAt(hits, 10, 103)).toBe(1);
    expect(chartAnnotationAt(hits, 10, 101)).toBe(0);
    expect(chartAnnotationAt(hits, 315, 50)).toBe(2);
    expect(chartAnnotationAt(hits, 330, 50)).toBeUndefined();
  });
});

describe("measure rulers on bars and several series", () => {
  it("span rulers read the first series where marks share an x, and bands cover the bars", () => {
    const render = renderChart({
      ...base,
      type: "bar",
      series: [
        { name: "A", data: [10, 20, 15, 30, 25, 40] },
        { name: "B", data: [1, 2, 3, 4, 5, 6] },
      ],
      measures: [{ x1: 1, y1: 0, x2: 2, y2: 0 }],
      measureMode: "span",
    });
    const { layout } = render;
    const span = chartMeasureBetween(layout, "span", { x: 1, y: 0 }, { x: 2, y: 0 });
    expect([span.y1, span.y2]).toEqual([20, 15]);
    const band = all(layout.nodes).find((n) => n.attrs["data-ok-chart-measure-band"] !== undefined);
    const first = layout.slots[1] as { pos: number };
    // The band starts half a category before the first slot's center.
    expect(Number(band?.attrs.x)).toBeLessThan(first.pos);
  });
});

describe("measure and annotation gestures", () => {
  let destroy: (() => void) | undefined;
  afterEach(() => {
    destroy?.();
    document.body.replaceChildren();
  });
  const press = (target: Element, type: string, x: number, y: number) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        bubbles: true,
      }),
    );

  it("reports measure drags and annotation drags", () => {
    const plot = document.createElement("div");
    plot.style.cssText = "position:fixed;left:0;top:0;width:640px;height:320px";
    document.body.append(plot);
    const render = renderChart({ ...base, annotations: [{ axis: "y", y: 20, draggable: true }] });
    const events: string[] = [];
    let mode: "measure" | "none" = "measure";
    const gestures = createChartGestures(plot, {
      layout: () => render.layout,
      mode: () => mode,
      range: () => null,
      extent: () => render.extent,
      preview: () => {},
      commit: () => {},
      measure: (_from, _to, end) => events.push(end ? "measure-end" : "measure"),
      annotationAt: (point) => chartAnnotationAt(render.annotationHits ?? [], point.px, point.py),
      dragAnnotation: (index, _from, _to, end) => events.push(`${index}:${end ? "end" : "move"}`),
    });
    destroy = () => gestures.destroy();
    press(plot, "pointerdown", 100, 40);
    press(plot, "pointermove", 160, 60);
    press(plot, "pointerup", 160, 60);
    expect(events).toEqual(["measure", "measure-end"]);
    expect(gestures.moved).toBe(true);
    events.length = 0;
    mode = "none";
    const py = (render.annotationHits?.[0]?.py ?? 0) as number;
    press(plot, "pointerdown", 100, py);
    press(plot, "pointermove", 100, py + 20);
    press(plot, "pointerup", 100, py + 20);
    expect(events).toEqual(["0:move", "0:end"]);
    events.length = 0;
    // A press without moving reports nothing.
    press(plot, "pointerdown", 100, py);
    press(plot, "pointerup", 100, py);
    expect(events).toEqual([]);
  });
});
