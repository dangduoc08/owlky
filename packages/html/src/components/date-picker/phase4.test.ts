import { pickersFrFR } from "@owlky/core";
import { createDayjsAdapter } from "@owlky/core/adapters/dayjs";
import dayjs, { type Dayjs } from "dayjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import type { DateCalendarInstance } from "../date-calendar/date-calendar.js";
import type { PickerDateApi } from "../date-calendar/picker-dom.js";
import type { DateFieldInstance } from "../date-field/date-field.js";
import type { DateRangeCalendarInstance } from "../date-range-calendar/date-range-calendar.js";
import type { DateRangePickerInstance } from "../date-range-picker/date-range-picker.js";
import { components } from "../index.js";
import type { DatePickerInstance } from "./date-picker.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  snippets.find(([path]) => path.endsWith(`/${name}.html`))?.[1] as string;
const PHASE_4 = [
  "time-zones-zones",
  "date-libraries-dayjs",
  "date-libraries-luxon",
  "calendar-systems-jalali",
  "calendar-systems-hijri",
  "calendar-systems-buddhist",
  "right-to-left-rtl",
  "customization-day",
  "customization-layout",
  "customization-view-renderers",
  "localization-packs",
];

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
const texts = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>('[role="spinbutton"]')].map((s) => s.textContent);
const get = <T>(element: Element, name: string) => (runtime as Runtime).get(element, name) as T;
const pickerOf = (id: string) => byId(id).closest("[data-ok-date-picker]") as HTMLElement;

describe("phase 4 snippets (ADR-0030)", () => {
  it("are CSP-safe, accessible and named", async () => {
    for (const name of PHASE_4) {
      const html = snippet(name);
      expect(html, name).toBeTruthy();
      const host = mount(html);
      expectCspSafe(host, html);
      start();
      expectNamedButtons(host);
      await expectNoAxeViolations(host);
      runtime?.stop();
      resetPage();
    }
  });
});

describe("time zones", () => {
  it("shows wall times of the zone and reads values with offsets", async () => {
    mount(snippet("time-zones-zones"));
    start();
    expect(texts(byId("tz-utc")).slice(3, 5)).toEqual(["01", "30"]);
    expect(texts(byId("tz-ny")).slice(3, 5)).toEqual(["09", "30"]);
    expect(texts(byId("tz-hcm")).slice(3, 5)).toEqual(["08", "30"]);
    const ny = get<DatePickerInstance>(pickerOf("tz-ny"), "date-picker");
    ny.setValue("2025-05-25T18:00:00Z");
    expect(ny.value).toBe("2025-05-25T14:00:00");
    // `date` gives the instant (native `Date` without an adapter).
    expect((ny.date as Date).toISOString()).toBe("2025-05-25T18:00:00.000Z");
    ny.setDate(new Date(Date.UTC(2025, 4, 26, 4, 0)));
    expect(ny.value).toBe("2025-05-26T00:00:00");
    const field = get<DateFieldInstance>(
      byId("tz-utc").closest("[data-ok-date-field]") as Element,
      "date-field",
    );
    field.setValue("2025-05-25T13:30:00+07:00");
    expect(field.value).toBe("2025-05-25T06:30:00");
  });

  it("takes today from the zone", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(Date.UTC(2025, 4, 25, 12, 0)));
    const host = mount(snippet("calendar-systems-hijri"));
    host.firstElementChild?.setAttribute("data-ok-timezone", "Pacific/Kiritimati");
    // The snippet is Hijri: drop its locale so days are plain numbers.
    start();
    await settle();
    expect(document.querySelector("[aria-current=date]")?.getAttribute("data-ok-date")).toBe(
      "2025-05-26",
    );
  });
});

