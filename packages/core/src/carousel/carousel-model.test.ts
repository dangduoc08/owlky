import { describe, expect, it } from "vitest";
import {
  alignOffset,
  canLoop,
  carouselStyle,
  containSnaps,
  durationMs,
  easeOut,
  estimateSnapCount,
  groupSlides,
  loopFirst,
  loopOrder,
  nearestSnap,
  parseAlign,
  parseBreakpoints,
  parseSlideSpacing,
  parseSlidesToScroll,
  parseSlidesToShow,
  rawSnaps,
  responsiveValues,
  scrollProgress,
  slideBasis,
  slidesToShowAttr,
  slideTween,
} from "./carousel-model.js";

describe("slide sizes", () => {
  it("parses slidesToShow", () => {
    expect(parseSlidesToShow(2)).toBe(2);
    expect(parseSlidesToShow(1.5)).toBe(1.5);
    expect(parseSlidesToShow("3")).toBe(3);
    expect(parseSlidesToShow(" 70% ")).toBe("70%");
    expect(parseSlidesToShow("auto")).toBe("auto");
    for (const bad of [
      0,
      -1,
      Number.NaN,
      "0%",
      "120%",
      "abc",
      "calc(1px)",
      "1".repeat(20),
      null,
      {},
    ])
      expect(parseSlidesToShow(bad)).toBeUndefined();
    expect(parseSlidesToShow("0")).toBeUndefined();
  });

  it("turns slidesToShow into a flex basis", () => {
    expect(slideBasis(1)).toBe("100%");
    expect(slideBasis(3)).toBe("calc((100% - 2 * var(--_ok-carousel-spacing, 0px)) / 3)");
    expect(slideBasis("70%")).toBe("70%");
    expect(slideBasis("auto")).toBe("auto");
  });

  it("parses slideSpacing", () => {
    expect(parseSlideSpacing(20)).toBe("20px");
    expect(parseSlideSpacing("1.5rem")).toBe("1.5rem");
    expect(parseSlideSpacing("12")).toBe("12px");
    expect(parseSlideSpacing(-1)).toBeUndefined();
    expect(parseSlideSpacing("10vw")).toBeUndefined();
    expect(parseSlideSpacing("1".repeat(20))).toBeUndefined();
    expect(parseSlideSpacing(undefined)).toBeUndefined();
  });

  it("reads responsive values", () => {
    expect(responsiveValues(undefined)).toEqual({});
    expect(responsiveValues(2)).toEqual({ xs: 2 });
    expect(responsiveValues({ xs: 1, md: 3, other: 4 } as never)).toEqual({ xs: 1, md: 3 });
    expect(slidesToShowAttr("xs")).toBe("data-ok-slides-to-show");
    expect(slidesToShowAttr("lg")).toBe("data-ok-slides-to-show-lg");
  });

  it("builds the root style", () => {
    expect(carouselStyle({ xs: 1, md: "50%", lg: "bad" }, 16)).toEqual({
      "--_ok-carousel-basis-xs": "100%",
      "--_ok-carousel-basis-md": "50%",
      "--_ok-carousel-spacing": "16px",
    });
    expect(carouselStyle({}, undefined)).toEqual({});
  });
});

describe("options", () => {
  it("parses align and slidesToScroll", () => {
    expect(parseAlign("start")).toBe("start");
    expect(parseAlign("0.25")).toBe(0.25);
    expect(parseAlign(0.5)).toBe(0.5);
    expect(parseAlign("2")).toBeUndefined();
    expect(parseAlign("left")).toBeUndefined();
    expect(parseSlidesToScroll("auto")).toBe("auto");
    expect(parseSlidesToScroll("2")).toBe(2);
    expect(parseSlidesToScroll(3)).toBe(3);
    expect(parseSlidesToScroll(0)).toBeUndefined();
    expect(parseSlidesToScroll("1.5")).toBeUndefined();
  });

  it("validates breakpoints", () => {
    expect(
      parseBreakpoints({
        "(min-width: 900px)": {
          loop: true,
          align: "start",
          containScroll: false,
          slidesToScroll: "auto",
          duration: 30,
          inViewThreshold: 2,
          dragThreshold: -1,
          active: "yes",
          axis: "y",
        },
        bad: null,
        ["x".repeat(201)]: { loop: true },
      }),
    ).toEqual({
      "(min-width: 900px)": {
        loop: true,
        align: "start",
        containScroll: "false",
        slidesToScroll: "auto",
        duration: 30,
      },
    });
    expect(
      parseBreakpoints('{"(min-width: 1px)": {"skipSnaps": true, "containScroll": "keepSnaps"}}'),
    ).toEqual({
      "(min-width: 1px)": { skipSnaps: true, containScroll: "keepSnaps" },
    });
    expect(parseBreakpoints("{not json")).toEqual({});
    expect(parseBreakpoints("x".repeat(5000))).toEqual({});
    expect(parseBreakpoints([1])).toEqual({});
    expect(parseBreakpoints(null)).toEqual({});
    const polluted = parseBreakpoints(
      '{"__proto__": {"loop": true}, "q": {"__proto__": {"x": 1}}}',
    );
    expect(({} as Record<string, unknown>)["loop"]).toBeUndefined();
    expect(({} as Record<string, unknown>)["x"]).toBeUndefined();
    expect(Object.getPrototypeOf(polluted)).toBe(null);
    expect(polluted["q"]).toEqual({});
  });
});

