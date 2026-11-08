import { describe, expect, it } from "vitest";
import { invalidDate, makeDate } from "./dates.js";
import { pickersEnUS, pickersViVN } from "./locale.js";
import {
  type DateRange,
  defaultRangeCalendars,
  formatIsoRange,
  initialRangeMonth,
  isSameRange,
  monthsShowing,
  parseCalendarCount,
  parseIsoRange,
  parseRangePosition,
  previewRange,
  rangeAccessibleText,
  rangeAfterPick,
  rangeDayAttributes,
  rangeDayState,
  rangeError,
  rangeFieldSections,
  rangeSectionValues,
  rangeShortcutValue,
  rangeToolbarText,
  sectionsToRange,
  validateRange,
  visibleMonths,
  withDay,
} from "./range.js";

const d = (day: number, month = 4, year = 2025) => makeDate(year, month, day);
const at = (day: number, hours: number, minutes = 0) => {
  const date = d(day);
  date.setHours(hours, minutes, 0, 0);
  return date;
};
const iso = (range: DateRange) => formatIsoRange(range, "date");

describe("ISO intervals", () => {
  it("reads and writes start/end with empty sides", () => {
    expect(iso(parseIsoRange("2025-05-20/2025-05-25", d(1)) as DateRange)).toBe(
      "2025-05-20/2025-05-25",
    );
    expect(parseIsoRange("2025-05-20/", d(1))).toEqual([d(20), null]);
    expect(parseIsoRange("/2025-05-25", d(1))).toEqual([null, d(25)]);
    expect(parseIsoRange("/", d(1))).toEqual([null, null]);
    expect(iso([null, null])).toBe("");
    expect(iso([d(20), null])).toBe("2025-05-20/");
    expect(iso([invalidDate(), d(25)])).toBe("/2025-05-25");
  });

  it("reads times on the reference day and writes by value type", () => {
    const range = parseIsoRange("09:30/17:00:00", d(25)) as DateRange;
    expect(formatIsoRange(range, "time")).toBe("09:30:00/17:00:00");
    expect(formatIsoRange(range, "date-time")).toBe("2025-05-25T09:30:00/2025-05-25T17:00:00");
  });

  it("rejects malformed and hostile input", () => {
    for (const bad of [
      null,
      42,
      "2025-05-20",
      "a/b/c",
      "2025-02-30/2025-03-01",
      '"><img onerror=x>/x',
      `${"9".repeat(100)}/`,
    ])
      expect(parseIsoRange(bad, d(1))).toBeNull();
  });

  it("compares ranges side by side", () => {
    expect(isSameRange([d(1), null], [d(1), null])).toBe(true);
    expect(isSameRange([d(1), d(2)], [d(1), d(3)])).toBe(false);
    expect(isSameRange([invalidDate(), null], [invalidDate(), null])).toBe(true);
    expect(isSameRange([invalidDate(), null], [d(1), null])).toBe(false);
    expect(isSameRange([null, null], [d(1), null])).toBe(false);
  });

  it("parses counts and positions with fallbacks", () => {
    expect(parseCalendarCount("3", 2)).toBe(3);
    expect(parseCalendarCount(1, 2)).toBe(1);
    expect(parseCalendarCount("4", 2)).toBe(2);
    expect(parseCalendarCount(undefined, 1)).toBe(1);
    expect(parseRangePosition("end")).toBe("end");
    expect(parseRangePosition("middle")).toBe("start");
    expect(parseRangePosition(null, "end")).toBe("end");
  });
});

describe("rangeAfterPick (MUI calculateRangeChange)", () => {
  it("picks the start, then the end", () => {
    expect(rangeAfterPick([null, null], d(20), "start")).toEqual({
      range: [d(20), null],
      position: "end",
    });
    expect(rangeAfterPick([d(20), null], d(25), "end")).toEqual({
      range: [d(20), d(25)],
      position: "start",
    });
  });

  it("starts again when the end comes before the start (or the start after the end)", () => {
    expect(rangeAfterPick([d(20), null], d(10), "end")).toEqual({
      range: [d(10), null],
      position: "end",
    });
    expect(rangeAfterPick([d(20), d(25)], d(28), "start")).toEqual({
      range: [d(28), null],
      position: "end",
    });
    expect(rangeAfterPick([d(20), d(25)], d(22), "start")).toEqual({
      range: [d(22), d(25)],
      position: "end",
    });
  });

  it("flips the ends while dragging", () => {
    expect(rangeAfterPick([d(20), d(25)], d(28), "start", true)).toEqual({
      range: [d(25), d(28)],
      position: "end",
    });
    expect(rangeAfterPick([d(20), d(25)], d(10), "end", true)).toEqual({
      range: [d(10), d(20)],
      position: "start",
    });
  });
});

