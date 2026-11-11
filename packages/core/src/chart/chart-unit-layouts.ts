import { FONT, r2 } from "./chart-layout.js";
import { polarPoint } from "./chart-polar.js";
import type { ChartUnitCell, ChartUnitOptions, ChartUnitPlacement } from "./chart-unit.js";
import { placeUnitGrid } from "./chart-unit.js";

/*
 * Unit chart placements (roadmap 4.18.21, ApexCharts `unit`): marks in blobs per category, one
 * blob, stacked columns or the concentric rows of an arc (parliament seats). Each is computed from
 * the box and the counts alone, so server, React and HTML agree.
 */

export const chartUnitLayouts = ["grouped", "packed", "columns", "grid", "arc"] as const;
export type ChartUnitLayout = (typeof chartUnitLayouts)[number];

export const isChartUnitLayout = (value: unknown): value is ChartUnitLayout =>
  chartUnitLayouts.includes(value as ChartUnitLayout);

/** Points of a hexagonal lattice of unit pitch, nearest to the center first. */
function hexPoints(count: number): { x: number; y: number }[] {
  const points: { x: number; y: number; d: number }[] = [];
  const reach = Math.ceil(Math.sqrt(count)) + 2;
  const stepY = Math.sqrt(3) / 2;
  for (let row = -reach; row <= reach; row++)
    for (let col = -reach; col <= reach; col++) {
      const x = col + (row % 2 === 0 ? 0 : 0.5);
      const y = row * stepY;
      points.push({ x, y, d: x * x + y * y });
    }
  return points.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x).slice(0, count);
}

const extent = (points: readonly { x: number; y: number }[]) => ({
  x: Math.max(0, ...points.map((p) => Math.abs(p.x))),
  y: Math.max(0, ...points.map((p) => Math.abs(p.y))),
});

const blobRadius = (given: number | undefined, pitch: number) => Math.max(1, given ?? pitch * 0.42);

const RESERVE_LABEL = FONT + 10;

/** One blob per category, in a row (`grouped`). */
export function placeGrouped(
  counts: readonly number[],
  names: readonly string[],
  box: { width: number; height: number },
  options: ChartUnitOptions,
): ChartUnitPlacement {
  const columns = Math.max(1, counts.length);
  const widthEach = box.width / columns;
  const usable = options.clusterLabels ? box.height - RESERVE_LABEL : box.height;
  const blobs = counts.map(hexPoints);
  const worst = blobs.reduce(
    (max, points) => {
      const e = extent(points);
      return { x: Math.max(max.x, e.x), y: Math.max(max.y, e.y) };
    },
    { x: 0, y: 0 },
  );
  const pitch = Math.min(
    (widthEach * 0.9) / (2 * worst.x + 1),
    usable / (2 * worst.y + 1),
    options.spacing !== undefined ? 48 + options.spacing : 48,
  );
  const step = pitch + (options.spacing ?? 0);
  const r = blobRadius(options.size, pitch);
  const cells: ChartUnitCell[] = [];
  blobs.forEach((points, category) => {
    const cx = (category + 0.5) * widthEach;
    const cy = usable / 2;
    for (const point of points)
      cells.push({
        x: r2(cx + point.x * step),
        y: r2(cy + point.y * step),
        r,
        category,
      });
  });
  return {
    cells,
    ...(options.clusterLabels
      ? {
          titles: counts.map((_, category) => ({
            x: r2((category + 0.5) * widthEach),
            y: r2(box.height - 6),
            category,
            text: names[category] as string,
          })),
        }
      : {}),
  };
}

/** One blob, smallest groups in the middle unless `disableSortByGroup` (`packed`). */
export function placePacked(
  counts: readonly number[],
  box: { width: number; height: number },
  options: ChartUnitOptions,
): ChartUnitPlacement {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const points = hexPoints(total);
  const e = extent(points);
  const pitch = Math.min(box.width / (2 * e.x + 1), box.height / (2 * e.y + 1), 48);
  const r = blobRadius(options.size, pitch);
  const order = counts
    .map((count, category) => ({ count, category }))
    .sort((a, b) => (options.disableSortByGroup ? 0 : a.count - b.count));
  const cells: ChartUnitCell[] = [];
  let at = 0;
  for (const { count, category } of order)
    for (let i = 0; i < count; i++, at++) {
      const p = points[at] as { x: number; y: number };
      cells.push({
        x: r2(box.width / 2 + p.x * pitch),
        y: r2(box.height / 2 + p.y * pitch),
        r,
        category,
      });
    }
  return { cells };
}

