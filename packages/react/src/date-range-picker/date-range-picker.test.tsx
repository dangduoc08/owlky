import { act, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import type { DateRange } from "../date-range-calendar/date-range-calendar.js";
import {
  DateTimeRangePicker,
  DesktopDateTimeRangePicker,
  MobileDateTimeRangePicker,
} from "../date-time-range-picker/date-time-range-picker.js";
import { LocalizationProvider } from "../localization-provider/localization-provider.js";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  DesktopTimeRangePicker,
  MobileTimeRangePicker,
  TimeRangePicker,
} from "../time-range-picker/time-range-picker.js";
import {
  DateRangePicker,
  DesktopDateRangePicker,
  MobileDateRangePicker,
  type RangeShortcut,
  StaticDateRangePicker,
} from "./date-range-picker.js";

const d = (day: number, month = 4) => new Date(2025, month, day);
const at = (h: number, m = 0, day = 25) => new Date(2025, 4, day, h, m);
const TODAY = d(25);
const RANGE: DateRange = [d(20), d(25)];
const q = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<E>(selector) as E;
const day = (iso: string, root: ParentNode = document) => q(`[data-ok-date="${iso}"]`, root);
const fmt = (date: Date | null) =>
  date === null
    ? ""
    : Number.isNaN(date.getTime())
      ? "invalid"
      : `${date.getMonth() + 1}/${date.getDate()}${date.getHours() || date.getMinutes() ? ` ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}` : ""}`;
const iso = (range: DateRange | undefined) => (range ?? []).map(fmt).join("-");
const openButton = (name: RegExp = /Choose range/) => screen.getByRole("button", { name });

