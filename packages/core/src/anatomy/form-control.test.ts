import { describe, expect, it } from "vitest";
import {
  formControlAttributes,
  formControlOptions,
  formGroupAttributes,
  formGroupOptions,
  formHelperTextAttributes,
  formHelperTextMargins,
  formHelperTextOptions,
  formLabelAttributes,
  formLabelOptions,
  optionSchemas,
  selectionControlColors,
  selectionControlSizes,
  textFieldMargins,
  textFieldVariants,
} from "./anatomy.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const STATES = ["disabled", "error", "required", "focused"] as const;

describe("form control schemas", () => {
  it("are registered", () => {
    expect(optionSchemas["form-control"]).toBe(formControlOptions);
    expect(optionSchemas["form-label"]).toBe(formLabelOptions);
    expect(optionSchemas["form-group"]).toBe(formGroupOptions);
    expect(optionSchemas["form-helper-text"]).toBe(formHelperTextOptions);
  });
});

describe("formControlAttributes", () => {
  it("writes only the root marker by default (style options are optional)", () => {
    expect(formControlAttributes()).toEqual({ "data-ok-form-control": "" });
  });

  it.each(selectionControlColors)("color %s", (color) => {
    expect(formControlAttributes({ color })["data-ok-color"]).toBe(color);
  });

  it.each(selectionControlSizes)("size %s", (size) => {
    expect(formControlAttributes({ size })["data-ok-size"]).toBe(size);
  });

  it.each(textFieldVariants)("variant %s", (variant) => {
    expect(formControlAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it.each(textFieldMargins)("margin %s", (margin) => {
    expect(formControlAttributes({ margin })["data-ok-margin"]).toBe(margin);
  });

  it("flags: fullWidth and every shared state", () => {
    expect(
      formControlAttributes({
        fullWidth: true,
        disabled: true,
        error: true,
        required: true,
        focused: true,
      }),
    ).toEqual({
      "data-ok-form-control": "",
      "data-ok-full-width": "",
      "data-ok-disabled": "",
      "data-ok-error": "",
      "data-ok-required": "",
      "data-ok-focused": "",
    });
    expect(formControlAttributes({ error: false, disabled: false })).toEqual({
      "data-ok-form-control": "",
    });
  });

  it("drops invalid values instead of writing them", () => {
    expect(
      formControlAttributes({ color: HOSTILE, size: HOSTILE, variant: HOSTILE, margin: HOSTILE }),
    ).toEqual({ "data-ok-form-control": "" });
  });
});

describe("formLabelAttributes", () => {
  it("marker, color, own states and filled", () => {
    expect(formLabelAttributes()).toEqual({ "data-ok-form-label": "" });
    expect(formLabelAttributes({ color: "success" })["data-ok-color"]).toBe("success");
    expect(formLabelAttributes({ color: HOSTILE })["data-ok-color"]).toBeUndefined();
    for (const key of [...STATES, "filled"] as const)
      expect(formLabelAttributes({ [key]: true })).toEqual({
        "data-ok-form-label": "",
        [`data-ok-${key}`]: "",
      });
  });
});

describe("formGroupAttributes", () => {
  it("marker and row", () => {
    expect(formGroupAttributes()).toEqual({ "data-ok-form-group": "" });
    expect(formGroupAttributes({ row: true })).toEqual({
      "data-ok-form-group": "",
      "data-ok-row": "",
    });
  });
});

describe("formHelperTextAttributes", () => {
  it("marker, margin, variant, own states and filled", () => {
    expect(formHelperTextAttributes()).toEqual({ "data-ok-form-helper-text": "" });
    for (const margin of formHelperTextMargins)
      expect(formHelperTextAttributes({ margin })["data-ok-margin"]).toBe(margin);
    for (const variant of textFieldVariants)
      expect(formHelperTextAttributes({ variant })["data-ok-variant"]).toBe(variant);
    expect(formHelperTextAttributes({ margin: HOSTILE, variant: HOSTILE })).toEqual({
      "data-ok-form-helper-text": "",
    });
    for (const key of [...STATES, "filled"] as const)
      expect(formHelperTextAttributes({ [key]: true })).toEqual({
        "data-ok-form-helper-text": "",
        [`data-ok-${key}`]: "",
      });
  });
});
