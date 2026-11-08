import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { DataGrid, type GridColDef } from "./data-grid.js";

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
});
