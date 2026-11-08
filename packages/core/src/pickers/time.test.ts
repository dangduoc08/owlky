import { describe, expect, it } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import { invalidDate, makeDate, setDateParts } from "./dates.js";
import { pickersEnUS, pickersViVN } from "./locale.js";
import {
  clockAngle,
  clockNumbers,
  clockValueFromPoint,
  defaultDateTimeFormat,
  defaultDateTimePickerActions,
  defaultPickerFormat,
  defaultTimeFormat,
  defaultTimePickerActions,
  digitalClockItems,
  focusPickerView,
  formatTimeSteps,
  formatTimeText,
  hourUnit,
  initialPickerView,
  is12HourLocale,
  isInnerHour,
  isSamePickerDay,
  isTimeUnitDisabled,
  isTimeView,
  nextPickerView,
  normalizeDateTimeViews,
  normalizeTimeSteps,
  normalizeTimeViews,
  parsePickerValue,
  parseTimeSteps,
  pickerValueIso,
  pickerViewsOf,
  resolveAmpm,
  setTimeUnit,
  shouldRenderSingleColumn,
  splitViews,
  stepTimeUnit,
  type TimeRules,
  timeSectionOptions,
  timeUnit,
  toHours,
  validateDateTime,
  validatePickerValue,
  validateTime,
} from "./time.js";

/** Sunday 25 May 2025, 09:30. */
const AT = (h = 9, m = 30, s = 0) =>
  setDateParts(makeDate(2025, 4, 25), { hours: h, minutes: m, seconds: s });

describe("time views and formats", () => {
  it("normalizes time and date time views", () => {
    expect(isTimeView("minutes")).toBe(true);
    expect(isTimeView("day")).toBe(false);
    expect(normalizeTimeViews(undefined)).toEqual(["hours", "minutes"]);
    expect(normalizeTimeViews(["seconds", "hours", "junk"])).toEqual(["hours", "seconds"]);
    expect(normalizeTimeViews(["junk"])).toEqual(["hours", "minutes"]);
    expect(normalizeDateTimeViews(undefined)).toEqual(["year", "day", "hours", "minutes"]);
    expect(normalizeDateTimeViews(["minutes", "day", "hours"])).toEqual([
      "day",
      "hours",
      "minutes",
    ]);
    expect(normalizeDateTimeViews(["hours"])).toEqual(["hours"]);
    expect(splitViews(["year", "day", "hours"])).toEqual({
      date: ["year", "day"],
      time: ["hours"],
    });
  });

  it("reads the hour cycle of the locale", () => {
    expect(is12HourLocale("en-US")).toBe(true);
    expect(is12HourLocale("vi-VN")).toBe(false);
    expect(resolveAmpm(undefined, "en-US")).toBe(true);
    expect(resolveAmpm(false, "en-US")).toBe(false);
  });

  it("builds MUI's default formats", () => {
    expect(defaultTimeFormat(["hours", "minutes"], true)).toBe("hh:mm A");
    expect(defaultTimeFormat(["hours", "minutes"], false)).toBe("HH:mm");
    expect(defaultTimeFormat(["hours", "minutes", "seconds"], true)).toBe("hh:mm:ss A");
    expect(defaultTimeFormat(["minutes", "seconds"], true)).toBe("mm:ss");
    expect(defaultTimeFormat(["hours"], true)).toBe("hh A");
    expect(defaultDateTimeFormat(["year", "day", "hours", "minutes"], true, "en-US")).toBe(
      "MM/DD/YYYY hh:mm A",
    );
    expect(defaultDateTimeFormat(["day", "hours"], true, "en-US")).toBe("DD hh A");
    expect(defaultDateTimeFormat(["hours"], false, "en-US")).toBe("HH");
  });

  it("formats the time text", () => {
    expect(formatTimeText(AT(21, 5, 7), ["hours", "minutes"], true, "en-US")).toBe("09:05 PM");
    expect(formatTimeText(AT(21, 5, 7), ["hours", "minutes", "seconds"], false, "en-US")).toBe(
      "21:05:07",
    );
    expect(formatTimeText(AT(0, 5, 7), ["minutes", "seconds"], true, "en-US")).toBe("05:07");
  });
});

