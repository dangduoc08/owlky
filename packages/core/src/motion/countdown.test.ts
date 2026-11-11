import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { countdownAttributes, countdownOptions } from "../anatomy/anatomy.js";
import {
  COUNTDOWN_PLACEHOLDER,
  countdownAnnouncement,
  countdownInitial,
  countdownParts,
  countdownShownUnits,
  countdownStep,
  countdownText,
  countdownValueText,
  createCountdown,
  parseCountdownSeconds,
  parseCountdownTime,
} from "./countdown.js";

const NOW = Date.parse("2026-11-09T12:00:00Z");

describe("countdown helpers", () => {
  it("splits seconds from the largest unit down", () => {
    const total = 2 * 86400 + 3 * 3600 + 4 * 60 + 5;
    expect(countdownParts(total)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
    expect(countdownParts(total, "hours")).toEqual({
      days: 0,
      hours: 51,
      minutes: 4,
      seconds: 5,
    });
    expect(countdownParts(90, "seconds")).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 90 });
    expect(countdownParts(-5)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    expect(countdownShownUnits("minutes")).toEqual(["minutes", "seconds"]);
  });

  it("pads every unit but the largest", () => {
    const parts = countdownParts(3605);
    expect(countdownValueText(parts, "days", "days")).toBe("0");
    expect(countdownValueText(parts, "hours", "days")).toBe("01");
    expect(countdownValueText(parts, "seconds", "days")).toBe("05");
    expect(countdownValueText(countdownParts(5, "seconds"), "seconds", "seconds")).toBe("5");
    expect(COUNTDOWN_PLACEHOLDER).toBe("--");
  });

  it("writes the time left in words, non-zero units only", () => {
    expect(countdownText(2 * 3600 + 15 * 60)).toBe("2 hours, 15 minutes");
    expect(
      countdownText(86400 + 1, "days", { days: "j", hours: "h", minutes: "m", seconds: "s" }),
    ).toBe("1 j, 1 s");
    expect(countdownText(0)).toBe("");
  });

  it("announces about once a minute, at 30 and 10 seconds, and at the end", () => {
    expect(countdownStep(7200)).toBe("h2");
    expect(countdownStep(3599)).toBe("m59");
    expect(countdownStep(45)).toBe("s60");
    expect(countdownStep(30)).toBe("s30");
    expect(countdownStep(10)).toBe("s10");
    expect(countdownStep(0)).toBe("end");
    expect(countdownAnnouncement(125, 124)).toBeUndefined();
    expect(countdownAnnouncement(121, 120)).toBeUndefined();
    expect(countdownAnnouncement(120, 119)).toBe("1 minutes, 59 seconds");
    expect(countdownAnnouncement(31, 30)).toBe("30 seconds");
    expect(countdownAnnouncement(11, 10)).toBe("10 seconds");
    expect(countdownAnnouncement(9, 8)).toBeUndefined();
    expect(countdownAnnouncement(1, 0)).toBe("Time's up");
    expect(countdownAnnouncement(1, 0, { completeLabel: "Go" })).toBe("Go");
    // Ticks skipped by a throttled tab still announce once.
    expect(countdownAnnouncement(3700, 3400, { largest: "minutes" })).toBe(
      "56 minutes, 40 seconds",
    );
  });

  it("parses times and seconds, rejecting anything else", () => {
    expect(parseCountdownTime(new Date(NOW))).toBe(NOW);
    expect(parseCountdownTime(NOW)).toBe(NOW);
    expect(parseCountdownTime(String(NOW))).toBe(NOW);
    expect(parseCountdownTime("2026-11-09T12:00:00Z")).toBe(NOW);
    expect(parseCountdownTime("tomorrow")).toBeUndefined();
    expect(parseCountdownTime("")).toBeUndefined();
    expect(parseCountdownTime("x".repeat(100))).toBeUndefined();
    expect(parseCountdownTime(Number.NaN)).toBeUndefined();
    expect(parseCountdownTime(null)).toBeUndefined();
    expect(parseCountdownSeconds(10)).toBe(10);
    expect(parseCountdownSeconds("10")).toBe(10);
    expect(parseCountdownSeconds(-1)).toBeUndefined();
    expect(parseCountdownSeconds("")).toBeUndefined();
    expect(parseCountdownSeconds(Number.POSITIVE_INFINITY)).toBeUndefined();
  });

  it("gives the first render's value without the clock when it can", () => {
    expect(countdownInitial({ seconds: 9.2 })).toBe(10);
    expect(countdownInitial({ date: NOW + 61_500, now: NOW })).toBe(62);
    expect(countdownInitial({ date: NOW - 1000, now: NOW })).toBe(0);
    expect(countdownInitial({ date: NOW })).toBeUndefined();
    expect(countdownInitial({})).toBeUndefined();
  });

  it("writes the option attributes", () => {
    expect(countdownAttributes()).toEqual({
      "data-ok-countdown": "",
      "data-ok-largest-unit": "days",
    });
    expect(countdownAttributes({ seconds: 30, largestUnit: "seconds", paused: true })).toEqual({
      "data-ok-countdown": "",
      "data-ok-seconds": "30",
      "data-ok-largest-unit": "seconds",
      "data-ok-paused": "",
    });
    expect(countdownAttributes({ seconds: -1, largestUnit: "weeks" as never })).toEqual({
      "data-ok-countdown": "",
      "data-ok-largest-unit": "days",
    });
    expect(countdownOptions.root).toBe("data-ok-countdown");
  });
});

