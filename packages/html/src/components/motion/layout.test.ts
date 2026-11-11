import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { type MotionInstance, motion } from "./motion.js";

let runtime: Runtime;

beforeEach(() => {
  runtime = createRuntime().register(motion).start();
});

afterEach(() => {
  runtime.stop();
  resetPage();
  vi.restoreAllMocks();
});

const TRANSITION = `data-ok-transition='{"duration":1000,"ease":"linear"}'`;
const byId = (id: string) => document.getElementById(id) as HTMLElement;
const instance = (element: Element) => runtime.get(element, "motion") as MotionInstance;
/** The script layout animations (not the CSS entrance). */
const layoutAnimations = (element: Element) =>
  element.getAnimations().filter((animation) => !(animation instanceof CSSAnimation));
const seek = (element: Element, ms: number) => {
  for (const animation of layoutAnimations(element)) {
    animation.pause();
    animation.currentTime = ms;
  }
};
const top = (element: Element) => element.getBoundingClientRect().top;
const left = (element: Element) => element.getBoundingClientRect().left;
const record = (element: Element) => {
  const events: string[] = [];
  for (const name of ["layoutanimationstart", "layoutanimationcomplete"])
    element.addEventListener(`ok:motion:${name}`, () => events.push(name));
  return events;
};

const LIST = `<ul id="list" style="list-style: none; margin: 0; padding: 0">
  ${["a", "b", "c"]
    .map(
      (id) =>
        `<li id="${id}" data-ok-motion data-ok-trigger="mount" data-ok-layout ${TRANSITION} style="height: 40px"><button type="button" id="${id}-button">${id}</button></li>`,
    )
    .join("")}
</ul>`;

