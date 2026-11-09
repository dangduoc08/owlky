"use client";

import {
  createGanttController,
  type GanttBarLabel,
  type GanttChangeSource,
  type GanttColumnKey,
  type GanttController,
  type GanttItem,
  type GanttLocaleText,
  type GanttNode,
  type GanttSelectionMode,
  type GanttTask,
  type GanttTaskChange,
  type GanttView,
  ganttAttributes,
  ganttDensity,
  ganttEditTask,
  ganttInitialCollapsed,
  ganttLocaleText,
  ganttModel,
  ganttRenderOptions,
  ganttShortDate,
  ganttTable,
  ganttTextAttributes,
  ganttTooltip,
  ganttZoom,
  renderGantt,
} from "@owlky/core";
import {
  type CSSProperties,
  createElement,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

export interface GanttProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange" | "onSelect"> {
  /** The tasks: ids, names, ISO dates, progress, parents and dependencies. */
  tasks: readonly GanttTask[];
  /** Accessible name of the Gantt and the caption of its data table. */
  label: string;
  /** Zoom preset (`week`). */
  view?: GanttView | undefined;
  /** Zoom in px per day (controlled); the zoom buttons report changes through `onZoomChange`. */
  pixelsPerDay?: number | undefined;
  defaultPixelsPerDay?: number | undefined;
  onZoomChange?: ((pixelsPerDay: number) => void) | undefined;
  rowHeight?: number | undefined;
  barMargin?: number | undefined;
  tasksContainerWidth?: number | undefined;
  barLabel?: GanttBarLabel | undefined;
  weekStart?: number | undefined;
  showToday?: boolean | undefined;
  showNonWorkingDays?: boolean | undefined;
  columnLines?: boolean | undefined;
  criticalPath?: boolean | undefined;
  baseline?: boolean | undefined;
  projectBoundary?: boolean | undefined;
  toolbar?: boolean | undefined;
  selection?: boolean | undefined;
  disableTooltip?: boolean | undefined;
  /** Tasks can be edited by pointer and keyboard; the changes come through `onTaskChange`. */
  editable?: boolean | undefined;
  taskDrag?: boolean | undefined;
  taskResize?: boolean | undefined;
  progressDrag?: boolean | undefined;
  /** An edit asks to change a task: update `tasks` to accept it. */
  onTaskChange?:
    | ((id: string, change: GanttTaskChange, source: GanttChangeSource) => void)
    | undefined;
  /** A double click, a double tap or F2 asks to edit a task in your own form. */
  onTaskEdit?: ((id: string) => void) | undefined;
  /** Task-list columns (`name`, `startTime`, `endTime`, `duration`, `progress`). */
  columns?: readonly GanttColumnKey[] | undefined;
  /** The today line's day (default the current day). */
  today?: string | Date | undefined;
  /** BCP 47 locale of dates (`en-US`). */
  locale?: string | undefined;
  /** Working weekdays, 0 = Sunday (Monday to Friday). */
  workingWeekdays?: readonly number[] | undefined;
  /** Non-working days (ISO dates). */
  holidays?: readonly (string | Date)[] | undefined;
  /** Collapsed parent ids (controlled). */
  collapsed?: readonly string[] | undefined;
  /** Initially collapsed parents (default: tasks with `collapsed`). */
  defaultCollapsed?: readonly string[] | undefined;
  onCollapsedChange?: ((ids: string[]) => void) | undefined;
  /** Selected task ids (controlled; needs `selection`). */
  selected?: readonly string[] | undefined;
  defaultSelected?: readonly string[] | undefined;
  onSelectionChange?: ((ids: string[], mode: GanttSelectionMode) => void) | undefined;
  /** Texts: column titles, units, accessible names. */
  localeText?: Partial<GanttLocaleText> | undefined;
}

const NONE: readonly string[] = [];
const ATTRIBUTE_NAMES: Record<string, string> = {
  tabindex: "tabIndex",
  viewBox: "viewBox",
};
const PRESERVED = /^(data-|aria-)/;
const reactName = (name: string) =>
  ATTRIBUTE_NAMES[name] ??
  (PRESERVED.test(name) ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));

/** Core nodes → React elements (the HTML runtime builds the same nodes with DOM methods). */
function toElements(nodes: readonly GanttNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    const props: Record<string, unknown> = { key: node.key ?? index };
    for (const [name, value] of Object.entries(node.attrs)) props[reactName(name)] = value;
    if (node.style) props["style"] = node.style as CSSProperties;
    return createElement(
      node.tag,
      props,
      node.text ?? (node.children ? toElements(node.children) : undefined),
    );
  });
}

/**
 * Gantt — spec: specs/components/gantt.md (ADR-0048). A task list and a timeline in one treegrid:
 * scales from days to years, summary tasks, milestones, dependencies, baselines, the critical
 * path, selection and tooltips. The data is also a table (hidden once drawn) like the HTML form.
 */
