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
import type { SliderInstance } from "./slider.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  snippets.find(([path]) => path.includes(`/${name}-`))?.[1] as string;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
const at = (el: Element | null | undefined) =>
  (el as HTMLElement).style.getPropertyValue("--_ok-slider-at");

function press(root: HTMLElement, ratio: number, type = "pointerdown") {
  const box = (root.querySelector("[data-ok-slider-rail]") as HTMLElement).getBoundingClientRect();
  root.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 1,
      clientX: box.left + ratio * box.width,
      clientY: box.top + box.height / 2,
    }),
  );
}

describe("slider snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(10));

  it.each(snippets)("%s: valid anatomy, no style attributes", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll("[data-ok-slider]")) {
      expect(root.querySelector(":scope > [data-ok-slider-rail]")).not.toBeNull();
      for (const thumb of root.querySelectorAll("[data-ok-slider-thumb]")) {
        const input = thumb.querySelector(":scope > input") as HTMLInputElement;
        expect(input.type).toBe("range");
        expect(
          input.getAttribute("aria-label") || input.getAttribute("aria-labelledby"),
        ).toBeTruthy();
      }
      for (const label of root.querySelectorAll("[data-ok-slider-mark-label]"))
        expect(label.getAttribute("aria-hidden")).toBe("true");
    }
    expect(html).not.toMatch(/style=/);
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("slider runtime", () => {
  it("places the track, thumbs and marks from the values (CSSOM)", () => {
    const host = mount(snippet("custom-marks"));
    start();
    const root = host.querySelector<HTMLElement>("[data-ok-slider]") as HTMLElement;
    expect(root.style.getPropertyValue("--_ok-slider-end")).toBe("20%");
    expect(at(root.querySelector("[data-ok-slider-thumb]"))).toBe("20%");
    const marks = [...root.querySelectorAll("[data-ok-slider-mark]")];
    expect(marks.map(at)).toEqual(["0%", "20%", "37%", "100%"]);
    expect(marks.map((m) => m.hasAttribute("data-ok-active"))).toEqual([true, true, false, false]);
    expect(root.querySelector("input")?.getAttribute("aria-valuetext")).toBe("20°C");
  });

  it("drag: change events, label and aria text follow; commit on release", () => {
    const host = mount(snippet("temperature"));
    start();
    const root = host.querySelector<HTMLElement>("[data-ok-slider]") as HTMLElement;
    const seen: unknown[] = [];
    root.addEventListener("ok:slider:change", (e) => seen.push((e as CustomEvent).detail));
    const commits: unknown[] = [];
    root.addEventListener("ok:slider:commit", (e) => commits.push((e as CustomEvent).detail));
    press(root, 0.62);
    press(root, 0.8, "pointermove");
    press(root, 0.8, "pointerup");
    expect(seen).toEqual([
      { value: [60], activeThumb: 0 },
      { value: [80], activeThumb: 0 },
    ]);
    expect(commits).toEqual([{ value: [80] }]);
    const input = root.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("80");
    expect(input.getAttribute("aria-valuetext")).toBe("80°C");
    expect(root.querySelector("[data-ok-slider-value-label]")?.textContent).toBe("80°C");
  });

  it("keyboard: arrows step; marks only moves between marks", async () => {
    const host = mount(snippet("restricted"));
    const rt = start();
    const root = host.querySelector<HTMLElement>("[data-ok-slider]") as HTMLElement;
    (root.querySelector("input") as HTMLInputElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(rt.get<SliderInstance>(root, "slider")?.value).toEqual([37]);
    await userEvent.keyboard("{End}");
    expect(rt.get<SliderInstance>(root, "slider")?.value).toEqual([100]);
  });

  it("range: thumbs swap; change is cancelable; setValue", () => {
    const host = mount(snippet("range"));
    const rt = start();
    const root = host.querySelector<HTMLElement>("[data-ok-slider]") as HTMLElement;
    const instance = rt.get<SliderInstance>(root, "slider") as SliderInstance;
    expect(instance.value).toEqual([200, 370]);
    expect(root.style.getPropertyValue("--_ok-slider-start")).toBe("20%");
    press(root, 0.5);
    expect(instance.value).toEqual([200, 500]);
    press(root, 0.1, "pointermove");
    expect(instance.value).toEqual([100, 200]);
    press(root, 0.1, "pointerup");
    root.addEventListener("ok:slider:change", (e) => e.preventDefault(), { once: true });
    press(root, 0.9);
    expect(instance.value).toEqual([100, 200]);
    press(root, 0.9, "pointerup");
    instance.setValue([300, 400]);
    expect(instance.value).toEqual([300, 400]);
    instance.setValue(50);
    expect((root.querySelector("input") as HTMLInputElement).value).toBe("50");
  });

  it("disabled sliders ignore input; assistive input events go through change", () => {
    const host = mount(snippet("disabled") + snippet("volume"));
    const rt = start();
    const [disabled, volume] = host.querySelectorAll<HTMLElement>(
      "[data-ok-slider]",
    ) as unknown as HTMLElement[];
    press(disabled as HTMLElement, 0.9);
    expect(rt.get<SliderInstance>(disabled as Element, "slider")?.value).toEqual([30]);
    expect(((disabled as HTMLElement).querySelector("input") as HTMLInputElement).disabled).toBe(
      true,
    );
    (volume as HTMLElement).dispatchEvent(new Event("input", { bubbles: true }));
    const input = (volume as HTMLElement).querySelector("input") as HTMLInputElement;
    input.value = "64";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(rt.get<SliderInstance>(volume as Element, "slider")?.value).toEqual([64]);
    expect(at(volume?.querySelector("[data-ok-slider-thumb]"))).toBe("64%");
  });

  it("vertical, inverted track; invalid min / max / step fall back", () => {
    const host = mount(
      snippet("vertical") +
        snippet("volume")
          .replace('data-ok-track="normal"', 'data-ok-track="inverted"')
          .replace(
            "<span data-ok-slider ",
            '<span data-ok-slider data-ok-min="x" data-ok-max="-1" data-ok-step="abc" ',
          ),
    );
    start();
    const roots = host.querySelectorAll<HTMLElement>("[data-ok-slider]");
    expect(roots[1]?.style.getPropertyValue("--_ok-slider-start")).toBe("20%");
    const inverted = roots[2] as HTMLElement;
    expect(inverted.style.getPropertyValue("--_ok-slider-start")).toBe("30%");
    expect(inverted.style.getPropertyValue("--_ok-slider-end")).toBe("100%");
  });

  it("an input without a value attribute starts from its value", () => {
    const host = mount(
      '<span data-ok-slider><span data-ok-slider-rail></span><span data-ok-slider-thumb><input type="range" aria-label="Plain"></span></span>',
    );
    const rt = start();
    expect(rt.get<SliderInstance>(host.querySelector("[data-ok-slider]"), "slider")?.value).toEqual(
      [50],
    );
  });

  it("cleans up on removal; React-owned sliders are left alone", async () => {
    const host = mount(
      snippet("volume").replace(
        "<span data-ok-slider ",
        '<span data-ok-slider data-ok-runtime="off" ',
      ),
    );
    start();
    const root = host.querySelector<HTMLElement>("[data-ok-slider]") as HTMLElement;
    expect(at(root.querySelector("[data-ok-slider-thumb]"))).toBe("");
    root.remove();
    await settle();
  });
});
