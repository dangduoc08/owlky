import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { BackdropInstance } from "./backdrop.js";

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

const css = (element: Element) => getComputedStyle(element);
const styles = (element: Element, keys: readonly string[]) =>
  Object.fromEntries(keys.map((key) => [key, css(element).getPropertyValue(key)]));
/** Waits for the fade (and the `visibility` step at its end). */
const faded = async (element: Element) => {
  css(element).opacity;
  await Promise.all(element.getAnimations().map((a) => a.finished.catch(() => {})));
};

describe("backdrop snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(1));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const backdrop of host.querySelectorAll("[data-ok-backdrop]")) {
      expect(backdrop.localName).toBe("div");
      expect(backdrop.hasAttribute("data-ok-open")).toBe(false);
      expect(host.querySelector(`[data-ok-backdrop-open="${backdrop.id}"]`)).not.toBeNull();
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations, closed and open", async (_, html) => {
    const host = mount(html);
    start();
    await expectNoAxeViolations(host);
    (host.querySelector("[data-ok-backdrop-open]") as HTMLElement).click();
    await faded(host.querySelector("[data-ok-backdrop]") as Element);
    await expectNoAxeViolations(host);
  });
});

const markup = `
  <button type="button" id="open" data-ok-backdrop-open="b">Show</button>
  <button type="button" id="outer" data-ok-backdrop-close="b">Hide from outside</button>
  <div id="b" data-ok-backdrop data-ok-backdrop-close>
    <span role="progressbar" aria-label="Loading" data-ok-circular-progress data-ok-variant="indeterminate" data-ok-color="inherit"></span>
  </div>
  <div id="kept" data-ok-backdrop>
    <button type="button" id="inner" data-ok-backdrop-close>Close</button>
  </div>`;

describe("backdrop runtime", () => {
  it("a trigger shows it, a click anywhere on it hides it; focus stays on the trigger", async () => {
    const host = mount(markup);
    start();
    const backdrop = host.querySelector("#b") as HTMLElement;
    const trigger = host.querySelector("#open") as HTMLElement;
    const events: string[] = [];
    for (const type of ["beforeopen", "open", "beforeclose", "close"])
      backdrop.addEventListener(`ok:backdrop:${type}`, (e) =>
        events.push(`${type}:${JSON.stringify((e as CustomEvent).detail.reason ?? null)}`),
      );
    await faded(backdrop);
    expect(css(backdrop).visibility).toBe("hidden");
    await userEvent.click(trigger);
    expect(backdrop.hasAttribute("data-ok-open")).toBe(true);
    expect(document.activeElement).toBe(trigger);
    await faded(backdrop);
    expect(styles(backdrop, ["opacity", "visibility", "z-index"])).toEqual({
      opacity: "1",
      visibility: "visible",
      "z-index": "1300",
    });
    await userEvent.click(backdrop);
    expect(backdrop.hasAttribute("data-ok-open")).toBe(false);
    await faded(backdrop);
    expect(styles(backdrop, ["opacity", "visibility"])).toEqual({
      opacity: "0",
      visibility: "hidden",
    });
    expect(events).toEqual([
      "beforeopen:null",
      "open:null",
      'beforeclose:"trigger"',
      'close:"trigger"',
    ]);
  });

  it("closes from a trigger outside (by id) and from a valueless one inside", async () => {
    const host = mount(markup);
    const rt = start();
    const b = rt.get<BackdropInstance>(host.querySelector("#b"), "backdrop") as BackdropInstance;
    const kept = rt.get<BackdropInstance>(host.querySelector("#kept"), "backdrop");
    b.open();
    kept?.open();
    (host.querySelector("#outer") as HTMLElement).click();
    expect(b.isOpen).toBe(false);
    (host.querySelector("#inner") as HTMLElement).click();
    expect(kept?.isOpen).toBe(false);
  });

  it("API: open() / close() are idempotent and report refusals", () => {
    const host = mount(markup);
    const rt = start();
    const backdrop = host.querySelector("#b") as HTMLElement;
    const instance = rt.get<BackdropInstance>(backdrop, "backdrop") as BackdropInstance;
    const closes: string[] = [];
    backdrop.addEventListener("ok:backdrop:close", (e) =>
      closes.push((e as CustomEvent).detail.reason),
    );
    expect(instance.close()).toBe(true);
    expect(instance.open()).toBe(true);
    expect(instance.open()).toBe(true);
    backdrop.addEventListener("ok:backdrop:beforeclose", (e) => e.preventDefault(), { once: true });
    expect(instance.close()).toBe(false);
    expect(instance.isOpen).toBe(true);
    expect(instance.close()).toBe(true);
    expect(closes).toEqual(["api"]);
    backdrop.addEventListener("ok:backdrop:beforeopen", (e) => e.preventDefault(), { once: true });
    expect(instance.open()).toBe(false);
    expect(instance.isOpen).toBe(false);
  });

  it("data-ok-open shows it on load; the open trigger passes itself in the detail", async () => {
    const host = mount(`<div id="b" data-ok-backdrop data-ok-open></div>
      <button type="button" id="t" data-ok-backdrop-open="c">Show</button>
      <div id="c" data-ok-backdrop></div>`);
    const rt = start();
    expect(rt.get<BackdropInstance>(host.querySelector("#b"), "backdrop")?.isOpen).toBe(true);
    let trigger: unknown;
    host.querySelector("#c")?.addEventListener("ok:backdrop:open", (e) => {
      trigger = (e as CustomEvent).detail.trigger;
    });
    (host.querySelector("#t") as HTMLElement).click();
    expect(trigger).toBe(host.querySelector("#t"));
  });

  it("invisible: transparent, still catches the click", async () => {
    const host = mount(
      `<div id="b" data-ok-backdrop data-ok-invisible data-ok-open data-ok-backdrop-close></div>`,
    );
    start();
    const backdrop = host.querySelector("#b") as HTMLElement;
    await faded(backdrop);
    expect(css(backdrop).backgroundColor).toMatch(/^rgba\(0, 0, 0, 0\)$|transparent/);
    backdrop.click();
    expect(backdrop.hasAttribute("data-ok-open")).toBe(false);
  });

  it("unknown or hostile ids warn once and change nothing; React-owned roots are skipped", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount(`
      <button type="button" id="bad" data-ok-backdrop-open='"><img src=x onerror=alert(1)>'>Bad</button>
      <button type="button" id="react" data-ok-backdrop-open="r">React</button>
      <button type="button" id="close-bad" data-ok-backdrop-close="../missing">Close</button>
      <div id="r" data-ok-backdrop data-ok-runtime="off"></div>`);
    start();
    (host.querySelector("#bad") as HTMLElement).click();
    (host.querySelector("#react") as HTMLElement).click();
    (host.querySelector("#close-bad") as HTMLElement).click();
    expect(warn).toHaveBeenCalledTimes(2);
    expect(host.querySelector("img")).toBeNull();
    expect(host.querySelector("#r")?.hasAttribute("data-ok-open")).toBe(false);
    warn.mockRestore();
  });

  it("works on backdrops inserted later and stops cleanly", async () => {
    const rt = start();
    const host = mount(markup);
    await settle();
    (host.querySelector("#open") as HTMLElement).click();
    expect(host.querySelector("#b")?.hasAttribute("data-ok-open")).toBe(true);
    rt.stop();
    runtime = undefined;
    (host.querySelector("#b") as HTMLElement).click();
    expect(host.querySelector("#b")?.hasAttribute("data-ok-open")).toBe(true);
  });
});
