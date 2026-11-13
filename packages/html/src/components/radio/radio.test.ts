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

describe("radio snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(5));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    const group = host.querySelector<HTMLElement>("[data-ok-radio-group]");
    expect(group?.getAttribute("role")).toBe("radiogroup");
    expect(group?.hasAttribute("aria-label") || group?.hasAttribute("aria-labelledby")).toBe(true);
    const names = new Set<string>();
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-radio]")) {
      expect(selectionControlColors).toContain(root.dataset["okColor"]);
      expect(selectionControlSizes).toContain(root.dataset["okSize"]);
      const input = root.querySelector<HTMLInputElement>(":scope > input[type=radio]");
      expect(input).not.toBeNull();
      names.add(input?.name ?? "");
      const swatch = root.hasAttribute("data-ok-swatch");
      expect(
        [...root.querySelectorAll(":scope > [data-ok-radio-icon]")].map((i) =>
          i.getAttribute("data-ok-radio-icon"),
        ),
      ).toEqual(swatch ? [] : ["unchecked", "checked"]);
      expect(root.querySelectorAll(":scope > [data-ok-radio-swatch]")).toHaveLength(swatch ? 1 : 0);
      // Swatches are named after their color, not its code.
      if (swatch) expect(input?.getAttribute("aria-label")).toMatch(/^[A-Z][a-z ]+$/);
    }
    expect(names.size).toBe(1);
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

const swatchHtml = (attrs: string, checked = "") =>
  `<div role="radiogroup" data-ok-radio-group data-ok-row aria-label="Color"><span data-ok-radio data-ok-color="primary" ${attrs}><input type="radio" data-ok-radio-input name="c" value="a" aria-label="A" ${checked}><span data-ok-radio-swatch aria-hidden="true"><svg viewBox="0 0 24 24"></svg></span></span></div>`;

describe("radio runtime (color swatches)", () => {
  it("paints the swatch, picks a mark that contrasts, follows changes and cleans up", async () => {
    const host = mount(swatchHtml('data-ok-swatch="#FFEB3B"', "checked"));
    start();
    const root = host.querySelector<HTMLElement>("[data-ok-radio]") as HTMLElement;
    const swatch = root.querySelector("[data-ok-radio-swatch]") as HTMLElement;
    expect(getComputedStyle(swatch).backgroundColor).toBe("rgb(255, 235, 59)");
    expect(getComputedStyle(swatch).color).toBe("rgb(0, 0, 0)");
    // Checked: larger (28px) with the mark shown.
    expect(getComputedStyle(swatch).width).toBe("28px");
    expect(getComputedStyle(swatch.querySelector("svg") as Element).display).toBe("block");
    root.setAttribute("data-ok-swatch", "#3F51B5");
    await settle();
    expect(getComputedStyle(swatch).backgroundColor).toBe("rgb(63, 81, 181)");
    expect(getComputedStyle(swatch).color).toBe("rgb(255, 255, 255)");
    root.setAttribute("data-ok-swatch", 'red;background:url("x")');
    await settle();
    expect(root.style.getPropertyValue("--_ok-swatch")).toBe("");
    root.setAttribute("data-ok-swatch", "var(--ok-palette-primary-main)");
    await settle();
    expect(getComputedStyle(swatch).backgroundColor).toBe("rgb(97, 95, 255)");
    runtime?.stop();
    expect(root.style.getPropertyValue("--_ok-swatch")).toBe("");
  });

  it("unchecked swatches are small and grey without the runtime; shapes and sizes", async () => {
    const host = mount(
      swatchHtml('data-ok-swatch="#FF9800" data-ok-shape="rounded"') +
        swatchHtml('data-ok-swatch="#FF9800" data-ok-size="small"'),
    );
    const [rounded, small] = host.querySelectorAll<HTMLElement>("[data-ok-radio]");
    const swatch = (root: Element | undefined) =>
      getComputedStyle(root?.querySelector("[data-ok-radio-swatch]") as Element);
    expect(swatch(rounded).width).toBe("20px");
    expect(swatch(rounded).borderRadius).toBe("6px");
    expect(swatch(rounded).backgroundColor).toBe("rgb(113, 113, 123)");
    expect(getComputedStyle(small as Element).width).toBe("28px");
    expect(swatch(small).width).toBe("16px");
    await userEvent.click(small?.querySelector("input") as HTMLInputElement);
    for (const animation of (
      (small as HTMLElement).querySelector("[data-ok-radio-swatch]") as Element
    ).getAnimations())
      animation.finish();
    expect(swatch(small).width).toBe("20px");
  });
});

describe("radio CSS without JavaScript", () => {
  it("one per name stays checked; the checked one shows its color", async () => {
    const host = mount(snippets.find(([path]) => path.includes("basic"))?.[1] ?? "");
    const [a, b] = host.querySelectorAll<HTMLInputElement>("input");
    await userEvent.click(b as HTMLInputElement);
    expect(a?.checked).toBe(false);
    const root = b?.closest("[data-ok-radio]") as HTMLElement;
    expect(getComputedStyle(root).color).toBe("rgb(97, 95, 255)");
  });
});
