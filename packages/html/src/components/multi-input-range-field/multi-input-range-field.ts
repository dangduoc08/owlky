import {
  type DateRange,
  formatIsoRange,
  invalidDate,
  isValidDate,
  type RangeValidationError,
  validateRange,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import {
  type PickerDateApi,
  pickerDateApi,
  pickerToday,
  readRules,
  readTimeRules,
  readTimezone,
  readValueType,
  toPickerDate,
} from "../date-calendar/picker-dom.js";
import type { DateFieldInstance } from "../date-field/date-field.js";
import { toRange } from "../date-range-calendar/date-range-calendar.js";

export interface MultiInputRangeFieldInstance extends ComponentInstance, PickerDateApi {
  /** The range as an ISO 8601 interval (`start/end`), or `null` when both fields are empty. */
  readonly value: string | null;
  /** `[start, end]` errors (`invalidRange` on both when the end comes first). */
  readonly validationError: [RangeValidationError | null, RangeValidationError | null];
  /** Sets both fields (ISO interval or `[start, end]`), without events. */
  setValue(value: string | readonly (Date | string | null)[] | null): void;
}

/**
 * Multi input range field — spec: specs/components/date-picker.md (ADR-0028)
 *
 * Markup:  <div role="group" data-ok-multi-input-range-field [data-ok-value-type="time"] [data-ok-value="2025-05-20/2025-05-25"]>
 *            <div data-ok-text-field data-ok-date-field …>…start field…</div>
 *            <span data-ok-multi-input-range-field-separator aria-hidden="true">–</span>
 *            <div data-ok-text-field data-ok-date-field …>…end field…</div>
 *          </div>
 * Behavior: the two `date-field` runtimes edit each end; this runtime validates the range and
 *          marks both fields as errors when the end comes first (`invalidRange`).
 * Events:  ok:multi-input-range-field:change (cancelable, `{ value, validationError }`); canceling
 *          it cancels the field's change.
 */
export const multiInputRangeField = defineComponent<MultiInputRangeFieldInstance>({
  name: "multi-input-range-field",
  selector: "[data-ok-multi-input-range-field]",

  setup(element, { emit, signal, runtime }) {
    const type = readValueType(element);
    // The start and the end field.
    const fieldEls = [
      ...element.querySelectorAll<HTMLElement>(":scope > [data-ok-date-field]"),
    ].slice(0, 2) as [HTMLElement, HTMLElement];
    const fields = () =>
      fieldEls.map((el) => runtime.getOrCreate<DateFieldInstance>(el, "date-field"));
    const today = () => pickerToday(element);
    const read = (el: HTMLElement) =>
      toPickerDate(el.getAttribute("data-ok-value"), today(), readTimezone(element)) ?? null;
    let value: DateRange = [read(fieldEls[0]), read(fieldEls[1])];

    const validate = (range: DateRange) => {
      const reference = isValidDate(range[0]) ? range[0] : today();
      const source = fieldEls[0];
      return validateRange(range, type, {
        ...readRules(source),
        ...(type === "date" ? {} : readTimeRules(source, {}, reference)),
      });
    };
    const render = () => {
      const iso = formatIsoRange(value, type);
      if (iso) element.setAttribute("data-ok-value", iso);
      else element.removeAttribute("data-ok-value");
      const errors = validate(value);
      // The range error marks both fields; each field keeps its own errors otherwise.
      fields().forEach((field, side) => {
        field?.setError(errors[side] === "invalidRange" ? true : null);
      });
    };

    element.addEventListener(
      "ok:date-field:change",
      (event) => {
        // Only the two fields hold date fields.
        const side = fieldEls.indexOf(event.target as HTMLElement);
        const detail = (event as CustomEvent<{ value: string | null; validationError: unknown }>)
          .detail;
        const reference = isValidDate(value[0]) ? value[0] : today();
        const date =
          toPickerDate(detail.value, reference, readTimezone(element)) ??
          (detail.validationError === "invalidDate" ? invalidDate() : null);
        const next: DateRange = side === 0 ? [date, value[1]] : [value[0], date];
        const errors = validate(next);
        if (
          !emit(
            "change",
            { value: formatIsoRange(next, type) || null, validationError: errors },
            { cancelable: true },
          )
        ) {
          event.preventDefault();
          return;
        }
        value = next;
        // The field stores its own value after this event.
        queueMicrotask(render);
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
    const instance: MultiInputRangeFieldInstance = {
      get date() {
        return dates.get();
      },
      setDate: dates.set,
      setDateAdapter: dates.setAdapter,
      get value() {
        return formatIsoRange(value, type) || null;
      },
      get validationError() {
        return validate(value);
      },
      setValue(next) {
        const range = toRange(next, today(), readTimezone(element));
        if (range === undefined) return;
        value = range;
        fields().forEach((field, side) => {
          field?.setValue(range[side] ?? null);
        });
        render();
      },
    };
    return instance;
  },
});
