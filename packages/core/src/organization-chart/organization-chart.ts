import { organizationChartOptions } from "../anatomy/anatomy.js";
import { parseNumber } from "../options/define.js";
import { clampOrganizationChartZoom } from "./organization-chart-zoom.js";

/** The length options of an organization chart and the private custom property each one sets. */
export const ORGANIZATION_CHART_LENGTHS = {
  lineHeight: "--_ok-org-line-height",
  lineWidth: "--_ok-org-line-width",
  lineBorderRadius: "--_ok-org-line-radius",
  nodePadding: "--_ok-org-node-padding",
  groupLeafNodesSpacing: "--_ok-org-leaf-spacing",
} as const;

export type OrganizationChartLength = keyof typeof ORGANIZATION_CHART_LENGTHS;

export type OrganizationChartStyle = Partial<
  Record<
    | (typeof ORGANIZATION_CHART_LENGTHS)[OrganizationChartLength]
    | "--_ok-org-dim-opacity"
    | "--_ok-org-zoom",
    string
  >
>;

/**
 * Private custom properties of an organization chart root for the given lengths, dim strength
 * and zoom level (React `style`, the HTML runtime through CSSOM). A length number is in px; a
 * string may carry a unit (`"2rem"`). `dimOpacity` above 1 counts as 1; `zoom` is clamped to
 * `minZoom` / `maxZoom` (ADR-0056). Invalid or missing values are left out, so the stylesheet's
 * defaults apply.
 */
export function organizationChartStyle(
  values: Partial<
    Record<OrganizationChartLength | "dimOpacity" | "zoom" | "minZoom" | "maxZoom", unknown>
  >,
): OrganizationChartStyle {
  const style: OrganizationChartStyle = {};
  for (const key of Object.keys(ORGANIZATION_CHART_LENGTHS) as OrganizationChartLength[]) {
    const value = parseNumber(organizationChartOptions.options[key], values[key]);
    if (value !== undefined)
      style[ORGANIZATION_CHART_LENGTHS[key]] = typeof value === "number" ? `${value}px` : value;
  }
  const dim = parseNumber(organizationChartOptions.options.dimOpacity, values.dimOpacity);
  if (typeof dim === "number") style["--_ok-org-dim-opacity"] = String(Math.min(dim, 1));
  const { options } = organizationChartOptions;
  const zoom = parseNumber(options.zoom, values.zoom);
  if (typeof zoom === "number") {
    const min = parseNumber(options.minZoom, values.minZoom);
    const max = parseNumber(options.maxZoom, values.maxZoom);
    style["--_ok-org-zoom"] = String(
      clampOrganizationChartZoom(
        zoom,
        typeof min === "number" ? min : undefined,
        typeof max === "number" ? max : undefined,
      ),
    );
  }
  return style;
}

// --- Expand and collapse (ADR-0051) ------------------------------------------------------------

const ROOT = "[data-ok-organization-chart]";
const NODE = "[data-ok-organization-chart-node]";
const LABEL = "[data-ok-organization-chart-label]";
const TOGGLE = "[data-ok-organization-chart-toggle]";
/** Content of a label that keeps its own clicks (`expandCollapseOnNodeClick` skips them). */
const INTERACTIVE =
  "a[href], button, input, select, textarea, label, summary, [contenteditable], [tabindex], [role=button], [role=link], [role=menuitem], [popover]";

/**
 * A node whose children are grouped (`data-ok-group-leaf-nodes`, 4.18.3): two or more children,
 * none with a children list of its own (lazy and collapsible branches count as branches). The
 * stylesheet uses the same condition.
 */
export const ORGANIZATION_CHART_GROUPED =
  "[data-ok-organization-chart][data-ok-group-leaf-nodes] [data-ok-organization-chart-node]:has(> [data-ok-organization-chart-children] > [data-ok-organization-chart-node] + [data-ok-organization-chart-node]):not(:has(> [data-ok-organization-chart-children] > [data-ok-organization-chart-node] > [data-ok-organization-chart-children]))";

