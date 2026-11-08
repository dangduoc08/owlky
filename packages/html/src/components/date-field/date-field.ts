import {
  createFieldController,
  type DateValidationError,
  defaultDateFormat,
  type FormatSection,
  formatIsoDate,
  isSamePickerValue,
  isValidDate,
  normalizeDateViews,
  type PickerLocaleText,
  parseFormat,
  parseIsoDate,
  sectionAria,
  sectionPlaceholder,
  sectionsToDate,
  sectionValues,
  startOfDay,
  validateDate,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import {
  asFunction,
  type RuleFunctions,
  readLocale,
  readLocaleText,
  readRules,
  toDate,
} from "../date-calendar/picker-dom.js";

export interface DateFieldInstance extends ComponentInstance {
  /** ISO date (`YYYY-MM-DD`), or `null` when empty or partly filled. */
  readonly value: string | null;
  /** Why the value is invalid, or `null`. */
  readonly validationError: DateValidationError | null;
  /** Sets the value (ISO string, `Date` or `null`) without emitting events. Invalid input is ignored. */
  setValue(value: string | Date | null): void;
  /** Focuses a section (default: the first). */
  focus(section?: number): void;
  /** Days, months or years that can't be picked (functions have no attribute). */
  setShouldDisableDate(fn: ((day: Date) => boolean) | null): void;
  setShouldDisableMonth(fn: ((month: Date) => boolean) | null): void;
  setShouldDisableYear(fn: ((year: Date) => boolean) | null): void;
  /** Text overrides (MUI `localeText` keys). */
  setLocaleText(text: Partial<PickerLocaleText>): void;
}

/**
 * Date field — spec: specs/components/date-picker.md
 *
 * Markup:  <div data-ok-text-field data-ok-variant="outlined" … data-ok-date-field data-ok-format="MM/DD/YYYY"
 *               [data-ok-value="2025-05-25"] [data-ok-min-date] [data-ok-max-date] [data-ok-disable-past] …>
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
    const locale = readLocale(element);
    let overrides: Partial<PickerLocaleText> | undefined;
    let text = readLocaleText(element);
    const functions: RuleFunctions = {};
    const format =
      element.getAttribute("data-ok-format")?.slice(0, 256) ??
      defaultDateFormat(
        normalizeDateViews(element.getAttribute("data-ok-views")?.split(/\s+/)),
        locale,
      );
    const sections = parseFormat(format);
    const spinbuttons = () => [...group.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
    const isDisabled = () => hidden?.disabled === true;
    const isReadOnly = () => element.hasAttribute("data-ok-read-only");

    let value: Date | null = parseIsoDate(element.getAttribute("data-ok-value"));
    let texts = sectionValues(value, sections, locale);
    let active = Math.max(
      spinbuttons().findIndex((s) => s.getAttribute("tabindex") === "0"),
      0,
    );

    const rules = () => readRules(element, functions);
    const placeholders = () => sections.map((s) => sectionPlaceholder(s, text));

    const render = () => {
      const marks = placeholders();
      spinbuttons().forEach((span, i) => {
        const shown = texts[i] || (marks[i] as string);
        if (span.textContent !== shown) span.textContent = shown;
        const aria = sectionAria(i, texts, sections, locale, text);
        if (aria.now === undefined) span.removeAttribute("aria-valuenow");
        else span.setAttribute("aria-valuenow", String(aria.now));
        span.setAttribute("aria-valuemin", String(aria.min));
        span.setAttribute("aria-valuemax", String(aria.max));
        span.setAttribute("aria-valuetext", aria.valueText);
        span.setAttribute("tabindex", isDisabled() ? "-1" : i === active ? "0" : "-1");
      });
      const filled = texts.some((t) => t !== "");
      element.toggleAttribute("data-ok-shrink", filled);
      const valid = isValidDate(value) ? value : null;
      if (valid) element.setAttribute("data-ok-value", formatIsoDate(valid));
      else element.removeAttribute("data-ok-value");
      if (hidden) hidden.value = valid ? formatIsoDate(valid) : "";
      const error = validateDate(value, rules()) !== null;
      element.toggleAttribute("data-ok-error", error);
      if (error) group.setAttribute("aria-invalid", "true");
      else group.removeAttribute("aria-invalid");
      if (clear) clear.hidden = !filled || isDisabled() || isReadOnly();
      controller.sync();
    };

    const reference = () => (isValidDate(value) ? value : startOfDay(new Date()));

    const commit = (next: string[]) => {
      const date = sectionsToDate(next, sections, locale, reference());
      if (isSamePickerValue(date, value)) {
        texts = next;
        render();
        return;
      }
      const validationError = validateDate(date, rules());
      const detail = { value: isValidDate(date) ? formatIsoDate(date) : null, validationError };
      if (!emit("change", detail, { cancelable: true })) {
        render();
        return;
      }
      texts = next;
      value = date;
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
        return isValidDate(value) ? formatIsoDate(value) : null;
      },
      get validationError() {
        return validateDate(value, rules());
      },
      setValue(next) {
        const date = toDate(next);
        if (date === undefined) return;
        value = date;
        texts = sectionValues(date, sections, locale);
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
