import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import ganttCss from "../../../styles/dist/components/gantt.css?raw";
import tokensCss from "../../../tokens/dist/tokens.css?raw";
import { createGanttController, type GanttControllerCallbacks } from "./gantt-controller.js";
import { ganttShortDate } from "./gantt-date.js";
import { ganttEditTask } from "./gantt-edit.js";
import { type GanttTask, ganttModel } from "./gantt-model.js";
import { ganttRenderOptions } from "./gantt-options.js";
import { GANTT_LOCALE_TEXT, type GanttNode, renderGantt } from "./gantt-render.js";

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
  { id: "m", name: "Ship", startTime: "2025-03-10", type: "milestone" },
];

beforeAll(() => {
  const style = document.createElement("style");
  style.textContent = `${tokensCss}\n${ganttCss}`;
  document.head.append(style);
});

function build(node: GanttNode, svg = false): Element {
  const inSvg = svg || node.tag === "svg";
  const element = inSvg
    ? document.createElementNS("http://www.w3.org/2000/svg", node.tag)
    : document.createElement(node.tag);
  for (const [name, value] of Object.entries(node.attrs)) element.setAttribute(name, value);
  for (const [name, value] of Object.entries(node.style ?? {}))
    (element as HTMLElement).style.setProperty(name, value);
  if (node.text !== undefined) element.textContent = node.text;
  else for (const child of node.children ?? []) element.append(build(child, inSvg));
  return element;
}

let cleanup: (() => void) | undefined;
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  document.body.replaceChildren();
});

/** A read-only owner: renders once (refused changes leave the bars as they were). */
function mount(
  attrs: Record<string, string> = { "data-ok-editable": "" },
  extra: Partial<GanttControllerCallbacks> = {},
) {
  const root = document.createElement("div");
  root.setAttribute("data-ok-gantt", "");
  for (const [name, value] of Object.entries(attrs)) root.setAttribute(name, value);
  root.style.cssText = "position: relative; width: 800px";
  const model = ganttModel(TASKS);
  const options = ganttRenderOptions({
    today: "2025-03-05",
    view: "day",
    editable: "data-ok-editable" in attrs,
    taskResize: attrs["data-ok-task-resize"] !== "false",
    progressDrag: attrs["data-ok-progress-drag"] !== "false",
  });
  const layout = renderGantt(model, {
    ...options,
    label: "Project",
    collapsed: new Set(),
    selected: new Set(),
    text: GANTT_LOCALE_TEXT,
  });
  root.append(...layout.nodes.map((node) => build(node)));
  const status = document.createElement("div");
  status.setAttribute("data-ok-gantt-status", "");
  root.append(status);
  document.body.append(root);
  const onTaskChange = vi.fn();
  const onTaskEdit = vi.fn();
  const controller = createGanttController(root, {
    onTaskChange,
    onTaskEdit,
    task: (id) => ganttEditTask(model, id, options.density),
    editText: () => GANTT_LOCALE_TEXT,
    formatDay: (day) => ganttShortDate(day, "en-US"),
    ...extra,
  });
  cleanup = () => controller.destroy();
  const row = (id: string) =>
    root.querySelector<HTMLElement>(`[data-ok-gantt-row][data-ok-task-id="${id}"]`) as HTMLElement;
  const bar = (id: string) => row(id).querySelector("[data-ok-gantt-bar]") as HTMLElement;
  return { root, row, bar, status, onTaskChange, onTaskEdit };
}

/** A pointer drag of `dx` px from the center of `element`. */
function drag(element: Element, dx: number, end: "pointerup" | "pointercancel" = "pointerup") {
  const box = element.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const init = { bubbles: true, pointerId: 7, button: 0, clientY: y };
  element.dispatchEvent(new PointerEvent("pointerdown", { ...init, clientX: x }));
  element.dispatchEvent(new PointerEvent("pointermove", { ...init, clientX: x + dx / 2 }));
  element.dispatchEvent(new PointerEvent("pointermove", { ...init, clientX: x + dx }));
  element.dispatchEvent(new PointerEvent(end, { ...init, clientX: x + dx }));
}

