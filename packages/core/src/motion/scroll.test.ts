import { afterEach, describe, expect, it, vi } from "vitest";
import scrollCss from "../../../styles/dist/components/scroll-progress.css?raw";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  createScrollProgress,
  measureScroll,
  observeScroll,
  parseScrollOffset,
  parseScrollSmooth,
  readScrollProgress,
  supportsScrollTimeline,
} from "./scroll.js";

const STYLE = `<style>${scrollCss}
  .box { height: 100px; width: 100px; overflow: auto; }
  .tall { height: 500px; width: 500px; position: relative; }
  .item { position: absolute; top: 200px; height: 50px; width: 50px; }
</style>`;

/** A 100 × 100 scroll container over 500 × 500 content, with a target 200px down. */
const setup = (extra = "") => {
  mount(
    `${STYLE}<span id="bar" data-ok-scroll-progress ${extra}></span><div id="box" class="box"><div class="tall"><div id="item" class="item"></div></div></div>`,
  );
  return {
    bar: document.getElementById("bar") as HTMLElement,
    box: document.getElementById("box") as HTMLElement,
    item: document.getElementById("item") as HTMLElement,
  };
};

/** Scroll events and timelines update on the next frames. */
const frames = async () => {
  await nextFrame();
  await nextFrame();
};

/** Pretends scroll-driven animations aren't supported (other features stay as they are). */
const withoutTimelines = () => {
  const supports = CSS.supports.bind(CSS) as (...args: string[]) => boolean;
  vi.spyOn(CSS, "supports").mockImplementation((...args: string[]) =>
    args.join(" ").includes("animation-timeline") ? false : supports(...args),
  );
};

const shown = (element: Element) =>
  Number(getComputedStyle(element).getPropertyValue("--_ok-scroll-progress"));

afterEach(() => {
  vi.restoreAllMocks();
  cleanupDom();
  window.scrollTo(0, 0);
});

describe("parseScrollOffset", () => {
  it("defaults to the whole range", () => {
    const parsed = parseScrollOffset();
    expect(parsed.isDefault).toBe(true);
    expect(parsed.names).toEqual(["start start", "end end"]);
  });

  it("reads names, numbers, lengths and one edge for both", () => {
    const parsed = parseScrollOffset("start end, 0.5 50%");
    expect(parsed.isDefault).toBe(false);
    expect(parsed.names).toEqual(["start end", undefined]);
    expect(parsed.intersections[1]).toEqual([
      { fraction: 0.5, px: 0, vw: 0, vh: 0 },
      { fraction: 0.5, px: 0, vw: 0, vh: 0 },
    ]);
    const lengths = parseScrollOffset([[0, "100px"], "center"]);
    expect(lengths.intersections[0][1]).toEqual({ fraction: 0, px: 100, vw: 0, vh: 0 });
    expect(lengths.names[1]).toBe("center center");
    expect(parseScrollOffset(["10vw 20vh", "end"]).intersections[0]).toEqual([
      { fraction: 0, px: 0, vw: 10, vh: 0 },
      { fraction: 0, px: 0, vw: 0, vh: 20 },
    ]);
  });

  it("falls back to the default when anything is invalid", () => {
    for (const bad of ["start", "start end, middle end", "a b c, end", ""]) {
      expect(parseScrollOffset(bad).isDefault).toBe(true);
    }
    expect(parseScrollOffset([Number.NaN, "end"]).isDefault).toBe(true);
    expect(parseScrollOffset(["start end"] as unknown as [string, string]).isDefault).toBe(true);
  });
});

