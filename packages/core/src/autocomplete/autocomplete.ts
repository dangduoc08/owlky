/*
 * Autocomplete (MUI Autocomplete / WAI-ARIA combobox with a listbox popup), shared by React and the
 * HTML runtime: option helpers, filtering, the next value after a pick, inline completion,
 * virtualization math, and `createComboboxController`, which turns keys, clicks and blur into
 * intent. The owner keeps the value, the input text, the open state and the highlighted option,
 * and writes them to the DOM. Typing is the owner's (React needs the input's own `onChange`).
 */

export interface AutocompleteOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
  /** Heading of the option's group (HTML `setOptions`; React uses `groupBy`). */
  group?: string | undefined;
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

/** Settings of `createFilterOptions` (MUI's `createFilterOptions(config)`). */
export interface FilterOptionsConfig<T> {
  /** Ignore accents ("é" matches "e"). Default `true`. */
  ignoreAccents?: boolean | undefined;
  /** Ignore case. Default `true`. */
  ignoreCase?: boolean | undefined;
  /** Keep at most this many matches. Default: all. */
  limit?: number | null | undefined;
  /** Match anywhere in the text (`"any"`) or only at its start (`"start"`). Default `"any"`. */
  matchFrom?: "any" | "start" | undefined;
  /** The text an option is matched on. Default: its `label` (or the string itself). */
  stringify?: ((option: T) => string) | undefined;
  /** Remove spaces around the input. Default `false`. */
  trim?: boolean | undefined;
}

const labelText = (option: unknown): string =>
  typeof option === "string" ? option : String((option as { label?: unknown }).label ?? "");

/**
 * A filter function with other matching rules than the default one, for `filterOptions`
 * (MUI's `createFilterOptions`).
 */
export function createFilterOptions<T>(
  config: FilterOptionsConfig<T> = {},
): (options: readonly T[], inputValue: string) => T[] {
  const {
    ignoreAccents = true,
    ignoreCase = true,
    limit,
    matchFrom = "any",
    stringify = labelText,
    trim = false,
  } = config;
  const prepare = (text: string) => {
    let out = trim ? text.trim() : text;
    if (ignoreCase) out = out.toLowerCase();
    if (ignoreAccents) out = out.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return out;
  };
  return (options, inputValue) => {
    const query = prepare(inputValue);
    const matches = options.filter((option) => {
      const text = prepare(stringify(option));
      return matchFrom === "start" ? text.startsWith(query) : text.includes(query);
    });
    return typeof limit === "number" ? matches.slice(0, Math.max(limit, 0)) : matches;
  };
}

/**
 * Inline completion (`autoComplete`): the part of `label` after the typed text, as a selection
 * range of the input, or `null` when the label doesn't start with the text.
 */
export function completionRange(typed: string, label: string): [number, number] | null {
  if (typed === "" || label.length <= typed.length) return null;
  return label.slice(0, typed.length).toLowerCase() === typed.toLowerCase()
    ? [typed.length, label.length]
    : null;
}

/**
 * What the input shows with `autoComplete`: the highlighted option's label when the arrows moved
 * the highlight, or when typing highlighted an option whose label starts with the text; else
 * `null` (the typed text).
 */
export function inlineCompletion(
  typed: string,
  label: string | undefined,
  reason: AutocompleteHighlightReason | undefined,
): string | null {
  if (label === undefined) return null;
  if (reason === "keyboard") return label;
  if (reason === "auto" && completionRange(typed, label)) return label;
  return null;
}

/** Shows `text` in the input, selecting the part after `typed` when it completes it. */
export function showCompletion(input: HTMLInputElement, typed: string, text: string): void {
  if (input.value !== text) input.value = text;
  const range = completionRange(typed, text);
  if (range && input.ownerDocument.activeElement === input)
    input.setSelectionRange(range[0], range[1]);
}

/** The rows of a virtualized list to draw: `[start, end)` of `count` rows `stride` px apart. */
export function virtualRange(
  scrollTop: number,
  height: number,
  stride: number,
  count: number,
  overscan = 4,
): { start: number; end: number } {
  const size = stride > 0 ? stride : 1;
  const view = Math.max(height, 0);
  // A list that just got shorter (filtering) may still report its old scroll position.
  const top = Math.min(Math.max(scrollTop, 0), Math.max(count * size - view, 0));
  const end = Math.min(Math.ceil((top + view) / size) + overscan, count);
  const start = Math.min(Math.max(Math.floor(top / size) - overscan, 0), end);
  return { start, end };
}

