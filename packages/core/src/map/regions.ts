/*
 * Map regions and legends (spec: specs/components/map.md › Choropleth): the part of the map
 * controller that joins `[data-ok-map-regions]` tables to a source through feature state (`value`,
 * `hover`, `focus`, `selected`, `muted`), fills the regions' listbox (keyboard access, name and
 * value), handles the legends' class toggles and paints their swatches through CSSOM. Shared by
 * React and the HTML runtime: both render the same markup, this module writes the derived state.
 * ADR-0065 (roadmap 4.18.98): multiple selection, Shift + drag box selection by label anchor, and
 * linked maps whose selection filters the other members of a `group` (a module-scoped registry).
 */
import type { MapLibreMap } from "maplibre-gl";
import { type GeoDescriptionKind, type GeoDescriptionStrings, geoDescription } from "./describe.js";

export interface MapRegionsHost {
  readonly element: HTMLElement;
  /** Elements of this map (not of nested maps) matching `selector`. */
  own<T extends HTMLElement = HTMLElement>(selector: string): T[];
  /** The map once its style is in, or `null`. */
  ready(): MapLibreMap | null;
  /** Writes private custom properties (CSSOM), skipping unchanged values. */
  write(node: HTMLElement, values: Record<string, string>): void;
  labels(): { noData: string; regions: string };
  /** The selection changed: `id` is the region toggled (`null`: cleared), `ids` every selected one. */
  onRegionSelect?:
    | ((regions: HTMLElement, id: string | number | null, ids: (string | number)[]) => void)
    | undefined;
  /** Texts of generated descriptions (`p[data-ok-map-description][data-ok-auto]`). */
  descriptionStrings?: (() => Partial<GeoDescriptionStrings> | undefined) | undefined;
  /** `true` while a regions group asks for box selection: Shift + drag must not zoom. */
  blockBoxZoom?: ((blocked: boolean) => void) | undefined;
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
  /** Writes the generated description again (its texts changed). */
  describe(): void;
  /** Sets the selection of a `[data-ok-map-regions]` part (ids that aren't rows are ignored). */
  setSelection(regions: HTMLElement, ids: readonly (string | number)[]): void;
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
  /** Several regions can be selected (`data-ok-multiple`, implied by `boxSelect`). */
  readonly multiple: boolean;
  /** Shift + drag selects the regions whose label anchor is in the box (`data-ok-box-select`). */
  readonly boxSelect: boolean;
  /** The link group (`data-ok-group`). */
  readonly link: string | undefined;
  /** `bidirectional` (default), `emit` or `receive` (`data-ok-link-filter`). */
  readonly linkFilter: "bidirectional" | "emit" | "receive";
}

/** A regions group of any map of the page in the link registry. */
interface LinkMember {
  readonly root: HTMLElement;
  readonly link: string;
  receive(filter: { source: HTMLElement; keys: ReadonlySet<string> } | null): void;
}

/** Linked maps (ADR-0065): members and the current filter of each group (module scope, ADR-0007). */
const linkMembers = new Map<string, Set<LinkMember>>();
const linkFilters = new Map<string, { source: HTMLElement; keys: ReadonlySet<string> }>();
const broadcast = (link: string) => {
  const filter = linkFilters.get(link) ?? null;
  for (const member of linkMembers.get(link) ?? []) member.receive(filter);
};

