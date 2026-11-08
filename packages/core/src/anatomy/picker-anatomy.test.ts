import { describe, expect, it } from "vitest";
import {
  dateCalendarAttributes,
  dateFieldAttributes,
  datePickerAttributes,
  dateRangeCalendarAttributes,
  dateRangePickerAttributes,
  digitalClockAttributes,
  multiSectionDigitalClockAttributes,
  timeClockAttributes,
} from "./anatomy.js";

const HOSTILE = '"><img src=x onerror=alert(1)>';

describe("date picker anatomy (ADR-0022)", () => {
  it("writes the defaults without options", () => {
    expect(dateFieldAttributes()).toEqual({
      "data-ok-date-field": "",
      "data-ok-format-density": "dense",
    });
    expect(dateCalendarAttributes()).toEqual({
      "data-ok-date-calendar": "",
      "data-ok-months-per-row": "3",
      "data-ok-years-per-row": "4",
      "data-ok-years-order": "asc",
    });
    expect(datePickerAttributes()).toEqual({
      "data-ok-date-picker": "",
      "data-ok-picker-variant": "responsive",
      "data-ok-orientation": "portrait",
    });
  });

  it("writes the value type only when it is valid (phase 2)", () => {
    expect(dateFieldAttributes({ valueType: "time" })["data-ok-value-type"]).toBe("time");
    expect(datePickerAttributes({ valueType: "date-time" })["data-ok-value-type"]).toBe(
      "date-time",
    );
    expect(
      dateFieldAttributes({ valueType: HOSTILE as "time" })["data-ok-value-type"],
    ).toBeUndefined();
  });
});

describe("clock anatomy (ADR-0026)", () => {
  it("writes the roots and nothing else by default", () => {
    expect(timeClockAttributes()).toEqual({ "data-ok-time-clock": "" });
    expect(digitalClockAttributes()).toEqual({ "data-ok-digital-clock": "" });
    expect(multiSectionDigitalClockAttributes()).toEqual({
      "data-ok-multi-section-digital-clock": "",
    });
  });

  it("writes flags and valid numbers; invalid numbers fall back", () => {
    expect(
      timeClockAttributes({
        ampmInClock: true,
        minutesStep: 5,
        disablePast: true,
        disableFuture: true,
        readOnly: true,
      }),
    ).toEqual({
      "data-ok-time-clock": "",
      "data-ok-ampm-in-clock": "",
      "data-ok-minutes-step": "5",
      "data-ok-disable-past": "",
      "data-ok-disable-future": "",
      "data-ok-read-only": "",
    });
    expect(digitalClockAttributes({ timeStep: 15, skipDisabled: true })).toMatchObject({
      "data-ok-time-step": "15",
      "data-ok-skip-disabled": "",
    });
    expect(digitalClockAttributes({ timeStep: 0 })["data-ok-time-step"]).toBeUndefined();
    expect(
      multiSectionDigitalClockAttributes({ minutesStep: Number.NaN, skipDisabled: true }),
    ).toEqual({
      "data-ok-multi-section-digital-clock": "",
      "data-ok-skip-disabled": "",
    });
  });
});

describe("range picker anatomy (ADR-0028)", () => {
  it("writes the defaults and every option, and drops hostile values", () => {
    expect(dateRangeCalendarAttributes()).toEqual({
      "data-ok-date-range-calendar": "",
      "data-ok-calendars": "2",
      "data-ok-current-month-calendar-position": "1",
    });
    expect(
      dateRangeCalendarAttributes({
        calendars: 3,
        currentMonthCalendarPosition: 2,
        disableDragEditing: true,
        disableAutoMonthSwitching: true,
        fixedWeekNumber: 6,
      }),
    ).toMatchObject({
      "data-ok-calendars": "3",
      "data-ok-current-month-calendar-position": "2",
      "data-ok-disable-drag-editing": "",
      "data-ok-disable-auto-month-switching": "",
      "data-ok-fixed-week-number": "6",
    });
    expect(dateRangeCalendarAttributes({ calendars: HOSTILE as never })["data-ok-calendars"]).toBe(
      "2",
    );
    expect(dateRangePickerAttributes()).toEqual({
      "data-ok-date-range-picker": "",
      "data-ok-picker-variant": "responsive",
    });
    expect(
      dateRangePickerAttributes({
        pickerVariant: "static",
        calendars: 1,
        disableDragEditing: true,
        valueType: "time",
      }),
    ).toEqual({
      "data-ok-date-range-picker": "",
      "data-ok-picker-variant": "static",
      "data-ok-calendars": "1",
      "data-ok-disable-drag-editing": "",
      "data-ok-value-type": "time",
    });
    expect(dateFieldAttributes({ range: true })["data-ok-range"]).toBe("");
  });
});
