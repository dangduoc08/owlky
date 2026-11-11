import { afterEach, describe, expect, it } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  animate,
  motionTracks,
  parseTime,
  resolveEasing,
  setLinearEasingSupport,
  springEasing,
  supportsLinearEasing,
} from "./animate.js";

const box = () => {
  mount(`<div id="box" style="width: 40px; height: 40px"></div>`);
  return document.getElementById("box") as HTMLElement;
};

const frames = (animation: Animation | undefined) =>
  (animation?.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
const timingOf = (animation: Animation | undefined) =>
  animation?.effect?.getTiming() as EffectTiming;

/** Ends every animation of the controls and waits for the engine to commit. */
const finish = async (controls: ReturnType<typeof animate>) => {
  for (const animation of controls.animations) animation.finish();
  await controls.finished;
};

afterEach(() => {
  setLinearEasingSupport(undefined);
  cleanupDom();
});

describe("animate", () => {
  it("animates from the current value to a target and commits the end state", async () => {
    const element = box();
    const controls = animate(element, { opacity: 0.5 }, { duration: 1000 });
    expect(controls.animations).toHaveLength(1);
    const [from, to] = frames(controls.animations[0]);
    expect(from?.["opacity"]).toBe("1");
    expect(to?.["opacity"]).toBe("0.5");
    await finish(controls);
    expect(element.style.opacity).toBe("0.5");
    expect(element.getAnimations()).toHaveLength(0);
  });

  it("maps x / y, scale and rotate to the individual transform properties with units", async () => {
    const element = box();
    const controls = animate(element, { x: [0, 100], y: 20, rotate: 90, scale: [1, 2] });
    const byProperty = Object.fromEntries(
      controls.animations.map((a) => {
        const keyframe = frames(a)[1] as Record<string, unknown>;
        const property = ["translate", "rotate", "scale"].find((name) => name in keyframe);
        return [property, keyframe[property as string]];
      }),
    );
    expect(byProperty["translate"]).toBe("100px 20px");
    expect(byProperty["rotate"]).toBe("90deg");
    expect(byProperty["scale"]).toBe("2");
    await finish(controls);
    expect(element.style.translate).toBe("100px 20px");
    expect(element.style.rotate).toBe("90deg");
    expect(element.style.scale).toBe("2");
  });

  it("merges scaleX / scaleY and keeps the other axis of translate", () => {
    const element = box();
    element.style.translate = "5px 7px";
    const tracks = motionTracks(element, { x: 10, scaleX: 2, scaleY: [1, 3], width: 80 });
    expect(tracks).toEqual([
      { property: "translate", values: [null, "10px 7px"] },
      { property: "scale", values: ["1 1", "2 3"] },
      { property: "width", values: [null, "80px"] },
    ]);
  });

  it("starts an interrupted property from its current value", () => {
    const element = box();
    const first = animate(element, { x: [0, 100] }, { duration: 1000, ease: "linear" });
    const running = first.animations[0] as Animation;
    running.pause();
    running.currentTime = 500;
    const second = animate(element, { x: 0 }, { duration: 1000 });
    expect(running.playState).toBe("idle");
    const start = frames(second.animations[0])[0]?.["translate"] as string;
    expect(Number.parseFloat(start)).toBeCloseTo(50, 0);
    second.cancel();
  });

  it("takes null keyframes as the current value", () => {
    const element = box();
    const controls = animate(element, { width: [null, 100, 60] }, { duration: 100 });
    expect(frames(controls.animations[0]).map((k) => k["width"])).toEqual([
      "40px",
      "100px",
      "60px",
    ]);
    controls.cancel();
  });

  it("applies times, an easing per segment, repeat, repeatType and repeatDelay", () => {
    const element = box();
    const controls = animate(
      element,
      { opacity: [0, 1, 0.5] },
      {
        duration: 300,
        delay: 50,
        times: [0, 0.2, 1],
        ease: ["easeIn", "decelerate"],
        repeat: 2,
        repeatType: "mirror",
        repeatDelay: 100,
      },
    );
    const animation = controls.animations[0];
    const timing = timingOf(animation);
    expect(timing.duration).toBe(400);
    expect(timing.delay).toBe(50);
    expect(timing.iterations).toBe(3);
    expect(timing.direction).toBe("alternate");
    const list = frames(animation);
    expect(list.map((k) => Number(k.offset?.toFixed(4)))).toEqual([0, 0.15, 0.75, 1]);
    // WebKit serializes the keyword equivalent.
    expect(list[0]?.easing).toMatch(/^(cubic-bezier\(0.42, 0, 1, 1\)|ease-in)$/);
    expect(list[1]?.easing).toBe("cubic-bezier(0, 0, 0.2, 1)");
    expect(list[3]?.["opacity"]).toBe("0.5");
    controls.cancel();
  });

  it("loops forever and never commits a loop", () => {
    const element = box();
    const controls = animate(element, { rotate: [0, 360] }, { repeat: Infinity, ease: "linear" });
    expect(timingOf(controls.animations[0]).iterations).toBe(Infinity);
    controls.complete();
    expect(element.getAnimations()).toHaveLength(0);
    expect(element.style.rotate).not.toBe("");
  });

  it("plays Web Animations keyframe arrays, a spring among them", async () => {
    const element = box();
    const controls = animate(element, [{ opacity: 0 }, { opacity: 1 }], {
      type: "spring",
      stiffness: 300,
      damping: 20,
    });
    const timing = timingOf(controls.animations[0]);
    expect(String(timing.easing)).toMatch(/^linear\(/);
    expect(timing.duration).toBeGreaterThan(100);
    await finish(controls);
    expect(element.style.opacity).toBe("1");
  });

  it("plays a spring on two keyframes with its own length", () => {
    const element = box();
    const controls = animate(
      element,
      { x: [0, 100] },
      { type: "spring", bounce: 0.4, duration: 500 },
    );
    const timing = timingOf(controls.animations[0]);
    expect(timing.duration).toBeGreaterThan(500);
    expect(frames(controls.animations[0])[0]?.easing).toMatch(/^linear\(/);
    controls.cancel();
  });

  it("jumps to the end with reduced motion and doesn't start loops", async () => {
    const element = box();
    const controls = animate(
      element,
      { opacity: 0.2 },
      { duration: 5000, reducedMotion: "always" },
    );
    expect(timingOf(controls.animations[0]).duration).toBe(0);
    await controls.finished;
    expect(element.style.opacity).toBe("0.2");
    const loop = animate(element, { rotate: 360 }, { repeat: Infinity, reducedMotion: "always" });
    expect(loop.animations).toHaveLength(0);
    await loop.finished;
    const never = animate(element, { opacity: 1 }, { duration: 100, reducedMotion: "never" });
    expect(timingOf(never.animations[0]).duration).toBe(100);
    never.cancel();
  });

  it("cancel drops the change, stop keeps the current value, pause and play toggle", async () => {
    const element = box();
    const cancelled = animate(element, { opacity: 0 }, { duration: 1000 });
    cancelled.cancel();
    await cancelled.finished;
    expect(element.style.opacity).toBe("");

    const stopped = animate(element, { opacity: [1, 0] }, { duration: 1000, ease: "linear" });
    const animation = stopped.animations[0] as Animation;
    stopped.pause();
    expect(animation.playState).toBe("paused");
    stopped.play();
    expect(animation.playState).toBe("running");
    animation.pause();
    animation.currentTime = 250;
    stopped.stop();
    stopped.stop();
    await stopped.finished;
    expect(Number(element.style.opacity)).toBeCloseTo(0.75, 1);

    const completed = animate(element, { opacity: 0.1 }, { duration: 1000 });
    completed.complete();
    await completed.finished;
    expect(element.style.opacity).toBe("0.1");
  });

  it("takes lists of elements and ignores nothing", async () => {
    mount(`<i class="dot"></i><i class="dot"></i>`);
    const dots = document.querySelectorAll(".dot");
    const controls = animate(dots, { opacity: 0 }, { duration: 10 });
    expect(controls.animations).toHaveLength(2);
    await finish(controls);
    const empty = animate(null, { opacity: 0 });
    expect(empty.animations).toHaveLength(0);
    await empty.finished;
  });

  it("uses the theme's tokens for the default duration and easing", () => {
    const element = box();
    document.documentElement.style.setProperty("--ok-duration-standard", "0.5s");
    const controls = animate(element, { opacity: 0 });
    expect(timingOf(controls.animations[0]).duration).toBe(500);
    controls.cancel();
  });
});

describe("springEasing", () => {
  it("samples an underdamped spring into linear() and reports the bounce", () => {
    const spring = springEasing({ stiffness: 200, damping: 8 }, { linear: true });
    expect(spring.easing).toMatch(/^linear\(0, .*, 1\)$/);
    expect(spring.bounces).toBe(true);
    expect(spring.duration).toBeGreaterThan(300);
  });

  it("handles critically damped and overdamped springs without a bounce", () => {
    const critical = springEasing({ stiffness: 100, damping: 20, mass: 1 }, { linear: true });
    expect(critical.bounces).toBe(false);
    const over = springEasing({ stiffness: 100, damping: 60, velocity: 2 }, { linear: true });
    expect(over.bounces).toBe(false);
    expect(over.duration).toBeGreaterThan(critical.duration);
  });

  it("derives stiffness from visualDuration and bounce", () => {
    const soft = springEasing({ visualDuration: 300, bounce: 0 }, { linear: true });
    const bouncy = springEasing({ visualDuration: 300, bounce: 0.6 }, { linear: true });
    expect(soft.bounces).toBe(false);
    expect(bouncy.bounces).toBe(true);
  });

  it("stops after 10 s for a spring that never rests", () => {
    expect(springEasing({ damping: 0 }, { linear: true }).duration).toBe(10_000);
  });

  it("falls back to cubic-bezier curves without linear()", () => {
    expect(springEasing({ stiffness: 200, damping: 8 }, { linear: false }).easing).toBe(
      "cubic-bezier(0.34, 1.56, 0.64, 1)",
    );
    expect(springEasing({ stiffness: 100, damping: 30 }, { linear: false }).easing).toBe(
      "cubic-bezier(0, 0, 0.2, 1)",
    );
    setLinearEasingSupport(false);
    expect(supportsLinearEasing()).toBe(false);
    const element = box();
    const controls = animate(
      element,
      { opacity: [0, 1] },
      { type: "spring", bounce: 0.5, duration: 300 },
    );
    expect(frames(controls.animations[0])[0]?.easing).toBe("cubic-bezier(0.34, 1.56, 0.64, 1)");
    controls.cancel();
    setLinearEasingSupport(undefined);
    expect(supportsLinearEasing()).toBe(true);
  });
});

describe("helpers", () => {
  it("resolves easings: tokens, Framer names, control points, invalid values", () => {
    expect(resolveEasing(undefined)).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
    expect(resolveEasing("accelerate")).toBe("cubic-bezier(0.4, 0, 1, 1)");
    expect(resolveEasing("expressive")).toBe("cubic-bezier(0.43, 0.13, 0.23, 0.96)");
    expect(resolveEasing("easeInOut")).toBe("cubic-bezier(0.42, 0, 0.58, 1)");
    expect(resolveEasing([0.1, 0.2, 0.3, 0.4])).toBe("cubic-bezier(0.1, 0.2, 0.3, 0.4)");
    expect(resolveEasing("steps(4)")).toBe("steps(4)");
    expect(resolveEasing("nonsense(")).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
  });

  it("parses CSS times", () => {
    expect(parseTime("250ms")).toBe(250);
    expect(parseTime("0.3s")).toBe(300);
    expect(parseTime("fast")).toBeUndefined();
  });
});
