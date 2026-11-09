import type { ChartLayout } from "./chart-layout.js";
import {
  type ChartZoom,
  chartSelectionPx,
  chartXAt,
  chartZoomBetween,
  clampChartZoom,
  panChart,
  zoomChartBy,
} from "./chart-zoom.js";

/*
 * Zoom, pan and brush gestures (ADR-0031, phase 4), shared by React and the HTML runtime. The
 * controller reads the owner's state through `host` and reports new ranges (`preview` while a
 * drag selects, `commit` for a new zoom); it owns no chart state.
 */

/**
 * `zoom`: a mouse drag selects the range to zoom to, a touch drag pans a zoomed chart, two
 * fingers pinch; `pan`: every drag pans; `brush`: a drag moves the selection, its edges resize it,
 * elsewhere a new one is drawn; `none`: no gestures.
 */
export type ChartGestureMode = "zoom" | "pan" | "brush" | "none";

export interface ChartGestureHost {
  layout(): ChartLayout | undefined;
  mode(): ChartGestureMode;
  /** The current zoom (brush charts: their selection). */
  range(): ChartZoom | null;
  /** The whole x axis (`chartZoomExtent`). */
  extent(): ChartZoom | null;
  /** A drag is selecting this range (`null`: the drag ended). */
  preview(range: ChartZoom | null): void;
  /** A new zoom (or brush selection). */
  commit(range: ChartZoom | null): void;
}

export interface ChartGestures {
  /** A drag or pinch is in progress (owners skip their tooltip updates). */
  readonly dragging: boolean;
  destroy(): void;
}

/**
 * `nav`: the drag started in a stock chart's navigator (ADR-0047): it works like a brush on the
 * zoom, on the navigator's own axis.
 */
type Drag = (
  | { kind: "select"; from: number; moved: boolean }
  | { kind: "pan"; from: number; range: ChartZoom | null; scale: number }
  | { kind: "resize"; edge: "min" | "max"; range: ChartZoom }
  | { kind: "pinch"; distance: number; range: ChartZoom | null; center: number }
) & { nav?: boolean };

/** Edge slack of brush handles in px. */
const EDGE = 8;

