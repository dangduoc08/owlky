/*
 * Which public event an overlay of the data grid reports when it opens or closes (MUI X
 * `onMenuOpen`, `onPreferencePanelOpen`, `onSidebarOpen`), shared by React and the HTML runtime.
 * Names are the overlays' id suffixes (`<id>-columns`, `<id>-column-menu`…).
 */

/** A grid menu. */
export type GridMenuName = "column" | "density" | "export" | "context";
/** A preferences panel (MUI X `GridPreferencePanelsValue`). */
export type GridPreferencePanelName = "columns" | "filters";
/** A side panel (MUI X `GridSidebarValue`); in Owlky these are the toolbar's panels. */
export type GridSidebarName = "pivot" | "charts";

export type GridOverlay =
  | { kind: "menu"; value: GridMenuName }
  | { kind: "preference"; value: GridPreferencePanelName }
  | { kind: "sidebar"; value: GridSidebarName };

const OVERLAYS = new Map<string, GridOverlay>([
  ["column-menu", { kind: "menu", value: "column" }],
  ["context-menu", { kind: "menu", value: "context" }],
  ["density", { kind: "menu", value: "density" }],
  ["export", { kind: "menu", value: "export" }],
  ["columns", { kind: "preference", value: "columns" }],
  ["filters", { kind: "preference", value: "filters" }],
  ["pivot", { kind: "sidebar", value: "pivot" }],
  ["charts", { kind: "sidebar", value: "charts" }],
]);

/** The event family of an overlay's id suffix; `null` for anything else (submenus, set filters). */
export const gridOverlayOf = (name: string): GridOverlay | null => OVERLAYS.get(name) ?? null;
