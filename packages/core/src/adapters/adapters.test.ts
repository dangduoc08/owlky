import { TZDate } from "@date-fns/tz";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { DateTime } from "luxon";
import moment from "moment";
import momentTz from "moment-timezone";
import { describe, expect, it } from "vitest";
import { createDateConverter, resolveTimezone } from "../pickers/adapter.js";
import { createDateFnsAdapter } from "./date-fns.js";
import { createDayjsAdapter } from "./dayjs.js";
import { createLuxonAdapter } from "./luxon.js";
import { createMomentAdapter } from "./moment.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const INSTANT = new Date(Date.UTC(2025, 4, 25, 13, 30));
const NY = "America/New_York";

describe("Day.js adapter", () => {
  const adapter = createDayjsAdapter(dayjs, { calendar: "persian" });

  it("converts dates and keeps zones", () => {
    expect(adapter.lib).toBe("dayjs");
    expect(adapter.calendar).toBe("persian");
    expect(adapter.isDate(dayjs())).toBe(true);
    expect(adapter.isDate(new Date())).toBe(false);
    expect(adapter.toDate(dayjs(INSTANT)).getTime()).toBe(INSTANT.getTime());
    expect(Number.isNaN(adapter.toDate(dayjs("nope")).getTime())).toBe(true);
    expect(adapter.fromDate(new Date(Number.NaN), "UTC").isValid()).toBe(false);
    expect(adapter.fromDate(INSTANT, "system").valueOf()).toBe(INSTANT.getTime());
    expect(adapter.getTimezone(adapter.fromDate(INSTANT, "UTC"))).toBe("UTC");
    expect(adapter.getTimezone(adapter.fromDate(INSTANT, NY))).toBe(NY);
    expect(adapter.fromDate(INSTANT, NY).hour()).toBe(9);
    expect(adapter.getTimezone(dayjs(INSTANT))).toBeNull();
    expect(resolveTimezone("default", adapter, [dayjs.tz(INSTANT, NY)])).toBe(NY);
  });

  it("works without the zone plugins (local values)", () => {
    const bare = createDayjsAdapter(
      Object.assign((d?: Date | number) => dayjs(d), {
        isDayjs: dayjs.isDayjs,
      }),
    );
    const local = bare.fromDate(INSTANT, NY);
    expect(local.valueOf()).toBe(INSTANT.getTime());
    expect(bare.fromDate(INSTANT, "UTC").valueOf()).toBe(INSTANT.getTime());
    expect(bare.getTimezone({ $x: {} } as never)).toBeNull();
  });

  it("round-trips through a converter in a zone", () => {
    const convert = createDateConverter(adapter, NY);
    const wall = convert.toEngine<Date>(dayjs(INSTANT));
    expect(wall.getHours()).toBe(9);
    const back = convert.fromEngine<dayjs.Dayjs>(wall);
    expect(back.valueOf()).toBe(INSTANT.getTime());
    expect(adapter.getTimezone(back)).toBe(NY);
  });
});

describe("date-fns adapter", () => {
  it("converts dates, with TZDate for zones", () => {
    const zoned = createDateFnsAdapter({ TZDate });
    expect(zoned.lib).toBe("date-fns");
    expect(zoned.isDate(INSTANT)).toBe(true);
    expect(zoned.isDate("2025")).toBe(false);
    expect(zoned.toDate(new TZDate(INSTANT.getTime(), NY)).getTime()).toBe(INSTANT.getTime());
    const value = zoned.fromDate(INSTANT, NY);
    expect(value).toBeInstanceOf(TZDate);
    expect(zoned.getTimezone(value)).toBe(NY);
    expect(zoned.getTimezone(new Date())).toBeNull();
    expect(zoned.fromDate(INSTANT, "system")).not.toBeInstanceOf(TZDate);
    expect(Number.isNaN(zoned.fromDate(new Date(Number.NaN), NY).getTime())).toBe(true);
    const plain = createDateFnsAdapter();
    expect(plain.fromDate(INSTANT, NY)).not.toBeInstanceOf(TZDate);
    expect(createDateFnsAdapter({ calendar: "persian" }).calendar).toBe("persian");
  });
});

describe("Luxon adapter", () => {
  const adapter = createLuxonAdapter(DateTime);

  it("converts dates and keeps zones", () => {
    expect(adapter.lib).toBe("luxon");
    expect(adapter.isDate(DateTime.now())).toBe(true);
    expect(adapter.isDate(new Date())).toBe(false);
    expect(adapter.toDate(DateTime.fromJSDate(INSTANT)).getTime()).toBe(INSTANT.getTime());
    expect(Number.isNaN(adapter.toDate(DateTime.invalid("x")).getTime())).toBe(true);
    expect(adapter.fromDate(new Date(Number.NaN), NY).isValid).toBe(false);
    const value = adapter.fromDate(INSTANT, NY);
    expect(value.hour).toBe(9);
    expect(adapter.getTimezone(value)).toBe(NY);
    expect(adapter.getTimezone(adapter.fromDate(INSTANT, "system"))).toBeNull();
    expect(adapter.getTimezone(adapter.fromDate(INSTANT, "UTC"))).toBe("UTC");
    expect(createLuxonAdapter(DateTime, { calendar: "buddhist" }).calendar).toBe("buddhist");
  });
});

describe("Moment adapter", () => {
  it("converts dates and keeps zones (moment-timezone)", () => {
    const adapter = createMomentAdapter(momentTz, { calendar: "islamic-umalqura" });
    expect(adapter.lib).toBe("moment");
    expect(adapter.calendar).toBe("islamic-umalqura");
    expect(adapter.isDate(momentTz())).toBe(true);
    expect(adapter.isDate(new Date())).toBe(false);
    expect(adapter.toDate(momentTz(INSTANT)).getTime()).toBe(INSTANT.getTime());
    expect(Number.isNaN(adapter.toDate(momentTz.invalid()).getTime())).toBe(true);
    expect(adapter.fromDate(new Date(Number.NaN), NY).isValid()).toBe(false);
    const value = adapter.fromDate(INSTANT, NY);
    expect(value.hour()).toBe(9);
    expect(adapter.getTimezone(value)).toBe(NY);
    expect(adapter.getTimezone(adapter.fromDate(INSTANT, "UTC"))).toBe("UTC");
    expect(adapter.getTimezone(adapter.fromDate(INSTANT, "system"))).toBeNull();
  });

  it("works without moment-timezone (local values)", () => {
    const adapter = createMomentAdapter(moment);
    expect(adapter.fromDate(INSTANT, NY).valueOf()).toBe(INSTANT.getTime());
    expect(adapter.getTimezone(moment(INSTANT))).toBeNull();
  });
});
