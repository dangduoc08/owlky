import {
  createOrganizationChartController,
  ORGANIZATION_CHART_LENGTHS,
  type OrganizationChartAction,
  type OrganizationChartController,
  type OrganizationChartLength,
  organizationChartExpanded,
  organizationChartList,
  organizationChartLoaded,
  organizationChartNode,
  organizationChartNodeId,
  organizationChartOptions,
  organizationChartPlan,
  organizationChartStyle,
  organizationChartToggle,
  readNumber,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

const { options } = organizationChartOptions;
const LENGTHS = Object.keys(ORGANIZATION_CHART_LENGTHS) as OrganizationChartLength[];
/** Attributes the runtime follows: the lengths and the expand / collapse options. */
const OBSERVED = [
  ...LENGTHS.map((key) => options[key].attr),
  options.enableExpandCollapse.attr,
  options.expandCollapseOnNodeClick.attr,
  options.collapseBadgeThreshold.attr,
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
 * the core controller writes the badges.
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
      const values: Partial<Record<OrganizationChartLength, string | null>> = {};
      for (const key of LENGTHS) values[key] = element.getAttribute(options[key].attr);
      written = syncCustomProperties(element, organizationChartStyle(values), written);

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
      destroy() {
        observer.disconnect();
        controller?.destroy();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
