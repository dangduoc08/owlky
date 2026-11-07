import { describe, expect, it } from "vitest";
import {
  CIRCULAR_PROGRESS_THICKNESS,
  circularProgressGeometry,
  circularProgressStyle,
  linearProgressStyle,
  progressAria,
  progressFraction,
  progressRange,
  progressSize,
  progressValue,
} from "./progress.js";

describe("progress range and value", () => {
  it("defaults to 0–100", () => {
    expect(progressRange()).toEqual({ min: 0, max: 100 });
    expect(progressRange(10, 20)).toEqual({ min: 10, max: 20 });
  });

  it("falls back on invalid or inverted ranges", () => {
    expect(progressRange(Number.NaN, "50")).toEqual({ min: 0, max: 100 });
    expect(progressRange(50, 50)).toEqual({ min: 50, max: 150 });
    expect(progressRange(50, 10)).toEqual({ min: 50, max: 150 });
    expect(progressRange(-10, Number.POSITIVE_INFINITY)).toEqual({ min: -10, max: 90 });
  });

  it("clamps the value; missing or invalid → min", () => {
    expect(progressValue(25)).toBe(25);
    expect(progressValue(-5)).toBe(0);
    expect(progressValue(500)).toBe(100);
    expect(progressValue(undefined, 10, 20)).toBe(10);
    expect(progressValue("50")).toBe(0);
    expect(progressValue(Number.NaN)).toBe(0);
  });

  it("fraction is 0–1 through the range", () => {
    expect(progressFraction(25)).toBe(0.25);
    expect(progressFraction(15, 10, 20)).toBe(0.5);
    expect(progressFraction(1000)).toBe(1);
    expect(progressFraction(undefined)).toBe(0);
  });

  it("ARIA values are the clamped value and the range", () => {
    expect(progressAria(25)).toEqual({
      "aria-valuenow": 25,
      "aria-valuemin": 0,
      "aria-valuemax": 100,
    });
    expect(progressAria(300, 0, 200)).toEqual({
      "aria-valuenow": 200,
      "aria-valuemin": 0,
      "aria-valuemax": 200,
    });
  });
});

describe("circular progress", () => {
  it("geometry keeps the stroke inside the 44-unit box", () => {
    expect(circularProgressGeometry()).toEqual({ r: 20.2, strokeWidth: 3.6 });
    expect(circularProgressGeometry(8)).toEqual({ r: 18, strokeWidth: 8 });
    expect(circularProgressGeometry(100)).toEqual({ r: 11, strokeWidth: 22 });
    expect(circularProgressGeometry(0)).toEqual({ r: 20.2, strokeWidth: 3.6 });
    expect(circularProgressGeometry("5")).toEqual({ r: 20.2, strokeWidth: 3.6 });
  });

  it("size: numbers are px, lengths are kept", () => {
    expect(progressSize(48)).toBe("48px");
    expect(progressSize("3rem")).toBe("3rem");
    expect(progressSize(undefined)).toBeUndefined();
  });

  it("style: only what differs from the stylesheet, plus the determinate arc", () => {
    expect(circularProgressStyle({})).toEqual({});
    expect(circularProgressStyle({ thickness: CIRCULAR_PROGRESS_THICKNESS })).toEqual({});
    expect(circularProgressStyle({ size: "48px", thickness: 5 })).toEqual({
      "--_ok-progress-size": "48px",
      "--_ok-progress-thickness": "5",
    });
    const circumference = 2 * Math.PI * 20.2;
    expect(circularProgressStyle({ fraction: 0.25 })).toEqual({
      "--_ok-progress-dasharray": `${Math.round(circumference * 1000) / 1000}px`,
      "--_ok-progress-dashoffset": `${Math.round(0.75 * circumference * 1000) / 1000}px`,
    });
    expect(circularProgressStyle({ fraction: 1 })["--_ok-progress-dashoffset"]).toBe("0px");
  });
});

describe("linear progress", () => {
  it("style carries the bar and buffer fractions", () => {
    expect(linearProgressStyle({})).toEqual({});
    expect(linearProgressStyle({ fraction: 0.25, buffer: 1 / 3 })).toEqual({
      "--_ok-progress-value": "0.25",
      "--_ok-progress-buffer": "0.333",
    });
  });
});
