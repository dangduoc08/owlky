/*
 * Slider math (MUI Slider), shared by React and the HTML runtime. Pure helpers plus
 * `createSliderController`, which turns pointer and keyboard input into intent (`onChange`,
 * `onCommit`); the owner applies values.
 */

export interface SliderMark {
  value: number;
  label?: string | undefined;
}

export interface SliderRange {
  min: number;
  max: number;
  /** `null`: only the marks are valid values. */
  step: number | null;
  marks?: readonly SliderMark[] | undefined;
  /** How far Page Up / Page Down and Shift + arrows move. Default 10. */
  shiftStep?: number | undefined;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** A valid range: `max` above `min` (else `min + 100`), a positive step or `null`. */
export function sliderRange(
  input: {
    min?: number | undefined;
    max?: number | undefined;
    step?: number | null | undefined;
    marks?: readonly SliderMark[] | undefined;
    shiftStep?: number | undefined;
  } = {},
): SliderRange {
  const min = Number.isFinite(input.min) ? (input.min as number) : 0;
  const max =
    Number.isFinite(input.max) && (input.max as number) > min ? (input.max as number) : min + 100;
  const step =
    input.step === null
      ? null
      : Number.isFinite(input.step) && (input.step as number) > 0
        ? (input.step as number)
        : 1;
  const shiftStep =
    Number.isFinite(input.shiftStep) && (input.shiftStep as number) > 0
      ? (input.shiftStep as number)
      : SLIDER_SHIFT_STEP;
  return { min, max, step, marks: input.marks, shiftStep };
}

/** Default distance of Page Up / Page Down and Shift + arrows (MUI `shiftStep`). */
export const SLIDER_SHIFT_STEP = 10;

/** Position of `value` in percent of the rail. */
export const sliderPercent = (value: number, { min, max }: SliderRange): number =>
  ((clamp(value, min, max) - min) * 100) / (max - min);

const decimals = (step: number) => {
  const text = String(step);
  if (text.includes("e-")) return Number(text.split("e-")[1]);
  return text.split(".")[1]?.length ?? 0;
};

/** The valid value nearest to `raw`: a step from `min` (rounded like the step), or a mark. */
export function snapSliderValue(raw: number, range: SliderRange): number {
  const { min, max, step, marks = [] } = range;
  if (step === null) {
    if (marks.length === 0) return clamp(raw, min, max);
    return marks.reduce((best, mark) =>
      Math.abs(mark.value - raw) < Math.abs(best.value - raw) ? mark : best,
    ).value;
  }
  const snapped = Math.round((raw - min) / step) * step + min;
  return clamp(Number(snapped.toFixed(decimals(step))), min, max);
}

/** Marks for `marks={true}`: one per step (none for `step: null`). */
export function stepMarks({ min, max, step }: SliderRange): SliderMark[] {
  if (step === null) return [];
  const marks: SliderMark[] = [];
  const count = Math.floor((max - min) / step);
  if (count > 1000) return [];
  for (let i = 0; i <= count; i++)
    marks.push({ value: Number((min + i * step).toFixed(decimals(step))) });
  return marks;
}

/** Values in the rail order: sorted copy. */
export const sortSliderValues = (values: readonly number[]): number[] =>
  [...values].sort((a, b) => a - b);

/**
 * Sets thumb `index` to `next`. Thumbs swap when they cross (the moving one keeps moving: the
 * returned `index`), or stop at their neighbours with `disableSwap`.
 */
export function setSliderValue(
  values: readonly number[],
  index: number,
  next: number,
  disableSwap = false,
): { values: number[]; index: number } {
  const copy = [...values];
  if (disableSwap) {
    const low = index > 0 ? (copy[index - 1] as number) : Number.NEGATIVE_INFINITY;
    const high = index < copy.length - 1 ? (copy[index + 1] as number) : Number.POSITIVE_INFINITY;
    copy[index] = clamp(next, low, high);
    return { values: copy, index };
  }
  copy[index] = next;
  const sorted = sortSliderValues(copy);
  const moved = sorted.lastIndexOf(next) === -1 ? index : sorted.indexOf(next);
  return { values: sorted, index: moved };
}

/** The thumb nearest to `value` (ties → the last one below, MUI). */
export function closestThumb(values: readonly number[], value: number): number {
  let best = 0;
  values.forEach((current, i) => {
    if (Math.abs(current - value) < Math.abs((values[best] as number) - value)) best = i;
    else if (
      Math.abs(current - value) === Math.abs((values[best] as number) - value) &&
      current <= value
    )
      best = i;
  });
  return best;
}

/**
 * The value a key moves to: arrows ± step (or the next mark), Page Up / Down and Shift + arrows ±
 * `shiftStep` (default 10), Home / End. `null` = not a slider key.
 */
export function sliderKeyValue(
  key: string,
  value: number,
  range: SliderRange,
  rtl = false,
  shift = false,
): number | null {
  const { min, max, step, marks = [] } = range;
  const forward = ["ArrowUp", rtl ? "ArrowLeft" : "ArrowRight"];
  const backward = ["ArrowDown", rtl ? "ArrowRight" : "ArrowLeft"];
  if (key === "Home") return min;
  if (key === "End") return max;
  const direction = forward.includes(key) ? 1 : backward.includes(key) ? -1 : 0;
  const page = key === "PageUp" ? 1 : key === "PageDown" ? -1 : 0;
  if (direction === 0 && page === 0) return null;
  if (step === null) {
    const values = marks.map((m) => m.value).sort((a, b) => a - b);
    const sign = direction || page;
    const target =
      sign > 0 ? values.find((v) => v > value) : [...values].reverse().find((v) => v < value);
    return target ?? value;
  }
  const far = range.shiftStep ?? SLIDER_SHIFT_STEP;
  const delta = page !== 0 ? page * far : shift ? direction * far : direction * step;
  return snapSliderValue(value + delta, range);
}

/**
 * The value shown and announced for `value`: `scale(value)` (MUI `scale`), else the value.
 * Invalid results fall back to the value.
 */
export function scaleSliderValue(
  value: number,
  scale: ((value: number) => number) | null | undefined,
): number {
  if (!scale) return value;
  const scaled = scale(value);
  return Number.isFinite(scaled) ? scaled : value;
}

/** Value at a pointer position over the rail box. */
export function sliderValueAt(
  rect: { left: number; top: number; width: number; height: number },
  x: number,
  y: number,
  vertical: boolean,
  range: SliderRange,
  rtl = false,
): number {
  let ratio = vertical ? (rect.top + rect.height - y) / rect.height : (x - rect.left) / rect.width;
  if (rtl && !vertical) ratio = 1 - ratio;
  ratio = clamp(Number.isFinite(ratio) ? ratio : 0, 0, 1);
  return snapSliderValue(range.min + ratio * (range.max - range.min), range);
}

export interface SliderControllerOptions {
  /** Current values and range (read on every interaction). */
  read(): { values: number[]; range: SliderRange; disableSwap: boolean; disabled: boolean };
  /** The user moved thumb `index`; `values` are the new values (sorted). */
  onChange(values: number[], index: number): void;
  /** The interaction ended (pointer up, key handled). */
  onCommit(values: number[]): void;
}

export interface SliderController {
  destroy(): void;
}

/** Attribute on the dragged thumb (shows `auto` value labels). */
export const SLIDER_ACTIVE = "data-ok-active";

/**
 * Connects a slider root (`[data-ok-slider]`) with its rail (`[data-ok-slider-rail]`) and thumbs
 * (`[data-ok-slider-thumb]` › `input[type=range]`). Pointer Events: press on the rail or a thumb
 * and drag (mouse, touch, pen); keyboard on the focused input. Values go through `onChange`.
 */
export function createSliderController(
  root: HTMLElement,
  options: SliderControllerOptions,
): SliderController {
  const abort = new AbortController();
  const { signal } = abort;
  const thumbs = () => [...root.querySelectorAll<HTMLElement>("[data-ok-slider-thumb]")];
  const inputOf = (i: number) => thumbs()[i]?.querySelector<HTMLInputElement>("input") ?? null;
  const vertical = () => root.getAttribute("data-ok-orientation") === "vertical";
  const rtl = () => getComputedStyle(root).direction === "rtl";
  let active = -1;
  let latest: number[] = [];

  const setActive = (index: number) => {
    thumbs().forEach((thumb, i) => {
      thumb.toggleAttribute(SLIDER_ACTIVE, i === index);
    });
    active = index;
  };

  const move = (event: PointerEvent, first: boolean) => {
    const state = options.read();
    const rail = root.querySelector<HTMLElement>("[data-ok-slider-rail]") ?? root;
    const value = sliderValueAt(
      rail.getBoundingClientRect(),
      event.clientX,
      event.clientY,
      vertical(),
      state.range,
      rtl(),
    );
    const index = first ? closestThumb(state.values, value) : active;
    const next = setSliderValue(state.values, index, value, state.disableSwap);
    setActive(next.index);
    latest = next.values;
    if (first) inputOf(next.index)?.focus({ preventScroll: true });
    if (next.values.some((v, i) => v !== state.values[i]))
      options.onChange(next.values, next.index);
  };

  root.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || options.read().disabled) return;
      event.preventDefault();
      try {
        root.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic or already released pointers can't be captured; dragging still works.
      }
      latest = options.read().values;
      move(event, true);
    },
    { signal },
  );
  root.addEventListener(
    "pointermove",
    (event) => {
      if (active < 0) return;
      move(event, false);
    },
    { signal },
  );
  const end = () => {
    if (active < 0) return;
    setActive(-1);
    options.onCommit(latest);
  };
  root.addEventListener("pointerup", end, { signal });
  root.addEventListener("pointercancel", end, { signal });
  root.addEventListener("lostpointercapture", end, { signal });

  root.addEventListener(
    "keydown",
    (event) => {
      const input = event.target as HTMLElement;
      const index = thumbs().findIndex((thumb) => thumb.contains(input));
      if (index < 0) return;
      const state = options.read();
      if (state.disabled) return;
      const value = sliderKeyValue(
        event.key,
        state.values[index] as number,
        state.range,
        rtl(),
        event.shiftKey,
      );
      if (value === null) return;
      event.preventDefault();
      const next = setSliderValue(state.values, index, value, state.disableSwap);
      if (next.values.some((v, i) => v !== state.values[i])) {
        options.onChange(next.values, next.index);
        if (next.index !== index) inputOf(next.index)?.focus();
        options.onCommit(next.values);
      }
    },
    { signal },
  );

  return {
    destroy() {
      abort.abort();
    },
  };
}

