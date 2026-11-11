import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFocusedViewTracker,
  focusPickerViewPart,
  pickerViewOf,
  pickerViewTarget,
} from "./focused-view.js";
import { rangeFieldSections } from "./range.js";

// Focused views (roadmap 4.18.30): MUI X `focusedView` / `onFocusedViewChange`.

const roots: HTMLElement[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) root.remove();
});
const mount = (html: string) => {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.append(root);
  roots.push(root);
  return root;
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const MARKUP = `
  <div data-ok-date-calendar data-ok-view="day">
    <div role="grid" data-ok-day-calendar>
      <button id="d1" data-ok-picker-day tabindex="-1">1</button>
      <button id="d2" data-ok-picker-day tabindex="0">2</button>
    </div>
    <div role="radiogroup" data-ok-year-calendar hidden>
      <button id="y" role="radio" tabindex="0">2025</button>
    </div>
  </div>
  <div data-ok-time-clock data-ok-view="minutes">
    <div id="clock" role="listbox" data-ok-time-clock-options tabindex="0"></div>
  </div>
  <div data-ok-digital-clock><ul id="list" data-ok-digital-clock-list><li id="t" tabindex="0">09:00</li></ul></div>
  <div data-ok-multi-section-digital-clock>
    <ul data-ok-digital-clock-section="hours"><li id="h" tabindex="0">9</li></ul>
    <ul data-ok-digital-clock-section="meridiem"><li id="m" tabindex="0">AM</li></ul>
  </div>
  <button id="outside">Outside</button>`;

describe("focused views", () => {
  it("finds the view of an element and its tab stop", () => {
    const root = mount(MARKUP);
    const el = (id: string) => root.querySelector(`#${id}`) as HTMLElement;
    expect(pickerViewOf(root, el("d1"))).toBe("day");
    expect(pickerViewOf(root, el("y"))).toBe("year");
    expect(pickerViewOf(root, el("clock"))).toBe("minutes");
    expect(pickerViewOf(root, el("t"))).toBe("hours");
    expect(pickerViewOf(root, el("h"))).toBe("hours");
    expect(pickerViewOf(root, el("m"))).toBe("meridiem");
    expect(pickerViewOf(root, el("outside"))).toBeNull();
    expect(pickerViewOf(root, null)).toBeNull();
    // Outside the root: none.
    expect(pickerViewOf(el("list"), el("d1"))).toBeNull();
    const calendar = root.querySelector("[data-ok-date-calendar]") as HTMLElement;
    expect(pickerViewTarget(calendar, "day")).toBe(el("d2"));
    // A hidden view has no tab stop.
    expect(pickerViewTarget(calendar, "year")).toBeNull();
    const month = mount(
      '<div role="radiogroup" data-ok-month-calendar><button tabindex="0">May</button></div>',
    );
    expect(pickerViewOf(month, month.querySelector("button"))).toBe("month");
    const bare = mount('<div data-ok-time-clock-options tabindex="0"></div>');
    expect(pickerViewOf(bare, bare.firstElementChild)).toBe("hours");
  });

  it("moves the focus into a view unless it is there", () => {
    const root = mount(MARKUP);
    const clock = root.querySelector<HTMLElement>("[data-ok-time-clock]") as HTMLElement;
    expect(focusPickerViewPart(clock, "minutes")).toBe(true);
    expect(document.activeElement?.id).toBe("clock");
    expect(focusPickerViewPart(clock, "minutes")).toBe(true);
    expect(focusPickerViewPart(clock, "hours")).toBe(false);
    expect(focusPickerViewPart(root, "meridiem")).toBe(true);
    expect(document.activeElement?.id).toBe("m");
  });

  it("reports views that take and lose the focus", async () => {
    const root = mount(MARKUP);
    const el = (id: string) => root.querySelector(`#${id}`) as HTMLElement;
    const onChange = vi.fn();
    const tracker = createFocusedViewTracker(root, onChange);
    el("d2").focus();
    expect(onChange.mock.calls).toEqual([["day", true]]);
    expect(tracker.view).toBe("day");
    el("d1").focus();
    expect(onChange).toHaveBeenCalledTimes(1);
    el("clock").focus();
    expect(onChange.mock.calls.slice(1)).toEqual([
      ["day", false],
      ["minutes", true],
    ]);
    // The clock switches its view while it keeps the focus.
    (root.querySelector("[data-ok-time-clock]") as HTMLElement).setAttribute(
      "data-ok-view",
      "hours",
    );
    await tick();
    expect(onChange.mock.calls.slice(3)).toEqual([
      ["minutes", false],
      ["hours", true],
    ]);
    el("outside").focus();
    expect(onChange.mock.calls.at(-1)).toEqual(["hours", false]);
    expect(tracker.view).toBeNull();
    // A focused view removed without a focusout: the next check notices.
    el("h").focus();
    el("h").remove();
    tracker.sync();
    expect(tracker.view).toBeNull();
    tracker.destroy();
    onChange.mockClear();
    el("t").focus();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("range field date separator", () => {
  it("joins the two dates with the separator between spaces", () => {
    const { sections } = rangeFieldSections("MM/DD/YYYY");
    expect(sections[2]?.endSeparator).toBe(" – ");
    const custom = rangeFieldSections("MM/DD/YYYY", false, "to");
    expect(custom.sections[2]?.endSeparator).toBe(" to ");
    expect(custom.count).toBe(3);
  });
});