describe("time steps", () => {
  it("keeps whole steps in range and falls back to MUI's defaults", () => {
    expect(normalizeTimeSteps()).toEqual({ hours: 1, minutes: 5, seconds: 5 });
    expect(normalizeTimeSteps({ hours: 2, minutes: 15, seconds: 30 })).toEqual({
      hours: 2,
      minutes: 15,
      seconds: 30,
    });
    expect(normalizeTimeSteps({ hours: 0, minutes: 1.5, seconds: 99 })).toEqual({
      hours: 1,
      minutes: 5,
      seconds: 5,
    });
    expect(parseTimeSteps("1 30 10")).toEqual({ hours: 1, minutes: 30, seconds: 10 });
    expect(parseTimeSteps("junk")).toEqual({ hours: 1, minutes: 5, seconds: 5 });
    expect(parseTimeSteps(42)).toEqual({ hours: 1, minutes: 5, seconds: 5 });
    expect(parseTimeSteps("1".repeat(40))).toEqual({ hours: 1, minutes: 5, seconds: 5 });
    expect(formatTimeSteps({ hours: 1, minutes: 30, seconds: 10 })).toBe("1 30 10");
  });

  it("renders one column for coarse hours and minutes", () => {
    const steps = normalizeTimeSteps();
    expect(shouldRenderSingleColumn(["hours", "minutes"], steps)).toBe(false);
    expect(shouldRenderSingleColumn(["hours", "minutes"], { ...steps, minutes: 60 })).toBe(true);
    expect(
      shouldRenderSingleColumn(["hours", "minutes", "seconds"], { ...steps, minutes: 60 }),
    ).toBe(false);
    expect(shouldRenderSingleColumn(["hours", "minutes"], { ...steps, minutes: 30 }, 48)).toBe(
      true,
    );
  });
});

describe("validateTime / validateDateTime", () => {
  it("reports MUI's time errors", () => {
    expect(validateTime(null, {})).toBeNull();
    expect(validateTime(invalidDate(), {})).toBe("invalidDate");
    expect(validateTime(AT(), {})).toBeNull();
    expect(validateTime(AT(8), { minTime: AT(9) })).toBe("minTime");
    expect(validateTime(AT(18), { maxTime: AT(17) })).toBe("maxTime");
    // The date part is ignored by default.
    expect(validateTime(AT(10), { minTime: makeDate(2030, 0, 1) })).toBeNull();
    expect(
      validateTime(AT(10), {
        minTime: setDateParts(makeDate(2030, 0, 1), { hours: 9 }),
        disableIgnoringDatePartForTimeValidation: true,
      }),
    ).toBe("minTime");
    expect(
      validateTime(AT(10), {
        maxTime: setDateParts(makeDate(2020, 0, 1), { hours: 11 }),
        disableIgnoringDatePartForTimeValidation: true,
      }),
    ).toBe("maxTime");
    expect(validateTime(AT(), { minDateTime: AT(10) })).toBe("minTime");
    expect(validateTime(AT(), { maxDateTime: AT(9, 0) })).toBe("maxTime");
    expect(validateTime(AT(9, 31), { minutesStep: 5 })).toBe("minutesStep");
    expect(validateTime(AT(9, 30), { minutesStep: 5 })).toBeNull();
    expect(validateTime(AT(), { shouldDisableTime: (_v, view) => view === "hours" })).toBe(
      "shouldDisableTime-hours",
    );
    expect(validateTime(AT(), { shouldDisableTime: (_v, view) => view === "seconds" })).toBe(
      "shouldDisableTime-seconds",
    );
    // A throwing function never blocks a value.
    expect(
      validateTime(AT(), {
        shouldDisableTime: () => {
          throw new Error("boom");
        },
      }),
    ).toBeNull();
    expect(validateTime(AT(10), { disableFuture: true, now: AT(9) })).toBe("disableFuture");
    expect(validateTime(AT(8), { disablePast: true, now: AT(9) })).toBe("disablePast");
    expect(validateTime(AT(8), { disableFuture: true })).toBeNull();
  });

  it("checks the date first, then the time", () => {
    expect(validateDateTime(null, {})).toBeNull();
    expect(validateDateTime(invalidDate(), {})).toBe("invalidDate");
    expect(validateDateTime(AT(), { minDate: makeDate(2025, 5, 1) })).toBe("minDate");
    expect(validateDateTime(AT(), { minDateTime: makeDate(2025, 5, 1) })).toBe("minDate");
    expect(validateDateTime(AT(), { maxDateTime: makeDate(2025, 4, 1) })).toBe("maxDate");
    expect(validateDateTime(AT(9), { minDateTime: AT(10) })).toBe("minTime");
    expect(validateDateTime(AT(9), { minTime: AT(10) })).toBe("minTime");
    expect(validateDateTime(AT(9), { disablePast: true, now: AT(10) })).toBe("disablePast");
    expect(validateDateTime(AT(11), { disablePast: true, now: AT(10) })).toBeNull();
    expect(validateDateTime(AT(11), { disableFuture: true, today: AT(10) })).toBe("disableFuture");
    expect(validateDateTime(AT(), { shouldDisableDate: () => true })).toBe("shouldDisableDate");
  });
});