describe("gantt editing", () => {
  it("renders handles and keyboard hints only when editable", () => {
    const { row, bar } = mount();
    expect(row("a")).toHaveAttribute("aria-keyshortcuts", "Enter F2");
    expect(row("p")).not.toHaveAttribute("aria-keyshortcuts");
    expect(
      [...bar("a").querySelectorAll("[data-ok-gantt-handle]")].map((h) =>
        h.getAttribute("data-ok-gantt-handle"),
      ),
    ).toEqual(["start", "end", "progress"]);
    expect(bar("m").querySelector("[data-ok-gantt-handle]")).toBeNull();
    document.body.replaceChildren();
    const plain = mount({});
    expect(plain.bar("a").querySelector("[data-ok-gantt-handle]")).toBeNull();
    expect(plain.row("a")).not.toHaveAttribute("aria-keyshortcuts");
    const noResize = mount({
      "data-ok-editable": "",
      "data-ok-task-resize": "false",
      "data-ok-progress-drag": "false",
    });
    expect(noResize.bar("a").querySelector("[data-ok-gantt-handle]")).toBeNull();
  });

  it("moves, resizes and sets progress by drag, then restores the preview", () => {
    const { bar, onTaskChange } = mount();
    const before = bar("a").style.getPropertyValue("--_ok-gantt-x");
    // Day view: 36 px per day.
    drag(bar("a"), 72);
    expect(onTaskChange).toHaveBeenLastCalledWith(
      "a",
      { startTime: "2025-03-05", endTime: "2025-03-09", progress: 50 },
      "drag",
    );
    expect(bar("a").style.getPropertyValue("--_ok-gantt-x")).toBe(before);
    expect(bar("a")).not.toHaveAttribute("data-ok-dragging");
    drag(bar("a").querySelector('[data-ok-gantt-handle="end"]') as Element, 36);
    expect(onTaskChange).toHaveBeenLastCalledWith(
      "a",
      { startTime: "2025-03-03", endTime: "2025-03-08", progress: 50 },
      "resize",
    );
    drag(bar("a").querySelector('[data-ok-gantt-handle="start"]') as Element, 500);
    expect(onTaskChange).toHaveBeenLastCalledWith(
      "a",
      { startTime: "2025-03-07", endTime: "2025-03-07", progress: 50 },
      "resize",
    );
    drag(bar("a").querySelector('[data-ok-gantt-handle="end"]') as Element, -500);
    expect(onTaskChange).toHaveBeenLastCalledWith(
      "a",
      { startTime: "2025-03-03", endTime: "2025-03-03", progress: 50 },
      "resize",
    );
    drag(bar("a").querySelector('[data-ok-gantt-handle="progress"]') as Element, 45);
    expect(onTaskChange).toHaveBeenLastCalledWith(
      "a",
      { startTime: "2025-03-03", endTime: "2025-03-07", progress: 75 },
      "progress",
    );
    drag(bar("m"), -36);
    expect(onTaskChange).toHaveBeenLastCalledWith("m", { startTime: "2025-03-09" }, "drag");
    expect(onTaskChange).toHaveBeenCalledTimes(6);
  });

  it("previews while dragging; small moves, cancels, Escape and other buttons change nothing", () => {
    const { bar, onTaskChange } = mount();
    const element = bar("a");
    const box = element.getBoundingClientRect();
    const init = { bubbles: true, pointerId: 3, button: 0, clientY: box.top + 4 };
    element.dispatchEvent(new PointerEvent("pointerdown", { ...init, clientX: box.left + 10 }));
    element.dispatchEvent(new PointerEvent("pointermove", { ...init, clientX: box.left + 11 }));
    expect(element).not.toHaveAttribute("data-ok-dragging");
    element.dispatchEvent(
      new PointerEvent("pointermove", { ...init, pointerId: 9, clientX: box.left + 90 }),
    );
    element.dispatchEvent(new PointerEvent("pointermove", { ...init, clientX: box.left + 46 }));
    expect(element).toHaveAttribute("data-ok-dragging");
    expect(element.style.getPropertyValue("--_ok-gantt-x")).not.toBe("");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(element).not.toHaveAttribute("data-ok-dragging");
    element.dispatchEvent(new PointerEvent("pointerup", { ...init, clientX: box.left + 46 }));
    drag(element, 2);
    drag(element, 72, "pointercancel");
    element.dispatchEvent(
      new PointerEvent("pointerdown", { ...init, button: 2, clientX: box.left }),
    );
    element.dispatchEvent(new PointerEvent("pointerup", { ...init, button: 2, clientX: box.left }));
    // A drag back to the start changes nothing.
    drag(element, 10);
    expect(onTaskChange).not.toHaveBeenCalled();
  });

  it("ignores summaries, read-only Gantts and turned-off gestures", async () => {
    const { bar, onTaskChange } = mount({
      "data-ok-editable": "",
      "data-ok-task-drag": "false",
    });
    drag(bar("p"), 72);
    drag(bar("a"), 72);
    // Presses outside bars start nothing.
    drag(
      bar("a")
        .closest("[data-ok-gantt-row]")
        ?.querySelector('[data-ok-gantt-cell="name"]') as Element,
      72,
    );
    expect(onTaskChange).not.toHaveBeenCalled();
    // The keyboard can't move either; Shift + arrows still change the end.
    bar("a").closest<HTMLElement>("[data-ok-gantt-row]")?.focus();
    await userEvent.keyboard("{Enter}{ArrowRight}{Shift>}{ArrowRight}{/Shift}{Enter}");
    expect(onTaskChange).toHaveBeenLastCalledWith(
      "a",
      { startTime: "2025-03-03", endTime: "2025-03-08", progress: 50 },
      "keyboard",
    );
    onTaskChange.mockClear();
    drag(bar("a").querySelector('[data-ok-gantt-handle="end"]') as Element, 36);
    expect(onTaskChange).toHaveBeenCalledTimes(1);
    document.body.replaceChildren();
    const plain = mount({});
    drag(plain.bar("a"), 72);
    expect(plain.onTaskChange).not.toHaveBeenCalled();
    document.body.replaceChildren();
    // No task data for a row: nothing to edit.
    const unknown = mount({ "data-ok-editable": "" }, { task: () => undefined });
    drag(unknown.bar("a"), 72);
    unknown.row("a").focus();
    expect(unknown.onTaskChange).not.toHaveBeenCalled();
  });

  it("edits from the keyboard: Enter, arrows, Shift + arrows, Page keys, Enter saves", async () => {
    const { row, bar, status, onTaskChange } = mount();
    row("a").focus();
    await userEvent.keyboard("{Enter}");
    expect(row("a")).toHaveAttribute("data-ok-editing");
    expect(status.textContent).toMatch(/^Editing Alpha\./);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(status.textContent).toBe("Mar 5, 2025 to Mar 9, 2025, 50%");
    expect(bar("a")).toHaveAttribute("data-ok-dragging");
    await userEvent.keyboard(
      "{Shift>}{ArrowRight}{/Shift}{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}",
    );
    expect(status.textContent).toBe("Mar 5, 2025 to Mar 5, 2025, 50%");
    await userEvent.keyboard("{PageUp}{PageUp}{PageUp}{PageUp}{PageUp}{PageUp}{PageDown}");
    expect(status.textContent).toBe("Mar 5, 2025 to Mar 5, 2025, 90%");
    // Other navigation keys stay in the edit mode.
    await userEvent.keyboard("{ArrowDown}{Home}");
    expect(document.activeElement).toBe(row("a"));
    await userEvent.keyboard("x");
    await userEvent.keyboard("{Enter}");
    expect(onTaskChange).toHaveBeenCalledWith(
      "a",
      { startTime: "2025-03-05", endTime: "2025-03-05", progress: 90 },
      "keyboard",
    );
    expect(status.textContent).toBe("Saved");
    expect(row("a")).not.toHaveAttribute("data-ok-editing");
    expect(bar("a")).not.toHaveAttribute("data-ok-dragging");
  });

  it("cancels with Escape or Tab, edits milestones, and asks for the edit form", async () => {
    const { root, row, status, onTaskChange, onTaskEdit } = mount({
      "data-ok-editable": "",
      "data-ok-task-resize": "false",
      "data-ok-progress-drag": "false",
    });
    row("a").focus();
    await userEvent.keyboard("{Enter}{ArrowLeft}{Shift>}{ArrowRight}{/Shift}{PageUp}{Escape}");
    expect(status.textContent).toBe("Cancelled");
    expect(onTaskChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}{ArrowRight}");
    row("a").dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(row("a")).not.toHaveAttribute("data-ok-editing");
    row("m").focus();
    await userEvent.keyboard("{Enter}{ArrowLeft}{Shift>}{ArrowLeft}{/Shift}{PageUp}{Enter}");
    expect(onTaskChange).toHaveBeenCalledWith("m", { startTime: "2025-03-09" }, "keyboard");
    await userEvent.keyboard("{F2}");
    expect(onTaskEdit).toHaveBeenLastCalledWith("m");
    row("a").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(onTaskEdit).toHaveBeenLastCalledWith("a");
    // Summaries: Enter toggles, F2 and double clicks ask nothing; outside rows nothing either.
    row("p").focus();
    await userEvent.keyboard("{F2}{Shift>}{Enter}{/Shift}{Enter}");
    expect(row("p")).not.toHaveAttribute("data-ok-editing");
    row("p").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    root.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(onTaskEdit).toHaveBeenCalledTimes(2);
  });

  it("does nothing from the keyboard when read-only and works without texts", async () => {
    const plain = mount({});
    plain.row("a").focus();
    await userEvent.keyboard("{F2}{Enter}");
    expect(plain.onTaskEdit).not.toHaveBeenCalled();
    expect(plain.row("a")).not.toHaveAttribute("data-ok-editing");
    plain.row("a").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(plain.onTaskEdit).not.toHaveBeenCalled();
    document.body.replaceChildren();
    // Without a status element the announcements go nowhere; dates fall back to ISO.
    const quiet = mount({ "data-ok-editable": "" }, {
      formatDay: undefined,
    } as unknown as Partial<GanttControllerCallbacks>);
    quiet.status.remove();
    quiet.row("a").focus();
    await userEvent.keyboard("{Enter}{ArrowRight}{Escape}");
    expect(quiet.onTaskChange).not.toHaveBeenCalled();
    document.body.replaceChildren();
    const silent = mount({ "data-ok-editable": "" }, {
      editText: undefined,
      formatDay: undefined,
    } as unknown as Partial<GanttControllerCallbacks>);
    silent.status.remove();
    silent.row("a").focus();
    await userEvent.keyboard("{Enter}{ArrowRight}{Enter}");
    expect(silent.onTaskChange).toHaveBeenCalledWith(
      "a",
      { startTime: "2025-03-04", endTime: "2025-03-08", progress: 50 },
      "keyboard",
    );
  });

  it("mirrors keys and drags in right-to-left pages", async () => {
    const { root, row, bar, onTaskChange } = mount();
    root.dir = "rtl";
    row("a").focus();
    await userEvent.keyboard("{Enter}{ArrowRight}{Enter}");
    expect(onTaskChange).toHaveBeenLastCalledWith(
      "a",
      { startTime: "2025-03-02", endTime: "2025-03-06", progress: 50 },
      "keyboard",
    );
    drag(bar("a"), 36);
    expect(onTaskChange).toHaveBeenLastCalledWith(
      "a",
      { startTime: "2025-03-02", endTime: "2025-03-06", progress: 50 },
      "drag",
    );
  });

  it("maps model items to editable tasks", () => {
    const model = ganttModel(TASKS);
    expect(ganttEditTask(model, "p", 10)).toBeUndefined();
    expect(ganttEditTask(model, "nope", 10)).toBeUndefined();
    expect(ganttEditTask(model, "m", 10)).toMatchObject({ milestone: true, density: 10 });
  });
});
