import { ganttOptions } from "@owlky/core";
import { Gantt, type GanttTask } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const TASKS: GanttTask[] = [
  { id: "plan", name: "Plan" },
  {
    id: "scope",
    name: "Scope",
    parentId: "plan",
    startTime: "2025-03-03",
    endTime: "2025-03-05",
    progress: 100,
  },
  {
    id: "budget",
    name: "Budget",
    parentId: "plan",
    startTime: "2025-03-06",
    endTime: "2025-03-11",
    progress: 50,
    dependency: "scope",
  },
  {
    id: "approved",
    name: "Approved",
    startTime: "2025-03-12",
    type: "milestone",
    dependency: "budget",
  },
];

const TASKS_SOURCE = `const tasks: GanttTask[] = [
  { id: "plan", name: "Plan" },
  { id: "scope", name: "Scope", parentId: "plan", startTime: "2025-03-03", endTime: "2025-03-05", progress: 100 },
  { id: "budget", name: "Budget", parentId: "plan", startTime: "2025-03-06", endTime: "2025-03-11", progress: 50, dependency: "scope" },
  { id: "approved", name: "Approved", startTime: "2025-03-12", type: "milestone", dependency: "budget" },
];`;

/** The HTML data table of the guide's tasks, with the root's attributes. */
function htmlGantt(attributes = 'data-ok-view="week" data-ok-bar-label="right"'): string {
  return `<div data-ok-gantt ${attributes}>
  <table data-ok-gantt-data>
    <caption>Budget plan</caption>
    <thead>
      <tr><th scope="col" data-ok-gantt-field="name">Task</th><th scope="col" data-ok-gantt-field="startTime">Start</th><th scope="col" data-ok-gantt-field="endTime">End</th><th scope="col" data-ok-gantt-field="progress">Progress</th><th scope="col" data-ok-gantt-field="dependency">Predecessors</th></tr>
    </thead>
    <tbody>
      <tr data-ok-task-id="plan"><td>Plan</td><td></td><td></td><td></td><td></td></tr>
      <tr data-ok-task-id="scope" data-ok-parent-id="plan"><td>Scope</td><td data-ok-value="2025-03-03">Mar 3, 2025</td><td data-ok-value="2025-03-05">Mar 5, 2025</td><td data-ok-value="100">100%</td><td></td></tr>
      <tr data-ok-task-id="budget" data-ok-parent-id="plan"><td>Budget</td><td data-ok-value="2025-03-06">Mar 6, 2025</td><td data-ok-value="2025-03-11">Mar 11, 2025</td><td data-ok-value="50">50%</td><td>scope</td></tr>
      <tr data-ok-task-id="approved" data-ok-type="milestone"><td>Approved</td><td data-ok-value="2025-03-12">Mar 12, 2025</td><td></td><td></td><td>budget</td></tr>
    </tbody>
  </table>
</div>`;
}

/** A React module that renders the guide's tasks with `props`. */
const reactGantt = (
  name: string,
  props = "",
) => `import { Gantt, type GanttTask } from "@owlky/react";

${TASKS_SOURCE}

export function ${name}() {
  return <Gantt label="Budget plan" tasks={tasks}${props} />;
}`;

