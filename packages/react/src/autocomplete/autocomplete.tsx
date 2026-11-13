"use client";

import {
  AUTOCOMPLETE_LIST_HEIGHT,
  AUTOCOMPLETE_OPTION_STRIDE,
  type AutocompleteOption,
  altArrowDownLinear,
  autocompleteAttributes,
  closeLinear,
  defaultLimitTagsText,
  optionStride,
  type SelectionControlSize,
  scrollToRow,
  type TextFieldVariant,
  virtualRange,
} from "@owlky/core";
import {
  type CSSProperties,
  type ElementType,
  type ForwardedRef,
  Fragment,
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Chip } from "../chip/chip.js";
import { IconButton } from "../icon-button/icon-button.js";
import { ListSubheader } from "../list/list.js";
import { Popover } from "../popover/popover.js";
import { InputAdornment, TextField } from "../text-field/text-field.js";
import { Icon } from "../utils/icon.js";
import { useMergedRefs } from "../utils/refs.js";
import {
  type AutocompleteItemProps,
  type AutocompleteOptionOf,
  type AutocompleteValue,
  type UseAutocompleteProps,
  useAutocomplete,
} from "./use-autocomplete.js";

/** Clear icon (decorative). */
function ClearIcon() {
  return <Icon icon={closeLinear} />;
}

/** Open / close icon (decorative; turns when open). */
function ToggleIcon() {
  return <Icon icon={altArrowDownLinear} />;
}

/** What `renderGroup` gets: the group's heading and its options, already drawn. */
export interface AutocompleteRenderGroupParams {
  /** Unique key of the group. */
  key: string;
  /** The heading, as `groupBy` returned it. */
  group: string;
  /** The group's options. */
  children: ReactNode;
}

