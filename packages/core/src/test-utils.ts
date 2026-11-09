/** Test helpers (not exported from the package). */
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
