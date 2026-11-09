import type { GanttTask } from "@owlky/core";
import type { GanttProps } from "@owlky/react";

/*
 * Gantt examples: one per story. Plain data with type-only imports, shared by the React stories
 * and the generator of the HTML snippets (`packages/html/src/components/gantt/examples/*.html`),
 * so both render the same Gantt. Every project, name and date here is our own.
 */

export interface GanttExampleGroup {
  /** Story group title. */
  readonly title: string;
  /** Snippet file suffix (`<story>-<file>.html`). */
  readonly file: string;
  readonly props: GanttProps;
}

export interface GanttExample {
  readonly title: string;
  readonly groups: readonly GanttExampleGroup[];
}

/** Fixed "today" of every story, so screenshots never change. */
export const TODAY = "2025-03-18";

/** A website relaunch: three phases, milestones and dependencies of every type. */
export const RELAUNCH: readonly GanttTask[] = [
  { id: "discovery", name: "Discovery" },
  {
    id: "research",
    name: "User research",
    parentId: "discovery",
    startTime: "2025-03-03",
    endTime: "2025-03-07",
    progress: 100,
  },
  {
    id: "audit",
    name: "Content audit",
    parentId: "discovery",
    startTime: "2025-03-05",
    endTime: "2025-03-11",
    progress: 80,
    dependency: { taskId: "research", type: "SS", lag: 2 },
  },
  {
    id: "brief",
    name: "Brief approved",
    parentId: "discovery",
    startTime: "2025-03-12",
    type: "milestone",
    dependency: "audit",
  },
  { id: "design", name: "Design" },
  {
    id: "wireframes",
    name: "Wireframes",
    parentId: "design",
    startTime: "2025-03-13",
    endTime: "2025-03-20",
    progress: 60,
    dependency: "brief",
  },
  {
    id: "visual",
    name: "Visual design",
    parentId: "design",
    startTime: "2025-03-21",
    endTime: "2025-04-01",
    progress: 25,
    dependency: "wireframes",
  },
  {
    id: "review",
    name: "Design review",
    parentId: "design",
    startTime: "2025-04-02",
    type: "milestone",
    dependency: "visual",
  },
  { id: "build", name: "Build" },
  {
    id: "backend",
    name: "Back end",
    parentId: "build",
    startTime: "2025-03-24",
    endTime: "2025-04-16",
    progress: 10,
    dependency: "wireframes",
  },
  {
    id: "frontend",
    name: "Front end",
    parentId: "build",
    startTime: "2025-04-03",
    endTime: "2025-04-22",
    dependency: "review",
  },
  {
    id: "testing",
    name: "Testing",
    parentId: "build",
    startTime: "2025-04-17",
    endTime: "2025-04-25",
    dependency: [{ taskId: "frontend", type: "FF", lag: 3 }, "backend"],
  },
  {
    id: "launch",
    name: "Launch",
    startTime: "2025-04-28",
    type: "milestone",
    dependency: "testing",
  },
];

/** A small release plan for milestones. */
const RELEASE: readonly GanttTask[] = [
  { id: "kickoff", name: "Kickoff", startTime: "2025-03-03", type: "milestone" },
  {
    id: "alpha",
    name: "Alpha build",
    startTime: "2025-03-04",
    endTime: "2025-03-14",
    progress: 100,
    dependency: "kickoff",
  },
  {
    id: "alpha-done",
    name: "Alpha ready",
    startTime: "2025-03-17",
    type: "milestone",
    dependency: "alpha",
  },
  {
    id: "beta",
    name: "Beta build",
    startTime: "2025-03-17",
    endTime: "2025-03-28",
    progress: 40,
    dependency: "alpha-done",
  },
  {
    id: "beta-done",
    name: "Beta ready",
    startTime: "2025-03-31",
    type: "milestone",
    dependency: "beta",
  },
  {
    id: "store",
    name: "Store review",
    startTime: "2025-03-31",
    endTime: "2025-04-04",
    dependency: "beta-done",
  },
  {
    id: "release",
    name: "Release",
    startTime: "2025-04-07",
    type: "milestone",
    dependency: "store",
  },
];

/** Two tasks per dependency type. */
const DEPENDENCIES: readonly GanttTask[] = [
  { id: "a", name: "Pour concrete", startTime: "2025-03-03", endTime: "2025-03-07", progress: 100 },
  {
    id: "b",
    name: "Frame walls (FS)",
    startTime: "2025-03-10",
    endTime: "2025-03-14",
    progress: 30,
    dependency: "a",
  },
  { id: "c", name: "Write copy", startTime: "2025-03-03", endTime: "2025-03-12", progress: 70 },
  {
    id: "d",
    name: "Edit copy (SS + 2)",
    startTime: "2025-03-05",
    endTime: "2025-03-14",
    progress: 20,
    dependency: { taskId: "c", type: "SS", lag: 2 },
  },
  { id: "e", name: "Install wiring", startTime: "2025-03-04", endTime: "2025-03-13", progress: 50 },
  {
    id: "f",
    name: "Inspect wiring (FF)",
    startTime: "2025-03-10",
    endTime: "2025-03-13",
    dependency: { taskId: "e", type: "FF" },
  },
  { id: "g", name: "New shift starts", startTime: "2025-03-12", endTime: "2025-03-14" },
  {
    id: "h",
    name: "Old shift ends (SF)",
    startTime: "2025-03-06",
    endTime: "2025-03-11",
    progress: 100,
    dependency: { taskId: "g", type: "SF", lag: -1 },
  },
];

