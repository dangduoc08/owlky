import { chartMarkerNode } from "./chart-cues.js";
import type { ChartFormat } from "./chart-format.js";
import {
  type ChartLayout,
  type ChartLayoutOptions,
  type ChartMark,
  type ChartNode,
  chartTextWidth,
  FONT,
  fmt,
  node,
  r2,
} from "./chart-layout.js";
import {
  type ChartColor,
  type ChartData,
  type ChartMarkerShape,
  chartMarkerShapes,
} from "./chart-model.js";
import { fitChartText } from "./chart-sankey.js";

/*
 * Waffle and unit charts (roadmap 4.18.21, ApexCharts `waffle` and `unit`): each value becomes a
 * number of marks, placed on a lattice (`grid`, waffle), in blobs, columns or an arc (`unit`,
 * `chart-unit-layouts.ts`). Marks are grouped by category, and a category is one item for the
 * tooltip and the keyboard: its marks light up together.
 */

export const chartFillFroms = ["bottom", "top"] as const;
export type ChartFillFrom = (typeof chartFillFroms)[number];

/** One drawn mark. Rectangular cells carry a `side` (their full width and height). */
export interface ChartUnitCell {
  readonly x: number;
  readonly y: number;
  /** Radius of round and shaped marks; half the side of squares. */
  readonly r: number;
  readonly category: number;
  /** Squares of the lattice (rects with their own corner radius). */
  readonly side?: number | undefined;
  /** A track cell (split waffles): an empty place, drawn grey. */
  readonly track?: boolean | undefined;
}

/** What the layouts of a unit chart return. */
export interface ChartUnitPlacement {
  readonly cells: readonly ChartUnitCell[];
  /** Text under clusters or tiles, by category. */
  readonly titles?: readonly { x: number; y: number; category: number; text: string }[] | undefined;
}

export interface ChartUnitOptions {
  /** Marks per category (waffle: the grid; unit: `grouped` by default). */
  readonly layout?: string | undefined;
  readonly shape?: ChartMarkerShape | undefined;
  /** Mark radius in px (default auto). */
  readonly size?: number | undefined;
  /** Gap between marks in px (default auto). */
  readonly spacing?: number | undefined;
  /** Units of value per mark. Default 1. */
  readonly unitValue?: number | undefined;
  /** Cap on marks; counts scale down above it. Default 5000. */
  readonly maxUnits?: number | undefined;
  /** A fixed budget of cells, shared by the largest remainder. */
  readonly total?: number | undefined;
  /** Corner radius of square cells in px. Default 2. */
  readonly cellRadius?: number | undefined;
  /** Grid: cells per row. Default 10. */
  readonly columns?: number | undefined;
  /** Grid: the row where filling starts. Default `"bottom"`. */
  readonly fillFrom?: ChartFillFrom | undefined;
  /** One mini waffle per category. */
  readonly split?: boolean | undefined;
  /** Split: tiles per row (default auto). */
  readonly tileColumns?: number | undefined;
  /** Split: the value each tile represents in full (default the largest). */
  readonly splitMax?: number | undefined;
  /** Split: the empty cells' color. */
  readonly trackColor?: ChartColor | undefined;
  /** Names drawn with each cluster or column. */
  readonly clusterLabels?: boolean | undefined;
  /** Packed: keep the given order instead of the smallest group in the middle. */
  readonly disableSortByGroup?: boolean | undefined;
  /** Arc: concentric rows (default auto). */
  readonly arcRows?: number | undefined;
  /** Arc: the inner radius in % of the outer. */
  readonly innerSize?: number | undefined;
  /** Arc: where the sweep starts and ends in degrees. */
  readonly startAngle?: number | undefined;
  readonly endAngle?: number | undefined;
  /** A distinct shape per category (non-color cues). */
  readonly colorBlindMode?: boolean | undefined;
}

/** A layout box for the placements. */
export interface ChartUnitBox {
  readonly width: number;
  readonly height: number;
}

