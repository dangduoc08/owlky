import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanupDom, mount } from "../test-utils.js";
import { makeDate } from "./dates.js";
import { sectionPlaceholder } from "./field.js";
import { createFieldController } from "./field-controller.js";
import { parseFormat } from "./format.js";
import { pickersEnUS } from "./locale.js";

afterEach(() => {
  cleanupDom();
  vi.restoreAllMocks();
});

/** A field like the components render, with an owner that re-renders the texts. */
function setup(format = "MM/DD/YYYY", initial?: string[]) {
  const sections = parseFormat(format);
  const host = mount(
    `<div role="group">${sections
      .map(
        (s, i) =>
          `<span role="spinbutton" tabindex="${i === 0 ? 0 : -1}" contenteditable="true" inputmode="numeric"></span>${s.endSeparator}`,
      )
      .join("")}</div><button>after</button>`,
  );
  const group = host.querySelector<HTMLElement>('[role="group"]') as HTMLElement;
  const spans = [...group.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
  const placeholders = sections.map((s) => sectionPlaceholder(s, pickersEnUS));
  const state = { values: initial ?? sections.map(() => ""), disabled: false, readOnly: false };
  const changes: string[][] = [];
  const actives: number[] = [];
  const render = () =>
    spans.forEach((span, i) => {
      span.textContent = state.values[i] || placeholders[i] || "";
    });
  render();
  const controller = createFieldController(group, {
    read: () => ({
      sections,
      values: state.values,
      placeholders,
      locale: "en-US",
      reference: makeDate(2026, 10, 8),
      disabled: state.disabled,
      readOnly: state.readOnly,
    }),
    onValuesChange: (values) => {
      state.values = values;
      changes.push(values);
      render();
      controller.sync();
    },
    onActiveSectionChange: (index) => actives.push(index),
  });
  return { group, spans, state, changes, actives, controller };
}

const focused = () => document.activeElement;
const selectedText = () => document.getSelection()?.toString();

function paste(target: Element, text: string) {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: { getData: (type: string) => (type === "text/plain" ? text : "") },
  });
  target.dispatchEvent(event);
  return event;
}

function beforeInput(target: Element, inputType: string, data: string | null, cancelable = true) {
  const event = new InputEvent("beforeinput", { bubbles: true, cancelable, inputType, data });
  target.dispatchEvent(event);
  return event;
}