describe("measureScroll", () => {
  it("measures a container on each axis", () => {
    const { box } = setup();
    box.scrollTop = 100;
    box.scrollLeft = 200;
    expect(measureScroll({ container: box })).toEqual({ current: 100, progress: 0.25 });
    expect(measureScroll({ container: box, axis: "x" })).toEqual({ current: 200, progress: 0.5 });
  });

  it("measures a target between two intersections, clamped", () => {
    const { box, item } = setup();
    // "start end" at 200 − 100 = 100, "end start" at 250: 150px of range.
    const offset = "start end, end start";
    box.scrollTop = 50;
    expect(measureScroll({ container: box, target: item, offset }).progress).toBe(0);
    box.scrollTop = 175;
    expect(measureScroll({ container: box, target: item, offset }).progress).toBe(0.5);
    box.scrollTop = 300;
    expect(measureScroll({ container: box, target: item, offset }).progress).toBe(1);
  });

  it("shows nothing for an empty range", () => {
    const { box, item } = setup();
    const offset = "start start, start start";
    box.scrollTop = 200;
    expect(measureScroll({ container: box, target: item, offset }).progress).toBe(0);
    box.style.overflow = "hidden";
    box.style.height = "auto";
    expect(measureScroll({ container: box }).progress).toBe(0);
  });

  it("measures the page, its targets and viewport units", () => {
    mount(
      `<div style="height: 3000px"></div><div id="far" style="height: 10px"></div><div style="height: 3000px"></div>`,
    );
    window.scrollTo(0, 500);
    const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    expect(measureScroll({}).progress).toBeCloseTo(500 / max, 3);
    // From the target's top at the viewport's bottom to its top at the viewport's top.
    const far = document.getElementById("far") as HTMLElement;
    const height = document.documentElement.clientHeight;
    const top = far.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top - height / 2);
    const view = measureScroll({ target: far, offset: "start 100vh, start 0vh" });
    expect(view.current).toBe(top - height / 2);
    expect(view.progress).toBeCloseTo(0.5, 2);
  });

  it("measures a target on the x axis", () => {
    const { box, item } = setup();
    // The item is 50px wide at the start of the row: "start start" at 0, "end start" at 50.
    box.scrollLeft = 25;
    expect(
      measureScroll({ container: box, target: item, axis: "x", offset: "start start, end start" })
        .progress,
    ).toBe(0.5);
  });

  it("follows the inline direction from right to left", () => {
    const { box } = setup();
    box.dir = "rtl";
    box.scrollLeft = -200;
    expect(measureScroll({ container: box, axis: "x" })).toEqual({ current: 200, progress: 0.5 });
  });
});

describe("observeScroll", () => {
  it("reports both axes now and after a scroll, until stopped", async () => {
    const { box } = setup();
    const seen: number[] = [];
    const stop = observeScroll({ container: box }, (info) => seen.push(info.scrollYProgress));
    expect(seen).toEqual([0]);
    box.scrollTop = 200;
    await frames();
    expect(seen.at(-1)).toBe(0.5);
    stop();
    box.scrollTop = 400;
    await frames();
    expect(seen.at(-1)).toBe(0.5);
  });

  it("follows the page and the window's size", async () => {
    mount(`<div style="height: 3000px"></div>`);
    const seen: number[] = [];
    const stop = observeScroll({}, (info) => seen.push(info.scrollY));
    window.scrollTo(0, 300);
    await frames();
    expect(seen.at(-1)).toBe(300);
    window.dispatchEvent(new Event("resize"));
    await frames();
    stop();
  });
});

describe("readScrollProgress", () => {
  it("reads ids, the axis and the offset", () => {
    const { bar, box, item } = setup(
      'data-ok-scroll-container="box" data-ok-scroll-target="item" data-ok-scroll-axis="x" data-ok-scroll-offset="start end, end start"',
    );
    expect(readScrollProgress(bar)).toEqual({
      container: box,
      target: item,
      axis: "x",
      offset: "start end, end start",
    });
    bar.setAttribute("data-ok-scroll-container", "missing");
    bar.removeAttribute("data-ok-scroll-axis");
    bar.removeAttribute("data-ok-scroll-offset");
    expect(readScrollProgress(bar)).toMatchObject({
      container: null,
      axis: "y",
      offset: undefined,
    });
    bar.removeAttribute("data-ok-scroll-target");
    expect(readScrollProgress(bar).target).toBeNull();
  });
});

