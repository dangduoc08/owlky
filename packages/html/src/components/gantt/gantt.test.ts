import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { GanttInstance } from "./gantt.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const HOSTILE = '"><img src=x onerror=alert(1)>';

const TABLE = `<table data-ok-gantt-data>
  <caption>Project</caption>
  <thead><tr>
    <th data-ok-gantt-field="name">Task</th><th data-ok-gantt-field="startTime">Start</th>
    <th data-ok-gantt-field="endTime">End</th><th data-ok-gantt-field="progress">Progress</th>
    <th data-ok-gantt-field="dependency">Predecessors</th>
  </tr></thead>
  <tbody>
    <tr data-ok-task-id="p"><td>Phase</td><td></td><td></td><td></td><td></td></tr>
    <tr data-ok-task-id="a" data-ok-parent-id="p"><td>Alpha</td><td data-ok-value="2025-03-03">Mar 3</td><td>2025-03-07</td><td data-ok-value="50">50%</td><td></td></tr>
    <tr data-ok-task-id="b" data-ok-parent-id="p"><td>Beta</td><td>2025-03-10</td><td>2025-03-14</td><td></td><td>a</td></tr>
    <tr data-ok-task-id="m" data-ok-type="milestone" data-ok-color="info"><td>Ship</td><td>2025-03-17</td><td></td><td></td><td>b</td></tr>
  </tbody>
</table>`;
const gantt = (attrs = "") =>
  `<div data-ok-gantt data-ok-view="week" data-ok-bar-label="right" data-ok-today="2025-03-12" ${attrs}>${TABLE}</div>`;
/** A pointer drag of `dx` px from the center of `element`. */
function drag(element: Element, dx: number) {
  const box = element.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const init = { bubbles: true, pointerId: 5, button: 0, clientY: box.top + box.height / 2 };
  element.dispatchEvent(new PointerEvent("pointerdown", { ...init, clientX: x }));
  element.dispatchEvent(new PointerEvent("pointermove", { ...init, clientX: x + dx }));
  element.dispatchEvent(new PointerEvent("pointerup", { ...init, clientX: x + dx }));
}

const rootOf = (host: Element) => host.querySelector("[data-ok-gantt]") as HTMLElement;
const rowOf = (host: Element, id: string) =>
  host.querySelector<HTMLElement>(`[data-ok-gantt-row][data-ok-task-id="${id}"]`) as HTMLElement;
const instanceOf = (host: Element) =>
  runtime?.get<GanttInstance>(rootOf(host), "gantt") as GanttInstance;

