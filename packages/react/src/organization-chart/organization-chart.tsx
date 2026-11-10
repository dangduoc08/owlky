"use client";

import {
  createOrganizationChartController,
  type OrganizationChartAction,
  type OrganizationChartController,
  type OrganizationChartDirection,
  type OrganizationChartLineColor,
  type OrganizationChartLineStyle,
  organizationChartAttributes,
  organizationChartLoaded,
  organizationChartPlan,
  organizationChartStyle,
  organizationChartToggle,
} from "@owlky/core";
import {
  Children,
  type CSSProperties,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CircularProgress } from "../circular-progress/circular-progress.js";
import { Collapse } from "../collapse/collapse.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

/** What the nodes of a collapsible chart read (ADR-0051); `null` when collapse is off. */
interface ChartState {
  collapsed: ReadonlySet<string>;
  loaded: ReadonlyMap<string, ReactNode>;
  loading: ReadonlySet<string>;
  badge: boolean;
  register(key: string, element: HTMLLIElement | null): void;
}

const ChartContext = createContext<ChartState | null>(null);

const hasNodes = (children: ReactNode) => Children.toArray(children).length > 0;
const NONE: readonly string[] = [];

/** The toggle's chevron (lucide `chevron-down`); the stylesheet turns it while expanded. */
const CHEVRON = (
  <svg
    data-ok-organization-chart-toggle-icon=""
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

interface NodeProps {
  /** Content of the node, such as a card. */
  label: ReactNode;
  /** Child nodes: `OrganizationChartNode` elements. */
  children?: ReactNode;
  /** The node's id, written as `data-ok-node-id`: the methods, callbacks and `collapsedNodes` use it. */
  nodeId?: string | undefined;
  /** The node has children that `loadChildren` loads on its first expand (collapsible charts). */
  hasChildren?: boolean | undefined;
  /** Accessible name of the node's toggle button, such as "Priya Raman's reports". Default `"Child nodes"`. */
  toggleLabel?: string | undefined;
}

/** One `li`: the label, then (collapsible charts) the toggle, then the children list. */
const NodeItem = forwardRef<
  HTMLLIElement,
  NodeProps & Omit<LiHTMLAttributes<HTMLLIElement>, "children">
>(function NodeItem(
  { label, children, nodeId, hasChildren, toggleLabel = "Child nodes", ...props },
  ref,
) {
  const chart = useContext(ChartContext);
  const internal = useId();
  const listId = useId();
  const key = nodeId ?? internal;
  const register = chart?.register;
  const own = useCallback(
    (element: HTMLLIElement | null) => register?.(key, element),
    [register, key],
  );
  const merged = useMergedRefs(ref, own);

  const content = hasNodes(children) ? children : chart?.loaded.get(key);
  const filled = hasNodes(content);
  // Children still to load: an empty, hidden list is the toggle's target until they arrive.
  const lazy = !filled && !!hasChildren && !chart?.loaded.has(key);
  const expanded = filled && !chart?.collapsed.has(key);

  let list: ReactNode = null;
  if (chart && (filled || lazy))
    list = (
      <>
        <button
          type="button"
          data-ok-organization-chart-toggle=""
          aria-expanded={expanded}
          aria-controls={listId}
          aria-busy={chart.loading.has(key) || undefined}
        >
          {/* The name is the content (the hidden label, then the visible count: label in name). */}
          <span data-ok-organization-chart-toggle-label="">{toggleLabel}</span> {CHEVRON}
          {lazy ? (
            <CircularProgress
              color="inherit"
              aria-hidden="true"
              data-ok-organization-chart-spinner=""
            />
          ) : null}
          {chart.badge ? <span data-ok-organization-chart-badge="" /> : null}
        </button>
        <Collapse component="ul" data-ok-organization-chart-children="" id={listId} in={expanded}>
          {content}
        </Collapse>
      </>
    );
  else if (filled) list = <ul data-ok-organization-chart-children="">{content}</ul>;

  return (
    <li ref={merged} data-ok-organization-chart-node="" data-ok-node-id={nodeId} {...props}>
      <div data-ok-organization-chart-label="">{label}</div>
      {list}
    </li>
  );
});

/** The chart's methods (ApexTree's graph methods), from `useOrganizationChartApiRef()`. */
export interface OrganizationChartApi {
  /** Expands a node; a node with `hasChildren` loads its children first. Resolves once done. */
  expand(nodeId: string): Promise<void>;
  /** Collapses a node. */
  collapse(nodeId: string): void;
  /** Whether a node shows its children. */
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

/** A ref for `apiRef`. */
export function useOrganizationChartApiRef(): MutableRefObject<OrganizationChartApi | undefined> {
  return useRef<OrganizationChartApi | undefined>(undefined);
}

export interface OrganizationChartProps
  extends Omit<HTMLAttributes<HTMLUListElement>, "children">,
    Omit<NodeProps, "label" | "children"> {
  /** Content of the root node, such as a card. */
  label: ReactNode;
  /** The root's children: `OrganizationChartNode` elements. */
  children?: ReactNode;
  /**
   * Where the root sits and which way the chart grows: `top` (children below), `bottom`, `left`
   * (the root at the inline start, so on the right of a right-to-left page) or `right`.
   * Default `"top"`.
   */
  direction?: OrganizationChartDirection | undefined;
  /** Height of the connectors between two levels: px, or a CSS length. Default `40`. */
  lineHeight?: number | string | undefined;
  /** Thickness of the connectors: px, or a CSS length. Default `1`. */
  lineWidth?: number | string | undefined;
  /** `divider` (default), `inherit` (the text color) or a palette color (its light tone). */
  lineColor?: OrganizationChartLineColor | undefined;
  /** `solid` (default), `dashed` or `dotted`. */
  lineStyle?: OrganizationChartLineStyle | undefined;
  /** Corner radius where a connector turns: px, or a CSS length. Default `24`. */
  lineBorderRadius?: number | string | undefined;
  /** Space on each side of every node: px, or a CSS length. Default `4`. */
  nodePadding?: number | string | undefined;
  /** Nodes with children get a toggle button that collapses and expands them. Default `false`. */
  enableExpandCollapse?: boolean | undefined;
  /** A click on a node's label, outside its buttons and links, also toggles it. Default `false`. */
  expandCollapseOnNodeClick?: boolean | undefined;
  /** Collapsed nodes show the number of hidden descendants on their toggle. Default `true`. */
  collapseBadgeEnabled?: boolean | undefined;
  /** Smallest number of hidden descendants the badge shows. Default `1`. */
  collapseBadgeThreshold?: number | undefined;
  /** Controlled ids of the collapsed nodes (`nodeId`). */
  collapsedNodes?: readonly string[] | undefined;
  /** Ids of the nodes collapsed at first (uncontrolled). Default none: every node is expanded. */
  defaultCollapsedNodes?: readonly string[] | undefined;
  /** Called with the collapsed ids after a toggle or a method call. */
  onCollapsedNodesChange?: ((nodeIds: string[]) => void) | undefined;
  /** Called when the user expands a node (toggle or label click), before it opens. */
  onExpand?: ((nodeId: string) => void) | undefined;
  /** Called when the user collapses a node, before it closes. */
  onCollapse?: ((nodeId: string) => void) | undefined;
  /**
   * Loads the children of a node with `hasChildren` on its first expand: resolve with
   * `OrganizationChartNode` elements (none makes it a leaf). A rejection keeps it collapsed.
   */
  loadChildren?: ((node: { id: string }) => Promise<ReactNode>) | undefined;
  /** Receives the chart's methods (`useOrganizationChartApiRef()`). */
  apiRef?: MutableRefObject<OrganizationChartApi | undefined> | undefined;
}

/**
 * OrganizationChart — spec: specs/components/organization-chart.md. A hierarchy drawn as nested
 * lists (`ul` › `li`) with connector lines. CSS only, unless `enableExpandCollapse` (ADR-0051):
 * then each branch gets a toggle and its children list is a Collapse. The lengths become private
 * custom properties on the root. Name it with `aria-label` / `aria-labelledby`.
 */
export const OrganizationChart = forwardRef<HTMLUListElement, OrganizationChartProps>(
  function OrganizationChart(
    {
      label,
      children,
      direction,
      lineHeight,
      lineWidth,
      lineColor,
      lineStyle,
      lineBorderRadius,
      nodePadding,
      enableExpandCollapse = false,
      expandCollapseOnNodeClick = false,
      collapseBadgeEnabled = true,
      collapseBadgeThreshold,
      collapsedNodes,
      defaultCollapsedNodes,
      onCollapsedNodesChange,
      onExpand,
      onCollapse,
      loadChildren,
      apiRef,
      nodeId,
      hasChildren,
      toggleLabel,
      style,
      ...props
    },
    ref,
  ) {
    const root = useRef<HTMLUListElement | null>(null);
    const merged = useMergedRefs(root, ref);
    const [collapsed, setCollapsed] = useControllableState<readonly string[]>({
      value: collapsedNodes,
      defaultValue: defaultCollapsedNodes ?? NONE,
      onChange: (next) => onCollapsedNodesChange?.([...next]),
    });
    const [loaded, setLoaded] = useState<ReadonlyMap<string, ReactNode>>(() => new Map());
    const [loading, setLoading] = useState<ReadonlySet<string>>(() => new Set());

    // Node keys (`nodeId`, or an internal id) ⟷ their `li`, for the controller and the methods.
    const elements = useRef(new Map<string, HTMLLIElement>());
    const keys = useRef(new WeakMap<Element, string>());
    const register = useCallback((key: string, element: HTMLLIElement | null) => {
      if (element) {
        elements.current.set(key, element);
        keys.current.set(element, key);
      } else elements.current.delete(key);
    }, []);

    const latest = useRef({ collapsed, setCollapsed, loadChildren, onExpand, onCollapse });
    latest.current = { collapsed, setCollapsed, loadChildren, onExpand, onCollapse };

    /** Applies key → expanded changes to the collapsed ids at once. */
    const apply = useCallback((changes: ReadonlyMap<string, boolean>) => {
      const current = latest.current;
      const next = new Set(current.collapsed);
      for (const [key, expand] of changes) {
        if (expand) next.delete(key);
        else next.add(key);
      }
      const same =
        next.size === current.collapsed.length && current.collapsed.every((key) => next.has(key));
      if (!same) current.setCollapsed([...next]);
    }, []);

    const pending = useRef(new Set<string>());
    const load = useCallback(
      (key: string): Promise<void> => {
        const loader = latest.current.loadChildren;
        if (!loader || pending.current.has(key)) return Promise.resolve();
        pending.current.add(key);
        setLoading((current) => new Set(current).add(key));
        const done = () => {
          pending.current.delete(key);
          setLoading((current) => {
            const next = new Set(current);
            next.delete(key);
            return next;
          });
        };
        return Promise.resolve()
          .then(() => loader({ id: key }))
          .then(
            (nodes) => {
              done();
              setLoaded((current) => new Map(current).set(key, nodes));
              if (latest.current.collapsed.includes(key)) apply(new Map([[key, true]]));
            },
            // Rejected: the node stays collapsed, and the next expand tries again.
            done,
          );
      },
      [apply],
    );

    const toggle = useCallback(
      (key: string, expand: boolean, user: boolean): Promise<void> => {
        const element = elements.current.get(key);
        if (!element || !organizationChartToggle(element)) return Promise.resolve();
        if (user) (expand ? latest.current.onExpand : latest.current.onCollapse)?.(key);
        if (expand && !organizationChartLoaded(element)) return load(key);
        apply(new Map([[key, expand]]));
        return Promise.resolve();
      },
      [apply, load],
    );

    const controller = useRef<OrganizationChartController | null>(null);
    useLayoutEffect(() => {
      if (!enableExpandCollapse) return;
      const created = createOrganizationChartController(root.current as HTMLUListElement);
      controller.current = created;
      return () => {
        created.destroy();
        controller.current = null;
      };
    }, [enableExpandCollapse]);

    useLayoutEffect(() => {
      controller.current?.update({
        expandCollapseOnNodeClick,
        collapseBadgeThreshold,
        onToggle: (node, expand) => {
          const key = keys.current.get(node);
          if (key !== undefined) void toggle(key, expand, true);
        },
      });
    });

    useEffect(() => {
      if (!apiRef) return;
      const plan = (action: OrganizationChartAction) => {
        const changes = new Map<string, boolean>();
        for (const [node, expand] of organizationChartPlan(
          root.current as HTMLUListElement,
          action,
        )) {
          const key = keys.current.get(node);
          if (key !== undefined) changes.set(key, expand);
        }
        apply(changes);
      };
      const subtree = (type: "expandSubtree" | "collapseSubtree", id: string) => {
        const node = elements.current.get(id);
        if (node) plan({ type, node });
      };
      apiRef.current = {
        expand: (id) => toggle(id, true, false),
        collapse: (id) => void toggle(id, false, false),
        isExpanded: (id) => {
          const node = elements.current.get(id);
          return !!node && organizationChartLoaded(node) && !latest.current.collapsed.includes(id);
        },
        expandAll: () => plan({ type: "expandAll" }),
        collapseAll: () => plan({ type: "collapseAll" }),
        expandToDepth: (depth) => plan({ type: "expandToDepth", depth }),
        expandSubtree: (id) => subtree("expandSubtree", id),
        collapseSubtree: (id) => subtree("collapseSubtree", id),
      };
      return () => {
        apiRef.current = undefined;
      };
    }, [apiRef, apply, toggle]);

    const collapsedSet = useMemo(() => new Set(collapsed), [collapsed]);
    const state = useMemo<ChartState | null>(
      () =>
        enableExpandCollapse
          ? { collapsed: collapsedSet, loaded, loading, badge: collapseBadgeEnabled, register }
          : null,
      [enableExpandCollapse, collapsedSet, loaded, loading, collapseBadgeEnabled, register],
    );

    const lengths = { lineHeight, lineWidth, lineBorderRadius, nodePadding };
    return (
      <ul
        ref={merged}
        {...organizationChartAttributes({
          direction,
          ...lengths,
          lineColor,
          lineStyle,
          enableExpandCollapse,
          expandCollapseOnNodeClick,
          collapseBadgeThreshold,
        })}
        data-ok-runtime="off"
        style={{ ...(organizationChartStyle(lengths) as CSSProperties), ...style }}
        {...props}
      >
        <ChartContext.Provider value={state}>
          <NodeItem
            label={label}
            nodeId={nodeId}
            hasChildren={hasChildren}
            toggleLabel={toggleLabel}
          >
            {children}
          </NodeItem>
        </ChartContext.Provider>
      </ul>
    );
  },
);

export interface OrganizationChartNodeProps
  extends NodeProps,
    Omit<LiHTMLAttributes<HTMLLIElement>, "children"> {}

/**
 * OrganizationChartNode — one node (`li`): its label and, below it, its children. In a
 * collapsible chart a node with children (or `hasChildren`) gets a toggle button.
 */
export const OrganizationChartNode = forwardRef<HTMLLIElement, OrganizationChartNodeProps>(
  function OrganizationChartNode(props, ref) {
    return <NodeItem ref={ref} {...props} />;
  },
);
