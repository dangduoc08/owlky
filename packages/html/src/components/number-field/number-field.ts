import {
  clampNumber,
  createNumberFieldController,
  formatNumberInput,
  type NumberFieldChangeReason,
  numberFieldOptions,
  numberFieldState,
  parseNumberInput,
  readNumberFieldSettings,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

const INPUT = ":scope > [data-ok-text-field-control] > [data-ok-text-field-input]";
const { min, max } = numberFieldOptions.options;

/** A number field's instance. */
export interface NumberFieldInstance extends ComponentInstance {
  /** The value: a number, or `null` when the field is empty. */
  getValue(): number | null;
  /** Sets the value (kept within `min` / `max` unless out-of-range values are allowed). Fires no event. */
  setValue(value: number | null): void;
  /** One step up, as a press of the increment button (`amount` defaults to the step). */
  stepUp(amount?: number): void;
  /** One step down, as a press of the decrement button (`amount` defaults to the step). */
  stepDown(amount?: number): void;
}

/** Events of a number field (`ok:number-field:<name>`), fired on its root. */
export interface NumberFieldEvents {
  /**
   * A new value, with why it changed (`detail.reason`: `input-change`, `input-clear`,
   * `input-blur`, `keyboard`, `increment-press` or `decrement-press`). Typing reports values as
   * they become numbers. `preventDefault()` refuses the value.
   */
  change: EventSpec<{ value: number | null; reason: NumberFieldChangeReason }, true>;
  /**
   * The person finished a change (a step, a press, Enter, leaving the input): `detail.value` is
   * the field's value, shown again as its text.
   */
  commit: EventSpec<{ value: number | null; reason: NumberFieldChangeReason }>;
}

/** Writes `value` to `attribute`, or removes it, only when it differs (no mutation otherwise). */
function syncAttribute(element: Element, attribute: string, value: string | null) {
  if (element.getAttribute(attribute) === value) return;
  if (value === null) element.removeAttribute(attribute);
  else element.setAttribute(attribute, value);
}

/**
 * Number field — spec: specs/components/text-field.md (number input, roadmap 4.24)
 *
 * Markup:  <div data-ok-text-field data-ok-variant="outlined" … data-ok-number-field data-ok-min="0">
 *            <label data-ok-text-field-label for="guests">Guests</label>
 *            <div data-ok-text-field-control>
 *              <span data-ok-text-field-adornment="start"><button type="button" data-ok-icon-button …
 *                tabindex="-1" aria-label="Decrease" aria-controls="guests" data-ok-number-field-decrement>…</button></span>
 *              <input id="guests" data-ok-text-field-input placeholder=" " role="spinbutton"
 *                inputmode="decimal" aria-valuenow="0" aria-valuemin="0" value="0">
 *              <span data-ok-text-field-adornment="end"><button … data-ok-number-field-increment>…</button></span>
 *              <fieldset data-ok-text-field-outline aria-hidden="true">…</fieldset>
 *            </div>
 *          </div>
 * The value is the input's text when the runtime starts. Keys, presses, typing and leaving the
 * input go through the core controller; the runtime keeps the value, rewrites the text on each
 * commit and keeps `aria-valuenow` / `-min` / `-max` and the buttons' `disabled` in step.
 */
export const numberField = defineComponent<NumberFieldInstance, NumberFieldEvents>({
  name: "number-field",
  selector: "[data-ok-number-field]",

  setup(element, { emit }) {
    const input = () => element.querySelector<HTMLInputElement>(INPUT);
    let value: number | null = parseNumberInput(input()?.value ?? "") ?? null;

    const sync = () => {
      const field = input();
      if (!field) return;
      const settings = readNumberFieldSettings(element);
      syncAttribute(field, "aria-valuenow", value === null ? null : String(value));
      syncAttribute(
        field,
        "aria-valuemin",
        settings.min === undefined ? null : String(settings.min),
      );
      syncAttribute(
        field,
        "aria-valuemax",
        settings.max === undefined ? null : String(settings.max),
      );
      const state = numberFieldState(value, settings, field.disabled || field.readOnly);
      for (const [selector, can] of [
        ["[data-ok-number-field-decrement]", state.canDecrement],
        ["[data-ok-number-field-increment]", state.canIncrement],
      ] as const) {
        const button = element.querySelector<HTMLButtonElement>(selector);
        if (button && button.disabled === can) button.disabled = !can;
      }
    };
    const write = () => {
      const field = input();
      if (field) field.value = formatNumberInput(value);
    };

    const controller = createNumberFieldController(element, {
      getValue: () => value,
      onChange(next, { reason }) {
        if (!emit("change", { value: next, reason }, { cancelable: true })) return;
        value = next;
        sync();
      },
      onCommit(_next, { reason }) {
        write();
        sync();
        emit("commit", { value, reason });
      },
    });

    sync();
    // Bounds on the root and the input's disabled / read-only state change what the buttons do.
    const observer = new MutationObserver(sync);
    observer.observe(element, { attributes: true, attributeFilter: [min.attr, max.attr] });
    const field = input();
    if (field)
      observer.observe(field, { attributes: true, attributeFilter: ["disabled", "readonly"] });

    return {
      getValue: () => value,
      setValue(next) {
        const settings = readNumberFieldSettings(element);
        value =
          next === null || !Number.isFinite(next)
            ? null
            : settings.allowOutOfRange
              ? next
              : clampNumber(next, settings);
        write();
        sync();
      },
      stepUp(amount) {
        controller.step(1, amount);
      },
      stepDown(amount) {
        controller.step(-1, amount);
      },
      destroy() {
        observer.disconnect();
        controller.destroy();
      },
    };
  },
});
