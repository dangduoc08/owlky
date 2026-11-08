import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import type { DateCalendarInstance } from "../date-calendar/date-calendar.js";
import type { ListCalendarInstance } from "../date-calendar/list-calendar.js";
import { components } from "../index.js";
import type { DatePickerInstance } from "./date-picker.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  snippets.find(([path]) => path.endsWith(`/${name}.html`))?.[1] as string;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.useRealTimers();
});
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
const HEADER =
  '<div data-ok-date-calendar-header><div data-ok-date-calendar-label></div><button data-ok-date-calendar-switch aria-label="s"></button></div>';
const calendar = (attrs: string) => {
  const host = mount(`<div data-ok-date-calendar ${attrs}>${HEADER}</div>`);
  // One runtime per test (a second start() would leak a runtime into later tests).
  if (runtime) runtime.init(host);
  else start();
  const element = host.querySelector("[data-ok-date-calendar]") as HTMLElement;
  return {
    element,
    instance: runtime?.get<DateCalendarInstance>(element, "date-calendar") as DateCalendarInstance,
  };
};
const changes = (element: Element, name: string) => {
  const log: unknown[] = [];
  element.addEventListener(name, (e) => log.push((e as CustomEvent).detail));
  return log;
};
const day = (root: ParentNode, date: string) =>
  root.querySelector<HTMLButtonElement>(`[data-ok-date="${date}"]`) as HTMLButtonElement;

describe("date calendar runtime — branches", () => {
  it("without an id or value: no aria-labelledby, today's month clamped into the limits", () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2025, 4, 20, 12) });
    const { element, instance } = calendar('data-ok-min-date="2025-08-10"');
    expect(element.querySelector('[role="grid"]')?.hasAttribute("aria-labelledby")).toBe(false);
    expect(instance.month).toBe("2025-08");
    expect(instance.value).toBeNull();
    expect(
      (element.querySelector("[data-ok-date-calendar-prev]") as HTMLButtonElement).disabled,
    ).toBe(true);
    instance.setView("year");
    expect(element.querySelector("[data-ok-year-calendar]")?.hasAttribute("data-ok-value")).toBe(
      false,
    );
  });

  it("a later max: the limit month; disabled calendars disable the arrows", () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2025, 4, 20, 12) });
    const { element } = calendar('data-ok-max-date="2025-02-10" data-ok-disabled');
    expect(element.getAttribute("data-ok-month")).toBe("2025-02");
    expect(
      (element.querySelector("[data-ok-date-calendar-next]") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("a month with every day disabled keeps a tab stop on its first day", () => {
    const { element, instance } = calendar('data-ok-value="2025-05-25"');
    instance.setShouldDisableDate((date) => date.getMonth() === 5);
    (element.querySelector("[data-ok-date-calendar-next]") as HTMLButtonElement).click();
    expect(day(element, "2025-06-01").tabIndex).toBe(0);
  });

  it("month picks: keep the time, clamp the day, skip disabled days, start on the 1st without a value", async () => {
    const { element } = calendar(
      'data-ok-views="year month day" data-ok-open-to="month" data-ok-value="2025-01-31T08:30"',
    );
    const log = changes(element, "ok:date-calendar:change");
    await userEvent.click(
      element.querySelector('[data-ok-picker-month][data-ok-value="1"]') as HTMLElement,
    );
    expect(log.at(-1)).toEqual({ value: "2025-02-28", selectionState: "partial" });
    element.remove();
    const other = calendar('data-ok-views="month day" data-ok-open-to="month"');
    other.instance.setShouldDisableDate((date) => date.getDate() === 1);
    const log2 = changes(other.element, "ok:date-calendar:change");
    await userEvent.click(
      other.element.querySelector('[data-ok-picker-month][data-ok-value="3"]') as HTMLElement,
    );
    expect((log2.at(-1) as { value: string }).value).toMatch(/-04-02$/);
  });

  it("year picks: leap days clamp, disabled days move to the closest, year-only views finish", async () => {
    const { element, instance } = calendar('data-ok-views="year" data-ok-value="2024-02-29T10:00"');
    instance.setShouldDisableDate((date) => date.getFullYear() === 2026 && date.getMonth() === 1);
    const log = changes(element, "ok:date-calendar:change");
    await userEvent.click(
      element.querySelector('[data-ok-picker-year][data-ok-value="2025"]') as HTMLElement,
    );
    expect(log.at(-1)).toEqual({ value: "2025-02-28", selectionState: "finish" });
    await userEvent.click(
      element.querySelector('[data-ok-picker-year][data-ok-value="2026"]') as HTMLElement,
    );
    expect((log.at(-1) as { value: string }).value.startsWith("2026-")).toBe(true);
    expect((log.at(-1) as { value: string }).value.startsWith("2026-02")).toBe(false);
  });

  it("year picks without a value use today; the switch goes to the month view without days", async () => {
    const { element } = calendar('data-ok-views="year month" data-ok-open-to="year"');
    const log = changes(element, "ok:date-calendar:change");
    await userEvent.click(
      element.querySelector('[data-ok-picker-year][data-ok-value="2027"]') as HTMLElement,
    );
    const today = new Date();
    expect((log.at(-1) as { value: string }).value.slice(0, 7)).toBe(
      `2027-${String(today.getMonth() + 1).padStart(2, "0")}`,
    );
    expect((log.at(-1) as { selectionState: string }).selectionState).toBe("partial");
    await userEvent.click(element.querySelector("[data-ok-date-calendar-switch]") as HTMLElement);
    await userEvent.click(element.querySelector("[data-ok-date-calendar-switch]") as HTMLElement);
    expect(element.getAttribute("data-ok-view")).toBe("month");
  });

  it("a canceled year pick keeps the view", async () => {
    const { element } = calendar('data-ok-value="2025-05-25" data-ok-view="year"');
    element.addEventListener("ok:date-calendar:change", (e) => e.preventDefault());
    await userEvent.click(
      element.querySelector('[data-ok-picker-year][data-ok-value="2027"]') as HTMLElement,
    );
    expect(element.getAttribute("data-ok-view")).toBe("year");
  });
});

