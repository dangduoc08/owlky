/*
 * Map regions and legends (spec: specs/components/map.md › Choropleth): the part of the map
 * controller that joins `[data-ok-map-regions]` tables to a source through feature state (`value`,
 * `hover`, `focus`, `selected`, `muted`), fills the regions' listbox (keyboard access, name and
 * value), handles the legends' class toggles and paints their swatches through CSSOM. Shared by
 * React and the HTML runtime: both render the same markup, this module writes the derived state.
 */
import type { MapLibreMap } from "maplibre-gl";

export interface MapRegionsHost {
  readonly element: HTMLElement;
  /** Elements of this map (not of nested maps) matching `selector`. */
  own<T extends HTMLElement = HTMLElement>(selector: string): T[];
  /** The map once its style is in, or `null`. */
  ready(): MapLibreMap | null;
  /** Writes private custom properties (CSSOM), skipping unchanged values. */
  write(node: HTMLElement, values: Record<string, string>): void;
  labels(): { noData: string; regions: string };
  onRegionSelect?: ((regions: HTMLElement, id: string | number | null) => void) | undefined;
  onLegendToggle?:
    | ((legend: HTMLElement, classIndex: number, active: readonly number[]) => void)
    | undefined;
}

export interface MapRegions {
  /** Re-reads tables, listboxes and legends (DOM changed). */
  scan(): void;
  /** Writes every feature state again (a style loaded). */
  apply(): void;
  /** Source data changed: writes the states again when a source was re-created. */
  sourceData(): void;
  /** Pointer moved over the map: hover state; returns whether a region is under it. */
  pointer(point: { x: number; y: number } | null): boolean;
  /** A click on the map: selects the region under it. */
  click(point: { x: number; y: number }): void;
  destroy(): void;
}

interface Row {
  readonly id: string | number;
  readonly key: string;
  readonly name: string;
  readonly value: number | null;
  readonly text: string;
}

interface Group {
  readonly root: HTMLElement;
  readonly source: string;
  readonly sourceLayer: string | undefined;
  readonly layer: string | undefined;
  readonly rows: Row[];
  readonly list: HTMLElement | null;
}

const SWATCH = /^var\(--ok-[a-z0-9-]+\)$/;
let generated = 0;

/** `"12"` → 12 (MapLibre's numeric ids); `"01"`, `"FRA"` stay strings. */
const featureId = (value: string): string | number => {
  const number = Number(value);
  return value.trim() !== "" && String(number) === value ? number : value;
};

