import { isScrollLocked } from "@owlky/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  finishExit,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { DialogInstance } from "./dialog.js";

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

describe("dialog snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(7));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const dialog of host.querySelectorAll("dialog[data-ok-dialog]")) {
      const title = host.querySelector(`#${dialog.getAttribute("aria-labelledby")}`);
      expect(title?.hasAttribute("data-ok-dialog-title")).toBe(true);
      expect(dialog.querySelector(":scope > [data-ok-dialog-paper]")).not.toBeNull();
      expect(host.querySelector(`[data-ok-dialog-open="${dialog.id}"]`)).not.toBeNull();
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations, closed and open", async (_, html) => {
    const host = mount(html);
    start();
    await expectNoAxeViolations(host);
    (host.querySelector("[data-ok-dialog-open]") as HTMLElement).click();
    await settle();
    await expectNoAxeViolations(host);
  });
});

const markup = `
  <button type="button" id="open" data-ok-dialog-open="d">Open</button>
  <dialog id="d" data-ok-dialog data-ok-max-width="sm" data-ok-scroll="paper" aria-labelledby="d-title">
    <div data-ok-dialog-paper>
      <h2 id="d-title" data-ok-dialog-title>Title</h2>
      <div data-ok-dialog-content><input id="field" aria-label="Field"></div>
      <div data-ok-dialog-actions>
        <button type="button" id="cancel" data-ok-dialog-close>Cancel</button>
        <form method="dialog"><button id="native">Native</button></form>
      </div>
    </div>
  </dialog>
  <button type="button" id="outer" data-ok-dialog-close="d">Close from outside</button>`;