/** Marks per category: `value / unitValue`, or a `total` shared out by the largest remainder. */
export function chartUnitCounts(
  values: readonly number[],
  options: Pick<ChartUnitOptions, "unitValue" | "maxUnits" | "total">,
): number[] {
  const unit = Math.max(1e-9, options.unitValue ?? 1);
  const max = Math.max(1, options.maxUnits ?? 5000);
  const shares = options.total !== undefined && options.total > 0;
  const weights = values.map((value) => Math.max(0, value));
  const sum = weights.reduce((total, value) => total + value, 0);
  const raw = shares
    ? weights.map((value) => (sum > 0 ? (value / sum) * (options.total as number) : 0))
    : weights.map((value) => value / unit);
  const wanted = raw.reduce((total, value) => total + value, 0);
  const scale = !shares && wanted > max ? max / wanted : 1;
  const scaled = raw.map((value) => value * scale);
  const floors = scaled.map(Math.floor);
  const target = shares
    ? sum > 0
      ? Math.min(max, Math.round(options.total as number))
      : 0
    : Math.min(max, Math.round(scaled.reduce((total, value) => total + value, 0)));
  // Largest remainder: the cells left over go to the categories rounded down the most.
  let rest = target - floors.reduce((total, value) => total + value, 0);
  const order = scaled
    .map((value, i) => ({ i, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  for (const { i } of order) {
    if (rest <= 0) break;
    floors[i] = (floors[i] as number) + 1;
    rest--;
  }
  return floors;
}

/** A shape's outline for the highlight (one path over a category's marks). */
function outline(cell: ChartUnitCell): string {
  const { x, y, r, side } = cell;
  if (side !== undefined) {
    const a = fmt(x - side / 2);
    const b = fmt(y - side / 2);
    return `M${a},${b}h${fmt(side)}v${fmt(side)}h${fmt(-side)}Z`;
  }
  return `M${fmt(x - r)},${fmt(y)}a${fmt(r)},${fmt(r)} 0 1,0 ${fmt(2 * r)},0a${fmt(r)},${fmt(r)} 0 1,0 ${fmt(-2 * r)},0Z`;
}

/** The mark drawn for a cell. */
function drawCell(
  cell: ChartUnitCell,
  shape: ChartMarkerShape | undefined,
  radius: string,
  trackColor: ChartColor | undefined,
): ChartNode {
  const attrs: Record<string, string> = cell.track
    ? {
        "data-ok-chart-unit-track": "",
        ...(trackColor ? { "data-ok-color": trackColor } : {}),
      }
    : { "data-ok-chart-unit-cell": "" };
  if (cell.side !== undefined && shape === "square")
    return node("rect", {
      x: fmt(cell.x - cell.side / 2),
      y: fmt(cell.y - cell.side / 2),
      width: fmt(cell.side),
      height: fmt(cell.side),
      rx: radius,
      ...attrs,
    });
  return chartMarkerNode(shape, cell.x, cell.y, cell.r, attrs);
}

/** A lattice filled row by row from `fillFrom`, cells in category order. */
export function placeUnitGrid(
  counts: readonly number[],
  box: ChartUnitBox,
  options: ChartUnitOptions,
): ChartUnitPlacement {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const columns = Math.max(1, Math.round(options.columns ?? 10));
  const rows = Math.max(1, Math.ceil(total / columns));
  const pitch = Math.min(box.width / columns, box.height / rows, 48);
  const gap = Math.min(options.spacing ?? Math.max(2, pitch * 0.12), pitch * 0.6);
  const side = Math.max(1, options.size !== undefined ? options.size * 2 : pitch - gap);
  const left = (box.width - pitch * columns) / 2;
  const top = (box.height - pitch * rows) / 2;
  const fromBottom = (options.fillFrom ?? "bottom") === "bottom";
  const cells: ChartUnitCell[] = [];
  let at = 0;
  counts.forEach((count, category) => {
    for (let i = 0; i < count; i++, at++) {
      const col = at % columns;
      const row = Math.floor(at / columns);
      const y = fromBottom ? rows - 1 - row : row;
      cells.push({
        x: r2(left + (col + 0.5) * pitch),
        y: r2(top + (y + 0.5) * pitch),
        r: side / 2,
        side,
        category,
      });
    }
  });
  return { cells };
}

/** One mini waffle per category: `total` cells, `value / max` of them filled. */
function placeUnitSplit(
  values: readonly number[],
  names: readonly string[],
  box: ChartUnitBox,
  options: ChartUnitOptions,
): ChartUnitPlacement {
  const n = values.length;
  const budget = Math.max(1, Math.round(options.total ?? 100));
  const max = options.splitMax ?? Math.max(1, ...values.map((value) => Math.max(0, value)));
  const across = Math.max(
    1,
    Math.round(options.tileColumns ?? Math.min(n, Math.ceil(Math.sqrt(n)))),
  );
  const down = Math.max(1, Math.ceil(n / across));
  const cellsAcross = Math.max(1, Math.round(options.columns ?? 10));
  const rows = Math.max(1, Math.ceil(budget / cellsAcross));
  const tileWidth = box.width / across;
  const tileHeight = box.height / down;
  const titleRoom = FONT + 10;
  const pitch = Math.min((tileWidth - 12) / cellsAcross, (tileHeight - titleRoom - 8) / rows, 24);
  const gap = Math.min(options.spacing ?? Math.max(1, pitch * 0.12), pitch * 0.6);
  const side = Math.max(1, pitch - gap);
  const cells: ChartUnitCell[] = [];
  const titles: { x: number; y: number; category: number; text: string }[] = [];
  const fromBottom = (options.fillFrom ?? "bottom") === "bottom";
  values.forEach((value, category) => {
    const filled = Math.min(budget, Math.round((Math.max(0, value) / max) * budget));
    const col = category % across;
    const row = Math.floor(category / across);
    const left = col * tileWidth + (tileWidth - pitch * cellsAcross) / 2;
    const top = row * tileHeight + 4;
    for (let i = 0; i < budget; i++) {
      const c = i % cellsAcross;
      const rowAt = Math.floor(i / cellsAcross);
      const y = fromBottom ? rows - 1 - rowAt : rowAt;
      cells.push({
        x: r2(left + (c + 0.5) * pitch),
        y: r2(top + (y + 0.5) * pitch),
        r: side / 2,
        side,
        category,
        ...(i >= filled ? { track: true } : {}),
      });
    }
    titles.push({
      x: r2(col * tileWidth + tileWidth / 2),
      y: r2(top + pitch * rows + FONT + 2),
      category,
      text: names[category] as string,
    });
  });
  return { cells, titles };
}

/** A placement for the whole chart box (the unit layouts extend this). */
export type ChartUnitPlacer = (
  counts: readonly number[],
  values: readonly number[],
  names: readonly string[],
  box: ChartUnitBox,
  options: ChartUnitOptions,
) => ChartUnitPlacement;

/** Waffle charts: a lattice, or one tile per category. */
const placeWaffle: ChartUnitPlacer = (counts, values, names, box, options) =>
  options.split ? placeUnitSplit(values, names, box, options) : placeUnitGrid(counts, box, options);

/** The category under a pointer (marks within their own size), or `null`. */
export function chartUnitAt(
  cells: readonly ChartUnitCell[] | undefined,
  x: number,
  y: number,
): number | null {
  for (const cell of cells ?? []) {
    if (cell.track) continue;
    const reach = cell.side !== undefined ? cell.side / 2 + 1 : cell.r + 1;
    const hit =
      cell.side !== undefined
        ? Math.abs(cell.x - x) <= reach && Math.abs(cell.y - y) <= reach
        : Math.hypot(cell.x - x, cell.y - y) <= reach;
    if (hit) return cell.category;
  }
  return null;
}

const SIDE_PAD = 10;

/** Lays out a waffle or unit chart from a placer (no axes; the legend names the categories). */
export function layoutUnit(
  data: ChartData,
  options: ChartLayoutOptions,
  unit: ChartUnitOptions,
  format: ChartFormat,
  placer: ChartUnitPlacer = placeWaffle,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const hidden = new Set(options.hidden ?? []);
  const source = data.series[0];
  const points = source?.points ?? [];
  const visible = points.filter((point) => !hidden.has(point.x));
  const values = visible.map((point) => Math.max(0, point.y ?? 0));
  const names = visible.map((point) =>
    String(format.title(data.categories[point.x] ?? String(point.x + 1))),
  );
  const counts = chartUnitCounts(values, unit);
  const box = { width: width - SIDE_PAD * 2, height: height - SIDE_PAD * 2 };
  const placed = placer(counts, values, names, box, unit);
  const cue = (position: number): ChartMarkerShape | undefined =>
    unit.colorBlindMode
      ? (chartMarkerShapes[position % chartMarkerShapes.length] as ChartMarkerShape)
      : undefined;
  const radius = fmt(Math.max(0, unit.cellRadius ?? 2));
  const typeShape = data.type === "waffle" ? "square" : "circle";
  const groups: ChartNode[] = [];
  const titles: ChartNode[] = [];
  const marks: ChartMark[] = [];
  const slots: ChartLayout["slots"][number][] = [];
  const cells: ChartUnitCell[] = placed.cells.map((cell) => ({
    ...cell,
    x: r2(cell.x + SIDE_PAD),
    y: r2(cell.y + SIDE_PAD),
  }));
  visible.forEach((point, position) => {
    const color = point.color as ChartColor;
    const shape = cue(point.x) ?? unit.shape ?? typeShape;
    const own = cells.filter((cell) => cell.category === position);
    const drawn = own.filter((cell) => !cell.track);
    const sumX = drawn.reduce((sum, cell) => sum + cell.x, 0);
    const sumY = drawn.reduce((sum, cell) => sum + cell.y, 0);
    groups.push(
      node(
        "g",
        {
          "data-ok-chart-unit-group": "",
          "data-ok-color": color,
          "data-ok-index": String(point.x),
        },
        own.map((cell) => drawCell(cell, shape, radius, unit.trackColor)),
      ),
    );
    slots.push({ index: point.x, pos: position });
    marks.push({
      series: 0,
      type: data.type,
      index: point.x,
      x: point.x,
      value: point.y ?? 0,
      px: r2(drawn.length ? sumX / drawn.length : width / 2),
      py: r2(drawn.length ? sumY / drawn.length : height / 2),
      color,
      unit: { outline: drawn.map(outline).join("") },
      ...(cue(point.x) ? { shape: cue(point.x) } : {}),
    });
  });
  for (const title of placed.titles ?? [])
    titles.push(
      node(
        "text",
        {
          x: fmt(title.x + SIDE_PAD),
          y: fmt(title.y + SIDE_PAD),
          "text-anchor": "middle",
          "data-ok-chart-unit-title": "",
        },
        undefined,
        fitChartText(title.text, Math.max(chartTextWidth(title.text), 40)),
      ),
    );
  return {
    width,
    height,
    plot: { x: 0, y: 0, width, height },
    mode: "unit",
    horizontal: false,
    banded: false,
    band: 0,
    slots,
    marks,
    activeRadius: 0,
    units: cells,
    nodes: [
      node("g", { "data-ok-chart-crosshair": "" }, []),
      node("g", { "data-ok-chart-series-group": "" }, [
        node(
          "g",
          { "data-ok-chart-series": "", "data-ok-type": data.type, "data-ok-index": "0" },
          groups,
        ),
      ]),
      ...(titles.length ? [node("g", { "data-ok-chart-data-labels": "" }, titles)] : []),
      node("g", { "data-ok-chart-active": "" }, []),
    ],
  };
}