describe("clock numbers and units", () => {
  it("converts between hours and the clock's numbers", () => {
    expect(toHours(12, true, false)).toBe(0);
    expect(toHours(12, true, true)).toBe(12);
    expect(toHours(9, true, true)).toBe(21);
    expect(toHours(21, false, false)).toBe(21);
    expect(hourUnit(AT(0), true)).toBe(12);
    expect(hourUnit(AT(13), true)).toBe(1);
    expect(hourUnit(AT(13), false)).toBe(13);
    expect(timeUnit(AT(13, 5, 7), "minutes", true)).toBe(5);
    expect(timeUnit(AT(13, 5, 7), "seconds", true)).toBe(7);
    expect(timeUnit(AT(13), "meridiem", true)).toBe(1);
    expect(timeUnit(AT(1), "meridiem", true)).toBe(0);
  });

  it("sets one unit and keeps the rest", () => {
    expect(setTimeUnit(AT(21), "hours", 3, true).getHours()).toBe(15);
    expect(setTimeUnit(AT(9), "hours", 12, true).getHours()).toBe(0);
    expect(setTimeUnit(AT(9), "hours", 17, false).getHours()).toBe(17);
    expect(setTimeUnit(AT(9), "minutes", 45, true).getMinutes()).toBe(45);
    expect(setTimeUnit(AT(9), "seconds", 15, true).getSeconds()).toBe(15);
    expect(setTimeUnit(AT(9), "meridiem", 1, true).getHours()).toBe(21);
    expect(setTimeUnit(AT(21), "meridiem", 0, true).getHours()).toBe(9);
  });

  it("lays out the clock face", () => {
    const twelve = clockNumbers("hours", true);
    expect(twelve.map((n) => n.label)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
    ]);
    expect(twelve.at(-1)).toEqual({ value: 12, label: "12", position: 0, inner: false });
    const day = clockNumbers("hours", false);
    expect(day).toHaveLength(24);
    expect(day[0]).toEqual({ value: 0, label: "00", position: 0, inner: true });
    expect(day[13]).toMatchObject({ label: "13", position: 1, inner: true });
    expect(day[12]).toMatchObject({ label: "12", inner: false });
    const minutes = clockNumbers("minutes", true);
    expect(minutes.map((n) => n.label).slice(0, 3)).toEqual(["00", "05", "10"]);
    expect(minutes[3]).toEqual({ value: 15, label: "15", position: 3, inner: false });
    expect(clockAngle("hours", 9)).toBe(270);
    expect(clockAngle("hours", 15)).toBe(90);
    expect(clockAngle("minutes", 30)).toBe(180);
    expect(isInnerHour("hours", 0, false)).toBe(true);
    expect(isInnerHour("hours", 13, false)).toBe(true);
    expect(isInnerHour("hours", 12, false)).toBe(false);
    expect(isInnerHour("hours", 1, true)).toBe(false);
    expect(isInnerHour("minutes", 15, false)).toBe(false);
  });

  it("picks the number under a point", () => {
    const ctx = { ampm: true, innerRadius: 74 };
    expect(clockValueFromPoint("hours", 0, -90, ctx)).toBe(12);
    expect(clockValueFromPoint("hours", 90, 0, ctx)).toBe(3);
    expect(clockValueFromPoint("hours", -90, 0, ctx)).toBe(9);
    const day = { ampm: false, innerRadius: 74 };
    expect(clockValueFromPoint("hours", 0, -90, day)).toBe(12);
    expect(clockValueFromPoint("hours", 0, -50, day)).toBe(0);
    expect(clockValueFromPoint("hours", 50, 0, day)).toBe(15);
    expect(clockValueFromPoint("hours", 90, 0, day)).toBe(3);
    expect(clockValueFromPoint("minutes", 0, 90, ctx)).toBe(30);
    expect(clockValueFromPoint("minutes", 90, -10, { ...ctx, step: 5 })).toBe(15);
    expect(clockValueFromPoint("seconds", -1, -90, { ...ctx, step: 5 })).toBe(0);
  });

  it("steps a unit with wrapping", () => {
    expect(stepTimeUnit("hours", 12, 1, true)).toBe(1);
    expect(stepTimeUnit("hours", 1, -1, true)).toBe(12);
    expect(stepTimeUnit("hours", 23, 1, false)).toBe(0);
    expect(stepTimeUnit("minutes", 58, 5, true)).toBe(3);
    expect(stepTimeUnit("hours", 5, "min", true)).toBe(1);
    expect(stepTimeUnit("hours", 5, "max", false)).toBe(23);
    expect(stepTimeUnit("seconds", 5, "max", false)).toBe(59);
  });
});

