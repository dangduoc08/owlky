import { setMapWorkerUrl } from "@owlky/core/map";
import workerUrl from "@owlky/core/map-worker.js?url";
import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { type MapProps, MapProvider, type MapRef, MapView, useMap } from "./map.js";
import { InlineCorners } from "./map-context.js";
import {
  AttributionControl,
  FullscreenControl,
  GeolocateControl,
  GlobeControl,
  MapControl,
  NavigationControl,
  ScaleControl,
  TerrainControl,
} from "./map-controls.js";
import { Layer, MapPanel, Marker, Popup, Source } from "./map-parts.js";

beforeAll(() => setMapWorkerUrl(workerUrl));
afterEach(() => vi.restoreAllMocks());

/** Offline style: a background and a land box with an attribution. */
const STYLE = {
  version: 8 as const,
  sources: {
    land: {
      type: "geojson" as const,
      attribution: '<a href="https://example.com/data">© Test data</a>',
      data: {
        type: "Feature" as const,
        properties: { name: "Box" },
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
    },
  },
  layers: [
    { id: "background", type: "background" as const, paint: { "background-color": "#d4dadc" } },
    { id: "land", type: "fill" as const, source: "land", paint: { "fill-color": "#f8f8f6" } },
  ],
};
const POINTS = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "A" },
      geometry: { type: "Point" as const, coordinates: [-95, 38] },
    },
  ],
};

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
/** Renders a map and waits for MapLibre's first load. */
async function renderMap(props: Partial<MapProps> = {}, ref = createRef<MapRef>()) {
  let loaded: () => void = () => {};
  const done = new Promise<void>((resolve) => {
    loaded = resolve;
  });
  const view = render(
    <MapView
      ref={ref}
      aria-label="Test map"
      mapStyle={STYLE}
      initialViewState={{ longitude: -95, latitude: 38, zoom: 2 }}
      style={{ width: 600, height: 400 }}
      onLoad={() => loaded()}
      {...props}
    />,
  );
  await done;
  return { ...view, ref, root: view.container.querySelector("[data-ok-map]") as HTMLElement };
}
/** What `useMap()` returned, by probe name, and the first map's first render. */
const seen: Record<string, unknown> = {};
const first: unknown[] = [];
function Probe({ name }: { name: string }) {
  const maps = useMap();
  seen[name] = maps;
  // The first render comes before the map exists.
  if (first.length === 0 && maps.current)
    first.push(maps.current.getMap(), maps.current.getViewState());
  return null;
}

/** A marker that opens a popup, and a hover tooltip. */
const popupRef = createRef<HTMLDivElement>();
function Demo() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <MapView
      mapStyle={STYLE}
      style={{ width: 600, height: 400 }}
      initialViewState={{ longitude: -95, latitude: 38, zoom: 2 }}
    >
      <Marker longitude={-95} latitude={38} aria-label="Open" onClick={() => setOpen(true)} />
      {open ? (
        <Popup
          longitude={-95}
          latitude={38}
          aria-label="Info"
          ref={popupRef}
          offset={20}
          maxWidth="20rem"
          anchor="top"
          onClose={(why) => {
            setReason(why);
            setOpen(false);
          }}
          onOpen={() => setReason("open")}
        >
          Text
        </Popup>
      ) : null}
      <Popup
        longitude={-90}
        latitude={35}
        role="tooltip"
        closeButton={false}
        closeOnClick={false}
        closeOnMove
        focusAfterOpen={false}
      >
        Hover
      </Popup>
      <p data-testid="reason">{reason}</p>
    </MapView>
  );
}

const mapOf = (ref: { current: MapRef | null }) =>
  ref.current?.getMap() as NonNullable<ReturnType<MapRef["getMap"]>>;

describe("MapRef.exportMap", () => {
  it("exports a PNG once the map is drawn and refuses before", async () => {
    const ref = createRef<MapRef>();
    render(<MapView ref={ref} mapStyle={STYLE} />);
    const load = new Promise<void>((resolve) => {
      const check = () =>
        ref.current?.getMap()?.loaded() ? resolve() : requestAnimationFrame(check);
      check();
    });
    await load;
    const blob = await act(() => (ref.current as MapRef).exportMap("png", { download: false }));
    expect(blob.type).toBe("image/png");
  });
});