describe("calendar systems", () => {
  it("shows and navigates Persian months", async () => {
    mount(snippet("calendar-systems-jalali"));
    start();
    const root = byId("cal-fa-month");
    const calendar = get<DateCalendarInstance>(root, "date-calendar");
    expect(root.getAttribute("data-ok-month")).toBe("2025-05-22");
    expect(root.querySelector('[data-ok-date="2025-05-25"]')?.textContent).toBe("4");
    await userEvent.click(root.querySelector("[data-ok-date-calendar-next]") as HTMLElement);
    expect(calendar.month).toBe("2025-06-22");
    await userEvent.click(root.querySelector("[data-ok-date-calendar-prev]") as HTMLElement);
    await userEvent.click(root.querySelector("[data-ok-date-calendar-switch]") as HTMLElement);
    expect(root.querySelector('[data-ok-picker-year][aria-checked="true"]')?.textContent).toBe(
      "1404",
    );
    await userEvent.click(
      root.querySelector('[data-ok-picker-year][data-ok-value="1403"]') as HTMLElement,
    );
    expect(calendar.value).toBe("2024-05-24");
    calendar.setValue("2025-03-21");
    expect(calendar.month).toBe("2025-03-21");
  });

  it("runs month and year lists in the calendar of data-ok-calendar", async () => {
    const months = Array.from(
      { length: 12 },
      (_, m) =>
        `<button type="button" role="radio" data-ok-picker-month data-ok-value="${m}">${m}</button>`,
    ).join("");
    mount(
      `<div data-ok-calendar="persian"><div role="radiogroup" aria-label="Months" data-ok-month-calendar data-ok-year="1404" data-ok-value="2025-05-25">${months}</div>
       <div role="radiogroup" aria-label="Years" data-ok-year-calendar data-ok-value="2025-05-25"><button type="button" role="radio" data-ok-picker-year data-ok-value="1403">1403</button><button type="button" role="radio" data-ok-picker-year data-ok-value="1404">1404</button></div></div>`,
    );
    start();
    const list = document.querySelector("[data-ok-month-calendar]") as HTMLElement;
    expect(list.querySelector('[aria-checked="true"]')?.getAttribute("data-ok-value")).toBe("2");
    await userEvent.click(list.querySelector('[data-ok-value="0"]') as HTMLElement);
    expect(list.getAttribute("data-ok-value")).toBe("2025-03-24");
    const years = document.querySelector("[data-ok-year-calendar]") as HTMLElement;
    expect(years.querySelector('[aria-checked="true"]')?.textContent).toBe("1404");
    const api = get<PickerDateApi & { setValue(v: string): void }>(list, "month-calendar");
    expect((api.date as Date).getDate()).toBe(24);
    api.setDate(new Date(2025, 4, 25));
    expect(list.querySelector('[aria-checked="true"]')?.getAttribute("data-ok-value")).toBe("2");
  });

  it("keeps a calendar the locale already names", () => {
    mount(snippet("calendar-systems-buddhist"));
    document.body.firstElementChild?.setAttribute("data-ok-calendar", "persian");
    start();
    expect(texts(document.body)).toEqual(["25/05/2568"].flatMap((t) => t.split("/")));
  });
});

