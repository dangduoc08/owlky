/*
 * Autocomplete (MUI Autocomplete / WAI-ARIA combobox with a listbox popup), shared by React and the
 * HTML runtime: option helpers, filtering, the next value after a pick, and
 * `createComboboxController`, which turns keys, clicks and blur into intent. The owner keeps the
 * value, the input text, the open state and the highlighted option, and writes them to the DOM.
 * Typing is the owner's (React needs the input's own `onChange`).
 */

export interface AutocompleteOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

/** Strings become `{ value: label, label }`. */
export const normalizeOption = (option: string | AutocompleteOption): AutocompleteOption =>
  typeof option === "string" ? { value: option, label: option } : option;

/** Folds case and accents ("Écosse" matches "eco"), like MUI's default `ignoreAccents`. */
const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** MUI's default filter: options whose label contains the input (case and accents ignored). */
export function filterOptions<T extends { label: string }>(
  options: readonly T[],
  input: string,
): T[] {
  const query = fold(input);
  return query === ""
    ? [...options]
    : options.filter((option) => fold(option.label).includes(query));
}

/**
 * The value after picking `picked`: single select replaces it; multiple select adds it, or removes
 * it when it was already chosen (MUI with `disableCloseOnSelect` + checkboxes).
 */
export function nextAutocompleteValue(
  current: readonly string[],
  picked: string,
  multiple: boolean,
): string[] {
  if (!multiple) return [picked];
  return current.includes(picked) ? current.filter((v) => v !== picked) : [...current, picked];
}

/** The highlighted index after a key: next / previous (wrapping), ±5 for pages, first / last; skips disabled. */
export function moveHighlight(
  current: number,
  key: string,
  count: number,
  disabledAt: (index: number) => boolean = () => false,
): number {
  if (count === 0) return -1;
  const step =
    key === "ArrowDown"
      ? 1
      : key === "ArrowUp"
        ? -1
        : key === "PageDown"
          ? 5
          : key === "PageUp"
            ? -5
            : 0;
  let index: number;
  if (key === "Home") index = 0;
  else if (key === "End") index = count - 1;
  else if (current < 0) index = step > 0 ? 0 : count - 1;
  else if (Math.abs(step) === 5) index = Math.min(Math.max(current + step, 0), count - 1);
  else index = (current + step + count) % count;
  const direction = step < 0 || key === "End" ? -1 : 1;
  for (let tries = 0; tries < count && disabledAt(index); tries++)
    index = (index + direction + count) % count;
  return disabledAt(index) ? -1 : index;
}

export type AutocompleteCloseReason = "escape" | "blur" | "select" | "toggle" | "outside";

export interface ComboboxState {
  open: boolean;
  /** Index of the highlighted option among the visible ones, or -1. */
  highlighted: number;
  /** Visible options count. */
  count: number;
  disabledAt(index: number): boolean;
  /** The input may hold any text (Enter commits it). */
  freeSolo: boolean;
  /** Something can be removed with Backspace (multiple select with values, empty input). */
  canRemoveLast: boolean;
  /** Home / End move the highlight (else they move the caret). */
  homeEndKeys: boolean;
}

export interface ComboboxControllerOptions {
  read(): ComboboxState;
  onOpenChange(open: boolean, reason: AutocompleteCloseReason | "keyboard"): void;
  onHighlight(index: number): void;
  /** Pick the visible option at `index`. */
  onSelect(index: number): void;
  /** Free solo: Enter without a highlighted option commits the typed text. */
  onCommitText(text: string): void;
  onClear(): void;
  onRemoveLast(): void;
  /** Focus left the field and its listbox (close, and reset the text of a single select). */
  onBlur(): void;
}

export interface ComboboxController {
  destroy(): void;
}

const OPTION = '[role="option"]';

/**
 * Connects an autocomplete root (`[data-ok-autocomplete]`) with its input (`[role=combobox]`),
 * clear / popup buttons (`[data-ok-autocomplete-clear]`, `[data-ok-autocomplete-toggle]`) and its
 * listbox (`[role=listbox]`, inside the root or named by the input's `aria-controls`).
 */
