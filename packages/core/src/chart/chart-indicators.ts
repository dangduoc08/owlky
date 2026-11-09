import {
  type ChartColor,
  type ChartData,
  type ChartDataSeries,
  type ChartPoint,
  chartColors,
  parseChartNumber,
} from "./chart-model.js";

/*
 * Technical indicators of stock charts (ADR-0047, phase 2.2). Pure functions over the price
 * series (open, high, low, close, volume): values are `null` until an indicator has enough bars
 * (its warm-up). `chartIndicatorSeries` turns a chart's indicators into generated series: overlays
 * on the price pane, oscillators in panes of their own. Our own implementations of the textbook
 * formulas (Wilder smoothing for RSI and ATR).
 */

export const chartIndicatorTypes = [
  "sma",
  "ema",
  "bollinger",
  "vwap",
  "donchian",
  "keltner",
  "volume",
  "rsi",
  "macd",
  "stochastic",
  "atr",
  "cci",
  "pvt",
] as const;
export type ChartIndicatorType = (typeof chartIndicatorTypes)[number];

/** Indicators drawn over the price (the others get a pane each). */
const OVERLAYS: readonly ChartIndicatorType[] = [
  "sma",
  "ema",
  "bollinger",
  "vwap",
  "donchian",
  "keltner",
];

/** An indicator and its parameters (defaults per type; invalid values fall back). */
export interface ChartIndicator {
  readonly type: ChartIndicatorType;
  /** Window in bars: SMA, EMA, Bollinger, Donchian, Keltner (its EMA), RSI, stochastic, ATR, CCI. */
  readonly period?: number | undefined;
  /** Bollinger Bands: width in standard deviations. Default 2. */
  readonly stdDev?: number | undefined;
  /** MACD: fast and slow EMA periods and the signal period. Default 12, 26, 9. */
  readonly fastPeriod?: number | undefined;
  readonly slowPeriod?: number | undefined;
  /** MACD signal; stochastic %D. Default 9 (MACD), 3 (stochastic). */
  readonly signalPeriod?: number | undefined;
  /** Keltner Channels: ATR period and multiplier. Default 10 and 2. */
  readonly atrPeriod?: number | undefined;
  readonly multiplier?: number | undefined;
  /** The indicator's color (its main line, band or bars). */
  readonly color?: ChartColor | undefined;
}

/** Parameters in the order of the HTML attribute text (`"macd 12 26 9"`), per type. */
const PARAMS: Record<ChartIndicatorType, readonly (keyof ChartIndicator)[]> = {
  sma: ["period"],
  ema: ["period"],
  bollinger: ["period", "stdDev"],
  vwap: [],
  donchian: ["period"],
  keltner: ["period", "atrPeriod", "multiplier"],
  volume: [],
  rsi: ["period"],
  macd: ["fastPeriod", "slowPeriod", "signalPeriod"],
  stochastic: ["period", "signalPeriod"],
  atr: ["period"],
  cci: ["period"],
  pvt: [],
};

const DEFAULT_PERIOD: Partial<Record<ChartIndicatorType, number>> = {
  sma: 20,
  ema: 20,
  bollinger: 20,
  donchian: 20,
  keltner: 20,
  rsi: 14,
  stochastic: 14,
  atr: 14,
  cci: 20,
};

const isColor = (value: unknown): value is ChartColor => chartColors.includes(value as ChartColor);
/** A whole number of bars from 1 to 500, or the fallback. */
const bars = (value: unknown, fallback: number) => {
  const n = parseChartNumber(value);
  return n !== null && Number.isInteger(n) && n >= 1 && n <= 500 ? n : fallback;
};
/** A positive multiplier up to 10, or the fallback. */
const factor = (value: unknown, fallback: number) => {
  const n = parseChartNumber(value);
  return n !== null && n > 0 && n <= 10 ? n : fallback;
};

