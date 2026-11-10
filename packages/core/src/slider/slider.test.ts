import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  closestThumb,
  createSliderController,
  formatSliderValue,
  SLIDER_ACTIVE,
  SLIDER_SHIFT_STEP,
  scaleSliderValue,
  setSliderValue,
  sliderKeyValue,
  sliderLayout,
  sliderPercent,
  sliderRange,
  sliderValueAt,
  snapSliderValue,
  sortSliderValues,
  stepMarks,
} from "./slider.js";

afterEach(cleanupDom);

const RANGE = sliderRange();
const MARKS = {
  ...sliderRange({ step: null }),
  marks: [0, 20, 37, 100].map((value) => ({ value })),
};

describe("slider math", () => {
  it("sliderRange: defaults and invalid values", () => {
    expect(sliderRange()).toEqual({ min: 0, max: 100, step: 1, marks: undefined, shiftStep: 10 });
    expect(sliderRange({ min: 10, max: 5, step: -2 })).toMatchObject({
      min: 10,
      max: 110,
      step: 1,
    });
    expect(sliderRange({ min: Number.NaN, max: Number.POSITIVE_INFINITY })).toMatchObject({
      min: 0,
      max: 100,
    });
    expect(sliderRange({ step: null }).step).toBeNull();
  });

  it("percent, clamped", () => {
    expect(sliderPercent(30, RANGE)).toBe(30);
    expect(sliderPercent(-5, RANGE)).toBe(0);
    expect(sliderPercent(500, sliderRange({ max: 1000 }))).toBe(50);
  });

  it("snaps to steps (with the step's decimals), to marks, or clamps", () => {
    expect(snapSliderValue(33, sliderRange({ step: 10 }))).toBe(30);
    expect(snapSliderValue(0.30000000004, sliderRange({ step: 0.1, max: 1 }))).toBe(0.3);
    expect(snapSliderValue(6.2e-8, sliderRange({ step: 1e-8, min: -5e-8, max: 1e-7 }))).toBe(6e-8);
    expect(snapSliderValue(150, RANGE)).toBe(100);
    expect(snapSliderValue(30, MARKS)).toBe(37);
    expect(snapSliderValue(9, MARKS)).toBe(0);
    expect(snapSliderValue(42, sliderRange({ step: null }))).toBe(42);
  });

  it("stepMarks: one per step, none for marks-only or huge counts", () => {
    expect(stepMarks(sliderRange({ step: 25 })).map((m) => m.value)).toEqual([0, 25, 50, 75, 100]);
    expect(stepMarks(sliderRange({ step: null }))).toEqual([]);
    expect(stepMarks(sliderRange({ step: 0.01 }))).toEqual([]);
  });

  it("setSliderValue: swaps crossing thumbs unless disableSwap", () => {
    expect(sortSliderValues([30, 10])).toEqual([10, 30]);
    expect(setSliderValue([20, 40], 0, 50)).toEqual({ values: [40, 50], index: 1 });
    expect(setSliderValue([20, 40], 1, 30)).toEqual({ values: [20, 30], index: 1 });
    expect(setSliderValue([20, 40], 0, 50, true)).toEqual({ values: [40, 40], index: 0 });
    expect(setSliderValue([20, 40], 1, 5, true)).toEqual({ values: [20, 20], index: 1 });
    expect(setSliderValue([20], 0, 70, true)).toEqual({ values: [70], index: 0 });
  });

  it("closestThumb", () => {
    expect(closestThumb([20, 40], 25)).toBe(0);
    expect(closestThumb([20, 40], 38)).toBe(1);
    expect(closestThumb([20, 40], 30)).toBe(0);
    expect(closestThumb([30, 30], 50)).toBe(1);
    expect(closestThumb([30, 30], 10)).toBe(0);
  });

  it("keys: arrows, pages, Home / End, marks, right-to-left; other keys → null", () => {
    expect(sliderKeyValue("ArrowRight", 30, RANGE)).toBe(31);
    expect(sliderKeyValue("ArrowUp", 30, RANGE)).toBe(31);
    expect(sliderKeyValue("ArrowLeft", 30, RANGE)).toBe(29);
    expect(sliderKeyValue("ArrowDown", 0, RANGE)).toBe(0);
    expect(sliderKeyValue("PageUp", 30, RANGE)).toBe(40);
    expect(sliderKeyValue("PageDown", 30, RANGE)).toBe(20);
    expect(sliderKeyValue("Home", 30, RANGE)).toBe(0);
    expect(sliderKeyValue("End", 30, RANGE)).toBe(100);
    expect(sliderKeyValue("ArrowLeft", 30, RANGE, true)).toBe(31);
    expect(sliderKeyValue("ArrowRight", 30, RANGE, true)).toBe(29);
    expect(sliderKeyValue("Enter", 30, RANGE)).toBeNull();
    expect(sliderKeyValue("ArrowRight", 20, MARKS)).toBe(37);
    expect(sliderKeyValue("ArrowLeft", 20, MARKS)).toBe(0);
    expect(sliderKeyValue("PageUp", 100, MARKS)).toBe(100);
    expect(sliderKeyValue("ArrowLeft", 0, { ...MARKS, marks: undefined })).toBe(0);
  });

  it("value at a pointer position, horizontal, vertical, right-to-left", () => {
    const rect = { left: 100, top: 0, width: 200, height: 100 };
    expect(sliderValueAt(rect, 150, 0, false, RANGE)).toBe(25);
    expect(sliderValueAt(rect, 50, 0, false, RANGE)).toBe(0);
    expect(sliderValueAt(rect, 150, 0, false, RANGE, true)).toBe(75);
    expect(sliderValueAt(rect, 0, 25, true, RANGE)).toBe(75);
    expect(sliderValueAt({ left: 0, top: 0, width: 0, height: 0 }, 1, 1, false, RANGE)).toBe(0);
  });

  it("layout: normal, inverted, none, range", () => {
    const single = sliderLayout([30], RANGE);
    expect([single.start, single.end, single.thumbs]).toEqual([0, 30, [30]]);
    expect([single.markActive(20), single.markActive(40)]).toEqual([true, false]);
    const inverted = sliderLayout([30], RANGE, "inverted");
    expect([
      inverted.start,
      inverted.end,
      inverted.markActive(40),
      inverted.markActive(20),
    ]).toEqual([30, 100, true, false]);
    expect(sliderLayout([30], RANGE, "false").markActive(10)).toBe(false);
    const range = sliderLayout([60, 20], RANGE, "inverted");
    expect([range.start, range.end, range.thumbs]).toEqual([20, 60, [60, 20]]);
    expect([range.markActive(10), range.markActive(40), range.markActive(70)]).toEqual([
      false,
      true,
      false,
    ]);
    expect(sliderLayout([], RANGE)).toMatchObject({ start: 0, end: 0 });
  });

  it("formats with a template", () => {
    expect(formatSliderValue(30, "{value}°C")).toBe("30°C");
    expect(formatSliderValue(30, "$" + "{value} – {value}")).toBe("$30 – 30");
    expect(formatSliderValue(30, null)).toBe("30");
  });
});

