import {
  createFieldController,
  type DateRange,
  defaultPickerFormat,
  type FormatSection,
  formatIsoRange,
  isSamePickerValue,
  isValidDate,
  type PickerLocaleText,
  type PickerValidationError,
  parseFormat,
  parseIsoRange,
  parsePickerValue,
  pickerValueIso,
  pickerViewsOf,
  type RangeValidationError,
  rangeError,
  rangeFieldSections,
  sectionAria,
  sectionPlaceholder,
  sectionsToDate,
  sectionValues,
  startOfDay,
  type TimeView,
  validatePickerValue,
  validateRange,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import {
  asFunction,
  type RuleFunctions,
  readAmpm,
  readLocale,
  readLocaleText,
  readRules,
  readTimeRules,
  readValueType,
  type TimeRuleFunctions,
  toPickerDate,
} from "../date-calendar/picker-dom.js";
import { toRange } from "../date-range-calendar/date-range-calendar.js";

export interface DateFieldInstance extends ComponentInstance {
  /**
   * ISO value, or `null` when empty or partly filled: `YYYY-MM-DD`, `HH:mm:ss` (time fields) or
   * `YYYY-MM-DDTHH:mm:ss` (date time fields). Range fields (`data-ok-range`, ADR-0028): the ISO
   * interval `start/end` (a partly filled side is empty).
   */
  readonly value: string | null;
  /** Why the value is invalid, or `null`; range fields: `[start, end]` errors. */
  readonly validationError:
    | PickerValidationError
    | null
    | [RangeValidationError | null, RangeValidationError | null];
  /**
   * Sets the value (ISO string, `Date` or `null`; range fields: an ISO interval or a
   * `[start, end]` pair) without emitting events. Invalid input is ignored.
   */
  setValue(value: string | Date | readonly (Date | string | null)[] | null): void;
  /** Forces the error state (`true` / `false`), or follows the validation again (`null`). */
  setError(error: boolean | null): void;
  /** Focuses a section (default: the first). */
  focus(section?: number): void;
  /** Days, months or years that can't be picked (functions have no attribute). */
  setShouldDisableDate(fn: ((day: Date) => boolean) | null): void;
  setShouldDisableMonth(fn: ((month: Date) => boolean) | null): void;
  setShouldDisableYear(fn: ((year: Date) => boolean) | null): void;
  /** Times that can't be picked (time and date time fields). */
  setShouldDisableTime(fn: ((value: Date, view: TimeView) => boolean) | null): void;
  /** Text overrides (MUI `localeText` keys). */
  setLocaleText(text: Partial<PickerLocaleText>): void;
}

/**
 * Date field — spec: specs/components/date-picker.md. Also the time and date time fields
 * (`data-ok-value-type="time" | "date-time"`, ADR-0026).
 *
 * Markup:  <div data-ok-text-field data-ok-variant="outlined" … data-ok-date-field data-ok-format="MM/DD/YYYY"
 *               [data-ok-value-type="time"] [data-ok-value="2025-05-25"] [data-ok-min-date] [data-ok-max-date]
 *               [data-ok-min-time] [data-ok-max-time] [data-ok-disable-past] …>
 *            <label data-ok-text-field-label id="f-label">Date</label>
 *            <div data-ok-text-field-control>
 *              <div id="f" role="group" data-ok-text-field-input data-ok-date-field-sections aria-labelledby="f-label">
 *                <span data-ok-date-field-section><span data-ok-date-field-content role="spinbutton" …>05</span>
 *                  <span data-ok-date-field-separator>/</span></span> …
 *              </div>
 *              <input type="hidden" data-ok-date-field-input name="…" value="2025-05-25">
 *              …end adornment, outline…
 * Behavior: core `createFieldController` handles keys, typing and paste; this runtime writes the
 *          section texts, ARIA values, the hidden input and `data-ok-shrink` / `data-ok-error`.
 * Events:  ok:date-field:change (cancelable, `{ value, validationError }`), ok:date-field:clear.
 */
export const dateField = defineComponent<DateFieldInstance>({
  name: "date-field",
  selector: "[data-ok-date-field]",

  setup(element, { emit, signal }) {
    const group = element.querySelector<HTMLElement>(
      "[data-ok-date-field-sections]",
    ) as HTMLElement;
    const hidden = element.querySelector<HTMLInputElement>("[data-ok-date-field-input]");
    const clear = element.querySelector<HTMLElement>("[data-ok-date-field-clear]");
    const type = readValueType(element);
    const locale = readLocale(element);
    let overrides: Partial<PickerLocaleText> | undefined;
    let text = readLocaleText(element);
    const functions: RuleFunctions = {};
    const timeFunctions: TimeRuleFunctions = {};
    const format =
      element.getAttribute("data-ok-format")?.slice(0, 256) ??
      defaultPickerFormat(
        pickerViewsOf(element.getAttribute("data-ok-views")?.split(/\s+/), type),
        type,
        readAmpm(element, locale),
        locale,
      );
    // Range fields: the format twice, joined by " – " (each section knows its side).
    const isRange = element.hasAttribute("data-ok-range");
    const { sections, count } = isRange
      ? rangeFieldSections(format)
      : { sections: parseFormat(format), count: 0 };
    const sides = isRange ? 2 : 1;
    const part = (side: number): [number, number] =>
      isRange ? [side * count, side * count + count] : [0, sections.length];
    const spinbuttons = () => [...group.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
    const isDisabled = () => hidden?.disabled === true;
    const isReadOnly = () => element.hasAttribute("data-ok-read-only");
    const today = () => startOfDay(new Date());

    let forcedError: boolean | null = null;
    /** One date, or the start and the end of a range field. */
    const readSides = (text: string | null): (Date | null)[] =>
      isRange ? (parseIsoRange(text, today()) ?? [null, null]) : [parsePickerValue(text, today())];
    const textsOf = (list: (Date | null)[]) =>
      list.flatMap((date, side) => {
        const [from, to] = part(side);
        return sectionValues(date, sections.slice(from, to), locale);
      });
    let values = readSides(element.getAttribute("data-ok-value"));
    let texts = textsOf(values);
    let active = Math.max(
      spinbuttons().findIndex((s) => s.getAttribute("tabindex") === "0"),
      0,
    );

    const reference = (side = 0) => {
      const own = values[side];
      if (isValidDate(own)) return own;
      return isValidDate(values[0]) ? values[0] : today();
    };
    const rules = () => ({
      ...readRules(element, functions),
      ...(type === "date" ? {} : readTimeRules(element, timeFunctions, reference())),
    });
    const validateAll = (list: (Date | null)[]) =>
      isRange
        ? validateRange(list as DateRange, type, rules())
        : validatePickerValue(list[0] as Date | null, type, rules());
    const errorOf = (list: (Date | null)[]) => {
      const result = validateAll(list);
      return Array.isArray(result) ? rangeError(result) : result;
    };
    const iso = (list: (Date | null)[]) => {
      if (isRange) return formatIsoRange(list as DateRange, type) || null;
      const date = list[0] as Date | null;
      return isValidDate(date) ? pickerValueIso(date, type) : null;
    };
    const sameValues = (a: (Date | null)[], b: (Date | null)[]) =>
      a.every((date, i) => isSamePickerValue(date, b[i] as Date | null));
    const placeholders = () => sections.map((s) => sectionPlaceholder(s, text));

    const render = () => {
      const marks = placeholders();
      spinbuttons().forEach((span, i) => {
        const shown = texts[i] || (marks[i] as string);
        if (span.textContent !== shown) span.textContent = shown;
        const side = isRange && i >= count ? 1 : 0;
        const [from, to] = part(side);
        const aria = sectionAria(
          i - from,
          texts.slice(from, to),
          sections.slice(from, to),
          locale,
          text,
        );
        if (aria.now === undefined) span.removeAttribute("aria-valuenow");
        else span.setAttribute("aria-valuenow", String(aria.now));
        span.setAttribute("aria-valuemin", String(aria.min));
        span.setAttribute("aria-valuemax", String(aria.max));
        span.setAttribute("aria-valuetext", aria.valueText);
        span.setAttribute("tabindex", isDisabled() ? "-1" : i === active ? "0" : "-1");
      });
      const filled = texts.some((t) => t !== "");
      element.toggleAttribute("data-ok-shrink", filled);
      const shown = iso(values);
      if (shown) element.setAttribute("data-ok-value", shown);
      else element.removeAttribute("data-ok-value");
      if (hidden) hidden.value = shown ?? "";
      const error = forcedError ?? errorOf(values) !== null;
      element.toggleAttribute("data-ok-error", error);
      if (error) group.setAttribute("aria-invalid", "true");
      else group.removeAttribute("aria-invalid");
      if (clear) clear.hidden = !filled || isDisabled() || isReadOnly();
      controller.sync();
    };

    const commit = (next: string[]) => {
      const list = Array.from({ length: sides }, (_, side) => {
        const [from, to] = part(side);
        return sectionsToDate(
          next.slice(from, to),
          sections.slice(from, to),
          locale,
          reference(side),
        );
      });
      if (sameValues(list, values)) {
        texts = next;
        render();
        return;
      }
      const detail = { value: iso(list), validationError: validateAll(list) };
      if (!emit("change", detail, { cancelable: true })) {
        render();
        return;
      }
      texts = next;
      values = list;
      render();
    };

    const controller = createFieldController(group, {
      read: () => ({
        sections,
        values: texts,
        placeholders: placeholders(),
        locale,
        reference: reference(),
        disabled: isDisabled(),
        readOnly: isReadOnly(),
      }),
      onValuesChange: commit,
      onActiveSectionChange: (index) => {
        active = index;
        render();
      },
    });

    clear?.addEventListener(
      "click",
      () => {
        commit(sections.map(() => ""));
        emit("clear");
        controller.focusSection(0);
      },
      { signal },
    );

    render();
    return {
      get value() {
        return iso(values);
      },
      get validationError() {
        return validateAll(values);
      },
      setValue(next) {
        if (isRange) {
          const range = toRange(next, reference());
          if (range === undefined) return;
          values = range;
        } else {
          const date = Array.isArray(next) ? undefined : toPickerDate(next, reference());
          if (date === undefined) return;
          values = [date];
        }
        texts = textsOf(values);
        render();
      },
      setError(error) {
        forcedError = typeof error === "boolean" ? error : null;
        render();
      },
      focus(section = 0) {
        controller.focusSection(section);
      },
      setShouldDisableDate(fn) {
        functions.shouldDisableDate = asFunction(fn);
        render();
      },
      setShouldDisableMonth(fn) {
        functions.shouldDisableMonth = asFunction(fn);
        render();
      },
      setShouldDisableYear(fn) {
        functions.shouldDisableYear = asFunction(fn);
        render();
      },
      setShouldDisableTime(fn) {
        timeFunctions.shouldDisableTime = asFunction(fn);
        render();
      },
      setLocaleText(next) {
        overrides = { ...overrides, ...next };
        text = readLocaleText(element, overrides);
        spinbuttons().forEach((span, i) => {
          span.setAttribute("aria-label", text[(sections[i] as FormatSection).type]);
        });
        render();
      },
      destroy() {
        controller.destroy();
      },
    };
  },
});