describe("day states and preview", () => {
  it("marks the ends and the days between", () => {
    const range: DateRange = [d(20), d(25)];
    expect(rangeDayState(d(20), range)).toMatchObject({ start: true, end: false, within: true });
    expect(rangeDayState(d(22), range)).toMatchObject({ start: false, within: true });
    expect(rangeDayState(d(25), range)).toMatchObject({ end: true, within: true });
    expect(rangeDayState(d(26), range).within).toBe(false);
    expect(rangeDayState(d(20), [d(20), null])).toMatchObject({ start: true, within: false });
  });

  it("previews from the start to the hovered day, or from it to the end", () => {
    expect(previewRange([d(20), null], d(24), "end")).toEqual([d(20), d(24)]);
    expect(previewRange([d(20), null], d(10), "end")).toBeNull();
    expect(previewRange([null, d(25)], d(22), "start")).toEqual([d(22), d(25)]);
    expect(previewRange([null, d(25)], d(28), "start")).toBeNull();
    expect(previewRange([d(20), d(25)], null, "end")).toBeNull();
    const state = rangeDayState(d(22), [d(20), null], [d(20), d(24)]);
    expect(state).toMatchObject({ inPreview: true, previewStart: false, previewEnd: false });
    expect(rangeDayState(d(24), [d(20), null], [d(20), d(24)]).previewEnd).toBe(true);
    expect(rangeDayState(d(20), [d(20), null], [d(20), d(24)]).previewStart).toBe(true);
  });

  it("writes the state as data attributes", () => {
    expect(
      rangeDayAttributes({
        start: true,
        end: true,
        within: true,
        previewStart: true,
        previewEnd: true,
        inPreview: true,
      }),
    ).toEqual({
      "data-ok-range-start": "",
      "data-ok-range-end": "",
      "data-ok-in-range": "",
      "data-ok-preview-start": "",
      "data-ok-preview-end": "",
      "data-ok-in-preview": "",
    });
    expect(rangeDayAttributes(rangeDayState(d(1), [null, null]))).toEqual({});
  });
});

describe("validateRange", () => {
  it("reports invalidRange on both sides when the end comes first", () => {
    expect(validateRange([d(25), d(20)], "date", {})).toEqual(["invalidRange", "invalidRange"]);
    expect(validateRange([d(20), d(20)], "date", {})).toEqual([null, null]);
    expect(validateRange([d(20), null], "date", {})).toEqual([null, null]);
    expect(rangeError(["invalidRange", "invalidRange"])).toBe("invalidRange");
    expect(rangeError([null, "maxDate"])).toBe("maxDate");
    expect(rangeError([null, null])).toBeNull();
  });

  it("keeps each side's own error", () => {
    expect(validateRange([d(20), invalidDate()], "date", {})).toEqual([null, "invalidDate"]);
    expect(validateRange([d(20), d(30)], "date", { maxDate: d(25) })).toEqual([null, "maxDate"]);
  });

  it("compares times by the instant and dates by the day", () => {
    expect(validateRange([at(25, 17), at(25, 9)], "time", {})).toEqual([
      "invalidRange",
      "invalidRange",
    ]);
    expect(validateRange([at(25, 17), at(25, 9)], "date", {})).toEqual([null, null]);
    expect(validateRange([at(25, 9), at(25, 17)], "date-time", {})).toEqual([null, null]);
  });
});

describe("months", () => {
  it("defaults to two calendars on desktop only", () => {
    expect(defaultRangeCalendars("desktop")).toBe(2);
    expect(defaultRangeCalendars("mobile")).toBe(1);
    expect(defaultRangeCalendars("static")).toBe(1);
  });

  it("places the value's month (or today's) at the current month position", () => {
    expect(initialRangeMonth([d(20), d(25)], d(1, 0), 2)).toEqual(d(1));
    expect(initialRangeMonth([null, d(25)], d(1, 0), 2)).toEqual(d(1));
    expect(initialRangeMonth([null, null], d(10, 0, 2026), 2, 2)).toEqual(d(1, 11, 2025));
    expect(initialRangeMonth([null, null], d(10, 0, 2026), 1, 3)).toEqual(d(1, 0, 2026));
    expect(initialRangeMonth([null, null], d(10, 0, 2026), 2, Number.NaN)).toEqual(d(1, 0, 2026));
  });

  it("lists the shown months and moves only to show a hidden date", () => {
    expect(visibleMonths(d(15), 3)).toEqual([d(1), d(1, 5), d(1, 6)]);
    expect(monthsShowing(d(10, 5), d(1), 2)).toEqual(d(1));
    expect(monthsShowing(d(10, 6), d(1), 2)).toEqual(d(1, 5));
    expect(monthsShowing(d(10, 2), d(1), 2)).toEqual(d(1, 2));
  });
});

