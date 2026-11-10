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
};
