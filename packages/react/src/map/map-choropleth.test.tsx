import { mapRegionLayers, mapScale, mapSizeScale, setMapWorkerUrl } from "@owlky/core/map";
import workerUrl from "@owlky/core/map-worker.js?url";
import { act, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { type MapRef, MapView } from "./map.js";
import {
  MapLegend,
  type MapLegendProps,
  MapRegions,
  type MapRegionsProps,
} from "./map-choropleth.js";
import { InlineCorners } from "./map-context.js";
import { Layer, type LayerProps, Source } from "./map-parts.js";

beforeAll(() => setMapWorkerUrl(workerUrl));
afterEach(() => vi.restoreAllMocks());

const STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    { id: "background", type: "background" as const, paint: { "background-color": "#d4dadc" } },
  ],
};
const box = (name: string, w: number, e: number) => ({
  type: "Feature" as const,
  properties: { name },
  geometry: {
    type: "Polygon" as const,
    coordinates: [
      [
        [w, 30],
        [e, 30],
        [e, 45],
        [w, 45],
        [w, 30],
      ],
    ],
  },
});
const DATA = {
  type: "FeatureCollection" as const,
  features: [box("A", -120, -100), box("B", -95, -80), box("C", -75, -70)],
};
const ROWS = [
  { id: "A", name: "Alpha", value: 2 },
  { id: "B", name: "Beta", value: 8 },
  { id: "C", name: "Gamma", value: null },
];
const scale = mapScale(
  ROWS.map((row) => row.value),
  { method: "threshold", thresholds: [5] },
);
const [fill, outline] = mapRegionLayers({ id: "boxes", source: "boxes", scale }) as unknown as [
  LayerProps,
  LayerProps,
];

function Choropleth({
  regions,
  legend,
  onLoad,
}: {
  regions?: Partial<MapRegionsProps>;
  legend?: Partial<MapLegendProps>;
  onLoad?: () => void;
}) {
  return (
    <MapView
      aria-label="Test choropleth"
      mapStyle={STYLE}
      initialViewState={{ longitude: -95, latitude: 38, zoom: 2 }}
      style={{ width: 600, height: 400 }}
      onLoad={onLoad}
    >
      <Source id="boxes" type="geojson" data={DATA} promoteId="name">
        <Layer {...fill} />
        <Layer {...outline} />
      </Source>
      <MapRegions
        id="regions"
        source="boxes"
        layer="boxes"
        data={ROWS}
        caption="Values"
        {...regions}
      />
      <MapLegend id="legend" scale={scale} title="Value" {...legend} />
    </MapView>
  );
}

async function renderChoropleth(props: Parameters<typeof Choropleth>[0] = {}) {
  let loaded: () => void = () => {};
  const done = new Promise<void>((resolve) => {
    loaded = resolve;
  });
  const view = render(<Choropleth {...props} onLoad={() => loaded()} />);
  await done;
  // The legend is portaled into its corner after mount.
  await act(async () => {});
  return { ...view, root: view.container.querySelector("[data-ok-map]") as HTMLElement };
}

