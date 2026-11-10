"use client";

import {
  type AutocompleteCloseReason,
  type AutocompleteHighlightReason,
  type AutocompleteOption,
  type AutocompleteSelectSource,
  blursOnSelect,
  completionRange,
  createComboboxController,
  filterOptions as defaultFilter,
  freeSoloDefault,
  inlineCompletion,
  normalizeOption,
} from "@owlky/core";
import {
  type ChangeEvent,
  type FocusEvent,
  type RefCallback,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

/** The value of an autocomplete: one value or `null`, or a list of values with `multiple`. */
export type AutocompleteValue<V = string> = V | V[] | null;

/** Why the list opened or closed (`onOpenChange`). */
export type AutocompleteOpenReason = AutocompleteCloseReason | "keyboard" | "input" | "focus";

/** A group of options from `groupBy` (`useAutocomplete().groupedOptions`). */
export interface AutocompleteGroup<T> {
  /** Unique key of the group (its first option's position). */
  key: string;
  /** Position of the group's first option among the visible options. */
  index: number;
  /** The group's name, as `groupBy` returned it. */
  group: string;
  /** The group's visible options. */
  options: T[];
}

/** Props of a value's item from `getItemProps` (spread them on a `Chip`). */
export interface AutocompleteItemProps {
  "data-ok-value": string;
  "data-ok-item-index": number;
  tabIndex: -1;
  disabled?: boolean | undefined;
  /** Removes the value (absent when the field is read only). */
  onDelete?: (() => void) | undefined;
  /** Name of the remove button, such as "Remove Apple". */
  deleteLabel: string;
}

export interface UseAutocompleteProps<T = AutocompleteOption, V = string> {
  /** The choices: strings or `{ value, label, disabled? }`, or any objects with `getOptionLabel`. */
  options: readonly (T | string)[];
  /** Controlled value: an option's value (or typed text with `freeSolo`), values with `multiple`, or `null`. */
  value?: AutocompleteValue<V> | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: AutocompleteValue<V> | undefined;
  /** Called with the new value. */
  onChange?: ((value: AutocompleteValue<V>) => void) | undefined;
  /** Controlled text of the input. */
  inputValue?: string | undefined;
  /** Called with the input's text as it changes. */
  onInputChange?: ((value: string) => void) | undefined;
  /** Controlled open state of the list. */
  open?: boolean | undefined;
  /** Called when the list opens or closes, with the reason. */
  onOpenChange?: ((open: boolean, reason?: AutocompleteOpenReason) => void) | undefined;
  /** Called when the highlighted option changes (`null`: none), with what moved it. */
  onHighlightChange?: ((option: T | null, reason: AutocompleteHighlightReason) => void) | undefined;
  /** Several values, shown as chips. */
  multiple?: boolean | undefined;
  /** Any text is a value; Enter commits it. */
  freeSolo?: boolean | undefined;
  /** Keep the list open after a pick. */
  disableCloseOnSelect?: boolean | undefined;
  /** No clear button. */
  disableClearable?: boolean | undefined;
  /** Open the list when the field gets focus. */
  openOnFocus?: boolean | undefined;
  /** Highlight the first option while typing. */
  autoHighlight?: boolean | undefined;
  /** Inline completion: the input shows the highlighted option, the rest of its label selected. */
  autoComplete?: boolean | undefined;
  /** Leaving the field picks the option highlighted by the keys or `autoHighlight` (free solo: the text). */
  autoSelect?: boolean | undefined;
  /** Blur the input after a pick: always (`true`), or only after a `"mouse"` or `"touch"` pick. */
  blurOnSelect?: boolean | "mouse" | "touch" | undefined;
  /** Leaving the field puts back the chosen label (or empties the text). Default: `!freeSolo`. */
  clearOnBlur?: boolean | undefined;
  /** Escape on a closed list clears the value and the text. */
  clearOnEscape?: boolean | undefined;
  /** Disabled options can be highlighted (not picked). */
  disabledItemsFocusable?: boolean | undefined;
  /** The arrows stop at the first and last options instead of wrapping. */
  disableListWrap?: boolean | undefined;
  /** Leave the chosen options out of the list. */
  filterSelectedOptions?: boolean | undefined;
  /** Home and End highlight the first and last options. Default: `!freeSolo`. */
  handleHomeEndKeys?: boolean | undefined;
  /** The arrows move from the last or first option back to the input. */
  includeInputInList?: boolean | undefined;
  /** The value can't change: the list doesn't open and chips have no remove button. */
  readOnly?: boolean | undefined;
  /** The pointer leaving the list removes the highlight it made. */
  resetHighlightOnMouseLeave?: boolean | undefined;
  /** The first click in the field selects its text. Default: `!freeSolo`. */
  selectOnFocus?: boolean | undefined;
  /** The field can't be used. */
  disabled?: boolean | undefined;
  /** Which options match the text. Default: label contains the text (case and accents ignored). */
  filterOptions?: ((options: T[], inputValue: string) => T[]) | undefined;
  /** The text of an option (input text, chips, matching). Default: its `label`, or the string itself. */
  getOptionLabel?: ((option: T) => string) | undefined;
  /** A unique key of an option (`data-ok-value`), when labels aren't unique. */
  getOptionKey?: ((option: T) => string | number) | undefined;
  /** The value an option stands for (`value`, `onChange`). Default: the option's `value`, or the option itself with `getOptionLabel`. */
  getOptionValue?: ((option: T) => V) | undefined;
  /** Whether an option is the given value. Default: its value is the same (`Object.is`). */
  isOptionEqualToValue?: ((option: T, value: V) => boolean) | undefined;
  /** Whether an option is disabled. Default: its `disabled` field. */
  getOptionDisabled?: ((option: T) => boolean) | undefined;
  /** Groups the options under the returned heading (sort the options by it first). */
  groupBy?: ((option: T) => string) | undefined;
  /** Id of the input (other ids derive from it). */
  id?: string | undefined;
  /** The chosen value is drawn by the owner (`renderValue`): a single value leaves the input empty. */
  renderValue?: unknown;
}

/** An option with what the autocomplete reads from it. */
interface Item<T> {
  option: T;
  index: number;
  key: string;
  label: string;
  disabled: boolean;
  group: string | undefined;
}

const toList = <V>(value: AutocompleteValue<V> | undefined): V[] =>
  value == null ? [] : Array.isArray(value) ? [...value] : [value as V];

const plainLabel = (option: unknown): string =>
  typeof option === "string"
    ? option
    : String((option as { label?: unknown } | null)?.label ?? option ?? "");

/** Internal hooks of the Autocomplete component. */
export interface UseAutocompleteInternals {
  /** Called just before the list opens (the component measures the field). */
  onBeforeOpen?: (() => void) | undefined;
}

/** The state and behavior of `useAutocomplete`, with `T` the option as callbacks read it. */
function useAutocompleteState<T, V>(
  props: UseAutocompleteProps<T, V>,
  internals: UseAutocompleteInternals = {},
) {
  const {
    options: rawOptions,
    value,
    defaultValue = null,
    onChange,
    inputValue,
    onInputChange,
    open: openProp,
    onOpenChange,
    onHighlightChange,
    multiple = false,
    disableCloseOnSelect,
    disableClearable,
    openOnFocus,
    autoHighlight,
    autoComplete,
    filterSelectedOptions,
    readOnly = false,
    disabled = false,
    filterOptions,
    getOptionLabel,
    getOptionKey,
    getOptionValue,
    isOptionEqualToValue,
    getOptionDisabled,
    groupBy,
    id: idProp,
    renderValue,
  } = props;
  const generated = useId();
  const id = idProp ?? generated;
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const objects = getOptionLabel !== undefined || getOptionValue !== undefined;
  const drawsValue = renderValue !== undefined;

  // Options and what is read from them.
  const labelOf = (option: T): string =>
    getOptionLabel ? getOptionLabel(option) : plainLabel(option);
  const valueFor = (option: T): V =>
    getOptionValue
      ? getOptionValue(option)
      : objects
        ? (option as unknown as V)
        : ((option as unknown as AutocompleteOption).value as unknown as V);
  const items: Item<T>[] = rawOptions.map((raw, index) => {
    const option = (objects ? raw : normalizeOption(raw as string | AutocompleteOption)) as T;
    const label = labelOf(option);
    return {
      option,
      index,
      label,
      key: getOptionKey
        ? String(getOptionKey(option))
        : getOptionValue
          ? String(getOptionValue(option))
          : objects
            ? label
            : (option as unknown as AutocompleteOption).value,
      disabled: getOptionDisabled
        ? getOptionDisabled(option)
        : Boolean((option as { disabled?: unknown } | null)?.disabled),
      group: groupBy?.(option),
    };
  });
  const itemOf = new Map(items.map((item) => [item.option, item]));
  const equals = (option: T, v: V) =>
    isOptionEqualToValue ? isOptionEqualToValue(option, v) : Object.is(valueFor(option), v);
  const itemFor = (v: V) => items.find((item) => equals(item.option, v));
  /** The text of a value: its option's label, or the value itself (typed text). */
  const textOf = (v: V) => {
    const item = itemFor(v);
    if (item) return item.label;
    return objects && typeof v !== "string" ? labelOf(v as unknown as T) : plainLabel(v);
  };
  const keyOf = (v: V) => itemFor(v)?.key ?? textOf(v);

  const [current, setCurrent] = useControllableState<AutocompleteValue<V>>({
    value,
    defaultValue,
    onChange,
  });
  const values = toList(current);
  const singleText = (list: V[]) =>
    multiple || drawsValue || list[0] === undefined ? "" : textOf(list[0]);
  const [text, setText] = useControllableState<string>({
    value: inputValue,
    defaultValue: singleText(values),
    onChange: onInputChange,
  });
  const [openState, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: false,
    onChange: undefined,
  });
  const open = openState && !readOnly;
  const [highlight, setHighlight] = useState<{
    index: number;
    reason: AutocompleteHighlightReason;
    complete: boolean;
  }>({ index: -1, reason: "auto", complete: false });
  const [dirty, setDirty] = useState(false);
  const [focused, setFocused] = useState(false);

  const isSelected = (option: T) => values.some((v) => equals(option, v));
  let visibleItems = (
    filterOptions
      ? filterOptions(
          items.map((item) => item.option),
          dirty ? text : "",
        ).flatMap((option) => itemOf.get(option) ?? [])
      : defaultFilter(items, dirty ? text : "")
  ) as Item<T>[];
  if (filterSelectedOptions) visibleItems = visibleItems.filter((item) => !isSelected(item.option));
  const visibleIndex = new Map(visibleItems.map((item, index) => [item.index, index]));
  const highlighted = open && highlight.index < visibleItems.length ? highlight.index : -1;
  const active = highlighted >= 0 ? visibleItems[highlighted] : undefined;

  const display =
    autoComplete && active
      ? (inlineCompletion(text, active.label, highlight.complete ? highlight.reason : undefined) ??
        text)
      : text;

  const rootRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const blurPending = useRef(false);

  const changeHighlight = (
    index: number,
    reason: AutocompleteHighlightReason,
    complete = reason === "keyboard",
  ) => {
    setHighlight((was) =>
      was.index === index && was.reason === reason && was.complete === complete
        ? was
        : { index, reason, complete },
    );
    if (index !== highlighted)
      onHighlightChange?.(index >= 0 ? (visibleItems[index]?.option ?? null) : null, reason);
  };
  const changeOpen = (next: boolean, reason?: AutocompleteOpenReason) => {
    if (next === open || (next && (readOnly || disabled))) return;
    if (next) internals.onBeforeOpen?.();
    setOpen(next);
    onOpenChange?.(next, reason);
    if (!next) setHighlight({ index: -1, reason: "auto", complete: false });
  };
  const emit = (next: V[]) => setCurrent(multiple ? next : (next[0] ?? null));
  const pick = (option: T, closeReason: AutocompleteCloseReason = "select") => {
    const v = valueFor(option);
    const next = multiple
      ? isSelected(option)
        ? values.filter((item) => !equals(option, item))
        : [...values, v]
      : [v];
    emit(next);
    setDirty(false);
    setText(multiple || drawsValue ? "" : labelOf(option));
    if (!(multiple && disableCloseOnSelect) || closeReason === "blur")
      changeOpen(false, closeReason);
  };
  const commitText = (typed: string, closeReason: AutocompleteCloseReason = "select") => {
    const next = multiple
      ? values.some((v) => Object.is(v, typed))
        ? values
        : [...values, typed as unknown as V]
      : [typed as unknown as V];
    emit(next);
    setDirty(false);
    if (multiple || drawsValue) setText("");
    changeOpen(false, closeReason);
  };
  const clear = () => {
    emit([]);
    setText("");
    setDirty(false);
  };
  const removeAt = (index: number) => emit(values.filter((_, i) => i !== index));
  const handleInputChange = (next: string) => {
    if (readOnly) return;
    const typing = next.length > text.length;
    setText(next);
    setDirty(true);
    if (autoHighlight) changeHighlight(0, "auto", typing);
    else changeHighlight(-1, "auto", false);
    if (!open) changeOpen(true, "input");
  };

  const latest = useRef({
    open,
    highlighted,
    highlight,
    visibleItems,
    visibleIndex,
    values,
    text,
    pick,
    emit,
    commitText,
    clear,
    changeOpen,
    changeHighlight,
    setText,
    setDirty,
    singleText,
  });
  latest.current = {
    open,
    highlighted,
    highlight,
    visibleItems,
    visibleIndex,
    values,
    text,
    pick,
    emit,
    commitText,
    clear,
    changeOpen,
    changeHighlight,
    setText,
    setDirty,
    singleText,
  };
  const settings = useRef(props);
  settings.current = props;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const controller = createComboboxController(root, {
      read: () => {
        const s = latest.current;
        const p = settings.current;
        const free = p.freeSolo ?? false;
        const locked = p.readOnly === true || p.disabled === true;
        return {
          open: s.open,
          highlighted: s.highlighted,
          count: s.visibleItems.length,
          disabledAt: (i) => Boolean(s.visibleItems[i]?.disabled),
          freeSolo: free,
          canRemoveLast:
            !locked && s.values.length > 0 && (p.multiple === true || p.renderValue !== undefined),
          homeEndKeys: freeSoloDefault(p.handleHomeEndKeys, free),
          wrap: !p.disableListWrap,
          includeInput: p.includeInputInList,
          disabledItemsFocusable: p.disabledItemsFocusable,
          clearOnEscape: p.clearOnEscape,
          canClear: !locked && (s.values.length > 0 || s.text !== ""),
          selectOnFocus: freeSoloDefault(p.selectOnFocus, free),
          resetHighlightOnMouseLeave: p.resetHighlightOnMouseLeave,
        };
      },
      onOpenChange: (next, reason) => latest.current.changeOpen(next, reason),
      onHighlight: (index, reason) => latest.current.changeHighlight(index, reason),
      onSelect: (index, source: AutocompleteSelectSource) => {
        const item = latest.current.visibleItems[index];
        if (!item) return;
        latest.current.pick(item.option);
        if (blursOnSelect(settings.current.blurOnSelect, source)) blurPending.current = true;
      },
      onCommitText: (typed) => latest.current.commitText(typed),
      onClear: () => latest.current.clear(),
      onRemoveLast: () => {
        const s = latest.current;
        s.emit(s.values.slice(0, -1));
      },
      onBlur: () => {
        const s = latest.current;
        const p = settings.current;
        const free = p.freeSolo ?? false;
        const item = s.highlighted >= 0 ? s.visibleItems[s.highlighted] : undefined;
        const byKeys = s.highlight.reason === "keyboard" || s.highlight.reason === "auto";
        if (p.autoSelect && s.open && item && !item.disabled && byKeys) {
          s.pick(item.option, "blur");
          return;
        }
        if (p.autoSelect && free && s.text !== "") {
          s.commitText(s.text, "blur");
          return;
        }
        s.changeOpen(false, "blur");
        if (freeSoloDefault(p.clearOnBlur, free)) {
          s.setText(s.singleText(s.values));
          s.setDirty(false);
        }
      },
      optionIndex: (option) => {
        const match = /-option-(\d+)$/.exec(option.id);
        return match ? (latest.current.visibleIndex.get(Number(match[1])) ?? -1) : -1;
      },
    });
    return () => controller.destroy();
  }, []);

  // blurOnSelect: blur once the pick has rendered (the blur rules read the new value).
  // Inline completion: select the part of the label that wasn't typed.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (blurPending.current) {
      blurPending.current = false;
      input.blur();
      return;
    }
    if (display !== text && input.ownerDocument.activeElement === input) {
      const range = completionRange(text, display);
      if (range) input.setSelectionRange(range[0], range[1]);
    }
  });

  const hasValue = values.length > 0;
  const hasClear = !disableClearable && !disabled && !readOnly && (hasValue || text !== "");

  const groupedOptions: T[] | AutocompleteGroup<T>[] = groupBy
    ? visibleItems.reduce<AutocompleteGroup<T>[]>((groups, item, index) => {
        const last = groups[groups.length - 1];
        if (last && last.group === item.group) last.options.push(item.option);
        else
          groups.push({
            key: String(index),
            index,
            group: item.group ?? "",
            options: [item.option],
          });
        return groups;
      }, [])
    : visibleItems.map((item) => item.option);

  const mergedRootRef = useCallback((element: HTMLElement | null) => {
    rootRef.current = element;
  }, []) as RefCallback<HTMLElement>;
  const mergedInputRef = useMergedRefs<HTMLInputElement>(inputRef);

  return {
    id,
    listboxId,
    /** The chosen value(s). */
    value: current,
    /** The input's text (what people typed). */
    inputValue: text,
    /** What the input shows: the text, or an inline completion. */
    displayValue: display,
    popupOpen: open,
    focused,
    dirty,
    /** Index of the highlighted option among the visible ones, or -1. */
    highlightedIndex: highlighted,
    /** The visible options, in groups with `groupBy`. */
    groupedOptions,
    /** The visible options (flat). */
    filteredOptions: visibleItems.map((item) => item.option),
    hasClear,
    readOnly,
    disabled,
    labelOf,
    keyOf: (option: T) => itemOf.get(option)?.key ?? labelOf(option),
    isSelected,
    /** Ids of the visible options' elements (`aria-activedescendant`). */
    optionId: (option: T) => optionId(itemOf.get(option)?.index ?? -1),
    activeId: active ? optionId(active.index) : undefined,
    /** Every option with its group and whether it is visible (the component draws them all). */
    items: items.map((item) => ({
      option: item.option,
      group: item.group,
      visible: visibleIndex.has(item.index),
    })),
    values,
    textOf,
    keyOfValue: keyOf,
    removeValue: removeAt,
    clear,
    /** Sets the input's text as typing would (filters and opens). */
    handleInputChange,
    /** Opens or closes the list (refused while read only or disabled). */
    setPopupOpen: changeOpen,
    getRootProps: () => ({
      ref: mergedRootRef,
      onFocus: () => {
        if (!focused) setFocused(true);
      },
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      },
    }),
    getInputLabelProps: () => ({ id: `${id}-label`, htmlFor: id }),
    getInputProps: () => ({
      id,
      ref: mergedInputRef,
      value: display,
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        handleInputChange(event.currentTarget.value),
      onFocus: () => {
        if (openOnFocus) changeOpen(true, "focus");
      },
      role: "combobox" as const,
      "aria-autocomplete": autoComplete ? ("both" as const) : ("list" as const),
      "aria-expanded": open,
      "aria-controls": listboxId,
      "aria-activedescendant": active ? optionId(active.index) : undefined,
      autoComplete: "off",
      readOnly: readOnly || undefined,
      disabled: disabled || undefined,
    }),
    getListboxProps: () => ({ role: "listbox" as const, id: listboxId }),
    getOptionProps: ({ option }: { option: T; index?: number }) => {
      const item = itemOf.get(option);
      const index = item?.index ?? -1;
      return {
        role: "option" as const,
        id: optionId(index),
        "data-ok-value": item?.key ?? labelOf(option),
        "aria-selected": isSelected(option),
        "aria-disabled": item?.disabled || undefined,
        ...(active && active.index === index ? { "data-ok-focused": "" } : {}),
      };
    },
    getClearProps: () => ({
      "data-ok-autocomplete-clear": "",
      tabIndex: -1,
      hidden: !hasClear || undefined,
    }),
    getPopupIndicatorProps: () => ({
      "data-ok-autocomplete-toggle": "",
      tabIndex: -1,
      hidden: readOnly || undefined,
    }),
    getItemProps: ({ index }: { index: number }): AutocompleteItemProps => {
      const v = values[index] as V;
      return {
        "data-ok-value": keyOf(v),
        "data-ok-item-index": index,
        tabIndex: -1,
        disabled: disabled || undefined,
        onDelete: readOnly ? undefined : () => removeAt(index),
        deleteLabel: `Remove ${textOf(v)}`,
      };
    },
  };
}

/** What `useAutocomplete` returns. */
export type UseAutocompleteReturn<T = AutocompleteOption, V = string> = ReturnType<
  typeof useAutocompleteState<T, V>
>;

/** What callbacks get for an option: string options are read as `{ value, label }`. */
export type AutocompleteOptionOf<T> = T extends string ? AutocompleteOption : T;

/**
 * useAutocomplete — the state and behavior of an Autocomplete without its look (MUI's
 * `useAutocomplete`). Spread the prop getters on your own elements: the root, the input, the
 * listbox and its options, the clear and open buttons, and the chosen values.
 */
export const useAutocomplete = useAutocompleteState as <T = AutocompleteOption, V = string>(
  props: UseAutocompleteProps<AutocompleteOptionOf<T>, V> & { options: readonly (T | string)[] },
  internals?: UseAutocompleteInternals,
) => UseAutocompleteReturn<AutocompleteOptionOf<T>, V>;
