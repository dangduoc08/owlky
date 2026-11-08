import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanupDom, mount } from "../test-utils.js";
import { createDigitalClockController, createTimeClockController } from "./clock-controller.js";
import type { TimeView } from "./time.js";

afterEach(() => cleanupDom());

/** A 220px clock face like the components render. */
function clock(initial: { view?: TimeView; unit?: number | null; ampm?: boolean } = {}) {
  const host = mount(`
    <div data-ok-time-clock>
      <div data-ok-time-clock-dial style="position:relative;width:220px;height:220px">
        <div role="listbox" data-ok-time-clock-options tabindex="0" aria-label="Select hours"></div>
      </div>
    </div>`);
  const root = host.querySelector<HTMLElement>("[data-ok-time-clock]") as HTMLElement;
  const dial = root.querySelector<HTMLElement>("[data-ok-time-clock-dial]") as HTMLElement;
  const listbox = root.querySelector<HTMLElement>('[role="listbox"]') as HTMLElement;
  const state = {
    view: initial.view ?? ("hours" as TimeView),
    unit: initial.unit === undefined ? 9 : initial.unit,
    ampm: initial.ampm ?? true,
    step: 1,
    disabled: false,
    readOnly: false,
    blocked: new Set<number>(),
  };
  const changes: [number, boolean][] = [];
  const controller = createTimeClockController(root, {
    read: () => ({ ...state, isDisabled: (unit) => state.blocked.has(unit) }),
    onChange: (unit, finish) => {
      changes.push([unit, finish]);
      state.unit = unit;
    },
  });
  const point = (type: string, dx: number, dy: number, extra: PointerEventInit = {}) => {
    const rect = dial.getBoundingClientRect();
    dial.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        button: 0,
        clientX: rect.left + rect.width / 2 + dx,
        clientY: rect.top + rect.height / 2 + dy,
        ...extra,
      }),
    );
  };
  return { root, dial, listbox, state, changes, controller, point };
}

describe("createTimeClockController", () => {
  it("picks the number under the pointer, follows a drag and finishes on release", () => {
    const { point, changes, listbox } = clock();
    point("pointerdown", 90, 0);
    expect(document.activeElement).toBe(listbox);
    point("pointermove", 90, 0);
    point("pointermove", 0, 90);
    point("pointerup", 0, 90);
    expect(changes).toEqual([
      [3, false],
      [6, false],
      [6, true],
    ]);
  });

  it("ignores other buttons, other pointers, disabled numbers and canceled drags", () => {
    const { point, changes, state } = clock();
    point("pointerdown", 90, 0, { button: 2 });
    point("pointermove", 90, 0);
    expect(changes).toEqual([]);
    state.blocked.add(3);
    point("pointerdown", 90, 0);
    point("pointermove", 90, 0, { pointerId: 8 });
    point("pointercancel", 90, 0);
    point("pointerup", 90, 0);
    expect(changes).toEqual([]);
  });

  it("does nothing while disabled or read-only", () => {
    const { point, changes, state, listbox } = clock();
    state.disabled = true;
    point("pointerdown", 90, 0);
    state.disabled = false;
    state.readOnly = true;
    listbox.focus();
    point("pointerdown", 90, 0);
    expect(changes).toEqual([]);
  });

  it("picks the inner ring of a 24-hour clock", () => {
    const { point, changes } = clock({ ampm: false });
    point("pointerdown", 0, -40);
    point("pointerup", 0, -40);
    expect(changes).toEqual([
      [0, false],
      [0, true],
    ]);
  });

  it("snaps minutes to the step", () => {
    const { point, changes, state } = clock({ view: "minutes", unit: 30 });
    state.step = 5;
    point("pointerdown", 88, -12);
    point("pointerup", 88, -12);
    expect(changes.at(-1)).toEqual([15, true]);
  });

  it("steps with the keyboard and finishes with Enter", async () => {
    const { listbox, changes, state } = clock();
    listbox.focus();
    await userEvent.keyboard("{ArrowUp}{ArrowDown}{ArrowDown}{PageUp}{Home}{End}");
    expect(changes.map(([unit]) => unit)).toEqual([10, 9, 8, 1, 1, 12]);
    state.blocked.add(1);
    await userEvent.keyboard("{ArrowUp}");
    expect(changes.at(-1)).toEqual([2, false]);
    await userEvent.keyboard("{Enter}");
    expect(changes.at(-1)).toEqual([2, true]);
    await userEvent.keyboard("{Tab}");
  });

  it("steps minutes by the step and starts from 0 without a value", async () => {
    const { listbox, changes, state } = clock({ view: "minutes", unit: null });
    state.step = 15;
    listbox.focus();
    await userEvent.keyboard("{Enter}{ArrowUp}{ArrowUp}{PageDown}");
    expect(changes).toEqual([
      [15, false],
      [30, false],
      [15, false],
    ]);
  });

  it("refuses keys while read-only, and skips every number when all are disabled", async () => {
    const { listbox, changes, state, controller } = clock();
    state.readOnly = true;
    listbox.focus();
    await userEvent.keyboard("{ArrowUp}{Enter}{Shift}");
    state.readOnly = false;
    for (let i = 1; i <= 12; i++) state.blocked.add(i);
    await userEvent.keyboard("{ArrowUp}{Home}");
    expect(changes).toEqual([]);
    listbox.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true, bubbles: true }),
    );
    controller.destroy();
    state.blocked.clear();
    await userEvent.keyboard("{ArrowUp}");
    expect(changes).toEqual([]);
  });

  it("ignores a face with no size", () => {
    const { dial, point, changes } = clock();
    dial.style.width = "0";
    point("pointerdown", 0, 0);
    expect(changes).toEqual([]);
  });
});

