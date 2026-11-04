import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, resetPage, settle } from "../test-utils.js";
import { defineComponent } from "./define.js";
import { getRuntime } from "./global.js";
import { createRuntime } from "./runtime.js";
import type { Runtime } from "./types.js";
import { PROTOCOL, VERSION } from "./version.js";

const runtimes: Runtime[] = [];
const newRuntime = () => {
  const runtime = createRuntime();
  runtimes.push(runtime);
  return runtime;
};

afterEach(() => {
  for (const runtime of runtimes.splice(0)) runtime.stop();
  resetPage();
  vi.restoreAllMocks();
});

/** A probe component that records its lifecycle. */
function probe(name = "probe") {
  const setups: HTMLElement[] = [];
  const destroys: HTMLElement[] = [];
  const clicks: Element[] = [];
  const definition = defineComponent({
    name,
    selector: `[data-ok-${name}]`,
    setup(element, { signal }) {
      setups.push(element);
      element.addEventListener("mt-ping", () => element.setAttribute("data-pinged", ""), {
        signal,
      });
      return { destroy: () => destroys.push(element) };
    },
    delegate: [
      { event: "click", selector: `[data-ok-${name}-trigger]`, handle: (t) => clicks.push(t) },
    ],
  });
  return { definition, setups, destroys, clicks };
}