/** Indicators from attribute text: `type params… color` groups separated by `;`. */
export function parseChartIndicators(text: string | null | undefined): ChartIndicator[] {
  if (!text || text.length > 2000) return [];
  return text.split(";").flatMap((group): ChartIndicator[] => {
    const [type, ...rest] = group.trim().split(/\s+/);
    if (!chartIndicatorTypes.includes(type as ChartIndicatorType)) return [];
    const kind = type as ChartIndicatorType;
    const out: Record<string, unknown> = { type: kind };
    const numbers = rest.filter((part) => parseChartNumber(part) !== null);
    PARAMS[kind].forEach((name, i) => {
      if (numbers[i] !== undefined) out[name] = Number(numbers[i]);
    });
    const color = rest.find(isColor);
    if (color) out["color"] = color;
    return [out as unknown as ChartIndicator];
  });
}

/** Indicators as attribute text (the inverse of `parseChartIndicators`). */
export function chartIndicatorsText(indicators: readonly ChartIndicator[]): string {
  return indicators
    .flatMap((indicator) => {
      if (!indicator || !chartIndicatorTypes.includes(indicator.type)) return [];
      const params = PARAMS[indicator.type]
        .map((name) => parseChartNumber(indicator[name]))
        .filter((value): value is number => value !== null);
      const color = isColor(indicator.color) ? [indicator.color] : [];
      return [[indicator.type, ...params, ...color].join(" ")];
    })
    .join("; ");
}

// --- Math ---------------------------------------------------------------------------------------

export type ChartValues = (number | null)[];

/** Prices of the bars: open, high, low, close and volume (`null` where a bar is missing). */
export interface ChartPrices {
  readonly open: readonly (number | null)[];
  readonly high: readonly (number | null)[];
  readonly low: readonly (number | null)[];
  readonly close: readonly (number | null)[];
  readonly volume: readonly (number | null)[];
}

/** Simple moving average over `period` values (null until the window is full of numbers). */
export function smaValues(values: readonly (number | null)[], period: number): ChartValues {
  const out: ChartValues = [];
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const old = i >= period ? values[i - period] : undefined;
    if (typeof v === "number") {
      sum += v;
      count++;
    }
    if (typeof old === "number") {
      sum -= old;
      count--;
    }
    out.push(count === period ? sum / period : null);
  }
  return out;
}

/** Exponential moving average (k = 2 / (period + 1)), seeded with the first full SMA. */
export function emaValues(values: readonly (number | null)[], period: number): ChartValues {
  const k = 2 / (period + 1);
  const out: ChartValues = [];
  let ema: number | null = null;
  let seed = 0;
  let seen = 0;
  for (const v of values) {
    if (typeof v !== "number") {
      out.push(ema === null ? null : ema);
      continue;
    }
    if (ema === null) {
      seed += v;
      seen++;
      if (seen === period) ema = seed / period;
      out.push(ema);
      continue;
    }
    ema = v * k + ema * (1 - k);
    out.push(ema);
  }
  return out;
}

/** Wilder's smoothing (RSI, ATR): the first value is an average, then `(prev × (n − 1) + v) / n`. */
function wilder(values: readonly (number | null)[], period: number): ChartValues {
  const out: ChartValues = [];
  let avg: number | null = null;
  let sum = 0;
  let seen = 0;
  for (const v of values) {
    if (typeof v !== "number") {
      out.push(avg);
      continue;
    }
    if (avg === null) {
      sum += v;
      seen++;
      if (seen === period) avg = sum / period;
    } else avg = (avg * (period - 1) + v) / period;
    out.push(avg);
  }
  return out;
}

/** Population standard deviation over a window, around its mean. */
function stdValues(values: readonly (number | null)[], period: number): ChartValues {
  const mean = smaValues(values, period);
  return values.map((_, i) => {
    const m = mean[i];
    if (m === null || m === undefined) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += ((values[j] as number) - m) ** 2;
    return Math.sqrt(sum / period);
  });
}