describe("disabled units and options", () => {
  const rules: TimeRules = { minTime: AT(9, 15), maxTime: AT(17, 45) };

  it("disables hours, minutes, seconds and meridiems outside the limits", () => {
    expect(isTimeUnitDisabled(AT(9), "hours", 8, rules, false)).toBe(true);
    expect(isTimeUnitDisabled(AT(9), "hours", 9, rules, false)).toBe(false);
    expect(isTimeUnitDisabled(AT(9), "hours", 18, rules, false)).toBe(true);
    expect(isTimeUnitDisabled(AT(9), "minutes", 10, rules, false)).toBe(true);
    expect(isTimeUnitDisabled(AT(9), "minutes", 20, { ...rules, minutesStep: 15 }, false)).toBe(
      true,
    );
    expect(isTimeUnitDisabled(AT(9, 14), "seconds", 59, rules, false)).toBe(true);
    expect(isTimeUnitDisabled(AT(9, 15), "seconds", 0, rules, false)).toBe(false);
    expect(isTimeUnitDisabled(AT(9), "meridiem", 1, { maxTime: AT(11) }, true)).toBe(true);
    expect(isTimeUnitDisabled(AT(21), "meridiem", 0, { minTime: AT(13) }, true)).toBe(true);
    expect(isTimeUnitDisabled(AT(9), "meridiem", 0, { minTime: AT(13) }, true)).toBe(true);
    expect(isTimeUnitDisabled(AT(9), "meridiem", 1, {}, true)).toBe(false);
    expect(isTimeUnitDisabled(AT(9), "hours", 10, { disablePast: true, now: AT(11) }, false)).toBe(
      true,
    );
    expect(
      isTimeUnitDisabled(AT(9), "hours", 12, { disableFuture: true, now: AT(11) }, false),
    ).toBe(true);
    expect(isTimeUnitDisabled(AT(9), "hours", 10, { minDateTime: AT(11) }, false)).toBe(true);
    expect(isTimeUnitDisabled(AT(9), "hours", 12, { maxDateTime: AT(11) }, false)).toBe(true);
    expect(
      isTimeUnitDisabled(
        AT(9),
        "minutes",
        0,
        { shouldDisableTime: (v) => v.getMinutes() === 0 },
        false,
      ),
    ).toBe(true);
  });

  it("lists the multi-section columns", () => {
    const context = { ampm: true, rules: {}, locale: "en-US" };
    const hours = timeSectionOptions("hours", AT(), AT(), context);
    expect(hours.map((o) => o.label)).toEqual([
      "12",
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
    ]);
    expect(hours.find((o) => o.selected)?.value).toBe(9);
    const minutes = timeSectionOptions("minutes", AT(), AT(), { ...context, step: 5 });
    expect(minutes).toHaveLength(12);
    expect(minutes.find((o) => o.selected)?.label).toBe("30");
    const meridiem = timeSectionOptions("meridiem", null, AT(), context);
    expect(meridiem.map((o) => [o.label, o.selected])).toEqual([
      ["AM", false],
      ["PM", false],
    ]);
    const day = timeSectionOptions("hours", null, AT(), { ...context, ampm: false, step: 2 });
    expect(day.map((o) => o.value)).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
    const limited = timeSectionOptions("hours", AT(), AT(), {
      ...context,
      ampm: false,
      rules,
      skipDisabled: true,
    });
    expect(limited.map((o) => o.value)).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    const seconds = timeSectionOptions("seconds", AT(9, 30, 10), AT(), { ...context, step: 10 });
    expect(seconds.map((o) => o.label)).toEqual(["00", "10", "20", "30", "40", "50"]);
  });

  it("lists the digital clock's times", () => {
    const context = { ampm: true, rules: {}, locale: "en-US" };
    const all = digitalClockItems(AT(), AT(), context);
    expect(all).toHaveLength(48);
    expect(all[0]?.label).toBe("12:00 AM");
    expect(all[19]).toMatchObject({ label: "09:30 AM", selected: true, disabled: false });
    const hourly = digitalClockItems(null, AT(), { ...context, ampm: false, step: 60 });
    expect(hourly.map((o) => o.label).slice(0, 2)).toEqual(["00:00", "01:00"]);
    expect(hourly.some((o) => o.selected)).toBe(false);
    const limited = digitalClockItems(AT(), AT(), { ...context, rules, skipDisabled: true });
    expect(limited[0]?.label).toBe("09:30 AM");
    expect(limited.at(-1)?.label).toBe("05:30 PM");
    expect(digitalClockItems(AT(), AT(), { ...context, rules })[0]?.disabled).toBe(true);
  });
});