describe("lifecycle", () => {
  it("mounts existing elements on start and never twice", () => {
    mount(`<div data-ok-probe></div><div data-ok-probe></div>`);
    const p = probe();
    const runtime = newRuntime().register(p.definition).start();
    runtime.start();
    runtime.init();
    runtime.init(document.body);
    expect(p.setups).toHaveLength(2);
  });

  it("mounts dynamically inserted elements automatically", async () => {
    const p = probe();
    newRuntime().register(p.definition).start();
    const host = mount(`<section><div data-ok-probe></div></section>`);
    await settle();
    expect(p.setups).toEqual([host.querySelector("[data-ok-probe]")]);
  });

  it("destroys removed elements and aborts their listeners", async () => {
    const host = mount(`<div data-ok-probe></div>`);
    const element = host.firstElementChild as HTMLElement;
    const p = probe();
    const runtime = newRuntime().register(p.definition).start();
    host.remove();
    await settle();
    expect(p.destroys).toEqual([element]);
    expect(runtime.get(element, "probe")).toBeUndefined();
    element.dispatchEvent(new Event("mt-ping"));
    expect(element.hasAttribute("data-pinged")).toBe(false);
  });

  it("keeps the instance when an element is moved within one task", async () => {
    const host = mount(`<div data-ok-probe></div><aside></aside>`);
    const element = host.firstElementChild as HTMLElement;
    const p = probe();
    newRuntime().register(p.definition).start();
    host.querySelector("aside")?.append(element);
    await settle();
    expect(p.setups).toHaveLength(1);
    expect(p.destroys).toHaveLength(0);
  });

  it("sweeps disconnected instances on init() when observation is off", () => {
    const host = mount(`<div data-ok-probe></div>`);
    const p = probe();
    const runtime = newRuntime().register(p.definition).start({ observe: false });
    host.remove();
    runtime.init();
    expect(p.destroys).toHaveLength(1);
  });

  it("destroy(root) tears down only that subtree", () => {
    const a = mount(`<div data-ok-probe></div>`);
    mount(`<div data-ok-probe></div>`);
    const p = probe();
    const runtime = newRuntime().register(p.definition).start();
    runtime.destroy(a);
    expect(p.destroys).toEqual([a.firstElementChild]);
  });

  it("stop() removes listeners and instances; start() restores them", async () => {
    const host = mount(`<div data-ok-probe><button data-ok-probe-trigger>x</button></div>`);
    const p = probe();
    const runtime = newRuntime().register(p.definition).start();
    runtime.stop();
    expect(p.destroys).toHaveLength(1);
    host.querySelector("button")?.click();
    expect(p.clicks).toHaveLength(0);
    mount(`<div data-ok-probe></div>`);
    await settle();
    expect(p.setups).toHaveLength(1);

    runtime.start();
    expect(p.setups).toHaveLength(3);
    host.querySelector("button")?.click();
    expect(p.clicks).toHaveLength(1);
  });

  it("mounts elements of a component registered after start", () => {
    mount(`<div data-ok-late></div>`);
    const p = probe("late");
    newRuntime().start().register(p.definition);
    expect(p.setups).toHaveLength(1);
  });

  it("isolates a failing setup from other components", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<div data-ok-broken></div><div data-ok-probe></div>`);
    const broken = defineComponent({
      name: "broken",
      selector: "[data-ok-broken]",
      setup() {
        throw new Error("boom");
      },
    });
    const p = probe();
    newRuntime().register(broken, p.definition).start();
    expect(p.setups).toHaveLength(1);
    expect(console.error).toHaveBeenCalledOnce();
  });
});

describe("delegation", () => {
  it("uses one listener per event type, however many components and instances", () => {
    const spy = vi.spyOn(document, "addEventListener");
    mount(`<div data-ok-a></div><div data-ok-b></div>`.repeat(5));
    newRuntime().register(probe("a").definition, probe("b").definition).start();
    expect(spy.mock.calls.filter(([type]) => type === "click")).toHaveLength(1);
  });

  it("dispatches to the closest matching element", () => {
    const host = mount(`<div data-ok-probe-trigger id="t"><span>label</span></div>`);
    const p = probe();
    newRuntime().register(p.definition).start();
    host.querySelector("span")?.click();
    expect(p.clicks.map((e) => e.id)).toEqual(["t"]);
  });

  it("ignores subtrees owned by another implementation (data-ok-runtime=off)", async () => {
    const host = mount(`
      <div data-ok-runtime="off">
        <div data-ok-probe></div>
        <button data-ok-probe-trigger>x</button>
      </div>`);
    const p = probe();
    newRuntime().register(p.definition).start();
    host.querySelector("button")?.click();
    mount(`<div data-ok-probe></div>`, host.firstElementChild as HTMLElement);
    await settle();
    expect(p.setups).toHaveLength(0);
    expect(p.clicks).toHaveLength(0);
  });

  it("works inside a connected shadow root", async () => {
    const hostElement = mount("").appendChild(document.createElement("div"));
    const shadow = hostElement.attachShadow({ mode: "open" });
    shadow.innerHTML = `<div data-ok-probe><button data-ok-probe-trigger>x</button></div>`;
    const p = probe();
    const runtime = newRuntime().register(p.definition).start();
    runtime.connect(shadow);
    expect(p.setups).toHaveLength(1);
    shadow.querySelector("button")?.click();
    expect(p.clicks).toHaveLength(1);
  });
});

describe("page-wide singleton (getRuntime)", () => {
  it("returns the same runtime for every caller", () => {
    const a = getRuntime();
    runtimes.push(a);
    expect(getRuntime()).toBe(a);
    expect(a.active).toBe(true);
  });

  it("does not duplicate instances or listeners when loaded twice", () => {
    mount(`<div data-ok-probe><button data-ok-probe-trigger>x</button></div>`);
    const first = probe();
    const second = probe();
    const runtime = getRuntime().register(first.definition).start();
    runtimes.push(runtime);
    // A second copy of the library: same protocol → same runtime; its registration is ignored.
    getRuntime().register(second.definition).start();
    document.querySelector("button")?.click();
    expect(first.setups).toHaveLength(1);
    expect(first.clicks).toHaveLength(1);
    expect(second.setups).toHaveLength(0);
  });

  it("shares the owner's runtime with a different version of the same protocol", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const owner = createRuntime();
    runtimes.push(owner);
    Object.defineProperty(globalThis, Symbol.for("owlky.runtime"), {
      value: { protocol: PROTOCOL, version: "0.0.0-other", runtime: owner },
      configurable: true,
    });
    expect(getRuntime()).toBe(owner);
  });

  it("disables itself next to an incompatible protocol and leaves the owner alone", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const owner = createRuntime();
    runtimes.push(owner);
    Object.defineProperty(globalThis, Symbol.for("owlky.runtime"), {
      value: { protocol: PROTOCOL + 1, version: "99.0.0", runtime: owner },
      configurable: true,
    });
    mount(`<div data-ok-probe></div>`);
    const p = probe();
    const inactive = getRuntime().register(p.definition).start();
    expect(inactive).not.toBe(owner);
    expect(inactive.active).toBe(false);
    expect(p.setups).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining(`Runtime ${VERSION}`));
  });
});
