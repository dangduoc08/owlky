/*
 * Number field (roadmap 4.24) — spec: specs/components/text-field.md. A text field whose input
 * is a WAI-ARIA spin button: increment / decrement buttons in the adornments, Arrow Up / Down,
 * Page Up / Down, Home / End. The model (parse, step, clamp) is pure; the controller listens
 * on the field and reports intent (`onChange`, `onCommit`): owners keep the value and write the
 * input's text, `aria-valuenow` and the buttons' `disabled` from `numberFieldState`.
 */
import { numberFieldOptions } from "../anatomy/anatomy.js";
import { parseNumber, readNumber } from "../options/define.js";

/** Why the value changed (Base UI's `eventDetails.reason` names). */
export type NumberFieldChangeReason =
  | "input-change"
  | "input-clear"
  | "input-blur"
  | "keyboard"
  | "increment-press"
  | "decrement-press";

export interface NumberFieldChangeDetails {
  readonly reason: NumberFieldChangeReason;
}

/** The number options a field works with (from its root's attributes or React's props). */
export interface NumberFieldSettings {
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly step: number;
  readonly smallStep: number;
  readonly largeStep: number;
  readonly snapOnStep: boolean;
  readonly allowOutOfRange: boolean;
}

const { min, max, step, smallStep, largeStep, snapOnStep, allowOutOfRange } =
  numberFieldOptions.options;

/** A positive amount, else the default (a step of 0 would never move). */
const positive = (value: unknown, fallback: number) => {
  const parsed = parseNumber(step, value);
  return typeof parsed === "number" && parsed > 0 ? parsed : fallback;
};
const finite = (value: unknown) => {
  const parsed = parseNumber(min, value);
  return typeof parsed === "number" ? parsed : undefined;
};

/** Settings from option values (React props): invalid values fall back to the defaults. */
export function numberFieldSettings(
  options: {
    min?: unknown;
    max?: unknown;
    step?: unknown;
    smallStep?: unknown;
    largeStep?: unknown;
    snapOnStep?: boolean | undefined;
    allowOutOfRange?: boolean | undefined;
  } = {},
): NumberFieldSettings {
  return {
    min: finite(options.min),
    max: finite(options.max),
    step: positive(options.step, step.default as number),
    smallStep: positive(options.smallStep, smallStep.default as number),
    largeStep: positive(options.largeStep, largeStep.default as number),
    snapOnStep: options.snapOnStep === true,
    allowOutOfRange: options.allowOutOfRange === true,
  };
}

/** Settings from a number field root's attributes (HTML, and React's rendered markup). */
export function readNumberFieldSettings(root: Element): NumberFieldSettings {
  return numberFieldSettings({
    min: readNumber(root, min),
    max: readNumber(root, max),
    step: readNumber(root, step),
    smallStep: readNumber(root, smallStep),
    largeStep: readNumber(root, largeStep),
    snapOnStep: root.hasAttribute(snapOnStep.attr),
    allowOutOfRange: root.hasAttribute(allowOutOfRange.attr),
  });
}

const NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;

/**
 * The number typed in a field: `null` when it is empty, `undefined` when the text isn't a number
 * (such as `-` while typing). Spaces are ignored and typographic minus signs count as `-`.
 */
export function parseNumberInput(text: string): number | null | undefined {
  const compact = text.replace(/\s+/g, "").replace(/[−﹣－]/g, "-");
  if (compact === "") return null;
  if (compact.length > 64 || !NUMBER.test(compact)) return undefined;
  const value = Number(compact);
  return Number.isFinite(value) ? value : undefined;
}

/** The text a field shows for a value. */
export const formatNumberInput = (value: number | null): string =>
  value === null ? "" : String(value);

/** `value` within the settings' `min` / `max`. */
export function clampNumber(value: number, settings: Pick<NumberFieldSettings, "min" | "max">) {
  let next = value;
  if (settings.max !== undefined && next > settings.max) next = settings.max;
  if (settings.min !== undefined && next < settings.min) next = settings.min;
  return next;
}

