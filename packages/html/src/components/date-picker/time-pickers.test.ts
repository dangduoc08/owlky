import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import type { DateFieldInstance } from "../date-field/date-field.js";
import type { DigitalClockInstance } from "../digital-clock/digital-clock.js";
import { components } from "../index.js";
import type { MultiSectionDigitalClockInstance } from "../multi-section-digital-clock/multi-section-digital-clock.js";
import type { TimeClockInstance } from "../time-clock/time-clock.js";
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
  vi.restoreAllMocks();
});
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime as Runtime;
};
const byId = (id: string) => document.getElementById(id) as HTMLElement;
const pickerOf = (id: string) => byId(id).closest("[data-ok-date-picker]") as HTMLElement;
const fieldOf = (id: string) => byId(id).closest("[data-ok-date-field]") as HTMLElement;
const texts = (id: string) =>
  [...byId(id).querySelectorAll<HTMLElement>('[role="spinbutton"]')].map((s) => s.textContent);
const q = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<E>(selector) as E;
const option = (root: ParentNode, list: string, value: string | number) =>
  q(`[data-ok-digital-clock-section="${list}"] [data-ok-value="${value}"]`, root);
const events = (element: Element, names: string[]) => {
  const log: [string, unknown][] = [];
  for (const name of names)
    element.addEventListener(name, (e) => log.push([name, (e as CustomEvent).detail]));
  return log;
};
/** Presses (and releases) a clock face at an offset from its center. */
function pressFace(root: ParentNode, dx: number, dy: number, release = true) {
  const dial = q("[data-ok-time-clock-dial]", root);
  const rect = dial.getBoundingClientRect();
  const init = {
    bubbles: true,
    cancelable: true,
    pointerId: 5,
    button: 0,
    clientX: rect.left + rect.width / 2 + dx,
    clientY: rect.top + rect.height / 2 + dy,
  };
  dial.dispatchEvent(new PointerEvent("pointerdown", init));
  if (release) dial.dispatchEvent(new PointerEvent("pointerup", init));
}

