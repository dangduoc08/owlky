"use client";

import {
  createSelectController,
  initialSelectOption,
  inputLabelAttributes,
  type Placement,
  type SelectCloseReason,
  type SelectionControlColor,
  type SelectionControlSize,
  sameSelectValue,
  selectAttributes,
  selectOptionValue,
  serializeSelectValue,
  syncSelectPaperWidth,
  type TextFieldVariant,
} from "@owlky/core";
import {
  type ChangeEvent,
  Children,
  cloneElement,
  Fragment,
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FormLabel, type FormLabelProps, useFormControl } from "../form-control/form-control.js";
import { ListSubheader } from "../list/list.js";
import { Popover } from "../popover/popover.js";
import { useMergedRefs } from "../utils/refs.js";

/** A value of one option. Values compare as strings (`10` and `"10"` are the same option). */
export type SelectValue = string | number;
/** The value of a select: one value (`""` = none), or a list with `multiple`. */
export type SelectValueType = SelectValue | readonly SelectValue[];

export type { SelectCloseReason };

/** The select's arrow (decorative, same SVG as the HTML snippets). */
function SelectIcon(props: HTMLAttributes<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path
        d="m7 10 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Props of the menu that holds the options (MUI `MenuProps`). */
export interface SelectMenuProps {
  /** Side of the field and alignment. Default `"bottom-start"`. */
  placement?: Placement | undefined;
  /** Props of the popover paper (`className`, `style`, `aria-*`…). */
  paperProps?: HTMLAttributes<HTMLDivElement> | undefined;
  /** Props of the listbox (`ul[role=listbox]`). */
  listProps?: HTMLAttributes<HTMLUListElement> | undefined;
}

/** Options shared by Select and TextField's listbox select. */
export interface SelectBehaviorProps<V extends SelectValueType = SelectValueType> {
  /** Controlled value: one value (`""` = none) or, with `multiple`, a list. */
  value?: V | undefined;
  /** Uncontrolled initial value. Default `""` (`[]` with `multiple`). */
  defaultValue?: V | undefined;
  /** Called with the new value (the options' own values, numbers stay numbers). */
  onChange?: ((value: V) => void) | undefined;
  /** Several values: options toggle and the list stays open. */
  multiple?: boolean | undefined;
  /** The list takes its options' width instead of at least the field's. */
  autoWidth?: boolean | undefined;
  /** Show the empty value (`renderValue("")`, or the option whose value is `""`). */
  displayEmpty?: boolean | undefined;
  /** What the field shows for the value. Default: the selected options' content. */
  renderValue?: ((value: V) => ReactNode) | undefined;
  /** Controlled open state. */
  open?: boolean | undefined;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean | undefined;
  /** Called when the select asks to open or close, with the reason of a close. */
  onOpenChange?: ((open: boolean, reason?: SelectCloseReason) => void) | undefined;
  /** Props of the menu (placement, paper, list). */
  menuProps?: SelectMenuProps | undefined;
}

export interface SelectProps<V extends SelectValueType = SelectValueType>
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "color">,
    SelectBehaviorProps<V> {
  /** A native `<select>` (pass `<option>` elements) instead of the listbox. */
  native?: boolean | undefined;
  /** Outline, tinted fill or underline. Default: the FormControl's, else `"outlined"`. */
  variant?: TextFieldVariant | undefined;
  /** `medium` or `small`. Default: the FormControl's, else `"medium"`. */
  size?: SelectionControlSize | undefined;
  /** Focus color; `default` is the text color. Default: the FormControl's, else `"default"`. */
  color?: SelectionControlColor | undefined;
  /** The outline's notch text: the same text as the InputLabel (outlined). */
  label?: ReactNode;
  /** `id` of the InputLabel that names the select. */
  labelId?: string | undefined;
  /** `id` of the trigger (or of the native select). Default: generated. */
  id?: string | undefined;
  /** Name of the form value (the hidden input, or the native select). */
  name?: string | undefined;
  /** Error colors and `aria-invalid`. Default: the FormControl's. */
  error?: boolean | undefined;
  /** Can't be opened or changed. Default: the FormControl's. */
  disabled?: boolean | undefined;
  /** Required in a form. Default: the FormControl's. */
  required?: boolean | undefined;
  /** Can't be opened (the value still shows). */
  readOnly?: boolean | undefined;
  /** Stretch to the container width. Default: the FormControl's. */
  fullWidth?: boolean | undefined;
  /** Props of the hidden input (or of the native select). */
  inputProps?: InputHTMLAttributes<HTMLInputElement & HTMLSelectElement> | undefined;
  /** Ref of the hidden input (or of the native select). */
  inputRef?: Ref<HTMLInputElement & HTMLSelectElement> | undefined;
  /** Props of the trigger (`[role=combobox]`; MUI `SelectDisplayProps`). */
  displayProps?: HTMLAttributes<HTMLDivElement> | undefined;
  /** `MenuItem`s (and `ListSubheader`s), or `<option>`s with `native`. */
  children?: ReactNode;
}

interface ChildOption {
  value: SelectValue;
  content: ReactNode;
}

const isFilled = (value: unknown) =>
  value !== undefined &&
  value !== null &&
  value !== "" &&
  !(Array.isArray(value) && value.length === 0);

/** Parts of a listbox select, laid out by Select (its own field box) or by TextField. */
interface SelectRootProps extends SelectBehaviorProps {
  host: "select" | "text-field";
  rootProps: HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, string | undefined>;
  rootRef: Ref<HTMLDivElement>;
  triggerId: string;
  labelId?: string | undefined;
  name?: string | undefined;
  error: boolean;
  disabled: boolean;
  required: boolean;
  readOnly: boolean;
  triggerAria: Pick<
    HTMLAttributes<HTMLDivElement>,
    "aria-label" | "aria-labelledby" | "aria-describedby"
  >;
  displayProps?: HTMLAttributes<HTMLDivElement> | undefined;
  inputProps?: InputHTMLAttributes<HTMLInputElement> | undefined;
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** TextField: adornments around the trigger and its outline after it. */
  start?: ReactNode;
  end?: ReactNode;
  outline?: ReactNode;
  children?: ReactNode;
}

/** @internal The listbox select's parts (the trigger, the hidden input, the icon, the menu). */
export function SelectRoot({
  host,
  rootProps,
  rootRef,
  triggerId,
  labelId,
  name,
  error,
  disabled,
  required,
  readOnly,
  triggerAria,
  displayProps,
  inputProps,
  inputRef,
  start,
  end,
  outline,
  value,
  defaultValue,
  onChange,
  multiple = false,
  autoWidth = false,
  displayEmpty = false,
  renderValue,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  menuProps,
  children,
}: SelectRootProps) {
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = useMergedRefs(ownRef, rootRef);
  const triggerRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<HTMLElement | null>(null);

  const [internal, setInternal] = useState<SelectValueType>(defaultValue ?? (multiple ? [] : ""));
  const current = value !== undefined ? value : internal;
  const [openState, setOpenState] = useState(defaultOpen);
  const isOpen = openProp ?? openState;

  // A single value of `""` still selects the option whose value is `""` (MUI).
  const values: readonly SelectValue[] = multiple
    ? Array.isArray(current)
      ? current
      : []
    : current === null || current === undefined || Array.isArray(current)
      ? []
      : [current as SelectValue];
  const selected = (option: SelectValue) => values.some((v) => sameSelectValue(v, option));

  // Options (cloned with their role, state and value) and what the field shows.
  const found: ChildOption[] = [];
  const items = Children.map(children, (child) => {
    if (!isValidElement<{ role?: string; value?: unknown; children?: ReactNode }>(child))
      return child;
    if (child.type === ListSubheader)
      return cloneElement(child, { role: child.props.role ?? "presentation" });
    if (!("value" in child.props)) return child;
    const optionValue = child.props.value as SelectValue;
    const isSelected = selected(optionValue);
    found.push({ value: optionValue, content: child.props.children as ReactNode });
    const option: Record<string, unknown> = {
      role: "option",
      value: undefined,
      selected: isSelected,
      "aria-selected": isSelected,
      "data-ok-value": String(optionValue),
    };
    return cloneElement(child, option);
  });

  let display: ReactNode = null;
  if (isFilled(current) || displayEmpty) {
    if (renderValue) display = renderValue(current);
    else if (multiple)
      display = found
        .filter((option) => selected(option.value))
        .map((option, index) => (
          <Fragment key={String(option.value)}>
            {index === 0 ? null : ", "}
            {option.content}
          </Fragment>
        ));
    else display = found.find((option) => sameSelectValue(option.value, current))?.content ?? null;
  }

  // Latest props for the controller (attached once).
  const controlled = value !== undefined;
  const latest = useRef({ isOpen, disabled, readOnly, autoWidth, multiple, values, found });
  latest.current = { isOpen, disabled, readOnly, autoWidth, multiple, values, found };
  const handlers = useRef({ onChange, onOpenChange, openProp, controlled });
  handlers.current = { onChange, onOpenChange, openProp, controlled };

  const requestOpen = useCallback((next: boolean, reason?: SelectCloseReason) => {
    if (handlers.current.openProp === undefined) setOpenState(next);
    if (next) handlers.current.onOpenChange?.(true);
    else handlers.current.onOpenChange?.(false, reason);
  }, []);

  useEffect(() => {
    const controller = createSelectController(ownRef.current as HTMLDivElement, {
      isOpen: () => latest.current.isOpen,
      isInert: () => latest.current.disabled || latest.current.readOnly,
      autoWidth: () => latest.current.autoWidth,
      onOpen: (focus) => {
        pendingFocus.current = focus;
        requestOpen(true);
      },
      onClose: (reason) => requestOpen(false, reason),
      onPick: (option) => {
        const key = selectOptionValue(option);
        const { multiple: many, values: now, found: options } = latest.current;
        const picked = options.find((o) => String(o.value) === key)?.value ?? key;
        const next = many
          ? now.some((v) => sameSelectValue(v, picked))
            ? now.filter((v) => !sameSelectValue(v, picked))
            : [...now, picked]
          : picked;
        if (!handlers.current.controlled) setInternal(next);
        handlers.current.onChange?.(next);
        if (!many) requestOpen(false, "select");
      },
    });
    return () => controller.destroy();
  }, [requestOpen]);

  // Opened from outside (controlled `open`, `defaultOpen`): the popover takes the field's width.
  useLayoutEffect(() => {
    if (isOpen && ownRef.current) syncSelectPaperWidth(ownRef.current, autoWidth);
  }, [isOpen, autoWidth]);

  const anchor = useCallback(() => triggerRef.current, []);
  const listboxId = `${triggerId}-listbox`;
  const iconProps =
    host === "text-field"
      ? { "data-ok-text-field-select-icon": "", "data-ok-select-icon": "" }
      : { "data-ok-select-icon": "" };
  const listProps = menuProps?.listProps;

  return (
    <div ref={ref} {...rootProps} data-ok-runtime="off">
      {start}
      <div
        ref={triggerRef}
        {...(host === "text-field" ? { "data-ok-text-field-input": "" } : {})}
        data-ok-select-display=""
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        id={triggerId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={triggerAria["aria-labelledby"] ?? labelId}
        aria-label={triggerAria["aria-label"]}
        aria-describedby={triggerAria["aria-describedby"]}
        aria-disabled={disabled ? true : undefined}
        aria-readonly={readOnly ? true : undefined}
        aria-invalid={error ? true : undefined}
        aria-required={required ? true : undefined}
        {...displayProps}
      >
        {display}
      </div>
      <input
        ref={inputRef}
        data-ok-select-input=""
        aria-hidden="true"
        tabIndex={-1}
        name={name}
        value={serializeSelectValue(values.map(String))}
        // `:placeholder-shown` tells the CSS whether there's a value (the label floats).
        placeholder=" "
        disabled={disabled}
        required={required}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          // Browser autofill writes the hidden input: pick the matching option.
          const typed = event.currentTarget.value;
          const options = latest.current.found;
          const picked = multiple
            ? typed
                .split(",")
                .map((part) => options.find((o) => String(o.value) === part)?.value)
                .filter((v): v is SelectValue => v !== undefined)
            : options.find((o) => String(o.value) === typed)?.value;
          if (picked === undefined) return;
          if (value === undefined) setInternal(picked);
          onChange?.(picked);
        }}
        {...inputProps}
      />
      <SelectIcon {...iconProps} />
      {end}
      {outline}
      <Popover
        open={isOpen}
        anchorEl={anchor}
        onOpenChange={(_open, reason) => requestOpen(false, reason)}
        placement={menuProps?.placement ?? "bottom-start"}
        id={`${triggerId}-menu`}
        tabIndex={-1}
        initialFocus={() => {
          const target =
            pendingFocus.current ??
            initialSelectOption(ownRef.current?.querySelector("[data-ok-select-listbox]"));
          pendingFocus.current = null;
          return target;
        }}
        {...menuProps?.paperProps}
      >
        <ul
          data-ok-select-listbox=""
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the WAI-ARIA listbox pattern on a list (MUI).
          role="listbox"
          id={listboxId}
          aria-labelledby={labelId}
          aria-multiselectable={multiple ? true : undefined}
          {...listProps}
        >
          {items}
        </ul>
      </Popover>
    </div>
  );
}

