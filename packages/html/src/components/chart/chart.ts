import {
  type ChartActive,
  type ChartCurve,
  type ChartFill,
  type ChartLegend,
  type ChartLegendItem,
  type ChartNode,
  type ChartRender,
  type ChartType,
  type ChartXType,
  chartActiveAt,
  chartActiveNodes,
  chartIdPrefix,
  chartOptions,
  chartTooltip,
  nextChartActive,
  placeChartTooltip,
  readChartTable,
  readNumber,
  readStyle,
  renderChart,
  sameChartActive,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface ChartFormatters {
  /** Replaces the value text (tooltip, value axis; `series` is -1 for axis ticks). */
  value?: ((value: number, series: number) => string) | undefined;
  /** Replaces the x text (axis labels, tooltip title). */
  label?: ((x: string | number) => string) | undefined;
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
}

const SVG = "http://www.w3.org/2000/svg";
const o = chartOptions.options;
/** Root attributes that change the drawing (the runtime's own `data-ok-ready` is not one). */
const OPTION_ATTRIBUTES = [
  ...Object.values(o)
    .map((spec) => spec.attr)
    .filter((attr) => attr.startsWith("data-ok-")),
  "data-ok-y-title",
  "data-ok-total-label",
  "data-ok-value-prefix",
  "data-ok-value-suffix",
  "data-ok-locale",
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
 *          width; redraws when the table, the options or the size change. Without JavaScript the
 *          table stays visible.
 * Events:  ok:chart:toggle (cancelable, detail `{ index, hidden, hiddenSeries }`),
 *          ok:chart:active (detail `{ active }`).
 */
export const chart = defineComponent<ChartInstance>({
  name: "chart",
  selector: "[data-ok-chart]",

  setup(element, { emit, signal }) {
    const table = element.querySelector<HTMLTableElement>(":scope > [data-ok-chart-data]");
    const created: Element[] = [];
    const id = chartIdPrefix(element.id || `h${++counter}`);
    let formatters: ChartFormatters = {};
    let active: ChartActive | null = null;
    let render: ChartRender | undefined;

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

    const measured = () => Math.round(plot.clientWidth) || render?.layout.width || 640;

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
        ...box.querySelectorAll<HTMLButtonElement>(":scope > [data-ok-chart-legend-item]"),
      ];
      // Update in place: the button being clicked keeps its focus.
      items.forEach((item, index) => {
        let button = buttons[index];
        if (!button) {
          button = document.createElement("button");
          button.type = "button";
          button.setAttribute("data-ok-chart-legend-item", "");
          (box as HTMLElement).append(button);
        }
        button.setAttribute("data-ok-color", item.color);
        button.setAttribute("aria-pressed", String(!item.hidden));
        const marker = document.createElement("span");
        marker.setAttribute("data-ok-chart-legend-marker", "");
        if (button.textContent !== item.name || !button.firstElementChild)
          button.replaceChildren(marker, item.name);
      });
      for (const extra of buttons.slice(items.length)) extra.remove();
    };

    // Only called after the first draw.
    const drawActive = () => {
      const current = render as ChartRender;
      const tooltip = chartTooltip(current.data, current.layout, current.format, active);
      const shown = tooltip && tooltip.rows.length > 0 ? tooltip : null;
      const hover = chartActiveNodes(current.layout, shown ? active : null);
      svg.querySelector("[data-ok-chart-crosshair]")?.replaceChildren(...build(hover.under));
      svg.querySelector("[data-ok-chart-active]")?.replaceChildren(...build(hover.over));
      if (!shown) {
        tip.hidden = true;
        tip.replaceChildren();
        return;
      }
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
        const name = document.createElement("span");
        name.textContent = row.name;
        const value = document.createElement("span");
        value.setAttribute("data-ok-chart-tooltip-value", "");
        value.textContent = row.value;
        line.append(marker, name, value);
        rows.append(line);
      }
      tip.replaceChildren(title, rows);
      tip.hidden = false;
      const scale = plot.clientWidth / current.layout.width || 1;
      const { left, top } = placeChartTooltip(
        { x: shown.x * scale, y: shown.y * scale },
        { width: tip.offsetWidth, height: tip.offsetHeight },
        { width: plot.clientWidth, height: plot.clientHeight },
      );
      // CSSOM, not a style string (strict CSP).
      tip.style.setProperty("--_ok-chart-tip-x", `${left}px`);
      tip.style.setProperty("--_ok-chart-tip-y", `${top}px`);
    };

    const draw = () => {
      const xType = readStyle(element, o.xType) as ChartXType;
      const { series, categories } = table
        ? readChartTable(table, xType)
        : { series: [], categories: [] };
      const label = table?.caption?.textContent?.trim() ?? "";
      if (label) plot.setAttribute("aria-label", label);
      else plot.removeAttribute("aria-label");
      const height = Number(readNumber(element, o.height));
      render = renderChart({
        type: readStyle(element, o.type) as ChartType,
        xType,
        series,
        categories,
        curve: readStyle(element, o.curve) as ChartCurve,
        fill: readStyle(element, o.fill) as ChartFill,
        legend: readStyle(element, o.legend) as ChartLegend,
        stacked: element.hasAttribute(o.stacked.attr),
        horizontal: element.hasAttribute(o.horizontal.attr),
        markerSize: readNumber(element, o.markerSize) as number | undefined,
        columnWidth: Number(readNumber(element, o.columnWidth)),
        barHeight: Number(readNumber(element, o.barHeight)),
        yMin: readNumber(element, o.yMin) as number | undefined,
        yMax: readNumber(element, o.yMax) as number | undefined,
        dataLabels: element.hasAttribute(o.dataLabels.attr),
        startAngle: readNumber(element, o.startAngle) as number | undefined,
        endAngle: readNumber(element, o.endAngle) as number | undefined,
        dashArray: readNumber(element, o.dashArray) as number | undefined,
        trackWidth: readNumber(element, o.trackWidth) as number | undefined,
        total: readNumber(element, o.total) as number | undefined,
        totalLabel: text(element, "data-ok-total-label"),
        yTitle: text(element, "data-ok-y-title"),
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
      drawLegend(render.legend);
      svg.setAttribute("width", String(layout.width));
      svg.setAttribute("height", String(layout.height));
      svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
      svg.replaceChildren(...build(layout.nodes));
      element.setAttribute("data-ok-ready", "");
      drawActive();
    };

    const setActive = (next: ChartActive | null, notify: boolean) => {
      if (sameChartActive(next, active)) return;
      active = next;
      drawActive();
      if (notify) emit("active", { active });
    };

    // Pointer moves and touches (a tap is a pointerdown) pick the nearest category or point.
    const point = (event: PointerEvent) => {
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
          if (active) {
            event.preventDefault();
            setActive(null, true);
          }
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
        const item = (event.target as Element).closest?.("[data-ok-chart-legend-item]");
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
    const resize = new ResizeObserver(() => {
      if (render && measured() !== render.layout.width) draw();
    });
    resize.observe(plot);
    const changes = new MutationObserver(() => {
      active = null;
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
      refresh: draw,
      destroy() {
        resize.disconnect();
        changes.disconnect();
        for (const part of created) part.remove();
        element.removeAttribute("data-ok-ready");
      },
    };
  },
});