export function createChartGestures(plot: HTMLElement, host: ChartGestureHost): ChartGestures {
  const controller = new AbortController();
  const { signal } = controller;
  const pointers = new Map<number, number>();
  let drag: Drag | undefined;

  /** A client x position in the layout's px. */
  const local = (clientX: number) => {
    const layout = host.layout();
    const box = plot.getBoundingClientRect();
    const scale = layout ? layout.width / (box.width || layout.width) : 1;
    return (clientX - box.left) * scale;
  };
  const localY = (clientY: number) => {
    const layout = host.layout();
    const box = plot.getBoundingClientRect();
    const scale = layout ? layout.width / (box.width || layout.width) : 1;
    return (clientY - box.top) * scale;
  };
  /** The layout drags measure on: the navigator's axis and region during a navigator drag. */
  const view = (nav = drag?.nav === true): ChartLayout | undefined => {
    const layout = host.layout();
    if (!nav || !layout?.navigator) return layout;
    return { ...layout, x: layout.navigator.x, plot: layout.navigator.plot };
  };
  const xAt = (px: number) => {
    const map = view()?.x;
    return map ? chartXAt(map, px) : 0;
  };
  const kind = () => host.layout()?.x?.kind ?? "index";
  /** x units per px, fixed when a pan starts (the window moves under the pointer). */
  const unitsPerPx = () => {
    const map = view()?.x;
    return map && map.to !== map.from ? (map.max - map.min) / (map.to - map.from) : 0;
  };
  /** Brush gestures: inside the selection moves it, its edges resize it, elsewhere selects. */
  const brushDrag = (layout: ChartLayout, x: number, range: ChartZoom | null): Drag => {
    const selection = range ?? host.extent();
    const px = selection ? chartSelectionPx(layout, selection) : null;
    if (selection && px && Math.abs(x - px[0]) <= EDGE)
      return { kind: "resize", edge: "min", range: selection };
    if (selection && px && Math.abs(x - px[1]) <= EDGE)
      return { kind: "resize", edge: "max", range: selection };
    if (px && selection && x > px[0] && x < px[1])
      return { kind: "pan", from: x, range: selection, scale: 0 };
    return { kind: "select", from: x, moved: false };
  };

  const start = (event: PointerEvent) => {
    const layout = host.layout();
    const mode = host.mode();
    if (!layout?.x || mode === "none" || (event.pointerType === "mouse" && event.button !== 0))
      return;
    const x = local(event.clientX);
    pointers.set(event.pointerId, x);
    const range = host.range();
    const nav = layout.navigator;
    const y = localY(event.clientY);
    if (
      nav &&
      pointers.size === 1 &&
      mode !== "brush" &&
      y >= nav.plot.y - 4 &&
      y <= nav.plot.y + nav.plot.height + 4
    ) {
      const navView = view(true) as ChartLayout;
      drag = { ...brushDrag(navView, x, range), nav: true };
      // Unzoomed, the window is the whole axis: a drag draws a new one.
      if (drag.kind === "pan" && !range)
        drag = { kind: "select", from: x, moved: false, nav: true };
      if (drag.kind === "pan") drag.scale = unitsPerPx();
      try {
        plot.setPointerCapture(event.pointerId);
      } catch {}
      return;
    }
    if (pointers.size === 2 && mode !== "brush") {
      const [a, b] = [...pointers.values()] as [number, number];
      drag = { kind: "pinch", distance: Math.abs(b - a) || 1, range, center: xAt((a + b) / 2) };
      return;
    }
    if (pointers.size > 1) return;
    if (mode === "brush") {
      drag = brushDrag(layout, x, range);
      // A brush without a selection (all of it) draws a new one instead of moving.
      if (drag.kind === "pan" && !range) drag = { kind: "select", from: x, moved: false };
      if (drag.kind === "pan") drag.scale = unitsPerPx();
    } else if (mode === "pan" || event.pointerType !== "mouse") {
      // Touch drags pan a zoomed chart; on a whole chart they leave the tap to the tooltip.
      if (!range) return;
      drag = { kind: "pan", from: x, range, scale: unitsPerPx() };
    } else drag = { kind: "select", from: x, moved: false };
    try {
      // Keeps the drag when the pointer leaves the plot (fails for pointers that already ended).
      plot.setPointerCapture(event.pointerId);
    } catch {}
  };

  const move = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId) || !drag) return;
    const x = local(event.clientX);
    pointers.set(event.pointerId, x);
    const layout = view();
    if (!layout) return;
    // Navigator drags act like a brush on the zoom (ADR-0047).
    const brushing = host.mode() === "brush" || drag.nav === true;
    if (drag.kind === "pinch") {
      const [a, b] = [...pointers.values()] as [number, number];
      const distance = Math.abs(b - a) || 1;
      host.commit(
        zoomChartBy(drag.range, host.extent(), kind(), drag.distance / distance, drag.center),
      );
    } else if (drag.kind === "select") {
      if (Math.abs(x - drag.from) < 4 && !drag.moved) return;
      drag.moved = true;
      const range = chartZoomBetween(layout, host.extent(), drag.from, x);
      if (brushing) host.commit(range);
      else host.preview(range ?? host.extent());
    } else if (drag.kind === "pan") {
      // Dragging a zoomed chart moves its window the other way; a brush moves its selection along.
      const delta = (x - drag.from) * drag.scale;
      const sign = brushing ? 1 : -1;
      host.commit(panChart(drag.range, host.extent(), kind(), sign * delta));
    } else {
      const value = xAt(x);
      const { min, max } = drag.range;
      host.commit(
        clampChartZoom(
          drag.edge === "min"
            ? { min: Math.min(value, max - 1e-9), max }
            : { min, max: Math.max(value, min + 1e-9) },
          host.extent(),
          kind(),
        ),
      );
    }
  };

  const end = (event: PointerEvent) => {
    if (!pointers.delete(event.pointerId)) return;
    const current = drag;
    if (pointers.size > 0 && current?.kind === "pinch") return;
    drag = undefined;
    pointers.clear();
    if (current?.kind === "select" && current.moved && host.mode() !== "brush" && !current.nav) {
      const layout = host.layout();
      host.preview(null);
      if (layout)
        host.commit(chartZoomBetween(layout, host.extent(), current.from, local(event.clientX)));
    }
  };

  const cancel = (event: PointerEvent) => {
    if (!pointers.delete(event.pointerId)) return;
    if (drag?.kind === "select" && drag.moved && !drag.nav) host.preview(null);
    drag = undefined;
    pointers.clear();
  };

  // Ctrl (or ⌘) + wheel zooms around the pointer; a plain wheel scrolls the page.
  const wheel = (event: WheelEvent) => {
    const layout = host.layout();
    if (!layout?.x || host.mode() === "none" || !(event.ctrlKey || event.metaKey)) return;
    if (event.deltaY === 0) return;
    event.preventDefault();
    const factor = event.deltaY > 0 ? 1.25 : 0.8;
    host.commit(
      zoomChartBy(host.range(), host.extent(), kind(), factor, xAt(local(event.clientX))),
    );
  };

  plot.addEventListener("pointerdown", start, { signal });
  plot.addEventListener("pointermove", move, { signal });
  plot.addEventListener("pointerup", end, { signal });
  plot.addEventListener("pointercancel", cancel, { signal });
  plot.addEventListener("wheel", wheel, { signal, passive: false });

  return {
    get dragging() {
      return drag !== undefined && (drag.kind !== "select" || drag.moved);
    },
    destroy() {
      controller.abort();
    },
  };
}