export const ganttSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A Gantt chart shows a project's tasks on a timeline. The task list on the start side shows each task's name, start date, duration and progress. The timeline shows one bar per task in the same row, so you can follow a task across both. Parent tasks become summary bars over their children, milestones are diamonds, and arrows join dependent tasks. Use it to plan and follow projects. For a list of dated events without durations, use a Timeline. For data without dates, use a Data grid.",
    html: `<!-- Load once per page: the styles and the script -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${htmlGantt()}`,
    react: reactGantt("BudgetPlan"),
  },
  {
    id: "tasks",
    title: "Describe the tasks",
    body: 'Each task has an `id`, a `name`, a `startTime` and an `endTime`. Dates are ISO dates such as `2025-03-03`, and the end day is part of the task. `progress` is a percentage from 0 to 100. A task without an `endTime`, or with `type: "milestone"`, is a milestone on its start date. A task with a `parentId` is a child of that task. Parents take their dates and progress from their children, so they need no dates of their own. `color` paints a bar in a palette color, such as `info` or `warning`. In HTML, the tasks are the rows of a table. Each header cell names its field with `data-ok-gantt-field`. Each row carries `data-ok-task-id` and, when needed, `data-ok-parent-id`, `data-ok-type` and `data-ok-color`. A cell can keep its raw value in `data-ok-value`, so its text stays readable, such as a short date. Without JavaScript, the table is what the page shows. The script draws the chart and hides the table.',
    html: htmlGantt(),
    react: reactGantt("TaskData"),
  },
  {
    id: "dependencies",
    title: "Link dependent tasks",
    body: "`dependency` names the task that must come first, the predecessor. A plain id means finish to start: the task starts after its predecessor ends. For other types, pass an object `{ taskId, type, lag }`, where `type` is `FS` (finish to start), `SS` (start to start), `FF` (finish to finish) or `SF` (start to finish), and `lag` is a number of days (negative for a lead). Pass a list for several predecessors. In HTML, the dependency cell holds the same data as text, such as `scope, design:SS+2`. Arrows show each dependency, and every bar's accessible name lists its predecessors.",
    html: `<td>scope, design:SS+2, review:FF-1</td>`,
    react: `import { Gantt, type GanttTask } from "@owlky/react";

const tasks: GanttTask[] = [
  { id: "design", name: "Design", startTime: "2025-03-03", endTime: "2025-03-07" },
  { id: "build", name: "Build", startTime: "2025-03-05", endTime: "2025-03-14", dependency: { taskId: "design", type: "SS", lag: 2 } },
];

export function Dependencies() {
  return <Gantt label="Dependencies" tasks={tasks} view="day" />;
}`,
  },
  {
    id: "zoom",
    title: "Zoom the timeline",
    body: "`view` picks a zoom: `day`, `week` (the default), `month`, `quarter` or `year`. The header shows two rows of dates that follow the zoom, such as months over days or years over quarters. For any other zoom, set `pixelsPerDay`, the width of one day in pixels, from 0.25 to 120. Set `toolbar` to add zoom out and zoom in buttons. They change the zoom by steps of 1.4. In React, the zoom is state: pass `pixelsPerDay` and `onZoomChange` to control it. In HTML, the buttons write `data-ok-pixels-per-day` on the root. The timeline starts one unit before the first task and ends one unit after the last one.",
    html: htmlGantt('data-ok-view="month" data-ok-bar-label="right" data-ok-toolbar'),
    react: reactGantt("ZoomedPlan", ' view="month" toolbar'),
  },
  {
    id: "calendar",
    title: "Show working days and today",
    body: 'At day and week zoom, the timeline shades the days nobody works. `workingWeekdays` lists the working days, where 0 is Sunday (Monday to Friday by default), and `holidays` lists extra days off. Turn the shading off with `showNonWorkingDays={false}` (`data-ok-show-non-working-days="false"` in HTML). A line marks today. Set `today` to another date, for example to show a plan as it was, or hide the line with `showToday={false}`. `weekStart` sets the first day of the weeks in the header.',
    html: htmlGantt(
      'data-ok-view="day" data-ok-bar-label="right" data-ok-working-weekdays="1 2 3 4" data-ok-holidays="2025-03-10" data-ok-today="2025-03-07"',
    ),
    react: reactGantt(
      "FourDayWeek",
      ' view="day" workingWeekdays={[1, 2, 3, 4]} holidays={["2025-03-10"]} today="2025-03-07"',
    ),
  },
  {
    id: "analysis",
    title: "Compare plans and find the critical path",
    body: "Set `baseline` to draw each task's planned dates, its `baseline: { start, end }`, as a thin bar under the actual one. The gap shows how far a task moved. Set `criticalPath` to color the tasks and arrows that have no slack in the error color: a delay on any of them delays the whole project. The bars' accessible names say so too. Set `projectBoundary` to draw dashed lines on the project's first and last days.",
    html: htmlGantt(
      'data-ok-view="week" data-ok-bar-label="right" data-ok-critical-path data-ok-project-boundary',
    ),
    react: reactGantt("CriticalPlan", " criticalPath projectBoundary"),
  },
  {
    id: "selection",
    title: "Select tasks",
    body: "Set `selection` to let people select rows: a click selects one row, Ctrl or Cmd and a click adds or removes a row, Shift and a click selects a range, Space toggles the focused row and Ctrl + A selects every row. In React, pass `selected` and `onSelectionChange` to control the selection, or `defaultSelected` for a starting one. In HTML, the selection is `data-ok-selected` on the table rows, and `ok:gantt:selectionchange` reports each change.",
    html: `${htmlGantt('data-ok-view="week" data-ok-bar-label="right" data-ok-selection')}
<script>
  document.querySelector("[data-ok-gantt]").addEventListener("ok:gantt:selectionchange", (event) => {
    console.log(event.detail.selected);
  });
</script>`,
    react: `import { Gantt, type GanttTask } from "@owlky/react";
import { useState } from "react";

${TASKS_SOURCE}

export function SelectablePlan() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <Gantt label="Budget plan" tasks={tasks} selection selected={selected} onSelectionChange={setSelected} />
  );
}`,
  },
  {
    id: "layout",
    title: "Choose columns and labels",
    body: "`columns` picks the task-list columns from `name`, `startTime`, `endTime`, `duration` and `progress`. The name always comes first. `tasksContainerWidth` sets the width of the task list (440px by default): the name column takes the space the other columns leave. On screens, or containers, narrower than 600px, only the name column shows, and the timeline scrolls sideways inside the chart. `barLabel` places the task names: `right` of the bars (the default), `left` of them, `inside` them, or `auto`, inside when the name fits. `rowHeight` and `barMargin` set the size of rows and bars.",
    html: htmlGantt(
      'data-ok-view="week" data-ok-bar-label="auto" data-ok-columns="name startTime endTime" data-ok-row-height="48"',
    ),
    react: reactGantt(
      "CompactPlan",
      ' barLabel="auto" columns={["name", "startTime", "endTime"]} rowHeight={48}',
    ),
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the data, the dates and the texts. They aren't options, because HTML writes them as markup or text attributes.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:gantt:toggle\`** (cancelable) fires when a parent row asks to expand or collapse, with \`detail.id\`, \`detail.expanded\` and \`detail.collapsed\` (every collapsed id). Call \`preventDefault()\` to keep the row as it is.
- **\`ok:gantt:selectionchange\`** (cancelable) fires with \`detail.selected\` and \`detail.mode\` (\`replace\`, \`toggle\`, \`range\` or \`all\`).
- **\`ok:gantt:zoom\`** (cancelable) fires with \`detail.pixelsPerDay\` when a zoom button is selected.
- **Instance:** \`runtime.get(element, "gantt")\` returns \`{ tasks, collapsed, setCollapsed(ids), selected, setSelected(ids), pixelsPerDay, zoomIn(), zoomOut(), scrollToTask(id), setLocaleText(text), refresh() }\`. The methods don't fire events. The chart redraws by itself when the table or an option changes.
- **React:** \`onCollapsedChange(ids)\`, \`onSelectionChange(ids, mode)\` and \`onZoomChange(pixelsPerDay)\`. Pass \`collapsed\`, \`selected\` or \`pixelsPerDay\` to control that state, or \`defaultCollapsed\`, \`defaultSelected\` or \`defaultPixelsPerDay\` for its first value.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The chart is one tab stop: the row you last used. The arrow keys move between rows and through the tree. A tooltip shows the focused task's dates and progress.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Give every chart a \`label\` (React) or a table \`caption\` (HTML). It names the grid and the data table.
- The chart is a tree grid: screen readers announce each row's level, its position among its siblings and whether it is expanded or selected.
- Each bar has an accessible name with the task's dates, progress, planned dates, critical path and predecessors. The drawing behind the rows is hidden from assistive technologies.
- The tooltip shows on keyboard focus as well as on hover, stays while you hover it and closes with Escape.
- Color is never the only cue: milestones are diamonds, and critical tasks are named as such.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Gantt label="Budget plan" tasks={TASKS} today="2025-03-07" />
    </Preview>
  ),
  dependencies: () => (
    <Preview>
      <Gantt
        label="Dependencies"
        view="day"
        today="2025-03-07"
        tasks={[
          { id: "design", name: "Design", startTime: "2025-03-03", endTime: "2025-03-07" },
          {
            id: "build",
            name: "Build",
            startTime: "2025-03-05",
            endTime: "2025-03-14",
            dependency: { taskId: "design", type: "SS", lag: 2 },
          },
        ]}
      />
    </Preview>
  ),
  zoom: () => (
    <Preview>
      <Gantt
        label="Budget plan, month view"
        tasks={TASKS}
        view="month"
        toolbar
        today="2025-03-07"
      />
    </Preview>
  ),
  calendar: () => (
    <Preview>
      <Gantt
        label="Budget plan, four-day week"
        tasks={TASKS}
        view="day"
        workingWeekdays={[1, 2, 3, 4]}
        holidays={["2025-03-10"]}
        today="2025-03-07"
      />
    </Preview>
  ),
  analysis: () => (
    <Preview>
      <Gantt
        label="Budget plan, critical path"
        tasks={TASKS}
        criticalPath
        projectBoundary
        today="2025-03-07"
      />
    </Preview>
  ),
  layout: () => (
    <Preview>
      <Gantt
        label="Budget plan, compact"
        tasks={TASKS}
        barLabel="auto"
        columns={["name", "startTime", "endTime"]}
        rowHeight={48}
        today="2025-03-07"
      />
    </Preview>
  ),
  options: () => <OptionsTable schema={ganttOptions} />,
  props: () => (
    <PropsTable
      label="Gantt content"
      rows={[
        {
          react: "tasks",
          html: "table[data-ok-gantt-data] rows",
          type: "GanttTask[]",
          description:
            "The tasks: id, name, startTime, endTime, progress, type, parentId, dependency, color, collapsed and baseline.",
        },
        {
          react: "label",
          html: "caption",
          type: "string",
          description: "Accessible name of the chart and the caption of its data table.",
        },
        {
          react: "columns",
          html: "data-ok-columns",
          type: "GanttColumnKey[]",
          description: "Task-list columns: name, startTime, endTime, duration and progress.",
        },
        {
          react: "today",
          html: "data-ok-today",
          type: "string | Date",
          description: "The date of the today line (the current day by default).",
        },
        {
          react: "locale",
          html: "data-ok-locale",
          type: "string",
          description: "Language of the dates, such as en-GB (en-US by default).",
        },
        {
          react: "workingWeekdays",
          html: "data-ok-working-weekdays",
          type: "number[]",
          description: "Working days, 0 for Sunday (Monday to Friday by default).",
        },
        {
          react: "holidays",
          html: "data-ok-holidays",
          type: "(string | Date)[]",
          description: "Extra days off, shaded at day and week zoom.",
        },
        {
          react: "localeText",
          html: "setLocaleText()",
          type: "Partial<GanttLocaleText>",
          description: "Texts: column titles, units, accessible names and button labels.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus into the chart, to the last used row, and out of it."],
        ["Down arrow / Up arrow", "Moves to the next or previous row."],
        ["Page Down / Page Up", "Moves 10 rows down or up."],
        ["Home / End", "Moves to the first or last row."],
        ["Right arrow", "Expands a collapsed parent, or moves to its first child."],
        ["Left arrow", "Collapses an expanded parent, or moves to the parent row."],
        ["Enter", "Expands or collapses a parent row."],
        ["Space", "Selects or clears the focused row (with selection)."],
        [
          "Shift + arrows, Page Up, Page Down, Home, End",
          "Extends the selection (with selection).",
        ],
        ["Ctrl + A / Cmd + A", "Selects every row (with selection)."],
        ["Escape", "Closes the tooltip."],
      ]}
    />
  ),
};

/** Gantt docs page (ADR-0019). */
export function GanttDocs() {
  return <GuideDocs sections={ganttSections} previews={PREVIEWS} />;
}
