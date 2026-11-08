import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { DateCalendar, MonthCalendar, YearCalendar } from "../date-calendar/date-calendar.js";
import { DateField } from "../date-field/date-field.js";
import { LocalizationProvider } from "../localization-provider/localization-provider.js";
import { DesktopDatePicker, MobileDatePicker, StaticDatePicker } from "./date-picker.js";

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const iso = (value: Date | null | undefined) =>
  value && !Number.isNaN(value.getTime())
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
    : String(value);
const sections = () => [...document.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
const texts = () => sections().map((s) => s.textContent);
const day = (date: string) =>
  document.querySelector<HTMLButtonElement>(`[data-ok-date="${date}"]`) as HTMLButtonElement;
const TODAY = d(2025, 5, 20);

afterEach(() => vi.useRealTimers());

function Partial() {
  const [value, setValue] = useState<Date | null>(null);
  const [format, setFormat] = useState("MM/DD/YYYY");
  return (
    <>
      <DateField label="D" value={value} onChange={setValue} format={format} />
      <button type="button" onClick={() => setFormat("DD/MM/YYYY")}>
        format
      </button>
    </>
  );
}

describe("DateField — more", () => {
  it("required label, helper text, a start separator and rule attributes", () => {
    render(
      <DateField
        id="r"
        label="Quarter"
        required
        helperText="Pick one"
        format="[Q]YYYY"
        defaultValue={d(2025, 5, 25)}
        minDate={d(2020, 1, 1)}
        maxDate={d(2030, 1, 1)}
        disablePast
        disableFuture
      />,
    );
    const root = document.querySelector("[data-ok-date-field]") as HTMLElement;
    expect(root.querySelector("[data-ok-text-field-asterisk]")).toBeTruthy();
    expect(root.querySelector("legend")?.textContent).toBe("Quarter *");
    expect(screen.getByRole("group").getAttribute("aria-describedby")).toBe("r-helper-text");
    expect(root.querySelector('[data-ok-date-field-separator="start"]')?.textContent).toBe("Q");
    expect(root.getAttribute("data-ok-max-date")).toBe("2030-01-01");
    expect(root.hasAttribute("data-ok-disable-past")).toBe(true);
    expect(root.hasAttribute("data-ok-disable-future")).toBe(true);
  });

  it("the label points at the group (presses go through it to the sections)", () => {
    render(<DateField label="Due" format="MM/DD/YYYY" />);
    expect(screen.getByText("Due", { selector: "label" }).getAttribute("for")).toBe(
      screen.getByRole("group").id,
    );
  });

  it("without a label the group has no aria-labelledby; filled and standard variants have no outline", () => {
    render(
      <>
        <DateField aria-label="Bare" variant="filled" />
        <DateField label="Std" variant="standard" />
      </>,
    );
    expect(screen.getAllByRole("group")[0]?.hasAttribute("aria-labelledby")).toBe(false);
    expect(document.querySelector("fieldset")).toBeNull();
  });

  it("controlled: keeps partial texts, resets on a format change", async () => {
    render(<Partial />);
    await userEvent.click(sections()[0] as HTMLElement);
    await userEvent.keyboard("05");
    expect(texts()).toEqual(["05", "DD", "YYYY"]);
    await userEvent.click(screen.getByRole("button", { name: "format" }));
    expect(texts()).toEqual(["DD", "MM", "YYYY"]);
  });
});

describe("DateCalendar — more", () => {
  it("defaults to today, clamps the reference into the limits and focuses on mount", () => {
    vi.useFakeTimers({ toFake: ["Date"], now: d(2025, 3, 15, 12) });
    render(<DateCalendar autoFocus />);
    expect(screen.getByRole("grid", { name: "March 2025" })).toBeTruthy();
    expect(document.activeElement?.getAttribute("data-ok-date")).toBe("2025-03-15");
  });

  it("references before / after the limits show the first / last month", () => {
    render(
      <>
        <DateCalendar referenceDate={d(2000, 1, 1)} minDate={d(2025, 5, 10)} today={TODAY} />
        <DateCalendar referenceDate={d(2099, 1, 1)} maxDate={d(2025, 5, 10)} today={TODAY} />
      </>,
    );
    expect(
      screen
        .getAllByRole("grid")
        .map(
          (g) =>
            g.getAttribute("aria-labelledby") &&
            document.getElementById(g.getAttribute("aria-labelledby") as string)?.textContent,
        ),
    ).toEqual(["May 2025", "May 2025"]);
  });

  it("a month with every day disabled still has a tab stop on its first day", () => {
    render(
      <DateCalendar
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        shouldDisableDate={(date) => date.getMonth() === 5}
      />,
    );
    act(() => screen.getByRole("button", { name: "Next month" }).click());
    expect(day("2025-06-01").tabIndex).toBe(0);
  });

  it("keeps the time of the value (or the reference date) on picks", async () => {
    const onChange = vi.fn();
    render(<DateCalendar referenceDate={d(2025, 5, 1, 9, 30)} today={TODAY} onChange={onChange} />);
    await userEvent.click(day("2025-05-02"));
    expect(onChange.mock.lastCall?.[0].getHours()).toBe(9);
    expect(onChange.mock.lastCall?.[0].getMinutes()).toBe(30);
  });

  it("month picks: the closest enabled day when the day is disabled; no value starts on the 1st", async () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <DateCalendar
        views={["year", "month", "day"]}
        openTo="month"
        defaultValue={d(2025, 5, 31)}
        today={TODAY}
        shouldDisableDate={(date) => date.getMonth() === 6 && date.getDate() > 20}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "Jul" }));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-07-01");
    expect(onChange.mock.lastCall?.[1]).toBe("partial");
    unmount();
    render(
      <DateCalendar
        views={["month", "day"]}
        openTo="month"
        today={TODAY}
        referenceDate={d(2025, 5, 10)}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "Aug" }));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-08-01");
  });

  it("year picks: the closest enabled day in that year; leap days clamp", async () => {
    const onChange = vi.fn();
    render(
      <DateCalendar
        defaultValue={d(2024, 2, 29)}
        today={TODAY}
        shouldDisableDate={(date) => date.getFullYear() === 2026 && date.getMonth() === 1}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /switch to year view/ }));
    await userEvent.click(screen.getByRole("radio", { name: "2025" }));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-02-28");
    await userEvent.click(screen.getByRole("button", { name: /switch to year view/ }));
    await userEvent.click(screen.getByRole("radio", { name: "2026" }));
    expect(onChange.mock.lastCall?.[0].getFullYear()).toBe(2026);
    expect(onChange.mock.lastCall?.[0].getMonth()).not.toBe(1);
  });

  it("year only: the year pick finishes; arrow keys in the month and year views", async () => {
    const onChange = vi.fn();
    render(
      <DateCalendar
        views={["year"]}
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        onChange={onChange}
      />,
    );
    (screen.getByRole("radio", { name: "2025" }) as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.textContent).toBe("2026");
    await userEvent.keyboard("{Enter}");
    expect(onChange.mock.lastCall?.[1]).toBe("finish");
  });

  it("year and month views switch between each other", async () => {
    render(<DateCalendar views={["year", "month"]} defaultValue={d(2025, 5, 25)} today={TODAY} />);
    (screen.getByRole("radio", { name: "May" }) as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("Aug");
    await userEvent.click(screen.getByRole("button", { name: /switch to year view/ }));
    await userEvent.click(screen.getByRole("button", { name: /switch to calendar view/ }));
    expect(screen.getByRole("radiogroup").hasAttribute("data-ok-month-calendar")).toBe(true);
  });

  it("MonthCalendar / YearCalendar: keys, auto focus, reference date, no value", async () => {
    render(
      <>
        <MonthCalendar aria-label="M" referenceDate={d(2025, 2, 10)} autoFocus />
        <YearCalendar
          aria-label="Y"
          defaultValue={d(2025, 5, 25)}
          minDate={d(2024, 1, 1)}
          maxDate={d(2026, 1, 1)}
          yearsPerRow={3}
        />
      </>,
    );
    expect(document.activeElement?.textContent).toBe("Feb");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.textContent).toBe("Mar");
    (screen.getByRole("radio", { name: "2025" }) as HTMLElement).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement?.textContent).toBe("2024");
  });
});

