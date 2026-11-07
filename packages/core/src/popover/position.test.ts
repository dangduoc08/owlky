import { describe, expect, it } from "vitest";
import { computePosition, parsePlacement, placements, splitPlacement } from "./position.js";

const viewport = { width: 1000, height: 800 };
const anchor = { x: 400, y: 300, width: 100, height: 40 };
const floating = { width: 200, height: 100 };
const at = (placement: (typeof placements)[number], extra = {}) =>
  computePosition({ anchor, floating, viewport, placement, ...extra });

describe("computePosition", () => {
  it.each([
    ["bottom", 350, 348],
    ["bottom-start", 400, 348],
    ["bottom-end", 300, 348],
    ["top", 350, 192],
    ["top-start", 400, 192],
    ["top-end", 300, 192],
  ] as const)("%s", (placement, x, y) => {
    expect(at(placement)).toEqual({ x, y, placement, arrow: undefined });
  });

  it.each([
    ["right", 508, 270],
    ["right-start", 508, 300],
    ["right-end", 508, 240],
    ["left", 192, 270],
    ["left-start", 192, 300],
    ["left-end", 192, 240],
  ] as const)("%s", (placement, x, y) => {
    expect(at(placement)).toMatchObject({ x, y, placement });
  });

  it("flips to the other side when there is no room, and only if that side fits", () => {
    const low = { ...anchor, y: 700 };
    expect(computePosition({ anchor: low, floating, viewport, placement: "bottom" })).toMatchObject(
      {
        placement: "top",
        y: 592,
      },
    );
    const high = { ...anchor, y: 10 };
    expect(
      computePosition({ anchor: high, floating, viewport, placement: "top-start" }),
    ).toMatchObject({ placement: "bottom-start", y: 58 });
    const right = { ...anchor, x: 900 };
    expect(
      computePosition({ anchor: right, floating, viewport, placement: "right" }),
    ).toMatchObject({
      placement: "left",
    });
    // Neither side fits: keep the requested side, clamped inside the viewport.
    const tall = { width: 200, height: 780 };
    expect(
      computePosition({ anchor, floating: tall, viewport, placement: "bottom" }),
    ).toMatchObject({ placement: "bottom", y: 16 });
  });

  it("shifts along the edge to stay 16px (margin) inside the viewport", () => {
    const edge = { ...anchor, x: 0, width: 40 };
    expect(computePosition({ anchor: edge, floating, viewport, placement: "bottom" }).x).toBe(16);
    expect(
      computePosition({
        anchor: { ...anchor, x: 980 },
        floating,
        viewport,
        placement: "top-start",
        margin: 8,
      }).x,
    ).toBe(792);
  });

  it("offset, and an arrow that points at the anchor center but clears the corners", () => {
    expect(at("bottom", { offset: 12 }).y).toBe(352);
    expect(at("bottom", { arrow: 14 }).arrow).toBe(100);
    expect(at("bottom-start", { arrow: 14 }).arrow).toBe(50);
    const edge = computePosition({
      anchor: { x: 0, y: 300, width: 20, height: 40 },
      floating,
      viewport,
      placement: "bottom-start",
      arrow: 14,
      radius: 10,
    });
    // The anchor's center is too close to the viewport edge: the arrow stops clear of the corner.
    expect(edge.arrow).toBe(17);
    // A short anchor aligned to the start: the box moves so the arrow reaches its center.
    const short = computePosition({
      anchor: { x: 400, y: 300, width: 100, height: 20 },
      floating,
      viewport,
      placement: "right-start",
      arrow: 20,
    });
    expect(short.y).toBe(288);
    expect(short.arrow).toBe(22);
    expect(at("right", { arrow: 14 }).arrow).toBe(50);
    expect(at("bottom", { arrow: 0 }).arrow).toBeUndefined();
  });

  it("placements parse and split; unknown values fall back", () => {
    expect(placements).toHaveLength(12);
    expect(splitPlacement("left-end")).toEqual(["left", "end"]);
    expect(splitPlacement("top")).toEqual(["top", "center"]);
    expect(parsePlacement("right-start", "bottom")).toBe("right-start");
    expect(parsePlacement('"><img>', "bottom")).toBe("bottom");
    expect(parsePlacement(undefined, "top")).toBe("top");
  });
});
