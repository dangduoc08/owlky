import { describe, expect, it } from "vitest";
import {
  buttonAttributes,
  buttonColors,
  buttonGroupAttributes,
  buttonSizes,
  buttonVariants,
  drawerAnchors,
  drawerAttributes,
  fabAttributes,
  fabColors,
  fabSizes,
  fabVariants,
  iconButtonAttributes,
  iconButtonColors,
  iconButtonSizes,
  orientations,
  toggleButtonAttributes,
  toggleButtonColors,
  toggleButtonSizes,
  toggleGroupAttributes,
} from "./anatomy.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;

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

describe("iconButtonAttributes", () => {
  it("emits explicit defaults", () => {
    expect(iconButtonAttributes()).toEqual({
      "data-mt-icon-button": "",
      "data-mt-color": "default",
      "data-mt-size": "md",
    });
  });

  it.each(iconButtonColors)("maps color %s", (color) => {
    expect(iconButtonAttributes({ color })["data-mt-color"]).toBe(color);
  });

  it.each(iconButtonSizes)("maps size %s", (size) => {
    expect(iconButtonAttributes({ size })["data-mt-size"]).toBe(size);
  });

  it("adds animate only when enabled and rejects unknown values", () => {
    expect(iconButtonAttributes({ animate: true })).toHaveProperty("data-mt-animate", "");
    expect(iconButtonAttributes({ animate: false })).not.toHaveProperty("data-mt-animate");
    expect(iconButtonAttributes({ color: HOSTILE, size: HOSTILE })).toEqual(iconButtonAttributes());
  });
});

describe("fabAttributes", () => {
  it("emits explicit defaults", () => {
    expect(fabAttributes()).toEqual({
      "data-mt-fab": "",
      "data-mt-variant": "contained",
      "data-mt-color": "default",
      "data-mt-size": "md",
    });
  });

  it.each(fabVariants)("maps variant %s", (variant) => {
    expect(fabAttributes({ variant })["data-mt-variant"]).toBe(variant);
  });

  it.each(fabColors)("maps color %s", (color) => {
    expect(fabAttributes({ color })["data-mt-color"]).toBe(color);
  });

  it.each(fabSizes)("maps size %s", (size) => {
    expect(fabAttributes({ size })["data-mt-size"]).toBe(size);
  });

  it("adds extended / animate only when enabled and rejects unknown values", () => {
    expect(fabAttributes({ extended: true, animate: true })).toMatchObject({
      "data-mt-extended": "",
      "data-mt-animate": "",
    });
    const off = fabAttributes({ extended: false, animate: false });
    expect(off).not.toHaveProperty("data-mt-extended");
    expect(off).not.toHaveProperty("data-mt-animate");
    expect(fabAttributes({ variant: HOSTILE, color: HOSTILE, size: HOSTILE })).toEqual(
      fabAttributes(),
    );
  });
});

describe("group attributes", () => {
  it.each(orientations)("maps orientation %s", (orientation) => {
    expect(buttonGroupAttributes({ orientation })["data-mt-orientation"]).toBe(orientation);
    expect(toggleGroupAttributes({ orientation })["data-mt-orientation"]).toBe(orientation);
  });

  it("emits explicit defaults and rejects unknown values", () => {
    expect(buttonGroupAttributes({ orientation: HOSTILE })).toEqual({
      "data-mt-button-group": "",
      "data-mt-orientation": "horizontal",
    });
    expect(toggleGroupAttributes()).toEqual({
      "data-mt-toggle-group": "",
      "data-mt-orientation": "horizontal",
    });
    expect(toggleGroupAttributes({ exclusive: true })).toHaveProperty("data-mt-exclusive", "");
    expect(toggleGroupAttributes({ exclusive: false })).not.toHaveProperty("data-mt-exclusive");
  });
});

describe("toggleButtonAttributes", () => {
  it("emits explicit defaults and rejects unknown values", () => {
    const defaults = {
      "data-mt-toggle-button": "",
      "data-mt-color": "inherit",
      "data-mt-size": "md",
    };
    expect(toggleButtonAttributes()).toEqual(defaults);
    expect(toggleButtonAttributes({ color: "black" as never, size: HOSTILE })).toEqual(defaults);
  });

  it.each(toggleButtonColors)("maps color %s", (color) => {
    expect(toggleButtonAttributes({ color })["data-mt-color"]).toBe(color);
  });

  it.each(toggleButtonSizes)("maps size %s", (size) => {
    expect(toggleButtonAttributes({ size })["data-mt-size"]).toBe(size);
  });
});

describe("drawerAttributes", () => {
  it("emits explicit defaults and rejects unknown values", () => {
    const defaults = { "data-mt-drawer": "", "data-mt-anchor": "left" };
    expect(drawerAttributes()).toEqual(defaults);
    expect(drawerAttributes({ anchor: HOSTILE })).toEqual(defaults);
  });

  it.each(drawerAnchors)("maps anchor %s", (anchor) => {
    expect(drawerAttributes({ anchor })["data-mt-anchor"]).toBe(anchor);
  });
});
