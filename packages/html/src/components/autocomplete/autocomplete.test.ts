import { afterEach, describe, expect, it } from "vitest";
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
import type { AutocompleteInstance } from "./autocomplete.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  snippets.find(([path]) => path.endsWith(`/${name}.html`))?.[1] as string;

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
const combo = (host: Element, name: string) =>
  host.querySelector(`[role="combobox"][id="${name}"]`) as HTMLInputElement;
const visible = (host: Element, id: string) =>
  [...host.ownerDocument.querySelectorAll(`#${id}-listbox [role="option"]:not([hidden])`)].map(
    (o) => o.textContent?.trim(),
  );
const instance = (rt: Runtime, host: Element, id: string) =>
  rt.get<AutocompleteInstance>(
    combo(host, id).closest("[data-ok-autocomplete]"),
    "autocomplete",
  ) as AutocompleteInstance;

describe("autocomplete snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(9));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const root of host.querySelectorAll("[data-ok-autocomplete]")) {
      const input = root.querySelector('[role="combobox"]') as HTMLInputElement;
      expect(input.getAttribute("aria-autocomplete")).toBe("list");
      const listbox = host.querySelector(`#${input.getAttribute("aria-controls")}`) as HTMLElement;
      expect(listbox.getAttribute("role")).toBe("listbox");
      expect(listbox.closest("[data-ok-popover]")?.hasAttribute("data-ok-disable-auto-focus")).toBe(
        true,
      );
      if (root.hasAttribute("data-ok-multiple"))
        expect(root.querySelector("template[data-ok-autocomplete-tag]")).not.toBeNull();
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

describe("autocomplete runtime", () => {
  it("typing filters and opens; keys highlight; Enter picks; events report it", async () => {
    const host = mount(snippet("playground-combo"));
    const rt = start();
    const input = combo(host, "ac-combo");
    const root = input.closest("[data-ok-autocomplete]") as HTMLElement;
    const seen: unknown[] = [];
    root.addEventListener("ok:autocomplete:change", (e) => seen.push((e as CustomEvent).detail));
    const opened: unknown[] = [];
    root.addEventListener("ok:autocomplete:open", (e) => opened.push((e as CustomEvent).detail));
    await userEvent.click(input);
    await userEvent.keyboard("ap");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(visible(host, "ac-combo")).toEqual(["Apple", "Apricot", "Grape"]);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(seen).toEqual([{ value: "Apricot" }]);
    expect(input.value).toBe("Apricot");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(opened.length).toBeGreaterThan(0);
    expect(instance(rt, host, "ac-combo").value).toBe("Apricot");
    // The clear button empties the field.
    const clear = root.querySelector("[data-ok-autocomplete-clear]") as HTMLElement;
    expect(clear.hidden).toBe(false);
    clear.click();
    expect(instance(rt, host, "ac-combo").value).toBeNull();
    expect(clear.hidden).toBe(true);
  });

  it("clicks: the toggle opens, an option picks, Escape closes, blur restores the label", async () => {
    const host = mount(`${snippet("playground-controllable")}<button type="button">After</button>`);
    const rt = start();
    const input = combo(host, "ac-controllable");
    const root = input.closest("[data-ok-autocomplete]") as HTMLElement;
    const toggle = root.querySelector("[data-ok-autocomplete-toggle]") as HTMLElement;
    toggle.click();
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Close");
    (host.querySelector("#ac-controllable-option-1") as HTMLElement).click();
    expect(instance(rt, host, "ac-controllable").value).toBe("Option 2");
    input.focus();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Escape}");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    await userEvent.keyboard("xyz");
    expect(
      host
        .querySelector("#ac-controllable-listbox ~ [data-ok-autocomplete-no-options]")
        ?.hasAttribute("hidden"),
    ).toBe(false);
    await userEvent.tab();
    expect(input.value).toBe("Option 2");
  });

  it("multiple: chips from the template, delete and Backspace remove; limitTags", async () => {
    const host = mount(`<input aria-label="before">${snippet("playground-multiple")}`);
    const rt = start();
    const input = combo(host, "ac-multiple");
    const root = input.closest("[data-ok-autocomplete]") as HTMLElement;
    const chips = () => [...root.querySelectorAll<HTMLElement>("[data-ok-chip][data-ok-value]")];
    expect(chips().filter((c) => !c.hidden)).toHaveLength(3);
    expect(root.querySelector("[data-ok-autocomplete-more]")?.textContent).toBe("+2");
    await userEvent.click(input);
    expect(chips().filter((c) => !c.hidden)).toHaveLength(5);
    expect(root.querySelector("[data-ok-autocomplete-more]")).toBeNull();
    await userEvent.keyboard("{ArrowDown}");
    (host.querySelector('#ac-multiple-listbox [data-ok-value="Kiwi"]') as HTMLElement).click();
    expect(instance(rt, host, "ac-multiple").value).toContain("Kiwi");
    expect(chips().at(-1)?.querySelector("[data-ok-chip-label]")?.textContent).toBe("Kiwi");
    await userEvent.keyboard("{Backspace}");
    expect(instance(rt, host, "ac-multiple").value).not.toContain("Kiwi");
    await userEvent.click(root.querySelector('[aria-label="Remove Apple"]') as HTMLElement);
    expect(instance(rt, host, "ac-multiple").value).not.toContain("Apple");
    await userEvent.click(host.querySelector('[aria-label="before"]') as HTMLElement);
    expect(chips().filter((c) => !c.hidden)).toHaveLength(3);
  });

  it("checkboxes stay open and mirror the selection", async () => {
    const host = mount(snippet("playground-checkboxes"));
    const rt = start();
    const input = combo(host, "ac-checkboxes");
    await userEvent.click(input);
    const banana = host.querySelector(
      '#ac-checkboxes-listbox [data-ok-value="Banana"]',
    ) as HTMLElement;
    banana.click();
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect((banana.querySelector("input") as HTMLInputElement).checked).toBe(true);
    expect(instance(rt, host, "ac-checkboxes").value).toEqual(["Apple", "Banana"]);
  });

  it("free solo: Enter commits text; change is cancelable; instance API", async () => {
    const host = mount(snippet("playground-free-solo"));
    const rt = start();
    const input = combo(host, "ac-free");
    const root = input.closest("[data-ok-autocomplete]") as HTMLElement;
    input.focus();
    await userEvent.keyboard("Kiwi{Enter}");
    const api = instance(rt, host, "ac-free");
    expect(api.value).toBe("Kiwi");
    root.addEventListener("ok:autocomplete:change", (e) => e.preventDefault(), { once: true });
    await userEvent.keyboard("{Control>}a{/Control}Lime{Enter}");
    expect(api.value).toBe("Kiwi");
    api.setValue("Pear");
    expect(input.value).toBe("Pear");
    api.open();
    expect(api.isOpen).toBe(true);
    api.close();
    expect(api.isOpen).toBe(false);
    api.setValue(null);
    expect(input.value).toBe("");
  });

  it("chips appear and disappear with the values; unknown values show as text; no template, no chips", () => {
    const host = mount(
      snippet("playground-checkboxes") +
        snippet("playground-sizes").replace(
          /<template data-ok-autocomplete-tag>[\s\S]*?<\/template>/,
          "",
        ),
    );
    const rt = start();
    const api = instance(rt, host, "ac-checkboxes");
    const control = combo(host, "ac-checkboxes").parentElement as HTMLElement;
    api.setValue([]);
    expect(control.querySelector('[data-ok-text-field-adornment="start"]')).toBeNull();
    api.setValue(["Zucchini"]);
    expect(control.querySelector("[data-ok-chip-label]")?.textContent).toBe("Zucchini");
    const small = instance(rt, host, "ac-small");
    small.setValue(["Kiwi"]);
    expect(small.value).toEqual(["Kiwi"]);
  });

  it("openOnFocus and autoHighlight; blur without a value empties the text", async () => {
    const host = mount(
      `${snippet("playground-combo").replace("<div data-ok-autocomplete>", "<div data-ok-autocomplete data-ok-open-on-focus data-ok-auto-highlight>")}<button type="button">After</button>`,
    );
    start();
    const input = combo(host, "ac-combo");
    input.focus();
    expect(input.getAttribute("aria-expanded")).toBe("true");
    await userEvent.keyboard("b");
    expect(input.getAttribute("aria-activedescendant")).toBe("ac-combo-option-2");
    await userEvent.keyboard("x");
    await userEvent.tab();
    expect(input.value).toBe("");
  });

  it("free solo multiple: Enter adds chips once; a refused commit keeps the text", async () => {
    const host = mount(
      snippet("playground-multiple").replace(
        "<div data-ok-autocomplete ",
        "<div data-ok-autocomplete data-ok-free-solo ",
      ),
    );
    const rt = start();
    const input = combo(host, "ac-multiple");
    const root = input.closest("[data-ok-autocomplete]") as HTMLElement;
    input.focus();
    await userEvent.keyboard("Fig{Enter}");
    expect(instance(rt, host, "ac-multiple").value).toContain("Fig");
    expect(input.value).toBe("");
    const before = instance(rt, host, "ac-multiple").value;
    await userEvent.keyboard("Fig{Enter}");
    expect(instance(rt, host, "ac-multiple").value).toEqual(before);
    root.addEventListener("ok:autocomplete:change", (e) => e.preventDefault(), { once: true });
    await userEvent.keyboard("Lime{Enter}");
    expect(input.value).toBe("Lime");
    expect(instance(rt, host, "ac-multiple").value).not.toContain("Lime");
  });

  it("a refused pick keeps the value", async () => {
    const host = mount(snippet("playground-combo"));
    const rt = start();
    const input = combo(host, "ac-combo");
    input
      .closest("[data-ok-autocomplete]")
      ?.addEventListener("ok:autocomplete:change", (e) => e.preventDefault());
    input.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(instance(rt, host, "ac-combo").value).toBeNull();
  });

  it("a free solo field starts from the typed text", () => {
    const host = mount(
      snippet("playground-free-solo").replace('id="ac-free" ', 'id="ac-free" value="Fig" '),
    );
    const rt = start();
    expect(instance(rt, host, "ac-free").value).toBe("Fig");
  });

  it("an outside press closes the list (popover)", async () => {
    const host = mount(`${snippet("playground-combo")}<p>Outside</p>`);
    start();
    const input = combo(host, "ac-combo");
    await userEvent.click(input);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("the paper takes the field's width; React-owned roots are left alone", async () => {
    const host = mount(
      snippet("playground-combo") +
        snippet("country-variants").replace(
          "data-ok-autocomplete ",
          'data-ok-autocomplete data-ok-runtime="off" ',
        ),
    );
    start();
    await userEvent.click(combo(host, "ac-combo"));
    const paper = host
      .querySelector("#ac-combo-listbox")
      ?.closest("[data-ok-popover]") as HTMLElement;
    expect(paper.style.getPropertyValue("--_ok-autocomplete-width")).toMatch(/px$/);
  });
});
