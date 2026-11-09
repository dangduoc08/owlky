import type { GanttTask } from "@owlky/core";
import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Gantt, type GanttProps } from "./gantt.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;

const TASKS: GanttTask[] = [
  { id: "p", name: "Phase" },
  {
    id: "a",
    name: "Alpha",
    parentId: "p",
    startTime: "2025-03-03",
    endTime: "2025-03-07",
    progress: 50,
  },
  {
    id: "b",
    name: "Beta",
    parentId: "p",
    startTime: "2025-03-10",
    endTime: "2025-03-14",
    dependency: "a",
    baseline: { start: "2025-03-07", end: "2025-03-12" },
  },
  {
    id: "m",
    name: "Ship",
    startTime: "2025-03-17",
    type: "milestone",
    dependency: "b",
    color: "info",
  },
];

/** A pointer drag of `dx` px from the center of `element`. */
function drag(element: Element, dx: number) {
  const box = element.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const init = { bubbles: true, pointerId: 5, button: 0, clientY: box.top + box.height / 2 };
  element.dispatchEvent(new PointerEvent("pointerdown", { ...init, clientX: x }));
  element.dispatchEvent(new PointerEvent("pointermove", { ...init, clientX: x + dx }));
  element.dispatchEvent(new PointerEvent("pointerup", { ...init, clientX: x + dx }));
}

/** An editable Gantt that keeps its tasks in state. */
function Editable({ onTaskEdit }: { onTaskEdit?: (id: string) => void }) {
  const [tasks, setTasks] = useState(TASKS);
  return (
    <Gantt
      tasks={tasks}
      label="Project"
      today="2025-03-12"
      view="day"
      editable
      onTaskEdit={onTaskEdit}
      onTaskChange={(id, change) =>
        setTasks((list) => list.map((task) => (task.id === id ? { ...task, ...change } : task)))
      }
    />
  );
}

/** A controlled Gantt that prints its selection. */
function Demo() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <>
      <Gantt
        tasks={TASKS}
        label="Project"
        selection
        selected={selected}
        onSelectionChange={setSelected}
      />
      <output>{selected.join(",")}</output>
    </>
  );
}

const renderGantt = (props: Partial<GanttProps> = {}) =>
  render(<Gantt tasks={TASKS} label="Project" today="2025-03-12" {...props} />);
const grid = () => screen.getByRole("treegrid", { name: "Project" });
const row = (name: string) => screen.getByRole("row", { name: new RegExp(`^${name}`) });
const root = () => grid().closest("[data-ok-gantt]") as HTMLElement;
const focusedId = () => document.activeElement?.getAttribute("data-ok-task-id");

