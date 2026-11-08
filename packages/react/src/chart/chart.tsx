"use client";

import {
  CHART_DEFAULT_WIDTH,
  type ChartActive,
  type ChartColor,
  type ChartCurve,
  type ChartFill,
  type ChartLegend,
  type ChartNode,
  type ChartSeries,
  type ChartType,
  type ChartXType,
  chartActiveAt,
  chartActiveNodes,
  chartAttributes,
  chartIdPrefix,
  chartTooltip,
  nextChartActive,
  placeChartTooltip,
  renderChart,
  sameChartActive,
} from "@owlky/core";
import {
  createElement,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useControllableState } from "../utils/use-controllable-state.js";

export interface ChartProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Accessible name of the chart and the caption of its data table. */
  label: string;
  /**
   * Default `"line"`: `area`, `bar` (columns; rows with `horizontal`), `scatter`, `pie`, `donut`,
   * `radialBar` or `radar`. Pie, donut and radial bar draw the first series, one slice or ring
   * per category.
   */
  type?: ChartType | undefined;
  /** Series: values per category, `[x, y]` pairs (scatter, dates) or `{ x, y, color }`. */
  series: readonly ChartSeries[];
  /** Category labels, or dates when `xType` is `"datetime"`. */
  categories?: readonly (string | number | Date)[] | undefined;
  /** Default `"category"` (`"numeric"` for scatter). */
  xType?: ChartXType | undefined;
  /** Series colors in order (palette names or shades such as `"primary-dark"`). */
  colors?: readonly ChartColor[] | undefined;
  /** Default `"smooth"`. */
  curve?: ChartCurve | undefined;
  /** Default `"top"`. Never shown for a single series. */
  legend?: ChartLegend | undefined;
  /** Area fill. Default `"gradient"`. */
  fill?: ChartFill | undefined;
  stacked?: boolean | undefined;
  horizontal?: boolean | undefined;
  /** Plot height in px. Default 320. */
  height?: number | undefined;
  /** Marker radius of line and area points in px (default none; scatter 5). */
  markerSize?: number | undefined;
  /** Column width in % of a category. Default 40. */
  columnWidth?: number | undefined;
  /** Horizontal bar thickness in % of a category. Default 40. */
  barHeight?: number | undefined;
  yMin?: number | undefined;
  /** Highest value on the value axis; radial bars: the value of a full ring (default 100). */
  yMax?: number | undefined;
  /** Prints the values on the chart (percentages on pie and donut slices). */
  dataLabels?: boolean | undefined;
  /** Pie, donut and radial bar: start angle in degrees, clockwise from 12 o'clock. Default 0. */
  startAngle?: number | undefined;
  /** Pie, donut and radial bar: end angle in degrees. Default 360. */
  endAngle?: number | undefined;
  /** Dash length of lines and radial bars in px (default solid). */
  dashArray?: number | undefined;
  /** Radial bar track thickness in % of the bar. Default 50. */
  trackWidth?: number | undefined;
  /** Donut and radial bar center: the label of the total ("Total"); no total without it. */
  totalLabel?: string | undefined;
  /** Donut and radial bar center: the total (default the sum; radial bars the average). */
  total?: number | undefined;
  /** Title of the value axis. */
  yTitle?: string | undefined;
  /** Text before every value ("$"). */
  valuePrefix?: string | undefined;
  /** Text after every value ("%"). */
  valueSuffix?: string | undefined;
  /** Replaces the value text in the tooltip, the table and the value axis (`series` -1). */
  valueFormatter?: ((value: number, series: number) => string) | undefined;
  /** Replaces the x text in axis labels, the tooltip title and the table. */
  labelFormatter?: ((x: string | number) => string) | undefined;
  /** Locale of numbers and month names. Default `"en-US"`. */
  locale?: string | undefined;
  /** Header of the data table's first column. */
  xLabel?: string | undefined;
  /** Controlled: indexes of the series (pie, donut, radial bar: categories) hidden through the legend. */
  hiddenSeries?: readonly number[] | undefined;
  /** Uncontrolled initial hidden series. */
  defaultHiddenSeries?: readonly number[] | undefined;
  /** Called with the new hidden series when a legend item is toggled. */
  onHiddenSeriesChange?: ((hidden: number[]) => void) | undefined;
  /** Called when the active category or point changes (pointer, touch or keyboard). */
  onActiveChange?: ((active: ChartActive | null) => void) | undefined;
}

const NO_HIDDEN: readonly number[] = [];
const PRESERVED = /^(data-|aria-)/;
const camel = (name: string) =>
  PRESERVED.test(name) ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** Core SVG nodes → React elements (attribute names camelCased: `stroke-opacity` → `strokeOpacity`). */
function toElements(nodes: readonly ChartNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    const props: Record<string, string | number> = { key: index };
    for (const [name, value] of Object.entries(node.attrs)) props[camel(name)] = value;
    return createElement(
      node.tag,
      props,
      node.text ?? (node.children ? toElements(node.children) : undefined),
    );
  });
}

