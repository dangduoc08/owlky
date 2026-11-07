/*
 * Anchored positioning (Popover, Tooltip, Menu) — pure math, no DOM. A floating box is placed on
 * one side of an anchor rectangle, flipped to the opposite side when it doesn't fit, then shifted
 * along the cross axis to stay `margin` px inside the viewport. The arrow offset points at the
 * anchor's center, clamped so the arrow stays on the box's straight edge.
 */

export const placementSides = ["top", "bottom", "left", "right"] as const;
export const placements = [
  "top-start",
  "top",
  "top-end",
  "bottom-start",
  "bottom",
  "bottom-end",
  "left-start",
  "left",
  "left-end",
  "right-start",
  "right",
  "right-end",
] as const;
export type PlacementSide = (typeof placementSides)[number];
export type Placement = (typeof placements)[number];
export type PlacementAlign = "start" | "center" | "end";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionInput {
  anchor: Rect;
  floating: { width: number; height: number };
  viewport: { width: number; height: number };
  placement: Placement;
  /** Gap between the anchor and the floating box. Default 8. */
  offset?: number | undefined;
  /** Minimum distance to the viewport edges. Default 16 (MUI `marginThreshold`). */
  margin?: number | undefined;
  /** Arrow size along the edge; keeps the arrow off the rounded corners. Default 0 (no arrow). */
  arrow?: number | undefined;
  /** Corner radius the arrow must stay clear of. Default 12. */
  radius?: number | undefined;
}

export interface Position {
  x: number;
  y: number;
  /** The placement used: the requested one, or its opposite side after a flip. */
  placement: Placement;
  /** Arrow position along the edge, from the box's start (px); `undefined` without an arrow. */
  arrow: number | undefined;
}

const OPPOSITE: Record<PlacementSide, PlacementSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/** `"bottom-start"` → `["bottom", "start"]`. */
export function splitPlacement(placement: Placement): [PlacementSide, PlacementAlign] {
  const [side, align] = placement.split("-") as [PlacementSide, "start" | "end" | undefined];
  return [side, align ?? "center"];
}

const join = (side: PlacementSide, align: PlacementAlign): Placement =>
  (align === "center" ? side : `${side}-${align}`) as Placement;

/** A valid placement, or `fallback` (untrusted input never reaches the DOM). */
export const parsePlacement = (value: unknown, fallback: Placement): Placement =>
  placements.includes(value as Placement) ? (value as Placement) : fallback;

const clamp = (value: number, min: number, max: number) =>
  max < min ? min : Math.min(max, Math.max(min, value));

const round = (value: number) => Math.round(value * 100) / 100;

/** Main-axis coordinate of the box on `side` (before any viewport shift). */
function mainAxis(side: PlacementSide, a: Rect, f: PositionInput["floating"], gap: number) {
  switch (side) {
    case "top":
      return a.y - gap - f.height;
    case "bottom":
      return a.y + a.height + gap;
    case "left":
      return a.x - gap - f.width;
    case "right":
      return a.x + a.width + gap;
  }
}

/** Does the box fit on `side` between the anchor and the viewport edge? */
function fits(side: PlacementSide, input: PositionInput & { offset: number; margin: number }) {
  const { anchor: a, floating: f, viewport: v, offset, margin } = input;
  switch (side) {
    case "top":
      return a.y - offset - f.height >= margin;
    case "bottom":
      return a.y + a.height + offset + f.height <= v.height - margin;
    case "left":
      return a.x - offset - f.width >= margin;
    case "right":
      return a.x + a.width + offset + f.width <= v.width - margin;
  }
}

/** Where to put the floating box: flip if needed, then keep it inside the viewport. */
export function computePosition(input: PositionInput): Position {
  const offset = input.offset ?? 8;
  const margin = input.margin ?? 16;
  const full = { ...input, offset, margin };
  const { anchor: a, floating: f, viewport: v } = input;
  let [side, align] = splitPlacement(input.placement);
  if (!fits(side, full) && fits(OPPOSITE[side], full)) side = OPPOSITE[side];
  const vertical = side === "top" || side === "bottom";

  // Cross axis: aligned to the anchor's start, center or end.
  const start = vertical ? a.x : a.y;
  const length = vertical ? a.width : a.height;
  const size = vertical ? f.width : f.height;
  const room = vertical ? v.width : v.height;
  const aligned =
    align === "start"
      ? start
      : align === "end"
        ? start + length - size
        : start + (length - size) / 2;
  const center = start + length / 2;
  const hasArrow = input.arrow !== undefined && input.arrow > 0;
  // The arrow (a triangle, `arrow` px wide along the edge) keeps the corner radius plus half its
  // width from the ends.
  const edge = hasArrow ? (input.radius ?? 12) + (input.arrow as number) / 2 : 0;
  // With an arrow, the box moves just enough for the arrow to reach the anchor's center (a short
  // anchor aligned to the start would otherwise leave the arrow off-center); then the viewport wins.
  const reachable = hasArrow ? clamp(aligned, center - (size - edge), center - edge) : aligned;
  const cross = clamp(reachable, margin, room - margin - size);
  // Main axis: kept inside the viewport too when neither side fits (it may then cover the anchor).
  const main = clamp(
    mainAxis(side, a, f, offset),
    margin,
    (vertical ? v.height - f.height : v.width - f.width) - margin,
  );

  const arrow = hasArrow ? round(clamp(center - cross, edge, size - edge)) : undefined;
  return {
    x: round(vertical ? cross : main),
    y: round(vertical ? main : cross),
    placement: join(side, align),
    arrow,
  };
}