describe("Pickers — more", () => {
  it("static closeOnSelect accepts a pick; the today action keeps the time", async () => {
    const onAccept = vi.fn();
    render(
      <StaticDatePicker
        closeOnSelect
        defaultValue={d(2025, 5, 25, 8, 15)}
        today={TODAY}
        actions={["today"]}
        onAccept={onAccept}
      />,
    );
    expect(
      document.querySelector("[data-ok-date-picker]")?.getAttribute("data-ok-close-on-select"),
    ).toBe("true");
    await userEvent.click(day("2025-05-02"));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("2025-05-02");
    await userEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(onAccept.mock.lastCall?.[0].getHours()).toBe(8);
    expect(onAccept.mock.lastCall?.[0].getMinutes()).toBe(15);
  });

  it("read-only pickers don't open; their actions are disabled except Cancel", () => {
    render(
      <StaticDatePicker
        readOnly
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        actions={["clear", "cancel"]}
      />,
    );
    expect((screen.getByRole("button", { name: "Clear" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    render(<DesktopDatePicker label="R" readOnly today={TODAY} />);
    expect(
      (screen.getByRole("button", { name: "Choose date" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("typing in the field changes the picker value; the open button toggles", async () => {
    const onChange = vi.fn();
    render(
      <DesktopDatePicker
        label="Date"
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        onChange={onChange}
      />,
    );
    await userEvent.click(sections()[1] as HTMLElement);
    await userEvent.keyboard("{ArrowUp}");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-26");
    const button = screen.getByRole("button", { name: /Choose date/ });
    await userEvent.click(button);
    expect(document.querySelector("[data-ok-date-picker][data-ok-open]")).toBeTruthy();
    await userEvent.click(button);
    expect(document.querySelector("[data-ok-date-picker][data-ok-open]")).toBeNull();
  });

  it("desktop: a press outside or focus in the field closes; keep-open waits for focus", async () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <>
        <button type="button">outside</button>
        <DesktopDatePicker label="Date" today={TODAY} onOpenChange={onOpenChange} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await userEvent.click(screen.getByRole("button", { name: "outside" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "clickaway");
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    act(() => (sections()[0] as HTMLElement).focus());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "clickaway");
    unmount();
    onOpenChange.mockClear();
    render(
      <>
        <button type="button">outside</button>
        <DesktopDatePicker
          label="Date"
          today={TODAY}
          keepOpenDuringFieldFocus
          onOpenChange={onOpenChange}
        />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await userEvent.click(screen.getByRole("button", { name: "outside" }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "clickaway");
  });

  it("mobile: Escape cancels; a shortcut that throws does nothing", async () => {
    const onChange = vi.fn();
    render(
      <MobileDatePicker
        label="Date"
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        onChange={onChange}
        shortcuts={[
          {
            label: "Broken",
            getValue: () => {
              throw new Error("no");
            },
          },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Choose date/ }));
    await userEvent.click(day("2025-05-03"));
    await userEvent.keyboard("{Escape}");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("2025-05-25");
    await userEvent.click(screen.getByRole("button", { name: /Choose date/ }));
    expect((screen.getByRole("button", { name: "Broken" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("a shortcut whose value changes between render and press is ignored when it throws", async () => {
    let calls = 0;
    const onAccept = vi.fn();
    render(
      <StaticDatePicker
        defaultValue={d(2025, 5, 25)}
        today={TODAY}
        onAccept={onAccept}
        shortcuts={[
          {
            label: "Flaky",
            getValue: () => {
              calls += 1;
              if (calls > 1) throw new Error("x");
              return d(2025, 6, 1);
            },
          },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Flaky" }));
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("nested providers keep the parent's texts for the same locale; component localeText wins", () => {
    render(
      <LocalizationProvider localeText={{ okButtonLabel: "Done" }}>
        <LocalizationProvider>
          <StaticDatePicker today={TODAY} localeText={{ cancelButtonLabel: "Back" }} />
        </LocalizationProvider>
      </LocalizationProvider>,
    );
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  });
});

describe("Pickers — lifecycle details", () => {
  it("a year pick in a desktop picker doesn't close it; today action without a value or `today`", async () => {
    const onOpenChange = vi.fn();
    render(
      <DesktopDatePicker label="Date" defaultValue={d(2025, 5, 25)} onOpenChange={onOpenChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Choose date/ }));
    await userEvent.click(screen.getByRole("button", { name: /switch to year view/ }));
    await userEvent.click(screen.getByRole("radio", { name: "2027" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true, "button");
    vi.useFakeTimers({ toFake: ["Date"], now: d(2025, 3, 3, 12) });
    const onAccept = vi.fn();
    render(<StaticDatePicker actions={["today"]} onAccept={onAccept} />);
    await userEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("2025-03-03");
  });

  it("keep-open: a press in the field keeps the popover open", async () => {
    const onOpenChange = vi.fn();
    render(
      <DesktopDatePicker
        label="Date"
        today={TODAY}
        keepOpenDuringFieldFocus
        onOpenChange={onOpenChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await userEvent.click(sections()[0] as HTMLElement);
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(onOpenChange).toHaveBeenLastCalledWith(true, "button");
  });

  it("mobile: a press on the backdrop cancels", async () => {
    const onOpenChange = vi.fn();
    render(<MobileDatePicker label="Date" today={TODAY} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    const dialog = document.querySelector("dialog") as HTMLElement;
    await userEvent.click(dialog, { position: { x: 2, y: 2 } });
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "clickaway");
  });
});
