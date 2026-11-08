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
import type { DateCalendarInstance } from "../date-calendar/date-calendar.js";
import type { ListCalendarInstance } from "../date-calendar/list-calendar.js";
import type { DateFieldInstance } from "../date-field/date-field.js";
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
  vi.restoreAllMocks();
});
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
const byId = (id: string) => document.getElementById(id) as HTMLElement;
const pickerOf = (fieldId: string) => byId(fieldId).closest("[data-ok-date-picker]") as HTMLElement;
const fieldOf = (fieldId: string) => byId(fieldId).closest("[data-ok-date-field]") as HTMLElement;
const sectionsOf = (fieldId: string) => [
  ...byId(fieldId).querySelectorAll<HTMLElement>('[role="spinbutton"]'),
];
const texts = (fieldId: string) => sectionsOf(fieldId).map((s) => s.textContent);
const day = (root: ParentNode, date: string) =>
  root.querySelector<HTMLButtonElement>(`[data-ok-date="${date}"]`) as HTMLButtonElement;
const events = (element: Element, names: string[]) => {
  const log: [string, unknown][] = [];
  for (const name of names)
    element.addEventListener(name, (e) => log.push([name, (e as CustomEvent).detail]));
  return log;
};

describe("date pickers (HTML)", () => {
  it("every snippet is CSP-safe and accessible", async () => {
    for (const [path, html] of snippets) {
      const host = mount(html);
      expectCspSafe(host, html);
      start();
      await settle();
      await expectNoAxeViolations(host);
      runtime?.stop();
      host.remove();
      expect(path).toMatch(/\.html$/);
    }
  });

  it("field: types a date, updates the hidden input and reports changes", async () => {
    mount(snippet("validation-states"));
    start();
    const field = fieldOf("dv-clearable");
    const log = events(field, ["ok:date-field:change", "ok:date-field:clear"]);
    const instance = runtime?.get<DateFieldInstance>(field, "date-field") as DateFieldInstance;
    expect(instance.value).toBe("2025-05-25");
    await userEvent.click(field.querySelector("[data-ok-date-field-clear]") as HTMLElement);
    expect(texts("dv-clearable")).toEqual(["MM", "DD", "YYYY"]);
    expect(field.hasAttribute("data-ok-shrink")).toBe(false);
    expect(log.map(([n]) => n)).toEqual(["ok:date-field:change", "ok:date-field:clear"]);
    await userEvent.keyboard("0101203");
    // "0203" is a whole year already: a valid date before the minimum (1900).
    expect(log.at(-1)).toEqual([
      "ok:date-field:change",
      { value: "0203-01-01", validationError: "minDate" },
    ]);
    await userEvent.keyboard("0");
    expect(log.at(-1)).toEqual([
      "ok:date-field:change",
      { value: "2030-01-01", validationError: null },
    ]);
    expect((field.querySelector("input[type=hidden]") as HTMLInputElement).value).toBe(
      "2030-01-01",
    );
    expect(field.getAttribute("data-ok-value")).toBe("2030-01-01");
    expect(sectionsOf("dv-clearable")[0]?.getAttribute("aria-valuetext")).toBe("January");
  });

  it("field: a canceled change keeps the value; API sets values and rules", async () => {
    mount(snippet("validation-states"));
    start();
    const field = fieldOf("dv-clearable");
    field.addEventListener("ok:date-field:change", (e) => e.preventDefault());
    (sectionsOf("dv-clearable")[0] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(texts("dv-clearable")).toEqual(["05", "25", "2025"]);
    const instance = runtime?.get<DateFieldInstance>(field, "date-field") as DateFieldInstance;
    instance.setValue("2024-02-29");
    expect(texts("dv-clearable")).toEqual(["02", "29", "2024"]);
    instance.setValue("nonsense");
    instance.setValue(new Date(Number.NaN));
    expect(instance.value).toBe("2024-02-29");
    instance.setShouldDisableDate((d) => d.getDate() === 29);
    expect(instance.validationError).toBe("shouldDisableDate");
    expect(field.hasAttribute("data-ok-error")).toBe(true);
    instance.setShouldDisableDate(null);
    instance.setShouldDisableMonth((d) => d.getMonth() === 1);
    expect(instance.validationError).toBe("shouldDisableMonth");
    instance.setShouldDisableMonth(null);
    instance.setShouldDisableYear(() => true);
    expect(instance.validationError).toBe("shouldDisableYear");
    instance.setLocaleText({ month: "Mo" });
    expect(sectionsOf("dv-clearable")[0]?.getAttribute("aria-label")).toBe("Mo");
    instance.setValue(null);
    expect(instance.value).toBeNull();
    instance.focus(2);
    expect(document.activeElement).toBe(sectionsOf("dv-clearable")[2]);
  });

  it("field: past dates are an error; read-only and disabled fields don't change", async () => {
    mount(snippet("validation-past-future"));
    mount(snippet("validation-states"));
    start();
    expect(fieldOf("dv-past").hasAttribute("data-ok-error")).toBe(true);
    expect(byId("dv-past").getAttribute("aria-invalid")).toBe("true");
    expect(fieldOf("dv-future").hasAttribute("data-ok-error")).toBe(false);
    (sectionsOf("dv-read-only")[0] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(texts("dv-read-only")).toEqual(["05", "25", "2025"]);
    expect(sectionsOf("dv-disabled")[0]?.getAttribute("tabindex")).toBe("-1");
    expect(
      (pickerOf("dv-disabled").querySelector("[data-ok-date-picker-open]") as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("field: format from the views and the locale when there's no data-ok-format", () => {
    mount(`<div data-ok-locale="vi-VN"><div data-ok-text-field data-ok-date-field data-ok-value="2025-05-25" data-ok-views="year month">
      <div data-ok-text-field-control><div role="group" data-ok-date-field-sections>
        <span role="spinbutton" tabindex="0"></span><span role="spinbutton" tabindex="-1"></span>
      </div></div></div></div>`);
    start();
    // Engines differ on the case of Vietnamese month names.
    expect(
      [...document.querySelectorAll('[role="spinbutton"]')].map((s) =>
        s.textContent?.toLowerCase(),
      ),
    ).toEqual(["tháng 5", "2025"]);
  });

  it("desktop picker: opens a popover, keys move the day, Enter picks and closes", async () => {
    mount(snippet("date-basic"));
    start();
    const picker = pickerOf("dp-desktop");
    const log = events(picker, [
      "ok:date-picker:open",
      "ok:date-picker:change",
      "ok:date-picker:accept",
      "ok:date-picker:close",
    ]);
    const button = picker.querySelector("[data-ok-date-picker-open]") as HTMLElement;
    expect(button.getAttribute("aria-label")).toBe("Choose date, selected date is May 25, 2025");
    await userEvent.click(button);
    expect(picker.hasAttribute("data-ok-open")).toBe(true);
    expect(picker.querySelector("[data-ok-date-picker-paper]")?.hasAttribute("data-ok-open")).toBe(
      true,
    );
    expect(document.activeElement).toBe(day(picker, "2025-05-25"));
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await settle();
    expect(log.map(([n]) => n)).toEqual([
      "ok:date-picker:open",
      "ok:date-picker:change",
      "ok:date-picker:accept",
      "ok:date-picker:close",
    ]);
    expect(log[1]?.[1]).toEqual({ value: "2025-05-26", validationError: null });
    expect(log[3]?.[1]).toEqual({ reason: "select" });
    expect(texts("dp-desktop")).toEqual(["05", "26", "2025"]);
    expect(picker.hasAttribute("data-ok-open")).toBe(false);
    expect(button.getAttribute("aria-label")).toBe("Choose date, selected date is May 26, 2025");
  });

  it("desktop picker: Escape closes and accepts; typing updates the calendar", async () => {
    mount(snippet("date-basic"));
    start();
    const picker = pickerOf("dp-desktop");
    const log = events(picker, ["ok:date-picker:close", "ok:date-picker:accept"]);
    (sectionsOf("dp-desktop")[1] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.click(picker.querySelector("[data-ok-date-picker-open]") as HTMLElement);
    expect(day(picker, "2025-05-26").getAttribute("aria-selected")).toBe("true");
    await userEvent.keyboard("{Escape}");
    expect(log).toEqual([
      ["ok:date-picker:accept", { value: "2025-05-26" }],
      ["ok:date-picker:close", { reason: "escape" }],
    ]);
  });

  it("mobile picker: a dialog with a toolbar, Cancel restores, OK accepts", async () => {
    mount(snippet("date-basic"));
    start();
    const picker = pickerOf("dp-mobile");
    const log = events(picker, [
      "ok:date-picker:change",
      "ok:date-picker:accept",
      "ok:date-picker:close",
    ]);
    await userEvent.click(picker.querySelector("[data-ok-date-picker-open]") as HTMLElement);
    const dialog = picker.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    await userEvent.click(day(dialog, "2025-05-03"));
    await settle();
    expect(dialog.querySelector("[data-ok-picker-toolbar-title]")?.textContent).toBe("Sat, May 3");
    expect(dialog.open).toBe(true);
    await userEvent.click(dialog.querySelector('[data-ok-picker-action="cancel"]') as HTMLElement);
    expect(log.at(-2)).toEqual([
      "ok:date-picker:change",
      { value: "2025-05-25", validationError: null },
    ]);
    expect(log.at(-1)).toEqual(["ok:date-picker:close", { reason: "cancel" }]);
    await userEvent.click(picker.querySelector("[data-ok-date-picker-open]") as HTMLElement);
    await userEvent.click(day(dialog, "2025-05-04"));
    await settle();
    await userEvent.click(dialog.querySelector('[data-ok-picker-action="accept"]') as HTMLElement);
    expect(log.filter(([n]) => n === "ok:date-picker:accept")).toEqual([
      ["ok:date-picker:accept", { value: "2025-05-04" }],
    ]);
    // Escape on mobile cancels.
    await userEvent.click(picker.querySelector("[data-ok-date-picker-open]") as HTMLElement);
    await userEvent.click(day(dialog, "2025-05-06"));
    await settle();
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(texts("dp-mobile")).toEqual(["05", "04", "2025"]);
  });

  it("responsive picker: moves the layout into the dialog when the media query fails", async () => {
    mount(snippet("date-basic"));
    start();
    const picker = pickerOf("dp-basic");
    picker.setAttribute("data-ok-desktop-mode-media-query", "@media (min-width: 99999px)");
    const instance = runtime?.get<DatePickerInstance>(picker, "date-picker") as DatePickerInstance;
    instance.open();
    expect(instance.isOpen).toBe(true);
    const dialog = picker.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.querySelector("[data-ok-picker-layout]")).toBeTruthy();
    expect(dialog.querySelector<HTMLElement>("[data-ok-picker-toolbar]")?.hidden).toBe(false);
    expect(dialog.querySelector<HTMLElement>("[data-ok-picker-actions]")?.hidden).toBe(false);
    instance.close();
    expect(instance.isOpen).toBe(false);
    picker.removeAttribute("data-ok-desktop-mode-media-query");
    instance.open();
    expect(
      picker.querySelector("[data-ok-date-picker-paper] [data-ok-picker-layout]"),
    ).toBeTruthy();
    expect(picker.querySelector<HTMLElement>("[data-ok-picker-toolbar]")?.hidden).toBe(true);
    instance.close();
  });

  it("picker API: value, rules, texts, and clickaway / keep open during field focus", async () => {
    mount(snippet("date-basic"));
    start();
    const picker = pickerOf("dp-desktop");
    const instance = runtime?.get<DatePickerInstance>(picker, "date-picker") as DatePickerInstance;
    instance.setValue("2025-07-04");
    expect(instance.value).toBe("2025-07-04");
    expect(texts("dp-desktop")).toEqual(["07", "04", "2025"]);
    instance.setValue("bad");
    expect(instance.value).toBe("2025-07-04");
    instance.setShouldDisableDate((d) => d.getDate() === 5);
    instance.setShouldDisableMonth(() => false);
    instance.setShouldDisableYear(() => false);
    instance.setLocaleText({ nextMonth: "Forward" });
    instance.open();
    expect(day(picker, "2025-07-05").disabled).toBe(true);
    expect(picker.querySelector("[data-ok-date-calendar-next]")?.getAttribute("aria-label")).toBe(
      "Forward",
    );
    // Focusing the field closes a desktop picker…
    (sectionsOf("dp-desktop")[0] as HTMLElement).focus();
    expect(instance.isOpen).toBe(false);
    // …unless it keeps open during field focus.
    picker.setAttribute("data-ok-keep-open-during-field-focus", "");
    instance.open();
    (sectionsOf("dp-desktop")[0] as HTMLElement).focus();
    expect(instance.isOpen).toBe(true);
    // A press outside (the field above; the popover covers the ones below).
    await userEvent.click(sectionsOf("dp-basic")[0] as HTMLElement);
    await new Promise((r) => setTimeout(r, 20));
    expect(instance.isOpen).toBe(false);
  });

  it("static picker: actions, shortcuts, today and clear", async () => {
    mount(snippet("shortcuts-actions"));
    start();
    const picker = byId("ds-shortcuts-calendar").closest("[data-ok-date-picker]") as HTMLElement;
    const log = events(picker, ["ok:date-picker:change", "ok:date-picker:accept"]);
    await userEvent.click(day(picker, "2025-05-03"));
    await settle();
    expect(picker.querySelector("[data-ok-picker-toolbar-title]")?.textContent).toBe("Sat, May 3");
    await userEvent.click(picker.querySelector('[data-ok-picker-action="cancel"]') as HTMLElement);
    expect(day(picker, "2025-05-25").getAttribute("aria-selected")).toBe("true");
    const chip = picker.querySelector(
      "[data-ok-picker-shortcut] [data-ok-chip-action]",
    ) as HTMLElement;
    await userEvent.click(chip);
    expect(log.at(-1)).toEqual(["ok:date-picker:accept", { value: "2025-12-25" }]);
    expect(picker.querySelector("[data-ok-date-calendar-label]")?.textContent).toBe(
      "December 2025",
    );
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2025, 2, 3, 12) });
    await userEvent.click(picker.querySelector('[data-ok-picker-action="today"]') as HTMLElement);
    vi.useRealTimers();
    expect(log.at(-1)).toEqual(["ok:date-picker:accept", { value: "2025-03-03" }]);
    await userEvent.click(picker.querySelector('[data-ok-picker-action="clear"]') as HTMLElement);
    expect(log.at(-1)).toEqual(["ok:date-picker:accept", { value: null }]);
    expect(picker.querySelector("[data-ok-picker-toolbar-title]")?.textContent).toBe("––");
    // Computed shortcuts replace the fixed values.
    const instance = runtime?.get<DatePickerInstance>(picker, "date-picker") as DatePickerInstance;
    instance.setShortcuts([{ label: "x", getValue: () => new Date(2026, 1, 2) }]);
    await userEvent.click(chip);
    expect(log.at(-1)).toEqual(["ok:date-picker:accept", { value: "2026-02-02" }]);
    instance.setShortcuts("junk" as never);
  });

  it("nextOrAccept steps through views (static picker)", async () => {
    mount(`<div data-ok-date-picker data-ok-picker-variant="static" data-ok-actions="nextOrAccept">
      <div data-ok-picker-layout><div data-ok-picker-content>
        <div id="nx" data-ok-date-calendar data-ok-views="year month day" data-ok-open-to="year" data-ok-value="2025-05-25">
          <div data-ok-date-calendar-header><div data-ok-date-calendar-label id="nx-label"></div>
            <button data-ok-date-calendar-switch aria-label="switch"></button></div>
        </div></div>
        <div data-ok-picker-actions><button data-ok-picker-action="nextOrAccept">Next</button></div>
      </div></div>`);
    start();
    const calendar = byId("nx");
    const log = events(calendar.closest("[data-ok-date-picker]") as HTMLElement, [
      "ok:date-picker:accept",
    ]);
    expect(calendar.getAttribute("data-ok-view")).toBe("year");
    const next = document.querySelector('[data-ok-picker-action="nextOrAccept"]') as HTMLElement;
    await userEvent.click(next);
    expect(calendar.getAttribute("data-ok-view")).toBe("month");
    await userEvent.click(next);
    expect(next.textContent).toBe("OK");
    await userEvent.click(next);
    expect(log).toEqual([]);
  });
});

describe("date calendar (HTML)", () => {
  it("keys, month arrows, the switch, years then days", async () => {
    mount(snippet("calendars-basic"));
    start();
    const calendar = byId("dc-basic");
    const log = events(calendar, [
      "ok:date-calendar:change",
      "ok:date-calendar:viewchange",
      "ok:date-calendar:monthchange",
      "ok:date-calendar:yearchange",
    ]);
    day(calendar, "2025-05-25").focus();
    await userEvent.keyboard("{PageDown}");
    expect(document.activeElement?.getAttribute("data-ok-date")).toBe("2025-06-25");
    expect(calendar.querySelector("[data-ok-date-calendar-label]")?.textContent).toBe("June 2025");
    await userEvent.click(calendar.querySelector("[data-ok-date-calendar-prev]") as HTMLElement);
    await userEvent.click(day(calendar, "2025-05-02"));
    expect(log.find(([n]) => n === "ok:date-calendar:change")?.[1]).toEqual({
      value: "2025-05-02",
      selectionState: "finish",
    });
    await userEvent.click(calendar.querySelector("[data-ok-date-calendar-switch]") as HTMLElement);
    expect(calendar.querySelector("[data-ok-date-calendar-nav]")).toBeNull();
    await userEvent.click(
      calendar.querySelector('[data-ok-picker-year][data-ok-value="2027"]') as HTMLElement,
    );
    expect(log.filter(([n]) => n === "ok:date-calendar:change").at(-1)?.[1]).toEqual({
      value: "2027-05-02",
      selectionState: "partial",
    });
    expect(
      log.some(
        ([n, d]) => n === "ok:date-calendar:yearchange" && (d as { year: number }).year === 2027,
      ),
    ).toBe(true);
    expect(calendar.querySelector("[data-ok-date-calendar-nav]")).toBeTruthy();
    expect(document.activeElement?.getAttribute("data-ok-date")).toBe("2027-05-02");
    // Back to the year view and out again with the switch.
    await userEvent.click(calendar.querySelector("[data-ok-date-calendar-switch]") as HTMLElement);
    (calendar.querySelector('[data-ok-picker-year][tabindex="0"]') as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.getAttribute("data-ok-value")).toBe("2028");
    await userEvent.click(calendar.querySelector("[data-ok-date-calendar-switch]") as HTMLElement);
    expect(calendar.getAttribute("data-ok-view")).toBe("day");
  });

  it("canceled changes, the API and options", async () => {
    mount(snippet("calendars-weeks"));
    start();
    const calendar = byId("dc-weeks");
    expect(calendar.querySelectorAll('[role="rowheader"]')).toHaveLength(6);
    calendar.addEventListener("ok:date-calendar:change", (e) => e.preventDefault(), { once: true });
    await userEvent.click(day(calendar, "2025-05-05"));
    expect(day(calendar, "2025-05-05").getAttribute("aria-selected")).toBe("false");
    const instance = runtime?.get<DateCalendarInstance>(
      calendar,
      "date-calendar",
    ) as DateCalendarInstance;
    instance.setValue("2025-08-15");
    expect(instance.month).toBe("2025-08");
    expect(instance.value).toBe("2025-08-15");
    instance.setValue(42 as never);
    instance.setView("year");
    expect(instance.view).toBe("year");
    instance.setView("month"); // not one of the views
    expect(instance.view).toBe("year");
    instance.setView("day");
    instance.setDayOfWeekFormatter((d) => `d${d.getDay()}`);
    expect(calendar.querySelectorAll('[role="columnheader"]')[1]?.textContent).toBe("d0");
    instance.setShouldDisableMonth(() => false);
    instance.setShouldDisableYear(() => false);
    instance.setShouldDisableDate((d) => d.getDate() === 1);
    expect(day(calendar, "2025-08-01").disabled).toBe(true);
    instance.setLocaleText({ previousMonth: "Back" });
    expect(calendar.querySelector("[data-ok-date-calendar-prev]")?.getAttribute("aria-label")).toBe(
      "Back",
    );
    calendar.setAttribute("data-ok-loading", "");
    instance.setValue(null);
    expect(calendar.querySelector("[data-ok-date-calendar-loading]")?.textContent).toBe("…");
    instance.focus();
  });

  it("month view picks keep the day when the month has it", async () => {
    mount(`<div id="mv" data-ok-date-calendar data-ok-views="month year" data-ok-value="2025-01-31" data-ok-min-date="2024-01-01" data-ok-max-date="2026-12-31">
      <div data-ok-date-calendar-header><div data-ok-date-calendar-label id="mv-label"></div>
      <button data-ok-date-calendar-switch aria-label="switch"></button></div></div>`);
    start();
    const calendar = byId("mv");
    const log = events(calendar, ["ok:date-calendar:change"]);
    expect(calendar.getAttribute("data-ok-view")).toBe("month");
    await userEvent.click(
      calendar.querySelector('[data-ok-picker-month][data-ok-value="1"]') as HTMLElement,
    );
    expect(log.at(-1)?.[1]).toEqual({ value: "2025-02-28", selectionState: "finish" });
    await userEvent.click(
      calendar.querySelector('[data-ok-picker-month][data-ok-value="2"]') as HTMLElement,
    );
    expect(log.at(-1)?.[1]).toEqual({ value: "2025-03-28", selectionState: "finish" });
    (calendar.querySelector('[data-ok-picker-month][tabindex="0"]') as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.getAttribute("data-ok-value")).toBe("5");
  });

  it("month and year calendars on their own", async () => {
    mount(snippet("calendars-lists"));
    start();
    const month = document.querySelector("[data-ok-month-calendar]") as HTMLElement;
    const year = document.querySelector("[data-ok-year-calendar]") as HTMLElement;
    const log = events(document.body, ["ok:month-calendar:change", "ok:year-calendar:change"]);
    await userEvent.click(month.querySelector('[data-ok-value="6"]') as HTMLElement);
    expect(log.at(-1)).toEqual(["ok:month-calendar:change", { value: "2025-07-25" }]);
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.getAttribute("data-ok-value")).toBe("7");
    await userEvent.click(year.querySelector('[data-ok-value="2028"]') as HTMLElement);
    expect(log.at(-1)).toEqual(["ok:year-calendar:change", { value: "2028-05-25" }]);
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement?.getAttribute("data-ok-value")).toBe("2027");
    const months = runtime?.get<ListCalendarInstance>(
      month,
      "month-calendar",
    ) as ListCalendarInstance;
    months.setShouldDisableMonth((d) => d.getMonth() === 0);
    expect((month.querySelector('[data-ok-value="0"]') as HTMLButtonElement).disabled).toBe(true);
    months.setValue("2025-03-01");
    expect(months.value).toBe("2025-03-01");
    months.setValue("bad");
    months.setValue(null);
    expect(months.value).toBeNull();
    const years = runtime?.get<ListCalendarInstance>(year, "year-calendar") as ListCalendarInstance;
    years.setShouldDisableYear((d) => d.getFullYear() === 2020);
    expect((year.querySelector('[data-ok-value="2020"]') as HTMLButtonElement).disabled).toBe(true);
    year.addEventListener("ok:year-calendar:change", (e) => e.preventDefault(), { once: true });
    await userEvent.click(year.querySelector('[data-ok-value="2030"]') as HTMLElement);
    expect(years.value).toBe("2028-05-25");
  });

  it("a nested date calendar's lists aren't mounted twice; stop() cleans up", async () => {
    mount(snippet("date-static"));
    const rt = start();
    const calendar = byId("dp-static-calendar");
    await userEvent.click(calendar.querySelector("[data-ok-date-calendar-switch]") as HTMLElement);
    const years = calendar.querySelector("[data-ok-year-calendar]") as HTMLElement;
    await settle();
    expect(rt.get(years, "year-calendar")).toBeUndefined();
    rt.stop();
    runtime = undefined;
    expect(rt.get(calendar, "date-calendar")).toBeUndefined();
  });
});