export function createComboboxController(
  root: HTMLElement,
  options: ComboboxControllerOptions,
): ComboboxController {
  const abort = new AbortController();
  const { signal } = abort;
  const input = () => root.querySelector<HTMLInputElement>('[role="combobox"]');
  const listbox = () => {
    const id = input()?.getAttribute("aria-controls");
    // A detached root's root node is the root itself (no getElementById).
    const scope = root.getRootNode() as Partial<Document>;
    const named = id && scope.getElementById ? scope.getElementById(id) : null;
    return named ?? root.querySelector<HTMLElement>('[role="listbox"]');
  };
  const visible = () =>
    [...(listbox()?.querySelectorAll<HTMLElement>(OPTION) ?? [])].filter(
      (option) => !option.hidden,
    );

  root.addEventListener(
    "keydown",
    (event) => {
      if (event.target !== input() || (event.altKey && event.key !== "ArrowDown")) return;
      const state = options.read();
      const field = event.target as HTMLInputElement;
      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "PageDown":
        case "PageUp":
          event.preventDefault();
          if (!state.open) {
            options.onOpenChange(true, "keyboard");
            return;
          }
          options.onHighlight(
            moveHighlight(state.highlighted, event.key, state.count, state.disabledAt),
          );
          return;
        case "Home":
        case "End":
          if (!state.open || !state.homeEndKeys) return;
          event.preventDefault();
          options.onHighlight(
            moveHighlight(state.highlighted, event.key, state.count, state.disabledAt),
          );
          return;
        case "Enter":
          if (state.open && state.highlighted >= 0) {
            event.preventDefault();
            options.onSelect(state.highlighted);
          } else if (state.freeSolo && field.value.trim() !== "") {
            event.preventDefault();
            options.onCommitText(field.value);
          }
          return;
        case "Escape":
          if (state.open) {
            event.preventDefault();
            options.onOpenChange(false, "escape");
          }
          return;
        case "Backspace":
          if (field.value === "" && state.canRemoveLast) options.onRemoveLast();
          return;
        default:
      }
    },
    { signal },
  );

  root.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element;
      if (target.closest?.("[data-ok-autocomplete-clear]")) {
        options.onClear();
        input()?.focus();
      } else if (target.closest?.("[data-ok-autocomplete-toggle]")) {
        options.onOpenChange(!options.read().open, "toggle");
        input()?.focus();
      }
    },
    { signal },
  );
  // A press on the input opens the list before focus can move it (limitTags shows every chip on
  // focus, so the click itself may land elsewhere).
  root.addEventListener(
    "mousedown",
    (event) => {
      if (event.button === 0 && event.target === input() && !options.read().open)
        options.onOpenChange(true, "toggle");
    },
    { signal },
  );

  // The listbox may live outside the root (top layer): listen on the document.
  const doc = root.ownerDocument;
  doc.addEventListener(
    "mousedown",
    (event) => {
      // Keep focus in the input while picking an option.
      if (listbox()?.contains(event.target as Node)) event.preventDefault();
    },
    { signal },
  );
  doc.addEventListener(
    "click",
    (event) => {
      const option = (event.target as Element).closest?.<HTMLElement>(OPTION);
      if (!option || !listbox()?.contains(option)) return;
      const index = visible().indexOf(option);
      if (index >= 0 && !options.read().disabledAt(index)) options.onSelect(index);
    },
    { signal },
  );
  doc.addEventListener(
    "pointermove",
    (event) => {
      const option = (event.target as Element).closest?.<HTMLElement>(OPTION);
      if (!option || !listbox()?.contains(option)) return;
      const index = visible().indexOf(option);
      if (index >= 0 && index !== options.read().highlighted && !options.read().disabledAt(index))
        options.onHighlight(index);
    },
    { signal },
  );

  root.addEventListener(
    "focusout",
    (event) => {
      const next = event.relatedTarget as Node | null;
      if (next && (root.contains(next) || listbox()?.contains(next))) return;
      options.onBlur();
    },
    { signal },
  );

  return {
    destroy() {
      abort.abort();
    },
  };
}

/** Default "+3" text of the tags hidden by `limitTags`. */
export const defaultLimitTagsText = (more: number): string => `+${more}`;
