import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  CAROUSEL_FLAGS,
  type CarouselController,
  type CarouselControllerOptions,
  createCarouselController,
  readCarouselSettings,
} from "./carousel-controller.js";

/* Core tests have no stylesheet: the layout rules the controller relies on, with fixed sizes. */
const CSS = `
[data-ok-carousel-viewport]{width:400px;height:var(--_ok-carousel-height,auto);overflow-x:var(--_ok-carousel-overflow,auto);overflow-y:hidden;scroll-snap-type:var(--_ok-carousel-snap,x mandatory);scrollbar-width:none}
[data-ok-carousel][data-ok-axis="y"] [data-ok-carousel-viewport]{height:200px;overflow-x:hidden;overflow-y:var(--_ok-carousel-overflow,auto);scroll-snap-type:var(--_ok-carousel-snap,y mandatory)}
[data-ok-carousel][data-ok-scrolling] [data-ok-carousel-viewport],[data-ok-carousel][data-ok-dragging] [data-ok-carousel-viewport],[data-ok-carousel][data-ok-auto-scrolling] [data-ok-carousel-viewport]{scroll-snap-type:none}
[data-ok-carousel-container]{display:flex;gap:var(--gap,0px);padding-inline:var(--_ok-carousel-lead,0px) var(--_ok-carousel-trail,0px)}
[data-ok-carousel][data-ok-axis="y"] [data-ok-carousel-container]{flex-direction:column;height:100%;padding-inline:0;padding-block:var(--_ok-carousel-lead,0px) var(--_ok-carousel-trail,0px)}
[data-ok-carousel][data-ok-auto-height] [data-ok-carousel-container]{align-items:flex-start}
[data-ok-carousel-slide]{flex:0 0 var(--size,200px);height:var(--height,100px);box-sizing:border-box;order:var(--_ok-carousel-order,0);scroll-snap-align:var(--_ok-carousel-snap-align,start);scroll-snap-stop:var(--_ok-carousel-snap-stop,always);scroll-margin-inline:var(--_ok-carousel-snap-start,0px) var(--_ok-carousel-snap-end,0px)}
[data-ok-carousel][data-ok-axis="y"] [data-ok-carousel-slide]{flex-basis:100px;scroll-margin-inline:0;scroll-margin-block:var(--_ok-carousel-snap-start,0px) var(--_ok-carousel-snap-end,0px)}
[data-ok-carousel][data-ok-effect="fade"] [data-ok-carousel-viewport]{overflow:hidden}
[data-ok-carousel][data-ok-effect="fade"] [data-ok-carousel-container]{display:grid}
[data-ok-carousel][data-ok-effect="fade"] [data-ok-carousel-slide]{grid-area:1/1;width:400px}
`;

let style: HTMLStyleElement;
beforeEach(async () => {
  style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);
  // Park the pointer away from the carousels (hovering pauses autoplay and auto scroll).
  const parking = document.createElement("div");
  parking.style.cssText = "position:fixed;right:0;bottom:0;width:8px;height:8px";
  document.body.append(parking);
  await userEvent.hover(parking);
});

const controllers: CarouselController[] = [];
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  style.remove();
  cleanupDom();
});

interface Setup {
  count?: number;
  attrs?: string;
  sizes?: number[];
  heights?: number[];
  dir?: "rtl";
  controls?: string;
  slideContent?: (i: number) => string;
}

function markup({
  count = 4,
  attrs = "",
  sizes,
  heights,
  dir,
  controls = "",
  slideContent = (i) => `Slide ${i + 1}`,
}: Setup) {
  const slides = Array.from({ length: count }, (_, i) => {
    const vars = [
      sizes?.[i] !== undefined ? `--size:${sizes[i]}px` : "",
      heights?.[i] !== undefined ? `--height:${heights[i]}px` : "",
    ].filter(Boolean);
    return `<div role="group" aria-roledescription="slide" aria-label="${i + 1} of ${count}" data-ok-carousel-slide data-slide="${i}"${vars.length ? ` data-vars="${vars.join(";")}"` : ""}>${slideContent(i)}</div>`;
  }).join("");
  return `<section data-ok-carousel aria-label="Test" ${attrs}${dir ? ` dir="${dir}"` : ""}>
    <div data-ok-carousel-viewport tabindex="0"><div data-ok-carousel-container>${slides}</div>
    <span data-ok-carousel-live aria-live="polite"></span></div>
    <div data-ok-carousel-arrows><button type="button" data-ok-carousel-prev aria-label="Previous"></button><span data-ok-carousel-counter></span><button type="button" data-ok-carousel-next aria-label="Next"></button></div>
    <div data-ok-carousel-dots>${Array.from({ length: count }, (_, i) => `<button type="button" data-ok-carousel-dot aria-label="Go to slide ${i + 1}"></button>`).join("")}</div>
    <span data-ok-carousel-progress></span><span data-ok-carousel-progress data-ok-variant="autoplay"></span>
    ${controls}
  </section>`;
}

interface Events {
  select: [number, number][];
  settle: number[];
  scroll: number[];
  inView: number[][];
  reinit: number[];
  autoplay: boolean[];
  autoScroll: boolean[];
  focus: number[];
  pointer: string[];
}