export type SliderTrackMode = "normal" | "inverted" | "false";

export interface SliderLayout {
  /** Track start / end, in percent of the rail. */
  start: number;
  end: number;
  /** Each thumb's position, in percent. */
  thumbs: number[];
  /** Whether a mark at `value` sits on the track. */
  markActive(value: number): boolean;
}

/** Where the track, the thumbs and the active marks go for `values`. */
export function sliderLayout(
  values: readonly number[],
  range: SliderRange,
  track: SliderTrackMode = "normal",
): SliderLayout {
  const sorted = sortSliderValues(values);
  const low = sorted[0] ?? range.min;
  const high = sorted[sorted.length - 1] ?? range.min;
  const thumbs = values.map((value) => sliderPercent(value, range));
  const range2 = sorted.length > 1;
  if (track === "inverted" && !range2)
    return {
      start: sliderPercent(low, range),
      end: 100,
      thumbs,
      markActive: (value) => value >= low,
    };
  const start = range2 ? sliderPercent(low, range) : 0;
  return {
    start,
    end: sliderPercent(high, range),
    thumbs,
    markActive: (value) =>
      track !== "false" && (range2 ? value >= low && value <= high : value <= high),
  };
}

/** Formats a value with a template such as `"{value}°C"` (HTML `data-ok-label-value`). */
export const formatSliderValue = (value: number, template: string | null | undefined): string =>
  template ? template.replaceAll("{value}", String(value)) : String(value);