describe("month / year calendars on their own — branches", () => {
  it("without a value or a year: today; four months and three years per row", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2025, 4, 20, 12) });
    mount(`<div role="radiogroup" aria-label="M" data-ok-month-calendar data-ok-months-per-row="4">
      ${Array.from({ length: 12 }, (_, m) => `<button role="radio" data-ok-picker-month data-ok-value="${m}">${m}</button>`).join("")}
    </div>
    <div role="radiogroup" aria-label="Y" data-ok-year-calendar data-ok-years-per-row="3">
      ${[2023, 2024, 2025, 2026, 2027, 2028].map((y) => `<button role="radio" data-ok-picker-year data-ok-value="${y}">${y}</button>`).join("")}
    </div>`);
    start();
    const months = document.querySelector("[data-ok-month-calendar]") as HTMLElement;
    expect(months.querySelector('[tabindex="0"]')?.getAttribute("data-ok-value")).toBe("4");
    (months.querySelector('[tabindex="0"]') as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.getAttribute("data-ok-value")).toBe("8");
    const years = document.querySelector("[data-ok-year-calendar]") as HTMLElement;
    (years.querySelector('[tabindex="0"]') as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.getAttribute("data-ok-value")).toBe("2028");
    const instance = runtime?.get<ListCalendarInstance>(
      years,
      "year-calendar",
    ) as ListCalendarInstance;
    instance.setValue(new Date(2023, 0, 1));
    expect(instance.value).toBe("2023-01-01");
  });
});

