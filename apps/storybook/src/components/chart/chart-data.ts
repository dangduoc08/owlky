import type { ChartProps } from "@owlky/react";

/*
 * Chart examples: one per reference section (a story each). Plain data with type-only imports,
 * shared by the React stories and the generator of the HTML snippets
 * (`packages/html/src/components/chart/examples/*.html`), so both render the same chart.
 */

export interface ChartExample {
  /** Story group title (the reference section). */
  readonly title: string;
  readonly props: ChartProps;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

/** Days from 1 January 2011 (stacked columns). */
const DAYS = ["2011-01-01", "2011-01-02", "2011-01-03", "2011-01-04", "2011-01-05", "2011-01-06"];

/** Months from April 2011 to November 2013 (negative columns). */
const CASH_MONTHS = Array.from({ length: 32 }, (_, i) => {
  const month = i + 3;
  return `${2011 + Math.floor(month / 12)}-${String((month % 12) + 1).padStart(2, "0")}-01`;
});
const CASH_FLOW = [
  2.1, 4.6, 6.2, -0.8, -11.4, -17.2, -16.9, -13.5, -10.2, -5.8, 0.6, 3.2, 12.4, 6.1, 1.8, 6.9, 7.7,
  12.8, 15.1, 16.6, 19.2, -25.8, -52.7, -46.3, -41.9, -17.5, -47.4, -39.8, -38.2, -36.1, -28.7,
  -20.6,
];

const SCATTER_A: [number, number][] = [
  [10.8, 8.3],
  [10.8, 7.2],
  [10.8, 5.1],
  [10.8, 1.1],
  [10.8, 0],
  [13.7, 3.4],
  [13.7, 0.4],
  [16.3, 6.3],
  [16.3, 5.2],
  [16.3, 1.9],
  [16.3, 0],
  [19.1, 1.8],
  [21.8, 2.1],
  [22.4, 1.7],
  [24.6, 2.9],
  [26.9, 2.6],
  [29.8, 0],
];
const SCATTER_B: [number, number][] = [
  [0.9, 10.1],
  [1.6, 7.1],
  [1.8, 0],
  [2.1, 11.2],
  [2.2, 14.6],
  [2.2, 13.1],
  [2.3, 15.3],
  [2.4, 9.1],
  [2.5, 4.1],
  [4.1, 13.6],
  [4.1, 12.3],
  [4.2, 4.3],
  [6.6, 7.9],
  [7.1, 8.8],
  [7.2, 16.6],
  [7.8, 14.9],
  [8.8, 2.1],
  [10.1, 17.2],
  [36.2, 13.1],
];
const SCATTER_C: [number, number][] = [
  [10.9, 2.9],
  [13.4, 0.2],
  [16.4, 3.8],
  [16.4, 0.4],
  [20.4, 5.1],
  [21.2, 4.1],
  [21.8, 3.1],
  [22.1, 20],
  [22.6, 5.2],
  [23.2, 2.8],
  [24.4, 3.2],
  [25.8, 2.9],
  [27.4, 3.9],
  [27.4, 0.6],
  [29.6, 6.1],
  [30.1, 2.9],
  [31.2, 8.2],
  [33.4, 2.8],
];

/** Slices of the pie and donut examples. */
const SLICES = ["Series A", "Series B", "Series C", "Series D"];
const SLICE_COLORS: ChartProps["colors"] = ["primary-dark", "warning", "info-dark", "error"];

export const chartExamples: Record<string, ChartExample> = {
  line: {
    title: "Line",
    props: {
      label: "Monthly totals of series A and B",
      categories: MONTHS,
      markerSize: 4,
      series: [
        { name: "Series A", data: [30, 41, 27, 43, 63, 71, 57, 81, 100] },
        { name: "Series B", data: [12, 31, 44, 31, 35, 51, 40, 59, 60] },
      ],
    },
  },
  area: {
    title: "Area",
    props: {
      label: "Hourly values of series A and B",
      type: "area",
      colors: ["primary", "warning"],
      categories: ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00"],
      series: [
        { name: "Series A", data: [32, 39, 29, 41, 63, 70, 55, 79, 100] },
        { name: "Series B", data: [13, 30, 46, 33, 34, 50, 40, 59, 59] },
      ],
    },
  },
  "column-single": {
    title: "Column single",
    props: {
      label: "Monthly net profit",
      type: "bar",
      categories: MONTHS,
      series: [{ name: "Net profit", data: [33, 47, 29, 51, 62, 72, 54, 81, 99] }],
    },
  },
  "column-multiple": {
    title: "Column multiple",
    props: {
      label: "Monthly series A and B",
      type: "bar",
      categories: MONTHS,
      series: [
        { name: "Series A", data: [31, 39, 26, 41, 63, 71, 55, 79, 99] },
        { name: "Series B", data: [11, 31, 44, 31, 33, 51, 39, 59, 59] },
      ],
    },
  },
  "column-stacked": {
    title: "Column stacked",
    props: {
      label: "Daily series A to D, stacked",
      type: "bar",
      xType: "datetime",
      stacked: true,
      legend: "right",
      categories: DAYS,
      series: [
        { name: "Series A", data: [43, 54, 40, 66, 21, 42] },
        { name: "Series B", data: [14, 22, 19, 9, 14, 26] },
        { name: "Series C", data: [10, 18, 16, 15, 20, 13] },
        { name: "Series D", data: [20, 6, 24, 12, 21, 7] },
      ],
    },
  },
  "column-negative": {
    title: "Column negative",
    props: {
      label: "Monthly cash flow",
      type: "bar",
      xType: "datetime",
      columnWidth: 58,
      valueSuffix: "%",
      categories: CASH_MONTHS,
      series: [
        {
          name: "Cash flow",
          data: CASH_FLOW.map((y) => ({
            y,
            color: y >= 0 ? "success" : y < -45 ? "warning" : "info",
          })),
        },
      ],
    },
  },
  bar: {
    title: "Bar",
    props: {
      label: "Net profit by country",
      type: "bar",
      horizontal: true,
      barHeight: 30,
      categories: [
        "Italy",
        "Japan",
        "China",
        "Canada",
        "France",
        "Germany",
        "South Korea",
        "Netherlands",
        "United States",
        "United Kingdom",
      ],
      series: [{ name: "Net profit", data: [390, 420, 450, 465, 535, 575, 680, 1090, 1190, 1370] }],
    },
  },
  mixed: {
    title: "Mixed",
    props: {
      label: "Monthly points of series A, B and C",
      type: "bar",
      yTitle: "Points",
      yMin: 0,
      yMax: 100,
      categories: [
        "Jan '23",
        "Feb '23",
        "Mar '23",
        "Apr '23",
        "May '23",
        "Jun '23",
        "Jul '23",
        "Aug '23",
        "Sep '23",
        "Oct '23",
        "Nov '23",
      ],
      series: [
        { name: "Series A", type: "bar", data: [22, 12, 21, 28, 12, 21, 36, 22, 43, 21, 31] },
        { name: "Series B", type: "area", data: [43, 54, 42, 66, 23, 42, 22, 40, 55, 28, 42] },
        { name: "Series C", type: "line", data: [31, 26, 35, 31, 44, 36, 63, 51, 58, 37, 38] },
      ],
    },
  },
  scatter: {
    title: "Scatter",
    props: {
      label: "Samples of series A, B and C",
      type: "scatter",
      colors: ["primary", "warning", "info"],
      series: [
        { name: "Series A", data: SCATTER_A },
        { name: "Series B", data: SCATTER_B },
        { name: "Series C", data: SCATTER_C },
      ],
    },
  },
  pie: {
    title: "Pie",
    props: {
      label: "Share of series A to D",
      type: "pie",
      height: 240,
      dataLabels: true,
      colors: SLICE_COLORS,
      categories: SLICES,
      series: [{ name: "Value", data: [44, 55, 13, 43] }],
    },
  },
  donut: {
    title: "Donut",
    props: {
      label: "Total of series A to D",
      type: "donut",
      height: 240,
      totalLabel: "Total",
      colors: SLICE_COLORS,
      categories: SLICES,
      series: [{ name: "Value", data: [44, 55, 13, 43] }],
    },
  },
  "radial-bar": {
    title: "Radial bar",
    props: {
      label: "Apples and oranges",
      type: "radialBar",
      height: 320,
      legend: "bottom",
      totalLabel: "Total",
      total: 2324,
      colors: ["secondary", "warning"],
      categories: ["Apples", "Oranges"],
      series: [{ name: "Share", data: [24, 50] }],
    },
  },
  radar: {
    title: "Radar",
    props: {
      label: "Yearly scores of series A, B and C",
      type: "radar",
      height: 280,
      legend: "right",
      colors: ["primary", "warning", "error"],
      categories: ["2011", "2012", "2013", "2014", "2015", "2016"],
      series: [
        { name: "Series A", data: [80, 50, 30, 40, 100, 20] },
        { name: "Series B", data: [20, 30, 40, 80, 20, 80] },
        { name: "Series C", data: [44, 76, 78, 13, 43, 10] },
      ],
    },
  },
  "semi-circle-gauge": {
    title: "Semi circle gauge",
    props: {
      label: "Storage used",
      type: "radialBar",
      height: 260,
      startAngle: -90,
      endAngle: 90,
      colors: ["secondary"],
      categories: ["Used of 24 Mb / 50 Mb"],
      series: [{ name: "Storage", data: [75] }],
    },
  },
  "stroked-gauge": {
    title: "Stroked gauge",
    props: {
      label: "Median ratio",
      type: "radialBar",
      height: 260,
      startAngle: -135,
      endAngle: 135,
      dashArray: 4,
      trackWidth: 100,
      colors: ["error"],
      categories: ["Median ratio"],
      series: [{ name: "Ratio", data: [75] }],
    },
  },
};