describe("createScrollProgress", () => {
  const native = supportsScrollTimeline();

  it("leaves the page's progress to the stylesheet where timelines exist", async () => {
    mount(`${STYLE}<div style="height: 3000px"></div>`);
    const bar = document.createElement("span");
    bar.setAttribute("data-ok-scroll-progress", "");
    document.body.prepend(bar);
    const controller = createScrollProgress(bar);
    expect(controller.mode).toBe(native ? "css" : "fallback");
    window.scrollTo(0, 400);
    await frames();
    const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    expect(controller.progress).toBeCloseTo(400 / max, 2);
    expect(shown(bar)).toBeCloseTo(400 / max, 2);
    controller.update();
    controller.destroy();
  });

  it("plays a native scroll timeline on a container", async () => {
    const { bar, box } = setup('data-ok-scroll-container="box"');
    const controller = createScrollProgress(bar, { container: box });
    expect(controller.mode).toBe(native ? "native" : "fallback");
    expect(bar.hasAttribute("data-ok-fallback")).toBe(!native);
    box.scrollTop = 200;
    await frames();
    expect(shown(bar)).toBeCloseTo(0.5, 2);
    expect(controller.progress).toBeCloseTo(0.5, 2);
    controller.update();
    controller.destroy();
    expect(bar.getAnimations()).toHaveLength(0);
    expect(bar.hasAttribute("data-ok-fallback")).toBe(false);
  });

  it("plays a view timeline for a target with named intersections", async () => {
    const { bar, box, item } = setup();
    const controller = createScrollProgress(bar, {
      container: box,
      target: item,
      offset: ["start end", "end start"],
    });
    expect(controller.mode).toBe(native ? "native" : "fallback");
    box.scrollTop = 175;
    await frames();
    expect(shown(bar)).toBeCloseTo(0.5, 2);
    controller.destroy();
  });

  it("measures offsets that no timeline range expresses", async () => {
    const { bar, box, item } = setup();
    const controller = createScrollProgress(bar, {
      container: box,
      target: item,
      offset: "start center, end center",
    });
    expect(controller.mode).toBe("fallback");
    // 200 − 50 = 150 to 250 − 50 = 200.
    box.scrollTop = 175;
    await frames();
    expect(controller.progress).toBe(0.5);
    expect(shown(bar)).toBeCloseTo(0.5, 2);
    controller.destroy();
  });

  it("measures a target that another element scrolls", () => {
    const { bar, item } = setup();
    // The target's scroll container is the box, not the page.
    const controller = createScrollProgress(bar, { target: item, offset: "start end, end start" });
    expect(controller.mode).toBe("fallback");
    controller.destroy();
  });

  it("plays a view timeline for a target on the page", async () => {
    mount(
      `${STYLE}<div style="height: 3000px"></div><div id="far" style="height: 100px"></div><div style="height: 3000px"></div>`,
    );
    const bar = document.createElement("span");
    document.body.prepend(bar);
    const far = document.getElementById("far") as HTMLElement;
    const controller = createScrollProgress(bar, { target: far, offset: "start end, end start" });
    expect(controller.mode).toBe(native ? "native" : "fallback");
    const top = far.getBoundingClientRect().top + window.scrollY;
    const height = document.documentElement.clientHeight;
    // Halfway from "start end" (top − height) to "end start" (top + 100).
    window.scrollTo(0, top - height + (height + 100) / 2);
    await frames();
    expect(shown(bar)).toBeCloseTo(0.5, 2);
    controller.destroy();
  });

  it("measures offsets without names, with or without a target", () => {
    const { bar, box, item } = setup();
    for (const target of [item, null]) {
      const controller = createScrollProgress(bar, { container: box, target, offset: "0 0, 1 1" });
      expect(controller.mode).toBe("fallback");
      controller.destroy();
    }
  });

  it("falls back to the script without scroll-driven animations", async () => {
    withoutTimelines();
    expect(supportsScrollTimeline()).toBe(false);
    const { bar, box } = setup('data-ok-scroll-container="box" data-ok-scroll-axis="x"');
    const controller = createScrollProgress(bar, { container: box, axis: "x" });
    expect(controller.mode).toBe("fallback");
    expect(bar.hasAttribute("data-ok-fallback")).toBe(true);
    expect(controller.progress).toBe(0);
    box.scrollLeft = 100;
    await frames();
    expect(controller.progress).toBe(0.25);
    expect(shown(bar)).toBeCloseTo(0.25, 2);
    // Content that grows without a scroll: `update()` measures again.
    (box.firstElementChild as HTMLElement).style.width = "900px";
    controller.update();
    expect(controller.progress).toBe(0.125);
    controller.destroy();
    expect(bar.hasAttribute("data-ok-fallback")).toBe(false);
    box.scrollLeft = 300;
    await frames();
    expect(shown(bar)).toBe(0);
  });

  it("keeps following the position with reduced motion", async () => {
    withoutTimelines();
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: query.includes("reduce"), media: query }) as MediaQueryList,
    );
    const { bar, box } = setup();
    const controller = createScrollProgress(bar, { container: box });
    box.scrollTop = 100;
    await frames();
    expect(shown(bar)).toBeCloseTo(0.25, 2);
    controller.destroy();
  });

  it("falls back for the page when the element has no scroll attribute", () => {
    withoutTimelines();
    mount(`${STYLE}<span id="plain"></span>`);
    const controller = createScrollProgress(document.getElementById("plain") as HTMLElement);
    expect(controller.mode).toBe("fallback");
    controller.destroy();
  });
});

