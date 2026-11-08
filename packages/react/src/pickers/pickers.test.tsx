import { pickersFrFR } from "@owlky/core";
import { createDayjsAdapter } from "@owlky/core/adapters/dayjs";
import { act, render, screen } from "@testing-library/react";
import dayjs, { type Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { PickerDay, type PickerDayProps } from "../date-calendar/date-calendar.js";
import {
  PickerLayoutContent,
  type PickerLayoutProps,
  PickerLayoutRoot,
  PickerShortcuts,
  type PickerToolbarProps,
  usePickerContext,
} from "../date-picker/picker-layout.js";
import {
  renderDateViewCalendar,
  renderDigitalClockTimeView,
  renderMultiSectionDigitalClockTimeView,
  renderTimeViewClock,
} from "../date-picker/view-renderers.js";
import { LocalizationProvider } from "../localization-provider/localization-provider.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { usePickerDateConverter } from "../utils/picker-adapter.js";
import {
  DateCalendar,
  DateField,
  type DateRange,
  DateRangeCalendar,
  DateTimeField,
  DesktopDatePicker,
  DesktopTimePicker,
  MobileDatePicker,
  MobileDateRangePicker,
  MonthCalendar,
  StaticDatePicker,
  StaticDateRangePicker,
  StaticDateTimePicker,
  StaticTimePicker,
  TimeField,
  YearCalendar,
} from "./pickers.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const sections = () => [...document.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
const texts = () => sections().map((s) => s.textContent);
const TODAY = new Date(2025, 4, 20);
const NY = "America/New_York";
/** The first argument of a mock's last call. */
const last = (fn: { mock: { calls: unknown[][] } }) => (fn.mock.calls.at(-1) ?? [])[0];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("time zones (ADR-0030)", () => {
  it("shows and edits the wall time of the zone, reporting instants", async () => {
    const onChange = vi.fn();
    const instant = new Date(Date.UTC(2025, 4, 25, 13, 30));
    render(
      <DateTimeField
        label="Meeting"
        timezone={NY}
        defaultValue={instant}
        onChange={onChange}
        format="YYYY-MM-DD HH:mm"
      />,
    );
    expect(texts()).toEqual(["2025", "05", "25", "09", "30"]);
    (sections()[3] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowUp}");
    const value = onChange.mock.calls.at(-1)?.[0] as Date;
    expect(value.toISOString()).toBe("2025-05-25T14:30:00.000Z");
  });

  it("converts limits and callbacks, and pins today to the zone", async () => {
    const shouldDisableDate = vi.fn((day: Date) => day.getUTCDate() === 26);
    render(
      <DateCalendar
        timezone="UTC"
        defaultValue={new Date(Date.UTC(2025, 4, 25, 23, 0))}
        shouldDisableDate={shouldDisableDate as never}
      />,
    );
    const selected = document.querySelector('[aria-selected="true"]') as HTMLElement;
    expect(selected.getAttribute("data-ok-date")).toBe("2025-05-25");
    expect(shouldDisableDate).toHaveBeenCalled();
    expect(document.querySelector<HTMLButtonElement>('[data-ok-date="2025-05-26"]')?.disabled).toBe(
      true,
    );
  });

  it("keeps plain props untouched without an adapter or a zone", () => {
    const value = new Date(2025, 4, 25);
    render(<DateField label="Date" value={value} onChange={() => {}} timezone="system" />);
    expect(texts()).toEqual(["05", "25", "2025"]);
  });
});

describe("date adapters (ADR-0030)", () => {
  const adapter = createDayjsAdapter(dayjs);

  it("takes and returns the library's dates, also in callbacks and shortcuts", async () => {
    const onChange = vi.fn();
    const onAccept = vi.fn();
    const shouldDisableDate = vi.fn((day: Dayjs) => day.date() === 13);
    const isValid = vi.fn();
    render(
      <LocalizationProvider dateAdapter={adapter}>
        <StaticDatePicker
          defaultValue={dayjs("2025-05-25")}
          onChange={onChange}
          onAccept={onAccept}
          shouldDisableDate={shouldDisableDate as never}
          today={dayjs("2025-05-20") as never}
          shortcuts={[
            {
              label: "Christmas",
              getValue: ({ isValid: check }) => {
                isValid(check(dayjs("2025-12-25") as never));
                return dayjs("2025-12-25") as never;
              },
            },
          ]}
        />
      </LocalizationProvider>,
    );
    expect(document.querySelector('[aria-selected="true"]')?.getAttribute("data-ok-date")).toBe(
      "2025-05-25",
    );
    expect(document.querySelector<HTMLButtonElement>('[data-ok-date="2025-05-13"]')?.disabled).toBe(
      true,
    );
    expect(dayjs.isDayjs(shouldDisableDate.mock.calls[0]?.[0])).toBe(true);
    expect(isValid).toHaveBeenCalledWith(true);
    await userEvent.click(document.querySelector('[data-ok-date="2025-05-21"]') as HTMLElement);
    const changed = onChange.mock.calls.at(-1)?.[0] as Dayjs;
    expect(dayjs.isDayjs(changed)).toBe(true);
    expect(changed.format("YYYY-MM-DD")).toBe("2025-05-21");
    await userEvent.click(screen.getByRole("button", { name: "Christmas" }));
    expect((last(onAccept) as Dayjs).format("YYYY-MM-DD")).toBe("2025-12-25");
  });

  it('reads the zone of the value with `timezone="default"`', () => {
    render(
      <LocalizationProvider dateAdapter={adapter}>
        <TimeField label="Time" defaultValue={dayjs.tz("2025-05-25 09:30", NY) as never} />
      </LocalizationProvider>,
    );
    expect(texts().slice(0, 2)).toEqual(["09", "30"]);
  });

  it("converts ranges both ways", async () => {
    const onChange = vi.fn();
    render(
      <LocalizationProvider dateAdapter={adapter}>
        <DateRangeCalendar
          calendars={1}
          today={dayjs("2025-05-20") as never}
          referenceDate={dayjs("2025-05-20") as never}
          onChange={onChange}
        />
      </LocalizationProvider>,
    );
    await userEvent.click(document.querySelector('[data-ok-date="2025-05-20"]') as HTMLElement);
    await userEvent.click(document.querySelector('[data-ok-date="2025-05-22"]') as HTMLElement);
    const [start, end] = last(onChange) as [Dayjs, Dayjs];
    expect(start.format("YYYY-MM-DD")).toBe("2025-05-20");
    expect(end.format("YYYY-MM-DD")).toBe("2025-05-22");
  });
});

describe("calendar systems (ADR-0030)", () => {
  it("shows Persian months, days and years", async () => {
    render(
      <LocalizationProvider adapterLocale="en-US" calendar="persian">
        <DateCalendar
          views={["year", "month", "day"]}
          defaultValue={new Date(2025, 4, 25)}
          today={TODAY}
        />
        <MonthCalendar defaultValue={new Date(2025, 4, 25)} />
        <YearCalendar defaultValue={new Date(2025, 4, 25)} />
        <DateField label="Date" defaultValue={new Date(2025, 4, 25)} />
      </LocalizationProvider>,
    );
    const root = document.querySelector("[data-ok-date-calendar]") as HTMLElement;
    expect(root.getAttribute("data-ok-month")).toBe("2025-05-22");
    expect(root.getAttribute("data-ok-locale")).toBe("en-US-u-ca-persian");
    expect(root.querySelector("[data-ok-date-calendar-label]")?.textContent).toMatch(
      /Khordad 1404/,
    );
    expect(document.querySelector('[data-ok-date="2025-05-25"]')?.textContent).toBe("4");
    expect(texts()).toEqual(["03", "04", "1404"]);
    const months = document.querySelectorAll("[data-ok-month-calendar]")[0] as HTMLElement;
    expect(months.querySelector('[aria-checked="true"]')?.textContent).toBe("Khordad");
    const years = document.querySelector("[data-ok-year-calendar]") as HTMLElement;
    expect(years.querySelector('[aria-checked="true"]')?.textContent).toBe("1404");
    // Next month: Tir 1404 starts on 22 June 2025.
    await userEvent.click(root.querySelector("[data-ok-date-calendar-next]") as HTMLElement);
    expect(root.getAttribute("data-ok-month")).toBe("2025-06-22");
    await userEvent.click(root.querySelector("[data-ok-date-calendar-switch]") as HTMLElement);
    await userEvent.click(
      root.querySelector('[data-ok-picker-year][data-ok-value="1403"]') as HTMLElement,
    );
    await userEvent.click(
      root.querySelector('[data-ok-picker-month][data-ok-value="0"]') as HTMLElement,
    );
    expect(root.getAttribute("data-ok-month")).toBe("2024-03-20");
  });

  it("takes the calendar from the adapter or the locale", () => {
    render(
      <LocalizationProvider
        dateAdapter={createDayjsAdapter(dayjs, { calendar: "islamic-umalqura" })}
      >
        <DateCalendar defaultValue={dayjs("2025-05-25") as never} />
        <LocalizationProvider adapterLocale="fa-IR-u-ca-persian">
          <DateCalendar defaultValue={dayjs("2025-05-25") as never} />
        </LocalizationProvider>
      </LocalizationProvider>,
    );
    const [hijri, persian] = [...document.querySelectorAll("[data-ok-date-calendar]")];
    expect(hijri?.getAttribute("data-ok-locale")).toBe("en-US-u-ca-islamic-umalqura");
    expect(persian?.getAttribute("data-ok-locale")).toBe("fa-IR-u-ca-persian");
  });
});

describe("locale packs (ADR-0030)", () => {
  it("translates the pickers", () => {
    render(
      <LocalizationProvider adapterLocale="fr-FR" localeText={pickersFrFR}>
        <StaticDatePicker defaultValue={new Date(2025, 4, 25)} />
      </LocalizationProvider>,
    );
    expect(screen.getByRole("button", { name: "Annuler" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mois suivant" })).toBeTruthy();
  });
});

function BadgeDay(props: PickerDayProps) {
  const marked = (props.day as Date).getDate() % 5 === 0;
  return (
    <PickerDay {...props} data-marked={marked || undefined}>
      {props.children}
      {marked && <span data-badge="">•</span>}
    </PickerDay>
  );
}

function ContextToolbar({ text, hidden }: PickerToolbarProps) {
  const picker = usePickerContext();
  return (
    <div data-ok-picker-toolbar="" data-custom="" hidden={hidden || undefined}>
      <span>{text}</span>
      <button type="button" onClick={() => picker.setValueToToday()}>
        Jump to today
      </button>
      <span data-view="">{picker.view}</span>
    </div>
  );
}

function ActionsFirst(props: PickerLayoutProps) {
  return (
    <PickerLayoutRoot rootRef={props.rootRef} orientation={props.orientation} data-custom-layout="">
      {props.actionBar}
      {props.toolbar}
      <PickerLayoutContent>{props.content}</PickerLayoutContent>
    </PickerLayoutRoot>
  );
}

function RangeToolbar() {
  const picker = usePickerContext<DateRange>();
  return (
    <div data-ok-picker-toolbar="">
      <button type="button" onClick={() => picker.setRangePosition?.("end")}>
        {picker.rangePosition}
      </button>
      <span data-start="">{(picker.value[0] as Date | null)?.getDate()}</span>
    </div>
  );
}

describe("slots and view renderers (ADR-0030)", () => {
  it("renders custom days, with slot props by owner state", () => {
    render(
      <DateCalendar
        defaultValue={new Date(2025, 4, 25)}
        today={TODAY}
        slots={{ day: BadgeDay, leftArrowIcon: () => <i>L</i>, rightArrowIcon: () => <i>R</i> }}
        slotProps={{ day: (owner) => (owner.today ? { title: "today" } : {}) }}
      />,
    );
    expect(document.querySelectorAll("[data-badge]").length).toBe(6);
    const marked = document.querySelector('[data-ok-date="2025-05-25"]') as HTMLElement;
    expect(marked.hasAttribute("data-marked")).toBe(true);
    expect(marked.getAttribute("aria-selected")).toBe("true");
    expect(document.querySelector('[data-ok-date="2025-05-20"]')?.getAttribute("title")).toBe(
      "today",
    );
    expect(document.querySelector("[data-ok-date-calendar-prev]")?.textContent).toBe("L");
    expect(document.querySelector("[data-ok-date-calendar-next]")?.textContent).toBe("R");
  });

  it("replaces the layout, the toolbar and the action bar", async () => {
    const onChange = vi.fn();
    render(
      <StaticDatePicker
        defaultValue={new Date(2025, 4, 25)}
        today={TODAY}
        onChange={onChange}
        actions={["clear", "accept"]}
        slots={{
          layout: ActionsFirst,
          toolbar: ContextToolbar,
          actionBar: ({ onAction }) => (
            <div data-ok-picker-actions="">
              <button type="button" onClick={() => onAction("clear")}>
                Reset
              </button>
            </div>
          ),
        }}
      />,
    );
    const layout = document.querySelector("[data-custom-layout]") as HTMLElement;
    expect(layout.firstElementChild?.hasAttribute("data-ok-picker-actions")).toBe(true);
    expect(layout.querySelector("[data-custom] span")?.textContent).toBe("Sun, May 25");
    await userEvent.click(screen.getByRole("button", { name: "Jump to today" }));
    expect((last(onChange) as Date).getDate()).toBe(20);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onChange.mock.calls.at(-1)?.[0]).toBeNull();
    await expectNoAxeViolations(layout);
  });

  it("hides the toolbar and the tabs, and replaces the shortcuts and the open icon", async () => {
    const onAccept = vi.fn();
    render(
      <>
        <StaticDateTimePicker
          defaultValue={new Date(2025, 4, 25, 9, 30)}
          slotProps={{ toolbar: { hidden: true }, tabs: { hidden: true } }}
        />
        <DesktopDatePicker
          label="Date"
          onAccept={onAccept}
          slots={{
            openPickerIcon: () => <svg aria-hidden="true" data-icon="" />,
            shortcuts: ({ items, onShortcut }) => (
              <div data-ok-picker-shortcuts="">
                {items.map((item, i) => (
                  <button key={item.label} type="button" onClick={() => onShortcut(i)}>
                    {item.label}
                  </button>
                ))}
              </div>
            ),
          }}
          shortcuts={[{ label: "New year", getValue: () => new Date(2026, 0, 1) }]}
        />
      </>,
    );
    expect(document.querySelector("[data-ok-picker-toolbar]")).toBeNull();
    expect(document.querySelector("[data-ok-picker-tabs]")).toBeNull();
    expect(document.querySelector("[data-icon]")).not.toBeNull();
    await userEvent.click(document.querySelector("[data-ok-date-picker-open]") as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: "New year" }));
    expect((last(onAccept) as Date).getFullYear()).toBe(2026);
  });

  it("renders a view with another renderer, or leaves views out", async () => {
    render(
      <>
        <DesktopTimePicker
          label="Analog"
          defaultValue={new Date(2025, 4, 25, 9, 30)}
          viewRenderers={{ hours: renderTimeViewClock, minutes: renderTimeViewClock }}
        />
        <DesktopDatePicker label="Field only" viewRenderers={{ year: null, day: null }} />
        <StaticDatePicker
          defaultValue={new Date(2025, 4, 25)}
          viewRenderers={{ day: ({ value }) => <p data-own-view="">{value?.getDate()}</p> }}
        />
        <StaticDateTimePicker
          defaultValue={new Date(2025, 4, 25, 9, 30)}
          viewRenderers={{ hours: null, minutes: null }}
        />
      </>,
    );
    expect(document.querySelectorAll("[data-ok-date-picker-open]")).toHaveLength(1);
    expect(document.querySelector("[data-own-view]")?.textContent).toBe("25");
    await userEvent.click(document.querySelector("[data-ok-date-picker-open]") as HTMLElement);
    const popover = await screen.findByRole("dialog", { name: "Select time" });
    expect(popover.querySelector("[data-ok-time-clock]")).not.toBeNull();
    expect(
      popover.querySelector("[data-ok-digital-clock], [data-ok-multi-section-digital-clock]"),
    ).toBeNull();
    const statics = document.querySelectorAll("[data-ok-picker-variant=static]");
    expect(statics[1]?.querySelector("[data-ok-time-clock]")).toBeNull();
  });

  it("gives range pickers the same slots and context", async () => {
    render(
      <>
        <StaticDateRangePicker
          defaultValue={[new Date(2025, 4, 20), new Date(2025, 4, 25)]}
          slots={{ toolbar: RangeToolbar, day: BadgeDay }}
        />
        <StaticDateRangePicker
          viewRenderers={{ day: null }}
          slotProps={{ toolbar: { hidden: true } }}
        />
      </>,
    );
    expect(document.querySelector("[data-start]")?.textContent).toBe("20");
    await userEvent.click(screen.getByRole("button", { name: "start" }));
    expect(screen.getByRole("button", { name: "end" })).toBeTruthy();
    expect(document.querySelectorAll("[data-badge]").length).toBeGreaterThan(0);
  });

  it("throws when the context is read outside a picker", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Outside />)).toThrow(/usePickerContext/);
  });
});

