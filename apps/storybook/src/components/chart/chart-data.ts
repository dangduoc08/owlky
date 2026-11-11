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
  /** More charts in the same group (sparklines). */
  readonly more?: readonly ChartProps[];
  /** HTML only: markup inside the first figure, after its table (a custom tooltip template). */
  readonly html?: readonly string[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const YEAR = [...MONTHS, "Oct", "Nov", "Dec"];
/** Timelines whose series share rows: Design and Build overlap in Team A. */
const TIMELINE_ROWS = [
  {
    name: "Design",
    data: [
      { x: "Team A", y: ["2025-01-01", "2025-01-20"] },
      { x: "Team B", y: ["2025-01-10", "2025-01-30"] },
    ],
  },
  {
    name: "Build",
    data: [
      { x: "Team A", y: ["2025-01-12", "2025-02-05"] },
      { x: "Team B", y: ["2025-02-01", "2025-02-20"] },
    ],
  },
];
/** A long, smooth series for the data reducer: the same on every run. */
const READINGS = Array.from(
  { length: 600 },
  (_, i) => Math.round((Math.sin(i / 18) * 40 + Math.sin(i / 3) * 6 + 100) * 10) / 10,
);
const QUARTERS = ["Q1", "Q2", "Q3", "Q4", "Q1", "Q2", "Q3", "Q4"];
const LONG_LABELS = [
  "Billing and invoices",
  "Account settings",
  "Mobile application",
  "Data export tools",
  "Single sign-on",
  "Notification center",
  "Team permissions",
  "Reporting dashboards",
];

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

/** Heatmap rows (series, the first at the bottom) and columns. */
const TIMES = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "01:00"];
const METRICS: [string, number[]][] = [
  ["Metric 1", [62, 88, 51, 63, 21, 27, 2]],
  ["Metric 2", [54, 44, 42, 10, 13, 27, 21]],
  ["Metric 3", [46, 33, 22, 79, 19, 9, 29]],
  ["Metric 4", [32, 41, 28, 24, 12, 31, 12]],
  ["Metric 5", [24, 28, 25, 15, 32, 35, 40]],
  ["Metric 6", [27, 46, 28, 35, 18, 37, 49]],
];

/** Live data: a value for each step, the same in React, HTML and the tests. */
export const liveValue = (step: number) =>
  Math.round(48 + 18 * Math.sin(step / 2) + 9 * Math.cos(step * 1.3));
/** Live data: the time label of each step (one every five seconds from 10:00:00). */
export const liveLabel = (step: number) => {
  const seconds = step * 5;
  return `10:${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};
/** Live data: how many points the chart keeps. */
export const LIVE_POINTS = 12;
const LIVE_STEPS = Array.from({ length: LIVE_POINTS }, (_, step) => step);

/** Slices of the pie and donut examples. */
const SLICES = ["Series A", "Series B", "Series C", "Series D"];
const SLICE_COLORS: ChartProps["colors"] = ["primary-dark", "warning", "info-dark", "error"];

/** ISO dates, one a day from `start` (UTC). */
const days = (start: string, count: number) =>
  Array.from({ length: count }, (_, i) =>
    new Date(Date.parse(`${start}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10),
  );
