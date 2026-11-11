/** Test helpers (not exported from the package). */
import { vi } from "vitest";

/* Gestures (ADR-0062, 5.3): synthetic pointers on a fake clock. */
let time = 1000;

/** Fakes `performance.now()` (the pan velocity clock); `advance` moves it. */
export function fakeClock(): { advance(ms: number): void; restore(): void } {
  time = 1000;
  const spy = vi.spyOn(performance, "now").mockImplementation(() => time);
  return {
    advance(ms) {
      time += ms;
    },
    restore() {
      spy.mockRestore();
    },
  };
}

export interface PointerInit {
  x: number;
  y: number;
  id?: number;
  type?: string;
  button?: number;
  primary?: boolean;
}

const pointer = (
  type: string,
  { x, y, id = 1, type: kind = "mouse", button = 0, primary = true }: PointerInit,
) =>
  new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    pointerId: id,
    pointerType: kind,
    button,
    isPrimary: primary,
  });

export const press = (target: Element, init: PointerInit) =>
  target.dispatchEvent(pointer("pointerdown", init));
export const move = (init: PointerInit, target: EventTarget = window) =>
  target.dispatchEvent(pointer("pointermove", init));
export const release = (init: PointerInit, target: EventTarget = window) =>
  target.dispatchEvent(pointer("pointerup", init));
export const cancelPointer = (init: PointerInit) =>
  window.dispatchEvent(pointer("pointercancel", init));
export const enter = (target: Element, type = "mouse") =>
  target.dispatchEvent(pointer("pointerenter", { x: 0, y: 0, type }));
export const leave = (target: Element, type = "mouse") =>
  target.dispatchEvent(pointer("pointerleave", { x: 0, y: 0, type }));

/** A press at `from`, `steps` moves (`ms` apart on the clock) to `to`, then a release there. */
export function swipe(
  target: Element,
  clock: { advance(ms: number): void },
  from: { x: number; y: number },
  to: { x: number; y: number },
  {
    steps = 5,
    ms = 16,
    type = "mouse",
    hold = 0,
  }: { steps?: number; ms?: number; type?: string; hold?: number } = {},
): void {
  press(target, { ...from, type });
  for (let i = 1; i <= steps; i++) {
    clock.advance(ms);
    move({
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
      type,
    });
  }
  clock.advance(hold || ms);
  release({ ...to, type });
}

export function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  return host;
}

export function cleanupDom(): void {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
}

export const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Map tests (ADR-0025): an offline MapLibre style — a background and two land boxes from inline
 * GeoJSON, with an attribution — so no test fetches tiles.
 */
export const mapFixtureStyle = (land = "#f8f8f6") => ({
  version: 8 as const,
  sources: {
    land: {
      type: "geojson" as const,
      attribution: '<a href="https://example.com/data">© Test data</a> &amp; friends',
      data: {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            properties: { name: "North" },
            geometry: {
              type: "Polygon" as const,
              coordinates: [
                [
                  [-125, 25],
                  [-65, 25],
                  [-65, 50],
                  [-125, 50],
                  [-125, 25],
                ],
              ],
            },
          },
          {
            type: "Feature" as const,
            properties: { name: "South" },
            geometry: {
              type: "Polygon" as const,
              coordinates: [
                [
                  [10, -30],
                  [40, -30],
                  [40, 10],
                  [10, 10],
                  [10, -30],
                ],
              ],
            },
          },
        ],
      },
    },
  },
  layers: [
    { id: "background", type: "background" as const, paint: { "background-color": "#d4dadc" } },
    { id: "land", type: "fill" as const, source: "land", paint: { "fill-color": land } },
  ],
});

/** Resolves on the next `type` event of a target (map events, DOM events). */
export const nextEvent = (
  target: { on?: unknown; addEventListener?: unknown },
  type: string,
): Promise<unknown> =>
  new Promise((resolve) => {
    if (typeof target.on === "function") {
      const off = (target.on as (t: string, h: (e: unknown) => void) => () => void)(
        type,
        (event) => {
          off();
          resolve(event);
        },
      );
    } else (target as EventTarget).addEventListener(type, resolve, { once: true });
  });
