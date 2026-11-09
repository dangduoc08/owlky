/*
 * Select (listbox) behavior — spec: specs/components/select.md, ADR-0045. The select-only
 * combobox pattern with MUI's focus model: the trigger (`[data-ok-select-display][role=combobox]`)
 * opens a `[role=listbox]` in a Popover and focus moves onto its options (roving focus, like
 * MUI's MenuList). The controller reports intent; owners (React state, HTML runtime) own the value
 * and the open state.
 */
import { createTypeahead, type Typeahead } from "../menu/menu-navigation.js";

/** Why a select asks to close. Escape and outside presses come from the popover controller. */
export type SelectCloseReason = "escape" | "backdrop" | "select" | "tab" | "toggle";

const OPTION = '[role="option"]';
const TRIGGER = ":scope > [data-ok-select-display]";
const LISTBOX = ":scope > [data-ok-popover] [data-ok-select-listbox]";
const PAPER = ":scope > [data-ok-popover]";

/** The value an option stands for (`data-ok-value`; empty when absent). */
export const selectOptionValue = (option: Element): string =>
  option.getAttribute("data-ok-value") ?? "";

/** Options that can be focused and picked, in order (disabled and hidden ones are skipped). */
export function selectOptionsOf(listbox: Element | null | undefined): HTMLElement[] {
  if (!listbox) return [];
  return [...listbox.querySelectorAll<HTMLElement>(OPTION)].filter(
    (option) => option.getAttribute("aria-disabled") !== "true" && !option.hidden,
  );
}

/** Where focus goes when the listbox opens. */
export type SelectOpenFocus = "selected" | "first" | "last";

/** The option to focus on open: the (first) selected one, else the first; or the first / last. */
export function initialSelectOption(
  listbox: Element | null | undefined,
  focus: SelectOpenFocus = "selected",
): HTMLElement | null {
  const options = selectOptionsOf(listbox);
  if (focus === "last") return options[options.length - 1] ?? null;
  if (focus === "first") return options[0] ?? null;
  return (
    options.find((option) => option.getAttribute("aria-selected") === "true") ?? options[0] ?? null
  );
}

/**
 * The option a key moves to inside the open listbox: ArrowDown / ArrowUp (wrapping, like MUI's
 * MenuList), Home, End, or a printable character (typeahead). `null` = not a navigation key.
 */
export function selectKeyTarget(
  listbox: Element,
  current: Element | null,
  key: string,
  typeahead?: Typeahead,
): HTMLElement | null {
  const options = selectOptionsOf(listbox);
  if (options.length === 0) return null;
  const index = current ? options.indexOf(current as HTMLElement) : -1;
  switch (key) {
    case "ArrowDown":
      return options[(index + 1) % options.length] as HTMLElement;
    case "ArrowUp":
      return options[index <= 0 ? options.length - 1 : index - 1] as HTMLElement;
    case "Home":
      return options[0] as HTMLElement;
    case "End":
      return options[options.length - 1] as HTMLElement;
    default:
      if (typeahead && key.length === 1 && key !== " ")
        return typeahead.match(options, (current as HTMLElement | null) ?? null, key);
      return null;
  }
}

