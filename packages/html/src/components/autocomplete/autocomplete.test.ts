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
  it("covers every story group", () => expect(snippets).toHaveLength(13));

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

const withRoot = (html: string, attrs: string) =>
  html.replace("<div data-ok-autocomplete", `<div data-ok-autocomplete ${attrs}`);

describe("autocomplete runtime (phase 4)", () => {
  it("readOnly: no list, no clear, no chip removal; switching it off works again", async () => {
    const host = mount(withRoot(snippet("playground-multiple"), "data-ok-read-only"));
    const rt = start();
    const input = combo(host, "ac-multiple");
    const root = input.closest("[data-ok-autocomplete]") as HTMLElement;
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}x{Backspace}");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(instance(rt, host, "ac-multiple").value).toHaveLength(5);
    expect(root.querySelector("[data-ok-chip-delete]")).toBeNull();
    expect((root.querySelector("[data-ok-autocomplete-toggle]") as HTMLElement).hidden).toBe(true);
    expect((root.querySelector("[data-ok-autocomplete-clear]") as HTMLElement).hidden).toBe(true);
    root.removeAttribute("data-ok-read-only");
    await settle();
    expect(root.querySelector('[aria-label="Remove Apple"]')).not.toBeNull();
    await userEvent.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    root.setAttribute("data-ok-read-only", "");
    await settle();
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("highlight events; autoComplete completes inline; Backspace drops the completion", async () => {
    const host = mount(
      withRoot(snippet("playground-combo"), "data-ok-auto-complete data-ok-auto-highlight"),
    );
    start();
    const input = combo(host, "ac-combo");
    const root = input.closest("[data-ok-autocomplete]") as HTMLElement;
    const seen: unknown[] = [];
    root.addEventListener("ok:autocomplete:highlight", (e) => seen.push((e as CustomEvent).detail));
    expect(input.getAttribute("aria-autocomplete")).toBe("both");
    await userEvent.click(input);
    await userEvent.keyboard("ba");
    expect(input.value).toBe("Banana");
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 6]);
    expect(seen[0]).toEqual({ value: "Banana", reason: "auto" });
    await userEvent.keyboard("{Backspace}");
    expect(input.value).toBe("Ba");
    await userEvent.keyboard("{ArrowDown}");
    expect(input.value).toBe("Banana");
    await userEvent.keyboard("{Escape}");
    expect(input.value).toBe("Ba");
  });

  it("autoSelect picks on blur; clearOnBlur off keeps the text; free solo autoSelect commits", async () => {
    const host = mount(
      `${withRoot(snippet("playground-combo"), "data-ok-auto-select")}${withRoot(
        snippet("playground-controllable"),
        'data-ok-clear-on-blur="false"',
      )}${withRoot(snippet("playground-free-solo"), "data-ok-auto-select")}<button type="button" id="after">After</button>`,
    );
    const rt = start();
    const input = combo(host, "ac-combo");
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    (host.querySelector("#after") as HTMLElement).focus();
    expect(instance(rt, host, "ac-combo").value).toBe("Apricot");
    const keep = combo(host, "ac-controllable");
    await userEvent.click(keep);
    await userEvent.keyboard("{Control>}a{/Control}zz");
    (host.querySelector("#after") as HTMLElement).focus();
    expect(keep.value).toBe("zz");
    const free = combo(host, "ac-free");
    free.focus();
    await userEvent.keyboard("Fig");
    (host.querySelector("#after") as HTMLElement).focus();
    expect(instance(rt, host, "ac-free").value).toBe("Fig");
  });

  it("blurOnSelect, clearOnEscape, filterSelectedOptions, Home / End off", async () => {
    const host = mount(
      withRoot(
        snippet("playground-controllable"),
        'data-ok-blur-on-select="true" data-ok-clear-on-escape data-ok-filter-selected-options data-ok-handle-home-end-keys="false" data-ok-disable-list-wrap',
      ),
    );
    const rt = start();
    const input = combo(host, "ac-controllable");
    await userEvent.click(input);
    expect(visible(host, "ac-controllable")).toEqual(["Option 2"]);
    await userEvent.keyboard("{ArrowDown}{End}");
    expect(input.getAttribute("aria-activedescendant")).toBe("ac-controllable-option-1");
    await userEvent.keyboard("{Enter}");
    expect(instance(rt, host, "ac-controllable").value).toBe("Option 2");
    expect(document.activeElement).not.toBe(input);
    input.focus();
    await userEvent.keyboard("{Escape}");
    expect(instance(rt, host, "ac-controllable").value).toBeNull();
    expect(input.value).toBe("");
  });

  it("includeInputInList, disabledItemsFocusable and resetHighlightOnMouseLeave", async () => {
    const host = mount(
      `${withRoot(
        snippet("country-label"),
        "data-ok-include-input-in-list data-ok-reset-highlight-on-mouse-leave",
      )}<p>Away</p>`,
    );
    start();
    const input = host.querySelector('[role="combobox"]') as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowUp}");
    expect(input.hasAttribute("aria-activedescendant")).toBe(true);
    await userEvent.keyboard("{ArrowDown}");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    const option = host.ownerDocument.querySelector(
      `#${input.getAttribute("aria-controls")} [role="option"]`,
    ) as HTMLElement;
    option.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    expect(input.getAttribute("aria-activedescendant")).toBe(option.id);
    option.dispatchEvent(
      new PointerEvent("pointerout", {
        bubbles: true,
        relatedTarget: host.querySelector("p"),
      }),
    );
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("grouped: headings hide with their options; setOptions builds groups", async () => {
    const host = mount(snippet("grouped-categories"));
    const rt = start();
    const input = combo(host, "ac-grouped");
    const headings = () =>
      [...host.querySelectorAll<HTMLElement>("[data-ok-list-subheader]")]
        .filter((h) => !h.hidden)
        .map((h) => h.textContent);
    await userEvent.click(input);
    await userEvent.keyboard("ch");
    expect(headings()).toEqual(["C", "P"]);
    instance(rt, host, "ac-grouped").setOptions([
      { value: "a", label: "Ant", group: "Insects" },
      { value: "b", label: "Bee", group: "Insects", disabled: true },
      { value: "c", label: "Cat", group: "Pets" },
    ]);
    expect(headings()).toEqual([]);
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    expect(headings()).toEqual(["Insects", "Pets"]);
    expect(host.querySelector("#ac-grouped-option-1")?.getAttribute("aria-disabled")).toBe("true");
    expect(host.querySelector("#ac-grouped-option-2")?.getAttribute("data-ok-value")).toBe("c");
  });

  it("loading: the loading text while there are no options, then the loaded options", async () => {
    const host = mount(snippet("async-load-on-open"));
    const rt = start();
    const input = combo(host, "ac-async");
    const root = input.closest("[data-ok-autocomplete]") as HTMLElement;
    const loading = root.querySelector("[data-ok-autocomplete-loading]") as HTMLElement;
    const none = root.querySelector("[data-ok-autocomplete-no-options]") as HTMLElement;
    root.setAttribute("data-ok-loading", "");
    await settle();
    expect(loading.hidden).toBe(false);
    expect(none.hidden).toBe(true);
    instance(rt, host, "ac-async").setOptions(["Alien", "Heat"]);
    root.removeAttribute("data-ok-loading");
    await settle();
    expect(loading.hidden).toBe(true);
    await userEvent.click(input);
    expect(visible(host, "ac-async")).toEqual(["Alien", "Heat"]);
  });

  it("single value drawn as a chip: the input stays empty; Backspace removes it", async () => {
    const host = mount(snippet("single-chip"));
    const rt = start();
    const input = combo(host, "ac-single-chip");
    expect(input.value).toBe("");
    expect(instance(rt, host, "ac-single-chip").value).toBe("Mango");
    await userEvent.click(input);
    (host.querySelector('#ac-single-chip-listbox [data-ok-value="Kiwi"]') as HTMLElement).click();
    expect(input.value).toBe("");
    const chip = host.querySelector("[data-ok-chip][data-ok-value]") as HTMLElement;
    expect(chip.getAttribute("data-ok-value")).toBe("Kiwi");
    expect(chip.querySelector("[data-ok-chip-label]")?.textContent).toBe("Kiwi");
    input.focus();
    await userEvent.keyboard("{Backspace}");
    expect(instance(rt, host, "ac-single-chip").value).toBeNull();
  });

  it("virtualize: options in memory, the window drawn, scrolling and keys move it", async () => {
    const host = mount(snippet("virtualization-list"));
    const rt = start();
    const input = combo(host, "ac-virtual");
    const listbox = host.querySelector("#ac-virtual-listbox") as HTMLElement;
    instance(rt, host, "ac-virtual").setOptions(
      Array.from({ length: 500 }, (_, i) => ({ value: `v${i}`, label: `Item ${i}`, group: "x" })),
    );
    expect(listbox.children).toHaveLength(0);
    await userEvent.click(input);
    const count = listbox.querySelectorAll('[role="option"]').length;
    expect(count).toBeGreaterThan(5);
    expect(count).toBeLessThan(30);
    expect(listbox.querySelector("[data-ok-list-subheader]")).toBeNull();
    expect(listbox.firstElementChild?.getAttribute("aria-setsize")).toBe("500");
    await userEvent.keyboard("{End}");
    expect(host.querySelector("#ac-virtual-option-499")).not.toBeNull();
    listbox.scrollTop = 0;
    listbox.dispatchEvent(new Event("scroll"));
    expect(host.querySelector("#ac-virtual-option-0")).not.toBeNull();
    (host.querySelector("#ac-virtual-option-1") as HTMLElement).click();
    expect(input.value).toBe("Item 1");
    expect(listbox.children).toHaveLength(0);
    await userEvent.click(input);
    await userEvent.keyboard("{Control>}a{/Control}Item 49");
    expect(listbox.querySelectorAll('[role="option"]').length).toBe(11);
  });

  it("virtualize with options in the markup", async () => {
    const host = mount(withRoot(snippet("playground-combo"), "data-ok-virtualize"));
    start();
    const listbox = host.querySelector("#ac-combo-listbox") as HTMLElement;
    expect(listbox.children).toHaveLength(0);
    await userEvent.click(combo(host, "ac-combo"));
    expect(listbox.querySelectorAll('[role="option"]')).toHaveLength(12);
    const grouped = mount(withRoot(snippet("grouped-categories"), "data-ok-virtualize"));
    start();
    expect(grouped.querySelector("[data-ok-list-subheader]")).toBeNull();
  });
});
