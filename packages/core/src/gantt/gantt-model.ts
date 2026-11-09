/**
 * Gantt data model (ADR-0048): tasks → a tree of items with day numbers, summary roll-ups,
 * dependencies and the critical path. Pure functions; owners keep the data.
 */
import { ganttDay } from "./gantt-date.js";

export const ganttDependencyTypes = ["FS", "SS", "FF", "SF"] as const;
export type GanttDependencyType = (typeof ganttDependencyTypes)[number];
export const ganttTaskTypes = ["task", "milestone"] as const;
export type GanttTaskType = (typeof ganttTaskTypes)[number];
/** Palette colors of bars (summaries, milestones and tasks have their own defaults). */
export const ganttColors = ["primary", "secondary", "info", "success", "warning", "error"] as const;
export type GanttColor = (typeof ganttColors)[number];

export interface GanttDependency {
  /** The predecessor's id. */
  readonly taskId: string;
  /** `FS` finish to start (default), `SS`, `FF` or `SF`. */
  readonly type?: GanttDependencyType | undefined;
  /** Days between the linked ends: positive lag, negative lead. */
  readonly lag?: number | undefined;
}

export type GanttDate = string | Date;

export interface GanttTask {
  readonly id: string;
  readonly name: string;
  /** First day, `YYYY-MM-DD` (or a `Date`). Parents take theirs from their children. */
  readonly startTime?: GanttDate | undefined;
  /** Last day, included. Without it, a task without children is a milestone. */
  readonly endTime?: GanttDate | undefined;
  /** Completion, 0–100. */
  readonly progress?: number | undefined;
  readonly type?: GanttTaskType | undefined;
  readonly parentId?: string | undefined;
  /** Predecessors: ids (finish to start) or dependency objects. */
  readonly dependency?:
    | string
    | GanttDependency
    | readonly (string | GanttDependency)[]
    | undefined;
  /** Palette color of the bar. */
  readonly color?: GanttColor | undefined;
  /** Children start hidden. */
  readonly collapsed?: boolean | undefined;
  /** Planned dates, drawn under the bar with `baseline`. */
  readonly baseline?: { readonly start: GanttDate; readonly end: GanttDate } | undefined;
}

export type GanttItemKind = "task" | "summary" | "milestone";

export interface GanttLinkModel {
  readonly from: string;
  readonly to: string;
  readonly type: GanttDependencyType;
  readonly lag: number;
}

export interface GanttItem {
  readonly id: string;
  readonly name: string;
  readonly task: GanttTask;
  readonly parentId: string | undefined;
  readonly level: number;
  readonly children: GanttItem[];
  readonly kind: GanttItemKind;
  /** First day. */
  start: number;
  /** Day after the last one (equal to `start` for milestones). */
  end: number;
  /** 0–100. */
  progress: number;
  readonly color: GanttColor | undefined;
  readonly collapsed: boolean;
  readonly baseline: { readonly start: number; readonly end: number } | undefined;
  /** Predecessors of this item. */
  readonly links: GanttLinkModel[];
}

export interface GanttModel {
  /** Every item, parents before their children (input order among siblings). */
  readonly items: readonly GanttItem[];
  readonly byId: ReadonlyMap<string, GanttItem>;
  /** First day of the project, and the day after its last one (`undefined` without tasks). */
  readonly start: number | undefined;
  readonly end: number | undefined;
  readonly links: readonly GanttLinkModel[];
}

const DEPENDENCY = /^([^\s,:]+)(?::(FS|SS|FF|SF)([+-]\d+(?:\.\d+)?)?)?$/i;

/** `design, build:SS, test:FF+2` → dependencies (unknown parts are dropped). */
export function parseGanttDependencies(text: string | null | undefined): GanttDependency[] {
  if (!text) return [];
  const list: GanttDependency[] = [];
  for (const part of text.slice(0, 2000).split(",")) {
    const match = DEPENDENCY.exec(part.trim());
    if (!match) continue;
    const type = (match[2]?.toUpperCase() ?? "FS") as GanttDependencyType;
    const lag = match[3] ? Number(match[3]) : 0;
    list.push({ taskId: match[1] as string, type, ...(lag ? { lag } : {}) });
  }
  return list;
}

const asList = (value: GanttTask["dependency"]): (string | GanttDependency)[] =>
  value === undefined
    ? []
    : Array.isArray(value)
      ? [...value]
      : [value as string | GanttDependency];

