import { describe, expect, it } from "vitest";
import {
  accordionActionsAttributes,
  accordionAttributes,
  alertAttributes,
  ariaSort,
  autocompleteAttributes,
  avatarAttributes,
  avatarGroupAttributes,
  avatarGroupStyle,
  avatarVariants,
  backdropAttributes,
  badgeAttributes,
  badgeContent,
  badgeVariants,
  breadcrumbsAttributes,
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
  codeEditorAttributes,
  countUpAttributes,
  dataGridAttributes,
  dialogAttributes,
  dialogMaxWidths,
  diffEditorAttributes,
  dividerAttributes,
  dividerTextAligns,
  dividerVariants,
  drawerAnchors,
  drawerAttributes,
  editorAttributes,
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
  listAttributes,
  listItemAlignments,
  listItemAttributes,
  listItemButtonAttributes,
  listItemTextAttributes,
  listSubheaderAttributes,
  listSubheaderColors,
  menuAttributes,
  menuItemAttributes,
  mobileStepperAttributes,
  motionAttributes,
  motionBorderAttributes,
  motionEntranceVariants,
  motionGroupAttributes,
  motionTextAttributes,
  motionVariants,
  optionSchemas,
  orientations,
  paperAttributes,
  paperElevations,
  paperOptions,
  paperVariants,
  parseAvatarGroupSpacing,
  popoverAttributes,
  popoverPlacements,
  progressColors,
  radioAttributes,
  radioGroupAttributes,
  ratingAttributes,
  scrollbarAttributes,
  selectionControlColors,
  selectionControlSizes,
  sliderAttributes,
  sortableAttributes,
  sortableLayouts,
  stepAttributes,
  stepLabelAttributes,
  stepperAttributes,
  switchAttributes,
  tabAttributes,
  tableAttributes,
  tableCellAttributes,
  tableSortLabelAttributes,
  tabsAttributes,
  textFieldAttributes,
  textFieldMargins,
  textFieldVariants,
  timelineAttributes,
  timelineDotAttributes,
  timelineItemAttributes,
  toasterAttributes,
  toggleButtonAttributes,
  toggleButtonColors,
  toggleButtonSizes,
  toggleGroupAttributes,
  tooltipAttributes,
  transferListAttributes,
  treeViewAttributes,
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

describe("accordionActionsAttributes", () => {
  it("marker, and disableSpacing only when on", () => {
    expect(accordionActionsAttributes()).toEqual({ "data-ok-accordion-actions": "" });
    expect(accordionActionsAttributes({ disableSpacing: true })).toEqual({
      "data-ok-accordion-actions": "",
      "data-ok-disable-spacing": "",
    });
    expect(accordionActionsAttributes({ disableSpacing: "x" as never })).toEqual(
      accordionActionsAttributes(),
    );
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
  it("label disabled only when on", () => {
    expect(labelAttributes({ disabled: true })["data-ok-disabled"]).toBe("");
    expect(labelAttributes({ disabled: HOSTILE })).toEqual(labelAttributes());
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
    expect(avatarGroupAttributes({ spacing: 12 })["data-ok-spacing"]).toBe("12");
    expect(avatarGroupAttributes({ spacing: -1 })["data-ok-spacing"]).toBe("medium");
    expect(avatarGroupStyle(12)).toEqual({ "--_ok-overlap": "-12px" });
    expect(avatarGroupStyle("4.5")).toEqual({ "--_ok-overlap": "-4.5px" });
    expect(avatarGroupStyle(0)).toEqual({ "--_ok-overlap": "0px" });
    for (const value of ["small", "medium", "1e400", "12px", null, HOSTILE])
      expect(avatarGroupStyle(value)).toEqual({});
    expect(parseAvatarGroupSpacing("8")).toBe(8);
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

describe("dividerAttributes", () => {
  it("emits explicit defaults; textAlign only when given", () => {
    expect(dividerAttributes()).toEqual({
      "data-ok-divider": "",
      "data-ok-variant": "fullWidth",
      "data-ok-orientation": "horizontal",
    });
  });
  it.each(dividerVariants)("variant %s", (variant) => {
    expect(dividerAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });
  it.each(dividerTextAligns)("textAlign %s", (textAlign) => {
    expect(dividerAttributes({ textAlign })["data-ok-text-align"]).toBe(textAlign);
  });
  it("flags and invalid values", () => {
    expect(
      dividerAttributes({ orientation: "vertical", flexItem: true, absolute: true }),
    ).toMatchObject({
      "data-ok-orientation": "vertical",
      "data-ok-flex-item": "",
      "data-ok-absolute": "",
    });
    expect(
      dividerAttributes({
        variant: HOSTILE,
        orientation: HOSTILE,
        textAlign: HOSTILE,
        flexItem: HOSTILE,
      }),
    ).toEqual(dividerAttributes());
  });
});

describe("paperAttributes", () => {
  it("emits explicit defaults: elevation variant, level 1, rounded", () => {
    expect(paperAttributes()).toEqual({
      "data-ok-paper": "",
      "data-ok-variant": "elevation",
      "data-ok-elevation": "1",
    });
  });
  it.each(paperVariants)("variant %s", (variant) => {
    expect(paperAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });
  it.each(paperElevations)("elevation %s (number and string)", (level) => {
    expect(paperAttributes({ elevation: Number(level) })["data-ok-elevation"]).toBe(level);
    expect(paperAttributes({ elevation: level })["data-ok-elevation"]).toBe(level);
  });
  it("square, and invalid values fall back to the defaults", () => {
    expect(paperAttributes({ square: true })["data-ok-square"]).toBe("");
    for (const elevation of [-1, 25, 1.5, Number.NaN, "01", " 2", HOSTILE]) {
      expect(paperAttributes({ elevation })["data-ok-elevation"]).toBe("1");
    }
    expect(paperAttributes({ variant: HOSTILE, square: HOSTILE })).toEqual(paperAttributes());
  });
  it("is in the option registry", () => {
    expect(optionSchemas.paper).toBe(paperOptions);
  });
});

describe("list attributes", () => {
  it("list: root marker and flags", () => {
    expect(listAttributes()).toEqual({ "data-ok-list": "" });
    expect(listAttributes({ dense: true, disablePadding: true })).toEqual({
      "data-ok-list": "",
      "data-ok-dense": "",
      "data-ok-disable-padding": "",
    });
    expect(listAttributes({ dense: HOSTILE })).toEqual(listAttributes());
  });
  it.each(listItemAlignments)("item alignItems %s (only when given)", (alignItems) => {
    expect(listItemAttributes({ alignItems })["data-ok-align-items"]).toBe(alignItems);
    expect(listItemButtonAttributes({ alignItems })["data-ok-align-items"]).toBe(alignItems);
  });
  it("item and button flags; hostile values dropped", () => {
    expect(listItemAttributes()).toEqual({ "data-ok-list-item": "" });
    expect(
      listItemAttributes({
        dense: true,
        disableGutters: true,
        disablePadding: true,
        divider: true,
      }),
    ).toEqual({
      "data-ok-list-item": "",
      "data-ok-dense": "",
      "data-ok-disable-gutters": "",
      "data-ok-disable-padding": "",
      "data-ok-show-divider": "",
    });
    expect(listItemButtonAttributes({ selected: true, divider: true })).toEqual({
      "data-ok-list-item-button": "",
      "data-ok-show-divider": "",
      "data-ok-selected": "",
    });
    expect(listItemButtonAttributes({ alignItems: HOSTILE, selected: HOSTILE })).toEqual({
      "data-ok-list-item-button": "",
    });
  });
  it("text inset", () => {
    expect(listItemTextAttributes()).toEqual({ "data-ok-list-item-text": "" });
    expect(listItemTextAttributes({ inset: true })["data-ok-inset"]).toBe("");
  });
  it.each(listSubheaderColors)("subheader color %s", (color) => {
    expect(listSubheaderAttributes({ color })["data-ok-color"]).toBe(color);
  });
  it("subheader defaults and flags", () => {
    expect(listSubheaderAttributes()).toEqual({
      "data-ok-list-subheader": "",
      "data-ok-color": "default",
    });
    expect(
      listSubheaderAttributes({
        disableGutters: true,
        disableSticky: true,
        inset: true,
        color: HOSTILE,
      }),
    ).toEqual({
      "data-ok-list-subheader": "",
      "data-ok-color": "default",
      "data-ok-disable-gutters": "",
      "data-ok-disable-sticky": "",
      "data-ok-inset": "",
    });
  });
});

describe("overlay attributes", () => {
  it.each(popoverPlacements)("popover / tooltip placement %s", (placement) => {
    expect(popoverAttributes({ placement })["data-ok-placement"]).toBe(placement);
    expect(tooltipAttributes({ placement })["data-ok-placement"]).toBe(placement);
  });
  it("popover and tooltip defaults, flags, numbers; hostile values dropped", () => {
    expect(popoverAttributes()).toEqual({ "data-ok-popover": "", "data-ok-placement": "bottom" });
    expect(
      popoverAttributes({ arrow: true, disableEscapeKeyDown: true, placement: HOSTILE }),
    ).toEqual({
      "data-ok-popover": "",
      "data-ok-placement": "bottom",
      "data-ok-arrow": "",
      "data-ok-disable-escape-key-down": "",
    });
    expect(tooltipAttributes({ enterDelay: 500, leaveDelay: HOSTILE, arrow: true })).toEqual({
      "data-ok-tooltip": "",
      "data-ok-placement": "bottom",
      "data-ok-arrow": "",
      "data-ok-enter-delay": "500",
    });
  });
  it("menu and menu item", () => {
    expect(menuAttributes()).toEqual({ "data-ok-menu": "" });
    expect(menuAttributes({ dense: true })["data-ok-dense"]).toBe("");
    expect(
      menuItemAttributes({ selected: true, dense: true, divider: true, disableGutters: true }),
    ).toEqual({
      "data-ok-menu-item": "",
      "data-ok-selected": "",
      "data-ok-dense": "",
      "data-ok-show-divider": "",
      "data-ok-disable-gutters": "",
    });
  });
  it.each(dialogMaxWidths)("dialog maxWidth %s", (maxWidth) => {
    expect(dialogAttributes({ maxWidth })["data-ok-max-width"]).toBe(maxWidth);
  });
  it("dialog defaults and flags", () => {
    expect(dialogAttributes()).toEqual({
      "data-ok-dialog": "",
      "data-ok-max-width": "sm",
      "data-ok-scroll": "paper",
    });
    expect(
      dialogAttributes({
        fullWidth: true,
        fullScreen: true,
        scroll: "body",
        hideBackdrop: true,
        disableEscapeKeyDown: true,
        maxWidth: HOSTILE,
      }),
    ).toEqual({
      "data-ok-dialog": "",
      "data-ok-max-width": "sm",
      "data-ok-full-width": "",
      "data-ok-full-screen": "",
      "data-ok-scroll": "body",
      "data-ok-hide-backdrop": "",
      "data-ok-disable-escape-key-down": "",
    });
  });
  it("backdrop defaults and invisible", () => {
    expect(backdropAttributes()).toEqual({ "data-ok-backdrop": "" });
    expect(backdropAttributes({ invisible: true })).toEqual({
      "data-ok-backdrop": "",
      "data-ok-invisible": "",
    });
    expect(backdropAttributes({ invisible: HOSTILE as never })).toEqual({ "data-ok-backdrop": "" });
  });
  it("toaster", () => {
    expect(toasterAttributes()).toEqual({ "data-ok-toaster": "", "data-ok-position": "top-right" });
    expect(
      toasterAttributes({
        position: "bottom-center",
        duration: 2000,
        visibleToasts: 0,
        closeButton: true,
      }),
    ).toEqual({
      "data-ok-toaster": "",
      "data-ok-position": "bottom-center",
      "data-ok-duration": "2000",
      "data-ok-close-button": "",
    });
  });
  it("tabs: explicit defaults, every option, hostile values fall back", () => {
    const defaults = {
      "data-ok-tabs": "",
      "data-ok-variant": "standard",
      "data-ok-orientation": "horizontal",
      "data-ok-text-color": "inherit",
      "data-ok-indicator-color": "inherit",
      "data-ok-scroll-buttons": "auto",
    };
    expect(tabsAttributes()).toEqual(defaults);
    expect(
      tabsAttributes({
        variant: "scrollable",
        orientation: "vertical",
        textColor: "primary",
        indicatorColor: "secondary",
        scrollButtons: "false",
        centered: true,
        allowScrollButtonsMobile: true,
        visibleScrollbar: true,
        segmented: true,
        selectionFollowsFocus: true,
      }),
    ).toEqual({
      "data-ok-tabs": "",
      "data-ok-variant": "scrollable",
      "data-ok-orientation": "vertical",
      "data-ok-text-color": "primary",
      "data-ok-indicator-color": "secondary",
      "data-ok-scroll-buttons": "false",
      "data-ok-centered": "",
      "data-ok-allow-scroll-buttons-mobile": "",
      "data-ok-visible-scrollbar": "",
      "data-ok-segmented": "",
      "data-ok-selection-follows-focus": "",
    });
    expect(
      tabsAttributes({
        variant: HOSTILE,
        orientation: HOSTILE,
        textColor: HOSTILE,
        indicatorColor: HOSTILE,
        scrollButtons: HOSTILE,
        segmented: HOSTILE,
      }),
    ).toEqual(defaults);
  });
  it("tab: icon position only when given, wrapped", () => {
    expect(tabAttributes()).toEqual({ "data-ok-tab": "" });
    expect(tabAttributes({ iconPosition: "start", wrapped: true })).toEqual({
      "data-ok-tab": "",
      "data-ok-icon-position": "start",
      "data-ok-wrapped": "",
    });
    expect(tabAttributes({ iconPosition: HOSTILE })).toEqual({ "data-ok-tab": "" });
  });
  it("breadcrumbs: collapse numbers only when valid", () => {
    expect(breadcrumbsAttributes()).toEqual({ "data-ok-breadcrumbs": "" });
    expect(
      breadcrumbsAttributes({ maxItems: 3, itemsBeforeCollapse: 0, itemsAfterCollapse: 2 }),
    ).toEqual({
      "data-ok-breadcrumbs": "",
      "data-ok-max-items": "3",
      "data-ok-items-before-collapse": "0",
      "data-ok-items-after-collapse": "2",
    });
    expect(
      breadcrumbsAttributes({ maxItems: 0, itemsBeforeCollapse: -1, itemsAfterCollapse: HOSTILE }),
    ).toEqual({ "data-ok-breadcrumbs": "" });
  });
  it("stepper, step and step label", () => {
    expect(stepperAttributes()).toEqual({
      "data-ok-stepper": "",
      "data-ok-orientation": "horizontal",
      "data-ok-variant": "standard",
    });
    expect(
      stepperAttributes({
        orientation: "vertical",
        alternativeLabel: true,
        variant: "circle",
        activeStep: 2,
      }),
    ).toEqual({
      "data-ok-stepper": "",
      "data-ok-orientation": "vertical",
      "data-ok-alternative-label": "",
      "data-ok-variant": "circle",
      "data-ok-active-step": "2",
    });
    expect(stepperAttributes({ variant: HOSTILE, activeStep: -1 })).toEqual({
      "data-ok-stepper": "",
      "data-ok-orientation": "horizontal",
      "data-ok-variant": "standard",
    });
    expect(stepAttributes()).toEqual({ "data-ok-step": "" });
    expect(stepAttributes({ active: true, completed: true, disabled: true })).toEqual({
      "data-ok-step": "",
      "data-ok-active": "",
      "data-ok-completed": "",
      "data-ok-disabled": "",
    });
    expect(stepLabelAttributes()).toEqual({ "data-ok-step-label": "" });
    expect(stepLabelAttributes({ error: true })).toEqual({
      "data-ok-step-label": "",
      "data-ok-error": "",
    });
  });
  it("mobile stepper", () => {
    expect(mobileStepperAttributes()).toEqual({
      "data-ok-mobile-stepper": "",
      "data-ok-variant": "dots",
      "data-ok-position": "bottom",
    });
    expect(
      mobileStepperAttributes({ variant: "text", position: "static", steps: 3, activeStep: 1 }),
    ).toEqual({
      "data-ok-mobile-stepper": "",
      "data-ok-variant": "text",
      "data-ok-position": "static",
      "data-ok-steps": "3",
      "data-ok-active-step": "1",
    });
    expect(mobileStepperAttributes({ variant: HOSTILE, position: HOSTILE, steps: 0 })).toEqual({
      "data-ok-mobile-stepper": "",
      "data-ok-variant": "dots",
      "data-ok-position": "bottom",
    });
  });
  it("timeline, item and dot", () => {
    expect(timelineAttributes()).toEqual({ "data-ok-timeline": "", "data-ok-position": "right" });
    expect(timelineAttributes({ position: "alternate-reverse" })["data-ok-position"]).toBe(
      "alternate-reverse",
    );
    expect(timelineAttributes({ position: HOSTILE })["data-ok-position"]).toBe("right");
    expect(timelineItemAttributes()).toEqual({ "data-ok-timeline-item": "" });
    expect(timelineItemAttributes({ position: "left" })).toEqual({
      "data-ok-timeline-item": "",
      "data-ok-position": "left",
    });
    expect(timelineDotAttributes()).toEqual({
      "data-ok-timeline-dot": "",
      "data-ok-variant": "filled",
      "data-ok-color": "grey",
    });
    expect(timelineDotAttributes({ variant: "outlined", color: "error" })).toMatchObject({
      "data-ok-variant": "outlined",
      "data-ok-color": "error",
    });
    expect(timelineDotAttributes({ variant: HOSTILE, color: HOSTILE })).toMatchObject({
      "data-ok-variant": "filled",
      "data-ok-color": "grey",
    });
  });
  it("rating", () => {
    expect(ratingAttributes()).toEqual({
      "data-ok-rating": "",
      "data-ok-size": "medium",
      "data-ok-color": "warning",
    });
    expect(
      ratingAttributes({
        size: "xxSmall",
        color: "info",
        highlightSelectedOnly: true,
        readOnly: true,
        disabled: true,
      }),
    ).toEqual({
      "data-ok-rating": "",
      "data-ok-size": "xxSmall",
      "data-ok-color": "info",
      "data-ok-highlight-selected-only": "",
      "data-ok-read-only": "",
      "data-ok-disabled": "",
    });
    expect(ratingAttributes({ size: HOSTILE, color: HOSTILE })).toMatchObject({
      "data-ok-size": "medium",
      "data-ok-color": "warning",
    });
  });
  it("slider", () => {
    const defaults = {
      "data-ok-slider": "",
      "data-ok-color": "primary",
      "data-ok-size": "medium",
      "data-ok-orientation": "horizontal",
      "data-ok-track": "normal",
      "data-ok-value-label-display": "off",
    };
    expect(sliderAttributes()).toEqual(defaults);
    expect(
      sliderAttributes({
        color: "inherit",
        size: "small",
        orientation: "vertical",
        track: "inverted",
        valueLabelDisplay: "auto",
        disabled: true,
        disableSwap: true,
        min: -10,
        max: 10,
        step: 0,
      }),
    ).toEqual({
      "data-ok-slider": "",
      "data-ok-color": "inherit",
      "data-ok-size": "small",
      "data-ok-orientation": "vertical",
      "data-ok-track": "inverted",
      "data-ok-value-label-display": "auto",
      "data-ok-disabled": "",
      "data-ok-disable-swap": "",
      "data-ok-min": "-10",
      "data-ok-max": "10",
      "data-ok-step": "0",
    });
    expect(sliderAttributes({ color: HOSTILE, track: HOSTILE, step: -1, min: HOSTILE })).toEqual(
      defaults,
    );
  });
  it("transfer list", () => {
    expect(transferListAttributes()).toEqual({
      "data-ok-transfer-list": "",
      "data-ok-variant": "simple",
    });
    expect(transferListAttributes({ variant: "enhanced", disabled: true })).toEqual({
      "data-ok-transfer-list": "",
      "data-ok-variant": "enhanced",
      "data-ok-disabled": "",
    });
    expect(transferListAttributes({ variant: HOSTILE })["data-ok-variant"]).toBe("simple");
  });
  it("tree view", () => {
    expect(treeViewAttributes()).toEqual({
      "data-ok-tree-view": "",
      "data-ok-variant": "standard",
      "data-ok-expansion-trigger": "content",
    });
    expect(
      treeViewAttributes({
        variant: "lines",
        expansionTrigger: "iconContainer",
        multiSelect: true,
        checkboxSelection: true,
        disableSelection: true,
      }),
    ).toEqual({
      "data-ok-tree-view": "",
      "data-ok-variant": "lines",
      "data-ok-expansion-trigger": "iconContainer",
      "data-ok-multi-select": "",
      "data-ok-checkbox-selection": "",
      "data-ok-disable-selection": "",
    });
    expect(treeViewAttributes({ variant: HOSTILE, expansionTrigger: HOSTILE })).toMatchObject({
      "data-ok-variant": "standard",
      "data-ok-expansion-trigger": "content",
    });
  });
  it("autocomplete", () => {
    expect(autocompleteAttributes()).toEqual({ "data-ok-autocomplete": "" });
    expect(
      autocompleteAttributes({
        multiple: true,
        freeSolo: true,
        disableCloseOnSelect: true,
        disableClearable: true,
        openOnFocus: true,
        autoHighlight: true,
        limitTags: 2,
      }),
    ).toEqual({
      "data-ok-autocomplete": "",
      "data-ok-multiple": "",
      "data-ok-free-solo": "",
      "data-ok-disable-close-on-select": "",
      "data-ok-disable-clearable": "",
      "data-ok-open-on-focus": "",
      "data-ok-auto-highlight": "",
      "data-ok-limit-tags": "2",
    });
    expect(autocompleteAttributes({ limitTags: -1, multiple: HOSTILE })).toEqual({
      "data-ok-autocomplete": "",
    });
  });

  it("motion defaults, every variant, invalid values", () => {
    expect(motionAttributes()).toEqual({
      "data-ok-motion": "",
      "data-ok-variant": "fadeIn",
      "data-ok-trigger": "inView",
    });
    expect(motionEntranceVariants).toHaveLength(48);
    expect(motionVariants).toHaveLength(62);
    for (const variant of motionVariants)
      expect(motionAttributes({ variant })["data-ok-variant"]).toBe(variant);
    expect(
      motionAttributes({
        variant: "zoomInLeft",
        trigger: "manual",
        once: false,
        amount: 0.5,
        delay: 100,
        duration: 800,
        distance: 40,
        paused: true,
      }),
    ).toEqual({
      "data-ok-motion": "",
      "data-ok-variant": "zoomInLeft",
      "data-ok-trigger": "manual",
      "data-ok-once": "false",
      "data-ok-amount": "0.5",
      "data-ok-delay": "100",
      "data-ok-duration": "800",
      "data-ok-distance": "40",
      "data-ok-paused": "",
    });
    expect(
      motionAttributes({
        variant: HOSTILE as never,
        trigger: HOSTILE as never,
        amount: -1,
        duration: Number.NaN,
      }),
    ).toEqual({ "data-ok-motion": "", "data-ok-variant": "fadeIn", "data-ok-trigger": "inView" });
  });

  it("motion group and text", () => {
    expect(motionGroupAttributes()).toEqual({
      "data-ok-motion-group": "",
      "data-ok-trigger": "inView",
    });
    expect(motionGroupAttributes({ stagger: 80, once: false, trigger: "mount" })).toEqual({
      "data-ok-motion-group": "",
      "data-ok-trigger": "mount",
      "data-ok-stagger": "80",
      "data-ok-once": "false",
    });
    expect(motionTextAttributes({ variant: "fadeInUp", stagger: 40 })).toEqual({
      "data-ok-motion-text": "",
      "data-ok-variant": "fadeInUp",
      "data-ok-trigger": "inView",
      "data-ok-stagger": "40",
    });
  });

  it("dialog transition is written on the paper, not the root", () => {
    expect(dialogAttributes({ maxWidth: "sm" })).not.toHaveProperty("data-ok-variant");
  });

  it("count up and motion border", () => {
    expect(countUpAttributes({ end: 200 })).toEqual({
      "data-ok-count-up": "",
      "data-ok-end": "200",
      "data-ok-trigger": "inView",
    });
    expect(
      countUpAttributes({
        start: -5,
        end: 9.5,
        decimals: 1,
        duration: 500,
        once: false,
        trigger: "mount",
      }),
    ).toEqual({
      "data-ok-count-up": "",
      "data-ok-start": "-5",
      "data-ok-end": "9.5",
      "data-ok-decimals": "1",
      "data-ok-duration": "500",
      "data-ok-trigger": "mount",
      "data-ok-once": "false",
    });
    expect(countUpAttributes({ end: Number.NaN, decimals: -1 })).toEqual({
      "data-ok-count-up": "",
      "data-ok-trigger": "inView",
    });
    expect(motionBorderAttributes()).toEqual({
      "data-ok-motion-border": "",
      "data-ok-shape": "rounded",
      "data-ok-color": "multi",
    });
    expect(
      motionBorderAttributes({
        shape: "circle",
        color: "error",
        secondaryColor: "warning",
        width: 3,
        duration: 4000,
        paused: true,
      }),
    ).toEqual({
      "data-ok-motion-border": "",
      "data-ok-shape": "circle",
      "data-ok-color": "error",
      "data-ok-secondary-color": "warning",
      "data-ok-width": "3",
      "data-ok-duration": "4000",
      "data-ok-paused": "",
    });
    expect(motionBorderAttributes({ color: "inherit", secondaryColor: "inherit" })).toEqual({
      "data-ok-motion-border": "",
      "data-ok-shape": "rounded",
      "data-ok-color": "inherit",
      "data-ok-secondary-color": "inherit",
    });
    expect(
      motionBorderAttributes({
        shape: HOSTILE,
        color: HOSTILE,
        secondaryColor: HOSTILE,
        width: -1,
      }),
    ).toEqual({
      "data-ok-motion-border": "",
      "data-ok-shape": "rounded",
      "data-ok-color": "multi",
    });
  });

  it("data grid", () => {
    expect(dataGridAttributes()).toEqual({
      "data-ok-data-grid": "",
      "data-ok-density": "standard",
      "data-ok-edit-mode": "cell",
      "data-ok-sorting-mode": "client",
      "data-ok-filter-mode": "client",
      "data-ok-pagination-mode": "client",
      "data-ok-loading-variant": "linear-progress",
      "data-ok-toolbar-variant": "labeled",
      "data-ok-quick-filter-logic-operator": "and",
      "data-ok-aggregation-rows-scope": "filtered",
    });
    expect(
      dataGridAttributes({
        density: "compact",
        checkboxSelection: true,
        disableRowSelectionOnClick: true,
        disableColumnMenu: true,
        disableMultipleColumnsSorting: true,
        disableMultipleColumnsFiltering: true,
        disableColumnResize: true,
        disableColumnReorder: true,
        disableColumnPinning: true,
        editMode: "row",
      }),
    ).toEqual({
      "data-ok-data-grid": "",
      "data-ok-density": "compact",
      "data-ok-edit-mode": "row",
      "data-ok-sorting-mode": "client",
      "data-ok-filter-mode": "client",
      "data-ok-pagination-mode": "client",
      "data-ok-loading-variant": "linear-progress",
      "data-ok-toolbar-variant": "labeled",
      "data-ok-quick-filter-logic-operator": "and",
      "data-ok-disable-multiple-columns-filtering": "",
      "data-ok-disable-column-resize": "",
      "data-ok-disable-column-reorder": "",
      "data-ok-disable-column-pinning": "",
      "data-ok-checkbox-selection": "",
      "data-ok-disable-row-selection-on-click": "",
      "data-ok-disable-column-menu": "",
      "data-ok-disable-multiple-columns-sorting": "",
      "data-ok-aggregation-rows-scope": "filtered",
    });
    expect(dataGridAttributes({ density: HOSTILE })["data-ok-density"]).toBe("standard");
    // Phase 6: invalid scopes fall back; flags are written only when on.
    expect(
      dataGridAttributes({ aggregationRowsScope: HOSTILE as never, cellSelection: true }),
    ).toMatchObject({
      "data-ok-aggregation-rows-scope": "filtered",
      "data-ok-cell-selection": "",
    });
    expect(
      dataGridAttributes({
        disableMultipleRowSelection: true,
        keepNonExistentRowsSelected: true,
        checkboxSelectionVisibleOnly: true,
        autosizeOnMount: true,
        rowSpanning: true,
        rowHeight: 40,
        toolbarVariant: "icon",
        quickFilterLogicOperator: "or",
        quickFilterExcludeHiddenColumns: true,
        ignoreDiacritics: true,
      }),
    ).toMatchObject({
      "data-ok-disable-multiple-row-selection": "",
      "data-ok-keep-non-existent-rows-selected": "",
      "data-ok-checkbox-selection-visible-only": "",
      "data-ok-autosize-on-mount": "",
      "data-ok-row-spanning": "",
      "data-ok-row-height": "40",
      "data-ok-toolbar-variant": "icon",
      "data-ok-quick-filter-logic-operator": "or",
      "data-ok-quick-filter-exclude-hidden-columns": "",
      "data-ok-ignore-diacritics": "",
    });
  });
});

describe("editorAttributes", () => {
  it("writes the root and the flags that are on", () => {
    expect(editorAttributes()).toEqual({ "data-ok-editor": "" });
    expect(editorAttributes({ fullItem: true, error: true })).toEqual({
      "data-ok-editor": "",
      "data-ok-full-item": "",
      "data-ok-error": "",
    });
    expect(editorAttributes({ fullItem: false })).toEqual({ "data-ok-editor": "" });
  });
});

describe("codeEditorAttributes / diffEditorAttributes", () => {
  it("write known languages and themes, valid sizes and lines, and flags that are on", () => {
    expect(codeEditorAttributes()).toEqual({ "data-ok-code-editor": "" });
    expect(
      codeEditorAttributes({
        language: "typescript",
        theme: "vs-dark",
        width: 600,
        height: "90vh",
        line: 12,
        keepCurrentModel: true,
      }),
    ).toEqual({
      "data-ok-code-editor": "",
      "data-ok-language": "typescript",
      "data-ok-monaco-theme": "vs-dark",
      "data-ok-width": "600",
      "data-ok-height": "90vh",
      "data-ok-line": "12",
      "data-ok-keep-current-model": "",
    });
    // Custom names (registered in beforeMount) and invalid numbers stay off the markup.
    expect(
      codeEditorAttributes({ language: "my-lang", theme: "night", line: 0, height: "calc(1px)" }),
    ).toEqual({ "data-ok-code-editor": "" });
    expect(diffEditorAttributes()).toEqual({ "data-ok-diff-editor": "" });
    expect(
      diffEditorAttributes({
        language: "markdown",
        originalLanguage: "json",
        modifiedLanguage: "yaml",
        theme: "auto",
        height: 400,
        keepCurrentOriginalModel: true,
        keepCurrentModifiedModel: true,
      }),
    ).toEqual({
      "data-ok-diff-editor": "",
      "data-ok-language": "markdown",
      "data-ok-original-language": "json",
      "data-ok-modified-language": "yaml",
      "data-ok-monaco-theme": "auto",
      "data-ok-height": "400",
      "data-ok-keep-current-original-model": "",
      "data-ok-keep-current-modified-model": "",
    });
  });
});
