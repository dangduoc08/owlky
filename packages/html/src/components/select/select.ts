import {
  createSelectController,
  initialSelectOption,
  nextSelectValue,
  type SelectCloseReason,
  selectOptionValue,
  serializeSelectValue,
  syncSelectPaperWidth,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import type { PopoverCloseReason, PopoverInstance } from "../popover/popover.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface SelectEvents {
  /** Before the value changes (`string[]` with `data-ok-multiple`). Call `preventDefault()` to keep the current one. */
  change: EventSpec<{ value: string | string[] }, true>;
  /** After the listbox opened. */
  open: EventSpec;
  /** After the listbox closed, with what closed it. */
  close: EventSpec<{ reason: SelectCloseReason | "api" }>;
}

export interface SelectInstance extends ComponentInstance {
  /** The value: a string (`""` = none), or a list with `data-ok-multiple`. */
  readonly value: string | string[];
  /** Sets the value without emitting events. */
  setValue(value: string | readonly string[]): void;
  /** Whether the listbox is open. */
  readonly isOpen: boolean;
  /** Opens the listbox. Returns `false` if `ok:popover:beforeopen` was prevented. */
  open(): boolean;
  /** Closes the listbox. Returns `false` if `ok:popover:beforeclose` was prevented. */
  close(): boolean;
}

const OPTION = '[role="option"]';

/** Popover close reasons ↔ select close reasons ("toggle" is a press on the trigger). */
const toPopover = (reason: SelectCloseReason): PopoverCloseReason =>
  reason === "toggle" ? "trigger" : reason;
const fromPopover = (reason: PopoverCloseReason): SelectCloseReason | "api" =>
  reason === "trigger" ? "toggle" : reason;

/**
 * Select — spec: specs/components/select.md (ADR-0045)
 *
 * Markup:  <div data-ok-select data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default">
 *            <div data-ok-select-display role="combobox" tabindex="0" id="age" aria-haspopup="listbox"
 *                 aria-expanded="false" aria-controls="age-listbox" aria-labelledby="age-label">Ten</div>
 *            <input data-ok-select-input aria-hidden="true" tabindex="-1" name="age" value="10" placeholder=" ">
 *            <svg data-ok-select-icon aria-hidden="true" viewBox="0 0 24 24">…</svg>
 *            <fieldset data-ok-select-outline aria-hidden="true"><legend><span>Age</span></legend></fieldset>
 *            <div data-ok-popover data-ok-paper popover="manual" id="age-menu" data-ok-placement="bottom-start" tabindex="-1">
 *              <span data-ok-popover-arrow aria-hidden="true"></span>
 *              <ul data-ok-select-listbox role="listbox" id="age-listbox" aria-labelledby="age-label">
 *                <li data-ok-menu-item role="option" tabindex="-1" aria-selected="true" data-ok-selected data-ok-value="10">Ten</li> …
 *          </div>
 *          Also TextField's control (`[data-ok-text-field-control][data-ok-select]`) around the same parts.
 *          `<template data-ok-select-chip>` (a Chip) shows multiple values as chips;
 *          `<template data-ok-select-placeholder>` what an empty value shows with data-ok-display-empty.
 * Behavior: core `createSelectController` (keys, clicks); the list is the Popover runtime anchored
 *          to the trigger. Picking writes `aria-selected` / `data-ok-selected`, the hidden input
 *          and the trigger's content (the option's content, the values' texts or chips).
 * Trigger: a button with `data-ok-select-open="<trigger id>"` opens the select.
 * Events:  ok:select:change (cancelable, `{ value }`), ok:select:open, ok:select:close (`{ reason }`).
 * A native select (`select[data-ok-select-native]`) needs no runtime.
 */