function setup(options: Setup = {}, extra: CarouselControllerOptions = {}) {
  const host = mount(markup(options));
  for (const slide of host.querySelectorAll<HTMLElement>("[data-vars]")) {
    for (const pair of (slide.dataset["vars"] ?? "").split(";")) {
      const [name, value] = pair.split(":");
      slide.style.setProperty(name as string, value as string);
    }
  }
  const root = host.querySelector<HTMLElement>("[data-ok-carousel]") as HTMLElement;
  const viewport = root.querySelector<HTMLElement>("[data-ok-carousel-viewport]") as HTMLElement;
  const events: Events = {
    select: [],
    settle: [],
    scroll: [],
    inView: [],
    reinit: [],
    autoplay: [],
    autoScroll: [],
    focus: [],
    pointer: [],
  };
  const controller = createCarouselController(root, {
    onSelect: (index, previous) => events.select.push([index, previous]),
    onSettle: (index) => events.settle.push(index),
    onScroll: (progress) => events.scroll.push(progress),
    onSlidesInView: (indexes) => events.inView.push(indexes),
    onReInit: (count) => events.reinit.push(count),
    onAutoplay: (playing) => events.autoplay.push(playing),
    onAutoScroll: (playing) => events.autoScroll.push(playing),
    onSlideFocus: (index) => events.focus.push(index),
    onPointerDown: () => events.pointer.push("down"),
    onPointerUp: () => events.pointer.push("up"),
    ...extra,
  });
  controllers.push(controller);
  root.dispatchEvent(new MouseEvent("mouseleave"));
  const slides = [...root.querySelectorAll<HTMLElement>("[data-ok-carousel-slide]")];
  const snapped = () =>
    slides.filter((s) => s.hasAttribute("data-ok-snapped")).map((s) => Number(s.dataset["slide"]));
  const dot = (i: number) =>
    root.querySelectorAll<HTMLElement>("[data-ok-carousel-dot]")[i] as HTMLElement;
  const prev = root.querySelector<HTMLElement>("[data-ok-carousel-prev]") as HTMLElement;
  const next = root.querySelector<HTMLElement>("[data-ok-carousel-next]") as HTMLElement;
  const counter = root.querySelector<HTMLElement>("[data-ok-carousel-counter]") as HTMLElement;
  const live = root.querySelector<HTMLElement>("[data-ok-carousel-live]") as HTMLElement;
  return {
    host,
    root,
    viewport,
    controller,
    events,
    slides,
    snapped,
    dot,
    prev,
    next,
    counter,
    live,
  };
}

const settled = (events: Events, count = events.settle.length + 1, timeout = 3000) =>
  new Promise<void>((resolve, reject) => {
    const start = performance.now();
    const check = () => {
      if (events.settle.length >= count) resolve();
      else if (performance.now() - start > timeout) reject(new Error("no settle"));
      else requestAnimationFrame(check);
    };
    check();
  });
/** Waits until no animated scroll runs. */
const idle = async (root: Element) => {
  await until(() => !root.hasAttribute(CAROUSEL_FLAGS.scrolling));
  await nextFrame();
};
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const frames = async (n = 3) => {
  for (let i = 0; i < n; i++) await nextFrame();
};
const until = (test: () => boolean, timeout = 3000) =>
  new Promise<void>((resolve, reject) => {
    const start = performance.now();
    const check = () => {
      if (test()) resolve();
      else if (performance.now() - start > timeout) reject(new Error("timeout"));
      else requestAnimationFrame(check);
    };
    check();
  });

function pointer(target: Element, type: string, x: number, y = 10, pointerType = "mouse") {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerId: 7,
      pointerType,
      button: 0,
    }),
  );
}

describe("readCarouselSettings", () => {
  it("reads defaults and attributes", () => {
    const root = document.createElement("section");
    expect(readCarouselSettings(root)).toMatchObject({
      align: "center",
      axis: "x",
      loop: false,
      slidesToScroll: 1,
      duration: 25,
      containScroll: "trimSnaps",
      forceWheelAxis: undefined,
    });
    root.setAttribute("data-ok-align", "0.2");
    root.setAttribute("data-ok-slides-to-scroll", "auto");
    root.setAttribute("data-ok-force-wheel-axis", "y");
    root.setAttribute("data-ok-duration", "nope");
    root.setAttribute("data-ok-in-view-threshold", "5");
    root.setAttribute("data-ok-draggable", "false");
    root.setAttribute(
      "data-ok-breakpoints",
      '{"(min-width: 1px)": {"loop": true}, "(max-width: 1px)": {"dragFree": true}}',
    );
    expect(readCarouselSettings(root)).toMatchObject({
      align: 0.2,
      slidesToScroll: "auto",
      forceWheelAxis: "y",
      duration: 25,
      inViewThreshold: 1,
      draggable: false,
      loop: true,
      dragFree: false,
    });
    root.setAttribute("data-ok-align", "middle");
    expect(readCarouselSettings(root).align).toBe("center");
  });
});

