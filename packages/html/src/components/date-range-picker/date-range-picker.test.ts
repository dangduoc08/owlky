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
import type { DateFieldInstance } from "../date-field/date-field.js";
import {
  type DateRangeCalendarInstance,
  toRange,
} from "../date-range-calendar/date-range-calendar.js";
import { components } from "../index.js";
import type { MultiInputRangeFieldInstance } from "../multi-input-range-field/multi-input-range-field.js";
import type { DateRangePickerInstance } from "./date-range-picker.js";

const snippets = Object.entries(
  import.meta.glob("../date-picker/examples/*.html", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
) as [string, string][];
const snippet = (name: string) =>
  snippets.find(([path]) => path.endsWith(`/${name}.html`))?.[1] as string;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.restoreAllMocks();
});
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime as Runtime;
};
const byId = (id: string) => document.getElementById(id) as HTMLElement;
const q = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<E>(selector) as E;
const day = (iso: string, root: ParentNode = document) => q(`[data-ok-date="${iso}"]`, root);
const pickerOf = (id: string) => byId(id).closest("[data-ok-date-range-picker]") as HTMLElement;
const texts = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>('[role="spinbutton"]')].map((s) => s.textContent);
const events = (element: Element, names: string[]) => {
  const log: [string, unknown][] = [];
  for (const name of names)
    element.addEventListener(name, (e) => log.push([name, (e as CustomEvent).detail]));
  return log;
};
const labels = (root: ParentNode = document) =>
  [...root.querySelectorAll("[data-ok-date-calendar-label]")].map((l) => l.textContent);
function pointer(type: string, target: Element, init: PointerEventInit = {}) {
  const rect = target.getBoundingClientRect();
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 9,
      pointerType: "mouse",
      button: 0,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      ...init,
    }),
  );
}
function pointerFine(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches,
        media: query,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList,
  );
}