describe("createCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("counts seconds down once per second and completes once", () => {
    const ticks: number[] = [];
    const onComplete = vi.fn();
    const countdown = createCountdown({ seconds: 3, onTick: (s) => ticks.push(s), onComplete });
    expect(ticks).toEqual([3]);
    vi.advanceTimersByTime(999);
    expect(ticks).toEqual([3]);
    vi.advanceTimersByTime(1);
    expect(ticks).toEqual([3, 2]);
    vi.advanceTimersByTime(5000);
    expect(ticks).toEqual([3, 2, 1, 0]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(countdown.remaining).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    countdown.pause();
    countdown.resume();
    expect(onComplete).toHaveBeenCalledTimes(1);
    countdown.destroy();
  });

  it("keeps the time left of a paused seconds countdown", () => {
    const ticks: number[] = [];
    const countdown = createCountdown({ seconds: 10, paused: true, onTick: (s) => ticks.push(s) });
    expect(countdown.paused).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(ticks).toEqual([10]);
    countdown.resume();
    countdown.resume();
    vi.advanceTimersByTime(2500);
    expect(ticks).toEqual([10, 9, 8]);
    countdown.pause();
    countdown.pause();
    vi.advanceTimersByTime(10_000);
    expect(countdown.remaining).toBe(8);
    countdown.resume();
    vi.advanceTimersByTime(500);
    expect(ticks).toEqual([10, 9, 8, 7]);
    countdown.restart();
    expect(ticks.at(-1)).toBe(10);
    expect(countdown.paused).toBe(false);
    countdown.destroy();
    vi.advanceTimersByTime(5000);
    expect(ticks.at(-1)).toBe(10);
  });

  it("counts to a date; paused, it shows the real time left when it resumes", () => {
    const ticks: number[] = [];
    const countdown = createCountdown({ date: NOW + 3000, onTick: (s) => ticks.push(s) });
    vi.advanceTimersByTime(1000);
    countdown.pause();
    vi.advanceTimersByTime(1500);
    expect(ticks).toEqual([3, 2]);
    countdown.resume();
    expect(ticks).toEqual([3, 2, 1]);
    vi.advanceTimersByTime(500);
    expect(ticks).toEqual([3, 2, 1, 0]);
    countdown.restart();
    expect(countdown.remaining).toBe(0);
    countdown.destroy();
  });

  it("runs its clock from `now`, and completes a date in the past at once", () => {
    const ticks: number[] = [];
    createCountdown({
      date: Date.parse("2027-01-01T00:00:00Z"),
      now: Date.parse("2026-12-31T23:59:58Z"),
      onTick: (s) => ticks.push(s),
    });
    vi.advanceTimersByTime(2000);
    expect(ticks).toEqual([2, 1, 0]);
    const onComplete = vi.fn();
    createCountdown({ date: NOW - 5000, onTick: () => undefined, onComplete });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("aligns its timer with the next whole second", () => {
    const ticks: number[] = [];
    createCountdown({ date: NOW + 2300, onTick: (s) => ticks.push(s) });
    expect(ticks).toEqual([3]);
    vi.advanceTimersByTime(300);
    expect(ticks).toEqual([3, 2]);
    vi.advanceTimersByTime(2000);
    expect(ticks).toEqual([3, 2, 1, 0]);
  });

  it("treats a missing length as 0", () => {
    const ticks: number[] = [];
    createCountdown({ onTick: (s) => ticks.push(s) });
    expect(ticks).toEqual([0]);
  });
});