export interface AutocompleteProps<T = AutocompleteOption, V = string>
  extends UseAutocompleteProps<T, V>,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "id"> {
  /** Multiple: chips shown when the field isn't focused. Default: all. */
  limitTags?: number | undefined;
  /** Text of the hidden chips count. Default "+3". */
  getLimitTagsText?: ((more: number) => string) | undefined;
  /** Content of an option (default: its label). */
  renderOption?: ((option: T, state: { selected: boolean }) => ReactNode) | undefined;
  /** Draws a group of options (default: a `ListSubheader` with the heading, then the options). */
  renderGroup?: ((params: AutocompleteRenderGroupParams) => ReactNode) | undefined;
  /**
   * Draws the chosen value(s) in the field instead of the built-in chips; spread
   * `getItemProps({ index })` on each item. A single value drawn this way leaves the input empty.
   */
  renderValue?:
    | ((
        value: V | V[],
        getItemProps: (args: { index: number }) => AutocompleteItemProps,
      ) => ReactNode)
    | undefined;
  /** Shown when nothing matches. Default "No options". */
  noOptionsText?: ReactNode;
  /** Options are loading: the list shows `loadingText` while it has no options. */
  loading?: boolean | undefined;
  /** Shown while `loading` and there are no options. Default "Loading…". */
  loadingText?: ReactNode;
  /** Name of the clear button. Default "Clear". */
  clearText?: string | undefined;
  /** Name of the open button while the list is closed. Default "Open". */
  openText?: string | undefined;
  /** Name of the open button while the list is open. Default "Close". */
  closeText?: string | undefined;
  /** Icon of the clear button. Default: a cross. */
  clearIcon?: ReactNode;
  /** Icon of the open button (it turns while open). Default: a chevron. */
  popupIcon?: ReactNode;
  /** Show (`true`) or hide (`false`) the open button; `"auto"` hides it in free solo fields. Default `"auto"`. */
  forcePopupIcon?: boolean | "auto" | undefined;
  /** The element of the listbox (it gets the listbox props, a `ref` and the options). Default `"ul"`. */
  ListboxComponent?: ElementType | undefined;
  /** Draw only the options in view, for long lists (groups aren't shown). */
  virtualize?: boolean | undefined;
  /** The floating label; it names the field and the list. */
  label?: ReactNode;
  /** Text shown in the empty input. */
  placeholder?: string | undefined;
  /** Text under the field, such as a hint or an error message. */
  helperText?: ReactNode;
  /** Error colors and `aria-invalid`. */
  error?: boolean | undefined;
  /** Outline, tinted fill or underline. Default `"outlined"`. */
  variant?: TextFieldVariant | undefined;
  /** `medium` or `small` (dense). Default `"medium"`. */
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
 * (WAI-ARIA combobox), built from TextField, Chip, IconButton and Popover on `useAutocomplete`;
 * keys, clicks and blur are core's `createComboboxController`.
 */
function AutocompleteRender(
  {
    options,
    value,
    defaultValue,
    onChange,
    inputValue,
    onInputChange,
    open: openProp,
    onOpenChange,
    onHighlightChange,
    multiple = false,
    freeSolo = false,
    disableCloseOnSelect,
    disableClearable,
    openOnFocus,
    autoHighlight,
    autoComplete,
    autoSelect,
    blurOnSelect,
    clearOnBlur,
    clearOnEscape,
    disabledItemsFocusable,
    disableListWrap,
    filterSelectedOptions,
    handleHomeEndKeys,
    includeInputInList,
    readOnly,
    resetHighlightOnMouseLeave,
    selectOnFocus,
    filterOptions,
    getOptionLabel,
    getOptionKey,
    getOptionValue,
    isOptionEqualToValue,
    getOptionDisabled,
    groupBy,
    limitTags = -1,
    getLimitTagsText = defaultLimitTagsText,
    renderOption,
    renderGroup,
    renderValue,
    noOptionsText = "No options",
    loading,
    loadingText = "Loading…",
    clearText = "Clear",
    openText = "Open",
    closeText = "Close",
    clearIcon,
    popupIcon,
    forcePopupIcon = "auto",
    ListboxComponent = "ul",
    virtualize,
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
  }: AutocompleteProps<unknown, unknown>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [width, setWidth] = useState<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const control = useCallback(
    () => rootRef.current?.querySelector<HTMLElement>("[data-ok-text-field-control]") ?? null,
    [],
  );
  const state = useAutocomplete<unknown, unknown>(
    {
      options,
      value,
      defaultValue,
      onChange,
      inputValue,
      onInputChange,
      open: openProp,
      onOpenChange,
      onHighlightChange,
      multiple,
      freeSolo,
      disableCloseOnSelect,
      disableClearable,
      openOnFocus,
      autoHighlight,
      autoComplete,
      autoSelect,
      blurOnSelect,
      clearOnBlur,
      clearOnEscape,
      disabledItemsFocusable,
      disableListWrap,
      filterSelectedOptions,
      handleHomeEndKeys,
      includeInputInList,
      readOnly,
      resetHighlightOnMouseLeave,
      selectOnFocus,
      disabled,
      filterOptions,
      getOptionLabel,
      getOptionKey,
      getOptionValue,
      isOptionEqualToValue,
      getOptionDisabled,
      groupBy: virtualize ? undefined : groupBy,
      id: idProp,
      renderValue,
    },
    { onBeforeOpen: () => setWidth(control()?.offsetWidth) },
  );
  const { popupOpen: open, values, filteredOptions } = state;
  const rootProps = state.getRootProps();
  const mergedRef = useMergedRefs<HTMLDivElement>(
    ref,
    rootRef,
    rootProps.ref as Ref<HTMLDivElement>,
  );
  const { ref: inputRef, onChange: _onInput, ...inputProps } = state.getInputProps();

  // Virtualized list: the window of visible options drawn, between two paddings.
  const listRef = useRef<HTMLElement | null>(null);
  const [view, setView] = useState({
    scrollTop: 0,
    height: AUTOCOMPLETE_LIST_HEIGHT,
    stride: AUTOCOMPLETE_OPTION_STRIDE,
  });
  const count = filteredOptions.length;
  const range =
    virtualize && open ? virtualRange(view.scrollTop, view.height, view.stride, count) : undefined;
  const scrolledTo = useRef(-1);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!virtualize || !open || !list) return;
    const stride = optionStride(list);
    const height = list.clientHeight || AUTOCOMPLETE_LIST_HEIGHT;
    let { scrollTop } = list;
    // Bring a newly highlighted option into the drawn window (people may scroll away from it).
    if (state.highlightedIndex >= 0 && state.highlightedIndex !== scrolledTo.current)
      scrollTop = scrollToRow(scrollTop, height, stride, state.highlightedIndex);
    scrolledTo.current = state.highlightedIndex;
    if (scrollTop !== list.scrollTop) list.scrollTop = scrollTop;
    setView((was) =>
      was.stride === stride && was.height === height && was.scrollTop === scrollTop
        ? was
        : { stride, height, scrollTop },
    );
  });

  // Keep the highlighted option in view.
  const shownId = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    // A virtualized list renders on scroll: scroll to an option only once it is newly highlighted.
    if (!state.activeId || (virtualize && state.activeId === shownId.current)) return;
    const element = rootRef.current?.ownerDocument.getElementById(state.activeId);
    if (!element) return;
    shownId.current = state.activeId;
    element.scrollIntoView?.({ block: "nearest" });
  });

  const optionElement = (option: unknown, hidden: boolean, extra: Record<string, unknown> = {}) => {
    const { id: optionId, role: _role, ...optionProps } = state.getOptionProps({ option });
    return (
      // biome-ignore lint/a11y/useFocusableInteractive: focus stays in the input (aria-activedescendant), as the WAI-ARIA combobox pattern requires.
      <li
        key={optionId}
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: listbox options are list items (WAI-ARIA combobox, MUI).
        role="option"
        id={optionId}
        {...optionProps}
        {...extra}
        hidden={hidden || undefined}
      >
        {renderOption
          ? renderOption(option, { selected: state.isSelected(option) })
          : state.labelOf(option)}
      </li>
    );
  };

  let listContent: ReactNode = null;
  if (virtualize && !range) {
    // A closed virtualized list draws nothing.
  } else if (range) {
    listContent = filteredOptions.slice(range.start, range.end).map((option, i) =>
      optionElement(option, false, {
        "aria-setsize": count,
        "aria-posinset": range.start + i + 1,
      }),
    );
  } else if (groupBy) {
    const groups: { key: string; group: string; items: typeof state.items }[] = [];
    state.items.forEach((item, index) => {
      const last = groups[groups.length - 1];
      if (last && last.group === item.group) last.items.push(item);
      else groups.push({ key: String(index), group: item.group ?? "", items: [item] });
    });
    listContent = groups.map(({ key, group, items }) => {
      const children = items.map((item) => optionElement(item.option, !item.visible));
      if (renderGroup)
        return <Fragment key={key}>{renderGroup({ key, group, children })}</Fragment>;
      return (
        <Fragment key={key}>
          <ListSubheader
            role="presentation"
            hidden={!items.some((item) => item.visible) || undefined}
          >
            {group}
          </ListSubheader>
          {children}
        </Fragment>
      );
    });
  } else {
    listContent = state.items.map((item) => optionElement(item.option, !item.visible));
  }

  const focused = state.focused;
  const hiddenTags = !focused && limitTags >= 0 ? Math.max(values.length - limitTags, 0) : 0;
  const shown = multiple ? values : values.slice(0, 1);
  let tags: ReactNode;
  if (renderValue && shown.length > 0) {
    tags = (
      <InputAdornment position="start">
        {renderValue(multiple ? values : (values[0] as unknown), state.getItemProps)}
      </InputAdornment>
    );
  } else if (multiple && values.length > 0) {
    tags = (
      <InputAdornment position="start">
        {values.map((v, index) => {
          const {
            "data-ok-item-index": _index,
            tabIndex: _tab,
            ...item
          } = state.getItemProps({
            index,
          });
          return (
            <Chip
              key={item["data-ok-value"]}
              size="small"
              variant="soft"
              label={state.textOf(v)}
              hidden={index >= values.length - hiddenTags || undefined}
              {...item}
            />
          );
        })}
        {hiddenTags > 0 && <span data-ok-autocomplete-more="">{getLimitTagsText(hiddenTags)}</span>}
      </InputAdornment>
    );
  }

  const hasPopupIcon = forcePopupIcon === "auto" ? !freeSolo : forcePopupIcon;
  const showLoading = loading === true && count === 0;
  const listboxProps = state.getListboxProps();

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
        autoComplete,
        autoSelect,
        blurOnSelect,
        clearOnBlur,
        clearOnEscape,
        disabledItemsFocusable,
        disableListWrap,
        filterSelectedOptions,
        handleHomeEndKeys,
        includeInputInList,
        loading,
        readOnly,
        resetHighlightOnMouseLeave,
        selectOnFocus,
        virtualize,
      })}
      {...(open ? { "data-ok-open": "" } : {})}
      data-ok-runtime="off"
      onFocus={rootProps.onFocus}
      onBlur={rootProps.onBlur}
      {...props}
    >
      <TextField
        ref={inputRef as unknown as Ref<HTMLInputElement>}
        name={name}
        label={label}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        variant={variant}
        size={size}
        fullWidth
        {...inputProps}
        disabled={disabled}
        onChange={state.handleInputChange}
        startAdornment={tags}
        endAdornment={
          <InputAdornment position="end">
            {!disableClearable && (
              <IconButton
                {...state.getClearProps()}
                size="sm"
                aria-label={clearText}
                disabled={disabled}
              >
                {clearIcon ?? <ClearIcon />}
              </IconButton>
            )}
            {hasPopupIcon && (
              <IconButton
                {...state.getPopupIndicatorProps()}
                size="sm"
                aria-label={open ? closeText : openText}
                data-ok-label-open={openText}
                data-ok-label-close={closeText}
                disabled={disabled}
              >
                {popupIcon ?? <ToggleIcon />}
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
        onOpenChange={(next) => state.setPopupOpen(next, "outside")}
        data-ok-autocomplete-paper=""
        style={
          (width ? { "--_ok-autocomplete-width": `${width}px` } : undefined) as
            | CSSProperties
            | undefined
        }
      >
        <ListboxComponent
          {...listboxProps}
          ref={listRef}
          aria-label={typeof label === "string" ? label : undefined}
          {...(range
            ? {
                style: {
                  "--_ok-autocomplete-before": `${range.start * view.stride}px`,
                  "--_ok-autocomplete-after": `${(count - range.end) * view.stride}px`,
                } as CSSProperties,
                onScroll: (event: { currentTarget: HTMLElement }) => {
                  const top = event.currentTarget.scrollTop;
                  setView((was) => (was.scrollTop === top ? was : { ...was, scrollTop: top }));
                },
              }
            : {})}
        >
          {listContent}
        </ListboxComponent>
        {loading !== undefined && (
          <div data-ok-autocomplete-loading="" hidden={!showLoading || undefined}>
            {loadingText}
          </div>
        )}
        <div data-ok-autocomplete-no-options="" hidden={count > 0 || showLoading || undefined}>
          {noOptionsText}
        </div>
      </Popover>
    </div>
  );
}

/**
 * Autocomplete — spec: specs/components/autocomplete.md. A text field with a list of suggestions
 * (WAI-ARIA combobox), built from TextField, Chip, IconButton and Popover.
 */
export const Autocomplete = forwardRef(AutocompleteRender) as unknown as (<
  T = AutocompleteOption,
  V = string,
>(
  props: AutocompleteProps<AutocompleteOptionOf<T>, V> & {
    options: readonly (T | string)[];
  } & RefAttributes<HTMLDivElement>,
) => ReactElement | null) & { displayName?: string };

export type { AutocompleteValue };
