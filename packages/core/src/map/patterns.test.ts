import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanupDom, mapFixtureStyle, mount, nextEvent } from "../test-utils.js";
import { mapScale } from "./choropleth.js";
import { setMapWorkerUrl } from "./index.js";
import { createMapController, type MapController } from "./map.js";
import {
  drawMapPattern,
  mapClassPatterns,
  mapPatternImage,
  mapPatternLayer,
  mapPatternStyle,
} from "./patterns.js";

beforeAll(() => setMapWorkerUrl(workerUrl));
let controller: MapController | undefined;
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  cleanupDom();
});

describe("map patterns", () => {
  it("names the Chart's patterns and ApexMaps' aliases", () => {
    expect(mapPatternStyle("dots")).toBe("circles");
    expect(mapPatternStyle("lines")).toBe("horizontalLines");
    expect(mapPatternStyle("diagonal")).toBe("slantedLines");
    expect(mapPatternStyle("squares")).toBe("squares");
    expect(mapPatternStyle("zigzag")).toBeNull();
    expect(mapPatternStyle(3)).toBeNull();
    expect(mapPatternImage(null)).toBe("ok-pattern-none");
    expect(mapClassPatterns(6)).toEqual([
      "slantedLines",
      "squares",
      "circles",
      "horizontalLines",
      "verticalLines",
      "slantedLines",
    ]);
    expect(mapClassPatterns(3, ["dots", null])).toEqual(["circles", null, null]);
  });

  it("builds a fill-pattern layer with one pattern per class", () => {
    const scale = mapScale([1, 5, 9], {
      method: "threshold",
      thresholds: [3, 6],
      input: ["get", "v"],
    });
    const layer = mapPatternLayer({
      id: "p",
      source: "s",
      sourceLayer: "l",
      scale,
      patterns: ["dots", "lines", null],
    });
    expect(layer).toMatchObject({ id: "p", type: "fill", source: "s", "source-layer": "l" });
    expect(layer.paint["fill-pattern"]).toEqual([
      "case",
      ["==", ["typeof", ["get", "v"]], "number"],
      [
        "step",
        ["get", "v"],
        "ok-pattern-circles",
        3,
        "ok-pattern-horizontalLines",
        6,
        "ok-pattern-none",
      ],
      "ok-pattern-none",
    ]);
    expect(layer.paint["fill-opacity"]).toEqual([
      "case",
      ["boolean", ["feature-state", "muted"], false],
      0.15,
      1,
    ]);
    // One class: one image, no step.
    const flat = mapPatternLayer({ id: "q", source: "s", scale: mapScale([2, 2]) });
    expect((flat.paint["fill-pattern"] as unknown[])[2]).toBe("ok-pattern-slantedLines");
  });

  it("draws 8px tiles with ink, and a transparent tile for none", () => {
    for (const style of [
      "slantedLines",
      "squares",
      "circles",
      "horizontalLines",
      "verticalLines",
    ] as const) {
      const tile = drawMapPattern(style, "rgb(0 0 0 / 0.5)", 2);
      expect([tile.width, tile.height]).toEqual([16, 16]);
      expect(tile.data.some((value, index) => index % 4 === 3 && value > 0)).toBe(true);
    }
    expect(drawMapPattern(null, "black").data.every((value) => value === 0)).toBe(true);
  });

  it("gives MapLibre the pattern images its layers ask for", async () => {
    const root = mount(
      `<div data-ok-map style="width: 400px; height: 300px"><div data-ok-map-view style="position: absolute; inset: 0"></div></div>`,
    ).querySelector<HTMLElement>("[data-ok-map]") as HTMLElement;
    controller = createMapController(root, { mapStyle: mapFixtureStyle() });
    if (!controller.loaded) await nextEvent(controller, "load");
    const map = controller.map as NonNullable<MapController["map"]>;
    map.fire("styleimagemissing", { id: "ok-pattern-squares" });
    map.fire("styleimagemissing", { id: "ok-pattern-none" });
    map.fire("styleimagemissing", { id: "someone-else" });
    expect(map.hasImage("ok-pattern-squares")).toBe(true);
    expect(map.hasImage("ok-pattern-none")).toBe(true);
    expect(map.hasImage("someone-else")).toBe(false);
    // Asked twice: drawn once.
    map.fire("styleimagemissing", { id: "ok-pattern-squares" });
    expect(map.hasImage("ok-pattern-squares")).toBe(true);
  });
});