function Outside() {
  usePickerContext();
  return null;
}

function Controlled() {
  const [value, setValue] = useState<Date | null>(new Date(Date.UTC(2025, 4, 25, 12)));
  return (
    <>
      <DateCalendar timezone="UTC" value={value} onChange={setValue as never} />
      <span data-iso="">{value?.toISOString()}</span>
    </>
  );
}

describe("rendering", () => {
  it("renders on the server with adapters and zones", () => {
    const html = renderToString(
      <LocalizationProvider dateAdapter={createDayjsAdapter(dayjs)}>
        <DateField
          label="Date"
          timezone="UTC"
          defaultValue={dayjs("2025-05-25T12:00:00Z") as never}
        />
      </LocalizationProvider>,
    );
    expect(html).toContain("2025-05-25");
  });

  it("keeps converted values stable across renders (no effect loops)", async () => {
    render(<Controlled />);
    await userEvent.click(document.querySelector('[data-ok-date="2025-05-27"]') as HTMLElement);
    await act(async () => {});
    expect(document.querySelector("[data-iso]")?.textContent).toBe("2025-05-27T12:00:00.000Z");
  });
});

/** A custom action bar that calls every context method (MobileDatePicker / range pickers). */
function ContextActions() {
  const picker = usePickerContext<unknown>();
  const call = (name: string, fn: () => void) => (
    <button key={name} type="button" onClick={fn}>
      {name}
    </button>
  );
  return (
    <div data-ok-picker-actions="">
      {call("set", () => picker.setValue(picker.value, { accept: true }))}
      {call("set-only", () => picker.setValue(picker.value))}
      {call("view", () => picker.setView(picker.views[0] as never))}
      {call("today", () => picker.setValueToToday())}
      {call("clear", () => picker.clearValue())}
      {call("next", () => picker.goToNextStep())}
      {call("reopen", () => picker.setOpen(true))}
      {call("accept", () => picker.acceptValueChanges())}
    </div>
  );
}
function CancelAction() {
  const picker = usePickerContext();
  return (
    <div data-ok-picker-actions="">
      <button type="button" onClick={() => picker.cancelValueChanges()}>
        cancel
      </button>
      <button type="button" onClick={() => picker.setOpen(false)}>
        close
      </button>
    </div>
  );
}
function ConverterProbe() {
  const converter = usePickerDateConverter();
  return <span data-probe="">{String(converter.toEngine("x"))}</span>;
}
const RangeIcon = () => <svg aria-hidden="true" data-range-icon="" />;

