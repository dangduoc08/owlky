/*
 * HTML map stories: page scripts (what a page would write) and their Code panel source.
 * Each registers the Map on the runtime, wires the story's panel and returns its cleanup.
 */
import { getRuntime, type MapInstance, map } from "@owlky/html";
import type { HtmlGroup } from "../../helpers/groups.js";
import { DAYS, dayLabel, MAP_STYLES, pointOnCircle, regionFilter } from "./map-data.js";

type Script = NonNullable<HtmlGroup["script"]>;

const REGISTER = `import "@owlky/html/map"; // or <script src="…/owlky-map.js"> after owlky.js`;

/** Mounts the map(s) of a story row and returns them with their instances. */
function mount(row: HTMLElement) {
  const runtime = getRuntime().register(map);
  runtime.init(row);
  const roots = [...row.querySelectorAll<HTMLElement>("[data-ok-map]")];
  return roots.map((root) => ({ root, map: runtime.get<MapInstance>(root, "map") }));
}

/** The story's (first) map. */
function first(row: HTMLElement) {
  const [entry] = mount(row);
  if (!entry) throw new Error("The story has no map.");
  return entry;
}

/** What pointer events report about a feature (GeoJSON). */
interface MapFeature {
  geometry: { type: string; coordinates: unknown };
  properties?: Record<string, unknown> | null;
}

/** Adds listeners and returns one function that removes them all. */
function listen(
  entries: [EventTarget | null | undefined, string, (event: Event) => void][],
): () => void {
  for (const [target, type, handler] of entries) target?.addEventListener(type, handler);
  return () => {
    for (const [target, type, handler] of entries) target?.removeEventListener(type, handler);
  };
}

const changeTheme: Script = (row) => {
  const { root } = first(row);
  return listen([
    [
      row,
      "change",
      (event) => {
        const input = event.target as HTMLInputElement;
        if (input.name !== "map-theme-style") return;
        root.setAttribute("data-ok-map-style", MAP_STYLES[input.value as keyof typeof MAP_STYLES]);
      },
    ],
  ]);
};

const draggable: Script = (row) => {
  const { root } = first(row);
  const marker = root.querySelector<HTMLElement>("[data-ok-map-marker]");
  const fields = root.querySelectorAll<HTMLElement>(".sb-map-events dd");
  const show = (index: number) => (event: Event) => {
    const { lng, lat } = (event as CustomEvent<{ lngLat: { lng: number; lat: number } }>).detail
      .lngLat;
    const field = fields[index];
    if (field) field.textContent = `${lng.toFixed(5)}, ${lat.toFixed(5)}`;
  };
  return listen([
    [marker, "ok:map:markerdragstart", show(0)],
    [marker, "ok:map:markerdrag", show(1)],
    [marker, "ok:map:markerdragend", show(2)],
    [
      root,
      "ok:map:click",
      (event) => {
        // A click places the marker too (a way to move it without dragging).
        const lngLat = (event as CustomEvent<{ lngLat?: { lng: number; lat: number } }>).detail
          .lngLat;
        if (!lngLat || !marker) return;
        marker.setAttribute("data-ok-longitude", String(lngLat.lng));
        marker.setAttribute("data-ok-latitude", String(lngLat.lat));
      },
    ],
  ]);
};

const animation: Script = (row) => {
  const { map: instance } = first(row);
  const button = row.querySelector<HTMLButtonElement>("[data-ok-map-panel] button");
  const text = button?.querySelector("[data-ok-button-label]");
  let playing = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let angle = 0;
  let frame = 0;
  let last = performance.now();
  const tick = (now: number) => {
    angle += (now - last) / 1000;
    last = now;
    instance?.setSourceData("point", pointOnCircle(angle));
    frame = requestAnimationFrame(tick);
  };
  const update = () => {
    cancelAnimationFrame(frame);
    if (text) text.textContent = playing ? "Pause" : "Play";
    if (!playing) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };
  update();
  const off = listen([
    [
      button,
      "click",
      () => {
        playing = !playing;
        update();
      },
    ],
  ]);
  return () => {
    cancelAnimationFrame(frame);
    off();
  };
};

const clusters: Script = (row) => {
  const { root, map: instance } = first(row);
  return listen([
    [
      root,
      "ok:map:click",
      async (event) => {
        // A click on a cluster zooms in until it breaks apart.
        const feature = (event as CustomEvent<{ features?: MapFeature[] }>).detail.features?.[0];
        if (!instance || !feature || feature.geometry.type !== "Point") return;
        const zoom = await instance.getClusterExpansionZoom(
          "earthquakes",
          Number(feature.properties?.["cluster_id"]),
        );
        instance.easeTo({ center: feature.geometry.coordinates as [number, number], zoom });
      },
    ],
  ]);
};