export const Gantt = forwardRef<HTMLDivElement, GanttProps>(function Gantt(
  {
    tasks,
    label,
    view,
    pixelsPerDay,
    defaultPixelsPerDay,
    onZoomChange,
    rowHeight,
    barMargin,
    tasksContainerWidth,
    barLabel,
    weekStart,
    showToday,
    showNonWorkingDays,
    columnLines,
    criticalPath,
    baseline,
    projectBoundary,
    toolbar,
    selection,
    disableTooltip,
    editable,
    taskDrag,
    taskResize,
    progressDrag,
    onTaskChange,
    onTaskEdit,
    columns,
    today,
    locale,
    workingWeekdays,
    holidays,
    collapsed,
    defaultCollapsed,
    onCollapsedChange,
    selected,
    defaultSelected,
    onSelectionChange,
    localeText,
    ...rest
  },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ref = useMergedRefs(rootRef, forwardedRef);
  const model = useMemo(() => ganttModel(tasks), [tasks]);
  const text = useMemo(() => ganttLocaleText(localeText), [localeText]);
  const [density, setDensity] = useControllableState<number | undefined>({
    value: pixelsPerDay,
    defaultValue: defaultPixelsPerDay,
    onChange: (value) => value !== undefined && onZoomChange?.(value),
  });
  const [collapsedIds, setCollapsed] = useControllableState<readonly string[]>({
    value: collapsed,
    defaultValue: defaultCollapsed ?? ganttInitialCollapsed(model),
    onChange: (ids) => onCollapsedChange?.([...ids]),
  });
  const [selectedIds, setSelected] = useControllableState<readonly string[]>({
    value: selected,
    defaultValue: defaultSelected ?? NONE,
    onChange: (ids) => onSelectionChange?.([...ids], selectionMode.current),
  });
  const selectionMode = useRef<GanttSelectionMode>("replace");
  const [active, setActive] = useState<string | undefined>(undefined);

  const values = {
    view,
    pixelsPerDay: density,
    rowHeight,
    barMargin,
    tasksContainerWidth,
    barLabel,
    weekStart,
    showToday,
    showNonWorkingDays,
    columnLines,
    criticalPath,
    baseline,
    projectBoundary,
    toolbar,
    selection,
    editable,
    taskDrag,
    taskResize,
    progressDrag,
    columns,
    today,
    locale,
    workingWeekdays,
    holidays,
  };
  const resolved = ganttRenderOptions(values);
  const collapsedSet = useMemo(() => new Set(collapsedIds), [collapsedIds]);
  const selectedSet = useMemo(
    () => new Set(selection ? selectedIds : NONE),
    [selectedIds, selection],
  );
  const layout = renderGantt(model, {
    ...resolved,
    label,
    collapsed: collapsedSet,
    selected: selectedSet,
    active,
    text,
  });
  const table = ganttTable(tasks, {
    text,
    locale: resolved.locale,
    collapsed: collapsedSet,
    selected: selectedSet,
  });

  // The controller reads the latest values through this ref.
  const latest = useRef({
    model,
    text,
    resolved,
    collapsedIds,
    setCollapsed,
    setSelected,
    setDensity,
  });
  latest.current = { model, text, resolved, collapsedIds, setCollapsed, setSelected, setDensity };
  const edits = useRef({ onTaskChange, onTaskEdit });
  edits.current = { onTaskChange, onTaskEdit };
  const controller = useRef<GanttController | null>(null);
  useLayoutEffect(() => {
    const root = rootRef.current as HTMLDivElement;
    controller.current = createGanttController(root, {
      onActiveChange: (id) => setActive(id),
      onToggle: (id, expanded) => {
        const { collapsedIds: ids, setCollapsed: set } = latest.current;
        set(expanded ? ids.filter((x) => x !== id) : [...ids, id]);
      },
      onSelectionChange: (ids, mode) => {
        selectionMode.current = mode;
        latest.current.setSelected(ids);
      },
      onZoom: (direction) => {
        const { resolved: now, setDensity: set } = latest.current;
        set(ganttZoom(now.density, direction));
      },
      // Rows come from the rendered model: every id is known.
      tooltip: (id) => {
        const { model: m, text: t, resolved: r } = latest.current;
        return ganttTooltip(m.byId.get(id) as GanttItem, t, r.locale);
      },
      task: (id) => ganttEditTask(latest.current.model, id, latest.current.resolved.density),
      onTaskChange: (id, change, source) => edits.current.onTaskChange?.(id, change, source),
      onTaskEdit: (id) => edits.current.onTaskEdit?.(id),
      editText: () => latest.current.text,
      formatDay: (day) => ganttShortDate(day, latest.current.resolved.locale),
    });
    return () => {
      controller.current?.destroy();
      controller.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    controller.current?.sync();
  });

  const attributes: Record<string, string> = {
    ...ganttAttributes({
      view,
      pixelsPerDay: density === undefined ? undefined : ganttDensity(density, view),
      rowHeight,
      barMargin,
      tasksContainerWidth,
      barLabel,
      weekStart,
      criticalPath,
      baseline,
      projectBoundary,
      toolbar,
      selection,
      disableTooltip,
      editable,
    }),
    ...ganttTextAttributes(values),
  };
  if (showToday === false) attributes["data-ok-show-today"] = "false";
  if (showNonWorkingDays === false) attributes["data-ok-show-non-working-days"] = "false";
  if (columnLines === false) attributes["data-ok-column-lines"] = "false";
  if (taskDrag === false) attributes["data-ok-task-drag"] = "false";
  if (taskResize === false) attributes["data-ok-task-resize"] = "false";
  if (progressDrag === false) attributes["data-ok-progress-drag"] = "false";

  return (
    <div {...rest} ref={ref} {...attributes} data-ok-ready="" data-ok-runtime="off">
      <table data-ok-gantt-data="">
        <caption>{label}</caption>
        <thead>
          <tr>
            {table.fields.map((field, index) => (
              <th key={field} scope="col" data-ok-gantt-field={field}>
                {table.headers[index]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.attrs["data-ok-task-id"]} {...row.attrs}>
              {row.cells.map((cell, index) => (
                <td key={table.fields[index]} data-ok-value={cell.value}>
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {toElements(layout.nodes)}
      <div data-ok-gantt-tooltip="" aria-hidden="true" hidden />
      <div data-ok-gantt-status="" role="status" />
    </div>
  );
});