describe("gantt runtime", () => {
  it("draws the treegrid from the table and hides the table", async () => {
    const host = mount(gantt());
    start();
    const root = rootOf(host);
    expect(root).toHaveAttribute("data-ok-ready");
    const grid = root.querySelector('[role="treegrid"]') as HTMLElement;
    expect(grid).toHaveAttribute("aria-label", "Project");
    expect(grid.querySelectorAll('[role="row"]')).toHaveLength(5);
    expect(rowOf(host, "p")).toHaveAttribute("aria-expanded", "true");
    expect(rowOf(host, "a").querySelector("[data-ok-gantt-bar]")?.getAttribute("aria-label")).toBe(
      "Alpha, March 3, 2025 to March 7, 2025, 50% complete",
    );
    const bar = rowOf(host, "a").querySelector("[data-ok-gantt-bar]") as HTMLElement;
    expect(bar.style.getPropertyValue("--_ok-gantt-w")).toBe("80px");
    expect(getComputedStyle(root.querySelector("table") as HTMLElement).display).toBe("none");
    expect(root.lastElementChild).toHaveAttribute("data-ok-gantt-status");
    expect(root.lastElementChild?.previousElementSibling).toHaveAttribute("data-ok-gantt-tooltip");
    expect(root.querySelectorAll("[data-ok-gantt-link]")).toHaveLength(2);
    await expectNoAxeViolations(root);
  });

  it("redraws on table and option changes", async () => {
    const host = mount(gantt());
    start();
    const root = rootOf(host);
    const body = root.querySelector("tbody") as HTMLElement;
    const row = document.createElement("tr");
    row.setAttribute("data-ok-task-id", "c");
    for (const text of ["Gamma", "2025-03-20", "2025-03-21", "", ""]) {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.append(cell);
    }
    body.append(row);
    await settle();
    expect(rowOf(host, "c")).not.toBeNull();
    root.setAttribute("data-ok-view", "day");
    root.setAttribute("data-ok-columns", "name endTime");
    await settle();
    expect(
      root.querySelector("[data-ok-gantt-tier='bottom'] [data-ok-gantt-tick]")?.textContent,
    ).toBe("2");
    expect(root.querySelector('[data-ok-gantt-column="endTime"]')).not.toBeNull();
    root.setAttribute("data-ok-show-today", "false");
    await settle();
    expect(root.querySelector("[data-ok-gantt-today]")).toBeNull();
    root.setAttribute("aria-label", "Ignored while a caption exists");
    root.querySelector("caption")?.remove();
    await settle();
    expect(root.querySelector('[role="treegrid"]')).toHaveAttribute(
      "aria-label",
      "Ignored while a caption exists",
    );
  });

  it("keeps rows (and the focus) across redraws and moves through rows", async () => {
    const host = mount(gantt());
    start();
    const first = rowOf(host, "a");
    rowOf(host, "p").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(first);
    expect(first).toHaveAttribute("tabindex", "0");
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(rowOf(host, "m"));
  });

  it("collapses with a cancelable toggle event and writes the table", async () => {
    const host = mount(gantt());
    start();
    const root = rootOf(host);
    const events: unknown[] = [];
    root.addEventListener("ok:gantt:toggle", (event) => {
      events.push((event as CustomEvent).detail);
    });
    rowOf(host, "p").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(events).toEqual([{ id: "p", expanded: false, collapsed: ["p"] }]);
    expect(rowOf(host, "a")).toBeNull();
    expect(root.querySelector('tr[data-ok-task-id="p"]')).toHaveAttribute("data-ok-collapsed");
    expect(instanceOf(host).collapsed).toEqual(["p"]);
    root.addEventListener("ok:gantt:toggle", (event) => event.preventDefault());
    await userEvent.keyboard("{ArrowRight}");
    expect(rowOf(host, "a")).toBeNull();
    instanceOf(host).setCollapsed([]);
    expect(rowOf(host, "a")).not.toBeNull();
  });

  it("selects rows with a cancelable event", async () => {
    const host = mount(gantt("data-ok-selection"));
    start();
    const root = rootOf(host);
    const listener = vi.fn();
    root.addEventListener("ok:gantt:selectionchange", listener);
    await userEvent.click(rowOf(host, "a"));
    expect(listener.mock.calls[0]?.[0].detail).toEqual({ selected: ["a"], mode: "replace" });
    expect(rowOf(host, "a")).toHaveAttribute("aria-selected", "true");
    expect(instanceOf(host).selected).toEqual(["a"]);
    root.addEventListener("ok:gantt:selectionchange", (event) => event.preventDefault(), {
      once: true,
    });
    await userEvent.click(rowOf(host, "b"));
    expect(rowOf(host, "b")).toHaveAttribute("aria-selected", "false");
    instanceOf(host).setSelected(["m"]);
    expect(rowOf(host, "m")).toHaveAttribute("aria-selected", "true");
    // Turning selection off removes the selection states.
    root.removeAttribute("data-ok-selection");
    await settle();
    expect(rowOf(host, "m")).not.toHaveAttribute("aria-selected");
    root.setAttribute("data-ok-selection", "");
    await settle();
    await expectNoAxeViolations(root);
  });

  it("zooms with the toolbar and the instance", async () => {
    const host = mount(gantt("data-ok-toolbar"));
    start();
    const root = rootOf(host);
    const zooms: number[] = [];
    root.addEventListener("ok:gantt:zoom", (event) => {
      zooms.push((event as CustomEvent<{ pixelsPerDay: number }>).detail.pixelsPerDay);
    });
    await userEvent.click(root.querySelector('[data-ok-gantt-zoom="in"]') as HTMLElement);
    expect(zooms).toEqual([22.4]);
    expect(root).toHaveAttribute("data-ok-pixels-per-day", "22.4");
    expect(instanceOf(host).pixelsPerDay).toBe(22.4);
    instanceOf(host).zoomOut();
    expect(instanceOf(host).pixelsPerDay).toBe(16);
    instanceOf(host).zoomIn();
    expect(instanceOf(host).pixelsPerDay).toBe(22.4);
    root.addEventListener("ok:gantt:zoom", (event) => event.preventDefault(), { once: true });
    await userEvent.click(root.querySelector('[data-ok-gantt-zoom="out"]') as HTMLElement);
    expect(instanceOf(host).pixelsPerDay).toBe(22.4);
    root.setAttribute("data-ok-pixels-per-day", "120");
    await settle();
    await userEvent.click(root.querySelector('[data-ok-gantt-zoom="in"]') as HTMLElement);
    expect(zooms).toEqual([22.4, 16]);
  });

  it("exposes tasks, tooltips, scrolling and locale texts", async () => {
    const host = mount(gantt("data-ok-toolbar"));
    start();
    const instance = instanceOf(host);
    expect(instance.tasks.map((task) => task.id)).toEqual(["p", "a", "b", "m"]);
    expect(instance.scrollToTask("m")).toBe(true);
    expect(instance.scrollToTask("nope")).toBe(false);
    const root = rootOf(host);
    const tooltip = root.querySelector("[data-ok-gantt-tooltip]") as HTMLElement;
    await userEvent.hover(rowOf(host, "a").querySelector("[data-ok-gantt-bar]") as HTMLElement);
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toMatch(/^Alpha/);
    instance.setLocaleText({ name: "Aufgabe", zoomIn: "Vergrößern" });
    expect(root.querySelector('[data-ok-gantt-column="name"]')?.textContent).toBe("Aufgabe");
    expect(root.querySelector('[data-ok-gantt-zoom="in"]')).toHaveAttribute(
      "aria-label",
      "Vergrößern",
    );
    instance.refresh();
    expect(rowOf(host, "a")).not.toBeNull();
  });

  it("reads hostile values safely", async () => {
    const host = mount(
      `<div data-ok-gantt data-ok-view='${HOSTILE}' data-ok-bar-label='${HOSTILE}' data-ok-row-height='${HOSTILE}' data-ok-locale='${HOSTILE}' data-ok-columns='${HOSTILE}' data-ok-holidays='${HOSTILE}' data-ok-today='${HOSTILE}'>${TABLE.replace(
        'data-ok-color="info"',
        `data-ok-color='${HOSTILE}'`,
      ).replace("<td>Alpha</td>", `<td>${HOSTILE.replaceAll("<", "&lt;")}</td>`)}</div>`,
    );
    start();
    const root = rootOf(host);
    expect(root.querySelector("img")).toBeNull();
    expect(rowOf(host, "a").textContent).toContain('"><img');
    expect(rowOf(host, "m").querySelector("[data-ok-gantt-bar]")).not.toHaveAttribute(
      "data-ok-color",
    );
    expect(root.querySelector("[data-ok-gantt-today]")).toBeNull();
  });

  it("works without a table and cleans up on stop", () => {
    const host = mount(
      `<div data-ok-gantt aria-label="Empty"></div>${gantt()}<div data-ok-gantt></div>`,
    );
    start();
    const empty = host.querySelector("[data-ok-gantt]") as HTMLElement;
    expect(empty.querySelector('[role="treegrid"]')).toHaveAttribute("aria-label", "Empty");
    const unnamed = host.querySelectorAll("[data-ok-gantt]")[2] as HTMLElement;
    expect(unnamed.querySelector('[role="treegrid"]')).toHaveAttribute("aria-label", "Gantt");
    const none = runtime?.get<GanttInstance>(empty, "gantt") as GanttInstance;
    expect(none.tasks).toEqual([]);
    expect(none.collapsed).toEqual([]);
    none.setCollapsed(["x"]);
    expect(none.selected).toEqual([]);
    none.updateTask("x", { startTime: "2025-03-03" });
    expect(empty.querySelector("[data-ok-gantt-row]")).toBeNull();
    const second = host.querySelectorAll("[data-ok-gantt]")[1] as HTMLElement;
    expect(runtime?.get<GanttInstance>(second, "gantt")?.tasks).toHaveLength(4);
    runtime?.stop();
    expect(empty.children).toHaveLength(0);
    expect(empty).not.toHaveAttribute("data-ok-ready");
    const root = host.querySelectorAll("[data-ok-gantt]")[1] as HTMLElement;
    expect(root.children).toHaveLength(1);
  });

  it("edits tasks with cancelable taskchange events and writes the table", async () => {
    const host = mount(
      gantt('data-ok-editable data-ok-view="day"').replace('data-ok-view="week" ', ""),
    );
    start();
    const root = rootOf(host);
    const changes: unknown[] = [];
    root.addEventListener("ok:gantt:taskchange", (event) => {
      changes.push((event as CustomEvent).detail);
    });
    const bar = () => rowOf(host, "a").querySelector("[data-ok-gantt-bar]") as HTMLElement;
    drag(bar(), 72);
    expect(changes).toEqual([
      {
        id: "a",
        change: { startTime: "2025-03-05", endTime: "2025-03-09", progress: 50 },
        source: "drag",
      },
    ]);
    const cells = root.querySelector('tr[data-ok-task-id="a"]')?.querySelectorAll("td") ?? [];
    expect(cells[1]).toHaveAttribute("data-ok-value", "2025-03-05");
    expect(cells[1]?.textContent).toBe("Mar 5, 2025");
    expect(cells[2]).toHaveAttribute("data-ok-value", "2025-03-09");
    expect(rowOf(host, "a").querySelector('[data-ok-gantt-cell="startTime"]')?.textContent).toBe(
      "Mar 5, 2025",
    );
    rowOf(host, "a").focus();
    await userEvent.keyboard("{Enter}{PageUp}{Enter}");
    expect(cells[3]?.textContent).toBe("60%");
    // Milestones have no end or progress to write.
    drag(rowOf(host, "m").querySelector("[data-ok-gantt-bar]") as HTMLElement, -36);
    expect(
      root.querySelector('tr[data-ok-task-id="m"]')?.querySelectorAll("td")[1],
    ).toHaveAttribute("data-ok-value", "2025-03-16");
    root.addEventListener("ok:gantt:taskchange", (event) => event.preventDefault(), { once: true });
    drag(bar(), 72);
    expect(cells[1]).toHaveAttribute("data-ok-value", "2025-03-05");
    const edits: unknown[] = [];
    root.addEventListener("ok:gantt:edit", (event) => edits.push((event as CustomEvent).detail));
    rowOf(host, "b").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(edits).toEqual([{ id: "b" }]);
    expect(root.querySelector("[data-ok-gantt-status]")?.textContent).toBe("Saved");
    // Your form writes through updateTask (unknown ids change nothing).
    instanceOf(host).updateTask("b", {
      startTime: "2025-03-11",
      endTime: "2025-03-12",
      progress: 5,
    });
    const beta = root.querySelector('tr[data-ok-task-id="b"]')?.querySelectorAll("td") ?? [];
    expect(beta[1]).toHaveAttribute("data-ok-value", "2025-03-11");
    instanceOf(host).updateTask("nope", { startTime: "2025-03-11" });
  });

  it("skips columns the table doesn't have when it writes a change", () => {
    const host = mount(
      `<div data-ok-gantt data-ok-editable data-ok-view="day" data-ok-bar-label="right" data-ok-today="2025-03-12"><table data-ok-gantt-data><thead><tr><th data-ok-gantt-field="name">Task</th><th data-ok-gantt-field="startTime">Start</th><th data-ok-gantt-field="endTime">End</th></tr></thead><tbody><tr data-ok-task-id="x"><td>X</td><td>2025-03-03</td><td>2025-03-04</td></tr></tbody></table></div>`,
    );
    start();
    drag(rowOf(host, "x").querySelector("[data-ok-gantt-bar]") as HTMLElement, 36);
    expect(rootOf(host).querySelectorAll("td")[1]).toHaveAttribute("data-ok-value", "2025-03-04");
  });

  it("has CSP-safe snippets that draw without axe violations", async () => {
    for (const [path, html] of snippets) {
      const host = mount(html);
      expectCspSafe(host, html);
      start();
      const root = rootOf(host);
      expect(root.querySelector('[role="treegrid"]'), path).not.toBeNull();
      await expectNoAxeViolations(root);
      runtime?.stop();
      resetPage();
    }
  });
});
