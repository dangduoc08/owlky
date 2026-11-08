import { type GridDataSource, type GridGetRowsParams, viVN } from "@owlky/core";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef, useEffect } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { DataGrid, type GridApi, type GridColDef, useGridApiRef } from "./data-grid.js";

interface Row {
  id: number;
  name: string;
  age: number | null;
}
const ROWS: Row[] = [
  { id: 1, name: "Ana", age: 30 },
  { id: 2, name: "Bao", age: 9 },
  { id: 3, name: "Chloe", age: null },
  { id: 4, name: "Diego", age: 41 },
];
const COLUMNS: GridColDef<Row>[] = [
  { field: "name", headerName: "Name", flex: 1, minWidth: 120 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
  {
    field: "label",
    headerName: "Label",
    valueGetter: (row) => `${row.name}!`,
    valueFormatter: (value) => `«${value}»`,
  },
  {
    field: "actions",
    headerName: "Actions",
    type: "actions",
    hideable: false,
    renderCell: ({ row }) => (
      <button type="button" tabIndex={-1}>
        Edit {row.name}
      </button>
    ),
  },
];

afterEach(() => vi.restoreAllMocks());

/** A grid that hands out its API (`useGridApiRef`). */
let latestApi: GridApi<Row> | null = null;
function ApiGrid() {
  const apiRef = useGridApiRef<Row>();
  useEffect(() => {
    latestApi = apiRef.current;
  });
  return (
    <DataGrid
      aria-labelledby="t"
      rows={ROWS}
      columns={COLUMNS}
      apiRef={apiRef}
      exportFileName="people"
    />
  );
}

const grid = () => screen.getByRole("grid");
const header = (name: RegExp | string) => screen.getByRole("columnheader", { name });
const names = () =>
  [...grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])')].map(
    (row) => row.querySelector('[data-ok-field="name"]')?.textContent,
  );