/** Whether a node's children are grouped leaves (one column joined by a line along its side). */
export function organizationChartGrouped(node: Element): boolean {
  return node.matches(ORGANIZATION_CHART_GROUPED);
}

/** Whether an element belongs to `root` itself (not to a chart nested in one of its labels). */
const owns = (root: Element, element: Element) => element.closest(ROOT) === root;

/** The nodes of a chart in document order, without those of charts nested in its labels. */
export function organizationChartNodes(root: Element): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(NODE)].filter((node) => owns(root, node));
}

/** A node's toggle button, when it has one (collapsible charts, nodes with children). */
export function organizationChartToggle(node: Element): HTMLButtonElement | null {
  return node.querySelector<HTMLButtonElement>(`:scope > ${TOGGLE}`);
}

/** A node's children list, when it has one. */
export function organizationChartList(node: Element): HTMLElement | null {
  return node.querySelector<HTMLElement>(":scope > [data-ok-organization-chart-children]");
}

/** A node's `data-ok-node-id` (React `nodeId`), or `null`. */
export function organizationChartNodeId(node: Element): string | null {
  return node.getAttribute("data-ok-node-id");
}

/** The node with `data-ok-node-id="<id>"` in this chart. */
export function organizationChartNode(root: Element, id: string): HTMLElement | null {
  return organizationChartNodes(root).find((node) => organizationChartNodeId(node) === id) ?? null;
}

/** Depth of a node: 0 for the root node, 1 for its children… */
export function organizationChartDepth(node: Element): number {
  const root = node.closest(ROOT);
  let depth = 0;
  for (
    let parent = node.parentElement?.closest(NODE);
    parent && parent.closest(ROOT) === root;
    parent = parent.parentElement?.closest(NODE)
  )
    depth++;
  return depth;
}

/** Whether a node's children are loaded (a lazy node's list is empty until its first expand). */
export function organizationChartLoaded(node: Element): boolean {
  return (organizationChartList(node)?.childElementCount ?? 0) > 0;
}

/** Whether a node shows its children: it has a list with nodes and the list isn't `hidden`. */
export function organizationChartExpanded(node: Element): boolean {
  const list = organizationChartList(node);
  return !!list && !list.hidden && list.childElementCount > 0;
}

/** Number of nodes under a node, at every depth (nested charts left out). */
export function organizationChartDescendants(root: Element, node: Element): number {
  const list = organizationChartList(node);
  return list ? [...list.querySelectorAll(NODE)].filter((item) => owns(root, item)).length : 0;
}

/** A batch change of expanded nodes (ApexTree's graph methods). */
export type OrganizationChartAction =
  | { type: "expandAll" | "collapseAll" }
  | { type: "expandToDepth"; depth: number }
  | { type: "expandSubtree" | "collapseSubtree"; node: Element };

/**
 * The nodes a batch method changes, with their new state: only nodes with a toggle, and only
 * loaded ones are expanded (batch methods never load lazy children). `expandToDepth(depth)`
 * expands the nodes above `depth` (the root is depth 0) and collapses the others.
 */
export function organizationChartPlan(
  root: Element,
  action: OrganizationChartAction,
): Map<HTMLElement, boolean> {
  const plan = new Map<HTMLElement, boolean>();
  const subtree = action.type === "expandSubtree" || action.type === "collapseSubtree";
  const depth = action.type === "expandToDepth" ? Math.max(0, Math.floor(action.depth)) : 0;
  for (const node of organizationChartNodes(root)) {
    if (subtree && node !== action.node && !action.node.contains(node)) continue;
    if (!organizationChartToggle(node)) continue;
    const expand =
      action.type === "expandAll" || action.type === "expandSubtree"
        ? true
        : action.type === "expandToDepth"
          ? organizationChartDepth(node) < depth
          : false;
    if (expand && !organizationChartLoaded(node)) continue;
    plan.set(node, expand);
  }
  return plan;
}

