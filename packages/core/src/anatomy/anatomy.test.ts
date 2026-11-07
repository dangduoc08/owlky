import { describe, expect, it } from "vitest";
import {
  accordionAttributes,
  alertAttributes,
  ariaSort,
  avatarAttributes,
  avatarGroupAttributes,
  avatarVariants,
  badgeAttributes,
  badgeContent,
  badgeVariants,
  buttonAttributes,
  buttonColors,
  buttonGroupAttributes,
  buttonSizes,
  buttonVariants,
  checkboxAttributes,
  chipAttributes,
  chipColors,
  chipVariants,
  circularProgressAttributes,
  circularProgressVariants,
  drawerAnchors,
  drawerAttributes,
  fabAttributes,
  fabColors,
  fabSizes,
  fabVariants,
  formControlLabelAttributes,
  iconButtonAttributes,
  iconButtonColors,
  iconButtonSizes,
  labelAttributes,
  labelPlacements,
  labelVariants,
  linearProgressAttributes,
  linearProgressOptions,
  linearProgressVariants,
  orientations,
  progressColors,
  radioAttributes,
  radioGroupAttributes,
  scrollbarAttributes,
  selectionControlColors,
  selectionControlSizes,
  sortableAttributes,
  sortableLayouts,
  switchAttributes,
  tableAttributes,
  tableCellAttributes,
  tableSortLabelAttributes,
  textFieldAttributes,
  textFieldMargins,
  textFieldVariants,
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

describe("accordionAttributes", () => {
  it("emits the variant explicitly and flags only when enabled", () => {
    expect(accordionAttributes()).toEqual({
      "data-ok-accordion": "",
      "data-ok-variant": "default",
    });
    expect(
      accordionAttributes({ variant: "soft", disableGutters: true, disabled: true }),
    ).toMatchObject({
      "data-ok-variant": "soft",
      "data-ok-disable-gutters": "",
      "data-ok-disabled": "",
    });
    expect(accordionAttributes({ variant: "x" as never })["data-ok-variant"]).toBe("default");
  });
});

describe("table attributes", () => {
  it("table: explicit size and padding, sticky header only when enabled", () => {
    expect(tableAttributes()).toEqual({
      "data-ok-table": "",
      "data-ok-size": "medium",
      "data-ok-padding": "normal",
    });
    expect(
      tableAttributes({ size: "small", padding: "checkbox", stickyHeader: true }),
    ).toMatchObject({
      "data-ok-size": "small",
      "data-ok-padding": "checkbox",
      "data-ok-sticky-header": "",
    });
    expect(tableAttributes({ size: '"><img>' as never })["data-ok-size"]).toBe("medium");
  });

  it("cells: only valid overrides; inherit adds nothing", () => {
    expect(tableCellAttributes()).toEqual({});
    expect(tableCellAttributes({ align: "inherit" })).toEqual({});
    expect(tableCellAttributes({ align: "right", padding: "none", size: "small" })).toEqual({
      "data-ok-align": "right",
      "data-ok-padding": "none",
      "data-ok-size": "small",
    });
    expect(tableCellAttributes({ align: "x" as never, padding: "y" as never })).toEqual({});
  });

  it("sort label and aria-sort", () => {
    expect(tableSortLabelAttributes()).toEqual({
      "data-ok-table-sort-label": "",
      "data-ok-direction": "asc",
    });
    expect(
      tableSortLabelAttributes({ active: true, direction: "desc", hideSortIcon: true }),
    ).toMatchObject({
      "data-ok-active": "",
      "data-ok-direction": "desc",
      "data-ok-hide-sort-icon": "",
    });
    expect([ariaSort("asc"), ariaSort("desc"), ariaSort(false), ariaSort(undefined)]).toEqual([
      "ascending",
      "descending",
      undefined,
      undefined,
    ]);
  });
});

describe("alertAttributes", () => {
  it("defaults to success; the color follows the severity unless set", () => {
    expect(alertAttributes()).toEqual({
      "data-ok-alert": "",
      "data-ok-severity": "success",
      "data-ok-variant": "standard",
      "data-ok-color": "success",
    });
    expect(alertAttributes({ severity: "error", variant: "filled" })).toMatchObject({
      "data-ok-severity": "error",
      "data-ok-variant": "filled",
      "data-ok-color": "error",
    });
    expect(alertAttributes({ severity: "info", color: "warning" })["data-ok-color"]).toBe(
      "warning",
    );
  });

  it("rejects unknown values (untrusted input)", () => {
    expect(alertAttributes({ severity: "x" as never, color: "y" as never })).toMatchObject({
      "data-ok-severity": "success",
      "data-ok-color": "success",
    });
    expect(alertAttributes({ severity: "info", color: "y" as never })["data-ok-color"]).toBe(
      "info",
    );
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

describe("scrollbarAttributes", () => {
  it("auto-hides by default; only `autoHide: false` writes the attribute", () => {
    expect(scrollbarAttributes()).toEqual({ "data-ok-scrollbar": "" });
    expect(scrollbarAttributes({ autoHide: true })).toEqual({ "data-ok-scrollbar": "" });
    expect(scrollbarAttributes({ autoHide: false })).toEqual({
      "data-ok-scrollbar": "",
      "data-ok-auto-hide": "false",
    });
    expect(scrollbarAttributes({ autoHide: HOSTILE })).toEqual({ "data-ok-scrollbar": "" });
  });
});

describe("circularProgressAttributes", () => {
  it("emits explicit defaults; size and thickness only when given", () => {
    expect(circularProgressAttributes()).toEqual({
      "data-ok-circular-progress": "",
      "data-ok-variant": "indeterminate",
      "data-ok-color": "primary",
    });
  });

  it.each(circularProgressVariants)("maps variant %s", (variant) => {
    expect(circularProgressAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it.each(progressColors)("maps color %s", (color) => {
    expect(circularProgressAttributes({ color })["data-ok-color"]).toBe(color);
  });

  it("writes valid sizes, thickness and flags", () => {
    expect(
      circularProgressAttributes({
        size: 48,
        thickness: 5,
        disableShrink: true,
        enableTrackSlot: true,
      }),
    ).toEqual({
      "data-ok-circular-progress": "",
      "data-ok-variant": "indeterminate",
      "data-ok-color": "primary",
      "data-ok-size": "48",
      "data-ok-thickness": "5",
      "data-ok-disable-shrink": "",
      "data-ok-track-slot": "",
    });
    expect(circularProgressAttributes({ size: "3rem" })["data-ok-size"]).toBe("3rem");
  });

  it("drops invalid values", () => {
    const attributes = circularProgressAttributes({
      variant: HOSTILE,
      color: HOSTILE,
      size: HOSTILE,
      thickness: -1,
      disableShrink: HOSTILE,
    });
    expect(attributes).toEqual({
      "data-ok-circular-progress": "",
      "data-ok-variant": "indeterminate",
      "data-ok-color": "primary",
    });
    expect(circularProgressAttributes({ size: "calc(1px + 2px)" })).not.toHaveProperty(
      "data-ok-size",
    );
    expect(circularProgressAttributes({ size: Number.NaN })).not.toHaveProperty("data-ok-size");
  });
});

describe("linearProgressAttributes", () => {
  it("emits explicit defaults", () => {
    expect(linearProgressAttributes()).toEqual({
      "data-ok-linear-progress": "",
      "data-ok-variant": "indeterminate",
      "data-ok-color": "primary",
    });
  });

  it.each(linearProgressVariants)("maps variant %s", (variant) => {
    expect(linearProgressAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it.each(progressColors)("maps color %s", (color) => {
    expect(linearProgressAttributes({ color })["data-ok-color"]).toBe(color);
  });

  it("value attributes are ARIA (written by the component) except the buffer", () => {
    expect(linearProgressOptions.options.value.attr).toBe("aria-valuenow");
    expect(linearProgressOptions.options.valueBuffer.attr).toBe("data-ok-value-buffer");
    expect(linearProgressAttributes({ variant: HOSTILE, color: HOSTILE })).toEqual(
      linearProgressAttributes(),
    );
  });
});

describe("checkboxAttributes / switchAttributes / formControlLabelAttributes", () => {
  it("emit explicit defaults", () => {
    expect(checkboxAttributes()).toEqual({
      "data-ok-checkbox": "",
      "data-ok-color": "primary",
      "data-ok-size": "medium",
    });
    expect(switchAttributes()).toEqual({
      "data-ok-switch": "",
      "data-ok-color": "primary",
      "data-ok-size": "medium",
    });
    expect(formControlLabelAttributes()).toEqual({
      "data-ok-form-control-label": "",
      "data-ok-label-placement": "end",
    });
  });

  it.each(selectionControlColors)("maps color %s", (color) => {
    expect(checkboxAttributes({ color })["data-ok-color"]).toBe(color);
    expect(switchAttributes({ color })["data-ok-color"]).toBe(color);
  });

  it.each(selectionControlSizes)("maps size %s", (size) => {
    expect(checkboxAttributes({ size })["data-ok-size"]).toBe(size);
    expect(switchAttributes({ size })["data-ok-size"]).toBe(size);
  });

  it.each(labelPlacements)("maps label placement %s", (labelPlacement) => {
    expect(formControlLabelAttributes({ labelPlacement })["data-ok-label-placement"]).toBe(
      labelPlacement,
    );
  });

  it("flags and the optional edge", () => {
    expect(checkboxAttributes({ indeterminate: true })).toHaveProperty("data-ok-indeterminate", "");
    expect(formControlLabelAttributes({ required: true })).toHaveProperty("data-ok-required", "");
    expect(switchAttributes({ edge: "end" })["data-ok-edge"]).toBe("end");
    expect(switchAttributes({ edge: false })).not.toHaveProperty("data-ok-edge");
  });

  it("drops invalid values", () => {
    expect(checkboxAttributes({ color: HOSTILE, size: HOSTILE, indeterminate: HOSTILE })).toEqual(
      checkboxAttributes(),
    );
    expect(switchAttributes({ color: HOSTILE, edge: HOSTILE })).toEqual(switchAttributes());
    expect(formControlLabelAttributes({ labelPlacement: HOSTILE, required: HOSTILE })).toEqual(
      formControlLabelAttributes(),
    );
  });
});

describe("radioAttributes / radioGroupAttributes / textFieldAttributes", () => {
  it("emit explicit defaults", () => {
    expect(radioAttributes()).toEqual({
      "data-ok-radio": "",
      "data-ok-color": "primary",
      "data-ok-size": "medium",
    });
    expect(radioGroupAttributes()).toEqual({ "data-ok-radio-group": "" });
    expect(radioGroupAttributes({ row: true })).toEqual({
      "data-ok-radio-group": "",
      "data-ok-row": "",
    });
    expect(textFieldAttributes()).toEqual({
      "data-ok-text-field": "",
      "data-ok-variant": "outlined",
      "data-ok-size": "medium",
      "data-ok-color": "default",
      "data-ok-margin": "none",
    });
    expect(textFieldAttributes({ color: "secondary" })["data-ok-color"]).toBe("secondary");
  });

  it.each(textFieldVariants)("maps variant %s", (variant) => {
    expect(textFieldAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it.each(textFieldMargins)("maps margin %s", (margin) => {
    expect(textFieldAttributes({ margin })["data-ok-margin"]).toBe(margin);
  });

  it("flags, rows and invalid values", () => {
    expect(
      textFieldAttributes({
        size: "small",
        error: true,
        fullWidth: true,
        shrink: true,
        minRows: 2,
        maxRows: 4,
      }),
    ).toEqual({
      "data-ok-text-field": "",
      "data-ok-variant": "outlined",
      "data-ok-size": "small",
      "data-ok-color": "default",
      "data-ok-margin": "none",
      "data-ok-error": "",
      "data-ok-full-width": "",
      "data-ok-shrink": "",
      "data-ok-min-rows": "2",
      "data-ok-max-rows": "4",
    });
    expect(
      textFieldAttributes({
        variant: HOSTILE,
        color: HOSTILE,
        margin: HOSTILE,
        minRows: 0,
        maxRows: HOSTILE,
      }),
    ).toEqual(textFieldAttributes());
    expect(radioAttributes({ color: HOSTILE, size: HOSTILE })).toEqual(radioAttributes());
    expect(radioAttributes({ color: "error", size: "small" })).toMatchObject({
      "data-ok-color": "error",
      "data-ok-size": "small",
    });
  });
});

describe("avatar, badge, chip and label attributes", () => {
  it("emit explicit defaults", () => {
    expect(avatarAttributes()).toEqual({
      "data-ok-avatar": "",
      "data-ok-variant": "circular",
      "data-ok-color": "default",
    });
    expect(avatarGroupAttributes()).toEqual({
      "data-ok-avatar-group": "",
      "data-ok-spacing": "medium",
    });
    expect(badgeAttributes()).toEqual({
      "data-ok-badge": "",
      "data-ok-variant": "standard",
      "data-ok-color": "default",
      "data-ok-overlap": "rectangular",
      "data-ok-vertical": "top",
      "data-ok-horizontal": "right",
    });
    expect(chipAttributes()).toEqual({
      "data-ok-chip": "",
      "data-ok-variant": "filled",
      "data-ok-color": "default",
      "data-ok-size": "medium",
    });
    expect(labelAttributes()).toEqual({
      "data-ok-label": "",
      "data-ok-variant": "soft",
      "data-ok-color": "default",
    });
  });

  it.each(avatarVariants)("avatar variant %s", (variant) => {
    expect(avatarAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });
  it.each(badgeVariants)("badge variant %s", (variant) => {
    expect(badgeAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });
  it.each(chipColors)("chip and label color %s", (color) => {
    expect(chipAttributes({ color })["data-ok-color"]).toBe(color);
    expect(labelAttributes({ color })["data-ok-color"]).toBe(color);
  });
  it.each(labelVariants)("label variant %s", (variant) => {
    expect(labelAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });
  it.each(chipVariants)("chip variant %s", (variant) => {
    expect(chipAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it("maps sizes, anchors, flags and drops invalid values", () => {
    expect(avatarAttributes({ size: 56, color: "error", variant: "rounded" })).toMatchObject({
      "data-ok-size": "56",
      "data-ok-color": "error",
    });
    expect(avatarAttributes({ size: "3rem" })["data-ok-size"]).toBe("3rem");
    expect(avatarGroupAttributes({ spacing: "small" })["data-ok-spacing"]).toBe("small");
    expect(
      badgeAttributes({
        overlap: "circular",
        anchorOrigin: { vertical: "bottom", horizontal: "left" },
        invisible: true,
      }),
    ).toMatchObject({
      "data-ok-overlap": "circular",
      "data-ok-vertical": "bottom",
      "data-ok-horizontal": "left",
      "data-ok-invisible": "",
    });
    expect(avatarAttributes({ variant: HOSTILE, color: HOSTILE, size: HOSTILE })).toEqual(
      avatarAttributes(),
    );
    expect(badgeAttributes({ variant: HOSTILE, anchorOrigin: HOSTILE })).toEqual(badgeAttributes());
    expect(chipAttributes({ variant: HOSTILE, size: HOSTILE })).toEqual(chipAttributes());
    expect(labelAttributes({ variant: HOSTILE, color: HOSTILE })).toEqual(labelAttributes());
    expect(avatarGroupAttributes({ spacing: HOSTILE })).toEqual(avatarGroupAttributes());
  });
});

describe("badgeContent", () => {
  it("caps numbers at max, hides 0 unless showZero", () => {
    expect(badgeContent(4)).toEqual({ content: 4, invisible: false });
    expect(badgeContent(100)).toEqual({ content: "99+", invisible: false });
    expect(badgeContent(1000, { max: 999 })).toEqual({ content: "999+", invisible: false });
    expect(badgeContent(99, { max: 99 })).toEqual({ content: 99, invisible: false });
    expect(badgeContent(0)).toEqual({ content: 0, invisible: true });
    expect(badgeContent(0, { showZero: true })).toEqual({ content: 0, invisible: false });
    expect(badgeContent(150, { max: Number.NaN })).toEqual({ content: "99+", invisible: false });
  });

  it("other content shows as given; empty content hides", () => {
    expect(badgeContent("New")).toEqual({ content: "New", invisible: false });
    expect(badgeContent(undefined)).toEqual({ content: undefined, invisible: true });
    expect(badgeContent("")).toEqual({ content: "", invisible: true });
    expect(badgeContent(null)).toEqual({ content: null, invisible: true });
  });
});
