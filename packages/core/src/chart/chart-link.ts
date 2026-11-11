import type { ChartGroupFilter } from "./chart-filter.js";
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
  /** The ids of the charts this brush chart zooms, separated by spaces. */
  readonly brushTarget?: string | undefined;
  /** The chart's current zoom (brush charts read their target's). */
  zoom(): ChartZoom | null;
  /** Another chart of the group showed a category (`null`: none). */
  showIndex(index: number | null): void;
  /** Another chart (its group, or a brush) zoomed this one. */
  applyZoom(range: ChartZoom | null, reason: ChartZoomReason): void;
  /** Brush charts: their target zoomed (the selection to draw). */
  select(range: ChartZoom | null): void;
  /**
   * Crossfilter (ADR-0054): the group's filter changed (`null`: none). Only members that define
   * it take part (charts with `crossfilter`).
   */
  filter?(filter: ChartGroupFilter | null): void;
  /** Crossfilter: another chart cleared this chart's filter; it clears its own selection. */
  cleared?(): void;
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
  /**
   * Crossfilter: this chart's selection or brush now filters these categories (`null`: its own
   * filter is gone). Replaces the group's filter; the group's members are told.
   */
  filtered(categories: readonly number[] | null): void;
  /** Crossfilter: clears the group's filter (its source clears its selection). */
  clearFilter(): void;
  unlink(): void;
}

const members = new Set<ChartLinkMember>();
/** One filter per group (ADR-0054): its categories and the chart that set it. */
const filters = new Map<string, { categories: readonly number[]; source: ChartLinkMember }>();

/** Members of a group that take part in its filter (the source included). */
const filterMembers = (group: string) =>
  [...members].filter((m) => m.group === group && m.filter !== undefined);

/** Tells the group about its filter (or that it has none). */
function tellFilter(group: string) {
  const current = filters.get(group);
  for (const member of filterMembers(group))
    member.filter?.(
      current ? { categories: current.categories, own: current.source === member } : null,
    );
}

const groupOf = (member: ChartLinkMember) =>
  member.group ? [...members].filter((m) => m !== member && m.group === member.group) : [];

/** The ids a brush chart zooms (`brushTarget` may name several). */
const targetIds = (member: ChartLinkMember) =>
  member.brushTarget?.split(/\s+/).filter(Boolean) ?? [];

/** Brush charts of `member` (and of its group: they share one zoom). */
const brushesOf = (targets: readonly ChartLinkMember[]) =>
  [...members].filter((m) => targets.some((t) => t.id && targetIds(m).includes(t.id)));

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
    const ids = targetIds(member);
    const target = [...members].find((m) => m.id && ids.includes(m.id));
    member.select(target ? target.zoom() : null);
  }
  if (member.id) for (const brush of brushesOf([member])) brush.select(member.zoom());
  // A chart joining a filtered group shows its filter.
  const current = member.group ? filters.get(member.group) : undefined;
  if (current && member.filter) member.filter({ categories: current.categories, own: false });
  return {
    shown(index) {
      for (const other of groupOf(member)) other.showIndex(index);
    },
    zoomed(range) {
      spread(member, range);
    },
    brush(range) {
      const ids = targetIds(member);
      for (const target of [...members].filter((m) => m.id && ids.includes(m.id))) {
        target.applyZoom(range, "brush");
        // The target's group follows; its brushes (this one included) draw the new selection.
        spread(target, range);
      }
    },
    drawn(range) {
      if (member.id) for (const brush of brushesOf([member])) brush.select(range);
    },
    filtered(categories) {
      const group = member.group;
      if (!group || !member.filter) return;
      if (categories?.length) filters.set(group, { categories: [...categories], source: member });
      else if (filters.get(group)?.source === member) filters.delete(group);
      else return;
      tellFilter(group);
    },
    clearFilter() {
      const group = member.group;
      const current = group ? filters.get(group) : undefined;
      if (!group || !current) return;
      filters.delete(group);
      tellFilter(group);
      current.source.cleared?.();
    },
    unlink() {
      members.delete(member);
      // A source that leaves takes its filter with it.
      const group = member.group;
      if (group && filters.get(group)?.source === member) {
        filters.delete(group);
        tellFilter(group);
      }
    },
  };
}
