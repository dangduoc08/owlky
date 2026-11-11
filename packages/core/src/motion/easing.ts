/*
 * Easing functions — spec: specs/components/motion.md (Layout), ADR-0062 (5.4). The engine hands
 * CSS easings to the Web Animations API; paths computed in script (layout animations with size
 * correction, the time a running animation has reached) need the same curves as functions of the
 * progress. `cubic-bezier()`, the CSS keywords and `linear()` are evaluated here; anything else
 * (`steps()`) is linear.
 */

/** A progress (0–1) to an eased progress (may leave 0–1 for overshooting curves). */
export type EasingFunction = (progress: number) => number;

const KEYWORDS: Record<string, readonly [number, number, number, number]> = {
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

const linearEasing: EasingFunction = (progress) => progress;

/** `cubic-bezier(x1, y1, x2, y2)` as a function (Newton's method, then bisection). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFunction {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const solve = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < 1e-6) return t;
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    let low = 0;
    let high = 1;
    t = x;
    while (high - low > 1e-6) {
      if (sampleX(t) < x) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return t;
  };
  return (progress) => (progress <= 0 ? 0 : progress >= 1 ? 1 : sampleY(solve(progress)));
}

/** `linear(…)`: points with optional percentages; points without one are spread evenly. */
function linearPoints(body: string): EasingFunction {
  const points: { value: number; at: number | undefined }[] = [];
  for (const part of body.split(",")) {
    const [value, ...positions] = part.trim().split(/\s+/);
    const number = Number(value);
    if (!Number.isFinite(number)) return linearEasing;
    if (positions.length === 0) points.push({ value: number, at: undefined });
    for (const position of positions) {
      const percent = /^(-?[\d.]+)%$/.exec(position);
      if (!percent) return linearEasing;
      points.push({ value: number, at: Number(percent[1]) / 100 });
    }
  }
  if (points.length < 2) return linearEasing;
  const first = points[0] as { value: number; at: number | undefined };
  const last = points.at(-1) as { value: number; at: number | undefined };
  first.at ??= 0;
  last.at ??= 1;
  // Positions never go back; missing ones are spread between their known neighbors.
  let known = 0;
  for (let i = 1; i < points.length; i++) {
    const point = points[i] as { value: number; at: number | undefined };
    if (point.at === undefined) continue;
    point.at = Math.max(point.at, points[known]?.at as number);
    const span = i - known;
    for (let j = known + 1; j < i; j++) {
      const from = points[known]?.at as number;
      (points[j] as { at: number | undefined }).at =
        from + ((point.at - from) * (j - known)) / span;
    }
    known = i;
  }
  return (progress) => {
    if (progress <= (first.at as number)) return first.value;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1] as { value: number; at: number };
      const b = points[i] as { value: number; at: number };
      // Reached only past `a.at`, so `b.at` is further on.
      if (progress <= b.at)
        return a.value + ((b.value - a.value) * (progress - a.at)) / (b.at - a.at);
    }
    return last.value;
  };
}

/**
 * A CSS easing (`linear`, `ease…`, `cubic-bezier()`, `linear()`) as a function of the progress.
 * Unknown easings (such as `steps()`) are linear.
 */
export function easingFunction(css: string): EasingFunction {
  const text = css.trim();
  const keyword = KEYWORDS[text];
  if (keyword) return cubicBezier(...keyword);
  const bezier = /^cubic-bezier\(([^)]*)\)$/.exec(text);
  if (bezier) {
    const values = (bezier[1] as string).split(",").map((part) => Number(part.trim()));
    if (values.length === 4 && values.every(Number.isFinite))
      return cubicBezier(...(values as [number, number, number, number]));
    return linearEasing;
  }
  const points = /^linear\((.*)\)$/.exec(text);
  if (points) return linearPoints(points[1] as string);
  return linearEasing;
}