export const select = defineComponent<SelectInstance, SelectEvents>({
  name: "select",
  selector: "[data-ok-select]",

  setup(element, { emit, runtime, signal }) {
    const native = element.querySelector<HTMLSelectElement>(":scope > select");
    const trigger = element.querySelector<HTMLElement>(":scope > [data-ok-select-display]");
    const paper = element.querySelector<HTMLElement>(":scope > [data-ok-popover]");
    const listbox = paper?.querySelector<HTMLElement>("[data-ok-select-listbox]") ?? null;
    const input = element.querySelector<HTMLInputElement>(":scope > [data-ok-select-input]");
    // A native select (or incomplete markup) has no listbox behavior: the instance reads the select.
    if (native || !trigger || !paper || !listbox || !input) {
      const read = () =>
        native?.multiple ? [...native.selectedOptions].map((o) => o.value) : (native?.value ?? "");
      return {
        get value() {
          return read();
        },
        setValue(next) {
          if (!native) return;
          const wanted = (Array.isArray(next) ? next : [next]).map(String);
          for (const option of native.options) option.selected = wanted.includes(option.value);
        },
        isOpen: false,
        open: () => false,
        close: () => true,
      };
    }
    const template = (name: string) =>
      element.querySelector<HTMLTemplateElement>(`:scope > template[data-ok-select-${name}]`);
    const multiple = () => element.hasAttribute("data-ok-multiple");
    const options = () => [...listbox.querySelectorAll<HTMLElement>(OPTION)];
    const popover = () => runtime.getOrCreate<PopoverInstance>(paper, "popover") as PopoverInstance;

    let values = options()
      .filter((option) => option.getAttribute("aria-selected") === "true")
      .map(selectOptionValue);
    if (!multiple()) values = values.slice(0, 1);

    const clone = (name: string) =>
      (template(name)?.content.firstElementChild?.cloneNode(true) as Element | undefined) ?? null;
    const optionOf = (value: string) =>
      options().find((option) => selectOptionValue(option) === value);
    const textOf = (value: string) => {
      const option = optionOf(value);
      return option ? (option.textContent as string).trim() : value;
    };

    /** What the trigger shows, built with DOM methods like React's render. */
    const content = (): Node[] => {
      const filled = values.length > 0 && !(values.length === 1 && values[0] === "" && !multiple());
      if (!filled && !element.hasAttribute("data-ok-display-empty")) return [];
      const placeholder = clone("placeholder");
      if (!filled && placeholder) return [placeholder];
      if (!multiple()) {
        const option = optionOf(values[0] as string);
        return option ? [...option.childNodes].map((node) => node.cloneNode(true)) : [];
      }
      if (template("chip"))
        return values.map((value) => {
          const chip = clone("chip") as Element;
          (chip.querySelector("[data-ok-chip-label]") as Element).textContent = textOf(value);
          return chip;
        });
      return [document.createTextNode(values.map(textOf).join(", "))];
    };

    const render = () => {
      for (const option of options()) {
        const on = values.includes(selectOptionValue(option));
        option.setAttribute("aria-selected", String(on));
        option.toggleAttribute("data-ok-selected", on);
        // A checkbox in an option shows its state (multiple select with checkmarks).
        const box = option.querySelector<HTMLInputElement>('input[type="checkbox"]');
        if (box) box.checked = on;
      }
      input.value = serializeSelectValue(values);
      trigger.replaceChildren(...content());
    };

    const open = (focus: HTMLElement | null) => {
      if (popover().isOpen) return true;
      syncSelectPaperWidth(element, element.hasAttribute("data-ok-auto-width"));
      if (!popover().open(trigger)) return false;
      trigger.setAttribute("aria-expanded", "true");
      (focus ?? initialSelectOption(listbox))?.focus();
      emit("open");
      return true;
    };

    // `disabled` set on the hidden input (forms, TextField's options) turns the trigger off too,
    // as React renders it: `aria-disabled` and out of the Tab order.
    const syncDisabled = () => {
      if (input.disabled) trigger.setAttribute("aria-disabled", "true");
      else trigger.removeAttribute("aria-disabled");
      trigger.tabIndex = input.disabled ? -1 : 0;
    };
    // Markup may disable the input alone (the trigger's own `aria-disabled` is kept otherwise).
    if (input.disabled) syncDisabled();
    const disabled = new MutationObserver(syncDisabled);
    disabled.observe(input, { attributes: true, attributeFilter: ["disabled"] });

    // Every close (Escape, outside, Tab, a pick, the trigger, the API) goes through the popover.
    paper.addEventListener(
      "ok:popover:close",
      (event) => {
        if (event.target !== paper) return;
        trigger.setAttribute("aria-expanded", "false");
        emit("close", {
          reason: fromPopover((event as CustomEvent<{ reason: PopoverCloseReason }>).detail.reason),
        });
      },
      { signal },
    );

    const controller = createSelectController(element, {
      isOpen: () => popover().isOpen,
      autoWidth: () => element.hasAttribute("data-ok-auto-width"),
      onOpen: (focus) => {
        open(focus);
      },
      onClose: (reason) => {
        popover().close(toPopover(reason));
      },
      onPick: (option) => {
        const next = nextSelectValue(values, selectOptionValue(option), multiple());
        const value = multiple() ? next : (next[0] as string);
        if (!emit("change", { value }, { cancelable: true })) return;
        values = next;
        render();
        if (!multiple()) popover().close("select");
      },
    });

    return {
      get value() {
        return multiple() ? [...values] : (values[0] ?? "");
      },
      setValue(next) {
        const list = (Array.isArray(next) ? next : [next]).map(String);
        values = multiple() ? list : list.slice(0, 1);
        render();
      },
      get isOpen() {
        return popover().isOpen;
      },
      open: () => open(null),
      close: () => popover().close("api"),
      destroy() {
        controller.destroy();
        disabled.disconnect();
      },
    };
  },

  delegate: [
    {
      // A button that opens a select from outside: `data-ok-select-open="<trigger id>"`.
      event: "click",
      selector: "[data-ok-select-open]",
      handle(button, _event, runtime) {
        const id = button.getAttribute("data-ok-select-open") as string;
        const scope = button.getRootNode() as Document | ShadowRoot;
        const root = scope.getElementById(id)?.closest("[data-ok-select]") ?? null;
        runtime.getOrCreate<SelectInstance>(root, "select")?.open();
      },
    },
  ],
});
