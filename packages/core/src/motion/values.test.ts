import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  bindStyle,
  interpolate,
  isSharedValue,
  motionValue,
  sharedStyle,
  springValue,
  transformValue,
} from "./values.js";

afterEach(() => {
  vi.restoreAllMocks();
  cleanupDom();
});

/** Resolves once `value` rests at `target` (a frame at a time, at most 5 s). */
const settle = async (value: { get(): number; getVelocity(): number }, target: number) => {
  for (let i = 0; i < 300; i++) {
    if (value.get() === target && value.getVelocity() === 0) return;
    await nextFrame();
  }
  throw new Error(`did not settle at ${target}: ${value.get()}`);
};

describe("motionValue", () => {
  it("gets, sets and tells its listeners", () => {
    const value = motionValue(1);
    expect(isSharedValue(value)).toBe(true);
    expect(isSharedValue({ get() {} })).toBe(false);
    expect(isSharedValue(null)).toBe(false);
    const heard: number[] = [];
    const off = value.on("change", (next) => heard.push(next));
    value.set(2);
    value.set(2);
    value.jump(3);
    off();
    value.set(4);
    expect(heard).toEqual([2, 3]);
    expect(value.get()).toBe(4);
    value.stop();
    value.destroy();
    value.set(5);
    expect(heard).toEqual([2, 3]);
  });

  it("measures the velocity of numbers between the last two changes", () => {
    const now = vi.spyOn(performance, "now");
    now.mockReturnValue(1000);
    const value = motionValue(0);
    now.mockReturnValue(1100);
    value.set(10);
    expect(value.getVelocity()).toBeCloseTo(100, 6);
    now.mockReturnValue(1200);
    expect(value.getVelocity()).toBe(0);
    const text = motionValue("a");
    text.set("b");
    expect(text.getVelocity()).toBe(0);
  });
});

describe("interpolate and transformValue", () => {
  it("maps ranges segment by segment, clamped by default", () => {
    const map = interpolate([0, 100, 200], [0, 1, 0]);
    expect(map(50)).toBeCloseTo(0.5, 6);
    expect(map(150)).toBeCloseTo(0.5, 6);
    expect(map(-50)).toBe(0);
    expect(interpolate([0, 100], [0, 1], { clamp: false })(200)).toBeCloseTo(2, 6);
    expect(interpolate([0, 1], [0, 10], { ease: "ease-in" })(0.5)).toBeLessThan(5);
    expect(
      interpolate([0, 1, 2], [0, 10, 20], { ease: ["linear", "ease-out"] })(1.5),
    ).toBeGreaterThan(15);
    expect(interpolate([], [])(3)).toBe(3);
    expect(interpolate([5], [7])(3)).toBe(7);
    expect(interpolate([1, 1], [0, 9])(1)).toBe(9);
  });

  it("follows its sources", () => {
    const x = motionValue(0);
    const y = motionValue(2);
    const double = transformValue(x, (value) => value * 2);
    const sum = transformValue([x, y], ([a, b]) => (a as number) + (b as number));
    const opacity = transformValue(x, [0, 100], [1, 0]);
    x.set(50);
    expect(double.get()).toBe(100);
    expect(sum.get()).toBe(52);
    expect(opacity.get()).toBeCloseTo(0.5, 6);
    double.destroy();
    x.set(10);
    expect(double.get()).toBe(100);
    expect(sum.get()).toBe(12);
  });
});

describe("springValue", () => {
  it("animates to a new target on frames and rests there", async () => {
    const spring = springValue(0, { stiffness: 400, damping: 40, reducedMotion: "never" });
    const heard: number[] = [];
    spring.on("change", (value) => heard.push(value));
    spring.set(100);
    expect(spring.get()).toBe(0);
    await nextFrame();
    await nextFrame();
    expect(spring.get()).toBeGreaterThan(0);
    expect(spring.getVelocity()).toBeGreaterThan(0);
    await settle(spring, 100);
    expect(heard.at(-1)).toBe(100);
    expect(heard.length).toBeGreaterThan(2);
    spring.destroy();
  });

  it("follows a source value, and stops, jumps or jumps with reduced motion", async () => {
    const source = motionValue(0);
    const spring = springValue(source, { reducedMotion: "never" });
    source.set(1);
    await nextFrame();
    await nextFrame();
    const moving = spring.get();
    expect(moving).toBeGreaterThan(0);
    spring.stop();
    expect(spring.getVelocity()).toBe(0);
    await nextFrame();
    expect(spring.get()).toBe(moving);
    spring.jump(5);
    expect(spring.get()).toBe(5);
    spring.destroy();
    source.set(2);
    expect(spring.get()).toBe(5);
    const reduced = springValue(0, { reducedMotion: "always" });
    reduced.set(3);
    expect(reduced.get()).toBe(3);
    // The user's setting (default `user`).
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: query.includes("reduce"), media: query }) as MediaQueryList,
    );
    const user = springValue(0);
    user.set(2);
    expect(user.get()).toBe(2);
    vi.restoreAllMocks();
    // A new target mid-flight keeps the running spring (and its velocity).
    const retarget = springValue(0, { reducedMotion: "never" });
    retarget.set(10);
    await nextFrame();
    retarget.set(20);
    retarget.set(20);
    await settle(retarget, 20);
    // A small move uses fine rest thresholds; options override them.
    const fine = springValue(0, { reducedMotion: "never", restDelta: 0.5, restSpeed: 50 });
    fine.set(1);
    await settle(fine, 1);
  });
});

describe("bindStyle", () => {
  it("writes values through CSSOM, merging transform shorthands", () => {
    mount(`<div id="box"></div>`);
    const box = document.getElementById("box") as HTMLElement;
    const x = motionValue(10);
    const y = motionValue(20);
    const opacity = motionValue(0.5);
    const offX = bindStyle(box, "x", x);
    bindStyle(box, "y", y);
    const offOpacity = bindStyle(box, "opacity", opacity);
    bindStyle(box, "rotate", motionValue(45));
    bindStyle(box, "scaleX", motionValue(2));
    bindStyle(box, "borderRadius", motionValue(4));
    bindStyle(box, "--ok-test", motionValue("red"));
    expect(box.style.translate).toBe("10px 20px");
    expect(box.style.opacity).toBe("0.5");
    expect(box.style.rotate).toBe("45deg");
    expect(box.style.scale).toBe("2 1");
    expect(box.style.borderRadius).toBe("4px");
    expect(box.style.getPropertyValue("--ok-test")).toBe("red");
    x.set(30);
    expect(box.style.translate).toBe("30px 20px");
    offX();
    x.set(40);
    expect(box.style.translate).toBe("30px 20px");
    y.set(5);
    expect(box.style.translate).toBe("0px 5px");
    offOpacity();
    opacity.set(0.2);
    expect(box.style.opacity).toBe("0.5");
  });

  it("turns Framer-style entries into declarations", () => {
    expect(sharedStyle({ x: 5, scale: 2, width: 10, opacity: 1, rotate: "1turn" })).toEqual({
      translate: "5px 0px",
      scale: "2 2",
      width: "10px",
      opacity: "1",
      rotate: "1turn",
    });
    expect(sharedStyle({ y: "1em", scaleY: 3 })).toEqual({ translate: "0px 1em", scale: "1 3" });
  });
});
