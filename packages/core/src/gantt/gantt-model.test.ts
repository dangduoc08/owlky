import { describe, expect, it } from "vitest";
import {
  ganttDay,
  ganttFormat,
  ganttIsoDay,
  ganttLongDate,
  ganttShortDate,
  ganttUnitLabel,
  ganttUnitNext,
  ganttUnitStart,
  ganttWeekday,
} from "./gantt-date.js";
import {
  type GanttTask,
  ganttCriticalPath,
  ganttDependencies,
  ganttDependencyText,
  ganttInitialCollapsed,
  ganttLinkKey,
  ganttModel,
  ganttVisibleItems,
  parseGanttDependencies,
} from "./gantt-model.js";
import {
  GANTT_MAX_DENSITY,
  GANTT_MIN_DENSITY,
  ganttDensity,
  ganttScale,
  ganttTiers,
  ganttZoom,
} from "./gantt-scale.js";

const day = (iso: string) => ganttDay(iso) as number;

describe("gantt dates", () => {
  it("turns ISO days and local dates into UTC day numbers", () => {
    expect(ganttDay("1970-01-02")).toBe(1);
    expect(ganttDay("2025-03-03T10:00")).toBe(day("2025-03-03"));
    expect(ganttDay(new Date(2025, 2, 3, 23, 30))).toBe(day("2025-03-03"));
    expect(ganttIsoDay(day("2024-02-29"))).toBe("2024-02-29");
  });

  it("refuses invalid input", () => {
    for (const value of ["2025-02-30", "2025-13-01", "03-03-2025", "", "x".repeat(50), 5, null])
      expect(ganttDay(value)).toBeUndefined();
    expect(ganttDay(new Date(Number.NaN))).toBeUndefined();
  });

  it("finds unit starts and the next unit", () => {
    const wed = day("2025-03-05");
    expect(ganttWeekday(wed)).toBe(3);
    expect(ganttUnitStart("day", wed)).toBe(wed);
    expect(ganttIsoDay(ganttUnitStart("week", wed))).toBe("2025-03-03");
    expect(ganttIsoDay(ganttUnitStart("week", wed, 0))).toBe("2025-03-02");
    expect(ganttIsoDay(ganttUnitStart("month", wed))).toBe("2025-03-01");
    expect(ganttIsoDay(ganttUnitStart("quarter", day("2025-05-20")))).toBe("2025-04-01");
    expect(ganttIsoDay(ganttUnitStart("half", day("2025-08-20")))).toBe("2025-07-01");
    expect(ganttIsoDay(ganttUnitStart("half", day("2025-02-20")))).toBe("2025-01-01");
    expect(ganttIsoDay(ganttUnitStart("year", wed))).toBe("2025-01-01");
    const next = (unit: Parameters<typeof ganttUnitNext>[0], iso: string) =>
      ganttIsoDay(ganttUnitNext(unit, day(iso)));
    expect(next("day", "2025-03-05")).toBe("2025-03-06");
    expect(next("week", "2025-03-03")).toBe("2025-03-10");
    expect(next("month", "2025-12-01")).toBe("2026-01-01");
    expect(next("quarter", "2025-10-01")).toBe("2026-01-01");
    expect(next("half", "2025-07-01")).toBe("2026-01-01");
    expect(next("year", "2025-01-01")).toBe("2026-01-01");
  });

  it("labels units and formats dates in UTC", () => {
    const d = day("2025-03-03");
    expect(ganttUnitLabel("day", d, "en-US", false)).toBe("3");
    expect(ganttUnitLabel("week", d, "en-US", false)).toBe("Mar 3");
    expect(ganttUnitLabel("month", d, "en-US", true)).toBe("March 2025");
    expect(ganttUnitLabel("month", d, "en-US", false)).toBe("Mar");
    expect(ganttUnitLabel("quarter", day("2025-08-01"), "en-US", false)).toBe("Q3");
    expect(ganttUnitLabel("half", day("2025-08-01"), "en-US", false)).toBe("H2");
    expect(ganttUnitLabel("half", d, "en-US", false)).toBe("H1");
    expect(ganttUnitLabel("year", d, "en-US", true)).toBe("2025");
    expect(ganttShortDate(d, "en-US")).toBe("Mar 3, 2025");
    expect(ganttLongDate(d, "en-US")).toBe("March 3, 2025");
    expect(ganttShortDate(d, "de-DE")).toBe("3. März 2025");
    // An unknown locale falls back to the default one instead of throwing.
    expect(() => ganttFormat(d, "zz-invalid-tag-!!", { year: "numeric" })).not.toThrow();
  });
});

