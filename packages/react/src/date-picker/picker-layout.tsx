"use client";

import type {
  PickerAction,
  PickerLocaleText,
  PickerOrientation,
  PickerValidDate,
  PickerValueType,
  PickerView,
} from "@owlky/core";
import {
  type ComponentType,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useContext,
} from "react";
import { Button } from "../button/button.js";
import { Chip } from "../chip/chip.js";
import type { DateCalendarSlotProps, DateCalendarSlots } from "../date-calendar/date-calendar.js";

/**
 * Layout customization of the pickers (phase 4, ADR-0030; MUI X `slots` / `slotProps`): the
 * layout, toolbar, action bar and shortcuts can be replaced; custom parts read and change the
 * picker through `usePickerContext()`.
 */

/** The picker's state and actions, for custom slots (MUI X `usePickerContext`). */
export interface PickerContextValue<TValue = PickerValidDate | null> {
  /** The value (the date adapter's type): a date or `null`, or a `[start, end]` range. */
  value: TValue;
  /** Changes the value (`accept` also accepts it, as a shortcut does). */
  setValue(value: TValue, options?: { accept?: boolean }): void;
  open: boolean;
  setOpen(open: boolean): void;
  view: PickerView;
  views: readonly PickerView[];
  setView(view: PickerView): void;
  /** The form shown: `desktop` (popover), `mobile` (dialog) or `static` (inline). */
  variant: "desktop" | "mobile" | "static";
  orientation: PickerOrientation;
  valueType: PickerValueType;
  disabled: boolean;
  readOnly: boolean;
  locale: string;
  localeText: PickerLocaleText;
  /** The action bar's actions. */
  acceptValueChanges(): void;
  cancelValueChanges(): void;
  clearValue(): void;
  setValueToToday(): void;
  /** Moves to the next view, or accepts on the last one. */
  goToNextStep(): void;
  hasNextStep: boolean;
  /** Range pickers: the end the next pick edits. */
  rangePosition?: "start" | "end" | undefined;
  setRangePosition?: ((position: "start" | "end") => void) | undefined;
}

// biome-ignore lint/suspicious/noExplicitAny: each picker provides its own value type.
export const PickerContext = createContext<PickerContextValue<any> | null>(null);

/**
 * The closest picker's state and actions (custom toolbars, action bars, layouts…); range pickers
 * give `usePickerContext<DateRange>()`.
 */
export function usePickerContext<TValue = PickerValidDate | null>(): PickerContextValue<TValue> {
  const context = useContext(PickerContext);
  if (!context) throw new Error("usePickerContext must be used inside a picker's slot.");
  return context as PickerContextValue<TValue>;
}

/** The parts a layout arranges (MUI X `usePickerLayout`): each is `null` when not shown. */
export interface PickerLayoutProps {
  toolbar: ReactNode;
  tabs: ReactNode;
  shortcuts: ReactNode;
  /** The views (calendar, clocks), without their wrapper: put them in `PickerLayoutContent`. */
  content: ReactNode;
  actionBar: ReactNode;
  orientation: PickerOrientation;
  /** Put it on the layout's root: the picker focuses the views inside it when it opens. */
  rootRef: Ref<HTMLDivElement>;
}

/** The layout's root (`div[data-ok-picker-layout]`): the grid that places the parts. */
export function PickerLayoutRoot({
  orientation = "portrait",
  rootRef,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  orientation?: PickerOrientation | undefined;
  rootRef?: Ref<HTMLDivElement> | undefined;
}) {
  return (
    <div ref={rootRef} data-ok-picker-layout="" data-ok-orientation={orientation} {...props} />
  );
}

/** The views' wrapper (`div[data-ok-picker-content]`). */
export function PickerLayoutContent(props: HTMLAttributes<HTMLDivElement>) {
  return <div data-ok-picker-content="" {...props} />;
}

/** The default layout: toolbar, tabs, shortcuts, views and action bar (MUI X `PickersLayout`). */
export function PickerLayout({
  toolbar,
  tabs,
  shortcuts,
  content,
  actionBar,
  orientation,
  rootRef,
}: PickerLayoutProps) {
  return (
    <PickerLayoutRoot rootRef={rootRef} orientation={orientation}>
      {toolbar}
      {tabs}
      {shortcuts}
      <PickerLayoutContent>{content}</PickerLayoutContent>
      {actionBar}
    </PickerLayoutRoot>
  );
}