export interface OrganizationChartControllerOptions {
  /** A click on a label (outside its interactive content) toggles the node too. */
  expandCollapseOnNodeClick?: boolean | undefined;
  /** Smallest hidden count a badge shows. Default 1. */
  collapseBadgeThreshold?: number | undefined;
  /** The user asked to expand (`true`) or collapse a node. The owner decides and writes it. */
  onToggle?: ((node: HTMLElement, expanded: boolean) => void) | undefined;
}

export interface OrganizationChartController {
  /** Replaces the options (the callback included) and rewrites the badges. */
  update(options: OrganizationChartControllerOptions): void;
  /** Rewrites the badges now (they also follow DOM changes on their own). */
  sync(): void;
  destroy(): void;
}

/**
 * Organization chart expand / collapse (ADR-0051): reports toggle clicks (and label clicks with
 * `expandCollapseOnNodeClick`) as intent and writes each collapsed node's badge, the number of
 * hidden descendants, in both implementations. It owns no state: the owner writes `hidden` on the
 * children list and `aria-expanded` on the toggle.
 */
export function createOrganizationChartController(
  root: HTMLElement,
  initial: OrganizationChartControllerOptions = {},
): OrganizationChartController {
  let options = initial;

  const sync = () => {
    const threshold = Math.max(1, options.collapseBadgeThreshold ?? 1);
    for (const node of organizationChartNodes(root)) {
      const badge = organizationChartToggle(node)?.querySelector(
        ":scope > [data-ok-organization-chart-badge]",
      );
      if (!badge) continue;
      const count = organizationChartExpanded(node) ? 0 : organizationChartDescendants(root, node);
      const text = count >= threshold ? String(count) : "";
      if (badge.textContent !== text) badge.textContent = text;
    }
  };

  const request = (node: HTMLElement) => {
    const toggle = organizationChartToggle(node);
    if (!toggle || toggle.getAttribute("aria-busy") === "true") return;
    options.onToggle?.(node, toggle.getAttribute("aria-expanded") !== "true");
  };

  const listeners = new AbortController();
  root.addEventListener(
    "click",
    (event) => {
      // Clicks always target elements (text nodes never receive them).
      const target = event.target as Element;
      const toggle = target.closest(TOGGLE);
      if (toggle) {
        const node = toggle.parentElement;
        if (owns(root, toggle) && node?.matches(NODE)) request(node as HTMLElement);
        return;
      }
      if (!options.expandCollapseOnNodeClick || event.defaultPrevented) return;
      const label = target.closest(LABEL);
      const node = label?.parentElement;
      if (!label || !owns(root, label) || !node?.matches(NODE)) return;
      const inner = target.closest(INTERACTIVE);
      if (inner && label.contains(inner)) return;
      request(node as HTMLElement);
    },
    { signal: listeners.signal },
  );

  // Badges follow every change: a list opening or closing, nodes added (lazy loads) or removed.
  const observer = new MutationObserver(sync);
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["hidden"],
  });
  sync();

  return {
    update(next) {
      options = next;
      sync();
    },
    sync,
    destroy() {
      listeners.abort();
      observer.disconnect();
    },
  };
}

// --- Lineage highlight and search -------------------------------------------------------------

/** A node's ancestors in its chart, nearest first (the root node last). */
export function organizationChartAncestors(node: Element): HTMLElement[] {
  const root = node.closest(ROOT);
  const ancestors: HTMLElement[] = [];
  for (
    let parent = node.parentElement?.closest<HTMLElement>(NODE);
    parent && parent.closest(ROOT) === root;
    parent = parent.parentElement?.closest<HTMLElement>(NODE)
  )
    ancestors.push(parent);
  return ancestors;
}