/**
 * Chart — spec: specs/components/chart.md (ADR-0024). An SVG chart drawn by the shared core
 * layout, with a legend that hides series, a tooltip for the pointer, touch and keyboard, and the
 * data as a visually hidden table.
 */
export const Chart = forwardRef<HTMLElement, ChartProps>(function Chart(
  {
    label,
    type,
    series,
    categories,
    xType,
    colors,
    curve,
    legend,
    fill,
    stacked,
    horizontal,
    height,
    markerSize,
    columnWidth,
    barHeight,
    yMin,
    yMax,
    dataLabels,
    startAngle,
    endAngle,
    dashArray,
    trackWidth,
    totalLabel,
    total,
    yTitle,
    valuePrefix,
    valueSuffix,
    valueFormatter,
    labelFormatter,
    locale,
    xLabel,
    hiddenSeries,
    defaultHiddenSeries = NO_HIDDEN,
    onHiddenSeriesChange,
    onActiveChange,
    ...rest
  },
  ref,
) {
  const attributes = chartAttributes({
    type,
    xType: xType ?? (type === "scatter" ? "numeric" : "category"),
    curve,
    legend,
    fill,
    stacked,
    horizontal,
    height,
    markerSize,
    columnWidth,
    barHeight,
    yMin,
    yMax,
    dataLabels,
    startAngle,
    endAngle,
    dashArray,
    trackWidth,
    total,
  });
  const svgHeight = Number(attributes["data-ok-height"] ?? 320);
  const id = useId();
  const plotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(CHART_DEFAULT_WIDTH);
  const [active, setActiveState] = useState<ChartActive | null>(null);
  const [hidden, setHidden] = useControllableState<readonly number[]>({
    value: hiddenSeries,
    defaultValue: defaultHiddenSeries,
    onChange: onHiddenSeriesChange as ((value: readonly number[]) => void) | undefined,
  });

  // Validated option values (invalid props fall back, as in the attributes).
  const chartType = attributes["data-ok-type"] as ChartType;
  const chartXType = attributes["data-ok-x-type"] as ChartXType;
  const chartCurve = attributes["data-ok-curve"] as ChartCurve;
  const chartFill = attributes["data-ok-fill"] as ChartFill;
  const chartLegend = attributes["data-ok-legend"] as ChartLegend;
  const number = (name: `data-ok-${string}`) =>
    attributes[name] === undefined ? undefined : Number(attributes[name]);
  const validMarkerSize = number("data-ok-marker-size");
  const validColumnWidth = number("data-ok-column-width") ?? 40;
  const validBarHeight = number("data-ok-bar-height") ?? 40;
  const validYMin = number("data-ok-y-min");
  const validYMax = number("data-ok-y-max");
  const validStartAngle = number("data-ok-start-angle");
  const validEndAngle = number("data-ok-end-angle");
  const validDashArray = number("data-ok-dash-array");
  const validTrackWidth = number("data-ok-track-width");
  const validTotal = number("data-ok-total");

  const render = useMemo(
    () =>
      renderChart({
        type: chartType,
        xType: chartXType,
        series,
        categories,
        colors,
        curve: chartCurve,
        fill: chartFill,
        legend: chartLegend,
        stacked,
        horizontal,
        markerSize: validMarkerSize,
        columnWidth: validColumnWidth,
        barHeight: validBarHeight,
        yMin: validYMin,
        yMax: validYMax,
        dataLabels,
        startAngle: validStartAngle,
        endAngle: validEndAngle,
        dashArray: validDashArray,
        trackWidth: validTrackWidth,
        total: validTotal,
        totalLabel,
        yTitle,
        valuePrefix,
        valueSuffix,
        valueFormatter,
        labelFormatter,
        locale,
        xLabel,
        hidden,
        width,
        height: svgHeight,
        idPrefix: chartIdPrefix(id),
      }),
    [
      chartType,
      chartXType,
      series,
      categories,
      colors,
      chartCurve,
      chartFill,
      chartLegend,
      stacked,
      horizontal,
      validMarkerSize,
      validColumnWidth,
      validBarHeight,
      validYMin,
      validYMax,
      dataLabels,
      validStartAngle,
      validEndAngle,
      validDashArray,
      validTrackWidth,
      validTotal,
      totalLabel,
      yTitle,
      valuePrefix,
      valueSuffix,
      valueFormatter,
      labelFormatter,
      locale,
      xLabel,
      hidden,
      width,
      svgHeight,
      id,
    ],
  );
  const { layout } = render;

  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;
  const activeRef = useRef(active);
  activeRef.current = active;
  const setActive = (next: ChartActive | null) => {
    if (sameChartActive(next, activeRef.current)) return;
    activeRef.current = next;
    setActiveState(next);
    onActiveRef.current?.(next);
  };

  // Draw at the measured width (the first render uses the default, scaled by the viewBox).
  useLayoutEffect(() => {
    const plot = plotRef.current as HTMLDivElement;
    const measure = () => {
      const next = Math.round(plot.clientWidth);
      if (next > 0) setWidth(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(plot);
    return () => observer.disconnect();
  }, []);

  // A redraw (resize, hidden series) can remove the active item.
  const tooltip = chartTooltip(render.data, layout, render.format, active);
  const shown = tooltip && tooltip.rows.length > 0 ? tooltip : null;

  // Tooltip position: measured after it renders, written as private properties.
  useLayoutEffect(() => {
    const tip = tipRef.current as HTMLDivElement;
    const plot = plotRef.current as HTMLDivElement;
    if (!shown) return;
    const scale = plot.clientWidth / layout.width || 1;
    const { left, top } = placeChartTooltip(
      { x: shown.x * scale, y: shown.y * scale },
      { width: tip.offsetWidth, height: tip.offsetHeight },
      { width: plot.clientWidth, height: plot.clientHeight },
    );
    tip.style.setProperty("--_ok-chart-tip-x", `${left}px`);
    tip.style.setProperty("--_ok-chart-tip-y", `${top}px`);
  });

  const point = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const scale = layout.width / (box.width || layout.width);
    setActive(
      chartActiveAt(layout, (event.clientX - box.left) * scale, (event.clientY - box.top) * scale),
    );
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (activeRef.current) {
        event.preventDefault();
        setActive(null);
      }
      return;
    }
    const next = nextChartActive(layout, activeRef.current, event.key);
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
  };

  const hover = chartActiveNodes(layout, shown ? active : null);
  const nodes = layout.nodes.map((node) =>
    node.attrs["data-ok-chart-crosshair"] !== undefined
      ? { ...node, children: hover.under }
      : node.attrs["data-ok-chart-active"] !== undefined
        ? { ...node, children: hover.over }
        : node,
  );

  const toggle = (index: number) => {
    const next = hidden.includes(index)
      ? hidden.filter((i) => i !== index)
      : [...hidden, index].sort((a, b) => a - b);
    setHidden(next);
  };

  return (
    <figure
      ref={ref}
      {...attributes}
      {...(yTitle ? { "data-ok-y-title": yTitle } : {})}
      {...(totalLabel ? { "data-ok-total-label": totalLabel } : {})}
      {...(valuePrefix ? { "data-ok-value-prefix": valuePrefix } : {})}
      {...(valueSuffix ? { "data-ok-value-suffix": valueSuffix } : {})}
      {...(locale ? { "data-ok-locale": locale } : {})}
      data-ok-ready=""
      data-ok-runtime="off"
      {...rest}
    >
      {render.legend && (
        <div data-ok-chart-legend="">
          {render.legend.map((item) => (
            <button
              key={item.index}
              type="button"
              data-ok-chart-legend-item=""
              data-ok-color={item.color}
              aria-pressed={!item.hidden}
              onClick={() => toggle(item.index)}
            >
              <span data-ok-chart-legend-marker="" />
              {item.name}
            </button>
          ))}
        </div>
      )}
      {/* A focusable group (biome.json override): arrow keys move through the chart's values. */}
      <div
        ref={plotRef}
        data-ok-chart-plot=""
        role="group"
        aria-roledescription="chart"
        aria-label={label}
        tabIndex={0}
        onPointerMove={point}
        onPointerDown={point}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setActive(null);
        }}
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible") && !activeRef.current) {
            setActive(nextChartActive(layout, null, "Home") as ChartActive | null);
          }
        }}
        onBlur={() => setActive(null)}
      >
        <svg
          data-ok-chart-svg=""
          aria-hidden="true"
          focusable="false"
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
        >
          {toElements(nodes)}
        </svg>
        <div ref={tipRef} data-ok-chart-tooltip="" role="status" hidden={!shown}>
          {shown && (
            <>
              <div data-ok-chart-tooltip-title="">{shown.title}</div>
              <div data-ok-chart-tooltip-rows="">
                {shown.rows.map((row, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: rows follow the series order
                  <div key={index} data-ok-chart-tooltip-row="">
                    <span data-ok-chart-tooltip-marker="" data-ok-color={row.color} />
                    <span>{row.name}</span>
                    <span data-ok-chart-tooltip-value="">{row.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <table data-ok-chart-data="">
        <caption>{label}</caption>
        <thead>
          <tr>
            {render.table.head.map((cell, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
              <th key={index} scope="col" {...cell.attrs}>
                {cell.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {render.table.rows.map((row, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
            <tr key={index}>
              <th scope="row" {...row.header.attrs}>
                {row.header.text}
              </th>
              {row.cells.map((cell, column) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
                <td key={column} {...cell.attrs}>
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
});
