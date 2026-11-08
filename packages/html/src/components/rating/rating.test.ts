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
import type { RatingInstance } from "./rating.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) => snippets.find(([path]) => path.includes(name))?.[1] as string;

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
const icons = (host: Element) => [...host.querySelectorAll<HTMLElement>("[data-ok-rating-icon]")];
const filled = (host: Element) => icons(host).map((icon) => icon.hasAttribute("data-ok-filled"));

describe("rating snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(8));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll("[data-ok-rating]")) {
      if (root.hasAttribute("data-ok-read-only")) {
        expect(root.getAttribute("role")).toBe("img");
        expect(root.getAttribute("aria-label")).toBeTruthy();
        expect(root.querySelector("input")).toBeNull();
        continue;
      }
      const radios = [...root.querySelectorAll<HTMLInputElement>("input")];
      expect(radios.every((r) => r.type === "radio" && r.name === radios[0]?.name)).toBe(true);
      for (const radio of radios) {
        const label = root.querySelector(`label[for="${radio.id}"]`);
        expect(label?.textContent?.trim(), radio.id).toBeTruthy();
      }
      expect(radios.at(-1)?.value).toBe("");
    }
    for (const svg of host.querySelectorAll("svg"))
      expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("rating runtime", () => {
  it("click chooses, a second click clears; ok:rating:change reports it", async () => {
    const host = mount(snippet("controlled"));
    const rt = start();
    const root = host.querySelector("[data-ok-rating]") as HTMLElement;
    const seen: unknown[] = [];
    root.addEventListener("ok:rating:change", (e) => seen.push((e as CustomEvent).detail));
    expect(filled(host)).toEqual([true, true, false, false, false]);
    await userEvent.click(icons(host)[3] as HTMLElement);
    expect(seen).toEqual([{ value: 4, previous: 2 }]);
    await userEvent.click(icons(host)[3] as HTMLElement);
    expect(seen.at(-1)).toEqual({ value: null, previous: 4 });
    await userEvent.hover(document.body);
    expect(filled(host)).toEqual([false, false, false, false, false]);
    expect(rt.get<RatingInstance>(root, "rating")?.value).toBeNull();
  });

  it("hover previews and reports ok:rating:active", async () => {
    const host = mount(snippet("controlled"));
    start();
    const root = host.querySelector("[data-ok-rating]") as HTMLElement;
    const seen: unknown[] = [];
    root.addEventListener("ok:rating:active", (e) => seen.push((e as CustomEvent).detail.value));
    await userEvent.hover(icons(host)[4] as HTMLElement);
    expect(filled(host)).toEqual([true, true, true, true, true]);
    expect(icons(host)[4]?.hasAttribute("data-ok-hover")).toBe(true);
    await userEvent.hover(document.body);
    expect(seen).toEqual([5, null]);
    expect(filled(host)).toEqual([true, true, false, false, false]);
  });

  it("keyboard moves along the radios; Space doesn't clear", async () => {
    const host = mount(snippet("controlled"));
    const rt = start();
    const root = host.querySelector("[data-ok-rating]") as HTMLElement;
    (root.querySelector("input:checked") as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(rt.get<RatingInstance>(root, "rating")?.value).toBe(3);
    await userEvent.keyboard(" ");
    expect(rt.get<RatingInstance>(root, "rating")?.value).toBe(3);
  });

  it("change is cancelable; setValue; half precision and highlightSelectedOnly", async () => {
    const host = mount(snippet("half") + snippet("custom"));
    const rt = start();
    const [half, , , faces] = host.querySelectorAll<HTMLElement>(
      "[data-ok-rating]",
    ) as unknown as HTMLElement[];
    const instance = rt.get<RatingInstance>(half as Element, "rating") as RatingInstance;
    expect(instance.value).toBe(2.5);
    (half as HTMLElement).addEventListener("ok:rating:change", (e) => e.preventDefault(), {
      once: true,
    });
    await userEvent.click(icons(half as Element)[0] as HTMLElement);
    await userEvent.hover(document.body);
    expect(instance.value).toBe(2.5);
    expect(
      ((half as HTMLElement).querySelector('input[value="2.5"]') as HTMLInputElement).checked,
    ).toBe(true);
    instance.setValue(1);
    expect(filled(half as Element).slice(0, 3)).toEqual([true, true, false]);
    instance.setValue(null);
    expect(
      ((half as HTMLElement).querySelector('input[value=""]') as HTMLInputElement).checked,
    ).toBe(true);
    expect(filled(faces as Element)).toEqual([false, true, false, false, false]);
  });

  it("read-only ratings are left as they are; React-owned ones too", async () => {
    const host = mount(
      snippet("read-only") +
        snippet("controlled").replace("data-ok-rating ", 'data-ok-rating data-ok-runtime="off" '),
    );
    start();
    const readOnly = host.querySelector("[data-ok-read-only]") as HTMLElement;
    await userEvent.hover(icons(readOnly)[4] as HTMLElement);
    expect(filled(readOnly)).toEqual([true, true, false, false, false]);
    const owned = host.querySelectorAll("[data-ok-rating]")[1] as HTMLElement;
    await userEvent.hover(icons(owned)[4] as HTMLElement);
    expect(icons(owned)[4]?.hasAttribute("data-ok-filled")).toBe(false);
  });

  it("ignores events that aren't from its radios or icons, and repeated values", () => {
    const host = mount(snippet("controlled"));
    const rt = start();
    const root = host.querySelector("[data-ok-rating]") as HTMLElement;
    const seen: Event[] = [];
    root.addEventListener("ok:rating:change", (e) => seen.push(e));
    root.dispatchEvent(new Event("change", { bubbles: true }));
    root.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    root.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    (root.querySelector("input:checked") as HTMLInputElement).dispatchEvent(
      new Event("change", { bubbles: true }),
    );
    expect(seen).toHaveLength(0);
    expect(rt.get<RatingInstance>(root, "rating")?.value).toBe(2);
  });

  it("hostile values in markup don't break it", () => {
    const host = mount(
      snippet("controlled").replace(
        'value="3"',
        'value="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"',
      ),
    );
    start();
    expect(host.querySelector("img")).toBeNull();
    expect(filled(host)).toEqual([true, true, false, false, false]);
  });
});
