import { describe, expect, it } from "vitest";
import { buttonAttributes, dialogAttributes, switchAttributes } from "./anatomy.js";

describe("anatomy", () => {
  it("emits explicit defaults", () => {
    expect(buttonAttributes()).toEqual({
      "data-mt-button": "",
      "data-mt-variant": "text",
      "data-mt-color": "inherit",
      "data-mt-size": "md",
    });
    expect(switchAttributes()).toEqual({
      "data-mt-switch": "",
      "data-mt-color": "primary",
      "data-mt-size": "md",
    });
    expect(dialogAttributes()).toEqual({ "data-mt-dialog": "", "data-mt-size": "sm" });
  });

  it("maps options", () => {
    expect(
      buttonAttributes({ variant: "soft", color: "error", size: "lg", fullWidth: true }),
    ).toMatchObject({
      "data-mt-variant": "soft",
      "data-mt-color": "error",
      "data-mt-size": "lg",
      "data-mt-full-width": "",
    });
  });
});
