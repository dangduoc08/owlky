import { organizationChartOptions } from "../anatomy/anatomy.js";
import { parseNumber } from "../options/define.js";

/** The length options of an organization chart and the private custom property each one sets. */
export const ORGANIZATION_CHART_LENGTHS = {
  lineHeight: "--_ok-org-line-height",
  lineWidth: "--_ok-org-line-width",
  lineBorderRadius: "--_ok-org-line-radius",
  nodePadding: "--_ok-org-node-padding",
} as const;

export type OrganizationChartLength = keyof typeof ORGANIZATION_CHART_LENGTHS;

export type OrganizationChartStyle = Partial<
  Record<(typeof ORGANIZATION_CHART_LENGTHS)[OrganizationChartLength], string>
>;

/**
 * Private custom properties of an organization chart root for the given lengths (React `style`,
 * the HTML runtime through CSSOM). A number is in px; a string may carry a unit (`"2rem"`).
 * Invalid or missing values are left out, so the stylesheet's defaults apply.
 */
export function organizationChartStyle(
  values: Partial<Record<OrganizationChartLength, unknown>>,
): OrganizationChartStyle {
  const style: OrganizationChartStyle = {};
  for (const key of Object.keys(ORGANIZATION_CHART_LENGTHS) as OrganizationChartLength[]) {
    const value = parseNumber(organizationChartOptions.options[key], values[key]);
    if (value !== undefined)
      style[ORGANIZATION_CHART_LENGTHS[key]] = typeof value === "number" ? `${value}px` : value;
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
