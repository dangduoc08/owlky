import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  createWalktourController as create,
  type WalktourController,
  type WalktourControllerOptions,
} from "./walktour-controller.js";
import type { WalktourState } from "./walktour-model.js";

const controllers: WalktourController[] = [];
const createWalktourController = (root: HTMLElement, options?: WalktourControllerOptions) => {
  const controller = create(root, options);
  controllers.push(controller);
  return controller;
};

// Minimal CSS: the library stylesheet isn't loaded in core tests.
const CSS = `<style>
  [data-ok-walktour-step] { position: fixed; inset: auto; margin: 0; padding: 0; border: 0;
    width: 200px; height: 100px; left: var(--_ok-popover-x); top: var(--_ok-popover-y); }
  [data-ok-walktour-step]:not([data-ok-open]) { display: none; }
  [data-ok-walktour-step][data-ok-open] { display: block; }
  [data-ok-walktour-overlay] { position: fixed; inset: 0; margin: 0; padding: 0; border: 0;
    width: auto; height: auto; background: transparent; pointer-events: none; }
  [data-ok-walktour-overlay] > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  [data-ok-walktour-mask] { pointer-events: auto; fill: rgb(0 0 0 / 0.5); }
  [data-ok-walktour-hole] { pointer-events: auto; fill: transparent; }
  [data-ok-spotlight-clicks] [data-ok-walktour-hole] { pointer-events: none; }
  [data-ok-walktour-beacon] { position: fixed; width: 36px; height: 36px; margin: -18px 0 0 -18px;
    left: var(--_ok-walktour-beacon-x); top: var(--_ok-walktour-beacon-y); }
  [hidden] { display: none !important; }
</style>`;

const step = (index: number, attributes: string) => `
  <div popover="manual" data-ok-walktour-step data-ok-arrow ${attributes} role="dialog" aria-label="Step ${index + 1}">
    <span data-ok-popover-arrow></span>
    <button type="button" data-ok-walktour-action="close">Close</button>
    <input aria-label="Field ${index + 1}">
    <button type="button" data-ok-walktour-action="skip">Skip</button>
    <button type="button" data-ok-walktour-action="back">Back</button>
    <button type="button" data-ok-walktour-action="primary">Next<span data-ok-walktour-progress> (${index + 1}/3)</span></button>
  </div>`;

function setup(
  rootAttributes = "data-ok-continuous",
  steps = [
    'data-ok-target="#t1" data-ok-placement="bottom"',
    'data-ok-target="#t2" data-ok-placement="right"',
    'data-ok-placement="center"',
  ],
  options: WalktourControllerOptions = {},
) {
  mount(`${CSS}
    <button id="before">Before</button>
    <div id="t1" style="position: fixed; left: 100px; top: 100px; width: 100px; height: 50px">One</div>
    <div id="t2" style="position: fixed; left: 400px; top: 300px; width: 100px; height: 50px">Two</div>
    <div id="tour" data-ok-walktour ${rootAttributes}>
      <div data-ok-walktour-overlay popover="manual" aria-hidden="true">
        <svg data-ok-walktour-spotlight><path data-ok-walktour-mask fill-rule="evenodd"></path><path data-ok-walktour-hole></path></svg>
      </div>
      <button type="button" data-ok-walktour-beacon aria-label="Open the dialog" hidden><span></span></button>
      ${steps.map((attributes, index) => step(index, attributes)).join("")}
      <span data-ok-walktour-live data-ok-format="Étape {current} sur {total}"></span>
    </div>`);
  const root = document.getElementById("tour") as HTMLElement;
  const onIntent = vi.fn();
  const controller = createWalktourController(root, { onIntent, ...options });
  const steps$ = () => Array.from(root.querySelectorAll<HTMLElement>("[data-ok-walktour-step]"));
  const overlay = root.querySelector("[data-ok-walktour-overlay]") as HTMLElement;
  const beacon = root.querySelector("[data-ok-walktour-beacon]") as HTMLButtonElement;
  const mask = root.querySelector("[data-ok-walktour-mask]") as SVGPathElement;
  const hole = root.querySelector("[data-ok-walktour-hole]") as SVGPathElement;
  const action = (index: number, name: string) =>
    steps$()[index]?.querySelector(`[data-ok-walktour-action="${name}"]`) as HTMLButtonElement;
  return { root, controller, onIntent, steps: steps$, overlay, beacon, mask, hole, action };
}

