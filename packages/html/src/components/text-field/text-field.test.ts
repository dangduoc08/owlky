import { textFieldMargins, textFieldVariants } from "@owlky/core";
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
import { textField } from "./text-field.js";

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

const field = (attrs = "", input = '<input id="f" data-ok-text-field-input placeholder=" ">') =>
  `<div data-ok-text-field data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-margin="none" ${attrs}><label data-ok-text-field-label for="f">Name</label><div data-ok-text-field-control>${input}<fieldset data-ok-text-field-outline aria-hidden="true"><legend><span>Name</span></legend></fieldset></div></div>`;

describe("text field snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(21));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-text-field]")) {
      expect(textFieldVariants).toContain(root.dataset["okVariant"]);
      expect(textFieldMargins).toContain(root.dataset["okMargin"]);
      const input = root.querySelector<HTMLElement>(
        ":scope > [data-ok-text-field-control] > [data-ok-text-field-input]",
      );
      expect(input).not.toBeNull();
      const label = root.querySelector(":scope > [data-ok-text-field-label]");
      if (label) expect(label.getAttribute("for")).toBe(input?.id);
      else expect(input?.getAttribute("aria-label")).not.toBeNull();
      // A listbox Select's trigger is a div: its hidden input carries the placeholder.
      const value = input?.hasAttribute("data-ok-select-display")
        ? root.querySelector("[data-ok-select-input]")
        : input;
      if (input?.localName !== "select") expect(value?.getAttribute("placeholder")).not.toBeNull();
      const outlined = root.dataset["okVariant"] === "outlined";
      expect(root.querySelector("[data-ok-text-field-outline]") !== null).toBe(outlined);
      const helper = root.querySelector(":scope > [data-ok-text-field-helper]");
      if (helper) expect(input?.getAttribute("aria-describedby")).toContain(helper.id);
      if (root.hasAttribute("data-ok-error"))
        expect(input?.getAttribute("aria-invalid")).toBe("true");
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

describe("text field CSS without JavaScript", () => {
  it("the label floats with focus and a value", async () => {
    const host = mount(field());
    const input = host.querySelector("input") as HTMLInputElement;
    const label = host.querySelector("label") as HTMLElement;
    const scale = () => new DOMMatrix(getComputedStyle(label).transform).a;
    expect(scale()).toBe(1);
    await userEvent.click(input);
    await Promise.all(label.getAnimations().map((a) => a.finished));
    expect(scale()).toBe(0.75);
    await userEvent.keyboard("x");
    input.blur();
    await Promise.all(label.getAnimations().map((a) => a.finished));
    expect(scale()).toBe(0.75);
  });
});

describe("text field runtime", () => {
  it("rows become custom properties and follow changes", async () => {
    const host = mount(
      field(
        'data-ok-min-rows="2" data-ok-max-rows="4"',
        '<textarea id="f" data-ok-text-field-input rows="2" placeholder=" "></textarea>',
      ),
    );
    start();
    const root = host.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--_ok-min-rows")).toBe("2");
    expect(root.style.getPropertyValue("--_ok-max-rows")).toBe("4");
    root.setAttribute("data-ok-max-rows", "x");
    root.removeAttribute("data-ok-min-rows");
    await settle();
    expect(root.style.getPropertyValue("--_ok-max-rows")).toBe("");
    expect(root.style.getPropertyValue("--_ok-min-rows")).toBe("");
    root.setAttribute("data-ok-max-rows", "6");
    await settle();
    expect(root.style.getPropertyValue("--_ok-max-rows")).toBe("6");
    runtime?.destroy(host);
    expect(root.style.length).toBe(0);
    expect(components).toContain(textField);
  });

  it("data-ok-error marks the input invalid, and only removes what it set", async () => {
    const host = mount(
      field("data-ok-error") +
        field("", '<input id="g" data-ok-text-field-input aria-invalid="true" placeholder=" ">'),
    );
    start();
    const [a, b] = host.querySelectorAll<HTMLElement>("[data-ok-text-field]");
    const inputOf = (root: Element | undefined) => root?.querySelector("input") as HTMLInputElement;
    expect(inputOf(a).getAttribute("aria-invalid")).toBe("true");
    a?.removeAttribute("data-ok-error");
    await settle();
    expect(inputOf(a).hasAttribute("aria-invalid")).toBe(false);
    b?.setAttribute("data-ok-error", "");
    await settle();
    b?.removeAttribute("data-ok-error");
    await settle();
    // The author's own aria-invalid stays.
    expect(inputOf(b).getAttribute("aria-invalid")).toBe("true");
    const empty = document.createElement("div");
    empty.setAttribute("data-ok-text-field", "");
    empty.setAttribute("data-ok-error", "");
    host.append(empty);
    await settle();
    empty.removeAttribute("data-ok-error");
    await settle();
  });

  it("the reveal button shows and hides a password", async () => {
    const host = mount(
      field(
        "",
        '<input id="f" data-ok-text-field-input type="password" placeholder=" " value="secret"><span data-ok-text-field-adornment="end"><button type="button" data-ok-text-field-reveal aria-label="Show password" aria-pressed="false">o</button></span>',
      ) +
        '<div data-ok-text-field><button type="button" data-ok-text-field-reveal aria-label="Lonely">o</button></div>',
    );
    start();
    const input = host.querySelector("input") as HTMLInputElement;
    const button = host.querySelector("button") as HTMLButtonElement;
    await userEvent.click(button);
    expect(input.type).toBe("text");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(button);
    expect(input.type).toBe("password");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(host.querySelector('[aria-label="Lonely"]') as HTMLElement);
  });

  it.each(['"><img src=x onerror=alert(1)>', "-3", "1e9999", "9".repeat(4000)])(
    "ignores hostile row values: %s",
    async (value) => {
      const host = mount(field(`data-ok-max-rows="${value.replaceAll('"', "&quot;")}"`));
      start();
      await settle();
      expect((host.firstElementChild as HTMLElement).style.length).toBe(0);
      expect(document.querySelector("img")).toBeNull();
    },
  );
});