/** The computed `box-shadow` of a token (a probe element, removed again). */
function shadowOf(token: string): string {
  const probe = document.createElement("div");
  probe.style.boxShadow = `var(${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).boxShadow;
  probe.remove();
  return value;
}

/** The element's box shadow once Paper's shadow transition is over. */
async function shadowAfterTransition(element: Element): Promise<string> {
  // Reading a style flushes it, which starts the transitions of the new state.
  getComputedStyle(element).boxShadow;
  await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => {})));
  return getComputedStyle(element).boxShadow;
}

describe("dialog paper (a Paper, ADR-0066)", () => {
  it("keeps the dialog shadow and radius; data-ok-elevation on the paper picks Paper's shadow", async () => {
    const host = mount(
      markup.replace("<div data-ok-dialog-paper>", "<div data-ok-dialog-paper data-ok-paper>"),
    );
    start();
    await userEvent.click(host.querySelector("#open") as HTMLElement);
    const paper = host.querySelector("[data-ok-dialog-paper]") as HTMLElement;
    expect(getComputedStyle(paper).boxShadow).toBe(shadowOf("--ok-shadow-dialog"));
    expect(getComputedStyle(paper).borderRadius).toBe("18px");
    paper.setAttribute("data-ok-elevation", "12");
    expect(await shadowAfterTransition(paper)).toBe(shadowOf("--ok-elevation-12"));
    await expectNoAxeViolations(host);
  });
});

describe("dialog runtime", () => {
  it("opens modally from its trigger, focuses inside, closes with the close button", async () => {
    const host = mount(markup);
    start();
    const dialog = host.querySelector("#d") as HTMLDialogElement;
    const events: string[] = [];
    for (const type of ["beforeopen", "open", "beforeclose", "close"])
      dialog.addEventListener(`ok:dialog:${type}`, (e) =>
        events.push(`${type}:${(e as CustomEvent).detail?.reason ?? ""}`),
      );
    await userEvent.click(host.querySelector("#open") as HTMLElement);
    expect(dialog.open).toBe(true);
    expect(dialog.matches(":modal")).toBe(true);
    expect(document.activeElement?.id).toBe("field");
    await userEvent.click(host.querySelector("#cancel") as HTMLElement);
    // The exit may already be over on a slow runner (the click itself can take most of a
    // second), so only the order up to `beforeclose` is fixed here; `close` follows the exit.
    expect(events.slice(0, 3)).toEqual(["beforeopen:", "open:", "beforeclose:trigger"]);
    await finishExit(dialog);
    expect(dialog.open).toBe(false);
    expect(events).toEqual(["beforeopen:", "open:", "beforeclose:trigger", "close:trigger"]);
  });

  it("data-ok-disable-restore-focus and data-ok-disable-scroll-lock", async () => {
    const host = mount(markup);
    start();
    const dialog = host.querySelector("#d") as HTMLDialogElement;
    dialog.setAttribute("data-ok-disable-restore-focus", "");
    dialog.setAttribute("data-ok-disable-scroll-lock", "");
    const open = host.querySelector("#open") as HTMLElement;
    await userEvent.click(open);
    expect(dialog.open).toBe(true);
    expect(isScrollLocked()).toBe(false);
    await userEvent.click(host.querySelector("#cancel") as HTMLElement);
    await finishExit(dialog);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).not.toBe(open);
  });

  it("Escape and the backdrop close it; disableEscapeKeyDown; native form close", async () => {
    const host = mount(markup);
    const rt = start();
    const dialog = host.querySelector("#d") as HTMLDialogElement;
    const instance = rt.get<DialogInstance>(dialog, "dialog") as DialogInstance;
    instance.open();
    await userEvent.keyboard("{Escape}");
    expect(instance.isOpen).toBe(false);
    instance.open();
    await userEvent.click(dialog, { position: { x: 5, y: 5 } });
    expect(instance.isOpen).toBe(false);
    dialog.setAttribute("data-ok-disable-escape-key-down", "");
    instance.open();
    await userEvent.keyboard("{Escape}");
    expect(instance.isOpen).toBe(true);
    const native = vi.fn();
    dialog.addEventListener("ok:dialog:close", (e) => native((e as CustomEvent).detail.reason));
    await userEvent.click(host.querySelector("#native") as HTMLElement);
    expect(native).toHaveBeenCalledWith("native");
  });

  it("cancelable events, open on load, outside close triggers, missing targets", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount(
      `${markup.replace('aria-labelledby="d-title"', 'aria-labelledby="d-title" data-ok-open')}
       <button type="button" data-ok-dialog-open="missing">Missing</button>
       <button type="button" data-ok-dialog-close="missing">Missing close</button>`,
    );
    const rt = start();
    const dialog = host.querySelector("#d") as HTMLDialogElement;
    const instance = rt.get<DialogInstance>(dialog, "dialog") as DialogInstance;
    expect(instance.isOpen).toBe(true);
    expect(instance.open()).toBe(true);
    dialog.addEventListener("ok:dialog:beforeclose", (e) => e.preventDefault(), { once: true });
    expect(instance.close()).toBe(false);
    instance.close();
    expect(instance.close()).toBe(true);
    dialog.addEventListener("ok:dialog:beforeopen", (e) => e.preventDefault(), { once: true });
    expect(instance.open()).toBe(false);
    instance.open();
    (host.querySelector("#outer") as HTMLElement).click();
    expect(instance.isOpen).toBe(false);
    (host.querySelector('[data-ok-dialog-open="missing"]') as HTMLElement).click();
    (host.querySelector('[data-ok-dialog-close="missing"]') as HTMLElement).click();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("dialog exit (ADR-0062)", () => {
  it("fires close after the exit, once the focus is back on the trigger", async () => {
    const host = mount(markup);
    start();
    const dialog = host.querySelector("#d") as HTMLDialogElement;
    const trigger = host.querySelector("#open") as HTMLElement;
    const events: string[] = [];
    dialog.addEventListener("ok:dialog:beforeclose", () => events.push("beforeclose"));
    dialog.addEventListener("ok:dialog:close", () =>
      events.push(`close:${document.activeElement === trigger ? "focus-back" : "focus-elsewhere"}`),
    );
    await userEvent.click(trigger);
    const instance = runtime?.get<DialogInstance>(dialog, "dialog") as DialogInstance;
    expect(instance.close()).toBe(true);
    expect(instance.isOpen).toBe(false);
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("data-ok-state")).toBe("exiting");
    expect(events).toEqual(["beforeclose"]);
    // A second close during the exit changes nothing.
    expect(instance.close()).toBe(true);
    await finishExit(dialog);
    expect(dialog.open).toBe(false);
    expect(events).toEqual(["beforeclose", "close:focus-back"]);
  });

  it("an open() during the exit keeps it open and fires no close", async () => {
    const host = mount(markup);
    start();
    const dialog = host.querySelector("#d") as HTMLDialogElement;
    const events: string[] = [];
    for (const type of ["open", "close"])
      dialog.addEventListener(`ok:dialog:${type}`, () => events.push(type));
    const instance = runtime?.get<DialogInstance>(dialog, "dialog") as DialogInstance;
    instance.open();
    instance.close();
    instance.open();
    await finishExit(dialog);
    expect(dialog.open).toBe(true);
    expect(events).toEqual(["open", "open"]);
  });

  it("closes at once without an exit animation", () => {
    const host = mount(
      `<style>[data-ok-dialog-paper], dialog::backdrop { animation: none !important; }</style>${markup}`,
    );
    start();
    const dialog = host.querySelector("#d") as HTMLDialogElement;
    const closed = vi.fn();
    dialog.addEventListener("ok:dialog:close", closed);
    const instance = runtime?.get<DialogInstance>(dialog, "dialog") as DialogInstance;
    instance.open();
    instance.close();
    expect(dialog.open).toBe(false);
    expect(closed).toHaveBeenCalledOnce();
  });

  it("data-ok-transition-duration [+ -exit] set the lengths through CSSOM", async () => {
    const host = mount(markup);
    const dialog = host.querySelector("#d") as HTMLDialogElement;
    dialog.setAttribute("data-ok-transition-duration", "300");
    dialog.setAttribute("data-ok-transition-duration-exit", "120");
    start();
    expect(dialog.style.getPropertyValue("--_ok-dialog-enter")).toBe("300ms");
    expect(dialog.style.getPropertyValue("--_ok-dialog-exit")).toBe("120ms");
    const paper = dialog.querySelector("[data-ok-dialog-paper]") as HTMLElement;
    const instance = runtime?.get<DialogInstance>(dialog, "dialog") as DialogInstance;
    instance.open();
    expect(getComputedStyle(paper).animationDuration).toBe("0.3s");
    instance.close();
    expect(getComputedStyle(paper).animationDuration).toBe("0.12s");
    await finishExit(dialog);
    dialog.removeAttribute("data-ok-transition-duration-exit");
    await settle();
    expect(dialog.style.getPropertyValue("--_ok-dialog-exit")).toBe("300ms");
    runtime?.stop();
    runtime = undefined;
    expect(dialog.style.getPropertyValue("--_ok-dialog-enter")).toBe("");
  });
});