describe("right to left", () => {
  it("flips the arrow keys of fields and calendars", async () => {
    mount(snippet("right-to-left-rtl"));
    start();
    const sections = [...byId("rtl-field").querySelectorAll<HTMLElement>('[role="spinbutton"]')];
    (sections[0] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(sections[1]);
    const day = byId("rtl-range").querySelector<HTMLElement>(
      '[data-ok-picker-day][tabindex="0"]',
    ) as HTMLElement;
    day.focus();
    const date = day.getAttribute("data-ok-date") as string;
    await userEvent.keyboard("{ArrowLeft}");
    expect((document.activeElement as HTMLElement).getAttribute("data-ok-date")).not.toBe(date);
    expect(
      (document.activeElement as HTMLElement).getAttribute("data-ok-date")?.localeCompare(date),
    ).toBe(1);
  });
});

describe("customization", () => {
  it("decorates days through a day renderer, on every month", async () => {
    mount(snippet("customization-day"));
    start();
    const root = byId("custom-day");
    const calendar = get<DateCalendarInstance>(root, "date-calendar");
    expect(root.querySelectorAll(".sb-day-dot")).toHaveLength(0);
    calendar.setDayRenderer((day, date) => {
      if (date.getDate() === 9) day.setAttribute("data-event", "");
    });
    expect(root.querySelector("[data-event]")?.getAttribute("data-ok-date")).toBe("2025-05-09");
    await userEvent.click(root.querySelector("[data-ok-date-calendar-next]") as HTMLElement);
    expect(root.querySelector("[data-event]")?.getAttribute("data-ok-date")).toBe("2025-06-09");
    calendar.setDayRenderer(() => {
      throw new Error("boom");
    });
    expect(root.querySelector("[data-event]")).toBeNull();
    calendar.setDayRenderer(null);
  });

  it("forwards day renderers from pickers", async () => {
    mount(snippet("range-static") + snippet("date-static"));
    start();
    const range = get<DateRangePickerInstance>(
      document.querySelector("[data-ok-date-range-picker]") as Element,
      "date-range-picker",
    );
    range.setDayRenderer((day) => day.setAttribute("data-mark", ""));
    expect(
      document.querySelectorAll("[data-ok-date-range-picker] [data-mark]").length,
    ).toBeGreaterThan(20);
    const rangeCalendar = get<DateRangeCalendarInstance>(
      document.querySelector("[data-ok-date-range-calendar]") as Element,
      "date-range-calendar",
    );
    rangeCalendar.setDayRenderer(() => {
      throw new Error("boom");
    });
    expect(document.querySelectorAll("[data-ok-date-range-picker] [data-mark]")).toHaveLength(0);
    const picker = get<DatePickerInstance>(
      document.querySelector("[data-ok-date-picker]") as Element,
      "date-picker",
    );
    picker.setDayRenderer((day) => day.setAttribute("data-mark", ""));
    expect(document.querySelectorAll("[data-ok-date-picker] [data-mark]").length).toBeGreaterThan(
      20,
    );
  });

  it("drives a custom toolbar title and action bar", async () => {
    mount(snippet("customization-layout"));
    start();
    const root = document
      .querySelector(".sb-picker-actions-top")
      ?.closest("[data-ok-date-picker]") as HTMLElement;
    const title = root.querySelector("[data-ok-picker-toolbar-title]") as HTMLElement;
    expect(title.textContent).toBe("Sun, May 25");
    const actions = [...root.querySelectorAll<HTMLElement>("[data-ok-picker-action]")].map((b) =>
      b.getAttribute("data-ok-picker-action"),
    );
    expect(actions).toEqual(["clear", "today", "accept"]);
    await userEvent.click(root.querySelector('[data-ok-picker-action="clear"]') as HTMLElement);
    expect(title.textContent).toBe("––");
  });

  it("serves desktop with the analog clock and leaves views out", async () => {
    mount(snippet("customization-view-renderers"));
    start();
    const analog = pickerOf("custom-analog");
    expect(pickerOf("custom-field-only").querySelector("[data-ok-date-picker-open]")).toBeNull();
    await userEvent.click(analog.querySelector("[data-ok-date-picker-open]") as HTMLElement);
    await settle();
    const clock = analog.querySelector("[data-ok-time-clock]") as HTMLElement;
    expect(clock.hidden).toBe(false);
    expect(
      analog.querySelector("[data-ok-digital-clock], [data-ok-multi-section-digital-clock]"),
    ).toBeNull();
  });
});

describe("date adapters", () => {
  it("speaks the adapter's dates on every picker runtime", () => {
    mount(
      snippet("date-libraries-dayjs") +
        snippet("range-static") +
        snippet("range-fields-multi") +
        snippet("clocks-time-clock") +
        snippet("clocks-digital") +
        snippet("calendars-lists"),
    );
    start();
    const adapter = createDayjsAdapter(dayjs);
    const kinds: [string, string][] = [
      ["[data-ok-date-picker]", "date-picker"],
      ["[data-ok-date-field]", "date-field"],
      ["[data-ok-date-range-picker]", "date-range-picker"],
      ["[data-ok-date-range-calendar]", "date-range-calendar"],
      ["[data-ok-multi-input-range-field]", "multi-input-range-field"],
      ["[data-ok-time-clock]", "time-clock"],
      ["[data-ok-digital-clock]", "digital-clock"],
      ["[data-ok-multi-section-digital-clock]", "multi-section-digital-clock"],
      ["[data-ok-date-calendar]", "date-calendar"],
      ["[data-ok-year-calendar]:not([data-ok-date-calendar] *)", "year-calendar"],
    ];
    for (const [selector, name] of kinds) {
      const element = document.querySelector(selector) as Element;
      expect(element, name).not.toBeNull();
      const api = get<PickerDateApi & { value: string | null }>(element, name);
      api.setDateAdapter(adapter);
      const value = api.date as Dayjs | (Dayjs | null)[] | null;
      const first = Array.isArray(value) ? value[0] : value;
      expect(first === null || dayjs.isDayjs(first), name).toBe(true);
      api.setDate(value as never);
      api.setDateAdapter({} as never);
      const native = api.date as Date | (Date | null)[] | null;
      const one = Array.isArray(native) ? native[0] : native;
      expect(one === null || one instanceof Date, name).toBe(true);
      api.setDateAdapter(null);
    }
    const picker = get<DatePickerInstance>(pickerOf("lib-dayjs"), "date-picker");
    picker.setDateAdapter(adapter);
    picker.setDate(dayjs("2025-12-25") as never);
    expect(picker.value).toBe("2025-12-25");
    picker.setDate(null);
    expect(picker.date).toBeNull();
    const range = get<DateRangePickerInstance>(
      document.querySelector("[data-ok-date-range-picker]") as Element,
      "date-range-picker",
    );
    range.setDateAdapter(adapter);
    range.setDate([dayjs("2025-05-01"), dayjs("2025-05-03")] as never);
    expect(range.value).toBe("2025-05-01/2025-05-03");
    range.setValue(null);
    expect(range.date).toEqual([null, null]);
  });
});

describe("locale packs", () => {
  it("translates a picker through setLocaleText", () => {
    mount(snippet("date-static"));
    start();
    const picker = get<DatePickerInstance>(
      document.querySelector("[data-ok-date-picker]") as Element,
      "date-picker",
    );
    picker.setLocaleText(pickersFrFR);
    expect(document.querySelector('[data-ok-picker-action="cancel"]')?.textContent?.trim()).toBe(
      "Annuler",
    );
  });
});
