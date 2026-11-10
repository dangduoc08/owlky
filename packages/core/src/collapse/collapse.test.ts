import { afterEach, describe, expect, it, vi } from "vitest";
import { collapseAttributes, parseCollapseEasing } from "../anatomy/anatomy.js";
import { cleanupDom, mount } from "../test-utils.js";
import {
  autoCollapseDuration,
  type CollapsePhase,
  collapseStyle,
  createCollapseController,
  readCollapseEasing,
  readCollapseOptions,
  readCollapseTimeout,
} from "./collapse.js";

/** The parts of collapse.css the controller depends on (core tests don't load the styles). */
const CSS = `
[data-ok-collapse] {
  --_ok-collapse-duration: 300ms;
  --_ok-collapse-easing: cubic-bezier(0.4, 0, 0.2, 1);
  --_ok-collapse-reduce: 0;
  --_ok-collapsed-size: initial;
  --_ok-collapse-closed-display: initial;
  --sample-easing: cubic-bezier(0, 0, 0.2, 1);
}
.list { display: flex; flex-direction: column; }
[data-ok-collapse][hidden] { display: var(--_ok-collapse-closed-display, none); overflow: hidden; }
[data-ok-collapse][hidden]:not([data-ok-state]) { height: var(--_ok-collapsed-size, 0); }
[data-ok-collapse][data-ok-state] { overflow: hidden; }
`;

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function setup(attributes = "", content = '<div style="height: 120px; width: 80px"></div>') {
  const host = mount(`<style>${CSS}</style><div data-ok-collapse ${attributes}>${content}</div>`);
  return host.querySelector("[data-ok-collapse]") as HTMLElement;
}

/** Records every phase reported, in order. */
function recorder() {
  const phases: CollapsePhase[] = [];
  const callbacks = {
    onEnter: () => phases.push("enter"),
    onEntering: () => phases.push("entering"),
    onEntered: () => phases.push("entered"),
    onExit: () => phases.push("exit"),
    onExiting: () => phases.push("exiting"),
    onExited: () => phases.push("exited"),
  };
  return { phases, callbacks };
}

afterEach(() => {
  cleanupDom();
  vi.restoreAllMocks();
});

describe("autoCollapseDuration", () => {
  it("grows with the distance, from 0 up to 3s", () => {
    expect(autoCollapseDuration(0)).toBe(0);
    expect(autoCollapseDuration(-5)).toBe(0);
    expect(autoCollapseDuration(Number.NaN)).toBe(0);
    expect(autoCollapseDuration(36)).toBe(192);
    expect(autoCollapseDuration(120)).toBeGreaterThan(autoCollapseDuration(36));
    expect(autoCollapseDuration(1e6)).toBe(3000);
  });
});

describe("collapseStyle", () => {
  it("writes a collapsed size other than 0, with the closed display for the orientation", () => {
    expect(collapseStyle({ collapsedSize: 40 })).toEqual({
      "--_ok-collapsed-size": "40px",
      "--_ok-collapse-closed-display": "block",
    });
    expect(collapseStyle({ collapsedSize: "2.5rem", orientation: "horizontal" })).toEqual({
      "--_ok-collapsed-size": "2.5rem",
      "--_ok-collapse-closed-display": "flex",
    });
  });

  it("writes nothing for 0, nothing given or invalid values", () => {
    for (const collapsedSize of [undefined, 0, "0", "0px", -4, "calc(1px)", '"><img>', "1e999"])
      expect(collapseStyle({ collapsedSize })).toEqual({});
  });
});

