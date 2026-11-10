import {
  createGanttController,
  exportGantt,
  GANTT_TEXT_ATTRIBUTES,
  type GanttBarLabel,
  type GanttChangeSource,
  type GanttColumnKey,
  type GanttExportFormat,
  type GanttItem,
  type GanttLayout,
  type GanttLocaleText,
  type GanttNode,
  type GanttRenderOptions,
  type GanttSelectionMode,
  type GanttTask,
  type GanttTaskChange,
  type GanttView,
  ganttDay,
  ganttEditTask,
  ganttLocaleText,
  ganttModel,
  ganttOptions,
  ganttRenderOptions,
  ganttRowWindow,
  ganttShortDate,
  ganttTableIds,
  ganttTooltip,
  ganttVisibleItems,
  ganttZoom,
  readBehavior,
  readGanttTable,
  readNumber,
  readStyle,
  renderGantt,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface GanttEvents {
  /** Before a summary task expands or collapses. Call `preventDefault()` to refuse. */
  toggle: EventSpec<{ id: string; expanded: boolean; collapsed: string[] }, true>;
  /** Before the selection changes. Call `preventDefault()` to keep the current one. */
  selectionchange: EventSpec<{ selected: string[]; mode: string }, true>;
  /** Before the zoom level changes. Call `preventDefault()` to keep it. */
  zoom: EventSpec<{ pixelsPerDay: number }, true>;
  /** Before an edit changes a task's dates or progress. Call `preventDefault()` to refuse it. */
  taskchange: EventSpec<{ id: string; change: GanttTaskChange; source: GanttChangeSource }, true>;
  /** Asks the owner to open its own edit form for the task (double click, double tap or F2). */
  edit: EventSpec<{ id: string }>;
}

export interface GanttInstance extends ComponentInstance {
  /** The tasks read from the data table. */
  readonly tasks: readonly GanttTask[];
  /** Collapsed parent ids (`data-ok-collapsed` on their table rows). */
  readonly collapsed: readonly string[];
  /** Collapses exactly these parents (no event). */
  setCollapsed(ids: readonly string[]): void;
  /** Selected task ids (`data-ok-selected` on their table rows). */
  readonly selected: readonly string[];
  /** Selects exactly these tasks (no event). */
  setSelected(ids: readonly string[]): void;
  /** The zoom in px per day. */
  readonly pixelsPerDay: number;
  /** One zoom step in or out (no event). */
  zoomIn(): void;
  /** Zooms out one level. */
  zoomOut(): void;
  /** Scrolls a task's row and bar into view; `false` for an unknown or hidden task. */
  scrollToTask(id: string): boolean;
  /** Replaces texts: column titles, units, accessible names. Redraws. */
  setLocaleText(text: Partial<GanttLocaleText>): void;
  /** Reads the table and the options again and redraws (done automatically on changes). */
  refresh(): void;
  /** Writes a change into the task's table row and redraws (no event), as your edit form saves. */
  updateTask(id: string, change: GanttTaskChange): void;
  /** Downloads the chart (every row) as SVG, PNG or CSV; only during a user gesture. */
  exportChart(format?: GanttExportFormat): Promise<void>;
}

const SVG = "http://www.w3.org/2000/svg";
const o = ganttOptions.options;
/** Root attributes that change the drawing (not the runtime's own `data-ok-ready`). */
const OPTION_ATTRIBUTES = [
  ...Object.values(o)
    .map((spec) => spec.attr)
    .filter(
      (attr) =>
        attr.startsWith("data-ok-") && attr !== o.collapsed.attr && attr !== o.selected.attr,
    ),
  ...Object.values(GANTT_TEXT_ATTRIBUTES),
  "aria-label",
];
/** Keys of built elements (rows: task ids), so rows keep their identity (and focus) on redraws. */
const keys = new WeakMap<Element, string>();

/** One core node → an element (attributes, CSSOM properties and text only: never markup). */
function build(node: GanttNode, svg: boolean): Element {
  const inSvg = svg || node.tag === "svg";
  const element = inSvg
    ? document.createElementNS(SVG, node.tag)
    : document.createElement(node.tag);
  update(element, node, inSvg);
  return element;
}

function update(element: Element, node: GanttNode, svg: boolean) {
  for (const { name } of [...element.attributes])
    if (name !== "style" && !Object.hasOwn(node.attrs, name)) element.removeAttribute(name);
  for (const [name, value] of Object.entries(node.attrs))
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  const style = (element as HTMLElement | SVGElement).style;
  const wanted = node.style ?? {};
  for (const name of [...style]) if (!Object.hasOwn(wanted, name)) style.removeProperty(name);
  for (const [name, value] of Object.entries(wanted))
    if (style.getPropertyValue(name) !== value) style.setProperty(name, value);
  if (node.key !== undefined) keys.set(element, node.key);
  if (node.text !== undefined) {
    if (element.textContent !== node.text || element.children.length)
      element.textContent = node.text;
  } else patch(element, node.children ?? [], svg);
}

/** Makes `parent`'s children match `nodes` in place (keyed nodes keep their element). */
function patch(parent: Element, nodes: readonly GanttNode[], svg: boolean) {
  const byKey = new Map<string, Element>();
  for (const child of parent.children) {
    const key = keys.get(child);
    if (key !== undefined) byKey.set(key, child);
  }
  nodes.forEach((node, index) => {
    const current = parent.children[index];
    let element: Element | undefined =
      node.key !== undefined
        ? byKey.get(node.key)
        : current && keys.get(current) === undefined
          ? current
          : undefined;
    if (element && element.localName !== node.tag) element = undefined;
    if (element) update(element, node, svg || node.tag === "svg");
    else element = build(node, svg);
    if (parent.children[index] !== element)
      parent.insertBefore(element, parent.children[index] ?? null);
  });
  while (parent.children.length > nodes.length) (parent.lastElementChild as Element).remove();
}

/**
 * Gantt — spec: specs/components/gantt.md (ADR-0048)
 *
 * Markup:  <div data-ok-gantt data-ok-view="week" data-ok-today="2025-03-10">
 *            <table data-ok-gantt-data>
 *              <caption>Office move</caption>
 *              <thead><tr><th data-ok-gantt-field="name">Task</th>
 *                <th data-ok-gantt-field="startTime">Start</th>…</tr></thead>
 *              <tbody><tr data-ok-task-id="plan"><td>Plan</td>
 *                <td data-ok-value="2025-03-03">Mar 3, 2025</td>…</tr></tbody>
 *            </table>
 *          </div>
 * The runtime reads the table, draws the treegrid next to it (the same nodes React renders) and
 * hides the table. Collapse, selection and zoom are cancelable events (`ok:gantt:toggle`,
 * `ok:gantt:selectionchange`, `ok:gantt:zoom`); the runtime then writes the state into the table
 * rows (`data-ok-collapsed`, `data-ok-selected`) or the root (`data-ok-pixels-per-day`).
 */
export const gantt = defineComponent<GanttInstance, GanttEvents>({
  name: "gantt",
  selector: "[data-ok-gantt]",

  setup(element, { emit, signal }) {
    const table = () =>
      element.querySelector<HTMLTableElement>(":scope > table[data-ok-gantt-data]");
    let built: Element[] = [];
    let active: string | undefined;
    let localeText: Partial<GanttLocaleText> = {};
    // Virtualization: the scroll position and the scroll area's height (0 until measured).
    let scroll = { top: 0, height: 0 };
    let follow = false;
    let full: GanttRenderOptions | undefined;
    let visibleIds: { id: string; level: number }[] = [];
    let current = { model: ganttModel([]), text: ganttLocaleText(), density: 16, locale: "en-US" };
    const tooltip = document.createElement("div");
    tooltip.setAttribute("data-ok-gantt-tooltip", "");
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.hidden = true;
    const status = document.createElement("div");
    status.setAttribute("data-ok-gantt-status", "");
    status.setAttribute("role", "status");

    const values = () => {
      const text = (name: string) => element.getAttribute(name) ?? undefined;
      const numberOf = (spec: (typeof o)["rowHeight"]) =>
        readNumber(element, spec) as number | undefined;
      return {
        view: readStyle(element, o.view) as GanttView,
        pixelsPerDay: numberOf(o.pixelsPerDay),
        rowHeight: numberOf(o.rowHeight),
        barMargin: numberOf(o.barMargin),
        tasksContainerWidth: numberOf(o.tasksContainerWidth),
        barLabel: readStyle(element, o.barLabel) as GanttBarLabel,
        weekStart: numberOf(o.weekStart),
        showToday: readBehavior(element, o.showToday),
        showNonWorkingDays: readBehavior(element, o.showNonWorkingDays),
        columnLines: readBehavior(element, o.columnLines),
        criticalPath: element.hasAttribute(o.criticalPath.attr),
        baseline: element.hasAttribute(o.baseline.attr),
        projectBoundary: element.hasAttribute(o.projectBoundary.attr),
        toolbar: element.hasAttribute(o.toolbar.attr),
        selection: element.hasAttribute(o.selection.attr),
        editable: element.hasAttribute(o.editable.attr),
        taskDrag: readBehavior(element, o.taskDrag),
        taskResize: readBehavior(element, o.taskResize),
        progressDrag: readBehavior(element, o.progressDrag),
        height: numberOf(o.height),
        exportFormat: readStyle(element, o.exportFormat) as GanttExportFormat,
        disableExport: element.hasAttribute(o.disableExport.attr),
        columns: text(GANTT_TEXT_ATTRIBUTES.columns) as GanttColumnKey[] | string | undefined,
        today: text(GANTT_TEXT_ATTRIBUTES.today),
        locale: text(GANTT_TEXT_ATTRIBUTES.locale),
        workingWeekdays: text(GANTT_TEXT_ATTRIBUTES.workingWeekdays),
        holidays: text(GANTT_TEXT_ATTRIBUTES.holidays),
      };
    };

    const draw = () => {
      const data = table();
      const tasks = data ? readGanttTable(data) : [];
      const model = ganttModel(tasks);
      const resolved = ganttRenderOptions(values());
      const text = ganttLocaleText(localeText);
      current = { model, text, density: resolved.density, locale: resolved.locale };
      const label =
        data?.caption?.textContent?.trim() || element.getAttribute("aria-label") || "Gantt";
      const collapsed = new Set(data ? ganttTableIds(data, "data-ok-collapsed") : []);
      const visible = ganttVisibleItems(model, collapsed);
      visibleIds = visible.map((item) => ({ id: item.id, level: item.level }));
      full = {
        ...resolved,
        label,
        collapsed,
        selected: new Set(
          resolved.selection && data ? ganttTableIds(data, "data-ok-selected") : [],
        ),
        active,
        text,
      };
      const windowed =
        resolved.height !== undefined && !element.hasAttribute(o.disableVirtualization.attr);
      const layout = renderGantt(model, {
        ...full,
        window: windowed
          ? ganttRowWindow({
              scrollTop: scroll.top,
              height: scroll.height || (resolved.height as number),
              rowHeight: resolved.rowHeight,
              total: visible.length,
              // The keyboard's row stays rendered until the page scrolls on its own.
              active: follow ? visible.findIndex((item) => item.id === active) : undefined,
            })
          : undefined,
      });
      active = layout.active;
      // Root children: the table (the page's), the built nodes, the tooltip.
      const byKey = new Map(built.map((el) => [keys.get(el), el]));
      const next = layout.nodes.map((node) => {
        const reuse = byKey.get(node.key);
        if (reuse && reuse.localName === node.tag) {
          update(reuse, node, false);
          byKey.delete(node.key);
          return reuse;
        }
        return build(node, false);
      });
      for (const stale of byKey.values()) stale?.remove();
      if (tooltip.parentElement !== element) element.append(tooltip);
      if (status.parentElement !== element) element.append(status);
      // Move only what is out of place: moving a node blurs it and cancels a click on it.
      for (let i = next.length - 1; i >= 0; i--) {
        const el = next[i] as Element;
        const after = next[i + 1] ?? tooltip;
        if (el.nextElementSibling !== after) element.insertBefore(el, after);
      }
      built = next;
      element.setAttribute("data-ok-ready", "");
      changes.takeRecords();
      controller.sync();
    };

    /** Writes a change into the task's table row (dates as `data-ok-value` + short text). */
    const writeTask = (id: string, change: GanttTaskChange) => {
      const data = table();
      const row = [
        ...(data?.querySelectorAll<HTMLTableRowElement>("tbody > tr[data-ok-task-id]") ?? []),
      ].find((tr) => tr.getAttribute("data-ok-task-id") === id);
      const head = data?.tHead?.rows[0];
      if (!row || !head) return;
      const cellOf = (field: string) => {
        const index = [...head.cells].findIndex(
          (th) => th.getAttribute("data-ok-gantt-field") === field,
        );
        return index < 0 ? undefined : row.cells[index];
      };
      const date = (field: string, value: string | undefined) => {
        const cell = cellOf(field);
        if (!cell || value === undefined) return;
        cell.setAttribute("data-ok-value", value);
        cell.textContent = ganttShortDate(ganttDay(value) as number, current.locale);
      };
      date("startTime", change.startTime);
      date("endTime", change.endTime);
      const progress = cellOf("progress");
      if (progress && change.progress !== undefined) {
        progress.setAttribute("data-ok-value", String(change.progress));
        progress.textContent = `${change.progress}%`;
      }
    };

    /** Writes `attribute` on exactly the table rows of `ids`. */
    const markRows = (attribute: string, ids: readonly string[]) => {
      const wanted = new Set(ids);
      for (const row of table()?.querySelectorAll<HTMLTableRowElement>(
        "tbody > tr[data-ok-task-id]",
      ) ?? [])
        row.toggleAttribute(attribute, wanted.has(row.getAttribute("data-ok-task-id") as string));
    };
    const ids = (attribute: string) => {
      const data = table();
      return data ? ganttTableIds(data, attribute) : [];
    };
    const zoom = (direction: 1 | -1) =>
      element.setAttribute(o.pixelsPerDay.attr, String(ganttZoom(current.density, direction)));

    const controller = createGanttController(element, {
      onActiveChange(id) {
        active = id;
        follow = true;
        draw();
      },
      onToggle(id, expanded) {
        const collapsed = expanded
          ? ids("data-ok-collapsed").filter((x) => x !== id)
          : [...ids("data-ok-collapsed"), id];
        if (!emit("toggle", { id, expanded, collapsed }, { cancelable: true })) return;
        markRows("data-ok-collapsed", collapsed);
        draw();
      },
      onSelectionChange(selected, mode: GanttSelectionMode) {
        if (!emit("selectionchange", { selected, mode }, { cancelable: true })) return;
        markRows("data-ok-selected", selected);
        draw();
      },
      onZoom(direction) {
        const pixelsPerDay = ganttZoom(current.density, direction);
        if (pixelsPerDay === current.density) return;
        if (!emit("zoom", { pixelsPerDay }, { cancelable: true })) return;
        zoom(direction);
        draw();
      },
      // Rows come from the current model: every id is known.
      tooltip: (id) =>
        ganttTooltip(current.model.byId.get(id) as GanttItem, current.text, current.locale),
      task: (id) => ganttEditTask(current.model, id, current.density),
      onTaskChange(id, change, source) {
        if (!emit("taskchange", { id, change, source }, { cancelable: true })) return;
        writeTask(id, change);
        draw();
      },
      onTaskEdit(id) {
        emit("edit", { id });
      },
      editText: () => current.text,
      rowList: () => visibleIds,
      selection: () => ids("data-ok-selected"),
      onExport() {
        exportChart().catch(() => {});
      },
      formatDay: (day) => ganttShortDate(day, current.locale),
    });

    // Redraw on data and option changes (the runtime's own writes are taken back in `draw`).
    /** The whole chart (no row window) for downloads. */
    function exportChart(
      format = (full as GanttRenderOptions).exportFormat as GanttExportFormat,
    ): Promise<void> {
      const layout: GanttLayout = renderGantt(current.model, {
        ...(full as GanttRenderOptions),
        window: undefined,
      });
      return exportGantt(element, layout, format);
    }
    let frame = 0;
    element.addEventListener(
      "scroll",
      (event) => {
        const target = event.target as HTMLElement;
        if (!target.matches?.("[data-ok-gantt-viewport]") || full?.height === undefined) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          scroll = { top: target.scrollTop, height: target.clientHeight };
          follow = false;
          draw();
        });
      },
      { capture: true, signal },
    );
    signal.addEventListener("abort", () => cancelAnimationFrame(frame));

    const changes = new MutationObserver(() => draw());
    const observe = () => {
      changes.observe(element, { attributes: true, attributeFilter: OPTION_ATTRIBUTES });
      const data = table();
      if (data)
        changes.observe(data, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
        });
    };
    observe();
    draw();
    signal.addEventListener("abort", () => changes.disconnect());

    return {
      get tasks() {
        const data = table();
        return data ? readGanttTable(data) : [];
      },
      get collapsed() {
        return ids("data-ok-collapsed");
      },
      setCollapsed(next) {
        markRows("data-ok-collapsed", next);
        draw();
      },
      get selected() {
        return ids("data-ok-selected");
      },
      setSelected(next) {
        markRows("data-ok-selected", next);
        draw();
      },
      get pixelsPerDay() {
        return current.density;
      },
      zoomIn() {
        zoom(1);
        draw();
      },
      zoomOut() {
        zoom(-1);
        draw();
      },
      scrollToTask: (id) => controller.scrollToTask(id),
      setLocaleText(text) {
        localeText = { ...localeText, ...text };
        draw();
      },
      exportChart,
      refresh() {
        observe();
        draw();
      },
      updateTask(id, change) {
        writeTask(id, change);
        draw();
      },
      destroy() {
        changes.disconnect();
        controller.destroy();
        for (const el of built) el.remove();
        tooltip.remove();
        status.remove();
        element.removeAttribute("data-ok-ready");
      },
    };
  },
});