describe("gantt dependencies", () => {
  it("parses the text form", () => {
    expect(parseGanttDependencies("a, b:ss, c:FF+2, d:SF-1.5, e:XX, f g")).toEqual([
      { taskId: "a", type: "FS" },
      { taskId: "b", type: "SS" },
      { taskId: "c", type: "FF", lag: 2 },
      { taskId: "d", type: "SF", lag: -1.5 },
    ]);
    expect(parseGanttDependencies(null)).toEqual([]);
  });

  it("normalizes data and writes the text form", () => {
    const task: GanttTask = {
      id: "x",
      name: "X",
      dependency: [
        "a",
        { taskId: "b", type: "SS", lag: 2 },
        { taskId: "c", type: "??" as "FS", lag: Number.NaN },
        { taskId: 5 as unknown as string },
      ],
    };
    const list = ganttDependencies(task);
    expect(list).toEqual([
      { taskId: "a", type: "FS" },
      { taskId: "b", type: "SS", lag: 2 },
      { taskId: "c", type: "FS" },
    ]);
    expect(
      ganttDependencyText([
        ...list,
        { taskId: "d", type: "FF", lag: -1 },
        { taskId: "e", type: "SF" },
      ]),
    ).toBe("a, b:SS+2, c, d:FF-1, e:SF");
    expect(ganttDependencies({ id: "y", name: "Y" })).toEqual([]);
    expect(ganttDependencies({ id: "y", name: "Y", dependency: { taskId: "a" } })).toEqual([
      { taskId: "a", type: "FS" },
    ]);
  });
});

const PROJECT: GanttTask[] = [
  { id: "p", name: "Phase" },
  {
    id: "a",
    name: "A",
    parentId: "p",
    startTime: "2025-03-03",
    endTime: "2025-03-07",
    progress: 100,
  },
  {
    id: "b",
    name: "B",
    parentId: "p",
    startTime: "2025-03-10",
    endTime: "2025-03-14",
    progress: 0,
    dependency: "a",
  },
  { id: "m", name: "Done", startTime: "2025-03-17", type: "milestone", dependency: "b" },
  { id: "c", name: "C", startTime: "2025-03-03", endTime: "2025-03-05", progress: 50 },
];

