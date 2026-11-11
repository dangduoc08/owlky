import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createLayoutGroup,
  createLayoutNode,
  flushLayout,
  hasMotionLayout,
  type LayoutNode,
  type LayoutNodeOptions,
  layoutNodeOf,
  layoutTransition,
  measureLayoutBox,
  motionLayoutAttributes,
  readMotionLayout,
} from "./layout.js";

const STAGE = `<style>
  #stage { position: relative; width: 600px; height: 400px; }
  .item { position: absolute; left: 0; top: 0; width: 100px; height: 50px; }
</style>`;

const created: LayoutNode[] = [];
const node = (element: HTMLElement, options: LayoutNodeOptions = { layout: true }) => {
  const made = createLayoutNode(element, {
    transition: { duration: 1000, ease: "linear" },
    ...options,
  });
  created.push(made);
  return made;
};

afterEach(() => {
  for (const made of created.splice(0)) made.destroy();
  flushLayout();
  vi.restoreAllMocks();
  cleanupDom();
});

const stage = (html: string) => mount(`${STAGE}<div id="stage">${html}</div>`);
const byId = (id: string) => document.getElementById(id) as HTMLElement;

/** Holds every animation of `element` at `ms`. */
const seek = (element: Element, ms: number) => {
  for (const animation of element.getAnimations()) {
    animation.pause();
    animation.currentTime = ms;
  }
};
const rect = (element: Element) => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
};
/** A keyframe's transform as a matrix (engines serialize the functions differently). */
const matrix = (transform: unknown) => {
  const { a, d, e, f } = new DOMMatrix(String(transform));
  return { a, d, e, f };
};
const keyframes = (element: Element) =>
  (element.getAnimations()[0]?.effect as KeyframeEffect | undefined)?.getKeyframes() ?? [];