/** Highest and lowest values over a window (`null` until it is full). */
function extremes(
  high: readonly (number | null)[],
  low: readonly (number | null)[],
  period: number,
) {
  const hi: ChartValues = [];
  const lo: ChartValues = [];
  for (let i = 0; i < high.length; i++) {
    if (i < period - 1) {
      hi.push(null);
      lo.push(null);
      continue;
    }
    let h = Number.NEGATIVE_INFINITY;
    let l = Number.POSITIVE_INFINITY;
    let ok = true;
    for (let j = i - period + 1; j <= i; j++) {
      const a = high[j];
      const b = low[j];
      if (typeof a !== "number" || typeof b !== "number") ok = false;
      else {
        h = Math.max(h, a);
        l = Math.min(l, b);
      }
    }
    hi.push(ok ? h : null);
    lo.push(ok ? l : null);
  }
  return { hi, lo };
}

/** True range of each bar (the first: high − low). */
function trueRange(p: ChartPrices): ChartValues {
  return p.close.map((_, i) => {
    const h = p.high[i];
    const l = p.low[i];
    if (typeof h !== "number" || typeof l !== "number") return null;
    const prev = i > 0 ? p.close[i - 1] : null;
    if (typeof prev !== "number") return h - l;
    return Math.max(h - l, Math.abs(h - prev), Math.abs(l - prev));
  });
}

/** Relative Strength Index (Wilder, 0 to 100). */
export function rsiValues(close: readonly (number | null)[], period: number): ChartValues {
  const gains: (number | null)[] = [null];
  const losses: (number | null)[] = [null];
  for (let i = 1; i < close.length; i++) {
    const a = close[i - 1];
    const b = close[i];
    if (typeof a !== "number" || typeof b !== "number") {
      gains.push(null);
      losses.push(null);
    } else {
      gains.push(Math.max(0, b - a));
      losses.push(Math.max(0, a - b));
    }
  }
  const g = wilder(gains, period);
  const l = wilder(losses, period);
  return g.map((gain, i) => {
    const loss = l[i];
    if (gain === null || loss === null || loss === undefined) return null;
    if (loss === 0) return gain === 0 ? 50 : 100;
    return 100 - 100 / (1 + gain / loss);
  });
}

/** MACD: the fast EMA minus the slow one, its signal EMA and the histogram (MACD − signal). */
export function macdValues(
  close: readonly (number | null)[],
  fast: number,
  slow: number,
  signal: number,
): { macd: ChartValues; signal: ChartValues; histogram: ChartValues } {
  const a = emaValues(close, fast);
  const b = emaValues(close, slow);
  const macd = a.map((v, i) => (v === null || b[i] === null ? null : v - (b[i] as number)));
  const sig = emaValues(macd, signal);
  const histogram = macd.map((v, i) =>
    v === null || sig[i] === null ? null : v - (sig[i] as number),
  );
  return { macd, signal: sig, histogram };
}

/** Stochastic oscillator: %K over `period` bars and its `signal`-bar average %D. */
export function stochasticValues(p: ChartPrices, period: number, signal: number) {
  const { hi, lo } = extremes(p.high, p.low, period);
  const k = p.close.map((c, i) => {
    const h = hi[i];
    const l = lo[i];
    if (typeof c !== "number" || h === null || l === null || h === undefined || l === undefined)
      return null;
    return h === l ? 50 : ((c - l) / (h - l)) * 100;
  });
  return { k, d: smaValues(k, signal) };
}

/** Average True Range (Wilder). */
export const atrValues = (p: ChartPrices, period: number): ChartValues =>
  wilder(trueRange(p), period);

/** Commodity Channel Index: (typical − its SMA) / (0.015 × mean deviation). */
export function cciValues(p: ChartPrices, period: number): ChartValues {
  const typical = typicalPrice(p);
  const mean = smaValues(typical, period);
  return typical.map((t, i) => {
    const m = mean[i];
    if (t === null || m === null || m === undefined) return null;
    let dev = 0;
    for (let j = i - period + 1; j <= i; j++) dev += Math.abs((typical[j] as number) - m);
    dev /= period;
    return dev === 0 ? 0 : (t - m) / (0.015 * dev);
  });
}

const typicalPrice = (p: ChartPrices): ChartValues =>
  p.close.map((c, i) => {
    const h = p.high[i];
    const l = p.low[i];
    return typeof c === "number" && typeof h === "number" && typeof l === "number"
      ? (h + l + c) / 3
      : null;
  });

