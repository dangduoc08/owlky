import { act, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { DateTimeField } from "../date-time-field/date-time-field.js";
import {
  DateTimePicker,
  DesktopDateTimePicker,
  MobileDateTimePicker,
  StaticDateTimePicker,
} from "../date-time-picker/date-time-picker.js";
import { DigitalClock } from "../digital-clock/digital-clock.js";
import { LocalizationProvider } from "../localization-provider/localization-provider.js";
import { MultiSectionDigitalClock } from "../multi-section-digital-clock/multi-section-digital-clock.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { TimeClock } from "../time-clock/time-clock.js";
import { TimeField } from "../time-field/time-field.js";
import {
  DesktopTimePicker,
  MobileTimePicker,
  StaticTimePicker,
  TimePicker,
} from "./time-picker.js";

/** 25 May 2025 at `h:m:s`. */
const at = (h: number, m = 0, s = 0) => new Date(2025, 4, 25, h, m, s);
const hm = (value: Date | null | undefined) =>
  value && !Number.isNaN(value.getTime())
    ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
    : String(value);
const texts = (root: ParentNode = document) =>
  [...root.querySelectorAll<HTMLElement>('[role="spinbutton"]')].map((s) => s.textContent);
const q = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<E>(selector) as E;
const option = (list: string, value: string | number) =>
  q(`[data-ok-digital-clock-section="${list}"] [data-ok-value="${value}"]`);

/** Presses and releases the clock face at an offset from its center. */
function pressFace(dx: number, dy: number, release = true) {
  const dial = q("[data-ok-time-clock-dial]");
  const rect = dial.getBoundingClientRect();
  const init = {
    bubbles: true,
    cancelable: true,
    pointerId: 3,
    button: 0,
    clientX: rect.left + rect.width / 2 + dx,
    clientY: rect.top + rect.height / 2 + dy,
  };
  act(() => {
    dial.dispatchEvent(new PointerEvent("pointerdown", init));
  });
  if (release)
    act(() => {
      dial.dispatchEvent(new PointerEvent("pointerup", init));
    });
}

afterEach(() => {
  vi.restoreAllMocks();
});

/** A clock whose view the owner controls. */
function ControlledClock() {
  const [view, setView] = useState<"hours" | "minutes" | "seconds">("seconds");
  return (
    <>
      <TimeClock views={["hours", "minutes", "seconds"]} view={view} onViewChange={setView} />
      <button type="button" onClick={() => setView("hours")}>
        hours
      </button>
    </>
  );
}

describe("TimeField", () => {
  it("renders time sections, a value type and an ISO time", () => {
    render(<TimeField id="t" label="Time" name="t" defaultValue={at(9, 30)} />);
    const root = q("[data-ok-date-field]");
    expect(root.getAttribute("data-ok-value-type")).toBe("time");
    expect(root.getAttribute("data-ok-format")).toBe("hh:mm A");
    expect(root.getAttribute("data-ok-value")).toBe("09:30:00");
    expect(texts()).toEqual(["09", "30", "AM"]);
    expect(
      screen.getByRole("spinbutton", { name: "Meridiem" }).getAttribute("aria-valuetext"),
    ).toBe("AM");
    expect(q<HTMLInputElement>('input[name="t"]').value).toBe("09:30:00");
  });

  it("follows ampm, views and the locale's clock", () => {
    const { unmount } = render(<TimeField ampm={false} defaultValue={at(21, 5, 7)} />);
    expect(texts()).toEqual(["21", "05"]);
    unmount();
    render(<TimeField views={["hours", "minutes", "seconds"]} defaultValue={at(21, 5, 7)} />);
    expect(texts()).toEqual(["09", "05", "07", "PM"]);
  });

  it("uses 24 hours in Vietnamese", () => {
    render(
      <LocalizationProvider adapterLocale="vi-VN">
        <TimeField defaultValue={at(21, 5)} />
      </LocalizationProvider>,
    );
    expect(texts()).toEqual(["21", "05"]);
  });

  it("types a time and reports time validation errors", async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    render(
      <TimeField
        label="Time"
        minTime={at(9)}
        maxTime={at(17)}
        onChange={onChange}
        onError={onError}
        defaultValue={at(9, 30)}
      />,
    );
    await userEvent.click(screen.getByRole("spinbutton", { name: "Hours" }));
    await userEvent.keyboard("08");
    expect(hm(onChange.mock.lastCall?.[0])).toBe("08:30");
    expect(onChange.mock.lastCall?.[1]).toEqual({ validationError: "minTime" });
    expect(onError).toHaveBeenLastCalledWith("minTime", expect.any(Date));
    expect(screen.getByRole("group", { name: "Time" }).getAttribute("aria-invalid")).toBe("true");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}p");
    expect(hm(onChange.mock.lastCall?.[0])).toBe("20:30");
    expect(onChange.mock.lastCall?.[1]).toEqual({ validationError: "maxTime" });
  });

  it("writes the declarative time rules as attributes", () => {
    render(
      <TimeField
        minTime={at(9)}
        maxTime={at(17, 30)}
        minutesStep={15}
        disableIgnoringDatePartForTimeValidation
        disablePast
        defaultValue={at(9, 30)}
        today={at(8)}
      />,
    );
    const root = q("[data-ok-date-field]");
    expect(root.getAttribute("data-ok-min-time")).toBe("09:00:00");
    expect(root.getAttribute("data-ok-max-time")).toBe("17:30:00");
    expect(root.getAttribute("data-ok-minutes-step")).toBe("15");
    expect(root.hasAttribute("data-ok-disable-ignoring-date-part-for-time-validation")).toBe(true);
    expect(root.hasAttribute("data-ok-disable-past")).toBe(true);
    expect(root.hasAttribute("data-ok-error")).toBe(false);
  });
});

