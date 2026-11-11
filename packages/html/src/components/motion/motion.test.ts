import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { MotionGroupInstance } from "../motion-group/motion-group.js";
import type { MotionTextInstance } from "../motion-text/motion-text.js";
import type { MotionInstance } from "./motion.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3C/svg%3E";
/** Vitest doesn't serve Storybook's static folder. */
const local = (html: string) => html.replaceAll(/src="images\/[^"]+"/g, `src="${PIXEL}"`);

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.unstubAllGlobals();
});

const css = (element: Element) => getComputedStyle(element);
const state = (element: Element) => element.getAttribute("data-ok-state");
/** Ends the element's animations; loops (infinite) can't end and are skipped. */
const finish = (element: Element) => {
  for (const animation of element.getAnimations())
    if (animation.effect?.getComputedTiming().endTime !== Number.POSITIVE_INFINITY)
      animation.finish();
};

/** Resolves once `element` carries `data-ok-state="<value>"`. */
function stateBecomes(element: Element, value: string): Promise<void> {
  return new Promise((resolve) => {
    if (state(element) === value) return resolve();
    const observer = new MutationObserver(() => {
      if (state(element) !== value) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(element, { attributes: true, attributeFilter: ["data-ok-state"] });
  });
}

describe("motion snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(16));

  it.each(snippets)("%s: CSP-safe, no state before the runtime (nothing hidden)", (_, html) => {
    const host = mount(local(html));
    expectCspSafe(host, html);
    // The logo is an image with a name; decorative icons stay hidden.
    for (const logo of host.querySelectorAll("svg[role='img']")) {
      expect(logo.getAttribute("aria-label")).not.toBe("");
      logo.setAttribute("aria-hidden", "true");
    }
    expectNamedButtons(host);
    for (const logo of host.querySelectorAll("svg[role='img']"))
      logo.removeAttribute("aria-hidden");
    expect(host.querySelector("[data-ok-state]")).toBeNull();
    for (const element of host.querySelectorAll("[data-ok-motion]:not([data-ok-dialog-paper])"))
      expect(css(element).opacity).toBe("1");
  });

  it.each(snippets)("%s: no axe violations once animated", async (_, html) => {
    const host = mount(local(html));
    start();
    await settle();
    for (const element of host.querySelectorAll("*")) finish(element);
    await expectNoAxeViolations(host);
  });
});

describe("motion runtime", () => {
  it("writes the initial state, then enters on mount", () => {
    const host = mount(
      '<div data-ok-motion data-ok-variant="fadeInUp" data-ok-trigger="mount">A</div>' +
        '<div data-ok-motion data-ok-variant="fadeInUp" data-ok-trigger="manual">B</div>',
    );
    start();
    const [mounted, manual] = host.querySelectorAll<HTMLElement>("[data-ok-motion]");
    expect(state(mounted as Element)).toBe("enter");
    expect(state(manual as Element)).toBe("initial");
    expect(css(manual as Element).opacity).toBe("0");
    expect(runtime?.get<MotionInstance>(manual as Element, "motion")?.state).toBe("initial");
  });

  it("manual: data-ok-in plays the entrance, removing it plays the exit", async () => {
    const host = mount(
      '<div data-ok-motion data-ok-variant="zoomIn" data-ok-trigger="manual">A</div>',
    );
    start();
    const element = host.firstElementChild as HTMLElement;
    element.setAttribute("data-ok-in", "");
    await stateBecomes(element, "enter");
    element.removeAttribute("data-ok-in");
    await stateBecomes(element, "exit");
    expect(css(element).animationName).toBe("ok-motion-exit");
  });

  it("in view: enters when visible; invalid options fall back", async () => {
    const host = mount(
      '<div data-ok-motion data-ok-variant="&quot;&gt;&lt;img" data-ok-trigger="bad" data-ok-amount="x" data-ok-once="nope">A</div>',
    );
    start();
    const element = host.firstElementChild as HTMLElement;
    await stateBecomes(element, "enter");
    expect(css(element).animationName).toBe("ok-motion");
  });

  it("not once: leaves the view → exit", async () => {
    const callbacks: IntersectionObserverCallback[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          callbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    const host = mount('<div data-ok-motion data-ok-variant="fadeIn" data-ok-once="false">A</div>');
    start();
    const element = host.firstElementChild as HTMLElement;
    const fire = (isIntersecting: boolean) =>
      callbacks[0]?.(
        [
          {
            isIntersecting,
            intersectionRatio: isIntersecting ? 1 : 0,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    fire(true);
    expect(state(element)).toBe("enter");
    fire(false);
    expect(state(element)).toBe("exit");
  });

  it("viewport: margin and root reach the observer; enter / leave events on every root", () => {
    const observers: {
      callback: IntersectionObserverCallback;
      init: IntersectionObserverInit | undefined;
    }[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
          observers.push({ callback, init });
        }
        observe() {}
        disconnect() {}
      },
    );
    const host = mount(`<div id="scroller">
      <section data-ok-motion data-ok-once="false" data-ok-viewport-margin="0px 0px -100px" data-ok-viewport-root="scroller">A</section>
      <ul data-ok-motion-group data-ok-once="false" data-ok-viewport-root="missing"><li data-ok-motion>B</li></ul>
      <h2 data-ok-motion-text data-ok-once="false">C</h2>
    </div>`);
    start();
    const scroller = host.querySelector("#scroller");
    expect(observers.map(({ init }) => init)).toEqual([
      { threshold: [0, 0.3], root: scroller, rootMargin: "0px 0px -100px" },
      { threshold: [0, 0.3] },
      { threshold: [0, 0.3] },
    ]);
    const events: string[] = [];
    for (const name of [
      "ok:motion:enter",
      "ok:motion:leave",
      "ok:motion-group:enter",
      "ok:motion-text:enter",
      "ok:motion-group:leave",
      "ok:motion-text:leave",
    ])
      host.addEventListener(name, (event) =>
        events.push(`${name} ${(event as CustomEvent<{ ratio: number }>).detail.ratio}`),
      );
    const fire = (index: number, isIntersecting: boolean, intersectionRatio: number) =>
      observers[index]?.callback(
        [{ isIntersecting, intersectionRatio } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    fire(0, false, 0);
    fire(0, true, 0.5);
    fire(0, true, 1);
    fire(0, false, 0);
    fire(1, true, 0.4);
    fire(2, true, 1);
    fire(1, false, 0);
    fire(2, false, 0);
    expect(events).toEqual([
      "ok:motion:enter 0.5",
      "ok:motion:leave 0",
      "ok:motion-group:enter 0.4",
      "ok:motion-text:enter 1",
      "ok:motion-group:leave 0",
      "ok:motion-text:leave 0",
    ]);
    // The group's Motion is driven by the group: no observer, no events of its own.
    expect(observers).toHaveLength(3);
    expect(state(host.querySelector("li") as Element)).toBe("exit");
  });

  it("viewport: a real scrolling root reports leaving it", async () => {
    const host = mount(`<div id="box" style="height: 100px; overflow: auto">
      <div data-ok-motion data-ok-once="false" data-ok-amount="0" data-ok-viewport-root="box" style="height: 40px">A</div>
      <div style="height: 1000px"></div>
    </div>`);
    const element = host.querySelector("[data-ok-motion]") as HTMLElement;
    const next = (name: string) =>
      new Promise<CustomEvent>((resolve) =>
        element.addEventListener(name, (event) => resolve(event as CustomEvent), { once: true }),
      );
    const entered = next("ok:motion:enter");
    start();
    expect((await entered).detail.ratio).toBeGreaterThan(0.9);
    const left = next("ok:motion:leave");
    (host.querySelector("#box") as HTMLElement).scrollTop = 600;
    expect((await left).detail.ratio).toBe(0);
    expect(state(element)).toBe("exit");
  });

  it("tuning attributes become private properties (CSSOM); changes replay an entered Motion", async () => {
    const host = mount(
      '<div data-ok-motion data-ok-variant="slideInLeft" data-ok-trigger="mount" data-ok-duration="800" data-ok-delay="100" data-ok-distance="40">A</div>',
    );
    start();
    const element = host.firstElementChild as HTMLElement;
    expect(element.style.getPropertyValue("--_ok-motion-duration")).toBe("800ms");
    expect(element.style.getPropertyValue("--_ok-motion-delay")).toBe("100ms");
    expect(element.style.getPropertyValue("--_ok-motion-distance")).toBe("40px");
    expect(css(element).animationDuration).toBe("0.8s");
    finish(element);
    const before = element.getAnimations()[0];
    element.setAttribute("data-ok-variant", "zoomIn");
    element.removeAttribute("data-ok-delay");
    await settle();
    expect(element.style.getPropertyValue("--_ok-motion-delay")).toBe("");
    expect(state(element)).toBe("enter");
    const after = element.getAnimations()[0];
    expect(after).toBeDefined();
    expect(after).not.toBe(before);
    // Timing only: no replay (the state isn't rewritten).
    const writes: MutationRecord[] = [];
    const watcher = new MutationObserver((records) => writes.push(...records));
    watcher.observe(element, { attributes: true, attributeFilter: ["data-ok-state"] });
    element.setAttribute("data-ok-delay", "50");
    await settle();
    watcher.disconnect();
    expect(writes).toEqual([]);
    expect(element.style.getPropertyValue("--_ok-motion-delay")).toBe("50ms");
  });

  it("replay() restarts; ok:motion:end reports the state", async () => {
    const host = mount(
      '<div data-ok-motion data-ok-variant="fadeIn" data-ok-trigger="mount">A</div>',
    );
    start();
    const element = host.firstElementChild as HTMLElement;
    const ended = new Promise<string>((resolve) =>
      element.addEventListener("ok:motion:end", (event) =>
        resolve((event as CustomEvent<{ state: string }>).detail.state),
      ),
    );
    finish(element);
    expect(await ended).toBe("enter");
    runtime?.get<MotionInstance>(element, "motion")?.replay();
    expect(state(element)).toBe("enter");
    expect(element.getAnimations()[0]?.playState).toBe("running");
    // A child's animationend doesn't count.
    const spy = vi.fn();
    element.addEventListener("ok:motion:end", spy);
    element.innerHTML = "<span>child</span>";
    element.firstElementChild?.dispatchEvent(new AnimationEvent("animationend", { bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  it("stop() disconnects and removes the private properties", () => {
    const host = mount(
      '<div data-ok-motion data-ok-variant="fadeIn" data-ok-trigger="manual" data-ok-duration="900">A</div>',
    );
    start();
    const element = host.firstElementChild as HTMLElement;
    runtime?.stop();
    expect(element.style.getPropertyValue("--_ok-motion-duration")).toBe("");
    element.setAttribute("data-ok-in", "");
    expect(state(element)).toBe("initial");
  });

  it("ignores subtrees owned by React (data-ok-runtime=off)", () => {
    const host = mount(
      '<div data-ok-runtime="off"><div data-ok-motion data-ok-variant="fadeIn" data-ok-trigger="mount">A</div></div>',
    );
    start();
    expect(host.querySelector("[data-ok-state]")).toBeNull();
  });
});

describe("motion-group runtime", () => {
  it("drives its Motions, staggers direct children, and replays", async () => {
    const host =
      mount(`<div data-ok-motion-group data-ok-trigger="manual" data-ok-stagger="80" data-ok-delay="20">
      <div data-ok-motion data-ok-variant="fadeInUp">A</div>
      <div data-ok-motion data-ok-variant="fadeInUp">B<div data-ok-motion data-ok-variant="fadeIn">nested</div></div>
    </div>`);
    start();
    const group = host.firstElementChild as HTMLElement;
    const [a, b, nested] = group.querySelectorAll<HTMLElement>("[data-ok-motion]");
    expect(state(a as Element)).toBe("initial");
    expect(state(nested as Element)).toBe("initial");
    expect(css(b as Element).animationDelay).toBe("0.1s");
    expect(group.style.getPropertyValue("--_ok-motion-stagger")).toBe("80ms");
    group.setAttribute("data-ok-in", "");
    await stateBecomes(b as Element, "enter");
    expect(state(group)).toBe("enter");
    const instance = runtime?.get<MotionGroupInstance>(group, "motion-group");
    expect(instance?.state).toBe("enter");
    instance?.replay();
    expect(state(a as Element)).toBe("enter");
    // A Motion in a group follows it: its own replay() writes the entrance.
    runtime?.get<MotionInstance>(a as Element, "motion")?.replay();
    expect(runtime?.get<MotionInstance>(a as Element, "motion")?.state).toBe("enter");
    runtime?.stop();
    expect(group.style.getPropertyValue("--_ok-motion-stagger")).toBe("");
    expect((b as HTMLElement).style.getPropertyValue("--_ok-motion-index")).toBe("");
  });
});

describe("motion-text runtime", () => {
  it("builds the letters from plain text, staggered, read whole", async () => {
    const host = mount(
      '<h2><span data-ok-motion-text data-ok-variant="fadeInUp" data-ok-trigger="mount" data-ok-stagger="40" data-ok-duration="500">Hi  you</span></h2>',
    );
    start();
    const text = host.querySelector("[data-ok-motion-text]") as HTMLElement;
    expect(text.querySelector("[data-ok-motion-text-label]")?.textContent).toBe("Hi  you");
    const chars = [...text.querySelectorAll("[data-ok-motion-char]")];
    expect(chars.map((c) => c.textContent).join("")).toBe("Hiyou");
    expect(css(chars[2] as Element).animationDelay).toBe("0.08s");
    expect(css(chars[0] as Element).animationDuration).toBe("0.5s");
    expect(state(text)).toBe("enter");
    await expectNoAxeViolations(host);
    // A look change replays; stop() cleans up.
    text.setAttribute("data-ok-variant", "zoomIn");
    await settle();
    expect(state(text)).toBe("enter");
    const instance = runtime?.get<MotionTextInstance>(text, "motion-text");
    instance?.replay();
    expect(instance?.state).toBe("enter");
    runtime?.stop();
    expect(text.style.getPropertyValue("--_ok-motion-stagger")).toBe("");
  });

  it("keeps rendered letters; manual exit", async () => {
    const host = mount(
      '<span data-ok-motion-text data-ok-variant="fadeIn" data-ok-trigger="manual" data-ok-in><span data-ok-motion-text-label>Ab</span><span aria-hidden="true"><span data-ok-motion-text-word><span data-ok-motion-char>A</span><span data-ok-motion-char>b</span></span></span></span>',
    );
    start();
    const text = host.firstElementChild as HTMLElement;
    expect(text.querySelectorAll("[data-ok-motion-char]")).toHaveLength(2);
    expect(state(text)).toBe("enter");
    expect(css(text.querySelectorAll("[data-ok-motion-char]")[1] as Element).animationDelay).toBe(
      "0.025s",
    );
    text.removeAttribute("data-ok-in");
    await stateBecomes(text, "exit");
    text.setAttribute("data-ok-stagger", "10");
    await settle();
    expect(text.style.getPropertyValue("--_ok-motion-stagger")).toBe("10ms");
  });
});

describe("dialog transition", () => {
  it("the paper of a dialog plays its Motion entrance when it opens", async () => {
    const host = mount(`<button type="button" data-ok-dialog-open="d">Open</button>
      <dialog id="d" data-ok-dialog aria-label="Animated">
        <div data-ok-dialog-paper data-ok-motion data-ok-variant="slideInUp" data-ok-trigger="mount">Hi</div>
      </dialog>`);
    start();
    (host.querySelector("button") as HTMLElement).click();
    await settle();
    const paper = host.querySelector("[data-ok-dialog-paper]") as HTMLElement;
    expect(state(paper)).toBe("enter");
    expect(css(paper).animationName).toBe("ok-motion");
  });
});

describe("motion keyframes and exits (ADR-0062)", () => {
  it("plays data-ok-keyframes on entrance instead of the variant", async () => {
    const host = mount(
      `<div id="k" data-ok-motion data-ok-trigger="mount" data-ok-keyframes='{"rotate":[0,90],"opacity":[0.5,1]}' data-ok-transition='{"duration":2000,"ease":"linear"}'>Logo</div>`,
    );
    start();
    const element = host.querySelector("#k") as HTMLElement;
    expect(state(element)).toBe("enter");
    expect(css(element).animationName).toBe("none");
    await settle();
    const animations = element.getAnimations();
    expect(animations).toHaveLength(2);
    expect(animations.every((a) => a.effect?.getTiming().duration === 2000)).toBe(true);
    finish(element);
    await settle();
    expect(element.style.rotate).toBe("90deg");
    await expectNoAxeViolations(host);
  });

  it("loops with repeat Infinity and pauses with data-ok-paused", async () => {
    const host = mount(
      `<div id="k" data-ok-motion data-ok-trigger="mount" data-ok-paused data-ok-keyframes='{"rotate":360}' data-ok-transition='{"repeat":"Infinity","duration":1000}'></div>`,
    );
    start();
    const element = host.querySelector("#k") as HTMLElement;
    await settle();
    const [loop] = element.getAnimations();
    expect(loop?.effect?.getTiming().iterations).toBe(Infinity);
    expect(loop?.playState).toBe("paused");
    element.removeAttribute("data-ok-paused");
    await settle();
    expect(loop?.playState).toBe("running");
  });

  it("exit(), hide() and remove() play the exit first", async () => {
    const host = mount(`
      <div id="a" data-ok-motion data-ok-variant="fadeIn" data-ok-trigger="mount">A</div>
      <div id="b" data-ok-motion data-ok-variant="fadeIn" data-ok-trigger="mount">B</div>
      <div id="c" data-ok-motion data-ok-variant="fadeIn" data-ok-trigger="mount">C</div>`);
    start();
    const [a, b, c] = ["#a", "#b", "#c"].map((id) => host.querySelector(id) as HTMLElement) as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    const instance = (element: HTMLElement) =>
      runtime?.get<MotionInstance>(element, "motion") as MotionInstance;
    const exited = instance(a).exit();
    expect(state(a)).toBe("exit");
    finish(a);
    expect(await exited).toBe(true);

    const hidden = instance(b).hide();
    expect(b.hidden).toBe(false);
    finish(b);
    expect(await hidden).toBe(true);
    expect(b.hidden).toBe(true);

    const removed = instance(c).remove();
    expect(c.isConnected).toBe(true);
    finish(c);
    expect(await removed).toBe(true);
    expect(c.isConnected).toBe(false);
  });

  it("replay() interrupts an exit", async () => {
    const host = mount(`<div id="a" data-ok-motion data-ok-trigger="mount">A</div>`);
    start();
    const element = host.querySelector("#a") as HTMLElement;
    const motion = runtime?.get<MotionInstance>(element, "motion") as MotionInstance;
    const removed = motion.remove();
    motion.replay();
    expect(await removed).toBe(false);
    expect(element.isConnected).toBe(true);
    expect(state(element)).toBe("enter");
  });
});