describe("time clock (HTML)", () => {
  it("writes the pointer through CSSOM and steps with the keyboard", async () => {
    mount(snippet("clocks-time-clock"));
    start();
    const clock = byId("tc-basic");
    const pointer = q("[data-ok-time-clock-pointer]", clock);
    expect(pointer.style.getPropertyValue("--_ok-clock-angle")).toBe("270deg");
    const log = events(clock, ["ok:time-clock:change", "ok:time-clock:viewchange"]);
    q("[data-ok-time-clock-options]", clock).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(log.at(-1)).toEqual([
      "ok:time-clock:change",
      { value: "10:30:00", selectionState: "shallow" },
    ]);
    await userEvent.keyboard("{Enter}");
    expect(log.slice(-2)).toEqual([
      ["ok:time-clock:change", { value: "10:30:00", selectionState: "partial" }],
      ["ok:time-clock:viewchange", { view: "minutes" }],
    ]);
    expect(clock.getAttribute("data-ok-view")).toBe("minutes");
    expect(q('[role="option"]', clock).textContent).toBe("00");
    expect(pointer.style.getPropertyValue("--_ok-clock-angle")).toBe("180deg");
    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(log.at(-1)).toEqual([
      "ok:time-clock:change",
      { value: "10:31:00", selectionState: "finish" },
    ]);
    expect(pointer.hasAttribute("data-ok-between")).toBe(true);
    const instance = runtime?.get<TimeClockInstance>(clock, "time-clock") as TimeClockInstance;
    expect(instance.value).toBe("10:31:00");
    expect(instance.view).toBe("minutes");
  });

  it("picks with a press, switches views with the arrows and cancels changes", async () => {
    mount(snippet("clocks-time-clock"));
    start();
    const clock = byId("tc-basic");
    const instance = runtime?.get<TimeClockInstance>(clock, "time-clock") as TimeClockInstance;
    pressFace(clock, 90, 0);
    expect(instance.value).toBe("03:30:00");
    expect(clock.getAttribute("data-ok-view")).toBe("minutes");
    await userEvent.click(q("[data-ok-time-clock-prev]", clock));
    expect(clock.getAttribute("data-ok-view")).toBe("hours");
    await userEvent.click(q("[data-ok-time-clock-next]", clock));
    expect(clock.getAttribute("data-ok-view")).toBe("minutes");
    clock.addEventListener("ok:time-clock:change", (e) => e.preventDefault());
    pressFace(clock, 0, 90);
    expect(instance.value).toBe("03:30:00");
  });

  it("instance API: values, views, rules, texts; disabled and read-only states", () => {
    mount(snippet("clocks-time-clock"));
    start();
    const clock = byId("tc-basic");
    const instance = runtime?.get<TimeClockInstance>(clock, "time-clock") as TimeClockInstance;
    instance.setValue(new Date(2025, 4, 25, 21, 5));
    expect(instance.value).toBe("21:05:00");
    expect(clock.getAttribute("data-ok-value")).toBe("21:05:00");
    instance.setValue("junk");
    expect(instance.value).toBe("21:05:00");
    instance.setValue(null);
    expect(instance.value).toBeNull();
    expect(q("[data-ok-time-clock-pointer]", clock).hidden).toBe(true);
    instance.setValue("09:30");
    instance.setView("minutes");
    instance.setView("seconds" as "minutes");
    expect(instance.view).toBe("minutes");
    instance.setShouldDisableTime((value, view) => view === "minutes" && value.getMinutes() === 0);
    expect(q('[data-ok-value="0"]', clock).getAttribute("aria-disabled")).toBe("true");
    instance.setLocaleText({ minutesClockNumberText: (m) => `${m} phút` });
    expect(q('[data-ok-value="5"]', clock).getAttribute("aria-label")).toBe("05 phút");
    clock.setAttribute("data-ok-read-only", "");
    instance.setView("hours");
    const listbox = q("[data-ok-time-clock-options]", clock);
    expect(listbox.getAttribute("aria-readonly")).toBe("true");
    pressFace(clock, 90, 0);
    expect(instance.value).toBe("09:30:00");
    clock.setAttribute("data-ok-disabled", "");
    instance.setValue("10:00");
    expect(listbox.tabIndex).toBe(-1);
    expect(listbox.getAttribute("aria-disabled")).toBe("true");
  });

  it("hostile attribute values fall back to the defaults", () => {
    const bad = '"><img src=x onerror=alert(1)>';
    mount(`<div data-ok-time-clock data-ok-view='${bad}' data-ok-views="../ x" data-ok-value='${bad}'
      data-ok-minutes-step="1e999" data-ok-min-time="../" data-ok-ampm="maybe" data-ok-time-steps='${bad}'>
      <div data-ok-time-clock-dial><span data-ok-time-clock-pointer></span>
        <div role="listbox" data-ok-time-clock-options tabindex="0"></div></div></div>`);
    start();
    const clock = q("[data-ok-time-clock]");
    expect(clock.getAttribute("data-ok-view")).toBe("hours");
    expect(clock.hasAttribute("data-ok-value")).toBe(false);
    expect(clock.querySelector("img")).toBeNull();
    expect(clock.querySelectorAll('[role="option"]')).toHaveLength(12);
  });

  it("24-hour clocks, AM / PM buttons and a clock without an id", () => {
    mount(
      `<div data-ok-time-clock data-ok-ampm="false" data-ok-ampm-in-clock data-ok-views="hours minutes" data-ok-min-time="08:00">
        <div data-ok-time-clock-dial><span data-ok-time-clock-pin></span><span data-ok-time-clock-pointer hidden></span>
          <div role="listbox" data-ok-time-clock-options tabindex="0"></div></div>
        <div data-ok-time-clock-meridiems><button type="button" data-ok-time-clock-meridiem="am">AM</button><button type="button" data-ok-time-clock-meridiem="pm">PM</button></div>
      </div>`,
    );
    start();
    const clock = q("[data-ok-time-clock]");
    expect(clock.id).toMatch(/^ok-time-clock-/);
    expect(clock.querySelectorAll('[role="option"]')).toHaveLength(24);
    expect(q('[data-ok-value="7"]', clock).getAttribute("aria-disabled")).toBe("true");
    const instance = runtime?.get<TimeClockInstance>(clock, "time-clock") as TimeClockInstance;
    q<HTMLButtonElement>('[data-ok-time-clock-meridiem="pm"]', clock).click();
    expect(instance.value).toBe("12:00:00");
    expect(q("[data-ok-time-clock-pointer]", clock).hasAttribute("data-ok-inner")).toBe(false);
    instance.setValue("13:00");
    expect(q("[data-ok-time-clock-pointer]", clock).hasAttribute("data-ok-inner")).toBe(true);
    expect(q('[data-ok-time-clock-meridiem="pm"]', clock).getAttribute("aria-pressed")).toBe(
      "true",
    );
    instance.destroy?.();
  });
});