describe("picker context (ADR-0030)", () => {
  it("runs every action of a date picker", async () => {
    const onAccept = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <>
        <MobileDatePicker
          label="Mobile"
          defaultValue={new Date(2025, 4, 25)}
          today={TODAY}
          onAccept={onAccept}
          onOpenChange={onOpenChange}
          slots={{ actionBar: ContextActions }}
        />
        <MobileDatePicker
          label="Cancel"
          defaultValue={new Date(2025, 4, 25)}
          onOpenChange={onOpenChange}
          slots={{ actionBar: CancelAction }}
        />
        <ConverterProbe />
      </>,
    );
    expect(document.querySelector("[data-probe]")?.textContent).toBe("x");
    const [first, second] = [
      ...document.querySelectorAll<HTMLElement>("[data-ok-date-picker-open]"),
    ];
    await userEvent.click(first as HTMLElement);
    for (const name of ["set-only", "set", "view", "today"])
      await userEvent.click(await screen.findByRole("button", { name }));
    expect((last(onAccept) as Date).getDate()).toBe(20);
    await userEvent.click(first as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: "reopen" }));
    await userEvent.click(screen.getByRole("button", { name: "next" }));
    await userEvent.click(first as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: "clear" }));
    expect(last(onAccept)).toBeNull();
    await userEvent.click(first as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: "accept" }));
    await userEvent.click(second as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: "cancel" }));
    await userEvent.click(second as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: "close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, "api");
  });

  it("runs every action of a range picker", async () => {
    const onAccept = vi.fn();
    render(
      <>
        <MobileDateRangePicker
          defaultValue={[new Date(2025, 4, 20), new Date(2025, 4, 25)]}
          today={TODAY}
          onAccept={onAccept}
          slots={{ actionBar: ContextActions, openPickerIcon: RangeIcon }}
        />
        <MobileDateRangePicker defaultValue={[null, null]} slots={{ actionBar: CancelAction }} />
      </>,
    );
    expect(document.querySelector("[data-range-icon]")).not.toBeNull();
    const [first, second] = [
      ...document.querySelectorAll<HTMLElement>("[data-ok-date-picker-open]"),
    ];
    await userEvent.click(first as HTMLElement);
    for (const name of ["set-only", "set", "view", "next", "reopen", "today"])
      await userEvent.click(await screen.findByRole("button", { name }));
    expect((last(onAccept) as Date[])[0]?.getDate()).toBe(20);
    await userEvent.click(first as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: "clear" }));
    await userEvent.click(first as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: "accept" }));
    await userEvent.click(second as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: "cancel" }));
    await userEvent.click(second as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: "close" }));
  });

  it("re-renders with cached conversions and resets them for another zone", () => {
    const value = new Date(Date.UTC(2025, 4, 25, 12));
    const { rerender } = render(
      <DateField label="Date" timezone="UTC" value={value} onChange={() => {}} />,
    );
    rerender(<DateField label="Date" timezone="UTC" value={value} onChange={() => {}} />);
    rerender(
      <DateField label="Date" timezone="Pacific/Kiritimati" value={value} onChange={() => {}} />,
    );
    expect(texts()).toEqual(["05", "26", "2025"]);
  });
});