describe("layout animations (FLIP)", () => {
  it("measures before and after a change and plays the inverse transform back to none", async () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    node(a);
    flushLayout();
    const start = rect(a);
    layoutNodeOf(a)?.snapshot();
    a.style.left = "200px";
    a.style.top = "100px";
    flushLayout();
    const [first, last] = keyframes(a);
    expect(matrix(first?.["transform"])).toMatchObject({ a: 1, d: 1, e: -200, f: -100 });
    expect(last?.["transform"]).toBe("none");
    seek(a, 0);
    expect(rect(a).left).toBeCloseTo(start.left, 1);
    expect(rect(a).top).toBeCloseTo(start.top, 1);
    seek(a, 500);
    expect(rect(a).left).toBeCloseTo(start.left + 100, 1);
    expect(layoutNodeOf(a)?.animating).toBe(true);
    // Never committed: the element keeps its own style at the end.
    for (const animation of a.getAnimations()) animation.finish();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve));
    expect(a.getAnimations()).toHaveLength(0);
    expect(a.style.transform).toBe("");
    expect(layoutNodeOf(a)?.animating).toBe(false);
    expect(layoutNodeOf(a)?.box?.x).toBeCloseTo(start.left + 200 + window.scrollX, 1);
  });

  it("flushes a microtask after a snapshot and does nothing when nothing moved", async () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    const made = node(a);
    made.snapshot();
    await Promise.resolve();
    expect(a.getAnimations()).toHaveLength(0);
    made.snapshot();
    a.style.left = "50px";
    await Promise.resolve();
    expect(a.getAnimations()).toHaveLength(1);
  });

  it("scales a size change around the element's transform origin", () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    const made = node(a);
    const before = rect(a);
    made.snapshot();
    a.style.width = "200px";
    a.style.height = "100px";
    flushLayout();
    seek(a, 0);
    const shown = rect(a);
    expect(shown.width).toBeCloseTo(before.width, 1);
    expect(shown.height).toBeCloseTo(before.height, 1);
    expect(shown.left).toBeCloseTo(before.left, 1);
    expect(shown.top).toBeCloseTo(before.top, 1);
  });

  it("`position` animates the position only, `size` the size only", () => {
    stage(`<div class="item" id="a"></div><div class="item" id="b"></div>`);
    const a = byId("a");
    const b = byId("b");
    node(a, { layout: "position" }).snapshot();
    node(b, { layout: "size" }).snapshot();
    a.style.width = "300px";
    b.style.width = "300px";
    flushLayout();
    expect(a.getAnimations()).toHaveLength(0);
    expect(b.getAnimations()).toHaveLength(1);
    seek(b, 0);
    expect(rect(b).width).toBeCloseTo(100, 1);
    layoutNodeOf(a)?.snapshot();
    layoutNodeOf(b)?.snapshot();
    a.style.left = "100px";
    b.style.left = "100px";
    flushLayout();
    expect(a.getAnimations()).toHaveLength(1);
    seek(a, 0);
    expect(rect(a).width).toBeCloseTo(300, 1);
    expect(rect(a).left).toBeCloseTo(rect(byId("stage")).left, 1);
  });

  it("starts an interrupted animation from where it was shown", () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    const origin = rect(byId("stage")).left;
    const made = node(a);
    made.snapshot();
    a.style.left = "100px";
    flushLayout();
    seek(a, 500);
    expect(rect(a).left).toBeCloseTo(origin + 50, 1);
    const first = a.getAnimations()[0];
    // Mid-flight, the box comes from the animation, not from the layout.
    made.snapshot();
    a.style.left = "300px";
    flushLayout();
    expect(first?.playState).toBe("idle");
    expect(a.getAnimations()).toHaveLength(1);
    seek(a, 0);
    expect(rect(a).left).toBeCloseTo(origin + 50, 1);
  });

  it("keeps a running animation when a snapshot finds the same target", () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    const made = node(a);
    made.snapshot();
    a.style.left = "100px";
    flushLayout();
    const running = a.getAnimations()[0];
    seek(a, 300);
    made.snapshot();
    flushLayout();
    expect(a.getAnimations()).toEqual([running]);
  });

  it("measures transformed elements from their layout (offsets), not their transform", () => {
    stage(`<div class="item" id="a" style="translate: 40px 10px; scale: 2"></div>`);
    const a = byId("a");
    const box = measureLayoutBox(a);
    const stageBox = rect(byId("stage"));
    expect(box.x).toBeCloseTo(stageBox.left + window.scrollX, 0);
    expect(box.width).toBe(100);
    expect(measureLayoutBox(byId("stage")).width).toBe(600);
  });

  it("corrects a nested layout element against its parent's scale", () => {
    mount(`${STAGE}<div id="stage"><div id="parent" style="position: absolute; left: 0; top: 0; width: 100px; height: 100px">
      <div id="child" style="position: absolute; left: 0; top: 0; width: 40px; height: 40px"></div>
    </div></div>`);
    const parent = byId("parent");
    const child = byId("child");
    node(parent).snapshot();
    node(child).snapshot();
    const before = rect(child);
    parent.style.width = "200px";
    parent.style.height = "200px";
    flushLayout();
    expect(parent.getAnimations()).toHaveLength(1);
    expect(child.getAnimations()).toHaveLength(1);
    for (const ms of [0, 250, 500]) {
      seek(parent, ms);
      seek(child, ms);
      // The child keeps its size and place while its parent grows (counter-transformed).
      expect(rect(child).width).toBeCloseTo(before.width, 0);
      expect(rect(child).height).toBeCloseTo(before.height, 0);
      expect(rect(child).left).toBeCloseTo(before.left, 0);
    }
  });

  it("moves a nested element with its parent when only the parent was snapshotted", () => {
    mount(`${STAGE}<div id="stage"><div id="parent" style="position: absolute; left: 0; top: 0; width: 100px; height: 100px">
      <div id="child" style="position: absolute; left: 10px; top: 10px; width: 40px; height: 40px"></div>
    </div></div>`);
    const parent = byId("parent");
    const child = byId("child");
    node(parent);
    node(child);
    flushLayout();
    const before = rect(child);
    layoutNodeOf(parent)?.snapshot();
    parent.style.left = "200px";
    flushLayout();
    // A pure move: the child rides along without an animation of its own.
    expect(parent.getAnimations()).toHaveLength(1);
    expect(child.getAnimations()).toHaveLength(0);
    seek(parent, 0);
    expect(rect(child).left).toBeCloseTo(before.left, 1);
  });

  it("corrects px border radii against the scale", () => {
    stage(`<div class="item" id="a" style="border-radius: 8px"></div>`);
    const a = byId("a");
    node(a).snapshot();
    a.style.width = "200px";
    flushLayout();
    const [first, last] = [keyframes(a)[0], keyframes(a).at(-1)];
    // Scaled to half its width at the start: the corners are drawn twice as wide.
    expect(first?.["borderTopLeftRadius"]).toBe("16px 8px");
    expect(last?.["borderTopLeftRadius"]).toMatch(/^8px( 8px)?$/);
    expect(matrix(last?.["transform"])).toMatchObject({ a: 1, d: 1 });
  });

  it("hands a layoutId's box over to the next element with that id", () => {
    stage(
      `<div class="item" id="a"></div><div class="item" id="b" style="left: 300px; top: 200px; width: 50px"></div>`,
    );
    const a = byId("a");
    const b = byId("b");
    const old = node(a, { layoutId: "highlight" });
    flushLayout();
    const from = rect(a);
    old.destroy();
    a.remove();
    node(b, { layoutId: "highlight" });
    flushLayout();
    seek(b, 0);
    expect(rect(b).left).toBeCloseTo(from.left, 1);
    expect(rect(b).top).toBeCloseTo(from.top, 1);
    expect(rect(b).width).toBeCloseTo(from.width, 1);
  });

  it("takes the box of an element with the same layoutId that is still there", () => {
    stage(`<div class="item" id="a"></div><div class="item" id="b" style="left: 300px"></div>`);
    node(byId("a"), { layoutId: "x" });
    flushLayout();
    node(byId("b"), { layoutId: "x" });
    flushLayout();
    seek(byId("b"), 0);
    expect(rect(byId("b")).left).toBeCloseTo(rect(byId("a")).left, 1);
  });

  it("scopes layoutIds to their group and snapshots a group together", () => {
    stage(
      `<div class="item" id="a"></div><div class="item" id="b" style="top: 100px"></div><div class="item" id="c" style="top: 200px"></div>`,
    );
    const group = createLayoutGroup("cards");
    const shared = createLayoutGroup(undefined, group);
    expect(shared.members).toBe(group.members);
    const a = node(byId("a"), { layout: true, group });
    node(byId("b"), { layout: true, group: shared });
    node(byId("c"), { layout: true, group, dependent: true });
    flushLayout();
    a.snapshot();
    for (const id of ["a", "b", "c"]) byId(id).style.left = "100px";
    flushLayout();
    expect(byId("a").getAnimations()).toHaveLength(1);
    expect(byId("b").getAnimations()).toHaveLength(1);
    // Its owner decides when it snapshots (React's layoutDependency).
    expect(byId("c").getAnimations()).toHaveLength(0);
    a.setOptions({ layout: true });
    expect(group.members.has(a)).toBe(false);
  });

  it("jumps with reduced motion and still reports the change", () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    const start = vi.fn();
    const complete = vi.fn();
    const made = node(a, {
      layout: true,
      transition: { reducedMotion: "always" },
      onLayoutAnimationStart: start,
      onLayoutAnimationComplete: complete,
    });
    made.snapshot();
    a.style.left = "80px";
    flushLayout();
    expect(a.getAnimations()).toHaveLength(0);
    expect(start).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledOnce();
  });

  it("reports the start and the end, not an interrupted animation's end", async () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    const start = vi.fn();
    const complete = vi.fn();
    const made = node(a, {
      layout: true,
      transition: { layout: { duration: 400 } },
      onLayoutAnimationStart: start,
      onLayoutAnimationComplete: complete,
    });
    made.snapshot();
    a.style.left = "80px";
    flushLayout();
    expect(start).toHaveBeenCalledTimes(1);
    expect(a.getAnimations()[0]?.effect?.getTiming().duration).toBe(400);
    made.snapshot();
    a.style.left = "160px";
    flushLayout();
    await new Promise((resolve) => setTimeout(resolve));
    expect(complete).not.toHaveBeenCalled();
    expect(start).toHaveBeenCalledTimes(2);
    for (const animation of a.getAnimations()) animation.finish();
    await new Promise((resolve) => setTimeout(resolve));
    expect(complete).toHaveBeenCalledOnce();
  });

  it("plays springs and delays", () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    const made = node(a, {
      layout: true,
      transition: { type: "spring", stiffness: 300, damping: 30, delay: 100 },
    });
    made.snapshot();
    a.style.left = "80px";
    flushLayout();
    const timing = a.getAnimations()[0]?.effect?.getTiming();
    expect(timing?.delay).toBe(100);
    expect(Number(timing?.duration)).toBeGreaterThan(100);
  });

  it("gives the focus back to an element the change blurred", () => {
    stage(
      `<ul id="list"><li id="one"><button type="button">One</button></li><li id="two"><button type="button" id="focus">Two</button></li></ul>`,
    );
    const one = node(byId("one"));
    const two = node(byId("two"));
    const button = byId("focus");
    button.focus();
    one.snapshot();
    two.snapshot();
    // Moving the focused node blurs it in some engines.
    byId("list").insertBefore(byId("two"), byId("one"));
    if (document.activeElement === button) button.blur();
    flushLayout();
    expect(document.activeElement).toBe(button);
  });

  it("takes the focus target from the owner (HTML: after the move)", () => {
    stage(`<div class="item" id="a"><button type="button" id="b">B</button></div>`);
    const made = node(byId("a"));
    flushLayout();
    made.snapshot("last");
    byId("b").blur();
    flushLayout({ focus: byId("b") });
    expect(document.activeElement).toBe(byId("b"));
  });

  it("snapshots from the last box measured (HTML: after the DOM changed)", () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    const made = node(a);
    flushLayout();
    const start = rect(a);
    a.style.left = "100px";
    made.snapshot("last");
    flushLayout();
    seek(a, 0);
    expect(rect(a).left).toBeCloseTo(start.left, 1);
    expect(matrix(keyframes(a)[0]?.["transform"])).toMatchObject({ a: 1, e: -100, f: 0 });
  });

  it("measures without animating, and forgets destroyed or disabled nodes", () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    const made = node(a, {});
    made.snapshot();
    a.style.left = "40px";
    flushLayout();
    expect(a.getAnimations()).toHaveLength(0);
    made.setOptions({ layout: true });
    made.measure();
    flushLayout();
    expect(made.box?.width).toBe(100);
    made.destroy();
    made.destroy();
    expect(layoutNodeOf(a)).toBeUndefined();
    made.snapshot();
    flushLayout();
    expect(a.getAnimations()).toHaveLength(0);
  });
});

