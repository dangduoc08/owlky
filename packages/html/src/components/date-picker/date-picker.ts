import {
  type DateView,
  datePickerOptions,
  defaultCloseOnSelect,
  defaultDateTimePickerActions,
  defaultPickerActions,
  defaultTimePickerActions,
  focusCalendar,
  focusPickerView,
  formatAccessibleDate,
  formatDate,
  formatTimeText,
  hourUnit,
  initialPickerView,
  initialView,
  invalidDate,
  isTimeView,
  isValidDate,
  nextPickerView,
  nextView,
  normalizeDateViews,
  normalizeTimeViews,
  type PickerAction,
  type PickerLocaleText,
  type PickerOpenReason,
  type PickerShortcut,
  type PickerView,
  parseIsoDate,
  parseIsoTime,
  parsePickerActions,
  parsePickerValue,
  pickerToolbarText,
  pickerValueIso,
  readStyle,
  resolvePickerMode,
  scrollDigitalClocks,
  setDateParts,
  setTimeUnit,
  shortcutValue,
  type TimeView,
  validatePickerValue,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import type { DateCalendarInstance, PickerDayRenderer } from "../date-calendar/date-calendar.js";
import {
  asFunction,
  type PickerDateApi,
  pickerDateApi,
  pickerToday,
  type RuleFunctions,
  readAmpm,
  readLocale,
  readLocaleText,
  readRules,
  readTimeRules,
  readTimezone,
  readValueType,
  relabelActions,
  type TimeRuleFunctions,
  timeViewName,
  toPickerDate,
} from "../date-calendar/picker-dom.js";
import type { DateFieldInstance } from "../date-field/date-field.js";
import type { DialogInstance } from "../dialog/dialog.js";
import type { DigitalClockInstance } from "../digital-clock/digital-clock.js";
import type { PopoverInstance } from "../popover/popover.js";
import type { TabsInstance } from "../tabs/tabs.js";
import type { TimeClockInstance } from "../time-clock/time-clock.js";

export interface DatePickerInstance extends ComponentInstance, PickerDateApi {
  /** ISO value, or `null`: a date, a time (`HH:mm:ss`) or a date time, by `data-ok-value-type`. */
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
  /** Times that can't be picked (time and date time pickers). */
  setShouldDisableTime(fn: ((value: Date, view: TimeView) => boolean) | null): void;
  setLocaleText(text: Partial<PickerLocaleText>): void;
  /** Decorates each day button of the calendar (phase 4); `null` removes the renderer. */
  setDayRenderer(fn: PickerDayRenderer | null): void;
}

const {
  pickerVariant: variantSpec,
  closeOnSelect: closeSpec,
  keepOpenDuringFieldFocus,
} = datePickerOptions.options;

const TIME_VIEWS = "[data-ok-digital-clock], [data-ok-multi-section-digital-clock]";
const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Date picker — spec: specs/components/date-picker.md. Also the time and date time pickers
 * (`data-ok-value-type="time" | "date-time"`, ADR-0026).
 *
 * Markup:  <div data-ok-date-picker data-ok-picker-variant="responsive" data-ok-orientation="portrait"
 *               [data-ok-value-type="time"] [data-ok-actions="cancel accept"] [data-ok-close-on-select="false"]
 *               [data-ok-desktop-mode-media-query] [data-ok-open-to]>
 *            …a date field whose end adornment holds button[data-ok-date-picker-open]…
 *            <div data-ok-popover data-ok-date-picker-paper popover="manual" role="dialog" …>   (desktop, responsive)
 *              <div data-ok-picker-layout>…toolbar, [tabs], shortcuts, div[data-ok-picker-content] ›
 *                date calendar? digital clock? time clock?, actions…</div>
 *            </div>
 *            <dialog data-ok-dialog data-ok-date-picker-dialog …><div data-ok-dialog-paper></div></dialog>  (mobile, responsive)
 *          </div>
 * Behavior: the open button opens the layout in the popover (desktop) or moves it into the dialog
 *          (mobile, chosen by the media query); picks, actions and shortcuts follow MUI's lifecycle.
 *          Responsive time pickers hold both forms' views and show one (`hidden`).
 * Events:  ok:date-picker:change (`{ value, validationError }`), ok:date-picker:accept (`{ value }`),
 *          ok:date-picker:open / close (`{ reason }`).
 */
export const datePicker = defineComponent<DatePickerInstance>({
  name: "date-picker",
  selector: "[data-ok-date-picker]",

  setup(element, { emit, signal, runtime }) {
    const variant = readStyle(element, variantSpec);
    const type = readValueType(element);
    const isDate = type === "date";
    const isDateTime = type === "date-time";
    const isStatic = variant === "static";
    const fieldEl = element.querySelector<HTMLElement>(":scope > [data-ok-date-field]");
    // No layout when every view renderer is `null` (field only): the picker never opens.
    const layout = element.querySelector<HTMLElement>("[data-ok-picker-layout]");
    const content = layout?.querySelector<HTMLElement>(":scope > [data-ok-picker-content]");
    const calendarEl = content?.querySelector<HTMLElement>(":scope > [data-ok-date-calendar]");
    const clockEl = content?.querySelector<HTMLElement>(":scope > [data-ok-time-clock]") ?? null;
    const deskEl = content?.querySelector<HTMLElement>(`:scope > :is(${TIME_VIEWS})`) ?? null;
    const tabsEl = layout?.querySelector<HTMLElement>(":scope > [data-ok-picker-tabs]");
    const paper = element.querySelector<HTMLElement>(":scope > [data-ok-date-picker-paper]");
    const dialogEl = element.querySelector<HTMLElement>(":scope > [data-ok-date-picker-dialog]");
    const dialogPaper = dialogEl?.querySelector<HTMLElement>("[data-ok-dialog-paper]") ?? null;
    const openButton = element.querySelector<HTMLButtonElement>("[data-ok-date-picker-open]");
    const toolbar = layout?.querySelector<HTMLElement>(":scope > [data-ok-picker-toolbar]");
    const toolbarTitle =
      toolbar?.querySelector<HTMLElement>("[data-ok-picker-toolbar-title]") ?? null;
    const actionsBar = layout?.querySelector<HTMLElement>(":scope > [data-ok-picker-actions]");
    const shortcutsList = layout?.querySelector<HTMLElement>(":scope > [data-ok-picker-shortcuts]");
    const locale = readLocale(element);
    let overrides: Partial<PickerLocaleText> | undefined;
    let text = readLocaleText(element);
    const functions: RuleFunctions = {};
    const timeFunctions: TimeRuleFunctions = {};
    let shortcuts: readonly PickerShortcut[] | undefined;

    const field = () =>
      fieldEl ? runtime.getOrCreate<DateFieldInstance>(fieldEl, "date-field") : undefined;
    const calendar = () =>
      calendarEl
        ? runtime.getOrCreate<DateCalendarInstance>(calendarEl, "date-calendar")
        : undefined;
    const clock = () =>
      clockEl ? runtime.getOrCreate<TimeClockInstance>(clockEl, "time-clock") : undefined;
    const desk = () =>
      deskEl ? runtime.getOrCreate<DigitalClockInstance>(deskEl, timeViewName(deskEl)) : undefined;
    const tabs = () => (tabsEl ? runtime.getOrCreate<TabsInstance>(tabsEl, "tabs") : undefined);
    const popover = () =>
      paper ? runtime.getOrCreate<PopoverInstance>(paper, "popover") : undefined;
    const dialog = () =>
      dialogEl ? runtime.getOrCreate<DialogInstance>(dialogEl, "dialog") : undefined;

    const dateViews: DateView[] = calendarEl
      ? normalizeDateViews(calendarEl.getAttribute("data-ok-views")?.split(/\s+/))
      : [];
    const timeViews: TimeView[] = isDate
      ? []
      : normalizeTimeViews(
          (clockEl ?? deskEl)?.getAttribute("data-ok-views")?.split(/\s+/) ?? undefined,
        );
    const views: PickerView[] = [...dateViews, ...timeViews];
    const timeSource = clockEl ?? deskEl ?? element;
    const ampm = readAmpm(timeSource, locale);
    const ruleSource = fieldEl ?? calendarEl ?? timeSource;
    const today = () => pickerToday(element);
    const isDisabled = () => (calendarEl ?? timeSource).hasAttribute("data-ok-disabled");
    const isReadOnly = () =>
      fieldEl?.hasAttribute("data-ok-read-only") === true ||
      (!fieldEl && timeSource.hasAttribute("data-ok-read-only"));

    let value: Date | null = parsePickerValue(
      fieldEl?.getAttribute("data-ok-value") ??
        calendarEl?.getAttribute("data-ok-value") ??
        timeSource.getAttribute("data-ok-value"),
      today(),
    );
    // Static date time pickers have no field: the calendar holds the day, the clock the time.
    if (!fieldEl && isDateTime && isValidDate(value) && timeSource !== element)
      value = parseIsoTime(timeSource.getAttribute("data-ok-value"), value) ?? value;
    const base = () => (isValidDate(value) ? value : today());
    const rules = () => ({
      ...readRules(ruleSource, functions),
      ...(isDate ? {} : readTimeRules(fieldEl ?? timeSource, timeFunctions, base())),
    });
    let open = false;
    let mode: "desktop" | "mobile" | "static" = isStatic
      ? "static"
      : variant === "mobile"
        ? "mobile"
        : "desktop";
    let valueOnOpen = value;
    let lastAccepted = value;
    // Time and date time pickers keep their view here; date pickers ask the calendar.
    let view: PickerView = isDate
      ? "day"
      : initialPickerView(views, type, element.getAttribute("data-ok-open-to"));

    const iso = (date: Date | null) =>
      date && isValidDate(date) ? pickerValueIso(date, type) : null;
    const actionsShown = (): PickerAction[] =>
      parsePickerActions(element.getAttribute("data-ok-actions")) ??
      (isDate
        ? defaultPickerActions(mode)
        : isDateTime
          ? defaultDateTimePickerActions(mode)
          : defaultTimePickerActions());
    const closeOnSelect = () =>
      element.hasAttribute(closeSpec.attr)
        ? element.getAttribute(closeSpec.attr) !== "false"
        : isStatic || !isDate
          ? false
          : defaultCloseOnSelect(mode);

    const renderTimeToolbar = () => {
      if (!toolbar) return;
      const valid = isValidDate(value) ? value : null;
      const empty = text.toolbarEmptyText;
      for (const button of toolbar.querySelectorAll<HTMLButtonElement>(
        "[data-ok-picker-toolbar-button]",
      )) {
        const target = button.getAttribute("data-ok-view") as PickerView;
        button.toggleAttribute("data-ok-selected", target === view);
        button.disabled = isDisabled();
        let label = empty;
        if (valid) {
          if (target === "year") label = formatDate(valid, locale, { year: "numeric" });
          else if (target === "hours") label = pad2(hourUnit(valid, ampm));
          else if (target === "minutes") label = pad2(valid.getMinutes());
          else if (target === "seconds") label = pad2(valid.getSeconds());
          else label = formatDate(valid, locale, { month: "short", day: "numeric" });
        }
        if (button.textContent !== label) button.textContent = label;
      }
      const pm = base().getHours() >= 12;
      toolbar
        .querySelectorAll<HTMLButtonElement>("[data-ok-picker-toolbar-meridiem]")
        .forEach((button, index) => {
          button.setAttribute("aria-pressed", String(valid !== null && pm === (index === 1)));
          button.disabled = isDisabled() || isReadOnly();
        });
    };

    const render = () => {
      const desktopForm = mode === "desktop";
      if (toolbar) toolbar.hidden = desktopForm;
      if (isDate && toolbarTitle)
        toolbarTitle.textContent = pickerToolbarText(
          isValidDate(value) ? value : null,
          locale,
          text.toolbarEmptyText,
        );
      if (!isDate) {
        renderTimeToolbar();
        if (tabsEl) {
          tabsEl.hidden = desktopForm;
          tabs()?.setValue(isTimeView(view) ? "time" : "date");
        }
        if (calendarEl) calendarEl.hidden = isDateTime && !desktopForm && isTimeView(view);
        // Without the other form's clock (view renderers), one clock serves every form.
        if (deskEl) deskEl.hidden = !desktopForm && clockEl !== null;
        if (clockEl) {
          clockEl.hidden = (desktopForm && deskEl !== null) || (isDateTime && !isTimeView(view));
          if (isTimeView(view)) clock()?.setView(view);
        }
      }
      const shown = actionsShown();
      if (actionsBar) {
        actionsBar.hidden = shown.length === 0;
        for (const button of actionsBar.querySelectorAll<HTMLElement>("[data-ok-picker-action]")) {
          const action = button.getAttribute("data-ok-picker-action") as PickerAction;
          button.hidden = !shown.includes(action);
          if (action === "nextOrAccept") {
            const after = isDate
              ? nextView(dateViews, calendar()?.view as DateView)
              : nextPickerView(views, view);
            // The Button keeps its label span (React renders one).
            const label = button.querySelector("[data-ok-button-label]") ?? button;
            label.textContent = after ? text.nextStepButtonLabel : text.okButtonLabel;
          }
        }
      }
      const valid = isValidDate(value) ? value : null;
      openButton?.setAttribute(
        "aria-label",
        type === "time"
          ? text.openTimePickerDialogue(
              valid ? formatTimeText(valid, timeViews, ampm, locale) : null,
            )
          : text.openDatePickerDialogue(
              valid
                ? isDateTime
                  ? `${formatAccessibleDate(valid, locale)} ${formatTimeText(valid, timeViews, ampm, locale)}`
                  : formatAccessibleDate(valid, locale)
                : null,
            ),
      );
      element.toggleAttribute("data-ok-open", open);
    };

    const setView = (target: PickerView) => {
      if (!views.includes(target)) return;
      view = target;
      if (!isTimeView(target)) calendar()?.setView(target);
      render();
    };

    type Source = "field" | "calendar" | "clock" | "desk";
    /** A new value from the field, the calendar, a clock, an action or a shortcut. */
    const change = (next: Date | null, from?: Source) => {
      if (iso(next) === iso(value) && (next === null) === (value === null)) return;
      value = next;
      const usable = next === null || isValidDate(next);
      // The field ignores invalid dates (it shows them already).
      if (from !== "field") field()?.setValue(next);
      if (from !== "calendar" && usable) calendar()?.setValue(next);
      if (from !== "clock" && usable) clock()?.setValue(next);
      if (from !== "desk" && usable) desk()?.setValue(next);
      emit("change", {
        value: iso(next),
        validationError: validatePickerValue(next, type, rules()),
      });
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
      if (active === null || active === element.ownerDocument.body || layout?.contains(active))
        openButton?.focus();
      render();
      emit("close", { reason });
    };
    const dismiss = (reason: PickerOpenReason) => {
      if (mode === "mobile") change(valueOnOpen);
      else accept(value);
      close(reason);
    };
    /** The last view of a part finished: accept and close when picks close the picker. */
    const finish = (next: Date | null) => {
      if (isStatic) {
        if (element.getAttribute(closeSpec.attr) === "true") accept(next);
        return;
      }
      if (!closeOnSelect()) return;
      accept(next);
      close("select");
    };
    const openPicker = (reason: PickerOpenReason) => {
      if (open || !layout || isStatic || isDisabled() || isReadOnly()) return;
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
      if (isDate) {
        const first = calendarEl?.getAttribute("data-ok-open-to") as DateView | null;
        calendar()?.setView(initialView(dateViews, first ?? undefined));
      } else setView(initialPickerView(views, type, element.getAttribute("data-ok-open-to")));
      open = true;
      render();
      const anchor = fieldEl?.querySelector("[data-ok-text-field-control]");
      if (mode === "desktop") popover()?.open(anchor ?? element);
      else dialog()?.open(openButton);
      if (isDate) focusCalendar(layout);
      else {
        scrollDigitalClocks(layout);
        focusPickerView(layout);
      }
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
          const now = today();
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
          const after = isDate
            ? nextView(dateViews, calendar()?.view as DateView)
            : nextPickerView(views, view);
          if (after) {
            if (isDate) {
              calendar()?.setView(after as DateView);
              render();
            } else setView(after);
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
        const date = parsePickerValue(detail.value, base(), readTimezone(element));
        change(date ?? (detail.validationError === "invalidDate" ? invalidDate() : null), "field");
      },
      { signal },
    );
    element.addEventListener(
      "ok:date-calendar:change",
      (event) => {
        if (event.target !== calendarEl) return;
        const detail = (event as CustomEvent<{ value: string; selectionState: string }>).detail;
        const day = parseIsoDate(detail.value);
        if (!day) return;
        // Date time pickers keep the time of the value.
        const date = isDate
          ? day
          : setDateParts(base(), {
              year: day.getFullYear(),
              month: day.getMonth(),
              day: day.getDate(),
            });
        // The calendar applies its own value after this event.
        queueMicrotask(() => {
          change(date, "calendar");
          if (detail.selectionState !== "finish") return;
          if (isDateTime && timeViews.length > 0) {
            // Mobile and static forms go on to the time; desktop shows both.
            if (mode !== "desktop") setView(timeViews[0] as TimeView);
            return;
          }
          finish(date);
        });
      },
      { signal },
    );
    element.addEventListener(
      "ok:date-calendar:viewchange",
      (event) => {
        if (event.target !== calendarEl) return;
        if (!isDate) view = (event as CustomEvent<{ view: DateView }>).detail.view;
        render();
      },
      { signal },
    );
    const onTimeChange = (source: "clock" | "desk") => (event: Event) => {
      if (event.target !== (source === "clock" ? clockEl : deskEl)) return;
      const detail = (event as CustomEvent<{ value: string; selectionState: string }>).detail;
      const date = parseIsoTime(detail.value, base());
      if (!date) return;
      change(date, source);
      if (detail.selectionState === "finish") finish(date);
    };
    element.addEventListener("ok:time-clock:change", onTimeChange("clock"), { signal });
    element.addEventListener("ok:digital-clock:change", onTimeChange("desk"), { signal });
    element.addEventListener("ok:multi-section-digital-clock:change", onTimeChange("desk"), {
      signal,
    });
    element.addEventListener(
      "ok:time-clock:viewchange",
      (event) => {
        if (event.target !== clockEl) return;
        view = (event as CustomEvent<{ view: TimeView }>).detail.view;
        render();
      },
      { signal },
    );
    tabsEl?.addEventListener(
      "ok:tabs:change",
      (event) => {
        const tab = (event as CustomEvent<{ value: string }>).detail.value;
        const dateView: DateView = dateViews.includes("day")
          ? "day"
          : (dateViews.at(-1) as DateView);
        // The tabs apply their own selection after this event.
        queueMicrotask(() => setView(tab === "time" ? (timeViews[0] as TimeView) : dateView));
      },
      { signal },
    );
    layout?.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element;
        const action = target.closest<HTMLButtonElement>("[data-ok-picker-action]");
        if (action && layout?.contains(action)) {
          runAction(action.getAttribute("data-ok-picker-action") as PickerAction);
          return;
        }
        const viewButton = target.closest("[data-ok-picker-toolbar-button]");
        if (viewButton) {
          setView(viewButton.getAttribute("data-ok-view") as PickerView);
          return;
        }
        const meridiem = target.closest("[data-ok-picker-toolbar-meridiem]");
        if (meridiem) {
          const pm = meridiem.getAttribute("data-ok-picker-toolbar-meridiem") === "pm";
          change(setTimeUnit(base(), "meridiem", pm ? 1 : 0, ampm));
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
          : toPickerDate(chip.getAttribute("data-ok-value"), base(), readTimezone(element));
        if (next === undefined || validatePickerValue(next, type, rules()) !== null) return;
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

    // Clocks only know a time (`HH:mm:ss`): give them the picker's day, which the rules need.
    if (!isDate && isValidDate(value)) {
      clock()?.setValue(value);
      desk()?.setValue(value);
    }
    render();
    const dates = pickerDateApi(
      element,
      () => iso(value),
      (next) => instance.setValue(next as Date | null),
    );
    const instance: DatePickerInstance = {
      get value() {
        return iso(value);
      },
      get date() {
        return dates.get();
      },
      setDate: dates.set,
      setDateAdapter: dates.setAdapter,
      setDayRenderer(fn) {
        calendar()?.setDayRenderer(fn);
      },
      setValue(next) {
        const date = toPickerDate(next, base(), readTimezone(element));
        if (date === undefined) return;
        value = date;
        lastAccepted = date;
        valueOnOpen = date;
        field()?.setValue(date);
        calendar()?.setValue(date);
        clock()?.setValue(date);
        desk()?.setValue(date);
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
        calendar()?.setShouldDisableDate(fn);
      },
      setShouldDisableMonth(fn) {
        functions.shouldDisableMonth = asFunction(fn);
        field()?.setShouldDisableMonth(fn);
        calendar()?.setShouldDisableMonth(fn);
      },
      setShouldDisableYear(fn) {
        functions.shouldDisableYear = asFunction(fn);
        field()?.setShouldDisableYear(fn);
        calendar()?.setShouldDisableYear(fn);
      },
      setShouldDisableTime(fn) {
        timeFunctions.shouldDisableTime = asFunction(fn);
        field()?.setShouldDisableTime(fn);
        clock()?.setShouldDisableTime(fn);
        desk()?.setShouldDisableTime(fn);
      },
      setLocaleText(next) {
        overrides = { ...overrides, ...next };
        text = readLocaleText(element, overrides);
        field()?.setLocaleText(next);
        calendar()?.setLocaleText(next);
        clock()?.setLocaleText(next);
        desk()?.setLocaleText(next);
        if (layout) relabelActions(layout, text);
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
    return instance;
  },
});