describe("digital clocks (HTML)", () => {
  it("digital clock: picks a time and updates the options in place", async () => {
    mount(snippet("clocks-digital"));
    start();
    const clock = byId("tc-digital");
    const instance = runtime?.get<DigitalClockInstance>(
      clock,
      "digital-clock",
    ) as DigitalClockInstance;
    const list = q('[role="listbox"]', clock);
    expect(list.scrollTop).toBeGreaterThan(0);
    const log = events(clock, ["ok:digital-clock:change"]);
    const ten = q('[data-ok-value="10:00:00"]', clock);
    await userEvent.click(ten);
    expect(log).toEqual([
      ["ok:digital-clock:change", { value: "10:00:00", selectionState: "finish" }],
    ]);
    expect(ten.getAttribute("aria-selected")).toBe("true");
    expect(ten.tabIndex).toBe(0);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(instance.value).toBe("10:30:00");
    clock.addEventListener("ok:digital-clock:change", (e) => e.preventDefault());
    await userEvent.click(q('[data-ok-value="11:00:00"]', clock));
    expect(instance.value).toBe("10:30:00");
    instance.setValue(null);
    expect(clock.hasAttribute("data-ok-value")).toBe(false);
    expect(instance.value).toBeNull();
    instance.setValue("junk");
    instance.setValue(new Date(2025, 4, 25, 13));
    expect(instance.value).toBe("13:00:00");
    instance.setShouldDisableTime((value) => value.getHours() < 12);
    expect(q('[data-ok-value="09:00:00"]', clock).getAttribute("aria-disabled")).toBe("true");
    instance.setLocaleText({});
    clock.setAttribute("data-ok-read-only", "");
    clock.setAttribute("data-ok-disabled", "");
    instance.setValue("14:00");
    expect(list.getAttribute("aria-readonly")).toBe("true");
    expect(list.getAttribute("aria-disabled")).toBe("true");
    q('[data-ok-value="15:00:00"]', clock).click();
    expect(instance.value).toBe("14:00:00");
    // An option the clock doesn't know: ignored.
    q('[data-ok-value="15:00:00"]', clock).setAttribute("data-ok-value", "junk");
    clock.removeAttribute("data-ok-disabled");
    clock.removeAttribute("data-ok-read-only");
    q('[data-ok-value="junk"]', clock).click();
    expect(instance.value).toBe("14:00:00");
  });

  it("digital clock without a value: the first enabled option takes focus", () => {
    mount(`<div data-ok-digital-clock data-ok-ampm="false" data-ok-time-step="120" data-ok-min-time="06:00">
      <ul role="listbox" data-ok-digital-clock-list aria-label="Pick"></ul></div>`);
    start();
    const clock = q("[data-ok-digital-clock]");
    const instance = runtime?.get<DigitalClockInstance>(
      clock,
      "digital-clock",
    ) as DigitalClockInstance;
    expect(instance.value).toBeNull();
    expect(clock.querySelectorAll("li")).toHaveLength(12);
    expect(q('li[tabindex="0"]', clock).textContent).toBe("06:00");
    mount(`<div role="group" data-ok-multi-section-digital-clock data-ok-ampm="false">
      <ul role="listbox" data-ok-digital-clock-section="hours" aria-label="h"></ul>
      <ul role="listbox" data-ok-digital-clock-section="minutes" aria-label="m"></ul></div>`);
    const multi = q("[data-ok-multi-section-digital-clock]");
    const columns = runtime?.getOrCreate<MultiSectionDigitalClockInstance>(
      multi,
      "multi-section-digital-clock",
    ) as MultiSectionDigitalClockInstance;
    expect(columns.value).toBeNull();
    // Default steps: 1 hour, 5 minutes.
    expect(multi.querySelectorAll('[data-ok-digital-clock-section="minutes"] li')).toHaveLength(12);
  });

  it("multi-section clock: columns, focus moves on, meridiem finishes", async () => {
    mount(snippet("clocks-digital"));
    start();
    const clock = byId("tc-multi");
    const instance = runtime?.get<MultiSectionDigitalClockInstance>(
      clock,
      "multi-section-digital-clock",
    ) as MultiSectionDigitalClockInstance;
    const log = events(clock, ["ok:multi-section-digital-clock:change"]);
    await userEvent.click(option(clock, "hours", 10));
    expect(log.at(-1)).toEqual([
      "ok:multi-section-digital-clock:change",
      { value: "10:30:00", selectionState: "partial" },
    ]);
    expect(document.activeElement).toBe(option(clock, "minutes", 30));
    await userEvent.click(option(clock, "seconds", 15));
    expect(document.activeElement).toBe(option(clock, "meridiem", 0));
    await userEvent.click(option(clock, "meridiem", 1));
    expect(log.at(-1)).toEqual([
      "ok:multi-section-digital-clock:change",
      { value: "22:30:15", selectionState: "finish" },
    ]);
    expect(instance.value).toBe("22:30:15");
    clock.addEventListener("ok:multi-section-digital-clock:change", (e) => e.preventDefault());
    await userEvent.click(option(clock, "hours", 3));
    expect(instance.value).toBe("22:30:15");
    instance.setValue(null);
    instance.setValue("junk");
    expect(instance.value).toBeNull();
    instance.setValue(new Date(2025, 4, 25, 8));
    instance.setShouldDisableTime((value, view) => view === "hours" && value.getHours() === 9);
    expect(option(clock, "hours", 9).getAttribute("aria-disabled")).toBe("true");
    instance.setLocaleText({ selectViewText: (view) => `Pick ${view}` });
    expect(q('[data-ok-digital-clock-section="hours"]', clock).getAttribute("aria-label")).toBe(
      "Pick hours",
    );
    clock.setAttribute("data-ok-read-only", "");
    instance.setValue("08:00");
    expect(q('[data-ok-digital-clock-section="hours"]', clock).getAttribute("aria-readonly")).toBe(
      "true",
    );
    // Markup outside the views is left alone.
    q('[data-ok-digital-clock-section="seconds"]', clock).setAttribute(
      "data-ok-digital-clock-section",
      "junk",
    );
    clock.removeAttribute("data-ok-read-only");
    instance.setValue("09:00");
    q<HTMLElement>('[data-ok-digital-clock-section="junk"] li', clock).click();
    expect(instance.value).toBe("09:00:00");
  });
});

