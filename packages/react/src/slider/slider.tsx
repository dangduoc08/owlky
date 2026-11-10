"use client";

import {
  createSliderController,
  type Orientation,
  type SliderColor,
  type SliderController,
  type SliderMark,
  type SliderSize,
  type SliderValueLabelDisplay,
  scaleSliderValue,
  setSliderValue,
  sliderAttributes,
  sliderLayout,
  sliderPercent,
  sliderRange,
  snapSliderValue,
  stepMarks,
} from "@owlky/core";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useLayoutEffect,
  useRef,
} from "react";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

type SliderValue = number | number[];

export interface SliderProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "onChange" | "defaultValue" | "color"> {
  /** Controlled: a number, or two numbers for a range. */
  value?: SliderValue | undefined;
  /** Uncontrolled initial value. Default `min`. */
  defaultValue?: SliderValue | undefined;
  /** Called while the value changes, with the thumb that moved. */
  onChange?: ((value: SliderValue, activeThumb: number) => void) | undefined;
  /** Called when a drag or a key press ends. */
  onChangeCommitted?: ((value: SliderValue) => void) | undefined;
  /** Default 0. */
  min?: number | undefined;
  /** Default 100. */
  max?: number | undefined;
  /** Default 1; `null`: only the marks are valid values. */
  step?: number | null | undefined;
  /** `true`: a mark per step; or marks with optional labels. */
  marks?: boolean | readonly SliderMark[] | undefined;
  /** Default `"horizontal"` (vertical fills its container's height). */
  orientation?: Orientation | undefined;
  /** Default `"medium"`. */
  size?: SliderSize | undefined;
  /** Default `"primary"`. */
  color?: SliderColor | undefined;
  /** `"normal"` (default), `"inverted"` or `false` (no track). */
  track?: "normal" | "inverted" | false | undefined;
  /** Value bubble: `"off"` (default), `"auto"` (hover, focus, drag) or `"on"`. */
  valueLabelDisplay?: SliderValueLabelDisplay | undefined;
  /** Text of the value bubble. Default: the value. */
  valueLabelFormat?: ((value: number, index: number) => ReactNode) | undefined;
  /** Text screen readers announce for a value (`aria-valuetext`). */
  getAriaValueText?: ((value: number, index: number) => string) | undefined;
  /** Name of each thumb (`aria-label`), for range sliders. */
  getAriaLabel?: ((index: number) => string) | undefined;
  /** Names the thumb(s) (or use `aria-labelledby`). */
  "aria-label"?: string | undefined;
  /** Names it with the id of a visible label. */
  "aria-labelledby"?: string | undefined;
  disabled?: boolean | undefined;
  /** Range: thumbs can't cross. */
  disableSwap?: boolean | undefined;
  /** Form field name of the input(s). */
  name?: string | undefined;
  /** Turns a value into the one shown and announced (non-linear scales); `onChange` keeps the plain value. */
  scale?: ((value: number) => number) | undefined;
  /** How far Page Up / Page Down and Shift + arrow keys move the thumb. Default 10. */
  shiftStep?: number | undefined;
  /** Tab order of the thumbs' inputs. */
  tabIndex?: number | undefined;
}

const toArray = (value: SliderValue): number[] => (Array.isArray(value) ? [...value] : [value]);

/**
 * Slider — spec: specs/components/slider.md. Native range inputs (keyboard, screen readers,
 * forms) under drawn thumbs; pointer dragging and keys are core's `createSliderController`.
 */
