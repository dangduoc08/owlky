import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateCalendar } from "../date-calendar/date-calendar.js";
import { StaticDatePicker } from "../date-picker/date-picker.js";
import { DateRangeCalendar } from "../date-range-calendar/date-range-calendar.js";
import { SingleInputDateRangeField } from "../date-range-field/date-range-field.js";
import {
  DesktopDateRangePicker,
  StaticDateRangePicker,
} from "../date-range-picker/date-range-picker.js";
import { StaticDateTimePicker } from "../date-time-picker/date-time-picker.js";
import { DigitalClock } from "../digital-clock/digital-clock.js";
import { MultiSectionDigitalClock } from "../multi-section-digital-clock/multi-section-digital-clock.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { TimeClock } from "../time-clock/time-clock.js";
import { StaticTimePicker } from "../time-picker/time-picker.js";

// Date pickers coulds (roadmap 4.18.30): dateSeparator, focusedView / onFocusedViewChange,
// TimeClock showViewSwitcher, static pickers displayStaticWrapperAs.

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const TODAY = d(2025, 5, 20);
const q = <E extends Element = HTMLElement>(root: ParentNode, selector: string) =>
  root.querySelector<E>(selector) as E;
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe("dateSeparator", () => {
  it("shows the separator between the two dates and writes it on the root", () => {
    const { container } = render(
      <SingleInputDateRangeField
        label="Stay"
        today={TODAY}
        dateSeparator="to"
        defaultValue={[d(2025, 5, 20), d(2025, 5, 25)]}
      />,
    );
    const root = q(container, "[data-ok-date-field]");
    expect(root.getAttribute("data-ok-date-separator")).toBe("to");
    expect(q(container, "[data-ok-date-field-sections]").textContent).toContain("2025 to 05");
    render(<SingleInputDateRangeField label="Default" today={TODAY} />);
    expect(document.querySelectorAll("[data-ok-date-separator]")).toHaveLength(1);
  });

  it("reaches the single input field of a range picker", () => {
    const { container } = render(
      <DesktopDateRangePicker
        label="Stay"
        today={TODAY}
        dateSeparator="→"
        defaultValue={[d(2025, 5, 20), d(2025, 5, 25)]}
      />,
    );
    const field = q(container, "[data-ok-date-field]");
    expect(field.getAttribute("data-ok-date-separator")).toBe("→");
    expect(q(field, "[data-ok-date-field-sections]").textContent).toContain(" → ");
  });
});

describe("focusedView / onFocusedViewChange", () => {
  it("DateCalendar reports the focused view and moves the focus into a new one", async () => {
    const onFocusedViewChange = vi.fn();
    const props = {
      today: TODAY,
      defaultValue: d(2025, 5, 20),
      onFocusedViewChange,
    };
    const { container, rerender } = render(<DateCalendar {...props} />);
    const day = q<HTMLButtonElement>(container, '[data-ok-picker-day][tabindex="0"]');
    act(() => day.focus());
    expect(onFocusedViewChange).toHaveBeenLastCalledWith("day", true);
    act(() => day.blur());
    expect(onFocusedViewChange).toHaveBeenLastCalledWith("day", false);
    rerender(<DateCalendar {...props} focusedView="day" />);
    expect(document.activeElement).toBe(day);
    // A view that isn't shown takes no focus.
    rerender(<DateCalendar {...props} focusedView="year" />);
    expect(document.activeElement).toBe(day);
    rerender(<DateCalendar {...props} focusedView="year" view="year" />);
    await flush();
    expect(document.activeElement?.closest("[data-ok-year-calendar]")).not.toBeNull();
    expect(onFocusedViewChange).toHaveBeenLastCalledWith("year", true);
  });

  it("TimeClock follows its view on the listbox, DigitalClock reports hours", async () => {
    const onClock = vi.fn();
    const onList = vi.fn();
    const { container, rerender } = render(
      <>
        <TimeClock today={TODAY} onFocusedViewChange={onClock} />
        <DigitalClock today={TODAY} onFocusedViewChange={onList} aria-label="Times" />
      </>,
    );
    const listbox = q(container, "[data-ok-time-clock-options]");
    rerender(
      <>
        <TimeClock today={TODAY} onFocusedViewChange={onClock} focusedView="hours" />
        <DigitalClock today={TODAY} onFocusedViewChange={onList} aria-label="Times" />
      </>,
    );
    expect(document.activeElement).toBe(listbox);
    expect(onClock).toHaveBeenLastCalledWith("hours", true);
    // The next arrow shows the minutes: the listbox keeps the focus, the view changes.
    act(() => q<HTMLButtonElement>(container, "[data-ok-time-clock-next]").click());
    act(() => listbox.focus());
    await flush();
    expect(onClock.mock.calls).toContainEqual(["minutes", true]);
    rerender(
      <>
        <TimeClock today={TODAY} onFocusedViewChange={onClock} focusedView="hours" />
        <DigitalClock
          today={TODAY}
          onFocusedViewChange={onList}
          focusedView="hours"
          aria-label="Times"
        />
      </>,
    );
    expect(document.activeElement?.closest("[data-ok-digital-clock]")).not.toBeNull();
    expect(onList).toHaveBeenLastCalledWith("hours", true);
  });

  it("MultiSectionDigitalClock moves the focus to a column, DateRangeCalendar to its days", async () => {
    const onColumns = vi.fn();
    const { container, rerender } = render(
      <MultiSectionDigitalClock today={TODAY} ampm onFocusedViewChange={onColumns} />,
    );
    rerender(
      <MultiSectionDigitalClock
        today={TODAY}
        ampm
        onFocusedViewChange={onColumns}
        focusedView="meridiem"
      />,
    );
    expect(
      document.activeElement?.closest('[data-ok-digital-clock-section="meridiem"]'),
    ).not.toBeNull();
    expect(onColumns).toHaveBeenLastCalledWith("meridiem", true);
    const onRange = vi.fn();
    const range = render(
      <DateRangeCalendar today={TODAY} focusedView="day" onFocusedViewChange={onRange} />,
    );
    expect(
      range.container.contains(document.activeElement) &&
        document.activeElement?.hasAttribute("data-ok-picker-day"),
    ).toBe(true);
    expect(onRange).toHaveBeenLastCalledWith("day", true);
    expect(onColumns).toHaveBeenLastCalledWith("meridiem", false);
    expect(container).toBeDefined();
  });
});