/** The chart's highlighted nodes (`data-ok-highlighted`, one in practice). */
export function organizationChartHighlighted(root: Element): HTMLElement[] {
  return organizationChartNodes(root).filter((node) => node.hasAttribute("data-ok-highlighted"));
}

/** Private properties of a node on a highlighted path: where its parent's line meets the bar. */
export interface OrganizationChartPathStyle {
  /** From the node's center to its list's center along the bar, signed, in logical px. */
  "--_ok-org-path-offset": string;
  /** `1` when the list's center lies toward the inline (or block) end of the node, else `0`. */
  "--_ok-org-path-forward": string;
  /** `1` on the first or last of several children: their turn is rounded. */
  "--_ok-org-path-round": string;
}

const PATH_PROPERTIES = [
  "--_ok-org-path-offset",
  "--_ok-org-path-forward",
  "--_ok-org-path-round",
] as const;

/**
 * The bar segment between a child node and its parent's line, measured: CSS can't know where the
 * list's center falls among siblings of different sizes. `null` for the root node.
 */
export function organizationChartPathStyle(node: HTMLElement): OrganizationChartPathStyle | null {
  const list = node.parentElement;
  if (!list?.matches("[data-ok-organization-chart-children]")) return null;
  const direction = node.closest(ROOT)?.getAttribute("data-ok-direction");
  const across = direction === "left" || direction === "right";
  if (list.parentElement && organizationChartGrouped(list.parentElement))
    return groupedPathStyle(node, list, direction);
  const outer = list.getBoundingClientRect();
  const inner = node.getBoundingClientRect();
  const size = across ? outer.height : outer.width;
  const own = across ? inner.height : inner.width;
  const rtl = !across && getComputedStyle(list).direction === "rtl";
  const start = across
    ? inner.top - outer.top
    : rtl
      ? outer.right - inner.right
      : inner.left - outer.left;
  // A transformed container (a zoomed chart) measures scaled boxes; the CSS works in layout px.
  const layout = across ? list.offsetHeight : list.offsetWidth;
  const scale = size > 0 && layout > 0 ? layout / size : 1;
  const offset = Math.round((size / 2 - (start + own / 2)) * scale * 100) / 100;
  const end = node === list.firstElementChild || node === list.lastElementChild;
  return {
    "--_ok-org-path-offset": `${offset}px`,
    "--_ok-org-path-forward": offset >= 0 ? "1" : "0",
    "--_ok-org-path-round": list.childElementCount > 1 && end ? "1" : "0",
  };
}

/**
 * A grouped leaf's path segment: the line along the column, from the first leaf's edge (where the
 * parent's line meets the column) to this leaf. The offset is the distance from the first leaf's
 * near edge to this leaf's, along the column, in layout px (zoomed charts measure scaled boxes).
 */
function groupedPathStyle(
  node: HTMLElement,
  list: HTMLElement,
  direction: string | null | undefined,
): OrganizationChartPathStyle {
  const first = (list.firstElementChild as Element).getBoundingClientRect();
  const inner = node.getBoundingClientRect();
  const across = direction === "left" || direction === "right";
  const rtl = across && getComputedStyle(list).direction === "rtl";
  // Left charts run their column toward the inline end; right charts toward the start.
  const toRight = (direction === "left") !== rtl;
  let distance: number;
  if (direction === "bottom") distance = first.bottom - inner.bottom;
  else if (!across) distance = inner.top - first.top;
  else if (toRight) distance = inner.left - first.left;
  else distance = first.right - inner.right;
  const box = list.getBoundingClientRect();
  const size = across ? box.width : box.height;
  const layout = across ? list.offsetWidth : list.offsetHeight;
  const scale = size > 0 && layout > 0 ? layout / size : 1;
  return {
    "--_ok-org-path-offset": `${Math.round(distance * scale * 100) / 100}px`,
    "--_ok-org-path-forward": "1",
    "--_ok-org-path-round": node === list.lastElementChild ? "1" : "0",
  };
}