describe("motion layout runtime", () => {
  it("animates a reordered list from the boxes it had, and keeps the focus", async () => {
    mount(LIST);
    await settle();
    const [a, c] = [byId("a"), byId("c")];
    const start = top(a);
    const button = byId("c-button");
    button.focus();
    byId("list").insertBefore(c, a);
    await settle();
    expect(document.activeElement).toBe(button);
    expect(layoutAnimations(c)).toHaveLength(1);
    expect(layoutAnimations(a)).toHaveLength(1);
    seek(c, 0);
    seek(a, 0);
    expect(top(c)).toBeCloseTo(start + 80, 0);
    expect(top(a)).toBeCloseTo(start, 0);
    await expectNoAxeViolations(byId("list"));
  });

  it("animates an expanded card and its siblings, and reports the animation", async () => {
    mount(`<div id="grid">
      <div id="one" data-ok-motion data-ok-trigger="mount" data-ok-layout ${TRANSITION} style="height: 40px"></div>
      <div id="two" data-ok-motion data-ok-trigger="mount" data-ok-layout ${TRANSITION} style="height: 40px"></div>
    </div>`);
    await settle();
    const events = record(byId("one"));
    const start = top(byId("two"));
    byId("one").style.height = "120px";
    await settle();
    expect(events).toEqual(["layoutanimationstart"]);
    seek(byId("two"), 0);
    expect(top(byId("two"))).toBeCloseTo(start, 0);
    for (const animation of layoutAnimations(byId("one"))) animation.finish();
    await settle();
    expect(events).toEqual(["layoutanimationstart", "layoutanimationcomplete"]);
  });

  it("moves an element to another parent from where it was", async () => {
    mount(`<div style="display: flex">
      <div id="tab-1" style="position: relative; width: 100px; height: 40px"><span id="line" data-ok-motion data-ok-trigger="mount" data-ok-layout ${TRANSITION} style="position: absolute; inset: auto 0 0; height: 2px"></span></div>
      <div id="tab-2" style="position: relative; width: 140px; height: 40px"></div>
    </div>`);
    await settle();
    const line = byId("line");
    const from = left(line);
    byId("tab-2").append(line);
    await settle();
    expect(instance(line)).toBeDefined();
    seek(line, 0);
    expect(left(line)).toBeCloseTo(from, 0);
    expect(line.getBoundingClientRect().width).toBeCloseTo(100, 0);
  });

  it("hands a layoutId over to the element that replaces it", async () => {
    mount(`<div style="display: flex">
      <div id="tab-1" style="position: relative; width: 100px; height: 40px"><span id="old" data-ok-motion data-ok-trigger="mount" data-ok-layout-id="underline" ${TRANSITION} style="position: absolute; inset: auto 0 0; height: 2px"></span></div>
      <div id="tab-2" style="position: relative; width: 140px; height: 40px"></div>
    </div>`);
    await settle();
    const from = left(byId("old"));
    byId("old").remove();
    const next = document.createElement("span");
    next.id = "new";
    next.setAttribute("data-ok-motion", "");
    next.setAttribute("data-ok-trigger", "mount");
    next.setAttribute("data-ok-layout-id", "underline");
    next.setAttribute("data-ok-transition", '{"duration":1000}');
    next.style.cssText = "position: absolute; inset: auto 0 0; height: 2px";
    byId("tab-2").append(next);
    await settle();
    await settle();
    expect(layoutAnimations(next)).toHaveLength(1);
    seek(next, 0);
    expect(left(next)).toBeCloseTo(from, 0);
  });

  it("animates the members of a data-ok-layout-group together", async () => {
    mount(`<div data-ok-layout-group="board">
      <div id="col-1"><div id="x" data-ok-motion data-ok-trigger="mount" data-ok-layout ${TRANSITION} style="height: 40px"></div></div>
      <div id="col-2"><div id="y" data-ok-motion data-ok-trigger="mount" data-ok-layout ${TRANSITION} style="height: 40px"></div></div>
    </div>`);
    await settle();
    byId("x").style.height = "80px";
    await settle();
    expect(layoutAnimations(byId("y"))).toHaveLength(1);
  });

  it("follows a new transition, in an unnamed group", async () => {
    mount(`<div data-ok-layout-group>
      <div id="z" data-ok-motion data-ok-trigger="mount" data-ok-layout style="height: 40px"></div>
    </div>`);
    await settle();
    const z = byId("z");
    z.setAttribute("data-ok-transition", '{"layout":{"duration":700}}');
    await settle();
    z.style.height = "60px";
    await settle();
    expect(layoutAnimations(z)[0]?.effect?.getTiming().duration).toBe(700);
  });

  it("measure() and animateLayout() cover changes no mutation shows", async () => {
    mount(`<style id="sheet">#box { width: 100px; height: 40px; }</style>
      <div id="box" data-ok-motion data-ok-trigger="mount" data-ok-layout ${TRANSITION}></div>`);
    await settle();
    const box = byId("box");
    const rule = (byId("sheet") as HTMLStyleElement).sheet?.cssRules[0] as CSSStyleRule;
    rule.style.width = "300px";
    instance(box).animateLayout();
    expect(layoutAnimations(box)).toHaveLength(1);
    seek(box, 0);
    expect(box.getBoundingClientRect().width).toBeCloseTo(100, 0);
    for (const animation of layoutAnimations(box)) animation.finish();
    await settle();
    instance(box).measure();
    rule.style.width = "150px";
    await settle();
    expect(layoutAnimations(box)).toHaveLength(1);
  });

  it('data-ok-initial="false" skips the entrance until an exit or a replay', async () => {
    mount(
      `<div id="m" data-ok-motion data-ok-trigger="manual" data-ok-in data-ok-initial="false"></div>`,
    );
    await settle();
    const element = byId("m");
    expect(element.hasAttribute("data-ok-state")).toBe(false);
    element.removeAttribute("data-ok-in");
    await settle();
    expect(element.getAttribute("data-ok-state")).toBe("exit");
    element.setAttribute("data-ok-in", "");
    await settle();
    expect(element.getAttribute("data-ok-state")).toBe("enter");
    mount(`<div id="n" data-ok-motion data-ok-trigger="mount" data-ok-initial="false"></div>`);
    await settle();
    instance(byId("n")).replay();
    expect(byId("n").getAttribute("data-ok-state")).toBe("enter");
  });

  it("follows the layout attributes and jumps with reduced motion", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: query.includes("reduce"),
          media: query,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    );
    mount(`<div id="box" data-ok-motion data-ok-trigger="mount" style="height: 40px"></div>`);
    await settle();
    const box = byId("box");
    const events = record(box);
    box.setAttribute("data-ok-layout", "size");
    await settle();
    box.style.height = "80px";
    await settle();
    expect(layoutAnimations(box)).toHaveLength(0);
    expect(events).toEqual(["layoutanimationstart", "layoutanimationcomplete"]);
    box.removeAttribute("data-ok-layout");
    await settle();
    box.style.height = "20px";
    await settle();
    expect(events).toHaveLength(2);
    instance(box).measure();
    instance(box).animateLayout();
  });
});