describe("collapseAttributes", () => {
  it("writes the root, then only the options given", () => {
    expect(collapseAttributes()).toEqual({ "data-ok-collapse": "" });
    expect(
      collapseAttributes({
        orientation: "horizontal",
        collapsedSize: 40,
        timeout: 500,
        easing: "linear",
        disablePrefersReducedMotion: true,
      }),
    ).toEqual({
      "data-ok-collapse": "",
      "data-ok-orientation": "horizontal",
      "data-ok-collapsed-size": "40",
      "data-ok-timeout": "500",
      "data-ok-easing": "linear",
      "data-ok-disable-prefers-reduced-motion": "",
    });
  });

  it("writes `auto` and the exit values of objects; skips 0 sizes and invalid values", () => {
    expect(collapseAttributes({ timeout: "auto", collapsedSize: "0px" })).toEqual({
      "data-ok-collapse": "",
      "data-ok-timeout": "auto",
    });
    expect(
      collapseAttributes({
        timeout: { enter: 200, exit: 100 },
        easing: { enter: "var(--ok-easing-decelerate)", exit: "ease-in" },
      }),
    ).toEqual({
      "data-ok-collapse": "",
      "data-ok-timeout": "200",
      "data-ok-timeout-exit": "100",
      "data-ok-easing": "var(--ok-easing-decelerate)",
      "data-ok-easing-exit": "ease-in",
    });
    expect(
      collapseAttributes({
        orientation: "diagonal" as never,
        timeout: -1,
        easing: 'x;"><img onerror=alert(1)>',
        collapsedSize: 0,
      }),
    ).toEqual({ "data-ok-collapse": "" });
  });

  it("parseCollapseEasing accepts keywords and easing functions only", () => {
    expect(parseCollapseEasing(" cubic-bezier(0.4, 0, 0.2, 1) ")).toBe(
      "cubic-bezier(0.4, 0, 0.2, 1)",
    );
    expect(parseCollapseEasing("linear(0, 0.5 50%, 1)")).toBe("linear(0, 0.5 50%, 1)");
    expect(parseCollapseEasing("steps(4, end)")).toBe("steps(4, end)");
    // Shape only: the controller checks that the browser accepts it.
    expect(parseCollapseEasing("url(x)")).toBe("url(x)");
    for (const bad of [5, "a;b", "ease) red", "x".repeat(200), "a(b(c))", ""])
      expect(parseCollapseEasing(bad)).toBeUndefined();
  });
});

describe("readCollapseOptions", () => {
  it("reads every option attribute", () => {
    const element = setup(
      'data-ok-orientation="horizontal" data-ok-collapsed-size="2rem" data-ok-timeout="auto" data-ok-easing="ease-out"',
    );
    expect(readCollapseOptions(element)).toEqual({
      orientation: "horizontal",
      collapsedSize: "2rem",
      timeout: "auto",
      easing: "ease-out",
    });
  });

  it("falls back for missing or invalid values", () => {
    const element = setup(
      'data-ok-orientation="sideways" data-ok-timeout="soon" data-ok-easing="a;b"',
    );
    expect(readCollapseOptions(element)).toEqual({
      orientation: "vertical",
      collapsedSize: undefined,
      timeout: undefined,
      easing: undefined,
    });
  });

  it("combines enter and exit values", () => {
    const element = setup('data-ok-timeout="200" data-ok-timeout-exit="100"');
    expect(readCollapseTimeout(element)).toEqual({ enter: 200, exit: 100 });
    element.removeAttribute("data-ok-timeout");
    expect(readCollapseTimeout(element)).toEqual({ exit: 100 });
    element.setAttribute("data-ok-timeout-exit", "auto");
    expect(readCollapseTimeout(element)).toBe("auto");
    element.setAttribute("data-ok-easing-exit", "ease-in");
    expect(readCollapseEasing(element)).toEqual({ exit: "ease-in" });
    element.setAttribute("data-ok-easing", "linear");
    expect(readCollapseEasing(element)).toEqual({ enter: "linear", exit: "ease-in" });
  });
});

