import {
  type DateRange,
  dateRangePickerOptions,
  defaultRangeCalendars,
  focusCalendar,
  focusPickerView,
  formatAccessibleDate,
  formatIsoRange,
  formatTimeText,
  invalidDate,
  isSameRange,
  isTimeView,
  isValidDate,
  normalizeTimeViews,
  type PickerAction,
  type PickerLocaleText,
  type PickerOpenReason,
  type PickerView,
  parseCalendarCount,
  parseIsoRange,
  parseIsoTime,
  parsePickerActions,
  parseRangePosition,
  type RangePosition,
  type RangeShortcut,
  rangeAccessibleText,
  rangeError,
  rangeShortcutValue,
  rangeToolbarText,
  readStyle,
  resolvePickerMode,
  scrollDigitalClocks,
  type TimeView,
  validateRange,
  withDay,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import type { PickerDayRenderer } from "../date-calendar/date-calendar.js";
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
} from "../date-calendar/picker-dom.js";
import type { DateFieldInstance } from "../date-field/date-field.js";
import {
  type DateRangeCalendarInstance,
  toRange,
} from "../date-range-calendar/date-range-calendar.js";
import type { DialogInstance } from "../dialog/dialog.js";
import type { DigitalClockInstance } from "../digital-clock/digital-clock.js";
import type { MultiInputRangeFieldInstance } from "../multi-input-range-field/multi-input-range-field.js";
import type { PopoverInstance } from "../popover/popover.js";
import type { TabsInstance } from "../tabs/tabs.js";
import type { TimeClockInstance } from "../time-clock/time-clock.js";

export interface DateRangePickerInstance extends ComponentInstance, PickerDateApi {
  /** The range as an ISO 8601 interval (`start/end`, by `data-ok-value-type`), or `null`. */
  readonly value: string | null;
  /** Sets the range (ISO interval, `[start, end]` or `null`) without events. */
  setValue(value: string | readonly (Date | string | null)[] | null): void;
  /** The end the next pick edits. */
  readonly rangePosition: RangePosition;
  setRangePosition(position: RangePosition): void;
  readonly isOpen: boolean;
  open(position?: RangePosition): void;
  close(): void;
  /** Shortcut chips computed by functions (markup chips carry a fixed `data-ok-value`). */
  setShortcuts(shortcuts: readonly RangeShortcut[]): void;
  setShouldDisableDate(fn: ((day: Date) => boolean) | null): void;
  setShouldDisableTime(fn: ((value: Date, view: TimeView) => boolean) | null): void;
  setLocaleText(text: Partial<PickerLocaleText>): void;
  /** Decorates each day button of the calendar (phase 4); `null` removes the renderer. */
  setDayRenderer(fn: PickerDayRenderer | null): void;
}

const o = dateRangePickerOptions.options;
const TIME_VIEWS = "[data-ok-digital-clock], [data-ok-multi-section-digital-clock]";
const EMPTY: DateRange = [null, null];
const sideOf = (position: RangePosition): 0 | 1 => (position === "start" ? 0 : 1);

/**
 * Date range picker — spec: specs/components/date-picker.md (ADR-0028). Also the time and date
 * time range pickers (`data-ok-value-type="time" | "date-time"`).
 *
 * Markup:  <div data-ok-date-range-picker data-ok-picker-variant="responsive" [data-ok-value-type]
 *               [data-ok-calendars="2"] [data-ok-actions] [data-ok-close-on-select] [data-ok-desktop-mode-media-query]>
 *            …a single input range field (`data-ok-date-field data-ok-range`) with button[data-ok-date-picker-open],
 *             or a multi input range field whose fields hold button[data-ok-date-picker-open][data-ok-range-position]…
 *            <div data-ok-popover data-ok-date-picker-paper popover="manual" role="dialog" …>   (desktop, responsive)
 *              <div data-ok-picker-layout>…range toolbar, [range tabs], shortcuts, div[data-ok-picker-content] ›
 *                date range calendar? digital clock? time clock?, actions…</div>
 *            </div>
 *            <dialog data-ok-dialog data-ok-date-picker-dialog …><div data-ok-dialog-paper></div></dialog>  (mobile, responsive)
 *          </div>
 * Behavior: an open button opens the layout in the popover (desktop) or the dialog (mobile) on its
 *          end; picks set the start then the end; actions and shortcuts follow MUI's lifecycle.
 * Events:  ok:date-range-picker:change (`{ value, validationError: [start, end] }`), :accept
 *          (`{ value }`), :open / :close (`{ reason }`), :rangepositionchange (`{ rangePosition }`).
 */