const state = (
  index: number,
  lifecycle: WalktourState["lifecycle"] = "tooltip",
  status: WalktourState["status"] = "running",
): WalktourState => ({ status, index, lifecycle, action: "next", origin: "api" });

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  cleanupDom();
});

describe.each([
  ["native", false],
  ["fallback", true],
])("createWalktourController (%s)", (_, forceFallback) => {
  it("shows a step: the tooltip next to its target, the overlay with a spotlight, focus inside", () => {
    const { root, controller, steps, overlay, mask, hole, action } = setup(
      "data-ok-continuous data-ok-spotlight-padding='10'",
      undefined,
      { forceFallback },
    );
    document.getElementById("before")?.focus();
    controller.render(state(0));
    const [first, second] = steps();
    expect(first?.hasAttribute("data-ok-open")).toBe(true);
    expect(second?.hasAttribute("data-ok-open")).toBe(false);
    expect(first?.getAttribute("data-ok-current-placement")).toBe("bottom");
    expect(first?.getAttribute("aria-modal")).toBe("true");
    expect(root.getAttribute("data-ok-status")).toBe("running");
    expect(overlay.hasAttribute("data-ok-open")).toBe(true);
    if (forceFallback) {
      expect(overlay.hasAttribute("data-ok-fallback")).toBe(true);
      expect(overlay.matches(":popover-open")).toBe(false);
    } else {
      expect(overlay.matches(":popover-open")).toBe(true);
      expect(first?.matches(":popover-open")).toBe(true);
    }
    // Target 100,100 100×50 + 10px padding, radius 16.
    expect(hole.getAttribute("d")).toMatch(/^M106 90H194A16 16/);
    expect(mask.getAttribute("d")).toMatch(/^M0 0H\d+V\d+H0Z M106 90/);
    expect(mask.getAttribute("fill-rule")).toBe("evenodd");
    // Below the target: spotlight bottom (160) + the 20px gap.
    expect(first?.getBoundingClientRect().top).toBeCloseTo(180, 0);
    expect(document.activeElement).toBe(action(0, "primary"));
    expect(root.querySelector("[data-ok-walktour-live]")?.textContent).toBe("Étape 1 sur 3");
  });

  it("hides what the options turn off", () => {
    const { controller, action, steps } = setup("data-ok-continuous", undefined, {
      forceFallback,
    });
    controller.render(state(0));
    expect(action(0, "back").hidden).toBe(true); // first step
    expect(action(0, "skip").hidden).toBe(true); // no showSkipButton
    expect(action(0, "close").hidden).toBe(false);
    const progress = steps()[0]?.querySelector("[data-ok-walktour-progress]") as HTMLElement;
    expect(progress.hidden).toBe(true);
  });

  it("closes the previous step when the next one opens, and returns focus at the end", () => {
    const { controller, steps, overlay, beacon } = setup("data-ok-continuous", undefined, {
      forceFallback,
    });
    const before = document.getElementById("before") as HTMLButtonElement;
    before.focus();
    controller.render(state(0));
    controller.render(state(1));
    expect(steps()[0]?.hasAttribute("data-ok-open")).toBe(false);
    expect(steps()[1]?.hasAttribute("data-ok-open")).toBe(true);
    // No room on the right of the 414px test page: flipped to the left.
    expect(steps()[1]?.getAttribute("data-ok-current-placement")).toBe("left");
    controller.render(state(1, "tooltip", "finished"));
    expect(steps()[1]?.hasAttribute("data-ok-open")).toBe(false);
    expect(overlay.hasAttribute("data-ok-open")).toBe(false);
    expect(beacon.hidden).toBe(true);
    expect(document.activeElement).toBe(before);
  });
});

