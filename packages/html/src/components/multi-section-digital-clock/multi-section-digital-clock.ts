import {
  type ClockSectionView,
  createDigitalClockController,
  formatIsoTime,
  isValidDate,
  normalizeTimeViews,
  type PickerLocaleText,
  parseTimeSteps,
  setTimeUnit,
  startOfDay,
  type TimeView,
  timeSectionOptions,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import {
  asFunction,
  readAmpm,
  readLocale,
  readLocaleText,
  readTimeRules,
  type TimeRuleFunctions,
  toPickerDate,
} from "../date-calendar/picker-dom.js";
import { renderOptionList } from "../digital-clock/digital-clock.js";

export interface MultiSectionDigitalClockInstance extends ComponentInstance {
  /** ISO time (`HH:mm:ss`), or `null`. */
  readonly value: string | null;
  /** Sets the value (ISO time or date time, `Date` or `null`) without events. A `Date` keeps its day. */
  setValue(value: string | Date | null): void;
  setShouldDisableTime(fn: ((value: Date, view: TimeView) => boolean) | null): void;
  setLocaleText(text: Partial<PickerLocaleText>): void;
}

/**
 * Multi-section digital clock — spec: specs/components/date-picker.md (ADR-0026)
 *
 * Markup:  <div role="group" data-ok-multi-section-digital-clock data-ok-ampm="true" data-ok-views="hours minutes"
 *               data-ok-time-steps="1 5 5" [data-ok-value="09:30:00"] …>
 *            <ul role="listbox" data-ok-digital-clock-section="hours" aria-label="Select hours">
 *              <li role="option" data-ok-digital-clock-item data-ok-value="9" tabindex="0" aria-selected="true">09</li> …
 *            </ul> … <ul … data-ok-digital-clock-section="meridiem">…</ul>
 *          </div>
 * Behavior: core `createDigitalClockController`; a pick moves focus to the next column.
 * Events:  ok:multi-section-digital-clock:change (cancelable, `{ value, selectionState }`:
 *          `partial`, `finish` after the last column).
 */
export const multiSectionDigitalClock = defineComponent<MultiSectionDigitalClockInstance>({
  name: "multi-section-digital-clock",
  selector: "[data-ok-multi-section-digital-clock]",

  setup(element, { emit }) {
    const locale = readLocale(element);
    let overrides: Partial<PickerLocaleText> | undefined;
    let text = readLocaleText(element);
    const functions: TimeRuleFunctions = {};
    const ampm = readAmpm(element, locale);
    const views = normalizeTimeViews(element.getAttribute("data-ok-views")?.split(/\s+/));
    const steps = parseTimeSteps(element.getAttribute("data-ok-time-steps") ?? "");
    const sections: ClockSectionView[] = [...views, ...(ampm ? (["meridiem"] as const) : [])];
    const lists = () => [
      ...element.querySelectorAll<HTMLElement>("[data-ok-digital-clock-section]"),
    ];
    let reference = startOfDay(new Date());
    let value: Date | null = toPickerDate(element.getAttribute("data-ok-value"), reference) ?? null;
    const base = () => (isValidDate(value) ? value : reference);
    const disabled = () => element.hasAttribute("data-ok-disabled");
    const readOnly = () => element.hasAttribute("data-ok-read-only");

    const render = () => {
      if (isValidDate(value)) element.setAttribute("data-ok-value", formatIsoTime(value));
      else element.removeAttribute("data-ok-value");
      const rules = readTimeRules(element, functions, base());
      const skipDisabled = element.hasAttribute("data-ok-skip-disabled");
      lists().forEach((list) => {
        const section = list.getAttribute("data-ok-digital-clock-section") as ClockSectionView;
        if (!sections.includes(section)) return;
        const options = timeSectionOptions(section, isValidDate(value) ? value : null, base(), {
          ampm,
          step: section === "meridiem" ? 1 : steps[section],
          rules,
          locale,
          skipDisabled,
        });
        renderOptionList(
          list,
          options.map((o) => ({ ...o, value: String(o.value) })),
          disabled(),
        );
        list.setAttribute("aria-label", text.selectViewText(section));
        if (readOnly()) list.setAttribute("aria-readonly", "true");
        else list.removeAttribute("aria-readonly");
      });
    };

    const controller = createDigitalClockController(element, {
      read: () => ({ disabled: disabled(), readOnly: readOnly() }),
      onSelect: (item) => {
        const list = item.closest("[data-ok-digital-clock-section]") as HTMLElement;
        const section = list.getAttribute("data-ok-digital-clock-section") as ClockSectionView;
        const at = sections.indexOf(section);
        if (at === -1) return;
        const date = setTimeUnit(base(), section, Number(item.getAttribute("data-ok-value")), ampm);
        const last = at === sections.length - 1;
        const detail = { value: formatIsoTime(date), selectionState: last ? "finish" : "partial" };
        if (!emit("change", detail, { cancelable: true })) return;
        value = date;
        render();
        if (!last) controller.focusList(at + 1);
      },
    });

    render();
    controller.scrollToSelected();
    return {
      get value() {
        return isValidDate(value) ? formatIsoTime(value) : null;
      },
      setValue(input) {
        const date = toPickerDate(input, reference);
        if (date === undefined) return;
        if (date) reference = startOfDay(date);
        value = date;
        render();
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
      destroy() {
        controller.destroy();
      },
    };
  },
});
