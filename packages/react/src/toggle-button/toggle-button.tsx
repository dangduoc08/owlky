"use client";

import {
  fromSelection,
  nextToggleSelection,
  type Orientation,
  type ToggleButtonColor,
  type ToggleButtonSize,
  type ToggleGroupValue,
  toggleButtonAttributes,
  toggleGroupAttributes,
  toSelection,
} from "@minimal-tailwind/core";
import {
  type ButtonHTMLAttributes,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  useContext,
  useMemo,
} from "react";
import { useControllableState } from "../utils/use-controllable-state.js";

interface ToggleGroupContextValue {
  selection: readonly string[];
  toggle(value: string): void;
  color: ToggleButtonColor | undefined;
  size: ToggleButtonSize | undefined;
  disabled: boolean | undefined;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

export interface ToggleButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color" | "value" | "onChange"> {
  /** Identifies the button inside a `ToggleButtonGroup`. */
  value?: string | undefined;
  /** Default `"inherit"` (or the group's color). */
  color?: ToggleButtonColor | undefined;
  /** Standalone `sm` 40 · `md` 48 · `lg` 56; in a group 30 / 38 / 46. Default `"md"`. */
  size?: ToggleButtonSize | undefined;
  /** Standalone, controlled: pressed state. */
  selected?: boolean | undefined;
  /** Standalone, uncontrolled: initial pressed state. */
  defaultSelected?: boolean | undefined;
  /** Standalone: called with the requested pressed state. */
  onChange?: ((selected: boolean) => void) | undefined;
}

/**
 * ToggleButton — spec: specs/components/toggle-button.md. A native button with `aria-pressed`.
 * Inside a `ToggleButtonGroup` the group owns the state; standalone it is controlled with
 * `selected` / `onChange` or uncontrolled with `defaultSelected`.
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(
  { value, color, size, selected, defaultSelected = false, onChange, onClick, disabled, ...props },
  ref,
) {
  const group = useContext(ToggleGroupContext);
  const inGroup = group !== null && value !== undefined;
  const [standalone, setStandalone] = useControllableState({
    value: selected,
    defaultValue: defaultSelected,
    onChange,
  });
  const pressed = inGroup ? group.selection.includes(value) : standalone;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (inGroup) group.toggle(value);
    else setStandalone(!pressed);
  };

  return (
    <button
      ref={ref}
      type="button"
      {...toggleButtonAttributes({ color: color ?? group?.color, size: size ?? group?.size })}
      data-mt-runtime={group === null ? "off" : undefined}
      {...props}
      value={value}
      aria-pressed={pressed}
      disabled={disabled ?? group?.disabled}
      onClick={handleClick}
    />
  );
});

export interface ToggleButtonGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "color" | "defaultValue" | "onChange"> {
  /** At most one pressed button. Values are `string | null` instead of `string[]`. */
  exclusive?: boolean | undefined;
  /** Controlled value: `string | null` when exclusive, `string[]` otherwise. */
  value?: ToggleGroupValue | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: ToggleGroupValue | undefined;
  /** Called with the requested value (same shape as `value`). */
  onChange?: ((value: ToggleGroupValue) => void) | undefined;
  /** Default `"horizontal"`. */
  orientation?: Orientation | undefined;
  /** Passed to every ToggleButton that doesn't set its own. */
  color?: ToggleButtonColor | undefined;
  size?: ToggleButtonSize | undefined;
  disabled?: boolean | undefined;
}

/** ToggleButtonGroup — spec: specs/components/toggle-button.md. A `role="group"` of ToggleButtons. */
export const ToggleButtonGroup = forwardRef<HTMLDivElement, ToggleButtonGroupProps>(
  function ToggleButtonGroup(
    {
      exclusive = false,
      value,
      defaultValue,
      onChange,
      orientation,
      color,
      size,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableState<ToggleGroupValue>({
      value,
      defaultValue: defaultValue ?? (exclusive ? null : []),
      onChange,
    });
    const context = useMemo<ToggleGroupContextValue>(() => {
      const selection = toSelection(current);
      return {
        selection,
        toggle: (pressed) =>
          setCurrent(fromSelection(nextToggleSelection(selection, pressed, exclusive), exclusive)),
        color,
        size,
        disabled,
      };
    }, [current, setCurrent, exclusive, color, size, disabled]);

    return (
      // biome-ignore lint/a11y/useSemanticElements: a group of buttons, not form fields (<fieldset> would add form semantics and default styles).
      <div
        ref={ref}
        role="group"
        data-mt-runtime="off"
        {...toggleGroupAttributes({ orientation, exclusive })}
        {...props}
      >
        <ToggleGroupContext.Provider value={context}>{children}</ToggleGroupContext.Provider>
      </div>
    );
  },
);