describe("range field sections", () => {
  const { sections, count } = rangeFieldSections("MM/DD/YYYY");

  it("doubles the format with the en dash and marks each part", () => {
    expect(count).toBe(3);
    expect(sections.map((s) => s.part)).toEqual([0, 0, 0, 1, 1, 1]);
    expect(sections[2]?.endSeparator).toBe(" – ");
    expect(sections[3]?.startSeparator).toBe("");
    const leading = rangeFieldSections("[at ]HH:mm");
    expect(leading.sections[0]?.startSeparator).toBe("at ");
    expect(leading.sections[1]?.endSeparator).toBe(" – at ");
    expect(rangeFieldSections("[no sections]")).toEqual({ sections: [], count: 0 });
  });

  it("reads and writes both dates", () => {
    const texts = rangeSectionValues([d(20), d(25)], sections, count, "en-US");
    expect(texts).toEqual(["05", "20", "2025", "05", "25", "2025"]);
    expect(rangeSectionValues([null, d(25)], sections, count, "en-US").slice(0, 3)).toEqual([
      "",
      "",
      "",
    ]);
    expect(sectionsToRange(texts, sections, count, "en-US", [d(1), d(1)])).toEqual([d(20), d(25)]);
    const partial = sectionsToRange(["05", "20", "2025", "", "", ""], sections, count, "en-US", [
      d(1),
      d(1),
    ]);
    expect(partial[0]).toEqual(d(20));
    expect(partial[1]).toBeNull();
  });
});

describe("shortcuts and texts", () => {
  it("returns a shortcut's range, or undefined when it fails", () => {
    const ok = { label: "Week", getValue: () => [d(19), d(25)] as DateRange };
    expect(rangeShortcutValue(ok, "date", {})).toEqual([d(19), d(25)]);
    const checks: boolean[] = [];
    rangeShortcutValue(
      {
        label: "Check",
        getValue: ({ isValid }) => {
          checks.push(isValid([d(25), d(20)]), isValid([d(20), d(25)]));
          return [null, null];
        },
      },
      "date",
      {},
    );
    expect(checks).toEqual([false, true]);
    const throws = {
      label: "x",
      getValue: () => {
        throw new Error("x");
      },
    };
    expect(rangeShortcutValue(throws, "date", {})).toBeUndefined();
    const junk = { label: "x", getValue: () => "nope" as unknown as DateRange };
    expect(rangeShortcutValue(junk, "date", {})).toBeUndefined();
    const bad = { label: "x", getValue: () => [d(1), "x"] as unknown as DateRange };
    expect(rangeShortcutValue(bad, "date", {})).toBeUndefined();
  });

  it("keeps a side's time on date time picks", () => {
    expect(withDay(at(20, 15), null, d(1), "date")).toEqual(d(20));
    expect(withDay(d(22), at(20, 9, 30), d(1), "date-time")).toEqual(at(22, 9, 30));
    expect(withDay(d(22), null, at(1, 8), "date-time")).toEqual(at(22, 8));
  });

  it("formats the toolbar and the accessible range", () => {
    expect(rangeToolbarText(d(20), "en-US", "Start")).toBe("May 20");
    expect(rangeToolbarText(null, "en-US", "Start")).toBe("Start");
    const text = (date: Date) => String(date.getDate());
    expect(rangeAccessibleText([d(20), d(25)], text)).toBe("20 – 25");
    expect(rangeAccessibleText([d(20), null], text)).toBe("20 – ");
    expect(rangeAccessibleText([null, d(25)], text)).toBe(" – 25");
    expect(rangeAccessibleText([null, invalidDate()], text)).toBeNull();
  });
});

describe("range texts", () => {
  it("names the open button in English and Vietnamese", () => {
    expect(pickersEnUS.openRangePickerDialogue(null)).toBe("Choose range");
    expect(pickersEnUS.openRangePickerDialogue("a – b")).toBe(
      "Choose range, selected range is a – b",
    );
    expect(pickersViVN.openRangePickerDialogue(null)).toBe("Chọn khoảng");
    expect(pickersViVN.openRangePickerDialogue("a")).toContain("a");
    expect(pickersViVN.dateRangePickerToolbarTitle).toBe("Chọn khoảng ngày");
  });
});