/** A task's dependencies as data (strings become finish to start). */
export function ganttDependencies(task: GanttTask): GanttDependency[] {
  return asList(task.dependency).flatMap((entry): GanttDependency[] => {
    if (typeof entry === "string") return parseGanttDependencies(entry);
    if (!entry || typeof entry.taskId !== "string") return [];
    const type = ganttDependencyTypes.includes(entry.type as GanttDependencyType)
      ? (entry.type as GanttDependencyType)
      : "FS";
    const lag = Number.isFinite(entry.lag) ? Number(entry.lag) : 0;
    return [{ taskId: entry.taskId, type, ...(lag ? { lag } : {}) }];
  });
}

/** The text form of dependencies (`design, build:SS+2`), as the HTML data table writes it. */
export const ganttDependencyText = (list: readonly GanttDependency[]): string =>
  list
    .map(({ taskId, type = "FS", lag = 0 }) =>
      type === "FS" && !lag ? taskId : `${taskId}:${type}${lag ? (lag > 0 ? `+${lag}` : lag) : ""}`,
    )
    .join(", ");

const clampProgress = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 0;
};

/** Builds the model: tree, day numbers, roll-ups, links. Invalid tasks are left out. */
export function ganttModel(tasks: readonly GanttTask[]): GanttModel {
  const byId = new Map<string, GanttItem>();
  const order: GanttItem[] = [];
  for (const task of tasks) {
    if (!task || typeof task.id !== "string" || !task.id || byId.has(task.id)) continue;
    const start = ganttDay(task.startTime);
    const endDay = ganttDay(task.endTime);
    const milestone = task.type === "milestone" || (start !== undefined && endDay === undefined);
    const item: GanttItem = {
      id: task.id,
      name: String(task.name ?? ""),
      task,
      parentId: typeof task.parentId === "string" ? task.parentId : undefined,
      level: 1,
      children: [],
      kind: milestone ? "milestone" : "task",
      start: start ?? Number.NaN,
      // Not a milestone with a start: it has an end day too.
      end:
        start === undefined
          ? Number.NaN
          : milestone
            ? start
            : Math.max(start, endDay as number) + 1,
      progress: milestone ? 0 : clampProgress(task.progress),
      color: ganttColors.includes(task.color as GanttColor) ? task.color : undefined,
      collapsed: task.collapsed === true,
      baseline: baselineOf(task),
      links: [],
    };
    byId.set(item.id, item);
    order.push(item);
  }
  // Parents: unknown ids and cycles fall back to the root.
  const parentOf = (item: GanttItem): GanttItem | undefined => {
    const parent = item.parentId === undefined ? undefined : byId.get(item.parentId);
    if (!parent) return undefined;
    const seen = new Set<GanttItem>();
    for (let up: GanttItem | undefined = parent; up && !seen.has(up); ) {
      if (up === item) return undefined;
      seen.add(up);
      up = up.parentId === undefined ? undefined : byId.get(up.parentId);
    }
    return parent;
  };
  const roots: GanttItem[] = [];
  for (const item of order) (parentOf(item)?.children ?? roots).push(item);
  // Roll up summaries (children first); drop undated leaves.
  const settle = (list: GanttItem[], level: number): GanttItem[] =>
    list.filter((item) => {
      (item as { level: number }).level = level;
      const kept = settle(item.children, level + 1);
      item.children.splice(0, item.children.length, ...kept);
      if (kept.length) {
        (item as { kind: GanttItemKind }).kind = "summary";
        item.start = Math.min(...kept.map((c) => c.start));
        item.end = Math.max(...kept.map((c) => c.end));
        let weight = 0;
        let done = 0;
        for (const leaf of leaves(item)) {
          const days = leaf.end - leaf.start;
          weight += days;
          done += days * leaf.progress;
        }
        item.progress = weight ? Math.round((done / weight) * 10) / 10 : 0;
        return true;
      }
      return !Number.isNaN(item.start);
    });
  const tree = settle(roots, 1);
  const items: GanttItem[] = [];
  const walk = (list: GanttItem[]) => {
    for (const item of list) {
      items.push(item);
      walk(item.children);
    }
  };
  walk(tree);
  const kept = new Map(items.map((item) => [item.id, item]));
  const links: GanttLinkModel[] = [];
  for (const item of items)
    for (const dependency of ganttDependencies(item.task)) {
      if (!kept.has(dependency.taskId) || dependency.taskId === item.id) continue;
      const link = {
        from: dependency.taskId,
        to: item.id,
        type: dependency.type as GanttDependencyType,
        lag: dependency.lag ?? 0,
      };
      item.links.push(link);
      links.push(link);
    }
  return {
    items,
    byId: kept,
    start: items.length ? Math.min(...items.map((i) => i.start)) : undefined,
    end: items.length ? Math.max(...items.map((i) => i.end)) : undefined,
    links,
  };
}

