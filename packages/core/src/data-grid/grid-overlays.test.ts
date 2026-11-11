import { describe, expect, it } from "vitest";
import { gridOverlayOf } from "./grid-overlays.js";

describe("gridOverlayOf", () => {
  it("names each overlay's event family", () => {
    expect(gridOverlayOf("column-menu")).toEqual({ kind: "menu", value: "column" });
    expect(gridOverlayOf("context-menu")).toEqual({ kind: "menu", value: "context" });
    expect(gridOverlayOf("density")).toEqual({ kind: "menu", value: "density" });
    expect(gridOverlayOf("export")).toEqual({ kind: "menu", value: "export" });
    expect(gridOverlayOf("columns")).toEqual({ kind: "preference", value: "columns" });
    expect(gridOverlayOf("filters")).toEqual({ kind: "preference", value: "filters" });
    expect(gridOverlayOf("pivot")).toEqual({ kind: "sidebar", value: "pivot" });
    expect(gridOverlayOf("charts")).toEqual({ kind: "sidebar", value: "charts" });
  });

  it("ignores other popovers, whatever their name", () => {
    expect(gridOverlayOf("context-menu-export")).toBeNull();
    expect(gridOverlayOf("name-set-filter")).toBeNull();
    expect(gridOverlayOf("constructor")).toBeNull();
  });
});
