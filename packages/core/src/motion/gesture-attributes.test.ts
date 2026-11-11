import { afterEach, describe, expect, it } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  GESTURE_ATTR_NAMES,
  hasMotionGestures,
  motionGestureAttributes,
  parseDragBox,
  parseDragElastic,
  parseDragTransition,
  parseGestureTarget,
  readMotionGestures,
} from "./gesture-attributes.js";

afterEach(cleanupDom);

describe("gesture attribute parsers", () => {
  it("keeps finite sides of a box", () => {
    expect(parseDragBox(null)).toBeUndefined();
    expect(parseDragBox([1])).toBeUndefined();
    expect(parseDragBox({ top: "1", left: Number.NaN })).toBeUndefined();
    expect(parseDragBox({ left: -10, right: 10, extra: 1 })).toEqual({ left: -10, right: 10 });
  });

  it("keeps the numeric glide options", () => {
    expect(parseDragTransition("x")).toBeUndefined();
    expect(parseDragTransition({ power: "1" })).toBeUndefined();
    expect(parseDragTransition({ power: 0.2, timeConstant: 300, other: 1 })).toEqual({
      power: 0.2,
      timeConstant: 300,
    });
  });

  it("reads dragElastic as a number, a boolean or a box", () => {
    expect(parseDragElastic(null)).toBeUndefined();
    expect(parseDragElastic("")).toBeUndefined();
    expect(parseDragElastic("abc")).toBeUndefined();
    expect(parseDragElastic("0.2")).toBe(0.2);
    expect(parseDragElastic("true")).toBe(true);
    expect(parseDragElastic("false")).toBe(false);
    expect(parseDragElastic('{"left":0.1}')).toEqual({ left: 0.1 });
    expect(parseDragElastic("{bad")).toBeUndefined();
  });

  it("reads a state with its own transition, filtering values", () => {
    expect(parseGestureTarget("not json")).toBeUndefined();
    expect(parseGestureTarget("[1]")).toBeUndefined();
    expect(parseGestureTarget({ "a b": 1 })).toBeUndefined();
    expect(parseGestureTarget('{"scale":1.1,"color":"url(x)"}')).toEqual({ scale: 1.1 });
    expect(
      parseGestureTarget({ scale: 1.1, transition: { type: "spring", stiffness: 300, bad: 1 } }),
    ).toEqual({ scale: 1.1, transition: { type: "spring", stiffness: 300 } });
    expect(parseGestureTarget({ scale: 1.1, transition: { bad: 1 } })).toEqual({ scale: 1.1 });
  });
});

describe("motionGestureAttributes", () => {
  it("writes nothing without gestures", () => {
    expect(motionGestureAttributes({})).toEqual({});
    expect(motionGestureAttributes({ drag: false, transition: { duration: 1 } })).toEqual({});
  });

  it("writes drag and its tuning as the HTML markup has them", () => {
    expect(
      motionGestureAttributes({
        drag: true,
        dragConstraints: { left: -50, right: 50 },
        dragElastic: 0.2,
        dragMomentum: false,
        dragSnapToOrigin: true,
        dragDirectionLock: true,
        dragTransition: { power: 0.4 },
      }),
    ).toEqual({
      "data-ok-drag": "",
      "data-ok-drag-constraints": '{"right":50,"left":-50}',
      "data-ok-drag-elastic": "0.2",
      "data-ok-drag-momentum": "false",
      "data-ok-drag-snap-to-origin": "",
      "data-ok-drag-direction-lock": "",
      "data-ok-drag-transition": '{"power":0.4}',
    });
    expect(
      motionGestureAttributes({ drag: "x", dragConstraints: " stage ", dragElastic: false }),
    ).toEqual({
      "data-ok-drag": "x",
      "data-ok-drag-constraints": "stage",
      "data-ok-drag-elastic": "false",
    });
    expect(
      motionGestureAttributes({
        drag: "y",
        dragConstraints: { current: null },
        dragElastic: { top: 0.1 },
      }),
    ).toEqual({ "data-ok-drag": "y", "data-ok-drag-elastic": '{"top":0.1}' });
    // Drag tuning without drag writes nothing.
    expect(motionGestureAttributes({ dragElastic: 0.2, dragSnapToOrigin: true })).toEqual({});
  });

  it("writes the states and the element's transition", () => {
    expect(
      motionGestureAttributes({
        whileHover: { scale: 1.05, transition: { repeat: Infinity } },
        whileTap: { scale: 0.95 },
        whileFocus: { "bad key": 1 },
        transition: { type: "spring", bounce: 0.3 },
      }),
    ).toEqual({
      "data-ok-while-hover": '{"scale":1.05,"transition":{"repeat":"Infinity"}}',
      "data-ok-while-tap": '{"scale":0.95}',
      "data-ok-transition": '{"bounce":0.3,"type":"spring"}',
    });
    expect(
      motionGestureAttributes({ whileDrag: { scale: 1.1 }, transition: { bad: 1 } as object }),
    ).toEqual({
      "data-ok-while-drag": '{"scale":1.1}',
    });
  });
});

describe("readMotionGestures", () => {
  const read = (attributes: string) => {
    const element = mount(`<div ${attributes}></div>`).firstElementChild as HTMLElement;
    return { element, options: readMotionGestures(element) };
  };

  it("reads nothing from a plain element", () => {
    const { element, options } = read("");
    expect(hasMotionGestures(element)).toBe(false);
    expect(options.drag).toBeUndefined();
    expect(options.dragMomentum).toBe(true);
    expect(options.transition).toBeUndefined();
  });

  it("reads every gesture attribute", () => {
    const { element, options } = read(
      `data-ok-drag="x" data-ok-drag-constraints='{"left":-5}' data-ok-drag-elastic="0.3"
       data-ok-drag-momentum="false" data-ok-drag-snap-to-origin data-ok-drag-direction-lock
       data-ok-drag-transition='{"power":0.1}' data-ok-while-hover='{"scale":1.1}'
       data-ok-while-tap='{"scale":0.9}' data-ok-while-focus='{"opacity":0.8}'
       data-ok-while-drag='{"scale":1.2}' data-ok-transition='{"duration":100}'`,
    );
    expect(hasMotionGestures(element)).toBe(true);
    expect(options).toEqual({
      drag: "x",
      dragConstraints: { left: -5 },
      dragElastic: 0.3,
      dragMomentum: false,
      dragSnapToOrigin: true,
      dragDirectionLock: true,
      dragTransition: { power: 0.1 },
      whileHover: { scale: 1.1 },
      whileTap: { scale: 0.9 },
      whileFocus: { opacity: 0.8 },
      whileDrag: { scale: 1.2 },
      transition: { duration: 100 },
    });
    expect(GESTURE_ATTR_NAMES).toContain("data-ok-while-drag");
  });

  it("reads drag values and a constraints id", () => {
    expect(read("data-ok-drag").options.drag).toBe(true);
    expect(read('data-ok-drag="both"').options.drag).toBe(true);
    expect(read('data-ok-drag="false"').options.drag).toBe(false);
    expect(read('data-ok-drag="y" data-ok-drag-constraints="stage"').options.dragConstraints).toBe(
      "stage",
    );
    expect(
      read('data-ok-drag data-ok-drag-constraints=" "').options.dragConstraints,
    ).toBeUndefined();
  });
});