function baselineOf(task: GanttTask): GanttItem["baseline"] {
  if (!task.baseline) return undefined;
  const start = ganttDay(task.baseline.start);
  const end = ganttDay(task.baseline.end);
  if (start === undefined || end === undefined) return undefined;
  return { start: Math.min(start, end), end: Math.max(start, end) + 1 };
}

function* leaves(item: GanttItem): Generator<GanttItem> {
  for (const child of item.children) {
    if (child.children.length) yield* leaves(child);
    else if (child.kind === "task") yield child;
  }
}

/** The rows on screen: every item whose ancestors are all expanded. */
export function ganttVisibleItems(model: GanttModel, collapsed: ReadonlySet<string>): GanttItem[] {
  const rows: GanttItem[] = [];
  const hidden = new Set<string>();
  for (const item of model.items) {
    if (item.parentId !== undefined && hidden.has(item.parentId)) {
      hidden.add(item.id);
      continue;
    }
    rows.push(item);
    if (collapsed.has(item.id)) hidden.add(item.id);
  }
  return rows;
}

/** Ids of the items that start collapsed (`collapsed` on their task). */
export const ganttInitialCollapsed = (model: GanttModel): string[] =>
  model.items.filter((item) => item.collapsed && item.children.length).map((item) => item.id);

export interface GanttCriticalPath {
  readonly tasks: ReadonlySet<string>;
  /** `from>to` keys of the links on the path. */
  readonly links: ReadonlySet<string>;
}

export const ganttLinkKey = (link: GanttLinkModel) => `${link.from}>${link.to}`;

/**
 * The critical path: tasks and milestones (not summaries) with no total float, found with a
 * backward pass from the project's end over the dependencies (cycles are ignored).
 */
export function ganttCriticalPath(model: GanttModel): GanttCriticalPath {
  const work = model.items.filter((item) => item.kind !== "summary");
  const tasks = new Set<string>();
  const critical = new Set<string>();
  if (!work.length) return { tasks, links: critical };
  const ids = new Set(work.map((item) => item.id));
  const links = model.links.filter((link) => ids.has(link.from) && ids.has(link.to));
  const successors = new Map<string, GanttLinkModel[]>();
  for (const link of links) successors.set(link.from, [...(successors.get(link.from) ?? []), link]);
  const projectEnd = Math.max(...work.map((item) => item.end));
  const lateFinish = new Map<string, number>();
  const visiting = new Set<string>();
  const byId = model.byId;
  const finish = (id: string): number => {
    const known = lateFinish.get(id);
    if (known !== undefined) return known;
    const item = byId.get(id) as GanttItem;
    const days = item.end - item.start;
    let late = projectEnd;
    visiting.add(id);
    for (const link of successors.get(id) ?? []) {
      if (visiting.has(link.to)) continue;
      const next = byId.get(link.to) as GanttItem;
      const nextFinish = finish(link.to);
      const nextStart = nextFinish - (next.end - next.start);
      const bound =
        link.type === "FS"
          ? nextStart - link.lag
          : link.type === "SS"
            ? nextStart - link.lag + days
            : link.type === "FF"
              ? nextFinish - link.lag
              : nextFinish - link.lag + days;
      late = Math.min(late, bound);
    }
    visiting.delete(id);
    lateFinish.set(id, late);
    return late;
  };
  for (const item of work) if (finish(item.id) - item.end <= 0) tasks.add(item.id);
  for (const link of links) {
    if (!tasks.has(link.from) || !tasks.has(link.to)) continue;
    const a = byId.get(link.from) as GanttItem;
    const b = byId.get(link.to) as GanttItem;
    const slack =
      link.type === "FS"
        ? b.start - link.lag - a.end
        : link.type === "SS"
          ? b.start - link.lag - a.start
          : link.type === "FF"
            ? b.end - link.lag - a.end
            : b.end - link.lag - a.start;
    if (slack <= 0) critical.add(ganttLinkKey(link));
  }
  return { tasks, links: critical };
}
