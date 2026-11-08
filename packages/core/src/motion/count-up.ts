/*
 * CountUp (the reference's "Count up"): counts from `start` to `end` with an ease-out, frame by
 * frame. Shared by React and the HTML runtime; the owner writes the text it reports.
 */

/** Fast at first, slowing down to the end. */
export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/** The text at `progress` (0–1, clamped) of the count. */
export function countUpText(
  start: number,
  end: number,
  progress: number,
  decimals: number,
): string {
  const t = easeOutCubic(Math.min(Math.max(progress, 0), 1));
  return (start + (end - start) * t).toFixed(decimals);
}

/** The user asked the system for less motion. */
export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface CountUpOptions {
  start: number;
  end: number;
  /** Milliseconds. */
  duration: number;
  decimals: number;
  /** Called with the text of each frame (the last one is the end value). */
  onUpdate(text: string): void;
}

export interface CountUp {
  /** Counts from `start` (again); with reduced motion or no duration, shows the end at once. */
  run(): void;
  destroy(): void;
}

export function createCountUp(options: CountUpOptions): CountUp {
  let frame = 0;
  const stop = () => cancelAnimationFrame(frame);
  return {
    run() {
      stop();
      const { start, end, duration, decimals, onUpdate } = options;
      if (duration <= 0 || prefersReducedMotion()) {
        onUpdate(countUpText(start, end, 1, decimals));
        return;
      }
      let first: number | undefined;
      const step = (now: number) => {
        first ??= now;
        const progress = (now - first) / duration;
        onUpdate(countUpText(start, end, progress, decimals));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      onUpdate(countUpText(start, end, 0, decimals));
      frame = requestAnimationFrame(step);
    },
    destroy: stop,
  };
}