describe("smoothing (5.4)", () => {
  it("parses data-ok-scroll-smooth", () => {
    expect(parseScrollSmooth(null)).toBeUndefined();
    expect(parseScrollSmooth("")).toBe(true);
    expect(parseScrollSmooth("true")).toBe(true);
    expect(parseScrollSmooth('{"stiffness": 300, "damping": "x"}')).toEqual({ stiffness: 300 });
    expect(parseScrollSmooth('{"other": 1}')).toBe(true);
    expect(parseScrollSmooth("{nope")).toBeUndefined();
    expect(parseScrollSmooth("off")).toBeUndefined();
    const { bar } = setup('data-ok-scroll-smooth=""');
    expect(readScrollProgress(bar).smooth).toBe(true);
  });

  it("follows the scroll with a spring, in script even where timelines exist", async () => {
    const { bar, box } = setup('data-ok-scroll-container="box" data-ok-scroll-smooth=""');
    const controller = createScrollProgress(bar, {
      container: box,
      smooth: { stiffness: 300, damping: 30, restDelta: 0.001 },
    });
    expect(controller.mode).toBe("fallback");
    box.scrollTop = 400;
    await frames();
    await frames();
    // The target is reached, the bar is on its way.
    expect(controller.progress).toBe(1);
    const between = shown(bar);
    expect(between).toBeGreaterThan(0);
    expect(between).toBeLessThan(1);
    for (let i = 0; i < 240 && shown(bar) !== 1; i++) await nextFrame();
    expect(shown(bar)).toBe(1);
    controller.destroy();
    expect(bar.getAnimations()).toHaveLength(0);
  });

  it("follows the position exactly with reduced motion", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) => ({ matches: query.includes("reduce"), media: query }) as MediaQueryList,
    );
    const { bar, box } = setup('data-ok-scroll-container="box" data-ok-scroll-smooth=""');
    const controller = createScrollProgress(bar, { container: box, smooth: true });
    box.scrollTop = 200;
    await frames();
    expect(shown(bar)).toBeCloseTo(0.5, 2);
    controller.destroy();
  });

  it("leaves the stylesheet's page path for a smoothed progress", () => {
    mount(`${STYLE}<span id="page" data-ok-scroll-progress data-ok-scroll-smooth></span>`);
    const controller = createScrollProgress(document.getElementById("page") as HTMLElement, {
      smooth: true,
    });
    expect(controller.mode).toBe("fallback");
    controller.destroy();
  });
});