export const dateRangePicker = defineComponent<DateRangePickerInstance>({
  name: "date-range-picker",
  selector: "[data-ok-date-range-picker]",

  setup(element, { emit, signal, runtime }) {
    const variant = readStyle(element, o.pickerVariant);
    const type = readValueType(element);
    const isDate = type === "date";
    const isDateTime = type === "date-time";
    const isStatic = variant === "static";
    const fieldEl = element.querySelector<HTMLElement>(":scope > [data-ok-date-field]");
    const groupEl = element.querySelector<HTMLElement>(
      ":scope > [data-ok-multi-input-range-field]",
    );
    // No layout when every view renderer is `null` (field only): the picker never opens.
    const layout = element.querySelector<HTMLElement>("[data-ok-picker-layout]");
    const content = layout?.querySelector<HTMLElement>(":scope > [data-ok-picker-content]");
    const calendarEl = content?.querySelector<HTMLElement>(
      ":scope > [data-ok-date-range-calendar]",
    );
    const clockEl = content?.querySelector<HTMLElement>(":scope > [data-ok-time-clock]") ?? null;
    const deskEl = content?.querySelector<HTMLElement>(`:scope > :is(${TIME_VIEWS})`) ?? null;
    const tabsEl = layout?.querySelector<HTMLElement>(":scope > [data-ok-picker-range-tabs]");
    const paper = element.querySelector<HTMLElement>(":scope > [data-ok-date-picker-paper]");
    const dialogEl = element.querySelector<HTMLElement>(":scope > [data-ok-date-picker-dialog]");
    const dialogPaper = dialogEl?.querySelector<HTMLElement>("[data-ok-dialog-paper]") ?? null;
    const openButtons = [
      ...element.querySelectorAll<HTMLButtonElement>("[data-ok-date-picker-open]"),
    ]
      .filter((button) => !layout?.contains(button))
      .slice(0, 2);
    const toolbar = layout?.querySelector<HTMLElement>(":scope > [data-ok-picker-toolbar]");
    const actionsBar = layout?.querySelector<HTMLElement>(":scope > [data-ok-picker-actions]");
    const shortcutsList = layout?.querySelector<HTMLElement>(":scope > [data-ok-picker-shortcuts]");
    const locale = readLocale(element);
    let overrides: Partial<PickerLocaleText> | undefined;
    let text = readLocaleText(element);
    const functions: RuleFunctions = {};
    const timeFunctions: TimeRuleFunctions = {};
    let shortcuts: readonly RangeShortcut[] | undefined;

    const part = <T extends ComponentInstance>(el: HTMLElement | null | undefined, name: string) =>
      el ? runtime.getOrCreate<T>(el, name) : undefined;
    const field = () => part<DateFieldInstance>(fieldEl, "date-field");
    const group = () => part<MultiInputRangeFieldInstance>(groupEl, "multi-input-range-field");
    const calendar = () => part<DateRangeCalendarInstance>(calendarEl, "date-range-calendar");
    const clock = () => part<TimeClockInstance>(clockEl, "time-clock");
    const desk = () => part<DigitalClockInstance>(deskEl, deskEl ? timeViewName(deskEl) : "");
    const tabs = () => part<TabsInstance>(tabsEl, "tabs");
    const popover = () => part<PopoverInstance>(paper, "popover");
    const dialog = () => part<DialogInstance>(dialogEl, "dialog");

    const timeSource = clockEl ?? deskEl ?? element;
    const timeViews: TimeView[] = isDate
      ? []
      : normalizeTimeViews(timeSource.getAttribute("data-ok-views")?.split(/\s+/));
    const firstView: PickerView = isDateTime ? "day" : (timeViews[0] as PickerView);
    const ampm = readAmpm(timeSource, locale);
    // Every range picker holds a field, or (static date ranges) a calendar.
    const ruleSource = element.querySelector(
      "[data-ok-date-field], [data-ok-date-range-calendar]",
    ) as HTMLElement;
    const today = () => pickerToday(element);
    const isDisabled = () =>
      openButtons.length > 0
        ? openButtons.every((button) => button.disabled)
        : ruleSource.hasAttribute("data-ok-disabled");

    let value: DateRange =
      parseIsoRange(
        element
          .querySelector(
            "[data-ok-range], [data-ok-multi-input-range-field], [data-ok-date-range-calendar]",
          )
          ?.getAttribute("data-ok-value"),
        today(),
      ) ?? EMPTY;
    const base = () => (isValidDate(value[0]) ? value[0] : today());
    const rules = () => ({
      ...readRules(ruleSource, functions),
      ...(isDate ? {} : readTimeRules(ruleSource, timeFunctions, base())),
    });
    let position = parseRangePosition(calendarEl?.getAttribute("data-ok-range-position"));
    let open = false;
    let openedFrom = 0;
    let mode: "desktop" | "mobile" | "static" = isStatic
      ? "static"
      : variant === "mobile"
        ? "mobile"
        : "desktop";
    let valueOnOpen = value;
    let lastAccepted = value;
    let view: PickerView = firstView;

    const iso = (range: DateRange) => formatIsoRange(range, type) || null;
    const valid = (range: DateRange): DateRange => [
      isValidDate(range[0]) ? range[0] : null,
      isValidDate(range[1]) ? range[1] : null,
    ];
    const actionsShown = (): PickerAction[] =>
      parsePickerActions(element.getAttribute("data-ok-actions")) ??
      (isDate && mode === "desktop" ? [] : ["cancel", "accept"]);
    const closeOnSelect = () =>
      element.hasAttribute(o.closeOnSelect.attr)
        ? element.getAttribute(o.closeOnSelect.attr) !== "false"
        : !isStatic && isDate && mode === "desktop";
    const calendarCount = () => {
      if (isDateTime) return 1;
      const count = element.getAttribute(o.calendars.attr);
      if (mode === "desktop") return parseCalendarCount(count, defaultRangeCalendars("desktop"));
      return mode === "static" ? parseCalendarCount(count, 1) : 1;
    };
    const sideText = (date: Date | null, empty: string) => {
      if (!date) return empty;
      if (isDate) return rangeToolbarText(date, locale, empty);
      const time = formatTimeText(date, timeViews, ampm, locale);
      return isDateTime ? `${rangeToolbarText(date, locale, empty)} ${time}` : time;
    };
    const textOf = (date: Date) =>
      type === "time"
        ? formatTimeText(date, timeViews, ampm, locale)
        : isDateTime
          ? `${formatAccessibleDate(date, locale)} ${formatTimeText(date, timeViews, ampm, locale)}`
          : formatAccessibleDate(date, locale);

    const render = () => {
      const desktopForm = mode === "desktop";
      const shown = valid(value);
      if (toolbar) {
        toolbar.hidden = desktopForm;
        for (const button of toolbar.querySelectorAll<HTMLButtonElement>(
          "[data-ok-picker-toolbar-button][data-ok-range-position]",
        )) {
          const end = parseRangePosition(button.getAttribute("data-ok-range-position"));
          button.toggleAttribute("data-ok-selected", end === position);
          button.setAttribute("aria-pressed", String(end === position));
          button.disabled = isDisabled();
          const label = sideText(shown[sideOf(end)], end === "start" ? text.start : text.end);
          if (button.textContent !== label) button.textContent = label;
        }
      }
      tabs()?.setValue(position);
      const cal = calendar();
      if (cal) {
        cal.setRangePosition(position);
        cal.setCalendars(calendarCount());
        if (isDateTime) cal.setAvailableRangePositions([position]);
        (calendarEl as HTMLElement).hidden = isDateTime && !desktopForm && isTimeView(view);
      }
      if (deskEl) deskEl.hidden = !desktopForm && clockEl !== null;
      if (clockEl) {
        clockEl.hidden = (desktopForm && deskEl !== null) || (isDateTime && !isTimeView(view));
        if (isTimeView(view)) clock()?.setView(view);
      }
      const edited = shown[sideOf(position)];
      if (!isDate) {
        clock()?.setValue(edited);
        desk()?.setValue(edited);
      }
      const actions = actionsShown();
      if (actionsBar) {
        actionsBar.hidden = actions.length === 0;
        for (const button of actionsBar.querySelectorAll<HTMLElement>("[data-ok-picker-action]")) {
          const action = button.getAttribute("data-ok-picker-action") as PickerAction;
          button.hidden = !actions.includes(action);
          if (action === "nextOrAccept") {
            const label = button.querySelector("[data-ok-button-label]") as HTMLElement;
            label.textContent =
              position === "start" ? text.nextStepButtonLabel : text.okButtonLabel;
          }
        }
      }
      openButtons.forEach((button) => {
        const at = button.getAttribute("data-ok-range-position");
        if (at === null)
          button.setAttribute(
            "aria-label",
            text.openRangePickerDialogue(rangeAccessibleText(shown, textOf)),
          );
        else {
          const date = shown[sideOf(parseRangePosition(at))];
          const name = date ? textOf(date) : null;
          button.setAttribute(
            "aria-label",
            type === "time" ? text.openTimePickerDialogue(name) : text.openDatePickerDialogue(name),
          );
        }
      });
      element.toggleAttribute("data-ok-open", open);
    };

    const setPosition = (next: RangePosition) => {
      if (next !== position) {
        position = next;
        emit("rangepositionchange", { rangePosition: next });
      }
      render();
    };
    const setView = (next: PickerView) => {
      view = next;
      render();
    };

    type Source = "field" | "calendar" | "clock";
    /** A new range from a field, the calendar, a clock, an action or a shortcut. */
    const change = (next: DateRange, from?: Source) => {
      if (isSameRange(next, value)) return;
      value = next;
      const usable = valid(next);
      if (from !== "field") {
        field()?.setValue(next);
        group()?.setValue(next);
      }
      if (from !== "calendar") calendar()?.setValue(usable);
      emit("change", { value: iso(next), validationError: validateRange(next, type, rules()) });
      render();
    };
    const accept = (next: DateRange) => {
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
      const active = element.ownerDocument.activeElement;
      if (active === null || active === element.ownerDocument.body || layout?.contains(active))
        openButtons[openedFrom]?.focus();
      render();
      emit("close", { reason });
    };
    const dismiss = (reason: PickerOpenReason) => {
      if (mode === "mobile") change(valueOnOpen);
      else accept(value);
      close(reason);
    };
    const finish = (next: DateRange) => {
      if (isStatic) {
        if (element.getAttribute(o.closeOnSelect.attr) === "true") accept(next);
        return;
      }
      if (!closeOnSelect()) return;
      accept(next);
      close("select");
    };
    const openPicker = (reason: PickerOpenReason, at: RangePosition) => {
      // Disabled and read-only pickers have disabled open buttons.
      if (open || !layout || isStatic || isDisabled()) return;
      mode = resolvePickerMode(
        variant,
        element.getAttribute("data-ok-desktop-mode-media-query") ?? undefined,
        element.ownerDocument.defaultView as (Window & typeof globalThis) | null,
      );
      if (mode === "mobile" && dialogPaper && layout.parentElement !== dialogPaper)
        dialogPaper.append(layout);
      if (mode === "desktop" && paper && layout.parentElement !== paper) paper.append(layout);
      valueOnOpen = value;
      openedFrom = at === "end" && openButtons.length > 1 ? 1 : 0;
      view = firstView;
      open = true;
      setPosition(at);
      const anchor = (
        groupEl
          ? groupEl.querySelectorAll("[data-ok-date-field]")[openedFrom]
          : fieldEl?.querySelector("[data-ok-text-field-control]")
      ) as Element;
      if (mode === "desktop") popover()?.open(anchor);
      else dialog()?.open(openButtons[openedFrom]);
      if (isDate) focusCalendar(layout);
      else {
        scrollDigitalClocks(layout);
        focusPickerView(layout);
      }
      emit("open", { reason });
    };
    /** The time of the edited end finished: on to the end, or finish. */
    const timeFinished = (next: DateRange) => {
      if (position === "start") {
        view = firstView;
        setPosition("end");
      } else finish(next);
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
          change(EMPTY);
          accept(EMPTY);
          close("clear");
          break;
        case "today": {
          const day = today();
          const shown = valid(value);
          const next: DateRange = [
            withDay(day, shown[0], day, type),
            withDay(day, shown[1], day, type),
          ];
          change(next);
          accept(next);
          close("today");
          break;
        }
        case "nextOrAccept":
          if (position === "start") {
            view = firstView;
            setPosition("end");
          } else {
            accept(value);
            close("accept");
          }
          break;
      }
    };

    /** A field's range: partly typed sides become invalid dates (as in React). */
    const fromField = (detail: { value: string | null; validationError: unknown }) => {
      const range = parseIsoRange(detail.value ?? "/", base(), readTimezone(element)) as DateRange;
      // Range fields report `[start, end]` errors.
      const errors = detail.validationError as unknown[];
      return range.map(
        (date, side) => date ?? (errors[side] === "invalidDate" ? invalidDate() : null),
      ) as DateRange;
    };

    openButtons.forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const at = parseRangePosition(button.getAttribute("data-ok-range-position"));
          if (open) dismiss("button");
          else openPicker("button", at);
        },
        { signal },
      );
    });
    (fieldEl ?? groupEl)?.addEventListener(
      "focusin",
      (event) => {
        if (!open || mode !== "desktop") return;
        if ((event.target as Element).closest("[data-ok-date-picker-open]")) return;
        if (element.hasAttribute("data-ok-keep-open-during-field-focus")) {
          // Multi input: focusing a field edits its end.
          const fields = [...(groupEl?.querySelectorAll(":scope > [data-ok-date-field]") ?? [])];
          const at = fields.indexOf(
            (event.target as Element).closest("[data-ok-date-field]") as Element,
          );
          if (at !== -1) setPosition(at === 1 ? "end" : "start");
          return;
        }
        dismiss("clickaway");
      },
      { signal },
    );
    element.addEventListener(
      "ok:date-field:change",
      (event) => {
        if (!fieldEl || event.target !== fieldEl) return;
        change(fromField((event as CustomEvent).detail), "field");
      },
      { signal },
    );
    groupEl?.addEventListener(
      "ok:multi-input-range-field:change",
      (event) => {
        change(fromField((event as CustomEvent).detail), "field");
      },
      { signal },
    );
    calendarEl?.addEventListener(
      "ok:date-range-calendar:change",
      (event) => {
        const detail = (event as CustomEvent<{ value: string; selectionState: string }>).detail;
        // A pick always sets the start: the interval isn't empty.
        const days = parseIsoRange(detail.value, base(), readTimezone(element)) as DateRange;
        const shown = valid(value);
        const next = days.map((date, side) =>
          date ? withDay(date, shown[side] ?? shown[1 - side] ?? null, today(), type) : null,
        ) as DateRange;
        // The calendar applies its own range after this event.
        queueMicrotask(() => {
          // The calendar moved on to the other end already (React reports it before closing).
          const moved = (calendar() as DateRangeCalendarInstance).rangePosition;
          if (!isDateTime && moved !== position) {
            position = moved;
            emit("rangepositionchange", { rangePosition: moved });
          }
          change(next, "calendar");
          if (isDateTime) {
            if (mode !== "desktop" && timeViews.length > 0) setView(timeViews[0] as TimeView);
            return;
          }
          if (detail.selectionState === "finish") finish(next);
        });
      },
      { signal },
    );
    calendarEl?.addEventListener(
      "ok:date-range-calendar:rangepositionchange",
      (event) => {
        // Date time ranges pin the calendar to one end: it never moves on its own.
        const next = (event as CustomEvent<{ rangePosition: RangePosition }>).detail.rangePosition;
        queueMicrotask(() => setPosition(next));
      },
      { signal },
    );
    const onTimeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ value: string; selectionState: string }>).detail;
      const side = sideOf(position);
      const shown = valid(value);
      // Clocks report `HH:mm:ss`: the time goes on the edited end's day (else the start's).
      const date = parseIsoTime(detail.value, shown[side] ?? shown[0] ?? today()) as Date;
      const next: DateRange = side === 0 ? [date, value[1]] : [value[0], date];
      change(next, "clock");
      if (detail.selectionState === "finish") timeFinished(next);
    };
    clockEl?.addEventListener("ok:time-clock:change", onTimeChange, { signal });
    deskEl?.addEventListener("ok:digital-clock:change", onTimeChange, { signal });
    deskEl?.addEventListener("ok:multi-section-digital-clock:change", onTimeChange, { signal });
    clockEl?.addEventListener(
      "ok:time-clock:viewchange",
      (event) => {
        view = (event as CustomEvent<{ view: TimeView }>).detail.view;
        render();
      },
      { signal },
    );
    tabsEl?.addEventListener(
      "ok:tabs:change",
      (event) => {
        const tab = (event as CustomEvent<{ value: string }>).detail.value;
        // The tabs apply their own selection after this event.
        queueMicrotask(() => {
          view = firstView;
          setPosition(parseRangePosition(tab, position));
        });
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
        const toolbarButton = target.closest(
          "[data-ok-picker-toolbar-button][data-ok-range-position]",
        );
        if (toolbarButton) {
          view = firstView;
          setPosition(parseRangePosition(toolbarButton.getAttribute("data-ok-range-position")));
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
          ? rangeShortcutValue(fromFunction, type, rules())
          : toRange(chip.getAttribute("data-ok-value"), base(), readTimezone(element));
        if (next === undefined || rangeError(validateRange(next, type, rules())) !== null) return;
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
        if (reason === "backdrop" && element.hasAttribute("data-ok-keep-open-during-field-focus")) {
          setTimeout(() => {
            const owner = (fieldEl ?? groupEl) as HTMLElement;
            if (!owner.contains(element.ownerDocument.activeElement)) dismiss("clickaway");
            else popover()?.open(owner);
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
    const dates = pickerDateApi(
      element,
      () => instance.value,
      (next) => instance.setValue(next as never),
      true,
    );
    const instance: DateRangePickerInstance = {
      get date() {
        return dates.get();
      },
      setDate: dates.set,
      setDateAdapter: dates.setAdapter,
      get value() {
        return iso(value);
      },
      setValue(next) {
        const range = toRange(next, base(), readTimezone(element));
        if (range === undefined) return;
        value = range;
        lastAccepted = range;
        valueOnOpen = range;
        field()?.setValue(range);
        group()?.setValue(range);
        calendar()?.setValue(valid(range));
        render();
      },
      get rangePosition() {
        return position;
      },
      setRangePosition(next) {
        setPosition(parseRangePosition(next, position));
      },
      get isOpen() {
        return open;
      },
      open(at) {
        openPicker("api", parseRangePosition(at));
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
        for (const el of groupEl?.querySelectorAll<HTMLElement>("[data-ok-date-field]") ?? [])
          runtime.getOrCreate<DateFieldInstance>(el, "date-field")?.setShouldDisableDate(fn);
        calendar()?.setShouldDisableDate(fn);
      },
      setShouldDisableTime(fn) {
        timeFunctions.shouldDisableTime = asFunction(fn);
        field()?.setShouldDisableTime(fn);
        clock()?.setShouldDisableTime(fn);
        desk()?.setShouldDisableTime(fn);
      },
      setDayRenderer(fn) {
        calendar()?.setDayRenderer(fn);
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
