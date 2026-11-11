import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGridPivotDrag,
  gridPivotDerivedColumns,
  gridPivotSections,
  moveGridPivotField,
} from "./grid-pivot-panel.js";
import type { GridPivotModel } from "./grid-premium.js";

describe("derived pivot columns", () => {
  it("gives date columns a year and a quarter (local days)", () => {
    const [year, quarter] =
      gridPivotDerivedColumns({ field: "date", headerName: "Date", type: "date" }) ?? [];
    expect(year).toMatchObject({ field: "date-year", headerName: "Date (Year)" });
    expect(quarter).toMatchObject({ field: "date-quarter", headerName: "Date (Quarter)" });
    expect(year?.derive("2024-01-01")).toBe(2024);
    expect(quarter?.derive("2024-01-01")).toBe("Q1");
    expect(quarter?.derive("2024-12-31")).toBe("Q4");
    expect(quarter?.derive(new Date(2025, 4, 3))).toBe("Q2");
    expect(year?.derive("2025-07-04T10:00:00")).toBe(2025);
    expect(year?.derive("")).toBeNull();
    expect(quarter?.derive("not a date")).toBeNull();
    expect(
      gridPivotDerivedColumns(
        { field: "d", type: "date" },
        { year: "(Năm)", quarter: "(Quý)" },
      )?.map((c) => c.headerName),
    ).toEqual(["d (Năm)", "d (Quý)"]);
    expect(gridPivotDerivedColumns({ field: "n", type: "number" })).toBeUndefined();
    expect(gridPivotDerivedColumns({ field: "t", type: "dateTime" })).toBeUndefined();
  });
});

const MODEL: GridPivotModel = {
  rows: [{ field: "region" }, { field: "product" }],
  columns: [{ field: "year", sort: "desc" }],
  values: [{ field: "units", aggFunc: "avg" }],
};

describe("pivot sections", () => {
  it("lists each section in the model's order, unused fields in column order", () => {
    expect(
      gridPivotSections(MODEL, ["units", "product", "year", "region", "price", "gone"].slice(0, 5)),
    ).toEqual({
      none: ["price"],
      rows: ["region", "product"],
      columns: ["year"],
      values: ["units"],
    });
    expect(gridPivotSections(MODEL, ["region"]).rows).toEqual(["region"]);
  });

  it("moves fields between and within sections, keeping their options", () => {
    expect(moveGridPivotField(MODEL, "product", "rows", 0).rows).toEqual([
      { field: "product" },
      { field: "region" },
    ]);
    // Indexes are clamped; columns keep their sort, values their function.
    expect(moveGridPivotField(MODEL, "year", "columns", 9).columns).toEqual([
      { field: "year", sort: "desc" },
    ]);
    expect(moveGridPivotField(MODEL, "units", "values", -3).values).toEqual([
      { field: "units", aggFunc: "avg" },
    ]);
    // A field from no section yet comes in bare.
    expect(moveGridPivotField(MODEL, "price", "rows", 9).rows.at(-1)).toEqual({ field: "price" });
    const moved = moveGridPivotField(MODEL, "region", "values", 0, "size");
    expect(moved.rows).toEqual([{ field: "product" }]);
    expect(moved.values).toEqual([
      { field: "region", aggFunc: "size" },
      { field: "units", aggFunc: "avg" },
    ]);
    expect(moveGridPivotField(MODEL, "price", "columns", 1).columns).toEqual([
      { field: "year", sort: "desc" },
      { field: "price" },
    ]);
    expect(moveGridPivotField(MODEL, "units", "none", 0).values).toEqual([]);
    expect(moveGridPivotField(MODEL, "units", "values", Number.NaN).values).toHaveLength(1);
  });
});

