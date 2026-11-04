import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { ToggleGroupInstance } from "./toggle-group.js";

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const button = (value: string, pressed = false, extra = "") =>
  `<button type="button" data-mt-toggle-button data-mt-color="inherit" data-mt-size="md" value="${value}" aria-pressed="${pressed}" aria-label="${value}" ${extra}></button>`;

function setup(exclusive: boolean, inner: string) {
  const host = mount(
    `<div role="group" data-mt-toggle-group data-mt-orientation="horizontal" ${exclusive ? "data-mt-exclusive" : ""} aria-label="g">${inner}</div>`,
  );
  runtime = createRuntime()
    .register(...components)
    .start();
  const group = host.querySelector("[data-mt-toggle-group]") as HTMLElement;
  const instance = runtime.get<ToggleGroupInstance>(group, "toggle-group") as ToggleGroupInstance;
  const byValue = (value: string) => host.querySelector(`[value="${value}"]`) as HTMLButtonElement;
  const pressed = () =>
    [...host.querySelectorAll("[aria-pressed='true']")].map((b) => b.getAttribute("value"));
  return { group, instance, byValue, pressed };
}

describe("toggle group runtime", () => {
  it("exclusive: one pressed value, cleared when pressed again; emits value and previous", async () => {
    const { group, instance, byValue, pressed } = setup(
      true,
      button("left", true) + button("center") + button("right"),
    );
    const details: unknown[] = [];
    group.addEventListener("mt:toggle-group:change", (event) => {
      const { value, previous, button: source } = (event as CustomEvent).detail;
      details.push([value, previous, source.getAttribute("value")]);
    });
    expect(instance.value).toBe("left");
    await userEvent.click(byValue("center"));
    expect(pressed()).toEqual(["center"]);
    await userEvent.click(byValue("center"));
    expect(instance.value).toBeNull();
    expect(details).toEqual([
      ["center", "left", "center"],
      [null, "center", "center"],
    ]);
  });

  it("multiple: adds and removes values with the keyboard too", async () => {
    const { instance, byValue } = setup(false, button("bold", true) + button("italic"));
    expect(instance.value).toEqual(["bold"]);
    byValue("italic").focus();
    await userEvent.keyboard(" ");
    expect(instance.value).toEqual(["bold", "italic"]);
    await userEvent.click(byValue("bold"));
    expect(instance.value).toEqual(["italic"]);
  });

  it("keeps the selection when the change event is prevented or the button is disabled", async () => {
    const { group, instance, byValue } = setup(
      true,
      button("a", true) + button("b") + button("c", false, "disabled"),
    );
    const listener = vi.fn((event: Event) => event.preventDefault());
    group.addEventListener("mt:toggle-group:change", listener);
    await userEvent.click(byValue("b"));
    expect(instance.toggle(byValue("c"))).toBe(false);
    expect(instance.value).toBe("a");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("setValue presses exactly the given values without events; foreign buttons are ignored", () => {
    const { group, instance, pressed } = setup(false, button("x") + button("y") + button("z"));
    const listener = vi.fn();
    group.addEventListener("mt:toggle-group:change", listener);
    instance.setValue(["x", "z"]);
    expect(pressed()).toEqual(["x", "z"]);
    instance.setValue(null);
    expect(pressed()).toEqual([]);
    expect(instance.toggle(document.body)).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("a nested group owns its own buttons", async () => {
    const { instance, byValue } = setup(
      true,
      `${button("outer")}<div role="group" data-mt-toggle-group data-mt-exclusive aria-label="inner">${button("inner")}</div>`,
    );
    await userEvent.click(byValue("inner"));
    expect(instance.value).toBeNull();
    expect(byValue("inner").getAttribute("aria-pressed")).toBe("true");
  });

  it("buttons without a value act as the empty value", async () => {
    const host = mount(
      '<div role="group" data-mt-toggle-group data-mt-exclusive aria-label="g"><button type="button" data-mt-toggle-button aria-label="n"></button></div>',
    );
    runtime = createRuntime()
      .register(...components)
      .start();
    const group = host.querySelector("[data-mt-toggle-group]") as HTMLElement;
    await userEvent.click(host.querySelector("button") as HTMLButtonElement);
    expect(runtime.get<ToggleGroupInstance>(group, "toggle-group")?.value).toBe("");
  });

  it("vertical groups stack their buttons", () => {
    const host = mount(
      `<div role="group" data-mt-toggle-group data-mt-orientation="vertical" aria-label="g">${button("a")}${button("b")}</div>`,
    );
    expect(getComputedStyle(host.firstElementChild as Element).flexDirection).toBe("column");
    const [a, b] = host.querySelectorAll("button") as unknown as HTMLElement[];
    expect((a as HTMLElement).getBoundingClientRect().height).toBe(38);
    expect((b as HTMLElement).getBoundingClientRect().top).toBeGreaterThan(
      (a as HTMLElement).getBoundingClientRect().bottom,
    );
  });
});