describe("TimeClock showViewSwitcher", () => {
  it("hides the arrows with showViewSwitcher={false}", async () => {
    const { container } = render(
      <>
        <TimeClock today={TODAY} id="on" />
        <TimeClock today={TODAY} id="off" showViewSwitcher={false} />
      </>,
    );
    const nav = (id: string) => q(container, `#${id} [data-ok-time-clock-nav]`);
    expect(q(container, "#on").hasAttribute("data-ok-show-view-switcher")).toBe(false);
    expect(q(container, "#off").getAttribute("data-ok-show-view-switcher")).toBe("false");
    expect(getComputedStyle(nav("on")).display).toBe("flex");
    expect(getComputedStyle(nav("off")).display).toBe("none");
    await expectNoAxeViolations(container);
  });
});

describe("displayStaticWrapperAs", () => {
  it("static date pickers: the desktop form has no toolbar and no actions", () => {
    const { container } = render(
      <>
        <StaticDatePicker today={TODAY} data-testid="mobile" />
        <StaticDatePicker today={TODAY} displayStaticWrapperAs="desktop" data-testid="desktop" />
      </>,
    );
    const [mobile, desktop] = [
      ...container.querySelectorAll<HTMLElement>("[data-ok-date-picker]"),
    ] as HTMLElement[];
    expect(mobile?.hasAttribute("data-ok-display-static-wrapper-as")).toBe(false);
    expect(desktop?.getAttribute("data-ok-display-static-wrapper-as")).toBe("desktop");
    expect(q(mobile as HTMLElement, "[data-ok-picker-toolbar]")).not.toBeNull();
    expect(q(desktop as HTMLElement, "[data-ok-picker-toolbar]")).toBeNull();
    const shown = (root: HTMLElement | undefined) =>
      [...(root as HTMLElement).querySelectorAll<HTMLElement>("[data-ok-picker-action]")].filter(
        (button) => !button.hidden,
      ).length;
    expect(shown(mobile)).toBe(2);
    expect(shown(desktop)).toBe(0);
  });

  it("static time and date time pickers: the desktop form shows the digital clocks", () => {
    const { container } = render(
      <>
        <StaticTimePicker today={TODAY} displayStaticWrapperAs="desktop" />
        <StaticDateTimePicker
          today={TODAY}
          displayStaticWrapperAs="desktop"
          defaultValue={d(2025, 5, 20, 9, 30)}
        />
      </>,
    );
    const [time, dateTime] = [
      ...container.querySelectorAll<HTMLElement>("[data-ok-date-picker]"),
    ] as HTMLElement[];
    for (const root of [time, dateTime] as HTMLElement[]) {
      expect(root.querySelector("[data-ok-time-clock]")).toBeNull();
      expect(
        root.querySelector(
          "[data-ok-picker-content] > :is([data-ok-digital-clock], [data-ok-multi-section-digital-clock]):not([hidden])",
        ),
      ).not.toBeNull();
      expect(root.querySelector("[data-ok-picker-tabs]")).toBeNull();
      expect(root.querySelector("[data-ok-picker-toolbar]")).toBeNull();
    }
    // The desktop date time form shows the calendar beside the clocks, also after a pick.
    const calendar = q(dateTime as HTMLElement, "[data-ok-date-calendar]");
    act(() => q<HTMLButtonElement>(calendar, '[data-ok-date="2025-05-22"]').click());
    expect(calendar.hidden).toBe(false);
  });

  it("static range pickers: the desktop form shows two months and no toolbar", () => {
    const { container } = render(
      <>
        <StaticDateRangePicker today={TODAY} />
        <StaticDateRangePicker today={TODAY} displayStaticWrapperAs="desktop" />
      </>,
    );
    const [mobile, desktop] = [
      ...container.querySelectorAll<HTMLElement>("[data-ok-date-range-picker]"),
    ] as HTMLElement[];
    const months = (root: HTMLElement | undefined) =>
      (root as HTMLElement).querySelectorAll("[data-ok-date-range-calendar-month]").length;
    expect(months(mobile)).toBe(1);
    expect(months(desktop)).toBe(2);
    expect(desktop?.getAttribute("data-ok-display-static-wrapper-as")).toBe("desktop");
    expect(q(desktop as HTMLElement, "[data-ok-picker-toolbar]")).toBeNull();
    expect(q(mobile as HTMLElement, "[data-ok-picker-toolbar]")).not.toBeNull();
  });
});
