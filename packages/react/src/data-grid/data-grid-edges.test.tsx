import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataGrid, type GridApi, type GridColDef } from "./data-grid.js";

// Edge paths of the React data grid: revalidation, row edits from the API, pivot Move up,
// header filter changes, fill and history edges.

interface Row {
  id: number;
  name: string;
  age: number;
}
const ROWS: Row[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  age: 20 + i,
}));
const COLUMNS: GridColDef<Row>[] = [
  { field: "name", headerName: "Name", width: 140, editable: true },
  { field: "age", headerName: "Age", type: "number", width: 90, editable: true },
];

afterEach(() => vi.restoreAllMocks());

const grid = () => document.querySelector("[data-ok-data-grid-main]") as HTMLElement;
const cell = (id: number, field: string) =>
  grid().querySelector(`[data-ok-row-id="${id}"] [data-ok-field="${field}"]`) as HTMLElement;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("data source revalidation", () => {
  it("skips rows still cached; without a cache a failed reload reaches onDataSourceError", async () => {
    const cached = vi.fn(async () => ({ rows: ROWS, rowCount: 5 }));
    const { rerender } = render(
      <DataGrid
        aria-label="People"
        columns={COLUMNS}
        rows={[]}
        dataSource={{ getRows: cached }}
        dataSourceRevalidateMs={10}
        hideFooter
      />,
    );
    await act(tick);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(cached).toHaveBeenCalledTimes(1);
    let calls = 0;
    let failed: (error: unknown) => void = () => {};
    const reported = new Promise((resolve) => {
      failed = resolve;
    });
    const failing = {
      getRows: async () => {
        calls += 1;
        if (calls > 1) throw new Error("offline");
        return { rows: ROWS.slice(0, 2), rowCount: 2 };
      },
    };
    rerender(
      <DataGrid
        aria-label="People"
        columns={COLUMNS}
        rows={[]}
        dataSource={failing}
        dataSourceCache={null}
        dataSourceRevalidateMs={10}
        onDataSourceError={(error) => failed(error)}
        hideFooter
      />,
    );
    await act(async () => {
      expect(await reported).toEqual(new Error("offline"));
    });
    expect(cell(1, "name").textContent).toBe("Person 1");
  });
});

describe("row edits from the API", () => {
  it("startRowEditMode without fieldToFocus starts in the first editable column", () => {
    const apiRef = { current: null as GridApi<Row> | null };
    render(
      <DataGrid
        aria-label="People"
        apiRef={apiRef}
        rows={ROWS}
        columns={[{ field: "id", headerName: "ID", width: 60 }, ...COLUMNS]}
        editMode="row"
        disableVirtualization
        hideFooter
      />,
    );
    act(() => apiRef.current?.startRowEditMode({ id: "2" }));
    const row = grid().querySelector('[data-ok-row-id="2"]') as HTMLElement;
    expect(row.hasAttribute("data-ok-editing")).toBe(true);
    expect(cell(2, "name").contains(document.activeElement)).toBe(true);
    expect(apiRef.current?.getRowModesModel()).toEqual({
      "2": { mode: "edit", fieldToFocus: "name" },
    });
    // An unknown row starts nothing.
    act(() => apiRef.current?.stopRowEditMode({ id: "2", ignoreModifications: true }));
    act(() => apiRef.current?.startRowEditMode({ id: "99" }));
    expect(grid().querySelector('[role="row"][data-ok-editing]')).toBeNull();
  });

  it("a controlled row mode without fieldToFocus opens the first editable cell", () => {
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={[{ field: "id", headerName: "ID", width: 60 }, ...COLUMNS]}
        editMode="row"
        rowModesModel={{ "3": { mode: "edit" } }}
        disableVirtualization
        hideFooter
      />,
    );
    expect(cell(3, "name").hasAttribute("data-ok-editing")).toBe(true);
    expect(cell(3, "id").hasAttribute("data-ok-editing")).toBe(false);
  });
});

