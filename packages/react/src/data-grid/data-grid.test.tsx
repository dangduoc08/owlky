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

const grid = () => document.querySelector("[data-ok-data-grid-main]") as HTMLElement;
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
        fireEvent.click(screen.getByRole("button", { name: `${field} column menu` }));
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
      // Values as chips: type one, Enter, the next one.
      await userEvent.type(
        within(panel).getByRole("combobox", { name: "Value" }),
        "ana{Enter}bao{Enter}",
      );
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

  describe("phase 5", () => {
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    const rowEl = (rowId: string) =>
      grid().querySelector<HTMLElement>(`[role="row"][data-ok-row-id="${rowId}"]`) as HTMLElement;
    interface Member {
      id: string;
      path: string[];
      city: string;
    }
    const TEAM: Member[] = [
      { id: "a", path: ["Ana"], city: "Lima" },
      { id: "b", path: ["Ana", "Bao"], city: "Hue" },
      { id: "c", path: ["Ana", "Bao", "Chloe"], city: "Lyon" },
      { id: "d", path: ["Ana", "Diego"], city: "Lima" },
      { id: "e", path: ["Elif"], city: "Izmir" },
    ];
    const TEAM_COLUMNS: GridColDef<Member>[] = [{ field: "city", headerName: "City", width: 120 }];

    it("tree data: rows open and close; closed children stay in the markup, hidden", async () => {
      const apiRef = { current: null } as { current: GridApi<Member> | null };
      render(
        <DataGrid
          aria-label="Team"
          rows={TEAM}
          columns={TEAM_COLUMNS}
          treeData
          getTreeDataPath={(row) => row.path}
          defaultGroupingExpansionDepth={1}
          apiRef={apiRef}
          hideFooter
        />,
      );
      expect(grid().getAttribute("role")).toBe("treegrid");
      expect(rowEl("a").getAttribute("aria-expanded")).toBe("true");
      expect(rowEl("a").getAttribute("aria-level")).toBe("1");
      expect(rowEl("b").getAttribute("aria-level")).toBe("2");
      expect(rowEl("b").getAttribute("data-ok-parent")).toBe("a");
      expect(rowEl("c").hidden).toBe(true);
      expect(rowEl("a").querySelector("[data-ok-data-grid-tree-count]")?.textContent).toBe("(3)");
      const toggle = rowEl("b").querySelector("[data-ok-data-grid-tree-toggle]") as HTMLElement;
      expect(toggle.getAttribute("aria-label")).toBe("see children");
      await userEvent.click(toggle);
      expect(rowEl("c").hidden).toBe(false);
      expect(rowEl("c").getAttribute("aria-level")).toBe("3");
      // Keyboard: Left on an open row's group cell closes it.
      const groupCell = rowEl("a").querySelector(
        '[data-ok-field="__tree_data_group__"]',
      ) as HTMLElement;
      groupCell.focus();
      fireEvent.keyDown(groupCell, { key: "ArrowLeft" });
      expect(rowEl("b").hidden).toBe(true);
      act(() => apiRef.current?.setRowChildrenExpansion("a", true));
      expect(rowEl("b").hidden).toBe(false);
      act(() => apiRef.current?.setRowChildrenExpansion("nope", true));
      expect(header(/Group/)).toBeTruthy();
    });

    it("tree data: filters keep ancestors; siblings sort; default expansion and options", () => {
      const { rerender } = render(
        <DataGrid
          aria-label="Team"
          rows={TEAM}
          columns={TEAM_COLUMNS}
          treeData
          getTreeDataPath={(row) => row.path}
          defaultGroupingExpansionDepth={-1}
          filterModel={{ items: [{ field: "city", operator: "equals", value: "Lyon" }] }}
          groupingColDef={{ headerName: "Name", width: 180, hideDescendantCount: true }}
          hideFooter
        />,
      );
      const shown = () =>
        [...grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])')].map(
          (r) => r.getAttribute("data-ok-row-id"),
        );
      expect(shown()).toEqual(["a", "b", "c"]);
      expect(header(/Name/).getAttribute("data-ok-width")).toBe("180");
      expect(grid().querySelector("[data-ok-data-grid-tree-count]")).toBeNull();
      rerender(
        <DataGrid
          aria-label="Team"
          rows={TEAM}
          columns={TEAM_COLUMNS}
          treeData
          getTreeDataPath={(row) => row.path}
          isGroupExpandedByDefault={({ id }) => id === "a"}
          sortModel={[{ field: "city", sort: "desc" }]}
          hideFooter
        />,
      );
      expect(shown()).toEqual(["a", "d", "b", "e"]);
    });

    it("tree data from a server: children load when a row opens", async () => {
      interface Folder {
        id: string;
        name: string;
        size: number;
        children: number;
      }
      const getRows = vi.fn((params: GridGetRowsParams) =>
        Promise.resolve({
          rows: params.groupKeys?.length
            ? [{ id: "f-2", name: "Inside", size: 2, children: 0 }]
            : [{ id: "f-1", name: "Root", size: 1, children: 1 }],
        }),
      );
      const source: GridDataSource<Folder> = {
        getRows,
        getChildrenCount: (row) => row.children,
        getGroupKey: (row) => row.name,
      };
      render(
        <DataGrid
          aria-label="Files"
          rows={[]}
          columns={[{ field: "size", headerName: "Size", type: "number" }]}
          treeData
          dataSource={source}
          hideFooter
        />,
      );
      await act(settle);
      expect(rowEl("f-1").getAttribute("aria-expanded")).toBe("false");
      expect(rowEl("f-1").textContent).toContain("Root");
      await userEvent.click(
        rowEl("f-1").querySelector("[data-ok-data-grid-tree-toggle]") as Element,
      );
      await act(settle);
      expect(getRows).toHaveBeenLastCalledWith(expect.objectContaining({ groupKeys: ["Root"] }));
      expect(rowEl("f-2").getAttribute("data-ok-parent")).toBe("f-1");
      expect(rowEl("f-1").getAttribute("aria-expanded")).toBe("true");
      // Closing and opening again reuses the loaded children.
      await userEvent.click(
        rowEl("f-1").querySelector("[data-ok-data-grid-tree-toggle]") as Element,
      );
      await userEvent.click(
        rowEl("f-1").querySelector("[data-ok-data-grid-tree-toggle]") as Element,
      );
      expect(getRows).toHaveBeenCalledTimes(2);
    });

    it("tree data from a server: a failed children request reports the error", async () => {
      const onDataSourceError = vi.fn();
      const source: GridDataSource<{ id: string }> = {
        getRows: (params) =>
          params.groupKeys?.length
            ? Promise.reject(new Error("no"))
            : Promise.resolve({ rows: [{ id: "r" }] }),
        getChildrenCount: () => 1,
      };
      render(
        <DataGrid
          aria-label="Files"
          rows={[]}
          columns={[{ field: "id", headerName: "Id" }]}
          treeData
          dataSource={source}
          onDataSourceError={onDataSourceError}
          hideFooter
        />,
      );
      await act(settle);
      await userEvent.click(rowEl("r").querySelector("[data-ok-data-grid-tree-toggle]") as Element);
      await act(settle);
      expect(onDataSourceError).toHaveBeenCalledWith(new Error("no"));
    });

    it("master-detail: panels open under their rows", async () => {
      const onDetailPanelExpandedRowIdsChange = vi.fn();
      const apiRef = { current: null } as { current: GridApi<Row> | null };
      render(
        <DataGrid
          id="m"
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          apiRef={apiRef}
          getDetailPanelContent={({ row }) => (row.id === 2 ? null : <p>{`About ${row.name}`}</p>)}
          getDetailPanelHeight={({ row }) => (row.id === 1 ? 80 : "auto")}
          onDetailPanelExpandedRowIdsChange={onDetailPanelExpandedRowIdsChange}
        />,
      );
      expect(rowEl("2").querySelector("[data-ok-data-grid-detail-toggle]")).toBeNull();
      const toggle = rowEl("1").querySelector("[data-ok-data-grid-detail-toggle]") as HTMLElement;
      expect(toggle.getAttribute("aria-label")).toBe("Expand");
      await userEvent.click(toggle);
      expect(onDetailPanelExpandedRowIdsChange).toHaveBeenCalledWith(["1"]);
      const panel = rowEl("1").nextElementSibling as HTMLElement;
      expect(panel.getAttribute("data-ok-data-grid-detail")).toBe("");
      expect(panel.id).toBe("m-1-detail");
      expect(toggle.getAttribute("aria-controls")).toBe("m-1-detail");
      expect(panel.style.getPropertyValue("--_ok-data-grid-detail-height")).toBe("80px");
      expect(panel.textContent).toBe("About Ana");
      act(() => apiRef.current?.toggleDetailPanel("3"));
      expect(rowEl("3").nextElementSibling?.hasAttribute("data-ok-data-grid-detail")).toBe(true);
      expect(rowEl("3").nextElementSibling?.hasAttribute("data-ok-detail-height")).toBe(false);
      await userEvent.click(toggle);
      expect(rowEl("1").nextElementSibling?.hasAttribute("data-ok-data-grid-detail")).toBe(false);
      await expectNoAxeViolations();
    });

    it("master-detail with virtualization measures panels", async () => {
      const many = Array.from({ length: 200 }, (_, i) => ({ id: i, name: `P${i}`, age: i }));
      render(
        <DataGrid
          aria-label="Many"
          rows={many}
          columns={COLUMNS.slice(0, 2)}
          getDetailPanelContent={({ row }) => <div style={{ height: 100 }}>{row.name}</div>}
          detailPanelExpandedRowIds={["0", "5"]}
          hideFooter
          style={{ height: 300 }}
        />,
      );
      await act(settle);
      await act(async () => {
        grid().scrollTop = 4000;
        fireEvent.scroll(grid());
        await settle();
      });
      const first = Number(
        grid()
          .querySelector('[data-ok-data-grid-body] > [role="row"]')
          ?.getAttribute("aria-rowindex"),
      );
      expect(first).toBeGreaterThan(50);
    });

    it("row reordering: Alt + arrows on the handle; reported and announced; off while sorted", async () => {
      const onRowOrderChange = vi.fn();
      const { rerender } = render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          rowReordering
          onRowOrderChange={onRowOrderChange}
        />,
      );
      const handle = rowEl("1").querySelector("[data-ok-data-grid-reorder-handle]") as HTMLElement;
      expect(handle.getAttribute("aria-label")).toBe("Drag or press Alt + arrows to move the row");
      handle.focus();
      fireEvent.keyDown(handle, { key: "ArrowDown", altKey: true });
      expect(names()).toEqual(["Bao", "Ana", "Chloe", "Diego"]);
      expect(onRowOrderChange).toHaveBeenCalledWith({ row: ROWS[0], oldIndex: 0, targetIndex: 1 });
      expect(document.querySelector("[data-ok-data-grid-live]")?.textContent).toBe(
        "Row moved to position 2 of 4",
      );
      expect(document.activeElement).toBe(
        rowEl("1").querySelector("[data-ok-data-grid-reorder-handle]"),
      );
      rerender(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          rowReordering
          sortModel={[{ field: "name", sort: "asc" }]}
          onRowOrderChange={onRowOrderChange}
        />,
      );
      fireEvent.keyDown(rowEl("1").querySelector("[data-ok-data-grid-reorder-handle]") as Element, {
        key: "ArrowDown",
        altKey: true,
      });
      expect(onRowOrderChange).toHaveBeenCalledTimes(1);
    });

    it("pinned rows above and below; row indexes count them", () => {
      render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          checkboxSelection
          pinnedRows={{
            top: [{ id: 90, name: "Top", age: 1 }],
            bottom: [{ id: 91, name: "End", age: 2 }],
          }}
        />,
      );
      const top = grid().querySelector('[data-ok-data-grid-pinned-rows="top"] > [role="row"]');
      const bottom = grid().querySelector(
        '[data-ok-data-grid-pinned-rows="bottom"] > [role="row"]',
      );
      expect(top?.getAttribute("aria-rowindex")).toBe("2");
      expect(rowEl("1").getAttribute("aria-rowindex")).toBe("3");
      expect(bottom?.getAttribute("aria-rowindex")).toBe("7");
      expect(grid().getAttribute("aria-rowcount")).toBe("7");
      expect(top?.querySelector("input")).toBeNull();
      expect(top?.hasAttribute("aria-selected")).toBe(false);
    });

    it("keeps the header above pinned cells, pinned rows and controls while the body scrolls", () => {
      const many = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `P${i}`, age: i }));
      render(
        <div style={{ display: "flex", height: 360, width: 320 }}>
          <DataGrid
            aria-label="People"
            rows={many}
            columns={COLUMNS}
            checkboxSelection
            disableVirtualization
            pinnedColumns={{ left: ["name"], right: ["actions"] }}
            pinnedRows={{ top: [{ id: 90, name: "Top", age: 1 }] }}
            hideFooter
          />
        </div>,
      );
      const main = grid();
      const header = main.querySelector("[data-ok-data-grid-header]") as HTMLElement;
      const pinnedRows = main.querySelector("[data-ok-data-grid-pinned-rows]") as HTMLElement;
      const z = (element: Element) => Number(getComputedStyle(element).zIndex);
      const bodyPinned = main.querySelector(
        '[data-ok-data-grid-body] [role="gridcell"][data-ok-pinned]',
      ) as HTMLElement;
      // Header > pinned rows > pinned body cells; every body cell isolates its controls.
      expect(z(header)).toBeGreaterThan(z(pinnedRows));
      expect(z(pinnedRows)).toBeGreaterThan(z(bodyPinned));
      expect(getComputedStyle(bodyPinned).isolation).toBe("isolate");
      main.scrollTo(main.scrollWidth, 200);
      for (const cell of header.querySelectorAll<HTMLElement>('[role="columnheader"]')) {
        const r = cell.getBoundingClientRect();
        const box = main.getBoundingClientRect();
        const x = Math.min(r.left + r.width / 2, box.left + main.clientWidth - 2);
        if (x <= box.left) continue;
        expect(header.contains(document.elementFromPoint(x, r.top + r.height / 2))).toBe(true);
      }
      const topCell = pinnedRows.querySelector('[role="gridcell"]') as HTMLElement;
      const r = topCell.getBoundingClientRect();
      expect(
        pinnedRows.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)),
      ).toBe(true);
    });

    it("column groups: header rows, spans, descriptions; moves stay in groups", async () => {
      const onColumnOrderChange = vi.fn();
      render(
        <DataGrid
          id="g"
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          checkboxSelection
          onColumnOrderChange={onColumnOrderChange}
          pinnedColumns={{ left: ["name", "age"] }}
          columnGroupingModel={[
            {
              groupId: "who",
              headerName: "Who",
              description: "The person",
              children: [{ field: "name" }, { field: "age" }],
            },
          ]}
        />,
      );
      const groupRow = grid().querySelector("[data-ok-data-grid-group-row]") as HTMLElement;
      expect(groupRow.getAttribute("aria-rowindex")).toBe("1");
      const group = groupRow.querySelector('[data-ok-group-id="who"]') as HTMLElement;
      expect(group.getAttribute("aria-colspan")).toBe("2");
      expect(group.getAttribute("aria-colindex")).toBe("2");
      expect(group.getAttribute("data-ok-pinned")).toBe("left");
      expect(group.getAttribute("data-ok-pin-field")).toBe("name");
      expect(group.getAttribute("aria-describedby")).toBe("g-who-0-description");
      expect(groupRow.querySelectorAll("[data-ok-data-grid-group-filler]")).toHaveLength(3);
      expect(header(/^Name/).getAttribute("data-ok-group-path")).toBe('["who"]');
      expect(rowEl("1").getAttribute("aria-rowindex")).toBe("3");
      // Moving "label" (no group) next to "age" (in a group) is refused.
      fireEvent.click(header(/^Label/).querySelector("[data-ok-data-grid-menu-button]") as Element);
      await userEvent.click(screen.getByRole("menuitem", { name: "Move left" }));
      expect(onColumnOrderChange).not.toHaveBeenCalled();
    });

    it("list view: one cell per row, no headers", () => {
      const { rerender } = render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          listView
          listViewColumn={{ field: "name", renderCell: ({ row }) => <b>{row.name}</b> }}
        />,
      );
      expect((grid().querySelector("[data-ok-data-grid-header]") as HTMLElement).hidden).toBe(true);
      const list = rowEl("1").querySelector("[data-ok-data-grid-list-cell]") as HTMLElement;
      expect(list.hidden).toBe(false);
      expect(list.querySelector("b")?.textContent).toBe("Ana");
      expect((rowEl("1").querySelector('[data-ok-field="name"]') as HTMLElement).hidden).toBe(true);
      rerender(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          listViewColumn={{ field: "name" }}
        />,
      );
      expect(
        (rowEl("1").querySelector("[data-ok-data-grid-list-cell]") as HTMLElement).hidden,
      ).toBe(true);
      expect(rowEl("1").querySelector("[data-ok-data-grid-list-cell]")?.textContent).toBe("Ana");
    });

    it("column virtualization: wide grids render the columns in view; spacer tracks", async () => {
      const wide = Array.from({ length: 30 }, (_, i) => ({
        field: `c${i}`,
        headerName: `C${i}`,
        width: 100,
      }));
      const row = Object.fromEntries([["id", 1], ...wide.map((c, i) => [c.field, i])]);
      render(
        <DataGrid
          aria-label="Wide"
          rows={[row]}
          columns={wide}
          pinnedColumns={{ left: ["c0"], right: ["c29"] }}
          columnBufferPx={0}
          hideFooter
          style={{ width: 500 }}
        />,
      );
      await act(settle);
      const headersNow = () =>
        [...grid().querySelectorAll('[role="columnheader"]')].map((h) =>
          h.getAttribute("data-ok-field"),
        );
      expect(headersNow().length).toBeLessThan(10);
      expect(headersNow()).toContain("c29");
      const first = grid().querySelector('[role="columnheader"][data-ok-col-start]') as HTMLElement;
      expect(first.getAttribute("data-ok-field")).toBe("c1");
      expect(first.style.getPropertyValue("--_ok-data-grid-col-start")).toBe("3");
      expect(grid().style.getPropertyValue("--_ok-data-grid-columns")).toMatch(/^100px 0px 100px/);
      await act(async () => {
        grid().scrollLeft = 1500;
        fireEvent.scroll(grid());
        await settle();
      });
      expect(headersNow()).toContain("c16");
      expect(headersNow()).not.toContain("c1");
    });

    it("lazy loading: chunks in view load; placeholders; a new sort starts again", async () => {
      const getRows = vi.fn((params: GridGetRowsParams) =>
        Promise.resolve({
          rows: Array.from({ length: (params.end ?? 0) - (params.start ?? 0) }, (_, i) => ({
            id: (params.start ?? 0) + i,
            name: `R${(params.start ?? 0) + i}`,
            age: i,
          })),
          rowCount: 500,
        }),
      );
      const onDataSourceError = vi.fn();
      const props = {
        "aria-label": "Lazy",
        rows: [] as Row[],
        columns: COLUMNS.slice(0, 2),
        lazyLoading: true,
        lazyLoadingRequestThrottleMs: 0,
        hideFooter: true,
        onDataSourceError,
        style: { height: 300 },
      };
      const { rerender } = render(
        <DataGrid {...props} dataSource={{ getRows }} rowBufferPx={50} />,
      );
      await act(settle);
      await act(settle);
      expect(getRows).toHaveBeenCalledWith(expect.objectContaining({ start: 0, end: 50 }));
      expect(grid().getAttribute("aria-rowcount")).toBe("501");
      expect(names()[0]).toBe("R0");
      await act(async () => {
        grid().scrollTop = 53 * 300;
        fireEvent.scroll(grid());
        await settle();
      });
      await act(settle);
      await act(settle);
      expect(getRows).toHaveBeenCalledWith(expect.objectContaining({ start: 250 }));
      expect(grid().closest("[data-ok-data-grid]")?.getAttribute("data-ok-row-buffer-px")).toBe(
        "50",
      );
      rerender(
        <DataGrid
          {...props}
          dataSource={{ getRows }}
          sortModel={[{ field: "name", sort: "desc" }]}
        />,
      );
      await act(settle);
      await act(settle);
      expect(getRows).toHaveBeenLastCalledWith(
        expect.objectContaining({ sortModel: [{ field: "name", sort: "desc" }] }),
      );
      rerender(
        <DataGrid {...props} dataSource={{ getRows: () => Promise.reject(new Error("lazy")) }} />,
      );
      await act(settle);
      await act(settle);
      expect(onDataSourceError).toHaveBeenCalledWith(new Error("lazy"));
      expect(
        grid().querySelector("[data-ok-loading-row] [data-ok-data-grid-skeleton]"),
      ).not.toBeNull();
    });

    it("special columns in placeholders and group rows; tree data without paths", async () => {
      const { unmount } = render(
        <DataGrid
          aria-label="Lazy"
          rows={[]}
          columns={COLUMNS.slice(0, 2)}
          checkboxSelection
          lazyLoading
          dataSource={{ getRows: () => new Promise<never>(() => {}) }}
          rowCount={20}
          hideFooter
          style={{ height: 300 }}
        />,
      );
      await act(settle);
      expect(
        grid().querySelector('[data-ok-loading-row] [data-ok-field="__check__"]'),
      ).not.toBeNull();
      unmount();
      const grouped = render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          checkboxSelection
          columnGroupingModel={[
            { groupId: "who", children: [{ field: "name" }, { field: "age" }] },
          ]}
        />,
      );
      const groupRow = grid().querySelector("[data-ok-data-grid-group-row]") as HTMLElement;
      expect(groupRow.firstElementChild?.hasAttribute("data-ok-data-grid-group-filler")).toBe(true);
      expect(groupRow.querySelector('[role="columnheader"]')?.hasAttribute("data-ok-pinned")).toBe(
        false,
      );
      grouped.unmount();
      render(<DataGrid aria-label="Team" rows={TEAM} columns={TEAM_COLUMNS} treeData hideFooter />);
      expect(rowEl("a").getAttribute("aria-level")).toBe("1");
      expect(rowEl("c").getAttribute("aria-level")).toBe("1");
    });

    it("data sources save edits (updateRow); a refused save brings the row back", async () => {
      const onDataSourceError = vi.fn();
      let fail = false;
      const updateRow = vi.fn(({ updatedRow }: { updatedRow: Row }) =>
        fail
          ? Promise.reject(new Error("save"))
          : Promise.resolve({ ...updatedRow, name: `${updatedRow.name}!` }),
      );
      render(
        <DataGrid
          aria-label="People"
          rows={[]}
          columns={[{ field: "name", headerName: "Name", editable: true }]}
          dataSource={{ getRows: () => Promise.resolve({ rows: ROWS }), updateRow }}
          onDataSourceError={onDataSourceError}
        />,
      );
      await act(settle);
      const cell = () => rowEl("1").querySelector('[data-ok-field="name"]') as HTMLElement;
      await userEvent.dblClick(cell());
      await userEvent.type(screen.getByRole("textbox", { name: "Edit Name" }), "x{Enter}");
      await act(settle);
      expect(updateRow).toHaveBeenCalledWith(
        expect.objectContaining({ rowId: "1", previousRow: ROWS[0] }),
      );
      expect(cell().textContent).toBe("Anax!");
      fail = true;
      await userEvent.dblClick(cell());
      await userEvent.type(screen.getByRole("textbox", { name: "Edit Name" }), "y{Enter}");
      await act(settle);
      await act(settle);
      expect(onDataSourceError).toHaveBeenCalledWith(new Error("save"));
    });

    it("CSV and print options are written for HTML; SSR of the new parts", () => {
      render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          csvOptions={{ delimiter: ";", fileName: "x" }}
          printOptions={{ hideFooter: false }}
          defaultGroupingExpansionDepth={2}
          columnBufferPx={10}
          lazyLoadingRequestThrottleMs={20}
        />,
      );
      const root = grid().closest("[data-ok-data-grid]") as HTMLElement;
      expect(JSON.parse(root.getAttribute("data-ok-csv-options") as string)).toEqual({
        delimiter: ";",
        fileName: "x",
      });
      expect(root.getAttribute("data-ok-print-options")).toBe('{"hideFooter":false}');
      expect(root.getAttribute("data-ok-column-buffer-px")).toBe("10");
      const html = renderToString(
        <DataGrid
          aria-label="Team"
          rows={TEAM}
          columns={TEAM_COLUMNS}
          treeData
          getTreeDataPath={(row) => row.path}
          rowReordering
          getDetailPanelContent={() => "x"}
          pinnedRows={{ top: [TEAM[0] as Member] }}
        />,
      );
      expect(html).toContain('role="treegrid"');
    });
  });

  describe("sorting options", () => {
    it("follows the grid's and a column's sortingOrder; always adds columns", async () => {
      const onSortModelChange = vi.fn();
      const columns: GridColDef<Row>[] = [
        { field: "name", headerName: "Name", sortingOrder: ["desc", null] },
        { field: "age", headerName: "Age", type: "number" },
      ];
      render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={columns}
          sortingOrder={["desc", "asc"]}
          multipleColumnsSortingMode="always"
          onSortModelChange={onSortModelChange}
        />,
      );
      const root = grid().closest("[data-ok-data-grid]") as HTMLElement;
      expect(root.getAttribute("data-ok-sorting-order")).toBe('["desc","asc"]');
      expect(root.getAttribute("data-ok-multiple-columns-sorting-mode")).toBe("always");
      expect(header(/Name/).getAttribute("data-ok-sorting-order")).toBe('["desc",null]');
      expect(header(/Age/).hasAttribute("data-ok-sorting-order")).toBe(false);
      fireEvent.click(header(/Age/));
      expect(names()).toEqual(["Diego", "Ana", "Bao", "Chloe"]);
      fireEvent.click(header(/Age/));
      expect(header(/Age/).getAttribute("aria-sort")).toBe("ascending");
      // The grid's cycle has no null: asc goes back to desc.
      fireEvent.click(header(/Age/));
      expect(header(/Age/).getAttribute("aria-sort")).toBe("descending");
      // "always": a click without Shift adds the column.
      fireEvent.click(header(/Name/));
      expect(onSortModelChange).toHaveBeenLastCalledWith([
        { field: "age", sort: "desc" },
        { field: "name", sort: "desc" },
      ]);
      fireEvent.click(header(/Name/));
      expect(onSortModelChange).toHaveBeenLastCalledWith([{ field: "age", sort: "desc" }]);
    });

    it("hides the column menu's sort items outside the cycle", async () => {
      render(
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={[{ field: "name", headerName: "Name", sortingOrder: ["asc"] }]}
        />,
      );
      await userEvent.hover(header(/Name/));
      await userEvent.click(screen.getByRole("button", { name: "Name column menu" }));
      expect(screen.getByRole("menuitem", { name: "Sort by ASC" })).toBeTruthy();
      expect(screen.queryByRole("menuitem", { name: "Sort by DESC" })).toBeNull();
      expect(screen.queryByRole("menuitem", { name: "Unsort" })).toBeNull();
    });

    it("sorts with sortComparator and getSortComparator (cell params)", () => {
      const params: unknown[] = [];
      const columns: GridColDef<Row>[] = [
        {
          field: "name",
          headerName: "Name",
          // By length, then by name.
          sortComparator: (a, b, p1) => {
            params.push(p1);
            return String(a).length - String(b).length || String(a).localeCompare(String(b));
          },
        },
        {
          field: "age",
          headerName: "Age",
          type: "number",
          // Empty ages last in both directions.
          getSortComparator: (direction) => (a, b) =>
            a === null
              ? 1
              : b === null
                ? -1
                : direction === "asc"
                  ? Number(a) - Number(b)
                  : Number(b) - Number(a),
        },
      ];
      render(<DataGrid aria-label="People" rows={ROWS} columns={columns} />);
      fireEvent.click(header(/Name/));
      expect(names()).toEqual(["Ana", "Bao", "Chloe", "Diego"]);
      expect(params[0]).toMatchObject({ field: "name", row: expect.any(Object) });
      fireEvent.click(header(/Name/));
      expect(names()).toEqual(["Diego", "Chloe", "Bao", "Ana"]);
      fireEvent.click(header(/Age/));
      expect(names()).toEqual(["Bao", "Ana", "Diego", "Chloe"]);
      fireEvent.click(header(/Age/));
      expect(names()).toEqual(["Diego", "Ana", "Bao", "Chloe"]);
    });
  });

  describe("custom editors and edit modes", () => {
    interface Item {
      id: number;
      name: string;
      qty: number;
    }
    const ITEMS: Item[] = [
      { id: 1, name: "Bolt", qty: 4 },
      { id: 2, name: "Nut", qty: 9 },
    ];
    const cellOf = (rowId: string, field: string) =>
      grid().querySelector(`[data-ok-row-id="${rowId}"] [data-ok-field="${field}"]`) as HTMLElement;
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    /** A slider editor that sets its value through the API. */
    const QTY_SLIDER: GridColDef<Item> = {
      field: "qty",
      headerName: "Qty",
      type: "number",
      editable: true,
      renderEditCell: ({ id, field, value, error, api }) => (
        <span>
          <input
            type="range"
            aria-label="Quantity"
            min={0}
            max={20}
            value={Number(value)}
            onChange={(event) =>
              api.setEditCellValue({ id, field, value: Number(event.target.value) })
            }
          />
          <button type="button">Reset</button>
          {error ? <span>Invalid</span> : null}
        </span>
      ),
      preProcessEditCellProps: ({ props }) => ({ error: Number(props.value) > 15 }),
    };

    it("renderEditCell: a custom editor sets the value, keys and focus leaving end it", async () => {
      const processRowUpdate = vi.fn((row: Item) => row);
      render(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={[{ field: "name", headerName: "Name", editable: true }, QTY_SLIDER]}
          processRowUpdate={processRowUpdate}
        />,
      );
      await userEvent.dblClick(cellOf("1", "qty"));
      const slider = screen.getByRole("slider", { name: "Quantity" }) as HTMLInputElement;
      expect(document.activeElement).toBe(slider);
      expect(cellOf("1", "qty").hasAttribute("data-ok-editing")).toBe(true);
      fireEvent.change(slider, { target: { value: "18" } });
      expect(cellOf("1", "qty").textContent).toContain("Invalid");
      // An invalid value keeps the cell open; moving inside the cell keeps it too.
      fireEvent.keyDown(slider, { key: "Enter" });
      expect(cellOf("1", "qty").hasAttribute("data-ok-editing")).toBe(true);
      act(() => (within(cellOf("1", "qty")).getByRole("button") as HTMLElement).focus());
      expect(cellOf("1", "qty").hasAttribute("data-ok-editing")).toBe(true);
      fireEvent.change(slider, { target: { value: "12" } });
      fireEvent.keyDown(slider, { key: "Enter" });
      await act(settle);
      expect(processRowUpdate).toHaveBeenLastCalledWith({ id: 1, name: "Bolt", qty: 12 }, ITEMS[0]);
      expect(cellOf("1", "qty").textContent).toBe("12");
      // Escape cancels; leaving the cell saves.
      await userEvent.dblClick(cellOf("2", "qty"));
      fireEvent.change(screen.getByRole("slider"), { target: { value: "3" } });
      fireEvent.keyDown(screen.getByRole("slider"), { key: "Escape" });
      expect(cellOf("2", "qty").textContent).toBe("9");
      await userEvent.dblClick(cellOf("2", "qty"));
      fireEvent.change(screen.getByRole("slider"), { target: { value: "5" } });
      act(() => cellOf("1", "name").focus());
      await act(settle);
      expect(cellOf("2", "qty").textContent).toBe("5");
    });

    it("cellModesModel: controlled starts and stops; ignoreModifications cancels", async () => {
      const onCellModesModelChange = vi.fn();
      const processRowUpdate = vi.fn((row: Item) => row);
      const columns: GridColDef<Item>[] = [
        { field: "name", headerName: "Name", editable: true },
        { field: "qty", headerName: "Qty", type: "number", editable: true },
      ];
      const view = (model: Record<string, Record<string, { mode: "edit" | "view" }>>) => (
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={columns}
          cellModesModel={model}
          onCellModesModelChange={onCellModesModelChange}
          processRowUpdate={processRowUpdate}
        />
      );
      const { rerender } = render(view({}));
      // A double click asks; the cell opens only when the model says so.
      await userEvent.dblClick(cellOf("1", "name"));
      expect(onCellModesModelChange).toHaveBeenLastCalledWith({ "1": { name: { mode: "edit" } } });
      expect(cellOf("1", "name").hasAttribute("data-ok-editing")).toBe(false);
      rerender(view({ "1": { name: { mode: "edit" } } }));
      const input = screen.getByRole("textbox", { name: "Edit Name" }) as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, "Screw");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onCellModesModelChange).toHaveBeenLastCalledWith({ "1": { name: { mode: "view" } } });
      expect(cellOf("1", "name").hasAttribute("data-ok-editing")).toBe(true);
      rerender(view({ "1": { name: { mode: "view" } } }));
      await act(settle);
      expect(processRowUpdate).toHaveBeenLastCalledWith({ id: 1, name: "Screw", qty: 4 }, ITEMS[0]);
      // Escape reports ignoreModifications; the model's cancel drops the edit.
      rerender(view({ "2": { qty: { mode: "edit" } } }));
      const qty = screen.getByRole("spinbutton", { name: "Edit Qty" }) as HTMLInputElement;
      fireEvent.change(qty, { target: { value: "1" } });
      fireEvent.keyDown(qty, { key: "Escape" });
      expect(onCellModesModelChange).toHaveBeenLastCalledWith({
        "2": { qty: { mode: "view", ignoreModifications: true } },
      });
      rerender(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={columns}
          cellModesModel={{ "2": { qty: { mode: "view", ignoreModifications: true } } }}
          processRowUpdate={processRowUpdate}
        />,
      );
      expect(cellOf("2", "qty").textContent).toBe("9");
      expect(processRowUpdate).toHaveBeenCalledTimes(1);
    });

    it("rowModesModel and the API's edit methods (uncontrolled)", async () => {
      const onRowModesModelChange = vi.fn();
      const onCellModesModelChange = vi.fn();
      const processRowUpdate = vi.fn((row: Item) => row);
      const columns: GridColDef<Item>[] = [
        { field: "name", headerName: "Name", editable: true },
        { field: "qty", headerName: "Qty", type: "number", editable: true },
      ];
      const apiRef = createRef<GridApi<Item> | null>() as { current: GridApi<Item> | null };
      const { rerender } = render(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={columns}
          apiRef={apiRef}
          onCellModesModelChange={onCellModesModelChange}
          processRowUpdate={processRowUpdate}
        />,
      );
      const api = () => apiRef.current as GridApi<Item>;
      act(() => api().startCellEditMode({ id: "2", field: "qty" }));
      expect(onCellModesModelChange).toHaveBeenLastCalledWith({ "2": { qty: { mode: "edit" } } });
      expect(api().getCellModesModel()).toEqual({ "2": { qty: { mode: "edit" } } });
      act(() => api().setEditCellValue({ id: "2", field: "qty", value: 7 }));
      expect((screen.getByRole("spinbutton") as HTMLInputElement).value).toBe("7");
      // Another cell's value is ignored.
      act(() => api().setEditCellValue({ id: "1", field: "qty", value: 1 }));
      act(() => api().stopCellEditMode({ id: "2", field: "qty" }));
      await act(settle);
      expect(processRowUpdate).toHaveBeenLastCalledWith({ id: 2, name: "Nut", qty: 7 }, ITEMS[1]);
      expect(api().getCellModesModel()).toEqual({});
      act(() => api().startCellEditMode({ id: "1", field: "name" }));
      act(() => api().stopCellEditMode({ id: "1", field: "name", ignoreModifications: true }));
      expect(processRowUpdate).toHaveBeenCalledTimes(1);
      // Row mode, controlled: fieldToFocus.
      rerender(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          columns={columns}
          editMode="row"
          apiRef={apiRef}
          rowModesModel={{ "1": { mode: "edit", fieldToFocus: "qty" } }}
          onRowModesModelChange={onRowModesModelChange}
          processRowUpdate={processRowUpdate}
        />,
      );
      expect(grid().querySelector('[data-ok-row-id="1"]')?.hasAttribute("data-ok-editing")).toBe(
        true,
      );
      expect(document.activeElement).toBe(screen.getByRole("spinbutton", { name: "Edit Qty" }));
      expect(api().getRowModesModel()).toEqual({ "1": { mode: "edit", fieldToFocus: "qty" } });
      act(() => api().stopRowEditMode({ id: "1" }));
      expect(onRowModesModelChange).toHaveBeenLastCalledWith({ "1": { mode: "view" } });
      act(() => api().startRowEditMode({ id: "2" }));
      expect(onRowModesModelChange).toHaveBeenLastCalledWith({
        "2": { mode: "edit", fieldToFocus: "name" },
      });
    });

    it("renderHeaderFilter: a custom field applies the column's filter item", async () => {
      const onFilterModelChange = vi.fn();
      render(
        <DataGrid
          aria-label="Items"
          rows={ITEMS}
          headerFilters
          onFilterModelChange={onFilterModelChange}
          columns={[
            { field: "name", headerName: "Name" },
            {
              field: "qty",
              headerName: "Qty",
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
      expect(field.closest("[data-ok-data-grid-header-filter]")).not.toBeNull();
      fireEvent.change(field, { target: { value: "5" } });
      expect(onFilterModelChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ items: [{ field: "qty", operator: ">=", value: "5" }] }),
      );
      expect(names()).toEqual(["Nut"]);
      fireEvent.change(field, { target: { value: "" } });
      expect(onFilterModelChange).toHaveBeenLastCalledWith(expect.objectContaining({ items: [] }));
      await expectNoAxeViolations(document.body);
    });
  });
});
