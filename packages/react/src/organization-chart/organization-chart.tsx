"use client";

import {
  centerOrganizationChartNode,
  clampOrganizationChartZoom,
  createOrganizationChartController,
  createOrganizationChartHighlight,
  createOrganizationChartZoom,
  ORGANIZATION_CHART_ZOOM_STEP,
  type OrganizationChartAction,
  type OrganizationChartController,
  type OrganizationChartDirection,
  type OrganizationChartEdgeColorMode,
  type OrganizationChartLineColor,
  type OrganizationChartLineStyle,
  type OrganizationChartZoomController,
  organizationChartAncestors,
  organizationChartAttributes,
  organizationChartLoaded,
  organizationChartNode,
  organizationChartNodeAttributes,
  organizationChartPlan,
  organizationChartStyle,
  organizationChartToggle,
  revealOrganizationChartNode,
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
import { IconButton } from "../icon-button/icon-button.js";
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
/** The highlighted node's `nodeId`, or `null`. */
const HighlightContext = createContext<string | null>(null);

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
  /**
   * Color of the lines from this node to its children (its whole branch with the chart's
   * `edgeColorMode="node"`): `divider`, `inherit` or a palette color. Default: the chart's `lineColor`.
   */
  lineColor?: OrganizationChartLineColor | undefined;
  /**
   * Style of the lines from this node to its children (its whole branch with the chart's
   * `edgeColorMode="node"`): `solid`, `dashed` or `dotted`. Default: the chart's `lineStyle`.
   */
  lineStyle?: OrganizationChartLineStyle | undefined;
}

/** One `li`: the label, then (collapsible charts) the toggle, then the children list. */
const NodeItem = forwardRef<
  HTMLLIElement,
  NodeProps & Omit<LiHTMLAttributes<HTMLLIElement>, "children">