/** Planned dates beside the actual ones. */
const BASELINE: readonly GanttTask[] = [
  {
    id: "survey",
    name: "Site survey",
    startTime: "2025-03-03",
    endTime: "2025-03-06",
    progress: 100,
    baseline: { start: "2025-03-03", end: "2025-03-05" },
  },
  {
    id: "permits",
    name: "Permits",
    startTime: "2025-03-07",
    endTime: "2025-03-19",
    progress: 90,
    dependency: "survey",
    baseline: { start: "2025-03-06", end: "2025-03-14" },
  },
  {
    id: "foundation",
    name: "Foundation",
    startTime: "2025-03-20",
    endTime: "2025-03-28",
    progress: 30,
    dependency: "permits",
    baseline: { start: "2025-03-17", end: "2025-03-26" },
  },
  {
    id: "handover",
    name: "Handover",
    startTime: "2025-03-31",
    type: "milestone",
    dependency: "foundation",
    baseline: { start: "2025-03-27", end: "2025-03-27" },
  },
];

/** An office move: tasks in parallel, one chain without slack. */
const OFFICE: readonly GanttTask[] = [
  {
    id: "lease",
    name: "Sign the lease",
    startTime: "2025-03-03",
    endTime: "2025-03-05",
    progress: 100,
  },
  {
    id: "layout",
    name: "Plan the layout",
    startTime: "2025-03-06",
    endTime: "2025-03-12",
    progress: 70,
    dependency: "lease",
  },
  {
    id: "network",
    name: "Network cabling",
    startTime: "2025-03-13",
    endTime: "2025-03-23",
    progress: 20,
    dependency: "layout",
  },
  {
    id: "furniture",
    name: "Order furniture",
    startTime: "2025-03-06",
    endTime: "2025-03-10",
    progress: 100,
    dependency: "lease",
  },
  {
    id: "signs",
    name: "Signs and labels",
    startTime: "2025-03-11",
    endTime: "2025-03-14",
    dependency: "furniture",
  },
  {
    id: "move",
    name: "Moving day",
    startTime: "2025-03-24",
    endTime: "2025-03-25",
    dependency: ["network", "signs"],
  },
  {
    id: "open",
    name: "Office opens",
    startTime: "2025-03-26",
    type: "milestone",
    dependency: "move",
  },
];

/** Sprint tasks in palette colors. */
const COLORS: readonly GanttTask[] = [
  {
    id: "c1",
    name: "Primary",
    startTime: "2025-03-03",
    endTime: "2025-03-07",
    progress: 60,
    color: "primary",
  },
  {
    id: "c2",
    name: "Secondary",
    startTime: "2025-03-05",
    endTime: "2025-03-11",
    progress: 40,
    color: "secondary",
  },
  {
    id: "c3",
    name: "Info",
    startTime: "2025-03-07",
    endTime: "2025-03-13",
    progress: 80,
    color: "info",
  },
  {
    id: "c4",
    name: "Success",
    startTime: "2025-03-10",
    endTime: "2025-03-14",
    progress: 100,
    color: "success",
  },
  {
    id: "c5",
    name: "Warning",
    startTime: "2025-03-11",
    endTime: "2025-03-18",
    progress: 20,
    color: "warning",
  },
  {
    id: "c6",
    name: "Error",
    startTime: "2025-03-13",
    endTime: "2025-03-19",
    progress: 50,
    color: "error",
  },
];

/** Short tasks for the label positions. */
const LABELS: readonly GanttTask[] = [
  { id: "l1", name: "Kickoff call", startTime: "2025-03-04", endTime: "2025-03-04", progress: 100 },
  { id: "l2", name: "Requirements", startTime: "2025-03-05", endTime: "2025-03-14", progress: 70 },
  { id: "l3", name: "Estimate", startTime: "2025-03-17", endTime: "2025-03-18", progress: 20 },
  { id: "l4", name: "Sign-off", startTime: "2025-03-19", type: "milestone" },
];

