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
  sortableAttributes,
  sortableLayouts,
  toggleButtonAttributes,
  toggleButtonColors,
  toggleButtonSizes,
  toggleGroupAttributes,
} from "./anatomy.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;

describe("buttonAttributes", () => {
  it("emits explicit defaults", () => {
    expect(buttonAttributes()).toEqual({
      "data-ok-button": "",
      "data-ok-variant": "text",
      "data-ok-color": "inherit",
      "data-ok-size": "md",
    });
  });

  it.each(buttonVariants)("maps variant %s", (variant) => {
    expect(buttonAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it.each(buttonColors)("maps color %s", (color) => {
    expect(buttonAttributes({ color })["data-ok-color"]).toBe(color);
  });

  it.each(buttonSizes)("maps size %s", (size) => {
    expect(buttonAttributes({ size })["data-ok-size"]).toBe(size);
  });

  it("adds full width and loading attributes only when enabled", () => {
    expect(buttonAttributes({ fullWidth: true, loading: true })).toMatchObject({
      "data-ok-full-width": "",
      "data-ok-loading": "",
      "data-ok-loading-position": "center",
    });
    expect(
      buttonAttributes({ loading: true, loadingPosition: "end" })["data-ok-loading-position"],
    ).toBe("end");
    const off = buttonAttributes({ fullWidth: false, loading: false, loadingPosition: "end" });
    expect(off).not.toHaveProperty("data-ok-full-width");
    expect(off).not.toHaveProperty("data-ok-loading");
    expect(off).not.toHaveProperty("data-ok-loading-position");
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
      "data-ok-button": "",
      "data-ok-variant": "text",
      "data-ok-color": "inherit",
      "data-ok-size": "md",
      "data-ok-loading": "",
      "data-ok-loading-position": "center",
    });
  });
});

describe("iconButtonAttributes", () => {
  it("emits explicit defaults", () => {
    expect(iconButtonAttributes()).toEqual({
      "data-ok-icon-button": "",
      "data-ok-color": "default",
      "data-ok-size": "md",
    });
  });

  it.each(iconButtonColors)("maps color %s", (color) => {
    expect(iconButtonAttributes({ color })["data-ok-color"]).toBe(color);
  });

  it.each(iconButtonSizes)("maps size %s", (size) => {
    expect(iconButtonAttributes({ size })["data-ok-size"]).toBe(size);
  });

  it("adds animate only when enabled and rejects unknown values", () => {
    expect(iconButtonAttributes({ animate: true })).toHaveProperty("data-ok-animate", "");
    expect(iconButtonAttributes({ animate: false })).not.toHaveProperty("data-ok-animate");
    expect(iconButtonAttributes({ color: HOSTILE, size: HOSTILE })).toEqual(iconButtonAttributes());
  });
});

describe("fabAttributes", () => {
  it("emits explicit defaults", () => {
    expect(fabAttributes()).toEqual({
      "data-ok-fab": "",
      "data-ok-variant": "contained",
      "data-ok-color": "default",
      "data-ok-size": "md",
    });
  });

  it.each(fabVariants)("maps variant %s", (variant) => {
    expect(fabAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it.each(fabColors)("maps color %s", (color) => {
    expect(fabAttributes({ color })["data-ok-color"]).toBe(color);
  });

  it.each(fabSizes)("maps size %s", (size) => {
    expect(fabAttributes({ size })["data-ok-size"]).toBe(size);
  });

  it("adds extended / animate only when enabled and rejects unknown values", () => {
    expect(fabAttributes({ extended: true, animate: true })).toMatchObject({
      "data-ok-extended": "",
      "data-ok-animate": "",
    });
    const off = fabAttributes({ extended: false, animate: false });
    expect(off).not.toHaveProperty("data-ok-extended");
    expect(off).not.toHaveProperty("data-ok-animate");
    expect(fabAttributes({ variant: HOSTILE, color: HOSTILE, size: HOSTILE })).toEqual(
      fabAttributes(),
    );
  });
});

describe("group attributes", () => {
  it.each(orientations)("maps orientation %s", (orientation) => {
    expect(buttonGroupAttributes({ orientation })["data-ok-orientation"]).toBe(orientation);
    expect(toggleGroupAttributes({ orientation })["data-ok-orientation"]).toBe(orientation);
  });

  it("emits explicit defaults and rejects unknown values", () => {
    expect(buttonGroupAttributes({ orientation: HOSTILE })).toEqual({
      "data-ok-button-group": "",
      "data-ok-orientation": "horizontal",
    });
    expect(toggleGroupAttributes()).toEqual({
      "data-ok-toggle-group": "",
      "data-ok-orientation": "horizontal",
    });
    expect(toggleGroupAttributes({ exclusive: true })).toHaveProperty("data-ok-exclusive", "");
    expect(toggleGroupAttributes({ exclusive: false })).not.toHaveProperty("data-ok-exclusive");
  });
});

describe("toggleButtonAttributes", () => {
  it("emits explicit defaults and rejects unknown values", () => {
    const defaults = {
      "data-ok-toggle-button": "",
      "data-ok-color": "standard",
      "data-ok-size": "md",
    };
    expect(toggleButtonAttributes()).toEqual(defaults);
    expect(toggleButtonAttributes({ color: "black" as never, size: HOSTILE })).toEqual(defaults);
  });

  it.each(toggleButtonColors)("maps color %s", (color) => {
    expect(toggleButtonAttributes({ color })["data-ok-color"]).toBe(color);
  });

  it.each(toggleButtonSizes)("maps size %s", (size) => {
    expect(toggleButtonAttributes({ size })["data-ok-size"]).toBe(size);
  });
});

describe("drawerAttributes", () => {
  it("emits explicit defaults and rejects unknown values", () => {
    const defaults = {
      "data-ok-drawer": "",
      "data-ok-anchor": "left",
      "data-ok-variant": "temporary",
    };
    expect(drawerAttributes()).toEqual(defaults);
    expect(drawerAttributes({ anchor: HOSTILE })).toEqual(defaults);
  });

  it.each(drawerAnchors)("maps anchor %s", (anchor) => {
    expect(drawerAttributes({ anchor })["data-ok-anchor"]).toBe(anchor);
  });
});

describe("sortableAttributes", () => {
  it("emits explicit defaults and rejects unknown values", () => {
    const defaults = { "data-ok-sortable": "", "data-ok-layout": "grid" };
    expect(sortableAttributes()).toEqual(defaults);
    expect(sortableAttributes({ layout: HOSTILE })).toEqual(defaults);
  });

  it.each(sortableLayouts)("maps layout %s", (layout) => {
    expect(sortableAttributes({ layout })["data-ok-layout"]).toBe(layout);
  });
});

describe("options added in the upstream API review", () => {
  it("button and toggle flags; optional icon button edge", () => {
    expect(buttonAttributes({ disableElevation: true })).toHaveProperty(
      "data-ok-disable-elevation",
      "",
    );
    expect(toggleButtonAttributes({ fullWidth: true })).toHaveProperty("data-ok-full-width", "");
    expect(toggleGroupAttributes({ fullWidth: true })).toHaveProperty("data-ok-full-width", "");
    expect(buttonGroupAttributes({ fullWidth: true })).toHaveProperty("data-ok-full-width", "");
    expect(iconButtonAttributes({ edge: "end", loading: true })).toMatchObject({
      "data-ok-edge": "end",
      "data-ok-loading": "",
    });
    expect(iconButtonAttributes({ edge: HOSTILE })).not.toHaveProperty("data-ok-edge");
  });

  it("drawer variants and flags", () => {
    expect(
      drawerAttributes({ variant: "permanent", hideBackdrop: true, disableEscapeKeyDown: true }),
    ).toEqual({
      "data-ok-drawer": "",
      "data-ok-anchor": "left",
      "data-ok-variant": "permanent",
      "data-ok-hide-backdrop": "",
      "data-ok-disable-escape-key-down": "",
    });
  });
});
