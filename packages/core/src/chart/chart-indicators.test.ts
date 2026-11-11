import { describe, expect, it } from "vitest";
import {
  atrValues,
  type ChartPrices,
  cciValues,
  chartIndicatorSeries,
  chartIndicatorsText,
  chartPrices,
  emaValues,
  macdValues,
  parseChartIndicators,
  pvtValues,
  rsiValues,
  smaValues,
  stochasticValues,
  vwapValues,
} from "./chart-indicators.js";
import { chartData } from "./chart-model.js";

/* Stock chart indicators (ADR-0047, phase 2.2): the math against hand-computed values. */

const close = [10, 11, 12, 13, 14, 13, 12, 13, 14, 15];
const prices = (values: readonly number[], volume?: readonly number[]): ChartPrices => ({
  open: values.map((v, i) => (i === 0 ? v : (values[i - 1] as number))),
  high: values.map((v) => v + 1),
  low: values.map((v) => v - 1),
  close: values,
  volume: volume ?? values.map(() => 100),
});
const round = (values: readonly (number | null)[], digits = 4) =>
  values.map((v) => (v === null ? null : Number(v.toFixed(digits))));

describe("indicator math", () => {
  it("simple and exponential moving averages", () => {
    expect(smaValues(close, 3)).toEqual([
      null,
      null,
      11,
      12,
      13,
      13 + 1 / 3,
      13,
      12 + 2 / 3,
      13,
      14,
    ]);
    expect(smaValues([1, null, 3, 4], 2)).toEqual([null, null, null, 3.5]);
    const ema = emaValues(close, 3);
    expect(ema.slice(0, 3)).toEqual([null, null, 11]);
    // k = 0.5: 13 × 0.5 + 11 × 0.5 = 12, then 14 × 0.5 + 12 × 0.5 = 13.
    expect(ema[3]).toBe(12);
    expect(ema[4]).toBe(13);
    expect(emaValues([1, null, 2, 3], 2)).toEqual([null, null, 1.5, 2.5]);
  });

  it("RSI (Wilder): 100 when only rising, 50 when flat, in between otherwise", () => {
    expect(rsiValues([1, 2, 3, 4, 5], 2).slice(2)).toEqual([100, 100, 100]);
    expect(rsiValues([5, 5, 5, 5], 2).slice(2)).toEqual([50, 50]);
    const rsi = rsiValues([10, 12, 11, 13, 12], 2);
    // Gains 2, 0 | losses 0, 1 → avg 1 / 0.5 → RS 2 → 66.67.
    expect(round(rsi, 2)[2]).toBe(66.67);
    expect(rsi.every((v) => v === null || (v >= 0 && v <= 100))).toBe(true);
    expect(rsiValues([1, null, 3], 1)).toEqual([null, null, null]);
  });

  it("MACD: fast − slow EMA, its signal and the histogram", () => {
    const { macd, signal, histogram } = macdValues(close, 2, 3, 2);
    const fast = emaValues(close, 2);
    const slow = emaValues(close, 3);
    expect(macd[2]).toBeCloseTo((fast[2] as number) - (slow[2] as number));
    expect(signal[2]).toBeNull();
    expect(histogram[3]).toBeCloseTo((macd[3] as number) - (signal[3] as number));
  });

  it("stochastic, ATR, CCI, VWAP and PVT", () => {
    const p = prices(close);
    const { k, d } = stochasticValues(p, 3, 2);
    // Bar 2: high 13, low 9 over three bars, close 12 → 75.
    expect(k[2]).toBe(75);
    expect(d[3]).toBeCloseTo(((k[2] as number) + (k[3] as number)) / 2);
    const flat = prices([5, 5, 5]);
    expect(stochasticValues({ ...flat, high: [5, 5, 5], low: [5, 5, 5] }, 2, 1).k).toEqual([
      null,
      50,
      50,
    ]);
    // True range: 2 per bar (high − low), so the ATR is 2.
    expect(atrValues(p, 3).slice(2, 4)).toEqual([2, 2]);
    expect(atrValues({ ...p, high: [null, ...p.high.slice(1)] }, 1)[0]).toBeNull();
    expect(round(cciValues(prices([10, 10, 10]), 3))).toEqual([null, null, 0]);
    expect(round(cciValues(p, 3))[2]).toBe(100);
    expect(vwapValues(prices([10, 20], [1, 3]))).toEqual([10, 17.5]);
    expect(vwapValues({ ...prices([10]), volume: [null] })).toEqual([null]);
    expect(pvtValues(prices([10, 11, 11], [5, 10, 10]))).toEqual([0, 1, 1]);
    expect(pvtValues({ ...prices([10, 11]), volume: [null, null] })).toEqual([null, null]);
  });
});

