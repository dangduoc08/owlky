import { afterEach, describe, expect, it } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import { createMotionKeyframes } from "./keyframes.js";
import { playExit, runningAnimations, waitForAnimations } from "./presence.js";

const STYLE = `<style>
  @keyframes test-out { to { opacity: 0 } }
  @keyframes test-spin { to { rotate: 1turn } }
  [data-ok-state="exiting"] > .paper, [data-ok-motion][data-ok-state="exit"] {
    animation: test-out 1000ms both;
  }
  .spin { animation: test-spin 1s infinite; }
</style>`;

const settled = (promise: Promise<boolean>) => {
  let value: boolean | undefined;
  promise.then((result) => {
    value = result;
  });
  return () => value;
};

const finishAll = (element: Element) => {
  for (const animation of element.getAnimations({ subtree: true })) animation.finish();
};

/** Lets promise callbacks run. */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve));

afterEach(cleanupDom);

describe("playExit", () => {
  it("writes exiting, waits for the subtree's animations and resolves true", async () => {
    mount(`${STYLE}<div id="host"><div class="paper"></div><i class="spin"></i></div>`);
    const host = document.getElementById("host") as HTMLElement;
    const exit = playExit(host);
    expect(host.getAttribute("data-ok-state")).toBe("exiting");
    expect(exit.running).toBe(true);
    // The infinite spinner never ends: it isn't waited for.
    expect(runningAnimations(host)).toHaveLength(1);
    const result = settled(exit.finished);
    await tick();
    expect(result()).toBeUndefined();
    finishAll(host.querySelector(".paper") as Element);
    await tick();
    expect(result()).toBe(true);
    exit.restore();
    expect(host.hasAttribute("data-ok-state")).toBe(false);
  });

  it("gives a Motion the exit state and restores the previous one when cancelled", async () => {
    mount(`${STYLE}<div id="m" data-ok-motion data-ok-state="enter"></div>`);
    const motion = document.getElementById("m") as HTMLElement;
    const exit = playExit(motion);
    expect(motion.getAttribute("data-ok-state")).toBe("exit");
    exit.cancel();
    expect(await exit.finished).toBe(false);
    expect(motion.getAttribute("data-ok-state")).toBe("enter");
    // A state written since the exit isn't touched.
    motion.setAttribute("data-ok-state", "initial");
    exit.restore();
    expect(motion.getAttribute("data-ok-state")).toBe("initial");
  });

  it("doesn't wait for animations that were running before the exit", async () => {
    mount(`${STYLE}<div id="host"><div class="paper"></div><b class="busy"></b></div>`);
    const host = document.getElementById("host") as HTMLElement;
    const busy = host.querySelector(".busy") as HTMLElement;
    busy.animate([{ opacity: 1 }, { opacity: 0 }], 5000);
    const exit = playExit(host);
    const result = settled(exit.finished);
    finishAll(host.querySelector(".paper") as Element);
    await tick();
    expect(result()).toBe(true);
    expect(busy.getAnimations()[0]?.playState).toBe("running");
  });

  it("resolves at once when nothing animates", async () => {
    mount(`<div id="plain"></div>`);
    const plain = document.getElementById("plain") as HTMLElement;
    const exit = playExit(plain);
    expect(exit.running).toBe(false);
    expect(await exit.finished).toBe(true);
  });

  it("waits for keyframes that a player starts after the state change", async () => {
    mount(
      `<div id="m" data-ok-motion data-ok-keyframes='{"opacity":[1,0]}' data-ok-transition='{"duration":1000}' data-ok-state="initial"></div>`,
    );
    const motion = document.getElementById("m") as HTMLElement;
    const player = createMotionKeyframes(motion);
    motion.setAttribute("data-ok-state", "enter");
    await tick();
    finishAll(motion);
    await tick();
    const exit = playExit(motion);
    expect(exit.running).toBe(true);
    const result = settled(exit.finished);
    await tick();
    expect(motion.getAnimations()).toHaveLength(1);
    expect(result()).toBeUndefined();
    finishAll(motion);
    await tick();
    expect(result()).toBe(true);
    player.destroy();
  });

  it("a late wait covers animations found at once and ones started a microtask later", async () => {
    mount(
      `${STYLE}<div id="host"><div class="paper"></div><i id="k" data-ok-motion data-ok-keyframes='{"opacity":[1,0]}' data-ok-transition='{"duration":1000}' data-ok-state="enter"></i></div>`,
    );
    const host = document.getElementById("host") as HTMLElement;
    const keyed = document.getElementById("k") as HTMLElement;
    const player = createMotionKeyframes(keyed);
    finishAll(keyed);
    await tick();
    const exit = playExit(host);
    keyed.setAttribute("data-ok-state", "exit");
    const result = settled(exit.finished);
    await tick();
    finishAll(host.querySelector(".paper") as Element);
    await tick();
    expect(result()).toBeUndefined();
    finishAll(keyed);
    await tick();
    expect(result()).toBe(true);
    player.destroy();
  });

  it("waits on several elements", async () => {
    mount(
      `${STYLE}<div id="a" data-ok-state="exiting"><div class="paper"></div></div><div id="b"></div>`,
    );
    const wait = waitForAnimations([
      document.getElementById("a") as Element,
      document.getElementById("b") as Element,
    ]);
    expect(wait.running).toBe(true);
    finishAll(document.getElementById("a") as Element);
    expect(await wait.finished).toBe(true);
  });

  it("late waits resolve when the second look finds nothing", async () => {
    mount(`<div id="plain"></div>`);
    const wait = waitForAnimations(document.getElementById("plain") as Element, { late: true });
    expect(wait.running).toBe(true);
    expect(await wait.finished).toBe(true);
  });

  it("a safety timer ends a wait whose animation never reports its end", async () => {
    mount(`${STYLE}<div id="host"><div class="paper"></div></div>`);
    const host = document.getElementById("host") as HTMLElement;
    const exit = playExit(host);
    const [animation] = host.getAnimations({ subtree: true });
    (animation as Animation).currentTime = 950;
    (animation as Animation).pause();
    expect(await exit.finished).toBe(true);
  });
});