describe("createSliderController", () => {
  function setup({ values = [30], disabled = false, disableSwap = false, vertical = false } = {}) {
    const host =
      mount(`<span data-ok-slider data-ok-orientation="${vertical ? "vertical" : "horizontal"}">
      <span data-ok-slider-rail></span>
      ${values.map(() => '<span data-ok-slider-thumb><input type="range"></span>').join("")}</span>`);
    const root = host.firstElementChild as HTMLElement;
    const rail = root.querySelector<HTMLElement>("[data-ok-slider-rail]") as HTMLElement;
    Object.assign(root.style, {
      display: "block",
      position: "relative",
      width: "200px",
      height: "200px",
    });
    Object.assign(rail.style, { position: "absolute", inset: "0" });
    const state = { values: [...values] };
    const onChange = vi.fn((next: number[]) => {
      state.values = next;
    });
    const onCommit = vi.fn();
    const controller = createSliderController(root, {
      read: () => ({ values: state.values, range: RANGE, disableSwap, disabled }),
      onChange,
      onCommit,
    });
    const box = root.getBoundingClientRect();
    const at = (type: string, ratio: number, extra: PointerEventInit = {}) =>
      root.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          button: 0,
          clientX: box.left + ratio * box.width,
          clientY: box.top + (1 - ratio) * box.height,
          ...extra,
        }),
      );
    const inputs = [...root.querySelectorAll("input")];
    return { root, controller, onChange, onCommit, at, inputs, state };
  }

  it("press and drag: reports values, marks the active thumb, commits on release", () => {
    const { root, onChange, onCommit, at, inputs, controller } = setup();
    expect(at("pointerdown", 0.5)).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith([50], 0);
    expect(document.activeElement).toBe(inputs[0]);
    expect(root.querySelector("[data-ok-slider-thumb]")?.hasAttribute(SLIDER_ACTIVE)).toBe(true);
    at("pointermove", 0.6);
    expect(onChange).toHaveBeenLastCalledWith([60], 0);
    at("pointermove", 0.6);
    expect(onChange).toHaveBeenCalledTimes(2);
    at("pointerup", 0.6);
    expect(onCommit).toHaveBeenCalledExactlyOnceWith([60]);
    expect(root.querySelector(`[${SLIDER_ACTIVE}]`)).toBeNull();
    // Moves without a press and a second release do nothing.
    at("pointermove", 0.9);
    at("pointercancel", 0.9);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onCommit).toHaveBeenCalledTimes(1);
    controller.destroy();
    at("pointerdown", 0.1);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("range: the nearest thumb moves and swaps past the other one; vertical runs upward", () => {
    const { onChange, at } = setup({ values: [20, 40], vertical: true });
    at("pointerdown", 0.45);
    expect(onChange).toHaveBeenLastCalledWith([20, 45], 1);
    at("pointermove", 0.1);
    expect(onChange).toHaveBeenLastCalledWith([10, 20], 0);
  });

  it("ignores other buttons and disabled sliders", () => {
    const { onChange, at } = setup({ disabled: true });
    at("pointerdown", 0.5);
    const other = setup();
    other.at("pointerdown", 0.5, { button: 2 });
    expect(onChange).not.toHaveBeenCalled();
    expect(other.onChange).not.toHaveBeenCalled();
  });

  it("keyboard on a thumb: steps, commits; focus follows a swap; other keys pass", () => {
    const { inputs, onChange, onCommit } = setup({ values: [20, 22] });
    const [first, second] = inputs as [HTMLInputElement, HTMLInputElement];
    const press = (target: Element, key: string) =>
      target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    first.focus();
    expect(press(first, "ArrowRight")).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith([21, 22], 0);
    expect(onCommit).toHaveBeenLastCalledWith([21, 22]);
    press(first, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith([22, 22], 0);
    // Passing the other thumb swaps them; focus moves with the value.
    press(first, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith([22, 23], 1);
    expect(document.activeElement).toBe(second);
    expect(press(second, "Tab")).toBe(true);
    press(second, "End");
    const calls = onChange.mock.calls.length;
    // At the end already: nothing changes.
    expect(press(second, "End")).toBe(false);
    expect(onChange.mock.calls.length).toBe(calls);
  });

  it("keyboard is ignored on disabled sliders and outside the thumbs", () => {
    const { root, onChange } = setup({ disabled: true });
    root
      .querySelector("input")
      ?.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("without a rail, the root is the track", () => {
    const host = mount(
      '<span data-ok-slider><span data-ok-slider-thumb><input type="range"></span></span>',
    );
    const root = host.firstElementChild as HTMLElement;
    Object.assign(root.style, { display: "block", width: "100px", height: "10px" });
    const onChange = vi.fn();
    createSliderController(root, {
      read: () => ({ values: [0], range: RANGE, disableSwap: false, disabled: false }),
      onChange,
      onCommit: vi.fn(),
    });
    const box = root.getBoundingClientRect();
    root.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: box.left + 80,
        clientY: box.top,
      }),
    );
    expect(onChange).toHaveBeenCalledWith([80], 0);
  });
});