describe("Map", () => {
  it("renders the anatomy and its options as attributes", () => {
    // A style URL that never loads (.invalid): only the markup matters here.
    const { container } = render(
      <MapView
        id="test"
        aria-label="Test map"
        description="A box of land."
        mapStyle="https://tiles.invalid/style.json"
        mapStyleDark="https://tiles.invalid/dark.json"
        initialViewState={{ longitude: 1, latitude: 2, zoom: 3, bounds: [-10, -10, 10, 10] }}
        maxBounds={[-20, -20, 20, 20]}
        interactiveLayerIds={["land"]}
        scrollZoom={false}
        renderWorldCopies={false}
        projection="mercator"
        maxPitch={85}
      />,
    );
    const root = container.querySelector("[data-ok-map]") as HTMLElement;
    expect(root.getAttribute("data-ok-map-style")).toBe("https://tiles.invalid/style.json");
    expect(root.getAttribute("data-ok-map-style-dark")).toBe("https://tiles.invalid/dark.json");
    expect(root.getAttribute("data-ok-longitude")).toBe("1");
    expect(root.getAttribute("data-ok-zoom")).toBe("3");
    expect(root.getAttribute("data-ok-bounds")).toBe("-10,-10,10,10");
    expect(root.getAttribute("data-ok-max-bounds")).toBe("-20,-20,20,20");
    expect(root.getAttribute("data-ok-interactive-layer-ids")).toBe("land");
    expect(root.getAttribute("data-ok-scroll-zoom")).toBe("false");
    expect(root.getAttribute("data-ok-render-world-copies")).toBe("false");
    expect(root.getAttribute("data-ok-max-pitch")).toBe("85");
    expect(root.getAttribute("data-ok-label")).toBe("Test map");
    expect(root.getAttribute("data-ok-runtime")).toBe("off");
    expect(root.querySelector("[data-ok-map-description]")?.id).toBe("test-description");
    expect(root.querySelector("[data-ok-map-status]")?.getAttribute("role")).toBe("status");
  });

  it("starts MapLibre, reports events and exposes a ref", async () => {
    const onMove = vi.fn();
    const ref = createRef<MapRef>();
    const { root } = await renderMap({ onMove }, ref);
    expect(root.querySelector("canvas")?.getAttribute("aria-label")).toBe("Test map");
    expect(ref.current?.controller).not.toBeNull();
    act(() => ref.current?.jumpTo({ zoom: 4 }));
    expect(onMove).toHaveBeenCalled();
    expect(onMove.mock.calls.at(-1)?.[0].viewState.zoom).toBe(4);
    act(() => {
      ref.current?.easeTo({ zoom: 3, duration: 0 });
      ref.current?.flyTo({ zoom: 3, animate: false });
      ref.current?.fitBounds([-10, -10, 10, 10], { duration: 0 });
    });
    expect(Math.round(ref.current?.getViewState()?.longitude ?? 1)).toBe(0);
  });

  it("follows prop changes: view, settings, style and labels", async () => {
    const ref = createRef<MapRef>();
    const { rerender, root } = await renderMap({ zoom: 2 }, ref);
    const map = mapOf(ref);
    const props = {
      ref,
      mapStyle: STYLE,
      style: { width: 600, height: 400 },
      initialViewState: { longitude: -95, latitude: 38 },
    };
    rerender(
      <MapView
        {...props}
        aria-label="Renamed"
        zoom={5}
        longitude={-90}
        latitude={35}
        pitch={10}
        bearing={5}
        scrollZoom={false}
        maxBounds={[-130, 20, -60, 55]}
        terrain={null}
        cursor="crosshair"
        labels={{ zoomIn: "Closer" }}
      />,
    );
    expect(map.getZoom()).toBe(5);
    expect(map.getPitch()).toBe(10);
    expect(map.scrollZoom.isEnabled()).toBe(false);
    expect(map.getMaxBounds()).not.toBeNull();
    expect(root.querySelector("canvas")?.getAttribute("aria-label")).toBe("Renamed");
    const styled = new Promise<void>((resolve) => map.once("style.load", () => resolve()));
    rerender(
      <MapView
        {...props}
        mapStyle={{ ...STYLE, layers: STYLE.layers.slice(0, 1) }}
        viewState={{ zoom: 5 }}
      />,
    );
    await styled;
    expect(map.getLayer("land")).toBeUndefined();
  });

  it("follows light, sky, padding and styleDiffing, and writes them as attributes", async () => {
    const ref = createRef<MapRef>();
    const { rerender, root } = await renderMap(
      { light: { intensity: 0.8 }, sky: { "atmosphere-blend": 0.25 }, padding: { left: 100 } },
      ref,
    );
    const map = mapOf(ref);
    expect(map.getLight()).toMatchObject({ intensity: 0.8 });
    expect(map.getSky()).toMatchObject({ "atmosphere-blend": 0.25 });
    expect(map.getPadding()).toMatchObject({ left: 100 });
    expect(root.getAttribute("data-ok-light")).toBe('{"intensity":0.8}');
    expect(root.getAttribute("data-ok-sky")).toBe('{"atmosphere-blend":0.25}');
    expect(root.getAttribute("data-ok-padding")).toBe("0 0 0 100");
    expect(root.hasAttribute("data-ok-style-diffing")).toBe(false);
    const setStyle = vi.spyOn(map, "setStyle");
    const props = {
      ref,
      style: { width: 600, height: 400 },
      initialViewState: { longitude: -95, latitude: 38, zoom: 2 },
    };
    const reloaded = new Promise<void>((resolve) => map.once("style.load", () => resolve()));
    rerender(
      <MapView
        {...props}
        mapStyle={{ ...STYLE, layers: STYLE.layers.slice(0, 1) }}
        light={{ intensity: 0.3 }}
        sky={null}
        padding={{ top: 20 }}
        styleDiffing={false}
      />,
    );
    // Without diffing the style reloads: the light comes back once it is in.
    await reloaded;
    expect(map.getLight()).toMatchObject({ intensity: 0.3 });
    expect(map.getPadding()).toMatchObject({ top: 20, left: 0 });
    expect(setStyle).toHaveBeenLastCalledWith(expect.anything(), { diff: false });
    expect(root.getAttribute("data-ok-style-diffing")).toBe("false");
    expect(root.hasAttribute("data-ok-sky")).toBe(false);
  });

  it("renders controls in the corners, and the attribution unless turned off", async () => {
    const { root, rerender } = await renderMap({
      children: (
        <>
          <NavigationControl position="bottom-left" visualizePitch />
          <ScaleControl maxWidth={80} unit="imperial" />
          <GeolocateControl position="top-left" trackUserLocation showAccuracyCircle={false} />
          <FullscreenControl position="top-left" />
          <GlobeControl />
          <TerrainControl source="dem" exaggeration={2} />
          <MapControl position="bottom-right" aria-label="Tools">
            <button type="button">Tool</button>
          </MapControl>
        </>
      ),
    });
    await act(frame);
    const corner = (position: string) =>
      root.querySelector(`[data-ok-map-corner="${position}"]`) as HTMLElement;
    expect(
      corner("bottom-left")
        .querySelector("[data-ok-map-navigation]")
        ?.hasAttribute("data-ok-visualize-pitch"),
    ).toBe(true);
    expect(
      corner("bottom-left").querySelector("[data-ok-map-scale]")?.getAttribute("data-ok-unit"),
    ).toBe("imperial");
    expect(
      corner("top-left")
        .querySelector('[data-ok-map-action="geolocate"]')
        ?.getAttribute("aria-pressed"),
    ).toBe("false");
    expect(
      corner("top-left")
        .querySelector("[data-ok-map-geolocate]")
        ?.getAttribute("data-ok-show-accuracy-circle"),
    ).toBe("false");
    expect(
      corner("top-right")
        .querySelector('[data-ok-map-action="terrain"]')
        ?.getAttribute("data-ok-exaggeration"),
    ).toBe("2");
    expect(corner("bottom-right").querySelector("[data-ok-map-attribution]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Tool" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeTruthy();
    // Every control is a Paper; map.css keeps its radius and z1 shadow.
    const controls = [...root.querySelectorAll<HTMLElement>("[data-ok-map-control]")];
    expect(controls).toHaveLength(6);
    for (const control of controls) expect(control.dataset["okPaper"]).toBe("");
    expect(getComputedStyle(controls[0] as HTMLElement).borderTopLeftRadius).toBe("8px");
    await expectNoAxeViolations(root);
    rerender(
      <MapView mapStyle={STYLE} attributionControl={false}>
        <NavigationControl showZoom={false} showCompass={false} />
        <AttributionControl position="bottom-left" compact />
      </MapView>,
    );
    await act(frame);
    expect(root.querySelectorAll("[data-ok-map-attribution]")).toHaveLength(1);
    expect(root.querySelector("[data-ok-map-attribution]")?.hasAttribute("data-ok-compact")).toBe(
      true,
    );
    expect(corner("top-right").querySelector("button")).toBeNull();
  });

  it("reports fullscreen, location and the fallback through props", async () => {
    vi.spyOn(navigator, "geolocation", "get").mockReturnValue({
      getCurrentPosition: (success: PositionCallback) =>
        success({ coords: { longitude: 1, latitude: 2, accuracy: 3 } } as GeolocationPosition),
      watchPosition: (_s: PositionCallback, error: PositionErrorCallback) => {
        setTimeout(() => error({ code: 1, message: "denied" } as GeolocationPositionError), 0);
        return 1;
      },
      clearWatch: () => {},
    } as unknown as Geolocation);
    vi.spyOn(document, "fullscreenEnabled", "get").mockReturnValue(false);
    const onFullscreenChange = vi.fn();
    const onGeolocate = vi.fn();
    const onError = vi.fn();
    const onTrackUserLocationStart = vi.fn();
    const onTrackUserLocationEnd = vi.fn();
    const { root, rerender } = await renderMap({
      onFullscreenChange,
      children: (
        <>
          <GeolocateControl onGeolocate={onGeolocate} onError={onError} />
          <FullscreenControl />
        </>
      ),
    });
    await act(frame);
    act(() => screen.getByRole("button", { name: "Enter fullscreen" }).click());
    expect(onFullscreenChange).toHaveBeenCalledWith(true);
    act(() => screen.getByRole("button", { name: "Find my location" }).click());
    expect(onGeolocate).toHaveBeenCalled();
    rerender(
      <MapView mapStyle={STYLE} onFullscreenChange={onFullscreenChange}>
        <GeolocateControl
          trackUserLocation
          onError={onError}
          onTrackUserLocationStart={onTrackUserLocationStart}
          onTrackUserLocationEnd={onTrackUserLocationEnd}
        />
      </MapView>,
    );
    await act(frame);
    act(() => (root.querySelector('[data-ok-map-action="geolocate"]') as HTMLElement).click());
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(onError).toHaveBeenCalled();
    expect(onTrackUserLocationStart).toHaveBeenCalled();
    expect(onTrackUserLocationEnd).toHaveBeenCalled();
  });

  it("shows the fallback without WebGL", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const onFallback = vi.fn();
    const { container } = render(
      <MapView mapStyle={STYLE} onFallback={onFallback} fallback="No map" />,
    );
    expect(onFallback).toHaveBeenCalledWith("webgl");
    expect(container.querySelector("[data-ok-map]")?.hasAttribute("data-ok-fallback")).toBe(true);
    expect(container.querySelector("[data-ok-map-fallback]")?.textContent).toBe("No map");
  });

  it("renders on the server without controls and survives StrictMode", async () => {
    const html = renderToString(
      <MapView mapStyle={STYLE} description="Server">
        <NavigationControl />
        <Marker longitude={1} latitude={2} />
        <Source id="s" type="geojson" data={POINTS}>
          <Layer id="l" type="circle" />
        </Source>
      </MapView>,
    );
    expect(html).toContain("data-ok-map-view");
    expect(html).toContain("data-ok-map-pin");
    expect(html).not.toContain("data-ok-map-action");
    render(
      <StrictMode>
        <MapView mapStyle={STYLE} />
      </StrictMode>,
    );
    await act(frame);
  });

  it("shares maps through MapProvider and useMap", async () => {
    render(
      <MapProvider>
        <MapView id="first" mapStyle={STYLE}>
          <Probe name="inside" />
        </MapView>
        <Probe name="outside" />
      </MapProvider>,
    );
    await act(frame);
    expect((seen["inside"] as { current?: MapRef }).current).toBeDefined();
    expect((seen["outside"] as { first?: MapRef }).first?.getMap()).not.toBeNull();
    expect((seen["outside"] as { current?: MapRef }).current).toBeUndefined();
    expect(first).toEqual([null, null]);
  });

  it("writes a generated description for description=auto (4.18.99)", async () => {
    const { container } = render(
      <MapView
        mapStyle={STYLE}
        description="auto"
        descriptionStrings={{ summary: "{count} zonas." }}
      >
        <div data-ok-map-regions="" data-ok-source="none">
          <table>
            <tbody>
              <tr data-ok-id="a">
                <th>Alpha</th>
                <td data-ok-value="2">2</td>
              </tr>
            </tbody>
          </table>
        </div>
      </MapView>,
    );
    const description = container.querySelector("[data-ok-map-description]") as HTMLElement;
    expect(description.hasAttribute("data-ok-auto")).toBe(true);
    await act(async () => {});
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(description.textContent).toMatch(/^1 zonas\. Values range from 2 in Alpha/);
  });

  it("can render controls in place (static rendering) and keeps bounds objects out of markup", () => {
    const { container } = render(
      <InlineCorners.Provider
        value={(position, children) => <section aria-label={position}>{children}</section>}
      >
        <MapView
          mapStyle={STYLE}
          initialViewState={{
            bounds: [
              [-10, -10],
              [10, 10],
            ],
          }}
        >
          <ScaleControl />
        </MapView>
      </InlineCorners.Provider>,
    );
    expect(
      container.querySelector('section[aria-label="bottom-left"] [data-ok-map-scale]'),
    ).not.toBeNull();
    expect(container.querySelector("[data-ok-map]")?.hasAttribute("data-ok-bounds")).toBe(false);
  });
});

describe("Marker, Popup, Source, Layer, MapPanel", () => {
  it("renders markers as buttons that click and drag", async () => {
    const onClick = vi.fn();
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const pinRef = createRef<HTMLDivElement>();
    const { root } = await renderMap({
      children: (
        <>
          <Marker
            longitude={-95}
            latitude={38}
            anchor="bottom"
            color="error"
            offset={[0, -4]}
            aria-label="Pin"
            ref={pinRef}
            onClick={onClick}
            draggable
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            scale={1.5}
            clickTolerance={8}
          />
          <Marker
            longitude={-90}
            latitude={35}
            rotation={30}
            rotationAlignment="map"
            pitchAlignment="viewport"
          >
            <span>Custom</span>
          </Marker>
        </>
      ),
    });
    const pin = screen.getByRole("button", { name: "Pin" });
    expect(pinRef.current).toBe(pin);
    expect(pin.getAttribute("data-ok-anchor")).toBe("bottom");
    expect(pin.getAttribute("data-ok-color")).toBe("error");
    expect(pin.getAttribute("data-ok-offset")).toBe("0,-4");
    expect(pin.getAttribute("tabindex")).toBe("0");
    expect(pin.getAttribute("data-ok-scale")).toBe("1.5");
    expect(pin.getAttribute("data-ok-click-tolerance")).toBe("8");
    expect(pin.style.getPropertyValue("--_ok-map-pin-scale")).toBe("1.5");
    expect(pin.querySelector("[data-ok-map-pin]")).not.toBeNull();
    const custom = root.querySelectorAll("[data-ok-map-marker]")[1] as HTMLElement;
    expect(custom.getAttribute("role")).toBeNull();
    expect(custom.getAttribute("data-ok-rotation-alignment")).toBe("map");
    expect(custom.textContent).toBe("Custom");
    act(() => pin.click());
    expect(onClick).toHaveBeenCalledTimes(1);
    act(() => pin.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })));
    expect(onDragStart).toHaveBeenCalledWith({ lngLat: { lng: -95, lat: 38 } });
    expect(onDrag).toHaveBeenCalled();
    expect(onDragEnd.mock.calls[0]?.[0].lngLat.lng).toBeLessThan(-95);
    // The click that ends a pointer drag is not a click.
    const pointer = (type: string, x: number) =>
      pin.dispatchEvent(
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: 0, button: 0, pointerId: 1 }),
      );
    act(() => {
      pointer("pointerdown", 0);
      pointer("pointermove", 30);
      pointer("pointerup", 30);
      pin.click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
    // Within the click tolerance a press stays a click (after the swallowed click's task).
    await new Promise((resolve) => setTimeout(resolve, 0));
    onDragStart.mockClear();
    act(() => {
      pointer("pointerdown", 0);
      pointer("pointermove", 6);
      pointer("pointerup", 6);
      pin.click();
    });
    expect(onDragStart).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("shows popups, closes them through onClose and focuses them", async () => {
    render(<Demo />);
    await act(frame);
    const marker = screen.getByRole("button", { name: "Open" });
    marker.focus();
    await act(async () => {
      marker.click();
      await frame();
    });
    const dialog = screen.getByRole("dialog", { name: "Info" });
    expect(popupRef.current).toBe(dialog);
    expect(dialog.getAttribute("data-ok-offset")).toBe("20");
    expect(dialog.getAttribute("data-ok-max-width")).toBe("20rem");
    // The popup's content is a Paper (map.css keeps its large radius).
    const content = dialog.querySelector("[data-ok-map-popup-content]") as HTMLElement;
    expect(content.dataset["okPaper"]).toBe("");
    expect(getComputedStyle(content).borderTopLeftRadius).toBe("12px");
    expect(screen.getByTestId("reason").textContent).toBe("open");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }));
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.getAttribute("data-ok-close-on-click")).toBe("false");
    expect(tooltip.getAttribute("data-ok-focus-after-open")).toBe("false");
    expect(tooltip.hasAttribute("data-ok-close-on-move")).toBe(true);
    expect(tooltip.querySelector("[data-ok-map-popup-close]")).toBeNull();
    await act(async () => {
      screen.getByRole("button", { name: "Close" }).click();
      await frame();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("reason").textContent).toBe("close-button");
    await act(frame);
    expect(document.activeElement).toBe(marker);
  });

  it("adds sources and layers, updates and removes them", async () => {
    const ref = createRef<MapRef>();
    const panel = (
      <MapPanel position="bottom-left" aria-label="Panel">
        Text
      </MapPanel>
    );
    const { rerender } = await renderMap(
      {
        children: (
          <>
            <Source id="points" type="geojson" data={POINTS}>
              <Layer id="dots" type="circle" paint={{ "circle-radius": 4 }} />
            </Source>
            <Layer type="background" />
            {panel}
          </>
        ),
      },
      ref,
    );
    await act(frame);
    const map = mapOf(ref);
    expect(map.getSource("points")).toBeDefined();
    expect(map.getLayer("dots")).toBeDefined();
    expect(map.getStyle().layers).toHaveLength(4);
    const base = { ref, mapStyle: STYLE, style: { width: 600, height: 400 } };
    rerender(
      <MapView {...base}>
        <Source id="points" type="geojson" data={{ ...POINTS, features: [] }}>
          <Layer id="dots" type="circle" paint={{ "circle-radius": 8 }} filter={["has", "name"]} />
        </Source>
        <Source type="geojson" data={POINTS} />
        <Layer id="loose" type="circle" source="points" beforeId="dots" />
      </MapView>,
    );
    await act(frame);
    expect(map.getPaintProperty("dots", "circle-radius")).toBe(8);
    expect(map.getFilter("dots")).toEqual(["has", "name"]);
    expect(map.getLayer("loose")).toBeDefined();
    rerender(<MapView {...base} />);
    await act(frame);
    expect(map.getSource("points")).toBeUndefined();
    expect(map.getLayer("loose")).toBeUndefined();
    rerender(<MapView {...base}>{panel}</MapView>);
    const node = screen.getByLabelText("Panel");
    expect(node.getAttribute("data-ok-position")).toBe("bottom-left");
    expect(node.getAttribute("data-ok-theme")).toBe("dark");
  });

  it("needs a Map around its parts", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Marker longitude={0} latitude={0} />)).toThrow(/inside a Map/);
  });
});
