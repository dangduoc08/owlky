import {
  createDigitalClockController,
  createFocusedViewTracker,
  digitalClockItems,
  digitalClockOptions,
  focusPickerViewPart,
  formatIsoTime,
  isValidDate,
  type PickerLocaleText,
  parseIsoTime,
  readNumber,
  startOfDay,
  type TimeView,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import {
  asFunction,
  h,
  morph,
  type PickerDateApi,
  pickerDateApi,
  pickerToday,
  readAmpm,
  readLocale,
  readTimeRules,
  readTimezone,
  type TimeRuleFunctions,
  toPickerDate,
} from "../date-calendar/picker-dom.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface DigitalClockEvents {
  /** After a view took the focus (`hasFocus` `true`) or lost it. */
  focusedviewchange: EventSpec<{ view: "hours"; hasFocus: boolean }>;
  /** Before a time is picked (`HH:mm:ss`). Call `preventDefault()` to refuse it. */
  change: EventSpec<{ value: string; selectionState: string }, true>;
}

export interface DigitalClockInstance extends ComponentInstance, PickerDateApi {
  /** The view that holds the focus, or `null`. */
  readonly focusedView: "hours" | null;
  /** Moves the focus into a view, when it is shown. */
  setFocusedView(view: "hours"): void;
  /** ISO time (`HH:mm:ss`), or `null`. */
  readonly value: string | null;
  /** Sets the value (ISO time or date time, `Date` or `null`) without events. A `Date` keeps its day. */
  setValue(value: string | Date | null): void;
  /** Disables the times for which the function returns `true` (`null`: none). */
  setShouldDisableTime(fn: ((value: Date, view: TimeView) => boolean) | null): void;
  /** The list's name follows `aria-label` in the markup; texts don't change here. */
  setLocaleText(text: Partial<PickerLocaleText>): void;
}

/** One option row, as the React components render it. */
export interface ListOption {
  value: string;
  label: string;
  selected: boolean;
  disabled: boolean;
}

/**
 * Writes a list's options in place (`morph`: same count → patched, so focus stays), with the
 * roving `tabindex` on the selected option, else the first enabled one.
 */
export function renderOptionList(list: HTMLElement, options: ListOption[], off: boolean): void {
  const focusable = options.find((o) => o.selected) ?? options.find((o) => !o.disabled);
  const nextList = list.cloneNode(false) as HTMLElement;
  nextList.append(
    ...options.map((option) =>
      h(
        "li",
        {
          role: "option",
          "data-ok-digital-clock-item": "",
          "data-ok-value": option.value,
          tabindex: option === focusable && !off ? 0 : -1,
          "aria-selected": String(option.selected),
          "aria-disabled": off || option.disabled ? "true" : null,
        },
        [option.label],
      ),
    ),
  );
  if (off) nextList.setAttribute("aria-disabled", "true");
  else nextList.removeAttribute("aria-disabled");
  morph(list, nextList);
}

/**
 * Digital clock — spec: specs/components/date-picker.md (ADR-0026)
 *
 * Markup:  <div data-ok-digital-clock data-ok-ampm="true" data-ok-time-step="30" [data-ok-value="09:30:00"] …>
 *            <ul role="listbox" data-ok-digital-clock-list aria-label="Select time">
 *              <li role="option" data-ok-digital-clock-item data-ok-value="09:30:00" tabindex="0" aria-selected="true">09:30 AM</li> …
 *          </ul></div>
 * Behavior: core `createDigitalClockController` (arrows move focus; Enter, Space or a press pick).
 * Events:  ok:digital-clock:change (cancelable, `{ value, selectionState: "finish" }`).
 */
export const digitalClock = defineComponent<DigitalClockInstance, DigitalClockEvents>({
  name: "digital-clock",
  selector: "[data-ok-digital-clock]",

  setup(element, { emit }) {
    const focus = createFocusedViewTracker(element, (view, hasFocus) =>
      emit("focusedviewchange", { view: view as "hours", hasFocus }),
    );
    const locale = readLocale(element);
    const functions: TimeRuleFunctions = {};
    const ampm = readAmpm(element, locale);
    const list = element.querySelector<HTMLElement>("[data-ok-digital-clock-list]") as HTMLElement;
    let reference = pickerToday(element);
    let value: Date | null =
      toPickerDate(element.getAttribute("data-ok-value"), reference, readTimezone(element)) ?? null;
    const base = () => (isValidDate(value) ? value : reference);
    const disabled = () => element.hasAttribute("data-ok-disabled");
    const readOnly = () => element.hasAttribute("data-ok-read-only");

    const render = () => {
      if (isValidDate(value)) element.setAttribute("data-ok-value", formatIsoTime(value));
      else element.removeAttribute("data-ok-value");
      const items = digitalClockItems(isValidDate(value) ? value : null, base(), {
        ampm,
        step: Number(readNumber(element, digitalClockOptions.options.timeStep)),
        rules: readTimeRules(element, functions, base()),
        locale,
        skipDisabled: element.hasAttribute("data-ok-skip-disabled"),
      });
      renderOptionList(
        list,
        items.map((item) => ({
          value: formatIsoTime(item.value),
          label: item.label,
          selected: item.selected,
          disabled: item.disabled,
        })),
        disabled(),
      );
      if (readOnly()) list.setAttribute("aria-readonly", "true");
      else list.removeAttribute("aria-readonly");
    };

    const controller = createDigitalClockController(element, {
      read: () => ({ disabled: disabled(), readOnly: readOnly() }),
      onSelect: (item) => {
        const date = parseIsoTime(item.getAttribute("data-ok-value"), base());
        if (!date) return;
        const detail = { value: formatIsoTime(date), selectionState: "finish" };
        if (!emit("change", detail, { cancelable: true })) return;
        value = date;
        render();
      },
    });

    render();
    controller.scrollToSelected();
    const dates = pickerDateApi(
      element,
      () => instance.value,
      (next) => instance.setValue(next as never),
      false,
    );
    const instance: DigitalClockInstance = {
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
      setShouldDisableTime(fn) {
        functions.shouldDisableTime = asFunction(fn);
        render();
      },
      setLocaleText() {
        render();
      },
      get focusedView() {
        return focus.view as "hours" | null;
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
