import {
  autocompleteOptions,
  createComboboxController,
  defaultLimitTagsText,
  filterOptions,
  nextAutocompleteValue,
  readNumber,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import type { PopoverInstance } from "../popover/popover.js";

export interface AutocompleteInstance extends ComponentInstance {
  /** Option value(s) or typed text: `string | null`, or `string[]` with `data-ok-multiple`. */
  readonly value: string | string[] | null;
  /** Sets the value without emitting events. */
  setValue(value: string | readonly string[] | null): void;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
}

const { multiple, freeSolo, disableCloseOnSelect, openOnFocus, autoHighlight, limitTags } =
  autocompleteOptions.options;

/**
 * Autocomplete — spec: specs/components/autocomplete.md
 *
 * Markup:  <div data-ok-autocomplete [data-ok-multiple]>
 *            <div data-ok-text-field …><label …>Movie</label><div data-ok-text-field-control>
 *              <input id="m" data-ok-text-field-input role="combobox" aria-autocomplete="list"
 *                     aria-expanded="false" aria-controls="m-listbox" autocomplete="off" placeholder=" ">
 *              <span data-ok-text-field-adornment="end">…clear and toggle icon buttons…</span> …
 *            <template data-ok-autocomplete-tag>…a small Chip with a delete button…</template>  (multiple)
 *            <div data-ok-popover data-ok-autocomplete-paper popover="manual" data-ok-disable-auto-focus …>
 *              <ul role="listbox" id="m-listbox"><li role="option" id="m-option-0" data-ok-value="a" aria-selected="false">A</li>…</ul>
 *              <div data-ok-autocomplete-no-options hidden>No options</div>
 *            </div>
 *          </div>
 * Behavior: typing filters the options (others get `hidden`) and opens the list; core
 *          `createComboboxController` handles keys, clicks and blur; the list is the Popover runtime
 *          anchored to the field. Multiple values are chips cloned from the template; deleting a
 *          chip removes its value.
 * Events:  ok:autocomplete:change (cancelable, `{ value }`), ok:autocomplete:open / close (`{ reason }`).
 */
export const autocomplete = defineComponent<AutocompleteInstance>({
  name: "autocomplete",
  selector: "[data-ok-autocomplete]",

  setup(element, { emit, signal, runtime }) {
    const input = element.querySelector<HTMLInputElement>('[role="combobox"]') as HTMLInputElement;
    const doc = element.getRootNode() as Document | ShadowRoot;
    const listbox = doc.getElementById(input.getAttribute("aria-controls") ?? "") as HTMLElement;
    const paper = listbox.closest<HTMLElement>("[data-ok-popover]") as HTMLElement;
    const control = input.closest<HTMLElement>("[data-ok-text-field-control]") as HTMLElement;
    const noOptions = paper.querySelector<HTMLElement>(
      "[data-ok-autocomplete-no-options]",
    ) as HTMLElement;
    const clear = element.querySelector<HTMLElement>("[data-ok-autocomplete-clear]");
    const toggle = element.querySelector<HTMLElement>("[data-ok-autocomplete-toggle]");
    const template = element.querySelector<HTMLTemplateElement>(
      "template[data-ok-autocomplete-tag]",
    );
    const is = (spec: { attr: string }) => element.hasAttribute(spec.attr);

    const options = () => [...listbox.querySelectorAll<HTMLElement>('[role="option"]')];
    const optionValue = (option: Element) => option.getAttribute("data-ok-value") as string;
    const labelOf = (v: string) =>
      (
        options().find((option) => optionValue(option) === v)?.textContent as string | undefined
      )?.trim() ?? v;
    const tagValues = () =>
      [...control.querySelectorAll("[data-ok-chip][data-ok-value]")].map(optionValue);

    let values = is(multiple)
      ? tagValues()
      : options()
          .filter((option) => option.getAttribute("aria-selected") === "true")
          .map(optionValue)
          .slice(0, 1);
    if (!is(multiple) && values.length === 0 && is(freeSolo) && input.value) values = [input.value];
    let open = false;
    let highlighted = -1;
    let dirty = false;
    let focused = false;
    const visible = () => options().filter((option) => !option.hidden);
    const popover = () => runtime.getOrCreate<PopoverInstance>(paper, "popover") as PopoverInstance;

    // Removing a chip that holds focus fires focusout, which renders again: skip that re-entry.
    let rendering = false;
    const renderTags = () => {
      // Without a chip template (markup error), chips can't be drawn.
      if (!is(multiple) || !template || rendering) return;
      rendering = true;
      try {
        drawTags();
      } finally {
        rendering = false;
      }
    };
    const drawTags = () => {
      for (const chip of control.querySelectorAll("[data-ok-chip][data-ok-value]")) chip.remove();
      control.querySelector("[data-ok-autocomplete-more]")?.remove();
      let start = control.querySelector<HTMLElement>('[data-ok-text-field-adornment="start"]');
      if (values.length === 0) {
        start?.remove();
        return;
      }
      if (!start) {
        start = document.createElement("span");
        start.setAttribute("data-ok-text-field-adornment", "start");
        control.insertBefore(start, input);
      }
      const limit = readNumber(element, limitTags);
      const hidden = !focused && typeof limit === "number" ? Math.max(values.length - limit, 0) : 0;
      const holder = start;
      values.forEach((v, index) => {
        // The template holds a small soft Chip with its label and delete button.
        const chip = (template as HTMLTemplateElement).content.firstElementChild?.cloneNode(
          true,
        ) as HTMLElement;
        chip.setAttribute("data-ok-value", v);
        (chip.querySelector("[data-ok-chip-label]") as Element).textContent = labelOf(v);
        (chip.querySelector("[data-ok-chip-delete]") as Element).setAttribute(
          "aria-label",
          `Remove ${labelOf(v)}`,
        );
        chip.hidden = index >= values.length - hidden;
        holder.append(chip);
      });
      if (hidden > 0) {
        const more = document.createElement("span");
        more.setAttribute("data-ok-autocomplete-more", "");
        more.textContent = defaultLimitTagsText(hidden);
        start.append(more);
      }
    };

    const apply = () => {
      const query = dirty ? input.value : "";
      const matching = new Set(
        filterOptions(
          options().map((o) => ({ o, label: o.textContent as string })),
          query,
        ).map((m) => m.o),
      );
      for (const option of options()) {
        option.hidden = !matching.has(option);
        const selected = values.includes(optionValue(option));
        option.setAttribute("aria-selected", String(selected));
        const box = option.querySelector<HTMLInputElement>('input[type="checkbox"]');
        if (box) box.checked = selected;
      }
      noOptions.hidden = visible().length > 0;
      const active = open && highlighted >= 0 ? visible()[highlighted] : undefined;
      for (const option of options()) option.toggleAttribute("data-ok-focused", option === active);
      if (active) {
        input.setAttribute("aria-activedescendant", active.id);
        active.scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
      input.setAttribute("aria-expanded", String(open));
      element.toggleAttribute("data-ok-open", open);
      if (toggle)
        toggle.setAttribute(
          "aria-label",
          toggle.getAttribute(open ? "data-ok-label-close" : "data-ok-label-open") as string,
        );
      if (clear) clear.hidden = values.length === 0 && input.value === "";
    };

    const setOpen = (next: boolean, reason: string) => {
      if (next === open) return;
      open = next;
      if (!next) highlighted = -1;
      if (next) {
        paper.style.setProperty("--_ok-autocomplete-width", `${control.offsetWidth}px`);
        popover().open(control);
      } else if (popover().isOpen) popover().close();
      apply();
      emit(next ? "open" : "close", { reason });
    };

    const commit = (next: string[]) => {
      const value = is(multiple) ? next : (next[0] ?? null);
      if (!emit("change", { value }, { cancelable: true })) return false;
      values = next;
      renderTags();
      apply();
      return true;
    };

    const controller = createComboboxController(element, {
      read: () => ({
        open,
        highlighted,
        count: visible().length,
        disabledAt: (i) => visible()[i]?.getAttribute("aria-disabled") === "true",
        freeSolo: is(freeSolo),
        canRemoveLast: is(multiple) && values.length > 0,
        homeEndKeys: !is(freeSolo),
      }),
      onOpenChange: (next, reason) => setOpen(next, reason),
      onHighlight: (index) => {
        highlighted = index;
        apply();
      },
      onSelect: (index) => {
        // The controller only reports indexes of visible options.
        const v = optionValue(visible()[index] as HTMLElement);
        if (!commit(nextAutocompleteValue(values, v, is(multiple)))) return;
        dirty = false;
        input.value = is(multiple) ? "" : labelOf(v);
        if (!(is(multiple) && is(disableCloseOnSelect))) setOpen(false, "select");
        else apply();
      },
      onCommitText: (text) => {
        const next = is(multiple) ? (values.includes(text) ? values : [...values, text]) : [text];
        if (!commit(next)) return;
        dirty = false;
        if (is(multiple)) input.value = "";
        setOpen(false, "select");
      },
      onClear: () => {
        input.value = "";
        dirty = false;
        commit([]);
      },
      onRemoveLast: () => {
        commit(values.slice(0, -1));
      },
      onBlur: () => {
        setOpen(false, "blur");
        if (!is(freeSolo)) {
          input.value = is(multiple) || values[0] === undefined ? "" : labelOf(values[0]);
          dirty = false;
          apply();
        }
      },
    });

    input.addEventListener(
      "input",
      () => {
        dirty = true;
        highlighted = is(autoHighlight) ? 0 : -1;
        if (!open) setOpen(true, "input");
        else apply();
      },
      { signal },
    );
    input.addEventListener(
      "focus",
      () => {
        if (is(openOnFocus)) setOpen(true, "focus");
      },
      { signal },
    );
    element.addEventListener(
      "focusin",
      () => {
        if (focused) return;
        focused = true;
        renderTags();
      },
      { signal },
    );
    element.addEventListener(
      "focusout",
      (event) => {
        if (element.contains(event.relatedTarget as Node | null)) return;
        focused = false;
        renderTags();
      },
      { signal },
    );
    // A chip's delete button (chip runtime) removes its value.
    element.addEventListener(
      "ok:chip:delete",
      (event) => {
        // Only the field's chips (cloned from the template) carry a value.
        const chip = (event.target as Element).closest("[data-ok-chip][data-ok-value]") as Element;
        event.preventDefault();
        commit(values.filter((v) => v !== optionValue(chip)));
        input.focus();
      },
      { signal },
    );
    // The popover closes itself on an outside press or Escape.
    paper.addEventListener(
      "ok:popover:close",
      (event) => {
        if (open) setOpen(false, (event as CustomEvent<{ reason: string }>).detail.reason);
      },
      { signal },
    );

    apply();
    return {
      get value() {
        return is(multiple) ? [...values] : (values[0] ?? null);
      },
      setValue(value) {
        values = value == null ? [] : typeof value === "string" ? [value] : [...value];
        if (!is(multiple)) input.value = values[0] === undefined ? "" : labelOf(values[0]);
        renderTags();
        apply();
      },
      get isOpen() {
        return open;
      },
      open() {
        setOpen(true, "api");
      },
      close() {
        setOpen(false, "api");
      },
      destroy() {
        controller.destroy();
      },
    };
  },
});