describe("date range calendar (HTML)", () => {
  it("picks the start then the end, previews, drags and emits", async () => {
    mount(snippet("range-calendar"));
    const rt = start();
    const root = byId("dr-calendar");
    const calendar = rt.get<DateRangeCalendarInstance>(
      root,
      "date-range-calendar",
    ) as DateRangeCalendarInstance;
    const log = events(root, [
      "ok:date-range-calendar:change",
      "ok:date-range-calendar:rangepositionchange",
      "ok:date-range-calendar:monthchange",
    ]);
    expect(calendar.value).toBe("2025-05-20/2025-05-25");
    expect(calendar.calendars).toBe(2);
    expect(calendar.month).toBe("2025-05");
    expect(labels(root)).toEqual(["May 2025", "June 2025"]);
    await userEvent.click(day("2025-05-12", root));
    expect(log[0]).toEqual([
      "ok:date-range-calendar:change",
      { value: "2025-05-12/2025-05-25", selectionState: "partial" },
    ]);
    expect(calendar.rangePosition).toBe("end");
    pointer("pointerover", day("2025-06-02", root));
    expect(day("2025-06-01", root).hasAttribute("data-ok-in-preview")).toBe(true);
    root.dispatchEvent(new PointerEvent("pointerleave"));
    expect(root.querySelector("[data-ok-in-preview]")).toBeNull();
    await userEvent.click(day("2025-06-02", root));
    expect(calendar.value).toBe("2025-05-12/2025-06-02");
    expect(log.at(-1)).toEqual([
      "ok:date-range-calendar:rangepositionchange",
      { rangePosition: "start" },
    ]);
    // Drag the end back to 30 May.
    pointer("pointerdown", day("2025-06-02", root));
    pointer("pointermove", day("2025-05-30", root));
    expect(day("2025-05-31", root).hasAttribute("data-ok-in-preview")).toBe(false);
    expect(day("2025-05-29", root).hasAttribute("data-ok-in-preview")).toBe(true);
    pointer("pointerup", day("2025-05-30", root));
    day("2025-05-30", root).click();
    expect(calendar.value).toBe("2025-05-12/2025-05-30");
    pointer("pointerdown", day("2025-05-12", root));
    pointer("pointermove", day("2025-05-13", root));
    pointer("pointercancel", day("2025-05-13", root));
    expect(root.querySelector("[data-ok-in-preview]")).toBeNull();
    // Keys move through the months.
    day("2025-05-12", root).focus();
    await userEvent.keyboard("{PageDown}{PageDown}");
    expect(calendar.month).toBe("2025-06");
    expect(log.some(([name]) => name === "ok:date-range-calendar:monthchange")).toBe(true);
    await userEvent.click(q("[data-ok-date-calendar-prev]", root));
    expect(calendar.month).toBe("2025-05");
    await expectNoAxeViolations(document.body);
    expectCspSafe(document.body, snippet("range-calendar"));
  });

  it("instance methods and canceled picks", async () => {
    mount(snippet("range-calendar"));
    const rt = start();
    const root = byId("dr-calendar");
    const calendar = rt.get<DateRangeCalendarInstance>(
      root,
      "date-range-calendar",
    ) as DateRangeCalendarInstance;
    root.addEventListener("ok:date-range-calendar:change", (e) => e.preventDefault(), {
      once: true,
    });
    await userEvent.click(day("2025-05-02", root));
    expect(calendar.value).toBe("2025-05-20/2025-05-25");
    calendar.setValue([new Date(2025, 8, 2), "2025-09-09"]);
    expect(labels(root)).toEqual(["September 2025", "October 2025"]);
    calendar.setRangePosition("end");
    calendar.setValue("2025-12-01/2026-02-10");
    expect(labels(root)).toEqual(["January 2026", "February 2026"]);
    calendar.setValue("nope");
    calendar.setValue([1, 2] as never);
    calendar.setValue(["2025-01-01"] as never);
    expect(calendar.value).toBe("2025-12-01/2026-02-10");
    calendar.setValue(null);
    expect(calendar.value).toBeNull();
    calendar.setRangePosition("middle" as never);
    expect(calendar.rangePosition).toBe("end");
    calendar.setCalendars(1);
    calendar.setCalendars(9);
    expect(calendar.calendars).toBe(1);
    expect(root.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(1);
    calendar.setAvailableRangePositions(["end", "x" as never]);
    await userEvent.click(q("[data-ok-picker-day]:not(:disabled)", root));
    expect(calendar.rangePosition).toBe("end");
    calendar.setAvailableRangePositions(null);
    calendar.setShouldDisableDate(() => true);
    expect(root.querySelector("[data-ok-picker-day]:not(:disabled)")).toBeNull();
    calendar.setShouldDisableDate(null);
    calendar.setShouldDisableMonth(null);
    calendar.setShouldDisableYear(null);
    calendar.setDayOfWeekFormatter((date) => `d${date.getDay()}`);
    expect(q('[role="columnheader"]', root).textContent).toBe("d0");
    calendar.setLocaleText({ previousMonth: "Back" });
    expect(q("[data-ok-date-calendar-prev]", root).getAttribute("aria-label")).toBe("Back");
    calendar.focus();
    expect(document.activeElement?.hasAttribute("data-ok-picker-day")).toBe(true);
  });

  it("three months with week numbers, one month with outside days, toRange", () => {
    mount(snippet("range-calendars-three"));
    mount(snippet("range-calendars-one"));
    start();
    expect(labels(byId("rc-three"))).toEqual(["May 2025", "June 2025", "July 2025"]);
    expect(byId("rc-three").querySelectorAll('[role="rowheader"]').length).toBeGreaterThan(0);
    expect(byId("rc-one").querySelectorAll("[data-ok-outside]").length).toBeGreaterThan(0);
    const ref = new Date(2025, 4, 1);
    expect(toRange("", ref)).toEqual([null, null]);
    expect(toRange([null, ""], ref)).toEqual([null, null]);
    expect(toRange([new Date(Number.NaN), null], ref)).toBeUndefined();
    expect(toRange({}, ref)).toBeUndefined();
  });

  it("builds a calendar without markup months, with limits and loading", () => {
    mount(
      `<div id="b" data-ok-date-range-calendar data-ok-calendars="2" data-ok-current-month-calendar-position="2"
        data-ok-min-date="2025-01-01" data-ok-max-date="2025-12-31" data-ok-loading data-ok-disabled></div>`,
    );
    start();
    const root = byId("b");
    expect(root.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(2);
    expect(root.querySelector("[data-ok-date-calendar-loading]")).toBeTruthy();
  });
});

describe("range fields (HTML)", () => {
  it("single input: types both dates, reports [start, end] errors, setValue / setError", async () => {
    mount(snippet("range-fields-single"));
    const rt = start();
    const root = byId("rf-date").closest("[data-ok-date-field]") as HTMLElement;
    const field = rt.get<DateFieldInstance>(root, "date-field") as DateFieldInstance;
    const log = events(root, ["ok:date-field:change"]);
    expect(field.value).toBe("2025-05-20/2025-05-25");
    expect(texts(root)).toEqual(["05", "20", "2025", "05", "25", "2025"]);
    const spins = root.querySelectorAll<HTMLElement>('[role="spinbutton"]');
    spins[4]?.focus();
    await userEvent.keyboard("10");
    expect(log.at(-1)?.[1]).toEqual({
      value: "2025-05-20/2025-05-10",
      validationError: ["invalidRange", "invalidRange"],
    });
    expect(root.hasAttribute("data-ok-error")).toBe(true);
    expect(field.validationError).toEqual(["invalidRange", "invalidRange"]);
    spins[3]?.focus();
    await userEvent.keyboard("{Backspace}");
    expect(log.at(-1)?.[1]).toEqual({
      value: "2025-05-20/",
      validationError: [null, "invalidDate"],
    });
    field.setValue([new Date(2025, 6, 1), null]);
    expect(texts(root)).toEqual(["07", "01", "2025", "MM", "DD", "YYYY"]);
    field.setValue("bad");
    field.setValue(new Date());
    expect(field.value).toBe("2025-07-01/");
    field.setError(true);
    expect(root.hasAttribute("data-ok-error")).toBe(true);
    field.setError(null);
    expect(root.hasAttribute("data-ok-error")).toBe(false);
    // Time and date time range fields.
    const time = byId("rf-time").closest("[data-ok-date-field]") as HTMLElement;
    expect(rt.get<DateFieldInstance>(time, "date-field")?.value).toBe("09:00:00/17:30:00");
    await expectNoAxeViolations(document.body);
  });

  it("multi input: marks both fields on invalidRange; canceling cancels the field", async () => {
    mount(snippet("range-fields-multi"));
    const rt = start();
    const root = byId("rf-multi-date-start").closest(
      "[data-ok-multi-input-range-field]",
    ) as HTMLElement;
    const group = rt.get<MultiInputRangeFieldInstance>(
      root,
      "multi-input-range-field",
    ) as MultiInputRangeFieldInstance;
    const log = events(root, ["ok:multi-input-range-field:change"]);
    expect(group.value).toBe("2025-05-20/2025-05-25");
    byId("rf-multi-date-end").querySelectorAll<HTMLElement>('[role="spinbutton"]')[1]?.focus();
    await userEvent.keyboard("10");
    await settle();
    expect(log.at(-1)?.[1]).toEqual({
      value: "2025-05-20/2025-05-10",
      validationError: ["invalidRange", "invalidRange"],
    });
    expect(root.querySelectorAll("[data-ok-date-field][data-ok-error]")).toHaveLength(2);
    expect(group.validationError).toEqual(["invalidRange", "invalidRange"]);
    const cancel = (e: Event) => e.preventDefault();
    root.addEventListener("ok:multi-input-range-field:change", cancel);
    byId("rf-multi-date-start").querySelectorAll<HTMLElement>('[role="spinbutton"]')[1]?.focus();
    await userEvent.keyboard("01");
    expect(group.value).toBe("2025-05-20/2025-05-10");
    expect(
      byId("rf-multi-date-start").closest("[data-ok-date-field]")?.getAttribute("data-ok-value"),
    ).toBe("2025-05-20");
    root.removeEventListener("ok:multi-input-range-field:change", cancel);
    byId("rf-multi-date-start").querySelectorAll<HTMLElement>('[role="spinbutton"]')[0]?.focus();
    await userEvent.keyboard("{Backspace}");
    await settle();
    expect(log.at(-1)?.[1]).toEqual({
      value: "/2025-05-10",
      validationError: ["invalidDate", null],
    });
    group.setValue("2025-05-01/2025-05-02");
    expect(group.value).toBe("2025-05-01/2025-05-02");
    expect(root.querySelectorAll("[data-ok-date-field][data-ok-error]")).toHaveLength(0);
    group.setValue("x");
    expect(group.value).toBe("2025-05-01/2025-05-02");
    const time = byId("rf-multi-time-start").closest(
      "[data-ok-multi-input-range-field]",
    ) as HTMLElement;
    expect(rt.get<MultiInputRangeFieldInstance>(time, "multi-input-range-field")?.value).toBe(
      "09:00:00/17:30:00",
    );
  });
});

describe("date range picker (HTML)", () => {
  it("desktop: opens two months, the end pick accepts and closes", async () => {
    for (const name of snippets
      .map(([path]) => path)
      .filter((path) => /\/(range|time-ranges)-/.test(path)))
      expectCspSafe(
        mount(snippet(name.replace(/^.*\/|\.html$/g, ""))),
        snippet(name.replace(/^.*\/|\.html$/g, "")),
      );
    resetPage();
    mount(snippet("range-input"));
    const rt = start();
    const root = pickerOf("dr-basic");
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    const log = events(root, [
      "ok:date-range-picker:open",
      "ok:date-range-picker:close",
      "ok:date-range-picker:change",
      "ok:date-range-picker:accept",
      "ok:date-range-picker:rangepositionchange",
    ]);
    const button = q<HTMLButtonElement>("[data-ok-date-picker-open]", root);
    expect(button.getAttribute("aria-label")).toBe(
      "Choose range, selected range is May 20, 2025 – May 25, 2025",
    );
    await userEvent.click(button);
    expect(picker.isOpen).toBe(true);
    const paper = q("[data-ok-date-picker-paper]", root);
    expect(paper.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(2);
    expect(document.activeElement?.getAttribute("data-ok-date")).toBe("2025-05-20");
    await userEvent.click(day("2025-05-12", paper));
    await settle();
    expect(picker.value).toBe("2025-05-12/2025-05-25");
    expect(picker.rangePosition).toBe("end");
    await userEvent.click(day("2025-06-03", paper));
    await settle();
    expect(picker.isOpen).toBe(false);
    const names = log.map(([name]) => name);
    expect(names[0]).toBe("ok:date-range-picker:open");
    expect(names.slice(-2), names.join()).toEqual([
      "ok:date-range-picker:accept",
      "ok:date-range-picker:close",
    ]);
    expect(names).toContain("ok:date-range-picker:rangepositionchange");
    expect(texts(root)).toEqual(["05", "12", "2025", "06", "03", "2025"]);
    expect(document.activeElement).toBe(button);
    // Typing in the field changes the picker.
    root.querySelectorAll<HTMLElement>('[role="spinbutton"]')[4]?.focus();
    await userEvent.keyboard("05");
    expect(picker.value).toBe("2025-05-12/2025-06-05");
    root.querySelectorAll<HTMLElement>('[role="spinbutton"]')[4]?.focus();
    await userEvent.keyboard("{Backspace}");
    expect(picker.value).toBe("2025-05-12/");
    await expectNoAxeViolations(document.body);
  });

  it("desktop: Escape, the button and focus in the field close; keepOpen keeps it", async () => {
    mount(snippet("range-input"));
    const rt = start();
    const root = pickerOf("dr-basic");
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    const log = events(root, ["ok:date-range-picker:close"]);
    picker.open();
    await userEvent.keyboard("{Escape}");
    expect(log.at(-1)?.[1]).toEqual({ reason: "escape" });
    await userEvent.click(q("[data-ok-date-picker-open]", root));
    await userEvent.click(q("[data-ok-date-picker-open]", root));
    expect(log.at(-1)?.[1]).toEqual({ reason: "button" });
    picker.open("end");
    expect(picker.rangePosition).toBe("end");
    q<HTMLElement>('[role="spinbutton"]', root).focus();
    expect(log.at(-1)?.[1]).toEqual({ reason: "clickaway" });
    root.setAttribute("data-ok-keep-open-during-field-focus", "");
    picker.open();
    q<HTMLElement>('[role="spinbutton"]', root).focus();
    expect(picker.isOpen).toBe(true);
    picker.close();
    expect(log.at(-1)?.[1]).toEqual({ reason: "api" });
  });

  it("multi input: the end button opens on the end; keepOpen follows the focused field", async () => {
    mount(snippet("range-input"));
    const rt = start();
    const root = pickerOf("dr-multi-start");
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    const end = q<HTMLButtonElement>(
      '[data-ok-date-picker-open][data-ok-range-position="end"]',
      root,
    );
    expect(end.getAttribute("aria-label")).toBe("Choose date, selected date is May 25, 2025");
    await userEvent.click(end);
    expect(picker.rangePosition).toBe("end");
    await userEvent.click(day("2025-05-10", q("[data-ok-date-picker-paper]", root)));
    await settle();
    expect(picker.value).toBe("2025-05-10/");
    expect(
      byId("dr-multi-end").closest("[data-ok-date-field]")?.getAttribute("data-ok-value"),
    ).toBeNull();
    await userEvent.keyboard("{Escape}");
    root.setAttribute("data-ok-keep-open-during-field-focus", "");
    picker.open("start");
    byId("dr-multi-end").querySelector<HTMLElement>('[role="spinbutton"]')?.focus();
    expect(picker.rangePosition).toBe("end");
    byId("dr-multi-start").querySelector<HTMLElement>('[role="spinbutton"]')?.focus();
    expect(picker.rangePosition).toBe("start");
    // A press outside closes a keep-open popover once focus leaves the fields.
    (document.activeElement as HTMLElement).blur();
    q("[data-ok-date-picker-paper]", root).dispatchEvent(
      new CustomEvent("ok:popover:close", { detail: { reason: "backdrop" } }),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(picker.isOpen).toBe(false);
    // Typing in a field reaches the picker through the group.
    byId("dr-multi-start").querySelectorAll<HTMLElement>('[role="spinbutton"]')[1]?.focus();
    await userEvent.keyboard("01");
    await settle();
    expect(picker.value).toBe("2025-05-01/");
  });

  it("mobile: a dialog with the toolbar; Cancel restores, OK accepts", async () => {
    pointerFine(false);
    mount(snippet("range-input"));
    const rt = start();
    const root = pickerOf("dr-basic");
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    const log = events(root, ["ok:date-range-picker:accept", "ok:date-range-picker:change"]);
    await userEvent.click(q("[data-ok-date-picker-open]", root));
    const dialog = q<HTMLDialogElement>("[data-ok-date-picker-dialog]", root);
    expect(dialog.open).toBe(true);
    expect(dialog.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(1);
    const toolbar = q("[data-ok-picker-toolbar]", dialog);
    expect(toolbar.hidden).toBe(false);
    const endButton = q('[data-ok-picker-toolbar-button][data-ok-range-position="end"]', toolbar);
    await userEvent.click(endButton);
    expect(endButton.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(day("2025-05-28", dialog));
    await settle();
    expect(picker.value).toBe("2025-05-20/2025-05-28");
    await userEvent.click(q('[data-ok-picker-action="cancel"]', dialog));
    expect(picker.value).toBe("2025-05-20/2025-05-25");
    await userEvent.click(q("[data-ok-date-picker-open]", root));
    await userEvent.click(day("2025-05-12", dialog));
    await settle();
    await userEvent.click(q('[data-ok-picker-action="accept"]', dialog));
    expect(log.at(-1)).toEqual(["ok:date-range-picker:accept", { value: "2025-05-12/2025-05-25" }]);
    await userEvent.click(q("[data-ok-date-picker-open]", root));
    dialog.dispatchEvent(new CustomEvent("ok:dialog:close", { detail: { reason: "escape" } }));
    expect(picker.isOpen).toBe(false);
  });

  it("static: actions and calendars; shortcuts from markup and functions", async () => {
    mount(snippet("range-static"));
    mount(snippet("range-shortcuts-filter"));
    const rt = start();
    const root = q('[data-ok-date-range-picker][data-ok-picker-variant="static"]');
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    const log = events(root, ["ok:date-range-picker:accept"]);
    expect(root.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(1);
    await userEvent.click(day("2025-05-02", root));
    await settle();
    await userEvent.click(day("2025-05-06", root));
    await settle();
    expect(picker.value).toBe("2025-05-02/2025-05-06");
    await userEvent.click(q('[data-ok-picker-action="cancel"]', root));
    expect(picker.value).toBe("2025-05-20/2025-05-25");
    await userEvent.click(day("2025-05-02", root));
    await settle();
    await userEvent.click(q('[data-ok-picker-action="accept"]', root));
    expect(log.at(-1)?.[1]).toEqual({ value: "2025-05-02/2025-05-25" });
    // Dashboard filter: two months and shortcut chips.
    const filterRoot = q("[data-ok-picker-shortcuts]").closest(
      "[data-ok-date-range-picker]",
    ) as HTMLElement;
    const filterPicker = rt.get<DateRangePickerInstance>(
      filterRoot,
      "date-range-picker",
    ) as DateRangePickerInstance;
    expect(filterRoot.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(2);
    const chips = [
      ...filterRoot.querySelectorAll<HTMLElement>(
        "[data-ok-picker-shortcut] [data-ok-chip-action]",
      ),
    ];
    await userEvent.click(chips[2] as HTMLElement);
    expect(filterPicker.value).toBe("2025-05-19/2025-05-25");
    await userEvent.click(chips[5] as HTMLElement);
    expect(filterPicker.value).toBeNull();
    filterPicker.setShortcuts([
      { label: "Fn", getValue: () => [new Date(2025, 0, 1), new Date(2025, 0, 2)] },
      { label: "Bad", getValue: () => [new Date(2025, 0, 2), new Date(2025, 0, 1)] },
    ]);
    await userEvent.click(chips[0] as HTMLElement);
    expect(filterPicker.value).toBe("2025-01-01/2025-01-02");
    await userEvent.click(chips[1] as HTMLElement);
    expect(filterPicker.value).toBe("2025-01-01/2025-01-02");
    filterPicker.setShortcuts("nope" as never);
    await expectNoAxeViolations(document.body);
  });

  it("instance methods; Today, Clear and Next actions", async () => {
    mount(snippet("range-static"));
    const host = q("[data-ok-picker-actions]");
    for (const action of ["clear", "today", "nextOrAccept"]) {
      const button = (q("[data-ok-picker-action]", host) as HTMLElement).cloneNode(
        true,
      ) as HTMLElement;
      button.setAttribute("data-ok-picker-action", action);
      button.setAttribute("data-ok-test", action);
      host.append(button);
    }
    const rt = start();
    const root = q("[data-ok-date-range-picker]");
    root.setAttribute("data-ok-actions", "clear today nextOrAccept accept");
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    picker.setValue("2025-05-01/2025-05-03");
    expect(picker.value).toBe("2025-05-01/2025-05-03");
    picker.setValue([new Date(2025, 4, 4), null]);
    expect(picker.value).toBe("2025-05-04/");
    picker.setValue("x");
    expect(picker.value).toBe("2025-05-04/");
    picker.setRangePosition("x" as never);
    picker.setShouldDisableDate(() => false);
    picker.setShouldDisableTime(null);
    picker.setLocaleText({ start: "From", end: "To", nextStepButtonLabel: "On" });
    expect(
      q('[data-ok-picker-toolbar-button][data-ok-range-position="end"]', root).textContent,
    ).toBe("To");
    expect(q('[data-ok-test="nextOrAccept"]').textContent?.trim()).toBe("On");
    await userEvent.click(q('[data-ok-test="nextOrAccept"]'));
    expect(picker.rangePosition).toBe("end");
    expect(q('[data-ok-test="nextOrAccept"]').textContent?.trim()).toBe("OK");
    await userEvent.click(q('[data-ok-test="nextOrAccept"]'));
    await userEvent.click(q('[data-ok-test="clear"]'));
    expect(picker.value).toBeNull();
    await userEvent.click(q('[data-ok-test="today"]'));
    const [from, to] = (picker.value ?? "").split("/");
    expect(from).toBe(to);
    // Static pickers don't open or close.
    picker.open();
    picker.close();
    expect(picker.isOpen).toBe(false);
    root.setAttribute("data-ok-close-on-select", "true");
    picker.setValue("2025-05-04/2025-05-06");
    picker.setRangePosition("start");
    await userEvent.click(day("2025-05-08", root));
    await settle();
    await userEvent.click(day("2025-05-09", root));
    await settle();
    expect(picker.value).toBe("2025-05-08/2025-05-09");
  });

  it("time ranges: tabs and digital clocks on desktop, the analog clock on mobile", async () => {
    mount(snippet("time-ranges-time"));
    const rt = start();
    const root = pickerOf("tr-basic");
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    expect(q("[data-ok-date-picker-open]", root).getAttribute("aria-label")).toBe(
      "Choose range, selected range is 09:00 AM – 05:30 PM",
    );
    await userEvent.click(q("[data-ok-date-picker-open]", root));
    const paper = q("[data-ok-date-picker-paper]", root);
    await userEvent.click(q('[data-ok-digital-clock-section="hours"] [data-ok-value="10"]', paper));
    expect(picker.value).toBe("10:00:00/17:30:00");
    await userEvent.click(
      q('[data-ok-digital-clock-section="minutes"] [data-ok-value="15"]', paper),
    );
    await userEvent.click(
      q('[data-ok-digital-clock-section="meridiem"] [data-ok-value="0"]', paper),
    );
    expect(picker.rangePosition).toBe("end");
    await userEvent.click(q('[role="tab"]', paper));
    await settle();
    expect(picker.rangePosition).toBe("start");
    await userEvent.click(q('[data-ok-picker-action="accept"]', paper));
    expect(picker.isOpen).toBe(false);
    picker.setShouldDisableTime(() => false);
    // The mobile picker: the toolbar and the clock.
    const mobile = pickerOf("tr-mobile");
    await userEvent.click(q("[data-ok-date-picker-open]", mobile));
    const dialog = q("[data-ok-date-picker-dialog]", mobile);
    expect(q("[data-ok-time-clock]", dialog).hidden).toBe(false);
    q<HTMLElement>('[role="listbox"]', dialog).focus();
    await userEvent.keyboard("{ArrowUp}{Enter}");
    const mobilePicker = rt.get<DateRangePickerInstance>(
      mobile,
      "date-range-picker",
    ) as DateRangePickerInstance;
    expect(mobilePicker.value).toBe("10:00:00/17:30:00");
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Enter}");
    expect(mobilePicker.rangePosition).toBe("end");
    await userEvent.click(q('[data-ok-picker-action="cancel"]', dialog));
    expect(mobilePicker.value).toBe("09:00:00/17:30:00");
  });

  it("date time ranges: a day keeps the end's time; mobile goes on to the clock", async () => {
    mount(snippet("time-ranges-date-time"));
    const rt = start();
    const root = pickerOf("dtr-basic");
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    await userEvent.click(q("[data-ok-date-picker-open]", root));
    const paper = q("[data-ok-date-picker-paper]", root);
    expect(paper.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(1);
    await userEvent.click(
      [...paper.querySelectorAll<HTMLElement>('[role="tab"]')][1] as HTMLElement,
    );
    await settle();
    await userEvent.click(day("2025-05-29", paper));
    await settle();
    expect(picker.value).toBe("2025-05-25T10:00:00/2025-05-29T16:00:00");
    await userEvent.keyboard("{Escape}");
    const mobile = pickerOf("dtr-mobile");
    const mobilePicker = rt.get<DateRangePickerInstance>(
      mobile,
      "date-range-picker",
    ) as DateRangePickerInstance;
    await userEvent.click(q("[data-ok-date-picker-open]", mobile));
    const dialog = q("[data-ok-date-picker-dialog]", mobile);
    await userEvent.click(day("2025-05-22", dialog));
    await settle();
    expect(mobilePicker.value).toBe("2025-05-22T10:00:00/2025-05-27T16:00:00");
    expect(q("[data-ok-time-clock]", dialog).hidden).toBe(false);
    expect(q("[data-ok-date-range-calendar]", dialog).hidden).toBe(true);
    await userEvent.click(
      q('[data-ok-picker-toolbar-button][data-ok-range-position="end"]', dialog),
    );
    expect(mobilePicker.rangePosition).toBe("end");
  });

  it("field shortcuts in the popover and stop()", async () => {
    mount(snippet("range-shortcuts-field"));
    const rt = start();
    const root = pickerOf("rs-field");
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    await userEvent.click(q("[data-ok-date-picker-open]", root));
    const paper = q("[data-ok-date-picker-paper]", root);
    const chips = paper.querySelectorAll<HTMLElement>(
      "[data-ok-picker-shortcut] [data-ok-chip-action]",
    );
    await userEvent.click(chips[0] as HTMLElement);
    expect(picker.value).toBe("2025-05-25/2025-05-31");
    expect(picker.isOpen).toBe(false);
    picker.open();
    rt.stop();
    runtime = undefined;
    expect(paper.matches(":popover-open")).toBe(false);
  });
});

describe("range edge cases (HTML)", () => {
  it("calendars: limits around today, no id, no position attribute, canceled drops", () => {
    mount(
      `<div data-ok-date-range-calendar data-ok-calendars="1" data-ok-range-position="end"
        data-ok-min-date="2090-01-01"></div>
       <div id="late" data-ok-date-range-calendar data-ok-calendars="1" data-ok-max-date="2000-03-31"></div>
       <div id="drop" data-ok-date-range-calendar data-ok-calendars="1" data-ok-month="2025-05"
        data-ok-value="2025-05-20/2025-05-25"></div>`,
    );
    const rt = start();
    const [future] = [...document.querySelectorAll<HTMLElement>("[data-ok-date-range-calendar]")];
    expect(labels(future)).toEqual(["January 2090"]);
    expect(q("[data-ok-date-calendar-label]", future).hasAttribute("id")).toBe(false);
    expect(labels(byId("late"))).toEqual(["March 2000"]);
    const drop = byId("drop");
    const calendar = rt.get<DateRangeCalendarInstance>(
      drop,
      "date-range-calendar",
    ) as DateRangeCalendarInstance;
    calendar.setAvailableRangePositions(["x" as never]);
    drop.addEventListener("ok:date-range-calendar:change", (e) => e.preventDefault());
    pointer("pointerdown", day("2025-05-25", drop));
    pointer("pointermove", day("2025-05-27", drop));
    pointer("pointerup", day("2025-05-27", drop));
    expect(calendar.value).toBe("2025-05-20/2025-05-25");
    expect(calendar.rangePosition).toBe("start");
  });

  it("fields: empty and invalid values, a non-range setValue of a pair", () => {
    mount(
      `<div data-ok-text-field data-ok-date-field data-ok-range data-ok-value="nope" data-ok-format="MM/DD/YYYY">
         <div data-ok-text-field-control><div id="e" role="group" data-ok-date-field-sections>
           <span role="spinbutton" tabindex="0"></span><span role="spinbutton"></span><span role="spinbutton"></span>
           <span role="spinbutton"></span><span role="spinbutton"></span><span role="spinbutton"></span>
         </div><input type="hidden" data-ok-date-field-input></div></div>
       <div data-ok-text-field data-ok-date-field data-ok-format="MM/DD/YYYY">
         <div data-ok-text-field-control><div id="one" role="group" data-ok-date-field-sections>
           <span role="spinbutton" tabindex="0"></span><span role="spinbutton"></span><span role="spinbutton"></span>
         </div></div></div>`,
    );
    const rt = start();
    const range = rt.get<DateFieldInstance>(
      byId("e").closest("[data-ok-date-field]") as HTMLElement,
      "date-field",
    ) as DateFieldInstance;
    expect(range.value).toBeNull();
    expect(texts(byId("e"))).toEqual(["MM", "DD", "YYYY", "MM", "DD", "YYYY"]);
    const one = rt.get<DateFieldInstance>(
      byId("one").closest("[data-ok-date-field]") as HTMLElement,
      "date-field",
    ) as DateFieldInstance;
    one.setValue([new Date(), null]);
    expect(one.value).toBeNull();
  });

  it("multi input: empty and invalid sides, clearing a field, setValue(null)", async () => {
    mount(snippet("range-fields-multi"));
    const startEl = byId("rf-multi-date-start").closest("[data-ok-date-field]") as HTMLElement;
    const endEl = byId("rf-multi-date-end").closest("[data-ok-date-field]") as HTMLElement;
    startEl.removeAttribute("data-ok-value");
    endEl.setAttribute("data-ok-value", "bad");
    const rt = start();
    const root = startEl.parentElement as HTMLElement;
    const group = rt.get<MultiInputRangeFieldInstance>(
      root,
      "multi-input-range-field",
    ) as MultiInputRangeFieldInstance;
    expect(group.value).toBeNull();
    expect(root.hasAttribute("data-ok-value")).toBe(false);
    const log = events(root, ["ok:multi-input-range-field:change"]);
    byId("rf-multi-date-end").querySelectorAll<HTMLElement>('[role="spinbutton"]')[0]?.focus();
    await userEvent.keyboard("06102025");
    await settle();
    expect(group.value).toBe("/2025-06-10");
    byId("rf-multi-date-end").querySelectorAll<HTMLElement>('[role="spinbutton"]')[0]?.focus();
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    await settle();
    expect(log.at(-1)?.[1]).toEqual({ value: null, validationError: [null, null] });
    group.setValue(null);
    expect(group.value).toBeNull();
  });

  it("pickers: empty values, closeOnSelect off, outside presses, dialog backdrop, time end finish", async () => {
    mount(snippet("range-input"));
    mount(snippet("time-ranges-time"));
    const basic = byId("dr-basic").closest("[data-ok-date-field]") as HTMLElement;
    basic.removeAttribute("data-ok-value");
    const rt = start();
    const root = pickerOf("dr-basic");
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    expect(picker.value).toBeNull();
    root.setAttribute("data-ok-close-on-select", "false");
    picker.open();
    const paper = q("[data-ok-date-picker-paper]", root);
    const first = q("[data-ok-picker-day]:not(:disabled)", paper);
    await userEvent.click(first);
    await settle();
    await userEvent.click(
      q("[data-ok-picker-day][data-ok-range-start] ~ [data-ok-picker-day]", paper) ?? first,
    );
    await settle();
    expect(picker.isOpen).toBe(true);
    paper.dispatchEvent(new CustomEvent("ok:popover:close", { detail: { reason: "backdrop" } }));
    expect(picker.isOpen).toBe(false);
    // keepOpen: a press on the field (focus inside it) keeps the popover.
    root.setAttribute("data-ok-keep-open-during-field-focus", "");
    picker.open();
    q<HTMLElement>('[role="spinbutton"]', root).focus();
    paper.dispatchEvent(new CustomEvent("ok:popover:close", { detail: { reason: "backdrop" } }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(picker.isOpen).toBe(true);
    picker.close();
    // Mobile, then desktop again: the layout moves back into the popover.
    const mobile = pickerOf("dr-mobile");
    const mobilePicker = rt.get<DateRangePickerInstance>(
      mobile,
      "date-range-picker",
    ) as DateRangePickerInstance;
    mobilePicker.open();
    q("[data-ok-date-picker-dialog]", mobile).dispatchEvent(
      new CustomEvent("ok:dialog:close", { detail: { reason: "backdrop" } }),
    );
    expect(mobilePicker.isOpen).toBe(false);
    pointerFine(false);
    picker.open();
    expect(q("[data-ok-date-picker-dialog] [data-ok-picker-layout]", root)).toBeTruthy();
    picker.close();
    vi.restoreAllMocks();
    picker.open();
    expect(q("[data-ok-date-picker-paper] [data-ok-picker-layout]", root)).toBeTruthy();
    picker.close();
    // Time range: the end's last view finishes; an empty end takes the start's day.
    const time = pickerOf("tr-basic");
    const timePicker = rt.get<DateRangePickerInstance>(
      time,
      "date-range-picker",
    ) as DateRangePickerInstance;
    timePicker.setValue("09:00/");
    time.setAttribute("data-ok-close-on-select", "true");
    timePicker.open("end");
    const timePaper = q("[data-ok-date-picker-paper]", time);
    await userEvent.click(
      q('[data-ok-digital-clock-section="hours"] [data-ok-value="5"]', timePaper),
    );
    await userEvent.click(
      q('[data-ok-digital-clock-section="minutes"] [data-ok-value="0"]', timePaper),
    );
    await userEvent.click(
      q('[data-ok-digital-clock-section="meridiem"] [data-ok-value="1"]', timePaper),
    );
    expect(timePicker.value).toBe("09:00:00/17:00:00");
    expect(timePicker.isOpen).toBe(false);
    timePicker.setValue(null);
    timePicker.open();
    await userEvent.click(
      q('[data-ok-digital-clock-section="hours"] [data-ok-value="7"]', timePaper),
    );
    expect(timePicker.value?.startsWith("07:00:00")).toBe(true);
  });

  it("multi input pickers: setShouldDisableDate reaches both fields", () => {
    mount(snippet("range-input"));
    const rt = start();
    const root = pickerOf("dr-multi-start");
    const picker = rt.get<DateRangePickerInstance>(
      root,
      "date-range-picker",
    ) as DateRangePickerInstance;
    picker.setShouldDisableDate((date) => date.getDate() === 25);
    expect(
      byId("dr-multi-end").closest("[data-ok-date-field]")?.hasAttribute("data-ok-error"),
    ).toBe(true);
    picker.setShouldDisableDate(null);
  });
});