describe("layout edge cases", () => {
  const tick = () => new Promise((resolve) => setTimeout(resolve));

  it("continues a child's animation when its parent starts a new one", async () => {
    mount(`${STAGE}<div id="stage"><div id="parent" style="position: absolute; left: 0; top: 0; width: 100px; height: 100px">
      <div id="child" style="position: absolute; left: 0; top: 0; width: 40px; height: 40px"></div>
    </div></div>`);
    const parent = byId("parent");
    const child = byId("child");
    const p = node(parent);
    const c = node(child);
    c.snapshot();
    child.style.left = "50px";
    flushLayout();
    seek(child, 400);
    const shown = rect(child).left;
    p.snapshot();
    parent.style.width = "200px";
    flushLayout();
    // The child's own move goes on from where it was, corrected for the parent's new scale.
    expect(child.getAnimations()[0]?.currentTime).toBeCloseTo(400, -1);
    seek(parent, 0);
    seek(child, 400);
    expect(rect(child).left).toBeCloseTo(shown, 0);
    // A correction ends without reporting a change of the child's own box.
    for (const animation of [...parent.getAnimations(), ...child.getAnimations()])
      animation.finish();
    await tick();
    expect(c.animating).toBe(false);
  });

  it("handles empty boxes, percent radii, fixed and transformed elements", () => {
    stage(`<div class="item" id="empty" style="width: 0"></div><div class="item" id="round" style="border-radius: 50%"></div>
      <div id="fixed" style="position: fixed; left: 10px; top: 20px; width: 30px; height: 30px; translate: 5px 0"></div>`);
    const empty = byId("empty");
    const round = byId("round");
    node(empty).snapshot();
    node(round).snapshot();
    empty.style.width = "50px";
    round.style.width = "200px";
    flushLayout();
    expect(matrix(keyframes(empty)[0]?.["transform"])).toMatchObject({ a: 1, d: 1 });
    // A percent radius scales with its box: no correction, two keyframes.
    expect(keyframes(round)).toHaveLength(2);
    const fixed = measureLayoutBox(byId("fixed"));
    expect(fixed.x).toBeCloseTo(10 + window.scrollX, 0);
    expect(fixed.y).toBeCloseTo(20 + window.scrollY, 0);
  });

  it("drops snapshots of elements that left, and jumps without a change", () => {
    stage(`<div class="item" id="a"></div><div class="item" id="b"></div>`);
    const a = node(byId("a"));
    a.snapshot();
    byId("a").remove();
    flushLayout();
    expect(a.box).toBeUndefined();
    // Never measured and gone: nothing to snapshot or hand over.
    a.snapshot("last");
    a.setOptions({ layoutId: "gone" });
    a.destroy();
    const start = vi.fn();
    const b = node(byId("b"), {
      layout: true,
      transition: { reducedMotion: "always" },
      onLayoutAnimationStart: start,
    });
    b.snapshot();
    flushLayout();
    expect(start).not.toHaveBeenCalled();
  });

  it("never takes the focus back from an element the user focused", () => {
    stage(
      `<div class="item" id="a"><button type="button" id="in">In</button></div><button type="button" id="out">Out</button>`,
    );
    node(byId("a")).snapshot();
    byId("out").focus();
    flushLayout({ focus: byId("in") });
    expect(document.activeElement).toBe(byId("out"));
  });

  it("keeps the newer node when two were made on one element", () => {
    stage(`<div class="item" id="a"></div>`);
    const first = createLayoutNode(byId("a"), { layout: true });
    const second = node(byId("a"));
    first.destroy();
    expect(layoutNodeOf(byId("a"))).toBe(second);
  });

  it("takes the first of several easings", () => {
    stage(`<div class="item" id="a"></div>`);
    const a = byId("a");
    node(a, {
      layout: true,
      transition: { duration: 200, ease: ["easeOut", "linear"] },
    }).snapshot();
    a.style.left = "10px";
    flushLayout();
    expect(a.getAnimations()[0]?.effect?.getTiming().easing).toMatch(
      /^(ease-out|cubic-bezier\(0, 0, 0\.58, 1\))$/,
    );
  });
});

