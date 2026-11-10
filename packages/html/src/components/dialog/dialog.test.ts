import { isScrollLocked } from "@owlky/core";
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
