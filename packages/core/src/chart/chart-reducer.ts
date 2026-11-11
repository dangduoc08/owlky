/*
 * Data reduction for drawing (roadmap 4.18.66, ApexCharts `chart.dataReducer`): Largest Triangle
 * Three Buckets keeps the points that shape a line and drops the rest of the path. Only the drawing
 * is reduced: the data table, the tooltip and the keyboard keep every point.
 */

/** Which points to keep (`threshold`: reduce above this many; `target`: keep about this many). */
export interface ChartReducer {
  readonly target: number;
  readonly threshold: number;
}

type Pt = readonly [number, number];

/** The indexes of the points LTTB keeps (first and last included), in order. */
export function chartLttb(points: readonly Pt[], target: number): number[] {
  const count = points.length;
  const wanted = Math.max(3, Math.floor(target));
  if (wanted >= count) return points.map((_, index) => index);
  const kept = [0];
  const bucket = (count - 2) / (wanted - 2);
  let previous = 0;
  for (let i = 0; i < wanted - 2; i++) {
    // The average of the next bucket: the third corner of the triangles.
    const nextStart = Math.floor((i + 1) * bucket) + 1;
    const nextEnd = Math.min(Math.floor((i + 2) * bucket) + 1, count);
    let avgX = 0;
    let avgY = 0;
    for (let j = nextStart; j < nextEnd; j++) {
      avgX += (points[j] as Pt)[0];
      avgY += (points[j] as Pt)[1];
    }
    const span = Math.max(1, nextEnd - nextStart);
    avgX /= span;
    avgY /= span;
    const start = Math.floor(i * bucket) + 1;
    const end = Math.min(Math.floor((i + 1) * bucket) + 1, count - 1);
    const [ax, ay] = points[previous] as Pt;
    let best = start;
    let largest = -1;
    for (let j = start; j < end; j++) {
      const [x, y] = points[j] as Pt;
      const area = Math.abs((ax - avgX) * (y - ay) - (ax - x) * (avgY - ay));
      if (area > largest) {
        largest = area;
        best = j;
      }
    }
    kept.push(best);
    previous = best;
  }
  kept.push(count - 1);
  return kept;
}

/**
 * The positions to draw of points in x order, `null` where a point is a gap: every run between
 * gaps is reduced on its own, with a share of `target` by its length. Below the threshold, every
 * position.
 */
export function chartReduceRuns(
  points: readonly (Pt | null)[],
  reducer: ChartReducer,
): ReadonlySet<number> {
  const runs: number[][] = [];
  let run: number[] = [];
  let total = 0;
  points.forEach((point, index) => {
    if (point) {
      run.push(index);
      total++;
    } else if (run.length) {
      runs.push(run);
      run = [];
    }
  });
  if (run.length) runs.push(run);
  const kept = new Set<number>();
  if (total <= reducer.threshold) {
    for (const entry of runs) for (const index of entry) kept.add(index);
    return kept;
  }
  for (const entry of runs) {
    const share = Math.max(2, Math.round((reducer.target * entry.length) / total));
    const chosen = chartLttb(
      entry.map((index) => points[index] as Pt),
      share,
    );
    for (const position of chosen) kept.add(entry[position] as number);
  }
  return kept;
}
