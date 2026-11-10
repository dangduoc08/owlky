import {
  centerOrganizationChartNode,
  clampOrganizationChartZoom,
  createOrganizationChartController,
  createOrganizationChartHighlight,
  createOrganizationChartZoom,
  ORGANIZATION_CHART_LENGTHS,
  ORGANIZATION_CHART_ZOOM_STEP,
  type OrganizationChartAction,
  type OrganizationChartController,
  type OrganizationChartLength,
  organizationChartAncestors,
  organizationChartExpanded,
  organizationChartHighlighted,
  organizationChartList,
  organizationChartLoaded,
  organizationChartNode,
  organizationChartNodeId,
  organizationChartOptions,
  organizationChartPlan,
  organizationChartStyle,
  organizationChartToggle,
  readNumber,
  revealOrganizationChartNode,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

const { options } = organizationChartOptions;
const LENGTHS = Object.keys(ORGANIZATION_CHART_LENGTHS) as OrganizationChartLength[];
/** Attributes the runtime follows: the lengths, the dim strength and the expand / collapse options. */
const OBSERVED = [
  ...LENGTHS.map((key) => options[key].attr),
  options.dimOpacity.attr,
  options.enableExpandCollapse.attr,
  options.expandCollapseOnNodeClick.attr,
  options.collapseBadgeThreshold.attr,
  options.enableZoomPan.attr,
  options.zoom.attr,
  options.minZoom.attr,
  options.maxZoom.attr,
];

/** Nodes `loadchildren` may answer with: elements, a fragment, or nothing (no children). */
export type OrganizationChartLoadedNodes = Node | Iterable<Node> | null | undefined;

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface OrganizationChartEvents {
  /**
   * The user asked to expand a node (its toggle, or its label with
   * `data-ok-expand-collapse-on-node-click`). `preventDefault()` keeps it collapsed.
   */
  expand: EventSpec<{ nodeId: string | null; node: HTMLElement }, true>;
  /** The user asked to collapse a node. `preventDefault()` keeps it expanded. */
  collapse: EventSpec<{ nodeId: string | null; node: HTMLElement }, true>;
  /**
   * The user asked for another zoom level (Ctrl or Command with the wheel, a pinch, the + / − / 0
   * keys or the toolbar; `data-ok-enable-zoom-pan`). `preventDefault()` keeps the current level.
   */
  zoom: EventSpec<{ zoom: number; previous: number }, true>;
  /**
   * A node whose children list is empty is expanding for the first time. Call
   * `respondWith(nodesOrPromise)` with its child nodes (`li[data-ok-organization-chart-node]`
   * elements, for example cloned from a `template`). No nodes make it a leaf; a rejected promise
   * keeps it collapsed, and the next expand asks again.
   */
  loadchildren: EventSpec<{
    nodeId: string | null;
    node: HTMLElement;
    respondWith(
      nodes: OrganizationChartLoadedNodes | PromiseLike<OrganizationChartLoadedNodes>,
    ): void;
  }>;
}

export interface OrganizationChartInstance extends ComponentInstance {
  /** Expands the node with this `data-ok-node-id`, loading its children first when needed. Resolves once done. */
  expand(nodeId: string): Promise<void>;
  /** Collapses the node with this `data-ok-node-id`. */
  collapse(nodeId: string): void;
  /** Whether the node with this `data-ok-node-id` shows its children. */
  isExpanded(nodeId: string): boolean;
  /** Expands every node whose children are loaded. */
  expandAll(): void;
  /** Collapses every node, the root included. */
  collapseAll(): void;
  /** Expands the nodes above `depth` (the root is depth 0) and collapses the others. */
  expandToDepth(depth: number): void;
  /** Expands a node and every loaded node under it. */
  expandSubtree(nodeId: string): void;
  /** Collapses a node and every node under it. */
  collapseSubtree(nodeId: string): void;
  /**
   * Highlights the node with this `data-ok-node-id` and its path to the root (`data-ok-highlighted`,
   * the others fade), expands its collapsed ancestors and scrolls it into view. Resolves once it
   * is in view. Replaces an earlier highlight.
   */
  highlightNode(nodeId: string): Promise<void>;
  /** Removes the highlight. */
  clearHighlight(): void;
  /** The `data-ok-node-id` of the highlighted node, or `null`. */
  getHighlightedNode(): string | null;
  /** Multiplies the zoom level by `1 + factor`: positive zooms in, negative zooms out. */
  zoom(factor: number): void;
  /** Zooms in by one step (× 1.25). */
  zoomIn(): void;
  /** Zooms out by one step (÷ 1.25). */
  zoomOut(): void;
  /** Sets the zoom level (1 is 100%), within `data-ok-min-zoom` and `data-ok-max-zoom`. */
  setZoom(level: number): void;
  /** The zoom level shown. */
  getZoom(): number;
  /** Back to 100%. */
  resetZoom(): void;
  /** The largest level up to 100% at which the whole chart fits its scroll area, then scrolls to its start. */
  fitScreen(): void;
  /**
   * Scrolls the chart's scroll area so the node with this `data-ok-node-id` is centered, after
   * expanding its collapsed ancestors. Resolves once the scroll starts.
   */
  centerOnNode(nodeId: string): Promise<void>;
}

const isNodes = (value: unknown): value is Iterable<Node> =>
  typeof value === "object" && value !== null && Symbol.iterator in value;

/**
 * Organization chart — spec: specs/components/organization-chart.md, ADR-0036, ADR-0051
 *
 * Markup:  <ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid"
 *              aria-label="Organization chart">
 *            <li data-ok-organization-chart-node>
 *              <div data-ok-organization-chart-label>…</div>
 *              <ul data-ok-organization-chart-children>
 *                <li data-ok-organization-chart-node>…</li>
 *              </ul>
 *            </li>
 *          </ul>
 * The chart is CSS only. The runtime turns the length options (`data-ok-line-height`,
 * `data-ok-line-width`, `data-ok-line-border-radius`, `data-ok-node-padding`) into private custom
 * properties (CSSOM, no style strings) and follows changes to them. Without JavaScript the
 * default lengths apply. With `data-ok-enable-expand-collapse`, branches carry a toggle
 * (`button[data-ok-organization-chart-toggle][aria-expanded][aria-controls]`) before a children
 * list with `data-ok-collapse`; the runtime writes the list's `hidden` and the toggle's
 * `aria-expanded` (state lives in the markup), loads lazy children through `loadchildren`, and
 * the core controller writes the badges. With `data-ok-highlight-on-hover` (or a
 * `data-ok-highlighted` node, `highlightNode(id)`) the core highlight controller measures the
 * highlighted path's bar segments; the stylesheet does the rest.
 */
export const organizationChart = defineComponent<
  OrganizationChartInstance,
  OrganizationChartEvents
>({
  name: "organization-chart",
  selector: "[data-ok-organization-chart]",

  setup(element, { emit }) {
    let written: string[] = [];
    let controller: OrganizationChartController | null = null;
    const highlight = createOrganizationChartHighlight(element);
    const zoomer = createOrganizationChartZoom(element);
    const limits = () => {
      const min = readNumber(element, options.minZoom);
      const max = readNumber(element, options.maxZoom);
      return { min: Number(min), max: Number(max) };
    };
    /** The level shown: `data-ok-zoom`, clamped. */
    const level = () => {
      const { min, max } = limits();
      return clampOrganizationChartZoom(Number(readNumber(element, options.zoom)), min, max);
    };
    /** Writes a level (the attribute is the state); the observer's sync re-anchors the view. */
    const show = (next: number) => {
      element.setAttribute(options.zoom.attr, String(next));
      sync();
    };
    /** A method's change: planned (the view stays steady), no event. */
    const zoomTo = (target: number, start = false) => {
      const next = zoomer.plan(target, { start });
      if (next !== level() || !element.hasAttribute(options.zoom.attr)) show(next);
    };
    const pending = new Set<Element>();

    /** A branch's toggle and children list; `null` for leaves (or a toggle without a list). */
    const parts = (node: HTMLElement) => {
      const toggle = organizationChartToggle(node);
      const list = organizationChartList(node);
      return toggle && list ? { toggle, list } : null;
    };
    type Parts = NonNullable<ReturnType<typeof parts>>;

    /** Writes a node's state: the list's `hidden` and the toggle's `aria-expanded`. */
    const write = ({ toggle, list }: Parts, expand: boolean) => {
      list.hidden = !expand;
      toggle.setAttribute("aria-expanded", String(expand && list.childElementCount > 0));
    };

    const load = (node: HTMLElement, { toggle, list }: Parts): Promise<void> => {
      if (pending.has(node)) return Promise.resolve();
      pending.add(node);
      toggle.setAttribute("aria-busy", "true");
      let response: OrganizationChartLoadedNodes | PromiseLike<OrganizationChartLoadedNodes>;
      emit("loadchildren", {
        nodeId: organizationChartNodeId(node),
        node,
        respondWith(nodes) {
          response = nodes;
        },
      });
      const done = () => {
        pending.delete(node);
        toggle.removeAttribute("aria-busy");
      };
      return Promise.resolve(response).then((nodes) => {
        done();
        if (nodes instanceof Node) list.append(nodes);
        else if (isNodes(nodes)) list.append(...nodes);
        if (list.childElementCount === 0) {
          // Nothing to show: the node is a leaf (no toggle, no list, no line down).
          toggle.remove();
          list.remove();
          return;
        }
        write({ toggle, list }, true);
      }, done);
    };

    const change = (node: HTMLElement, expand: boolean): Promise<void> => {
      const branch = parts(node);
      if (!branch) return Promise.resolve();
      if (expand && !organizationChartLoaded(node)) return load(node, branch);
      write(branch, expand);
      return Promise.resolve();
    };

    const plan = (action: OrganizationChartAction) => {
      for (const [node, expand] of organizationChartPlan(element, action))
        void change(node, expand);
    };
    const byId = (id: string) => organizationChartNode(element, id);

    const sync = () => {
      const values: Partial<
        Record<
          OrganizationChartLength | "dimOpacity" | "zoom" | "minZoom" | "maxZoom",
          string | null
        >
      > = {
        dimOpacity: element.getAttribute(options.dimOpacity.attr),
        zoom: element.getAttribute(options.zoom.attr),
        minZoom: element.getAttribute(options.minZoom.attr),
        maxZoom: element.getAttribute(options.maxZoom.attr),
      };
      for (const key of LENGTHS) values[key] = element.getAttribute(options[key].attr);
      written = syncCustomProperties(element, organizationChartStyle(values), written);
      const previous = level();
      zoomer.update({
        enabled: element.hasAttribute(options.enableZoomPan.attr),
        zoom: previous,
        ...limits(),
        onZoom(next) {
          if (!emit("zoom", { zoom: next, previous: level() }, { cancelable: true })) return;
          show(next);
        },
      });

      const enabled = element.hasAttribute(options.enableExpandCollapse.attr);
      if (!enabled) {
        controller?.destroy();
        controller = null;
        return;
      }
      controller ??= createOrganizationChartController(element);
      const threshold = readNumber(element, options.collapseBadgeThreshold);
      controller.update({
        expandCollapseOnNodeClick: element.hasAttribute(options.expandCollapseOnNodeClick.attr),
        collapseBadgeThreshold: Number(threshold),
        onToggle(node, expand) {
          const detail = { nodeId: organizationChartNodeId(node), node };
          if (!emit(expand ? "expand" : "collapse", detail, { cancelable: true })) return;
          void change(node, expand);
        },
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(element, { attributes: true, attributeFilter: OBSERVED });

    return {
      expand: (id) => {
        const node = byId(id);
        return node ? change(node, true) : Promise.resolve();
      },
      collapse: (id) => {
        const node = byId(id);
        if (node) void change(node, false);
      },
      isExpanded: (id) => {
        const node = byId(id);
        return !!node && organizationChartExpanded(node);
      },
      expandAll: () => plan({ type: "expandAll" }),
      collapseAll: () => plan({ type: "collapseAll" }),
      expandToDepth: (depth) => plan({ type: "expandToDepth", depth }),
      expandSubtree: (id) => {
        const node = byId(id);
        if (node) plan({ type: "expandSubtree", node });
      },
      collapseSubtree: (id) => {
        const node = byId(id);
        if (node) plan({ type: "collapseSubtree", node });
      },
      highlightNode: (id) => {
        const node = byId(id);
        if (!node) return Promise.resolve();
        for (const other of organizationChartHighlighted(element))
          if (other !== node) other.removeAttribute("data-ok-highlighted");
        node.setAttribute("data-ok-highlighted", "");
        // Collapsed ancestors open first (no events, like the other methods).
        for (const ancestor of organizationChartAncestors(node))
          if (!organizationChartExpanded(ancestor)) void change(ancestor, true);
        return revealOrganizationChartNode(node);
      },
      clearHighlight: () => {
        for (const node of organizationChartHighlighted(element))
          node.removeAttribute("data-ok-highlighted");
      },
      getHighlightedNode: () => {
        const [node] = organizationChartHighlighted(element);
        return node ? organizationChartNodeId(node) : null;
      },
      zoom: (factor) => zoomTo(level() * (1 + factor)),
      zoomIn: () => zoomTo(level() * ORGANIZATION_CHART_ZOOM_STEP),
      zoomOut: () => zoomTo(level() / ORGANIZATION_CHART_ZOOM_STEP),
      setZoom: (next) => zoomTo(next),
      getZoom: level,
      resetZoom: () => zoomTo(1),
      fitScreen: () => zoomTo(zoomer.fit(), true),
      centerOnNode: (id) => {
        const node = byId(id);
        if (!node) return Promise.resolve();
        for (const ancestor of organizationChartAncestors(node))
          if (!organizationChartExpanded(ancestor)) void change(ancestor, true);
        return centerOrganizationChartNode(node);
      },
      destroy() {
        observer.disconnect();
        highlight.destroy();
        zoomer.destroy();
        controller?.destroy();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