/** Volume-weighted average price, cumulative from the first bar (typical price). */
export function vwapValues(p: ChartPrices): ChartValues {
  const typical = typicalPrice(p);
  let pv = 0;
  let vol = 0;
  return typical.map((t, i) => {
    const v = p.volume[i];
    if (t !== null && typeof v === "number") {
      pv += t * v;
      vol += v;
    }
    return vol > 0 ? pv / vol : null;
  });
}

/** Price volume trend: the running sum of volume × relative change of the close. */
export function pvtValues(p: ChartPrices): ChartValues {
  let total = 0;
  return p.close.map((c, i) => {
    if (i === 0) return typeof p.volume[0] === "number" ? 0 : null;
    const prev = p.close[i - 1];
    const v = p.volume[i];
    if (typeof c !== "number" || typeof prev !== "number" || typeof v !== "number" || prev === 0)
      return null;
    total += (v * (c - prev)) / prev;
    return total;
  });
}

// --- Series -------------------------------------------------------------------------------------

/** The bars of the price series: candles give four values, other series one (the close). */
export function chartPrices(series: ChartDataSeries | undefined, count: number): ChartPrices {
  const open: (number | null)[] = new Array(count).fill(null);
  const high = [...open];
  const low = [...open];
  const close = [...open];
  const volume = [...open];
  for (const point of series?.points ?? []) {
    if (point.x < 0 || point.x >= count) continue;
    if (point.volume !== undefined) volume[point.x] = point.volume;
    if (point.y === null) continue;
    const [o, h, l, c] =
      point.range?.length === 4 ? point.range : [point.y, point.y, point.y, point.y];
    open[point.x] = o as number;
    high[point.x] = h as number;
    low[point.x] = l as number;
    close[point.x] = c as number;
  }
  return { open, high, low, close, volume };
}

/** Default indicator colors in order (the price uses the series color or the candle colors). */
const COLORS: readonly ChartColor[] = [
  "warning",
  "info",
  "secondary",
  "success-dark",
  "error-light",
  "info-dark",
];

const r4 = (value: number) => Math.round(value * 10_000) / 10_000;
const line = (
  values: ChartValues,
  name: string,
  color: ChartColor,
  type: ChartIndicatorType,
  pane: number,
  extra: Partial<ChartDataSeries> = {},
): ChartDataSeries => ({
  name,
  type: "line",
  color,
  indicator: type,
  pane,
  points: values.map((y, x) => ({ x, y: y === null ? null : r4(y) })),
  ...extra,
});
const band = (
  lower: ChartValues,
  upper: ChartValues,
  name: string,
  color: ChartColor,
  type: ChartIndicatorType,
): ChartDataSeries => ({
  name,
  type: "rangeArea",
  color,
  indicator: type,
  pane: 0,
  points: lower.map((lo, x) => {
    const hi = upper[x];
    return lo === null || hi === null || hi === undefined
      ? { x, y: null }
      : { x, y: r4(hi), range: [r4(lo), r4(hi)] };
  }),
});

/**
 * The generated series of a chart's indicators (appended to its data): overlays in pane 0,
 * one pane per oscillator (in order). Volume comes from the price points' `v`.
 */