/**
 * Select — spec: specs/components/select.md (ADR-0045). A field that opens a listbox of
 * `MenuItem`s in a Popover (the WAI-ARIA select-only combobox; focus moves onto the options), or a
 * native `<select>` with `native`. Put it in a `FormControl` with an `InputLabel`: it takes the
 * FormControl's variant, size, color and states. `ref` goes to the field box.
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(function Select(
  {
    native = false,
    variant,
    size,
    color,
    label,
    labelId,
    id,
    name,
    error,
    disabled,
    required,
    readOnly = false,
    fullWidth,
    inputProps,
    inputRef,
    displayProps,
    value,
    defaultValue,
    onChange,
    multiple,
    autoWidth,
    displayEmpty,
    renderValue,
    open,
    defaultOpen,
    onOpenChange,
    menuProps,
    children,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const control = useFormControl();
  const generated = useId();
  const triggerId = id ?? generated;
  const isError = error ?? control?.error ?? false;
  const isDisabled = disabled ?? control?.disabled ?? false;
  const isRequired = required ?? control?.required ?? false;
  const attributes = selectAttributes({
    variant: variant ?? control?.variant,
    size: size ?? control?.size,
    color: color ?? control?.color,
    error: isError,
    fullWidth: fullWidth ?? control?.fullWidth,
    multiple,
    autoWidth,
    displayEmpty,
  });
  const outline =
    attributes["data-ok-variant"] === "outlined" ? (
      <fieldset data-ok-select-outline="" aria-hidden="true">
        {label != null && (
          <legend>
            <span>
              {label}
              {isRequired ? " *" : null}
            </span>
          </legend>
        )}
      </fieldset>
    ) : null;

  if (native) {
    return (
      <div ref={ref} {...attributes} {...props}>
        <select
          ref={inputRef}
          data-ok-select-native=""
          id={triggerId}
          name={name}
          multiple={multiple}
          disabled={isDisabled}
          required={isRequired}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={isError ? true : undefined}
          value={value as string | readonly string[] | undefined}
          defaultValue={defaultValue as string | readonly string[] | undefined}
          onChange={(event) => {
            const select = event.currentTarget;
            const next = multiple
              ? [...select.selectedOptions].map((option) => option.value)
              : select.value;
            (onChange as ((value: SelectValueType) => void) | undefined)?.(next);
          }}
          {...inputProps}
        >
          {children}
        </select>
        {multiple ? null : <SelectIcon data-ok-select-icon="" />}
        {outline}
      </div>
    );
  }

  return (
    <SelectRoot
      host="select"
      rootProps={{ ...attributes, ...props }}
      rootRef={ref}
      triggerId={triggerId}
      labelId={labelId}
      name={name}
      error={isError}
      disabled={isDisabled}
      required={isRequired}
      readOnly={readOnly}
      triggerAria={{
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": ariaDescribedBy,
      }}
      displayProps={displayProps}
      inputProps={inputProps}
      inputRef={inputRef}
      outline={outline}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      multiple={multiple}
      autoWidth={autoWidth}
      displayEmpty={displayEmpty}
      renderValue={renderValue}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      menuProps={menuProps}
    >
      {children}
    </SelectRoot>
  );
}) as <V extends SelectValueType = SelectValueType>(
  props: SelectProps<V> & RefAttributes<HTMLDivElement>,
) => ReactElement | null;

export interface InputLabelProps extends FormLabelProps {
  /** Keep the label above the field even when it is empty. */
  shrink?: boolean | undefined;
  /** The label moves without a transition. */
  disableAnimation?: boolean | undefined;
}

/**
 * InputLabel — the label of a Select in a FormControl: a FormLabel that floats in the field
 * (resting inside it, above it with focus or a value). Give it an `id` and pass it to the
 * Select's `labelId`.
 */
export const InputLabel = forwardRef<HTMLElement, InputLabelProps>(function InputLabel(
  { shrink, disableAnimation, ...props },
  ref,
) {
  return <FormLabel ref={ref} {...inputLabelAttributes({ shrink, disableAnimation })} {...props} />;
});
