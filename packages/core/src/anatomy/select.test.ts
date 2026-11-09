import { describe, expect, it } from "vitest";
import {
  formControlAttributes,
  inputLabelAttributes,
  selectAttributes,
  selectBehaviorAttributes,
  selectOptions,
  textFieldVariants,
} from "./anatomy.js";

describe("selectAttributes", () => {
  it("emits explicit style defaults, flags only when on", () => {
    expect(selectAttributes()).toEqual({
      "data-ok-select": "",
      "data-ok-variant": "outlined",
      "data-ok-size": "medium",
      "data-ok-color": "default",
    });
    expect(
      selectAttributes({
        variant: "filled",
        size: "small",
        color: "primary",
        error: true,
        fullWidth: true,
        multiple: true,
        autoWidth: true,
        displayEmpty: true,
      }),
    ).toEqual({
      "data-ok-select": "",
      "data-ok-variant": "filled",
      "data-ok-size": "small",
      "data-ok-color": "primary",
      "data-ok-error": "",
      "data-ok-full-width": "",
      "data-ok-multiple": "",
      "data-ok-auto-width": "",
      "data-ok-display-empty": "",
    });
  });

  it.each(textFieldVariants)("maps variant %s", (variant) => {
    expect(selectAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it("invalid values fall back to the defaults", () => {
    const attrs = selectAttributes({
      variant: "nope" as never,
      size: "huge" as never,
      color: '"><img onerror=x>' as never,
    });
    expect(attrs["data-ok-variant"]).toBe("outlined");
    expect(attrs["data-ok-size"]).toBe("medium");
    expect(attrs["data-ok-color"]).toBe("default");
  });

  it("behavior attributes only, for a select composed in another field", () => {
    expect(selectBehaviorAttributes()).toEqual({ "data-ok-select": "" });
    expect(
      selectBehaviorAttributes({ multiple: true, autoWidth: true, displayEmpty: true }),
    ).toEqual({
      "data-ok-select": "",
      "data-ok-multiple": "",
      "data-ok-auto-width": "",
      "data-ok-display-empty": "",
    });
  });

  it("documents the trigger's native states and the value / open states", () => {
    expect(selectOptions.options.disabled.children).toBe(":scope > [data-ok-select-display]");
    expect(selectOptions.options.value.attr).toBe("aria-selected");
    expect(selectOptions.options.open.attr).toBe("aria-expanded");
  });
});

describe("inputLabelAttributes and FormControl hiddenLabel", () => {
  it("writes shrink and disableAnimation only when on", () => {
    expect(inputLabelAttributes()).toEqual({ "data-ok-input-label": "" });
    expect(inputLabelAttributes({ shrink: true, disableAnimation: true })).toEqual({
      "data-ok-input-label": "",
      "data-ok-shrink": "",
      "data-ok-disable-animation": "",
    });
  });

  it("hiddenLabel is a FormControl flag", () => {
    expect(formControlAttributes({ hiddenLabel: true })).toEqual({
      "data-ok-form-control": "",
      "data-ok-hidden-label": "",
    });
  });
});