describe("time and date time fields (HTML)", () => {
  it("time field: ISO time, typing and time rules", async () => {
    mount(snippet("time-validation-limits"));
    start();
    const field = fieldOf("tv-limits");
    expect(field.hasAttribute("data-ok-error")).toBe(true);
    const instance = runtime?.get<DateFieldInstance>(field, "date-field") as DateFieldInstance;
    expect(instance.value).toBe("18:00:00");
    expect(instance.validationError).toBe("maxTime");
    const log = events(field, ["ok:date-field:change"]);
    await userEvent.click(q('[role="spinbutton"]', field));
    await userEvent.keyboard("10");
    expect(log.at(-1)).toEqual([
      "ok:date-field:change",
      { value: "22:00:00", validationError: "maxTime" },
    ]);
    await userEvent.keyboard("{ArrowRight}a");
    expect(instance.value).toBe("10:00:00");
    expect(field.hasAttribute("data-ok-error")).toBe(false);
    expect(q<HTMLInputElement>("input[type=hidden]", field).value).toBe("10:00:00");
    instance.setShouldDisableTime((_value, view) => view === "hours");
    expect(instance.validationError).toBe("shouldDisableTime-hours");
    instance.setValue(new Date(2025, 4, 25, 13, 15));
    expect(texts("tv-limits")).toEqual(["01", "15", "PM"]);
  });

  it("date time field: ISO date time and the date time limits", () => {
    mount(snippet("time-validation-limits"));
    start();
    const field = fieldOf("tv-date-time");
    const instance = runtime?.get<DateFieldInstance>(field, "date-field") as DateFieldInstance;
    expect(instance.value).toBe("2025-05-25T11:00:00");
    instance.setValue("2025-05-25T09:00");
    expect(instance.validationError).toBe("minTime");
    instance.setValue("2025-07-01T09:00");
    expect(instance.validationError).toBe("maxDate");
  });

  it("time fields without a format follow the views and the hour cycle", () => {
    mount(`<div data-ok-text-field data-ok-date-field data-ok-value-type="time" data-ok-ampm="false" data-ok-views="hours minutes seconds" data-ok-value="21:05:07">
      <div data-ok-text-field-control><div role="group" data-ok-date-field-sections>
        <span role="spinbutton" tabindex="0"></span><span role="spinbutton" tabindex="-1"></span><span role="spinbutton" tabindex="-1"></span>
      </div></div></div>`);
    start();
    expect([...document.querySelectorAll('[role="spinbutton"]')].map((s) => s.textContent)).toEqual(
      ["21", "05", "07"],
    );
  });
});

