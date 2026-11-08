import type { ChartZoom, ChartZoomReason } from "./chart-zoom.js";

/*
 * Linked charts (ADR-0031, phase 4): synchronized groups (`group`: a shared active category and
 * zoom) and brush charts (`brushTarget`: a small chart whose selection is another chart's zoom).
 * Module-scoped registry (ADR-0007: no global slot), so charts link within one copy of the
 * library: React with React, the HTML runtime with the HTML runtime.
 */

export interface ChartLinkMember {
  /** The chart's element id (brush targets are found by it). */
  readonly id?: string | undefined;
  /** Synchronized group name. */
  readonly group?: string | undefined;
  /** The id of the chart this brush chart zooms. */
  readonly brushTarget?: string | undefined;
  /** The chart's current zoom (brush charts read their target's). */
  zoom(): ChartZoom | null;
  /** Another chart of the group showed a category (`null`: none). */
  showIndex(index: number | null): void;
  /** Another chart (its group, or a brush) zoomed this one. */
  applyZoom(range: ChartZoom | null, reason: ChartZoomReason): void;
  /** Brush charts: their target zoomed (the selection to draw). */
  select(range: ChartZoom | null): void;
}

export interface ChartLink {
  /** This chart showed a category (pointer, touch or keyboard): the group follows. */
  shown(index: number | null): void;
  /** This chart zoomed itself: its group and brushes follow. */
  zoomed(range: ChartZoom | null): void;
  /** Brush charts: a new selection, applied to the target as its zoom. */
  brush(range: ChartZoom | null): void;
  /** The zoom drawn changed by itself (live data that it follows): only brushes redraw. */
  drawn(range: ChartZoom | null): void;
  unlink(): void;
}

const members = new Set<ChartLinkMember>();

const groupOf = (member: ChartLinkMember) =>
  member.group ? [...members].filter((m) => m !== member && m.group === member.group) : [];

/** Brush charts of `member` (and of its group: they share one zoom). */
const brushesOf = (targets: readonly ChartLinkMember[]) =>
  [...members].filter((m) => m.brushTarget && targets.some((t) => t.id === m.brushTarget));

function spread(source: ChartLinkMember, range: ChartZoom | null) {
  const group = groupOf(source);
  for (const member of group) member.applyZoom(range, "group");
  for (const brush of brushesOf([source, ...group])) brush.select(range);
}

/** Joins the registry; `unlink()` leaves it (unmount, `destroy`). */
export function linkChart(member: ChartLinkMember): ChartLink {
  members.add(member);
  // A brush shows its target's zoom at once; a target joining late updates its brushes.
  if (member.brushTarget) {
    const target = [...members].find((m) => m.id === member.brushTarget);
    member.select(target ? target.zoom() : null);
  }
  if (member.id) for (const brush of brushesOf([member])) brush.select(member.zoom());
  return {
    shown(index) {
      for (const other of groupOf(member)) other.showIndex(index);
    },
    zoomed(range) {
      spread(member, range);
    },
    brush(range) {
      const target = [...members].find((m) => m.id && m.id === member.brushTarget);
      if (!target) return;
      target.applyZoom(range, "brush");
      // The target's group follows; its brushes (this one included) draw the new selection.
      spread(target, range);
    },
    drawn(range) {
      if (member.id) for (const brush of brushesOf([member])) brush.select(range);
    },
    unlink() {
      members.delete(member);
    },
  };
}
