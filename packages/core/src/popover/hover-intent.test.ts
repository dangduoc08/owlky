import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHoverIntent } from "./hover-intent.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const setup = (options = {}) => {
  const onOpenChange = vi.fn();
  return { intent: createHoverIntent({ onOpenChange, ...options }), onOpenChange };
};

describe("createHoverIntent", () => {
  it("mouse: opens after enterDelay (100), closes after leaveDelay (0) + 100 ms grace", () => {
    const { intent, onOpenChange } = setup();
    intent.enter("mouse");
    vi.advanceTimersByTime(99);
    expect(onOpenChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(intent.open).toBe(true);
    intent.leave();
    vi.advanceTimersByTime(99);
    expect(intent.open).toBe(true);
    vi.advanceTimersByTime(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("leaving before the delay cancels; entering the tooltip keeps it open", () => {
    const { intent, onOpenChange } = setup({ leaveDelay: 200 });
    intent.enter();
    intent.leave();
    vi.advanceTimersByTime(500);
    expect(onOpenChange).not.toHaveBeenCalled();
    intent.enter();
    vi.advanceTimersByTime(100);
    intent.leave();
    intent.enterTooltip();
    vi.advanceTimersByTime(500);
    expect(intent.open).toBe(true);
    intent.leave();
    vi.advanceTimersByTime(300);
    expect(intent.open).toBe(false);
  });

  it("focus opens at once and holds; blur and hide close", () => {
    const { intent, onOpenChange } = setup();
    intent.focus();
    intent.focus();
    expect(intent.open).toBe(true);
    intent.leave();
    expect(intent.open).toBe(true);
    intent.blur();
    expect(intent.open).toBe(false);
    intent.focus();
    intent.hide();
    expect(intent.open).toBe(false);
    intent.enterTooltip();
    expect(onOpenChange).toHaveBeenCalledTimes(4);
  });

  it("touch: ignores touch hover; a long press opens, release closes later", () => {
    const { intent } = setup();
    intent.enter("touch");
    vi.advanceTimersByTime(1000);
    expect(intent.open).toBe(false);
    intent.touchStart();
    intent.touchEnd();
    vi.advanceTimersByTime(1000);
    expect(intent.open).toBe(false);
    intent.touchStart();
    vi.advanceTimersByTime(700);
    expect(intent.open).toBe(true);
    intent.touchEnd();
    vi.advanceTimersByTime(1499);
    expect(intent.open).toBe(true);
    vi.advanceTimersByTime(1);
    expect(intent.open).toBe(false);
  });

  it("setOptions and destroy", () => {
    const { intent, onOpenChange } = setup();
    const other = vi.fn();
    intent.setOptions({ onOpenChange: other, enterDelay: 0 });
    intent.enter();
    expect(other).toHaveBeenCalledWith(true);
    intent.setOptions({ onOpenChange: other, leaveDelay: 50 });
    intent.leave();
    intent.destroy();
    vi.advanceTimersByTime(500);
    expect(intent.open).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
