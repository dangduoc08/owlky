import {
  clockAngle,
  clockNumbers,
  createFocusedViewTracker,
  createTimeClockController,
  focusPickerViewPart,
  formatIsoTime,
  formatTimeText,
  isInnerHour,
  isTimeUnitDisabled,
  isValidDate,
  normalizeTimeViews,
  type PickerLocaleText,
  readNumber,
  setTimeUnit,
  startOfDay,
  type TimeView,
  timeClockOptions,
  timeUnit,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import {
  asFunction,
  h,
  type PickerDateApi,
  pickerDateApi,
  pickerToday,
  readAmpm,
  readLocale,
  readLocaleText,
  readTimeRules,
  readTimezone,
  type TimeRuleFunctions,
  toPickerDate,
} from "../date-calendar/picker-dom.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface TimeClockEvents {
  /** After a view took the focus (`hasFocus` `true`) or lost it. */
  focusedviewchange: EventSpec<{ view: TimeView; hasFocus: boolean }>;
  /** Before the dial sets the time (`HH:mm:ss`). Call `preventDefault()` to refuse it. */
  change: EventSpec<{ value: string; selectionState: "shallow" | "partial" | "finish" }, true>;
  /** After the clock switched between hours, minutes and seconds. */
  viewchange: EventSpec<{ view: TimeView }>;
}

export interface TimeClockInstance extends ComponentInstance, PickerDateApi {
  /** The view that holds the focus, or `null`. */
  readonly focusedView: TimeView | null;
  /** Moves the focus into a view, when it is shown. */
  setFocusedView(view: TimeView): void;
  /** ISO time (`HH:mm:ss`), or `null`. */
  readonly value: string | null;
  /** Sets the value (ISO time or date time, `Date` or `null`) without events. A `Date` keeps its day. */
  setValue(value: string | Date | null): void;
  /** The view shown (`hours`, `minutes` or `seconds`). */
  readonly view: TimeView;
  /** Shows another view (one of `data-ok-views`) without events. */
  setView(view: TimeView): void;
  /** Times that can't be picked (functions have no attribute). */
  setShouldDisableTime(fn: ((value: Date, view: TimeView) => boolean) | null): void;
  /** Replaces the text of the labels and buttons, such as for another language. */
  setLocaleText(text: Partial<PickerLocaleText>): void;
}

let uid = 0;

/**
 * Time clock — spec: specs/components/date-picker.md (ADR-0026)
 *
 * Markup:  <div id="c" data-ok-time-clock data-ok-ampm="true" data-ok-view="hours" data-ok-views="hours minutes"
 *               [data-ok-value="09:30:00"] [data-ok-min-time] [data-ok-max-time] [data-ok-minutes-step] …>
 *            <div data-ok-time-clock-dial>
 *              <span data-ok-time-clock-pin></span><span data-ok-time-clock-pointer></span>
 *              <div role="listbox" data-ok-time-clock-options tabindex="0" aria-label="…">
 *                <span role="option" id="c-hours-1" data-ok-time-clock-number data-ok-position="1" data-ok-value="1">1</span> …
 *            </div></div>
 *            [<div data-ok-time-clock-meridiems><button data-ok-time-clock-meridiem="am">AM</button>…</div>]
 *            <div data-ok-time-clock-nav><button data-ok-time-clock-prev>…</button><button data-ok-time-clock-next>…</button></div>
 *          </div>
 * Behavior: core `createTimeClockController` (press, drag, keys); this runtime rebuilds the
 *          numbers of the view with DOM methods and writes the pointer's angle through CSSOM.
 * Events:  ok:time-clock:change (cancelable, `{ value, selectionState }`), ok:time-clock:viewchange
 *          (`{ view }`).
 */