describe("Gantt", () => {
  it("renders the treegrid, the data table and the root options", async () => {
    renderGantt();
    const element = root();
    expect(element).toHaveAttribute("data-ok-view", "week");
    expect(element).toHaveAttribute("data-ok-bar-label", "right");
    expect(element).toHaveAttribute("data-ok-today", "2025-03-12");
    expect(element).toHaveAttribute("data-ok-ready", "");
    expect(element).toHaveAttribute("data-ok-runtime", "off");
    expect(grid()).toHaveAttribute("aria-rowcount", "5");
    expect(screen.getAllByRole("row")).toHaveLength(5);
    expect(row("Phase")).toHaveAttribute("aria-expanded", "true");
    expect(row("Alpha")).toHaveAttribute("aria-level", "2");
    expect(screen.getByRole("img", { name: /^Ship, Milestone, March 17, 2025/ })).toHaveAttribute(
      "data-ok-color",
      "info",
    );
    // The data table is hidden (the treegrid is the accessible view) but present.
    const table = element.querySelector("table[data-ok-gantt-data]") as HTMLTableElement;
    expect(table.caption?.textContent).toBe("Project");
    expect(getComputedStyle(table).display).toBe("none");
    expect(
      [...((table.tHead as HTMLTableSectionElement).rows[0]?.cells ?? [])].map((cell) =>
        cell.getAttribute("data-ok-gantt-field"),
      ),
    ).toEqual([
      "name",
      "startTime",
      "endTime",
      "progress",
      "dependency",
      "baselineStart",
      "baselineEnd",
    ]);
    expect(element.querySelector("[data-ok-gantt-tooltip]")).toHaveAttribute("hidden");
    // Bars are positioned through private properties.
    const bar = row("Alpha").querySelector("[data-ok-gantt-bar]") as HTMLElement;
    expect(bar.style.getPropertyValue("--_ok-gantt-w")).toBe("80px");
    expect(bar.getBoundingClientRect().width).toBeCloseTo(80, 0);
    await expectNoAxeViolations(element);
  });

  it("writes every option and text attribute", () => {
    renderGantt({
      view: "day",
      rowHeight: 48,
      barMargin: 10,
      tasksContainerWidth: 500,
      barLabel: "inside",
      weekStart: 0,
      criticalPath: true,
      baseline: true,
      projectBoundary: true,
      toolbar: true,
      selection: true,
      disableTooltip: true,
      showToday: false,
      showNonWorkingDays: false,
      columnLines: false,
      columns: ["name", "endTime"],
      locale: "en-GB",
      workingWeekdays: [1, 2, 3, 4],
      holidays: ["2025-03-11"],
      className: "custom",
    });
    const element = root();
    for (const [name, value] of Object.entries({
      "data-ok-view": "day",
      "data-ok-row-height": "48",
      "data-ok-bar-margin": "10",
      "data-ok-tasks-container-width": "500",
      "data-ok-bar-label": "inside",
      "data-ok-week-start": "0",
      "data-ok-critical-path": "",
      "data-ok-baseline": "",
      "data-ok-project-boundary": "",
      "data-ok-toolbar": "",
      "data-ok-selection": "",
      "data-ok-disable-tooltip": "",
      "data-ok-show-today": "false",
      "data-ok-show-non-working-days": "false",
      "data-ok-column-lines": "false",
      "data-ok-columns": "name endTime",
      "data-ok-locale": "en-GB",
      "data-ok-working-weekdays": "1 2 3 4",
      "data-ok-holidays": "2025-03-11",
    }))
      expect(element).toHaveAttribute(name, value);
    expect(element).toHaveClass("custom");
    expect(element.querySelector('[data-ok-gantt-column="endTime"]')?.textContent).toBe("End");
    expect(screen.getByRole("toolbar", { name: "Gantt tools" })).toBeInTheDocument();
    expect(grid()).toHaveAttribute("aria-multiselectable", "true");
    expect(row("Alpha").querySelector("[data-ok-gantt-bar-text]")?.textContent).toBe("Alpha");
    expect(element.querySelectorAll("[data-ok-gantt-baseline]")).toHaveLength(1);
  });

  it("falls back to defaults for invalid values", () => {
    renderGantt({ view: HOSTILE, barLabel: HOSTILE, rowHeight: HOSTILE, locale: HOSTILE });
    const element = root();
    expect(element).toHaveAttribute("data-ok-view", "week");
    expect(element).toHaveAttribute("data-ok-bar-label", "right");
    expect(element).not.toHaveAttribute("data-ok-row-height");
    expect(element).toHaveAttribute("data-ok-locale", "en-US");
    expect(element.querySelector("img")).toBeNull();
  });

  it("collapses and expands parents (uncontrolled), from the data's flags too", async () => {
    const onCollapsedChange = vi.fn();
    renderGantt({ onCollapsedChange });
    row("Phase").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onCollapsedChange).toHaveBeenLastCalledWith(["p"]);
    expect(row("Phase")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("row", { name: /^Alpha/ })).toBeNull();
    expect(root().querySelector('tr[data-ok-task-id="p"]')).toHaveAttribute("data-ok-collapsed");
    expect(focusedId()).toBe("p");
    await userEvent.click(row("Phase").querySelector("[data-ok-gantt-toggle]") as HTMLElement);
    expect(onCollapsedChange).toHaveBeenLastCalledWith([]);
    expect(row("Alpha")).toBeInTheDocument();
  });

  it("starts collapsed from task flags or defaultCollapsed", () => {
    const { unmount } = render(
      <Gantt
        tasks={[{ ...TASKS[0], collapsed: true } as GanttTask, ...TASKS.slice(1)]}
        label="Project"
      />,
    );
    expect(screen.getAllByRole("row")).toHaveLength(3);
    unmount();
    renderGantt({ defaultCollapsed: ["p"] });
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("is controlled: collapse and selection follow the props", async () => {
    const onCollapsedChange = vi.fn();
    const onSelectionChange = vi.fn();
    renderGantt({
      collapsed: [],
      onCollapsedChange,
      selection: true,
      selected: ["a"],
      onSelectionChange,
    });
    row("Phase").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onCollapsedChange).toHaveBeenCalledWith(["p"]);
    expect(row("Phase")).toHaveAttribute("aria-expanded", "true");
    expect(row("Alpha")).toHaveAttribute("aria-selected", "true");
    await userEvent.click(row("Beta"));
    expect(onSelectionChange).toHaveBeenCalledWith(["b"], "replace");
    expect(row("Beta")).toHaveAttribute("aria-selected", "false");
  });

  it("selects rows (controlled by state) and moves focus with the keyboard", async () => {
    render(<Demo />);
    await userEvent.click(row("Alpha"));
    expect(document.querySelector("output")?.textContent).toBe("a");
    await userEvent.keyboard("{ArrowDown} ");
    expect(focusedId()).toBe("b");
    expect(document.querySelector("output")?.textContent).toBe("a,b");
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(document.querySelector("output")?.textContent).toBe("p,a,b,m");
    await expectNoAxeViolations(root());
  });

  it("selects with a default selection without callbacks", async () => {
    renderGantt({ selection: true, defaultSelected: ["m"] });
    expect(row("Ship")).toHaveAttribute("aria-selected", "true");
    expect(root().querySelector('tr[data-ok-task-id="m"]')).toHaveAttribute("data-ok-selected");
    await userEvent.click(row("Phase"));
    expect(row("Phase")).toHaveAttribute("aria-selected", "true");
    expect(row("Ship")).toHaveAttribute("aria-selected", "false");
  });

  it("zooms with the toolbar (uncontrolled and controlled)", async () => {
    const onZoomChange = vi.fn();
    const { unmount } = renderGantt({ toolbar: true, onZoomChange });
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onZoomChange).toHaveBeenLastCalledWith(22.4);
    expect(root()).toHaveAttribute("data-ok-pixels-per-day", "22.4");
    await userEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(onZoomChange).toHaveBeenLastCalledWith(16);
    unmount();
    const controlled = vi.fn();
    renderGantt({ toolbar: true, pixelsPerDay: 5, onZoomChange: controlled });
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(controlled).toHaveBeenCalledWith(7);
    expect(root()).toHaveAttribute("data-ok-pixels-per-day", "5");
  });

  it("shows a tooltip on hover and keyboard focus", async () => {
    renderGantt();
    const tooltip = root().querySelector("[data-ok-gantt-tooltip]") as HTMLElement;
    await userEvent.hover(row("Alpha").querySelector("[data-ok-gantt-bar]") as HTMLElement);
    expect(tooltip).not.toHaveAttribute("hidden");
    expect(tooltip.textContent).toMatch(/^Alpha/);
    await userEvent.keyboard("{Escape}");
    expect(tooltip).toHaveAttribute("hidden");
  });

  it("uses locale texts", () => {
    renderGantt({
      localeText: { name: "Aufgabe", startTime: "Beginn", toolbar: "Werkzeuge" },
      toolbar: true,
    });
    expect(screen.getByRole("columnheader", { name: "Aufgabe" })).toBeInTheDocument();
    expect(root().querySelector('[data-ok-gantt-column="startTime"]')?.textContent).toBe("Beginn");
    expect(screen.getByRole("toolbar", { name: "Werkzeuge" })).toBeInTheDocument();
  });

  it("forwards the ref, works in StrictMode and renders on the server", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <StrictMode>
        <Gantt ref={ref} tasks={TASKS} label="Project" today="2025-03-12" />
      </StrictMode>,
    );
    expect(ref.current).toHaveAttribute("data-ok-gantt");
    const html = renderToString(<Gantt tasks={TASKS} label="Project" today="2025-03-12" />);
    expect(html).toContain('role="treegrid"');
    expect(html).toContain("--_ok-gantt-x");
    expect(renderToString(<Gantt tasks={[]} label="Empty" />)).toContain("data-ok-gantt-data");
  });

  it("edits tasks by drag and keyboard through onTaskChange", async () => {
    const onTaskEdit = vi.fn();
    render(<Editable onTaskEdit={onTaskEdit} />);
    const element = root();
    expect(element).toHaveAttribute("data-ok-editable");
    const bar = () => row("Alpha").querySelector("[data-ok-gantt-bar]") as HTMLElement;
    await act(async () => drag(bar(), 72));
    expect(row("Alpha").querySelector('[data-ok-gantt-cell="startTime"]')?.textContent).toBe(
      "Mar 5, 2025",
    );
    expect(bar().style.getPropertyValue("--_ok-gantt-w")).toBe("180px");
    row("Alpha").focus();
    await userEvent.keyboard("{Enter}{PageUp}{Enter}");
    expect(row("Alpha").querySelector('[data-ok-gantt-cell="progress"]')?.textContent).toBe("60%");
    expect(element.querySelector("[data-ok-gantt-status]")?.textContent).toBe("Saved");
    await userEvent.keyboard("{F2}");
    expect(onTaskEdit).toHaveBeenCalledWith("a");
    await expectNoAxeViolations(element);
  });

  it("writes the editing behavior options", () => {
    renderGantt({ editable: true, taskDrag: false, taskResize: false, progressDrag: false });
    const element = root();
    expect(element).toHaveAttribute("data-ok-task-drag", "false");
    expect(element).toHaveAttribute("data-ok-task-resize", "false");
    expect(element).toHaveAttribute("data-ok-progress-drag", "false");
    expect(element.querySelector("[data-ok-gantt-handle]")).toBeNull();
    // Without callbacks, edits change nothing.
    drag(row("Alpha").querySelector("[data-ok-gantt-bar]") as HTMLElement, 72);
  });

  it("cleans up the controller on unmount", async () => {
    const { unmount } = renderGantt();
    unmount();
    await act(async () => {});
    expect(document.querySelector("[data-ok-gantt]")).toBeNull();
  });
});
