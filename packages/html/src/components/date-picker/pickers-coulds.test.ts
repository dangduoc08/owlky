import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import type { DateCalendarInstance } from "../date-calendar/date-calendar.js";
import type { DateFieldInstance } from "../date-field/date-field.js";
import type { DateRangeCalendarInstance } from "../date-range-calendar/date-range-calendar.js";
import type { DigitalClockInstance } from "../digital-clock/digital-clock.js";
import { components } from "../index.js";
import type { MultiSectionDigitalClockInstance } from "../multi-section-digital-clock/multi-section-digital-clock.js";
import type { TimeClockInstance } from "../time-clock/time-clock.js";

// Date pickers coulds (roadmap 4.18.30), HTML: data-ok-date-separator, focused views,
// data-ok-show-view-switcher, data-ok-display-static-wrapper-as.

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
  return runtime as Runtime;
};
const byId = (id: string) => document.getElementById(id) as HTMLElement;
const q = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<E>(selector) as E;
const log = (element: Element, type: string) => {
  const calls: unknown[] = [];
  element.addEventListener(type, (event) => calls.push((event as CustomEvent).detail));
  return calls;
};

describe("date pickers coulds (HTML)", () => {
  it("data-ok-date-separator: the range field's sections join with it", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2025, 4, 20));
    mount(
      snippet("range-fields-single").replace(
        'data-ok-range data-ok-value="2025-05-20/2025-05-25"',
        'data-ok-range data-ok-date-separator="to" data-ok-value="2025-05-20/2025-05-25"',
      ),
    );
    const rt = start();
    const field = q("[data-ok-date-field][data-ok-date-separator]");
    const instance = rt.get<DateFieldInstance>(field, "date-field") as DateFieldInstance;
    expect(instance.getSections()[2]?.endSeparator).toBe(" to ");
    const plain = q("[data-ok-date-field][data-ok-range]:not([data-ok-date-separator])");
    const other = rt.get<DateFieldInstance>(plain, "date-field") as DateFieldInstance;
    expect(other.getSections()[2]?.endSeparator).toBe(" – ");
  });

  it("calendars report focused views and take the focus from setFocusedView", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2025, 4, 20));
    mount(snippet("calendars-basic") + snippet("range-calendar"));
    const rt = start();
    const calendar = byId("dc-basic");
    const events = log(calendar, "ok:date-calendar:focusedviewchange");
    const instance = rt.get<DateCalendarInstance>(
      calendar,
      "date-calendar",
    ) as DateCalendarInstance;
    expect(instance.focusedView).toBeNull();
    instance.setFocusedView("day");
    expect(document.activeElement?.hasAttribute("data-ok-picker-day")).toBe(true);
    expect(instance.focusedView).toBe("day");
    expect(events).toEqual([{ view: "day", hasFocus: true }]);
    instance.setView("year");
    await settle();
    instance.setFocusedView("year");
    expect(document.activeElement?.closest("[data-ok-year-calendar]")).not.toBeNull();
    expect(events.at(-1)).toEqual({ view: "year", hasFocus: true });
    const range = byId("dr-calendar");
    const rangeEvents = log(range, "ok:date-range-calendar:focusedviewchange");
    const rangeInstance = rt.get<DateRangeCalendarInstance>(
      range,
      "date-range-calendar",
    ) as DateRangeCalendarInstance;
    rangeInstance.setFocusedView("day");
    expect(range.contains(document.activeElement)).toBe(true);
    expect(rangeInstance.focusedView).toBe("day");
    expect(rangeEvents).toEqual([{ view: "day", hasFocus: true }]);
    expect(events.at(-1)).toEqual({ view: "year", hasFocus: false });
  });

  it("clocks report focused views; data-ok-show-view-switcher hides the arrows", async () => {
    mount(snippet("clocks-time-clock") + snippet("clocks-digital"));
    const rt = start();
    const clock = byId("tc-basic");
    const clockEvents = log(clock, "ok:time-clock:focusedviewchange");
    const clockInstance = rt.get<TimeClockInstance>(clock, "time-clock") as TimeClockInstance;
    clockInstance.setFocusedView("hours");
    expect(document.activeElement).toBe(q("[data-ok-time-clock-options]", clock));
    clockInstance.setView("minutes");
    await settle();
    expect(clockInstance.focusedView).toBe("minutes");
    expect(clockEvents).toEqual([
      { view: "hours", hasFocus: true },
      { view: "hours", hasFocus: false },
      { view: "minutes", hasFocus: true },
    ]);
    const digital = byId("tc-digital");
    const digitalInstance = rt.get<DigitalClockInstance>(
      digital,
      "digital-clock",
    ) as DigitalClockInstance;
    digitalInstance.setFocusedView("hours");
    expect(digital.contains(document.activeElement)).toBe(true);
    expect(digitalInstance.focusedView).toBe("hours");
    const multi = byId("tc-multi");
    const multiEvents = log(multi, "ok:multi-section-digital-clock:focusedviewchange");
    const multiInstance = rt.get<MultiSectionDigitalClockInstance>(
      multi,
      "multi-section-digital-clock",
    ) as MultiSectionDigitalClockInstance;
    multiInstance.setFocusedView("minutes");
    expect(document.activeElement?.closest('[data-ok-digital-clock-section="minutes"]')).not.toBe(
      null,
    );
    expect(multiInstance.focusedView).toBe("minutes");
    expect(multiEvents).toEqual([{ view: "minutes", hasFocus: true }]);
    // The arrows: CSS only.
    const nav = q("[data-ok-time-clock-nav]", clock);
    expect(getComputedStyle(nav).display).toBe("flex");
    clock.setAttribute("data-ok-show-view-switcher", "false");
    expect(getComputedStyle(nav).display).toBe("none");
    await expectNoAxeViolations(clock);
  });

  it("data-ok-display-static-wrapper-as: static pickers in their desktop form", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2025, 4, 20));
    const desktop = (html: string, root: string) =>
      html.replace(
        `${root} data-ok-picker-variant="static"`,
        `${root} data-ok-picker-variant="static" data-ok-display-static-wrapper-as="desktop"`,
      );
    mount(
      desktop(snippet("date-static"), "<div data-ok-date-picker") +
        desktop(snippet("date-time-static"), "<div data-ok-date-picker") +
        desktop(snippet("range-static"), "<div data-ok-date-range-picker"),
    );
    start();
    await settle();
    const [date, dateTime] = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-ok-date-picker][data-ok-display-static-wrapper-as="desktop"]',
      ),
    ] as HTMLElement[];
    const shownActions = (root: HTMLElement) =>
      [...root.querySelectorAll<HTMLElement>("[data-ok-picker-action]")].filter((b) => !b.hidden);
    expect(shownActions(date as HTMLElement)).toHaveLength(0);
    expect(q("[data-ok-picker-toolbar]", date as HTMLElement).hidden).toBe(true);
    // Date time: picking a day keeps the calendar (the desktop form shows both).
    const calendar = q("[data-ok-date-calendar]", dateTime as HTMLElement);
    q<HTMLButtonElement>(
      "[data-ok-picker-day]:not([disabled]):not([data-ok-outside])",
      calendar,
    ).click();
    await settle();
    expect(calendar.hidden).toBe(false);
    expect(q("[data-ok-picker-tabs]", dateTime as HTMLElement).hidden).toBe(true);
    // Range: two months, no actions.
    const range = q('[data-ok-date-range-picker][data-ok-display-static-wrapper-as="desktop"]');
    expect(range.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(2);
    expect(shownActions(range)).toHaveLength(0);
  });
});
