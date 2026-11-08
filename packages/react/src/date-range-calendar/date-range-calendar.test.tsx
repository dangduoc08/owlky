import { act, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { LocalizationProvider } from "../localization-provider/localization-provider.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { type DateRange, DateRangeCalendar, type RangePosition } from "./date-range-calendar.js";

const d = (day: number, month = 4, year = 2025) => new Date(year, month, day);
const TODAY = d(25);
const q = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<E>(selector) as E;
const day = (iso: string) => q(`[data-ok-date="${iso}"]`);
const iso = (range: DateRange | undefined) =>
  range
    ? range
        .map((date) =>
          date
            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
            : "",
        )
        .join("/")
    : "";
const labels = () =>
  [...document.querySelectorAll("[data-ok-date-calendar-label]")].map((l) => l.textContent);

/** Dispatches a pointer event at a day's center. */
function pointer(type: string, target: Element, init: PointerEventInit = {}) {
  const rect = target.getBoundingClientRect();
  act(() => {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 5,
        pointerType: "mouse",
        button: 0,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        ...init,
      }),
    );
  });
}

describe("DateRangeCalendar", () => {
  it("renders two months with the range band, the ends and ARIA", async () => {
    render(<DateRangeCalendar id="r" today={TODAY} defaultValue={[d(20), d(25)]} />);
    const root = q("[data-ok-date-range-calendar]");
    expect(root.getAttribute("data-ok-calendars")).toBe("2");
    expect(root.getAttribute("data-ok-value")).toBe("2025-05-20/2025-05-25");
    expect(root.getAttribute("data-ok-range-position")).toBe("start");
    expect(root.getAttribute("data-ok-month")).toBe("2025-05");
    expect(labels()).toEqual(["May 2025", "June 2025"]);
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(screen.getAllByRole("grid")[0]?.getAttribute("aria-labelledby")).toBe("r-label-0");
    expect(day("2025-05-20").hasAttribute("data-ok-range-start")).toBe(true);
    expect(day("2025-05-22").hasAttribute("data-ok-in-range")).toBe(true);
    expect(day("2025-05-22").getAttribute("aria-selected")).toBe("true");
    expect(day("2025-05-25").hasAttribute("data-ok-range-end")).toBe(true);
    expect(day("2025-05-26").getAttribute("aria-selected")).toBe("false");
    expect(day("2025-05-25").getAttribute("aria-current")).toBe("date");
    // Arrows only on the outer months.
    expect(document.querySelectorAll("[data-ok-date-calendar-prev]")).toHaveLength(1);
    expect(document.querySelectorAll("[data-ok-date-calendar-next]")).toHaveLength(1);
    // The band is drawn behind the middle days only.
    const band = (iso: string) => getComputedStyle(day(iso), "::before").backgroundColor;
    expect(band("2025-05-22")).not.toBe(band("2025-05-26"));
    expect(band("2025-05-26")).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    await expectNoAxeViolations(document.body);
  });

  it("picks the start, then the end, and reports finish", async () => {
    const onChange = vi.fn();
    const onPosition = vi.fn();
    render(
      <DateRangeCalendar today={TODAY} onChange={onChange} onRangePositionChange={onPosition} />,
    );
    await userEvent.click(day("2025-05-12"));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-12/");
    expect(onChange.mock.lastCall?.[1]).toBe("partial");
    expect(onPosition).toHaveBeenLastCalledWith("end");
    await userEvent.click(day("2025-06-03"));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-12/2025-06-03");
    expect(onChange.mock.lastCall?.[1]).toBe("finish");
    expect(onPosition).toHaveBeenLastCalledWith("start");
    // An end before the start starts again.
    await userEvent.click(day("2025-05-28"));
    await userEvent.click(day("2025-05-02"));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-02/");
  });

  it("previews the hovered range and drags an end", async () => {
    const onChange = vi.fn();
    render(
      <DateRangeCalendar
        today={TODAY}
        defaultValue={[d(20), null]}
        defaultRangePosition="end"
        onChange={onChange}
      />,
    );
    pointer("pointerover", day("2025-05-23"));
    expect(day("2025-05-22").hasAttribute("data-ok-in-preview")).toBe(true);
    expect(day("2025-05-23").hasAttribute("data-ok-preview-end")).toBe(true);
    pointer("pointerleave", q("[data-ok-date-range-calendar]"), { bubbles: false });
    expect(document.querySelector("[data-ok-in-preview]")).toBeNull();
    await userEvent.click(day("2025-05-24"));
    pointer("pointerdown", day("2025-05-24"));
    pointer("pointermove", day("2025-05-28"));
    expect(day("2025-05-27").hasAttribute("data-ok-in-preview")).toBe(true);
    pointer("pointerup", day("2025-05-28"));
    // The click that ends the drag isn't a pick.
    act(() => day("2025-05-28").click());
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-20/2025-05-28");
    expect(onChange.mock.lastCall?.[1]).toBe("finish");
    pointer("pointerdown", day("2025-05-20"));
    pointer("pointermove", day("2025-05-21"));
    pointer("pointercancel", day("2025-05-21"));
    expect(document.querySelector("[data-ok-in-preview]")).toBeNull();
  });

  it("keyboard: arrows move across months, Page keys switch the shown months", async () => {
    render(<DateRangeCalendar today={TODAY} defaultValue={[d(20), d(25)]} />);
    day("2025-05-20").focus();
    await userEvent.keyboard("{PageDown}{PageDown}");
    expect(document.activeElement?.getAttribute("data-ok-date")).toBe("2025-07-20");
    expect(labels()).toEqual(["June 2025", "July 2025"]);
    await userEvent.keyboard("{PageUp}{PageUp}{PageUp}");
    expect(labels()).toEqual(["April 2025", "May 2025"]);
    await userEvent.click(q("[data-ok-date-calendar-next]"));
    expect(labels()).toEqual(["May 2025", "June 2025"]);
    await userEvent.click(q("[data-ok-date-calendar-prev]"));
    expect(labels()).toEqual(["April 2025", "May 2025"]);
  });

  it("controlled: value, position, available positions and month switching", async () => {
    // biome-ignore lint/correctness/noComponentHookFactories: a test-local owner that reads this test's spies.
    function Controlled() {
      const [value, setValue] = useState<DateRange>([d(20), null]);
      const [position, setPosition] = useState<RangePosition>("start");
      return (
        <>
          <DateRangeCalendar
            today={TODAY}
            value={value}
            onChange={setValue}
            rangePosition={position}
            onRangePositionChange={setPosition}
            availableRangePositions={["start"]}
          />
          <button type="button" onClick={() => setValue([d(2, 8), d(9, 8)])}>
            september
          </button>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(day("2025-05-10"));
    expect(q("[data-ok-date-range-calendar]").getAttribute("data-ok-range-position")).toBe("start");
    expect(q("[data-ok-date-range-calendar]").getAttribute("data-ok-value")).toBe("2025-05-10/");
    await userEvent.click(screen.getByRole("button", { name: "september" }));
    expect(labels()).toEqual(["September 2025", "October 2025"]);
  });

  it("shows the end's month after the start, unless switching is off", async () => {
    const { unmount } = render(
      <DateRangeCalendar today={TODAY} calendars={1} defaultValue={[d(20), d(10, 7)]} />,
    );
    await userEvent.click(day("2025-05-22"));
    expect(labels()).toEqual(["August 2025"]);
    unmount();
    render(
      <DateRangeCalendar
        today={TODAY}
        calendars={1}
        disableAutoMonthSwitching
        defaultValue={[d(20), d(10, 7)]}
      />,
    );
    await userEvent.click(day("2025-05-22"));
    expect(labels()).toEqual(["May 2025"]);
  });

  it("options: three months, week numbers, outside days, limits, loading, read-only", async () => {
    const { rerender } = render(
      <DateRangeCalendar
        today={TODAY}
        calendars={3}
        currentMonthCalendarPosition={2}
        displayWeekNumber
        minDate={d(1, 3)}
        maxDate={d(30, 5)}
      />,
    );
    expect(labels()).toEqual(["April 2025", "May 2025", "June 2025"]);
    expect(screen.getAllByRole("rowheader").length).toBeGreaterThan(0);
    expect((q("[data-ok-date-calendar-prev]") as HTMLButtonElement).disabled).toBe(true);
    expect((q("[data-ok-date-calendar-next]") as HTMLButtonElement).disabled).toBe(true);
    rerender(
      <DateRangeCalendar
        today={TODAY}
        calendars={1}
        showDaysOutsideCurrentMonth
        fixedWeekNumber={6}
        readOnly
        disableHighlightToday
        dayOfWeekFormatter={(date) => `w${date.getDay()}`}
      />,
    );
    expect(document.querySelectorAll("[data-ok-outside]").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("columnheader")[0]?.textContent).toBe("w0");
    expect(day("2025-05-25").hasAttribute("data-ok-today")).toBe(false);
    await userEvent.click(day("2025-05-12"));
    expect(q("[data-ok-date-range-calendar]").hasAttribute("data-ok-value")).toBe(false);
    rerender(
      <DateRangeCalendar today={TODAY} calendars={1} loading renderLoading={() => "Wait"} />,
    );
    expect(q("[data-ok-date-calendar-loading]").textContent).toBe("Wait");
    rerender(<DateRangeCalendar today={TODAY} calendars={1} loading />);
    expect(q("[data-ok-date-calendar-loading]").textContent).toBe("…");
    rerender(<DateRangeCalendar today={TODAY} calendars={1} disabled />);
    expect((day("2025-05-12") as HTMLButtonElement).disabled).toBe(true);
  });

  it("disabled days, an empty first month and fewer calendars keep the focus in view", () => {
    const props = { today: TODAY, shouldDisableDate: (date: Date) => date.getMonth() === 4 };
    const { rerender } = render(<DateRangeCalendar calendars={2} {...props} />);
    // May is all disabled: the focusable day is in June.
    expect(q('[data-ok-picker-day][tabindex="0"]').getAttribute("data-ok-date")).toBe("2025-06-01");
    rerender(<DateRangeCalendar calendars={1} {...props} />);
    expect(labels()).toEqual(["June 2025"]);
  });

  it("focuses on mount, renders on the server and in StrictMode, localizes", () => {
    const tree = (
      <LocalizationProvider adapterLocale="vi-VN">
        <DateRangeCalendar
          id="s"
          today={TODAY}
          referenceDate={d(1, 0, 2030)}
          maxDate={d(31, 11, 2029)}
          autoFocus
        />
      </LocalizationProvider>
    );
    const html = renderToString(tree);
    expect(html).toContain("data-ok-date-range-calendar");
    expect(html).toContain('data-ok-locale="vi-VN"');
    render(<StrictMode>{tree}</StrictMode>);
    expect(labels()[0]).toContain("2029");
    expect(document.activeElement?.hasAttribute("data-ok-picker-day")).toBe(true);
  });
});

describe("DateRangeCalendar edge cases", () => {
  it("limits after today, controlled end position, empty positions, dropping the start", async () => {
    const onChange = vi.fn();
    // biome-ignore lint/correctness/noComponentHookFactories: a test-local owner that reads this test's spies.
    function Controlled() {
      const [value, setValue] = useState<DateRange>([d(20), d(25)]);
      const [calendars, setCalendars] = useState<1 | 2>(2);
      return (
        <>
          <DateRangeCalendar
            today={TODAY}
            value={value}
            onChange={(next, state) => {
              setValue(next);
              onChange(next, state);
            }}
            rangePosition="end"
            availableRangePositions={[]}
            calendars={calendars}
          />
          <button type="button" onClick={() => setValue([d(20), d(10, 9)])}>
            october
          </button>
          <button type="button" onClick={() => setCalendars(1)}>
            one
          </button>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("button", { name: "october" }));
    // The edited end goes into the last calendar.
    expect(labels()).toEqual(["September 2025", "October 2025"]);
    await userEvent.click(screen.getByRole("button", { name: "one" }));
    expect(labels()).toEqual(["October 2025"]);
    const start = render(
      <DateRangeCalendar
        today={TODAY}
        calendars={1}
        defaultValue={[d(20), d(25)]}
        onChange={onChange}
      />,
    );
    const host = start.container;
    pointer("pointerdown", day("2025-05-20"));
    pointer("pointermove", q('[data-ok-date="2025-05-18"]', host));
    pointer("pointerup", q('[data-ok-date="2025-05-18"]', host));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-18/2025-05-25");
    start.unmount();
    render(<DateRangeCalendar today={TODAY} calendars={1} minDate={d(1, 0, 2090)} />);
    expect(labels().at(-1)).toBe("January 2090");
  });

  it("fewer calendars keep a visible end where it is", async () => {
    // biome-ignore lint/correctness/noComponentHookFactories: a test-local owner that reads this test's spies.
    function Shrink() {
      const [calendars, setCalendars] = useState<2 | 1>(2);
      return (
        <>
          <DateRangeCalendar today={TODAY} calendars={calendars} defaultValue={[d(20), d(25)]} />
          <button type="button" onClick={() => setCalendars(1)}>
            one
          </button>
        </>
      );
    }
    render(<Shrink />);
    await userEvent.click(screen.getByRole("button", { name: "one" }));
    expect(labels()).toEqual(["May 2025"]);
  });
});