describe("createWalktourController", () => {
  it("renders nothing while idle", () => {
    const { root, controller, steps, overlay, beacon } = setup();
    controller.render(state(0, "beacon", "idle"));
    expect(steps().some((element) => element.hasAttribute("data-ok-open"))).toBe(false);
    expect(overlay.hasAttribute("data-ok-open")).toBe(false);
    expect(beacon.hidden).toBe(true);
    expect(root.hasAttribute("data-ok-status")).toBe(false);
    // A step that doesn't exist renders nothing either.
    controller.render(state(9));
    expect(steps().some((element) => element.hasAttribute("data-ok-open"))).toBe(false);
  });

  it("shows the progress, the skip button and the back button when the options ask", () => {
    const { controller, action, steps } = setup(
      "data-ok-continuous data-ok-show-progress data-ok-show-skip-button",
    );
    controller.render(state(1));
    const progress = (index: number) =>
      steps()[index]?.querySelector("[data-ok-walktour-progress]") as HTMLElement;
    expect(progress(1).hidden).toBe(false);
    expect(action(1, "skip").hidden).toBe(false);
    expect(action(1, "back").hidden).toBe(false);
    // The last step has no skip button and no progress.
    controller.render(state(2));
    expect(progress(2).hidden).toBe(true);
    expect(action(2, "skip").hidden).toBe(true);
  });

  it("lets a step override the tour's options, and sets its width", () => {
    const { controller, action, steps } = setup("data-ok-continuous data-ok-show-skip-button", [
      'data-ok-target="#t1" data-ok-show-skip-button="false" data-ok-hide-close-button data-ok-width="420"',
      'data-ok-target="#t2" data-ok-hide-back-button data-ok-width="nope"',
    ]);
    controller.render(state(0));
    expect(action(0, "skip").hidden).toBe(true);
    expect(action(0, "close").hidden).toBe(true);
    expect(steps()[0]?.style.getPropertyValue("--_ok-walktour-width")).toBe("420px");
    controller.render(state(1));
    expect(action(1, "back").hidden).toBe(true);
    expect(steps()[1]?.style.getPropertyValue("--_ok-walktour-width")).toBe("");
  });

  it("centers a step without a target and draws no cut-out", () => {
    const { controller, steps, mask, hole } = setup();
    controller.render(state(2));
    const centered = steps()[2] as HTMLElement;
    expect(centered.hasAttribute("data-ok-centered")).toBe(true);
    expect(hole.getAttribute("d")).toBe("");
    expect(mask.getAttribute("d")).toMatch(/^M0 0H\d+V\d+H0Z$/);
    controller.render(state(0));
    expect(centered.hasAttribute("data-ok-centered")).toBe(false);
  });

  it("treats the page itself as a centered target, even with auto placement", () => {
    const { controller, steps } = setup("", ['data-ok-target="body" data-ok-placement="auto"']);
    controller.render(state(0));
    expect(steps()[0]?.hasAttribute("data-ok-centered")).toBe(true);
    controller.update();
    expect(steps()[0]?.hasAttribute("data-ok-open")).toBe(true);
  });

  it("keeps an open step (and its focus) when the same state renders again, and reopens it later", () => {
    const { controller, steps, action } = setup();
    controller.render(state(0));
    const input = steps()[0]?.querySelector("input") as HTMLInputElement;
    input.focus();
    controller.render(state(0));
    expect(document.activeElement).toBe(input);
    controller.render(state(1));
    controller.render(state(0));
    expect(steps()[0]?.hasAttribute("data-ok-open")).toBe(true);
    expect(document.activeElement).toBe(action(0, "primary"));
  });

  it("announces the step with the default text without a format", () => {
    const { root, controller } = setup();
    root.querySelector("[data-ok-walktour-live]")?.removeAttribute("data-ok-format");
    controller.render(state(1));
    expect(root.querySelector("[data-ok-walktour-live]")?.textContent).toBe("Step 2 of 3");
  });

  it("isn't modal with spotlight clicks or without an overlay", async () => {
    const { controller, steps, overlay, hole } = setup("data-ok-continuous", [
      'data-ok-target="#t1" data-ok-spotlight-clicks',
      'data-ok-target="#t2" data-ok-disable-overlay',
      'data-ok-target="#t1"',
    ]);
    const outside = document.getElementById("t1") as HTMLElement;
    controller.render(state(0));
    expect(steps()[0]?.hasAttribute("aria-modal")).toBe(false);
    expect(outside.inert).toBe(false);
    expect(overlay.hasAttribute("data-ok-spotlight-clicks")).toBe(true);
    expect(getComputedStyle(hole).pointerEvents).toBe("none");
    controller.render(state(1));
    expect(steps()[1]?.hasAttribute("aria-modal")).toBe(false);
    expect(overlay.hasAttribute("data-ok-open")).toBe(false);
    // Back to a step with an overlay: the overlay opens under the step.
    controller.render(state(2));
    expect(overlay.hasAttribute("data-ok-open")).toBe(true);
    expect(overlay.hasAttribute("data-ok-spotlight-clicks")).toBe(false);
    expect(steps()[2]?.getAttribute("aria-modal")).toBe("true");
    // Modal: the page outside the tour is inert until the step closes.
    expect(outside.inert).toBe(true);
    controller.render(state(2, "beacon"));
    expect(outside.inert).toBe(false);
    controller.render(state(2));
    const box = steps()[2]?.getBoundingClientRect() as DOMRect;
    const top = document.elementFromPoint(box.x + 5, box.y + 50);
    expect(steps()[2]?.contains(top)).toBe(true);
  });

  it("shows the beacon on the target and moves focus to it when a step closes to it", () => {
    const { controller, beacon, overlay, steps } = setup();
    controller.render(state(0, "beacon"));
    expect(beacon.hidden).toBe(false);
    expect(overlay.hasAttribute("data-ok-open")).toBe(false);
    // Bottom placement: the middle of the target's bottom edge.
    expect(beacon.style.getPropertyValue("--_ok-walktour-beacon-x")).toBe("150px");
    expect(beacon.style.getPropertyValue("--_ok-walktour-beacon-y")).toBe("150px");
    // The tour started with a beacon: focus stays where it was.
    expect(document.activeElement).not.toBe(beacon);
    controller.render(state(0));
    expect(beacon.hidden).toBe(true);
    expect(steps()[0]?.contains(document.activeElement)).toBe(true);
    controller.render(state(1, "beacon"));
    expect(beacon.hidden).toBe(false);
    expect(beacon.style.getPropertyValue("--_ok-walktour-beacon-x")).toBe("500px");
    expect(document.activeElement).toBe(beacon);
  });

  it("puts a beacon of a centered or auto step below its target", () => {
    const { controller, beacon } = setup("", [
      'data-ok-target="#t1" data-ok-placement="auto"',
      'data-ok-placement="center"',
    ]);
    controller.render(state(0, "beacon"));
    expect(beacon.style.getPropertyValue("--_ok-walktour-beacon-y")).toBe("150px");
    controller.render(state(1, "beacon"));
    expect(beacon.hidden).toBe(false);
  });

  it("reports the buttons, Escape, the overlay and the beacon as intents", async () => {
    const { controller, onIntent, action, mask, beacon, steps } = setup(
      "data-ok-continuous data-ok-show-skip-button",
    );
    controller.render(state(1));
    action(1, "primary").click();
    action(1, "back").click();
    action(1, "skip").click();
    action(1, "close").click();
    expect(onIntent.mock.calls).toEqual([
      ["next", "primary"],
      ["prev", "back"],
      ["skip", "skip"],
      ["close", "close"],
    ]);
    onIntent.mockClear();
    mask.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onIntent).toHaveBeenCalledWith("close", "overlay");
    onIntent.mockClear();
    await userEvent.keyboard("{Escape}");
    expect(onIntent).toHaveBeenCalledWith("close", "escape");
    onIntent.mockClear();
    // Not a control, an unknown action, an unavailable control, or a control of another step:
    // nothing.
    steps()[1]?.querySelector("input")?.click();
    action(1, "skip").setAttribute("data-ok-walktour-action", "toString");
    steps()[1]?.querySelector<HTMLElement>('[data-ok-walktour-action="toString"]')?.click();
    action(1, "primary").setAttribute("aria-disabled", "true");
    action(1, "primary").click();
    action(0, "primary").click();
    expect(onIntent).not.toHaveBeenCalled();
    controller.render(state(1, "beacon"));
    beacon.click();
    expect(onIntent).toHaveBeenCalledWith("open", "beacon");
  });

  it("asks to close (not to move on) from the primary button of a non-continuous tour", () => {
    const { controller, onIntent, action } = setup("");
    controller.render(state(0));
    action(0, "primary").click();
    expect(onIntent).toHaveBeenCalledWith("close", "primary");
  });

  it("ignores Escape and overlay clicks the options turn off, and clicks while not running", async () => {
    const { controller, onIntent, mask, action } = setup(
      "data-ok-continuous data-ok-disable-close-on-esc data-ok-disable-overlay-close",
    );
    controller.render(state(0));
    await userEvent.keyboard("{Escape}");
    mask.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    controller.render(state(0, "tooltip", "paused"));
    action(0, "primary").click();
    expect(onIntent).not.toHaveBeenCalled();
  });

  it("keeps Tab inside a modal step only", async () => {
    const { controller, action, steps } = setup("data-ok-continuous", [
      'data-ok-target="#t1"',
      'data-ok-target="#t2" data-ok-spotlight-clicks',
    ]);
    controller.render(state(0));
    expect(document.activeElement).toBe(action(0, "primary"));
    await userEvent.keyboard("{Tab}");
    // Wraps to the first tabbable (close; back and skip are hidden).
    expect(document.activeElement).toBe(action(0, "close"));
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(action(0, "primary"));
    controller.render(state(1));
    expect(steps()[1]?.contains(document.activeElement)).toBe(true);
    // Non-modal: the keydown passes through untouched.
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    action(1, "primary").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("focuses the first control when the primary button is hidden", () => {
    const { controller, steps } = setup("data-ok-continuous", [
      'data-ok-target="#t1" data-ok-hide-close-button',
    ]);
    const primary = steps()[0]?.querySelector('[data-ok-walktour-action="primary"]');
    primary?.remove();
    controller.render(state(0));
    expect(document.activeElement).toBe(steps()[0]?.querySelector("input"));
  });

  it("reads the context: size, continuous, beacons and available targets", () => {
    const { controller } = setup("data-ok-disable-beacon", [
      'data-ok-target="#t1"',
      'data-ok-target="#missing" data-ok-disable-beacon="false"',
      'data-ok-target="[[invalid"',
      'data-ok-placement="center"',
      `data-ok-target="${"x".repeat(600)}"`,
    ]);
    const context = controller.context();
    expect(context.size).toBe(5);
    expect(context.continuous).toBe(false);
    expect(context.disableBeacon(0)).toBe(true);
    expect(context.disableBeacon(1)).toBe(false);
    expect([0, 1, 2, 3, 4, 5].map((index) => context.available?.(index))).toEqual([
      true,
      false,
      false,
      true,
      false,
      false,
    ]);
    expect(controller.steps).toHaveLength(5);
  });

  it("resolves targets through the owner when it knows them", () => {
    const resolveTarget = vi.fn((_: HTMLElement, index: number) =>
      index === 0 ? document.getElementById("t2") : index === 1 ? null : undefined,
    );
    const { controller, steps } = setup("", undefined, { resolveTarget });
    const context = controller.context();
    expect(context.available?.(0)).toBe(true);
    expect(context.available?.(1)).toBe(false);
    controller.render(state(0));
    // Anchored below #t2 (bottom 350 + padding 10 + gap 20), not the attribute's #t1.
    expect(steps()[0]?.getBoundingClientRect().top).toBeCloseTo(380, 0);
    // A detached element is no target.
    const detached = document.createElement("div");
    resolveTarget.mockImplementation(() => detached);
    expect(controller.context().available?.(0)).toBe(false);
  });

  it("puts an auto step on the side with the most room", () => {
    const { controller, steps } = setup("", ['data-ok-target="#t2" data-ok-placement="auto"']);
    controller.render(state(0));
    expect(steps()[0]?.getAttribute("data-ok-current-placement")).toMatch(
      /^(bottom|top|left|right)$/,
    );
  });

  it("follows the target when it moves or the window resizes", async () => {
    const { controller, hole, beacon } = setup();
    controller.render(state(0));
    const before = hole.getAttribute("d");
    const target = document.getElementById("t1") as HTMLElement;
    target.style.left = "200px";
    window.dispatchEvent(new Event("resize"));
    await nextFrame();
    expect(hole.getAttribute("d")).not.toBe(before);
    controller.update();
    controller.render(state(0, "beacon"));
    target.style.left = "300px";
    window.dispatchEvent(new Event("scroll"));
    await nextFrame();
    expect(beacon.style.getPropertyValue("--_ok-walktour-beacon-x")).toBe("350px");
  });

  describe("scrolling", () => {
    const tall = (rootAttributes: string, stepAttributes = "") => {
      const result = setup(rootAttributes, [
        'data-ok-target="#t1"',
        `data-ok-target="#far" ${stepAttributes}`,
      ]);
      const far = document.createElement("div");
      far.id = "far";
      far.style.cssText = "position: absolute; top: 3000px; left: 10px; width: 50px; height: 50px";
      document.body.append(far);
      const scrollTo = vi.spyOn(document.documentElement, "scrollTo");
      return { ...result, scrollTo, far };
    };

    it("scrolls a target out of view into view, keeping the scroll offset above it", () => {
      const { controller, scrollTo } = tall("data-ok-scroll-offset='40'");
      controller.render(state(1));
      expect(scrollTo).toHaveBeenCalledTimes(1);
      const top = (scrollTo.mock.calls[0] as unknown as [ScrollToOptions])[0].top as number;
      // Target top 3000 − padding 10 − offset 40.
      expect(top).toBeCloseTo(2950, 0);
    });

    it("doesn't scroll for the first step unless asked, nor with scrolling disabled", () => {
      const first = tall("");
      first.far.id = "t1-far";
      document.getElementById("t1")?.setAttribute("style", "position: absolute; top: 3000px");
      first.controller.render(state(0));
      expect(first.scrollTo).not.toHaveBeenCalled();
      first.controller.render(state(1, "tooltip", "idle"));
      first.controller.destroy();
      cleanupDom();
      const disabled = tall("", "data-ok-disable-scrolling");
      disabled.controller.render(state(1));
      expect(disabled.scrollTo).not.toHaveBeenCalled();
    });

    it("scrolls the first step with scrollToFirstStep, and a scrolling container", () => {
      mount(`${CSS}
        <div id="box" style="height: 200px; overflow: auto">
          <div style="height: 1000px"></div><div id="deep" style="height: 40px">Deep</div>
        </div>
        <div id="tour" data-ok-walktour data-ok-scroll-to-first-step>
          ${step(0, 'data-ok-target="#deep" data-ok-placement="top"')}
        </div>`);
      const box = document.getElementById("box") as HTMLElement;
      const scrollTo = vi.spyOn(box, "scrollTo");
      const controller = createWalktourController(document.getElementById("tour") as HTMLElement);
      controller.render(state(0));
      expect(scrollTo).toHaveBeenCalledTimes(1);
    });

    it("scrolls at once with reduced motion", () => {
      const reduced = vi
        .spyOn(window, "matchMedia")
        .mockReturnValue({ matches: true } as MediaQueryList);
      const { controller, scrollTo } = tall("");
      controller.render(state(1));
      expect((scrollTo.mock.calls[0] as unknown as [ScrollToOptions])[0].behavior).toBe("instant");
      reduced.mockRestore();
    });

    it("leaves a target in view where it is", () => {
      const { controller, scrollTo } = tall("data-ok-scroll-to-first-step");
      controller.render(state(0));
      expect(scrollTo).not.toHaveBeenCalled();
    });
  });

  it("works without an overlay, a beacon or a live region in the markup", () => {
    mount(`${CSS}<div id="t1">One</div>
      <div id="tour" data-ok-walktour>${step(0, 'data-ok-target="#t1"')}</div>`);
    const root = document.getElementById("tour") as HTMLElement;
    const controller = createWalktourController(root);
    controller.render(state(0));
    expect(root.querySelector("[data-ok-walktour-step]")?.hasAttribute("data-ok-open")).toBe(true);
    controller.render(state(0, "beacon"));
    controller.update();
    expect(root.querySelector("[data-ok-walktour-step]")?.hasAttribute("data-ok-open")).toBe(false);
  });

  it("takes new options, and stops working once destroyed", () => {
    const { controller, onIntent, action, steps } = setup();
    const next = vi.fn();
    controller.setOptions({ onIntent: next });
    controller.render(state(0));
    action(0, "primary").click();
    expect(next).toHaveBeenCalledWith("next", "primary");
    expect(onIntent).not.toHaveBeenCalled();
    controller.destroy();
    controller.destroy();
    expect(steps()[0]?.hasAttribute("data-ok-open")).toBe(false);
    controller.render(state(1));
    expect(steps()[1]?.hasAttribute("data-ok-open")).toBe(false);
  });
});
