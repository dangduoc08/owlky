import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createMotionTrigger,
  motionStyle,
  nextMotionState,
  replayMotion,
  splitMotionText,
} from "./motion.js";

afterEach(() => {
  cleanupDom();
  vi.unstubAllGlobals();
});

/** A controllable IntersectionObserver: `fire(entries)` calls the latest callback. */
function stubObserver() {
  const instances: {
    callback: IntersectionObserverCallback;
    options: IntersectionObserverInit | undefined;
    observed: Element[];
    disconnected: boolean;
  }[] = [];
  class Stub {
    record: (typeof instances)[number];
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.record = { callback, options, observed: [], disconnected: false };
      instances.push(this.record);
    }
    observe(element: Element) {
      this.record.observed.push(element);
    }
    disconnect() {
      this.record.disconnected = true;
    }
  }
  vi.stubGlobal("IntersectionObserver", Stub);
  const fire = (isIntersecting: boolean, intersectionRatio: number) => {
    const record = instances.at(-1) as (typeof instances)[number];
    record.callback(
      [{ isIntersecting, intersectionRatio } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  };
  return { instances, fire };
}

describe("motion helpers", () => {
  it("state machine: never-entered elements don't exit", () => {
    expect(nextMotionState("initial", true)).toBe("enter");
    expect(nextMotionState("initial", false)).toBe("initial");
    expect(nextMotionState("enter", false)).toBe("exit");
    expect(nextMotionState("exit", true)).toBe("enter");
    expect(nextMotionState("exit", false)).toBe("exit");
  });

  it("style: only the given values, with units", () => {
    expect(motionStyle({})).toEqual({});
    expect(motionStyle({ duration: 800, delay: 0, distance: 40, stagger: 50, index: 3 })).toEqual({
      "--_ok-motion-duration": "800ms",
      "--_ok-motion-delay": "0ms",
      "--_ok-motion-distance": "40px",
      "--_ok-motion-stagger": "50ms",
      "--_ok-motion-index": "3",
    });
  });

  it("splits text into words of letters (code points), dropping extra spaces", () => {
    expect(splitMotionText("  Hi  you ")).toEqual([
      { letters: ["H", "i"] },
      { letters: ["y", "o", "u"] },
    ]);
    expect(splitMotionText("a😀")).toEqual([{ letters: ["a", "😀"] }]);
    expect(splitMotionText("")).toEqual([]);
  });

  it("replay drops the state, flushes styles, then enters", () => {
    const host = mount("<div></div>");
    const element = host.firstElementChild as HTMLElement;
    const write = vi.fn();
    replayMotion(element, write);
    expect(write.mock.calls).toEqual([[null], ["enter"]]);
  });
});

describe("createMotionTrigger", () => {
  const element = () => mount("<div></div>").firstElementChild as HTMLElement;

  it("mount shows at once; update is ignored", () => {
    const onChange = vi.fn();
    const handle = createMotionTrigger(element(), {
      trigger: "mount",
      once: true,
      amount: 0.3,
      onChange,
    });
    expect(onChange.mock.calls).toEqual([[true]]);
    handle.update(false);
    handle.destroy();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("manual follows in (default shown) and update", () => {
    const onChange = vi.fn();
    const handle = createMotionTrigger(element(), {
      trigger: "manual",
      once: true,
      amount: 0.3,
      onChange,
    });
    handle.update(false);
    handle.update(true);
    expect(onChange.mock.calls).toEqual([[true], [false], [true]]);
    createMotionTrigger(element(), {
      trigger: "manual",
      once: true,
      amount: 0,
      in: false,
      onChange,
    });
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("in view: shows past the amount; once disconnects", () => {
    const { instances, fire } = stubObserver();
    const onChange = vi.fn();
    const target = element();
    createMotionTrigger(target, { trigger: "inView", once: true, amount: 2, onChange });
    expect(instances[0]?.observed).toEqual([target]);
    // The amount is clamped to 0–1.
    expect(instances[0]?.options?.threshold).toEqual([0, 1]);
    fire(true, 0.5);
    expect(onChange).not.toHaveBeenCalled();
    fire(true, 1);
    expect(onChange.mock.calls).toEqual([[true]]);
    expect(instances[0]?.disconnected).toBe(true);
    fire(false, 0);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("in view, not once: hides when it leaves; destroy disconnects", () => {
    const { instances, fire } = stubObserver();
    const onChange = vi.fn();
    const handle = createMotionTrigger(element(), {
      trigger: "inView",
      once: false,
      amount: -1,
      onChange,
    });
    expect(instances[0]?.options?.threshold).toEqual([0, 0]);
    fire(true, 0);
    fire(true, 0.2);
    fire(false, 0);
    expect(onChange.mock.calls).toEqual([[true], [true], [false]]);
    expect(instances[0]?.disconnected).toBe(false);
    handle.update(false);
    handle.destroy();
    expect(instances[0]?.disconnected).toBe(true);
  });

  it("without IntersectionObserver the content shows at once", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const onChange = vi.fn();
    createMotionTrigger(element(), { trigger: "inView", once: true, amount: 0.3, onChange });
    expect(onChange.mock.calls).toEqual([[true]]);
  });

  it("a real observer reports an element in the viewport", async () => {
    let handle: { destroy(): void } | undefined;
    const shown = await new Promise<boolean>((resolve) => {
      handle = createMotionTrigger(element(), {
        trigger: "inView",
        once: true,
        amount: 0,
        onChange: resolve,
      });
    });
    expect(shown).toBe(true);
    handle?.destroy();
  });
});