describe("time texts", () => {
  it("names the clock parts in English and Vietnamese", () => {
    expect(pickersEnUS.openTimePickerDialogue("09:30 AM")).toBe(
      "Choose time, selected time is 09:30 AM",
    );
    expect(pickersEnUS.openTimePickerDialogue(null)).toBe("Choose time");
    expect(pickersEnUS.clockLabelText("hours", "09:30 AM")).toBe(
      "Select hours. Selected time is 09:30 AM",
    );
    expect(pickersEnUS.clockLabelText("minutes", null)).toBe("Select minutes. No time selected");
    expect(pickersEnUS.hoursClockNumberText("9")).toBe("9 hours");
    expect(pickersEnUS.minutesClockNumberText("05")).toBe("05 minutes");
    expect(pickersEnUS.secondsClockNumberText("10")).toBe("10 seconds");
    expect(pickersEnUS.selectViewText("meridiem")).toBe("Select meridiem");
    expect(pickersViVN.openTimePickerDialogue("09:30")).toBe("Chọn giờ, giờ đã chọn là 09:30");
    expect(pickersViVN.openTimePickerDialogue(null)).toBe("Chọn giờ");
    expect(pickersViVN.clockLabelText("hours", "09:30")).toBe("Chọn giờ. Giờ đã chọn là 09:30");
    expect(pickersViVN.clockLabelText("seconds", null)).toBe("Chọn giây. Chưa chọn giờ");
    expect(pickersViVN.hoursClockNumberText("9")).toBe("9 giờ");
    expect(pickersViVN.minutesClockNumberText("05")).toBe("05 phút");
    expect(pickersViVN.secondsClockNumberText("10")).toBe("10 giây");
    expect(pickersViVN.selectViewText("minutes")).toBe("Chọn phút");
  });

  it("formats an empty view list", () => {
    expect(defaultDateTimeFormat(["year", "day"], true, "en-US")).toBe("MM/DD/YYYY");
    expect(formatTimeText(AT(), [], true, "en-US")).toBe("");
  });
});

