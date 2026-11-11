import {
  CHART_TEXT_ATTRIBUTES,
  type ChartActive,
  type ChartBeeswarmSpread,
  type ChartColor,
  type ChartCrossfilter,
  type ChartCurve,
  type ChartDataLabelPosition,
  type ChartDataPoint,
  type ChartDirection,
  type ChartEdgeStyle,
  type ChartExportFormat,
  type ChartFill,
  type ChartFillFrom,
  type ChartGestureMode,
  type ChartGrid,
  type ChartGroupFilter,
  type ChartHierarchyAction,
  type ChartLayoutType,
  type ChartLeaf,
  type ChartLegend,
  type ChartLegendItem,
  type ChartLink,
  type ChartLocaleText,
  type ChartMarkerShape,
  type ChartNode,
  type ChartOrientation,
  type ChartPart,
  type ChartPattern,
  type ChartPointInput,
  type ChartRender,
  type ChartSelectionDetail,
  type ChartSeries,
  type ChartStackType,
  type ChartStreamOffset,
  type ChartStreamOrder,
  type ChartTableCell,
  type ChartTableModel,
  type ChartTool,
  type ChartToolItem,
  type ChartTooltip,
  type ChartTooltipCorner,
  type ChartTooltipMode,
  type ChartType,
  type ChartUnitLayout,
  type ChartViolinNormalize,
  type ChartViolinSide,
  type ChartViolinWhiskers,
  type ChartXType,
  type ChartZoom,
  type ChartZoomReason,
  type ChartZoomType,
  chartActiveAt,
  chartActiveMarks,
  chartActiveNodes,
  chartBrushCategories,
  chartColors,
  chartDrillLabels,
  chartDrillUp,
  chartFilterCategories,
  chartFilterLabels,
  chartFilterText,
  chartHierarchyAction,
  chartIdPrefix,
  chartListText,
  chartMarkAt,
  chartMarkPoint,
  chartOptions,
  chartSelection,
  chartToolbar,
  chartToolLabels,
  chartTools,
  chartTooltip,
  chartTooltipContext,
  chartTooltipFixed,
  chartTreeMarkOf,
  chartZoomKey,
  createChartGestures,
  exportChart,
  hasChartDataPoint,
  isHierarchyChart,
  linkChart,
  nextChartActive,
  parseChartColorRanges,
  parseChartColors,
  parseChartDiscreteMarkers,
  parseChartDumbbellColors,
  parseChartIndicators,
  parseChartList,
  parseChartStripeColors,
  parseChartYAxes,
  placeChartTooltip,
  readChartAnnotations,
  readChartHierarchyTable,
  readChartSankeyTable,
  readChartTable,
  readNumber,
  readStyle,
  renderChart,
  sameChartActive,
  toggleChartCollapsed,
  toggleChartSelection,
  zoomChartBy,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

export interface ChartFormatters {
  /** Replaces the value text (tooltip, value axis; `series` is -1 for axis ticks). */
  value?: ((value: number, series: number) => string) | undefined;
  /** Replaces the x text (axis labels, tooltip title). */
  label?: ((x: string | number) => string) | undefined;
  /** Replaces the values printed on the chart (pie and donut labels get the percentage). */
  dataLabel?: ((value: number, series: number, index: number) => string) | undefined;
}

/** New points per series (in series order), as ApexCharts' `appendData`. */
export type ChartAppendData = readonly { readonly data: readonly ChartPointInput[] }[];

export interface ChartAppendOptions {
  /** Categories (or dates) of the new points, on category and date axes. */
  readonly categories?: readonly (string | number | Date)[] | undefined;
  /** Keeps only the last `limit` points of each series (a sliding window for live data). */
  readonly limit?: number | undefined;
}

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface ChartEvents {
  /** Before a legend item hides or shows a series. Call `preventDefault()` to refuse. */
  toggle: EventSpec<{ index: number; hidden: boolean; hiddenSeries: number[] }, true>;
  /** After the highlighted point or mark changed (`null`: none). */
  active: EventSpec<{ active: ChartActive | null }>;
  /** Before the zoom window changes. Cancelable only when `reason` is `user`; `range` is `null` once reset. */
  zoom: EventSpec<{ range: ChartZoom | null; reason: ChartZoomReason }, boolean>;
  /**
   * After a click, Enter or Space selected or cleared a point, slice or cell (one event per point
   * it toggled), with the point, whether it is selected now and every selected point.
   */
  select: EventSpec<ChartSelectionDetail>;
  /**
   * After the group's crossfilter changed (charts with `data-ok-crossfilter`): the filtered
   * category indexes (`null`: none) and whether this chart set it.
   */
  filter: EventSpec<{ categories: number[] | null; own: boolean }>;
  /**
   * Tree charts with `data-ok-enable-expand-collapse`: before a click, Enter or Space hides or
   * shows a node's children. Call `preventDefault()` to refuse.
   */
  expand: EventSpec<{ id: string; expanded: boolean; collapsedNodes: string[] }, true>;
  /**
   * Sunburst and icicle charts: before a click, Enter, Space, Escape or the **Back** button zooms into a node
   * (`id`, and the names from the root in `path`) or out (`null` at the top). Call
   * `preventDefault()` to refuse.
   */
  drill: EventSpec<{ id: string | null; path: string[] }, true>;
}

export interface ChartInstance extends ComponentInstance {
  /** Indexes of the series hidden through the legend. */
  readonly hiddenSeries: readonly number[];
  /** Hides exactly these series (no event). */
  setHiddenSeries(hidden: readonly number[]): void;
  /** The active category or point, or `null`. */
  readonly active: ChartActive | null;
  /** Shows the tooltip for a category or point (`null` hides it; no event). */
  setActive(active: ChartActive | null): void;
  /** Sets formatters (functions can't be attributes). Redraws. */
  setFormatters(formatters: ChartFormatters): void;
  /** Reads the table and the options again and redraws (done automatically on changes). */
  refresh(): void;
  /**
   * Replaces the data (and the categories, when given): rewrites the data table in place and
   * redraws once. The active item and hidden series stay (by position). No event.
   */
  updateSeries(
    series: readonly ChartSeries[],
    categories?: readonly (string | number | Date)[],
  ): void;
  /** Appends points to the series (and categories); `limit` drops the oldest. No event. */
  appendData(data: ChartAppendData, options?: ChartAppendOptions): void;
  /** The visible window of the x axis (category indexes or x values), or `null`. */
  readonly zoomRange: ChartZoom | null;
  /** Zooms (`null`: the whole axis); its group and brush charts follow. No event. */
  setZoomRange(range: ChartZoom | null): void;
  /** Downloads the chart as SVG, PNG or CSV (only during a user gesture: rejects otherwise). */
  exportChart(format: ChartExportFormat): Promise<void>;
  /** Localized texts: tool names, the export error and part labels (tables carry their own). */
  setLocaleText(text: ChartLocaleText): void;
  /** The selected points (`{ seriesIndex, dataPointIndex }`), in the order they were selected. */
  readonly selectedDataPoints: readonly ChartDataPoint[];
  /** Selects exactly these points (invalid entries are dropped; no event). */
  setSelectedDataPoints(points: readonly ChartDataPoint[]): void;
  /**
   * Selects a point, or clears it when it is selected (as a click does: without
   * `data-ok-allow-multiple-data-points-selection`, the others are cleared; no event).
   */
  toggleDataPointSelection(seriesIndex: number, dataPointIndex: number): void;
  /** The group's crossfilter: the filtered category indexes, or `null`. */
  readonly filter: readonly number[] | null;
  /** Clears the group's crossfilter (its source clears its selection; no event here). */
  clearFilter(): void;
  /** Tree charts: ids of the nodes whose children are hidden (`data-ok-collapsed-nodes`). */
  readonly collapsedNodes: readonly string[];
  /** Tree charts: hides the children of exactly these nodes (no event). */
  setCollapsedNodes(ids: readonly string[]): void;
  /** Sunburst and icicle charts: the id of the node zoomed into (`data-ok-drill-node`), or `null`. */
  readonly drillNode: string | null;
  /** Sunburst and icicle charts: zooms into a node (`null`: the whole chart; no event). */
  setDrillNode(id: string | null): void;
}

const SVG = "http://www.w3.org/2000/svg";
const o = chartOptions.options;
/** Root attributes that change the drawing (the runtime's own `data-ok-ready` is not one). */
const OPTION_ATTRIBUTES = [
  ...Object.values(o)
    .map((spec) => spec.attr)
    .filter((attr) => attr.startsWith("data-ok-")),
  ...Object.values(CHART_TEXT_ATTRIBUTES),
];
const text = (element: Element, name: string) => element.getAttribute(name) ?? undefined;
/** Core nodes → SVG elements (attributes and text only: never markup). */
function build(nodes: readonly ChartNode[]): SVGElement[] {
  return nodes.map((node) => {
    const element = document.createElementNS(SVG, node.tag);
    for (const [name, value] of Object.entries(node.attrs)) element.setAttribute(name, value);
    if (node.text !== undefined) element.textContent = node.text;
    else if (node.children) element.append(...build(node.children));
    return element;
  });
}

/** Makes `element`'s attributes exactly `attrs` (only the differences are written). */
function syncAttributes(element: Element, attrs: Readonly<Record<string, string>>) {
  for (const { name } of [...element.attributes])
    if (!Object.hasOwn(attrs, name)) element.removeAttribute(name);
  for (const [name, value] of Object.entries(attrs))
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/**
 * Updates `parent`'s children to match `nodes` in place: same-tag elements keep their identity
 * and only changed attributes and texts are written, so live updates stay cheap (ADR-0029).
 */
function patch(parent: Element, nodes: readonly ChartNode[]) {
  const children = parent.children;
  nodes.forEach((node, index) => {
    const element = children[index];
    if (!element || element.localName !== node.tag) {
      const fresh = build([node])[0] as SVGElement;
      if (element) element.replaceWith(fresh);
      else parent.append(fresh);
      return;
    }
    syncAttributes(element, node.attrs);
    if (node.text !== undefined) {
      if (element.textContent !== node.text) element.textContent = node.text;
    } else patch(element, node.children ?? []);
  });
  while (children.length > nodes.length) (parent.lastElementChild as Element).remove();
}

/** A table row with exactly `count` cells of `tag` (cells are reused). */
function rowOf(parent: HTMLTableSectionElement, index: number, count: number, tag: "th" | "td") {
  const row = parent.rows[index] ?? parent.insertRow();
  while (row.cells.length > count) (row.lastElementChild as Element).remove();
  while (row.cells.length < count) row.append(document.createElement(tag));
  return row;
}

/** Writes a table cell: text, `data-ok-*` attributes, scope and spans (only what changed). */
function writeCell(cell: HTMLTableCellElement, model: ChartTableCell, scope?: string) {
  syncAttributes(cell, {
    ...model.attrs,
    ...(scope ? { scope } : {}),
    ...(model.colSpan ? { colspan: String(model.colSpan) } : {}),
    ...(model.rowSpan ? { rowspan: String(model.rowSpan) } : {}),
  });
  if (cell.textContent !== model.text) cell.textContent = model.text;
}

/** Makes the data table match a table model in place (the caption is kept). */
function writeTable(table: HTMLTableElement, model: ChartTableModel) {
  const head = table.tHead ?? table.createTHead();
  const headRows = model.parts.length ? 2 : 1;
  while (head.rows.length > headRows) (head.lastElementChild as Element).remove();
  const top = rowOf(head, 0, model.head.length, "th");
  model.head.forEach((cell, i) => {
    writeCell(top.cells[i] as HTMLTableCellElement, cell, cell.colSpan ? "colgroup" : "col");
  });
  if (model.parts.length) {
    const parts = rowOf(head, 1, model.parts.length, "th");
    model.parts.forEach((cell, i) => {
      writeCell(parts.cells[i] as HTMLTableCellElement, cell, "col");
    });
  }
  const body = table.tBodies[0] ?? table.createTBody();
  while (body.rows.length > model.rows.length) (body.lastElementChild as Element).remove();
  model.rows.forEach((row, index) => {
    const tr = rowOf(body, index, row.cells.length + 1, "td");
    // The first cell is the row header.
    let first = tr.cells[0] as HTMLTableCellElement;
    if (first.localName !== "th") {
      const th = document.createElement("th");
      first.replaceWith(th);
      first = th;
    }
    writeCell(first, row.header, "row");
    row.cells.forEach((cell, i) => {
      let td = tr.cells[i + 1] as HTMLTableCellElement;
      if (td.localName !== "td") {
        const fresh = document.createElement("td");
        td.replaceWith(fresh);
        td = fresh;
      }
      writeCell(td, cell);
    });
  });
}

/** A valid optional palette color attribute, or `undefined`. */
const colorAttribute = (element: Element, name: string) => {
  const value = element.getAttribute(name);
  return chartColors.includes(value as ChartColor) ? (value as ChartColor) : undefined;
};

/** Makes `box`'s buttons match the toolbar items (in place: a pressed button keeps its focus). */
function syncTools(box: HTMLElement, items: readonly ChartToolItem[]) {
  const buttons = [...box.querySelectorAll<HTMLButtonElement>(":scope > [data-ok-chart-tool]")];
  items.forEach((item, index) => {
    let button = buttons[index];
    if (!button || button.getAttribute("data-ok-chart-tool") !== item.tool) {
      const fresh = document.createElement("button");
      fresh.type = "button";
      fresh.setAttribute("data-ok-chart-tool", item.tool);
      if (button) button.replaceWith(fresh);
      else box.insertBefore(fresh, box.querySelector(":scope > [data-ok-chart-status]"));
      button = fresh;
      if (item.icon) button.append(...build([item.icon]));
      else button.textContent = item.text as string;
    }
    button.setAttribute("aria-label", item.label);
    button.title = item.label;
    if (item.pressed === undefined) button.removeAttribute("aria-pressed");
    else button.setAttribute("aria-pressed", String(item.pressed));
    button.disabled = item.disabled === true;
  });
  for (const extra of buttons.slice(items.length)) extra.remove();
}

/** Least height of a sparkline without `data-ok-height` (the CSS default). */
const SPARKLINE_HEIGHT = 40;

interface ChartSource {
  readonly series: readonly ChartSeries[];
  readonly categories: readonly (string | number | Date)[];
}
const EMPTY: ChartSource = { series: [], categories: [] };

let counter = 0;

/**
 * Chart — spec: specs/components/chart.md (ADR-0024)
 *
 * Markup:  <figure data-ok-chart data-ok-type="line" data-ok-x-type="category" …>
 *            <table data-ok-chart-data><caption>Sales</caption>
 *              <thead><tr><th scope="col">Month</th><th scope="col" data-ok-color="info">Series A</th></tr></thead>
 *              <tbody><tr><th scope="row">Jan</th><td>31</td></tr> …</tbody>
 *            </table>
 *          </figure>
 * Behavior: draws the legend, the plot (SVG) and the tooltip from the table, at the plot's
 *          width; redraws when the table, the options or the size change (patching the SVG in
 *          place). `updateSeries` / `appendData` set the data from JavaScript and rewrite the table
 *          to match (ADR-0029). Without JavaScript the table stays visible.
 * Events:  ok:chart:toggle (cancelable, detail `{ index, hidden, hiddenSeries }`),
 *          ok:chart:active (detail `{ active }`), ok:chart:zoom, ok:chart:select (detail
 *          `{ seriesIndex, dataPointIndex, selected, selectedDataPoints }`).
 */
export const chart = defineComponent<ChartInstance, ChartEvents>({
  name: "chart",
  selector: "[data-ok-chart]",

  setup(element, { emit, signal }) {
    const table = element.querySelector<HTMLTableElement>(":scope > [data-ok-chart-data]");
    const created: Element[] = [];
    const id = chartIdPrefix(element.id || `h${++counter}`);
    let formatters: ChartFormatters = {};
    let active: ChartActive | null = null;
    let render: ChartRender | undefined;
    /** Data set through `updateSeries` / `appendData`; `undefined` while the table is the source. */
    let source: ChartSource | undefined;
    // Phase 4: texts, zoom (kept with the x axis it was set on), pan tool, drag and brush ranges.
    let localeText: ChartLocaleText = {};
    let partLabels: Partial<Record<ChartPart, string>> = {};
    let zoomState: { range: ChartZoom | null; from: ChartZoom | null | undefined } = {
      range: null,
      from: undefined,
    };
    let pan = false;
    let preview: ChartZoom | null = null;
    let selection: ChartZoom | null = null;
    let link: ChartLink | undefined;
    let linkKey = "";
    /** Selected data points (4.18.60). */
    let selected: ChartDataPoint[] = [];
    /** Crossfilter (4.18.19, ADR-0054): the group's filter as the registry told it. */
    let groupFilter: ChartGroupFilter | null = null;
    const crossfilter = () =>
      element.hasAttribute(o.crossfilter.attr)
        ? (readStyle(element, o.crossfilter) as ChartCrossfilter)
        : undefined;
    let drawnZoom = "";
    const annotationsList = () => element.querySelector(":scope > [data-ok-chart-annotations]");

    const legend = element.querySelector<HTMLElement>(":scope > [data-ok-chart-legend]");
    let hidden: number[] = legend
      ? [...legend.querySelectorAll("[data-ok-chart-legend-item]")].flatMap((item, index) =>
          item.getAttribute("aria-pressed") === "false" ? [index] : [],
        )
      : [];

    const plot = document.createElement("div");
    plot.setAttribute("data-ok-chart-plot", "");
    plot.setAttribute("role", "group");
    plot.setAttribute("aria-roledescription", "chart");
    plot.tabIndex = 0;
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("data-ok-chart-svg", "");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const tip = document.createElement("div");
    tip.setAttribute("data-ok-chart-tooltip", "");
    tip.setAttribute("role", "status");
    tip.hidden = true;
    plot.append(svg, tip);
    element.insertBefore(plot, table);
    created.push(plot);

    /**
     * The plot's size as the ResizeObserver last reported it, so redraws never force a layout
     * (live updates); read from the plot until the observer first reports.
     */
    let box: { width: number; height: number } | undefined;
    const measured = () =>
      (box ? box.width : Math.round(plot.clientWidth)) || render?.layout.width || 640;
    /** Sparklines: the plot's height (their SVG is out of flow: no feedback loop). */
    const measuredHeight = () => (box ? box.height : Math.round(plot.clientHeight));

    const drawLegend = (items: readonly ChartLegendItem[] | null) => {
      let box = element.querySelector<HTMLElement>(":scope > [data-ok-chart-legend]");
      if (!items) {
        box?.remove();
        return;
      }
      if (!box) {
        box = document.createElement("div");
        box.setAttribute("data-ok-chart-legend", "");
        element.insertBefore(box, plot);
        created.push(box);
      }
      const buttons = [
        ...box.querySelectorAll<HTMLElement>(":scope > [data-ok-chart-legend-item]"),
      ];
      // Without toggling (4.18.64), items are labels (`span`), not buttons.
      const tag = element.hasAttribute(o.disableLegendToggle.attr) ? "span" : "button";
      // Update in place: the button being clicked keeps its focus.
      items.forEach((item, index) => {
        let button = buttons[index];
        if (!button || button.localName !== tag) {
          const fresh = document.createElement(tag);
          if (fresh instanceof HTMLButtonElement) fresh.type = "button";
          fresh.setAttribute("data-ok-chart-legend-item", "");
          if (button) button.replaceWith(fresh);
          else (box as HTMLElement).append(fresh);
          button = fresh;
        }
        button.setAttribute("data-ok-color", item.color);
        if (tag === "button") button.setAttribute("aria-pressed", String(!item.hidden));
        const current = button.firstElementChild;
        if (
          button.textContent !== item.name + (item.value ?? "") ||
          !current ||
          current.getAttribute("data-ok-shape") !== (item.shape ?? null) ||
          current.getAttribute("data-ok-pattern") !== (item.pattern ?? null)
        ) {
          const marker = document.createElement("span");
          marker.setAttribute("data-ok-chart-legend-marker", "");
          // Non-color cues (4.18.62): the series' shape or pattern.
          if (item.shape) marker.setAttribute("data-ok-shape", item.shape);
          if (item.pattern) marker.setAttribute("data-ok-pattern", item.pattern);
          const parts: (Node | string)[] = [marker, item.name];
          if (item.value !== undefined) {
            const value = document.createElement("span");
            value.setAttribute("data-ok-chart-legend-value", "");
            value.textContent = item.value;
            parts.push(value);
          }
          button.replaceChildren(...parts);
        }
      });
      for (const extra of buttons.slice(items.length)) extra.remove();
    };

    // Only called after the first draw.
    const drawActive = () => {
      const current = render as ChartRender;
      const tooltip = chartTooltip(current.data, current.layout, current.format, active, selected);
      const shown = tooltip && tooltip.rows.length > 0 ? tooltip : null;
      const hover = chartActiveNodes(current.layout, shown ? active : null);
      svg.querySelector("[data-ok-chart-crosshair]")?.replaceChildren(...build(hover.under));
      svg.querySelector("[data-ok-chart-active]")?.replaceChildren(...build(hover.over));
      if (!shown) {
        tip.hidden = true;
        tip.replaceChildren();
        return;
      }
      // Custom content (4.18.63): the author's template, its slots filled as text.
      const template = element.querySelector<HTMLTemplateElement>(
        ":scope > template[data-ok-chart-tooltip]",
      );
      if (template && active) fillTooltip(tip, template, shown, active);
      else defaultTooltip(shown);
      tip.hidden = false;
      const scale = plot.clientWidth / current.layout.width || 1;
      const { left, top } = placeChartTooltip(
        { x: shown.x * scale, y: shown.y * scale },
        { width: tip.offsetWidth, height: tip.offsetHeight },
        { width: plot.clientWidth, height: plot.clientHeight },
        chartTooltipFixed(
          element.hasAttribute(o.tooltipFixed.attr)
            ? (readStyle(element, o.tooltipFixed) as ChartTooltipCorner)
            : undefined,
          current.layout,
          scale,
        ),
      );
      // CSSOM, not a style string (strict CSP).
      tip.style.setProperty("--_ok-chart-tip-x", `${left}px`);
      tip.style.setProperty("--_ok-chart-tip-y", `${top}px`);
    };

    /** The built-in tooltip: title, the "Selected" state and one row per value. */
    const defaultTooltip = (shown: ChartTooltip) => {
      const title = document.createElement("div");
      title.setAttribute("data-ok-chart-tooltip-title", "");
      title.textContent = shown.title;
      const rows = document.createElement("div");
      rows.setAttribute("data-ok-chart-tooltip-rows", "");
      for (const row of shown.rows) {
        const line = document.createElement("div");
        line.setAttribute("data-ok-chart-tooltip-row", "");
        const marker = document.createElement("span");
        marker.setAttribute("data-ok-chart-tooltip-marker", "");
        marker.setAttribute("data-ok-color", row.color);
        if (row.shape) marker.setAttribute("data-ok-shape", row.shape);
        if (row.pattern) marker.setAttribute("data-ok-pattern", row.pattern);
        const name = document.createElement("span");
        name.textContent = row.name;
        const value = document.createElement("span");
        value.setAttribute("data-ok-chart-tooltip-value", "");
        value.textContent = row.value;
        line.append(marker, name, value);
        rows.append(line);
      }
      if (shown.selected) {
        // The selection is announced with the values (the drawing is hidden from screen readers).
        const state = document.createElement("div");
        state.setAttribute("data-ok-chart-tooltip-state", "");
        state.textContent = localeText.selected ?? chartToolLabels.selected;
        tip.replaceChildren(title, state, rows);
      } else tip.replaceChildren(title, rows);
    };

    /**
     * A custom tooltip from `template[data-ok-chart-tooltip]`: `[data-ok-chart-tooltip-slot]`
     * elements get the `title`, the `state` (removed unless selected), one copy of `row` per value
     * with its `name`, `value` and `marker` (color and cues); never markup.
     */
    const fillTooltip = (
      box: HTMLElement,
      template: HTMLTemplateElement,
      shown: ChartTooltip,
      item: ChartActive,
    ) => {
      const context = chartTooltipContext((render as ChartRender).layout, shown, item);
      const content = template.content.cloneNode(true) as DocumentFragment;
      const slots = (root: ParentNode, name: string) => [
        ...root.querySelectorAll<HTMLElement>(`[data-ok-chart-tooltip-slot="${name}"]`),
      ];
      for (const slot of slots(content, "title")) slot.textContent = context.title;
      for (const slot of slots(content, "state")) {
        if (!context.selected) slot.remove();
        else if (!slot.textContent?.trim())
          slot.textContent = localeText.selected ?? chartToolLabels.selected;
      }
      for (const proto of slots(content, "row")) {
        for (const row of context.rows) {
          const copy = proto.cloneNode(true) as HTMLElement;
          for (const slot of slots(copy, "name")) slot.textContent = row.name;
          for (const slot of slots(copy, "value")) slot.textContent = row.value;
          for (const slot of slots(copy, "marker")) {
            slot.setAttribute("data-ok-color", row.color);
            if (row.shape) slot.setAttribute("data-ok-shape", row.shape);
            if (row.pattern) slot.setAttribute("data-ok-pattern", row.pattern);
          }
          proto.before(copy);
        }
        proto.remove();
      }
      box.replaceChildren(content);
    };

    const draw = () => {
      // First: the table leaves the flow before the plot is measured (sparklines fill the root).
      element.setAttribute("data-ok-ready", "");
      const xType = readStyle(element, o.xType) as ChartXType;
      const type = readStyle(element, o.type) as ChartType;
      // Sankey charts (ADR-0047): the table lists links, not series; hierarchy charts (ADR-0058)
      // one node per row.
      const flow = type === "sankey" && table ? readChartSankeyTable(table) : undefined;
      const tree = isHierarchyChart(type) && table ? readChartHierarchyTable(table) : undefined;
      const read = flow || tree ? EMPTY : data();
      const { series, categories } = read;
      if (flow) partLabels = flow.partLabels;
      else if (tree) partLabels = tree.partLabels;
      else if ("partLabels" in read && read.partLabels) partLabels = read.partLabels;
      const brushTarget = text(element, CHART_TEXT_ATTRIBUTES.brushTarget);
      const label = table?.caption?.textContent?.trim() ?? "";
      if (label) plot.setAttribute("aria-label", label);
      else plot.removeAttribute("aria-label");
      const sparkline = element.hasAttribute(o.sparkline.attr);
      const given = readNumber(element, o.height) as number;
      // Sparklines: the container's height, at least `data-ok-height` (CSSOM, strict CSP).
      if (sparkline && element.hasAttribute(o.height.attr))
        plot.style.setProperty("--_ok-chart-height", `${given}px`);
      else plot.style.removeProperty("--_ok-chart-height");
      const height = sparkline
        ? measuredHeight() || (element.hasAttribute(o.height.attr) ? given : SPARKLINE_HEIGHT)
        : given;
      render = renderChart({
        type,
        xType,
        series,
        categories,
        nodes: flow?.nodes,
        edges: flow?.edges,
        orientation: readStyle(element, o.orientation) as ChartOrientation,
        nodeWidth: readNumber(element, o.nodeWidth) as number | undefined,
        whitespace: readNumber(element, o.whitespace) as number | undefined,
        edgeOpacity: readNumber(element, o.edgeOpacity) as number | undefined,
        axisTitles: parseChartList(element.getAttribute(CHART_TEXT_ATTRIBUTES.axisTitles)),
        hierarchy: tree?.hierarchy,
        direction: readStyle(element, o.direction) as ChartDirection | undefined,
        layoutType: readStyle(element, o.layoutType) as ChartLayoutType | undefined,
        edgeStyle: readStyle(element, o.edgeStyle) as ChartEdgeStyle | undefined,
        enableExpandCollapse: element.hasAttribute(o.enableExpandCollapse.attr),
        collapsedNodes: collapsedNodes(),
        drillNode: text(element, CHART_TEXT_ATTRIBUTES.drillNode),
        disableZoomOnClick: element.hasAttribute(o.disableZoomOnClick.attr),
        innerSize: readNumber(element, o.innerSize) as number | undefined,
        spacing: readNumber(element, o.spacing) as number | undefined,
        // The default depends on the type (sunburst extend, icicle stop): only a given value.
        leaf: element.hasAttribute(o.leaf.attr)
          ? (readStyle(element, o.leaf) as ChartLeaf)
          : undefined,
        tint: readNumber(element, o.tint) as number | undefined,
        zoomType: readStyle(element, o.zoomType) as ChartZoomType | undefined,
        indicators: parseChartIndicators(element.getAttribute(CHART_TEXT_ATTRIBUTES.indicators)),
        navigator: element.hasAttribute(o.navigator.attr),
        paneHeight: readNumber(element, o.paneHeight) as number | undefined,
        curve: readStyle(element, o.curve) as ChartCurve,
        fill: readStyle(element, o.fill) as ChartFill,
        legend: readStyle(element, o.legend) as ChartLegend,
        stacked: element.hasAttribute(o.stacked.attr),
        stackType: readStyle(element, o.stackType) as ChartStackType | undefined,
        stackOnlyBar: element.hasAttribute(o.stackOnlyBar.attr),
        stackTotals: element.hasAttribute(o.stackTotals.attr),
        dataLabelPosition: readStyle(element, o.dataLabelPosition) as
          | ChartDataLabelPosition
          | undefined,
        backgroundBars: element.hasAttribute(o.backgroundBars.attr),
        backgroundBarColors: parseChartColors(
          element.getAttribute(CHART_TEXT_ATTRIBUTES.backgroundBarColors),
        ),
        backgroundBarOpacity: readNumber(element, o.backgroundBarOpacity) as number | undefined,
        backgroundBarRadius: readNumber(element, o.backgroundBarRadius) as number | undefined,
        markerShape: element.hasAttribute(o.markerShape.attr)
          ? (readStyle(element, o.markerShape) as ChartMarkerShape)
          : undefined,
        fillPattern: element.hasAttribute(o.fillPattern.attr)
          ? (readStyle(element, o.fillPattern) as ChartPattern)
          : undefined,
        strokeWidth: readNumber(element, o.strokeWidth) as number | undefined,
        colorBlindMode: element.hasAttribute(o.colorBlindMode.attr),
        tooltip: readStyle(element, o.tooltip) as ChartTooltipMode,
        showForSingleSeries: element.hasAttribute(o.showForSingleSeries.attr),
        customLegendItems: parseChartList(
          element.getAttribute(CHART_TEXT_ATTRIBUTES.customLegendItems),
        ),
        grid: element.hasAttribute(o.grid.attr)
          ? (readStyle(element, o.grid) as ChartGrid)
          : undefined,
        gridRowColors: parseChartStripeColors(
          element.getAttribute(CHART_TEXT_ATTRIBUTES.gridRowColors),
        ),
        gridColumnColors: parseChartStripeColors(
          element.getAttribute(CHART_TEXT_ATTRIBUTES.gridColumnColors),
        ),
        gridRowOpacity: readNumber(element, o.gridRowOpacity) as number | undefined,
        gridColumnOpacity: readNumber(element, o.gridColumnOpacity) as number | undefined,
        discreteMarkers: parseChartDiscreteMarkers(
          element.getAttribute(CHART_TEXT_ATTRIBUTES.discreteMarkers),
        ),
        horizontal: element.hasAttribute(o.horizontal.attr),
        markerSize: readNumber(element, o.markerSize) as number | undefined,
        columnWidth: Number(readNumber(element, o.columnWidth)),
        barHeight: readNumber(element, o.barHeight) as number | undefined,
        yMin: readNumber(element, o.yMin) as number | undefined,
        yMax: readNumber(element, o.yMax) as number | undefined,
        dataLabels: element.hasAttribute(o.dataLabels.attr),
        startAngle: readNumber(element, o.startAngle) as number | undefined,
        endAngle: readNumber(element, o.endAngle) as number | undefined,
        dashArray: readNumber(element, o.dashArray) as number | undefined,
        trackWidth: readNumber(element, o.trackWidth) as number | undefined,
        total: readNumber(element, o.total) as number | undefined,
        totalLabel: text(element, "data-ok-total-label"),
        sparkline,
        boxUpperColor: colorAttribute(element, o.boxUpperColor.attr),
        boxLowerColor: colorAttribute(element, o.boxLowerColor.attr),
        candleUpColor: colorAttribute(element, o.candleUpColor.attr),
        candleDownColor: colorAttribute(element, o.candleDownColor.attr),
        donutSize: readNumber(element, o.donutSize) as number | undefined,
        waterfallPositiveColor: colorAttribute(element, o.waterfallPositiveColor.attr),
        waterfallNegativeColor: colorAttribute(element, o.waterfallNegativeColor.attr),
        waterfallTotalColor: colorAttribute(element, o.waterfallTotalColor.attr),
        waterfallSubtotalColor: colorAttribute(element, o.waterfallSubtotalColor.attr),
        hideConnectors: element.hasAttribute(o.hideConnectors.attr),
        streamOffset: element.hasAttribute(o.streamOffset.attr)
          ? (readStyle(element, o.streamOffset) as ChartStreamOffset)
          : undefined,
        streamOrder: element.hasAttribute(o.streamOrder.attr)
          ? (readStyle(element, o.streamOrder) as ChartStreamOrder)
          : undefined,
        hideStreamLabels: element.hasAttribute(o.hideStreamLabels.attr),
        unitLayout: element.hasAttribute(o.unitLayout.attr)
          ? (readStyle(element, o.unitLayout) as ChartUnitLayout)
          : undefined,
        clusterLabels: element.hasAttribute(o.clusterLabels.attr),
        disableSortByGroup: element.hasAttribute(o.disableSortByGroup.attr),
        arcRows: readNumber(element, o.arcRows) as number | undefined,
        columns: readNumber(element, o.columns) as number | undefined,
        fillFrom: element.hasAttribute(o.fillFrom.attr)
          ? (readStyle(element, o.fillFrom) as ChartFillFrom)
          : undefined,
        split: element.hasAttribute(o.split.attr),
        tileColumns: readNumber(element, o.tileColumns) as number | undefined,
        splitMax: readNumber(element, o.splitMax) as number | undefined,
        trackColor: colorAttribute(element, o.trackColor.attr),
        unitValue: readNumber(element, o.unitValue) as number | undefined,
        maxUnits: readNumber(element, o.maxUnits) as number | undefined,
        cellRadius: readNumber(element, o.cellRadius) as number | undefined,
        beeswarmSpread: element.hasAttribute(o.beeswarmSpread.attr)
          ? (readStyle(element, o.beeswarmSpread) as ChartBeeswarmSpread)
          : undefined,
        violinNormalize: element.hasAttribute(o.violinNormalize.attr)
          ? (readStyle(element, o.violinNormalize) as ChartViolinNormalize)
          : undefined,
        violinSide: element.hasAttribute(o.violinSide.attr)
          ? (readStyle(element, o.violinSide) as ChartViolinSide)
          : undefined,
        bandwidthScale: readNumber(element, o.bandwidthScale) as number | undefined,
        kdeBandwidth: readNumber(element, o.kdeBandwidth) as number | undefined,
        kdeResolution: readNumber(element, o.kdeResolution) as number | undefined,
        violinBox: element.hasAttribute(o.violinBox.attr),
        violinWhiskers: element.hasAttribute(o.violinWhiskers.attr)
          ? (readStyle(element, o.violinWhiskers) as ChartViolinWhiskers)
          : undefined,
        hideViolinPoints: element.hasAttribute(o.hideViolinPoints.attr),
        violinPointSize: readNumber(element, o.violinPointSize) as number | undefined,
        violinJitter: readNumber(element, o.violinJitter) as number | undefined,
        unconstrainedViolinPoints: element.hasAttribute(o.unconstrainedViolinPoints.attr),
        violinMaxPoints: readNumber(element, o.violinMaxPoints) as number | undefined,
        streamLabelMinWidth: readNumber(element, o.streamLabelMinWidth) as number | undefined,
        streamHoverOpacity: readNumber(element, o.streamHoverOpacity) as number | undefined,
        dumbbellColors: parseChartDumbbellColors(
          element.getAttribute(CHART_TEXT_ATTRIBUTES.dumbbellColors),
        ),
        dataLabelBackground: element.hasAttribute(o.dataLabelBackground.attr),
        legendValues: element.hasAttribute(o.legendValues.attr),
        dataLabelFormatter: formatters.dataLabel,
        colorRanges: parseChartColorRanges(element.getAttribute(CHART_TEXT_ATTRIBUTES.colorRanges)),
        annotations: readChartAnnotations(annotationsList()),
        partLabels: { ...partLabels, ...localeText },
        zoom: zoomState.range,
        zoomFrom: zoomState.from,
        selection: brushTarget ? selection : preview,
        brush: brushTarget !== undefined,
        selectedDataPoints: selected,
        crossfilter: crossfilter(),
        filter: groupFilter && !groupFilter.own ? groupFilter.categories : null,
        // Rewritten tables keep the author's first header.
        xLabel: (table?.tHead ?? table)?.rows[0]?.cells[0]?.textContent?.trim() || undefined,
        yTitle: text(element, "data-ok-y-title"),
        yaxis: parseChartYAxes(element.getAttribute(CHART_TEXT_ATTRIBUTES.yaxis)),
        xTitle: text(element, CHART_TEXT_ATTRIBUTES.xTitle),
        valuePrefix: text(element, "data-ok-value-prefix"),
        valueSuffix: text(element, "data-ok-value-suffix"),
        locale: text(element, "data-ok-locale"),
        valueFormatter: formatters.value,
        labelFormatter: formatters.label,
        hidden,
        width: measured(),
        height,
        idPrefix: id,
      });
      const { layout } = render;
      drawTools();
      drawLegend(render.legend);
      drawFilter();
      drawDrill();
      svg.setAttribute("width", String(layout.width));
      svg.setAttribute("height", String(layout.height));
      svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
      patch(svg, layout.nodes);
      // Stock charts: indicator columns are computed, so the table is rewritten to match.
      const generated = render.data.series.some((series) => series.indicator);
      if ((source || generated) && table) {
        // Data set through the API: the table (the accessible view) follows, in place.
        writeTable(table, render.table);
        changes.takeRecords();
      }
      drawActive();
      relink();
      // A zoom that follows live data moved by itself: this chart's brushes redraw.
      const zoomed = JSON.stringify(render.zoom);
      if (zoomed !== drawnZoom) {
        drawnZoom = zoomed;
        link?.drawn(render.zoom);
      }
    };

    /** Tree charts: the collapsed nodes, kept in `data-ok-collapsed-nodes`. */
    const collapsedNodes = () =>
      parseChartList(element.getAttribute(CHART_TEXT_ATTRIBUTES.collapsedNodes)).filter(Boolean);
    const writeCollapsed = (ids: readonly string[]) => {
      const textValue = chartListText(ids);
      if (textValue) element.setAttribute(CHART_TEXT_ATTRIBUTES.collapsedNodes, textValue);
      else element.removeAttribute(CHART_TEXT_ATTRIBUTES.collapsedNodes);
      // The runtime's own write: drawn here, not by the observer.
      changes.takeRecords();
      draw();
    };
    /**
     * Hierarchy charts: what a click, Enter or Space on a node does (expand or collapse it); the
     * node stays active after the redraw. Returns whether the press did something.
     */
    const act = (action: ChartHierarchyAction | null) => {
      if (!action) return false;
      if (action.kind === "toggle") {
        const current = collapsedNodes();
        const next = toggleChartCollapsed(current, action.id);
        const expanded = current.includes(action.id);
        if (emit("expand", { id: action.id, expanded, collapsedNodes: next }, { cancelable: true }))
          writeCollapsed(next);
        const mark = chartTreeMarkOf((render as ChartRender).layout, action.id);
        setActive(mark === null ? null : { kind: "mark", mark }, true);
        return true;
      }
      if (!(render as ChartRender).layout.hierarchy?.drillable) return false;
      if (emit("drill", { id: action.id, path: [...action.path] }, { cancelable: true }))
        writeDrill(action.id);
      const mark = chartTreeMarkOf((render as ChartRender).layout, action.focus);
      setActive(mark === null ? null : { kind: "mark", mark }, true);
      return true;
    };
    /** Sunburst and icicle charts: the drilled node, kept in `data-ok-drill-node`. */
    const writeDrill = (id: string | null) => {
      if (id === null) element.removeAttribute(CHART_TEXT_ATTRIBUTES.drillNode);
      else element.setAttribute(CHART_TEXT_ATTRIBUTES.drillNode, id);
      changes.takeRecords();
      draw();
    };
    /** Sunburst and icicle charts: a **Back** button and the drilled path (a status) before the plot. */
    const drawDrill = () => {
      let box = element.querySelector<HTMLElement>(":scope > [data-ok-chart-drill]");
      const state = (render as ChartRender).layout.hierarchy;
      if (!state?.drillable || state.type === "tree") {
        box?.remove();
        return;
      }
      if (!box) {
        box = document.createElement("div");
        box.setAttribute("data-ok-chart-drill", "");
        const up = document.createElement("button");
        up.type = "button";
        up.setAttribute("data-ok-chart-drill-up", "");
        const path = document.createElement("span");
        path.setAttribute("data-ok-chart-drill-path", "");
        path.setAttribute("role", "status");
        box.append(up, path);
        element.insertBefore(box, plot);
        created.push(box);
      }
      const [up, path] = [...box.children] as [HTMLButtonElement, HTMLElement];
      const label = localeText.drillUp ?? chartDrillLabels.drillUp;
      if (up.textContent !== label) up.textContent = label;
      up.hidden = state.drill === null;
      const shown = state.path.join(" › ");
      if (path.textContent !== shown) path.textContent = shown;
    };

    /** The data: set through the API, or read from the table. */
    const data = () =>
      source ??
      (table
        ? readChartTable(
            table,
            readStyle(element, o.xType) as ChartXType,
            readStyle(element, o.type) as ChartType,
          )
        : EMPTY);

    /** Gestures and keys: zoomable charts zoom, brush charts move their selection. */
    const mode = (): ChartGestureMode =>
      element.hasAttribute(CHART_TEXT_ATTRIBUTES.brushTarget)
        ? "brush"
        : (element.hasAttribute(o.zoom.attr) || element.hasAttribute(o.navigator.attr)) &&
            render?.zoomable
          ? pan
            ? "pan"
            : "zoom"
          : "none";
    const kind = () => ((render as ChartRender).data.xType === "numeric" ? "value" : "index");

    /** Applies a zoom; the chart's own changes (`user`) are cancelable and reach its group. */
    const setZoom = (range: ChartZoom | null, reason: ChartZoomReason, notify = true) => {
      if (notify && !emit("zoom", { range, reason }, { cancelable: reason === "user" })) return;
      zoomState = { range, from: (render as ChartRender).extent };
      draw();
      if (reason === "user") link?.zoomed(range);
    };
    /** Brush charts: a new selection zooms the target (or only redraws without one). */
    const setBrush = (range: ChartZoom | null) => {
      selection = range;
      // Brush charts always have a link (their target may be missing: then nothing else moves).
      (link as ChartLink).brush(range);
      draw();
      // Crossfilter: a brush filters its group by the categories it covers.
      if (crossfilter()) publishFilter(chartBrushCategories(range));
    };
    const currentRange = () => (mode() === "brush" ? selection : (render?.zoom ?? null));
    const commitRange = (range: ChartZoom | null) =>
      mode() === "brush" ? setBrush(range) : setZoom(range, "user");

    /** Joins (again) the registry of linked charts when the id, group or brush target change. */
    const relink = () => {
      const id = element.id || undefined;
      const group = text(element, CHART_TEXT_ATTRIBUTES.group);
      const brushTarget = text(element, CHART_TEXT_ATTRIBUTES.brushTarget);
      const mode = crossfilter();
      const key = JSON.stringify([id, group, brushTarget, mode]);
      if (key === linkKey) return;
      linkKey = key;
      link?.unlink();
      link = undefined;
      if (groupFilter) {
        groupFilter = null;
        emit("filter", { categories: null, own: false });
        draw();
      }
      if (!id && !group && !brushTarget) return;
      link = linkChart({
        id,
        group,
        brushTarget,
        zoom: () => render?.zoom ?? null,
        showIndex: (index) => {
          // The keyboard drives a focused plot: another chart of the group (a pointer leaving it
          // after a layout shift) must not take its active point.
          if (plot.contains(document.activeElement)) return;
          setActive(index === null ? null : { kind: "index", index }, false);
        },
        applyZoom: (range, reason) => setZoom(range, reason),
        select: (range) => {
          selection = range;
          draw();
        },
        ...(mode
          ? {
              filter: (next: ChartGroupFilter | null) => {
                groupFilter = next;
                draw();
                emit("filter", {
                  categories: next ? [...next.categories] : null,
                  own: next?.own ?? false,
                });
              },
              cleared: clearOwn,
            }
          : {}),
      });
      // A chart linking again (new options) still filters with its selection.
      if (mode && group && render) {
        const own = chartFilterCategories(render.data, selected);
        if (own) link.filtered(own);
      }
    };

    /** Crossfilter controls after the plot: a Clear button (while filtered) and a polite status. */
    const drawFilter = () => {
      let box = element.querySelector<HTMLElement>(":scope > [data-ok-chart-filter]");
      if (!crossfilter()) {
        box?.remove();
        return;
      }
      if (!box) {
        box = document.createElement("div");
        box.setAttribute("data-ok-chart-filter", "");
        const clear = document.createElement("button");
        clear.type = "button";
        clear.setAttribute("data-ok-chart-filter-clear", "");
        const status = document.createElement("span");
        status.setAttribute("data-ok-chart-filter-status", "");
        status.setAttribute("role", "status");
        box.append(clear, status);
        plot.after(box);
        created.push(box);
      }
      const clear = box.firstElementChild as HTMLButtonElement;
      const label = localeText.clearFilter ?? chartFilterLabels.clearFilter;
      if (clear.textContent !== label) clear.textContent = label;
      clear.hidden = groupFilter === null;
    };
    /** Crossfilter: the status of the chart the user acted on. */
    const announceFilter = (message: string) => {
      // Only called on charts with the controls (crossfilter set).
      (
        element.querySelector(
          ":scope > [data-ok-chart-filter] > [data-ok-chart-filter-status]",
        ) as HTMLElement
      ).textContent = message;
    };
    /** Crossfilter: this chart's selection or brush now filters these categories. */
    const publishFilter = (categories: number[] | null) => {
      if (!link || !text(element, CHART_TEXT_ATTRIBUTES.group)) return;
      // Clearing only matters when this chart's filter is the group's.
      if (!categories && !groupFilter?.own) return;
      link.filtered(categories);
      const current = render as ChartRender;
      announceFilter(chartFilterText(current.data, categories, current.format.title, localeText));
    };
    /** Crossfilter: another chart cleared the group's filter, which was this chart's selection. */
    const clearOwn = () => {
      const previous = selected;
      if (previous.length === 0) return;
      selected = [];
      draw();
      for (const entry of previous)
        emit("select", { ...entry, selected: false, selectedDataPoints: [] });
    };

    /** The toolbar (`data-ok-toolbar`): zoom buttons and downloads, plus a status for errors. */
    const drawTools = () => {
      let box = element.querySelector<HTMLElement>(":scope > [data-ok-chart-toolbar]");
      if (!element.hasAttribute(o.toolbar.attr)) {
        box?.remove();
        return;
      }
      if (!box) {
        box = document.createElement("div");
        box.setAttribute("data-ok-chart-toolbar", "");
        box.setAttribute("role", "group");
        const status = document.createElement("span");
        status.setAttribute("data-ok-chart-status", "");
        status.setAttribute("role", "status");
        box.append(status);
        element.insertBefore(box, element.firstElementChild);
        created.push(box);
      }
      box.setAttribute("aria-label", localeText.toolbar ?? chartToolLabels.toolbar);
      const current = render as ChartRender;
      syncTools(
        box,
        chartToolbar({
          zoom:
            (element.hasAttribute(o.zoom.attr) || element.hasAttribute(o.navigator.attr)) &&
            current.zoomable,
          zoomed: current.zoom !== null,
          pan,
          text: localeText,
        }),
      );
    };

    /** A toolbar button was pressed. */
    const runTool = (tool: ChartTool) => {
      const current = render as ChartRender;
      if (tool === "pan") {
        pan = !pan;
        draw();
      } else if (tool === "reset") setZoom(null, "user");
      else if (tool === "zoomIn" || tool === "zoomOut")
        setZoom(
          zoomChartBy(current.zoom, current.extent, kind(), tool === "zoomIn" ? 0.5 : 2),
          "user",
        );
      else {
        // Tools are only pressed in the toolbar, which always holds the status.
        const status = element.querySelector(
          ":scope > [data-ok-chart-toolbar] > [data-ok-chart-status]",
        ) as HTMLElement;
        status.textContent = "";
        exportChart(element, tool as ChartExportFormat).catch(() => {
          status.textContent = localeText.exportFailed ?? chartToolLabels.exportFailed;
        });
      }
    };

    const setActive = (next: ChartActive | null, notify: boolean) => {
      if (sameChartActive(next, active)) return;
      active = next;
      drawActive();
      if (notify) {
        emit("active", { active });
        // The chart's own changes: its synchronized group shows the same category.
        link?.shown(next?.kind === "index" ? next.index : null);
      }
    };

    // Pointer moves and touches (a tap is a pointerdown) pick the nearest category or point.
    const point = (event: PointerEvent) => {
      if (gestures.dragging) return;
      const layout = (render as ChartRender).layout;
      const box = plot.getBoundingClientRect();
      const scale = layout.width / (box.width || layout.width);
      setActive(
        chartActiveAt(
          layout,
          (event.clientX - box.left) * scale,
          (event.clientY - box.top) * scale,
        ),
        true,
      );
    };
    /** Toggles points (a click, Enter or Space) and reports each one (`ok:chart:select`). */
    const select = (points: readonly ChartDataPoint[]) => {
      const next = toggleChartSelection(
        selected,
        points,
        element.hasAttribute(o.allowMultipleDataPointsSelection.attr),
      );
      selected = next;
      draw();
      for (const entry of chartSelection(points))
        emit("select", {
          ...entry,
          selected: hasChartDataPoint(next, entry),
          selectedDataPoints: [...next],
        });
      // Crossfilter: the selection's categories filter the group.
      if (crossfilter()) publishFilter(chartFilterCategories((render as ChartRender).data, next));
    };
    // A click selects the point, slice or cell under the pointer (not after a drag or on brushes).
    plot.addEventListener(
      "click",
      (event) => {
        if (mode() === "brush" || gestures.moved) return;
        const layout = (render as ChartRender).layout;
        const box = plot.getBoundingClientRect();
        const scale = layout.width / (box.width || layout.width);
        if (layout.mode === "tree") {
          // Hierarchy charts: the node under the pointer expands, collapses or drills.
          const hit = chartActiveAt(
            layout,
            (event.clientX - box.left) * scale,
            (event.clientY - box.top) * scale,
          );
          act(chartHierarchyAction(layout, hit?.kind === "mark" ? hit.mark : null));
          return;
        }
        const mark = chartMarkAt(
          layout,
          (event.clientX - box.left) * scale,
          (event.clientY - box.top) * scale,
        );
        if (mark !== null)
          select([chartMarkPoint(layout.marks[mark] as ChartRender["layout"]["marks"][number])]);
      },
      { signal },
    );
    plot.addEventListener("pointermove", point, { signal });
    plot.addEventListener("pointerdown", point, { signal });
    plot.addEventListener(
      "pointerleave",
      (event) => {
        if (event.pointerType === "mouse") setActive(null, true);
      },
      { signal },
    );
    plot.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          // Sunburst and icicle charts: one level up before anything else.
          if (act(chartDrillUp((render as ChartRender).layout))) {
            event.preventDefault();
            return;
          }
          if (active) {
            event.preventDefault();
            setActive(null, true);
          } else if (mode() !== "none" && currentRange()) {
            // A second Escape resets the zoom (or the brush selection).
            event.preventDefault();
            commitRange(null);
          }
          return;
        }
        if (mode() !== "none" && !event.altKey && !event.ctrlKey && !event.metaKey) {
          const current = render as ChartRender;
          const range = chartZoomKey(
            event.key,
            event.shiftKey,
            currentRange(),
            current.extent,
            kind(),
          );
          if (range !== undefined) {
            event.preventDefault();
            commitRange(range);
            return;
          }
        }
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          const layout = (render as ChartRender).layout;
          if (
            layout.mode === "tree" &&
            act(chartHierarchyAction(layout, active?.kind === "mark" ? active.mark : null))
          ) {
            event.preventDefault();
            return;
          }
        }
        if ((event.key === "Enter" || event.key === " ") && !event.repeat && mode() !== "brush") {
          // Enter or Space selects the active item's points (a category: every series' point).
          const layout = (render as ChartRender).layout;
          const marks = chartActiveMarks(layout, active);
          if (marks.length === 0) return;
          event.preventDefault();
          select(
            marks.map((mark) =>
              chartMarkPoint(layout.marks[mark] as (typeof layout.marks)[number]),
            ),
          );
          return;
        }
        const next = nextChartActive((render as ChartRender).layout, active, event.key);
        if (next === undefined) return;
        event.preventDefault();
        setActive(next, true);
      },
      { signal },
    );
    plot.addEventListener(
      "focus",
      () => {
        if (!active && plot.matches(":focus-visible")) {
          setActive(
            nextChartActive((render as ChartRender).layout, null, "Home") as ChartActive | null,
            true,
          );
        }
      },
      { signal },
    );
    plot.addEventListener("blur", () => setActive(null, true), { signal });
    element.addEventListener(
      "click",
      (event) => {
        const back = (event.target as Element).closest?.("[data-ok-chart-drill-up]");
        if (back && back.parentElement?.parentElement === element) {
          act(chartDrillUp((render as ChartRender).layout));
          // At the top the button hides: the focus goes to the plot.
          if ((back as HTMLElement).hidden) plot.focus();
          return;
        }
        const clear = (event.target as Element).closest?.("[data-ok-chart-filter-clear]");
        if (clear && clear.parentElement?.parentElement === element) {
          link?.clearFilter();
          announceFilter(localeText.filterCleared ?? chartFilterLabels.filterCleared);
          return;
        }
        const tool = (event.target as Element).closest?.("[data-ok-chart-tool]");
        if (tool && tool.parentElement?.parentElement === element) {
          const name = tool.getAttribute("data-ok-chart-tool") as ChartTool;
          if (chartTools.includes(name)) runTool(name);
          return;
        }
        const item = (event.target as Element).closest?.("button[data-ok-chart-legend-item]");
        // Only this chart's own legend (not nested charts or look-alike buttons elsewhere).
        const box = element.querySelector(":scope > [data-ok-chart-legend]");
        if (!item || item.parentElement !== box) return;
        const index = [...(box as Element).children].indexOf(item);
        const hide = !hidden.includes(index);
        const next = hide
          ? [...hidden, index].sort((a, b) => a - b)
          : hidden.filter((i) => i !== index);
        if (!emit("toggle", { index, hidden: hide, hiddenSeries: next }, { cancelable: true }))
          return;
        hidden = next;
        draw();
      },
      { signal },
    );

    // Redraw on size, data and option changes (not on the runtime's own writes).
    const resize = new ResizeObserver((entries) => {
      const rect = (entries[entries.length - 1] as ResizeObserverEntry).contentRect;
      box = { width: Math.round(rect.width), height: Math.round(rect.height) };
      if (!render) return;
      const sparkline = element.hasAttribute(o.sparkline.attr);
      if (
        measured() !== render.layout.width ||
        (sparkline && measuredHeight() > 0 && measuredHeight() !== render.layout.height)
      )
        draw();
    });
    resize.observe(plot);
    // The active item stays across data changes (by position), as in React.
    const changes = new MutationObserver((records) => {
      // An edit of the table makes it the data source again.
      if (records.some((record) => record.target !== element)) source = undefined;
      draw();
    });
    changes.observe(element, { attributes: true, attributeFilter: OPTION_ATTRIBUTES });
    if (table)
      changes.observe(table, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    // Annotations (phase 4): edits of the list redraw (the list itself is never rewritten).
    const notes = annotationsList();
    if (notes)
      changes.observe(notes, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });

    // Zoom, pan and brush gestures (core controller; it reports ranges, the chart applies them).
    const gestures = createChartGestures(plot, {
      layout: () => render?.layout,
      mode,
      range: currentRange,
      extent: () => (render as ChartRender).extent,
      preview: (range) => {
        preview = range;
        draw();
      },
      commit: commitRange,
    });

    draw();

    return {
      get hiddenSeries() {
        return [...hidden];
      },
      setHiddenSeries(next) {
        hidden = [...new Set(next)]
          .filter((i) => Number.isInteger(i) && i >= 0)
          .sort((a, b) => a - b);
        draw();
      },
      get active() {
        return active;
      },
      setActive(next) {
        setActive(next, false);
      },
      setFormatters(next) {
        formatters = { ...next };
        draw();
      },
      refresh() {
        source = undefined;
        draw();
      },
      updateSeries(series, categories) {
        source = {
          series: [...series],
          categories: categories ? [...categories] : data().categories,
        };
        draw();
      },
      appendData(points, options = {}) {
        const current = data();
        const limit =
          Number.isInteger(options.limit) && (options.limit as number) > 0
            ? (options.limit as number)
            : undefined;
        const keep = <T>(list: readonly T[]) => (limit ? list.slice(-limit) : [...list]);
        source = {
          series: current.series.map((entry, index) => ({
            ...entry,
            data: keep([...entry.data, ...(points[index]?.data ?? [])]),
          })),
          categories: keep([...current.categories, ...(options.categories ?? [])]),
        };
        draw();
      },
      get zoomRange() {
        return render?.zoom ?? null;
      },
      setZoomRange(range) {
        setZoom(range, "user", false);
      },
      exportChart(format) {
        return exportChart(element, format);
      },
      setLocaleText(next) {
        localeText = { ...next };
        draw();
      },
      get selectedDataPoints() {
        return [...selected];
      },
      setSelectedDataPoints(points) {
        selected = chartSelection(points);
        draw();
      },
      get filter() {
        return groupFilter ? [...groupFilter.categories] : null;
      },
      clearFilter() {
        link?.clearFilter();
      },
      get drillNode() {
        return element.getAttribute(CHART_TEXT_ATTRIBUTES.drillNode);
      },
      setDrillNode(id) {
        writeDrill(id === null ? null : String(id));
      },
      get collapsedNodes() {
        return collapsedNodes();
      },
      setCollapsedNodes(ids) {
        writeCollapsed([...new Set(ids.map(String))]);
      },
      toggleDataPointSelection(seriesIndex, dataPointIndex) {
        selected = toggleChartSelection(
          selected,
          [{ seriesIndex, dataPointIndex }],
          element.hasAttribute(o.allowMultipleDataPointsSelection.attr),
        );
        draw();
      },
      destroy() {
        gestures.destroy();
        link?.unlink();
        resize.disconnect();
        changes.disconnect();
        for (const part of created) part.remove();
        element.removeAttribute("data-ok-ready");
      },
    };
  },
});
