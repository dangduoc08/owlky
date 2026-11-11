/*
 * Organization chart as an ARIA tree (ADR-0063): roles, names, the announced selection and the
 * roving tab stop are derived state that this controller writes in both implementations; it
 * reports intent (toggle, select) and moves the focus. Owners keep the state (`hidden` lists,
 * `data-ok-selected` nodes).
 */
import { createTypeahead } from "../menu/menu-navigation.js";
import {
  organizationChartAncestors,
  organizationChartList,
  organizationChartNode,
  organizationChartNodeId,
  organizationChartNodes,
  organizationChartToggle,
} from "./organization-chart.js";

/** Selection modes (`enableSelection`; ApexTree's `false` = no attribute). */
export type OrganizationChartSelectionMode = "single" | "multi";

const ROOT = "[data-ok-organization-chart]";
const NODE = "[data-ok-organization-chart-node]";
const LABEL = "[data-ok-organization-chart-label]";
const SELECTED = "data-ok-selected";
/** Content of a label that keeps its own clicks and keys. */
const INTERACTIVE =
  "a[href], button, input, select, textarea, label, summary, [contenteditable], [tabindex]:not([data-ok-organization-chart-node]), [role=button], [role=link], [role=menuitem], [popover]";
/** Keys the zoom controller owns while zoom and pan is on (typeahead leaves them alone). */
const ZOOM_KEYS = new Set(["+", "=", "-", "_", "0"]);

/** The ids from the chart's root node to the node with this id (empty when it isn't found). */
export function organizationChartNodePath(root: Element, id: string): HTMLElement[] {
  const node = organizationChartNode(root, id);
  return node ? [...organizationChartAncestors(node)].reverse().concat(node) : [];
}

/** The chart's selected nodes (`data-ok-selected`), in document order. */
export function organizationChartSelected(root: Element): HTMLElement[] {
  return organizationChartNodes(root).filter((node) => node.hasAttribute(SELECTED));
}

/**
 * The selection after the user acts on `id`: `single` selects it or, when it is the only
 * selected node, clears; `multi` adds or removes it (selection order is kept).
 */
