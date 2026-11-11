"use client";

import {
  type ChartSeries,
  type ChartTrellisBy,
  type ChartTrellisScale,
  chartDrilldownLabels,
  chartTrellisAttributes,
  chartTrellisPanels,
} from "@owlky/core";
import { forwardRef, useMemo } from "react";
import { useControllableState } from "../utils/use-controllable-state.js";
import { Chart, type ChartProps } from "./chart.js";

export interface ChartTrellisProps
  extends Omit<ChartProps, "label" | "series" | "categories" | "yMin" | "yMax"> {
  /** Accessible name of the group of panels; each chart is named "label: panel". */
  label: string;
  /** The data to split into panels. */
  series: readonly ChartSeries[];
  /** Category labels (or dates), as for a chart. */
  categories?: readonly (string | number | Date)[] | undefined;
  /** One panel per series (`series`, the default) or per category (`category`). */
  by?: ChartTrellisBy | undefined;
  /** Value scales: one domain for every panel (`shared`, the default) or each its own (`independent`). */
  scaleY?: ChartTrellisScale | undefined;
  /** Panels per row from 600px up (1 to 6). Default as many as fit, at least 220px wide. */
  columns?: number | undefined;
  /** Panel headers are buttons that show their panel alone, with an **All panels** button back. */
  promote?: boolean | undefined;
  /** Controlled: the index of the panel shown alone (`null`: every panel). */
  promoted?: number | null | undefined;
  /** Uncontrolled initial promoted panel. */
  defaultPromoted?: number | null | undefined;
  /** Called with the panel shown alone (`null` when every panel shows again). */
  onPromotedChange?: ((index: number | null) => void) | undefined;
}

/**
 * ChartTrellis — spec: specs/components/chart.md (ADR-0060). Small multiples: one chart per series
 * or category, in a grid, on a shared value scale.
 */
export const ChartTrellis = forwardRef<HTMLDivElement, ChartTrellisProps>(function ChartTrellis(
  {
    label,
    series,
    categories,
    by,
    scaleY,
    columns,
    promote,
    promoted,
    defaultPromoted = null,
    onPromotedChange,
    height = 200,
    className,
    style,
    id,
    ...chart
  },
  ref,
) {
  const panels = useMemo(
    () => chartTrellisPanels({ series, categories, by, scaleY, colors: chart.colors }),
    [series, categories, by, scaleY, chart.colors],
  );
  const [shown, setShown] = useControllableState<number | null>({
    value: promoted,
    defaultValue: defaultPromoted,
    onChange: onPromotedChange,
  });
  const attributes = chartTrellisAttributes({ columns, promote });
  const alone = promote && shown !== null && shown >= 0 && shown < panels.length ? shown : null;
  return (
    <div
      ref={ref}
      {...attributes}
      role="group"
      aria-label={label}
      data-ok-runtime="off"
      id={id}
      className={className}
      style={style}
    >
      {promote && (
        <button
          type="button"
          data-ok-chart-trellis-back=""
          hidden={alone === null}
          onClick={() => setShown(null)}
        >
          {chart.localeText?.allPanels ?? chartDrilldownLabels.allPanels}
        </button>
      )}
      {panels.map((panel, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: panels follow the data's order
          key={index}
          data-ok-chart-trellis-panel=""
          data-ok-promoted={alone === index ? "" : undefined}
          hidden={alone !== null && alone !== index}
        >
          {promote ? (
            <button
              type="button"
              data-ok-chart-trellis-header=""
              aria-expanded={alone === index}
              onClick={() => setShown(alone === index ? null : index)}
            >
              {panel.title}
            </button>
          ) : (
            <div data-ok-chart-trellis-header="">{panel.title}</div>
          )}
          <Chart
            {...chart}
            height={height}
            label={`${label}: ${panel.title}`}
            series={panel.series}
            categories={panel.categories}
            yMin={panel.yMin}
            yMax={panel.yMax}
          />
        </div>
      ))}
    </div>
  );
});