/** Single: the picked value replaces the value. Multiple: the picked value is toggled. */
export function nextSelectValue(
  values: readonly string[],
  value: string,
  multiple: boolean,
): string[] {
  if (!multiple) return [value];
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

/** The hidden input's value: one value, or the values joined with commas (like MUI). */
export const serializeSelectValue = (values: readonly string[]): string => values.join(",");

/** Values compare as strings (`10` and `"10"` are the same option, as in MUI). */
export const sameSelectValue = (a: unknown, b: unknown): boolean => String(a) === String(b);

export interface SelectControllerOptions {
  /** Read on every event. */
  isOpen(): boolean;
  /** Disabled or read-only: the listbox doesn't open. Default: the trigger's `aria-disabled` / `aria-readonly`. */
  isInert?: (() => boolean) | undefined;
  /** The popover takes at least the field's width unless this returns `true` (MUI `autoWidth`). */
  autoWidth?: (() => boolean) | undefined;
  /** The user asks to open; `focus` is the option to focus once the listbox shows. */
  onOpen(focus: HTMLElement | null): void;
  /** The user asks to close (Tab, a press on the trigger). Escape and outside presses come from the popover. */
  onClose(reason: SelectCloseReason): void;
  /** The user picked an option (click, Enter, Space). The owner updates the value (and closes a single select). */
  onPick(option: HTMLElement): void;
}

export interface SelectController {
  /** The trigger (`[data-ok-select-display]`). */
  readonly trigger: HTMLElement | null;
  /** The listbox (`[data-ok-select-listbox]`). */
  readonly listbox: HTMLElement | null;
  destroy(): void;
}

/** Writes the popover's minimum width (`--_ok-select-width`): the field's, unless `autoWidth`. */
export function syncSelectPaperWidth(root: HTMLElement, autoWidth: boolean): void {
  const paper = root.querySelector<HTMLElement>(PAPER);
  if (!paper) return;
  if (autoWidth) paper.style.removeProperty("--_ok-select-width");
  else paper.style.setProperty("--_ok-select-width", `${root.getBoundingClientRect().width}px`);
}

/**
 * Connects a select root (`[data-ok-select]`: the trigger, the hidden input, the icon and the
 * popover with the listbox as children) to the WAI-ARIA select-only combobox keyboard:
 * - closed trigger: ArrowDown / ArrowUp / Enter / Space / Alt+ArrowDown open on the selected
 *   option, Home / End on the first / last, a character on the first match (typeahead);
 *   a click toggles;
 * - open listbox: arrows (wrapping), Home, End and typeahead move focus; Enter / Space / click
 *   pick; Tab closes (focus goes back to the trigger).
 */
export function createSelectController(
  root: HTMLElement,
  options: SelectControllerOptions,
): SelectController {
  const abort = new AbortController();
  const { signal } = abort;
  const typeahead = createTypeahead();
  const trigger = () => root.querySelector<HTMLElement>(TRIGGER);
  const listbox = () => root.querySelector<HTMLElement>(LISTBOX);
  const inert = () => {
    if (options.isInert) return options.isInert();
    const element = trigger();
    return (
      element?.getAttribute("aria-disabled") === "true" ||
      element?.getAttribute("aria-readonly") === "true"
    );
  };
  const open = (focus: HTMLElement | null) => {
    syncSelectPaperWidth(root, options.autoWidth?.() === true);
    options.onOpen(focus);
  };

  root.addEventListener(
    "keydown",
    (event) => {
      const target = event.target as Element;
      const list = listbox();
      if (target === trigger()) {
        if (options.isOpen() || inert()) return;
        if (event.ctrlKey || event.metaKey) return;
        let focus: HTMLElement | null | undefined;
        switch (event.key) {
          case "ArrowDown":
          case "ArrowUp":
          case "Enter":
          case " ":
            focus = initialSelectOption(list, "selected");
            break;
          case "Home":
            focus = initialSelectOption(list, "first");
            break;
          case "End":
            focus = initialSelectOption(list, "last");
            break;
          default:
            if (event.altKey || event.key.length !== 1) return;
            // Typeahead starts after the selected option (or before the first one).
            focus = list
              ? selectKeyTarget(
                  list,
                  selectOptionsOf(list).find(
                    (option) => option.getAttribute("aria-selected") === "true",
                  ) ?? null,
                  event.key,
                  typeahead,
                )
              : null;
            if (!focus) return;
        }
        event.preventDefault();
        open(focus);
        return;
      }
      if (!list?.contains(target)) return;
      const option = target.closest<HTMLElement>(OPTION);
      if (event.key === "Tab") {
        event.preventDefault();
        options.onClose("tab");
        return;
      }
      if ((event.key === "Enter" || event.key === " ") && option) {
        event.preventDefault();
        if (option.getAttribute("aria-disabled") !== "true") options.onPick(option);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const next = selectKeyTarget(list, option, event.key, typeahead);
      if (next) {
        event.preventDefault();
        next.focus();
      }
    },
    { signal },
  );

  root.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element;
      const list = listbox();
      if (list?.contains(target)) {
        const option = target.closest<HTMLElement>(OPTION);
        if (option && list.contains(option) && option.getAttribute("aria-disabled") !== "true")
          options.onPick(option);
        return;
      }
      if (!trigger()?.contains(target) || inert()) return;
      if (options.isOpen()) options.onClose("toggle");
      else open(initialSelectOption(list, "selected"));
    },
    { signal },
  );

  return {
    get trigger() {
      return trigger();
    },
    get listbox() {
      return listbox();
    },
    destroy() {
      abort.abort();
    },
  };
}