describe("DateTimeField", () => {
  it("renders date and time sections and an ISO date time", () => {
    render(<DateTimeField label="When" defaultValue={at(9, 30)} />);
    const root = q("[data-ok-date-field]");
    expect(root.getAttribute("data-ok-value-type")).toBe("date-time");
    expect(root.getAttribute("data-ok-format")).toBe("MM/DD/YYYY hh:mm A");
    expect(root.getAttribute("data-ok-value")).toBe("2025-05-25T09:30:00");
    expect(texts()).toEqual(["05", "25", "2025", "09", "30", "AM"]);
  });

  it("validates whole date time limits", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeField
        label="When"
        minDateTime={at(10)}
        maxDateTime={new Date(2025, 4, 26, 12)}
        onChange={onChange}
        defaultValue={at(11)}
      />,
    );
    const root = q("[data-ok-date-field]");
    expect(root.getAttribute("data-ok-min-date-time")).toBe("2025-05-25T10:00:00");
    expect(root.getAttribute("data-ok-max-date-time")).toBe("2025-05-26T12:00:00");
    await userEvent.click(screen.getByRole("spinbutton", { name: "Hours" }));
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(onChange.mock.lastCall?.[1]).toEqual({ validationError: "minTime" });
    await userEvent.click(screen.getByRole("spinbutton", { name: "Day" }));
    await userEvent.keyboard("{ArrowDown}");
    expect(onChange.mock.lastCall?.[1]).toEqual({ validationError: "minDate" });
  });
});

