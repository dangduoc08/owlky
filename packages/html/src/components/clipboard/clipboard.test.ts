import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { ClipboardInstance } from "./clipboard.js";

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};

// Every clipboard call is stubbed: a real one could open a browser prompt.
let writeText = vi.fn();
const clipboard = (value: unknown) =>
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
const activation = (isActive: boolean) =>
  vi.spyOn(navigator, "userActivation", "get").mockReturnValue({ isActive } as UserActivation);

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  clipboard({ writeText });
});
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  delete (navigator as { clipboard?: unknown }).clipboard;
  vi.restoreAllMocks();
  resetPage();
});

const TOASTS = `
<section data-ok-toaster data-ok-position="top-right" aria-label="Notifications">
  <ol data-ok-toaster-list aria-live="polite"></ol>
</section>
<template id="copied"><li data-ok-toast data-ok-type="success"><div data-ok-toast-content><div data-ok-toast-title>Copied!</div></div></li></template>
<template id="failed"><li data-ok-toast data-ok-type="error"><div data-ok-toast-content><div data-ok-toast-title>Couldn't copy</div></div></li></template>`;

const FIELD = `
<div data-ok-text-field data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-margin="none">
  <label data-ok-text-field-label for="link">Link</label>
  <div data-ok-text-field-control>
    <input id="link" data-ok-text-field-input placeholder=" " value="https://example.com/a">
    <span data-ok-text-field-adornment="end"><button type="button" aria-label="Copy" data-ok-clipboard-copy data-ok-clipboard-toast="copied" data-ok-clipboard-error-toast="failed">C</button></span>
  </div>
</div>`;

/** Waits for the next `ok:clipboard:copy` on the document. */
const copied = () =>
  new Promise<CustomEvent>((resolve) =>
    document.addEventListener("ok:clipboard:copy", (event) => resolve(event as CustomEvent), {
      once: true,
    }),
  );

const liveText = () => document.querySelector("[data-ok-toaster-list]")?.textContent ?? "";

describe("clipboard runtime", () => {
  it("copies a text field's input from its end button and announces the toast", async () => {
    const host = mount(`${FIELD}${TOASTS}`);
    start();
    const event = copied();
    await userEvent.click(host.querySelector("button") as HTMLElement);
    const { detail, target } = await event;
    expect(detail).toEqual({ text: "https://example.com/a", ok: true });
    expect(target).toBe(host.querySelector("button"));
    expect(writeText).toHaveBeenCalledWith("https://example.com/a");
    // The toaster's polite live region announces "Copied!".
    expect(document.querySelector("[data-ok-toaster-list]")?.getAttribute("aria-live")).toBe(
      "polite",
    );
    expect(liveText()).toContain("Copied!");
  });

  it("copies the value the person typed", async () => {
    const host = mount(`${FIELD}${TOASTS}`);
    start();
    const input = host.querySelector("input") as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, "typed");
    const event = copied();
    await userEvent.click(host.querySelector("button") as HTMLElement);
    expect((await event).detail.text).toBe("typed");
  });

  it("copies on a double click, not on a single one", async () => {
    const host = mount(
      `<p id="note" data-ok-clipboard-copy data-ok-clipboard-trigger="dblclick" data-ok-clipboard-toast="copied">
        Written over
        two lines.
      </p>${TOASTS}`,
    );
    start();
    const paragraph = host.querySelector("p") as HTMLElement;
    await userEvent.click(paragraph);
    await settle();
    expect(writeText).not.toHaveBeenCalled();
    const event = copied();
    await userEvent.dblClick(paragraph);
    expect((await event).detail).toEqual({ text: "Written over two lines.", ok: true });
    expect(liveText()).toContain("Copied!");
  });

  it("copies the element a trigger names, or its literal text", async () => {
    const host = mount(
      `<p id="source">Source text</p>
      <button type="button" data-ok-clipboard-copy="source">Copy paragraph</button>
      <button type="button" data-ok-clipboard-copy data-ok-clipboard-text="literal">Copy literal</button>`,
    );
    start();
    const [named, literal] = host.querySelectorAll("button");
    let event = copied();
    await userEvent.click(named as HTMLElement);
    expect((await event).detail.text).toBe("Source text");
    event = copied();
    await userEvent.click(literal as HTMLElement);
    expect((await event).detail.text).toBe("literal");
  });

  it("reports and shows the error toast when the copy is refused", async () => {
    const host = mount(`${FIELD}${TOASTS}`);
    start();
    clipboard({ writeText: vi.fn().mockRejectedValue(new DOMException("No", "NotAllowedError")) });
    vi.spyOn(document, "execCommand").mockReturnValue(false);
    const event = copied();
    await userEvent.click(host.querySelector("button") as HTMLElement);
    expect((await event).detail).toEqual({
      text: "https://example.com/a",
      ok: false,
      reason: "denied",
    });
    expect(liveText()).toContain("Couldn't copy");
    expect(liveText()).not.toContain("Copied!");
  });

  it("refuses a copy outside a user gesture (instance method)", async () => {
    const host = mount(`${FIELD}${TOASTS}`);
    const rt = start();
    activation(false);
    const instance = rt.get<ClipboardInstance>(host.querySelector("button"), "clipboard");
    await expect(instance?.copy()).resolves.toEqual({ ok: false, reason: "gesture" });
    expect(writeText).not.toHaveBeenCalled();
    expect(liveText()).toContain("Couldn't copy");
  });

  it("warns about a trigger without a source, a template or a toaster", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount(
      `<button type="button" data-ok-clipboard-copy="missing" data-ok-clipboard-error-toast="nope">A</button>
      <button type="button" data-ok-clipboard-copy data-ok-clipboard-toast="copied">B</button>
      <button type="button" data-ok-clipboard-copy data-ok-clipboard-text="x" data-ok-clipboard-toast="copied" data-ok-toast-toaster="other">C</button>
      ${TOASTS}`,
    );
    const rt = start();
    const [missing, bare, named] = [...host.querySelectorAll("button")].map((button) =>
      rt.get<ClipboardInstance>(button, "clipboard"),
    );
    await expect(missing?.copy()).resolves.toEqual({ ok: false, reason: "unsupported" });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("names no element"),
      expect.anything(),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("No toast"), expect.anything());
    // A button outside a text field without a value copies its own text.
    await expect(bare?.copy()).resolves.toEqual({ ok: true });
    expect(writeText).toHaveBeenLastCalledWith("B");
    // `data-ok-toast-toaster` names a toaster that isn't there.
    warn.mockClear();
    await named?.copy();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("copies the text of a trigger that isn't a button", async () => {
    const host = mount(`<span data-ok-clipboard-copy tabindex="0">Span text</span>`);
    start();
    const event = copied();
    await userEvent.click(host.querySelector("span") as HTMLElement);
    expect((await event).detail.text).toBe("Span text");
  });

  it("leaves React markup alone", async () => {
    const host = mount(
      `<div data-ok-runtime="off"><button type="button" data-ok-clipboard-copy data-ok-clipboard-text="x">A</button></div>`,
    );
    start();
    await userEvent.click(host.querySelector("button") as HTMLElement);
    await settle();
    expect(writeText).not.toHaveBeenCalled();
  });
});