describe("MapRegions and MapLegend", () => {
  it("renders the table, the list and the legend; the map fills the list", async () => {
    const { root } = await renderChoropleth();
    const table = screen.getByRole("table", { name: "Values" });
    expect(table.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(table.querySelector('tr[data-ok-id="A"] td')?.getAttribute("data-ok-value")).toBe("2");
    expect(table.querySelector('tr[data-ok-id="C"] td')?.textContent).toBe("No data");
    const list = screen.getByRole("listbox", { name: "Regions" });
    expect([...list.querySelectorAll('[role="option"]')].map((o) => o.textContent)).toEqual([
      "Alpha: 2",
      "Beta: 8",
      "Gamma: No data",
    ]);
    const legend = screen.getByRole("group", { name: "Value" });
    expect(legend.closest('[data-ok-map-corner="bottom-left"]')).not.toBeNull();
    expect(legend.getAttribute("data-ok-variant")).toBe("classes");
    const buttons = screen.getAllByRole("button", { pressed: false });
    expect(buttons.map((b) => b.textContent)).toEqual(["2 – 5", "5 – 8"]);
    const swatch = legend.querySelector("[data-ok-map-legend-swatch]") as HTMLElement;
    expect(swatch.style.getPropertyValue("--_ok-map-swatch")).toBe(
      "var(--ok-palette-primary-lighter)",
    );
    await expectNoAxeViolations(root);
  });

  it("reports selections and legend toggles", async () => {
    const onRegionSelect = vi.fn();
    const onLegendToggle = vi.fn();
    await renderChoropleth({ regions: { onRegionSelect }, legend: { onLegendToggle } });
    const list = screen.getByRole("listbox", { name: "Regions" });
    await userEvent.click(screen.getByRole("button", { name: "5 – 8" }));
    expect(onLegendToggle).toHaveBeenCalledWith({ classIndex: 1, active: [1] });
    expect(screen.getByRole("button", { name: "5 – 8" }).getAttribute("aria-pressed")).toBe("true");
    act(() => list.focus());
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onRegionSelect).toHaveBeenCalledWith({ id: "B" });
    await userEvent.keyboard("{Escape}");
    expect(onRegionSelect).toHaveBeenLastCalledWith({ id: null });
  });

  it("formats, names and labels: custom texts, gradient, static and no-data classes", async () => {
    const { root } = await renderChoropleth({
      regions: {
        formatValue: (value) => `${value} units`,
        listLabel: "Boxes",
        nameLabel: "Box",
        valueLabel: "Amount",
      },
      legend: { showNull: true, nullLabel: "Unknown", formatter: (item) => `≥ ${item.min}` },
    });
    expect(screen.getByRole("listbox", { name: "Boxes" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Amount" })).toBeTruthy();
    expect(root.querySelector('tr[data-ok-id="A"] td')?.textContent).toBe("2 units");
    expect(
      screen.getAllByRole("button").filter((b) => b.closest("[data-ok-map-legend]")),
    ).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Unknown" }).hasAttribute("data-ok-null")).toBe(true);
    expect(screen.getByRole("button", { name: "≥ 2" })).toBeTruthy();
  });

  it("renders static and gradient legends (static markup)", () => {
    const corners = (position: string, children: React.ReactNode) => (
      <div data-corner={position}>{children}</div>
    );
    const markup = renderToStaticMarkup(
      <InlineCorners.Provider value={corners}>
        <MapView>
          <MapLegend scale={scale} interactive={false} position="top-left" />
          <MapLegend
            scale={scale}
            variant="gradient"
            title="Gradient"
            tickFormatter={(value) => `${value}%`}
          />
        </MapView>
      </InlineCorners.Provider>,
    );
    const host = document.createElement("div");
    host.innerHTML = markup;
    const [plain, gradient] = host.querySelectorAll("[data-ok-map-legend]");
    expect(plain?.getAttribute("aria-label")).toBe("Legend");
    expect(plain?.getAttribute("data-ok-interactive")).toBe("false");
    expect(plain?.querySelector("button")).toBeNull();
    expect(plain?.querySelectorAll("span[data-ok-map-legend-class]")).toHaveLength(2);
    expect(plain?.closest('[data-corner="top-left"]')).not.toBeNull();
    expect(gradient?.getAttribute("data-ok-variant")).toBe("gradient");
    expect(gradient?.querySelectorAll("[data-ok-map-legend-stop]")).toHaveLength(2);
    expect(gradient?.querySelector("[data-ok-map-legend-ticks]")?.textContent).toBe("2%8%");
    expect(gradient?.closest('[data-corner="bottom-left"]')).not.toBeNull();
  });

  it("renders a size legend of nested circles", async () => {
    const sizeScale = mapSizeScale([1, 16], { range: [4, 20], legendValues: [16, 4] });
    const markup = renderToStaticMarkup(
      <InlineCorners.Provider
        value={(position, children) => <div data-corner={position}>{children}</div>}
      >
        <MapView>
          <MapLegend
            variant="size"
            sizeScale={sizeScale}
            title="Size"
            tickFormatter={(v) => `${v} t`}
          />
          <MapLegend variant="size" position="top-left" />
        </MapView>
      </InlineCorners.Provider>,
    );
    const host = document.createElement("div");
    host.innerHTML = markup;
    const [legend, empty] = host.querySelectorAll("[data-ok-map-legend]");
    expect(legend?.getAttribute("data-ok-variant")).toBe("size");
    const list = legend?.querySelector("[data-ok-map-legend-sizes]");
    expect(list?.getAttribute("data-ok-radius")).toBe("20");
    expect(
      [...(legend?.querySelectorAll("[data-ok-map-legend-circle]") ?? [])].map((c) =>
        c.getAttribute("data-ok-radius"),
      ),
    ).toEqual(["20", "9.33"]);
    expect(legend?.querySelector("li")?.textContent).toBe("16 t");
    expect(legend?.querySelector("button")).toBeNull();
    expect(empty?.querySelectorAll("li")).toHaveLength(0);
    // Mounted, the map sizes the circles and the legend passes axe.
    let loaded: () => void = () => {};
    const done = new Promise<void>((resolve) => {
      loaded = resolve;
    });
    const { container } = render(
      <MapView mapStyle={STYLE} style={{ width: 600, height: 400 }} onLoad={() => loaded()}>
        <MapLegend variant="size" sizeScale={sizeScale} title="Size" />
      </MapView>,
    );
    await done;
    await act(async () => {});
    const circle = container.querySelector<HTMLElement>("[data-ok-map-legend-circle]");
    expect(circle?.style.getPropertyValue("--_ok-map-radius")).toBe("20px");
    await expectNoAxeViolations(container);
  });

  it("unregisters parts that unmount", async () => {
    const onRegionSelect = vi.fn();
    const ref = { current: null as MapRef | null };
    const { rerender } = await renderChoropleth({ regions: { onRegionSelect } });
    rerender(
      <MapView
        ref={(node) => {
          ref.current = node;
        }}
        mapStyle={STYLE}
        style={{ width: 600, height: 400 }}
      />,
    );
    await act(async () => {});
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onRegionSelect).not.toHaveBeenCalled();
  });
});