export const Slider = forwardRef<HTMLSpanElement, SliderProps>(function Slider(
  {
    value,
    defaultValue,
    onChange,
    onChangeCommitted,
    min,
    max,
    step,
    marks: marksProp,
    orientation,
    size,
    color,
    track = "normal",
    valueLabelDisplay = "off",
    valueLabelFormat,
    getAriaValueText,
    getAriaLabel,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    disabled,
    disableSwap,
    name,
    scale,
    shiftStep,
    tabIndex,
    style,
    ...props
  },
  ref,
) {
  const range = sliderRange({ min, max, step, shiftStep });
  const marks: SliderMark[] =
    marksProp === true ? stepMarks(range) : marksProp ? [...marksProp] : [];
  const full = { ...range, marks };
  const range2 = Array.isArray(value ?? defaultValue);
  const [current, setCurrent] = useControllableState<SliderValue>({
    value,
    defaultValue: defaultValue ?? range.min,
    onChange: undefined,
  });
  const values = toArray(current).map((v) => snapSliderValue(v, full));
  const layout = sliderLayout(values, full, track === false ? "false" : track);
  const trackMode = track === false ? "false" : track;

  const emit = (next: number[], index: number) => {
    const out: SliderValue = range2 ? next : (next[0] as number);
    setCurrent(out);
    onChange?.(out, index);
  };
  const latest = useRef({ values, full, disableSwap, disabled, emit, onChangeCommitted, range2 });
  latest.current = { values, full, disableSwap, disabled, emit, onChangeCommitted, range2 };

  const rootRef = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);
  useLayoutEffect(() => {
    const controller: SliderController = createSliderController(rootRef.current as HTMLElement, {
      read: () => ({
        values: latest.current.values,
        range: latest.current.full,
        disableSwap: Boolean(latest.current.disableSwap),
        disabled: Boolean(latest.current.disabled),
      }),
      onChange: (next, index) => latest.current.emit(next, index),
      onCommit: (next) =>
        latest.current.onChangeCommitted?.(latest.current.range2 ? next : (next[0] as number)),
    });
    return () => controller.destroy();
  }, []);

  const position = (percent: number) =>
    ({ "--_ok-slider-at": `${percent}%` }) as unknown as CSSProperties;

  return (
    <span
      ref={mergedRef}
      {...sliderAttributes({
        color,
        size,
        orientation,
        track: trackMode,
        valueLabelDisplay,
        disabled,
        disableSwap,
        min,
        max,
        step: step === null ? 0 : step,
        shiftStep,
      })}
      data-ok-runtime="off"
      style={
        {
          "--_ok-slider-start": `${layout.start}%`,
          "--_ok-slider-end": `${layout.end}%`,
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <span data-ok-slider-rail="" />
      <span data-ok-slider-track="" />
      {marks.map((mark) => [
        <span
          key={`m${mark.value}`}
          data-ok-slider-mark=""
          data-ok-value={mark.value}
          {...(layout.markActive(mark.value) ? { "data-ok-active": "" } : {})}
          style={position(sliderPercent(mark.value, full))}
        />,
        mark.label != null && (
          <span
            key={`l${mark.value}`}
            data-ok-slider-mark-label=""
            data-ok-value={mark.value}
            aria-hidden="true"
            style={position(sliderPercent(mark.value, full))}
          >
            {mark.label}
          </span>
        ),
      ])}
      {values.map((thumb, index) => {
        const shown = scaleSliderValue(thumb, scale);
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: thumbs are positions in the range.
            key={index}
            data-ok-slider-thumb=""
            data-ok-index={index}
            style={position(layout.thumbs[index] as number)}
          >
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={range.step ?? "any"}
              value={thumb}
              name={name}
              disabled={disabled}
              aria-label={getAriaLabel ? getAriaLabel(index) : ariaLabel}
              aria-labelledby={ariaLabelledBy}
              tabIndex={tabIndex}
              aria-valuenow={scale ? shown : undefined}
              aria-valuetext={getAriaValueText?.(shown, index)}
              aria-orientation={orientation === "vertical" ? "vertical" : undefined}
              onChange={(event) => {
                // Assistive technologies adjust the native input directly.
                const next = setSliderValue(
                  values,
                  index,
                  snapSliderValue(Number(event.target.value), full),
                  disableSwap,
                );
                emit(next.values, next.index);
              }}
            />
            {valueLabelDisplay !== "off" && (
              <span data-ok-slider-value-label="" aria-hidden="true">
                {valueLabelFormat ? valueLabelFormat(shown, index) : shown}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
});
