import { afterEach, describe, expect, it, vi } from "vitest";
import { createGridDebounce, gridPaginationCount, gridUnknownCountPattern } from "./grid-server.js";

afterEach(() => vi.useRealTimers());

describe("gridPaginationCount", () => {
  const info = { page: 2, pageSize: 25, pageRows: 10 };
  it("keeps a known count", () => {
    expect(gridPaginationCount(100, info)).toBe(100);
    expect(gridPaginationCount(100, { ...info, hasNextPage: false })).toBe(100);
  });
  it("keeps -1 until the server says no page follows", () => {
    expect(gridPaginationCount(-1, info)).toBe(-1);
    expect(gridPaginationCount(-1, { ...info, hasNextPage: true })).toBe(-1);
    expect(gridPaginationCount(-1, { ...info, hasNextPage: false })).toBe(60);
  });
});

describe("gridUnknownCountPattern", () => {
  const labels = {
    paginationCountAround: "around {count}",
    paginationCountMoreThan: "more than {to}",
  };
  it("shows the estimate while it's ahead of the page", () => {
    expect(gridUnknownCountPattern("{from}–{to} of {count}", labels, 100, 50)).toBe(
      "{from}–{to} of around 100",
    );
  });
  it("falls back to more than past the estimate, or without one", () => {
    expect(gridUnknownCountPattern("{from}–{to} of {count}", labels, 40, 50)).toBe(
      "{from}–{to} of more than {to}",
    );
    expect(gridUnknownCountPattern("{from}–{to} of {count}", labels, undefined, 50)).toBe(
      "{from}–{to} of more than {to}",
    );
  });
});

describe("createGridDebounce", () => {
  it("runs at once without a delay", () => {
    const fn = vi.fn();
    createGridDebounce().run("a", 0, fn);
    expect(fn).toHaveBeenCalledOnce();
  });
  it("runs the last call after the delay, per key", () => {
    vi.useFakeTimers();
    const debounce = createGridDebounce();
    const a = vi.fn();
    const b = vi.fn();
    const other = vi.fn();
    debounce.run("key", 100, a);
    debounce.run("key", 100, b);
    debounce.run("other", 100, other);
    vi.advanceTimersByTime(99);
    expect(b).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();
    expect(other).toHaveBeenCalledOnce();
  });
  it("clear drops waiting runs", () => {
    vi.useFakeTimers();
    const debounce = createGridDebounce();
    const fn = vi.fn();
    debounce.run("key", 100, fn);
    debounce.clear();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });
});
