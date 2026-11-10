"use client";

import {
  type AutocompleteCloseReason,
  type AutocompleteOption,
  autocompleteAttributes,
  createComboboxController,
  filterOptions as defaultFilter,
  defaultLimitTagsText,
  nextAutocompleteValue,
  normalizeOption,
  type SelectionControlSize,
  type TextFieldVariant,
} from "@owlky/core";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Chip } from "../chip/chip.js";
import { IconButton } from "../icon-button/icon-button.js";
import { Popover } from "../popover/popover.js";
import { InputAdornment, TextField } from "../text-field/text-field.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

type AutocompleteValue = string | string[] | null;

const ICON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Clear icon (decorative). */
function ClearIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...ICON}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/** Open / close icon (decorative; turns when open). */
function ToggleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...ICON}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const toList = (value: AutocompleteValue | undefined): string[] =>
  value == null ? [] : typeof value === "string" ? [value] : [...value];

export interface AutocompleteProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** The choices: strings, or `{ value, label, disabled? }`. */
  options: readonly (string | AutocompleteOption)[];
  /** Controlled value: an option value (or typed text with `freeSolo`), values with `multiple`, or `null`. */
  value?: AutocompleteValue | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: AutocompleteValue | undefined;
  /** Called with the new value. */
  onChange?: ((value: AutocompleteValue) => void) | undefined;
  /** Controlled text of the input. */
  inputValue?: string | undefined;
  /** Called with the input's text as it changes. */
  onInputChange?: ((value: string) => void) | undefined;
  /** Controlled open state of the list. */
  open?: boolean | undefined;
  /** Called when the list opens or closes, with the reason. */
  onOpenChange?:
    | ((open: boolean, reason?: AutocompleteCloseReason | "keyboard" | "input" | "focus") => void)
    | undefined;
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
  /** Multiple: chips shown when the field isn't focused. Default: all. */
  limitTags?: number | undefined;
  /** Text of the hidden chips count. Default "+3". */
  getLimitTagsText?: ((more: number) => string) | undefined;
  /** Which options match the text. Default: label contains the text (case and accents ignored). */
  filterOptions?:
    | ((options: AutocompleteOption[], inputValue: string) => AutocompleteOption[])
    | undefined;
  /** Content of an option (default: its label). */
  renderOption?:
    | ((option: AutocompleteOption, state: { selected: boolean }) => ReactNode)
    | undefined;
  /** Shown when nothing matches. Default "No options". */
  noOptionsText?: ReactNode;
  /** Names of the end buttons. */
  clearText?: string | undefined;
  /** Label of the button that opens the list. Default `"Open"`. */
  openText?: string | undefined;
  /** Label of the button that closes the list. Default `"Close"`. */
  closeText?: string | undefined;
  /** TextField props. */
  label?: ReactNode;
  /** Placeholder of the input. */
  placeholder?: string | undefined;
  /** Text under the field, such as a hint or an error message. */
  helperText?: ReactNode;
  /** Shows the field in the error state. */
  error?: boolean | undefined;
  /** The field's variant: `outlined`, `filled` or `standard`. */
  variant?: TextFieldVariant | undefined;
  /** The field's size. */
  size?: SelectionControlSize | undefined;
  /** Turns the field off. */
  disabled?: boolean | undefined;
  /** Id of the input (other ids derive from it). */
  id?: string | undefined;
  /** Form field name of the input. */
  name?: string | undefined;
}

/**
 * Autocomplete — spec: specs/components/autocomplete.md. A text field with a list of suggestions
 * (WAI-ARIA combobox), built from TextField, Chip, IconButton and Popover. Keys, clicks and blur
 * are core's `createComboboxController`; this component owns the value, the text and the list.
 */