/** A product year: 24 two-week sprints of five tasks each and a review milestone (168 rows). */
const SPRINT_WORK = ["Planning", "Design", "Build", "Test", "Release notes"];
const LARGE: readonly GanttTask[] = Array.from({ length: 24 }, (_, s) => {
  const start = Date.UTC(2025, 0, 6) + s * 14 * 86_400_000;
  const day = (offset: number) => new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
  const sprint = `sprint-${s + 1}`;
  return [
    { id: sprint, name: `Sprint ${s + 1}` },
    ...SPRINT_WORK.map((name, t) => ({
      id: `${sprint}-${t + 1}`,
      name,
      parentId: sprint,
      startTime: day(t * 2),
      endTime: day(t * 2 + 3),
      progress: s < 5 ? 100 : s === 5 ? 50 : 0,
      ...(t > 0 ? { dependency: `${sprint}-${t}` } : {}),
    })),
    {
      id: `${sprint}-review`,
      name: "Review",
      parentId: sprint,
      startTime: day(11),
      type: "milestone" as const,
      dependency: `${sprint}-5`,
    },
  ];
}).flat();

const base = { today: TODAY } as const;

export const ganttExamples: Record<string, GanttExample> = {
  basic: {
    title: "Basic",
    groups: [
      {
        title: "Basic",
        file: "group",
        props: { ...base, label: "Website relaunch", tasks: RELAUNCH, toolbar: true },
      },
    ],
  },
  "timeline-views": {
    title: "Timeline views",
    groups: (["day", "week", "month", "quarter", "year"] as const).map((view) => ({
      title: `${view[0]?.toUpperCase()}${view.slice(1)}`,
      file: view,
      props: { ...base, label: `Website relaunch, ${view} view`, tasks: RELAUNCH, view },
    })),
  },
  milestones: {
    title: "Milestones",
    groups: [
      {
        title: "Milestones",
        file: "group",
        props: { ...base, label: "App release", tasks: RELEASE, view: "day" },
      },
    ],
  },
  "dependency-types": {
    title: "Dependency types",
    groups: [
      {
        title: "Finish to start, start to start, finish to finish, start to finish",
        file: "group",
        props: { ...base, label: "Dependency types", tasks: DEPENDENCIES, view: "day" },
      },
    ],
  },
  baseline: {
    title: "Baseline",
    groups: [
      {
        title: "Baseline",
        file: "group",
        props: { ...base, label: "Warehouse build", tasks: BASELINE, view: "day", baseline: true },
      },
    ],
  },
  "critical-path": {
    title: "Critical path",
    groups: [
      {
        title: "Critical path",
        file: "group",
        props: { ...base, label: "Office move", tasks: OFFICE, view: "day", criticalPath: true },
      },
    ],
  },
  "working-calendar": {
    title: "Working calendar",
    groups: [
      {
        title: "Four-day week and a holiday",
        file: "group",
        props: {
          ...base,
          label: "Office move, four-day week",
          tasks: OFFICE,
          view: "day",
          workingWeekdays: [1, 2, 3, 4],
          holidays: ["2025-03-17"],
        },
      },
    ],
  },
  "project-boundary": {
    title: "Project boundary",
    groups: [
      {
        title: "Project boundary",
        file: "group",
        props: {
          ...base,
          label: "Website relaunch, boundary",
          tasks: RELAUNCH,
          projectBoundary: true,
        },
      },
    ],
  },
  "bar-labels": {
    title: "Bar labels",
    groups: (["right", "inside", "left", "auto"] as const).map((barLabel) => ({
      title: `${barLabel[0]?.toUpperCase()}${barLabel.slice(1)}`,
      file: barLabel,
      props: {
        ...base,
        label: `Labels ${barLabel}`,
        tasks: LABELS,
        view: "day",
        barLabel,
        tasksContainerWidth: 280,
        columns: ["name", "startTime"],
      },
    })),
  },
  "custom-colors": {
    title: "Custom colors",
    groups: [
      {
        title: "Custom colors",
        file: "group",
        props: { ...base, label: "Sprint board", tasks: COLORS, view: "day", barLabel: "auto" },
      },
    ],
  },
  selection: {
    title: "Selection",
    groups: [
      {
        title: "Selection",
        file: "group",
        props: {
          ...base,
          label: "Website relaunch, selectable",
          tasks: RELAUNCH,
          selection: true,
          defaultSelected: ["wireframes", "visual"],
        },
      },
    ],
  },
  "large-project": {
    title: "Large project",
    groups: [
      {
        title: "A year of sprints, virtualized, with downloads",
        file: "group",
        props: {
          ...base,
          label: "Product year",
          tasks: LARGE,
          view: "month",
          height: 400,
          toolbar: true,
          exportFormat: "png",
        },
      },
    ],
  },
  "task-list-columns": {
    title: "Task list columns",
    groups: [
      {
        title: "Name, start, end and progress",
        file: "group",
        props: {
          ...base,
          label: "Website relaunch, columns",
          tasks: RELAUNCH,
          columns: ["name", "startTime", "endTime", "progress"],
          tasksContainerWidth: 520,
          defaultCollapsed: ["discovery"],
        },
      },
    ],
  },
};
