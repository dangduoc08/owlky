import { act, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { DateCalendar, MonthCalendar, YearCalendar } from "../date-calendar/date-calendar.js";
import { DateField } from "../date-field/date-field.js";
import { LocalizationProvider } from "../localization-provider/localization-provider.js";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  DatePicker,
  DesktopDatePicker,
  MobileDatePicker,
  StaticDatePicker,
} from "./date-picker.js";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const iso = (value: Date | null | undefined) =>
  value && !Number.isNaN(value.getTime())
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
    : String(value);
const sections = () => [...document.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
const texts = () => sections().map((s) => s.textContent);
const day = (date: string) =>
  document.querySelector<HTMLButtonElement>(`[data-ok-date="${date}"]`) as HTMLButtonElement;
const TODAY = d(2025, 5, 20);

afterEach(() => {
  vi.restoreAllMocks();
});

function Controlled() {
  const [value, setValue] = useState<Date | null>(d(2025, 5, 25));
  return (
    <>
      <DateField label="Date" value={value} onChange={() => {}} />
      <button type="button" onClick={() => setValue(d(2026, 1, 2))}>
        set
      </button>
    </>
  );
}

describe("DateField", () => {
  it("renders a TextField with spinbutton sections and a hidden ISO input", async () => {
    render(<DateField id="f" label="Date" name="when" defaultValue={d(2025, 5, 25)} />);
    const root = document.querySelector("[data-ok-date-field]") as HTMLElement;
    expect(root.hasAttribute("data-ok-text-field")).toBe(true);
    expect(root.getAttribute("data-ok-value")).toBe("2025-05-25");
    expect(root.getAttribute("data-ok-format")).toBe("MM/DD/YYYY");
    expect(root.hasAttribute("data-ok-shrink")).toBe(true);
    expect(screen.getByRole("group", { name: "Date" })).toBeTruthy();
    expect(texts()).toEqual(["05", "25", "2025"]);
    const month = screen.getByRole("spinbutton", { name: "Month" });
    expect(month.getAttribute("aria-valuenow")).toBe("5");
    expect(month.getAttribute("aria-valuetext")).toBe("May");
    expect(month.getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("spinbutton", { name: "Day" }).getAttribute("tabindex")).toBe("-1");
    expect((document.querySelector('input[name="when"]') as HTMLInputElement).value).toBe(
      "2025-05-25",
    );
    await expectNoAxeViolations();
  });

  it("types a date and reports it once complete", async () => {
    const onChange = vi.fn();
    render(<DateField label="Date" onChange={onChange} />);
    const root = document.querySelector("[data-ok-date-field]") as HTMLElement;
    expect(root.hasAttribute("data-ok-shrink")).toBe(false);
    expect(texts()).toEqual(["MM", "DD", "YYYY"]);
    await userEvent.click(sections()[0] as HTMLElement);
    await userEvent.keyboard("0525");
    expect(texts()).toEqual(["05", "25", "YYYY"]);
    // Partly filled: an invalid date.
    expect(onChange.mock.lastCall?.[1]).toEqual({ validationError: "invalidDate" });
    await userEvent.keyboard("2025");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-25");
    expect(onChange.mock.lastCall?.[1]).toEqual({ validationError: null });
    expect(root.hasAttribute("data-ok-shrink")).toBe(true);
  });

  it("validates against its rules, reports errors and marks the field", async () => {
    const onError = vi.fn();
    const { rerender } = render(
      <DateField label="Date" value={d(2025, 5, 25)} minDate={d(2025, 6, 1)} onError={onError} />,
    );
    const root = document.querySelector("[data-ok-date-field]") as HTMLElement;
    expect(root.hasAttribute("data-ok-error")).toBe(true);
    expect(screen.getByRole("group").getAttribute("aria-invalid")).toBe("true");
    rerender(
      <DateField label="Date" value={d(2025, 6, 25)} minDate={d(2025, 6, 1)} onError={onError} />,
    );
    expect(onError).toHaveBeenLastCalledWith(null, d(2025, 6, 25));
    expect(root.hasAttribute("data-ok-error")).toBe(false);
  });

  it("controlled: follows the value and can refuse changes", async () => {
    render(<Controlled />);
    await userEvent.click(sections()[0] as HTMLElement);
    await userEvent.keyboard("{ArrowUp}");
    // The owner ignored the change: back to the value it holds.
    expect(texts()).toEqual(["05", "25", "2025"]);
    await userEvent.click(screen.getByRole("button", { name: "set" }));
    expect(texts()).toEqual(["01", "02", "2026"]);
  });

  it("formats, spacious separators, letters and the clear button", async () => {
    const onClear = vi.fn();
    render(
      <DateField
        label="Month"
        format="MMMM YYYY"
        formatDensity="spacious"
        clearable
        onClear={onClear}
        defaultValue={d(2025, 5, 25)}
      />,
    );
    expect(texts()).toEqual(["May", "2025"]);
    expect(sections()[0]?.getAttribute("inputmode")).toBe("text");
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(texts()).toEqual(["MMMM", "YYYY"]);
    expect(onClear).toHaveBeenCalledOnce();
    expect((document.querySelector("[data-ok-date-field-clear]") as HTMLElement).hidden).toBe(true);
    render(
      <DateField
        label="D"
        format="DD/MM/YYYY"
        formatDensity="spacious"
        defaultValue={d(2025, 5, 25)}
      />,
    );
    expect(document.querySelectorAll("[data-ok-date-field]")[1]?.textContent).toContain(" / ");
  });

  it("read-only and disabled", async () => {
    const onChange = vi.fn();
    render(
      <>
        <DateField label="A" readOnly defaultValue={d(2025, 5, 25)} onChange={onChange} />
        <DateField label="B" disabled defaultValue={d(2025, 5, 25)} onChange={onChange} />
      </>,
    );
    const [readOnly, , , disabled] = sections();
    await userEvent.click(readOnly as HTMLElement);
    await userEvent.keyboard("{ArrowUp}1");
    expect(onChange).not.toHaveBeenCalled();
    expect(readOnly?.getAttribute("aria-readonly")).toBe("true");
    expect(readOnly?.getAttribute("contenteditable")).toBe("false");
    expect(disabled?.getAttribute("tabindex")).toBe("-1");
    expect((document.querySelectorAll("input[type=hidden]")[1] as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it("selected sections: controlled focus and reports", async () => {
    const onSelected = vi.fn();
    const { rerender } = render(<DateField label="Date" onSelectedSectionsChange={onSelected} />);
    rerender(<DateField label="Date" selectedSections={2} onSelectedSectionsChange={onSelected} />);
    expect(document.activeElement).toBe(sections()[2]);
    expect(onSelected).toHaveBeenLastCalledWith(2);
  });

  it("auto focus, locale and nested providers", () => {
    render(
      <LocalizationProvider adapterLocale="vi-VN">
        <DateField label="Ngày" autoFocus defaultValue={d(2025, 5, 25)} />
        <LocalizationProvider localeText={{ fieldClearLabel: "Bỏ" }}>
          <DateField label="Khác" clearable defaultValue={d(2025, 5, 25)} />
        </LocalizationProvider>
        <LocalizationProvider adapterLocale="en-US">
          <DateField label="Other" />
        </LocalizationProvider>
      </LocalizationProvider>,
    );
    expect(document.activeElement).toBe(sections()[0]);
    expect(texts().slice(0, 3)).toEqual(["25", "05", "2025"]);
    expect(sections()[0]?.getAttribute("aria-label")).toBe("Ngày");
    expect(document.querySelector("[data-ok-date-field]")?.getAttribute("data-ok-locale")).toBe(
      "vi-VN",
    );
    expect(screen.getByRole("button", { name: "Bỏ" })).toBeTruthy();
    expect(texts().slice(6)).toEqual(["MM", "DD", "YYYY"]);
  });
});

describe("DateCalendar", () => {
  it("renders an ARIA grid for the month of the value", async () => {
    render(<DateCalendar defaultValue={d(2025, 5, 25)} today={TODAY} />);
    expect(screen.getByRole("grid", { name: "May 2025" })).toBeTruthy();
    expect(screen.getAllByRole("columnheader").map((c) => c.textContent)).toEqual([
      "S",
      "M",
      "T",
      "W",
      "T",
      "F",
      "S",
    ]);
    expect(day("2025-05-25").getAttribute("aria-selected")).toBe("true");
    expect(day("2025-05-25").tabIndex).toBe(0);
    expect(day("2025-05-20").hasAttribute("data-ok-today")).toBe(true);
    expect(day("2025-05-20").getAttribute("aria-current")).toBe("date");
    expect(document.querySelectorAll("[data-ok-day-filler]")).toHaveLength(4);
    await expectNoAxeViolations();
  });

  it("picks days, moves months with the header and the keyboard", async () => {
    const onChange = vi.fn();
    const onMonthChange = vi.fn();
    render(
      <DateCalendar
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        onChange={onChange}
        onMonthChange={onMonthChange}
      />,
    );
    await userEvent.click(day("2025-05-03"));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-03");
    expect(onChange.mock.lastCall?.[1]).toBe("finish");
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid").getAttribute("aria-labelledby")).toBeTruthy();
    expect(iso(onMonthChange.mock.lastCall?.[0])).toBe("2025-06-01");
    await userEvent.click(screen.getByRole("button", { name: "Previous month" }));
    day("2025-05-03").focus();
    await userEvent.keyboard("{PageUp}");
    expect(document.activeElement?.getAttribute("data-ok-date")).toBe("2025-04-03");
    expect(screen.getByRole("grid", { name: "April 2025" })).toBeTruthy();
  });

  it("year then day: the switch button, a year pick moves to the day view", async () => {
    const onChange = vi.fn();
    const onYearChange = vi.fn();
    render(
      <DateCalendar
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        onChange={onChange}
        onYearChange={onYearChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /switch to year view/ }));
    const group = screen.getByRole("radiogroup");
    expect(group.hasAttribute("data-ok-year-calendar")).toBe(true);
    expect(screen.getByRole("radio", { name: "2025" }).getAttribute("aria-checked")).toBe("true");
    await userEvent.click(screen.getByRole("radio", { name: "2027" }));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2027-05-25");
    expect(onChange.mock.lastCall?.[1]).toBe("partial");
    expect(iso(onYearChange.mock.lastCall?.[0])).toBe("2027-01-01");
    expect(screen.getByRole("grid", { name: "May 2027" })).toBeTruthy();
    expect(document.activeElement?.getAttribute("data-ok-date")).toBe("2027-05-25");
  });

  it("month and year views (month last)", async () => {
    const onChange = vi.fn();
    render(
      <DateCalendar
        views={["month", "year"]}
        openTo="year"
        defaultValue={d(2025, 1, 31)}
        today={TODAY}
        onChange={onChange}
        monthsPerRow={4}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "2024" }));
    expect(screen.getByRole("radiogroup").hasAttribute("data-ok-month-calendar")).toBe(true);
    await userEvent.click(screen.getByRole("radio", { name: "Feb" }));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2024-02-28");
    expect(onChange.mock.lastCall?.[1]).toBe("finish");
    // The switch button goes back to the year view.
    await userEvent.click(screen.getByRole("button", { name: /switch to year view/ }));
    expect(screen.getByRole("radiogroup").hasAttribute("data-ok-year-calendar")).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: /switch to calendar view/ }));
    expect(screen.getByRole("radiogroup").hasAttribute("data-ok-month-calendar")).toBe(true);
  });

  it("disables days by rule, past and future; keeps prev/next inside limits", () => {
    render(
      <DateCalendar
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        disableFuture
        minDate={d(2025, 5, 2)}
        shouldDisableDate={(date) => date.getDate() === 10}
      />,
    );
    expect(day("2025-05-01").disabled).toBe(true);
    expect(day("2025-05-10").disabled).toBe(true);
    expect(day("2025-05-21").disabled).toBe(true);
    expect(day("2025-05-20").disabled).toBe(false);
    expect(
      (screen.getByRole("button", { name: "Previous month" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect((screen.getByRole("button", { name: "Next month" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("week numbers, fixed weeks, outside days, custom weekday names, no today ring", () => {
    render(
      <DateCalendar
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        displayWeekNumber
        fixedWeekNumber={6}
        showDaysOutsideCurrentMonth
        disableHighlightToday
        dayOfWeekFormatter={(date) => `${date.getDay()}`}
      />,
    );
    expect(screen.getAllByRole("row")).toHaveLength(7);
    expect(screen.getAllByRole("rowheader")[0]?.getAttribute("aria-label")).toBe("Week 18");
    expect(screen.getByRole("columnheader", { name: "Week number" }).textContent).toBe("#");
    expect(day("2025-04-27").hasAttribute("data-ok-outside")).toBe(true);
    expect(day("2025-05-20").hasAttribute("data-ok-today")).toBe(false);
    expect(screen.getByRole("columnheader", { name: "Monday" }).textContent).toBe("1");
  });

  it("loading, read-only and disabled", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DateCalendar loading renderLoading={() => "Loading days"} today={TODAY} />,
    );
    expect(screen.getByText("Loading days")).toBeTruthy();
    rerender(<DateCalendar loading today={TODAY} />);
    expect(document.querySelector("[data-ok-date-calendar-loading]")?.textContent).toBe("…");
    rerender(
      <DateCalendar readOnly defaultValue={d(2025, 5, 25)} today={TODAY} onChange={onChange} />,
    );
    await userEvent.click(day("2025-05-03"));
    expect(onChange).not.toHaveBeenCalled();
    rerender(
      <DateCalendar disabled defaultValue={d(2025, 5, 25)} today={TODAY} onChange={onChange} />,
    );
    expect(day("2025-05-03").disabled).toBe(true);
    expect(
      document.querySelector("[data-ok-date-calendar]")?.hasAttribute("data-ok-disabled"),
    ).toBe(true);
  });

  it("follows a controlled value into another month", () => {
    const { rerender } = render(<DateCalendar value={d(2025, 5, 25)} today={TODAY} />);
    rerender(<DateCalendar value={d(2025, 9, 1)} today={TODAY} />);
    expect(screen.getByRole("grid", { name: "September 2025" })).toBeTruthy();
  });

  it("MonthCalendar and YearCalendar on their own", async () => {
    const onMonth = vi.fn();
    const onYear = vi.fn();
    render(
      <>
        <MonthCalendar
          aria-label="Month"
          defaultValue={d(2025, 5, 25)}
          onChange={onMonth}
          disablePast
          today={TODAY}
        />
        <YearCalendar
          aria-label="Year"
          defaultValue={d(2025, 5, 25)}
          onChange={onYear}
          yearsOrder="desc"
          minDate={d(2020, 1, 1)}
          maxDate={d(2030, 1, 1)}
        />
      </>,
    );
    expect((screen.getByRole("radio", { name: "Apr" }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(screen.getByRole("radio", { name: "Jul" }));
    expect(iso(onMonth.mock.lastCall?.[0])).toBe("2025-07-25");
    expect(
      screen
        .getAllByRole("radio")
        .slice(12)
        .map((r) => r.textContent)[0],
    ).toBe("2030");
    await userEvent.click(screen.getByRole("radio", { name: "2028" }));
    expect(iso(onYear.mock.lastCall?.[0])).toBe("2028-05-25");
    expect(screen.getByRole("radio", { name: "2028" }).getAttribute("aria-checked")).toBe("true");
    await expectNoAxeViolations();
  });
});

describe("DatePicker", () => {
  it("desktop: opens a popover dialog from the button, picks a day, closes and accepts", async () => {
    const onChange = vi.fn();
    const onAccept = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <DesktopDatePicker
        label="Date"
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        onChange={onChange}
        onAccept={onAccept}
        onOpenChange={onOpenChange}
      />,
    );
    const button = screen.getByRole("button", {
      name: "Choose date, selected date is May 25, 2025",
    });
    expect(document.querySelector("[data-ok-picker-toolbar]")).toBeNull();
    await userEvent.click(button);
    expect(onOpenChange).toHaveBeenLastCalledWith(true, "button");
    expect(document.querySelector("[data-ok-date-picker]")?.hasAttribute("data-ok-open")).toBe(
      true,
    );
    expect(document.activeElement).toBe(day("2025-05-25"));
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-26");
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("2025-05-26");
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "select");
    expect(texts()).toEqual(["05", "26", "2025"]);
    await expectNoAxeViolations();
  });

  it("desktop: Escape closes and keeps the value", async () => {
    const onOpenChange = vi.fn();
    render(
      <DesktopDatePicker
        label="Date"
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        onOpenChange={onOpenChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Choose date/ }));
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "escape");
  });

  it("mobile: a dialog with toolbar, Cancel restores and OK accepts", async () => {
    const onChange = vi.fn();
    const onAccept = vi.fn();
    render(
      <MobileDatePicker
        label="Date"
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        onChange={onChange}
        onAccept={onAccept}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Choose date/ }));
    const dialog = screen.getByRole("dialog", { name: "Select date" });
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog.querySelector("[data-ok-picker-toolbar-title]")?.textContent).toBe("Sun, May 25");
    await userEvent.click(day("2025-05-03"));
    expect(dialog.querySelector("[data-ok-picker-toolbar-title]")?.textContent).toBe("Sat, May 3");
    // Mobile doesn't close on a pick.
    expect(onAccept).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-25");
    await userEvent.click(screen.getByRole("button", { name: /Choose date/ }));
    await userEvent.click(day("2025-05-04"));
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("2025-05-04");
  });

  it("responsive: desktop or mobile from the media query", async () => {
    render(
      <>
        <DatePicker label="A" desktopModeMediaQuery="@media (min-width: 1px)" today={TODAY} />
        <DatePicker label="B" desktopModeMediaQuery="@media (min-width: 99999px)" today={TODAY} />
      </>,
    );
    const [first, second] = screen.getAllByRole("button", { name: "Choose date" });
    await userEvent.click(first as HTMLElement);
    expect(document.querySelector("[data-ok-date-picker-paper][data-ok-open]")).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(second as HTMLElement);
    expect(screen.getByRole("dialog", { name: "Select date" }).tagName).toBe("DIALOG");
    await userEvent.keyboard("{Escape}");
  });

  it("static: inline layout with actions, clear and today", async () => {
    const onAccept = vi.fn();
    render(
      <StaticDatePicker
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        actions={["clear", "today", "cancel", "accept"]}
        onAccept={onAccept}
        orientation="landscape"
      />,
    );
    expect(document.querySelector("[data-ok-date-field]")).toBeNull();
    expect(
      document.querySelector("[data-ok-picker-layout]")?.getAttribute("data-ok-orientation"),
    ).toBe("landscape");
    await userEvent.click(day("2025-05-03"));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(day("2025-05-25").getAttribute("aria-selected")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("2025-05-20");
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onAccept.mock.lastCall?.[0]).toBeNull();
    expect(document.querySelector("[data-ok-picker-toolbar-title]")?.textContent).toBe("––");
    await expectNoAxeViolations();
  });

  it("shortcuts set and accept a value", async () => {
    const onAccept = vi.fn();
    render(
      <StaticDatePicker
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        shortcuts={[
          { label: "New year", getValue: () => d(2026, 1, 1) },
          { label: "Too old", getValue: () => d(1800, 1, 1) },
        ]}
        onAccept={onAccept}
      />,
    );
    expect(screen.getByRole("list", { name: "Shortcuts" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Too old" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    await userEvent.click(screen.getByRole("button", { name: "New year" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("2026-01-01");
    expect(screen.getByRole("grid", { name: "January 2026" })).toBeTruthy();
  });

  it("nextOrAccept steps through views", async () => {
    const onAccept = vi.fn();
    render(
      <StaticDatePicker
        views={["year", "month", "day"]}
        openTo="year"
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        actions={["nextOrAccept"]}
        onAccept={onAccept}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("radiogroup").hasAttribute("data-ok-month-calendar")).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onAccept).not.toHaveBeenCalled(); // unchanged value: nothing new to accept
  });

  it("controlled open, keepOpenDuringFieldFocus and disabled", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DesktopDatePicker
        label="Date"
        open
        onOpenChange={onOpenChange}
        today={TODAY}
        keepOpenDuringFieldFocus
      />,
    );
    expect(document.querySelector("[data-ok-date-picker-paper][data-ok-open]")).toBeTruthy();
    await userEvent.click(sections()[0] as HTMLElement);
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything());
    rerender(<DesktopDatePicker label="Date" disabled today={TODAY} />);
    expect(
      (screen.getByRole("button", { name: "Choose date" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("server rendering matches the client markup", () => {
    const tree = (
      <LocalizationProvider adapterLocale="en-US">
        <DatePicker id="ssr" label="Date" defaultValue={d(2025, 5, 25)} today={TODAY} />
        <StaticDatePicker id="ssr-static" defaultValue={d(2025, 5, 25)} today={TODAY} />
        <DateField id="ssr-field" label="Date" />
      </LocalizationProvider>
    );
    const html = renderToString(tree);
    expect(html).toContain('data-ok-date-picker=""');
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const error = vi.spyOn(console, "error");
    render(<StrictMode>{tree}</StrictMode>, { container: host, hydrate: true });
    expect(error).not.toHaveBeenCalled();
    host.remove();
  });
});