/** Default distance between two options of a virtualized list (34px rows, 4px apart). */
export const AUTOCOMPLETE_OPTION_STRIDE = 38;

/** Default height of a virtualized list before it is measured (its 360px maximum). */
export const AUTOCOMPLETE_LIST_HEIGHT = 360;

/** The distance between two options: the first one's height and bottom margin (or the default). */
export function optionStride(listbox: Element | null | undefined): number {
  const option = listbox?.querySelector<HTMLElement>('[role="option"]');
  if (!option || option.offsetHeight === 0) return AUTOCOMPLETE_OPTION_STRIDE;
  const margin = Number.parseFloat(getComputedStyle(option).marginBottom) || 0;
  return option.offsetHeight + margin;
}

/** The scroll position that keeps row `index` of a virtualized list in view. */
export function scrollToRow(
  scrollTop: number,
  height: number,
  stride: number,
  index: number,
): number {
  const top = index * stride;
  if (top < scrollTop) return top;
  if (top + stride > scrollTop + height) return Math.max(top + stride - height, 0);
  return scrollTop;
}

/**
 * Defaults that follow `freeSolo` (MUI): `clearOnBlur`, `selectOnFocus` and `handleHomeEndKeys`
 * are on unless the field is free solo.
 */
export const freeSoloDefault = (value: boolean | undefined, freeSolo: boolean): boolean =>
  value ?? !freeSolo;

/** HTML: reads a `"true"` / `"false"` attribute whose default follows `freeSolo`. */
export function readFreeSoloDefault(element: Element, attr: string, freeSolo: boolean): boolean {
  const value = element.getAttribute(attr);
  return value === "true" ? true : value === "false" ? false : !freeSolo;
}