const DAYS_30 = days("2026-03-01", 30);
const DAYS_90 = days("2026-01-01", 90);
/** Candles (open, high, low, close) of a deterministic price walk. */
const CANDLES: [number, number, number, number][] = DAYS_30.map((_, i) => {
  const open = Math.round((120 + 12 * Math.sin(i / 4) + 4 * Math.cos(i * 1.7)) * 10) / 10;
  const close = Math.round((open + 5 * Math.sin(i * 2.3)) * 10) / 10;
  const high = Math.round((Math.max(open, close) + 2 + Math.abs(3 * Math.cos(i))) * 10) / 10;
  const low = Math.round((Math.min(open, close) - 2 - Math.abs(3 * Math.sin(i))) * 10) / 10;
  return [open, high, low, close];
});
/** Weekdays (UTC) from `start`: trading days of the stock examples. */
const weekdays = (start: string, count: number) => {
  const out: string[] = [];
  for (let t = Date.parse(`${start}T00:00:00Z`); out.length < count; t += 86_400_000) {
    const day = new Date(t).getUTCDay();
    if (day !== 0 && day !== 6) out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
};
/**
 * Stock bars of a seeded random walk (the same on every run, in React, HTML and the tests):
 * `{ y: [open, high, low, close], v }` as ApexStock writes them.
 */
const stockBars = (count: number, seed: number, start = 100) => {
  let state = seed;
  const random = () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
  const round = (value: number) => Math.round(value * 100) / 100;
  let price = start;
  return Array.from({ length: count }, (_, i) => {
    const open = price;
    const close = round(Math.max(5, open + (random() - 0.48) * 4 + Math.sin(i / 9) * 0.8));
    const high = round(Math.max(open, close) + random() * 1.8);
    const low = round(Math.min(open, close) - random() * 1.8);
    price = close;
    const v = Math.round(800_000 + random() * 900_000 + Math.abs(close - open) * 150_000);
    return { y: [round(open), high, low, close], v };
  });
};
const STOCK_DAYS = weekdays("2025-01-02", 130);
const STOCK = stockBars(130, 20_250_102);
const STOCK_YEAR = weekdays("2024-01-02", 260);
const STOCK_LONG = stockBars(260, 7_654_321, 80);

/** Daily users: a slow wave with a weekly dip. */
const users = (i: number) =>
  Math.round(4000 + 900 * Math.sin(i / 9) + 300 * Math.cos(i / 2.3) - (i % 7 >= 5 ? 700 : 0));
/** One label a minute from 10:00. */
const MINUTES = Array.from({ length: 30 }, (_, i) => `10:${String(i).padStart(2, "0")}`);
const wave = (i: number, base: number, amplitude: number) =>
  Math.round(base + amplitude * Math.sin(i / 3) + (amplitude / 3) * Math.cos(i * 1.1));

/** US states with the 2020 census population (U.S. Census Bureau, public domain), millions. */
const GEO_REGIONS: { id: string; name: string; value: number }[] = [];

/** Odd-r offset tile grid (rows of hex cells, original arrangement). */
const GEO_HEX_LAYOUT: [string, string, number, number, number][] = [
  ["AK", "Alaska", 0, 0, 0.73],
  ["ME", "Maine", 10, 0, 1.36],
  ["VT", "Vermont", 9, 1, 0.64],
  ["NH", "New Hampshire", 10, 1, 1.38],
  ["WA", "Washington", 1, 2, 7.71],
  ["MT", "Montana", 2, 2, 1.08],
  ["ND", "North Dakota", 3, 2, 0.78],
  ["MN", "Minnesota", 4, 2, 5.71],
  ["WI", "Wisconsin", 5, 2, 5.89],
  ["MI", "Michigan", 7, 2, 10.08],
  ["NY", "New York", 9, 2, 20.2],
  ["MA", "Massachusetts", 10, 2, 7.03],
  ["OR", "Oregon", 1, 3, 4.24],
  ["ID", "Idaho", 2, 3, 1.84],
  ["WY", "Wyoming", 3, 3, 0.58],
  ["SD", "South Dakota", 4, 3, 0.89],
  ["IA", "Iowa", 5, 3, 3.19],
  ["IL", "Illinois", 6, 3, 12.81],
  ["IN", "Indiana", 7, 3, 6.79],
  ["OH", "Ohio", 8, 3, 11.8],
  ["PA", "Pennsylvania", 9, 3, 13.0],
  ["NJ", "New Jersey", 10, 3, 9.29],
  ["CT", "Connecticut", 11, 3, 3.61],
  ["RI", "Rhode Island", 12, 3, 1.1],
  ["CA", "California", 1, 4, 39.54],
  ["NV", "Nevada", 2, 4, 3.1],
  ["UT", "Utah", 3, 4, 3.27],
  ["CO", "Colorado", 4, 4, 5.77],
  ["NE", "Nebraska", 5, 4, 1.96],
  ["MO", "Missouri", 6, 4, 6.15],
  ["KY", "Kentucky", 7, 4, 4.51],
  ["WV", "West Virginia", 8, 4, 1.79],
  ["VA", "Virginia", 9, 4, 8.63],
  ["MD", "Maryland", 10, 4, 6.18],
  ["AZ", "Arizona", 2, 5, 7.15],
  ["NM", "New Mexico", 3, 5, 2.12],
  ["KS", "Kansas", 4, 5, 2.94],
  ["AR", "Arkansas", 5, 5, 3.01],
  ["TN", "Tennessee", 6, 5, 6.91],
  ["NC", "North Carolina", 7, 5, 10.44],
  ["SC", "South Carolina", 8, 5, 5.12],
  ["DC", "District of Columbia", 9, 5, 0.69],
  ["DE", "Delaware", 10, 5, 0.99],
  ["OK", "Oklahoma", 4, 6, 3.96],
  ["LA", "Louisiana", 5, 6, 4.66],
  ["MS", "Mississippi", 6, 6, 2.96],
  ["AL", "Alabama", 7, 6, 5.02],
  ["GA", "Georgia", 8, 6, 10.71],
  ["HI", "Hawaii", 0, 7, 1.46],
  ["TX", "Texas", 4, 7, 29.15],
  ["FL", "Florida", 9, 7, 21.54],
];
for (const [, name, , , value] of GEO_HEX_LAYOUT) GEO_REGIONS.push({ id: name, name, value });
GEO_REGIONS.sort((a, b) => a.name.localeCompare(b.name));
const GEO_HEX_REGIONS = GEO_HEX_LAYOUT.map(([label, name, , , value]) => ({
  id: name,
  name,
  label,
  value,
}));
const GEO_HEX_CELLS = GEO_HEX_LAYOUT.map(([, id, col, row]) => ({ id, col, row }));

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
  "box-plot": {
    title: "BoxPlot",
    props: {
      label: "Yearly spread of scores",
      type: "boxPlot",
      columnWidth: 50,
      boxUpperColor: "info",
      boxLowerColor: "error",
      categories: [
        "Jan 2015",
        "Jan 2016",
        "Jan 2017",
        "Jan 2018",
        "Jan 2019",
        "Jan 2020",
        "Jan 2021",
      ],
      series: [
        {
          name: "Scores",
          data: [
            [54, 66, 69, 75, 88],
            [43, 65, 69, 76, 81],
            [31, 39, 45, 51, 59],
            [39, 46, 55, 65, 71],
            [29, 31, 35, 39, 44],
            [41, 49, 58, 61, 67],
            [54, 59, 66, 71, 88],
          ].map((y) => ({ y })),
        },
      ],
    },
  },
  heatmap: {
    title: "Heatmap",
    props: {
      label: "Metrics every half hour",
      type: "heatmap",
      legend: "none",
      colors: ["primary", "warning", "info", "success", "error", "info-dark"],
      categories: TIMES,
      series: METRICS.map(([name, data]) => ({ name, data })),
    },
  },
  treemap: {
    title: "Treemap",
    props: {
      label: "Visits by page and device",
      type: "treemap",
      colors: ["primary", "warning"],
      xLabel: "Page",
      series: [
        {
          name: "Desktops",
          data: [
            { x: "ABC", y: 10 },
            { x: "DEF", y: 60 },
            { x: "XYZ", y: 41 },
          ],
        },
        {
          name: "Mobile",
          data: [
            { x: "ABCD", y: 10 },
            { x: "DEFG", y: 20 },
            { x: "WXYZ", y: 51 },
            { x: "PQR", y: 30 },
            { x: "MNO", y: 20 },
            { x: "CDE", y: 30 },
          ],
        },
      ],
    },
  },
  bubble: {
    title: "Bubble",
    props: {
      label: "Requests, latency and errors by service",
      type: "bubble",
      colors: ["primary", "warning", "info"],
      xLabel: "Requests per second",
      series: [
        {
          name: "Gateway",
          data: [
            [12, 38, 14],
            [24, 46, 22],
            [36, 52, 9],
            [48, 61, 30],
          ],
        },
        {
          name: "Search",
          data: [
            [8, 72, 18],
            [20, 66, 6],
            [32, 80, 26],
            [44, 74, 12],
          ],
        },
        {
          name: "Billing",
          data: [
            [16, 22, 8],
            [28, 30, 16],
            [40, 26, 4],
            [52, 34, 20],
          ],
        },
      ],
    },
  },
  "range-area": {
    title: "Range area",
    props: {
      label: "Daily response time range and average",
      type: "rangeArea",
      valueSuffix: " ms",
      colors: ["info", "info-dark"],
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      series: [
        {
          name: "Range",
          data: [
            [120, 210],
            [110, 240],
            [140, 260],
            [130, 220],
            [150, 290],
            [90, 170],
            [80, 160],
          ].map((y) => ({ y })),
        },
        { name: "Average", type: "line", data: [160, 172, 196, 171, 214, 128, 118] },
      ],
    },
  },
  funnel: {
    title: "Funnel",
    props: {
      label: "Recruitment funnel",
      type: "funnel",
      dataLabels: true,
      colors: ["primary"],
      categories: [
        "Sourced",
        "Screened",
        "Assessed",
        "HR interview",
        "Technical",
        "Verified",
        "Offered",
        "Hired",
      ],
      series: [{ name: "Candidates", data: [1380, 1100, 990, 880, 740, 548, 330, 200] }],
    },
  },
  pyramid: {
    title: "Pyramid",
    props: {
      label: "Servings per food group",
      type: "funnel",
      dataLabels: true,
      categories: ["Sweets", "Oils", "Meat", "Dairy", "Fruits", "Vegetables", "Grains"],
      series: [
        {
          name: "Servings",
          data: [
            { y: 100, color: "error" },
            { y: 200, color: "warning" },
            { y: 300, color: "secondary" },
            { y: 400, color: "info" },
            { y: 500, color: "success" },
            { y: 600, color: "primary" },
            { y: 700, color: "primary-dark" },
          ],
        },
      ],
    },
  },
  slope: {
    title: "Slope",
    props: {
      label: "Build time per team, 2025 and 2026",
      type: "slope",
      valueSuffix: " min",
      colors: ["primary", "warning", "info", "error"],
      categories: ["2025", "2026"],
      series: [
        { name: "Web", data: [43, 28] },
        { name: "Mobile", data: [36, 41] },
        { name: "API", data: [22, 18] },
        { name: "Data", data: [58, 34] },
      ],
    },
  },
  sparklines: {
    title: "Sparklines",
    props: {
      label: "Visits this week",
      type: "area",
      sparkline: true,
      height: 48,
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      series: [{ name: "Visits", data: [22, 8, 35, 50, 82, 84, 77] }],
    },
    more: [
      {
        label: "Errors this week",
        type: "bar",
        sparkline: true,
        height: 48,
        colors: ["error"],
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        series: [{ name: "Errors", data: [12, 5, 9, 14, 3, 7, 10] }],
      },
      {
        label: "Latency this week",
        type: "line",
        sparkline: true,
        height: 48,
        valueSuffix: " ms",
        colors: ["info"],
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        series: [{ name: "Latency", data: [180, 164, 210, 172, 158, 149, 166] }],
      },
    ],
  },
  "live-data": {
    title: "Live data",
    props: {
      label: "Requests per second",
      type: "area",
      height: 240,
      categories: LIVE_STEPS.map(liveLabel),
      series: [{ name: "Requests", data: LIVE_STEPS.map(liveValue) }],
    },
  },
  // Phase 4 (ADR-0027, ADR-0031): chart types and features beyond the reference.
  candlestick: {
    title: "Candlestick",
    props: {
      label: "Share price, last 30 days",
      type: "candlestick",
      xType: "datetime",
      valuePrefix: "$",
      categories: DAYS_30,
      series: [{ name: "Price", data: CANDLES.map((y) => ({ y })) }],
    },
  },
  "range-bar": {
    title: "Range bar",
    props: {
      label: "Response time range per service",
      type: "rangeBar",
      valueSuffix: " ms",
      colors: ["info", "warning"],
      categories: ["Auth", "Search", "Checkout", "Profile", "Images"],
      series: [
        {
          name: "Last week",
          data: [
            [42, 118],
            [65, 240],
            [90, 310],
            [38, 96],
            [120, 420],
          ].map((y) => ({ y })),
        },
        {
          name: "This week",
          data: [
            [40, 102],
            [60, 198],
            [84, 260],
            [36, 90],
            [96, 350],
          ].map((y) => ({ y })),
        },
      ],
    },
  },
  timeline: {
    title: "Timeline",
    props: {
      label: "Release plan",
      type: "timeline",
      dataLabels: true,
      series: [
        {
          name: "Release 4.0",
          data: [
            { x: "Design", y: ["2026-03-02", "2026-03-13"], color: "info" },
            { x: "Build", y: ["2026-03-09", "2026-04-03"], color: "primary" },
            { x: "Test", y: ["2026-03-30", "2026-04-17"], color: "warning" },
            { x: "Docs", y: ["2026-04-06", "2026-04-17"], color: "success" },
            { x: "Launch", y: ["2026-04-20", "2026-04-24"], color: "error" },
          ],
        },
      ],
    },
  },
  "polar-area": {
    title: "Polar area",
    props: {
      label: "Incidents by area",
      type: "polarArea",
      legend: "bottom",
      categories: ["API", "Web", "Mobile", "Data", "Infra", "Billing"],
      colors: ["primary", "warning", "info", "error", "success", "info-dark"],
      series: [{ name: "Incidents", data: [14, 23, 21, 17, 15, 10] }],
    },
  },
  zoom: {
    title: "Zoom and export",
    props: {
      label: "Daily active users",
      type: "area",
      xType: "datetime",
      zoom: true,
      toolbar: true,
      categories: DAYS_90,
      series: [{ name: "Users", data: DAYS_90.map((_, i) => users(i)) }],
    },
  },
  synchronized: {
    title: "Synchronized",
    props: {
      id: "sync-requests",
      label: "Requests",
      type: "line",
      group: "service",
      zoom: true,
      height: 160,
      colors: ["primary"],
      categories: MINUTES,
      series: [{ name: "Requests", data: MINUTES.map((_, i) => wave(i, 420, 80)) }],
    },
    more: [
      {
        id: "sync-errors",
        label: "Errors",
        type: "bar",
        group: "service",
        zoom: true,
        height: 160,
        colors: ["error"],
        categories: MINUTES,
        series: [{ name: "Errors", data: MINUTES.map((_, i) => Math.round(wave(i, 12, 9) / 3)) }],
      },
      {
        id: "sync-latency",
        label: "Latency",
        type: "area",
        group: "service",
        zoom: true,
        height: 160,
        valueSuffix: " ms",
        colors: ["info"],
        categories: MINUTES,
        series: [{ name: "Latency", data: MINUTES.map((_, i) => wave(i + 7, 180, 40)) }],
      },
    ],
  },
  brush: {
    title: "Brush",
    props: {
      id: "brush-target",
      label: "Builds per day",
      type: "area",
      xType: "datetime",
      zoom: true,
      categories: DAYS_90,
      series: [{ name: "Builds", data: DAYS_90.map((_, i) => users(i + 11) / 40) }],
    },
    more: [
      {
        label: "Builds per day, overview",
        type: "bar",
        xType: "datetime",
        brushTarget: "brush-target",
        height: 120,
        colors: ["info"],
        categories: DAYS_90,
        series: [{ name: "Builds", data: DAYS_90.map((_, i) => users(i + 11) / 40) }],
      },
    ],
  },
  annotations: {
    title: "Annotations",
    props: {
      label: "Error rate around a deploy",
      type: "line",
      valueSuffix: "%",
      markerSize: 4,
      categories: MINUTES.slice(0, 16),
      series: [
        {
          name: "Error rate",
          data: [0.4, 0.5, 0.4, 0.6, 0.5, 2.8, 3.4, 1.9, 0.9, 0.6, 0.5, 0.4, 0.5, 0.4, 0.6, 0.5],
        },
      ],
      annotations: [
        { axis: "x", x: "10:04", label: "Deploy", color: "warning" },
        { axis: "x", x: "10:07", x2: "10:09", label: "Recovery", color: "success" },
        { axis: "y", y: 2, label: "Threshold", color: "error" },
        { axis: "point", x: "10:06", y: 3.4, label: "Peak", color: "info" },
      ],
    },
  },
  "data-labels": {
    title: "Data labels",
    props: {
      label: "Releases per month",
      type: "line",
      dataLabels: true,
      dataLabelBackground: true,
      markerSize: 4,
      colors: ["primary", "warning"],
      categories: MONTHS.slice(0, 6),
      series: [
        { name: "Web", data: [12, 18, 15, 22, 19, 26] },
        { name: "Mobile", data: [6, 9, 11, 8, 13, 12] },
      ],
    },
  },
  "donut-legend": {
    title: "Donut with values",
    props: {
      label: "Storage by type",
      type: "donut",
      legend: "right",
      legendValues: true,
      donutSize: 60,
      totalLabel: "Total",
      valueSuffix: " GB",
      categories: ["Images", "Videos", "Documents", "Other"],
      colors: ["primary", "warning", "info", "error"],
      series: [{ name: "Storage", data: [48, 32, 12, 8] }],
    },
  },
  "heatmap-ranges": {
    title: "Heatmap color ranges",
    props: {
      label: "Temperature by hour",
      type: "heatmap",
      dataLabels: true,
      legend: "none",
      valueSuffix: "°",
      colorRanges: [
        { from: -10, to: 5, color: "info", name: "Cold" },
        { from: 5.01, to: 20, color: "success", name: "Mild" },
        { from: 20.01, to: 40, color: "error", name: "Hot" },
      ],
      categories: ["00", "04", "08", "12", "16", "20"],
      series: [
        { name: "Mon", data: [2, 4, 12, 22, 24, 14] },
        { name: "Tue", data: [-3, 0, 9, 18, 21, 10] },
        { name: "Wed", data: [5, 6, 14, 26, 28, 17] },
        { name: "Thu", data: [7, 8, 16, 21, 19, 12] },
      ],
    },
  },
  "box-plot-horizontal": {
    title: "Horizontal box plot",
    props: {
      label: "Build time per pipeline",
      type: "boxPlot",
      horizontal: true,
      barHeight: 50,
      valueSuffix: " min",
      categories: ["Web", "Mobile", "API", "Data"],
      series: [
        {
          name: "Build time",
          data: [
            [8, 11, 13, 16, 22],
            [14, 18, 21, 25, 31],
            [4, 6, 7, 9, 12],
            [19, 24, 28, 33, 41],
          ].map((y) => ({ y })),
        },
      ],
    },
  },
  localized: {
    title: "Localized labels",
    props: {
      label: "Thời gian phản hồi theo dịch vụ",
      type: "boxPlot",
      locale: "vi-VN",
      xLabel: "Dịch vụ",
      valueSuffix: " ms",
      localeText: {
        min: "Nhỏ nhất",
        q1: "Tứ phân vị 1",
        median: "Trung vị",
        q3: "Tứ phân vị 3",
        max: "Lớn nhất",
      },
      categories: ["Đăng nhập", "Tìm kiếm", "Thanh toán"],
      series: [
        {
          name: "Phản hồi",
          data: [
            [42, 60, 72, 88, 118],
            [65, 110, 140, 180, 240],
            [90, 150, 190, 230, 310],
          ].map((y) => ({ y })),
        },
      ],
    },
  },
  animations: {
    title: "Animations",
    props: {
      label: "Deploys per weekday",
      type: "bar",
      animations: true,
      colors: ["primary"],
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      series: [{ name: "Deploys", data: [14, 22, 19, 25, 9] }],
    },
  },
  // Roadmap 4.18.59: value axes (ApexCharts `yaxis`) and the x axis title.
  "multiple-y-axes": {
    title: "Multiple Y axes",
    props: {
      label: "Blog visits and social mentions",
      type: "line",
      xTitle: "Month",
      yaxis: [
        { title: "Blog visits" },
        { seriesName: "Social mentions", opposite: true, title: "Social mentions" },
      ],
      categories: MONTHS,
      series: [
        { name: "Blog visits", type: "bar", data: [440, 505, 414, 671, 227, 413, 201, 352, 752] },
        { name: "Social mentions", data: [23, 42, 35, 27, 43, 22, 17, 31, 22] },
      ],
    },
  },
  "axis-scales": {
    title: "Axis scales",
    props: {
      label: "Monthly downloads (logarithmic scale)",
      type: "area",
      yaxis: { logarithmic: true, title: "Downloads" },
      categories: MONTHS,
      series: [
        {
          name: "Downloads",
          data: [12, 45, 180, 920, 3400, 15_800, 61_000, 240_000, 870_000],
        },
      ],
    },
    more: [
      {
        label: "Team ranking (1 is best)",
        type: "line",
        curve: "straight",
        markerSize: 4,
        yaxis: { reversed: true, min: 1, max: 5, tickAmount: 4, title: "Rank" },
        xTitle: "Week",
        categories: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
        series: [{ name: "Rank", data: [5, 3, 4, 2, 2, 1, 3, 1] }],
      },
    ],
  },
  // Roadmap 4.18.60: data point selection (ApexCharts `dataPointSelection`, `states.active`).
  selection: {
    title: "Data point selection",
    props: {
      label: "Orders per weekday (select a column)",
      type: "bar",
      colors: ["info"],
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      series: [{ name: "Orders", data: [44, 55, 41, 67, 22] }],
    },
    more: [
      {
        label: "Visits by device (select several slices)",
        type: "donut",
        height: 240,
        allowMultipleDataPointsSelection: true,
        colors: ["primary-dark", "warning", "info-dark"],
        categories: ["Desktop", "Mobile", "Tablet"],
        series: [{ name: "Visits", data: [44, 55, 13] }],
      },
    ],
  },
  // Roadmap 4.18.61: 100% stacks, stack totals, label positions, value ranges, background bars.
  "column-stacked-100": {
    title: "Column stacked 100%",
    props: {
      label: "Share of series A to C per month",
      type: "bar",
      stacked: true,
      stackType: "100%",
      dataLabels: true,
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      series: [
        { name: "Series A", data: [44, 55, 41, 67, 22, 43] },
        { name: "Series B", data: [13, 23, 20, 8, 13, 27] },
        { name: "Series C", data: [11, 17, 15, 15, 21, 14] },
      ],
    },
    more: [
      {
        label: "Share of visits by device per country",
        type: "bar",
        horizontal: true,
        stacked: true,
        stackType: "100%",
        barHeight: 50,
        colors: ["primary", "warning", "info"],
        categories: ["Italy", "Japan", "Canada", "France", "Germany"],
        series: [
          { name: "Desktop", data: [44, 55, 41, 37, 22] },
          { name: "Mobile", data: [53, 32, 33, 52, 13] },
          { name: "Tablet", data: [12, 17, 11, 9, 15] },
        ],
      },
    ],
  },
  "stack-totals": {
    title: "Stack totals",
    props: {
      label: "Support tickets per week by channel",
      type: "bar",
      stacked: true,
      stackTotals: true,
      categories: ["W1", "W2", "W3", "W4", "W5", "W6"],
      series: [
        { name: "Email", data: [44, 55, 41, 67, 22, 43] },
        { name: "Chat", data: [13, 23, 20, 8, 13, 27] },
        { name: "Phone", data: [11, 17, 15, 15, 21, 14] },
      ],
    },
    more: [
      {
        label: "Orders by store and the weekly target (only the bars stack)",
        type: "bar",
        stacked: true,
        stackOnlyBar: true,
        stackTotals: true,
        colors: ["info", "info-dark", "error"],
        categories: ["W1", "W2", "W3", "W4", "W5", "W6"],
        series: [
          { name: "Store A", data: [30, 42, 28, 51, 39, 47] },
          { name: "Store B", data: [21, 18, 26, 22, 31, 25] },
          { name: "Target", type: "line", data: [50, 55, 55, 60, 65, 65] },
        ],
      },
    ],
  },
  "column-data-labels": {
    title: "Column data labels",
    props: {
      label: "Monthly inflation",
      type: "bar",
      dataLabels: true,
      dataLabelPosition: "top",
      columnWidth: 64,
      backgroundBars: true,
      valueSuffix: "%",
      categories: MONTHS,
      series: [{ name: "Inflation", data: [2.3, 3.1, 4.0, 10.1, 4.0, 3.6, 3.2, 2.3, 1.4] }],
    },
    more: [
      {
        label: "Tasks done per team",
        type: "bar",
        horizontal: true,
        dataLabels: true,
        dataLabelPosition: "bottom",
        barHeight: 50,
        colors: ["success"],
        backgroundBarColors: ["success-lighter", "info-lighter"],
        backgroundBarOpacity: 0.48,
        yMax: 100,
        categories: ["Design", "Web", "Mobile", "Data", "Support"],
        series: [{ name: "Done", data: [72, 54, 88, 35, 61] }],
      },
    ],
  },
  "column-ranges": {
    title: "Column range colors",
    props: {
      label: "Monthly balance",
      type: "bar",
      columnWidth: 60,
      colorRanges: [
        { from: -100, to: -1, color: "error", name: "Loss" },
        { from: 0, to: 100, color: "success", name: "Profit" },
      ],
      categories: MONTHS,
      series: [{ name: "Balance", data: [12, 18, -7, -21, 9, 27, -4, 15, 31] }],
    },
  },
  // Roadmap 4.18.62: non-color series cues (WCAG 1.4.1).
  "marker-shapes": {
    title: "Marker shapes",
    props: {
      label: "Weekly sessions by source",
      type: "line",
      markerSize: 5,
      curve: "straight",
      categories: ["W1", "W2", "W3", "W4", "W5", "W6", "W7"],
      discreteMarkers: [
        { seriesIndex: 0, dataPointIndex: 4, color: "error", size: 8, shape: "star" },
      ],
      series: [
        { name: "Search", markerShape: "circle", data: [45, 52, 38, 24, 33, 26, 21] },
        { name: "Social", markerShape: "square", data: [35, 41, 62, 42, 13, 18, 29] },
        { name: "Email", markerShape: "triangle", data: [87, 57, 74, 99, 75, 38, 62] },
      ],
    },
    more: [
      {
        label: "Samples of series A and B",
        type: "scatter",
        markerSize: 6,
        colors: ["primary", "warning"],
        series: [
          {
            name: "Series A",
            markerShape: "diamond",
            data: [
              [4, 12],
              [8, 18],
              [12, 9],
              [16, 22],
              [20, 15],
              [24, 27],
            ],
          },
          {
            name: "Series B",
            markerShape: "cross",
            data: [
              [6, 20],
              [10, 7],
              [14, 25],
              [18, 11],
              [22, 19],
              [26, 8],
            ],
          },
        ],
      },
    ],
  },
  "dashed-lines": {
    title: "Dashed lines",
    props: {
      label: "Session duration, page views and total visits",
      type: "line",
      curve: "straight",
      categories: ["01 Jan", "02 Jan", "03 Jan", "04 Jan", "05 Jan", "06 Jan", "07 Jan", "08 Jan"],
      series: [
        { name: "Session duration", strokeWidth: 4, data: [45, 52, 38, 24, 33, 26, 21, 20] },
        {
          name: "Page views",
          strokeWidth: 5,
          dashArray: 8,
          data: [35, 41, 62, 42, 13, 18, 29, 37],
        },
        {
          name: "Total visits",
          strokeWidth: 3,
          dashArray: 4,
          data: [87, 57, 74, 99, 75, 38, 62, 47],
        },
      ],
    },
  },
  patterns: {
    title: "Pattern fills",
    props: {
      label: "Points scored by players, by match",
      type: "bar",
      horizontal: true,
      stacked: true,
      fill: "pattern",
      barHeight: 60,
      categories: ["Match 1", "Match 2", "Match 3", "Match 4"],
      series: [
        { name: "Ana", data: [44, 55, 41, 37] },
        { name: "Bao", data: [53, 32, 33, 52] },
        { name: "Chi", data: [12, 17, 11, 9] },
      ],
    },
    more: [
      {
        label: "Share of visits by device",
        type: "pie",
        height: 260,
        fill: "pattern",
        colors: ["primary-dark", "warning", "info-dark"],
        categories: ["Desktop", "Mobile", "Tablet"],
        series: [{ name: "Visits", data: [44, 55, 13] }],
      },
    ],
  },
  "color-blind": {
    title: "Color blind mode",
    props: {
      label: "Monthly signups by plan",
      type: "line",
      colorBlindMode: true,
      categories: MONTHS,
      series: [
        { name: "Free", data: [30, 41, 35, 51, 49, 62, 69, 91, 99] },
        { name: "Pro", data: [12, 21, 28, 30, 37, 42, 40, 51, 60] },
        { name: "Team", data: [4, 9, 12, 18, 16, 22, 27, 31, 38] },
      ],
    },
    more: [
      {
        label: "Revenue by plan per quarter",
        type: "bar",
        colorBlindMode: true,
        categories: ["Q1", "Q2", "Q3", "Q4"],
        series: [
          { name: "Free", data: [8, 12, 15, 19] },
          { name: "Pro", data: [21, 25, 30, 34] },
          { name: "Team", data: [14, 18, 17, 24] },
        ],
      },
    ],
  },
  // Roadmap 4.18.63: tooltip modes, fixed tooltips and custom content.
  tooltip: {
    title: "Tooltip options",
    props: {
      label: "Orders per weekday (one tooltip per column)",
      type: "bar",
      tooltip: "point",
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      series: [
        { name: "Online", data: [44, 55, 41, 67, 22] },
        { name: "In store", data: [13, 23, 20, 8, 13] },
      ],
    },
    more: [
      {
        label: "Visits per hour (fixed tooltip)",
        type: "area",
        tooltipFixed: "topLeft",
        categories: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"],
        series: [{ name: "Visits", data: [31, 40, 28, 51, 42, 109, 100] }],
      },
      {
        label: "Temperature per day (no tooltip)",
        type: "line",
        tooltip: "none",
        markerSize: 4,
        valueSuffix: " °C",
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        series: [{ name: "Temperature", data: [18, 21, 19, 24, 26, 23, 20] }],
      },
    ],
  },
  "tooltip-custom": {
    title: "Custom tooltip",
    props: {
      label: "Orders per weekday (custom tooltip)",
      type: "bar",
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      series: [
        { name: "Online", data: [44, 55, 41, 67, 22] },
        { name: "In store", data: [13, 23, 20, 8, 13] },
      ],
    },
    html: [
      "  <template data-ok-chart-tooltip>",
      '    <div data-ok-chart-tooltip-title><span>Orders on </span><span data-ok-chart-tooltip-slot="title"></span></div>',
      '    <div data-ok-chart-tooltip-state data-ok-chart-tooltip-slot="state">Selected</div>',
      "    <div data-ok-chart-tooltip-rows>",
      '      <div data-ok-chart-tooltip-row data-ok-chart-tooltip-slot="row">',
      '        <span data-ok-chart-tooltip-marker data-ok-chart-tooltip-slot="marker"></span>',
      '        <span data-ok-chart-tooltip-slot="name"></span>',
      '        <span data-ok-chart-tooltip-value data-ok-chart-tooltip-slot="value"></span>',
      "      </div>",
      "    </div>",
      "  </template>",
    ],
  },
  // Roadmap 4.18.64: legend alignment, single series, toggle opt-out, custom items; grid options.
  legend: {
    title: "Legend options",
    props: {
      label: "Monthly net profit (one series, legend on the left)",
      type: "bar",
      legendAlign: "left",
      showForSingleSeries: true,
      categories: MONTHS,
      series: [{ name: "Net profit", data: [33, 47, 29, 51, 62, 72, 54, 81, 99] }],
    },
    more: [
      {
        label: "Income and spending (fixed legend with custom names)",
        type: "line",
        legend: "bottom",
        legendAlign: "center",
        disableLegendToggle: true,
        customLegendItems: ["Income (after tax)", "Spending (all accounts)"],
        colors: ["success", "error"],
        categories: MONTHS,
        series: [
          { name: "Income", data: [42, 48, 45, 51, 49, 56, 58, 61, 64] },
          { name: "Spending", data: [38, 40, 47, 44, 46, 49, 52, 50, 55] },
        ],
      },
    ],
  },
  grid: {
    title: "Grid lines and stripes",
    props: {
      label: "Monthly visits (row stripes, every grid line)",
      type: "line",
      curve: "straight",
      markerSize: 4,
      grid: "both",
      gridRowColors: ["grey", "transparent"],
      categories: MONTHS,
      series: [{ name: "Visits", data: [10, 41, 35, 51, 49, 62, 69, 91, 148] }],
    },
    more: [
      {
        label: "Weekly orders (column stripes, no grid lines)",
        type: "bar",
        grid: "none",
        gridColumnColors: ["info", "transparent"],
        gridColumnOpacity: 0.12,
        categories: ["W1", "W2", "W3", "W4", "W5", "W6"],
        series: [{ name: "Orders", data: [44, 55, 41, 67, 22, 43] }],
      },
    ],
  },
  // Phase 2.2 (ADR-0047): stock charts, one per ApexStock demo section that applies.
  stock: {
    title: "Stock chart",
    props: {
      label: "ACME share price, first half of 2025",
      type: "candlestick",
      xType: "datetime",
      valuePrefix: "$",
      height: 280,
      navigator: true,
      indicators: [{ type: "sma", period: 20 }, { type: "volume" }],
      categories: STOCK_DAYS,
      series: [{ name: "ACME", data: STOCK }],
    },
  },
  "stock-overlays": {
    title: "Overlays",
    props: {
      label: "ACME share price with overlays",
      type: "candlestick",
      xType: "datetime",
      valuePrefix: "$",
      zoom: true,
      toolbar: true,
      indicators: [
        { type: "bollinger", period: 20, stdDev: 2, color: "info" },
        { type: "ema", period: 9, color: "warning" },
        { type: "vwap", color: "secondary" },
      ],
      categories: STOCK_DAYS,
      series: [{ name: "ACME", data: STOCK }],
    },
  },
  "stock-oscillators": {
    title: "Oscillators",
    props: {
      label: "ACME share price with oscillators",
      type: "candlestick",
      xType: "datetime",
      valuePrefix: "$",
      height: 240,
      paneHeight: 110,
      navigator: true,
      indicators: [
        { type: "rsi", period: 14 },
        { type: "macd", fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
        { type: "stochastic", period: 14, signalPeriod: 3 },
      ],
      categories: STOCK_DAYS,
      series: [{ name: "ACME", data: STOCK }],
    },
  },
  "stock-line": {
    title: "Large dataset",
    props: {
      label: "Index level, 2024",
      type: "area",
      xType: "datetime",
      fill: "solid",
      colors: ["primary"],
      navigator: true,
      paneHeight: 100,
      indicators: [
        { type: "volume", color: "info" },
        { type: "atr", period: 14 },
      ],
      categories: STOCK_YEAR,
      series: [{ name: "Index", data: STOCK_LONG.map(({ y, v }) => ({ y: y[3] as number, v })) }],
    },
  },
  // Phase 2.1 (ADR-0047): Sankey charts, one per ApexSankey demo section that applies.
  sankey: {
    title: "Sankey",
    props: {
      label: "Office energy use, MWh per year",
      type: "sankey",
      valueSuffix: " MWh",
      nodes: [
        { id: "solar", title: "Solar panels", color: "warning" },
        { id: "grid", title: "Grid", color: "info-dark" },
        { id: "battery", title: "Battery", color: "success" },
        { id: "building", title: "Building", color: "primary" },
        { id: "heating", title: "Heating", color: "error" },
        { id: "lighting", title: "Lighting", color: "warning-dark" },
        { id: "computers", title: "Computers", color: "info" },
        { id: "kitchen", title: "Kitchen", color: "secondary" },
        { id: "losses", title: "Losses", color: "secondary-dark" },
      ],
      edges: [
        { source: "solar", target: "building", value: 42 },
        { source: "solar", target: "battery", value: 18 },
        { source: "grid", target: "building", value: 64 },
        { source: "battery", target: "building", value: 15 },
        { source: "battery", target: "losses", value: 3 },
        { source: "building", target: "heating", value: 48 },
        { source: "building", target: "lighting", value: 21 },
        { source: "building", target: "computers", value: 33 },
        { source: "building", target: "kitchen", value: 12 },
        { source: "building", target: "losses", value: 7 },
      ],
    },
  },
  "sankey-vertical": {
    title: "Vertical Sankey",
    props: {
      label: "Hiring pipeline, candidates this quarter",
      type: "sankey",
      orientation: "vertical",
      height: 400,
      nodes: [
        { id: "referral", title: "Referral", color: "primary" },
        { id: "board", title: "Job board", color: "info" },
        { id: "careers", title: "Careers page", color: "secondary" },
        { id: "screen", title: "Screening", color: "info-dark" },
        { id: "interview", title: "Interview", color: "warning" },
        { id: "offer", title: "Offer", color: "success" },
        { id: "declined", title: "Not selected", color: "error" },
      ],
      edges: [
        { source: "referral", target: "screen", value: 40 },
        { source: "board", target: "screen", value: 120 },
        { source: "careers", target: "screen", value: 80 },
        { source: "screen", target: "interview", value: 90 },
        { source: "screen", target: "declined", value: 150 },
        { source: "interview", target: "offer", value: 24 },
        { source: "interview", target: "declined", value: 66 },
      ],
    },
  },
  "sankey-cycles": {
    title: "Cycles",
    props: {
      label: "Packaging material flow, tonnes",
      type: "sankey",
      valueSuffix: " t",
      nodes: [
        { id: "new", title: "New material", color: "info" },
        { id: "made", title: "Production", color: "primary" },
        { id: "shipped", title: "Shipped", color: "success" },
        { id: "returned", title: "Returned", color: "warning" },
        { id: "waste", title: "Waste", color: "error" },
      ],
      edges: [
        { source: "new", target: "made", value: 70 },
        { source: "made", target: "shipped", value: 95 },
        { source: "shipped", target: "returned", value: 32 },
        { source: "shipped", target: "waste", value: 63 },
        { source: "returned", target: "made", value: 25 },
      ],
    },
  },
  "sankey-alluvial": {
    title: "Alluvial",
    props: {
      label: "Plan changes of 400 customers",
      type: "sankey",
      axisTitles: ["2024", "2025", "2026"],
      whitespace: 0.3,
      nodes: [
        { id: "free-24", title: "Free", color: "info" },
        { id: "team-24", title: "Team", color: "primary" },
        { id: "free-25", title: "Free", color: "info" },
        { id: "team-25", title: "Team", color: "primary" },
        { id: "business-25", title: "Business", color: "warning" },
        { id: "free-26", title: "Free", color: "info" },
        { id: "team-26", title: "Team", color: "primary" },
        { id: "business-26", title: "Business", color: "warning" },
      ],
      edges: [
        { source: "free-24", target: "free-25", value: 150 },
        { source: "free-24", target: "team-25", value: 90 },
        { source: "team-24", target: "team-25", value: 120 },
        { source: "team-24", target: "business-25", value: 40 },
        { source: "free-25", target: "free-26", value: 110 },
        { source: "free-25", target: "team-26", value: 40 },
        { source: "team-25", target: "team-26", value: 160 },
        { source: "team-25", target: "business-26", value: 50 },
        { source: "business-25", target: "business-26", value: 40 },
      ],
    },
  },
  "sankey-links": {
    title: "Link and node options",
    props: {
      label: "Support tickets by channel and outcome",
      type: "sankey",
      fill: "solid",
      edgeOpacity: 0.56,
      nodeWidth: 12,
      dataLabels: true,
      colors: ["primary", "success", "error", "info", "secondary"],
      edges: [
        { source: "Email", target: "Solved", value: 320 },
        { source: "Email", target: "Escalated", value: 60, color: "error" },
        { source: "Chat", target: "Solved", value: 410 },
        { source: "Chat", target: "Escalated", value: 35, color: "error" },
        { source: "Phone", target: "Solved", value: 150 },
        { source: "Phone", target: "Escalated", value: 45, color: "error" },
      ],
    },
  },
  // Roadmap 4.18.21: waterfall charts (ApexCharts `waterfall`, `isTotal`, `isSubtotal`).
  waterfall: {
    title: "Waterfall",
    props: {
      label: "Cash flow in 2025 (thousands of dollars)",
      type: "waterfall",
      dataLabels: true,
      categories: [
        "Opening",
        "Sales",
        "Services",
        "Salaries",
        "Rent",
        "First half",
        "Taxes",
        "Closing",
      ],
      series: [
        {
          name: "Cash",
          data: [120, 260, 85, -190, -45, { isSubtotal: true }, -60, { isTotal: true }],
        },
      ],
    },
    more: [
      {
        label: "Change in headcount by team",
        type: "waterfall",
        horizontal: true,
        barHeight: 60,
        waterfallPositiveColor: "info",
        waterfallNegativeColor: "warning-dark",
        waterfallTotalColor: "secondary",
        categories: ["Last year", "Design", "Engineering", "Sales", "Support", "This year"],
        series: [{ name: "People", data: [48, 4, 12, -3, -2, { isTotal: true }] }],
      },
    ],
  },
  // Roadmap 4.18.19: crossfilter (ApexCharts Premium Linked Views / Highlight Filter, ADR-0054).
  crossfilter: {
    title: "Crossfilter",
    props: {
      label: "Orders by region (select columns to filter the other charts)",
      type: "bar",
      group: "regions",
      crossfilter: "highlight",
      allowMultipleDataPointsSelection: true,
      height: 240,
      colors: ["info"],
      categories: ["North", "South", "East", "West", "Central"],
      series: [{ name: "Orders", data: [420, 310, 280, 390, 150] }],
    },
    more: [
      {
        label: "Revenue by region (thousands of dollars)",
        type: "bar",
        group: "regions",
        crossfilter: "filter",
        height: 240,
        colors: ["warning"],
        categories: ["North", "South", "East", "West", "Central"],
        series: [{ name: "Revenue", data: [96, 71, 64, 88, 35] }],
      },
      {
        label: "Returns by region (select a slice to filter the other charts)",
        type: "donut",
        group: "regions",
        crossfilter: "filter",
        height: 240,
        categories: ["North", "South", "East", "West", "Central"],
        series: [{ name: "Returns", data: [18, 25, 9, 14, 6] }],
      },
    ],
  },
  // Roadmap 4.18.21: dumbbell charts (ApexCharts `rangeBar` + `isDumbbell`, `dumbbellColors`).
  dumbbell: {
    title: "Dumbbell",
    props: {
      label: "Median page load in seconds, before and after the update",
      type: "dumbbell",
      dataLabels: true,
      xLabel: "Page",
      localeText: { start: "Before", end: "After" },
      categories: ["Home", "Search", "Product", "Cart", "Checkout"],
      series: [
        {
          name: "Load time",
          data: [
            { y: [3.2, 1.8] },
            { y: [2.6, 1.9] },
            { y: [4.1, 2.2] },
            { y: [1.9, 2.3] },
            { y: [3.6, 2.4] },
          ],
        },
      ],
    },
    more: [
      {
        label: "Pay gap by department (women and men, thousands of dollars)",
        type: "dumbbell",
        horizontal: true,
        markerSize: 7,
        dumbbellColors: [["warning-dark", "info-dark"]],
        localeText: { start: "Women", end: "Men" },
        categories: ["Design", "Engineering", "Finance", "Marketing", "Sales", "Support"],
        series: [
          {
            name: "Salary",
            data: [
              { y: [72, 78] },
              { y: [96, 104] },
              { y: [81, 92] },
              { y: [69, 71] },
              { y: [74, 86] },
              { y: [52, 55] },
            ],
          },
        ],
      },
    ],
  },
  // Roadmap 4.18.7 (ADR-0058): tree charts (ApexTree `direction`, `layoutType`, `edgeStyle`).
  tree: {
    title: "Tree",
    props: {
      label: "Product teams and their engineers",
      type: "tree",
      enableExpandCollapse: true,
      dataLabels: true,
      height: 360,
      hierarchy: {
        name: "Product",
        children: [
          {
            name: "Web",
            children: [
              { name: "Checkout", value: 6 },
              { name: "Search", value: 4 },
              { name: "Accounts", value: 3 },
            ],
          },
          {
            name: "Mobile",
            children: [
              { name: "iOS", value: 5 },
              { name: "Android", value: 5 },
            ],
          },
          {
            name: "Platform",
            children: [
              { name: "Payments", value: 4 },
              { name: "Data", value: 7 },
            ],
          },
        ],
      },
    },
    more: [
      {
        label: "Plant families and their genera",
        type: "tree",
        direction: "radial",
        layoutType: "cluster",
        edgeStyle: "curved",
        height: 440,
        hierarchy: {
          name: "Plants",
          children: [
            {
              name: "Rosaceae",
              children: [
                { name: "Rosa" },
                { name: "Malus" },
                { name: "Prunus" },
                { name: "Rubus" },
              ],
            },
            {
              name: "Fabaceae",
              children: [{ name: "Pisum" }, { name: "Lupinus" }, { name: "Acacia" }],
            },
            {
              name: "Asteraceae",
              children: [
                { name: "Aster" },
                { name: "Bellis" },
                { name: "Helianthus" },
                { name: "Lactuca" },
              ],
            },
            { name: "Poaceae", children: [{ name: "Oryza" }, { name: "Zea" }, { name: "Avena" }] },
          ],
        },
      },
      {
        label: "Website sections and their pages",
        type: "tree",
        direction: "left",
        edgeStyle: "curved",
        enableExpandCollapse: true,
        defaultCollapsedNodes: ["Blog"],
        height: 320,
        hierarchy: {
          name: "Home",
          children: [
            { name: "Products", children: [{ name: "Laptops" }, { name: "Phones" }] },
            { name: "Blog", children: [{ name: "News" }, { name: "Guides" }, { name: "Events" }] },
            { name: "Support", children: [{ name: "Contact" }, { name: "Returns" }] },
          ],
        },
      },
    ],
  },
  // Roadmap 4.18.21 (ADR-0058): sunburst charts (ApexCharts v8 `sunburst`, `zoomOnClick`).
  sunburst: {
    title: "Sunburst",
    props: {
      label: "Cloud spend by service, thousands of dollars per month",
      type: "sunburst",
      valuePrefix: "$",
      valueSuffix: "k",
      height: 400,
      hierarchy: [
        {
          name: "Compute",
          children: [
            { name: "Virtual machines", value: 42 },
            { name: "Containers", value: 28 },
            { name: "Functions", value: 9 },
          ],
        },
        {
          name: "Storage",
          children: [
            { name: "Objects", value: 21 },
            { name: "Disks", value: 14 },
            {
              name: "Backups",
              children: [
                { name: "Daily", value: 5 },
                { name: "Archive", value: 3 },
              ],
            },
          ],
        },
        {
          name: "Network",
          children: [
            { name: "Transfer", value: 12 },
            { name: "CDN", value: 7 },
          ],
        },
        { name: "Databases", value: 24 },
      ],
    },
    more: [
      {
        label: "Support tickets by channel and topic this week",
        type: "sunburst",
        startAngle: -90,
        endAngle: 90,
        innerSize: 40,
        leaf: "stop",
        dataLabels: true,
        disableZoomOnClick: true,
        height: 260,
        colors: ["info", "warning", "success"],
        hierarchy: [
          {
            name: "Email",
            children: [
              { name: "Billing", value: 34 },
              { name: "Login", value: 21 },
            ],
          },
          {
            name: "Chat",
            children: [
              { name: "Orders", value: 28 },
              { name: "Returns", value: 12 },
            ],
          },
          { name: "Phone", value: 18 },
        ],
      },
    ],
  },
  // Roadmap 4.18.17 (ADR-0059): geo charts on the US states (Natural Earth, public domain).
  // The geometry is added by the demo (React) and the page script (HTML).
  geo: {
    title: "Geo map",
    props: {
      id: "chart-geo",
      label: "Population by state, 2020 census, millions",
      type: "geo",
      valueSuffix: "M",
      height: 420,
      regions: GEO_REGIONS,
      joinBy: "name",
      scaleMethod: "jenks",
      localeText: { y: "Population" },
    },
  },
  "geo-projections": {
    title: "Geo projections",
    props: {
      id: "chart-geo-mercator",
      label: "Population by state in a Mercator projection, millions",
      type: "geo",
      projection: "mercator",
      valueSuffix: "M",
      height: 340,
      regions: GEO_REGIONS,
      joinBy: "name",
      colors: ["info"],
      localeText: { y: "Population" },
    },
    more: [
      {
        id: "chart-geo-sphere",
        label: "Population by state on the whole Equal Earth globe, millions",
        type: "geo",
        valueSuffix: "M",
        height: 340,
        regions: GEO_REGIONS,
        joinBy: "name",
        sphere: true,
        graticule: true,
        colors: ["info"],
        localeText: { y: "Population" },
      },
    ],
  },
  "geo-hex": {
    title: "Hex tile map",
    props: {
      label: "Population by state in a hex tile map, millions",
      type: "geo",
      geoLayout: "hex",
      valueSuffix: "M",
      height: 420,
      dataLabels: true,
      regions: GEO_HEX_REGIONS,
      hexCells: GEO_HEX_CELLS,
      scaleMethod: "jenks",
      localeText: { y: "Population" },
    },
  },
  // Roadmap 4.18.21 (ADR-0058): icicle charts (ApexCharts v8 `icicle`, `direction`, `zoomType`).
  icicle: {
    title: "Icicle",
    props: {
      label: "Page load time by step, milliseconds",
      type: "icicle",
      valueSuffix: " ms",
      height: 320,
      hierarchy: {
        name: "Page load",
        children: [
          {
            name: "Network",
            children: [
              { name: "DNS", value: 40 },
              { name: "Connect", value: 90 },
              { name: "Download", value: 220 },
            ],
          },
          {
            name: "Scripts",
            children: [
              { name: "Parse", value: 120 },
              {
                name: "Run",
                children: [
                  { name: "Framework", value: 160 },
                  { name: "App", value: 110 },
                ],
              },
            ],
          },
          {
            name: "Render",
            children: [
              { name: "Layout", value: 70 },
              { name: "Paint", value: 50 },
            ],
          },
        ],
      },
    },
    more: [
      {
        label: "Online store visits by source and campaign this month",
        type: "icicle",
        direction: "left",
        leaf: "extend",
        zoomType: "both",
        dataLabels: true,
        height: 300,
        hierarchy: [
          {
            name: "Search",
            children: [
              { name: "Organic", value: 4200 },
              { name: "Ads", value: 1800 },
            ],
          },
          {
            name: "Social",
            children: [
              { name: "Video", value: 1500 },
              { name: "Photos", value: 900 },
            ],
          },
          { name: "Direct", value: 2600 },
          { name: "Email", value: 1100 },
        ],
      },
    ],
  },
  // Roadmap 4.18.21: streamgraphs (ApexCharts `streamgraph`).
  streamgraph: {
    title: "Streamgraph",
    props: {
      label: "Listening time by genre, thousands of hours per month",
      type: "streamgraph",
      valueSuffix: "k",
      height: 320,
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      series: [
        { name: "Pop", data: [42, 48, 55, 60, 52, 44, 40, 38, 45, 50, 58, 62] },
        { name: "Rock", data: [30, 28, 26, 32, 40, 46, 50, 44, 36, 30, 26, 24] },
        { name: "Jazz", data: [12, 14, 18, 20, 22, 26, 24, 20, 18, 16, 14, 12] },
        { name: "Hip hop", data: [20, 24, 30, 36, 44, 52, 58, 62, 56, 48, 40, 30] },
        { name: "Classical", data: [18, 16, 14, 12, 12, 14, 16, 18, 22, 26, 30, 34] },
      ],
    },
    more: [
      {
        label: "Share of support tickets by channel, percent per quarter",
        type: "streamgraph",
        streamOffset: "expand",
        streamOrder: "none",
        curve: "straight",
        colorBlindMode: true,
        height: 240,
        valueSuffix: "%",
        categories: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"],
        series: [
          { name: "Email", data: [40, 38, 34, 30, 26, 24] },
          { name: "Chat", data: [25, 28, 32, 36, 40, 44] },
          { name: "Phone", data: [35, 34, 34, 34, 34, 32] },
        ],
      },
    ],
  },
  // Roadmap 4.18.21: violin charts (ApexCharts `violin`).
  violin: {
    title: "Violin",
    props: {
      label: "Delivery time by plan, in hours",
      type: "violin",
      violinBox: true,
      valueSuffix: " h",
      height: 320,
      categories: ["Basic", "Plus", "Premium"],
      series: [
        {
          name: "Delivery time",
          data: [
            { y: [12, 14, 16, 18, 19, 20, 21, 22, 24, 25, 27, 30, 34, 38, 41, 48] },
            { y: [10, 11, 12, 12, 13, 14, 14, 15, 16, 17, 18, 19, 20, 22, 24] },
            { y: [4, 5, 5, 6, 6, 7, 7, 8, 8, 8, 9, 10, 11, 12, 13, 15] },
          ],
        },
      ],
    },
    more: [
      {
        label: "Response time by region, this year and last year, in milliseconds",
        type: "violin",
        horizontal: true,
        violinSide: "top",
        violinNormalize: "group",
        hideViolinPoints: true,
        colorBlindMode: true,
        valueSuffix: " ms",
        height: 280,
        categories: ["North", "South"],
        series: [
          {
            name: "This year",
            data: [
              {
                y: {
                  density: [
                    [20, 1],
                    [40, 6],
                    [60, 9],
                    [80, 5],
                    [100, 2],
                    [120, 1],
                  ],
                },
              },
              {
                y: {
                  density: [
                    [40, 1],
                    [70, 4],
                    [90, 8],
                    [110, 6],
                    [140, 2],
                  ],
                },
              },
            ],
          },
          {
            name: "Last year",
            data: [
              {
                y: {
                  density: [
                    [40, 2],
                    [70, 7],
                    [100, 8],
                    [130, 4],
                    [160, 1],
                  ],
                },
              },
              {
                y: {
                  density: [
                    [60, 2],
                    [90, 5],
                    [120, 7],
                    [150, 5],
                    [180, 2],
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  },
  // Roadmap 4.18.21: beeswarm charts (ApexCharts unit `layout: "scatter"`).
  beeswarm: {
    title: "Beeswarm",
    props: {
      label: "Salaries by department, thousands of dollars",
      type: "beeswarm",
      valueSuffix: "k",
      height: 300,
      categories: [
        "Ann",
        "Ben",
        "Caro",
        "Dan",
        "Eve",
        "Finn",
        "Gia",
        "Hugo",
        "Ivy",
        "Jon",
        "Kim",
        "Leo",
      ],
      series: [
        { name: "Sales", data: [55, 62, 58, 71, 66, 60, 64, 58, 73, 69, 61, 57] },
        { name: "Design", data: [72, 80, 75, 78, 83, 90, 68, 74, null, null, null, null] },
        { name: "Support", data: [41, 44, 39, 47, 45, 42, 40, 43, 46, null, null, null] },
      ],
    },
    more: [
      {
        label: "Response time per request, milliseconds",
        type: "beeswarm",
        orientation: "vertical",
        beeswarmSpread: "jitter",
        markerSize: 3,
        colorBlindMode: true,
        height: 300,
        series: [
          { name: "API", data: [120, 132, 140, 151, 158, 160, 171, 180, 195, 210, 240, 310] },
          { name: "Web", data: [80, 92, 95, 101, 110, 118, 124, 131, 140, 155, 172, 190] },
        ],
      },
    ],
  },
  // Roadmap 4.18.21: waffle charts (ApexCharts `waffle`).
  waffle: {
    title: "Waffle",
    props: {
      label: "Budget by department, in percent",
      type: "waffle",
      total: 100,
      valueSuffix: "%",
      height: 320,
      categories: ["Engineering", "Marketing", "Support", "Operations"],
      series: [{ name: "Budget", data: [38, 27, 21, 14] }],
    },
    more: [
      {
        label: "Survey answers per question",
        type: "waffle",
        split: true,
        total: 100,
        splitMax: 100,
        tileColumns: 3,
        colorBlindMode: true,
        height: 280,
        categories: ["Agree", "Neutral", "Disagree"],
        series: [{ name: "Answers", data: [64, 22, 14] }],
      },
    ],
  },
  // Roadmap 4.18.21: unit charts (ApexCharts `unit`).
  unit: {
    title: "Unit",
    props: {
      label: "Volunteers by city",
      type: "unit",
      unitLayout: "grouped",
      clusterLabels: true,
      height: 280,
      categories: ["Hanoi", "Da Nang", "Hue", "Can Tho"],
      series: [{ name: "Volunteers", data: [64, 28, 18, 42] }],
    },
    more: [
      {
        label: "Seats in the council by party",
        type: "unit",
        unitLayout: "arc",
        arcRows: 4,
        height: 280,
        categories: ["Blue party", "Green party", "Red party", "Independent"],
        series: [{ name: "Seats", data: [38, 27, 21, 14] }],
      },
      {
        label: "Tickets opened by team",
        type: "unit",
        unitLayout: "columns",
        clusterLabels: true,
        height: 260,
        categories: ["Mobile", "Web", "API"],
        series: [{ name: "Tickets", data: [34, 21, 55] }],
      },
      {
        label: "Population by region, one mark for 1,000 people",
        type: "unit",
        unitLayout: "packed",
        unitValue: 1000,
        colorBlindMode: true,
        height: 280,
        categories: ["North", "South", "Islands"],
        series: [{ name: "People", data: [42000, 31000, 9000] }],
      },
    ],
  },
  "x-axis-groups": {
    title: "X axis groups",
    props: {
      label: "Revenue per quarter and year",
      type: "bar",
      categories: QUARTERS,
      xaxisGroups: [
        { title: "2024", cols: 4 },
        { title: "2025", cols: 4 },
      ],
      series: [{ name: "Revenue", data: [18, 24, 31, 27, 29, 34, 40, 38] }],
    },
    more: [
      {
        label: "Sign-ups per quarter and half",
        categories: QUARTERS.slice(0, 4),
        xaxisGroups: [
          { title: "First half", cols: 2 },
          { title: "Second half", cols: 2 },
        ],
        xTitle: "Quarter",
        series: [{ name: "Sign-ups", data: [120, 180, 150, 210] }],
      },
    ],
  },
  "x-axis-rotation": {
    title: "X axis label rotation",
    props: {
      label: "Support tickets by product area",
      type: "bar",
      categories: LONG_LABELS,
      xLabelRotate: -45,
      series: [{ name: "Tickets", data: [31, 22, 17, 40, 12, 26, 19, 33] }],
    },
    more: [
      {
        label: "Support tickets by product area, turned at every width",
        type: "bar",
        categories: LONG_LABELS.slice(0, 5),
        xLabelRotate: -30,
        xLabelRotateAlways: true,
        series: [{ name: "Tickets", data: [31, 22, 17, 40, 12] }],
      },
    ],
  },
  "x-axis-window": {
    title: "Fixed x axis window",
    props: {
      label: "Daily visits, months three to seven",
      categories: MONTHS,
      xMin: 2,
      xMax: 6,
      markerSize: 4,
      series: [{ name: "Visits", data: [30, 41, 27, 43, 63, 71, 57, 81, 100] }],
    },
    more: [
      {
        label: "Daily visits, the last four months",
        categories: MONTHS,
        xRange: 3,
        markerSize: 4,
        series: [{ name: "Visits", data: [30, 41, 27, 43, 63, 71, 57, 81, 100] }],
      },
      {
        label: "Height and weight, an axis wider than the data",
        type: "scatter",
        xMin: 0,
        xMax: 100,
        series: [
          {
            name: "Samples",
            data: [
              [20, 31],
              [35, 42],
              [50, 47],
              [62, 58],
            ],
          },
        ],
      },
    ],
  },
  forecast: {
    title: "Forecast",
    props: {
      label: "Monthly sales with a forecast for the last three months",
      categories: MONTHS,
      forecastCount: 3,
      markerSize: 4,
      series: [{ name: "Sales", data: [30, 41, 35, 51, 49, 62, 69, 91, 108] }],
    },
    more: [
      {
        label: "Quarterly revenue with a forecast",
        type: "area",
        categories: MONTHS,
        forecastCount: 2,
        forecastDashArray: 6,
        forecastFillOpacity: 0.3,
        series: [{ name: "Revenue", data: [12, 19, 15, 25, 22, 30, 34, 40, 44] }],
      },
      {
        label: "Orders with a forecast",
        type: "bar",
        categories: MONTHS.slice(0, 6),
        forecastCount: 2,
        series: [{ name: "Orders", data: [44, 55, 41, 67, 22, 43] }],
      },
    ],
  },
  "no-data": {
    title: "No data",
    props: {
      label: "Orders this week",
      noDataText: "No orders yet",
      height: 200,
      categories: [],
      series: [{ name: "Orders", data: [] }],
    },
    more: [
      {
        label: "Sales by region",
        type: "donut",
        noDataText: "Add a region to see the chart",
        noDataVerticalAlign: "top",
        noDataAlign: "left",
        height: 200,
        categories: [],
        series: [{ name: "Sales", data: [] }],
      },
    ],
  },
  "annotations-text": {
    title: "Text annotations",
    props: {
      label: "Weekly visits with notes",
      categories: MONTHS,
      markerSize: 4,
      series: [{ name: "Visits", data: [30, 41, 27, 43, 63, 71, 57, 81, 100] }],
      annotations: [
        { axis: "text", x: "Mar", y: 15, label: "Campaign paused" },
        { axis: "text", x: "Aug", y: 95, label: "New pricing", textAnchor: "end", color: "error" },
      ],
    },
  },
  "timeline-rows": {
    title: "Timeline rows",
    props: {
      label: "Team schedules, one row per team",
      type: "timeline",
      xType: "category",
      rangeBarGroupRows: true,
      height: 240,
      series: TIMELINE_ROWS,
    },
    more: [
      {
        label: "Team schedules, overlapping work in its own lane",
        type: "timeline",
        xType: "category",
        rangeBarGroupRows: true,
        disableRangeBarOverlap: true,
        height: 240,
        series: TIMELINE_ROWS,
      },
    ],
  },
  "column-zero-bars": {
    title: "Column without zero bars",
    props: {
      label: "Sales per product, products without sales take no slot",
      type: "bar",
      hideZeroBarsWhenGrouped: true,
      categories: ["North", "South", "East", "West"],
      series: [
        { name: "Hats", data: [14, 0, 21, 9] },
        { name: "Bags", data: [0, 18, null, 12] },
        { name: "Shoes", data: [8, 15, 11, 0] },
      ],
    },
  },
  "data-reducer": {
    title: "Large series",
    props: {
      label: "Sensor readings, 600 points drawn as about 100",
      type: "line",
      dataReducer: true,
      dataReducerTargetPoints: 100,
      dataReducerThreshold: 200,
      categories: READINGS.map((_, index) => String(index + 1)),
      series: [{ name: "Reading", data: READINGS }],
    },
  },
  "brush-targets": {
    title: "Brush several charts",
    props: {
      id: "brush-targets-a",
      label: "Visits of the whole year, the first detail chart",
      categories: YEAR,
      height: 180,
      series: [{ name: "Visits", data: [12, 19, 15, 25, 22, 30, 34, 40, 44, 38, 42, 50] }],
    },
    more: [
      {
        id: "brush-targets-b",
        label: "Orders of the whole year, the second detail chart",
        type: "bar",
        categories: YEAR,
        height: 180,
        series: [{ name: "Orders", data: [4, 9, 6, 11, 8, 13, 15, 12, 17, 14, 19, 21] }],
      },
      {
        label: "Brush over both charts",
        brushTarget: ["brush-targets-a", "brush-targets-b"],
        categories: YEAR,
        height: 96,
        series: [{ name: "Visits", data: [12, 19, 15, 25, 22, 30, 34, 40, 44, 38, 42, 50] }],
      },
    ],
  },
};
