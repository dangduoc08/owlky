import { afterEach, describe, expect, it, vi } from "vitest";
import {
  autoAnchor,
  distanceMeters,
  mapOffset,
  mapScaleBar,
  parseAttribution,
  safeMapUrl,
  supportsWebGL,
} from "./helpers.js";

afterEach(() => vi.restoreAllMocks());

describe("safeMapUrl", () => {
  it("keeps http(s) URLs and resolves relative ones against the page", () => {
    expect(safeMapUrl("https://tiles.example.com/style.json")).toBe(
      "https://tiles.example.com/style.json",
    );
    expect(safeMapUrl("http://example.com/a")).toBe("http://example.com/a");
    expect(safeMapUrl("data/quakes.geojson")).toBe(
      new URL("data/quakes.geojson", document.baseURI).href,
    );
  });

  it("keeps tile template placeholders", () => {
    expect(safeMapUrl("https://t.example.com/{z}/{x}/{y}.png")).toBe(
      "https://t.example.com/{z}/{x}/{y}.png",
    );
  });

  it("rejects other schemes, empty, overlong and non-string values", () => {
    expect(safeMapUrl("javascript:alert(1)")).toBeNull();
    expect(safeMapUrl(" JavaScript:alert(1)")).toBeNull();
    expect(safeMapUrl("data:application/json,{}")).toBeNull();
    expect(safeMapUrl("file:///etc/passwd")).toBeNull();
    expect(safeMapUrl("")).toBeNull();
    expect(safeMapUrl(`https://e.com/${"a".repeat(5000)}`)).toBeNull();
    expect(safeMapUrl(null)).toBeNull();
    expect(safeMapUrl(undefined)).toBeNull();
    expect(safeMapUrl("http://[::1")).toBeNull();
  });
});

describe("parseAttribution", () => {
  it("splits text and safe links, decoding entities", () => {
    expect(
      parseAttribution(
        '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href=\'https://www.openmaptiles.org/\'>OpenMapTiles</a> Data from <a href=https://osm.org>OSM</a>',
      ),
    ).toEqual([
      { text: "OpenFreeMap", href: "https://openfreemap.org/" },
      { text: " © " },
      { text: "OpenMapTiles", href: "https://www.openmaptiles.org/" },
      { text: " Data from " },
      { text: "OSM", href: "https://osm.org/" },
    ]);
  });

  it("drops unsafe links and other tags, keeping their text", () => {
    expect(
      parseAttribution(
        '<a href="javascript:alert(1)">Bad</a> <b onclick="x()">bold</b> <a>no href</a> &#169; &#xA9; &amp; &bogus; &#0;',
      ),
    ).toEqual([
      { text: "Bad" },
      { text: " bold " },
      { text: "no href" },
      { text: " © © & &bogus; " },
    ]);
  });

  it("keeps a single space between empty runs and ignores leading whitespace", () => {
    expect(parseAttribution("   ")).toEqual([]);
    expect(
      parseAttribution('<a href="https://a.com">A</a>   <a href="https://b.com">B</a>'),
    ).toEqual([
      { text: "A", href: "https://a.com/" },
      { text: " " },
      { text: "B", href: "https://b.com/" },
    ]);
  });
});

describe("mapScaleBar", () => {
  it("rounds to 1, 2, 3 or 5 times a power of ten", () => {
    expect(mapScaleBar(523_000, 100)).toEqual({ label: "500 km", width: 95.6 });
    expect(mapScaleBar(3_400, 100).label).toBe("3 km");
    expect(mapScaleBar(2_500, 100).label).toBe("2 km");
    expect(mapScaleBar(1_200, 100).label).toBe("1 km");
    expect(mapScaleBar(12_000, 100).label).toBe("10 km");
    expect(mapScaleBar(800, 100).label).toBe("500 m");
    expect(mapScaleBar(0.5, 100)).toEqual({ label: "0.5 m", width: 100 });
  });

  it("uses feet and miles, or nautical miles", () => {
    expect(mapScaleBar(100, 100, "imperial").label).toBe("300 ft");
    expect(mapScaleBar(5_000, 100, "imperial").label).toBe("3 mi");
    expect(mapScaleBar(50_000, 100, "nautical").label).toBe("20 nm");
  });

  it("is empty without a distance or a width", () => {
    expect(mapScaleBar(0, 100)).toEqual({ label: "", width: 0 });
    expect(mapScaleBar(100, 0)).toEqual({ label: "", width: 0 });
    expect(mapScaleBar(Number.NaN, 100)).toEqual({ label: "", width: 0 });
  });
});

describe("autoAnchor", () => {
  const size = { width: 100, height: 50 };
  const view = { width: 400, height: 300 };
  it("puts the popup where it fits", () => {
    expect(autoAnchor({ x: 200, y: 150 }, size, view)).toBe("bottom");
    expect(autoAnchor({ x: 200, y: 20 }, size, view)).toBe("top");
    expect(autoAnchor({ x: 200, y: 290 }, size, view)).toBe("bottom");
    expect(autoAnchor({ x: 10, y: 150 }, size, view)).toBe("left");
    expect(autoAnchor({ x: 390, y: 150 }, size, view)).toBe("right");
    expect(autoAnchor({ x: 10, y: 10 }, size, view)).toBe("top-left");
    expect(autoAnchor({ x: 390, y: 290 }, size, view)).toBe("bottom-right");
  });
});

describe("mapOffset", () => {
  it("reads x,y pairs and distances along the anchor", () => {
    expect(mapOffset(null, "bottom")).toEqual([0, 0]);
    expect(mapOffset("", "bottom")).toEqual([0, 0]);
    expect(mapOffset("4, -8", "top")).toEqual([4, -8]);
    expect(mapOffset("10", "bottom")).toEqual([0, -10]);
    expect(mapOffset("10", "top")).toEqual([0, 10]);
    expect(mapOffset("10", "left")).toEqual([10, 0]);
    expect(mapOffset("10", "right")).toEqual([-10, 0]);
    expect(mapOffset("10", "center")).toEqual([0, 0]);
    expect(mapOffset("10", "top-left")).toEqual([7.07, 7.07]);
  });

  it("ignores invalid values", () => {
    expect(mapOffset("a,b", "top")).toEqual([0, 0]);
    expect(mapOffset("1,2,3", "top")).toEqual([0, 0]);
    expect(mapOffset('"><img onerror=alert(1)>', "top")).toEqual([0, 0]);
  });
});

describe("supportsWebGL / distanceMeters", () => {
  it("detects WebGL and survives a throwing canvas", () => {
    expect(supportsWebGL()).toBe(true);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(supportsWebGL()).toBe(false);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(supportsWebGL()).toBe(false);
  });

  it("measures great-circle distances", () => {
    expect(distanceMeters([0, 0], [0, 0])).toBe(0);
    expect(Math.round(distanceMeters([0, 0], [1, 0]) / 100) * 100).toBe(111_200);
  });
});