describe("value types (ADR-0026)", () => {
  it("writes and reads ISO text per type", () => {
    expect(pickerValueIso(AT(9, 5, 7), "date")).toBe("2025-05-25");
    expect(pickerValueIso(AT(9, 5, 7), "time")).toBe("09:05:07");
    expect(pickerValueIso(AT(9, 5, 7), "date-time")).toBe("2025-05-25T09:05:07");
    expect(parsePickerValue("2025-05-26T10:00", AT())).toEqual(
      setDateParts(makeDate(2025, 4, 26), { hours: 10, minutes: 0, seconds: 0 }),
    );
    expect(parsePickerValue("21:15", AT())?.getHours()).toBe(21);
    expect(parsePickerValue("21:15", AT())?.getDate()).toBe(25);
    expect(parsePickerValue("junk", AT())).toBeNull();
  });

  it("validates, lists the views and formats per type", () => {
    expect(validatePickerValue(AT(8), "time", { minTime: AT(9) })).toBe("minTime");
    expect(validatePickerValue(AT(8), "date-time", { minDateTime: AT(9) })).toBe("minTime");
    expect(validatePickerValue(AT(8), "date", { minDate: makeDate(2025, 5, 1) })).toBe("minDate");
    expect(pickerViewsOf(undefined, "time")).toEqual(["hours", "minutes"]);
    expect(pickerViewsOf(undefined, "date-time")).toEqual(["year", "day", "hours", "minutes"]);
    expect(pickerViewsOf(["month", "year"], "date")).toEqual(["year", "month"]);
    expect(defaultPickerFormat(["hours", "minutes"], "time", true, "en-US")).toBe("hh:mm A");
    expect(defaultPickerFormat(["day", "hours"], "date-time", false, "en-US")).toBe("DD HH");
    expect(defaultPickerFormat(["year", "day"], "date", true, "en-US")).toBe("MM/DD/YYYY");
  });

  it("picks the first view and the next one", () => {
    expect(initialPickerView(["year", "day", "hours"], "date-time", "hours")).toBe("hours");
    expect(initialPickerView(["year", "day", "hours"], "date-time", "junk")).toBe("day");
    expect(initialPickerView(["year", "month", "hours"], "date-time", undefined)).toBe("month");
    expect(initialPickerView(["minutes", "seconds"], "time", undefined)).toBe("minutes");
    expect(initialPickerView(["hours"], "date-time", undefined)).toBe("hours");
    expect(nextPickerView(["day", "hours", "minutes"], "day")).toBe("hours");
    expect(nextPickerView(["day", "hours"], "hours")).toBeNull();
    expect(nextPickerView(["day", "hours"], "year")).toBeNull();
  });
});

describe("picker helpers", () => {
  it("compares days and gives the time pickers' default actions", () => {
    expect(isSamePickerDay(AT(1), AT(23))).toBe(true);
    expect(isSamePickerDay(AT(), makeDate(2025, 4, 26))).toBe(false);
    expect(isSamePickerDay(null, invalidDate())).toBe(true);
    expect(isSamePickerDay(null, AT())).toBe(false);
    expect(defaultTimePickerActions()).toEqual(["cancel", "accept"]);
    expect(defaultDateTimePickerActions("desktop")).toEqual(["cancel", "accept"]);
    expect(defaultDateTimePickerActions("mobile")).toEqual(["cancel", "nextOrAccept"]);
  });

  it("focuses the first visible view", () => {
    const host = mount(`
      <div hidden><div role="listbox" data-ok-time-clock-options tabindex="0"></div></div>
      <ul role="listbox"><li data-ok-digital-clock-item tabindex="-1">a</li><li data-ok-digital-clock-item tabindex="0">b</li></ul>`);
    focusPickerView(host);
    expect(document.activeElement?.textContent).toBe("b");
    const days = mount(
      `<button data-ok-picker-day disabled>1</button><button data-ok-picker-day>2</button>`,
    );
    focusPickerView(days);
    expect(document.activeElement?.textContent).toBe("2");
    const empty = mount("<p>none</p>");
    expect(() => focusPickerView(empty)).not.toThrow();
    cleanupDom();
  });
});
