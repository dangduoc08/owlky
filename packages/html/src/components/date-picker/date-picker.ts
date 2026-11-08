import {
  type DateView,
  datePickerOptions,
  defaultCloseOnSelect,
  defaultPickerActions,
  focusCalendar,
  formatAccessibleDate,
  formatIsoDate,
  initialView,
  invalidDate,
  isValidDate,
  nextView,
  normalizeDateViews,
  type PickerAction,
  type PickerLocaleText,
  type PickerOpenReason,
  type PickerShortcut,
  parseIsoDate,
  parsePickerActions,
  pickerToolbarText,
  readStyle,
  resolvePickerMode,
  setDateParts,
  shortcutValue,
  startOfDay,
  validateDate,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import type { DateCalendarInstance } from "../date-calendar/date-calendar.js";
import {
  asFunction,
  type RuleFunctions,
  readLocale,
  readLocaleText,
  readRules,
  toDate,
} from "../date-calendar/picker-dom.js";
import type { DateFieldInstance } from "../date-field/date-field.js";
import type { DialogInstance } from "../dialog/dialog.js";
import type { PopoverInstance } from "../popover/popover.js";

export interface DatePickerInstance extends ComponentInstance {
  /** ISO date, or `null`. */
  readonly value: string | null;
  /** Sets the value (ISO string, `Date` or `null`) without events. */
  setValue(value: string | Date | null): void;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  /** Shortcut chips computed by functions (markup chips carry a fixed `data-ok-value`). */
  setShortcuts(shortcuts: readonly PickerShortcut[]): void;
  setShouldDisableDate(fn: ((day: Date) => boolean) | null): void;
  setShouldDisableMonth(fn: ((month: Date) => boolean) | null): void;
  setShouldDisableYear(fn: ((year: Date) => boolean) | null): void;
  setLocaleText(text: Partial<PickerLocaleText>): void;
}

const {
  pickerVariant: variantSpec,
  closeOnSelect: closeSpec,
  keepOpenDuringFieldFocus,
} = datePickerOptions.options;

/**
 * Date picker — spec: specs/components/date-picker.md
 *
 * Markup:  <div data-ok-date-picker data-ok-picker-variant="responsive" data-ok-orientation="portrait"
 *               [data-ok-actions="cancel accept"] [data-ok-close-on-select="false"] [data-ok-desktop-mode-media-query]>
 *            …a date field whose end adornment holds button[data-ok-date-picker-open]…
 *            <div data-ok-popover data-ok-date-picker-paper popover="manual" role="dialog" …>   (desktop, responsive)
 *              <div data-ok-picker-layout>…toolbar, shortcuts, div[data-ok-picker-content] › date calendar, actions…</div>
 *            </div>
 *            <dialog data-ok-dialog data-ok-date-picker-dialog …><div data-ok-dialog-paper></div></dialog>  (mobile, responsive)
 *          </div>
 * Behavior: the open button opens the layout in the popover (desktop) or moves it into the dialog
 *          (mobile, chosen by the media query); picks, actions and shortcuts follow MUI's lifecycle.
 * Events:  ok:date-picker:change (`{ value, validationError }`), ok:date-picker:accept (`{ value }`),
 *          ok:date-picker:open / close (`{ reason }`).
 */
export const datePicker = defineComponent<DatePickerInstance>({
  name: "date-picker",
  selector: "[data-ok-date-picker]",

  setup(element, { emit, signal, runtime }) {
    const variant = readStyle(element, variantSpec);
    const isStatic = variant === "static";
    const fieldEl = element.querySelector<HTMLElement>(":scope > [data-ok-date-field]");
    const layout = element.querySelector<HTMLElement>("[data-ok-picker-layout]") as HTMLElement;
    const calendarEl = layout.querySelector<HTMLElement>("[data-ok-date-calendar]") as HTMLElement;
    const paper = element.querySelector<HTMLElement>(":scope > [data-ok-date-picker-paper]");
    const dialogEl = element.querySelector<HTMLElement>(":scope > [data-ok-date-picker-dialog]");
    const dialogPaper = dialogEl?.querySelector<HTMLElement>("[data-ok-dialog-paper]") ?? null;
    const openButton = element.querySelector<HTMLButtonElement>("[data-ok-date-picker-open]");
    const toolbar = layout.querySelector<HTMLElement>(":scope > [data-ok-picker-toolbar]");
    const toolbarTitle =
      toolbar?.querySelector<HTMLElement>("[data-ok-picker-toolbar-title]") ?? null;
    const actionsBar = layout.querySelector<HTMLElement>(":scope > [data-ok-picker-actions]");
    const shortcutsList = layout.querySelector<HTMLElement>(":scope > [data-ok-picker-shortcuts]");
    const locale = readLocale(element);
    let overrides: Partial<PickerLocaleText> | undefined;
    let text = readLocaleText(element);
    const functions: RuleFunctions = {};
    let shortcuts: readonly PickerShortcut[] | undefined;

    const field = () =>
      fieldEl ? runtime.getOrCreate<DateFieldInstance>(fieldEl, "date-field") : undefined;
    const calendar = () =>
      runtime.getOrCreate<DateCalendarInstance>(
        calendarEl,
        "date-calendar",
      ) as DateCalendarInstance;
    const popover = () =>
      paper ? runtime.getOrCreate<PopoverInstance>(paper, "popover") : undefined;
    const dialog = () =>
      dialogEl ? runtime.getOrCreate<DialogInstance>(dialogEl, "dialog") : undefined;
    const views = normalizeDateViews(calendarEl.getAttribute("data-ok-views")?.split(/\s+/));
    const rules = () => readRules(calendarEl, functions);
    const isDisabled = () => calendarEl.hasAttribute("data-ok-disabled");
    const isReadOnly = () => fieldEl?.hasAttribute("data-ok-read-only") === true;

    let value: Date | null = parseIsoDate(
      fieldEl?.getAttribute("data-ok-value") ?? calendarEl.getAttribute("data-ok-value"),
    );
    let open = false;
    let mode: "desktop" | "mobile" | "static" = isStatic
      ? "static"
      : variant === "mobile"
        ? "mobile"
        : "desktop";
    let valueOnOpen = value;
    let lastAccepted = value;

    const iso = (date: Date | null) => (date && isValidDate(date) ? formatIsoDate(date) : null);
    const actionsShown = (): PickerAction[] =>
      parsePickerActions(element.getAttribute("data-ok-actions")) ?? defaultPickerActions(mode);
    const closeOnSelect = () =>
      element.hasAttribute(closeSpec.attr)
        ? element.getAttribute(closeSpec.attr) !== "false"
        : isStatic
          ? false
          : defaultCloseOnSelect(mode);

    const render = () => {
      if (toolbar) toolbar.hidden = mode === "desktop";
      if (toolbarTitle)
        toolbarTitle.textContent = pickerToolbarText(
          isValidDate(value) ? value : null,
          locale,
          text.toolbarEmptyText,
        );
      const shown = actionsShown();
      if (actionsBar) {
        actionsBar.hidden = shown.length === 0;
        for (const button of actionsBar.querySelectorAll<HTMLElement>("[data-ok-picker-action]")) {
          const action = button.getAttribute("data-ok-picker-action") as PickerAction;
          button.hidden = !shown.includes(action);
          if (action === "nextOrAccept")
            button.textContent = nextView(views, calendar().view)
              ? text.nextStepButtonLabel
              : text.okButtonLabel;
        }
      }
      openButton?.setAttribute(
        "aria-label",
        text.openDatePickerDialogue(
          isValidDate(value) ? formatAccessibleDate(value, locale) : null,
        ),
      );
      element.toggleAttribute("data-ok-open", open);
    };

    /** A new value from the field, the calendar, an action or a shortcut. */
    const change = (next: Date | null, from?: "field" | "calendar") => {
      if (iso(next) === iso(value) && (next === null) === (value === null)) return;
      value = next;
      // The field ignores invalid dates (it shows them already).
      if (from !== "field") field()?.setValue(next);
      if (from !== "calendar" && (next === null || isValidDate(next))) calendar().setValue(next);
      emit("change", { value: iso(next), validationError: validateDate(next, rules()) });
      render();
    };
    const accept = (next: Date | null) => {
      if (isStatic) valueOnOpen = next;
      if (iso(next) === iso(lastAccepted)) return;
      lastAccepted = next;
      emit("accept", { value: iso(next) });
    };

    const close = (reason: PickerOpenReason) => {
      if (!open || isStatic) return;
      open = false;
      if (mode === "desktop") popover()?.close();
      else dialog()?.close();
      // Focus goes back to the open button, unless it already moved elsewhere (the field).
      const active = element.ownerDocument.activeElement;
      if (active === null || active === element.ownerDocument.body || layout.contains(active))
        openButton?.focus();
      render();
      emit("close", { reason });
    };
    const dismiss = (reason: PickerOpenReason) => {
      if (mode === "mobile") change(valueOnOpen);
      else accept(value);
      close(reason);
    };
    const openPicker = (reason: PickerOpenReason) => {
      if (open || isStatic || isDisabled() || isReadOnly()) return;
      mode = resolvePickerMode(
        variant,
        element.getAttribute("data-ok-desktop-mode-media-query") ?? undefined,
        element.ownerDocument.defaultView as (Window & typeof globalThis) | null,
      );
      // The layout lives where it shows: the popover (desktop) or the dialog's paper (mobile).
      if (mode === "mobile" && dialogPaper && layout.parentElement !== dialogPaper)
        dialogPaper.append(layout);
      if (mode === "desktop" && paper && layout.parentElement !== paper) paper.append(layout);
      valueOnOpen = value;
      const first = calendarEl.getAttribute("data-ok-open-to") as DateView | null;
      calendar().setView(initialView(views, first ?? undefined));
      open = true;
      render();
      const anchor = fieldEl?.querySelector("[data-ok-text-field-control]");
      if (mode === "desktop") popover()?.open(anchor ?? element);
      else dialog()?.open(openButton);
      focusCalendar(layout);
      emit("open", { reason });
    };

    const runAction = (action: PickerAction) => {
      switch (action) {
        case "accept":
          accept(value);
          close("accept");
          break;
        case "cancel":
          change(valueOnOpen);
          close("cancel");
          break;
        case "clear":
          change(null);
          accept(null);
          close("clear");
          break;
        case "today": {
          const now = startOfDay(new Date());
          const next =
            value && isValidDate(value)
              ? setDateParts(now, {
                  hours: value.getHours(),
                  minutes: value.getMinutes(),
                  seconds: value.getSeconds(),
                })
              : now;
          change(next);
          accept(next);
          close("today");
          break;
        }
        case "nextOrAccept": {
          const after = nextView(views, calendar().view);
          if (after) {
            calendar().setView(after);
            render();
          } else {
            accept(value);
            close("accept");
          }
          break;
        }
      }
    };

    openButton?.addEventListener("click", () => (open ? dismiss("button") : openPicker("button")), {
      signal,
    });
    fieldEl?.addEventListener(
      "focusin",
      (event) => {
        if (!open || mode !== "desktop" || element.hasAttribute(keepOpenDuringFieldFocus.attr))
          return;
        if (event.target === openButton) return;
        dismiss("clickaway");
      },
      { signal },
    );
    element.addEventListener(
      "ok:date-field:change",
      (event) => {
        if (event.target !== fieldEl) return;
        const detail = (
          event as CustomEvent<{ value: string | null; validationError: string | null }>
        ).detail;
        // A partly filled field reports `null` with "invalidDate": the value becomes an invalid
        // date (as in React), and the calendar stays where it is.
        const date = parseIsoDate(detail.value);
        change(date ?? (detail.validationError === "invalidDate" ? invalidDate() : null), "field");
      },
      { signal },
    );
    element.addEventListener(
      "ok:date-calendar:change",
      (event) => {
        if (event.target !== calendarEl) return;
        const detail = (event as CustomEvent<{ value: string; selectionState: string }>).detail;
        const date = parseIsoDate(detail.value);
        if (!date) return;
        // The calendar applies its own value after this event.
        queueMicrotask(() => {
          change(date, "calendar");
          if (detail.selectionState !== "finish" || !closeOnSelect()) return;
          accept(date);
          close("select");
        });
      },
      { signal },
    );
    element.addEventListener("ok:date-calendar:viewchange", () => render(), { signal });
    layout.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element;
        const action = target.closest<HTMLButtonElement>("[data-ok-picker-action]");
        if (action && layout.contains(action)) {
          runAction(action.getAttribute("data-ok-picker-action") as PickerAction);
          return;
        }
        const chip = target.closest("[data-ok-picker-shortcut]");
        if (!chip || !target.closest("[data-ok-chip-action]")) return;
        // A shortcut chip always sits in the shortcuts list.
        const index = [
          ...(shortcutsList as HTMLElement).querySelectorAll("[data-ok-picker-shortcut]"),
        ].indexOf(chip);
        const fromFunction = shortcuts?.[index];
        const next = fromFunction
          ? shortcutValue(fromFunction, rules())
          : toDate(chip.getAttribute("data-ok-value"));
        if (next === undefined || validateDate(next, rules()) !== null) return;
        change(next);
        accept(next);
        close("shortcut");
      },
      { signal },
    );
    paper?.addEventListener(
      "ok:popover:close",
      (event) => {
        if (!open || mode !== "desktop") return;
        const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
        if (reason === "backdrop" && element.hasAttribute(keepOpenDuringFieldFocus.attr)) {
          // A press on the field keeps the picker open: check where focus went.
          setTimeout(() => {
            if (open && !fieldEl?.contains(element.ownerDocument.activeElement))
              dismiss("clickaway");
            else if (open)
              popover()?.open(fieldEl?.querySelector("[data-ok-text-field-control]") as Element);
          });
          return;
        }
        dismiss(reason === "escape" ? "escape" : "clickaway");
      },
      { signal },
    );
    dialogEl?.addEventListener(
      "ok:dialog:close",
      (event) => {
        if (!open || mode !== "mobile") return;
        const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
        dismiss(reason === "escape" ? "escape" : "clickaway");
      },
      { signal },
    );

    render();
    return {
      get value() {
        return iso(value);
      },
      setValue(next) {
        const date = toDate(next);
        if (date === undefined) return;
        value = date;
        lastAccepted = date;
        valueOnOpen = date;
        field()?.setValue(date);
        calendar().setValue(date);
        render();
      },
      get isOpen() {
        return open;
      },
      open() {
        openPicker("api");
      },
      close() {
        if (open) dismiss("api");
      },
      setShortcuts(list) {
        shortcuts = Array.isArray(list)
          ? list.filter((s) => s && typeof s.getValue === "function")
          : undefined;
      },
      setShouldDisableDate(fn) {
        functions.shouldDisableDate = asFunction(fn);
        field()?.setShouldDisableDate(fn);
        calendar().setShouldDisableDate(fn);
      },
      setShouldDisableMonth(fn) {
        functions.shouldDisableMonth = asFunction(fn);
        field()?.setShouldDisableMonth(fn);
        calendar().setShouldDisableMonth(fn);
      },
      setShouldDisableYear(fn) {
        functions.shouldDisableYear = asFunction(fn);
        field()?.setShouldDisableYear(fn);
        calendar().setShouldDisableYear(fn);
      },
      setLocaleText(next) {
        overrides = { ...overrides, ...next };
        text = readLocaleText(element, overrides);
        field()?.setLocaleText(next);
        calendar().setLocaleText(next);
        render();
      },
      destroy() {
        if (open) {
          open = false;
          popover()?.close();
          dialog()?.close();
        }
      },
    };
  },
});