describe("TimeClock", () => {
  it("renders a listbox of hours with the pointer on the value", async () => {
    render(<TimeClock id="c" defaultValue={at(9, 30)} />);
    const listbox = screen.getByRole("listbox", {
      name: "Select hours. Selected time is 09:30 AM",
    });
    expect(listbox.getAttribute("aria-activedescendant")).toBe("c-hours-9");
    expect(screen.getAllByRole("option")).toHaveLength(12);
    expect(screen.getByRole("option", { name: "9 hours" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    const pointer = q("[data-ok-time-clock-pointer]");
    expect(pointer.hidden).toBe(false);
    expect(pointer.style.getPropertyValue("--_ok-clock-angle")).toBe("270deg");
    expect(q("[data-ok-time-clock]").getAttribute("data-ok-ampm")).toBe("true");
    await expectNoAxeViolations(document.body);
  });

  it("steps with the keyboard and moves to the next view with Enter", async () => {
    const onChange = vi.fn();
    const onViewChange = vi.fn();
    render(<TimeClock defaultValue={at(9, 30)} onChange={onChange} onViewChange={onViewChange} />);
    screen.getByRole("listbox").focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(hm(onChange.mock.lastCall?.[0])).toBe("10:30");
    expect(onChange.mock.lastCall?.[1]).toBe("shallow");
    await userEvent.keyboard("{Enter}");
    expect(onChange.mock.lastCall?.[1]).toBe("partial");
    expect(onViewChange).toHaveBeenLastCalledWith("minutes");
    expect(q("[data-ok-time-clock]").getAttribute("data-ok-view")).toBe("minutes");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(hm(onChange.mock.lastCall?.[0])).toBe("10:29");
    expect(onChange.mock.lastCall?.[1]).toBe("finish");
    expect(q("[data-ok-time-clock-pointer]").hasAttribute("data-ok-between")).toBe(true);
  });

  it("picks with a press and a drag on the face", () => {
    const onChange = vi.fn();
    render(<TimeClock defaultValue={at(9, 30)} onChange={onChange} />);
    pressFace(90, 0);
    expect(hm(onChange.mock.lastCall?.[0])).toBe("03:30");
    expect(onChange.mock.lastCall?.[1]).toBe("partial");
    pressFace(0, 90);
    expect(hm(onChange.mock.lastCall?.[0])).toBe("03:30");
    expect(onChange.mock.lastCall?.[1]).toBe("finish");
  });

  it("shows two rings on 24-hour clocks", () => {
    render(<TimeClock ampm={false} defaultValue={at(21)} />);
    expect(screen.getAllByRole("option")).toHaveLength(24);
    expect(screen.getByRole("option", { name: "00 hours" }).hasAttribute("data-ok-inner")).toBe(
      true,
    );
    expect(q("[data-ok-time-clock-pointer]").hasAttribute("data-ok-inner")).toBe(true);
  });

  it("switches views with the arrows and AM / PM with the buttons", async () => {
    const onChange = vi.fn();
    render(<TimeClock ampmInClock defaultValue={at(9, 30)} onChange={onChange} />);
    const prev = screen.getByRole("button", { name: "Open previous view" }) as HTMLButtonElement;
    const next = screen.getByRole("button", { name: "Open next view" }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    await userEvent.click(next);
    expect(q("[data-ok-time-clock]").getAttribute("data-ok-view")).toBe("minutes");
    expect(screen.getAllByRole("option")[6]?.textContent).toBe("30");
    await userEvent.click(prev);
    expect(q("[data-ok-time-clock]").getAttribute("data-ok-view")).toBe("hours");
    const pm = screen.getByRole("button", { name: "PM" });
    expect(pm.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(pm);
    expect(hm(onChange.mock.lastCall?.[0])).toBe("21:30");
    expect(onChange.mock.lastCall?.[1]).toBe("partial");
  });

  it("disables numbers outside the limits and does nothing while read-only or disabled", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TimeClock
        minTime={at(9)}
        maxTime={at(17)}
        defaultValue={at(9, 30)}
        onChange={onChange}
        readOnly
      />,
    );
    expect(screen.getByRole("option", { name: "8 hours" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(screen.getByRole("listbox").getAttribute("aria-readonly")).toBe("true");
    screen.getByRole("listbox").focus();
    await userEvent.keyboard("{ArrowUp}");
    pressFace(90, 0);
    expect(onChange).not.toHaveBeenCalled();
    rerender(<TimeClock defaultValue={at(9, 30)} onChange={onChange} disabled />);
    expect(screen.getByRole("listbox").tabIndex).toBe(-1);
    expect(q("[data-ok-time-clock]").hasAttribute("data-ok-disabled")).toBe(true);
  });

  it("hides the pointer without a value and honors a controlled view", async () => {
    render(<ControlledClock />);
    expect(q("[data-ok-time-clock-pointer]").hidden).toBe(true);
    expect(screen.getByRole("listbox").getAttribute("aria-label")).toBe(
      "Select seconds. No time selected",
    );
    expect(screen.getAllByRole("option")[1]?.getAttribute("aria-label")).toBe("05 seconds");
    await userEvent.click(screen.getByRole("button", { name: "hours" }));
    expect(q("[data-ok-time-clock]").getAttribute("data-ok-view")).toBe("hours");
  });

  it("writes the provider's locale, falls back to the first view and shows AM / PM unpressed", () => {
    render(
      <LocalizationProvider adapterLocale="en-US">
        <TimeClock view={"seconds" as "hours"} ampmInClock />
      </LocalizationProvider>,
    );
    const root = q("[data-ok-time-clock]");
    expect(root.getAttribute("data-ok-locale")).toBe("en-US");
    expect(root.getAttribute("data-ok-view")).toBe("hours");
    expect(screen.getByRole("button", { name: "AM" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("opens on openTo, focuses on autoFocus and passes a ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<TimeClock ref={ref} openTo="minutes" autoFocus defaultValue={at(9, 30)} />);
    expect(ref.current?.getAttribute("data-ok-view")).toBe("minutes");
    expect(document.activeElement).toBe(screen.getByRole("listbox"));
    const fn = vi.fn();
    render(<TimeClock ref={fn} />);
    expect(fn).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });
});

describe("DigitalClock", () => {
  it("lists times every 30 minutes and picks one", async () => {
    const onChange = vi.fn();
    render(<DigitalClock aria-label="Meeting" defaultValue={at(9, 30)} onChange={onChange} />);
    const listbox = screen.getByRole("listbox", { name: "Meeting" });
    expect(screen.getAllByRole("option")).toHaveLength(48);
    const selected = screen.getByRole("option", { name: "09:30 AM" });
    expect(selected.getAttribute("aria-selected")).toBe("true");
    expect(selected.tabIndex).toBe(0);
    expect(listbox.scrollTop).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("option", { name: "10:00 AM" }));
    expect(hm(onChange.mock.lastCall?.[0])).toBe("10:00");
    expect(onChange.mock.lastCall?.[1]).toBe("finish");
    await expectNoAxeViolations(document.body);
  });

  it("moves focus with the keyboard and picks with Enter", async () => {
    const onChange = vi.fn();
    render(
      <DigitalClock
        autoFocus
        timeStep={60}
        ampm={false}
        defaultValue={at(9)}
        onChange={onChange}
      />,
    );
    expect(document.activeElement?.textContent).toBe("09:00");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(hm(onChange.mock.lastCall?.[0])).toBe("11:00");
  });

  it("skips disabled times and refuses picks while read-only", async () => {
    const onChange = vi.fn();
    render(
      <DigitalClock
        minTime={at(9)}
        maxTime={at(17)}
        skipDisabled
        readOnly
        onChange={onChange}
        localeText={{ timePickerToolbarTitle: "Pick" }}
      />,
    );
    expect(screen.getByRole("listbox", { name: "Pick" }).getAttribute("aria-readonly")).toBe(
      "true",
    );
    expect(screen.getAllByRole("option")[0]?.textContent).toBe("09:00 AM");
    expect(q('[data-ok-digital-clock-item][tabindex="0"]').textContent).toBe("09:00 AM");
    await userEvent.click(screen.getByRole("option", { name: "10:00 AM" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores an option whose value it doesn't list", () => {
    const onChange = vi.fn();
    render(<DigitalClock defaultValue={at(9)} onChange={onChange} />);
    const item = screen.getByRole("option", { name: "10:00 AM" });
    item.setAttribute("data-ok-value", "junk");
    act(() => item.click());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables every option when disabled", () => {
    render(<DigitalClock disabled defaultValue={at(9)} />);
    expect(screen.getByRole("listbox").getAttribute("aria-disabled")).toBe("true");
    expect(q('[data-ok-digital-clock-item][tabindex="0"]')).toBeNull();
  });
});

describe("MultiSectionDigitalClock", () => {
  it("renders one column per view and AM / PM", async () => {
    render(<MultiSectionDigitalClock aria-label="Alarm" defaultValue={at(9, 30)} />);
    expect(screen.getByRole("group", { name: "Alarm" })).toBeTruthy();
    expect(screen.getAllByRole("listbox").map((l) => l.getAttribute("aria-label"))).toEqual([
      "Select hours",
      "Select minutes",
      "Select meridiem",
    ]);
    expect(option("hours", 9).getAttribute("aria-selected")).toBe("true");
    expect(option("minutes", 30).tabIndex).toBe(0);
    await expectNoAxeViolations(document.body);
  });

  it("moves focus to the next column after a pick and finishes on the last", async () => {
    const onChange = vi.fn();
    render(<MultiSectionDigitalClock defaultValue={at(9, 30)} onChange={onChange} />);
    await userEvent.click(option("hours", 10));
    expect(hm(onChange.mock.lastCall?.[0])).toBe("10:30");
    expect(onChange.mock.lastCall?.[1]).toBe("partial");
    expect(document.activeElement).toBe(option("minutes", 30));
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(hm(onChange.mock.lastCall?.[0])).toBe("10:35");
    expect(document.activeElement).toBe(option("meridiem", 0));
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(hm(onChange.mock.lastCall?.[0])).toBe("22:35");
    expect(onChange.mock.lastCall?.[1]).toBe("finish");
  });

  it("follows the steps, the views and skipDisabled", () => {
    render(
      <MultiSectionDigitalClock
        ampm={false}
        views={["hours", "minutes", "seconds"]}
        timeSteps={{ minutes: 15, seconds: 30 }}
        minTime={at(8)}
        maxTime={at(20)}
        skipDisabled
        autoFocus
        defaultValue={at(9, 30)}
      />,
    );
    const root = q("[data-ok-multi-section-digital-clock]");
    expect(root.getAttribute("data-ok-time-steps")).toBe("1 15 30");
    expect(root.getAttribute("data-ok-views")).toBe("hours minutes seconds");
    expect(screen.getAllByRole("listbox")).toHaveLength(3);
    expect(q('[data-ok-digital-clock-section="hours"]').children).toHaveLength(13);
    expect(q('[data-ok-digital-clock-section="minutes"]').children).toHaveLength(4);
    expect(q('[data-ok-digital-clock-section="seconds"]').children).toHaveLength(2);
    expect(document.activeElement).toBe(option("hours", 9));
  });

  it("refuses picks while disabled", async () => {
    const onChange = vi.fn();
    render(<MultiSectionDigitalClock disabled onChange={onChange} />);
    act(() => option("hours", 3).click());
    expect(onChange).not.toHaveBeenCalled();
    expect(q('[data-ok-digital-clock-item][tabindex="0"]')).toBeNull();
  });
});

describe("TimePicker", () => {
  it("desktop: digital clocks in a popover, Cancel and OK", async () => {
    const onAccept = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <DesktopTimePicker
        id="tp"
        label="Time"
        defaultValue={at(9, 30)}
        onAccept={onAccept}
        onOpenChange={onOpenChange}
      />,
    );
    const root = q("[data-ok-date-picker]");
    expect(root.getAttribute("data-ok-value-type")).toBe("time");
    const open = screen.getByRole("button", { name: "Choose time, selected time is 09:30 AM" });
    await userEvent.click(open);
    expect(onOpenChange).toHaveBeenLastCalledWith(true, "button");
    expect(root.hasAttribute("data-ok-open")).toBe(true);
    expect(screen.getByRole("dialog", { name: "Select time" })).toBeTruthy();
    expect(document.activeElement).toBe(option("hours", 9));
    expect(q("[data-ok-time-clock]")).toBeNull();
    await userEvent.click(option("hours", 11));
    expect(texts(q("[data-ok-date-field]"))).toEqual(["11", "30", "AM"]);
    // Time pickers stay open after a pick.
    expect(root.hasAttribute("data-ok-open")).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(hm(onAccept.mock.lastCall?.[0])).toBe("11:30");
    expect(root.hasAttribute("data-ok-open")).toBe(false);
    expect(document.activeElement).toBe(open);
  });

  it("desktop: closes on the last column when closeOnSelect", async () => {
    const onAccept = vi.fn();
    render(<TimePicker label="Time" closeOnSelect defaultValue={at(9, 30)} onAccept={onAccept} />);
    await userEvent.click(screen.getByRole("button", { name: /Choose time/ }));
    await userEvent.click(option("meridiem", 1));
    expect(hm(onAccept.mock.lastCall?.[0])).toBe("21:30");
    expect(q("[data-ok-date-picker]").hasAttribute("data-ok-open")).toBe(false);
  });

  it("desktop: one list when the steps are coarse", async () => {
    render(<DesktopTimePicker label="Time" timeSteps={{ minutes: 60 }} defaultValue={at(9)} />);
    await userEvent.click(screen.getByRole("button", { name: /Choose time/ }));
    expect(q("[data-ok-digital-clock]").getAttribute("data-ok-time-step")).toBe("60");
    expect(q("[data-ok-multi-section-digital-clock]")).toBeNull();
  });

  it("mobile: the toolbar and the analog clock in a dialog; Cancel restores", async () => {
    const onChange = vi.fn();
    render(<MobileTimePicker label="Time" defaultValue={at(9, 30)} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Choose time/ }));
    const dialog = screen.getByRole("dialog", { name: "Select time" });
    expect(dialog.querySelector("[data-ok-picker-toolbar]")?.hasAttribute("hidden")).toBe(false);
    expect(document.activeElement).toBe(q("[data-ok-time-clock-options]"));
    const minutes = q('[data-ok-picker-toolbar-button][data-ok-view="minutes"]');
    await userEvent.click(minutes);
    expect(q("[data-ok-time-clock]").getAttribute("data-ok-view")).toBe("minutes");
    expect(minutes.hasAttribute("data-ok-selected")).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "PM" }));
    expect(hm(onChange.mock.lastCall?.[0])).toBe("21:30");
    expect(screen.getByRole("button", { name: "PM" }).getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(hm(onChange.mock.lastCall?.[0])).toBe("09:30");
  });

  it("static: openTo, landscape and an accessible layout", async () => {
    const onChange = vi.fn();
    render(
      <StaticTimePicker
        orientation="landscape"
        openTo="minutes"
        defaultValue={at(9, 30)}
        onChange={onChange}
      />,
    );
    const root = q("[data-ok-date-picker]");
    expect(root.getAttribute("data-ok-open-to")).toBe("minutes");
    expect(q("[data-ok-time-clock]").getAttribute("data-ok-view")).toBe("minutes");
    await expectNoAxeViolations(document.body);
    screen.getByRole("listbox").focus();
    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(hm(onChange.mock.lastCall?.[0])).toBe("09:31");
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
  });

  it("empty value: dashes in the toolbar and AM / PM from today", async () => {
    const onChange = vi.fn();
    render(<StaticTimePicker views={["hours"]} today={at(15)} onChange={onChange} />);
    expect(q('[data-ok-picker-toolbar-button][data-ok-view="hours"]').textContent).toBe("––");
    await userEvent.click(screen.getByRole("button", { name: "AM" }));
    expect(hm(onChange.mock.lastCall?.[0])).toBe("00:00");
  });
});

describe("DateTimePicker", () => {
  it("desktop: the calendar and the clock columns; a day keeps the time", async () => {
    const onChange = vi.fn();
    render(<DesktopDateTimePicker label="When" defaultValue={at(9, 30)} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Choose date, selected date is May 25, 2025 09:30 AM" }),
    );
    expect(screen.getByRole("dialog", { name: "Select date & time" })).toBeTruthy();
    expect(document.activeElement?.getAttribute("data-ok-date")).toBe("2025-05-25");
    await userEvent.click(q('[data-ok-date="2025-05-27"]'));
    expect(onChange.mock.lastCall?.[0].toISOString()).toBe(
      at(9, 30).toISOString().replace("25T", "27T"),
    );
    expect(q("[data-ok-date-picker]").hasAttribute("data-ok-open")).toBe(true);
    await userEvent.click(option("minutes", 45));
    expect(texts(q("[data-ok-date-field]"))).toEqual(["05", "27", "2025", "09", "45", "AM"]);
  });

  it("mobile: tabs, the clock after the day, and Next / OK", async () => {
    const onAccept = vi.fn();
    render(<MobileDateTimePicker label="When" defaultValue={at(9, 30)} onAccept={onAccept} />);
    await userEvent.click(screen.getByRole("button", { name: /Choose date/ }));
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.getAttribute("aria-label"))).toEqual(["pick date", "pick time"]);
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(q("[data-ok-time-clock]").hidden).toBe(true);
    await userEvent.click(q('[data-ok-date="2025-05-26"]'));
    expect(q("[data-ok-time-clock]").hidden).toBe(false);
    expect(q("[data-ok-date-calendar]").hidden).toBe(true);
    expect(screen.getAllByRole("tab")[1]?.getAttribute("aria-selected")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(q("[data-ok-time-clock]").getAttribute("data-ok-view")).toBe("minutes");
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onAccept).toHaveBeenCalledWith(new Date(2025, 4, 26, 9, 30));
  });

  it("static: the date tab and the toolbar's year and day", async () => {
    render(<StaticDateTimePicker defaultValue={at(9, 30)} />);
    expect(q('[data-ok-picker-toolbar-button][data-ok-view="year"]').textContent).toBe("2025");
    expect(q('[data-ok-picker-toolbar-button][data-ok-view="day"]').textContent).toBe("May 25");
    await expectNoAxeViolations(document.body);
    await userEvent.click(screen.getByRole("tab", { name: "pick time" }));
    expect(q("[data-ok-time-clock]").hidden).toBe(false);
    await userEvent.click(screen.getByRole("tab", { name: "pick date" }));
    expect(q("[data-ok-date-calendar]").hidden).toBe(false);
    await userEvent.click(q('[data-ok-picker-toolbar-button][data-ok-view="year"]'));
    expect(q("[data-ok-date-calendar]").getAttribute("data-ok-view")).toBe("year");
  });

  it("toolbar: dashes without a value and the month when there's no day view", () => {
    render(<StaticDateTimePicker views={["month", "hours"]} />);
    const buttons = [...document.querySelectorAll("[data-ok-picker-toolbar-button]")];
    expect(buttons.map((b) => [b.getAttribute("data-ok-view"), b.textContent])).toEqual([
      ["month", "––"],
      ["hours", "––"],
    ]);
  });

  it("responsive: renders both forms' views and hides the mobile ones", () => {
    render(<DateTimePicker label="When" views={["day", "hours"]} defaultValue={at(9, 30)} />);
    expect(texts()).toEqual(["25", "09", "AM"]);
  });

  it("time only date time views and custom actions", async () => {
    const onAccept = vi.fn();
    render(
      <StaticDateTimePicker
        views={["hours", "minutes"]}
        actions={["clear", "accept"]}
        defaultValue={at(9, 30)}
        onAccept={onAccept}
      />,
    );
    expect(q("[data-ok-date-calendar]")).toBeNull();
    expect(q("[data-ok-picker-tabs]")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onAccept).toHaveBeenCalledWith(null);
  });
});

describe("time pickers: server rendering and lifecycle", () => {
  it("renders every export on the server", () => {
    for (const element of [
      <TimeField key="a" defaultValue={at(9)} />,
      <DateTimeField key="b" defaultValue={at(9)} />,
      <TimeClock key="c" defaultValue={at(9)} />,
      <DigitalClock key="d" defaultValue={at(9)} />,
      <MultiSectionDigitalClock key="e" defaultValue={at(9)} />,
      <TimePicker key="f" defaultValue={at(9)} />,
      <DesktopTimePicker key="g" defaultValue={at(9)} />,
      <MobileTimePicker key="h" defaultValue={at(9)} />,
      <StaticTimePicker key="i" defaultValue={at(9)} />,
      <DateTimePicker key="j" defaultValue={at(9)} />,
      <DesktopDateTimePicker key="k" defaultValue={at(9)} />,
      <MobileDateTimePicker key="l" defaultValue={at(9)} />,
      <StaticDateTimePicker key="m" defaultValue={at(9)} />,
    ])
      expect(renderToString(element)).toContain('data-ok-runtime="off"');
  });

  it("works in StrictMode", async () => {
    const onChange = vi.fn();
    render(
      <StrictMode>
        <TimeClock defaultValue={at(9, 30)} onChange={onChange} />
      </StrictMode>,
    );
    screen.getByRole("listbox").focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