export interface OrganizationChartHighlight {
  /** Measures the highlighted paths again (they also follow pointer, focus, DOM and size changes). */
  sync(): void;
  destroy(): void;
}

/**
 * Lineage highlight: the stylesheet dims the chart and keeps the path to the root of the hovered
 * or focused node (`data-ok-highlight-on-hover`) or of the `data-ok-highlighted` node, with
 * `:has()`. This controller only measures where each path's bar segment runs
 * (`organizationChartPathStyle`) and writes it on the path's nodes through CSSOM, in both
 * implementations. It owns no state.
 */
export function createOrganizationChartHighlight(root: HTMLElement): OrganizationChartHighlight {
  let hovered: HTMLElement | null = null;
  let focused: HTMLElement | null = null;
  let written = new Set<HTMLElement>();

  /** The node whose label or toggle holds an event target. */
  const nodeOf = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) return null;
    const part = target.closest(`${LABEL}, ${TOGGLE}`);
    const node = part?.parentElement;
    return part && owns(root, part) && node?.matches(NODE) ? (node as HTMLElement) : null;
  };

  const clear = (node: HTMLElement) => {
    for (const name of PATH_PROPERTIES) node.style.removeProperty(name);
  };

  const sync = () => {
    const sources = organizationChartHighlighted(root);
    if (root.hasAttribute("data-ok-highlight-on-hover"))
      for (const node of [hovered, focused]) if (node?.isConnected) sources.push(node);
    const path = new Set<HTMLElement>();
    for (const source of sources)
      for (const node of [source, ...organizationChartAncestors(source)]) path.add(node);
    for (const node of written) if (!path.has(node)) clear(node);
    for (const node of path) {
      const style = organizationChartPathStyle(node);
      if (!style) continue;
      for (const name of PATH_PROPERTIES)
        if (node.style.getPropertyValue(name) !== style[name])
          node.style.setProperty(name, style[name]);
    }
    written = path;
  };

  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  root.addEventListener(
    "pointerover",
    (event) => {
      const node = nodeOf(event.target);
      if (!node || node === hovered) return;
      hovered = node;
      sync();
    },
    options,
  );
  root.addEventListener(
    "pointerout",
    (event) => {
      if (hovered && nodeOf(event.relatedTarget) !== hovered) hovered = null;
    },
    options,
  );
  root.addEventListener(
    "focusin",
    (event) => {
      focused = nodeOf(event.target);
      if (focused) sync();
    },
    options,
  );
  root.addEventListener(
    "focusout",
    () => {
      focused = null;
    },
    options,
  );

  // Paths follow the layout: nodes added or removed, lists opening, a new direction, a resize.
  const observer = new MutationObserver(sync);
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "hidden",
      "data-ok-highlighted",
      "data-ok-direction",
      "data-ok-group-leaf-nodes",
    ],
  });
  const resize = new ResizeObserver(() => sync());
  resize.observe(root);
  sync();

  return {
    sync,
    destroy() {
      listeners.abort();
      observer.disconnect();
      resize.disconnect();
      for (const node of written) clear(node);
      written = new Set();
    },
  };
}

/**
 * Scrolls a node's label into view once its ancestors finished expanding (owners expand them
 * first; their Collapse animations start a frame later). Smooth unless reduced motion.
 */
export async function revealOrganizationChartNode(node: HTMLElement): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  // Every ancestor has a children list: the node is in it.
  const animations = organizationChartAncestors(node).flatMap((ancestor) =>
    (organizationChartList(ancestor) as HTMLElement).getAnimations(),
  );
  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  const label = node.isConnected ? node.querySelector(`:scope > ${LABEL}`) : null;
  if (!label) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  label.scrollIntoView({
    block: "nearest",
    inline: "nearest",
    behavior: reduce ? "auto" : "smooth",
  });
}