describe("date picker runtime — branches", () => {
  it("no value: the open button and the toolbar say so; closeOnSelect attributes", async () => {
    mount(snippet("date-basic"));
    start();
    const picker = document
      .getElementById("dp-desktop")
      ?.closest("[data-ok-date-picker]") as HTMLElement;
    const instance = runtime?.get<DatePickerInstance>(picker, "date-picker") as DatePickerInstance;
    instance.setValue(null);
    expect(picker.querySelector("[data-ok-date-picker-open]")?.getAttribute("aria-label")).toBe(
      "Choose date",
    );
    picker.setAttribute("data-ok-close-on-select", "false");
    instance.open();
    await userEvent.click(day(picker, "2025-05-10"));
    await settle();
    expect(instance.isOpen).toBe(true);
    // The open button closes an open picker.
    await userEvent.click(picker.querySelector("[data-ok-date-picker-open]") as HTMLElement);
    expect(instance.isOpen).toBe(false);
    picker.setAttribute("data-ok-close-on-select", "true");
    instance.open();
    await userEvent.click(day(picker, "2025-05-11"));
    await settle();
    expect(instance.isOpen).toBe(false);
    instance.close(); // already closed
  });

  it("emptying the field empties the picker; partial text keeps the value", async () => {
    mount(snippet("date-basic"));
    start();
    const picker = document
      .getElementById("dp-desktop")
      ?.closest("[data-ok-date-picker]") as HTMLElement;
    const log = changes(picker, "ok:date-picker:change");
    const sections = [...picker.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
    (sections[1] as HTMLElement).focus();
    await userEvent.keyboard("{Backspace}");
    expect(log.at(-1)).toEqual({ value: null, validationError: "invalidDate" });
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    expect(log.at(-1)).toEqual({ value: null, validationError: null });
    // Events from other fields or calendars are ignored; invalid calendar values too.
    picker.dispatchEvent(
      new CustomEvent("ok:date-field:change", { bubbles: true, detail: { value: "2025-01-01" } }),
    );
    const calendarEl = picker.querySelector("[data-ok-date-calendar]") as HTMLElement;
    picker.dispatchEvent(
      new CustomEvent("ok:date-calendar:change", { bubbles: true, detail: { value: "x" } }),
    );
    calendarEl.dispatchEvent(
      new CustomEvent("ok:date-calendar:change", { bubbles: true, detail: { value: "x" } }),
    );
    await settle();
    expect(log).toHaveLength(2);
  });

  it("read-only pickers don't open; the today action keeps the time", async () => {
    mount(snippet("validation-states"));
    mount(`<div data-ok-date-picker data-ok-picker-variant="static" data-ok-actions="today">
      <div data-ok-picker-layout><div data-ok-picker-content>
        <div id="tt" data-ok-date-calendar data-ok-value="2025-05-25T07:45">${HEADER}</div>
      </div><div data-ok-picker-actions><button data-ok-picker-action="today">Today</button></div></div></div>`);
    start();
    const readOnly = document
      .getElementById("dv-read-only")
      ?.closest("[data-ok-date-picker]") as HTMLElement;
    (runtime as Runtime).get<DatePickerInstance>(readOnly, "date-picker")?.open();
    expect(readOnly.hasAttribute("data-ok-open")).toBe(false);
    const staticPicker = document
      .getElementById("tt")
      ?.closest("[data-ok-date-picker]") as HTMLElement;
    const log = changes(staticPicker, "ok:date-picker:accept");
    (staticPicker.querySelector('[data-ok-picker-action="today"]') as HTMLElement).click();
    expect(log).toHaveLength(1);
    const calendarEl = document.getElementById("tt") as HTMLElement;
    expect(calendarEl.getAttribute("data-ok-value")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("shortcuts outside the limits are ignored; a press outside a chip does nothing", async () => {
    mount(snippet("shortcuts-actions"));
    start();
    const picker = document
      .getElementById("ds-shortcuts-calendar")
      ?.closest("[data-ok-date-picker]") as HTMLElement;
    const log = changes(picker, "ok:date-picker:accept");
    const chip = picker.querySelector("[data-ok-picker-shortcut]") as HTMLElement;
    chip.setAttribute("data-ok-value", "1800-01-01");
    await userEvent.click(chip.querySelector("[data-ok-chip-action]") as HTMLElement);
    (picker.querySelector("[data-ok-picker-shortcuts]") as HTMLElement).click();
    expect(log).toEqual([]);
  });

  it("keep-open: a press on the field reopens the popover; mobile backdrop presses cancel", async () => {
    mount(snippet("date-basic"));
    start();
    const picker = document
      .getElementById("dp-desktop")
      ?.closest("[data-ok-date-picker]") as HTMLElement;
    picker.setAttribute("data-ok-keep-open-during-field-focus", "");
    const instance = runtime?.get<DatePickerInstance>(picker, "date-picker") as DatePickerInstance;
    instance.open();
    await userEvent.click(picker.querySelector('[role="spinbutton"]') as HTMLElement);
    await new Promise((r) => setTimeout(r, 20));
    expect(instance.isOpen).toBe(true);
    instance.close();
    const mobile = document
      .getElementById("dp-mobile")
      ?.closest("[data-ok-date-picker]") as HTMLElement;
    const mobileInstance = runtime?.get<DatePickerInstance>(
      mobile,
      "date-picker",
    ) as DatePickerInstance;
    const log = changes(mobile, "ok:date-picker:close");
    mobileInstance.open();
    (mobile.querySelector("dialog") as HTMLElement).dispatchEvent(
      new CustomEvent("ok:dialog:close", { detail: { reason: "backdrop" } }),
    );
    expect(log.at(-1)).toEqual({ reason: "clickaway" });
    // A popover close while the picker is closed is ignored.
    (picker.querySelector("[data-ok-date-picker-paper]") as HTMLElement).dispatchEvent(
      new CustomEvent("ok:popover:close", { detail: { reason: "escape" } }),
    );
    expect(instance.isOpen).toBe(false);
  });

  it("views without day open on the last view; destroy closes an open picker", () => {
    mount(snippet("date-playground"));
    const rt = start();
    const picker = document
      .getElementById("dp-my")
      ?.closest("[data-ok-date-picker]") as HTMLElement;
    const calendarEl = picker.querySelector("[data-ok-date-calendar]") as HTMLElement;
    calendarEl.removeAttribute("data-ok-open-to");
    const instance = rt.get<DatePickerInstance>(picker, "date-picker") as DatePickerInstance;
    instance.open();
    expect(calendarEl.getAttribute("data-ok-view")).toBe("month");
    rt.destroy(picker);
    expect(picker.querySelector("[data-ok-date-picker-paper]")?.hasAttribute("data-ok-open")).toBe(
      false,
    );
  });
});

describe("date field runtime — label", () => {
  it("the label points at the group", () => {
    mount(snippet("validation-states"));
    start();
    const field = document
      .getElementById("dv-clearable")
      ?.closest("[data-ok-date-field]") as HTMLElement;
    expect(field.querySelector("label")?.getAttribute("for")).toBe("dv-clearable");
  });
});

describe("date picker runtime — dismissing", () => {
  it("a press outside closes a desktop picker; today without a value; destroy an open desktop picker", async () => {
    mount(snippet("date-basic"));
    const rt = start();
    const picker = document
      .getElementById("dp-desktop")
      ?.closest("[data-ok-date-picker]") as HTMLElement;
    const instance = rt.get<DatePickerInstance>(picker, "date-picker") as DatePickerInstance;
    const log = changes(picker, "ok:date-picker:close");
    instance.open();
    await userEvent.click(
      document.getElementById("dp-basic")?.querySelector('[role="spinbutton"]') as HTMLElement,
    );
    expect(log.at(-1)).toEqual({ reason: "clickaway" });
    instance.open();
    rt.destroy(picker);
    expect(picker.querySelector("[data-ok-date-picker-paper]")?.hasAttribute("data-ok-open")).toBe(
      false,
    );
  });

  it("the today action without a value", () => {
    mount(`<div data-ok-date-picker data-ok-picker-variant="static" data-ok-actions="today">
      <div data-ok-picker-layout><div data-ok-picker-content>
        <div id="t0" data-ok-date-calendar>${HEADER}</div>
      </div><div data-ok-picker-actions><button data-ok-picker-action="today">Today</button></div></div></div>`);
    start();
    const picker = document.getElementById("t0")?.closest("[data-ok-date-picker]") as HTMLElement;
    const log = changes(picker, "ok:date-picker:accept");
    (picker.querySelector('[data-ok-picker-action="today"]') as HTMLElement).click();
    const now = new Date();
    expect((log[0] as { value: string }).value.slice(0, 4)).toBe(String(now.getFullYear()));
  });
});
