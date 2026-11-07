import { selectionControlColors, selectionControlSizes } from "@owlky/core";
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
import { checkbox } from "./checkbox.js";

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

const box = (attrs = "", input = "") =>
  `<span data-ok-checkbox data-ok-color="primary" data-ok-size="medium" ${attrs}><input type="checkbox" data-ok-checkbox-input aria-label="x" ${input}><span data-ok-checkbox-icon="unchecked" aria-hidden="true"></span><span data-ok-checkbox-icon="checked" aria-hidden="true"></span><span data-ok-checkbox-icon="indeterminate" aria-hidden="true"></span></span>`;
const inputs = (host: Element) => [...host.querySelectorAll<HTMLInputElement>("input")];
const mixed = (input: HTMLInputElement) =>
  input.indeterminate && input.closest("[data-ok-checkbox]")?.hasAttribute("data-ok-indeterminate");

describe("checkbox snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(7));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-checkbox]")) {
      expect(selectionControlColors).toContain(root.dataset["okColor"]);
      expect(selectionControlSizes).toContain(root.dataset["okSize"]);
      const input = root.querySelector(":scope > input[type=checkbox][data-ok-checkbox-input]");
      expect(input).not.toBeNull();
      const icons = [...root.querySelectorAll(":scope > [data-ok-checkbox-icon]")];
      expect(icons.map((i) => i.getAttribute("data-ok-checkbox-icon"))).toEqual([
        "unchecked",
        "checked",
        "indeterminate",
      ]);
      for (const icon of icons) expect(icon.getAttribute("aria-hidden")).toBe("true");
      for (const svg of root.querySelectorAll("svg"))
        expect(svg.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("checkbox runtime", () => {
  it("mirrors data-ok-indeterminate to the input; a click clears both", async () => {
    const host = mount(box("data-ok-indeterminate"));
    start();
    const [input] = inputs(host) as [HTMLInputElement];
    expect(input.indeterminate).toBe(true);
    const root = input.closest("[data-ok-checkbox]") as HTMLElement;
    root.removeAttribute("data-ok-indeterminate");
    await settle();
    expect(input.indeterminate).toBe(false);
    root.setAttribute("data-ok-indeterminate", "");
    await settle();
    expect(input.indeterminate).toBe(true);
    await userEvent.click(input);
    expect(input.checked).toBe(true);
    expect(mixed(input)).toBeFalsy();
    expect(root.hasAttribute("data-ok-indeterminate")).toBe(false);
  });

  it("leaves a mixed state set by other code alone", async () => {
    const host = mount(box());
    const [input] = inputs(host) as [HTMLInputElement];
    input.indeterminate = true;
    start();
    await settle();
    expect(input.indeterminate).toBe(true);
  });

  it("a parent with aria-controls follows and drives its children", async () => {
    const host = mount(
      box("", 'aria-controls="c1 c2 missing"') + box("", 'id="c1" checked') + box("", 'id="c2"'),
    );
    start();
    const [parent, c1, c2] = inputs(host) as [HTMLInputElement, HTMLInputElement, HTMLInputElement];
    expect(mixed(parent)).toBe(true);
    await userEvent.click(c2);
    expect(parent.checked).toBe(true);
    expect(mixed(parent)).toBeFalsy();
    await userEvent.click(parent);
    expect([c1.checked, c2.checked, parent.checked]).toEqual([false, false, false]);
    await userEvent.click(parent);
    expect([c1.checked, c2.checked]).toEqual([true, true]);
    await userEvent.click(c1);
    expect(mixed(parent)).toBe(true);
    expect(parent.checked).toBe(false);
  });

  it("nested parents update up the chain and ignore cycles and hostile ids", async () => {
    const host = mount(
      box("", 'aria-controls="mid self" id="self"') +
        box("", 'id="mid" aria-controls="leaf ../ &quot;&gt;&lt;img onerror=x&gt;"') +
        box("", 'id="leaf"'),
    );
    start();
    const [top, mid, leaf] = inputs(host) as [HTMLInputElement, HTMLInputElement, HTMLInputElement];
    await userEvent.click(leaf);
    expect(mid.checked).toBe(true);
    expect(top.checked).toBe(true);
    expect(document.querySelector("img")).toBeNull();
  });

  it("parents that control each other don't loop; a parent of missing ids stays as written", async () => {
    const host = mount(
      box("", 'id="a" aria-controls="b"') +
        box("", 'id="b" aria-controls="a"') +
        box("data-ok-indeterminate", 'aria-controls="ghost"'),
    );
    start();
    const [a, b, lonely] = inputs(host) as [HTMLInputElement, HTMLInputElement, HTMLInputElement];
    await userEvent.click(a);
    expect([a.checked, b.checked]).toEqual([true, true]);
    expect(lonely.indeterminate).toBe(true);
  });

  it("is idempotent, mounts later markup, and stop() disconnects", async () => {
    const host = mount(box());
    const rt = start();
    rt.init();
    const later = mount(box("data-ok-indeterminate"));
    await settle();
    const [input] = inputs(later) as [HTMLInputElement];
    expect(input.indeterminate).toBe(true);
    expect(rt.get(host.firstElementChild, "checkbox")).toBeDefined();
    rt.stop();
    later.firstElementChild?.removeAttribute("data-ok-indeterminate");
    await settle();
    expect(input.indeterminate).toBe(true);
    expect(components).toContain(checkbox);
  });

  it("ignores roots without an input and React-owned checkboxes", async () => {
    const host = mount(
      `<span data-ok-checkbox></span><div data-ok-runtime="off">${box("data-ok-indeterminate")}</div>`,
    );
    start();
    await settle();
    const [input] = inputs(host) as [HTMLInputElement];
    expect(input.indeterminate).toBe(false);
  });
});