describe("time pickers (HTML)", () => {
  it("desktop: the multi-section clock, a pick, OK", async () => {
    mount(snippet("time-basic"));
    start();
    const picker = pickerOf("tp-desktop");
    const log = events(picker, ["ok:date-picker:change", "ok:date-picker:accept"]);
    const open = q<HTMLButtonElement>("[data-ok-date-picker-open]", picker);
    expect(open.getAttribute("aria-label")).toBe("Choose time, selected time is 09:30 AM");
    await userEvent.click(open);
    expect(picker.hasAttribute("data-ok-open")).toBe(true);
    const paper = q("[data-ok-date-picker-paper]", picker);
    expect(document.activeElement).toBe(option(paper, "hours", 9));
    await userEvent.click(option(paper, "hours", 11));
    expect(texts("tp-desktop")).toEqual(["11", "30", "AM"]);
    expect(picker.hasAttribute("data-ok-open")).toBe(true);
    await userEvent.click(q('[data-ok-picker-action="accept"]', paper));
    expect(picker.hasAttribute("data-ok-open")).toBe(false);
    expect(log).toEqual([
      ["ok:date-picker:change", { value: "11:30:00", validationError: null }],
      ["ok:date-picker:accept", { value: "11:30:00" }],
    ]);
    const instance = runtime?.get<DatePickerInstance>(picker, "date-picker") as DatePickerInstance;
    expect(instance.value).toBe("11:30:00");
  });

  it("mobile: the toolbar and the analog clock; Cancel restores", async () => {
    mount(snippet("time-basic"));
    start();
    const picker = pickerOf("tp-mobile");
    await userEvent.click(q("[data-ok-date-picker-open]", picker));
    const dialog = q("dialog", picker);
    const clock = q("[data-ok-time-clock]", dialog);
    expect(document.activeElement).toBe(q("[data-ok-time-clock-options]", clock));
    pressFace(clock, 90, 0);
    expect(texts("tp-mobile")).toEqual(["03", "30", "AM"]);
    expect(clock.getAttribute("data-ok-view")).toBe("minutes");
    const toolbarMinutes = q('[data-ok-picker-toolbar-button][data-ok-view="minutes"]', dialog);
    expect(toolbarMinutes.hasAttribute("data-ok-selected")).toBe(true);
    await userEvent.click(q('[data-ok-picker-toolbar-button][data-ok-view="hours"]', dialog));
    expect(clock.getAttribute("data-ok-view")).toBe("hours");
    await userEvent.click(q('[data-ok-picker-toolbar-meridiem="pm"]', dialog));
    expect(texts("tp-mobile")).toEqual(["03", "30", "PM"]);
    await userEvent.click(q('[data-ok-picker-action="cancel"]', dialog));
    expect(texts("tp-mobile")).toEqual(["09", "30", "AM"]);
  });

  it("static: openTo, a finished clock and closeOnSelect", () => {
    mount(snippet("time-static"));
    start();
    const picker = byId("tp-static-landscape-clock").closest(
      "[data-ok-date-picker]",
    ) as HTMLElement;
    const clock = q("[data-ok-time-clock]", picker);
    expect(clock.getAttribute("data-ok-view")).toBe("minutes");
    const log = events(picker, ["ok:date-picker:accept"]);
    picker.setAttribute("data-ok-close-on-select", "true");
    pressFace(clock, -90, 0);
    expect(log).toEqual([["ok:date-picker:accept", { value: "09:45:00" }]]);
  });

  it("desktop: one list for coarse steps, closing on a pick", async () => {
    mount(`<div data-ok-date-picker data-ok-picker-variant="desktop" data-ok-value-type="time" data-ok-close-on-select="true">
      <button type="button" data-ok-date-picker-open aria-label="open">o</button>
      <div popover="manual" data-ok-popover data-ok-date-picker-paper role="dialog" aria-label="Select time">
        <div data-ok-picker-layout><div data-ok-picker-content>
          <div data-ok-digital-clock data-ok-ampm="true" data-ok-time-step="60" data-ok-value="09:00:00">
            <ul role="listbox" data-ok-digital-clock-list aria-label="Select time"></ul>
          </div>
        </div></div>
      </div></div>`);
    start();
    const picker = q("[data-ok-date-picker]");
    const log = events(picker, ["ok:date-picker:accept", "ok:date-picker:close"]);
    await userEvent.click(q("[data-ok-date-picker-open]", picker));
    expect(document.activeElement?.textContent).toBe("09:00 AM");
    await userEvent.click(q('[data-ok-value="13:00:00"]', picker));
    expect(log).toEqual([
      ["ok:date-picker:accept", { value: "13:00:00" }],
      ["ok:date-picker:close", { reason: "select" }],
    ]);
  });

  it("instance API of a time picker", () => {
    mount(snippet("time-basic"));
    start();
    const picker = pickerOf("tp-desktop");
    const instance = runtime?.get<DatePickerInstance>(picker, "date-picker") as DatePickerInstance;
    instance.setValue("14:45");
    expect(instance.value).toBe("14:45:00");
    expect(texts("tp-desktop")).toEqual(["02", "45", "PM"]);
    instance.setShouldDisableTime((value) => value.getHours() === 14);
    expect(fieldOf("tp-desktop").hasAttribute("data-ok-error")).toBe(true);
    instance.setLocaleText({ openTimePickerDialogue: () => "Pick a time" });
    expect(q("[data-ok-date-picker-open]", picker).getAttribute("aria-label")).toBe("Pick a time");
    instance.setValue(null);
    expect(instance.value).toBeNull();
  });
});

