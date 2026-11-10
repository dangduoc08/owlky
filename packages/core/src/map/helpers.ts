/*
 * Pure helpers of the Map (ADR-0025): URL checks, attribution text, scale bar, popup anchors,
 * WebGL detection. No MapLibre import, so they are cheap to test.
 */
import type { MapAnchor, MapScaleUnit } from "../anatomy/anatomy.js";

/**
 * A URL the map may fetch (styles, data, tiles): `http:` / `https:` absolute or relative URLs,
 * resolved against the page. Anything else (`javascript:`, `data:`, `file:`) returns `null`.
 * Tile templates keep their `{z}/{x}/{y}` placeholders.
 */
export function safeMapUrl(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text === "" || text.length > 4096) return null;
  try {
    const url = new URL(text, document.baseURI);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // Keep the author's template placeholders readable (URL() encodes the braces).
    return url.href.replace(/%7B/gi, "{").replace(/%7D/gi, "}");
  } catch {
    return null;
  }
}

/** One run of attribution text: plain text, or a link with a safe `href`. */
export interface AttributionPart {
  readonly text: string;
  readonly href?: string | undefined;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
};

const decode = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, name: string) => {
    if (name[0] === "#") {
      const code =
        name[1] === "x" || name[1] === "X"
          ? Number.parseInt(name.slice(2), 16)
          : Number(name.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    }
    return ENTITIES[name.toLowerCase()] ?? match;
  });

/**
 * Splits a source's attribution (HTML from the style, such as `<a href="…">© OpenMapTiles</a>`)
 * into text and links without parsing HTML: links keep only `http(s)` URLs, every other tag is
 * dropped. The controller builds DOM nodes from the parts (no `innerHTML`, Trusted Types safe).
 */
export function parseAttribution(html: string): AttributionPart[] {
  const parts: AttributionPart[] = [];
  const push = (text: string, href?: string) => {
    const value = decode(text.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ");
    if (value.trim() === "") {
      if (value !== "" && parts.length > 0) parts.push({ text: " " });
      return;
    }
    parts.push(href ? { text: value.trim(), href } : { text: value });
  };
  const link = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
  let last = 0;
  for (let match = link.exec(html); match; match = link.exec(html)) {
    push(html.slice(last, match.index));
    const href = /\bhref\s*=\s*["']?([^"'\s>]+)/i.exec(match[1] as string);
    const url = href ? safeMapUrl(decode(href[1] as string)) : null;
    push(match[2] as string, url ?? undefined);
    last = match.index + match[0].length;
  }
  push(html.slice(last));
  return parts;
}

const UNITS: Record<MapScaleUnit, { factor: number; big: number; small: string; large: string }> = {
  metric: { factor: 1, big: 1000, small: "m", large: "km" },
  imperial: { factor: 3.2808, big: 5280, small: "ft", large: "mi" },
  nautical: { factor: 1 / 1852, big: Number.POSITIVE_INFINITY, small: "nm", large: "nm" },
};

/** Rounds down to 1, 2, 3 or 5 times a power of ten (the scale bar's lengths). */
function roundScale(value: number): number {
  const power = 10 ** (`${Math.floor(value)}`.length - 1);
  const d = value / power;
  // `d` is in [1, 10) for values from 1 up, below 1 for smaller ones.
  const step = d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : Math.min(d, 1);
  return power * step;
}

/**
 * The scale bar for `meters` across `maxWidth` px: its label (`"500 km"`) and width in px.
 * Imperial switches from feet to miles at a mile, metric from metres to kilometres at 1 km.
 */
export function mapScaleBar(
  meters: number,
  maxWidth: number,
  unit: MapScaleUnit = "metric",
): { label: string; width: number } {
  if (!(meters > 0) || !(maxWidth > 0)) return { label: "", width: 0 };
  const { factor, big, small, large } = UNITS[unit];
  const distance = meters * factor;
  const useLarge = unit === "nautical" || distance >= big;
  const value = useLarge && unit !== "nautical" ? distance / big : distance;
  const rounded = roundScale(value);
  const width = (maxWidth * rounded) / value;
  const label = `${Number(rounded.toPrecision(3))} ${useLarge ? large : small}`;
  return { label, width: Math.round(width * 100) / 100 };
}

/**
 * The anchor a popup gets when none is set: below the point when it would leave the top, above
 * otherwise, and shifted sideways near the left or right edge (like MapLibre's popups).
 */
export function autoAnchor(
  point: { x: number; y: number },
  size: { width: number; height: number },
  view: { width: number; height: number },
): MapAnchor {
  const vertical =
    point.y < size.height ? "top" : point.y > view.height - size.height ? "bottom" : "";
  const horizontal =
    point.x < size.width / 2 ? "left" : point.x > view.width - size.width / 2 ? "right" : "";
  const anchor = [vertical, horizontal].filter(Boolean).join("-");
  return (anchor || "bottom") as MapAnchor;
}

/** Unit vector pointing from the anchor side of a popup towards its point. */
const DIRECTIONS: Record<MapAnchor, [number, number]> = {
  center: [0, 0],
  top: [0, 1],
  bottom: [0, -1],
  left: [1, 0],
  right: [-1, 0],
  "top-left": [Math.SQRT1_2, Math.SQRT1_2],
  "top-right": [-Math.SQRT1_2, Math.SQRT1_2],
  "bottom-left": [Math.SQRT1_2, -Math.SQRT1_2],
  "bottom-right": [-Math.SQRT1_2, -Math.SQRT1_2],
};

/**
 * Parses an offset attribute: `"x,y"` (px) or one distance (px away from the point, in the
 * anchor's direction). Invalid → `[0, 0]`.
 */
export function mapOffset(value: string | null | undefined, anchor: MapAnchor): [number, number] {
  if (!value) return [0, 0];
  const numbers = value
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (numbers.length === 0 || numbers.length > 2 || numbers.some((n) => !Number.isFinite(n)))
    return [0, 0];
  if (numbers.length === 2) return [numbers[0] as number, numbers[1] as number];
  const [dx, dy] = DIRECTIONS[anchor];
  const distance = numbers[0] as number;
  return [Math.round(dx * distance * 100) / 100, Math.round(dy * distance * 100) / 100];
}

/** WebGL (2, or 1) can be created here: MapLibre needs it to draw. */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Great-circle distance in metres between two points (haversine). */
export function distanceMeters(a: [number, number], b: [number, number]): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.min(1, Math.sqrt(h)));
}