export function chartIndicatorSeries(
  data: ChartData,
  indicators: readonly ChartIndicator[],
): ChartDataSeries[] {
  const count = Math.max(data.categories.length, ...data.series.map((s) => s.points.length), 0);
  const prices = chartPrices(data.series[0], count);
  const out: ChartDataSeries[] = [];
  let pane = 0;
  indicators.forEach((indicator, i) => {
    if (!indicator || !chartIndicatorTypes.includes(indicator.type)) return;
    const type = indicator.type;
    const color = isColor(indicator.color)
      ? indicator.color
      : (COLORS[i % COLORS.length] as ChartColor);
    const period = bars(indicator.period, DEFAULT_PERIOD[type] ?? 14);
    const own = OVERLAYS.includes(type) ? 0 : ++pane;
    switch (type) {
      case "sma":
        out.push(line(smaValues(prices.close, period), `SMA ${period}`, color, type, 0));
        break;
      case "ema":
        out.push(line(emaValues(prices.close, period), `EMA ${period}`, color, type, 0));
        break;
      case "vwap":
        out.push(line(vwapValues(prices), "VWAP", color, type, 0));
        break;
      case "bollinger": {
        const width = factor(indicator.stdDev, 2);
        const mid = smaValues(prices.close, period);
        const sd = stdValues(prices.close, period);
        const at = (sign: number) =>
          mid.map((m, x) =>
            m === null || sd[x] === null ? null : m + sign * width * (sd[x] as number),
          );
        out.push(band(at(-1), at(1), `Bollinger ${period}, ${width}`, color, type));
        break;
      }
      case "donchian": {
        const { hi, lo } = extremes(prices.high, prices.low, period);
        out.push(band(lo, hi, `Donchian ${period}`, color, type));
        break;
      }
      case "keltner": {
        const atrPeriod = bars(indicator.atrPeriod, 10);
        const m = factor(indicator.multiplier, 2);
        const mid = emaValues(prices.close, period);
        const atr = atrValues(prices, atrPeriod);
        const at = (sign: number) =>
          mid.map((e, x) =>
            e === null || atr[x] === null ? null : e + sign * m * (atr[x] as number),
          );
        out.push(band(at(-1), at(1), `Keltner ${period}, ${atrPeriod}, ${m}`, color, type));
        break;
      }
      case "volume": {
        // Bars colored by the candle: rising (close ≥ open) or falling.
        const points: ChartPoint[] = prices.volume.map((v, x) => {
          if (v === null) return { x, y: null };
          const up = (prices.close[x] ?? 0) >= (prices.open[x] ?? 0);
          return { x, y: v, color: up ? "success" : "error" };
        });
        out.push({
          name: "Volume",
          type: "bar",
          color: isColor(indicator.color) ? indicator.color : "info",
          indicator: type,
          pane: own,
          table: false,
          points: isColor(indicator.color) ? points.map(({ x, y }) => ({ x, y })) : points,
        });
        break;
      }
      case "rsi":
        out.push(
          line(rsiValues(prices.close, period), `RSI ${period}`, color, type, own, {
            scale: { min: 0, max: 100 },
            guides: [30, 70],
          }),
        );
        break;
      case "macd": {
        const fast = bars(indicator.fastPeriod, 12);
        const slow = bars(indicator.slowPeriod, 26);
        const signal = bars(indicator.signalPeriod, 9);
        const v = macdValues(prices.close, fast, slow, signal);
        out.push({
          name: "Histogram",
          type: "bar",
          color: "success",
          indicator: type,
          pane: own,
          points: v.histogram.map((y, x) =>
            y === null ? { x, y: null } : { x, y: r4(y), color: y >= 0 ? "success" : "error" },
          ),
        });
        out.push(
          line(
            v.macd,
            `MACD ${fast}, ${slow}`,
            isColor(indicator.color) ? color : "info",
            type,
            own,
          ),
        );
        out.push(line(v.signal, `Signal ${signal}`, "warning", type, own));
        break;
      }
      case "stochastic": {
        const signal = bars(indicator.signalPeriod, 3);
        const v = stochasticValues(prices, period, signal);
        out.push(
          line(v.k, `%K ${period}`, color, type, own, {
            scale: { min: 0, max: 100 },
            guides: [20, 80],
          }),
        );
        out.push(line(v.d, `%D ${signal}`, "secondary", type, own));
        break;
      }
      case "atr":
        out.push(line(atrValues(prices, period), `ATR ${period}`, color, type, own));
        break;
      case "cci":
        out.push(
          line(cciValues(prices, period), `CCI ${period}`, color, type, own, {
            guides: [-100, 100],
          }),
        );
        break;
      case "pvt":
        out.push(line(pvtValues(prices), "PVT", color, type, own));
        break;
    }
  });
  return out;
}