describe("pivot panel Move up", () => {
  type Sale = { id: string; region: string; product: string; units: number; revenue: number };
  const SALES: Sale[] = [
    { id: "1", region: "North", product: "Tea", units: 10, revenue: 50 },
    { id: "2", region: "South", product: "Coffee", units: 5, revenue: 40 },
  ];
  const SALE_COLUMNS: GridColDef<Sale>[] = [
    { field: "region", headerName: "Region", width: 120 },
    { field: "product", headerName: "Product", width: 120 },
    { field: "units", headerName: "Units", type: "number", width: 90 },
    { field: "revenue", headerName: "Revenue", type: "number", width: 90 },
  ];

  it("moves a field up; at the top the other button takes the focus", async () => {
    const onModel = vi.fn();
    render(
      <DataGrid
        id="up"
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={SALE_COLUMNS}
        showToolbar
        initialState={{
          pivoting: {
            model: {
              rows: [{ field: "region" }, { field: "product" }],
              columns: [],
              values: [{ field: "units", aggFunc: "sum" }],
            },
            active: true,
          },
        }}
        onPivotModelChange={onModel}
        hideFooter
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Pivot" }));
    const panel = document.getElementById("up-pivot") as HTMLElement;
    const button = (field: string, direction: string) =>
      panel.querySelector(
        `[data-ok-field="${field}"] [data-ok-data-grid-pivot-move="${direction}"]`,
      ) as HTMLButtonElement;
    button("product", "up").focus();
    fireEvent.click(button("product", "up"));
    expect(onModel.mock.lastCall?.[0].rows).toEqual([{ field: "product" }, { field: "region" }]);
    expect(button("product", "up").disabled).toBe(true);
    expect(document.activeElement).toBe(button("product", "down"));
  });
});

describe("pivot state and a controlled pivot panel", () => {
  it("restoreState turns the pivot on with its model", () => {
    const apiRef = { current: null as GridApi<Row> | null };
    render(
      <DataGrid
        aria-label="People"
        apiRef={apiRef}
        rows={ROWS}
        columns={COLUMNS}
        disableVirtualization
        hideFooter
      />,
    );
    expect(grid().querySelector('[role="columnheader"][data-ok-field^="pivot:"]')).toBeNull();
    act(() =>
      apiRef.current?.restoreState({
        pivoting: {
          model: {
            rows: [{ field: "name" }],
            columns: [],
            values: [{ field: "age", aggFunc: "sum" }],
          },
          active: true,
        },
      }),
    );
    expect(grid().querySelector('[role="columnheader"][data-ok-field^="pivot:"]')).not.toBeNull();
  });

  it("opening another panel or closing it only reports while pivotPanelOpen is given", async () => {
    const onPivotPanelOpenChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        showToolbar
        rows={ROWS}
        columns={COLUMNS}
        pivotModel={{ rows: [], columns: [], values: [] }}
        pivotPanelOpen
        onPivotPanelOpenChange={onPivotPanelOpenChange}
        hideFooter
      />,
    );
    await act(tick);
    const pivot = document.querySelector('[id$="-pivot"][popover]') as HTMLElement;
    expect(pivot.hasAttribute("data-ok-open")).toBe(true);
    // Escape in the open pivot panel asks the owner to close it; the panel stays.
    const inside = pivot.querySelector<HTMLElement>("button, input, select") ?? pivot;
    fireEvent.keyDown(inside, { key: "Escape" });
    await act(tick);
    expect(onPivotPanelOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(pivot.hasAttribute("data-ok-open")).toBe(true);
    // Another panel: the pivot panel's owner hears it should close.
    onPivotPanelOpenChange.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Columns" }));
    expect(onPivotPanelOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });
});

describe("API edit starts and stops that don't apply", () => {
  it("a read-only cell doesn't start; a row that isn't being edited doesn't stop", () => {
    const apiRef = { current: null as GridApi<Row> | null };
    const onCellModesModelChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        apiRef={apiRef}
        rows={ROWS}
        columns={[{ field: "id", headerName: "ID", width: 60 }, ...COLUMNS]}
        onCellModesModelChange={onCellModesModelChange}
        disableVirtualization
        hideFooter
      />,
    );
    act(() => apiRef.current?.startCellEditMode({ id: "1", field: "id" }));
    expect(onCellModesModelChange).not.toHaveBeenCalled();
    act(() => apiRef.current?.startCellEditMode({ id: "1", field: "name" }));
    expect(cell(1, "name").hasAttribute("data-ok-editing")).toBe(true);
    act(() => apiRef.current?.stopCellEditMode({ id: "2", field: "name" }));
    expect(cell(1, "name").hasAttribute("data-ok-editing")).toBe(true);
  });
});

describe("header filters", () => {
  it("a custom header filter replaces its item when it changes again", () => {
    const onFilterModelChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        headerFilters
        onFilterModelChange={onFilterModelChange}
        disableVirtualization
        hideFooter
        columns={[
          { field: "name", headerName: "Name" },
          {
            field: "age",
            headerName: "Age",
            type: "number",
            renderHeaderFilter: ({ item, applyFilterChanges }) => (
              <input
                type="number"
                aria-label="At least"
                value={String(item.value ?? "")}
                onChange={(event) =>
                  applyFilterChanges({ ...item, operator: ">=", value: event.target.value })
                }
              />
            ),
          },
        ]}
      />,
    );
    const field = screen.getByRole("spinbutton", { name: "At least" });
    fireEvent.change(field, { target: { value: "22" } });
    fireEvent.change(field, { target: { value: "24" } });
    expect(onFilterModelChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ items: [{ field: "age", operator: ">=", value: "24" }] }),
    );
    expect(
      grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])'),
    ).toHaveLength(1);
  });
});