describe("createFieldController", () => {
  it("types a whole date, moving from section to section", async () => {
    const { spans, state, actives } = setup();
    (spans[0] as HTMLElement).focus();
    expect(selectedText()).toBe("MM");
    await userEvent.keyboard("05252025");
    expect(state.values).toEqual(["05", "25", "2025"]);
    expect(focused()).toBe(spans[2]);
    expect(actives).toEqual([0, 1, 2]);
    expect(selectedText()).toBe("2025");
  });

  it("adjusts with the arrow, page, Home and End keys", async () => {
    const { spans, state } = setup(undefined, ["05", "31", "2025"]);
    (spans[0] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(state.values[0]).toBe("06");
    await userEvent.keyboard("{PageDown}");
    expect(state.values[0]).toBe("01");
    await userEvent.keyboard("{End}");
    expect(state.values[0]).toBe("12");
    await userEvent.keyboard("{ArrowRight}{Home}");
    expect(state.values[1]).toBe("01");
    expect(focused()).toBe(spans[1]);
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(focused()).toBe(spans[0]);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(focused()).toBe(spans[2]);
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(state.values[2]).toBe("2025");
  });

  it("flips ← / → in right-to-left fields (ADR-0030)", async () => {
    const { group, spans } = setup();
    group.dir = "rtl";
    (spans[0] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(focused()).toBe(spans[1]);
    await userEvent.keyboard("{ArrowRight}");
    expect(focused()).toBe(spans[0]);
    await userEvent.keyboard("{Control>}a{/Control}{ArrowLeft}");
    expect(focused()).toBe(spans[2]);
  });

  it("clears a section, or every section after select-all", async () => {
    const { spans, state } = setup(undefined, ["05", "25", "2025"]);
    (spans[1] as HTMLElement).focus();
    await userEvent.keyboard("{Backspace}");
    expect(state.values).toEqual(["05", "", "2025"]);
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(spans[0]?.parentElement?.hasAttribute("data-ok-all-selected")).toBe(true);
    await userEvent.keyboard("{Delete}");
    expect(state.values).toEqual(["", "", ""]);
    expect(focused()).toBe(spans[0]);
  });

  it("after select-all, typing starts over and arrows pick an end", async () => {
    const { spans, state } = setup(undefined, ["05", "25", "2025"]);
    (spans[1] as HTMLElement).focus();
    await userEvent.keyboard("{Meta>}a{/Meta}");
    await userEvent.keyboard("1");
    expect(state.values).toEqual(["01", "", ""]);
    await userEvent.keyboard("{Control>}a{/Control}{ArrowRight}");
    expect(focused()).toBe(spans[2]);
    await userEvent.keyboard("{Control>}a{/Control}{ArrowLeft}");
    expect(focused()).toBe(spans[0]);
    await userEvent.keyboard("{Control>}a{/Control}{ArrowUp}");
    expect(state.values[0]).toBe("02");
  });

  it("ignores keys that don't fit and keeps queries for five seconds", async () => {
    const { spans, state } = setup();
    (spans[0] as HTMLElement).focus();
    await userEvent.keyboard("x");
    expect(state.values).toEqual(["", "", ""]);
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000);
    beforeInput(spans[0] as HTMLElement, "insertText", "1");
    expect(state.values[0]).toBe("01");
    now.mockReturnValue(7_000);
    beforeInput(spans[0] as HTMLElement, "insertText", "1");
    // The old "1" expired: "1" again, not "11".
    expect(state.values[0]).toBe("01");
    now.mockReturnValue(7_500);
    beforeInput(spans[0] as HTMLElement, "insertText", "1");
    expect(state.values[0]).toBe("11");
    expect(focused()).toBe(spans[1]);
  });

  it("never lets the browser edit the text", () => {
    const { spans, state } = setup();
    const span = spans[0] as HTMLElement;
    span.focus();
    expect(beforeInput(span, "insertText", "5").defaultPrevented).toBe(true);
    expect(beforeInput(span, "insertFromPaste", "5").defaultPrevented).toBe(true);
    expect(beforeInput(span, "deleteContentBackward", null).defaultPrevented).toBe(true);
    expect(beforeInput(span, "historyUndo", null).defaultPrevented).toBe(false);
    // Composition can't be canceled: nothing is applied until `input`.
    expect(beforeInput(span, "insertCompositionText", "6", false).defaultPrevented).toBe(false);
    expect(state.values[0]).toBe("05");
  });

  it("restores text the browser changed anyway, then applies it", () => {
    const { spans, state, group } = setup();
    const span = spans[1] as HTMLElement;
    span.focus();
    span.textContent = "DD7";
    span.dispatchEvent(new InputEvent("input", { bubbles: true, data: "7" }));
    expect(state.values[1]).toBe("07");
    expect(span.textContent).toBe("07");
    span.textContent = "junk";
    span.dispatchEvent(new InputEvent("input", { bubbles: true, data: null }));
    expect(span.textContent).toBe("07");
    // Input on the group itself (not a section) is ignored.
    group.dispatchEvent(new InputEvent("input", { bubbles: true, data: "1" }));
    expect(state.values[1]).toBe("07");
  });

  it("pastes whole values, or types partial ones", () => {
    const { spans, state } = setup();
    (spans[0] as HTMLElement).focus();
    expect(paste(spans[0] as HTMLElement, "12/24/2025").defaultPrevented).toBe(true);
    expect(state.values).toEqual(["12", "24", "2025"]);
    expect(focused()).toBe(spans[2]);
    (spans[0] as HTMLElement).focus();
    paste(spans[0] as HTMLElement, "3");
    expect(state.values[0]).toBe("03");
  });

  it("read-only: navigates but doesn't change", async () => {
    const { spans, state, changes } = setup(undefined, ["05", "25", "2025"]);
    state.readOnly = true;
    (spans[0] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowUp}1{Backspace}{ArrowRight}");
    paste(spans[1] as HTMLElement, "01/01/2020");
    expect(changes).toEqual([]);
    expect(focused()).toBe(spans[1]);
    await userEvent.keyboard("{Control>}a{/Control}{Delete}");
    expect(changes).toEqual([]);
  });

  it("disabled: ignores keys and presses", async () => {
    const { spans, state, group } = setup();
    state.disabled = true;
    (spans[0] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}{ArrowUp}");
    expect(focused()).toBe(spans[0]);
    expect(state.values).toEqual(["", "", ""]);
    group.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    expect(focused()).toBe(spans[0]);
  });

  it("a press beside the sections focuses the first empty one, else the last", () => {
    const { spans, state, group } = setup(undefined, ["05", "", "2025"]);
    const press = () => {
      const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      group.dispatchEvent(event);
      return event;
    };
    expect(press().defaultPrevented).toBe(true);
    expect(focused()).toBe(spans[1]);
    state.values = ["05", "25", "2025"];
    press();
    expect(focused()).toBe(spans[2]);
    // A press on a section is left to the browser.
    const onSection = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    (spans[0] as HTMLElement).dispatchEvent(onSection);
    expect(onSection.defaultPrevented).toBe(false);
  });

  it("focuses sections on request, syncs and cleans up", async () => {
    const { spans, controller, state } = setup(undefined, ["05", "25", "2025"]);
    controller.sync(); // not focused: nothing to do
    controller.focusSection("last");
    expect(focused()).toBe(spans[2]);
    controller.focusSection(99);
    expect(focused()).toBe(spans[2]);
    controller.focusSection(-3);
    expect(focused()).toBe(spans[0]);
    await userEvent.keyboard("{Control>}a{/Control}");
    controller.sync();
    expect(selectedText()).toBe("05");
    // Leaving the field forgets the select-all.
    (document.querySelector("button") as HTMLElement).focus();
    (spans[1] as HTMLElement).focus();
    await userEvent.keyboard("{Backspace}");
    expect(state.values).toEqual(["05", "", "2025"]);
    controller.destroy();
    await userEvent.keyboard("{ArrowUp}");
    expect(state.values[1]).toBe("");
  });

  it("does nothing for a field without sections", () => {
    const host = mount('<div role="group"></div>');
    const controller = createFieldController(host.firstElementChild as HTMLElement, {
      read: () => ({
        sections: [],
        values: [],
        placeholders: [],
        locale: "en-US",
        reference: new Date(),
        disabled: false,
        readOnly: false,
      }),
      onValuesChange: () => {},
    });
    controller.focusSection(0);
    expect(document.activeElement).toBe(document.body);
  });
});

describe("createFieldController — unfocused and unusual input", () => {
  it("typing and deleting before any section had focus use the first section", () => {
    const { group, state } = setup();
    beforeInput(group, "insertText", "7");
    expect(state.values[0]).toBe("07");
    const other = setup();
    beforeInput(other.group, "deleteContentBackward", null);
    expect(other.changes).toEqual([]);
    beforeInput(other.group, "insertText", null);
    expect(other.changes).toEqual([]);
  });

  it("ignores focus on the group itself, keys already handled and pastes without data", async () => {
    const { group, spans, state, actives } = setup(undefined, ["05", "25", "2025"]);
    group.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(actives).toEqual([]);
    (spans[0] as HTMLElement).addEventListener("keydown", (e) => e.preventDefault());
    (spans[0] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(state.values[0]).toBe("05");
    const event = new Event("paste", { bubbles: true, cancelable: true });
    (spans[1] as HTMLElement).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(state.values).toEqual(["05", "25", "2025"]);
  });
});
