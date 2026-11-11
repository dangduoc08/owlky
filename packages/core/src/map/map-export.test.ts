import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanupDom, mapFixtureStyle, mount, nextEvent } from "../test-utils.js";
import { setMapWorkerUrl } from "./index.js";
import { createMapController, type MapController } from "./map.js";

beforeAll(() => setMapWorkerUrl(workerUrl));

let controller: MapController | undefined;
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  cleanupDom();
});

const create = (labels?: { map: string }) => {
  const host = mount(`<div data-ok-map style="position: relative; width: 300px; height: 200px">
    <div data-ok-map-view style="position: absolute; inset: 0"></div>
    <div data-ok-map-fallback></div>
    <p data-ok-map-description id="d">A map.</p>
    <div data-ok-map-status role="status"></div>
  </div>`);
  const root = host.querySelector("[data-ok-map]") as HTMLElement;
  controller = createMapController(root, { mapStyle: mapFixtureStyle(), labels });
  return controller;
};
const loaded = async (c: MapController) => {
  if (!c.loaded) await nextEvent(c, "load");
  return c.map as NonNullable<MapController["map"]>;
};
/** Stops the page from opening a real download and returns the files it tried to save. */
const captureDownloads = () => {
  const files: string[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function record(
    this: HTMLAnchorElement,
  ) {
    files.push(this.download);
  });
  return files;
};
const gestureActive = (isActive: boolean) =>
  vi
    .spyOn(navigator, "userActivation", "get")
    .mockReturnValue({ isActive, hasBeenActive: isActive } as UserActivation);

describe("exportMap", () => {
  it("resolves with a PNG of the canvas and saves it with a file name from the map's name", async () => {
    const files = captureDownloads();
    gestureActive(true);
    const c = create({ map: "Sales by state" });
    await loaded(c);
    const blob = await c.exportMap();
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBeGreaterThan(0);
    // A PNG file starts with its 8-byte signature.
    const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    expect([...header]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    expect(files).toEqual(["sales-by-state.png"]);
  });

  it("uses the given file name", async () => {
    const files = captureDownloads();
    gestureActive(true);
    const c = create();
    await loaded(c);
    await c.exportMap("png", { fileName: "Quarterly report" });
    expect(files).toEqual(["quarterly-report.png"]);
  });

  it("can return the image without saving it, outside a user gesture", async () => {
    const files = captureDownloads();
    gestureActive(false);
    const c = create();
    await loaded(c);
    const blob = await c.exportMap("png", { download: false });
    expect(blob.type).toBe("image/png");
    expect(files).toEqual([]);
  });

  it("refuses a download outside a user gesture and an unknown format", async () => {
    const files = captureDownloads();
    gestureActive(false);
    const c = create();
    await loaded(c);
    await expect(c.exportMap()).rejects.toMatchObject({ name: "NotAllowedError" });
    await expect(c.exportMap("gif" as "png")).rejects.toThrow(TypeError);
    expect(files).toEqual([]);
  });

  it("refuses without a map", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const c = create();
    expect(c.map).toBeNull();
    await expect(c.exportMap("png", { download: false })).rejects.toMatchObject({
      name: "InvalidStateError",
    });
  });

  it("refuses when the browser can't make the file", async () => {
    const files = captureDownloads();
    gestureActive(true);
    const c = create();
    const map = await loaded(c);
    const toBlob = vi.spyOn(map.getCanvas(), "toBlob");
    // Some browsers report a failed encoding with a null blob.
    toBlob.mockImplementationOnce((callback) => callback(null));
    await expect(c.exportMap()).rejects.toMatchObject({ name: "NotSupportedError" });
    // A canvas that read a cross-origin image can't be read.
    toBlob.mockImplementationOnce(() => {
      throw new DOMException("Tainted canvas.", "SecurityError");
    });
    await expect(c.exportMap()).rejects.toMatchObject({ name: "SecurityError" });
    expect(files).toEqual([]);
  });

  it("rejects when the map goes away before the frame", async () => {
    const c = create();
    const map = await loaded(c);
    vi.spyOn(map, "triggerRepaint").mockImplementation(() => map);
    const pending = c.exportMap("png", { download: false });
    c.destroy();
    controller = undefined;
    await expect(pending).rejects.toMatchObject({ name: "InvalidStateError" });
  });
});