/** `blurOnSelect`: whether a pick made with `source` blurs the input. */
export function blursOnSelect(
  setting: boolean | "mouse" | "touch" | "true" | undefined | null,
  source: AutocompleteSelectSource,
): boolean {
  return setting === true || setting === "true" || setting === source;
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

/** How the highlight moves past the ends of the list. */
export interface MoveHighlightOptions {
  /** Wrap from the last option to the first and back. Default `true` (`disableListWrap`). */
  wrap?: boolean | undefined;
  /** Moving past an end highlights the input first (`-1`, `includeInputInList`). */
  includeInput?: boolean | undefined;
}

/**
 * The highlighted index after a key: next / previous (wrapping), ±5 for pages, first / last; skips
 * disabled. `-1` is the input (nothing highlighted).
 */
export function moveHighlight(
  current: number,
  key: string,
  count: number,
  disabledAt: (index: number) => boolean = () => false,
  { wrap = true, includeInput = false }: MoveHighlightOptions = {},
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
  if (Math.abs(step) === 1 && current >= 0) {
    const next = current + step;
    if (next < 0 || next >= count) {
      if (includeInput) return -1;
      if (!wrap) return current;
    }
  }
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

/** What moved the highlight (`onHighlightChange`, `ok:autocomplete:highlight`). */
export type AutocompleteHighlightReason = "keyboard" | "mouse" | "touch" | "auto";

/** What picked an option (`blurOnSelect`). */
export type AutocompleteSelectSource = "keyboard" | "mouse" | "touch";

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
  /** The arrows wrap from one end of the list to the other. Default `true`. */
  wrap?: boolean | undefined;
  /** Moving past an end highlights the input (`includeInputInList`). */
  includeInput?: boolean | undefined;
  /** Disabled options can be highlighted, not picked (`disabledItemsFocusable`). */
  disabledItemsFocusable?: boolean | undefined;
  /** Escape on a closed list clears the field (`clearOnEscape`). */
  clearOnEscape?: boolean | undefined;
  /** Something can be cleared (a value or text). */
  canClear?: boolean | undefined;
  /** The first click after focus selects the input's text (`selectOnFocus`). */
  selectOnFocus?: boolean | undefined;
  /** The pointer leaving the list removes a highlight it made (`resetHighlightOnMouseLeave`). */
  resetHighlightOnMouseLeave?: boolean | undefined;
}

export interface ComboboxControllerOptions {
  read(): ComboboxState;
  onOpenChange(open: boolean, reason: AutocompleteCloseReason | "keyboard"): void;
  onHighlight(index: number, reason: AutocompleteHighlightReason): void;
  /** Pick the visible option at `index`. */
  onSelect(index: number, source: AutocompleteSelectSource): void;
  /** Free solo: Enter without a highlighted option commits the typed text. */
  onCommitText(text: string): void;
  onClear(): void;
  onRemoveLast(): void;
  /** Focus left the field and its listbox (close, and reset the text of a single select). */
  onBlur(): void;
  /**
   * Index of an option element among the visible ones. Default: its position among the listbox's
   * options that aren't `hidden` (a virtualized list draws only some of them).
   */
  optionIndex?(option: HTMLElement): number;
}

export interface ComboboxController {
  destroy(): void;
}

const OPTION = '[role="option"]';

const pointerOf = (event: PointerEvent): "mouse" | "touch" =>
  event.pointerType === "touch" ? "touch" : "mouse";

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
  const indexOf = (option: HTMLElement) =>
    options.optionIndex ? options.optionIndex(option) : visible().indexOf(option);
  const move = (state: ComboboxState, key: string) =>
    moveHighlight(
      state.highlighted,
      key,
      state.count,
      state.disabledItemsFocusable ? () => false : state.disabledAt,
      { wrap: state.wrap, includeInput: state.includeInput },
    );
  // Whether the pointer made the last highlight (resetHighlightOnMouseLeave), the pointer of the
  // last press in the list (blurOnSelect), and whether the next click is the first since focus
  // came in (selectOnFocus).
  let pointerHighlight = false;
  let pressedWith: AutocompleteSelectSource = "mouse";
  let firstClick = false;

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
          pointerHighlight = false;
          options.onHighlight(move(state, event.key), "keyboard");
          return;
        case "Home":
        case "End":
          if (!state.open || !state.homeEndKeys) return;
          event.preventDefault();
          pointerHighlight = false;
          options.onHighlight(move(state, event.key), "keyboard");
          return;
        case "Enter":
          if (state.open && state.highlighted >= 0) {
            event.preventDefault();
            if (!state.disabledAt(state.highlighted))
              options.onSelect(state.highlighted, "keyboard");
          } else if (state.freeSolo && field.value.trim() !== "") {
            event.preventDefault();
            options.onCommitText(field.value);
          }
          return;
        case "Escape":
          if (state.open) {
            event.preventDefault();
            options.onOpenChange(false, "escape");
          } else if (state.clearOnEscape && state.canClear) {
            event.preventDefault();
            options.onClear();
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
      } else if (target === input() && firstClick) {
        firstClick = false;
        const field = target as HTMLInputElement;
        if (options.read().selectOnFocus && field.selectionStart === field.selectionEnd)
          field.select();
      }
    },
    { signal },
  );
  root.addEventListener(
    "focusin",
    (event) => {
      const from = event.relatedTarget as Node | null;
      if (event.target === input() && !(from && root.contains(from))) firstClick = true;
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
    "pointerdown",
    (event) => {
      if (listbox()?.contains(event.target as Node)) pressedWith = pointerOf(event);
    },
    { signal },
  );
  doc.addEventListener(
    "click",
    (event) => {
      const option = (event.target as Element).closest?.<HTMLElement>(OPTION);
      if (!option || !listbox()?.contains(option)) return;
      const index = indexOf(option);
      if (index >= 0 && !options.read().disabledAt(index)) options.onSelect(index, pressedWith);
    },
    { signal },
  );
  doc.addEventListener(
    "pointermove",
    (event) => {
      const option = (event.target as Element).closest?.<HTMLElement>(OPTION);
      if (!option || !listbox()?.contains(option)) return;
      const index = indexOf(option);
      if (index >= 0 && index !== options.read().highlighted && !options.read().disabledAt(index)) {
        pointerHighlight = true;
        options.onHighlight(index, pointerOf(event));
      }
    },
    { signal },
  );
  doc.addEventListener(
    "pointerout",
    (event) => {
      const list = listbox();
      const to = event.relatedTarget as Node | null;
      if (!list?.contains(event.target as Node) || (to && list.contains(to))) return;
      const state = options.read();
      if (state.resetHighlightOnMouseLeave && pointerHighlight && state.highlighted >= 0) {
        pointerHighlight = false;
        options.onHighlight(-1, pointerOf(event));
      }
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