export const Autocomplete = forwardRef<HTMLDivElement, AutocompleteProps>(function Autocomplete(
  {
    options: rawOptions,
    value,
    defaultValue = null,
    onChange,
    inputValue,
    onInputChange,
    open: openProp,
    onOpenChange,
    multiple = false,
    freeSolo = false,
    disableCloseOnSelect,
    disableClearable,
    openOnFocus,
    autoHighlight,
    limitTags = -1,
    getLimitTagsText = defaultLimitTagsText,
    filterOptions = defaultFilter,
    renderOption,
    noOptionsText = "No options",
    clearText = "Clear",
    openText = "Open",
    closeText = "Close",
    label,
    placeholder,
    helperText,
    error,
    variant,
    size,
    disabled,
    id: idProp,
    name,
    ...props
  },
  ref,
) {
  const generated = useId();
  const id = idProp ?? generated;
  const listboxId = `${id}-listbox`;
  const options = rawOptions.map(normalizeOption);
  const byValue = new Map(options.map((option) => [option.value, option]));
  const labelOf = (v: string) => byValue.get(v)?.label ?? v;

  const [current, setCurrent] = useControllableState<AutocompleteValue>({
    value,
    defaultValue,
    onChange,
  });
  const values = toList(current);
  const [text, setText] = useControllableState<string>({
    value: inputValue,
    defaultValue: multiple ? "" : values[0] !== undefined ? labelOf(values[0]) : "",
    onChange: onInputChange,
  });
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: false,
    onChange: undefined,
  });
  const [highlighted, setHighlighted] = useState(-1);
  const [dirty, setDirty] = useState(false);
  const [focused, setFocused] = useState(false);
  const [width, setWidth] = useState<number | undefined>(undefined);

  const visible = filterOptions(options, dirty ? text : "");
  const visibleSet = new Set(visible.map((option) => option.value));
  const indexOf = (option: AutocompleteOption) => options.indexOf(option);

  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);
  const control = useCallback(
    () => rootRef.current?.querySelector<HTMLElement>("[data-ok-text-field-control]") ?? null,
    [],
  );

  const changeOpen = (next: boolean, reason?: Parameters<NonNullable<typeof onOpenChange>>[1]) => {
    if (next === open) return;
    if (next) setWidth(control()?.offsetWidth);
    setOpen(next);
    onOpenChange?.(next, reason);
    if (!next) setHighlighted(-1);
  };
  const emit = (next: string[]) => setCurrent(multiple ? next : (next[0] ?? null));
  const pick = (option: AutocompleteOption) => {
    const next = nextAutocompleteValue(values, option.value, multiple);
    emit(next);
    setDirty(false);
    if (multiple) setText("");
    else setText(option.label);
    if (!(multiple && disableCloseOnSelect)) changeOpen(false, "select");
  };

  const latest = useRef({
    open,
    highlighted,
    visible,
    values,
    text,
    pick,
    emit,
    changeOpen,
    setText,
    setDirty,
    setHighlighted,
    freeSolo,
    multiple,
    labelOf,
  });
  latest.current = {
    open,
    highlighted,
    visible,
    values,
    text,
    pick,
    emit,
    changeOpen,
    setText,
    setDirty,
    setHighlighted,
    freeSolo,
    multiple,
    labelOf,
  };

  useLayoutEffect(() => {
    const controller = createComboboxController(rootRef.current as HTMLElement, {
      read: () => {
        const s = latest.current;
        return {
          open: s.open,
          highlighted: s.highlighted,
          count: s.visible.length,
          disabledAt: (i) => Boolean(s.visible[i]?.disabled),
          freeSolo: s.freeSolo,
          canRemoveLast: s.multiple && s.values.length > 0,
          homeEndKeys: !s.freeSolo,
        };
      },
      onOpenChange: (next, reason) => latest.current.changeOpen(next, reason),
      onHighlight: (index) => latest.current.setHighlighted(index),
      onSelect: (index) => {
        const option = latest.current.visible[index];
        if (option) latest.current.pick(option);
      },
      onCommitText: (typed) => {
        const s = latest.current;
        const next = s.multiple
          ? s.values.includes(typed)
            ? s.values
            : [...s.values, typed]
          : [typed];
        s.emit(next);
        s.setDirty(false);
        if (s.multiple) s.setText("");
        s.changeOpen(false, "select");
      },
      onClear: () => {
        const s = latest.current;
        s.emit([]);
        s.setText("");
        s.setDirty(false);
      },
      onRemoveLast: () => {
        const s = latest.current;
        s.emit(s.values.slice(0, -1));
      },
      onBlur: () => {
        const s = latest.current;
        s.changeOpen(false, "blur");
        if (!s.freeSolo) {
          s.setText(s.multiple || s.values[0] === undefined ? "" : s.labelOf(s.values[0]));
          s.setDirty(false);
        }
      },
    });
    return () => controller.destroy();
  }, []);

  // Keep the highlighted option in view.
  useLayoutEffect(() => {
    if (highlighted < 0) return;
    const option = visible[highlighted];
    if (!option) return;
    const element = rootRef.current?.ownerDocument.getElementById(
      `${id}-option-${indexOf(option)}`,
    );
    element?.scrollIntoView?.({ block: "nearest" });
  });

  const hiddenTags = !focused && limitTags >= 0 ? Math.max(values.length - limitTags, 0) : 0;
  const tags =
    multiple && values.length > 0 ? (
      <InputAdornment position="start">
        {values.map((v, index) => (
          <Chip
            key={v}
            size="small"
            variant="soft"
            label={labelOf(v)}
            data-ok-value={v}
            hidden={index >= values.length - hiddenTags || undefined}
            disabled={disabled}
            deleteLabel={`Remove ${labelOf(v)}`}
            onDelete={() => emit(values.filter((item) => item !== v))}
          />
        ))}
        {hiddenTags > 0 && <span data-ok-autocomplete-more="">{getLimitTagsText(hiddenTags)}</span>}
      </InputAdornment>
    ) : undefined;

  const active = open && highlighted >= 0 ? visible[highlighted] : undefined;
  const showClear = !disableClearable && !disabled && (values.length > 0 || text !== "");

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: focus / blur only track whether focus is inside the field (limitTags).
    <div
      ref={mergedRef}
      {...autocompleteAttributes({
        multiple,
        freeSolo,
        disableCloseOnSelect,
        disableClearable,
        openOnFocus,
        autoHighlight,
        limitTags: limitTags >= 0 ? limitTags : undefined,
      })}
      {...(open ? { "data-ok-open": "" } : {})}
      data-ok-runtime="off"
      onFocus={() => {
        if (!focused) setFocused(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      {...props}
    >
      <TextField
        id={id}
        name={name}
        label={label}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        variant={variant}
        size={size}
        disabled={disabled}
        fullWidth
        value={text}
        onChange={(next) => {
          setText(next);
          setDirty(true);
          setHighlighted(autoHighlight ? 0 : -1);
          if (!open) changeOpen(true, "input");
        }}
        onFocus={() => {
          if (openOnFocus) changeOpen(true, "focus");
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={active ? `${id}-option-${indexOf(active)}` : undefined}
        autoComplete="off"
        startAdornment={tags}
        endAdornment={
          <InputAdornment position="end">
            {!disableClearable && (
              <IconButton
                data-ok-autocomplete-clear=""
                size="sm"
                tabIndex={-1}
                aria-label={clearText}
                disabled={disabled}
                hidden={!showClear || undefined}
              >
                <ClearIcon />
              </IconButton>
            )}
            {!freeSolo && (
              <IconButton
                data-ok-autocomplete-toggle=""
                size="sm"
                tabIndex={-1}
                aria-label={open ? closeText : openText}
                data-ok-label-open={openText}
                data-ok-label-close={closeText}
                disabled={disabled}
              >
                <ToggleIcon />
              </IconButton>
            )}
          </InputAdornment>
        }
      />
      <Popover
        open={open}
        anchorEl={control}
        placement="bottom-start"
        disableAutoFocus
        disableRestoreFocus
        onOpenChange={(next) => changeOpen(next, "outside")}
        data-ok-autocomplete-paper=""
        style={
          (width ? { "--_ok-autocomplete-width": `${width}px` } : undefined) as
            | CSSProperties
            | undefined
        }
      >
        <ul
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: WAI-ARIA combobox: the popup is a list with role="listbox" (MUI).
          role="listbox"
          id={listboxId}
          aria-label={typeof label === "string" ? label : undefined}
        >
          {options.map((option, index) => {
            const selected = values.includes(option.value);
            return (
              // biome-ignore lint/a11y/useFocusableInteractive: focus stays in the input (aria-activedescendant), as the WAI-ARIA combobox pattern requires.
              <li
                key={option.value}
                // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: listbox options are list items (WAI-ARIA combobox, MUI).
                role="option"
                id={`${id}-option-${index}`}
                data-ok-value={option.value}
                aria-selected={selected}
                aria-disabled={option.disabled || undefined}
                hidden={!visibleSet.has(option.value) || undefined}
                {...(active === option ? { "data-ok-focused": "" } : {})}
              >
                {renderOption ? renderOption(option, { selected }) : option.label}
              </li>
            );
          })}
        </ul>
        <div data-ok-autocomplete-no-options="" hidden={visible.length > 0 || undefined}>
          {noOptionsText}
        </div>
      </Popover>
    </div>
  );
});
