import { chartOptions } from "@owlky/core";
import { Chart, type ChartProps, ChartTrellis } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";
import { type ChartExample, chartExamples } from "./chart-data.js";
import { US_STATES_GEOMETRY } from "./chart-geo-geometry.js";
import { LiveChart } from "./chart-live.js";
import { CustomTooltipChart } from "./chart-tooltip.js";

/** Story groups: one chart per reference section, the same data as the HTML snippets. */
export const chartStories: Record<string, ReactGroup[]> = Object.fromEntries(
  Object.entries(chartExamples).map(([story, { title, props, more = [], trellis }]) => [
    story,
    [
      {
        title,
        content: trellis ? (
          <ChartTrellis {...props} {...trellis} series={props.series ?? []} />
        ) : story.startsWith("geo") && !story.endsWith("-hex") ? (
          [props, ...more].map((chart) => (
            <Chart key={chart.label} {...chart} geometry={US_STATES_GEOMETRY} />
          ))
        ) : story === "live-data" ? (
          <LiveChart />
        ) : story === "tooltip-custom" ? (
          <CustomTooltipChart />
        ) : more.length ? (
          [props, ...more].map((chart) => <Chart key={chart.label} {...chart} />)
        ) : (
          <Chart {...props} />
        ),
      },
    ],
  ]),
);

export const CHART_FILES: Record<string, GroupFiles> = Object.fromEntries(
  Object.entries(chartExamples).map(([story, { title }]) => [story, [[title, "group"]] as const]),
);

/** Values as JSX attribute text: strings quoted, the rest as compact JSON. */
const value = (data: unknown) =>
  typeof data === "string" ? JSON.stringify(data) : `{${JSON.stringify(data)}}`;

const element = (props: ChartProps, indent: string) => {
  const attributes = Object.entries(props)
    .map(([key, data]) =>
      data === true ? `${indent}  ${key}` : `${indent}  ${key}=${value(data)}`,
    )
    .join("\n");
  return `${indent}<Chart\n${attributes}\n${indent}/>`;
};

/** The Code panel source of an example (the data is long: shown as written, not expanded). */
export function chartCode({ title, props, more = [], trellis }: ChartExample): string {
  const name = `${title.replace(/(^|\s)(\w)/g, (_, __, c: string) => c.toUpperCase())}Chart`;
  if (trellis)
    return `import { ChartTrellis } from "@owlky/react";

export function ${name}() {
  return (
${element({ ...props, ...trellis } as ChartProps, "    ").replace("<Chart\n", "<ChartTrellis\n")}
  );
}`;
  const body = more.length
    ? `    <>\n${[props, ...more].map((chart) => element(chart, "      ")).join("\n")}\n    </>`
    : element(props, "    ");
  return `import { Chart } from "@owlky/react";

export function ${name}() {
  return (
${body}
  );
}`;
}

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const CHART_CONTROLS = { schema: chartOptions, keys: ["curve", "legend"] } as const;