/** Digits after the point that `value` needs (`0.1` → 1, `1e-7` → 7). */
function decimals(value: number): number {
  const [mantissa = "", exponent = "0"] = String(value).toLowerCase().split("e");
  const fraction = mantissa.split(".")[1]?.length ?? 0;
  return Math.max(0, fraction - Number(exponent));
}

/**
 * The value one step up (`direction` 1) or down (-1) by `amount`, kept within `min` / `max` and
 * rounded to the precision of its terms (0.1 + 0.2 = 0.3). From an empty field: 0, or the
 * nearest bound. With `snapOnStep`, it lands on a multiple of `amount` counted from `min` (or 0).
 */
export function stepNumberValue(
  value: number | null,
  direction: 1 | -1,
  amount: number,
  settings: NumberFieldSettings,
): number {
  if (value === null) return clampNumber(0, settings);
  const origin = settings.min ?? 0;
  const places = Math.min(100, Math.max(decimals(value), decimals(amount), decimals(origin)));
  let next: number;
  if (settings.snapOnStep) {
    // A small tolerance keeps values that are already on a step (in floating point) there.
    const steps = (value - origin) / amount;
    const index = direction > 0 ? Math.floor(steps + 1e-9) + 1 : Math.ceil(steps - 1e-9) - 1;
    next = origin + index * amount;
  } else next = value + direction * amount;
  return clampNumber(Number(next.toFixed(places)), settings);
}

/** What owners render from a value: whether each button can act. */
export interface NumberFieldState {
  readonly canDecrement: boolean;
  readonly canIncrement: boolean;
}

/** Whether the buttons can step `value` (never when the field is disabled or read-only). */
export function numberFieldState(
  value: number | null,
  settings: Pick<NumberFieldSettings, "min" | "max">,
  locked = false,
): NumberFieldState {
  return {
    canDecrement: !locked && (value === null || settings.min === undefined || value > settings.min),
    canIncrement: !locked && (value === null || settings.max === undefined || value < settings.max),
  };
}

export interface NumberFieldCallbacks {
  /** The value the owner holds now (controlled or not). */
  getValue(): number | null;
  /** A new value: store it (or refuse it). Typing reports parsed values without rewriting text. */
  onChange(value: number | null, details: NumberFieldChangeDetails): void;
  /**
   * The person finished a change (a step, a press, Enter, leaving the input): show the value the
   * owner holds as the input's text (`formatNumberInput`), so refused or invalid text goes away.
   */
  onCommit(value: number | null, details: NumberFieldChangeDetails): void;
}

export interface NumberFieldController {
  /** Steps like a press of the buttons (`amount` defaults to the step). */
  step(direction: 1 | -1, amount?: number): void;
  /** Removes the listeners. */
  destroy(): void;
}

export interface NumberFieldControllerOptions {
  /**
   * Report typing from the input's `input` events. Default `true`. React passes `false` and
   * reports typing from its own `onChange` (with `typedNumberChange`): a state update from a
   * native listener re-renders the controlled input before React sees the keystroke, which
   * would undo it.
   */
  readonly input?: boolean | undefined;
}

/**
 * The change typing makes: `null` when the text was cleared, the number once the text is one,
 * nothing while it isn't (`-`, `1e`) or when it equals `current`.
 */
export function typedNumberChange(
  text: string,
  current: number | null,
): { value: number | null; reason: NumberFieldChangeReason } | undefined {
  const parsed = parseNumberInput(text);
  if (parsed === undefined || parsed === current) return undefined;
  return { value: parsed, reason: parsed === null ? "input-clear" : "input-change" };
}

const INPUT = ":scope > [data-ok-text-field-control] > [data-ok-text-field-input]";

/**
 * Number field behavior on a `[data-ok-number-field]` root: keys on the input, presses on
 * `[data-ok-number-field-increment]` / `[data-ok-number-field-decrement]`, typing and leaving the
 * input. Settings are read from the root's attributes on each action.
 */
