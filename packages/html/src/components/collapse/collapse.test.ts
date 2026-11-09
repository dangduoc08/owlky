import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { CollapseInstance } from "./collapse.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

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
});

const finish = async (element: Element) => {
  for (const animation of element.getAnimations()) animation.finish();
  await settle();
};
const height = (element: Element) => Math.round(element.getBoundingClientRect().height);
const width = (element: Element) => Math.round(element.getBoundingClientRect().width);

describe("collapse snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(1));

  it.each(snippets)("%s: valid anatomy, closed as written", (_, html) => {
    const host = mount(html);
    const collapses = [...host.querySelectorAll<HTMLElement>("[data-ok-collapse]")];
    expect(collapses).toHaveLength(4);
    for (const collapse of collapses) expect(collapse.hidden).toBe(true);
    const ids = collapses.map((collapse) => collapse.id).join(" ");
    expect(
      host.querySelector("[data-ok-collapse-toggle]")?.getAttribute("data-ok-collapse-toggle"),
    ).toBe(ids);
    // Without the runtime, nothing of a closed collapse shows.
    for (const collapse of collapses) expect(getComputedStyle(collapse).display).toBe("none");
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: the switch opens all four; no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
    const [first, sliced, side, sideSliced] = [
      ...host.querySelectorAll<HTMLElement>("[data-ok-collapse]"),
    ] as HTMLElement[];
    expect(height(sliced as HTMLElement)).toBe(40);
    expect(width(sideSliced as HTMLElement)).toBe(40);
    await userEvent.click(host.querySelector("[role=switch]") as HTMLElement);
    await settle();
    for (const collapse of [first, sliced, side, sideSliced]) await finish(collapse as Element);
    for (const collapse of [first, sliced, side, sideSliced]) {
      expect((collapse as HTMLElement).hidden).toBe(false);
      // Story CSS isn't loaded here: the open size is the content's.
      expect(height(collapse as Element)).toBe((collapse as HTMLElement).scrollHeight);
      expect(height(collapse as Element)).toBeGreaterThan(40);
    }
    await expectNoAxeViolations(host);
  });
});

const markup = `
  <button type="button" id="toggle" aria-expanded="false" data-ok-collapse-toggle=" a b missing">Toggle</button>
  <input type="checkbox" id="box" aria-label="Show" data-ok-collapse-toggle="a">
  <button type="button" id="none" data-ok-collapse-toggle="missing plain">Nothing</button>
  <p id="plain">Plain</p>
  <div id="a" data-ok-collapse data-ok-timeout="200" hidden><p style="margin: 0; height: 80px">A</p></div>
  <div id="b" data-ok-collapse hidden><p style="margin: 0; height: 80px">B</p></div>`;

describe("collapse runtime", () => {
  it("a button toggles the collapses it names and mirrors aria-expanded", async () => {
    const host = mount(markup);
    start();
    const toggle = host.querySelector("#toggle") as HTMLElement;
    const a = host.querySelector("#a") as HTMLElement;
    const b = host.querySelector("#b") as HTMLElement;
    await userEvent.click(toggle);
    expect([a.hidden, b.hidden]).toEqual([false, false]);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    await settle();
    expect(
      ((a.getAnimations()[0] as Animation).effect as KeyframeEffect).getTiming().duration,
    ).toBe(200);
    await userEvent.click(toggle);
    expect([a.hidden, b.hidden]).toEqual([true, true]);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    // A trigger that names nothing does nothing.
    await userEvent.click(host.querySelector("#none") as HTMLElement);
    expect(host.querySelector("#none")?.hasAttribute("aria-expanded")).toBe(false);
  });

  it("a checkbox opens the collapse while checked", async () => {
    const host = mount(markup);
    start();
    const a = host.querySelector("#a") as HTMLElement;
    await userEvent.click(host.querySelector("#box") as HTMLElement);
    expect(a.hidden).toBe(false);
    await userEvent.click(host.querySelector("#box") as HTMLElement);
    expect(a.hidden).toBe(true);
  });

  it("emits the six phases with detail.in, and status follows", async () => {
    const host = mount(markup);
    const rt = start();
    const a = host.querySelector("#a") as HTMLElement;
    const instance = rt.get<CollapseInstance>(a, "collapse") as CollapseInstance;
    const events: string[] = [];
    for (const type of ["enter", "entering", "entered", "exit", "exiting", "exited"])
      a.addEventListener(`ok:collapse:${type}`, (event) =>
        events.push(`${type}:${(event as CustomEvent).detail.in}`),
      );
    expect([instance.in, instance.status]).toEqual([false, "exited"]);
    instance.show();
    await settle();
    expect(instance.status).toBe("entering");
    await finish(a);
    expect([instance.in, instance.status]).toEqual([true, "entered"]);
    expect(height(a)).toBe(80);
    instance.toggle();
    await settle();
    await finish(a);
    instance.toggle(true);
    instance.hide();
    await settle();
    expect(events).toEqual([
      "enter:true",
      "entering:true",
      "entered:true",
      "exit:false",
      "exiting:false",
      "exited:false",
    ]);
  });

  it("option changes apply to the next animation; the collapsed size is written through CSSOM", async () => {
    const host = mount(markup);
    start();
    const b = host.querySelector("#b") as HTMLElement;
    b.setAttribute("data-ok-collapsed-size", "24");
    b.setAttribute("data-ok-easing", "linear");
    b.setAttribute("data-ok-timeout", "auto");
    await settle();
    expect(b.style.getPropertyValue("--_ok-collapsed-size")).toBe("24px");
    expect(height(b)).toBe(24);
    b.hidden = false;
    await settle();
    const timing = ((b.getAnimations()[0] as Animation).effect as KeyframeEffect).getTiming();
    expect(timing.easing).toBe("linear");
    expect(timing.duration).toBeGreaterThan(0);
    b.setAttribute("data-ok-collapsed-size", '"><img src=x onerror=alert(1)>');
    await settle();
    expect(b.style.getPropertyValue("--_ok-collapsed-size")).toBe("");
  });

  it("another owner's `hidden` animates too (List, Tree view, Stepper write it)", async () => {
    const host = mount(markup);
    start();
    const a = host.querySelector("#a") as HTMLElement;
    a.removeAttribute("hidden");
    await settle();
    expect(a.getAttribute("data-ok-state")).toBe("entering");
  });

  it("is idempotent, mounts later markup and cleans up on stop", async () => {
    const rt = start();
    rt.start();
    const host = mount(markup);
    await settle();
    const b = host.querySelector("#b") as HTMLElement;
    b.setAttribute("data-ok-collapsed-size", "10");
    await settle();
    expect(rt.get(b, "collapse")).toBeDefined();
    expect(b.style.getPropertyValue("--_ok-collapsed-size")).toBe("10px");
    rt.stop();
    runtime = undefined;
    expect(b.style.getPropertyValue("--_ok-collapsed-size")).toBe("");
    b.hidden = false;
    await settle();
    expect(b.getAnimations()).toEqual([]);
  });

  it("React-owned collapses are left alone", async () => {
    const host = mount(markup.replace('id="a"', 'id="a" data-ok-runtime="off"'));
    const rt = start();
    expect(rt.get(host.querySelector("#a"), "collapse")).toBeUndefined();
    // The trigger skips it.
    await userEvent.click(host.querySelector("#box") as HTMLElement);
    expect((host.querySelector("#a") as HTMLElement).hidden).toBe(true);
  });
});