describe("createCollapseController", () => {
  it("starts from the markup's state and reports nothing", () => {
    const { phases, callbacks } = recorder();
    const open = createCollapseController(setup(), callbacks);
    const closed = createCollapseController(setup("hidden"), callbacks);
    expect(open.status).toBe("entered");
    expect(closed.status).toBe("exited");
    expect(phases).toEqual([]);
  });

  it("enter: animates the height from 0 to the content's, then rests at auto", async () => {
    const element = setup("hidden");
    const { phases, callbacks } = recorder();
    const controller = createCollapseController(element, callbacks);
    element.hidden = false;
    await settle();
    expect(phases).toEqual(["enter", "entering"]);
    expect(controller.status).toBe("entering");
    expect(element.getAttribute("data-ok-state")).toBe("entering");
    const [animation] = element.getAnimations();
    const keyframes = ((animation as Animation).effect as KeyframeEffect).getKeyframes();
    expect(keyframes.map((frame) => frame["height"])).toEqual(["0px", "120px"]);
    expect(((animation as Animation).effect as KeyframeEffect).getTiming()).toMatchObject({
      duration: 300,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
    animation?.finish();
    await settle();
    expect(phases).toEqual(["enter", "entering", "entered"]);
    expect(controller.status).toBe("entered");
    expect(element.hasAttribute("data-ok-state")).toBe(false);
    expect(element.getBoundingClientRect().height).toBe(120);
  });

  it("measures in layout px under a zoomed ancestor (a zoomed organization chart)", async () => {
    const element = setup("hidden");
    (element.parentElement as HTMLElement).style.zoom = "2";
    const controller = createCollapseController(element, recorder().callbacks);
    element.hidden = false;
    await settle();
    const [animation] = element.getAnimations();
    const keyframes = ((animation as Animation).effect as KeyframeEffect).getKeyframes();
    // The box measures 240px on screen; the keyframes are layout px, zoomed like the rest.
    expect(keyframes.map((frame) => frame["height"])).toEqual(["0px", "120px"]);
    animation?.finish();
    await settle();
    expect(element.getBoundingClientRect().height).toBe(240);
    controller.destroy();
  });

  it("exit: keeps an author display during the animation, then hides", async () => {
    const element = setup('class="list"');
    const { phases, callbacks } = recorder();
    const controller = createCollapseController(element, callbacks);
    element.hidden = true;
    await settle();
    expect(phases).toEqual(["exit", "exiting"]);
    expect(element.style.display).toBe("flex");
    expect(element.getAttribute("data-ok-state")).toBe("exiting");
    const [animation] = element.getAnimations();
    expect(
      ((animation as Animation).effect as KeyframeEffect).getKeyframes().map((f) => f["height"]),
    ).toEqual(["120px", "0px"]);
    animation?.finish();
    await settle();
    expect(phases).toEqual(["exit", "exiting", "exited"]);
    expect(controller.status).toBe("exited");
    expect(element.style.display).toBe("");
    expect(getComputedStyle(element).display).toBe("none");
  });

  it("an interruption starts from the current size", async () => {
    const element = setup("hidden");
    createCollapseController(element, { timeout: 1000, easing: "linear" });
    element.hidden = false;
    await settle();
    const [enter] = element.getAnimations();
    (enter as Animation).pause();
    (enter as Animation).currentTime = 500;
    element.hidden = true;
    await settle();
    expect(enter?.playState).toBe("idle");
    const [exit] = element.getAnimations();
    const start = ((exit as Animation).effect as KeyframeEffect).getKeyframes()[0]?.[
      "height"
    ] as string;
    expect(Number.parseFloat(start)).toBeCloseTo(60, 0);
    // Reopening before the exit ends removes the kept display.
    element.hidden = false;
    await settle();
    expect(element.style.display).toBe("");
  });

  it("collapsed size: the closed slice stays rendered, even under an important [hidden] reset", async () => {
    // Tailwind's preflight: `[hidden]:where(:not([hidden="until-found"])) { display: none !important }`.
    mount("<style>@layer base { [hidden] { display: none !important; } }</style>");
    const element = setup("");
    for (const [name, value] of Object.entries(collapseStyle({ collapsedSize: 40 })))
      element.style.setProperty(name, value);
    const controller = createCollapseController(element, { collapsedSize: 40 });
    expect(element.style.display).toBe("");
    element.hidden = true;
    await settle();
    expect(element.style.getPropertyPriority("display")).toBe("important");
    const [animation] = element.getAnimations();
    expect(
      ((animation as Animation).effect as KeyframeEffect).getKeyframes().map((f) => f["height"]),
    ).toEqual(["120px", "40px"]);
    animation?.finish();
    await settle();
    expect(controller.status).toBe("exited");
    expect(element.style.display).toBe("block");
    expect(element.getBoundingClientRect().height).toBe(40);
    // Without a collapsed size any more, it rests hidden.
    controller.update({});
    expect(element.style.display).toBe("");
    expect(getComputedStyle(element).display).toBe("none");
    // Reopening clears the written display; the next exit keeps it rendered again.
    controller.update({ collapsedSize: 40 });
    expect(element.style.display).toBe("block");
    element.hidden = false;
    await settle();
    expect(element.style.display).toBe("");
    controller.destroy();
  });

  it("collapsed size without a reset: the stylesheet keeps it rendered while it exits", async () => {
    const element = setup("");
    for (const [name, value] of Object.entries(collapseStyle({ collapsedSize: 40 })))
      element.style.setProperty(name, value);
    createCollapseController(element, { collapsedSize: 40 });
    element.hidden = true;
    await settle();
    expect(element.style.display).toBe("");
    expect(getComputedStyle(element).display).toBe("block");
  });

  it("an important [hidden] reset doesn't cut the exit short", async () => {
    mount("<style>@layer base { [hidden] { display: none !important; } }</style>");
    const element = setup('class="list"');
    createCollapseController(element);
    element.hidden = true;
    await settle();
    expect(getComputedStyle(element).display).toBe("flex");
    expect(element.getAnimations()).toHaveLength(1);
  });

  it("horizontal: animates the width", async () => {
    const element = setup('hidden style="width: fit-content"');
    createCollapseController(element, { orientation: "horizontal" });
    element.hidden = false;
    await settle();
    const [animation] = element.getAnimations();
    expect(
      ((animation as Animation).effect as KeyframeEffect).getKeyframes().map((f) => f["width"]),
    ).toEqual(["0px", "80px"]);
  });

  it("timing: numbers, auto, enter / exit objects and easings (var() resolves)", async () => {
    const element = setup("hidden");
    const controller = createCollapseController(element, {
      timeout: { enter: 120, exit: 80 },
      easing: { enter: "var(--sample-easing)", exit: "ease-in" },
    });
    element.hidden = false;
    await settle();
    let timing = ((element.getAnimations()[0] as Animation).effect as KeyframeEffect).getTiming();
    expect(timing).toMatchObject({ duration: 120, easing: "cubic-bezier(0, 0, 0.2, 1)" });
    element.hidden = true;
    await settle();
    timing = ((element.getAnimations()[0] as Animation).effect as KeyframeEffect).getTiming();
    expect(timing).toMatchObject({ duration: 80, easing: "ease-in" });
    controller.update({ timeout: "auto" });
    element.hidden = false;
    await settle();
    timing = ((element.getAnimations()[0] as Animation).effect as KeyframeEffect).getTiming();
    expect(timing.duration).toBe(autoCollapseDuration(120));
    // The written easing is removed once no easing is given.
    expect(element.style.getPropertyValue("--_ok-collapse-easing")).toBe("");
  });

  it("a duration of 0, reduced motion or no Web Animations: instant, every phase reported", async () => {
    for (const variant of ["zero", "reduce", "fallback", "css"] as const) {
      const element = setup(variant === "reduce" ? 'style="--_ok-collapse-reduce: 1"' : "");
      if (variant === "css") element.style.setProperty("--_ok-collapse-duration", "0s");
      if (variant === "fallback")
        Object.defineProperty(element, "animate", { value: undefined, configurable: true });
      const { phases, callbacks } = recorder();
      const controller = createCollapseController(element, {
        ...callbacks,
        timeout: variant === "zero" ? 0 : undefined,
      });
      element.hidden = true;
      await settle();
      expect(phases, variant).toEqual(["exit", "exiting", "exited"]);
      expect(element.getAnimations(), variant).toEqual([]);
      expect(controller.status).toBe("exited");
      expect(getComputedStyle(element).display).toBe("none");
      element.hidden = false;
      await settle();
      expect(phases.slice(3), variant).toEqual(["enter", "entering", "entered"]);
    }
  });

  it("an easing the browser rejects falls back to the stylesheet's", async () => {
    const element = setup("hidden");
    createCollapseController(element, { easing: "bounce(2)" });
    element.hidden = false;
    await settle();
    const timing = ((element.getAnimations()[0] as Animation).effect as KeyframeEffect).getTiming();
    expect(timing.easing).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
    expect(element.style.getPropertyValue("--_ok-collapse-easing")).toBe("");
  });

  it("an unreadable duration counts as 0", async () => {
    for (const duration of ["soon", "1.2.3ms", "-5ms"]) {
      const element = setup(`style="--_ok-collapse-duration: ${duration}"`);
      const { phases, callbacks } = recorder();
      createCollapseController(element, callbacks);
      element.hidden = true;
      await settle();
      expect(phases, duration).toEqual(["exit", "exiting", "exited"]);
    }
  });

  it("without the stylesheet: the browser's default easing, a block display while exiting", async () => {
    const host = mount('<div id="bare" style="display: none"><p style="height: 30px"></p></div>');
    const element = host.querySelector("#bare") as HTMLElement;
    const controller = createCollapseController(element, { timeout: 100, collapsedSize: "0.5rem" });
    // Created while not rendered: no display to remember.
    element.style.display = "";
    element.hidden = true;
    await settle();
    expect(element.style.display).toBe("block");
    const effect = (element.getAnimations()[0] as Animation).effect as KeyframeEffect;
    expect(effect.getTiming().easing).toBe("ease");
    expect(effect.getKeyframes().map((f) => f["height"])).toEqual(["30px", "0.5rem"]);
    controller.destroy();
  });

  it("a finish that lands after the next change doesn't settle it", async () => {
    const element = setup("hidden");
    createCollapseController(element, { easing: "linear" });
    element.hidden = false;
    await settle();
    const [first] = element.getAnimations();
    element.hidden = true;
    first?.finish();
    await settle();
    expect(element.getAttribute("data-ok-state")).toBe("exiting");
  });

  it("ignores other attributes and repeated values", async () => {
    const element = setup();
    const { phases, callbacks } = recorder();
    createCollapseController(element, callbacks);
    element.setAttribute("hidden", "");
    await settle();
    element.setAttribute("hidden", "until-found");
    element.title = "x";
    await settle();
    expect(phases).toEqual(["exit", "exiting"]);
  });

  it("update replaces the callbacks", async () => {
    const element = setup("hidden");
    const first = vi.fn();
    const second = vi.fn();
    const controller = createCollapseController(element, { onEnter: first, timeout: 0 });
    controller.update({ onEnter: second, timeout: 0 });
    element.hidden = false;
    await settle();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(element);
  });

  it("destroy ends a running animation without reporting, and stops watching", async () => {
    const element = setup('class="list"');
    const { phases, callbacks } = recorder();
    const controller = createCollapseController(element, { ...callbacks, easing: "linear" });
    element.hidden = true;
    await settle();
    controller.destroy();
    expect(element.getAnimations()).toEqual([]);
    expect(element.style.display).toBe("");
    expect(element.style.getPropertyValue("--_ok-collapse-easing")).toBe("");
    expect(element.hasAttribute("data-ok-state")).toBe(false);
    expect(controller.status).toBe("exited");
    element.hidden = false;
    await settle();
    expect(phases).toEqual(["exit", "exiting"]);
    // Destroying an idle controller is safe.
    createCollapseController(setup()).destroy();
  });

  it("a replaced animation never settles the new one", async () => {
    const element = setup("hidden");
    createCollapseController(element, { easing: "linear" });
    element.hidden = false;
    await settle();
    const finished = element.getAnimations()[0]?.finished;
    element.hidden = true;
    await settle();
    await expect(finished).rejects.toThrow();
    expect(element.getAttribute("data-ok-state")).toBe("exiting");
  });
});