describe("layout attributes", () => {
  it("writes the HTML attributes of the layout props", () => {
    expect(motionLayoutAttributes({ layout: true })).toEqual({ "data-ok-layout": "" });
    expect(motionLayoutAttributes({ layout: "position", layoutId: " tab " })).toEqual({
      "data-ok-layout": "position",
      "data-ok-layout-id": "tab",
    });
    expect(motionLayoutAttributes({ layout: false })).toEqual({});
    expect(
      motionLayoutAttributes({
        layout: "size",
        transition: { duration: 200, layout: { duration: 100 } },
      }),
    ).toEqual({
      "data-ok-layout": "size",
      "data-ok-transition": '{"duration":200,"layout":{"duration":100}}',
    });
    expect(motionLayoutAttributes({ transition: { duration: 200 } })).toEqual({});
    expect(motionLayoutAttributes({ layout: true, transition: { repeat: Infinity } })).toEqual({
      "data-ok-layout": "",
      "data-ok-transition": '{"repeat":"Infinity"}',
    });
    expect(motionLayoutAttributes({ layout: true, transition: { nope: 1 } as never })).toEqual({
      "data-ok-layout": "",
    });
  });

  it("reads them back", () => {
    mount(`<div id="a" data-ok-layout="size" data-ok-layout-id="x" data-ok-transition='{"layout":{"duration":90}}'></div>
      <div id="b" data-ok-layout="anything"></div><div id="c"></div>`);
    expect(readMotionLayout(byId("a"))).toEqual({
      layout: "size",
      layoutId: "x",
      transition: { layout: { duration: 90 } },
    });
    expect(readMotionLayout(byId("b")).layout).toBe(true);
    expect(readMotionLayout(byId("c"))).toEqual({
      layout: undefined,
      layoutId: undefined,
      transition: undefined,
    });
    expect(hasMotionLayout(byId("a"))).toBe(true);
    expect(hasMotionLayout(byId("c"))).toBe(false);
  });

  it("picks the layout transition", () => {
    expect(layoutTransition(undefined)).toEqual({});
    expect(layoutTransition({ duration: 100, layout: { duration: 50 } })).toEqual({ duration: 50 });
    expect(layoutTransition({ duration: 100, repeat: 2, repeatDelay: 5, times: [0, 1] })).toEqual({
      duration: 100,
    });
  });
});