const HANDLER_ATTRIBUTES: Record<string, string> = {
  "Box zoom": "data-ok-box-zoom",
  "Drag pan": "data-ok-drag-pan",
  Keyboard: "data-ok-keyboard",
  "Scroll zoom": "data-ok-scroll-zoom",
  "Drag rotate": "data-ok-drag-rotate",
  "Touch pitch": "data-ok-touch-pitch",
  "Double click zoom": "data-ok-double-click-zoom",
  "Touch zoom rotate": "data-ok-touch-zoom-rotate",
};

const interaction: Script = (row) => {
  const { root } = first(row);
  return listen([
    [
      root,
      "change",
      (event) => {
        const input = event.target as HTMLInputElement;
        const label = input.closest("label")?.textContent?.trim() ?? "";
        const attribute = HANDLER_ATTRIBUTES[label];
        if (input.type === "checkbox" && attribute) {
          if (input.checked) root.removeAttribute(attribute);
          else root.setAttribute(attribute, "false");
        }
      },
    ],
    [
      root,
      "input",
      (event) => {
        const input = event.target as HTMLInputElement;
        const key = /^map-interaction-(\w+)$/.exec(input.id)?.[1];
        if (!key || input.value === "" || !Number.isFinite(Number(input.value))) return;
        root.setAttribute(
          `data-ok-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
          input.value,
        );
      },
    ],
  ]);
};

const highlight: Script = (row) => {
  const { root } = first(row);
  const layer = root.querySelector('[data-ok-map-layer][data-ok-id="states-highlight"]');
  const popup = root.querySelector<HTMLElement>("#map-highlight-popup");
  const [title, region] = popup?.querySelectorAll("p") ?? [];
  const hide = () => {
    layer?.setAttribute("data-ok-filter", JSON.stringify(regionFilter("")));
    if (popup) popup.hidden = true;
  };
  return listen([
    [
      root,
      "ok:map:mousemove",
      (event) => {
        const { features, lngLat } = (
          event as CustomEvent<{
            features?: MapFeature[];
            lngLat?: { lng: number; lat: number };
          }>
        ).detail;
        const feature = features?.[0];
        if (!feature || !lngLat || !popup) return hide();
        const name = String(feature.properties?.["name"]);
        const area = String(feature.properties?.["region"]);
        layer?.setAttribute("data-ok-filter", JSON.stringify(regionFilter(area)));
        if (title) title.textContent = name;
        if (region) region.textContent = `Region: ${area}`;
        popup.setAttribute("data-ok-longitude", String(lngLat.lng));
        popup.setAttribute("data-ok-latitude", String(lngLat.lat));
        popup.hidden = false;
      },
    ],
    [root, "ok:map:mouseleave", hide],
  ]);
};

const heatmap: Script = (row) => {
  const { root } = first(row);
  const layer = root.querySelector('[data-ok-map-layer][data-ok-id="heatmap"]');
  const toggle = root.querySelector<HTMLInputElement>("[data-ok-switch] input");
  const range = root.querySelector<HTMLInputElement>("[data-ok-slider] input");
  const label = root.querySelector("#map-heatmap-day");
  let day = 8;
  const update = () => {
    const selected = DAYS[day - 1] as string;
    if (label) label.textContent = `Each day: ${dayLabel(selected)}`;
    if (toggle?.checked) layer?.removeAttribute("data-ok-filter");
    else layer?.setAttribute("data-ok-filter", JSON.stringify(["==", ["get", "day"], selected]));
    const slider = range?.closest("[data-ok-slider]");
    slider?.toggleAttribute("data-ok-disabled", toggle?.checked === true);
    if (range) range.disabled = toggle?.checked === true;
  };
  return listen([
    [toggle, "change", update],
    [
      root,
      "ok:slider:change",
      (event) => {
        day = (event as CustomEvent<{ value: number }>).detail.value;
        update();
      },
    ],
  ]);
};

const sideBySide: Script = (row) => {
  const maps = mount(row);
  const compare = row.querySelector<HTMLElement>(".sb-map-compare");
  let active = maps[0]?.root;
  const follow = (event: Event) => {
    const source = event.currentTarget as HTMLElement;
    if (source !== active) return;
    const { viewState } = (event as CustomEvent<{ viewState: Record<string, number> }>).detail;
    for (const { root, map: instance } of maps)
      if (root !== source)
        instance?.jumpTo({
          center: [viewState["longitude"] as number, viewState["latitude"] as number],
          zoom: viewState["zoom"] as number,
          pitch: viewState["pitch"] as number,
          bearing: viewState["bearing"] as number,
        });
  };
  const lead = (event: Event) => {
    active = event.currentTarget as HTMLElement;
  };
  return listen([
    ...maps.flatMap(({ root }) => [
      [root, "ok:map:move", follow] as [EventTarget, string, (event: Event) => void],
      [root, "pointerenter", lead] as [EventTarget, string, (event: Event) => void],
      [root, "focusin", lead] as [EventTarget, string, (event: Event) => void],
    ]),
    [
      row,
      "ok:toggle-group:change",
      (event) => {
        const { value } = (event as CustomEvent<{ value: string | null }>).detail;
        if (!value || !compare) return;
        compare.classList.toggle("sb-map-compare--side-by-side", value === "side-by-side");
        compare.classList.toggle("sb-map-compare--split-screen", value === "split-screen");
      },
    ],
  ]);
};

export const MAP_SCRIPTS: Record<string, Pick<HtmlGroup, "script" | "scriptSource">> = {
  "change-theme": {
    script: changeTheme,
    scriptSource: `${REGISTER}

const map = document.querySelector("#map-theme");
// The radios switch the map's style.
const styles = {
  light: "${MAP_STYLES.light}",
  dark: "${MAP_STYLES.dark}",
  streets: "${MAP_STYLES.streets}",
};
map.addEventListener("change", (event) => {
  if (event.target.name === "map-theme-style")
    map.setAttribute("data-ok-map-style", styles[event.target.value]);
});`,
  },
  "markers-popups": {
    scriptSource: `${REGISTER}
// Each marker opens its popup through data-ok-map-popup-open: no other script.`,
  },
  "draggable-markers": {
    script: draggable,
    scriptSource: `${REGISTER}

const map = document.querySelector("#map-draggable");
const marker = map.querySelector("[data-ok-map-marker]");
const [start, drag, end] = map.querySelectorAll(".sb-map-events dd");
const format = ({ lng, lat }) => \`\${lng.toFixed(5)}, \${lat.toFixed(5)}\`;
// The runtime moves the marker and stores its position in its attributes.
marker.addEventListener("ok:map:markerdragstart", (e) => (start.textContent = format(e.detail.lngLat)));
marker.addEventListener("ok:map:markerdrag", (e) => (drag.textContent = format(e.detail.lngLat)));
marker.addEventListener("ok:map:markerdragend", (e) => (end.textContent = format(e.detail.lngLat)));
// A click places the marker too.
map.addEventListener("ok:map:click", ({ detail: { lngLat } }) => {
  marker.setAttribute("data-ok-longitude", lngLat.lng);
  marker.setAttribute("data-ok-latitude", lngLat.lat);
});`,
  },
  "geojson-animation": {
    script: animation,
    scriptSource: `import { getRuntime } from "@owlky/html";
${REGISTER}

const element = document.querySelector("#map-animation");
const map = getRuntime().get(element, "map");
const button = element.querySelector("[data-ok-map-panel] button");
// Moving content can be paused; it starts paused with reduced motion.
let playing = !matchMedia("(prefers-reduced-motion: reduce)").matches;
let angle = 0;
let last = performance.now();
const tick = (now) => {
  if (!playing) return;
  angle += (now - last) / 1000;
  last = now;
  map.setSourceData("point", {
    type: "Point",
    coordinates: [Math.cos(angle) * 20, Math.sin(angle) * 20],
  });
  requestAnimationFrame(tick);
};
const update = () => {
  button.querySelector("[data-ok-button-label]").textContent = playing ? "Pause" : "Play";
  last = performance.now();
  if (playing) requestAnimationFrame(tick);
};
button.addEventListener("click", () => {
  playing = !playing;
  update();
});
update();`,
  },
  clusters: {
    script: clusters,
    scriptSource: `import { getRuntime } from "@owlky/html";
${REGISTER}

const element = document.querySelector("#map-clusters");
// A click on a cluster zooms in until it breaks apart.
element.addEventListener("ok:map:click", async ({ detail }) => {
  const feature = detail.features?.[0];
  if (!feature) return;
  const map = getRuntime().get(element, "map");
  const zoom = await map.getClusterExpansionZoom("earthquakes", feature.properties.cluster_id);
  map.easeTo({ center: feature.geometry.coordinates, zoom });
});`,
  },
  interaction: {
    script: interaction,
    scriptSource: `${REGISTER}

const map = document.querySelector("#map-interaction");
// Each switch turns a way of moving the map on or off: data-ok-<handler>="false".
const handlers = {
  "Box zoom": "data-ok-box-zoom",
  "Drag pan": "data-ok-drag-pan",
  Keyboard: "data-ok-keyboard",
  "Scroll zoom": "data-ok-scroll-zoom",
  "Drag rotate": "data-ok-drag-rotate",
  "Touch pitch": "data-ok-touch-pitch",
  "Double click zoom": "data-ok-double-click-zoom",
  "Touch zoom rotate": "data-ok-touch-zoom-rotate",
};
map.addEventListener("change", (event) => {
  const attribute = handlers[event.target.closest("label")?.textContent.trim()];
  if (!attribute) return;
  if (event.target.checked) map.removeAttribute(attribute);
  else map.setAttribute(attribute, "false");
});
// The limits: data-ok-min-zoom, data-ok-max-zoom, data-ok-min-pitch, data-ok-max-pitch.
map.addEventListener("input", (event) => {
  const key = /^map-interaction-(\\w+)$/.exec(event.target.id)?.[1]; // minZoom → data-ok-min-zoom
  if (key && event.target.value !== "")
    map.setAttribute(\`data-ok-\${key.replace(/[A-Z]/g, (c) => \`-\${c.toLowerCase()}\`)}\`, event.target.value);
});`,
  },
  "viewport-animation": {
    scriptSource: `${REGISTER}
// Each radio flies the map through data-ok-map-fly-to="map-viewport" and
// data-ok-view="longitude,latitude,zoom": no other script.`,
  },
  "highlight-by-filter": {
    script: highlight,
    scriptSource: `${REGISTER}

const map = document.querySelector("#map-highlight");
const layer = map.querySelector('[data-ok-map-layer][data-ok-id="states-highlight"]');
const popup = map.querySelector("#map-highlight-popup");
const [title, region] = popup.querySelectorAll("p");
const hide = () => {
  layer.setAttribute("data-ok-filter", '["==",["get","region"],""]');
  popup.hidden = true;
};
// Interactive layers (data-ok-interactive-layer-ids) report the features under the pointer.
map.addEventListener("ok:map:mousemove", ({ detail: { features, lngLat } }) => {
  const feature = features?.[0];
  if (!feature) return hide();
  const { name, region: area } = feature.properties;
  layer.setAttribute("data-ok-filter", JSON.stringify(["==", ["get", "region"], area]));
  title.textContent = name;
  region.textContent = \`Region: \${area}\`;
  popup.setAttribute("data-ok-longitude", lngLat.lng);
  popup.setAttribute("data-ok-latitude", lngLat.lat);
  popup.hidden = false;
});
map.addEventListener("ok:map:mouseleave", hide);`,
  },
  heatmap: {
    script: heatmap,
    scriptSource: `${REGISTER}

const map = document.querySelector("#map-heatmap");
const layer = map.querySelector('[data-ok-map-layer][data-ok-id="heatmap"]');
const allDays = map.querySelector("[data-ok-switch] input");
const label = map.querySelector("#map-heatmap-day");
let day = "2025-10-08";
const update = () => {
  label.textContent = \`Each day: \${day.slice(8)} Oct 2025\`;
  // The layer's filter is markup: the runtime applies changes.
  if (allDays.checked) layer.removeAttribute("data-ok-filter");
  else layer.setAttribute("data-ok-filter", JSON.stringify(["==", ["get", "day"], day]));
};
allDays.addEventListener("change", update);
map.addEventListener("ok:slider:change", (event) => {
  day = \`2025-10-\${String(event.detail.value).padStart(2, "0")}\`;
  update();
});`,
  },
  "side-by-side": {
    script: sideBySide,
    scriptSource: `import { getRuntime } from "@owlky/html";
${REGISTER}

const maps = [...document.querySelectorAll(".sb-map-compare [data-ok-map]")];
// The map under the pointer leads; the other one jumps to its view.
let active = maps[0];
for (const element of maps) {
  element.addEventListener("pointerenter", () => (active = element));
  element.addEventListener("focusin", () => (active = element));
  element.addEventListener("ok:map:move", ({ detail: { viewState: v } }) => {
    if (element !== active) return;
    for (const other of maps)
      if (other !== element)
        getRuntime().get(other, "map").jumpTo({
          center: [v.longitude, v.latitude], zoom: v.zoom, pitch: v.pitch, bearing: v.bearing,
        });
  });
}`,
  },
};