export const timeClock = defineComponent<TimeClockInstance, TimeClockEvents>({
  name: "time-clock",
  selector: "[data-ok-time-clock]",

  setup(element, { emit, signal }) {
    const focus = createFocusedViewTracker(element, (view, hasFocus) =>
      emit("focusedviewchange", { view: view as TimeView, hasFocus }),
    );
    if (!element.id) element.id = `ok-time-clock-${++uid}`;
    const locale = readLocale(element);
    let overrides: Partial<PickerLocaleText> | undefined;
    let text = readLocaleText(element);
    const functions: TimeRuleFunctions = {};
    const ampm = readAmpm(element, locale);
    const views = normalizeTimeViews(element.getAttribute("data-ok-views")?.split(/\s+/));
    const first = element.getAttribute("data-ok-view") as TimeView;
    let view: TimeView = views.includes(first) ? first : (views[0] as TimeView);
    let reference = pickerToday(element);
    let value: Date | null =
      toPickerDate(element.getAttribute("data-ok-value"), reference, readTimezone(element)) ?? null;
    let written: string[] = [];

    const listbox = element.querySelector<HTMLElement>(
      "[data-ok-time-clock-options]",
    ) as HTMLElement;
    const pointer = element.querySelector<HTMLElement>("[data-ok-time-clock-pointer]");
    const prev = element.querySelector<HTMLButtonElement>("[data-ok-time-clock-prev]");
    const next = element.querySelector<HTMLButtonElement>("[data-ok-time-clock-next]");
    const meridiems = [
      ...element.querySelectorAll<HTMLButtonElement>("[data-ok-time-clock-meridiem]"),
    ];

    const base = () => (isValidDate(value) ? value : reference);
    const disabled = () => element.hasAttribute("data-ok-disabled");
    const readOnly = () => element.hasAttribute("data-ok-read-only");
    const rules = () => readTimeRules(element, functions, base());
    const step = () => Number(readNumber(element, timeClockOptions.options.minutesStep)) || 1;
    const unit = () => (isValidDate(value) ? timeUnit(value, view, ampm) : null);
    const isDisabled = (n: number) => isTimeUnitDisabled(base(), view, n, rules(), ampm);
    const optionId = (n: number) => `${element.id}-${view}-${n}`;
    const numberText = (label: string) =>
      view === "hours"
        ? text.hoursClockNumberText(label)
        : view === "minutes"
          ? text.minutesClockNumberText(label)
          : text.secondsClockNumberText(label);

    const render = () => {
      element.setAttribute("data-ok-view", view);
      if (isValidDate(value)) element.setAttribute("data-ok-value", formatIsoTime(value));
      else element.removeAttribute("data-ok-value");
      const current = unit();
      if (pointer) {
        pointer.hidden = current === null;
        pointer.toggleAttribute(
          "data-ok-inner",
          current !== null && isInnerHour(view, current, ampm),
        );
        pointer.toggleAttribute(
          "data-ok-between",
          current !== null && view !== "hours" && current % 5 !== 0,
        );
        written = syncCustomProperties(
          pointer,
          current === null ? {} : { "--_ok-clock-angle": `${clockAngle(view, current)}deg` },
          written,
        );
      }
      const numbers = clockNumbers(view, ampm);
      const selected = numbers.find((n) => n.value === current);
      const off = disabled();
      const options = numbers.map((number) =>
        h(
          "span",
          {
            id: optionId(number.value),
            role: "option",
            "data-ok-time-clock-number": "",
            "data-ok-position": number.position,
            "data-ok-inner": number.inner,
            "data-ok-value": number.value,
            "aria-label": numberText(number.label),
            "aria-selected": number.value === current ? "true" : null,
            "aria-disabled": off || isDisabled(number.value) ? "true" : null,
          },
          [number.label],
        ),
      );
      const optionsByPosition = listbox.children;
      // Same view, same numbers: patch in place; another view: new numbers.
      if (
        optionsByPosition.length === options.length &&
        [...optionsByPosition].every((o, i) => o.id === options[i]?.id)
      ) {
        options.forEach((option, i) => {
          const old = optionsByPosition[i] as HTMLElement;
          for (const name of ["aria-selected", "aria-disabled", "aria-label"]) {
            const v = option.getAttribute(name);
            if (v === null) old.removeAttribute(name);
            else old.setAttribute(name, v);
          }
        });
      } else listbox.replaceChildren(...options);
      listbox.setAttribute(
        "aria-label",
        text.clockLabelText(
          view,
          isValidDate(value) ? formatTimeText(value, views, ampm, locale) : null,
        ),
      );
      if (selected) listbox.setAttribute("aria-activedescendant", optionId(selected.value));
      else listbox.removeAttribute("aria-activedescendant");
      listbox.tabIndex = off ? -1 : 0;
      if (off) listbox.setAttribute("aria-disabled", "true");
      else listbox.removeAttribute("aria-disabled");
      if (readOnly()) listbox.setAttribute("aria-readonly", "true");
      else listbox.removeAttribute("aria-readonly");
      const pm = base().getHours() >= 12;
      meridiems.forEach((button, index) => {
        button.setAttribute("aria-pressed", String(isValidDate(value) && pm === (index === 1)));
        button.disabled =
          off || readOnly() || isTimeUnitDisabled(base(), "meridiem", index, rules(), ampm);
      });
      const at = views.indexOf(view);
      if (prev) prev.disabled = at <= 0;
      if (next) next.disabled = at >= views.length - 1;
    };

    const setView = (target: TimeView, notify: boolean) => {
      if (!views.includes(target) || target === view) return;
      view = target;
      render();
      if (notify) emit("viewchange", { view });
    };

    const commit = (date: Date, selectionState: "shallow" | "partial" | "finish") => {
      if (!emit("change", { value: formatIsoTime(date), selectionState }, { cancelable: true }))
        return false;
      value = date;
      render();
      return true;
    };

    const pick = (number: number, finish: boolean) => {
      const date = setTimeUnit(base(), view, number, ampm);
      if (!finish) {
        commit(date, "shallow");
        return;
      }
      const after = views[views.indexOf(view) + 1];
      if (commit(date, after ? "partial" : "finish") && after) setView(after, true);
    };

    const controller = createTimeClockController(element, {
      read: () => ({
        view,
        unit: unit(),
        ampm,
        step: view === "hours" ? 1 : step(),
        disabled: disabled(),
        readOnly: readOnly(),
        isDisabled,
      }),
      onChange: pick,
    });

    meridiems.forEach((button, index) => {
      button.addEventListener(
        "click",
        () => commit(setTimeUnit(base(), "meridiem", index, ampm), "partial"),
        { signal },
      );
    });
    prev?.addEventListener(
      "click",
      () => setView(views[views.indexOf(view) - 1] as TimeView, true),
      { signal },
    );
    next?.addEventListener(
      "click",
      () => setView(views[views.indexOf(view) + 1] as TimeView, true),
      { signal },
    );

    render();
    const dates = pickerDateApi(
      element,
      () => instance.value,
      (next) => instance.setValue(next as never),
      false,
    );
    const instance: TimeClockInstance = {
      get date() {
        return dates.get();
      },
      setDate: dates.set,
      setDateAdapter: dates.setAdapter,
      get value() {
        return isValidDate(value) ? formatIsoTime(value) : null;
      },
      setValue(input) {
        const date = toPickerDate(input, reference, readTimezone(element));
        if (date === undefined) return;
        if (date) reference = startOfDay(date);
        value = date;
        render();
      },
      get view() {
        return view;
      },
      setView(target) {
        setView(target, false);
      },
      setShouldDisableTime(fn) {
        functions.shouldDisableTime = asFunction(fn);
        render();
      },
      setLocaleText(next) {
        overrides = { ...overrides, ...next };
        text = readLocaleText(element, overrides);
        render();
      },
      get focusedView() {
        return focus.view as TimeView | null;
      },
      setFocusedView(view) {
        focusPickerViewPart(element, view);
      },
      destroy() {
        controller.destroy();
        focus.destroy();
      },
    };
    return instance;
  },
});