>(function NodeItem(
  {
    label,
    children,
    nodeId,
    hasChildren,
    toggleLabel = "Child nodes",
    lineColor,
    lineStyle,
    ...props
  },
  ref,
) {
  const chart = useContext(ChartContext);
  const highlighted = useContext(HighlightContext);
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
    <li
      ref={merged}
      {...organizationChartNodeAttributes({ lineColor, lineStyle })}
      data-ok-node-id={nodeId}
      data-ok-highlighted={nodeId !== undefined && nodeId === highlighted ? "" : undefined}
      {...props}
    >
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
  /**
   * Highlights a node (`nodeId`) and its path to the root, expands its collapsed ancestors and
   * scrolls it into view. Resolves once it is in view. Calls `onHighlightedNodeChange`.
   */
  highlightNode(nodeId: string): Promise<void>;
  /** Removes the highlight. Calls `onHighlightedNodeChange` with `null`. */
  clearHighlight(): void;
  /** The highlighted node's `nodeId`, or `null`. */
  getHighlightedNode(): string | null;
  /** Multiplies the zoom level by `1 + factor`: positive zooms in, negative zooms out. Calls `onZoomChange`. */
  zoom(factor: number): void;
  /** Zooms in by one step (× 1.25). */
  zoomIn(): void;
  /** Zooms out by one step (÷ 1.25). */
  zoomOut(): void;
  /** Sets the zoom level (1 is 100%), within `minZoom` and `maxZoom`. */
  setZoom(level: number): void;
  /** The zoom level shown. */
  getZoom(): number;
  /** Back to 100%. */
  resetZoom(): void;
  /** The largest level up to 100% at which the whole chart fits its scroll area, then scrolls to its start. */
  fitScreen(): void;
  /**
   * Scrolls the chart's scroll area so the node (`nodeId`) is centered, after expanding its
   * collapsed ancestors. Resolves once the scroll starts.
   */
  centerOnNode(nodeId: string): Promise<void>;
}

/** A ref for `apiRef`. */
export function useOrganizationChartApiRef(): MutableRefObject<OrganizationChartApi | undefined> {
  return useRef<OrganizationChartApi | undefined>(undefined);
}

export interface OrganizationChartProps
  extends Omit<HTMLAttributes<HTMLUListElement>, "children">,
    Omit<NodeProps, "label" | "children" | "lineColor" | "lineStyle"> {
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
  /**
   * How a node's own `lineColor` and `lineStyle` apply: `default`, to the lines from that node to
   * its children only; `node`, to its whole branch, down to the nodes that set their own.
   * Default `"default"`.
   */
  edgeColorMode?: OrganizationChartEdgeColorMode | undefined;
  /** Corner radius where a connector turns: px, or a CSS length. Default `24`. */
  lineBorderRadius?: number | string | undefined;
  /** Space on each side of every node: px, or a CSS length. Default `4`. */
  nodePadding?: number | string | undefined;
  /**
   * A node with two or more children that have no children of their own stacks them in one
   * column, joined to it by a line along their side. Default `false`.
   */
  groupLeafNodes?: boolean | undefined;
  /** Space between grouped leaf nodes: px, or a CSS length. Default `8`. */
  groupLeafNodesSpacing?: number | string | undefined;
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
  /** Hovering or focusing a node highlights its path to the root and dims the other nodes. Default `false`. */
  highlightOnHover?: boolean | undefined;
  /** How much nodes outside a highlighted path fade, from 0 (not at all) to 1 (hidden). Default `0.7`. */
  dimOpacity?: number | undefined;
  /** Controlled `nodeId` of the highlighted node (a search result), or `null` for none. */
  highlightedNode?: string | null | undefined;
  /** The `nodeId` highlighted at first (uncontrolled). Default none. */
  defaultHighlightedNode?: string | null | undefined;
  /** Called with the highlighted `nodeId` (or `null`) after `highlightNode` or `clearHighlight`. */
  onHighlightedNodeChange?: ((nodeId: string | null) => void) | undefined;
  /**
   * Ctrl or Command with the mouse wheel, a trackpad pinch, the + / − / 0 keys and an
   * `OrganizationChartToolbar` zoom the chart; a mouse drag pans its scroll area. Default `false`.
   */
  enableZoomPan?: boolean | undefined;
  /** Controlled zoom level (1 is 100%), within `minZoom` and `maxZoom`. */
  zoom?: number | undefined;
  /** The zoom level at first (uncontrolled). Default `1`. */
  defaultZoom?: number | undefined;
  /** Called with the new level after a zoom by the user or a method call. */
  onZoomChange?: ((level: number) => void) | undefined;
  /** The smallest zoom level. Default `0.25`. */
  minZoom?: number | undefined;
  /** The largest zoom level. Default `2`. */
  maxZoom?: number | undefined;
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
      edgeColorMode,
      lineBorderRadius,
      nodePadding,
      groupLeafNodes = false,
      groupLeafNodesSpacing,
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
      highlightOnHover = false,
      dimOpacity,
      highlightedNode,
      defaultHighlightedNode,
      onHighlightedNodeChange,
      enableZoomPan = false,
      zoom,
      defaultZoom,
      onZoomChange,
      minZoom,
      maxZoom,
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
    const [highlighted, setHighlighted] = useControllableState<string | null>({
      value: highlightedNode,
      defaultValue: defaultHighlightedNode ?? null,
      onChange: (next) => onHighlightedNodeChange?.(next),
    });
    const [zoomState, setZoomState] = useControllableState<number>({
      value: zoom,
      defaultValue: defaultZoom ?? 1,
      onChange: (next) => onZoomChange?.(next),
    });
    const level = clampOrganizationChartZoom(zoomState, minZoom, maxZoom);
    const zoomLatest = useRef({ level, setZoomState });
    zoomLatest.current = { level, setZoomState };
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

    const latest = useRef({
      collapsed,
      setCollapsed,
      loadChildren,
      onExpand,
      onCollapse,
      highlighted,
      setHighlighted,
    });
    latest.current = {
      collapsed,
      setCollapsed,
      loadChildren,
      onExpand,
      onCollapse,
      highlighted,
      setHighlighted,
    };

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

    // The highlighted path's bar segments are measured by core (both implementations).
    useLayoutEffect(() => {
      const created = createOrganizationChartHighlight(root.current as HTMLUListElement);
      return () => created.destroy();
    }, []);

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

    // Zoom and pan (ADR-0056): core reports intent and keeps the view steady after each level.
    const zoomer = useRef<OrganizationChartZoomController | null>(null);
    useLayoutEffect(() => {
      const created = createOrganizationChartZoom(root.current as HTMLUListElement, {
        zoom: zoomLatest.current.level,
      });
      zoomer.current = created;
      return () => {
        created.destroy();
        zoomer.current = null;
      };
    }, []);
    useLayoutEffect(() => {
      zoomer.current?.update({
        enabled: enableZoomPan,
        zoom: level,
        min: minZoom,
        max: maxZoom,
        onZoom: (next) => zoomLatest.current.setZoomState(next),
      });
    });

    useEffect(() => {
      if (!apiRef) return;
      /** Plans a level (the view stays steady), then shows it. */
      const show = (target: number, start = false) => {
        const next = zoomer.current?.plan(target, { start });
        if (next !== undefined && next !== zoomLatest.current.level)
          zoomLatest.current.setZoomState(next);
      };
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
        highlightNode: (id) => {
          const node = organizationChartNode(root.current as HTMLUListElement, id);
          if (!node) return Promise.resolve();
          if (latest.current.highlighted !== id) latest.current.setHighlighted(id);
          // Collapsed ancestors open first (like the other methods, without onExpand).
          const changes = new Map<string, boolean>();
          for (const ancestor of organizationChartAncestors(node)) {
            const key = keys.current.get(ancestor);
            if (key !== undefined && latest.current.collapsed.includes(key)) changes.set(key, true);
          }
          if (changes.size > 0) apply(changes);
          return revealOrganizationChartNode(node);
        },
        clearHighlight: () => {
          if (latest.current.highlighted !== null) latest.current.setHighlighted(null);
        },
        getHighlightedNode: () => latest.current.highlighted,
        zoom: (factor) => show(zoomLatest.current.level * (1 + factor)),
        zoomIn: () => show(zoomLatest.current.level * ORGANIZATION_CHART_ZOOM_STEP),
        zoomOut: () => show(zoomLatest.current.level / ORGANIZATION_CHART_ZOOM_STEP),
        setZoom: (next) => show(next),
        getZoom: () => zoomLatest.current.level,
        resetZoom: () => show(1),
        fitScreen: () => {
          const next = zoomer.current?.fit();
          if (next !== undefined) show(next, true);
        },
        centerOnNode: (id) => {
          const node = organizationChartNode(root.current as HTMLUListElement, id);
          if (!node) return Promise.resolve();
          const changes = new Map<string, boolean>();
          for (const ancestor of organizationChartAncestors(node)) {
            const key = keys.current.get(ancestor);
            if (key !== undefined && latest.current.collapsed.includes(key)) changes.set(key, true);
          }
          if (changes.size > 0) apply(changes);
          return centerOrganizationChartNode(node);
        },
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

    const lengths = { lineHeight, lineWidth, lineBorderRadius, nodePadding, groupLeafNodesSpacing };
    // The level is written while zoom and pan is on or it isn't 100%, so other charts keep
    // their markup (and the stylesheet applies `zoom` only with the attribute).
    const zoomed = enableZoomPan || level !== 1 ? level : undefined;
    const look = { ...lengths, dimOpacity, zoom: zoomed, minZoom, maxZoom };
    return (
      <ul
        ref={merged}
        {...organizationChartAttributes({
          direction,
          ...lengths,
          lineColor,
          lineStyle,
          edgeColorMode,
          groupLeafNodes,
          enableExpandCollapse,
          expandCollapseOnNodeClick,
          collapseBadgeThreshold,
          highlightOnHover,
          dimOpacity,
          enableZoomPan,
          zoom: zoomed,
          minZoom,
          maxZoom,
        })}
        data-ok-runtime="off"
        style={{ ...(organizationChartStyle(look) as CSSProperties), ...style }}
        {...props}
      >
        <ChartContext.Provider value={state}>
          <HighlightContext.Provider value={highlighted}>
            <NodeItem
              label={label}
              nodeId={nodeId}
              hasChildren={hasChildren}
              toggleLabel={toggleLabel}
            >
              {children}
            </NodeItem>
          </HighlightContext.Provider>
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

/** lucide icons: `zoom-out`, `zoom-in`, `scan` (fit), `rotate-ccw` (reset). */
const ICONS = {
  out: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <path d="M8 11h6" />
    </>
  ),
  in: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </>
  ),
  fit: (
    <>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    </>
  ),
  reset: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
} as const;

const icon = (name: keyof typeof ICONS) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {ICONS[name]}
  </svg>
);

export interface OrganizationChartToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /** The `id` of the chart the buttons zoom (its `enableZoomPan` must be on). */
  chartId: string;
  /** Accessible name of the zoom in button. Default `"Zoom in"`. */
  zoomInLabel?: string | undefined;
  /** Accessible name of the zoom out button. Default `"Zoom out"`. */
  zoomOutLabel?: string | undefined;
  /** Accessible name of the fit button. Default `"Fit to screen"`. */
  fitLabel?: string | undefined;
  /** Accessible name of the reset button. Default `"Reset zoom"`. */
  resetLabel?: string | undefined;
}

/**
 * OrganizationChartToolbar — zoom out, the level, zoom in, fit and reset buttons for the chart
 * whose `id` is `chartId` (ADR-0056). Place it next to the chart's scroll area. The chart writes
 * the level and the limits (`aria-disabled`) on it. Name the group with `aria-label` (default
 * "Zoom").
 */
export const OrganizationChartToolbar = forwardRef<HTMLDivElement, OrganizationChartToolbarProps>(
  function OrganizationChartToolbar(
    {
      chartId,
      zoomInLabel = "Zoom in",
      zoomOutLabel = "Zoom out",
      fitLabel = "Fit to screen",
      resetLabel = "Reset zoom",
      ...props
    },
    ref,
  ) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a group of buttons, not a form field set
      <div
        ref={ref}
        data-ok-organization-chart-toolbar={chartId}
        role="group"
        aria-label="Zoom"
        {...props}
      >
        <IconButton
          size="sm"
          data-ok-organization-chart-zoom-out=""
          aria-label={zoomOutLabel}
          aria-controls={chartId}
        >
          {icon("out")}
        </IconButton>
        <output data-ok-organization-chart-zoom-value="" />
        <IconButton
          size="sm"
          data-ok-organization-chart-zoom-in=""
          aria-label={zoomInLabel}
          aria-controls={chartId}
        >
          {icon("in")}
        </IconButton>
        <IconButton
          size="sm"
          data-ok-organization-chart-fit=""
          aria-label={fitLabel}
          aria-controls={chartId}
        >
          {icon("fit")}
        </IconButton>
        <IconButton
          size="sm"
          data-ok-organization-chart-reset=""
          aria-label={resetLabel}
          aria-controls={chartId}
        >
          {icon("reset")}
        </IconButton>
      </div>
    );
  },
);