describe("date time pickers (HTML)", () => {
  it("desktop: the calendar keeps the time; the columns change it", async () => {
    mount(snippet("date-time-basic"));
    start();
    const picker = pickerOf("dtp-desktop");
    const open = q("[data-ok-date-picker-open]", picker);
    expect(open.getAttribute("aria-label")).toBe(
      "Choose date, selected date is May 25, 2025 09:30 AM",
    );
    await userEvent.click(open);
    const paper = q("[data-ok-date-picker-paper]", picker);
    expect(document.activeElement?.getAttribute("data-ok-date")).toBe("2025-05-25");
    await userEvent.click(q('[data-ok-date="2025-05-27"]', paper));
    await settle();
    expect(texts("dtp-desktop")).toEqual(["05", "27", "2025", "09", "30", "AM"]);
    expect(picker.hasAttribute("data-ok-open")).toBe(true);
    await userEvent.click(option(paper, "minutes", 45));
    expect(texts("dtp-desktop")).toEqual(["05", "27", "2025", "09", "45", "AM"]);
  });

  it("mobile: tabs, the clock after the day, Next then OK", async () => {
    mount(snippet("date-time-basic"));
    start();
    const picker = pickerOf("dtp-mobile");
    const log = events(picker, ["ok:date-picker:accept"]);
    await userEvent.click(q("[data-ok-date-picker-open]", picker));
    const dialog = q("dialog", picker);
    const clock = q("[data-ok-time-clock]", dialog);
    const calendar = q("[data-ok-date-calendar]", dialog);
    expect(clock.hidden).toBe(true);
    await userEvent.click(q('[data-ok-date="2025-05-26"]', dialog));
    await settle();
    expect(clock.hidden).toBe(false);
    expect(calendar.hidden).toBe(true);
    expect(q('[role="tab"][aria-selected="true"]', dialog).getAttribute("aria-label")).toBe(
      "pick time",
    );
    const next = q('[data-ok-picker-action="nextOrAccept"]', dialog);
    expect(next.textContent?.trim()).toBe("Next");
    await userEvent.click(next);
    expect(clock.getAttribute("data-ok-view")).toBe("minutes");
    expect(next.textContent?.trim()).toBe("OK");
    await userEvent.click(q('[role="tab"][aria-label="pick date"]', dialog));
    await settle();
    expect(calendar.hidden).toBe(false);
    await userEvent.click(q('[role="tab"][aria-label="pick time"]', dialog));
    await settle();
    await userEvent.click(next);
    await userEvent.click(next);
    expect(log).toEqual([["ok:date-picker:accept", { value: "2025-05-26T09:30:00" }]]);
  });

  it("static: the toolbar's year opens the year view", async () => {
    mount(snippet("date-time-static"));
    start();
    const picker = byId("dtp-static-calendar").closest("[data-ok-date-picker]") as HTMLElement;
    // No field: the day comes from the calendar, the time from the clock.
    expect(q('[data-ok-picker-toolbar-button][data-ok-view="hours"]', picker).textContent).toBe(
      "09",
    );
    expect(runtime?.get<DatePickerInstance>(picker, "date-picker")?.value).toBe(
      "2025-05-25T09:30:00",
    );
    await userEvent.click(q('[data-ok-picker-toolbar-button][data-ok-view="year"]', picker));
    expect(q("[data-ok-date-calendar]", picker).getAttribute("data-ok-view")).toBe("year");
    expect(
      q('[data-ok-picker-toolbar-button][data-ok-view="year"]', picker).hasAttribute(
        "data-ok-selected",
      ),
    ).toBe(true);
    await userEvent.click(q('[role="radio"][aria-checked="true"]', picker));
    expect(q("[data-ok-date-calendar]", picker).getAttribute("data-ok-view")).toBe("day");
  });

  it("disabled and read-only pickers don't open", async () => {
    mount(snippet("date-time-playground"));
    start();
    for (const id of ["dtp-disabled", "dtp-read-only"]) {
      const picker = pickerOf(id);
      const instance = runtime?.get<DatePickerInstance>(
        picker,
        "date-picker",
      ) as DatePickerInstance;
      instance.open();
      expect(instance.isOpen).toBe(false);
    }
  });
});