/** Makes `matchMedia` answer `matches` (responsive pickers pick mobile when false). */
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DateRangePicker", () => {
  it("desktop: two calendars in a popover; the end pick accepts and closes", async () => {
    const onChange = vi.fn();
    const onAccept = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <DesktopDateRangePicker
        id="p"
        label="Stay"
        today={TODAY}
        defaultValue={RANGE}
        onChange={onChange}
        onAccept={onAccept}
        onOpenChange={onOpenChange}
      />,
    );
    const button = openButton(/Choose range, selected range is May 20, 2025 – May 25, 2025/);
    await userEvent.click(button);
    expect(onOpenChange).toHaveBeenLastCalledWith(true, "button");
    const paper = screen.getByRole("dialog", { name: "Select date range" });
    expect(paper.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(2);
    expect(paper.querySelector("[data-ok-picker-toolbar]")).toBeNull();
    expect(document.activeElement?.getAttribute("data-ok-date")).toBe("2025-05-20");
    await expectNoAxeViolations(document.body);
    await userEvent.click(day("2025-05-12", paper));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/12-5/25");
    expect(q("[data-ok-date-range-picker]").hasAttribute("data-ok-open")).toBe(true);
    await userEvent.click(day("2025-06-03", paper));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("5/12-6/3");
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "select");
    expect(document.activeElement).toBe(button);
    expect(onChange.mock.lastCall?.[1].validationError).toEqual([null, null]);
  });

  it("desktop: Escape and the button keep the value; focus in the field closes", async () => {
    const onAccept = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <DateRangePicker
        label="Stay"
        today={TODAY}
        defaultValue={RANGE}
        onAccept={onAccept}
        onOpenChange={onOpenChange}
      />,
    );
    await userEvent.click(openButton());
    await userEvent.click(day("2025-05-10"));
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "escape");
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("5/10-5/25");
    await userEvent.click(openButton());
    await userEvent.click(openButton());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "button");
    await userEvent.click(openButton());
    act(() => q<HTMLElement>('[role="spinbutton"]').focus());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "clickaway");
  });

  it("keepOpenDuringFieldFocus: typing keeps the popover; a press outside closes", async () => {
    const onOpenChange = vi.fn();
    render(
      <>
        <DesktopDateRangePicker
          label="Stay"
          today={TODAY}
          defaultValue={RANGE}
          keepOpenDuringFieldFocus
          onOpenChange={onOpenChange}
        />
        <button type="button">outside</button>
      </>,
    );
    await userEvent.click(openButton());
    act(() => q<HTMLElement>('[role="spinbutton"]').focus());
    expect(q("[data-ok-date-range-picker]").hasAttribute("data-ok-open")).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "outside" }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "clickaway");
  });

  it("mobile: one calendar and the toolbar in a dialog; Cancel restores, OK accepts", async () => {
    const onChange = vi.fn();
    const onAccept = vi.fn();
    render(
      <MobileDateRangePicker
        label="Stay"
        today={TODAY}
        defaultValue={RANGE}
        onChange={onChange}
        onAccept={onAccept}
      />,
    );
    await userEvent.click(openButton());
    const dialog = screen.getByRole("dialog", { name: "Select date range" });
    expect(dialog.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(1);
    const end = q('[data-ok-picker-toolbar-button][data-ok-range-position="end"]', dialog);
    expect(end.textContent).toBe("May 25");
    await userEvent.click(end);
    expect(end.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(day("2025-05-28", dialog));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/20-5/28");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/20-5/25");
    expect(onAccept).not.toHaveBeenCalled();
    await userEvent.click(openButton());
    await userEvent.click(day("2025-05-12"));
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("5/12-5/25");
    await userEvent.click(openButton());
    await userEvent.keyboard("{Escape}");
  });

  it("responsive: picks the dialog on touch screens", async () => {
    pointerFine(false);
    render(<DateRangePicker label="Stay" today={TODAY} defaultValue={RANGE} />);
    expect(q("[data-ok-picker-actions]").hasAttribute("hidden")).toBe(true);
    await userEvent.click(openButton());
    expect(q("dialog[data-ok-date-picker-dialog]").hasAttribute("open")).toBe(true);
    expect(q("[data-ok-picker-toolbar]").hasAttribute("hidden")).toBe(false);
    await userEvent.click(q("[data-ok-dialog-backdrop]") ?? document.body);
  });

  it("multi input: each field's button opens on its end", async () => {
    const onPosition = vi.fn();
    render(
      <DateRangePicker
        multiInput
        startLabel="Check-in"
        endLabel="Check-out"
        today={TODAY}
        defaultValue={RANGE}
        onRangePositionChange={onPosition}
        keepOpenDuringFieldFocus
      />,
    );
    const end = q<HTMLButtonElement>('[data-ok-date-picker-open][data-ok-range-position="end"]');
    expect(end.getAttribute("aria-label")).toBe("Choose date, selected date is May 25, 2025");
    await userEvent.click(end);
    expect(onPosition).toHaveBeenLastCalledWith("end");
    expect(q("[data-ok-date-range-calendar]").getAttribute("data-ok-range-position")).toBe("end");
    act(() => q<HTMLElement>('[role="spinbutton"]').focus());
    expect(onPosition).toHaveBeenLastCalledWith("start");
    expect(q("[data-ok-date-range-picker]").hasAttribute("data-ok-open")).toBe(true);
  });

  it("static: shortcuts, actions, closeOnSelect and the field-less layout", async () => {
    const onChange = vi.fn();
    const onAccept = vi.fn();
    const shortcuts: RangeShortcut[] = [
      { label: "Week", getValue: () => [d(19), d(25)] },
      { label: "Reset", getValue: () => [null, null] },
      { label: "Bad", getValue: () => [d(25), d(19)] },
      {
        label: "Broken",
        getValue: () => {
          throw new Error("no");
        },
      },
    ];
    render(
      <StaticDateRangePicker
        today={TODAY}
        defaultValue={RANGE}
        shortcuts={shortcuts}
        actions={["clear", "today", "cancel", "accept", "nextOrAccept"]}
        closeOnSelect
        calendars={2}
        onChange={onChange}
        onAccept={onAccept}
      />,
    );
    expect(document.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(2);
    expect(q('[data-ok-picker-shortcut][data-ok-value="2025-05-19/2025-05-25"]')).toBeTruthy();
    expect(q('[data-ok-picker-shortcut][data-ok-value="/"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bad" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Broken" }).hasAttribute("disabled")).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Week" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("5/19-5/25");
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("-");
    await userEvent.click(day("2025-05-02"));
    await userEvent.click(day("2025-05-06"));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("5/2-5/6");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      q('[data-ok-picker-toolbar-button][data-ok-range-position="end"]').getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    await userEvent.click(q('[data-ok-picker-action="accept"]'));
    await userEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("5/25-5/25");
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("-");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("-");
    await expectNoAxeViolations(document.body);
  });

  it("controlled open and value; typing in the field; disabled and read-only", async () => {
    // biome-ignore lint/correctness/noComponentHookFactories: a test-local owner that reads this test's spies.
    function Controlled() {
      const [value, setValue] = useState<DateRange>(RANGE);
      const [open, setOpen] = useState(false);
      return (
        <>
          <DesktopDateRangePicker
            label="Stay"
            today={TODAY}
            value={value}
            onChange={setValue}
            open={open}
            onOpenChange={setOpen}
            clearable
            name="stay"
          />
          <button type="button" onClick={() => setValue([d(1, 7), d(3, 7)])}>
            august
          </button>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("button", { name: "august" }));
    expect(q<HTMLInputElement>('input[name="stay"]').value).toBe("2025-08-01/2025-08-03");
    await userEvent.click(openButton());
    expect(document.querySelector("[data-ok-date-calendar-label]")?.textContent).toBe(
      "August 2025",
    );
    await userEvent.keyboard("{Escape}");
    const spin = document.querySelectorAll<HTMLElement>('[role="spinbutton"]');
    act(() => spin[4]?.focus());
    await userEvent.keyboard("09");
    expect(q<HTMLInputElement>('input[name="stay"]').value).toBe("2025-08-01/2025-08-09");
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(q<HTMLInputElement>('input[name="stay"]').value).toBe("");
  });

  it("disabled and read-only pickers can't open; renders on the server", () => {
    render(
      <>
        <DateRangePicker label="A" disabled defaultValue={RANGE} />
        <DateRangePicker label="B" readOnly defaultValue={RANGE} />
      </>,
    );
    for (const button of document.querySelectorAll<HTMLButtonElement>("[data-ok-date-picker-open]"))
      expect(button.disabled).toBe(true);
    const html = renderToString(
      <StrictMode>
        <DateRangePicker
          id="s"
          label="S"
          defaultValue={RANGE}
          desktopModeMediaQuery="(min-width: 1px)"
        />
      </StrictMode>,
    );
    expect(html).toContain('data-ok-date-range-picker=""');
    expect(html).toContain('data-ok-desktop-mode-media-query="(min-width: 1px)"');
  });
});

describe("TimeRangePicker", () => {
  it("desktop: start / end tabs and digital clocks; the start's last view moves to the end", async () => {
    const onChange = vi.fn();
    const onAccept = vi.fn();
    render(
      <DesktopTimeRangePicker
        label="Hours"
        defaultValue={[at(9), at(17, 30)]}
        onChange={onChange}
        onAccept={onAccept}
      />,
    );
    await userEvent.click(openButton(/Choose range, selected range is 09:00 AM – 05:30 PM/));
    const paper = screen.getByRole("dialog", { name: "Select time range" });
    expect(screen.getByRole("tab", { name: "Start" }).getAttribute("aria-selected")).toBe("true");
    expect(paper.querySelector("[data-ok-multi-section-digital-clock]")).toBeTruthy();
    await userEvent.click(q('[data-ok-digital-clock-section="hours"] [data-ok-value="10"]', paper));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/25 10:00-5/25 17:30");
    await userEvent.click(
      q('[data-ok-digital-clock-section="minutes"] [data-ok-value="15"]', paper),
    );
    await userEvent.click(
      q('[data-ok-digital-clock-section="meridiem"] [data-ok-value="0"]', paper),
    );
    expect(screen.getByRole("tab", { name: "End" }).getAttribute("aria-selected")).toBe("true");
    await userEvent.click(screen.getByRole("tab", { name: "Start" }));
    expect(screen.getByRole("tab", { name: "Start" }).getAttribute("aria-selected")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("5/25 10:15-5/25 17:30");
  });

  it("mobile: the analog clock and the toolbar; one column on coarse steps", async () => {
    const onChange = vi.fn();
    render(
      <>
        <MobileTimeRangePicker
          label="Hours"
          ampm={false}
          views={["hours"]}
          defaultValue={[at(9), at(17)]}
          onChange={onChange}
        />
        <TimeRangePicker label="Coarse" timeSteps={{ minutes: 60 }} defaultValue={[null, null]} />
      </>,
    );
    expect(document.querySelectorAll("[data-ok-digital-clock]")).toHaveLength(1);
    await userEvent.click(
      screen.getAllByRole("button", { name: /Choose range/ })[0] as HTMLElement,
    );
    const dialog = screen.getByRole("dialog", { name: "Select time range" });
    expect(
      q('[data-ok-picker-toolbar-button][data-ok-range-position="start"]', dialog).textContent,
    ).toBe("09");
    screen.getByRole("listbox").focus();
    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/25 10:00-5/25 17:00");
    expect(
      q('[data-ok-picker-toolbar-button][data-ok-range-position="end"]', dialog).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    screen.getByRole("listbox").focus();
    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/25 10:00-5/25 18:00");
  });
});

describe("DateTimeRangePicker", () => {
  it("desktop: one calendar beside the clocks; a day keeps the end's time", async () => {
    const onChange = vi.fn();
    render(
      <DesktopDateTimeRangePicker
        label="Event"
        today={TODAY}
        defaultValue={[at(10), at(16, 0, 27)]}
        onChange={onChange}
      />,
    );
    await userEvent.click(openButton());
    const paper = screen.getByRole("dialog", { name: "Select date time range" });
    expect(paper.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(1);
    await userEvent.click(screen.getByRole("tab", { name: "End" }));
    await userEvent.click(day("2025-05-29", paper));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/25 10:00-5/29 16:00");
    expect(screen.getByRole("tab", { name: "End" }).getAttribute("aria-selected")).toBe("true");
  });

  it("mobile: the day, then the clock of the same end; Next / OK", async () => {
    const onChange = vi.fn();
    render(
      <MobileDateTimeRangePicker
        label="Event"
        today={TODAY}
        actions={["cancel", "nextOrAccept"]}
        defaultValue={[at(10), at(16, 0, 27)]}
        onChange={onChange}
      />,
    );
    await userEvent.click(openButton());
    await userEvent.click(day("2025-05-22"));
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/22 10:00-5/27 16:00");
    expect(q("[data-ok-time-clock]").hasAttribute("hidden")).toBe(false);
    expect(q("[data-ok-date-range-calendar]").hasAttribute("hidden")).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("tab", { name: "End" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: "OK" })).toBeTruthy();
  });

  it("responsive: renders both forms' views", () => {
    render(<DateTimeRangePicker label="Event" defaultValue={[null, null]} />);
    expect(q("[data-ok-time-clock]").hasAttribute("hidden")).toBe(true);
    expect(q("[data-ok-multi-section-digital-clock]").hasAttribute("hidden")).toBe(false);
  });
});

describe("range picker edge cases", () => {
  it("static without closeOnSelect keeps picks unaccepted; calendars default to one", async () => {
    const onAccept = vi.fn();
    render(<StaticDateRangePicker today={TODAY} defaultValue={RANGE} onAccept={onAccept} />);
    expect(document.querySelectorAll("[data-ok-date-range-calendar-month]")).toHaveLength(1);
    await userEvent.click(day("2025-05-02"));
    await userEvent.click(day("2025-05-06"));
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("Next / OK: OK on the end accepts and closes", async () => {
    const onAccept = vi.fn();
    render(
      <MobileDateRangePicker
        label="Stay"
        today={TODAY}
        defaultValue={RANGE}
        actions={["nextOrAccept"]}
        onAccept={onAccept}
      />,
    );
    await userEvent.click(openButton());
    await userEvent.click(day("2025-05-21"));
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(iso(onAccept.mock.lastCall?.[0])).toBe("5/21-5/25");
    expect(q("[data-ok-date-range-picker]").hasAttribute("data-ok-open")).toBe(false);
  });

  it("multi input with empty ends; a localized picker; presses outside and on the field", async () => {
    const onOpenChange = vi.fn();
    render(
      <LocalizationProvider adapterLocale="vi-VN">
        <TimeRangePicker multiInput defaultValue={[at(9), null]} />
        <DesktopDateRangePicker
          label="Stay"
          today={TODAY}
          defaultValue={RANGE}
          keepOpenDuringFieldFocus
          onOpenChange={onOpenChange}
        />
        <DesktopDateRangePicker
          label="Other"
          today={TODAY}
          defaultValue={RANGE}
          onOpenChange={onOpenChange}
        />
      </LocalizationProvider>,
    );
    expect(q("[data-ok-date-range-picker]").getAttribute("data-ok-locale")).toBe("vi-VN");
    expect(
      q('[data-ok-date-picker-open][data-ok-range-position="end"]').getAttribute("aria-label"),
    ).toBe("Chọn giờ");
    const [, keep, other] = [
      ...document.querySelectorAll<HTMLElement>("[data-ok-date-range-picker]"),
    ];
    await userEvent.click(q("[data-ok-date-picker-open]", keep));
    await userEvent.click(q<HTMLElement>('[role="spinbutton"]', keep));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(keep?.hasAttribute("data-ok-open")).toBe(true);
    await userEvent.keyboard("{Escape}");
    await userEvent.click(q("[data-ok-date-picker-open]", other));
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "clickaway");
  });

  it("mobile: a press on the backdrop restores the value", async () => {
    const onChange = vi.fn();
    render(
      <MobileDateRangePicker label="Stay" today={TODAY} defaultValue={RANGE} onChange={onChange} />,
    );
    await userEvent.click(openButton());
    await userEvent.click(day("2025-05-02"));
    const dialog = q("dialog[data-ok-date-picker-dialog]");
    await userEvent.click(dialog, { position: { x: 2, y: 2 } });
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/20-5/25");
  });
});
