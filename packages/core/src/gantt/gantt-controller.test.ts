import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import ganttCss from "../../../styles/dist/components/gantt.css?raw";
import tokensCss from "../../../tokens/dist/tokens.css?raw";
import { createGanttController, type GanttControllerCallbacks } from "./gantt-controller.js";
import { type GanttTask, ganttModel } from "./gantt-model.js";
import { ganttRenderOptions } from "./gantt-options.js";
import { GANTT_LOCALE_TEXT, type GanttNode, ganttTooltip, renderGantt } from "./gantt-render.js";
import { ganttZoom } from "./gantt-scale.js";

const TASKS: GanttTask[] = [
  { id: "p", name: "Phase" },
  { id: "a", name: "Alpha", parentId: "p", startTime: "2025-03-03", endTime: "2025-03-07" },
  { id: "b", name: "Beta", parentId: "p", startTime: "2025-03-10", endTime: "2025-03-14" },
  { id: "q", name: "Other", startTime: "2025-03-03", endTime: "2025-03-20" },
  { id: "m", name: "Ship", startTime: "2025-03-21", type: "milestone" },
];

/** Core nodes → DOM (a test copy of what the owners do). */
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

beforeAll(() => {
  const style = document.createElement("style");
  style.textContent = `${tokensCss}\n${ganttCss}`;
  document.head.append(style);
});

let cleanup: (() => void) | undefined;
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  document.body.replaceChildren();
});

/** A Gantt with an owner that keeps its state and redraws (rows are rebuilt on every render). */
function mount(
  extra: { selection?: boolean; toolbar?: boolean; disableTooltip?: boolean } = {},
  callbacks: Partial<GanttControllerCallbacks> = {},
) {
  const root = document.createElement("div");
  root.setAttribute("data-ok-gantt", "");
  if (extra.disableTooltip) root.setAttribute("data-ok-disable-tooltip", "");
  root.style.cssText = "position: relative; width: 600px";
  const tooltip = document.createElement("div");
  tooltip.setAttribute("data-ok-gantt-tooltip", "");
  tooltip.hidden = true;
  root.append(tooltip);
  document.body.append(root);
  const model = ganttModel(TASKS);
  const state = {
    collapsed: new Set<string>(),
    selected: new Set<string>(),
    active: undefined as string | undefined,
    density: 16,
  };
  const render = () => {
    const layout = renderGantt(model, {
      ...ganttRenderOptions({ today: "2025-03-12", pixelsPerDay: state.density }),
      selection: extra.selection === true,
      toolbar: extra.toolbar === true,
      label: "Project",
      collapsed: state.collapsed,
      selected: state.selected,
      active: state.active,
      text: GANTT_LOCALE_TEXT,
    });
    for (const child of [...root.children]) if (child !== tooltip) child.remove();
    root.prepend(...layout.nodes.map((node) => build(node)));
    const viewport = root.querySelector<HTMLElement>("[data-ok-gantt-viewport]");
    if (viewport) viewport.style.cssText = "overflow: auto; max-height: 160px";
    controller.sync();
  };
  const spies = {
    onActiveChange: vi.fn((id: string) => {
      state.active = id;
      render();
    }),
    onToggle: vi.fn((id: string, expanded: boolean) => {
      if (expanded) state.collapsed.delete(id);
      else state.collapsed.add(id);
      render();
    }),
    onSelectionChange: vi.fn((ids: string[]) => {
      state.selected = new Set(ids);
      render();
    }),
    onZoom: vi.fn((direction: 1 | -1) => {
      state.density = ganttZoom(state.density, direction);
      render();
    }),
    tooltip: (id: string) => {
      const item = model.byId.get(id);
      return item ? ganttTooltip(item, GANTT_LOCALE_TEXT, "en-US") : undefined;
    },
    ...callbacks,
  };
  const controller = createGanttController(root, spies);
  render();
  cleanup = () => controller.destroy();
  const row = (id: string) =>
    root.querySelector<HTMLElement>(`[data-ok-gantt-row][data-ok-task-id="${id}"]`) as HTMLElement;
  return { root, tooltip, state, spies, controller, row };
}

const focused = () => document.activeElement?.getAttribute("data-ok-task-id");

