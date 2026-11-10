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
import type { WalktourInstance } from "./walktour.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

/** Story images live in Storybook's static folder: tests use an inline pixel instead. */
const PIXEL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><rect width="16" height="9" fill="teal"/></svg>',
)}`;
const local = (html: string) => html.replaceAll(/src="[a-z]+\/[^"]+\.svg"/g, `src="${PIXEL}"`);
const snippet = (name: string) =>
  local((snippets.find(([path]) => path.endsWith(`/${name}.html`)) as [string, string])[1]);

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.restoreAllMocks();
});

const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};

const TOUR = `
  <button type="button" id="restart" data-ok-walktour-start="tour" data-ok-index="1">Restart</button>
  <button type="button" id="restart-bad" data-ok-walktour-start="nope">Restart nothing</button>
  <div id="a" style="position: fixed; left: 20px; top: 20px; width: 100px; height: 40px">A</div>
  <div id="b" style="position: fixed; left: 20px; top: 200px; width: 100px; height: 40px">B</div>
  <div id="tour" data-ok-walktour ROOT>
    <div data-ok-backdrop data-ok-invisible data-ok-walktour-overlay popover="manual" aria-hidden="true">
      <svg data-ok-walktour-spotlight aria-hidden="true"><path data-ok-walktour-mask fill-rule="evenodd"></path><path data-ok-walktour-hole></path></svg>
    </div>
    <button type="button" data-ok-walktour-beacon aria-label="Open the dialog" hidden><span data-ok-walktour-beacon-inner></span></button>
    <div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step data-ok-target="#a" role="dialog" aria-label="Step 1">
      <span data-ok-popover-arrow aria-hidden="true"></span>
      <div data-ok-walktour-content>One</div>
      <div data-ok-walktour-footer>
        <button type="button" data-ok-button data-ok-walktour-action="back">Back</button>
        <button type="button" data-ok-button data-ok-walktour-action="primary">Next</button>
      </div>
    </div>
    <div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step data-ok-target="#b" role="dialog" aria-label="Step 2">
      <span data-ok-popover-arrow aria-hidden="true"></span>
      <div data-ok-walktour-content>Two</div>
      <div data-ok-walktour-footer>
        <button type="button" data-ok-button data-ok-walktour-action="back">Back</button>
        <button type="button" data-ok-button data-ok-walktour-action="primary">Last</button>
      </div>
    </div>
    <span data-ok-walktour-live aria-live="polite"></span>
  </div>`;

function setup(root = "data-ok-run data-ok-continuous data-ok-disable-beacon") {
  const host = mount(TOUR.replace("ROOT", root));
  const element = host.querySelector("[data-ok-walktour]") as HTMLElement;
  const events: string[] = [];
  const details: unknown[] = [];
  for (const type of ["beforechange", "change", "event"])
    element.addEventListener(`ok:walktour:${type}`, (event) => {
      const detail = (event as CustomEvent).detail;
      events.push(type === "event" ? `event:${detail.type}` : type);
      details.push(detail);
    });
  start();
  const instance = runtime?.get<WalktourInstance>(element, "walktour") as WalktourInstance;
  const open = () => element.querySelector<HTMLElement>("[data-ok-walktour-step][data-ok-open]");
  const action = (name: string) =>
    element.querySelector(
      `[data-ok-walktour-step][data-ok-open] [data-ok-walktour-action="${name}"]`,
    ) as HTMLElement;
  return { host, element, instance, events, details, open, action };
}

describe("walktour runtime", () => {
  it("starts with data-ok-run and moves through the steps", () => {
    const { element, instance, events, open, action } = setup();
    expect(open()?.getAttribute("aria-label")).toBe("Step 1");
    expect(instance.state).toMatchObject({ status: "running", index: 0, lifecycle: "tooltip" });
    expect(events).toEqual([
      "change",
      "event:tour:start",
      "event:step:before",
      "event:tooltip",
      "event:tour:status",
    ]);
    events.length = 0;
    action("primary").click();
    expect(open()?.getAttribute("aria-label")).toBe("Step 2");
    // The step that showed ends before the next one is entered (its `after` before the next `before`).
    expect(events.slice(0, 3)).toEqual(["beforechange", "event:step:after", "change"]);
    action("back").click();
    expect(instance.state.index).toBe(0);
    instance.next();
    instance.next();
    expect(open()).toBeNull();
    expect(instance.state.status).toBe("finished");
    expect(element.hasAttribute("data-ok-status")).toBe(false);
  });

  it("waits for data-ok-run, pauses when it goes away and resumes when it comes back", async () => {
    const { element, instance, open } = setup("data-ok-continuous data-ok-disable-beacon");
    expect(open()).toBeNull();
    expect(instance.state.status).toBe("idle");
    element.setAttribute("data-ok-run", "");
    await settle();
    expect(open()).not.toBeNull();
    instance.next();
    element.removeAttribute("data-ok-run");
    await settle();
    expect(instance.state).toMatchObject({ status: "paused", index: 1 });
    expect(open()).toBeNull();
    instance.start();
    expect(open()?.getAttribute("aria-label")).toBe("Step 2");
  });

  it("shows option changes at once", async () => {
    const { element, action } = setup();
    expect(action("back").hidden).toBe(true);
    element.setAttribute("data-ok-hide-back-button", "");
    element.setAttribute("data-ok-show-progress", "");
    await settle();
    action("primary").click();
    expect(action("back").hidden).toBe(true);
    element.removeAttribute("data-ok-hide-back-button");
    await settle();
    expect(action("back").hidden).toBe(false);
  });

  it("starts at data-ok-step-index", () => {
    const host = mount(
      TOUR.replace("ROOT", 'data-ok-run data-ok-disable-beacon data-ok-step-index="1"'),
    );
    start();
    expect(
      host.querySelector("[data-ok-walktour-step][data-ok-open]")?.getAttribute("aria-label"),
    ).toBe("Step 2");
  });

  it("ignores an invalid data-ok-step-index", () => {
    const host = mount(TOUR.replace("ROOT", 'data-ok-step-index="-2"'));
    start();
    const element = host.querySelector("[data-ok-walktour]") as HTMLElement;
    expect(runtime?.get<WalktourInstance>(element, "walktour")?.state.index).toBe(0);
  });

  it("refuses a step change when ok:walktour:beforechange is prevented", () => {
    const { element, instance } = setup();
    element.addEventListener("ok:walktour:beforechange", (event) => event.preventDefault());
    instance.next();
    expect(instance.state.index).toBe(0);
    // Ending the tour isn't a step change: it isn't asked.
    instance.skip();
    expect(instance.state.status).toBe("skipped");
  });

  it("has the API: go, close, open, stop, reset", () => {
    const { instance, open } = setup("data-ok-run data-ok-continuous");
    // The first step starts with its beacon.
    expect(open()).toBeNull();
    instance.open();
    expect(open()?.getAttribute("aria-label")).toBe("Step 1");
    instance.go(1);
    expect(open()?.getAttribute("aria-label")).toBe("Step 2");
    instance.prev();
    instance.close();
    expect(instance.state).toMatchObject({ index: 1, lifecycle: "beacon" });
    instance.stop();
    expect(instance.state.status).toBe("paused");
    instance.reset(true);
    expect(instance.state).toMatchObject({ status: "running", index: 0 });
    instance.reset();
    expect(instance.state.status).toBe("idle");
    // Nothing to do: no events.
    instance.next();
    expect(instance.state.status).toBe("idle");
  });

  it("restarts from a trigger, and warns about a trigger without a tour", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { host, instance } = setup("data-ok-continuous data-ok-disable-beacon");
    (host.querySelector("#restart") as HTMLElement).click();
    expect(instance.state).toMatchObject({ status: "running", index: 1 });
    (host.querySelector("#restart-bad") as HTMLElement).click();
    expect(warn).toHaveBeenCalledWith(
      '[owlky] No walktour with id "nope" for this trigger.',
      expect.anything(),
    );
  });

  it("closes with Escape (the next step opens with its beacon)", async () => {
    const { element, instance, open } = setup("data-ok-run data-ok-continuous");
    instance.open();
    await userEvent.keyboard("{Escape}");
    expect(open()).toBeNull();
    expect(instance.state).toMatchObject({ index: 1, lifecycle: "beacon", origin: "escape" });
    (element.querySelector("[data-ok-walktour-beacon]") as HTMLElement).click();
    expect(open()?.getAttribute("aria-label")).toBe("Step 2");
  });

  it("waits for promises handed to waitUntil in ok:walktour:beforestep", async () => {
    const { element, instance, events, open } = setup();
    let resolve = () => {};
    const seen: number[] = [];
    element.addEventListener("ok:walktour:beforestep", (event) => {
      const detail = (event as CustomEvent).detail;
      seen.push(detail.index);
      detail.waitUntil(new Promise<void>((done) => (resolve = done)));
    });
    events.length = 0;
    instance.next();
    expect(seen).toEqual([1]);
    expect(open()).toBeNull();
    expect(instance.state).toMatchObject({ index: 0, waiting: true });
    expect(events).toEqual(["beforechange", "event:step:after", "event:step:before-hook"]);
    resolve();
    await settle();
    expect(open()?.getAttribute("aria-label")).toBe("Step 2");
    expect(instance.state.waiting).toBeUndefined();
  });

  it("waits for a target added later, up to data-ok-target-wait-timeout", async () => {
    const { host, instance, open } = setup(
      "data-ok-run data-ok-continuous data-ok-disable-beacon data-ok-target-wait-timeout='2000'",
    );
    host.querySelector("#b")?.remove();
    instance.next();
    expect(open()).toBeNull();
    const shown = new Promise<void>((done) => {
      const observer = new MutationObserver(() => {
        if (open()) {
          observer.disconnect();
          done();
        }
      });
      observer.observe(host, { attributes: true, subtree: true });
    });
    const b = document.createElement("div");
    b.id = "b";
    host.prepend(b);
    await shown;
    expect(open()?.getAttribute("aria-label")).toBe("Step 2");
  });

  it("follows the new options set on the root (close button action, focus trap)", async () => {
    const { element, instance, open } = setup(
      "data-ok-run data-ok-continuous data-ok-disable-beacon data-ok-close-button-action='skip'",
    );
    expect(open()?.getAttribute("aria-modal")).toBe("true");
    element.setAttribute("data-ok-disable-focus-trap", "");
    await settle();
    expect(open()?.hasAttribute("aria-modal")).toBe(false);
    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("data-ok-walktour-action", "close");
    close.textContent = "Close";
    open()?.append(close);
    close.click();
    expect(instance.state.status).toBe("skipped");
  });

  it("cleans up when destroyed", () => {
    const { element, open } = setup();
    expect(open()).not.toBeNull();
    runtime?.destroy(element);
    expect(open()).toBeNull();
  });
});

describe("walktour snippets", () => {
  for (const name of ["walktour-example", "beacons-example"]) {
    it(`${name}: CSP-safe, named controls, runs, no axe violations`, async () => {
      const html = snippet(name);
      const host = mount(html);
      expectCspSafe(host, html);
      expectNamedButtons(host);
      start();
      const element = host.querySelector("[data-ok-walktour]") as HTMLElement;
      const instance = runtime?.get<WalktourInstance>(element, "walktour") as WalktourInstance;
      expect(instance.state.status).toBe("running");
      if (instance.state.lifecycle === "beacon") instance.open();
      expect(host.querySelector("[data-ok-walktour-step][data-ok-open]")).not.toBeNull();
      await expectNoAxeViolations(host);
      // The restart button starts the tour over.
      instance.skip();
      (host.querySelector("[data-ok-walktour-start]") as HTMLElement).click();
      expect(instance.state).toMatchObject({ status: "running", index: 0 });
    });
  }
});

describe("walktour offset and step identity (roadmap 4.18.82)", () => {
  it("passes data-ok-step-id and data-ok-step-data in events and beforestep", () => {
    const host = mount(
      TOUR.replace("ROOT", "data-ok-continuous data-ok-disable-beacon").replace(
        'data-ok-target="#a"',
        `data-ok-target="#a" data-ok-step-id="intro" data-ok-step-data='{"section":"cards"}'`,
      ),
    );
    const element = host.querySelector("[data-ok-walktour]") as HTMLElement;
    const seen: unknown[] = [];
    element.addEventListener("ok:walktour:event", (event) => {
      const detail = (event as CustomEvent).detail;
      seen.push([detail.type, detail.index, detail.step]);
    });
    element.addEventListener("ok:walktour:beforestep", (event) => {
      const detail = (event as CustomEvent).detail;
      seen.push(["beforestep", detail.index, detail.step]);
    });
    start();
    const instance = runtime?.get<WalktourInstance>(element, "walktour") as WalktourInstance;
    instance.start();
    const step = { id: "intro", data: { section: "cards" } };
    expect(seen).toContainEqual(["beforestep", 0, step]);
    expect(seen).toContainEqual(["step:before", 0, step]);
    instance.next();
    expect(seen).toContainEqual(["step:after", 0, step]);
    expect(seen).toContainEqual(["step:before", 1, undefined]);
  });

  it("places the tooltip by data-ok-offset (the tour's, or the step's)", async () => {
    const { element, open } = setup(
      "data-ok-run data-ok-continuous data-ok-disable-beacon data-ok-offset='40'",
    );
    const top = () => (open() as HTMLElement).getBoundingClientRect().top;
    const far = top();
    // The runtime shows option changes at once.
    element.setAttribute("data-ok-offset", "8");
    await settle();
    // WebKit lays the popover out a fraction of a pixel apart.
    expect(Math.abs(far - top() - 32)).toBeLessThan(1.5);
    const first = element.querySelector("[data-ok-walktour-step]") as HTMLElement;
    first.setAttribute("data-ok-offset", "0");
    element.setAttribute("data-ok-offset", "20");
    await settle();
    expect(Math.abs(far - top() - 40)).toBeLessThan(1.5);
  });
});