describe("ganttModel", () => {
  it("builds the tree, rolls up summaries and links tasks", () => {
    const model = ganttModel(PROJECT);
    expect(model.items.map((item) => [item.id, item.level, item.kind])).toEqual([
      ["p", 1, "summary"],
      ["a", 2, "task"],
      ["b", 2, "task"],
      ["m", 1, "milestone"],
      ["c", 1, "task"],
    ]);
    const phase = model.byId.get("p");
    expect(phase?.start).toBe(day("2025-03-03"));
    expect(phase?.end).toBe(day("2025-03-15"));
    expect(phase?.progress).toBe(50);
    const milestone = model.byId.get("m");
    expect(milestone?.end).toBe(milestone?.start);
    expect(model.start).toBe(day("2025-03-03"));
    expect(model.end).toBe(day("2025-03-17"));
    expect(model.links).toEqual([
      { from: "a", to: "b", type: "FS", lag: 0 },
      { from: "b", to: "m", type: "FS", lag: 0 },
    ]);
  });

  it("drops invalid tasks and keeps the first of duplicate ids", () => {
    const model = ganttModel([
      { id: "", name: "No id" },
      { id: "x", name: "X", startTime: "2025-03-03", endTime: "2025-03-04", progress: 140 },
      { id: "x", name: "Duplicate", startTime: "2025-03-03", endTime: "2025-03-04" },
      { id: "undated", name: "No dates" },
      { id: "empty", name: "Empty parent" },
      { id: "child", name: "Undated child", parentId: "empty" },
      {
        id: "late",
        name: 12 as unknown as string,
        startTime: "2025-03-09",
        endTime: "2025-03-08",
        progress: -3,
      },
      {
        id: "dep",
        name: "Dep",
        startTime: "2025-03-09",
        endTime: "2025-03-10",
        dependency: ["nope", "dep"],
      },
      {
        id: "color",
        name: "Color",
        startTime: "2025-03-09",
        endTime: "2025-03-10",
        color: "red" as "info",
      },
      { id: "nameless", startTime: "2025-03-09", endTime: "2025-03-10" } as GanttTask,
      { id: "end-only", name: "End only", endTime: "2025-03-10" },
      null as unknown as GanttTask,
    ]);
    expect(model.items.map((item) => item.id)).toEqual(["x", "late", "dep", "color", "nameless"]);
    expect(model.byId.get("nameless")?.name).toBe("");
    expect(model.byId.get("x")?.progress).toBe(100);
    expect(model.byId.get("late")?.name).toBe("12");
    expect(model.byId.get("late")?.progress).toBe(0);
    // An end before the start leaves a one-day task.
    expect((model.byId.get("late")?.end ?? 0) - (model.byId.get("late")?.start ?? 0)).toBe(1);
    expect(model.links).toEqual([]);
    expect(model.byId.get("color")?.color).toBeUndefined();
    expect(ganttModel([]).start).toBeUndefined();
  });

  it("puts tasks with unknown or cyclic parents at the root", () => {
    const model = ganttModel([
      { id: "a", name: "A", parentId: "b", startTime: "2025-03-03" },
      { id: "b", name: "B", parentId: "a", startTime: "2025-03-03" },
      { id: "c", name: "C", parentId: "a", startTime: "2025-03-03", endTime: "2025-03-04" },
      { id: "d", name: "D", parentId: "missing", startTime: "2025-03-03" },
      { id: "e", name: "E", parentId: "e", startTime: "2025-03-03" },
    ]);
    expect(model.items.map((item) => [item.id, item.level])).toEqual([
      ["a", 1],
      ["c", 2],
      ["b", 1],
      ["d", 1],
      ["e", 1],
    ]);
  });

  it("reads baselines and averages milestone-only summaries to 0", () => {
    const model = ganttModel([
      { id: "p", name: "P" },
      { id: "m", name: "M", parentId: "p", startTime: "2025-03-03", type: "milestone" },
      {
        id: "t",
        name: "T",
        startTime: "2025-03-03",
        endTime: "2025-03-04",
        baseline: { start: "2025-03-05", end: "2025-03-02" },
      },
      {
        id: "u",
        name: "U",
        startTime: "2025-03-03",
        endTime: "2025-03-04",
        baseline: { start: "x", end: "y" },
      },
    ]);
    expect(model.byId.get("p")?.progress).toBe(0);
    expect(model.byId.get("t")?.baseline).toEqual({
      start: day("2025-03-02"),
      end: day("2025-03-06"),
    });
    expect(model.byId.get("u")?.baseline).toBeUndefined();
  });

  it("lists visible rows and initially collapsed parents", () => {
    const model = ganttModel([
      { id: "p", name: "P", collapsed: true },
      { id: "q", name: "Q", parentId: "p" },
      { id: "r", name: "R", parentId: "q", startTime: "2025-03-03", endTime: "2025-03-04" },
      { id: "s", name: "S", startTime: "2025-03-03", endTime: "2025-03-04", collapsed: true },
    ]);
    expect(ganttInitialCollapsed(model)).toEqual(["p"]);
    expect(ganttVisibleItems(model, new Set(["p"])).map((i) => i.id)).toEqual(["p", "s"]);
    expect(ganttVisibleItems(model, new Set(["q"])).map((i) => i.id)).toEqual(["p", "q", "s"]);
    expect(ganttVisibleItems(model, new Set()).map((i) => i.id)).toEqual(["p", "q", "r", "s"]);
  });
});