describe("built-in view renderers (ADR-0030)", () => {
  it("render the calendar and every clock, hidden in the other tab", async () => {
    render(
      <>
        <StaticDateTimePicker
          defaultValue={new Date(2025, 4, 25, 9, 30)}
          viewRenderers={{
            day: renderDateViewCalendar,
            hours: renderTimeViewClock,
            minutes: renderTimeViewClock,
          }}
        />
        <StaticTimePicker
          defaultValue={new Date(2025, 4, 25, 9, 30)}
          viewRenderers={{ hours: renderDigitalClockTimeView, minutes: renderDigitalClockTimeView }}
        />
        <StaticTimePicker
          defaultValue={new Date(2025, 4, 25, 9, 30)}
          viewRenderers={{
            hours: renderMultiSectionDigitalClockTimeView,
            minutes: renderMultiSectionDigitalClockTimeView,
          }}
        />
        <PickerShortcuts items={[]} onShortcut={() => {}} label="None" />
      </>,
    );
    const dateTime = document.querySelector("[data-ok-picker-variant=static]") as HTMLElement;
    expect((dateTime.querySelector("[data-ok-time-clock]") as HTMLElement).hidden).toBe(true);
    await userEvent.click(screen.getByRole("tab", { name: "pick time" }));
    expect((dateTime.querySelector("[data-ok-date-calendar]") as HTMLElement).hidden).toBe(true);
    expect(document.querySelector("[data-ok-digital-clock]")).not.toBeNull();
    expect(document.querySelector("[data-ok-multi-section-digital-clock]")).not.toBeNull();
    expect(document.querySelectorAll("[data-ok-picker-shortcuts]")).toHaveLength(0);
  });

  it("converts `null` values and keeps a given today in a zone", () => {
    render(
      <DateCalendar
        timezone="UTC"
        value={null}
        today={new Date(2025, 4, 20)}
        onChange={() => {}}
      />,
    );
    expect(document.querySelector("[aria-current=date]")?.getAttribute("data-ok-date")).toBe(
      "2025-05-20",
    );
    expect(
      document.querySelector("[data-ok-date-calendar]")?.getAttribute("data-ok-timezone"),
    ).toBe("UTC");
  });
});