describe("pivot drag", () => {
  let panel: HTMLElement;
  afterEach(() => panel?.remove());
  const make = () => {
    panel = document.createElement("div");
    const section = (name: string, fields: string[]) => {
      const el = document.createElement("div");
      el.setAttribute("data-ok-data-grid-pivot-section", name);
      el.style.cssText = "display:flex;flex-direction:column;padding:8px";
      for (const field of fields) {
        const row = document.createElement("div");
        row.setAttribute("data-ok-data-grid-pivot-field", "");
        row.setAttribute("data-ok-field", field);
        row.style.height = "30px";
        const handle = document.createElement("span");
        handle.setAttribute("data-ok-data-grid-pivot-handle", "");
        handle.textContent = "::";
        row.append(handle);
        el.append(row);
      }
      panel.append(el);
      return el;
    };
    const none = section("none", ["price"]);
    const rows = section("rows", ["region", "product"]);
    const values = section("values", []);
    values.style.height = "40px";
    document.body.append(panel);
    return { none, rows, values };
  };
  const field = (name: string) =>
    panel.querySelector<HTMLElement>(`[data-ok-field="${name}"]`) as HTMLElement;
  const handle = (name: string) =>
    field(name).querySelector("[data-ok-data-grid-pivot-handle]") as HTMLElement;
  const at = (el: Element, dy = 0) => {
    const box = el.getBoundingClientRect();
    return { clientX: box.left + 4, clientY: box.top + box.height / 2 + dy };
  };
  const pointer = (type: string, target: EventTarget, xy: object, button = 0) =>
    target.dispatchEvent(
      new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button, ...xy }),
    );

  it("drops a field into a section at a place, marking the target meanwhile", () => {
    const { rows, values } = make();
    const onMove = vi.fn();
    const drag = createGridPivotDrag(panel, { onMove });
    pointer("pointerdown", handle("product"), at(handle("product")));
    // A press without a move is no drag.
    pointer("pointermove", document, at(handle("product"), 1));
    expect(field("product").hasAttribute("data-ok-dragging")).toBe(false);
    pointer("pointermove", document, at(field("region"), -10));
    expect(field("product").hasAttribute("data-ok-dragging")).toBe(true);
    expect(rows.hasAttribute("data-ok-drop-target")).toBe(true);
    expect(field("region").getAttribute("data-ok-drop")).toBe("before");
    pointer("pointerup", document, at(field("region"), -10));
    expect(onMove).toHaveBeenLastCalledWith("product", "rows", 0);
    expect(
      panel.querySelector("[data-ok-drop], [data-ok-drop-target], [data-ok-dragging]"),
    ).toBeNull();
    // Into an empty section, then after the last field of another.
    pointer("pointerdown", handle("price"), at(handle("price")));
    pointer("pointermove", document, at(values));
    expect(values.hasAttribute("data-ok-drop-target")).toBe(true);
    pointer("pointerup", document, at(values));
    expect(onMove).toHaveBeenLastCalledWith("price", "values", 0);
    pointer("pointerdown", handle("price"), at(handle("price")));
    pointer("pointermove", document, at(field("product"), 10));
    expect(field("product").getAttribute("data-ok-drop")).toBe("after");
    pointer("pointerup", document, at(field("product"), 10));
    expect(onMove).toHaveBeenLastCalledWith("price", "rows", 2);
    drag.destroy();
  });

  it("cancels with Escape, outside the panel, on cancel and for other buttons", () => {
    make();
    const onMove = vi.fn();
    const drag = createGridPivotDrag(panel, { onMove });
    pointer("pointerdown", handle("product"), at(handle("product")));
    pointer("pointermove", document, at(field("price")));
    const esc = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(true);
    pointer("pointerup", document, at(field("price")));
    // Outside every section: no target.
    pointer("pointerdown", handle("product"), at(handle("product")));
    pointer("pointermove", document, { clientX: 2000, clientY: 2000 });
    pointer("pointerup", document, { clientX: 2000, clientY: 2000 });
    pointer("pointerdown", handle("product"), at(handle("product")));
    pointer("pointermove", document, at(field("price")));
    pointer("pointercancel", document, {});
    // Other buttons and presses outside a handle start nothing.
    pointer("pointerdown", handle("product"), at(handle("product")), 2);
    pointer("pointerdown", field("product"), at(field("product")));
    pointer("pointermove", document, at(field("price")));
    pointer("pointerup", document, at(field("price")));
    expect(onMove).not.toHaveBeenCalled();
    // Another pointer's moves, and Escape before the drag starts, do nothing.
    pointer("pointerdown", handle("product"), at(handle("product")));
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerId: 7, ...at(field("price")) }),
    );
    expect(field("product").hasAttribute("data-ok-dragging")).toBe(false);
    const early = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.dispatchEvent(early);
    expect(early.defaultPrevented).toBe(false);
    pointer("pointerup", document, at(handle("product")));
    expect(onMove).not.toHaveBeenCalled();
    // Destroying mid-drag ends it.
    pointer("pointerdown", handle("product"), at(handle("product")));
    pointer("pointermove", document, at(field("price")));
    drag.destroy();
    expect(field("product").hasAttribute("data-ok-dragging")).toBe(false);
    pointer("pointerup", document, at(field("price")));
    expect(onMove).not.toHaveBeenCalled();
  });
});