describe("ganttCriticalPath", () => {
  it("marks the chain with no slack", () => {
    const path = ganttCriticalPath(ganttModel(PROJECT));
    expect([...path.tasks].sort()).toEqual(["m"]);
    const tight = ganttModel([
      { id: "a", name: "A", startTime: "2025-03-03", endTime: "2025-03-05" },
      { id: "b", name: "B", startTime: "2025-03-06", endTime: "2025-03-07", dependency: "a" },
      { id: "c", name: "C", startTime: "2025-03-03", endTime: "2025-03-04" },
      {
        id: "d",
        name: "D",
        startTime: "2025-03-05",
        endTime: "2025-03-07",
        dependency: { taskId: "c", type: "SS", lag: 2 },
      },
      {
        id: "e",
        name: "E",
        startTime: "2025-03-04",
        endTime: "2025-03-07",
        dependency: { taskId: "c", type: "FF", lag: 3 },
      },
      { id: "f", name: "F", startTime: "2025-03-01", endTime: "2025-03-02" },
      {
        id: "g",
        name: "G",
        startTime: "2025-03-03",
        endTime: "2025-03-07",
        dependency: { taskId: "f", type: "SF", lag: 7 },
      },
    ]);
    const result = ganttCriticalPath(tight);
    expect([...result.tasks].sort()).toEqual(["a", "b", "c", "d", "e", "f", "g"]);
    expect([...result.links].sort()).toEqual(["a>b", "c>d", "c>e", "f>g"]);
    expect(ganttLinkKey({ from: "x", to: "y", type: "FS", lag: 0 })).toBe("x>y");
  });

  it("ignores summaries, cycles and empty projects", () => {
    expect(ganttCriticalPath(ganttModel([])).tasks.size).toBe(0);
    const cyclic = ganttModel([
      { id: "a", name: "A", startTime: "2025-03-03", endTime: "2025-03-05", dependency: "b" },
      { id: "b", name: "B", startTime: "2025-03-06", endTime: "2025-03-07", dependency: "a" },
    ]);
    expect([...ganttCriticalPath(cyclic).tasks]).toContain("b");
  });
});

describe("gantt scale", () => {
  it("clamps densities and steps the zoom", () => {
    expect(ganttDensity(undefined)).toBe(16);
    expect(ganttDensity(null, "day")).toBe(36);
    expect(ganttDensity("abc", "year")).toBe(0.5);
    expect(ganttDensity(-3, "month")).toBe(5);
    expect(ganttDensity(1000)).toBe(GANTT_MAX_DENSITY);
    expect(ganttDensity(0.01)).toBe(GANTT_MIN_DENSITY);
    expect(ganttZoom(10, 1)).toBe(14);
    expect(ganttZoom(14, -1)).toBe(10);
    expect(ganttZoom(GANTT_MAX_DENSITY, 1)).toBe(GANTT_MAX_DENSITY);
  });

  it("picks the header tiers from the density", () => {
    expect(ganttTiers(36)).toEqual(["month", "day"]);
    expect(ganttTiers(16)).toEqual(["month", "week"]);
    expect(ganttTiers(5)).toEqual(["year", "month"]);
    expect(ganttTiers(1.6)).toEqual(["year", "quarter"]);
    expect(ganttTiers(0.5)).toEqual(["year", "half"]);
  });

  it("pads the range by one unit on both sides", () => {
    const scale = ganttScale(day("2025-03-05"), day("2025-03-20"), { density: 16 });
    expect(ganttIsoDay(scale.start)).toBe("2025-02-24");
    expect(ganttIsoDay(scale.end)).toBe("2025-03-31");
    expect(scale.width).toBe((scale.end - scale.start) * 16);
    expect(scale.bottom.map((tick) => tick.label)).toEqual([
      "Feb 24",
      "Mar 3",
      "Mar 10",
      "Mar 17",
      "Mar 24",
    ]);
    expect(scale.top.map((tick) => [tick.label, tick.x, tick.width])).toEqual([
      ["February 2025", 0, 80],
      ["March 2025", 80, 480],
    ]);
    expect(scale.x(scale.start + 1)).toBe(16);
    const days = ganttScale(day("2025-03-05"), day("2025-03-06"), { density: 36, locale: "en-US" });
    expect(days.bottom.map((tick) => tick.label)).toEqual(["4", "5", "6"]);
  });
});
