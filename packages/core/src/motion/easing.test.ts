import { describe, expect, it } from "vitest";
import { springCurve, springEasing } from "./animate.js";
import { cubicBezier, easingFunction } from "./easing.js";

describe("easing functions", () => {
  it("evaluates cubic-bezier curves and the CSS keywords", () => {
    const ease = cubicBezier(0.42, 0, 0.58, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeCloseTo(0.5, 4);
    expect(ease(0.25)).toBeLessThan(0.25);
    expect(easingFunction("ease-in-out")(0.25)).toBeCloseTo(ease(0.25), 6);
    expect(easingFunction("ease")(0.5)).toBeCloseTo(0.8024, 3);
    expect(easingFunction("ease-in")(0.5)).toBeCloseTo(0.3153, 3);
    expect(easingFunction("ease-out")(0.5)).toBeCloseTo(0.6847, 3);
    expect(easingFunction("cubic-bezier(0, 0, 1, 1)")(0.3)).toBeCloseTo(0.3, 4);
    // Overshooting control points leave 0–1.
    expect(easingFunction("cubic-bezier(0.34, 1.56, 0.64, 1)")(0.6)).toBeGreaterThan(1);
    // A flat start (slope 0) falls back to bisection.
    expect(cubicBezier(0, 0, 0, 1)(0.0001)).toBeGreaterThan(0);
  });

  it("evaluates linear() points, spread evenly or placed by percentages", () => {
    const even = easingFunction("linear(0, 0.5, 1)");
    expect(even(0.25)).toBeCloseTo(0.25, 6);
    expect(even(0.75)).toBeCloseTo(0.75, 6);
    const placed = easingFunction("linear(0, 0.9 20%, 1)");
    expect(placed(0.1)).toBeCloseTo(0.45, 6);
    expect(placed(0.6)).toBeCloseTo(0.95, 6);
    const held = easingFunction("linear(0, 0.5 25% 75%, 1)");
    expect(held(0.5)).toBe(0.5);
    // A position before the previous one is moved up to it.
    expect(easingFunction("linear(0, 0.5 60%, 0.8 40%, 1)")(0.7)).toBeCloseTo(0.85, 6);
    expect(easingFunction("linear(0, 0.2, 0.3 50%, 1)")(0.25)).toBeCloseTo(0.2, 6);
    expect(even(-1)).toBe(0);
    expect(even(2)).toBe(1);
    // The engine's springs as `linear()` match the spring curve.
    const options = { stiffness: 200, damping: 12 };
    const spring = easingFunction(springEasing(options, { linear: true }).easing);
    const curve = springCurve(options);
    expect(spring(0.3)).toBeCloseTo(curve.at(0.3), 1);
    expect(curve.duration).toBe(springEasing(options).duration);
    expect(curve.at(0)).toBe(0);
    expect(curve.at(1)).toBe(1);
  });

  it("falls back to linear for anything else", () => {
    for (const css of [
      "steps(4)",
      "linear",
      "nonsense",
      "cubic-bezier(1, 2)",
      "linear(a, b)",
      "linear(0)",
      "linear(0, 1 x)",
    ])
      expect(easingFunction(css)(0.3)).toBeCloseTo(0.3, 6);
  });
});