describe("parseChartIndicators / chartIndicatorsText", () => {
  it("reads types, positional parameters and colors; drops the rest", () => {
    expect(
      parseChartIndicators(
        "sma 20 warning; bollinger 20 2.5; macd 12 26 9; rsi; pink; volume info",
      ),
    ).toEqual([
      { type: "sma", period: 20, color: "warning" },
      { type: "bollinger", period: 20, stdDev: 2.5 },
      { type: "macd", fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      { type: "rsi" },
      { type: "volume", color: "info" },
    ]);
    expect(parseChartIndicators(null)).toEqual([]);
    expect(parseChartIndicators("x".repeat(2001))).toEqual([]);
  });

  it("writes them back", () => {
    const text = chartIndicatorsText([
      { type: "ema", period: 50, color: "info" },
      { type: "keltner", period: 20, atrPeriod: 10, multiplier: 2 },
      { type: "nope" as never },
      { type: "vwap", color: "pink" as never },
    ]);
    expect(text).toBe("ema 50 info; keltner 20 10 2; vwap");
    expect(parseChartIndicators(text)[1]).toEqual({
      type: "keltner",
      period: 20,
      atrPeriod: 10,
      multiplier: 2,
    });
  });
});

describe("chartIndicatorSeries", () => {
  const candles = close.map((c, i) => ({
    y: [i ? (close[i - 1] as number) : c, c + 1, c - 1, c],
    v: 1000 + i,
  }));
  const data = chartData({
    type: "candlestick",
    xType: "category",
    categories: close.map((_, i) => `D${i}`),
    series: [{ name: "ACME", data: candles }],
  });

  it("reads the bars and volumes of the price series", () => {
    const p = chartPrices(data.series[0], 10);
    expect(p.close).toEqual(close);
    expect(p.volume[3]).toBe(1003);
    const line = chartData({ series: [{ name: "P", data: [1, null, { y: 3, v: 7 }] }] });
    const q = chartPrices(line.series[0], 3);
    expect(q.high).toEqual([1, null, 3]);
    expect(q.volume).toEqual([null, null, 7]);
    expect(chartPrices(undefined, 2).close).toEqual([null, null]);
  });

  it("puts overlays on the price pane and each oscillator in a pane of its own", () => {
    const series = chartIndicatorSeries(data, [
      { type: "sma", period: 3 },
      { type: "ema", period: 3, color: "error" },
      { type: "bollinger", period: 3 },
      { type: "vwap" },
      { type: "donchian", period: 3 },
      { type: "keltner", period: 3, atrPeriod: 2 },
      { type: "volume" },
      { type: "rsi", period: 3 },
      { type: "macd", fastPeriod: 2, slowPeriod: 3, signalPeriod: 2 },
      { type: "stochastic", period: 3 },
      { type: "atr", period: 3 },
      { type: "cci", period: 3 },
      { type: "pvt" },
      { type: "bogus" as never },
    ]);
    expect(series.map((s) => [s.name, s.pane, s.type])).toEqual([
      ["SMA 3", 0, "line"],
      ["EMA 3", 0, "line"],
      ["Bollinger 3, 2", 0, "rangeArea"],
      ["VWAP", 0, "line"],
      ["Donchian 3", 0, "rangeArea"],
      ["Keltner 3, 2, 2", 0, "rangeArea"],
      ["Volume", 1, "bar"],
      ["RSI 3", 2, "line"],
      ["Histogram", 3, "bar"],
      ["MACD 2, 3", 3, "line"],
      ["Signal 2", 3, "line"],
      ["%K 3", 4, "line"],
      ["%D 3", 4, "line"],
      ["ATR 3", 5, "line"],
      ["CCI 3", 6, "line"],
      ["PVT", 7, "line"],
    ]);
    expect(series[1]?.color).toBe("error");
    expect(series[0]?.points[2]).toEqual({ x: 2, y: 11 });
    expect(series[2]?.points[2]?.range).toHaveLength(2);
    expect(series[2]?.points[0]).toEqual({ x: 0, y: null });
    // Volume bars follow the candles; they stay out of the table.
    expect(series[6]?.table).toBe(false);
    expect(series[6]?.points[1]?.color).toBe("success");
    expect(series[6]?.points[5]?.color).toBe("error");
    expect(series[7]?.scale).toEqual({ min: 0, max: 100 });
    expect(series[7]?.guides).toEqual([30, 70]);
    expect(series[8]?.points.some((p) => p.color === "error" || p.color === "success")).toBe(true);
    expect(series.every((s) => s.indicator)).toBe(true);
  });

  it("falls back on invalid parameters and keeps own volume colors flat", () => {
    const [sma, volume] = chartIndicatorSeries(data, [
      { type: "sma", period: 0.5 },
      { type: "volume", color: "info" },
      { type: "bollinger", stdDev: 99 },
    ]);
    expect(sma?.name).toBe("SMA 20");
    expect(volume?.points.every((p) => p.color === undefined)).toBe(true);
  });

  it("takes a valid band width: 3 deviations are wider than the default 2", () => {
    const width = (stdDev?: number) => {
      const [bands] = chartIndicatorSeries(data, [{ type: "bollinger", period: 3, stdDev }]);
      const point = bands?.points.find((p) => p.range && p.range[1] !== p.range[0]);
      const [lo, hi] = point?.range ?? [0, 0];
      return { name: bands?.name, width: (hi ?? 0) - (lo ?? 0) };
    };
    expect(width(3).name).toBe("Bollinger 3, 3");
    expect(width().name).toBe("Bollinger 3, 2");
    expect(width(3).width).toBeCloseTo((width().width * 3) / 2, 2);
  });

  it("a window with a missing high or low has no stochastic value", () => {
    const p = prices(close);
    const { k } = stochasticValues(
      { ...p, high: [p.high[0] ?? null, null, ...p.high.slice(2)] },
      3,
      1,
    );
    // Bars 1–3 see the gap; bar 4's window (2–4) doesn't.
    expect(k.slice(0, 5).map((v) => v === null)).toEqual([true, true, true, true, false]);
  });
});