describe("createCarouselController", () => {
  it("writes the initial state", () => {
    const { root, events, snapped, dot, prev, next, counter, live, controller } = setup({
      attrs: 'data-ok-align="start"',
    });
    expect(root.hasAttribute(CAROUSEL_FLAGS.ready)).toBe(true);
    expect(events.reinit).toEqual([3]);
    expect(snapped()).toEqual([0]);
    expect(dot(0).getAttribute("aria-current")).toBe("true");
    expect(prev.getAttribute("aria-disabled")).toBe("true");
    expect(next.hasAttribute("aria-disabled")).toBe(false);
    expect(counter.textContent).toBe("1/3");
    expect(live.textContent).toBe("");
    expect(controller.scrollSnapList()).toEqual([0, 0.5, 1]);
    expect(controller.rootNode()).toBe(root);
    expect(controller.containerNode()).toBe(root.querySelector("[data-ok-carousel-container]"));
    expect(controller.slideNodes()).toHaveLength(4);
  });

  it("moves with the API (jump) and reports selections", () => {
    const { viewport, events, controller, snapped, counter, prev, next } = setup({
      attrs: 'data-ok-align="start"',
    });
    controller.scrollNext(true);
    expect(controller.selectedScrollSnap()).toBe(1);
    expect(controller.previousScrollSnap()).toBe(0);
    expect(viewport.scrollLeft).toBe(200);
    expect(snapped()).toEqual([1]);
    expect(counter.textContent).toBe("2/3");
    expect(events.select).toEqual([[1, 0]]);
    expect(controller.scrollProgress()).toBe(0.5);
    controller.scrollTo(9, true);
    expect(controller.selectedScrollSnap()).toBe(2);
    expect(snapped()).toEqual([2, 3]);
    expect(next.getAttribute("aria-disabled")).toBe("true");
    expect(controller.canScrollNext()).toBe(false);
    controller.scrollNext(true);
    expect(controller.selectedScrollSnap()).toBe(2);
    controller.scrollPrev(true);
    controller.scrollPrev(true);
    controller.scrollPrev(true);
    expect(controller.selectedScrollSnap()).toBe(0);
    expect(prev.getAttribute("aria-disabled")).toBe("true");
    expect(controller.canScrollPrev()).toBe(false);
    controller.scrollTo(-3, true);
    expect(controller.selectedScrollSnap()).toBe(0);
  });

  it("animates scrolls and settles", async () => {
    const { viewport, events, controller, root } = setup({
      attrs: 'data-ok-align="start" data-ok-duration="2"',
    });
    controller.scrollTo(2);
    expect(root.hasAttribute(CAROUSEL_FLAGS.scrolling)).toBe(true);
    await settled(events);
    expect(root.hasAttribute(CAROUSEL_FLAGS.scrolling)).toBe(false);
    expect(viewport.scrollLeft).toBe(400);
    expect(events.settle.at(-1)).toBe(2);
    expect(events.scroll.length).toBeGreaterThan(0);
    // A second animation cancels the first one.
    controller.scrollTo(0);
    controller.scrollTo(1);
    await settled(events);
    expect(controller.selectedScrollSnap()).toBe(1);
  });

  it("answers its controls", async () => {
    const { root, events, controller, dot, prev, next, live } = setup({
      attrs: 'data-ok-align="start" data-ok-duration="0"',
      controls:
        '<div data-ok-carousel-thumbs><button type="button" data-ok-carousel-thumb></button><button type="button" data-ok-carousel-thumb></button><button type="button" data-ok-carousel-thumb></button><button type="button" data-ok-carousel-thumb></button></div>',
    });
    next.click();
    expect(controller.selectedScrollSnap()).toBe(1);
    expect(live.textContent).toBe("slide 2 of 4");
    prev.click();
    expect(controller.selectedScrollSnap()).toBe(0);
    prev.click();
    expect(controller.selectedScrollSnap()).toBe(0);
    dot(2).click();
    expect(controller.selectedScrollSnap()).toBe(2);
    const thumbs = root.querySelectorAll<HTMLElement>("[data-ok-carousel-thumb]");
    expect(thumbs[3]?.getAttribute("aria-current")).toBe("true");
    (thumbs[1] as HTMLElement).click();
    expect(controller.selectedScrollSnap()).toBe(1);
    expect(thumbs[1]?.getAttribute("aria-current")).toBe("true");
    // A prevented click does nothing.
    next.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
      capture: true,
    });
    next.click();
    expect(controller.selectedScrollSnap()).toBe(1);
    root.click();
    expect(events.select.length).toBe(4);
  });

  it("answers the arrow keys, Home and End on the viewport", async () => {
    const { viewport, controller } = setup({ attrs: 'data-ok-align="start" data-ok-duration="0"' });
    viewport.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(controller.selectedScrollSnap()).toBe(1);
    await userEvent.keyboard("{End}");
    expect(controller.selectedScrollSnap()).toBe(2);
    await userEvent.keyboard("{ArrowRight}");
    expect(controller.selectedScrollSnap()).toBe(2);
    await userEvent.keyboard("{ArrowLeft}");
    expect(controller.selectedScrollSnap()).toBe(1);
    await userEvent.keyboard("{Home}");
    expect(controller.selectedScrollSnap()).toBe(0);
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{ArrowDown}");
    // Shortcuts with modifiers are left to the page (synthetic: no native scrolling).
    viewport.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", ctrlKey: true, bubbles: true }),
    );
    expect(controller.selectedScrollSnap()).toBe(0);
  });

  it("ignores keys from inside slides", async () => {
    const { controller, root } = setup({
      attrs: 'data-ok-align="start" data-ok-duration="0"',
      slideContent: (i) => `<button type="button">Item ${i}</button>`,
    });
    (root.querySelector("[data-slide='0'] button") as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(controller.selectedScrollSnap()).toBe(0);
  });

  it("mirrors right to left", async () => {
    const { viewport, controller } = setup({
      attrs: 'data-ok-align="start" data-ok-duration="0"',
      dir: "rtl",
    });
    controller.scrollNext(true);
    expect(viewport.scrollLeft).toBe(-200);
    viewport.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(controller.selectedScrollSnap()).toBe(2);
    await userEvent.keyboard("{ArrowRight}");
    expect(controller.selectedScrollSnap()).toBe(1);
  });

  it("scrolls vertically", async () => {
    const { viewport, controller } = setup({
      attrs: 'data-ok-axis="y" data-ok-align="start" data-ok-duration="0"',
    });
    expect(controller.scrollSnapList()).toHaveLength(3);
    controller.scrollNext(true);
    expect(viewport.scrollTop).toBe(100);
    viewport.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(controller.selectedScrollSnap()).toBe(2);
    await userEvent.keyboard("{ArrowUp}");
    expect(controller.selectedScrollSnap()).toBe(1);
  });

  it("aligns and contains the snaps", () => {
    const center = setup({ attrs: 'data-ok-align="center"' });
    expect(center.controller.scrollSnapList()).toEqual([0, 0.25, 0.75, 1]);
    const end = setup({ attrs: 'data-ok-align="end"' });
    expect(end.controller.scrollSnapList()).toEqual([0, 0.5, 1]);
    const keep = setup({ attrs: 'data-ok-align="start" data-ok-contain-scroll="keepSnaps"' });
    expect(keep.controller.scrollSnapList()).toEqual([0, 0.5, 1, 1]);
    keep.controller.scrollTo(3, true);
    expect(keep.controller.selectedScrollSnap()).toBe(3);
    const free = setup({ attrs: 'data-ok-align="center" data-ok-contain-scroll="false"' });
    expect(free.controller.scrollSnapList()).toHaveLength(4);
    expect(
      free.root
        .querySelector<HTMLElement>("[data-ok-carousel-container]")
        ?.style.getPropertyValue("--_ok-carousel-lead"),
    ).toBe("100px");
    const number = setup({ attrs: 'data-ok-align="0.25"' });
    expect(number.slides[0]?.style.getPropertyValue("--_ok-carousel-snap-start")).toBe("100px");
    const fn = setup({ attrs: "" }, { align: () => (view, size) => view - size });
    expect(fn.slides[1]?.style.getPropertyValue("--_ok-carousel-snap-start")).toBe("200px");
  });

  it("groups slides", () => {
    const two = setup({ count: 5, attrs: 'data-ok-align="start" data-ok-slides-to-scroll="2"' });
    expect(two.controller.scrollSnapList()).toHaveLength(3);
    two.controller.scrollNext(true);
    expect(two.snapped()).toEqual([2, 3]);
    expect(two.slides[3]?.style.getPropertyValue("--_ok-carousel-snap-align")).toBe("none");
    const auto = setup({
      count: 5,
      sizes: [150, 150, 150, 150, 150],
      attrs: 'data-ok-align="end" data-ok-slides-to-scroll="auto"',
    });
    expect(auto.slides[1]?.style.getPropertyValue("--_ok-carousel-snap-align")).toBe("end");
    const centered = setup({ attrs: 'data-ok-align="center" data-ok-slides-to-scroll="2"' });
    expect(centered.slides[0]?.style.getPropertyValue("--_ok-carousel-snap-end")).toBe("200px");
  });

  it("loops without clones", async () => {
    const { root, controller, slides, events, viewport } = setup({
      count: 5,
      attrs: 'data-ok-loop data-ok-align="start" data-ok-duration="1"',
    });
    expect(root.hasAttribute(CAROUSEL_FLAGS.looping)).toBe(true);
    expect(controller.canScrollPrev()).toBe(true);
    expect(slides.map((s) => s.style.getPropertyValue("--_ok-carousel-order"))).toEqual([
      "2",
      "3",
      "4",
      "0",
      "1",
    ]);
    controller.scrollPrev(true);
    expect(controller.selectedScrollSnap()).toBe(4);
    await frames();
    controller.scrollNext(true);
    controller.scrollNext(true);
    expect(controller.selectedScrollSnap()).toBe(1);
    controller.scrollTo(-1);
    await settled(events);
    expect(controller.selectedScrollSnap()).toBe(4);
    expect(controller.scrollSnapList()).toEqual([0, 0.25, 0.5, 0.75, 1]);
    const progress = controller.scrollProgress();
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThan(1);
    // Scrolling near an edge rotates the order again.
    viewport.scrollLeft = 0;
    await frames(4);
    expect(viewport.scrollLeft).toBeGreaterThan(0);
  });

  it("falls back from loop when the content is too short", () => {
    const { root, controller } = setup({ count: 2, attrs: "data-ok-loop" });
    expect(root.hasAttribute(CAROUSEL_FLAGS.looping)).toBe(false);
    expect(controller.canScrollPrev()).toBe(false);
  });

  it("fades between slides and swipes", () => {
    const { controller, snapped, events, viewport } = setup({
      attrs: 'data-ok-effect="fade" data-ok-duration="0"',
    });
    expect(controller.scrollSnapList()).toEqual([0, 1 / 3, 2 / 3, 1]);
    expect(controller.slidesInView()).toEqual([0]);
    controller.scrollNext();
    expect(snapped()).toEqual([1]);
    expect(controller.slidesInView()).toEqual([1]);
    expect(controller.slidesNotInView()).toEqual([0, 2, 3]);
    expect(controller.scrollProgress()).toBeCloseTo(1 / 3);
    pointer(viewport, "pointerdown", 300, 10, "touch");
    pointer(viewport, "pointermove", 200, 10, "touch");
    pointer(viewport, "pointerup", 200, 10, "touch");
    expect(snapped()).toEqual([2]);
    pointer(viewport, "pointerdown", 100, 10, "touch");
    pointer(viewport, "pointermove", 250, 10, "touch");
    pointer(viewport, "pointerup", 250, 10, "touch");
    expect(snapped()).toEqual([1]);
    pointer(viewport, "pointerdown", 100, 10, "touch");
    pointer(viewport, "pointerup", 105, 10, "touch");
    expect(snapped()).toEqual([1]);
    expect(events.pointer).toContain("down");
    expect(events.pointer).toContain("up");
  });

  it("writes tween values for the effects", () => {
    const { slides, controller } = setup({
      count: 5,
      attrs: 'data-ok-effect="scale" data-ok-align="start"',
    });
    expect(slides[0]?.style.getPropertyValue("--_ok-carousel-tween")).toBe("1.000");
    expect(slides[1]?.style.getPropertyValue("--_ok-carousel-tween")).toBe("0.000");
    controller.scrollNext(true);
    expect(slides[1]?.style.getPropertyValue("--_ok-carousel-tween")).toBe("1.000");
    const loop = setup({
      count: 5,
      attrs: 'data-ok-effect="parallax" data-ok-loop data-ok-align="start"',
    });
    expect(loop.slides[1]?.style.getPropertyValue("--_ok-carousel-parallax")).toBe("1.000");
  });

  it("follows the height of the selected slides", async () => {
    const { viewport, controller, events } = setup({
      attrs: 'data-ok-auto-height data-ok-align="start"',
      heights: [80, 120, 60, 90],
    });
    expect(viewport.style.getPropertyValue("--_ok-carousel-height")).toBe("80px");
    controller.scrollTo(2, true);
    expect(viewport.style.getPropertyValue("--_ok-carousel-height")).toBe("90px");
    const inView = setup({
      attrs: 'data-ok-auto-height data-ok-height-event="slidesInView" data-ok-align="start"',
      heights: [80, 120, 60, 90],
    });
    await until(() => inView.events.inView.length > 0);
    expect(inView.viewport.style.getPropertyValue("--_ok-carousel-height")).toBe("120px");
    expect(events.inView.length).toBeGreaterThanOrEqual(0);
    const vertical = setup({ attrs: 'data-ok-auto-height data-ok-axis="y"' });
    expect(vertical.viewport.style.getPropertyValue("--_ok-carousel-height")).toBe("");
  });

  it("reports the slides in view", async () => {
    const { events, controller, slides } = setup({ attrs: 'data-ok-align="start"' });
    await until(() => events.inView.length > 0);
    expect(events.inView.at(-1)).toEqual([0, 1]);
    expect(slides[0]?.hasAttribute("data-ok-in-view")).toBe(true);
    controller.scrollTo(2, true);
    await until(() => JSON.stringify(events.inView.at(-1)) === "[2,3]");
    expect(controller.slidesNotInView()).toEqual([0, 1]);
  });

  it("drags with the mouse", async () => {
    const { viewport, controller, root } = setup({
      attrs: 'data-ok-align="start" data-ok-duration="1"',
    });
    pointer(viewport, "pointerdown", 300);
    expect(root.hasAttribute(CAROUSEL_FLAGS.pointerDown)).toBe(true);
    pointer(viewport, "pointermove", 250);
    pointer(viewport, "pointermove", 200);
    expect(root.hasAttribute(CAROUSEL_FLAGS.dragging)).toBe(true);
    expect(viewport.scrollLeft).toBe(100);
    pointer(viewport, "pointerup", 200);
    expect(root.hasAttribute(CAROUSEL_FLAGS.dragging)).toBe(false);
    // A drag past the threshold swallows the click that follows.
    const clicked = vi.fn();
    root.addEventListener("click", (event) => clicked(event.defaultPrevented));
    viewport.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(clicked).toHaveBeenCalledWith(true);
    await idle(root);
    expect(controller.selectedScrollSnap()).toBe(1);
    // A short drag back stays.
    pointer(viewport, "pointerdown", 200);
    pointer(viewport, "pointermove", 195);
    pointer(viewport, "pointerup", 195);
    await idle(root);
    expect(controller.selectedScrollSnap()).toBe(1);
    // Drags backwards.
    pointer(viewport, "pointerdown", 100);
    pointer(viewport, "pointermove", 160);
    pointer(viewport, "pointerup", 160);
    await idle(root);
    expect(controller.selectedScrollSnap()).toBe(0);
    // Other buttons, form fields and other pointers are ignored.
    viewport.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 2, pointerType: "mouse" }),
    );
    pointer(viewport, "pointermove", 100);
    pointer(viewport, "pointerup", 100);
    expect(controller.selectedScrollSnap()).toBe(0);
  });

  it("drags freely and skips snaps", async () => {
    const free = setup({
      count: 8,
      attrs: 'data-ok-align="start" data-ok-drag-free data-ok-duration="1"',
    });
    await frames(3);
    pointer(free.viewport, "pointerdown", 380);
    pointer(free.viewport, "pointermove", 300);
    pointer(free.viewport, "pointerup", 300);
    await idle(free.root);
    expect(free.viewport.scrollLeft).toBeGreaterThan(80);
    const skip = setup({
      count: 8,
      attrs: 'data-ok-align="start" data-ok-skip-snaps data-ok-duration="1"',
    });
    pointer(skip.viewport, "pointerdown", 380);
    pointer(skip.viewport, "pointermove", 370);
    pointer(skip.viewport, "pointerup", 30);
    await idle(skip.root);
    expect(skip.controller.selectedScrollSnap()).toBeGreaterThanOrEqual(1);
  });

  it("lets touch scroll natively", () => {
    const { viewport, controller, root } = setup({ attrs: 'data-ok-align="start"' });
    pointer(viewport, "pointerdown", 300, 10, "touch");
    pointer(viewport, "pointermove", 100, 10, "touch");
    pointer(viewport, "pointercancel", 100, 10, "touch");
    expect(controller.selectedScrollSnap()).toBe(0);
    expect(root.hasAttribute(CAROUSEL_FLAGS.pointerDown)).toBe(false);
    // Firefox on desktop has no TouchEvent constructor.
    if (typeof TouchEvent === "function")
      viewport.dispatchEvent(new TouchEvent("touchstart", { bubbles: true }));
  });

  it("does not drag when draggable is off", () => {
    const { viewport, controller, root } = setup({ attrs: 'data-ok-draggable="false"' });
    pointer(viewport, "pointerdown", 300);
    pointer(viewport, "pointermove", 100);
    pointer(viewport, "pointerup", 100);
    expect(controller.selectedScrollSnap()).toBe(0);
    expect(viewport.style.getPropertyValue("--_ok-carousel-overflow")).toBe("hidden");
    const field = setup({
      attrs: 'data-ok-align="start"',
      slideContent: () => "<input aria-label='Field'>",
    });
    pointer(field.root.querySelector("input") as Element, "pointerdown", 300);
    expect(field.root.hasAttribute(CAROUSEL_FLAGS.pointerDown)).toBe(false);
    root.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true }));
    const image = document.createElement("img");
    viewport.append(image);
    const drag = new DragEvent("dragstart", { bubbles: true, cancelable: true });
    image.dispatchEvent(drag);
    expect(drag.defaultPrevented).toBe(true);
  });

  it("moves one snap per wheel gesture", async () => {
    const { viewport, controller } = setup({
      attrs: 'data-ok-align="start" data-ok-wheel-gestures data-ok-duration="0"',
    });
    const wheel = (deltaX: number, deltaY = 0) => {
      const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX, deltaY });
      viewport.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(wheel(0, 50)).toBe(false);
    expect(wheel(10)).toBe(true);
    expect(controller.selectedScrollSnap()).toBe(0);
    wheel(40);
    expect(controller.selectedScrollSnap()).toBe(1);
    wheel(80);
    expect(controller.selectedScrollSnap()).toBe(1);
    await delay(200);
    wheel(-60);
    expect(controller.selectedScrollSnap()).toBe(0);
    const y = setup({
      attrs:
        'data-ok-align="start" data-ok-wheel-gestures data-ok-force-wheel-axis="y" data-ok-duration="0"',
    });
    y.viewport.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 60 }),
    );
    expect(y.controller.selectedScrollSnap()).toBe(1);
    const free = setup({
      attrs: 'data-ok-align="start" data-ok-wheel-gestures data-ok-drag-free',
    });
    free.viewport.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: 70 }),
    );
    expect(free.viewport.scrollLeft).toBe(70);
    const off = setup({ attrs: "" });
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: 70 });
    off.viewport.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("scrolls to a slide that gets keyboard focus", async () => {
    const { root, controller, events } = setup({
      attrs: 'data-ok-align="start" data-ok-duration="0"',
      slideContent: (i) => `<button type="button">Item ${i}</button>`,
    });
    (root.querySelector("[data-ok-carousel-viewport]") as HTMLElement).focus();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await frames();
    expect(events.focus).toContain(3);
    expect(controller.selectedScrollSnap()).toBe(2);
    const off = setup({
      attrs: 'data-ok-align="start" data-ok-focus="false" data-ok-duration="0"',
      slideContent: (i) => `<button type="button">Item ${i}</button>`,
    });
    off.viewport.focus();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(off.events.focus).toContain(2);
    expect(off.events.select.length).toBeLessThanOrEqual(1);
  });

  it("plays, pauses and stops autoplay", async () => {
    const { root, controller, events, viewport } = setup({
      attrs:
        'data-ok-align="start" data-ok-autoplay data-ok-autoplay-delay="40" data-ok-autoplay-jump data-ok-duration="0"',
    });
    expect(controller.autoplay.isPlaying()).toBe(true);
    expect(root.hasAttribute(CAROUSEL_FLAGS.playing)).toBe(true);
    expect(root.querySelector("[data-ok-carousel-live]")?.getAttribute("aria-live")).toBe("off");
    expect(events.autoplay).toEqual([true]);
    const left = controller.autoplay.timeUntilNext() as number;
    expect(left).toBeGreaterThan(0);
    await until(() => controller.selectedScrollSnap() === 2);
    await until(() => controller.selectedScrollSnap() === 0);
    const bar = root.querySelector<HTMLElement>(
      '[data-ok-carousel-progress][data-ok-variant="autoplay"]',
    );
    expect(bar?.style.getPropertyValue("--_ok-carousel-progress")).not.toBe("");
    // Hover pauses, leaving resumes.
    root.dispatchEvent(new MouseEvent("mouseenter"));
    const paused = controller.autoplay.timeUntilNext();
    await delay(80);
    expect(controller.autoplay.timeUntilNext()).toBe(paused);
    root.dispatchEvent(new MouseEvent("mouseleave"));
    await until(() => controller.selectedScrollSnap() === 1);
    controller.autoplay.reset();
    // Pointer down stops it.
    pointer(viewport, "pointerdown", 100);
    pointer(viewport, "pointerup", 100);
    expect(controller.autoplay.isPlaying()).toBe(false);
    expect(controller.autoplay.timeUntilNext()).toBeNull();
    expect(events.autoplay).toEqual([true, false]);
    controller.autoplay.stop();
    expect(events.autoplay).toEqual([true, false]);
    controller.autoplay.reset();
    // The play button starts it again.
    const button = document.createElement("button");
    button.setAttribute("data-ok-carousel-play", "");
    root.append(button);
    button.click();
    expect(controller.autoplay.isPlaying()).toBe(true);
    button.click();
    expect(controller.autoplay.isPlaying()).toBe(false);
  });

  it("stops autoplay on keyboard focus and at the last snap", async () => {
    const { controller, viewport } = setup({
      attrs: 'data-ok-align="start" data-ok-autoplay data-ok-play-on-init="false"',
    });
    expect(controller.autoplay.isPlaying()).toBe(false);
    controller.autoplay.play();
    viewport.focus();
    await userEvent.keyboard("{Shift}");
    viewport.blur();
    await userEvent.tab();
    expect(controller.autoplay.isPlaying()).toBe(false);
    const last = setup({
      attrs:
        'data-ok-align="start" data-ok-autoplay data-ok-autoplay-delay="20" data-ok-stop-on-last-snap data-ok-duration="0"',
    });
    await until(() => !last.controller.autoplay.isPlaying());
    expect(last.controller.selectedScrollSnap()).toBe(2);
  });

  it("pauses autoplay during interactions when stopOnInteraction is off", async () => {
    const { controller, viewport, events } = setup({
      attrs:
        'data-ok-align="start" data-ok-autoplay data-ok-autoplay-delay="5000" data-ok-stop-on-interaction="false" data-ok-stop-on-mouse-enter="false" data-ok-duration="1"',
    });
    pointer(viewport, "pointerdown", 300);
    expect(controller.autoplay.isPlaying()).toBe(true);
    const left = controller.autoplay.timeUntilNext();
    await delay(30);
    expect(controller.autoplay.timeUntilNext()).toBe(left);
    pointer(viewport, "pointermove", 200);
    pointer(viewport, "pointerup", 200);
    await idle(viewport.closest("[data-ok-carousel]") as Element);
    await until(() => events.settle.length > 0);
    await delay(30);
    expect((controller.autoplay.timeUntilNext() as number) < (left as number)).toBe(true);
    // Hovering doesn't pause when stopOnMouseEnter is off.
    const root = viewport.closest("[data-ok-carousel]") as HTMLElement;
    root.dispatchEvent(new MouseEvent("mouseenter"));
    await delay(20);
    expect((controller.autoplay.timeUntilNext() as number) < 5000).toBe(true);
  });

  it("auto scrolls", async () => {
    const { controller, viewport, root, events } = setup({
      count: 4,
      attrs:
        'data-ok-align="start" data-ok-auto-scroll data-ok-auto-scroll-start-delay="0" data-ok-auto-scroll-speed="40"',
    });
    expect(controller.autoScroll.isPlaying()).toBe(true);
    await until(() => root.hasAttribute(CAROUSEL_FLAGS.autoScrolling));
    await until(() => viewport.scrollLeft > 0);
    // Without loop it stops at the end.
    await until(() => !controller.autoScroll.isPlaying());
    expect(events.autoScroll).toEqual([true, false]);
    controller.autoScroll.play(0);
    controller.autoScroll.reset();
    root.dispatchEvent(new MouseEvent("mouseenter"));
    root.dispatchEvent(new MouseEvent("mouseleave"));
    controller.autoScroll.stop();
    expect(controller.autoScroll.isPlaying()).toBe(false);
    // Playing autoplay stops auto scroll and the other way round.
    controller.autoScroll.play(5000);
    controller.autoplay.play();
    expect(controller.autoScroll.isPlaying()).toBe(false);
    controller.autoScroll.play(5000);
    expect(controller.autoplay.isPlaying()).toBe(false);
    // The play button toggles auto scroll when autoplay is off.
    const button = document.createElement("button");
    button.setAttribute("data-ok-carousel-play", "");
    root.append(button);
    button.click();
    expect(controller.autoScroll.isPlaying()).toBe(false);
    button.click();
    expect(controller.autoScroll.isPlaying()).toBe(true);
    pointer(viewport, "pointerdown", 100);
    expect(controller.autoScroll.isPlaying()).toBe(false);
  });

  it("auto scrolls backwards around a loop and pauses on interaction", async () => {
    const { controller, viewport, root } = setup({
      count: 5,
      attrs:
        'data-ok-loop data-ok-auto-scroll data-ok-auto-scroll-direction="backward" data-ok-auto-scroll-start-delay="0" data-ok-auto-scroll-speed="30" data-ok-stop-on-interaction="false"',
    });
    const start = viewport.scrollLeft;
    await until(() => viewport.scrollLeft !== start);
    pointer(viewport, "pointerdown", 100);
    expect(controller.autoScroll.isPlaying()).toBe(true);
    expect(root.hasAttribute(CAROUSEL_FLAGS.autoScrolling)).toBe(false);
    pointer(viewport, "pointerup", 100);
    root.dispatchEvent(new MouseEvent("mouseleave"));
    await until(() => root.hasAttribute(CAROUSEL_FLAGS.autoScrolling));
    controller.autoScroll.stop();
  });

  it("stops everything on focus when asked", async () => {
    const { controller, viewport } = setup({
      attrs: 'data-ok-auto-scroll data-ok-auto-scroll-start-delay="5000"',
    });
    expect(controller.autoScroll.isPlaying()).toBe(true);
    viewport.blur();
    await userEvent.tab();
    expect(controller.autoScroll.isPlaying()).toBe(false);
    const keep = setup({
      attrs: 'data-ok-autoplay data-ok-stop-on-focus-in="false" data-ok-autoplay-delay="5000"',
    });
    keep.viewport.focus();
    await userEvent.keyboard("{Shift}");
    expect(keep.controller.autoplay.isPlaying()).toBe(true);
  });

  it("applies matching breakpoints and re-initializes on changes", async () => {
    const { root, controller, events, host } = setup({
      count: 5,
      attrs: `data-ok-align="start" data-ok-breakpoints='{"(min-width: 1px)": {"loop": true}}'`,
    });
    expect(root.hasAttribute(CAROUSEL_FLAGS.looping)).toBe(true);
    root.setAttribute("data-ok-breakpoints", '{"(max-width: 1px)": {"loop": true}}');
    await frames(2);
    expect(root.hasAttribute(CAROUSEL_FLAGS.looping)).toBe(false);
    root.setAttribute("data-ok-slides-to-scroll", "2");
    await frames(2);
    expect(controller.scrollSnapList()).toHaveLength(3);
    expect(events.reinit).toEqual([5, 4, 3]);
    // New slides re-initialize; new dots get the state.
    const container = root.querySelector("[data-ok-carousel-container]") as HTMLElement;
    container.append(container.firstElementChild?.cloneNode(true) as Node);
    await frames(2);
    expect(events.reinit.at(-1)).toBe(3);
    const dots = root.querySelector("[data-ok-carousel-dots]") as HTMLElement;
    dots.replaceChildren(document.createElement("button"));
    (dots.firstElementChild as HTMLElement).setAttribute("data-ok-carousel-dot", "");
    await frames(2);
    expect(dots.firstElementChild?.getAttribute("aria-current")).toBe("true");
    expect(host).toBeTruthy();
  });

  it("does nothing while inactive", () => {
    const { controller, viewport, prev, next } = setup({ attrs: 'data-ok-active="false"' });
    controller.scrollNext();
    expect(controller.selectedScrollSnap()).toBe(0);
    expect(prev.getAttribute("aria-disabled")).toBe("true");
    expect(next.getAttribute("aria-disabled")).toBe("true");
    expect(viewport.style.getPropertyValue("--_ok-carousel-snap")).toBe("none");
    pointer(viewport, "pointerdown", 100);
  });

  it("re-measures on resize", async () => {
    const { root, events, viewport } = setup({ attrs: 'data-ok-align="start"' });
    viewport.style.width = "200px";
    await until(() => events.reinit.length > 1);
    expect(events.reinit.at(-1)).toBe(4);
    expect(root.hasAttribute(CAROUSEL_FLAGS.ready)).toBe(true);
  });

  it("survives missing parts and cleans up", () => {
    const host = mount(
      '<section data-ok-carousel aria-label="Empty"><span data-ok-carousel-counter>x</span></section>',
    );
    const root = host.firstElementChild as HTMLElement;
    const controller = createCarouselController(root);
    controllers.push(controller);
    controller.scrollNext();
    expect(controller.scrollSnapList()).toEqual([]);
    expect(controller.scrollProgress()).toBe(0);
    controller.scrollTo(1);
    expect(root.querySelector("[data-ok-carousel-counter]")?.textContent).toBe("");
    expect(controller.containerNode()).toBeNull();
    const { root: full, controller: other, slides } = setup({ count: 5, attrs: "data-ok-loop" });
    other.destroy();
    expect(full.hasAttribute(CAROUSEL_FLAGS.ready)).toBe(false);
    expect(slides[0]?.style.getPropertyValue("--_ok-carousel-order")).toBe("");
  });

  it("ignores nested carousels' controls", () => {
    const { root, controller } = setup({
      attrs: 'data-ok-align="start" data-ok-duration="0"',
      controls:
        '<section data-ok-carousel aria-label="Inner"><button type="button" data-ok-carousel-next>Inner next</button></section>',
    });
    (root.querySelector('[aria-label="Inner"] [data-ok-carousel-next]') as HTMLElement).click();
    expect(controller.selectedScrollSnap()).toBe(0);
  });

  it("uses an in-view threshold", async () => {
    const { events, controller } = setup({
      attrs: 'data-ok-align="start" data-ok-in-view-threshold="0.5"',
      sizes: [300, 300, 300, 300],
    });
    await until(() => events.inView.length > 0);
    expect(controller.slidesInView()).toEqual([0]);
    controller.scrollTo(1, true);
    await until(() => controller.slidesInView().includes(1));
    const wide = setup({ attrs: 'data-ok-align="start"', sizes: [150, 150, 150, 150] });
    await until(() => wide.controller.slidesInView().length >= 2);
    expect(wide.controller.slidesInView()).toEqual([0, 1, 2]);
  });

  it("drags vertically, right to left and around a loop", async () => {
    const y = setup({ attrs: 'data-ok-axis="y" data-ok-align="start" data-ok-duration="1"' });
    pointer(y.viewport, "pointerdown", 10, 150);
    for (let i = 1; i <= 8; i++) pointer(y.viewport, "pointermove", 10, 150 - i * 10);
    pointer(y.viewport, "pointerup", 10, 70);
    await idle(y.root);
    expect(y.controller.selectedScrollSnap()).toBe(1);
    const rtl = setup({ attrs: 'data-ok-align="start" data-ok-duration="1"', dir: "rtl" });
    pointer(rtl.viewport, "pointerdown", 100);
    pointer(rtl.viewport, "pointermove", 200);
    pointer(rtl.viewport, "pointerup", 200);
    await idle(rtl.root);
    expect(rtl.controller.selectedScrollSnap()).toBe(1);
    const loop = setup({
      count: 5,
      attrs: 'data-ok-loop data-ok-align="start" data-ok-duration="1"',
    });
    pointer(loop.viewport, "pointerdown", 0);
    pointer(loop.viewport, "pointermove", 390);
    pointer(loop.viewport, "pointermove", 395);
    pointer(loop.viewport, "pointerup", 395);
    loop.root.dispatchEvent(new PointerEvent("lostpointercapture", { pointerId: 7 }));
    await idle(loop.root);
    expect(loop.controller.selectedScrollSnap()).toBe(4);
  });

  it("stays at the ends when fading", () => {
    const { controller, viewport } = setup({ count: 2, attrs: 'data-ok-effect="fade"' });
    pointer(viewport, "pointerdown", 100, 10, "touch");
    pointer(viewport, "pointerup", 250, 10, "touch");
    expect(controller.selectedScrollSnap()).toBe(0);
    controller.scrollTo(1);
    pointer(viewport, "pointerdown", 300, 10, "touch");
    pointer(viewport, "pointerup", 100, 10, "touch");
    expect(controller.selectedScrollSnap()).toBe(1);
    const one = setup({ count: 1, attrs: 'data-ok-effect="fade"' });
    expect(one.controller.scrollProgress()).toBe(0);
    expect(one.controller.scrollSnapList()).toEqual([0]);
  });

  it("keeps the selected thumbnail in view", async () => {
    const thumbs = (orientation: string, count: number) =>
      `<div data-ok-carousel-thumbs data-ok-orientation="${orientation}" style="display:flex;${orientation === "vertical" ? "flex-direction:column;height:60px" : "width:60px"};overflow:hidden">${Array.from({ length: count }, () => '<button type="button" data-ok-carousel-thumb style="flex:none;width:40px;height:40px"></button>').join("")}</div>`;
    const { root, controller } = setup({
      attrs: 'data-ok-align="start" data-ok-duration="0" data-ok-slides-to-scroll="1"',
      sizes: [400, 400, 400, 400],
      controls: `${thumbs("horizontal", 4)}${thumbs("vertical", 4)}<div data-ok-carousel-thumbs></div>`,
    });
    const [row, column] = root.querySelectorAll<HTMLElement>("[data-ok-carousel-thumbs]");
    controller.scrollTo(3);
    await until(() => (row as HTMLElement).scrollLeft > 0 && (column as HTMLElement).scrollTop > 0);
    controller.scrollTo(0);
    await until(
      () => (row as HTMLElement).scrollLeft === 0 && (column as HTMLElement).scrollTop === 0,
    );
  });

  it("settles after native scrolling", async () => {
    const { viewport, events, controller } = setup({ attrs: 'data-ok-align="start"' });
    await frames(3);
    viewport.scrollLeft = 200;
    viewport.dispatchEvent(new Event("scroll"));
    viewport.dispatchEvent(new Event("scroll"));
    await settled(events);
    expect(controller.selectedScrollSnap()).toBe(1);
    expect(events.settle.at(-1)).toBe(1);
  });

  it("resets and keeps autoplay paused while needed", async () => {
    const { controller, viewport, root, next, events } = setup({
      attrs:
        'data-ok-align="start" data-ok-autoplay data-ok-autoplay-delay="5000" data-ok-stop-on-interaction="false" data-ok-duration="1"',
    });
    await delay(30);
    next.click();
    expect((controller.autoplay.timeUntilNext() as number) > 4990).toBe(true);
    root.dispatchEvent(new MouseEvent("mouseenter"));
    pointer(viewport, "pointerdown", 300);
    pointer(viewport, "pointermove", 100);
    pointer(viewport, "pointerup", 100);
    await settled(events);
    const left = controller.autoplay.timeUntilNext();
    await delay(30);
    expect(controller.autoplay.timeUntilNext()).toBe(left);
    root.dispatchEvent(new MouseEvent("mouseleave"));
    await delay(30);
    expect((controller.autoplay.timeUntilNext() as number) < (left as number)).toBe(true);
  });

  it("handles wheels on every axis", async () => {
    const wheel = (target: Element, deltaX: number, deltaY: number) =>
      target.dispatchEvent(
        new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX, deltaY }),
      );
    const y = setup({
      attrs: 'data-ok-axis="y" data-ok-align="start" data-ok-wheel-gestures data-ok-duration="0"',
    });
    wheel(y.viewport, 80, 0);
    expect(y.controller.selectedScrollSnap()).toBe(0);
    wheel(y.viewport, 0, 80);
    expect(y.controller.selectedScrollSnap()).toBe(1);
    const rtl = setup({
      attrs: 'data-ok-align="start" data-ok-wheel-gestures data-ok-duration="0"',
      dir: "rtl",
    });
    wheel(rtl.viewport, -80, 0);
    expect(rtl.controller.selectedScrollSnap()).toBe(1);
    const free = setup({
      attrs: 'data-ok-align="start" data-ok-wheel-gestures data-ok-drag-free',
      dir: "rtl",
    });
    wheel(free.viewport, -50, 0);
    expect(free.viewport.scrollLeft).toBe(-50);
  });

  it("ignores focus on the play button and from the mouse", async () => {
    const { root, controller, events } = setup({
      attrs:
        'data-ok-align="start" data-ok-autoplay data-ok-autoplay-delay="5000" data-ok-duration="0"',
      controls: '<button type="button" data-ok-carousel-play>Play</button>',
      slideContent: (i) => `<button type="button">Item ${i}</button>`,
    });
    const play = root.querySelector("[data-ok-carousel-play]") as HTMLElement;
    play.focus();
    await userEvent.keyboard("{Shift}");
    play.blur();
    play.focus();
    expect(controller.autoplay.isPlaying()).toBe(true);
    // A mouse click focuses without :focus-visible: no slide focus (the press stops autoplay).
    await userEvent.click(root.querySelector("[data-slide='1'] button") as HTMLElement);
    expect(events.focus).toEqual([]);
  });
});