const safeColor = (value: string | null): string | null => {
  if (!value) return null;
  const text = value.trim();
  if (SWATCH.test(text)) return text;
  if (/url\(|expression|;|[{}]/i.test(text)) return null;
  return CSS.supports("color", text) ? text : null;
};

const readRows = (table: HTMLTableElement | null): Row[] => {
  if (!table) return [];
  const rows: Row[] = [];
  for (const tr of table.querySelectorAll<HTMLTableRowElement>("tbody tr[data-ok-id]")) {
    const key = tr.getAttribute("data-ok-id") as string;
    const cell = tr.querySelector("td[data-ok-value], td");
    const raw = cell?.getAttribute("data-ok-value") ?? cell?.textContent ?? "";
    const number = raw.trim() === "" ? Number.NaN : Number(raw);
    rows.push({
      id: featureId(key),
      key,
      name: (tr.querySelector("th")?.textContent ?? key).trim(),
      value: Number.isFinite(number) ? number : null,
      text: (cell?.textContent ?? "").trim(),
    });
  }
  return rows;
};

export function createMapRegions(host: MapRegionsHost): MapRegions {
  const { element } = host;
  const abort = new AbortController();
  const { signal } = abort;
  let groups: Group[] = [];
  const built = new WeakMap<HTMLElement, string>();
  /** Feature states written per source, to clear the ones whose rows went away. */
  const applied = new Map<string, { source: unknown; ids: Set<string | number> }>();
  const selected = new WeakMap<HTMLElement, string>();
  const active = new WeakMap<HTMLElement, string>();
  let hovered: { group: Group; key: string } | null = null;
  let focused: Group | null = null;
  let typed = "";
  let typedAt = 0;

  const target = (group: Group, id: string | number) => ({
    source: group.source,
    id,
    ...(group.sourceLayer ? { sourceLayer: group.sourceLayer } : {}),
  });
  const setState = (group: Group, key: string, state: Record<string, unknown>) => {
    const map = host.ready();
    const row = group.rows.find((each) => each.key === key);
    if (!map || !row || !map.getSource(group.source)) return;
    map.setFeatureState(target(group, row.id), state);
  };

  // --- Legends ------------------------------------------------------------------------------------

  /** Pressed class ranges of every interactive legend of this map. */
  const pressedRanges = () => {
    const ranges: { min: number; max: number; last: boolean; none: boolean }[] = [];
    for (const legend of host.own("[data-ok-map-legend]")) {
      const buttons = [
        ...legend.querySelectorAll<HTMLElement>("button[data-ok-map-legend-class]"),
      ].filter((button) => !button.hasAttribute("data-ok-null"));
      const last = buttons.at(-1);
      for (const button of legend.querySelectorAll<HTMLElement>(
        'button[data-ok-map-legend-class][aria-pressed="true"]',
      ))
        ranges.push({
          min: Number(button.getAttribute("data-ok-min")),
          max: Number(button.getAttribute("data-ok-max")),
          last: button === last,
          none: button.hasAttribute("data-ok-null"),
        });
    }
    return ranges;
  };
  const isMuted = (value: number | null, ranges: ReturnType<typeof pressedRanges>): boolean => {
    if (ranges.length === 0) return false;
    return !ranges.some((range) =>
      value === null
        ? range.none
        : !range.none &&
          value >= range.min &&
          (value < range.max || (range.last && value <= range.max)),
    );
  };

  const paintLegends = () => {
    for (const legend of host.own("[data-ok-map-legend]")) {
      for (const swatch of legend.querySelectorAll<HTMLElement>("[data-ok-swatch]")) {
        const color = safeColor(swatch.getAttribute("data-ok-swatch"));
        host.write(swatch, { "--_ok-map-swatch": color ?? "" });
      }
      for (const bar of legend.querySelectorAll<HTMLElement>("[data-ok-map-legend-bar]")) {
        const colors = [...bar.querySelectorAll("[data-ok-map-legend-stop]")]
          .map((stop) => safeColor(stop.getAttribute("data-ok-swatch")))
          .filter((color): color is string => color !== null);
        host.write(bar, {
          "--_ok-map-gradient":
            colors.length > 1
              ? `linear-gradient(to right, ${colors.join(", ")})`
              : (colors[0] ?? ""),
        });
      }
      // Size legends (4.18.94): each circle's radius, and the largest for the list's box.
      for (const node of legend.querySelectorAll<HTMLElement>(
        "[data-ok-map-legend-sizes], [data-ok-map-legend-circle]",
      )) {
        const radius = Number(node.getAttribute("data-ok-radius"));
        const valid = Number.isFinite(radius) && radius >= 0 && radius <= 200;
        const name = node.hasAttribute("data-ok-map-legend-sizes")
          ? "--_ok-map-size-max"
          : "--_ok-map-radius";
        host.write(node, { [name]: valid ? `${radius}px` : "" });
      }
    }
  };

  // --- Listbox ------------------------------------------------------------------------------------

  const options = (group: Group) =>
    group.list ? [...group.list.querySelectorAll<HTMLElement>("[data-ok-map-region]")] : [];
  const optionOf = (group: Group, key: string) =>
    options(group).find((option) => option.getAttribute("data-ok-id") === key) ?? null;

  const buildList = (group: Group) => {
    const list = group.list;
    if (!list) return;
    if (!list.id) {
      generated++;
      list.id = group.root.id ? `${group.root.id}-list` : `ok-map-regions-${generated}`;
    }
    const { noData } = host.labels();
    const signature = JSON.stringify([list.id, noData, group.rows]);
    if (built.get(list) === signature) return;
    built.set(list, signature);
    const nodes = group.rows.map((row, index) => {
      const option = document.createElement("div");
      option.setAttribute("role", "option");
      option.id = `${list.id}-${index}`;
      option.setAttribute("data-ok-map-region", "");
      option.setAttribute("data-ok-id", row.key);
      option.setAttribute("aria-selected", String(selected.get(group.root) === row.key));
      option.textContent = `${row.name}: ${row.value === null ? noData : row.text || String(row.value)}`;
      return option;
    });
    list.replaceChildren(...nodes);
    if (!list.hasAttribute("aria-label") && !list.hasAttribute("aria-labelledby"))
      list.setAttribute("aria-label", host.labels().regions);
    const current = active.get(group.root);
    if (current !== undefined && group.rows.some((row) => row.key === current))
      markActive(group, current, false);
    else {
      active.delete(group.root);
      list.removeAttribute("aria-activedescendant");
    }
  };

  const markActive = (group: Group, key: string, focus: boolean) => {
    const previous = active.get(group.root);
    if (previous !== undefined && previous !== key) {
      optionOf(group, previous)?.removeAttribute("data-ok-active");
      setState(group, previous, { focus: false });
    }
    active.set(group.root, key);
    const option = optionOf(group, key);
    option?.setAttribute("data-ok-active", "");
    if (option) group.list?.setAttribute("aria-activedescendant", option.id);
    if (focus) setState(group, key, { focus: true });
  };

  const select = (group: Group, key: string | null) => {
    const previous = selected.get(group.root) ?? null;
    const next = previous === key ? null : key;
    if (previous !== null) {
      optionOf(group, previous)?.setAttribute("aria-selected", "false");
      setState(group, previous, { selected: false });
    }
    if (next === null) selected.delete(group.root);
    else {
      selected.set(group.root, next);
      optionOf(group, next)?.setAttribute("aria-selected", "true");
      setState(group, next, { selected: true });
    }
    // `next` always differs from `previous` (a second press clears).
    const row = group.rows.find((each) => each.key === next);
    host.onRegionSelect?.(group.root, row ? row.id : null);
  };

  // --- Feature states -------------------------------------------------------------------------

  const apply = () => {
    const map = host.ready();
    if (!map) return;
    const ranges = pressedRanges();
    const seen = new Map<string, Set<string | number>>();
    for (const group of groups) {
      const source = map.getSource(group.source);
      if (!source) continue;
      const scope = `${group.source}\u0000${group.sourceLayer ?? ""}`;
      const ids = seen.get(scope) ?? new Set();
      seen.set(scope, ids);
      const pick = selected.get(group.root);
      const current = active.get(group.root);
      for (const row of group.rows) {
        ids.add(row.id);
        map.setFeatureState(target(group, row.id), {
          value: row.value,
          muted: isMuted(row.value, ranges),
          selected: row.key === pick,
          hover: hovered?.group.root === group.root && hovered.key === row.key,
          focus: focused === group && row.key === current,
        });
      }
      const before = applied.get(scope);
      if (before && before.source === source)
        for (const id of before.ids)
          if (!ids.has(id))
            map.removeFeatureState({
              source: group.source,
              id,
              ...(group.sourceLayer ? { sourceLayer: group.sourceLayer } : {}),
            });
      applied.set(scope, { source, ids });
    }
  };

  /** A source was re-created (its feature states are gone): write them again. */
  const sourceChanged = () => {
    const map = host.ready();
    if (!map) return;
    for (const [scope, entry] of applied) {
      const id = scope.split("\u0000")[0] as string;
      if (map.getSource(id) !== entry.source) {
        apply();
        return;
      }
    }
  };

  // --- Scan -----------------------------------------------------------------------------------

  const scan = () => {
    const previous = new Map(groups.map((group) => [group.root, group]));
    groups = host.own("[data-ok-map-regions]").map((root) => ({
      root,
      source: root.getAttribute("data-ok-source") ?? "",
      sourceLayer: root.getAttribute("data-ok-source-layer") ?? undefined,
      layer: root.getAttribute("data-ok-layer") ?? undefined,
      rows: readRows(root.querySelector<HTMLTableElement>("table")),
      list: root.querySelector<HTMLElement>("[data-ok-map-regions-list]"),
    }));
    for (const group of groups) {
      const before = previous.get(group.root);
      if (before && focused === before) focused = group;
      if (hovered && hovered.group.root === group.root) hovered = { group, key: hovered.key };
      const pick = selected.get(group.root);
      if (pick !== undefined && !group.rows.some((row) => row.key === pick))
        selected.delete(group.root);
      buildList(group);
    }
    paintLegends();
    apply();
  };

  // --- Pointer --------------------------------------------------------------------------------

  const hit = (point: { x: number; y: number }) => {
    const map = host.ready();
    if (!map) return null;
    for (const group of groups) {
      if (!group.layer || !map.getLayer(group.layer)) continue;
      const features = map.queryRenderedFeatures([point.x, point.y], { layers: [group.layer] });
      for (const feature of features) {
        if (feature.id === undefined) continue;
        const key = String(feature.id);
        if (group.rows.some((row) => row.key === key)) return { group, key };
      }
    }
    return null;
  };

  const setHover = (next: { group: Group; key: string } | null) => {
    if (hovered?.group.root === next?.group.root && hovered?.key === next?.key) return;
    if (hovered) {
      setState(hovered.group, hovered.key, { hover: false });
      optionOf(hovered.group, hovered.key)?.removeAttribute("data-ok-hovered");
      hovered.group.list?.removeAttribute("data-ok-hovering");
    }
    hovered = next;
    if (next) {
      setState(next.group, next.key, { hover: true });
      optionOf(next.group, next.key)?.setAttribute("data-ok-hovered", "");
      next.group.list?.setAttribute("data-ok-hovering", "");
    }
  };

  // --- Keyboard (the listbox) -----------------------------------------------------------------

  const groupOf = (node: EventTarget | null) => {
    const list = node instanceof Element ? node.closest("[data-ok-map-regions-list]") : null;
    return list ? (groups.find((group) => group.list === list) ?? null) : null;
  };

  element.addEventListener(
    "focusin",
    (event) => {
      const group = groupOf(event.target);
      if (!group || group.rows.length === 0) return;
      focused = group;
      const key = active.get(group.root) ?? selected.get(group.root) ?? (group.rows[0] as Row).key;
      markActive(group, key, true);
    },
    { signal },
  );
  element.addEventListener(
    "focusout",
    (event) => {
      const group = groupOf(event.target);
      if (!group || focused !== group) return;
      focused = null;
      const key = active.get(group.root);
      if (key !== undefined) setState(group, key, { focus: false });
    },
    { signal },
  );
  element.addEventListener(
    "keydown",
    (event) => {
      const group = groupOf(event.target);
      if (!group || group.rows.length === 0 || event.altKey || event.ctrlKey || event.metaKey)
        return;
      const keys = group.rows.map((row) => row.key);
      const index = Math.max(0, keys.indexOf(active.get(group.root) ?? ""));
      let next: number | null = null;
      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
          next = Math.min(keys.length - 1, index + 1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          next = Math.max(0, index - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = keys.length - 1;
          break;
        case "PageDown":
          next = Math.min(keys.length - 1, index + 10);
          break;
        case "PageUp":
          next = Math.max(0, index - 10);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          select(group, keys[index] as string);
          return;
        case "Escape":
          if (selected.has(group.root)) {
            event.preventDefault();
            select(group, null);
          }
          return;
        default:
          if (event.key.length === 1 && /\S/.test(event.key)) {
            const now = Date.now();
            typed = now - typedAt > 700 ? event.key : typed + event.key;
            typedAt = now;
            const query = typed.toLocaleLowerCase();
            const rows = group.rows;
            const start = typed.length === 1 ? index + 1 : index;
            for (let step = 0; step < rows.length; step++) {
              const at = (start + step) % rows.length;
              if ((rows[at] as Row).name.toLocaleLowerCase().startsWith(query)) {
                next = at;
                break;
              }
            }
          }
      }
      if (next === null) return;
      event.preventDefault();
      markActive(group, keys[next] as string, true);
    },
    { signal },
  );

  // Legend class toggles (interactive legends render buttons).
  element.addEventListener(
    "click",
    (event) => {
      const button = (event.target as Element).closest<HTMLElement>(
        "button[data-ok-map-legend-class]",
      );
      const legend = button?.closest<HTMLElement>("[data-ok-map-legend]");
      if (!button || !legend || legend.closest("[data-ok-map]") !== element) return;
      if (legend.getAttribute("data-ok-interactive") === "false") return;
      const pressed = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!pressed));
      const buttons = [...legend.querySelectorAll("button[data-ok-map-legend-class]")];
      const activeClasses = buttons
        .map((each, index) => (each.getAttribute("aria-pressed") === "true" ? index : -1))
        .filter((index) => index >= 0);
      apply();
      host.onLegendToggle?.(legend, buttons.indexOf(button), activeClasses);
    },
    { signal },
  );

  // Options are not focusable (aria-activedescendant): a press picks the option's region.
  element.addEventListener(
    "click",
    (event) => {
      const option = (event.target as Element).closest<HTMLElement>("[data-ok-map-region]");
      const group = groupOf(option);
      if (!option || !group) return;
      const key = option.getAttribute("data-ok-id") as string;
      markActive(group, key, focused === group);
      select(group, key);
    },
    { signal },
  );

  return {
    scan,
    apply,
    sourceData: sourceChanged,
    pointer(point) {
      const next = point ? hit(point) : null;
      setHover(next);
      return next !== null;
    },
    click(point) {
      const found = hit(point);
      if (found) select(found.group, found.key);
    },
    destroy() {
      abort.abort();
    },
  };
}