describe("slider shiftStep and scale", () => {
  it("Page keys and Shift + arrows move by shiftStep (default 10), snapped to the step", () => {
    const range = sliderRange({ min: 0, max: 100, step: 5 });
    expect(range.shiftStep).toBe(SLIDER_SHIFT_STEP);
    expect(sliderKeyValue("PageUp", 30, range)).toBe(40);
    expect(sliderKeyValue("ArrowRight", 30, range)).toBe(35);
    expect(sliderKeyValue("ArrowRight", 30, range, false, true)).toBe(40);
    expect(sliderKeyValue("ArrowDown", 30, range, false, true)).toBe(20);
    const wide = sliderRange({ min: 0, max: 100, step: 1, shiftStep: 25 });
    expect(sliderKeyValue("PageDown", 60, wide)).toBe(35);
    expect(sliderKeyValue("ArrowUp", 60, wide, false, true)).toBe(85);
    expect(sliderRange({ shiftStep: -2 }).shiftStep).toBe(SLIDER_SHIFT_STEP);
    expect(sliderKeyValue("PageUp", 95, { ...wide, shiftStep: undefined })).toBe(100);
  });

  it("scale: the shown value, invalid results fall back", () => {
    expect(scaleSliderValue(10, (x) => 2 ** x)).toBe(1024);
    expect(scaleSliderValue(10, null)).toBe(10);
    expect(scaleSliderValue(10, () => Number.NaN)).toBe(10);
  });

  it("the controller passes Shift to the keys", () => {
    const host = mount(
      '<span data-ok-slider><span data-ok-slider-rail></span><span data-ok-slider-thumb><input type="range"></span></span>',
    );
    const onChange = vi.fn();
    createSliderController(host.firstElementChild as HTMLElement, {
      read: () => ({
        values: [30],
        range: sliderRange({ step: 1, shiftStep: 20 }),
        disableSwap: false,
        disabled: false,
      }),
      onChange,
      onCommit: vi.fn(),
    });
    (host.querySelector("input") as HTMLInputElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }),
    );
    expect(onChange).toHaveBeenCalledWith([50], 0);
  });
});