describe("snaps", () => {
  const boxes = (sizes: number[], gap: number) => {
    let start = 0;
    return sizes.map((size) => {
      const box = { start, size };
      start += size + gap;
      return box;
    });
  };

  it("groups slides", () => {
    expect(groupSlides([100, 100, 100, 100, 100], 0, 300, 2)).toEqual([[0, 1], [2, 3], [4]]);
    expect(groupSlides([100, 100, 100, 100], 10, 220, "auto")).toEqual([
      [0, 1],
      [2, 3],
    ]);
    expect(groupSlides([400, 100], 0, 300, "auto")).toEqual([[0], [1]]);
    expect(groupSlides([], 0, 300, "auto")).toEqual([]);
  });

  it("aligns", () => {
    expect(alignOffset("start", 400, 100, 0)).toBe(0);
    expect(alignOffset("center", 400, 100, 0)).toBe(150);
    expect(alignOffset("end", 400, 100, 0)).toBe(300);
    expect(alignOffset(0.1, 400, 100, 0)).toBe(40);
    expect(alignOffset((view, size, i) => view - size - i, 400, 100, 2)).toBe(298);
  });

  it("computes and contains snaps", () => {
    const b = boxes([200, 200, 200, 200], 0);
    const raw = rawSnaps(b, [[0], [1], [2], [3]], 400, "center");
    expect(raw).toEqual([-100, 100, 300, 500]);
    expect(containSnaps(raw, 400, "trimSnaps")).toEqual({
      positions: [0, 100, 300, 400],
      groupSnap: [0, 1, 2, 3],
    });
    const start = rawSnaps(b, [[0], [1], [2], [3]], 400, "start");
    expect(containSnaps(start, 400, "trimSnaps")).toEqual({
      positions: [0, 200, 400],
      groupSnap: [0, 1, 2, 2],
    });
    expect(containSnaps(start, 400, "keepSnaps").positions).toEqual([0, 200, 400, 400]);
    expect(containSnaps(raw, 400, "false").positions).toEqual(raw);
    expect(containSnaps([-5], -10, "trimSnaps").positions).toEqual([0]);
  });

  it("finds the nearest snap, keeping the preferred one on ties", () => {
    expect(nearestSnap([0, 100, 200], 140)).toBe(1);
    expect(nearestSnap([0, 100, 200], 160)).toBe(2);
    expect(nearestSnap([0, 400, 400], 400)).toBe(1);
    expect(nearestSnap([0, 400, 400], 400, 2)).toBe(2);
    expect(nearestSnap([0, 400, 400], 0, 2)).toBe(0);
  });

  it("measures progress", () => {
    expect(scrollProgress(50, 200)).toBe(0.25);
    expect(scrollProgress(500, 200)).toBe(1);
    expect(scrollProgress(-5, 200)).toBe(0);
    expect(scrollProgress(10, 0)).toBe(0);
    expect(scrollProgress(150, 0, { origin: 50, length: 400 })).toBe(0.25);
    expect(scrollProgress(0, 0, { origin: 50, length: 400 })).toBe(0.875);
  });

  it("orders a loop", () => {
    expect(loopOrder(4, 0)).toEqual([0, 1, 2, 3]);
    expect(loopOrder(4, 3)).toEqual([1, 2, 3, 0]);
    expect(loopFirst([[0], [1], [2], [3]], 0)).toBe(3);
    expect(loopFirst([[0], [1], [2], [3], [4]], 0)).toBe(3);
    expect(
      loopFirst(
        [
          [0, 1],
          [2, 3],
          [4, 5],
        ],
        2,
      ),
    ).toBe(2);
    const five = [[0], [1], [2], [3], [4]];
    // Five 150px slides in a 400px viewport (scroll range 350): the snap of slide 0 goes mid-range
    // with one slide before it, not two (two would put the next snap at 450, out of reach).
    expect(loopFirst(five, 0, [150, 150, 150, 150, 150], 175)).toBe(4);
    // Ties keep the count-based split.
    expect(loopFirst(five, 0, [200, 200, 200, 200, 200], 300)).toBe(3);
    expect(loopFirst(five, 2, [100, 100, 100, 100, 100], 0)).toBe(2);
  });

  it("decides when a loop fits", () => {
    expect(canLoop([560, 560, 560, 560], 20, 800, [[0], [1], [2], [3]])).toBe(true);
    expect(canLoop([800, 800], 0, 800, [[0], [1]])).toBe(false);
    expect(canLoop([800, 800, 800], 0, 800, [[0], [1], [2]])).toBe(true);
    expect(canLoop([300, 300, 300], 0, 800, [[0], [1], [2]])).toBe(false);
  });

  it("computes tweens", () => {
    expect(slideTween(100, 100, 200)).toEqual({ tween: 1, parallax: 0 });
    expect(slideTween(200, 100, 200)).toEqual({ tween: 0.5, parallax: 0.5 });
    expect(slideTween(0, 500, 200)).toEqual({ tween: 0, parallax: -1 });
    expect(slideTween(0, 0, 0)).toEqual({ tween: 1, parallax: 0 });
  });

  it("converts durations and eases", () => {
    expect(durationMs(25)).toBe(500);
    expect(durationMs(-3)).toBe(0);
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
  });

  it("estimates the number of snaps", () => {
    expect(estimateSnapCount(0)).toBe(0);
    expect(estimateSnapCount(4)).toBe(4);
    expect(estimateSnapCount(8, { slidesToShow: 3 })).toBe(6);
    expect(estimateSnapCount(8, { slidesToShow: 3, loop: true })).toBe(8);
    expect(estimateSnapCount(8, { slidesToScroll: 2, containScroll: "keepSnaps" })).toBe(4);
    expect(estimateSnapCount(8, { slidesToShow: 4, containScroll: "false" })).toBe(8);
    expect(estimateSnapCount(4, { slidesToShow: "70%", effect: "fade" })).toBe(4);
    expect(estimateSnapCount(8, { slidesToShow: 2, slidesToScroll: "auto" })).toBe(7);
  });
});