describe("DataGrid", () => {
  it("renders an ARIA grid with counts, indexes, widths and cells", () => {
    const ref = createRef<HTMLDivElement>();
    render(<DataGrid ref={ref} id="g" aria-label="People" rows={ROWS} columns={COLUMNS} />);
    const root = ref.current as HTMLDivElement;
    expect(root.getAttribute("data-ok-data-grid")).toBe("");
    expect(root.getAttribute("data-ok-density")).toBe("standard");
    expect(root.hasAttribute("aria-label")).toBe(false);
    expect(grid().getAttribute("aria-label")).toBe("People");
    expect(grid().getAttribute("aria-rowcount")).toBe("5");
    expect(grid().getAttribute("aria-colcount")).toBe("4");
    expect(grid().style.getPropertyValue("--_ok-data-grid-columns")).toBe(
      "minmax(120px, 1fr) 90px 100px 100px",
    );
    expect(header(/Age/).getAttribute("aria-sort")).toBe("none");
    expect(header(/Actions/).hasAttribute("aria-sort")).toBe(false);
    expect(header(/Age/).getAttribute("data-ok-width")).toBe("90");
    expect(header(/Name/).getAttribute("data-ok-flex")).toBe("1");
    expect(header(/Actions/).getAttribute("data-ok-hideable")).toBe("false");
    const cells = within(screen.getAllByRole("row")[1] as HTMLElement).getAllByRole("gridcell");
    expect(cells.map((c) => c.getAttribute("aria-colindex"))).toEqual(["1", "2", "3", "4"]);
    expect(cells[1]?.getAttribute("data-ok-value")).toBe("30");
    expect(cells[1]?.getAttribute("data-ok-align")).toBe("right");
    expect(cells[2]?.textContent).toBe("«Ana!»");
    expect(cells[2]?.getAttribute("data-ok-value")).toBe("Ana!");
    expect(cells[3]?.getAttribute("data-ok-text")).toBe("");
    expect(cells[0]?.hasAttribute("data-ok-value")).toBe(false);
    expect(getComputedStyle(cells[0] as Element).height).toBe("52px");
  });

  it("sorts by header click (asc, desc, none); Shift adds a column; keyboard Enter", async () => {
    const onSortModelChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        onSortModelChange={onSortModelChange}
      />,
    );
    await userEvent.click(header(/Age/));
    expect(names()).toEqual(["Bao", "Ana", "Diego", "Chloe"]);
    expect(header(/Age/).getAttribute("aria-sort")).toBe("ascending");
    await userEvent.click(header(/Age/));
    expect(names()).toEqual(["Diego", "Ana", "Bao", "Chloe"]);
    await userEvent.click(header(/Age/));
    expect(names()).toEqual(["Ana", "Bao", "Chloe", "Diego"]);
    fireEvent.click(header(/Name/));
    fireEvent.click(header(/Age/), { shiftKey: true });
    expect(onSortModelChange).toHaveBeenLastCalledWith([
      { field: "name", sort: "asc" },
      { field: "age", sort: "asc" },
    ]);
    act(() => header(/Name/).focus());
    await userEvent.keyboard("{Enter}");
    expect(header(/Name/).getAttribute("aria-sort")).toBe("descending");
    fireEvent.click(header(/Actions/));
    expect(onSortModelChange).toHaveBeenCalledTimes(6);
  });

  it("toolbar: quick filter, filter panel, columns panel, density, export", async () => {
    const onFilterModelChange = vi.fn();
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(
      <DataGrid
        id="g"
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        showToolbar
        onFilterModelChange={onFilterModelChange}
        exportFileName="people"
      />,
    );
    await userEvent.type(screen.getByRole("textbox", { name: "Search" }), "a o");
    // Each word must match some column: only Bao has both "a" and "o".
    expect(names()).toEqual(["Bao"]);
    expect(onFilterModelChange).toHaveBeenLastCalledWith({
      items: [],
      quickFilterValues: ["a", "o"],
    });
    await userEvent.clear(screen.getByRole("textbox", { name: "Search" }));
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    const panel = screen.getByRole("group", { name: "Filters" });
    await userEvent.selectOptions(within(panel).getByLabelText("Columns"), "age");
    await userEvent.selectOptions(within(panel).getByLabelText("Operator"), ">");
    await userEvent.type(within(panel).getByLabelText("Value"), "20");
    expect(names()).toEqual(["Ana", "Diego"]);
    await userEvent.selectOptions(within(panel).getByLabelText("Operator"), "isEmpty");
    expect((within(panel).getByLabelText("Value") as HTMLInputElement).disabled).toBe(true);
    expect(names()).toEqual(["Chloe"]);
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Columns" }));
    const columns = screen.getByRole("group", { name: "Columns" });
    expect(within(columns).getAllByRole("switch")).toHaveLength(3);
    await userEvent.click(within(columns).getByRole("switch", { name: "Label" }));
    expect(screen.queryByRole("columnheader", { name: /Label/ })).toBeNull();
    expect(grid().getAttribute("aria-colcount")).toBe("3");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Density" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Compact" }));
    expect(grid().parentElement?.getAttribute("data-ok-density")).toBe("compact");
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Download as CSV" }));
    expect(create).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    const blob = create.mock.calls[0]?.[0] as Blob;
    // The UTF-8 BOM (decoding drops it) lets spreadsheets read accents.
    expect([...new Uint8Array(await blob.arrayBuffer()).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(await blob.text()).toBe("Name,Age\r\nChloe,");
  });

  it("selection: checkboxes, row click, select all (indeterminate), Space and Ctrl+A", async () => {
    const onRowSelectionModelChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        onRowSelectionModelChange={onRowSelectionModelChange}
      />,
    );
    expect(grid().getAttribute("aria-multiselectable")).toBe("true");
    const rows = screen.getAllByRole("row").slice(1);
    await userEvent.click(within(rows[0] as HTMLElement).getByRole("checkbox"));
    expect(rows[0]?.getAttribute("aria-selected")).toBe("true");
    const all = screen.getByRole("checkbox", { name: "Select all rows" }) as HTMLInputElement;
    expect(all.indeterminate).toBe(true);
    await userEvent.click(
      within(rows[1] as HTMLElement).getAllByRole("gridcell")[1] as HTMLElement,
    );
    expect(onRowSelectionModelChange).toHaveBeenLastCalledWith(["1", "2"]);
    await userEvent.click(within(rows[1] as HTMLElement).getByRole("button"));
    expect(onRowSelectionModelChange).toHaveBeenCalledTimes(2);
    await userEvent.click(all);
    expect(onRowSelectionModelChange).toHaveBeenLastCalledWith(["1", "2", "3", "4"]);
    await userEvent.click(all);
    expect(onRowSelectionModelChange).toHaveBeenLastCalledWith([]);
    const cell = within(rows[2] as HTMLElement).getAllByRole("gridcell")[1] as HTMLElement;
    act(() => cell.focus());
    await userEvent.keyboard(" ");
    expect(rows[2]?.getAttribute("aria-selected")).toBe("true");
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(onRowSelectionModelChange).toHaveBeenLastCalledWith(["3", "1", "2", "4"]);
  });

  it("disableRowSelectionOnClick, no checkbox selection: clicks don't select", async () => {
    const onRowSelectionModelChange = vi.fn();
    const { rerender } = render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={onRowSelectionModelChange}
      />,
    );
    await userEvent.click(screen.getAllByRole("gridcell")[1] as HTMLElement);
    expect(onRowSelectionModelChange).not.toHaveBeenCalled();
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        onRowSelectionModelChange={onRowSelectionModelChange}
      />,
    );
    const cell = screen.getAllByRole("gridcell")[0] as HTMLElement;
    await userEvent.click(cell);
    act(() => cell.focus());
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(onRowSelectionModelChange).not.toHaveBeenCalled();
    expect(screen.getAllByRole("row")[1]?.hasAttribute("aria-selected")).toBe(false);
  });

  it("pagination: pages of rows (others hidden), rows per page, page reset by filters", async () => {
    const onPaginationModelChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        pageSizeOptions={[2, 4]}
        showToolbar
        onPaginationModelChange={onPaginationModelChange}
      />,
    );
    expect(names()).toEqual(["Ana", "Bao"]);
    expect(screen.getByText("1–2 of 4")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(names()).toEqual(["Chloe", "Diego"]);
    expect(onPaginationModelChange).toHaveBeenLastCalledWith({ page: 1, pageSize: 2 });
    await userEvent.type(screen.getByRole("textbox", { name: "Search" }), "a");
    expect(onPaginationModelChange).toHaveBeenLastCalledWith({ page: 0, pageSize: 2 });
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /Rows per page/ }), "4");
    expect(onPaginationModelChange).toHaveBeenLastCalledWith({ page: 0, pageSize: 4 });
  });

  it("column menu: sort, unsort, hide, filter and manage columns", async () => {
    render(<DataGrid id="g" aria-label="People" rows={ROWS} columns={COLUMNS} showToolbar />);
    // The menu button shows on hover (or focus) of its header.
    await userEvent.hover(header(/Age/));
    const menuButton = screen.getByRole("button", { name: "Age column menu" });
    const openMenu = async () => {
      await userEvent.hover(header(/Age/));
      await userEvent.click(menuButton);
    };
    await openMenu();
    expect(menuButton.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("menuitem", { name: "Unsort" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Sort by DESC" }));
    expect(names()).toEqual(["Diego", "Ana", "Bao", "Chloe"]);
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: "Sort by ASC" }));
    expect(header(/Age/).getAttribute("aria-sort")).toBe("ascending");
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: "Unsort" }));
    expect(header(/Age/).getAttribute("aria-sort")).toBe("none");
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: "Filter" }));
    expect(
      (
        within(screen.getByRole("group", { name: "Filters" })).getByLabelText(
          "Columns",
        ) as HTMLSelectElement
      ).value,
    ).toBe("age");
    await userEvent.keyboard("{Escape}");
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: "Manage columns" }));
    expect(screen.getByRole("group", { name: "Columns" })).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: "Hide column" }));
    expect(screen.queryByRole("columnheader", { name: /Age/ })).toBeNull();
    // Keyboard: Ctrl+Enter opens the menu of the focused header.
    act(() => header(/Name/).focus());
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(
      screen.getByRole("button", { name: "Name column menu" }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("controlled models, initial state, labels, flags and empty overlays", async () => {
    const { rerender } = render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        sortModel={[{ field: "age", sort: "desc" }]}
        columnVisibilityModel={{ label: false }}
        density="comfortable"
        rowSelectionModel={["2"]}
        checkboxSelection
        paginationModel={{ page: 9, pageSize: 5 }}
        localeText={{ noResultsOverlayLabel: "Nothing here" }}
        showToolbar
        disableColumnMenu
        disableColumnFilter
        disableColumnSelector
        disableDensitySelector
        disableColumnSorting
      />,
    );
    expect(names()).toEqual(["Diego", "Ana", "Bao", "Chloe"]);
    expect(header(/Age/).hasAttribute("aria-sort")).toBe(false);
    expect(screen.queryByRole("button", { name: /column menu/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Filters" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Columns" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Density" })).toBeNull();
    expect(screen.getAllByRole("row")[2]?.getAttribute("aria-selected")).toBe("false");
    expect(grid().parentElement?.getAttribute("data-ok-density")).toBe("comfortable");
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        initialState={{
          filter: { filterModel: { items: [{ field: "name", operator: "equals", value: "zed" }] } },
          sorting: { sortModel: [{ field: "name", sort: "asc" }] },
          pagination: { paginationModel: { pageSize: 25 } },
          columns: { columnVisibilityModel: { age: false } },
          density: "compact",
        }}
        localeText={{ noResultsOverlayLabel: "Nothing here" }}
        hideFooter
        key="other"
      />,
    );
    expect(screen.getByRole("status").textContent).toBe("Nothing here");
    rerender(<DataGrid aria-label="People" rows={[]} columns={COLUMNS} />);
    expect(screen.getByRole("status").textContent).toBe("No rows");
  });

  it("columns without names, unfilterable / unhideable columns in the menu; custom row ids; no multi-sort", async () => {
    const onSortModelChange = vi.fn();
    render(
      <DataGrid
        aria-label="Things"
        rows={[
          { key: "a", n: 2 },
          { key: "b", n: 1 },
        ]}
        getRowId={(row) => row.key}
        columns={[
          { field: "n", type: "number", filterable: false, hideable: false },
          { field: "key", sortable: false },
        ]}
        showToolbar
        disableMultipleColumnsSorting
        localeText={{ filterOperator: {} }}
        onSortModelChange={onSortModelChange}
      />,
    );
    expect(header("n").getAttribute("data-ok-filterable")).toBe("false");
    fireEvent.click(header("n"), { shiftKey: true });
    expect(onSortModelChange).toHaveBeenLastCalledWith([{ field: "n", sort: "asc" }]);
    await userEvent.hover(header("n"));
    await userEvent.click(screen.getByRole("button", { name: "n column menu" }));
    expect(screen.getByRole("menuitem", { name: "Filter" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(
      screen.getByRole("menuitem", { name: "Hide column" }).getAttribute("aria-disabled"),
    ).toBe("true");
    await userEvent.keyboard("{Escape}");
    await userEvent.hover(header("key"));
    await userEvent.click(screen.getByRole("button", { name: "key column menu" }));
    expect(
      screen.getByRole("menuitem", { name: "Sort by ASC" }).getAttribute("aria-disabled"),
    ).toBe("true");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    const operator = within(screen.getByRole("group", { name: "Filters" })).getByLabelText(
      "Operator",
    );
    expect(within(operator).getAllByRole("option")[0]?.textContent).toBe("contains");
    // Sorted by n (ascending): b first.
    expect(screen.getAllByRole("row")[1]?.getAttribute("data-ok-row-id")).toBe("b");
  });

  it("dates as values, empty page size options, no filterable column, Ctrl+Enter without a menu", async () => {
    render(
      <DataGrid
        aria-label="Dates"
        rows={[{ id: 1, at: new Date("2026-01-02T00:00:00Z") }]}
        columns={[{ field: "at", type: "date", filterable: false }]}
        pageSizeOptions={[]}
        showToolbar
        disableColumnMenu
      />,
    );
    expect(screen.getAllByRole("gridcell")[0]?.textContent).toBe("2026-01-02T00:00:00.000Z");
    expect(screen.getByText("1–1 of 1")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(
      (
        within(screen.getByRole("group", { name: "Filters" })).getByLabelText(
          "Columns",
        ) as HTMLSelectElement
      ).value,
    ).toBe("");
    await userEvent.keyboard("{Escape}");
    act(() => header(/at/).focus());
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("SSR, axe", async () => {
    const html = renderToString(
      <DataGrid
        id="s"
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        showToolbar
      />,
    );
    expect(html).toContain('role="grid"');
    expect(html).toContain('aria-controls="s-columns"');
    render(
      <DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} checkboxSelection showToolbar />,
    );
    await expectNoAxeViolations();
  });

  describe("phase 2", () => {
    interface Item {
      id: number;
      name: string;
      qty: number;
      kind: string;
      ok: boolean;
    }
    const ITEMS: Item[] = [
      { id: 1, name: "Bolt", qty: 4, kind: "metal", ok: true },
      { id: 2, name: "Nut", qty: 9, kind: "metal", ok: false },
      { id: 3, name: "Cork", qty: 2, kind: "wood", ok: true },
    ];
    const EDIT: GridColDef<Item>[] = [
      { field: "name", headerName: "Name", editable: true, width: 120 },
      { field: "qty", headerName: "Qty", type: "number", editable: true },
      {
        field: "kind",
        headerName: "Kind",
        type: "singleSelect",
        valueOptions: ["metal", "wood"],
        editable: true,
      },
      { field: "ok", headerName: "OK", type: "boolean", editable: true, resizable: false },
      { field: "label", headerName: "Label", valueGetter: (row) => row.name, editable: true },
    ];
    const cellOf = (rowId: string, field: string) =>
      grid().querySelector(`[data-ok-row-id="${rowId}"] [data-ok-field="${field}"]`) as HTMLElement;
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

    it("multi filters: add, logic and / or, remove", async () => {
      const onFilterModelChange = vi.fn();
      render(
        <DataGrid
          id="m"
          aria-label="Items"
          rows={ITEMS}
          columns={EDIT}
          showToolbar
          onFilterModelChange={onFilterModelChange}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: "Filters" }));
      const panel = screen.getByRole("group", { name: "Filters" });
      await userEvent.type(within(panel).getByLabelText("Value"), "o");
      await userEvent.click(within(panel).getByRole("button", { name: "Add filter" }));
      const second = panel.querySelectorAll("[data-ok-data-grid-filter]")[1] as HTMLElement;
      await userEvent.selectOptions(within(second).getByLabelText("Columns"), "qty");
      await userEvent.selectOptions(within(second).getByLabelText("Operator"), ">");
      await userEvent.type(within(second).getByLabelText("Value"), "3");
      // Name contains "o" and quantity above 3.
      expect(names()).toEqual(["Bolt"]);
      await userEvent.selectOptions(within(second).getByLabelText("Logic operator"), "or");
      expect(names()).toEqual(["Bolt", "Nut", "Cork"]);
      expect(onFilterModelChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ logicOperator: "or" }),
      );
      await userEvent.click(within(panel).getByRole("button", { name: "Add filter" }));
      expect(
        (
          within(
            panel.querySelectorAll("[data-ok-data-grid-filter]")[2] as HTMLElement,
          ).getByLabelText("Logic operator") as HTMLSelectElement
        ).disabled,
      ).toBe(true);
      for (const remove of within(panel)
        .getAllByRole("button", { name: "Remove filter" })
        .reverse())
        await userEvent.click(remove);
      expect(onFilterModelChange).toHaveBeenLastCalledWith(expect.objectContaining({ items: [] }));
      expect(panel.querySelectorAll("[data-ok-data-grid-filter]")).toHaveLength(1);
    });

    it("resizing: handle drag, Alt + arrows; not for unresizable columns or when disabled", async () => {
      const onColumnWidthChange = vi.fn();
      const { rerender } = render(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={EDIT}
          onColumnWidthChange={onColumnWidthChange}
        />,
      );
      const handle = header(/^Name/).querySelector("[data-ok-data-grid-resize]") as HTMLElement;
      expect(header(/^OK/).querySelector("[data-ok-data-grid-resize]")).toBeNull();
      expect(header(/^OK/).getAttribute("data-ok-resizable")).toBe("false");
      const x = handle.getBoundingClientRect().left;
      act(() => {
        handle.dispatchEvent(
          new PointerEvent("pointerdown", { bubbles: true, clientX: x, button: 0 }),
        );
        document.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x + 30 }));
        document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: x + 40 }));
      });
      expect(onColumnWidthChange).toHaveBeenCalledWith("name", 160);
      expect(grid().style.getPropertyValue("--_ok-data-grid-columns").startsWith("160px")).toBe(
        true,
      );
      fireEvent.click(header(/^Name/));
      expect(header(/^Name/).getAttribute("aria-sort")).toBe("none");
      act(() => header(/^Name/).focus());
      await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
      expect(onColumnWidthChange).toHaveBeenLastCalledWith("name", 150);
      act(() => header(/^OK/).focus());
      await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
      expect(onColumnWidthChange).toHaveBeenCalledTimes(2);
      rerender(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={EDIT}
          disableColumnResize
          onColumnWidthChange={onColumnWidthChange}
        />,
      );
      expect(grid().querySelector("[data-ok-data-grid-resize]")).toBeNull();
    });

    it("reordering by drag and by the column menu; pinning from the menu", async () => {
      const onColumnOrderChange = vi.fn();
      const onPinnedColumnsChange = vi.fn();
      render(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={EDIT}
          onColumnOrderChange={onColumnOrderChange}
          onPinnedColumnsChange={onPinnedColumnsChange}
          initialState={{ columns: { dimensions: { name: { width: 90 } } } }}
        />,
      );
      expect(grid().style.getPropertyValue("--_ok-data-grid-columns").startsWith("90px")).toBe(
        true,
      );
      const qty = header(/^Qty/);
      const kindBox = header(/^Kind/).getBoundingClientRect();
      act(() => {
        qty.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            clientX: qty.getBoundingClientRect().left + 5,
            clientY: kindBox.top + 5,
            button: 0,
          }),
        );
        document.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            clientX: kindBox.left + 20,
            clientY: kindBox.top + 5,
          }),
        );
        document.dispatchEvent(
          new PointerEvent("pointerup", {
            bubbles: true,
            clientX: kindBox.left + 20,
            clientY: kindBox.top + 5,
          }),
        );
      });
      expect(onColumnOrderChange).toHaveBeenLastCalledWith(["name", "kind", "qty", "ok", "label"]);
      const openMenu = async (name: RegExp, field: string) => {
        await userEvent.hover(header(name));
        await userEvent.click(screen.getByRole("button", { name: `${field} column menu` }));
      };
      await openMenu(/^Name/, "Name");
      expect(
        screen.getByRole("menuitem", { name: "Move left" }).getAttribute("aria-disabled"),
      ).toBe("true");
      await userEvent.click(screen.getByRole("menuitem", { name: "Move right" }));
      expect(onColumnOrderChange).toHaveBeenLastCalledWith(["kind", "name", "qty", "ok", "label"]);
      await openMenu(/^Label/, "Label");
      expect(
        screen.getByRole("menuitem", { name: "Move right" }).getAttribute("aria-disabled"),
      ).toBe("true");
      await userEvent.click(screen.getByRole("menuitem", { name: "Move left" }));
      await openMenu(/^Qty/, "Qty");
      expect(screen.getByRole("menuitem", { name: "Unpin" }).getAttribute("aria-disabled")).toBe(
        "true",
      );
      await userEvent.click(screen.getByRole("menuitem", { name: "Pin to left" }));
      expect(onPinnedColumnsChange).toHaveBeenLastCalledWith({ left: ["qty"], right: [] });
      expect(header(/^Qty/).getAttribute("data-ok-pinned")).toBe("left");
      expect(header(/^Qty/).style.getPropertyValue("--_ok-data-grid-pin")).toBe("0px");
      expect(getComputedStyle(header(/^Qty/)).position).toBe("sticky");
      await openMenu(/^OK/, "OK");
      await userEvent.click(screen.getByRole("menuitem", { name: "Pin to right" }));
      expect(header(/^OK/).getAttribute("data-ok-pinned")).toBe("right");
      await openMenu(/^Qty/, "Qty");
      await userEvent.click(screen.getByRole("menuitem", { name: "Unpin" }));
      expect(header(/^Qty/).hasAttribute("data-ok-pinned")).toBe(false);
    });

    it("left pinning pins the checkbox column too; flags hide the menu items", () => {
      render(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={EDIT}
          checkboxSelection
          pinnedColumns={{ left: ["qty"] }}
          disableColumnReorder
          disableColumnPinning
        />,
      );
      expect(
        grid()
          .querySelector('[role="columnheader"][data-ok-field="__check__"]')
          ?.getAttribute("data-ok-pinned"),
      ).toBe("left");
      expect(screen.getAllByRole("columnheader")[1]?.getAttribute("data-ok-field")).toBe("qty");
    });

    it("cell editing: double click / Enter / F2, Enter commits, Escape cancels, blur commits", async () => {
      const processRowUpdate = vi.fn((row: Item) => ({ ...row, name: row.name.toUpperCase() }));
      render(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={EDIT}
          processRowUpdate={processRowUpdate}
        />,
      );
      expect(header(/^Name/).hasAttribute("data-ok-editable")).toBe(true);
      expect(header(/^Label/).hasAttribute("data-ok-editable")).toBe(false);
      expect(header(/^Kind/).getAttribute("data-ok-value-options")).toBe('["metal","wood"]');
      await userEvent.dblClick(cellOf("1", "name"));
      const input = screen.getByRole("textbox", { name: "Edit Name" }) as HTMLInputElement;
      expect(document.activeElement).toBe(input);
      expect(cellOf("1", "name").hasAttribute("data-ok-editing")).toBe(true);
      await userEvent.clear(input);
      await userEvent.type(input, "screw{Enter}");
      await act(settle);
      expect(processRowUpdate).toHaveBeenCalledWith({ ...ITEMS[0], name: "screw" }, ITEMS[0]);
      expect(cellOf("1", "name").textContent).toBe("SCREW");
      expect(document.activeElement).toBe(cellOf("1", "name"));
      act(() => cellOf("2", "qty").focus());
      await userEvent.keyboard("{F2}");
      await userEvent.keyboard("{Control>}a{/Control}12{Escape}");
      expect(cellOf("2", "qty").textContent).toBe("9");
      act(() => cellOf("2", "kind").focus());
      await userEvent.keyboard("{Enter}");
      await userEvent.selectOptions(screen.getByRole("combobox", { name: "Edit Kind" }), "wood");
      act(() => cellOf("3", "name").focus());
      await act(settle);
      expect(cellOf("2", "kind").textContent).toBe("wood");
      await userEvent.dblClick(cellOf("3", "ok"));
      await userEvent.click(screen.getByRole("checkbox", { name: "Edit OK" }));
      await userEvent.keyboard("{Enter}");
      await act(settle);
      expect(cellOf("3", "ok").textContent).toBe("false");
      // Not editable: a computed column.
      await userEvent.dblClick(cellOf("1", "label"));
      expect(screen.queryByRole("textbox", { name: "Edit Label" })).toBeNull();
    });

    it("row editing: every editable cell; refused updates keep the row; new rows drop the edits", async () => {
      const onProcessRowUpdateError = vi.fn();
      const { rerender } = render(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={EDIT}
          editMode="row"
          processRowUpdate={() => Promise.reject(new Error("no"))}
          onProcessRowUpdateError={onProcessRowUpdateError}
        />,
      );
      await userEvent.dblClick(cellOf("1", "qty"));
      expect(grid().querySelector('[data-ok-row-id="1"]')?.hasAttribute("data-ok-editing")).toBe(
        true,
      );
      expect(screen.getAllByRole("textbox")).toHaveLength(1);
      expect(screen.getByRole("spinbutton", { name: "Edit Qty" })).toBeTruthy();
      await userEvent.tab();
      expect(grid().querySelector("[data-ok-data-grid-edit-input]")).not.toBeNull();
      await userEvent.keyboard("{Enter}");
      await act(settle);
      expect(onProcessRowUpdateError).toHaveBeenCalled();
      expect(cellOf("1", "name").textContent).toBe("Bolt");
      rerender(<DataGrid aria-label="Items" rows={ITEMS} columns={EDIT} editMode="row" />);
      await userEvent.dblClick(cellOf("2", "name"));
      await userEvent.type(screen.getByRole("textbox", { name: "Edit Name" }), "!{Enter}");
      await act(settle);
      expect(cellOf("2", "name").textContent).toBe("Nut!");
      rerender(<DataGrid aria-label="Items" rows={[...ITEMS]} columns={EDIT} editMode="row" />);
      await act(settle);
      expect(cellOf("2", "name").textContent).toBe("Nut");
    });

    it("print exports the grid through a frame", async () => {
      const print = vi.fn();
      const append = document.body.append.bind(document.body);
      vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
        append(...nodes);
        for (const node of nodes)
          if (node instanceof HTMLIFrameElement) (node.contentWindow as Window).print = print;
      });
      render(<DataGrid aria-label="Items" rows={ITEMS} columns={EDIT} showToolbar />);
      await userEvent.click(screen.getByRole("button", { name: "Export" }));
      await userEvent.click(screen.getByRole("menuitem", { name: "Print" }));
      expect(print).toHaveBeenCalled();
      expect(document.querySelector("iframe")?.contentDocument?.title).toBe("Items");
      document.querySelector("iframe")?.remove();
    });
  });

  describe("phase 3", () => {
    interface Big {
      id: number;
      name: string;
      age: number;
    }
    const big = (count: number, from = 0): Big[] =>
      Array.from({ length: count }, (_, i) => ({
        id: from + i + 1,
        name: `P${from + i + 1}`,
        age: (i * 7) % 50,
      }));
    const BIG_COLUMNS: GridColDef<Big>[] = [
      { field: "name", headerName: "Name", width: 120 },
      { field: "age", headerName: "Age", type: "number", width: 90 },
    ];
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    const bodyRows = () => [...grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]')];
    const scrollTo = async (top: number) => {
      await act(async () => {
        grid().scrollTop = top;
        fireEvent.scroll(grid());
        await settle();
      });
    };

    it("virtualizes the rows of a bounded grid: window, spacers, indexes", async () => {
      const { rerender } = render(
        <DataGrid
          aria-label="Big"
          rows={big(1000)}
          columns={BIG_COLUMNS}
          hideFooter
          style={{ height: 400 }}
        />,
      );
      await act(settle);
      expect(bodyRows().length).toBeGreaterThan(5);
      expect(bodyRows().length).toBeLessThan(30);
      expect(grid().getAttribute("aria-rowcount")).toBe("1001");
      await scrollTo(52 * 500);
      const indexes = bodyRows().map((row) => Number(row.getAttribute("aria-rowindex")));
      expect(Math.min(...indexes)).toBeGreaterThan(400);
      expect(Math.max(...indexes)).toBeLessThan(600);
      const body = grid().querySelector<HTMLElement>("[data-ok-data-grid-body]") as HTMLElement;
      expect(Number.parseFloat(getComputedStyle(body).paddingTop)).toBeGreaterThan(10_000);
      expect(Number.parseFloat(getComputedStyle(body).paddingBottom)).toBeGreaterThan(10_000);

      rerender(
        <DataGrid
          aria-label="Big"
          rows={big(1000)}
          columns={BIG_COLUMNS}
          hideFooter
          disableVirtualization
          style={{ height: 400 }}
        />,
      );
      await act(settle);
      expect(bodyRows()).toHaveLength(1000);
    });

    it("doesn't virtualize a grid that grows with its rows; pages stay windowed", async () => {
      const { unmount } = render(
        <DataGrid aria-label="Big" rows={big(40)} columns={BIG_COLUMNS} hideFooter />,
      );
      await act(settle);
      expect(bodyRows()).toHaveLength(40);
      unmount();
      render(
        <DataGrid
          aria-label="Big"
          rows={big(300)}
          columns={BIG_COLUMNS}
          initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
          pageSizeOptions={[100]}
          style={{ height: 400 }}
        />,
      );
      await act(settle);
      // Only rows of the first page, and only its window.
      expect(bodyRows().length).toBeLessThan(30);
      expect(bodyRows().every((row) => Number(row.getAttribute("aria-rowindex")) <= 101)).toBe(
        true,
      );
    });

    it("server modes report models and show rows as given; rowCount drives the footer", async () => {
      const onSortModelChange = vi.fn();
      const onFilterModelChange = vi.fn();
      const onPaginationModelChange = vi.fn();
      render(
        <DataGrid
          aria-label="Server"
          rows={big(10, 20).reverse()}
          columns={BIG_COLUMNS}
          sortingMode="server"
          filterMode="server"
          paginationMode="server"
          rowCount={100}
          filterModel={{ items: [{ field: "name", operator: "equals", value: "nobody" }] }}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 2 } } }}
          pageSizeOptions={[10]}
          onSortModelChange={onSortModelChange}
          onFilterModelChange={onFilterModelChange}
          onPaginationModelChange={onPaginationModelChange}
        />,
      );
      const root = grid().closest("[data-ok-data-grid]") as HTMLElement;
      expect(root.getAttribute("data-ok-sorting-mode")).toBe("server");
      expect(root.getAttribute("data-ok-pagination-mode")).toBe("server");
      expect(root.getAttribute("data-ok-row-count")).toBe("100");
      expect(names()[0]).toBe("P30");
      expect(names()).toHaveLength(10);
      expect(screen.getByText("21–30 of 100")).toBeTruthy();
      expect(grid().getAttribute("aria-rowcount")).toBe("101");
      expect(bodyRows()[0]?.getAttribute("aria-rowindex")).toBe("22");
      await userEvent.click(header(/Name/));
      expect(onSortModelChange).toHaveBeenCalledWith([{ field: "name", sort: "asc" }]);
      expect(names()[0]).toBe("P30");
      await userEvent.click(screen.getByRole("button", { name: "Go to next page" }));
      expect(onPaginationModelChange).toHaveBeenCalledWith({ page: 3, pageSize: 10 });
    });

    it("server pagination without rowCount counts the rows", () => {
      render(
        <DataGrid
          aria-label="Server"
          rows={big(4)}
          columns={BIG_COLUMNS}
          paginationMode="server"
          pageSizeOptions={[10]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />,
      );
      expect(screen.getByText("1–4 of 4")).toBeTruthy();
    });

    it("loading: busy grid, overlay variants, no empty overlay", async () => {
      const { rerender } = render(
        <DataGrid aria-label="Load" rows={[]} columns={BIG_COLUMNS} loading />,
      );
      const loadingOverlay = () =>
        document.querySelector<HTMLElement>("[data-ok-data-grid-loading]") as HTMLElement;
      const empty = () =>
        document.querySelector<HTMLElement>("[data-ok-data-grid-overlay]") as HTMLElement;
      expect(grid().getAttribute("aria-busy")).toBe("true");
      expect(loadingOverlay().hidden).toBe(false);
      expect(loadingOverlay().getAttribute("data-ok-variant")).toBe("linear-progress");
      expect(loadingOverlay().querySelector("[data-ok-linear-progress]")).not.toBeNull();
      expect(empty().hidden).toBe(true);
      expect(grid().closest("[data-ok-data-grid]")?.hasAttribute("data-ok-loading")).toBe(true);
      rerender(
        <DataGrid
          aria-label="Load"
          rows={[]}
          columns={BIG_COLUMNS}
          loading
          loadingVariant="circular-progress"
        />,
      );
      expect(loadingOverlay().querySelector("[data-ok-circular-progress]")).not.toBeNull();
      rerender(
        <DataGrid
          aria-label="Load"
          rows={[]}
          columns={BIG_COLUMNS}
          loading
          loadingVariant="skeleton"
        />,
      );
      expect(loadingOverlay().querySelectorAll("[data-ok-data-grid-skeleton]")).toHaveLength(5);
      await expectNoAxeViolations();
      rerender(<DataGrid aria-label="Load" rows={[]} columns={BIG_COLUMNS} />);
      expect(grid().hasAttribute("aria-busy")).toBe(false);
      expect(loadingOverlay().hidden).toBe(true);
      expect(empty().hidden).toBe(false);
    });

    it("onRowsScrollEnd fires once per row count, with a threshold", async () => {
      const onRowsScrollEnd = vi.fn();
      const props = {
        "aria-label": "Infinite",
        columns: BIG_COLUMNS,
        hideFooter: true,
        style: { height: 300 },
        onRowsScrollEnd,
      };
      const { rerender } = render(<DataGrid {...props} rows={big(50)} />);
      await act(settle);
      await scrollTo(100);
      expect(onRowsScrollEnd).not.toHaveBeenCalled();
      await scrollTo(100_000);
      expect(onRowsScrollEnd).toHaveBeenCalledTimes(1);
      expect(onRowsScrollEnd).toHaveBeenCalledWith({ visibleRowsCount: 50 });
      await scrollTo(100_001);
      expect(onRowsScrollEnd).toHaveBeenCalledTimes(1);
      rerender(<DataGrid {...props} rows={big(80)} scrollEndThreshold={10_000} />);
      await act(settle);
      expect(
        grid().closest("[data-ok-data-grid]")?.getAttribute("data-ok-scroll-end-threshold"),
      ).toBe("10000");
      await scrollTo(0);
      expect(onRowsScrollEnd).toHaveBeenLastCalledWith({ visibleRowsCount: 80 });
    });

    it("dataSource: loads, asks again on sort, uses its cache, reports errors", async () => {
      const all = big(30);
      const getRows = vi.fn((params: GridGetRowsParams) => {
        const sorted = params.sortModel[0]?.sort === "desc" ? [...all].reverse() : all;
        const { page, pageSize } = params.paginationModel ?? { page: 0, pageSize: 30 };
        return Promise.resolve({
          rows: sorted.slice(page * pageSize, (page + 1) * pageSize),
          rowCount: all.length,
        });
      });
      const source: GridDataSource<Big> = { getRows };
      const { rerender } = render(
        <DataGrid
          aria-label="Source"
          rows={[]}
          columns={BIG_COLUMNS}
          dataSource={source}
          pageSizeOptions={[10]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />,
      );
      expect(grid().getAttribute("aria-busy")).toBe("true");
      await act(settle);
      expect(grid().hasAttribute("aria-busy")).toBe(false);
      expect(names()).toHaveLength(10);
      expect(screen.getByText("1–10 of 30")).toBeTruthy();
      expect(getRows).toHaveBeenCalledWith({
        sortModel: [],
        filterModel: { items: [] },
        paginationModel: { page: 0, pageSize: 10 },
      });
      await userEvent.click(header(/Name/));
      await act(settle);
      await userEvent.click(header(/Name/));
      await act(settle);
      expect(names()[0]).toBe("P30");
      const calls = getRows.mock.calls.length;
      await userEvent.click(header(/Name/));
      await act(settle);
      // Unsorted again: served from the cache.
      expect(getRows).toHaveBeenCalledTimes(calls);
      expect(names()[0]).toBe("P1");

      // Without a cache every change asks the source.
      rerender(
        <DataGrid
          aria-label="Source"
          rows={[]}
          columns={BIG_COLUMNS}
          dataSource={source}
          dataSourceCache={null}
          pageSizeOptions={[10]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />,
      );
      await act(settle);
      expect(getRows).toHaveBeenCalledTimes(calls + 1);

      const onDataSourceError = vi.fn();
      const failing: GridDataSource<Big> = { getRows: () => Promise.reject(new Error("down")) };
      rerender(
        <DataGrid
          aria-label="Source"
          rows={[]}
          columns={BIG_COLUMNS}
          dataSource={failing}
          onDataSourceError={onDataSourceError}
        />,
      );
      await act(settle);
      expect(onDataSourceError).toHaveBeenCalledWith(new Error("down"));
      expect(grid().hasAttribute("aria-busy")).toBe(false);
    });

    it("dataSource: a stale response is dropped", async () => {
      let resolveFirst: (value: { rows: Big[] }) => void = () => {};
      const first: GridDataSource<Big> = {
        getRows: () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      };
      const second: GridDataSource<Big> = {
        getRows: () => Promise.resolve({ rows: big(2, 100) }),
      };
      const { rerender } = render(
        <DataGrid aria-label="Source" rows={[]} columns={BIG_COLUMNS} dataSource={first} />,
      );
      rerender(
        <DataGrid aria-label="Source" rows={[]} columns={BIG_COLUMNS} dataSource={second} />,
      );
      await act(settle);
      await act(async () => {
        resolveFirst({ rows: big(5) });
        await settle();
      });
      expect(names()).toEqual(["P101", "P102"]);
    });
  });

  describe("phase 4", () => {
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    const rowEl = (id: string) =>
      grid().querySelector<HTMLElement>(`[data-ok-row-id="${id}"]`) as HTMLElement;
    const cellAt = (id: string, field: string) =>
      rowEl(id).querySelector<HTMLElement>(`[data-ok-field="${field}"]`) as HTMLElement;
    interface Line {
      id: string;
      group: string;
      item: string;
      amount: number;
      note: string;
    }
    const LINES: Line[] = [
      { id: "a", group: "G1", item: "x", amount: 1, note: "short" },
      { id: "b", group: "G1", item: "y", amount: 2, note: "a long note that wraps" },
      { id: "c", group: "G2", item: "z", amount: 3, note: "short" },
      { id: "t", group: "Total", item: "", amount: 6, note: "" },
    ];
    const LINE_COLUMNS: GridColDef<Line>[] = [
      { field: "group", headerName: "Group", colSpan: ({ row }) => (row.id === "t" ? 2 : 1) },
      { field: "item", headerName: "Item", description: "What was bought" },
      { field: "amount", headerName: "Amount", type: "number", maxWidth: 200 },
      { field: "note", headerName: "Note", getApplyQuickFilterFn: null },
    ];

    it("single selection, unselectable rows, select all on the page, pruning", async () => {
      const onRowSelectionModelChange = vi.fn();
      const { rerender } = render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          checkboxSelection
          disableMultipleRowSelection
          isRowSelectable={({ row }) => row.id !== 2}
          onRowSelectionModelChange={onRowSelectionModelChange}
        />,
      );
      expect(grid().hasAttribute("aria-multiselectable")).toBe(false);
      const head = grid().querySelector('[role="columnheader"][data-ok-data-grid-checkbox]');
      expect(head?.querySelector("input")).toBeNull();
      expect(head?.getAttribute("aria-label")).toBe("Checkbox selection");
      await userEvent.click(cellAt("1", "name"));
      await userEvent.click(cellAt("3", "name"));
      expect(onRowSelectionModelChange).toHaveBeenLastCalledWith(["3"]);
      await userEvent.click(cellAt("3", "name"));
      expect(onRowSelectionModelChange).toHaveBeenLastCalledWith([]);
      expect(rowEl("2").getAttribute("data-ok-selectable")).toBe("false");
      expect((rowEl("2").querySelector("input") as HTMLInputElement).disabled).toBe(true);
      const calls = onRowSelectionModelChange.mock.calls.length;
      await userEvent.click(cellAt("2", "name"));
      cellAt("1", "name").focus();
      fireEvent.keyDown(cellAt("1", "name"), { key: "a", ctrlKey: true });
      expect(onRowSelectionModelChange).toHaveBeenCalledTimes(calls);

      // Select all: this page's selectable rows; selections of removed rows go away.
      rerender(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          checkboxSelection
          checkboxSelectionVisibleOnly
          isRowSelectable={({ row }) => row.id !== 2}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          pageSizeOptions={[2, 5]}
          onRowSelectionModelChange={onRowSelectionModelChange}
        />,
      );
      await userEvent.selectOptions(screen.getByRole("combobox", { name: /Rows per page/ }), "2");
      await userEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
      expect(onRowSelectionModelChange).toHaveBeenLastCalledWith(["1"]);
      rerender(
        <DataGrid
          aria-label="People"
          rows={ROWS.slice(1)}
          columns={COLUMNS}
          checkboxSelection
          onRowSelectionModelChange={onRowSelectionModelChange}
        />,
      );
      await act(settle);
      expect(onRowSelectionModelChange).toHaveBeenLastCalledWith([]);
    });

    it("keepNonExistentRowsSelected keeps ids of rows that went away", async () => {
      const onRowSelectionModelChange = vi.fn();
      const props = {
        "aria-label": "People",
        columns: COLUMNS,
        checkboxSelection: true,
        keepNonExistentRowsSelected: true,
        onRowSelectionModelChange,
      };
      const { rerender } = render(<DataGrid {...props} rows={ROWS} />);
      await userEvent.click(cellAt("1", "name"));
      rerender(<DataGrid {...props} rows={ROWS.slice(1)} />);
      await act(settle);
      expect(onRowSelectionModelChange).toHaveBeenCalledTimes(1);
    });

    it("column and row spans, descriptions, custom headers and classes", () => {
      render(
        <DataGrid
          id="s"
          aria-label="Lines"
          rows={LINES}
          columns={[
            ...LINE_COLUMNS.slice(0, 3),
            { ...(LINE_COLUMNS[3] as GridColDef<Line>), renderHeader: () => <b>Notes</b> },
          ]}
          rowSpanning
          getRowClassName={({ row }) => (row.id === "t" ? "total" : "")}
          getCellClassName={({ field }) => (field === "amount" ? "money" : "")}
          hideFooter
        />,
      );
      const total = cellAt("t", "group");
      expect(total.getAttribute("aria-colspan")).toBe("2");
      expect(total.style.getPropertyValue("--_ok-data-grid-colspan")).toBe("2");
      expect(cellAt("t", "item").hidden).toBe(true);
      const g1 = cellAt("a", "group");
      expect(g1.getAttribute("aria-rowspan")).toBe("2");
      expect(g1.style.getPropertyValue("--_ok-data-grid-rowspan")).toBe("2");
      expect(cellAt("b", "group").hasAttribute("data-ok-covered")).toBe(true);
      expect(cellAt("b", "group").getAttribute("aria-hidden")).toBe("true");
      expect(rowEl("t").className).toBe("total");
      expect(rowEl("a").className).toBe("");
      expect(cellAt("a", "amount").className).toBe("money");
      const item = header(/Item/);
      expect(item.getAttribute("aria-describedby")).toBe("s-item-description");
      expect(document.getElementById("s-item-description")?.textContent).toContain(
        "What was bought",
      );
      expect(header(/Notes/).querySelector("b")?.textContent).toBe("Notes");
      expect(header(/Amount/).getAttribute("data-ok-max-width")).toBe("200");
      expect(header(/Notes/).getAttribute("data-ok-searchable")).toBe("false");
    });

    it("row heights, spacing and the grid's row height", () => {
      render(
        <DataGrid
          aria-label="Lines"
          rows={LINES}
          columns={LINE_COLUMNS}
          rowHeight={40}
          density="compact"
          getRowHeight={({ model }) =>
            model.note.length > 10 ? "auto" : model.id === "c" ? 70 : null
          }
          getRowSpacing={({ isFirstVisible }) => ({ top: isFirstVisible ? 0 : 4, bottom: 4 })}
          hideFooter
        />,
      );
      const root = grid().closest("[data-ok-data-grid]") as HTMLElement;
      expect(root.getAttribute("data-ok-row-height")).toBe("40");
      expect(root.style.getPropertyValue("--_ok-data-grid-row-height")).toBe("28px");
      expect(rowEl("b").getAttribute("data-ok-row-height")).toBe("auto");
      expect(rowEl("c").getAttribute("data-ok-row-height")).toBe("70");
      expect(rowEl("c").style.getPropertyValue("--_ok-data-grid-row-height")).toBe("70px");
      expect(rowEl("a").hasAttribute("data-ok-row-height")).toBe(false);
      expect(rowEl("a").getAttribute("data-ok-spacing-top")).toBe("0");
      expect(rowEl("b").style.getPropertyValue("--_ok-data-grid-spacing-top")).toBe("4px");
      expect(cellAt("c", "note").getBoundingClientRect().height).toBe(70);
    });

    it("virtualizes rows of their own height in a bounded grid", async () => {
      const many = Array.from({ length: 400 }, (_, i) => ({
        id: `r${i}`,
        group: `g${i}`,
        item: "i",
        amount: i,
        note: "n",
      }));
      render(
        <DataGrid
          aria-label="Lines"
          rows={many}
          columns={LINE_COLUMNS}
          getRowHeight={({ model }) => (model.amount % 2 ? 80 : 40)}
          getEstimatedRowHeight={() => 50}
          hideFooter
          style={{ height: 400 }}
        />,
      );
      await act(settle);
      const count = grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]').length;
      expect(count).toBeGreaterThan(3);
      expect(count).toBeLessThan(30);
      await act(async () => {
        grid().scrollTop = 61 * 200;
        fireEvent.scroll(grid());
        await settle();
      });
      const first = Number(
        grid()
          .querySelector('[data-ok-data-grid-body] > [role="row"]')
          ?.getAttribute("aria-rowindex"),
      );
      expect(first).toBeGreaterThan(150);
      expect(first).toBeLessThan(250);
    });

    it("click, double click, key and header events", async () => {
      const spies = {
        onRowClick: vi.fn(),
        onRowDoubleClick: vi.fn(),
        onCellClick: vi.fn(),
        onCellDoubleClick: vi.fn(),
        onCellKeyDown: vi.fn(),
        onColumnHeaderClick: vi.fn(),
      };
      render(<DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} {...spies} />);
      await userEvent.click(cellAt("1", "age"));
      expect(spies.onRowClick.mock.calls[0]?.[0]).toMatchObject({
        id: "1",
        indexRelativeToCurrentPage: 0,
        isFirstVisible: true,
      });
      expect(spies.onCellClick.mock.calls[0]?.[0]).toMatchObject({
        id: "1",
        field: "age",
        value: 30,
      });
      await userEvent.dblClick(cellAt("2", "name"));
      expect(spies.onRowDoubleClick.mock.calls[0]?.[0]).toMatchObject({ id: "2" });
      expect(spies.onCellDoubleClick.mock.calls[0]?.[0]).toMatchObject({ field: "name" });
      fireEvent.keyDown(cellAt("1", "age"), { key: "ArrowDown" });
      expect(spies.onCellKeyDown.mock.calls[0]?.[0]).toMatchObject({ id: "1", field: "age" });
      await userEvent.click(header(/Name/));
      expect(spies.onColumnHeaderClick.mock.calls[0]?.[0]).toMatchObject({ field: "name" });
    });

    it("apiRef: models, state, scrolling, CSV, autosize", async () => {
      const apiRef = { current: null } as { current: GridApi<Row> | null };
      const onColumnWidthChange = vi.fn();
      const onSortModelChange = vi.fn();
      const { unmount } = render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          apiRef={apiRef}
          onColumnWidthChange={onColumnWidthChange}
          onSortModelChange={onSortModelChange}
          csvOptions={{ delimiter: ";" }}
          style={{ height: 150 }}
        />,
      );
      const api = apiRef.current as GridApi<Row>;
      expect(api.getRow("2")?.name).toBe("Bao");
      act(() => api.setSortModel([{ field: "age", sort: "desc" }]));
      expect(onSortModelChange).toHaveBeenCalledWith([{ field: "age", sort: "desc" }]);
      expect(names()[0]).toBe("Diego");
      act(() => {
        api.setFilterModel({ items: [], quickFilterValues: ["a"] });
        api.setRowSelectionModel(["1"]);
        api.setColumnVisibilityModel({ label: false });
        api.setColumnOrder(["age", "name"]);
        api.setPinnedColumns({ left: ["age"] });
        api.setColumnWidth("name", 222);
        api.setPaginationModel({ page: 0, pageSize: 5 });
        api.setDensity("compact");
      });
      expect((apiRef.current as GridApi<Row>).getFilterModel().quickFilterValues).toEqual(["a"]);
      expect((apiRef.current as GridApi<Row>).getRowSelectionModel()).toEqual(["1"]);
      const state = (apiRef.current as GridApi<Row>).exportState();
      expect(state).toMatchObject({
        sorting: { sortModel: [{ field: "age", sort: "desc" }] },
        columns: {
          columnVisibilityModel: { label: false },
          dimensions: { name: { width: 222 } },
        },
        pinnedColumns: { left: ["age"] },
        density: "compact",
      });
      // Columns in their new order; rows as searched and sorted.
      expect((apiRef.current as GridApi<Row>).getDataAsCsv()).toContain("Age;Name");
      expect(
        (apiRef.current as GridApi<Row>).getDataAsCsv({ fields: ["age"], utf8WithBom: false }),
      ).toBe("Age\r\n30\r\n9");
      const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      (apiRef.current as GridApi<Row>).exportDataAsCsv({ fileName: "x" });
      expect(createObjectURL).toHaveBeenCalled();

      act(() =>
        (apiRef.current as GridApi<Row>).restoreState({
          sorting: { sortModel: [] },
          filter: { filterModel: { items: [], quickFilterValues: [] } },
          pagination: { paginationModel: { page: 0 } },
          columns: {
            columnVisibilityModel: {},
            orderedFields: [],
            dimensions: { age: { width: 99 } },
          },
          pinnedColumns: {},
          density: "standard",
          __proto__: { bad: true },
        }),
      );
      expect(names()[0]).toBe("Ana");
      expect(grid().closest("[data-ok-data-grid]")?.getAttribute("data-ok-density")).toBe(
        "standard",
      );

      act(() => (apiRef.current as GridApi<Row>).scrollToIndexes({ rowIndex: 3, colIndex: 3 }));
      expect(grid().scrollTop).toBeGreaterThan(0);
      act(() => (apiRef.current as GridApi<Row>).scrollToIndexes({ rowIndex: 0 }));
      expect(grid().scrollTop).toBe(0);

      act(() => (apiRef.current as GridApi<Row>).autosizeColumns({ columns: ["age"] }));
      expect(onColumnWidthChange).toHaveBeenLastCalledWith("age", expect.any(Number));
      fireEvent.doubleClick(header(/Name/).querySelector("[data-ok-data-grid-resize]") as Element);
      expect(onColumnWidthChange).toHaveBeenLastCalledWith("name", expect.any(Number));
      unmount();
      expect(apiRef.current).toBeNull();
    });

    it("autosizes on mount (again once fonts are ready)", async () => {
      const onColumnWidthChange = vi.fn();
      render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          autosizeOnMount
          autosizeOptions={{ includeHeaders: false }}
          onColumnWidthChange={onColumnWidthChange}
        />,
      );
      expect(onColumnWidthChange).toHaveBeenCalledWith("name", expect.any(Number));
      await act(() => document.fonts.ready);
      await act(settle);
      expect(onColumnWidthChange.mock.calls.length).toBeGreaterThan(4);
    });

    it("prints every filtered row of every page, without the toolbar and footer", async () => {
      const print = vi.fn();
      let copy = "";
      const append = document.body.append.bind(document.body);
      vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
        append(...nodes);
        for (const node of nodes)
          if (node instanceof HTMLIFrameElement)
            (node.contentWindow as Window).print = () => {
              copy = (node.contentDocument as Document).body.innerHTML;
              print();
            };
      });
      const apiRef = { current: null } as { current: GridApi<Row> | null };
      render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          apiRef={apiRef}
          checkboxSelection
          showToolbar
          pageSizeOptions={[2]}
          initialState={{ pagination: { paginationModel: { pageSize: 2 } } }}
          printOptions={{ fields: ["name"], includeCheckboxes: true }}
        />,
      );
      act(() => (apiRef.current as GridApi<Row>).exportDataAsPrint());
      await act(settle);
      expect(print).toHaveBeenCalled();
      expect(copy).not.toContain("data-ok-data-grid-toolbar");
      expect(copy).not.toContain("data-ok-data-grid-footer");
      expect(copy).toContain("Diego");
      expect(copy).not.toContain('data-ok-field="age"');
      expect(copy).toContain('data-ok-field="__check__"');
      // The grid itself is back to its page.
      expect(names()).toHaveLength(2);
      document.querySelector("iframe")?.remove();
      act(() =>
        (apiRef.current as GridApi<Row>).exportDataAsPrint({
          allColumns: true,
          hideToolbar: false,
        }),
      );
      await act(settle);
      expect(copy).toContain("data-ok-data-grid-toolbar");
      document.querySelector("iframe")?.remove();
    });

    it("editing: per cell, typing, validation, parser and setter, start and stop events", async () => {
      interface Item {
        id: number;
        name: string;
        qty: number;
        locked: boolean;
        meta: { tag: string };
      }
      const items: Item[] = [
        { id: 1, name: "Bolt", qty: 4, locked: false, meta: { tag: "a" } },
        { id: 2, name: "Nut", qty: 9, locked: true, meta: { tag: "b" } },
      ];
      const onCellEditStart = vi.fn();
      const onCellEditStop = vi.fn();
      const processRowUpdate = vi.fn((row: Item) => row);
      const columns: GridColDef<Item>[] = [
        {
          field: "name",
          headerName: "Name",
          editable: true,
          preProcessEditCellProps: ({ props }) => ({
            error: String(props.value).length < 2 ? "Too short" : undefined,
          }),
        },
        {
          field: "qty",
          headerName: "Qty",
          type: "number",
          editable: true,
          valueParser: (value) => Number(value) * 10,
          preProcessEditCellProps: ({ props }) => ({ error: Number(props.value) > 1000 }),
        },
        {
          field: "tag",
          headerName: "Tag",
          editable: true,
          valueGetter: (row) => row.meta.tag,
        },
      ];
      render(
        <DataGrid
          id="e"
          aria-label="Items"
          rows={items}
          columns={columns}
          isCellEditable={({ row }) => !row.locked}
          onCellEditStart={onCellEditStart}
          onCellEditStop={onCellEditStop}
          processRowUpdate={processRowUpdate}
        />,
      );
      expect(cellAt("2", "name").getAttribute("data-ok-editable")).toBe("false");
      await userEvent.dblClick(cellAt("2", "name"));
      expect(screen.queryByRole("textbox", { name: "Edit Name" })).toBeNull();

      // Typing on a focused cell edits with that character.
      cellAt("1", "name").focus();
      await userEvent.keyboard("Z");
      await act(settle);
      const input = screen.getByRole("textbox", { name: "Edit Name" }) as HTMLInputElement;
      expect(input.value).toBe("Z");
      expect(onCellEditStart).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: "1", field: "name" }),
        "printableKeyDown",
      );
      expect(input.getAttribute("aria-invalid")).toBe("true");
      const error = document.getElementById(input.getAttribute("aria-describedby") as string);
      expect(error?.textContent).toBe("Too short");
      expect(error?.getAttribute("role")).toBe("alert");
      // Enter keeps the cell open while the value has an error.
      await userEvent.keyboard("{Enter}");
      expect(screen.getByRole("textbox", { name: "Edit Name" })).toBeTruthy();
      await userEvent.keyboard("ed{Enter}");
      await act(settle);
      expect(onCellEditStop).toHaveBeenLastCalledWith(
        expect.objectContaining({ field: "name" }),
        "enterKeyDown",
      );
      expect(processRowUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: "Zed" }),
        expect.anything(),
      );

      // A parser turns the text into the value; an error without a message only marks the field.
      await userEvent.dblClick(cellAt("1", "qty"));
      const qty = screen.getByRole("spinbutton", { name: "Edit Qty" });
      await userEvent.clear(qty);
      await userEvent.type(qty, "500");
      expect(qty.getAttribute("aria-invalid")).toBe("true");
      expect(qty.hasAttribute("aria-describedby")).toBe(false);
      await userEvent.keyboard("{Escape}");
      expect(onCellEditStop).toHaveBeenLastCalledWith(expect.anything(), "escapeKeyDown");
      await userEvent.dblClick(cellAt("1", "qty"));
      await userEvent.clear(screen.getByRole("spinbutton", { name: "Edit Qty" }));
      await userEvent.type(screen.getByRole("spinbutton", { name: "Edit Qty" }), "3{Enter}");
      await act(settle);
      expect(processRowUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ qty: 30 }),
        expect.anything(),
      );
    });

    it("editing rows: start and stop events; setters build the row", async () => {
      interface Item {
        id: number;
        name: string;
        meta: { tag: string };
      }
      const onRowEditStart = vi.fn();
      const onRowEditStop = vi.fn();
      const processRowUpdate = vi.fn((row: Item) => row);
      render(
        <DataGrid
          aria-label="Items"
          rows={[{ id: 1, name: "Bolt", meta: { tag: "a" } }]}
          columns={[
            { field: "name", headerName: "Name", editable: true },
            {
              field: "tag",
              headerName: "Tag",
              editable: true,
              valueSetter: (value, row) => ({ ...row, meta: { tag: String(value) } }),
            },
          ]}
          getRowId={(row) => row.id}
          editMode="row"
          onRowEditStart={onRowEditStart}
          onRowEditStop={onRowEditStop}
          processRowUpdate={processRowUpdate}
        />,
      );
      cellAt("1", "tag").focus();
      fireEvent.keyDown(cellAt("1", "tag"), { key: "Enter" });
      await act(settle);
      expect(onRowEditStart).toHaveBeenCalledWith(
        expect.objectContaining({ id: "1" }),
        "enterKeyDown",
      );
      expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Edit Tag" }));
      await userEvent.clear(screen.getByRole("textbox", { name: "Edit Tag" }));
      await userEvent.type(screen.getByRole("textbox", { name: "Edit Tag" }), "q{Enter}");
      await act(settle);
      expect(onRowEditStop).toHaveBeenCalledWith(
        expect.objectContaining({ id: "1" }),
        "enterKeyDown",
      );
      expect(processRowUpdate.mock.calls[0]?.[0]).toMatchObject({ meta: { tag: "q" } });
    });

    it("filters: isAnyOf, custom operators, search options and accents", async () => {
      const onFilterModelChange = vi.fn();
      const { rerender } = render(
        <DataGrid
          id="f"
          aria-label="People"
          rows={ROWS}
          columns={[
            ...COLUMNS.slice(0, 1),
            {
              ...(COLUMNS[1] as GridColDef<Row>),
              filterOperators: [
                {
                  value: "atLeast",
                  label: "at least",
                  getApplyFilterFn: (item) =>
                    item.value ? (value) => Number(value) >= Number(item.value) : null,
                },
                {
                  value: "known",
                  label: "known",
                  requiresValue: false,
                  getApplyFilterFn: () => (v) => v !== null,
                },
              ],
            },
          ]}
          showToolbar
          onFilterModelChange={onFilterModelChange}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: "Filters" }));
      const panel = screen.getByRole("group", { name: "Filters" });
      await userEvent.selectOptions(within(panel).getByLabelText("Operator"), "isAnyOf");
      await userEvent.type(within(panel).getByLabelText("Value"), "ana, bao");
      expect(names()).toEqual(["Ana", "Bao"]);
      await userEvent.selectOptions(within(panel).getByLabelText("Columns"), "age");
      const operators = within(panel).getByLabelText("Operator") as HTMLSelectElement;
      expect([...operators.options].map((o) => o.textContent)).toEqual(["at least", "known"]);
      await userEvent.type(within(panel).getByLabelText("Value"), "30");
      expect(names()).toEqual(["Ana", "Diego"]);
      await userEvent.selectOptions(operators, "known");
      expect((within(panel).getByLabelText("Value") as HTMLInputElement).disabled).toBe(true);
      expect(names()).toEqual(["Ana", "Bao", "Diego"]);

      const accents = [
        { id: 1, name: "Hà Nội", age: 1 },
        { id: 2, name: "Huế", age: 2 },
      ];
      rerender(
        <DataGrid
          aria-label="Places"
          rows={accents}
          columns={COLUMNS.slice(0, 2)}
          ignoreDiacritics
          quickFilterLogicOperator="or"
          filterModel={{ items: [], quickFilterValues: ["noi", "hue"] }}
        />,
      );
      expect(names()).toEqual(["Hà Nội", "Huế"]);
      rerender(
        <DataGrid
          aria-label="Places"
          rows={accents}
          columns={COLUMNS.slice(0, 2)}
          quickFilterExcludeHiddenColumns
          columnVisibilityModel={{ name: false }}
          filterModel={{ items: [], quickFilterValues: ["hue"] }}
        />,
      );
      expect(grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]')).toHaveLength(0);
    });

    it("icon toolbar, locale text, axe", async () => {
      render(
        <DataGrid
          id="l"
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          showToolbar
          toolbarVariant="icon"
          localeText={viVN}
        />,
      );
      const root = grid().closest("[data-ok-data-grid]") as HTMLElement;
      expect(root.getAttribute("data-ok-toolbar-variant")).toBe("icon");
      const columnsButton = screen.getByRole("button", { name: "Cột" });
      expect(columnsButton.hasAttribute("data-ok-icon-button")).toBe(true);
      expect(columnsButton.getAttribute("aria-labelledby")).toBe("l-columns-tooltip");
      expect(
        grid().querySelector("[data-ok-data-grid-menu-button]")?.getAttribute("aria-label"),
      ).toBe("Name menu cột");
      expect(screen.getByText("Số hàng mỗi trang:")).toBeTruthy();
      expect(screen.getByText("1–4 trên 4")).toBeTruthy();
      await expectNoAxeViolations();
    });

    it("SSR and axe of spans and validation errors", async () => {
      const html = renderToString(
        <DataGrid aria-label="Lines" rows={LINES} columns={LINE_COLUMNS} rowSpanning />,
      );
      expect(html).toContain('aria-rowspan="2"');
      render(
        <DataGrid aria-label="Lines" rows={LINES} columns={LINE_COLUMNS} rowSpanning hideFooter />,
      );
      await expectNoAxeViolations();
    });
  });

  describe("phase 4 edges", () => {
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    interface Big {
      id: number;
      city: string;
      text: string;
    }
    const big = (n: number): Big[] =>
      Array.from({ length: n }, (_, i) => ({ id: i, city: "Lima", text: `row ${i}` }));
    const BIG_COLUMNS: GridColDef<Big>[] = [
      { field: "city", headerName: "City", width: 300 },
      { field: "text", headerName: "Text", width: 400 },
    ];
    const scrollTo = async (top: number) => {
      await act(async () => {
        grid().scrollTop = top;
        fireEvent.scroll(grid());
        await settle();
      });
    };

    it("row spans in the window, auto rows, scrolling to indexes (uniform and per row)", async () => {
      for (const auto of [false, true]) {
        const apiRef = { current: null } as { current: GridApi<Big> | null };
        const { unmount } = render(
          <DataGrid
            aria-label="Big"
            rows={big(200)}
            columns={BIG_COLUMNS}
            rowSpanning
            hideFooter
            apiRef={apiRef}
            style={{ height: 300, width: 300 }}
            {...(auto
              ? {
                  getRowHeight: ({ model }: { model: Big }) => (model.id % 2 ? "auto" : null),
                  getEstimatedRowHeight: () => 40,
                }
              : {})}
          />,
        );
        await act(settle);
        await scrollTo(4000);
        await act(settle);
        // Every city is the same: the window starts at the span's first row.
        expect(
          grid()
            .querySelector('[data-ok-data-grid-body] > [role="row"]')
            ?.getAttribute("aria-rowindex"),
        ).toBe("2");
        const api = apiRef.current as GridApi<Big>;
        act(() => api.scrollToIndexes({ rowIndex: 150 }));
        expect(grid().scrollTop).toBeGreaterThan(4000);
        act(() => api.scrollToIndexes({ rowIndex: 1 }));
        expect(grid().scrollTop).toBeLessThan(200);
        grid().scrollLeft = 300;
        act(() => api.scrollToIndexes({ colIndex: 0 }));
        expect(grid().scrollLeft).toBe(0);
        act(() => api.scrollToIndexes({ colIndex: 1 }));
        expect(grid().scrollLeft).toBeGreaterThan(0);
        act(() => api.scrollToIndexes({ colIndex: 0 }));
        act(() => api.scrollToIndexes({ rowIndex: 999, colIndex: 9 }));
        unmount();
      }
    });

    it("measures auto rows that scroll into view", async () => {
      const props = {
        "aria-label": "Big",
        columns: BIG_COLUMNS,
        hideFooter: true,
        getRowHeight: () => "auto" as const,
        getEstimatedRowHeight: () => 30,
        style: { height: 300 },
      };
      const { rerender } = render(<DataGrid {...props} rows={big(50)} />);
      await act(settle);
      // New rows arrive while the grid is windowed: they are measured as they show.
      rerender(<DataGrid {...props} rows={big(200)} />);
      await act(settle);
      await scrollTo(3000);
      await act(settle);
      const first = Number(
        grid()
          .querySelector('[data-ok-data-grid-body] > [role="row"]')
          ?.getAttribute("aria-rowindex"),
      );
      expect(first).toBeGreaterThan(20);
    });

    it("useGridApiRef; partial states; defaults of CSV and print", async () => {
      const print = vi.fn();
      const append = document.body.append.bind(document.body);
      vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
        append(...nodes);
        for (const node of nodes)
          if (node instanceof HTMLIFrameElement) (node.contentWindow as Window).print = print;
      });
      render(<ApiGrid />);
      const grid = latestApi as unknown as GridApi<Row>;
      act(() => grid.restoreState({}));
      act(() => grid.restoreState({ filter: { filterModel: { items: [] } } }));
      expect(grid.getSortModel()).toEqual([]);
      expect(grid.getDataAsCsv()).toContain("Name,Age");
      act(() => grid.exportDataAsPrint());
      await act(settle);
      expect(document.querySelector("iframe")?.contentDocument?.title).toBe("people");
      document.querySelector("iframe")?.remove();
      act(() => grid.autosizeColumns({ columns: ["nope"] }));
    });

    it("operator labels fall back to values; select edits without options; typed numbers", async () => {
      render(
        <DataGrid
          id="o"
          aria-label="Items"
          rows={[{ id: 1, kind: "a", qty: 2 }]}
          columns={[
            {
              field: "kind",
              headerName: "Kind",
              type: "singleSelect",
              editable: true,
              filterOperators: [{ value: "same", getApplyFilterFn: () => null }],
            },
            { field: "qty", headerName: "Qty", type: "number", editable: true },
          ]}
          showToolbar
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: "Filters" }));
      const panel = screen.getByRole("group", { name: "Filters" });
      expect(within(panel).getByRole("option", { name: "same" })).toBeTruthy();
      const kind = grid().querySelector<HTMLElement>(
        '[data-ok-row-id="1"] [data-ok-field="kind"]',
      ) as HTMLElement;
      await userEvent.keyboard("{Escape}");
      fireEvent.doubleClick(kind);
      await act(settle);
      expect(kind.querySelector("select")?.querySelectorAll("option")).toHaveLength(0);
      await userEvent.keyboard("{Escape}");
      const qty = grid().querySelector<HTMLElement>(
        '[data-ok-row-id="1"] [data-ok-field="qty"]',
      ) as HTMLElement;
      qty.focus();
      await userEvent.keyboard("7");
      await act(settle);
      expect((qty.querySelector("input") as HTMLInputElement).value).toBe("7");
      await userEvent.keyboard("{Enter}");
    });

    it("a data source error after a newer request is ignored", async () => {
      const onDataSourceError = vi.fn();
      let fail: (reason: unknown) => void = () => {};
      const slow: GridDataSource<Row> = {
        getRows: () =>
          new Promise((_, reject) => {
            fail = reject;
          }),
      };
      const fast: GridDataSource<Row> = { getRows: () => Promise.resolve({ rows: ROWS }) };
      const { rerender } = render(
        <DataGrid
          aria-label="People"
          rows={[]}
          columns={COLUMNS}
          dataSource={slow}
          onDataSourceError={onDataSourceError}
        />,
      );
      rerender(
        <DataGrid
          aria-label="People"
          rows={[]}
          columns={COLUMNS}
          dataSource={fast}
          onDataSourceError={onDataSourceError}
        />,
      );
      await act(async () => {
        fail(new Error("late"));
        await settle();
      });
      expect(onDataSourceError).not.toHaveBeenCalled();
    });
  });
});
