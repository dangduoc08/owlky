import { afterEach, describe, expect, it } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import { readLayerDeclaration, readSourceDeclaration } from "./declarations.js";

afterEach(cleanupDom);

const html = (markup: string) => mount(markup).firstElementChild as HTMLElement;

describe("readSourceDeclaration", () => {
  it("reads every allowed key with its kind", () => {
    const source = html(`<div data-ok-map-source data-ok-id="quakes" data-ok-type="geojson"
      data-ok-data="quakes.geojson" data-ok-cluster data-ok-cluster-radius="50"
      data-ok-cluster-max-zoom="14" data-ok-cluster-properties='{"sum":["+",["get","mag"]]}'
      data-ok-generate-id="false" data-ok-attribution="© USGS" data-ok-min-zoom="1"
      data-ok-onerror="alert(1)" hidden></div>`);
    expect(readSourceDeclaration(source)).toEqual({
      id: "quakes",
      spec: {
        type: "geojson",
        data: new URL("quakes.geojson", document.baseURI).href,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
        clusterProperties: { sum: ["+", ["get", "mag"]] },
        generateId: false,
        attribution: "© USGS",
        minzoom: 1,
      },
    });
  });

  it("reads inline GeoJSON, tile lists and drops invalid values", () => {
    const inline = html(
      `<div data-ok-map-source data-ok-id="p" data-ok-type="geojson" data-ok-data='{"type":"Point","coordinates":[1,2]}' data-ok-buffer="x" data-ok-bounds="[1,2" data-ok-tile-size=""></div>`,
    );
    expect(readSourceDeclaration(inline)?.spec).toEqual({
      type: "geojson",
      data: { type: "Point", coordinates: [1, 2] },
    });
    const tiles = html(
      `<div data-ok-map-source data-ok-id="t" data-ok-type="raster" data-ok-tiles="https://a.com/{z}/{x}/{y}.png javascript:x()" data-ok-url="javascript:alert(1)" data-ok-tile-size="256"></div>`,
    );
    expect(readSourceDeclaration(tiles)?.spec).toEqual({
      type: "raster",
      tiles: ["https://a.com/{z}/{x}/{y}.png"],
      tileSize: 256,
    });
    const none = html(
      `<div data-ok-map-source data-ok-id="n" data-ok-type="raster" data-ok-tiles="javascript:x()" data-ok-data="javascript:x()"></div>`,
    );
    expect(readSourceDeclaration(none)?.spec).toEqual({ type: "raster" });
  });

  it("rejects missing or unsafe ids and unknown types", () => {
    expect(readSourceDeclaration(html(`<div data-ok-type="geojson"></div>`))).toBeNull();
    expect(
      readSourceDeclaration(html(`<div data-ok-id='"><img>' data-ok-type="geojson"></div>`)),
    ).toBeNull();
    expect(
      readSourceDeclaration(html(`<div data-ok-id="a" data-ok-type="script"></div>`)),
    ).toBeNull();
  });
});

describe("readLayerDeclaration", () => {
  it("takes the source from its parent declaration", () => {
    const root =
      html(`<div data-ok-map><div data-ok-map-source data-ok-id="quakes" data-ok-type="geojson">
      <div data-ok-map-layer data-ok-id="dots" data-ok-type="circle" data-ok-filter='["has","mag"]'
        data-ok-paint='{"circle-radius":4}' data-ok-layout='{"visibility":"visible"}'
        data-ok-min-zoom="2" data-ok-max-zoom="9" data-ok-before-id="labels"></div></div></div>`);
    expect(readLayerDeclaration(root.querySelector("[data-ok-map-layer]") as Element)).toEqual({
      spec: {
        id: "dots",
        type: "circle",
        source: "quakes",
        filter: ["has", "mag"],
        paint: { "circle-radius": 4 },
        layout: { visibility: "visible" },
        minzoom: 2,
        maxzoom: 9,
      },
      beforeId: "labels",
    });
  });

  it("uses its own data-ok-source next to the map, and none for backgrounds", () => {
    const root = html(`<div data-ok-map>
      <div data-ok-map-layer data-ok-id="roads" data-ok-type="line" data-ok-source="openmaptiles" data-ok-source-layer="transportation" data-ok-before-id="&lt;bad&gt;"></div>
      <div data-ok-map-layer data-ok-id="bg" data-ok-type="background"></div>
      <div data-ok-map-layer data-ok-id="orphan" data-ok-type="fill"></div>
      <div data-ok-map-layer data-ok-id="x" data-ok-type="sparkles"></div>
    </div>`);
    const [roads, bg, orphan, invalid] = root.querySelectorAll("[data-ok-map-layer]");
    expect(readLayerDeclaration(roads as Element)).toEqual({
      spec: { id: "roads", type: "line", source: "openmaptiles", "source-layer": "transportation" },
      beforeId: undefined,
    });
    expect(readLayerDeclaration(bg as Element)).toEqual({
      spec: { id: "bg", type: "background" },
      beforeId: undefined,
    });
    expect(readLayerDeclaration(orphan as Element)).toBeNull();
    expect(readLayerDeclaration(invalid as Element)).toBeNull();
  });

  it("handles a detached layer", () => {
    const layer = document.createElement("div");
    layer.setAttribute("data-ok-id", "a");
    layer.setAttribute("data-ok-type", "background");
    expect(readLayerDeclaration(layer)?.spec).toEqual({ id: "a", type: "background" });
  });
});