export function createNumberFieldController(
  root: HTMLElement,
  callbacks: NumberFieldCallbacks,
  options: NumberFieldControllerOptions = {},
): NumberFieldController {
  const abort = new AbortController();
  const { signal } = abort;
  const input = () => root.querySelector<HTMLInputElement>(INPUT);
  const locked = () => {
    const field = input();
    return !field || field.disabled || field.readOnly;
  };

  const change = (value: number | null, reason: NumberFieldChangeReason) => {
    if (value !== callbacks.getValue()) callbacks.onChange(value, { reason });
  };
  const commit = (value: number | null, reason: NumberFieldChangeReason) => {
    change(value, reason);
    callbacks.onCommit(value, { reason });
  };
  const stepBy = (direction: 1 | -1, amount: number, reason: NumberFieldChangeReason) => {
    if (locked()) return;
    const settings = readNumberFieldSettings(root);
    commit(stepNumberValue(callbacks.getValue(), direction, amount, settings), reason);
  };
  /** Turns the typed text into the value: empty → null, not a number → the current value. */
  const commitText = () => {
    const field = input();
    if (!field || field.disabled) return;
    const settings = readNumberFieldSettings(root);
    const parsed = parseNumberInput(field.value);
    let next = parsed === undefined ? callbacks.getValue() : parsed;
    if (next !== null && !settings.allowOutOfRange) next = clampNumber(next, settings);
    commit(next, parsed === null ? "input-clear" : "input-blur");
  };

  root.addEventListener(
    "keydown",
    (event) => {
      const field = input();
      if (!field || event.target !== field || event.defaultPrevented || event.isComposing) return;
      if (event.key === "Enter") {
        if (!field.readOnly) commitText();
        return;
      }
      if (event.ctrlKey || event.metaKey || locked()) return;
      const settings = readNumberFieldSettings(root);
      const arrow = event.shiftKey
        ? settings.largeStep
        : event.altKey
          ? settings.smallStep
          : settings.step;
      let target: number | undefined;
      let direction: 1 | -1 | 0 = 0;
      let amount = arrow;
      if (event.key === "ArrowUp") direction = 1;
      else if (event.key === "ArrowDown") direction = -1;
      else if (event.key === "PageUp" || event.key === "PageDown") {
        direction = event.key === "PageUp" ? 1 : -1;
        amount = settings.largeStep;
      } else if (event.key === "Home") target = settings.min;
      else if (event.key === "End") target = settings.max;
      // Home / End without a bound move the caret, as in any text input.
      if (direction === 0 && target === undefined) return;
      event.preventDefault();
      if (target !== undefined) commit(target, "keyboard");
      else stepBy(direction as 1 | -1, amount, "keyboard");
    },
    { signal },
  );

  if (options.input !== false)
    root.addEventListener(
      "input",
      (event) => {
        const field = input();
        if (!field || event.target !== field) return;
        const typed = typedNumberChange(field.value, callbacks.getValue());
        if (typed) callbacks.onChange(typed.value, { reason: typed.reason });
      },
      { signal },
    );

  root.addEventListener(
    "focusout",
    (event) => {
      if (event.target === input()) commitText();
    },
    { signal },
  );

  const button = (event: Event) =>
    (event.target as Element | null)?.closest<HTMLElement>(
      "[data-ok-number-field-increment], [data-ok-number-field-decrement]",
    );
  // A press on a button keeps the focus where it is (the input keeps its caret).
  root.addEventListener(
    "mousedown",
    (event) => {
      if (button(event)) event.preventDefault();
    },
    { signal },
  );
  root.addEventListener(
    "click",
    (event) => {
      const pressed = button(event);
      if (!pressed || !root.contains(pressed)) return;
      const settings = readNumberFieldSettings(root);
      const amount = event.shiftKey
        ? settings.largeStep
        : event.altKey
          ? settings.smallStep
          : settings.step;
      if (pressed.hasAttribute("data-ok-number-field-increment"))
        stepBy(1, amount, "increment-press");
      else stepBy(-1, amount, "decrement-press");
    },
    { signal },
  );

  return {
    step(direction, amount) {
      const reason = direction > 0 ? "increment-press" : "decrement-press";
      stepBy(direction, amount ?? readNumberFieldSettings(root).step, reason);
    },
    destroy() {
      abort.abort();
    },
  };
}
