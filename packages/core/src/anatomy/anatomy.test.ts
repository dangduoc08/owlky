import { describe, expect, it } from "vitest";
import { buttonAttributes, buttonColors, buttonSizes, buttonVariants } from "./anatomy.js";

describe("buttonAttributes", () => {
  it("emits explicit defaults", () => {
    expect(buttonAttributes()).toEqual({
      "data-mt-button": "",
      "data-mt-variant": "text",
      "data-mt-color": "inherit",
      "data-mt-size": "md",
    });
  });

  it.each(buttonVariants)("maps variant %s", (variant) => {
    expect(buttonAttributes({ variant })["data-mt-variant"]).toBe(variant);
  });

  it.each(buttonColors)("maps color %s", (color) => {
    expect(buttonAttributes({ color })["data-mt-color"]).toBe(color);
  });

  it.each(buttonSizes)("maps size %s", (size) => {
    expect(buttonAttributes({ size })["data-mt-size"]).toBe(size);
  });

  it("adds full width and loading attributes only when enabled", () => {
    expect(buttonAttributes({ fullWidth: true, loading: true })).toMatchObject({
      "data-mt-full-width": "",
      "data-mt-loading": "",
      "data-mt-loading-position": "center",
    });
    expect(
      buttonAttributes({ loading: true, loadingPosition: "end" })["data-mt-loading-position"],
    ).toBe("end");
    const off = buttonAttributes({ fullWidth: false, loading: false, loadingPosition: "end" });
    expect(off).not.toHaveProperty("data-mt-full-width");
    expect(off).not.toHaveProperty("data-mt-loading");
    expect(off).not.toHaveProperty("data-mt-loading-position");
  });

  it("falls back to defaults for values outside the allowed lists (untrusted input)", () => {
    const hostile = buttonAttributes({
      variant: '"><img src=x onerror=alert(1)>' as never,
      color: "__proto__" as never,
      size: "x".repeat(10_000) as never,
      loading: true,
      loadingPosition: "javascript:alert(1)" as never,
    });
    expect(hostile).toEqual({
      "data-mt-button": "",
      "data-mt-variant": "text",
      "data-mt-color": "inherit",
      "data-mt-size": "md",
      "data-mt-loading": "",
      "data-mt-loading-position": "center",
    });
  });
});
