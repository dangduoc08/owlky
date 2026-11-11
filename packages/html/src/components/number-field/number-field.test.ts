import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { NumberFieldInstance } from "./number-field.js";

const snippets = import.meta.glob("../text-field/examples/number-input-*.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const snippet = (name: string) =>
  Object.entries(snippets).find(([path]) => path.endsWith(`number-input-${name}.html`))?.[1] ?? "";

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

const parts = (host: HTMLElement) => ({
  root: host.querySelector("[data-ok-number-field]") as HTMLElement,
  input: host.querySelector("input") as HTMLInputElement,
  decrement: host.querySelector("[data-ok-number-field-decrement]") as HTMLButtonElement,
  increment: host.querySelector("[data-ok-number-field-increment]") as HTMLButtonElement,
});

type Detail = { value: number | null; reason: string };
const record = (root: HTMLElement) => {
  const changes: Detail[] = [];
  const commits: Detail[] = [];
  root.addEventListener("ok:number-field:change", (e) => changes.push((e as CustomEvent).detail));
  root.addEventListener("ok:number-field:commit", (e) => commits.push((e as CustomEvent).detail));
  return { changes, commits };
};

describe("number field runtime", () => {
  it("has three story snippets, each without axe violations", async () => {
    expect(Object.keys(snippets)).toHaveLength(3);
    for (const name of ["basic", "helper", "disabled"]) {
      const host = mount(snippet(name));
      start();
      await settle();
      await expectNoAxeViolations(host);
      runtime?.stop();
      resetPage();
    }
  });

  it("steps with the buttons and the keys, firing change and commit", async () => {
    const host = mount(snippet("helper"));
    start();
    const { root, input, decrement, increment } = parts(host);
    const { changes, commits } = record(root);
    expect(decrement.disabled).toBe(true);
    await userEvent.click(increment);
    expect(input.value).toBe("1");
    expect(input.getAttribute("aria-valuenow")).toBe("1");
    expect(decrement.disabled).toBe(false);
    expect(changes).toEqual([{ value: 1, reason: "increment-press" }]);
    expect(commits).toEqual([{ value: 1, reason: "increment-press" }]);
    input.focus();
    await userEvent.keyboard("{End}");
    expect(input.value).toBe("10");
    expect(increment.disabled).toBe(true);
    await userEvent.keyboard("{PageDown}");
    expect(input.value).toBe("0");
    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowDown}");
    expect(input.value).toBe("1");
    expect(changes.at(-1)).toEqual({ value: 1, reason: "keyboard" });
    await userEvent.click(decrement);
    expect(input.value).toBe("0");
    expect(document.activeElement).toBe(input);
  });

  it("commits typed text on blur: clamped, or reverted when it isn't a number", async () => {
    const host = mount(snippet("helper"));
    start();
    const { root, input } = parts(host);
    const { changes, commits } = record(root);
    await userEvent.clear(input);
    expect(changes.at(-1)).toEqual({ value: null, reason: "input-clear" });
    expect(input.hasAttribute("aria-valuenow")).toBe(false);
    await userEvent.type(input, "42");
    expect(changes.at(-1)).toEqual({ value: 42, reason: "input-change" });
    input.blur();
    expect(input.value).toBe("10");
    expect(commits.at(-1)).toEqual({ value: 10, reason: "input-blur" });
    await userEvent.clear(input);
    await userEvent.type(input, "3x");
    await userEvent.keyboard("{Enter}");
    // "3" was reported while typing; "3x" isn't a number, so 3 stays.
    expect(input.value).toBe("3");
  });

  it("lets a listener refuse a value", async () => {
    const host = mount(snippet("basic"));
    start();
    const { root, input, increment } = parts(host);
    root.addEventListener("ok:number-field:change", (event) => {
      if ((event as CustomEvent<Detail>).detail.value === 2) event.preventDefault();
    });
    await userEvent.click(increment);
    await userEvent.click(increment);
    expect(input.value).toBe("1");
    expect(input.getAttribute("aria-valuenow")).toBe("1");
  });

  it("does nothing while disabled, and follows changes of disabled, read-only and bounds", async () => {
    const host = mount(snippet("disabled"));
    start();
    const { root, input, decrement, increment } = parts(host);
    expect(decrement.disabled).toBe(true);
    expect(increment.disabled).toBe(true);
    input.disabled = false;
    await settle();
    expect(increment.disabled).toBe(false);
    // The value sits at min: the decrement button stays off.
    expect(decrement.disabled).toBe(true);
    input.readOnly = true;
    await settle();
    expect(increment.disabled).toBe(true);
    input.readOnly = false;
    root.setAttribute("data-ok-max", "0");
    await settle();
    expect(input.getAttribute("aria-valuemax")).toBe("0");
    expect(increment.disabled).toBe(true);
    root.removeAttribute("data-ok-min");
    await settle();
    expect(input.hasAttribute("aria-valuemin")).toBe(false);
    expect(decrement.disabled).toBe(false);
  });

  it("has getValue, setValue, stepUp and stepDown", () => {
    const host = mount(snippet("helper"));
    const rt = start();
    const { root, input } = parts(host);
    const instance = rt.get<NumberFieldInstance>(root, "number-field") as NumberFieldInstance;
    const { changes } = record(root);
    expect(instance.getValue()).toBe(0);
    instance.setValue(7);
    expect(input.value).toBe("7");
    expect(instance.getValue()).toBe(7);
    instance.setValue(99);
    expect(instance.getValue()).toBe(10);
    instance.setValue(null);
    expect(input.value).toBe("");
    instance.setValue(Number.NaN);
    expect(instance.getValue()).toBeNull();
    // setValue fires no event; the steps do.
    expect(changes).toEqual([]);
    instance.stepUp();
    expect(instance.getValue()).toBe(0);
    instance.stepUp(3);
    expect(instance.getValue()).toBe(3);
    instance.stepDown();
    expect(instance.getValue()).toBe(2);
    root.setAttribute("data-ok-allow-out-of-range", "");
    instance.setValue(99);
    expect(instance.getValue()).toBe(99);
  });

  it("starts from the input's text and cleans up on stop", async () => {
    const host = mount(snippet("basic").replace('value="0"', 'value="abc"'));
    const rt = start();
    const { root, input, increment } = parts(host);
    expect(rt.get<NumberFieldInstance>(root, "number-field")?.getValue()).toBeNull();
    // An empty value doesn't block the decrement button.
    expect(input.hasAttribute("aria-valuenow")).toBe(false);
    rt.stop();
    runtime = undefined;
    increment.click();
    expect(input.value).toBe("abc");
  });

  it("works without an input", () => {
    const host = mount('<div data-ok-number-field data-ok-min="0"></div>');
    const rt = start();
    const instance = rt.get<NumberFieldInstance>(
      host.firstElementChild,
      "number-field",
    ) as NumberFieldInstance;
    instance.setValue(1);
    instance.stepUp();
    expect(instance.getValue()).toBe(1);
    const spy = vi.fn();
    host.addEventListener("ok:number-field:change", spy);
    expect(spy).not.toHaveBeenCalled();
  });
});
