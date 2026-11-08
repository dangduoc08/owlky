import { afterEach, describe, expect, it, vi } from "vitest";
import { countUpText, createCountUp, easeOutCubic, prefersReducedMotion } from "./count-up.js";

afterEach(() => vi.unstubAllGlobals());

describe("count up", () => {
  it("eases out and formats with decimals; progress is clamped", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBe(0.875);
    expect(countUpText(0, 200, 0, 0)).toBe("0");
    expect(countUpText(0, 200, 0.5, 0)).toBe("175");
    expect(countUpText(0, 200, 2, 0)).toBe("200");
    expect(countUpText(10, 0, -1, 1)).toBe("10.0");
  });

  it("counts frame by frame to the end", async () => {
    const texts: string[] = [];
    const done = new Promise<void>((resolve) => {
      const counter = createCountUp({
        start: 0,
        end: 50,
        duration: 120,
        decimals: 0,
        onUpdate(text) {
          texts.push(text);
          if (text === "50") resolve();
        },
      });
      counter.run();
    });
    await done;
    expect(texts[0]).toBe("0");
    expect(texts.length).toBeGreaterThan(2);
    expect(texts.at(-1)).toBe("50");
  });

  it("no duration or reduced motion: the end at once; destroy stops", () => {
    const onUpdate = vi.fn();
    createCountUp({ start: 0, end: 7, duration: 0, decimals: 0, onUpdate }).run();
    expect(onUpdate.mock.calls).toEqual([["7"]]);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    expect(prefersReducedMotion()).toBe(true);
    const reduced = vi.fn();
    createCountUp({ start: 0, end: 3, duration: 1000, decimals: 0, onUpdate: reduced }).run();
    expect(reduced.mock.calls).toEqual([["3"]]);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const stopped = vi.fn();
    const counter = createCountUp({
      start: 0,
      end: 3,
      duration: 1000,
      decimals: 0,
      onUpdate: stopped,
    });
    counter.run();
    counter.destroy();
    expect(stopped.mock.calls).toEqual([["0"]]);
    vi.stubGlobal("matchMedia", undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});
