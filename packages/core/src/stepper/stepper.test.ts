import { describe, expect, it } from "vitest";
import { clampStep, mobileStepperProgress, mobileStepperText, stepState } from "./stepper.js";

describe("stepState", () => {
  it("linear: completed before the active step, not reached after it", () => {
    expect([0, 1, 2].map((index) => stepState(index, 1))).toEqual([
      { active: false, completed: true, disabled: false },
      { active: true, completed: false, disabled: false },
      { active: false, completed: false, disabled: true },
    ]);
  });

  it("non-linear: only the active step is derived; explicit values still win", () => {
    expect([0, 1, 2].map((index) => stepState(index, 1, {}, true))).toEqual([
      { active: false, completed: false, disabled: false },
      { active: true, completed: false, disabled: false },
      { active: false, completed: false, disabled: false },
    ]);
    expect(stepState(0, 1, { completed: true }, true).completed).toBe(true);
  });

  it("every step is completed once the active step passes the last one", () => {
    expect(stepState(2, 3)).toEqual({ active: false, completed: true, disabled: false });
  });

  it("explicit values win (a skipped step stays uncompleted)", () => {
    expect(stepState(0, 2, { completed: false })).toEqual({
      active: false,
      completed: false,
      disabled: false,
    });
    expect(stepState(2, 0, { disabled: false, active: true })).toEqual({
      active: true,
      completed: false,
      disabled: false,
    });
  });
});

describe("clampStep", () => {
  it("keeps whole numbers in [0, max]", () => {
    expect(clampStep(2, 3)).toBe(2);
    expect(clampStep(9, 3)).toBe(3);
    expect(clampStep(4, -1)).toBe(0);
  });

  it("invalid values → 0", () => {
    for (const value of [-1, 1.5, Number.NaN, "2", undefined, null])
      expect(clampStep(value, 3)).toBe(0);
  });
});

describe("mobile stepper", () => {
  it("progress: the share of steps done (MUI rounds up)", () => {
    expect(mobileStepperProgress(0, 3)).toBe(0);
    expect(mobileStepperProgress(1, 3)).toBe(50);
    expect(mobileStepperProgress(2, 3)).toBe(100);
    expect(mobileStepperProgress(1, 4)).toBe(34);
    expect(mobileStepperProgress(9, 4)).toBe(100);
    expect(mobileStepperProgress(0, 1)).toBe(100);
  });

  it("text: the step number and the count", () => {
    expect(mobileStepperText(0, 3)).toBe("1 / 3");
    expect(mobileStepperText(5, 3)).toBe("3 / 3");
  });
});