/** Props of the action bar (the default `PickerActionBar` or `slots.actionBar`). */
export interface PickerActionBarProps {
  /** Every action rendered (responsive pickers render both forms'). */
  actions: readonly PickerAction[];
  /** The actions shown in the current form (the others are `hidden`). */
  shownActions: readonly PickerAction[];
  onAction(action: PickerAction): void;
  disabled: boolean;
  readOnly: boolean;
  localeText: PickerLocaleText;
  /** `nextOrAccept` reads "Next" (another view follows) or "OK". */
  hasNextStep: boolean;
}

/** The action bar: Clear, Today, Cancel, OK / Next (MUI X `PickersActionBar`). */
export function PickerActionBar({
  actions,
  shownActions,
  onAction,
  disabled,
  readOnly,
  localeText,
  hasNextStep,
}: PickerActionBarProps) {
  if (actions.length === 0) return null;
  const label = (action: PickerAction) =>
    action === "accept"
      ? localeText.okButtonLabel
      : action === "cancel"
        ? localeText.cancelButtonLabel
        : action === "clear"
          ? localeText.clearButtonLabel
          : action === "today"
            ? localeText.todayButtonLabel
            : hasNextStep
              ? localeText.nextStepButtonLabel
              : localeText.okButtonLabel;
  return (
    <div data-ok-picker-actions="" hidden={shownActions.length === 0 || undefined}>
      {actions.map((action) => (
        <Button
          key={action}
          data-ok-picker-action={action}
          variant={action === "accept" || action === "nextOrAccept" ? "contained" : "text"}
          color="inherit"
          hidden={!shownActions.includes(action) || undefined}
          disabled={disabled || (readOnly && action !== "cancel")}
          onClick={() => onAction(action)}
        >
          {label(action)}
        </Button>
      ))}
    </div>
  );
}

/** A shortcut as the shortcuts slot gets it. */
export interface PickerShortcutItem {
  label: string;
  id?: string | undefined;
  /** ISO value written as `data-ok-value` (HTML parity), when the shortcut has one. */
  iso: string | null;
  /** It can't be used (invalid value, or the picker is disabled / read-only). */
  disabled: boolean;
}

/** Props of the shortcuts list (the default `PickerShortcuts` or `slots.shortcuts`). */
export interface PickerShortcutsProps {
  items: readonly PickerShortcutItem[];
  /** Applies a shortcut: sets and accepts its value, then closes. */
  onShortcut(index: number): void;
  /** Name of the list. */
  label: string;
}

/** The shortcut chips (MUI X `PickersShortcuts`). */
export function PickerShortcuts({ items, onShortcut, label }: PickerShortcutsProps) {
  if (items.length === 0) return null;
  return (
    <ul data-ok-picker-shortcuts="" aria-label={label}>
      {items.map((item, index) => (
        <li key={item.id ?? item.label}>
          <Chip
            label={item.label}
            data-ok-picker-shortcut=""
            {...(item.iso ? { "data-ok-value": item.iso } : {})}
            disabled={item.disabled}
            onClick={() => onShortcut(index)}
          />
        </li>
      ))}
    </ul>
  );
}

/** Props of a custom toolbar (`slots.toolbar`); read the rest from `usePickerContext()`. */
export interface PickerToolbarProps<TValue = PickerValidDate | null> {
  /** The value (the date adapter's type): a date or `null`, or a range. */
  value: TValue;
  view: PickerView;
  views: readonly PickerView[];
  onViewChange(view: PickerView): void;
  /** Hidden in the desktop form of a responsive picker, or by `slotProps.toolbar.hidden`. */
  hidden: boolean;
  /** "Select date" (by value type). */
  title: string;
  /** The picker's own toolbar text ("Sun, May 25"). */
  text: string;
  orientation: PickerOrientation;
}

/** Replaceable parts of the date, time and date time pickers (MUI X `slots`). */
export interface PickerSlots<TValue = PickerValidDate | null> extends DateCalendarSlots {
  layout?: ComponentType<PickerLayoutProps> | undefined;
  toolbar?: ComponentType<PickerToolbarProps<TValue>> | undefined;
  actionBar?: ComponentType<PickerActionBarProps> | undefined;
  shortcuts?: ComponentType<PickerShortcutsProps> | undefined;
  /** The open button's icon (decorative). */
  openPickerIcon?: ComponentType | undefined;
}

/** Props for the slots (MUI X `slotProps`). */
export interface PickerSlotProps extends DateCalendarSlotProps {
  /** `hidden: true` leaves the toolbar out (mobile and static forms show it by default). */
  toolbar?: ({ hidden?: boolean | undefined } & Record<string, unknown>) | undefined;
  /** `hidden: true` leaves the date / time tabs out (date time pickers). */
  tabs?: { hidden?: boolean | undefined } | undefined;
  /** Extra props for a custom layout. */
  layout?: Record<string, unknown> | undefined;
}