export function organizationChartSelect(
  current: readonly string[],
  id: string,
  mode: OrganizationChartSelectionMode,
): string[] {
  if (mode === "single") return current.length === 1 && current[0] === id ? [] : [id];
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

/** A selection a method sets: unique ids, only the first in `single` mode. */
export function organizationChartSelection(
  ids: readonly string[],
  mode: OrganizationChartSelectionMode,
): string[] {
  const unique = [...new Set(ids.filter((id) => typeof id === "string"))];
  return mode === "single" ? unique.slice(0, 1) : unique;
}

/** Whether a node is shown: none of its ancestors' children lists is `hidden`. */
export function organizationChartVisible(node: Element): boolean {
  return organizationChartAncestors(node).every(
    (ancestor) => !(organizationChartList(ancestor) as HTMLElement).hidden,
  );
}

export interface OrganizationChartTreeOptions {
  /** The tree is on (`enableKeyboardNavigation`, or a selection mode). Default `false`. */
  enabled?: boolean | undefined;
  /** Selection mode; none = no selection. */
  selection?: OrganizationChartSelectionMode | undefined;
  /** The user asked to expand (`true`) or collapse a node (→, ←, Enter). */
  onToggle?: ((node: HTMLElement, expanded: boolean) => void) | undefined;
  /** The user asked to select or deselect a node (Space, a label click). */
  onSelect?: ((node: HTMLElement) => void) | undefined;
}

export interface OrganizationChartTree {
  /** Replaces the options and rewrites the tree's attributes. */
  update(options: OrganizationChartTreeOptions): void;
  /** Rewrites the attributes now (they also follow DOM changes). */
  sync(): void;
  /** Moves the tab stop to a node and focuses it. */
  focus(node: HTMLElement): void;
  destroy(): void;
}

/** Attributes the controller writes, per element, to remove them on teardown. */
type Written = Map<Element, Set<string>>;

/**
 * The tree of an organization chart (ADR-0063): roles, `aria-expanded`,
 * `aria-selected`, `aria-multiselectable` and the roving `tabindex`, plus the keyboard (arrows,
 * Home / End, Enter, Space, typeahead) and label clicks for selection. Off: removes what it wrote.
 */
export function createOrganizationChartTree(
  root: HTMLElement,
  initial: OrganizationChartTreeOptions = {},
): OrganizationChartTree {
  let options = initial;
  let written: Written = new Map();
  /** The node that holds the tab stop (the last focused one). */
  let current: HTMLElement | null = null;
  /** The focus is (or was, until a collapse hid the focused node) inside the chart. */
  let inside = false;
  const typeahead = createTypeahead();

  const set = (next: Written, element: Element, name: string, value: string) => {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
    const names = next.get(element) ?? new Set<string>();
    names.add(name);
    next.set(element, names);
  };

  const owns = (element: Element) => element.closest(ROOT) === root;
  const labelOf = (node: Element) => node.querySelector<HTMLElement>(`:scope > ${LABEL}`);
  const visibleNodes = () => organizationChartNodes(root).filter(organizationChartVisible);

  const sync = () => {
    observer.disconnect();
    const next: Written = new Map();
    if (options.enabled) {
      const mode = options.selection;
      set(next, root, "role", "tree");
      if (mode === "multi") set(next, root, "aria-multiselectable", "true");
      const nodes = organizationChartNodes(root);
      const visible = nodes.filter(organizationChartVisible);
      if (current && (!current.isConnected || !owns(current) || !visible.includes(current))) {
        // Hidden by a collapse: the nearest visible ancestor takes the tab stop (and the focus).
        const active = document.activeElement;
        const had = current.contains(active) || (inside && (!active || active === document.body));
        const ancestor = current.isConnected
          ? (organizationChartAncestors(current).find((item) => visible.includes(item)) ?? null)
          : null;
        current = ancestor;
        if (had && ancestor && document.activeElement !== ancestor) ancestor.focus();
      }
      const stop =
        current ??
        visible.find((node) => node.hasAttribute(SELECTED) && organizationChartNodeId(node)) ??
        visible[0] ??
        null;
      for (const node of nodes) {
        set(next, node, "role", "treeitem");
        set(next, node, "tabindex", node === stop ? "0" : "-1");
        const toggle = organizationChartToggle(node);
        const list = organizationChartList(node);
        if (toggle && list) {
          set(next, node, "aria-expanded", toggle.getAttribute("aria-expanded") ?? "false");
          set(next, toggle, "tabindex", "-1");
        }
        if (list) set(next, list, "role", "group");
        if (mode && organizationChartNodeId(node) !== null)
          set(next, node, "aria-selected", String(node.hasAttribute(SELECTED)));
      }
    }
    for (const [element, names] of written)
      for (const name of names) if (!next.get(element)?.has(name)) element.removeAttribute(name);
    written = next;
    observe();
  };

  const focus = (node: HTMLElement | null | undefined) => {
    if (!node) return;
    current = node;
    for (const other of organizationChartNodes(root))
      if (other.getAttribute("tabindex") === "0" && other !== node)
        other.setAttribute("tabindex", "-1");
    node.setAttribute("tabindex", "0");
    node.focus();
  };

  /** The node an event's target is, when it targets a treeitem of this chart itself. */
  const itemOf = (target: EventTarget | null): HTMLElement | null =>
    target instanceof HTMLElement && target.matches(NODE) && owns(target) ? target : null;

  const expanded = (node: HTMLElement) =>
    organizationChartToggle(node)?.getAttribute("aria-expanded") === "true";

  const listeners = new AbortController();
  const signal = listeners.signal;
  root.addEventListener(
    "keydown",
    (event) => {
      if (!options.enabled || event.defaultPrevented || event.altKey) return;
      const node = itemOf(event.target);
      if (!node) return;
      const modified = event.ctrlKey || event.metaKey;
      const visible = visibleNodes();
      const index = visible.indexOf(node);
      const rtl = getComputedStyle(root).direction === "rtl";
      const key =
        rtl && event.key === "ArrowRight"
          ? "ArrowLeft"
          : rtl && event.key === "ArrowLeft"
            ? "ArrowRight"
            : event.key;
      let handled = true;
      switch (modified ? "" : key) {
        case "ArrowDown":
          focus(visible[index + 1]);
          break;
        case "ArrowUp":
          focus(visible[index - 1]);
          break;
        case "Home":
          focus(visible[0]);
          break;
        case "End":
          focus(visible[visible.length - 1]);
          break;
        case "ArrowRight": {
          const toggle = organizationChartToggle(node);
          if (toggle && !expanded(node)) {
            if (toggle.getAttribute("aria-busy") !== "true") options.onToggle?.(node, true);
          } else {
            const list = organizationChartList(node);
            const first =
              list && !list.hidden ? list.querySelector<HTMLElement>(`:scope > ${NODE}`) : null;
            focus(first);
          }
          break;
        }
        case "ArrowLeft":
          if (organizationChartToggle(node) && expanded(node)) options.onToggle?.(node, false);
          else focus(organizationChartAncestors(node)[0]);
          break;
        case "Enter": {
          const toggle = organizationChartToggle(node);
          if (toggle && toggle.getAttribute("aria-busy") !== "true")
            options.onToggle?.(node, !expanded(node));
          else handled = false;
          break;
        }
        case " ":
          if (options.selection && organizationChartNodeId(node) !== null) options.onSelect?.(node);
          else handled = !!options.selection;
          break;
        default: {
          const printable = !modified && event.key.length === 1 && event.key !== " ";
          const zoomKey = ZOOM_KEYS.has(event.key) && root.hasAttribute("data-ok-enable-zoom-pan");
          handled = false;
          if (!printable || zoomKey) break;
          const items = visible.map(labelOf).filter((label): label is HTMLElement => !!label);
          const match = typeahead.match(items, labelOf(node), event.key);
          if (match) {
            focus(match.parentElement as HTMLElement);
            handled = true;
          }
        }
      }
      if (handled) event.preventDefault();
    },
    { signal },
  );
  root.addEventListener(
    "focusout",
    (event) => {
      // A focused node that a collapse hides blurs without a new target: the focus stays ours.
      const next = event.relatedTarget;
      if (next instanceof Node && !root.contains(next)) inside = false;
    },
    { signal },
  );
  root.addEventListener(
    "focusin",
    (event) => {
      inside = true;
      const node = itemOf(event.target);
      if (!options.enabled || !node || node === current) return;
      current = node;
      sync();
    },
    { signal },
  );
  root.addEventListener(
    "click",
    (event) => {
      if (!options.enabled || !options.selection || event.defaultPrevented) return;
      const target = event.target as Element;
      const label = target.closest(LABEL);
      const node = label?.parentElement;
      if (!label || !owns(label) || !node?.matches(NODE)) return;
      const inner = target.closest(INTERACTIVE);
      if (inner && label.contains(inner)) return;
      if (organizationChartNodeId(node) !== null) options.onSelect?.(node as HTMLElement);
    },
    { signal },
  );

  // Follows the owner's changes: nodes added or removed, lists opening, selection, toggles.
  const observer = new MutationObserver(sync);
  const observe = () =>
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["hidden", SELECTED, "aria-expanded", "data-ok-node-id"],
    });
  sync();

  return {
    update(next) {
      options = next;
      sync();
    },
    sync,
    focus: (node) => focus(node),
    destroy() {
      listeners.abort();
      observer.disconnect();
      options = {};
      sync();
      observer.disconnect();
    },
  };
}
