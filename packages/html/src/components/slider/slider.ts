import {
  createSliderController,
  formatSliderValue,
  readNumber,
  readStyle,
  type SliderMark,
  type SliderRange,
  scaleSliderValue,
  setSliderValue,
  sliderLayout,
  sliderOptions,
  sliderPercent,
  sliderRange,
  snapSliderValue,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface SliderEvents {
  /** Before a thumb moves. `value` holds every thumb. Call `preventDefault()` to keep the current value. */
  change: EventSpec<{ value: number[]; activeThumb: number }, true>;
  /** After a drag or a key press ended, with the final value. */
  commit: EventSpec<{ value: number[] }>;
}

export interface SliderInstance extends ComponentInstance {
  /** One value per thumb. */
  readonly value: number[];
  /** Moves the thumbs to `value` (snapped to the steps), without emitting events. */
  setValue(value: number | readonly number[]): void;
  /**
   * A non-linear scale (React `scale`): `scale(value)` is shown and announced (`aria-valuenow`),
   * formatted by `format` (else `data-ok-label-value`). `null` removes it.
   */
  setScale(
    scale: ((value: number) => number) | null,
    format?: ((value: number, index: number) => string) | null,
  ): void;
}

const { min, max, step, shiftStep, track, disabled, disableSwap } = sliderOptions.options;

/**
 * Slider — spec: specs/components/slider.md
 *
 * Markup:  <span data-ok-slider data-ok-color="primary" data-ok-size="medium" data-ok-min="0" data-ok-max="100">
 *            <span data-ok-slider-rail></span><span data-ok-slider-track></span>
 *            <span data-ok-slider-mark data-ok-value="20"></span><span data-ok-slider-mark-label data-ok-value="20" aria-hidden="true">20°C</span>
 *            <span data-ok-slider-thumb><input type="range" min="0" max="100" step="1" value="30" aria-label="Volume">
 *              <span data-ok-slider-value-label aria-hidden="true">30</span></span>
 *          </span>
 * Behavior: places the track, marks and thumbs (private custom properties through CSSOM) from the
 *          inputs' values; core `createSliderController` drags and steps them. `data-ok-step="0"`
 *          keeps values on the marks; `data-ok-label-value="{value}°C"` formats the value label and
 *          `aria-valuetext`.
 * Events:  ok:slider:change (cancelable, detail `{ value, activeThumb }`), ok:slider:commit (`{ value }`).
 */
export const slider = defineComponent<SliderInstance, SliderEvents>({
  name: "slider",
  selector: "[data-ok-slider]",

  setup(element, { emit, signal }) {
    const thumbs = () => [...element.querySelectorAll<HTMLElement>("[data-ok-slider-thumb]")];
    const inputs = () => thumbs().map((thumb) => thumb.querySelector("input") as HTMLInputElement);
    const range = (): SliderRange => {
      const marks: SliderMark[] = [...element.querySelectorAll("[data-ok-slider-mark]")]
        .map((mark) => Number(mark.getAttribute("data-ok-value")))
        .filter(Number.isFinite)
        .map((value) => ({ value }));
      const stepValue = readNumber(element, step) as number;
      return {
        ...sliderRange({
          min: readNumber(element, min) as number,
          max: readNumber(element, max) as number,
          step: stepValue === 0 ? null : stepValue,
          shiftStep: readNumber(element, shiftStep) as number,
        }),
        marks,
      };
    };
    // Values live here: browsers sanitize `input.value` for very small steps (5e-8 → 0).
    let current = inputs().map((input) =>
      snapSliderValue(Number(input.getAttribute("value") ?? input.value), range()),
    );
    const values = () => [...current];
    const template = () => element.getAttribute("data-ok-label-value");
    let scale: ((value: number) => number) | null = null;
    let format: ((value: number, index: number) => string) | null = null;
    let written: string[] = [];
    const written2 = new WeakMap<Element, string[]>();

    const apply = (next: readonly number[]) => {
      current = [...next];
      const r = range();
      const layout = sliderLayout(next, r, readStyle(element, track));
      written = syncCustomProperties(
        element,
        { "--_ok-slider-start": `${layout.start}%`, "--_ok-slider-end": `${layout.end}%` },
        written,
      );
      const place = (part: HTMLElement, percent: number) => {
        written2.set(
          part,
          syncCustomProperties(
            part,
            { "--_ok-slider-at": `${percent}%` },
            written2.get(part) ?? [],
          ),
        );
      };
      for (const part of element.querySelectorAll<HTMLElement>(
        "[data-ok-slider-mark], [data-ok-slider-mark-label]",
      )) {
        const value = Number(part.getAttribute("data-ok-value"));
        place(part, sliderPercent(value, r));
        if (part.hasAttribute("data-ok-slider-mark"))
          part.toggleAttribute("data-ok-active", layout.markActive(value));
      }
      thumbs().forEach((thumb, i) => {
        const value = next[i] as number;
        place(thumb, layout.thumbs[i] as number);
        const input = thumb.querySelector("input") as HTMLInputElement;
        input.value = String(value);
        input.setAttribute("value", String(value));
        input.disabled = element.hasAttribute(disabled.attr);
        const shown = scaleSliderValue(value, scale);
        const text = format ? format(shown, i) : formatSliderValue(shown, template());
        if (template() || format) input.setAttribute("aria-valuetext", text);
        if (scale) input.setAttribute("aria-valuenow", String(shown));
        else input.removeAttribute("aria-valuenow");
        const label = thumb.querySelector("[data-ok-slider-value-label]");
        if (label) label.textContent = text;
      });
    };

    const change = (next: number[], index: number) => {
      if (!emit("change", { value: next, activeThumb: index }, { cancelable: true })) return;
      apply(next);
    };

    const controller = createSliderController(element, {
      read: () => ({
        values: values(),
        range: range(),
        disableSwap: element.hasAttribute(disableSwap.attr),
        disabled: element.hasAttribute(disabled.attr),
      }),
      onChange: change,
      onCommit: (next) => emit("commit", { value: next }),
    });
    // Assistive technologies adjust the native inputs directly.
    element.addEventListener(
      "input",
      (event) => {
        const index = inputs().indexOf(event.target as HTMLInputElement);
        if (index < 0) return;
        const typed = snapSliderValue(Number((event.target as HTMLInputElement).value), range());
        const next = setSliderValue(values(), index, typed, element.hasAttribute(disableSwap.attr));
        change(next.values, next.index);
      },
      { signal },
    );

    apply(values());
    return {
      get value() {
        return values();
      },
      setValue(value) {
        const list = typeof value === "number" ? [value] : [...value];
        apply(list.map((v) => snapSliderValue(v, range())));
      },
      setScale(next, nextFormat) {
        scale = next;
        format = nextFormat ?? null;
        apply(values());
      },
      destroy() {
        controller.destroy();
      },
    };
  },
});
