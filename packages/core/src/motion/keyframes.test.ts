import { afterEach, describe, expect, it } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createMotionKeyframes,
  motionKeyframesAttributes,
  parseMotionKeyframes,
  parseMotionTransition,
} from "./keyframes.js";

/** Lets the player's MutationObserver run. */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve));

const finishAll = async (element: Element) => {
  for (const animation of element.getAnimations()) animation.finish();
  await tick();
};

afterEach(cleanupDom);

describe("parseMotionKeyframes", () => {
  it("keeps safe properties and values", () => {
    expect(
      parseMotionKeyframes(
        '{"rotate":[0,270,null],"opacity":0.5,"borderRadius":"25%","--ok-x":"1px","bad name":1}',
      ),
    ).toEqual({ rotate: [0, 270, null], opacity: 0.5, borderRadius: "25%", "--ok-x": "1px" });
  });

  it("drops unsafe values and rejects invalid input", () => {
    expect(parseMotionKeyframes({ background: "url(x)", color: "red;" })).toBeUndefined();
    expect(parseMotionKeyframes({ x: [0, { a: 1 }] })).toBeUndefined();
    expect(parseMotionKeyframes({ x: null })).toBeUndefined();
    expect(parseMotionKeyframes("{")).toBeUndefined();
    expect(parseMotionKeyframes("[1]")).toBeUndefined();
    expect(parseMotionKeyframes(null)).toBeUndefined();
    expect(parseMotionKeyframes({ x: [] })).toBeUndefined();
  });
});

describe("parseMotionTransition", () => {
  it("reads Framer's transition (ms) and JSON's Infinity", () => {
    expect(
      parseMotionTransition(
        '{"duration":3200,"ease":"linear","repeat":"Infinity","repeatType":"mirror","times":[0,1],"type":"spring","bounce":0.2,"reducedMotion":"never","delay":"x"}',
      ),
    ).toEqual({
      duration: 3200,
      ease: "linear",
      repeat: Infinity,
      repeatType: "mirror",
      times: [0, 1],
      type: "spring",
      bounce: 0.2,
      reducedMotion: "never",
    });
    expect(parseMotionTransition({ repeat: 2, ease: [0.1, 0.2, 0.3, 0.4] })).toEqual({
      repeat: 2,
      ease: [0.1, 0.2, 0.3, 0.4],
    });
    expect(parseMotionTransition({ ease: ["easeIn", "linear"], repeat: -1 })).toEqual({
      ease: ["easeIn", "linear"],
    });
    expect(parseMotionTransition({ ease: [1, "x"] })).toEqual({});
    expect(parseMotionTransition("nope")).toEqual({});
    expect(parseMotionTransition([1])).toEqual({});
  });
});

describe("motionKeyframesAttributes", () => {
  it("writes JSON attributes, Infinity as a string, nothing for invalid keyframes", () => {
    expect(
      motionKeyframesAttributes({ rotate: [0, 360] }, { repeat: Infinity, duration: 100 }),
    ).toEqual({
      "data-ok-keyframes": '{"rotate":[0,360]}',
      "data-ok-transition": '{"duration":100,"repeat":"Infinity"}',
    });
    expect(motionKeyframesAttributes({ opacity: 1 }, { nope: 1 } as never)).toEqual({
      "data-ok-keyframes": '{"opacity":1}',
    });
    expect(motionKeyframesAttributes(undefined)).toEqual({});
    expect(motionKeyframesAttributes({ "a b": 1 })).toEqual({});
  });
});

describe("createMotionKeyframes", () => {
  const setup = (keyframes: string, transition = '{"duration":1000}') => {
    mount(
      `<div id="m" data-ok-motion data-ok-keyframes='${keyframes}' data-ok-transition='${transition}' data-ok-state="initial"></div>`,
    );
    const element = document.getElementById("m") as HTMLElement;
    return { element, player: createMotionKeyframes(element) };
  };

  it("plays the keyframes on enter and backwards to the start on exit", async () => {
    const { element, player } = setup('{"opacity":0.25,"rotate":[0,90]}');
    expect(element.getAnimations()).toHaveLength(0);
    element.setAttribute("data-ok-state", "enter");
    await tick();
    expect(element.getAnimations()).toHaveLength(2);
    await finishAll(element);
    expect(element.style.opacity).toBe("0.25");
    expect(element.style.rotate).toBe("90deg");
    element.setAttribute("data-ok-state", "exit");
    await tick();
    const keyframes = element
      .getAnimations()
      .map((a) =>
        (a.effect as KeyframeEffect).getKeyframes().map((k) => k["opacity"] ?? k["rotate"]),
      );
    expect(keyframes).toContainEqual(["0.25", "1"]);
    expect(keyframes).toContainEqual(["90deg", "0deg"]);
    await finishAll(element);
    expect(element.style.opacity).toBe("1");
    player.destroy();
  });

  it("starts at once when the element has already entered, and pauses with data-ok-paused", async () => {
    mount(
      `<div id="m" data-ok-motion data-ok-paused data-ok-keyframes='{"rotate":[0,360]}' data-ok-transition='{"repeat":"Infinity"}' data-ok-state="enter"></div>`,
    );
    const element = document.getElementById("m") as HTMLElement;
    const player = createMotionKeyframes(element);
    const [animation] = element.getAnimations();
    expect(animation?.playState).toBe("paused");
    element.removeAttribute("data-ok-paused");
    await tick();
    expect(animation?.playState).toBe("running");
    player.destroy();
    expect(element.getAnimations()).toHaveLength(0);
  });

  it("replays when the keyframes change and stops when they go away", async () => {
    const { element, player } = setup('{"opacity":[0,1]}');
    element.setAttribute("data-ok-state", "enter");
    await tick();
    const first = element.getAnimations()[0];
    element.setAttribute("data-ok-keyframes", '{"opacity":[0.5,1]}');
    await tick();
    expect(first?.playState).not.toBe("running");
    expect(element.getAnimations()).toHaveLength(1);
    element.removeAttribute("data-ok-keyframes");
    await tick();
    expect(element.getAnimations()).toHaveLength(0);
    player.destroy();
  });

  it("does nothing on exit before an entrance", async () => {
    const { element, player } = setup('{"opacity":[0,1]}');
    element.setAttribute("data-ok-state", "exit");
    await tick();
    expect(element.getAnimations()).toHaveLength(0);
    player.destroy();
  });
});