describe("fill and history edges", () => {
  const press = (el: Element, init: PointerEventInit = {}) =>
    act(() => {
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, ...init }));
      document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    });
  const centre = (el: Element) => {
    const box = el.getBoundingClientRect();
    return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
  };
  const drag = async (to: HTMLElement) => {
    const fillHandle = document.querySelector("[data-ok-data-grid-fill-handle]") as HTMLElement;
    await act(async () => {
      fillHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
      document.dispatchEvent(new PointerEvent("pointermove", centre(to)));
      await tick();
    });
    await act(async () => {
      document.dispatchEvent(new PointerEvent("pointerup", centre(to)));
      await tick();
    });
  };

  it("a fill into read-only cells changes nothing; valueSetter writes filled values", async () => {
    const processRowUpdate = vi.fn((row: Row & { tag?: string }) => row);
    const apiRef = { current: null as GridApi<Row> | null };
    render(
      <DataGrid
        aria-label="People"
        apiRef={apiRef}
        rows={ROWS}
        columns={[
          {
            field: "name",
            headerName: "Name",
            width: 140,
            editable: true,
            valueSetter: (value, row) => ({ ...row, name: `${String(value)}!` }),
          },
          { field: "age", headerName: "Age", type: "number", width: 90 },
        ]}
        cellSelection
        cellSelectionFillHandle
        processRowUpdate={processRowUpdate}
        disableVirtualization
        hideFooter
      />,
    );
    expect(apiRef.current?.history.canUndo()).toBe(false);
    expect(apiRef.current?.history.canRedo()).toBe(false);
    // Age isn't editable: dragging its handle down writes nothing.
    press(cell(1, "age"));
    await drag(cell(3, "age"));
    expect(processRowUpdate).not.toHaveBeenCalled();
    // Name goes through its valueSetter.
    press(cell(1, "name"));
    await drag(cell(2, "name"));
    expect(processRowUpdate.mock.calls.map((call) => call[0].name)).toEqual(["Person 1!"]);
    expect(cell(2, "name").textContent).toBe("Person 1!");
  });
});