/** A boolean attribute: present and not `"false"`. */
const flag = (element: Element, name: string) =>
  element.hasAttribute(name) && element.getAttribute(name) !== "false";

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
  const selected = new WeakMap<HTMLElement, Set<string>>();
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
  const selectionOf = (group: Group) => selected.get(group.root) ?? new Set<string>();

  /** Options outside the group filter a linked map received: dimmed (`data-ok-muted`). */
  const markFiltered = (group: Group) => {
    const filter = received.get(group.root) ?? null;
    for (const option of options(group)) {
      const key = option.getAttribute("data-ok-id") as string;
      option.toggleAttribute("data-ok-muted", filter !== null && !filter.has(key));
    }
  };

  const buildList = (group: Group) => {
    const list = group.list;
    if (!list) return;
    if (group.multiple) list.setAttribute("aria-multiselectable", "true");
    else list.removeAttribute("aria-multiselectable");
    if (!list.id) {
      generated++;
      list.id = group.root.id ? `${group.root.id}-list` : `ok-map-regions-${generated}`;
    }
    const { noData } = host.labels();
    const signature = JSON.stringify([list.id, noData, group.rows]);
    if (built.get(list) === signature) {
      markFiltered(group);
      return;
    }
    built.set(list, signature);
    const picked = selectionOf(group);
    const nodes = group.rows.map((row, index) => {
      const option = document.createElement("div");
      option.setAttribute("role", "option");
      option.id = `${list.id}-${index}`;
      option.setAttribute("data-ok-map-region", "");
      option.setAttribute("data-ok-id", row.key);
      option.setAttribute("aria-selected", String(picked.has(row.key)));
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
    markFiltered(group);
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

  /**
   * Replaces the group's selection with `keys` (row order kept), writes the options and feature
   * states that changed and reports once: `last` is the region toggled (`null`: cleared).
   */
  const setSelection = (group: Group, keys: Iterable<string>, last: string | null) => {
    const previous = selectionOf(group);
    const wanted = new Set(keys);
    const next = new Set(group.rows.map((row) => row.key).filter((key) => wanted.has(key)));
    const same = next.size === previous.size && [...next].every((key) => previous.has(key));
    if (same) return;
    for (const key of previous)
      if (!next.has(key)) {
        optionOf(group, key)?.setAttribute("aria-selected", "false");
        setState(group, key, { selected: false });
      }
    for (const key of next)
      if (!previous.has(key)) {
        optionOf(group, key)?.setAttribute("aria-selected", "true");
        setState(group, key, { selected: true });
      }
    if (next.size) selected.set(group.root, next);
    else selected.delete(group.root);
    const rowOf = (key: string | null) => group.rows.find((each) => each.key === key);
    const ids = group.rows.filter((row) => next.has(row.key)).map((row) => row.id);
    const row = rowOf(last !== null && next.has(last) ? last : null);
    host.onRegionSelect?.(group.root, row ? row.id : null, ids);
    publish(group, next);
  };

  /** A press or Enter: single groups replace (a second press clears), multiple ones toggle. */
  const select = (group: Group, key: string | null) => {
    const current = selectionOf(group);
    if (key === null) return setSelection(group, [], null);
    if (!group.multiple) return setSelection(group, current.has(key) ? [] : [key], key);
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelection(group, next, key);
  };

  // --- Linked maps (ADR-0065) -----------------------------------------------------------------

  /** This instance's members of the page's link registry, by regions root. */
  const members = new Map<HTMLElement, LinkMember>();
  /** Selections set before their part was scanned. */
  const pending = new WeakMap<HTMLElement, readonly (string | number)[]>();
  const received = new WeakMap<HTMLElement, ReadonlySet<string> | null>();

  /** A group's selection became (or stopped being) its link group's filter. */
  const publish = (group: Group, keys: ReadonlySet<string>) => {
    if (!group.link || group.linkFilter === "receive") return;
    const current = linkFilters.get(group.link);
    if (keys.size) linkFilters.set(group.link, { source: group.root, keys: new Set(keys) });
    else if (current?.source === group.root) linkFilters.delete(group.link);
    else return;
    broadcast(group.link);
  };

  const join = (group: Group) => {
    const link = group.link as string;
    const member: LinkMember = {
      root: group.root,
      link,
      receive(filter) {
        const current = groups.find((each) => each.root === group.root);
        if (!current || current.linkFilter === "emit") return;
        received.set(group.root, filter && filter.source !== group.root ? filter.keys : null);
        apply();
        markFiltered(current);
      },
    };
    members.set(group.root, member);
    const set = linkMembers.get(link) ?? new Set<LinkMember>();
    set.add(member);
    linkMembers.set(link, set);
    member.receive(linkFilters.get(link) ?? null);
  };

  const leave = (root: HTMLElement) => {
    const member = members.get(root);
    if (!member) return;
    members.delete(root);
    received.delete(root);
    linkMembers.get(member.link)?.delete(member);
    if (linkFilters.get(member.link)?.source === root) {
      linkFilters.delete(member.link);
      broadcast(member.link);
    }
  };

  /** Joins, leaves or moves the scanned groups in the registry. */
  const syncLinks = () => {
    const wanted = new Map(
      groups.filter((group) => group.link).map((group) => [group.root, group]),
    );
    for (const [root, member] of members) if (wanted.get(root)?.link !== member.link) leave(root);
    for (const group of wanted.values()) if (!members.has(group.root)) join(group);
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
      const picked = selectionOf(group);
      const current = active.get(group.root);
      const filter = received.get(group.root) ?? null;
      for (const row of group.rows) {
        ids.add(row.id);
        map.setFeatureState(target(group, row.id), {
          value: row.value,
          muted: isMuted(row.value, ranges) || (filter !== null && !filter.has(row.key)),
          selected: picked.has(row.key),
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

  // --- Generated description (4.18.99) --------------------------------------------------------

  /** Fills `p[data-ok-map-description][data-ok-auto]` from the first regions part and legend. */
  const describe = () => {
    const targets = host.own("p[data-ok-map-description][data-ok-auto]");
    const group = groups[0];
    if (targets.length === 0 || !group) return;
    const type = group.layer ? host.ready()?.getLayer(group.layer)?.type : undefined;
    const kind: GeoDescriptionKind =
      type === "fill" || type === "fill-extrusion"
        ? "choropleth"
        : type === "circle"
          ? "symbols"
          : "map";
    const legend = host
      .own("[data-ok-map-legend]")
      .find((each) => each.querySelector("[data-ok-map-legend-classes]"));
    const classes = legend
      ? [
          ...legend.querySelectorAll(
            "[data-ok-map-legend-class]:not([data-ok-null]) [data-ok-map-legend-label]",
          ),
        ]
          .map((label) => label.textContent?.trim() ?? "")
          .filter(Boolean)
      : [];
    const text = geoDescription({
      kind,
      items: group.rows.map((row) => ({ name: row.name, value: row.value, text: row.text })),
      classes,
      strings: host.descriptionStrings?.(),
    });
    for (const target of targets) if (target.textContent !== text) target.textContent = text;
  };

  // --- Scan -----------------------------------------------------------------------------------

  const scan = () => {
    const previous = new Map(groups.map((group) => [group.root, group]));
    groups = host.own("[data-ok-map-regions]").map((root) => {
      const linkFilter = root.getAttribute("data-ok-link-filter");
      const boxSelect = flag(root, "data-ok-box-select");
      return {
        root,
        source: root.getAttribute("data-ok-source") ?? "",
        sourceLayer: root.getAttribute("data-ok-source-layer") ?? undefined,
        layer: root.getAttribute("data-ok-layer") ?? undefined,
        rows: readRows(root.querySelector<HTMLTableElement>("table")),
        list: root.querySelector<HTMLElement>("[data-ok-map-regions-list]"),
        boxSelect,
        multiple: boxSelect || flag(root, "data-ok-multiple"),
        link: root.getAttribute("data-ok-group")?.trim() || undefined,
        linkFilter:
          linkFilter === "emit" || linkFilter === "receive" ? linkFilter : "bidirectional",
      };
    });
    for (const group of groups) {
      const before = previous.get(group.root);
      if (before && focused === before) focused = group;
      if (hovered && hovered.group.root === group.root) hovered = { group, key: hovered.key };
      const picked = selected.get(group.root);
      let trimmed: string[] | null = null;
      if (picked) {
        const keys = new Set(group.rows.map((row) => row.key));
        const kept = [...picked].filter((key) => keys.has(key));
        // Rows that went away leave the selection quietly.
        if (kept.length) selected.set(group.root, new Set(kept));
        else selected.delete(group.root);
        // A single group keeps one region at most (the option may have changed): reported.
        if (!group.multiple && kept.length > 1) trimmed = kept.slice(-1);
      }
      buildList(group);
      if (trimmed) setSelection(group, trimmed, trimmed[0] as string);
    }
    for (const root of previous.keys())
      if (!groups.some((group) => group.root === root)) leave(root);
    syncLinks();
    host.blockBoxZoom?.(groups.some((group) => group.boxSelect));
    paintLegends();
    apply();
    describe();
    for (const group of groups) {
      const ids = pending.get(group.root);
      if (ids) api.setSelection(group.root, ids);
    }
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

  // --- Box selection (ADR-0065) ----------------------------------------------------------------

  /** Label anchors (lng / lat) of a group's regions: the centroid of each region's largest piece. */
  const anchors = (map: MapLibreMap, group: Group) => {
    const best = new Map<string, { area: number; point: [number, number] }>();
    const features = map.querySourceFeatures(group.source, {
      ...(group.sourceLayer ? { sourceLayer: group.sourceLayer } : {}),
    });
    for (const feature of features) {
      if (feature.id === undefined) continue;
      const key = String(feature.id);
      const geometry = feature.geometry as { type: string; coordinates: unknown };
      const polygons =
        geometry.type === "Polygon"
          ? [geometry.coordinates as number[][][]]
          : geometry.type === "MultiPolygon"
            ? (geometry.coordinates as number[][][][])
            : geometry.type === "Point"
              ? [[[geometry.coordinates as number[]]]]
              : [];
      for (const polygon of polygons) {
        const ring = polygon[0];
        if (!ring?.length) continue;
        const piece = ringCentroid(ring);
        const previous = best.get(key);
        if (!previous || piece.area > previous.area) best.set(key, piece);
      }
    }
    return best;
  };

  const box = (map: MapLibreMap, a: Point, b: Point, add: boolean) => {
    const left = Math.min(a.x, b.x);
    const right = Math.max(a.x, b.x);
    const top = Math.min(a.y, b.y);
    const bottom = Math.max(a.y, b.y);
    for (const group of groups) {
      if (!group.boxSelect) continue;
      const inside: string[] = [];
      for (const [key, { point }] of anchors(map, group)) {
        if (!group.rows.some((row) => row.key === key)) continue;
        const { x, y } = map.project(point);
        if (x >= left && x <= right && y >= top && y <= bottom) inside.push(key);
      }
      const next = add ? [...selectionOf(group), ...inside] : inside;
      const keys = group.rows.map((row) => row.key).filter((key) => next.includes(key));
      setSelection(group, keys, inside.length ? (inside.at(-1) as string) : null);
    }
  };

  let drag: {
    start: Point;
    current: Point;
    add: boolean;
    pan: boolean;
    frame: HTMLElement | null;
    pointer: number;
  } | null = null;

  const endDrag = (commit: boolean) => {
    const map = host.ready();
    const current = drag;
    if (!current) return;
    drag = null;
    current.frame?.remove();
    if (map && current.pan) map.dragPan.enable();
    if (!commit || !map) return;
    const moved = Math.hypot(
      current.current.x - current.start.x,
      current.current.y - current.start.y,
    );
    if (moved >= 4) box(map, current.start, current.current, current.add);
  };

  const local = (map: MapLibreMap, event: PointerEvent): Point => {
    const rect = map.getCanvasContainer().getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  element.addEventListener(
    "pointerdown",
    (event) => {
      const map = host.ready();
      if (!map || !event.shiftKey || event.button !== 0 || drag) return;
      if (!groups.some((group) => group.boxSelect)) return;
      if (!(event.target instanceof Node) || !map.getCanvasContainer().contains(event.target))
        return;
      const pan = map.dragPan.isEnabled();
      if (pan) map.dragPan.disable();
      const frame = document.createElement("div");
      frame.setAttribute("data-ok-map-selection-box", "");
      frame.setAttribute("aria-hidden", "true");
      const start = local(map, event);
      drag = { start, current: start, add: event.altKey, pan, frame, pointer: event.pointerId };
      map.getCanvasContainer().after(frame);
      host.write(frame, box2css(start, start));
      event.preventDefault();
    },
    { signal, capture: true },
  );
  document.addEventListener(
    "pointermove",
    (event) => {
      const map = host.ready();
      if (!drag || !map || event.pointerId !== drag.pointer) return;
      drag.current = local(map, event);
      drag.add ||= event.altKey;
      if (drag.frame) host.write(drag.frame, box2css(drag.start, drag.current));
    },
    { signal },
  );
  document.addEventListener(
    "pointerup",
    (event) => {
      if (!drag || event.pointerId !== drag.pointer) return;
      const map = host.ready();
      if (map) drag.current = local(map, event);
      drag.add ||= event.altKey;
      endDrag(true);
    },
    { signal },
  );
  document.addEventListener("pointercancel", () => endDrag(false), { signal });
  document.addEventListener(
    "keydown",
    (event) => {
      if (drag && event.key === "Escape") {
        event.preventDefault();
        endDrag(false);
      }
    },
    { signal, capture: true },
  );

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
      const key =
        active.get(group.root) ?? [...selectionOf(group)][0] ?? (group.rows[0] as Row).key;
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
      if (!group || group.rows.length === 0 || event.altKey) return;
      const keys = group.rows.map((row) => row.key);
      // Multiple selection: Ctrl / Cmd + A selects every region (the box's keyboard path).
      if (
        group.multiple &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "a" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        setSelection(group, keys, keys.at(-1) as string);
        return;
      }
      if (event.ctrlKey || event.metaKey) return;
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
      const key = keys[next] as string;
      markActive(group, key, true);
      // Multiple selection: Shift + arrows add the region they move to.
      if (group.multiple && event.shiftKey && next !== index)
        setSelection(group, [...selectionOf(group), key], key);
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

  const api: MapRegions = {
    scan,
    apply() {
      apply();
      describe();
    },
    describe,
    sourceData: sourceChanged,
    pointer(point) {
      const next = point ? hit(point) : null;
      setHover(next);
      return next !== null;
    },
    click(point) {
      if (drag) return;
      const found = hit(point);
      if (found) select(found.group, found.key);
    },
    setSelection(root, ids) {
      const group = groups.find((each) => each.root === root);
      // Not read yet (the DOM scan runs a microtask later): applied by the next scan.
      if (!group) {
        pending.set(root, ids);
        return;
      }
      pending.delete(root);
      const wanted = new Set(ids.map(String));
      const keys = group.rows.map((row) => row.key).filter((key) => wanted.has(key));
      setSelection(group, group.multiple ? keys : keys.slice(-1), keys.at(-1) ?? null);
    },
    destroy() {
      endDrag(false);
      for (const root of [...members.keys()]) leave(root);
      abort.abort();
    },
  };
  return api;
}

type Point = { x: number; y: number };

/** The selection box's position and size (CSSOM, private properties). */
const box2css = (a: Point, b: Point) => ({
  "--_ok-map-box-x": `${Math.min(a.x, b.x)}px`,
  "--_ok-map-box-y": `${Math.min(a.y, b.y)}px`,
  "--_ok-map-box-width": `${Math.abs(a.x - b.x)}px`,
  "--_ok-map-box-height": `${Math.abs(a.y - b.y)}px`,
});

/** Area-weighted centroid and area of a ring (lng / lat); its first point when degenerate. */
function ringCentroid(ring: readonly number[][]): { area: number; point: [number, number] } {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [ax = 0, ay = 0] = ring[i] as number[];
    const [bx = 0, by = 0] = ring[(i + 1) % ring.length] as number[];
    const cross = ax * by - bx * ay;
    area += cross;
    cx += (ax + bx) * cross;
    cy += (ay + by) * cross;
  }
  const [x0 = 0, y0 = 0] = ring[0] as number[];
  if (Math.abs(area) < 1e-12) return { area: 0, point: [x0, y0] };
  return { area: Math.abs(area) / 2, point: [cx / (3 * area), cy / (3 * area)] };
}