/** Two lists like the multi-section digital clock renders. */
function digital() {
  const host = mount(`
    <div data-ok-multi-section-digital-clock>
      <ul role="listbox" aria-label="Select hours" style="height:80px;overflow:auto;margin:0;padding:0">
        ${Array.from({ length: 12 }, (_, i) => `<li role="option" data-ok-digital-clock-item data-ok-value="${i}" style="height:40px" tabindex="${i === 9 ? 0 : -1}" aria-selected="${i === 9}"${i === 2 ? ' aria-disabled="true"' : ""}>${i}</li>`).join("")}
      </ul>
      <ul role="listbox" aria-label="Select minutes"><li role="option" data-ok-digital-clock-item aria-disabled="true">00</li><li role="option" data-ok-digital-clock-item tabindex="-1">30</li></ul>
      <ul role="listbox" aria-label="Empty"></ul>
    </div>`);
  const root = host.querySelector<HTMLElement>(
    "[data-ok-multi-section-digital-clock]",
  ) as HTMLElement;
  const state = { disabled: false, readOnly: false };
  const selected: string[] = [];
  const controller = createDigitalClockController(root, {
    read: () => state,
    onSelect: (item) => selected.push(item.textContent as string),
  });
  const items = (list: number) => [
    ...(root.querySelectorAll('[role="listbox"]')[list] as Element).querySelectorAll<HTMLElement>(
      "li",
    ),
  ];
  return { root, state, selected, controller, items };
}

describe("createDigitalClockController", () => {
  it("moves focus inside a list, skipping disabled options", async () => {
    const { controller, items } = digital();
    controller.focusList(0);
    expect(document.activeElement).toBe(items(0)[9]);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(document.activeElement).toBe(items(0)[0]);
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(items(0)[11]);
    await userEvent.keyboard("{Home}{ArrowDown}");
    expect(document.activeElement).toBe(items(0)[1]);
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(items(0)[3]);
    await userEvent.keyboard("{PageDown}");
    expect(document.activeElement).toBe(items(0)[8]);
    await userEvent.keyboard("{PageUp}{End}");
    expect(document.activeElement).toBe(items(0)[11]);
    await userEvent.keyboard("{x}");
    expect(document.activeElement).toBe(items(0)[11]);
  });

  it("selects with Enter, Space and presses, never disabled options", async () => {
    const { controller, items, selected, state } = digital();
    controller.focusList(1);
    expect(document.activeElement).toBe(items(1)[1]);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    items(0)[4]?.click();
    items(1)[0]?.click();
    expect(selected).toEqual(["30", "30", "4"]);
    state.readOnly = true;
    items(0)[5]?.click();
    expect(selected).toHaveLength(3);
  });

  it("scrolls each list to its selected option and ignores missing lists", () => {
    const { controller, root } = digital();
    controller.scrollToSelected();
    const list = root.querySelector('[role="listbox"]') as HTMLElement;
    expect(list.scrollTop).toBeGreaterThan(300);
    controller.focusList(5);
    controller.focusList(2);
    root.click();
    controller.destroy();
  });

  it("ignores keys outside options and lists with no enabled option", async () => {
    const { root, items } = digital();
    const list = root.querySelectorAll('[role="listbox"]')[1] as HTMLElement;
    (list.firstElementChild as HTMLElement).setAttribute("tabindex", "-1");
    (list.firstElementChild as HTMLElement).focus();
    (items(1)[1] as HTMLElement).setAttribute("aria-disabled", "true");
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(list.firstElementChild);
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const prevented = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    prevented.preventDefault();
    (items(0)[9] as HTMLElement).dispatchEvent(prevented);
  });
});