/** Stacked dot columns whose height encodes the count (`columns`). */
export function placeColumns(
  counts: readonly number[],
  names: readonly string[],
  box: { width: number; height: number },
  options: ChartUnitOptions,
): ChartUnitPlacement {
  const n = Math.max(1, counts.length);
  const widthEach = box.width / n;
  const usable = options.clusterLabels ? box.height - RESERVE_LABEL : box.height;
  const largest = Math.max(1, ...counts);
  // The size of a dot: as big as the largest column allows with dots across and rows filling both.
  let pitch = 6;
  for (let across = 1; across <= 30; across++) {
    const rows = Math.ceil(largest / across);
    const size = Math.min((widthEach * 0.84) / across, usable / rows);
    if (size > pitch) pitch = size;
  }
  pitch = Math.min(pitch, 40);
  const across = Math.max(1, Math.floor((widthEach * 0.84) / pitch));
  const r = blobRadius(options.size, pitch);
  const cells: ChartUnitCell[] = [];
  counts.forEach((count, category) => {
    const left = category * widthEach + widthEach / 2 - ((across - 1) * pitch) / 2;
    for (let i = 0; i < count; i++) {
      const col = i % across;
      const row = Math.floor(i / across);
      cells.push({
        x: r2(left + col * pitch),
        y: r2(usable - (row + 0.5) * pitch),
        r,
        category,
      });
    }
  });
  return {
    cells,
    ...(options.clusterLabels
      ? {
          titles: counts.map((_, category) => ({
            x: r2((category + 0.5) * widthEach),
            y: r2(box.height - 6),
            category,
            text: names[category] as string,
          })),
        }
      : {}),
  };
}

/** Seats per row of an arc: as many as fit around each ring at the pitch of the row thickness. */
function arcCapacity(radii: readonly number[], sweep: number, pitch: number): number[] {
  return radii.map((r) => Math.max(1, Math.floor((((sweep * Math.PI) / 180) * r) / pitch)));
}

/** Concentric rows filled by category along the sweep (`arc`, parliament seats). */
export function placeArc(
  counts: readonly number[],
  box: { width: number; height: number },
  options: ChartUnitOptions,
): ChartUnitPlacement {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const start = options.startAngle ?? -90;
  const end = options.endAngle ?? 90;
  const sweep = Math.max(10, Math.min(end - start, 360));
  const center: [number, number] =
    sweep >= 360 ? [box.width / 2, box.height / 2] : [box.width / 2, box.height - 4];
  const outer =
    sweep >= 360 ? Math.min(box.width, box.height) / 2 : Math.min(box.width / 2, box.height - 4);
  const inner = (Math.max(0, Math.min(options.innerSize ?? 40, 90)) / 100) * outer;
  const fixed =
    options.arcRows !== undefined ? Math.max(1, Math.round(options.arcRows)) : undefined;
  let rows = fixed ?? 1;
  let pitch = outer - inner;
  let radii: number[] = [];
  let capacity: number[] = [];
  const fit = (count: number) => {
    pitch = (outer - inner) / count;
    radii = Array.from({ length: count }, (_, i) => inner + (i + 0.5) * pitch);
    capacity = arcCapacity(radii, sweep, pitch);
  };
  fit(rows);
  // Without a given number of rows, the fewest rows that seat everyone.
  if (fixed === undefined) {
    while (rows < 40 && capacity.reduce((sum, c) => sum + c, 0) < total) fit(++rows);
  }
  const capacityTotal = Math.max(
    1,
    capacity.reduce((sum, c) => sum + c, 0),
  );
  // Seats per row in proportion to its capacity (the largest remainder takes the rest).
  const seats = capacity.map((c) => Math.floor((c * total) / capacityTotal));
  let rest = total - seats.reduce((sum, s) => sum + s, 0);
  const byRemainder = capacity
    .map((c, row) => ({ row, remainder: (c * total) / capacityTotal - (seats[row] as number) }))
    .sort((a, b) => b.remainder - a.remainder || b.row - a.row);
  for (const { row } of byRemainder) {
    if (rest <= 0) break;
    seats[row] = (seats[row] as number) + 1;
    rest--;
  }
  // Every seat with its angle; seats are filled by category from `start` to `end`, row by row within an angle.
  const all: { angle: number; radius: number }[] = [];
  seats.forEach((count, row) => {
    const radius = radii[row] as number;
    for (let i = 0; i < count; i++) {
      const angle = start + (sweep * (i + 0.5)) / Math.max(1, count);
      all.push({ angle, radius });
    }
  });
  all.sort((a, b) => a.angle - b.angle || a.radius - b.radius);
  const r = blobRadius(options.size, pitch);
  const cells: ChartUnitCell[] = [];
  let at = 0;
  counts.forEach((count, category) => {
    for (let i = 0; i < count; i++, at++) {
      const seat = all[at] as { angle: number; radius: number };
      const [x, y] = polarPoint(center[0], center[1], seat.radius, seat.angle);
      cells.push({ x: r2(x), y: r2(y), r, category });
    }
  });
  return { cells };
}

/** The placer of a unit layout (the default is `grouped`). */
export function chartUnitPlacer(
  layout: unknown,
): (
  counts: readonly number[],
  values: readonly number[],
  names: readonly string[],
  box: { width: number; height: number },
  options: ChartUnitOptions,
) => ChartUnitPlacement {
  const chosen = isChartUnitLayout(layout) ? layout : "grouped";
  if (chosen === "packed") return (counts, _values, _names, box, o) => placePacked(counts, box, o);
  if (chosen === "columns")
    return (counts, _values, names, box, o) => placeColumns(counts, names, box, o);
  if (chosen === "grid") return (counts, _values, _names, box, o) => placeUnitGrid(counts, box, o);
  if (chosen === "arc") return (counts, _values, _names, box, o) => placeArc(counts, box, o);
  return (counts, _values, names, box, o) => placeGrouped(counts, names, box, o);
}