describe("createGanttController", () => {
  it("moves the focus through rows with the keyboard", async () => {
    const { row, spies } = mount();
    row("p").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("a");
    await userEvent.keyboard("{End}");
    expect(focused()).toBe("m");
    await userEvent.keyboard("{Home}");
    expect(focused()).toBe("p");
    await userEvent.keyboard("{PageDown}");
    expect(focused()).toBe("m");
    await userEvent.keyboard("{PageUp}");
    expect(focused()).toBe("p");
    await userEvent.keyboard("{ArrowUp}");
    expect(focused()).toBe("p");
    expect(spies.onActiveChange).toHaveBeenCalledWith("a");
    // Unhandled keys do nothing.
    await userEvent.keyboard("x");
    expect(focused()).toBe("p");
  });

  it("expands, collapses and walks the tree with the arrows and Enter", async () => {
    const { row, spies, state } = mount();
    row("p").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(spies.onToggle).toHaveBeenLastCalledWith("p", false);
    expect(state.collapsed.has("p")).toBe(true);
    expect(row("a")).toBeNull();
    // Collapsed: Left has no parent to go to.
    await userEvent.keyboard("{ArrowLeft}");
    expect(focused()).toBe("p");
    await userEvent.keyboard("{ArrowRight}");
    expect(spies.onToggle).toHaveBeenLastCalledWith("p", true);
    await userEvent.keyboard("{ArrowRight}");
    expect(focused()).toBe("a");
    // A leaf: Right does nothing, Left goes to the parent.
    await userEvent.keyboard("{ArrowRight}");
    expect(focused()).toBe("a");
    await userEvent.keyboard("{ArrowLeft}");
    expect(focused()).toBe("p");
    // From the second child, Left skips the sibling and reaches the parent.
    row("b").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(focused()).toBe("p");
    await userEvent.keyboard("{Enter}");
    expect(state.collapsed.has("p")).toBe(true);
    expect(spies.onToggle).toHaveBeenCalledTimes(3);
  });

  it("toggles a parent from its chevron and focuses the clicked row", async () => {
    const { root, row, state, spies } = mount();
    (root.querySelector("[data-ok-gantt-toggle]") as HTMLElement).click();
    expect(state.collapsed.has("p")).toBe(true);
    row("q").click();
    expect(focused()).toBe("q");
    expect(spies.onSelectionChange).not.toHaveBeenCalled();
  });

  it("selects with clicks, modifier keys, Space and Ctrl + A", async () => {
    const { row, state, spies } = mount({ selection: true });
    row("a").click();
    expect([...state.selected]).toEqual(["a"]);
    row("q").dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    expect([...state.selected]).toEqual(["a", "b", "q"]);
    row("b").dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
    expect([...state.selected]).toEqual(["a", "q"]);
    row("b").dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
    expect([...state.selected]).toEqual(["a", "q", "b"]);
    row("m").focus();
    await userEvent.keyboard(" ");
    expect(state.selected.has("m")).toBe(true);
    await userEvent.keyboard(" ");
    expect(state.selected.has("m")).toBe(false);
    await userEvent.keyboard("a");
    expect(state.selected.has("p")).toBe(false);
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(state.selected.size).toBe(5);
    expect(spies.onSelectionChange).toHaveBeenLastCalledWith(["p", "a", "b", "q", "m"], "all");
    row("p").click();
    await userEvent.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    expect([...state.selected]).toEqual(["p", "a", "b"]);
    await userEvent.keyboard("{Shift>} {/Shift}");
    expect(focused()).toBe("b");
    // A range from an anchor that was collapsed away starts at the clicked row.
    row("a").click();
    spies.onToggle("p", false);
    row("q").dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    expect([...state.selected]).toEqual(["q"]);
  });

  it("follows the focus, ignores pointer focus for tooltips and drops vanished rows", async () => {
    const { root, tooltip, row, spies, controller } = mount({ toolbar: true });
    // Focus that reaches a row another way makes it the active row.
    row("q").focus();
    expect(spies.onActiveChange).toHaveBeenLastCalledWith("q");
    expect(row("q")).toHaveAttribute("tabindex", "0");
    // Focus on other parts (toolbar buttons) is ignored.
    (root.querySelector("[data-ok-gantt-zoom]") as HTMLElement).focus();
    // A real click focuses a row without its tooltip (hover shows it instead).
    tooltip.hidden = true;
    await userEvent.click(row("m").querySelector('[data-ok-gantt-cell="name"]') as HTMLElement);
    expect(focused()).toBe("m");
    expect(tooltip.hidden).toBe(true);
    // Hover and leave events without a tooltip do nothing; scrolling neither.
    row("m").dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    root.dispatchEvent(new PointerEvent("pointerleave"));
    root.querySelector("[data-ok-gantt-viewport]")?.dispatchEvent(new Event("scroll"));
    expect(tooltip.hidden).toBe(true);
    expect(controller).toBeDefined();
  });

  it("drops a pending focus whose row went away", () => {
    // An owner that renders later (React) than the controller asks.
    const { row, spies, controller } = mount({}, { onActiveChange: vi.fn() });
    row("a").focus();
    spies.onToggle("p", false);
    expect(row("a")).toBeNull();
    controller.sync();
    expect(focused()).toBeFalsy();
  });

  it("ignores selection keys without selection", async () => {
    const { row, spies } = mount();
    row("a").focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(spies.onSelectionChange).not.toHaveBeenCalled();
  });

  it("reports zoom buttons", () => {
    const { root, spies, state } = mount({ toolbar: true });
    (root.querySelector('[data-ok-gantt-zoom="in"]') as HTMLElement).click();
    expect(spies.onZoom).toHaveBeenLastCalledWith(1);
    (root.querySelector('[data-ok-gantt-zoom="out"]') as HTMLElement).click();
    expect(spies.onZoom).toHaveBeenLastCalledWith(-1);
    expect(state.density).toBe(16);
  });

  it("shows a tooltip on bar hover and keyboard focus; Escape hides it", async () => {
    const { root, tooltip, row } = mount();
    const bar = row("a").querySelector("[data-ok-gantt-bar]") as HTMLElement;
    bar.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.querySelector("[data-ok-gantt-tooltip-title]")?.textContent).toBe("Alpha");
    expect(tooltip.querySelectorAll("[data-ok-gantt-tooltip-row]")).toHaveLength(4);
    expect(tooltip.style.getPropertyValue("--_ok-gantt-tooltip-x")).toMatch(/px$/);
    expect(["top", "bottom"]).toContain(tooltip.getAttribute("data-ok-placement"));
    // Moving onto the tooltip keeps it; leaving the Gantt hides it after a moment.
    tooltip.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    root.dispatchEvent(new PointerEvent("pointerleave"));
    await new Promise((r) => setTimeout(r, 200));
    expect(tooltip.hidden).toBe(true);
    // A hover elsewhere in the Gantt hides it too.
    bar.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    row("a").dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    expect(tooltip.hidden).toBe(true);
    // Keyboard focus shows it, Escape hides it, leaving the Gantt hides it.
    row("p").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toContain("Alpha");
    await userEvent.keyboard("{Escape}");
    expect(tooltip.hidden).toBe(true);
    await userEvent.keyboard("{ArrowDown}");
    expect(tooltip.hidden).toBe(false);
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();
    expect(tooltip.hidden).toBe(true);
  });

  it("hides the tooltip on scroll and never shows it when disabled", async () => {
    const { root, tooltip, row, controller } = mount();
    const bar = row("q").querySelector("[data-ok-gantt-bar]") as HTMLElement;
    bar.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    expect(tooltip.hidden).toBe(false);
    root.querySelector("[data-ok-gantt-viewport]")?.dispatchEvent(new Event("scroll"));
    expect(tooltip.hidden).toBe(true);
    // A focused row's tooltip follows its bar instead.
    row("p").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(tooltip.hidden).toBe(false);
    root.querySelector("[data-ok-gantt-viewport]")?.dispatchEvent(new Event("scroll"));
    expect(tooltip.hidden).toBe(false);
    controller.hideTooltip();
    cleanup?.();
    document.body.replaceChildren();
    const quiet = mount({ disableTooltip: true });
    quiet
      .row("q")
      .querySelector("[data-ok-gantt-bar]")
      ?.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    expect(quiet.tooltip.hidden).toBe(true);
    // No content: no tooltip.
    cleanup?.();
    document.body.replaceChildren();
    const empty = mount({}, { tooltip: () => undefined });
    empty
      .row("q")
      .querySelector("[data-ok-gantt-bar]")
      ?.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    expect(empty.tooltip.hidden).toBe(true);
  });

  it("scrolls rows and bars into view", () => {
    const { root, controller, row } = mount();
    const viewport = root.querySelector("[data-ok-gantt-viewport]") as HTMLElement;
    expect(controller.scrollToTask("m")).toBe(true);
    expect(viewport.scrollTop).toBeGreaterThan(0);
    const bar = row("m").querySelector("[data-ok-gantt-bar]") as HTMLElement;
    expect(bar.getBoundingClientRect().right).toBeLessThanOrEqual(
      viewport.getBoundingClientRect().right + 1,
    );
    expect(controller.scrollToTask("p")).toBe(true);
    expect(viewport.scrollTop).toBeLessThanOrEqual(1);
    expect(controller.scrollToTask("nope")).toBe(false);
  });

  it("ignores events outside rows and after destroy", async () => {
    const { root, controller, spies } = mount();
    root.querySelector<HTMLElement>("[data-ok-gantt-head]")?.click();
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(spies.onActiveChange).not.toHaveBeenCalled();
    controller.destroy();
    root.querySelector<HTMLElement>('[data-ok-gantt-row][data-ok-task-id="q"]')?.click();
    expect(spies.onActiveChange).not.toHaveBeenCalled();
  });
});
