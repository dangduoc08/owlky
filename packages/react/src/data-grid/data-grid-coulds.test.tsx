import type { GridDataSource } from "@owlky/core";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { DataGrid, type GridApi, type GridColDef } from "./data-grid.js";

// Roadmap batch E (Data grid coulds, 4.18.55–4.18.58).

interface Row {
  id: number;
  name: string;
  age: number;
}
const ROWS: Row[] = Array.from({ length: 8 }, (_, i) => ({
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
const header = (field: string) =>
  grid().querySelector(`[role="columnheader"][data-ok-field="${field}"]`) as HTMLElement;
const cell = (id: number, field: string) =>
  grid().querySelector(`[data-ok-row-id="${id}"] [data-ok-field="${field}"]`) as HTMLElement;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const paste = async (target: HTMLElement, text: string) => {
  target.focus();
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: "v", ctrlKey: true, bubbles: true, cancelable: true }),
  );
  const area = document.activeElement as HTMLElement;
  const transfer = new DataTransfer();
  transfer.setData("text/plain", text);
  const read = vi.spyOn(DataTransfer.prototype, "getData").mockReturnValue(text);
  await act(async () => {
    area.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }),
    );
    await tick();
  });
  read.mockRestore();
};

describe("DataGrid events (4.18.55)", () => {
  it("reports double clicks, right clicks and the pointer on column headers", () => {
    const handlers = {
      onColumnHeaderDoubleClick: vi.fn(),
      onColumnHeaderContextMenu: vi.fn(),
      onColumnHeaderEnter: vi.fn(),
      onColumnHeaderLeave: vi.fn(),
      onColumnHeaderOver: vi.fn(),
      onColumnHeaderOut: vi.fn(),
    };
    render(<DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} {...handlers} />);
    const name = header("name");
    fireEvent.doubleClick(name);
    expect(handlers.onColumnHeaderDoubleClick.mock.calls[0]?.[0].field).toBe("name");
    fireEvent.contextMenu(name);
    expect(handlers.onColumnHeaderContextMenu.mock.calls[0]?.[0].colDef.headerName).toBe("Name");
    // Testing Library sends mouseover / mouseout with these, as React derives them.
    fireEvent.mouseEnter(name);
    fireEvent.mouseLeave(name);
    expect(handlers.onColumnHeaderEnter).toHaveBeenCalledOnce();
    expect(handlers.onColumnHeaderOver).toHaveBeenCalledOnce();
    expect(handlers.onColumnHeaderOut).toHaveBeenCalledOnce();
    expect(handlers.onColumnHeaderLeave).toHaveBeenCalledOnce();
    // The header's controls have double clicks of their own.
    handlers.onColumnHeaderDoubleClick.mockClear();
    fireEvent.doubleClick(name.querySelector("[data-ok-data-grid-resize]") as Element);
    fireEvent.doubleClick(name.querySelector("button") as Element);
    expect(handlers.onColumnHeaderDoubleClick).not.toHaveBeenCalled();
  });

  it("reports menus and preference panels opening and closing", async () => {
    const onMenuOpen = vi.fn();
    const onMenuClose = vi.fn();
    const onPreferencePanelOpen = vi.fn();
    const onPreferencePanelClose = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        showToolbar
        rows={ROWS}
        columns={COLUMNS}
        onMenuOpen={onMenuOpen}
        onMenuClose={onMenuClose}
        onPreferencePanelOpen={onPreferencePanelOpen}
        onPreferencePanelClose={onPreferencePanelClose}
      />,
    );
    const density = screen.getByRole("button", { name: "Density" });
    await userEvent.click(density);
    expect(onMenuOpen).toHaveBeenCalledExactlyOnceWith({ menu: "density", target: density });
    await userEvent.keyboard("{Escape}");
    expect(onMenuClose).toHaveBeenCalledExactlyOnceWith({ menu: "density", target: density });
    await userEvent.click(screen.getByRole("button", { name: "Columns" }));
    expect(onPreferencePanelOpen).toHaveBeenCalledExactlyOnceWith({ openedPanelValue: "columns" });
    await userEvent.keyboard("{Escape}");
    expect(onPreferencePanelClose).toHaveBeenCalledExactlyOnceWith({
      openedPanelValue: "columns",
    });
    onMenuOpen.mockClear();
    const button = header("name").querySelector("button") as HTMLElement;
    await act(async () => button.click());
    expect(onMenuOpen).toHaveBeenCalledExactlyOnceWith({ menu: "column", target: button });
  });

  it("reports the pivot panel as a sidebar", async () => {
    const onSidebarOpen = vi.fn();
    const onSidebarClose = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        showToolbar
        rows={ROWS}
        columns={COLUMNS}
        pivotModel={{ rows: [], columns: [], values: [] }}
        onSidebarOpen={onSidebarOpen}
        onSidebarClose={onSidebarClose}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Pivot" }));
    expect(onSidebarOpen).toHaveBeenCalledExactlyOnceWith({ value: "pivot" });
    await userEvent.keyboard("{Escape}");
    expect(onSidebarClose).toHaveBeenCalledExactlyOnceWith({ value: "pivot" });
  });

  it("reports the grid's own size", async () => {
    const onResize = vi.fn();
    const { container, rerender } = render(
      <div style={{ width: 400 }}>
        <DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} onResize={onResize} />
      </div>,
    );
    await vi.waitUntil(() => onResize.mock.calls.length > 0);
    expect(onResize.mock.lastCall?.[0].width).toBe(400);
    rerender(
      <div style={{ width: 300 }}>
        <DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} onResize={onResize} />
      </div>,
    );
    await vi.waitUntil(() => onResize.mock.lastCall?.[0].width === 300);
    expect(container.firstElementChild).not.toBeNull();
  });

  it("reports each width while a column's edge is dragged", () => {
    const onColumnResize = vi.fn();
    const onColumnWidthChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        onColumnResize={onColumnResize}
        onColumnWidthChange={onColumnWidthChange}
      />,
    );
    const handle = header("name").querySelector("[data-ok-data-grid-resize]") as HTMLElement;
    act(() => {
      handle.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, clientX: 100, button: 0 }),
      );
      document.dispatchEvent(new PointerEvent("pointermove", { clientX: 120 }));
      document.dispatchEvent(new PointerEvent("pointermove", { clientX: 130 }));
    });
    expect(onColumnResize.mock.calls.map((call) => call[1])).toEqual([160, 170]);
    expect(onColumnWidthChange).not.toHaveBeenCalled();
    act(() => {
      document.dispatchEvent(new PointerEvent("pointerup", { clientX: 130 }));
    });
    expect(onColumnWidthChange).toHaveBeenCalledExactlyOnceWith("name", 170);
  });

  it("asks for rows when the rendered window moves and rowCount exceeds the rows", async () => {
    const onFetchRows = vi.fn();
    const many = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `P${i}`,
      age: i,
    }));
    render(
      <DataGrid
        aria-label="People"
        rows={many}
        columns={COLUMNS}
        rowCount={1000}
        hideFooter
        onFetchRows={onFetchRows}
        style={{ height: 300 }}
      />,
    );
    await vi.waitUntil(() => onFetchRows.mock.calls.length > 0);
    expect(onFetchRows.mock.lastCall?.[0]).toMatchObject({
      firstRowToRender: 0,
      sortModel: [],
      filterModel: { items: [] },
    });
    const calls = onFetchRows.mock.calls.length;
    await act(async () => {
      grid().scrollTop = 2000;
      grid().dispatchEvent(new Event("scroll"));
      await tick();
    });
    await vi.waitUntil(() => onFetchRows.mock.calls.length > calls);
    const { firstRowToRender, lastRowToRender } = (onFetchRows.mock.lastCall as unknown[])[0] as {
      firstRowToRender: number;
      lastRowToRender: number;
    };
    expect(firstRowToRender).toBeGreaterThan(0);
    expect(lastRowToRender).toBeGreaterThan(firstRowToRender);
  });

  it("doesn't ask for rows when every row is there", async () => {
    const onFetchRows = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        rowCount={ROWS.length}
        onFetchRows={onFetchRows}
        style={{ height: 300 }}
      />,
    );
    await act(tick);
    expect(onFetchRows).not.toHaveBeenCalled();
  });

  it("reports an Excel export's state around the download", () => {
    const states: string[] = [];
    const apiRef = { current: null as GridApi<Row> | null };
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      states.push("download");
    });
    render(
      <DataGrid
        aria-label="People"
        apiRef={apiRef}
        rows={ROWS}
        columns={COLUMNS}
        onExcelExportStateChange={(state) => states.push(state)}
      />,
    );
    apiRef.current?.exportDataAsExcel();
    expect(click).toHaveBeenCalledOnce();
    expect(states).toEqual(["pending", "download", "finished"]);
  });

  it("onBeforeClipboardPasteStart waits for its promise and cancels on a rejection", async () => {
    const processRowUpdate = vi.fn((row: Row) => row);
    const before = vi.fn((_params: { data: string[][] }): unknown => undefined);
    render(
      <DataGrid
        aria-label="People"
        disableVirtualization
        rows={ROWS}
        columns={COLUMNS}
        processRowUpdate={processRowUpdate}
        onBeforeClipboardPasteStart={before}
        hideFooter
      />,
    );
    await paste(cell(1, "name"), "Ann");
    expect(before).toHaveBeenCalledExactlyOnceWith({ data: [["Ann"]] });
    expect(processRowUpdate.mock.calls[0]?.[0].name).toBe("Ann");

    processRowUpdate.mockClear();
    before.mockImplementation(() => {
      throw new Error("no");
    });
    await paste(cell(2, "name"), "Bob");
    expect(processRowUpdate).not.toHaveBeenCalled();

    before.mockImplementation(() => Promise.reject(new Error("no")));
    await paste(cell(2, "name"), "Bob");
    expect(processRowUpdate).not.toHaveBeenCalled();

    // A confirmation may take the focus away: the paste still lands on the original cell.
    let confirm: () => void = () => {};
    before.mockImplementation(() => new Promise<void>((resolve) => (confirm = resolve)));
    await paste(cell(3, "name"), "Cid");
    expect(processRowUpdate).not.toHaveBeenCalled();
    screen.getByRole("grid").focus();
    await act(async () => {
      confirm();
      await tick();
    });
    expect(processRowUpdate.mock.calls[0]?.[0]).toMatchObject({ id: 3, name: "Cid" });
    await expectNoAxeViolations(document.body);
  });
});

describe("DataGrid server options (4.18.56)", () => {
  const page = () => document.querySelector("[data-ok-table-pagination-displayed]")?.textContent;
  const next = () => screen.getByRole("button", { name: "Go to next page" }) as HTMLButtonElement;
  const five = ROWS.slice(0, 5);

  it("rowCount -1: an unknown total until the server says the last page", () => {
    const { rerender } = render(
      <DataGrid
        aria-label="People"
        rows={five}
        columns={COLUMNS}
        paginationMode="server"
        rowCount={-1}
        pageSizeOptions={[5]}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
        paginationMeta={{ hasNextPage: true }}
      />,
    );
    expect(page()).toBe("1–5 of more than 5");
    expect(grid().getAttribute("aria-rowcount")).toBe("-1");
    expect(next().disabled).toBe(false);
    expect(
      document.querySelector("[data-ok-data-grid]")?.getAttribute("data-ok-has-next-page"),
    ).toBe("true");
    rerender(
      <DataGrid
        aria-label="People"
        rows={five}
        columns={COLUMNS}
        paginationMode="server"
        rowCount={-1}
        pageSizeOptions={[5]}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
        paginationMeta={{ hasNextPage: false }}
      />,
    );
    expect(page()).toBe("1–5 of 5");
    expect(next().disabled).toBe(true);
    expect(grid().getAttribute("aria-rowcount")).toBe("6");
  });

  it("estimatedRowCount shows while the page is before it", () => {
    const { rerender } = render(
      <DataGrid
        aria-label="People"
        rows={five}
        columns={COLUMNS}
        paginationMode="server"
        rowCount={-1}
        estimatedRowCount={100}
        pageSizeOptions={[5]}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
      />,
    );
    expect(page()).toBe("1–5 of around 100");
    rerender(
      <DataGrid
        aria-label="People"
        rows={five}
        columns={COLUMNS}
        paginationMode="server"
        rowCount={-1}
        estimatedRowCount={3}
        pageSizeOptions={[5]}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
      />,
    );
    expect(page()).toBe("1–5 of more than 5");
  });

  it("onRowCountChange reports a new count, not the first one", () => {
    const onRowCountChange = vi.fn();
    const base = {
      "aria-label": "People",
      rows: ROWS,
      columns: COLUMNS,
      paginationMode: "server" as const,
      onRowCountChange,
    };
    const { rerender } = render(<DataGrid {...base} rowCount={20} />);
    expect(onRowCountChange).not.toHaveBeenCalled();
    rerender(<DataGrid {...base} rowCount={40} />);
    expect(onRowCountChange).toHaveBeenCalledExactlyOnceWith(40);
  });

  it("reads pageInfo from a data source and reports it", async () => {
    const onPaginationMetaChange = vi.fn();
    const dataSource: GridDataSource<Row> = {
      getRows: async () => ({ rows: five, pageInfo: { hasNextPage: false } }),
    };
    render(
      <DataGrid
        aria-label="People"
        columns={COLUMNS}
        rows={[]}
        dataSource={dataSource}
        pageSizeOptions={[5]}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
        onPaginationMetaChange={onPaginationMetaChange}
      />,
    );
    await act(tick);
    await act(tick);
    expect(onPaginationMetaChange).toHaveBeenCalledExactlyOnceWith({ hasNextPage: false });
    expect(page()).toBe("1–5 of 5");
  });

  it("hides the rows while a data source loads, unless asked to keep them", async () => {
    const pending: ((rows: Row[]) => void)[] = [];
    const dataSource: GridDataSource<Row> = {
      getRows: () =>
        new Promise((resolve) => pending.push((rows) => resolve({ rows, rowCount: 8 }))),
    };
    const shown = () => grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]').length;
    const sort = () => act(async () => fireEvent.click(header("name")));
    const settle = async (index: number, rows: Row[]) => {
      await act(async () => {
        pending[index]?.(rows);
        await tick();
      });
    };
    const props = {
      "aria-label": "People",
      columns: COLUMNS,
      rows: [] as Row[],
      dataSource,
      dataSourceCache: null,
    };
    const { rerender } = render(<DataGrid {...props} />);
    await settle(0, five);
    expect(shown()).toBe(5);
    await sort();
    expect(grid().getAttribute("aria-busy")).toBe("true");
    expect(shown()).toBe(0);
    await settle(1, five);
    expect(shown()).toBe(5);
    rerender(<DataGrid {...props} dataSourceKeepPreviousData />);
    await sort();
    expect(shown()).toBe(5);
    await settle(2, ROWS.slice(0, 2));
    expect(shown()).toBe(2);
  });

  it("dataSourceRevalidateMs reloads expired rows without the loading state", async () => {
    let rows = five;
    const getRows = vi.fn(async () => ({ rows, rowCount: 8 }));
    render(
      <DataGrid
        aria-label="People"
        columns={COLUMNS}
        rows={[]}
        dataSource={{ getRows }}
        dataSourceCache={null}
        dataSourceRevalidateMs={30}
        hideFooter
      />,
    );
    await act(tick);
    await act(tick);
    const first = cell(1, "name");
    expect(first.textContent).toBe("Person 1");
    rows = [{ id: 1, name: "Changed", age: 1 }];
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    expect(cell(1, "name").textContent).toBe("Changed");
    expect(grid().hasAttribute("aria-busy")).toBe(false);
    expect(getRows.mock.calls.length).toBeGreaterThan(1);
  });

  it("waits filterDebounceMs before filtering, and shows what was typed at once", async () => {
    const onFilterModelChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        showToolbar
        rows={ROWS}
        columns={COLUMNS}
        onFilterModelChange={onFilterModelChange}
        filterDebounceMs={40}
      />,
    );
    const quick = document.querySelector(
      "[data-ok-data-grid-quick-filter] input",
    ) as HTMLInputElement;
    fireEvent.change(quick, { target: { value: "Per" } });
    expect(quick.value).toBe("Per");
    expect(onFilterModelChange).not.toHaveBeenCalled();
    await vi.waitUntil(() => onFilterModelChange.mock.calls.length > 0);
    expect(onFilterModelChange.mock.lastCall?.[0].quickFilterValues).toEqual(["Per"]);
  });

  it("waits columnFilterDebounceMs on header filters and keeps the typed text", async () => {
    const onFilterModelChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        headerFilters
        rows={ROWS}
        columns={COLUMNS}
        onFilterModelChange={onFilterModelChange}
        columnFilterDebounceMs={40}
      />,
    );
    const field = document.querySelector('[data-ok-filter-field="name"] input') as HTMLInputElement;
    fireEvent.change(field, { target: { value: "Ann" } });
    expect(field.value).toBe("Ann");
    expect(onFilterModelChange).not.toHaveBeenCalled();
    await vi.waitUntil(() => onFilterModelChange.mock.calls.length > 0);
    expect(onFilterModelChange.mock.lastCall?.[0].items[0]).toMatchObject({
      field: "name",
      value: "Ann",
    });
  });

  it("filterDebounceMs 0 filters at once", () => {
    const onFilterModelChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        showToolbar
        rows={ROWS}
        columns={COLUMNS}
        onFilterModelChange={onFilterModelChange}
      />,
    );
    fireEvent.change(document.querySelector("[data-ok-data-grid-quick-filter] input") as Element, {
      target: { value: "Per" },
    });
    expect(onFilterModelChange).toHaveBeenCalledOnce();
  });

  describe("tree data, children left alone", () => {
    interface Node {
      id: number;
      path: string[];
      name: string;
    }
    const TREE: Node[] = [
      { id: 1, path: ["b"], name: "B root" },
      { id: 2, path: ["b", "z"], name: "Z child" },
      { id: 3, path: ["b", "a"], name: "A child" },
      { id: 4, path: ["a"], name: "A root" },
    ];
    const TREE_COLUMNS: GridColDef<Node>[] = [{ field: "name", headerName: "Name", width: 160 }];
    const treeRows = () =>
      [...grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]')].map(
        (row) => row.querySelector('[data-ok-field="name"]')?.textContent,
      );
    const base = {
      "aria-label": "Tree",
      rows: TREE,
      columns: TREE_COLUMNS,
      treeData: true,
      getTreeDataPath: (row: Node) => row.path,
      defaultGroupingExpansionDepth: -1,
      hideFooter: true,
      disableVirtualization: true,
    };

    it("disableChildrenFiltering shows a passing root's children, and hides those of the others", () => {
      const filterModel = { items: [{ field: "name", operator: "contains", value: "root" }] };
      const { rerender } = render(<DataGrid {...base} filterModel={filterModel} />);
      expect(treeRows()).toEqual(["B root", "A root"]);
      rerender(<DataGrid {...base} filterModel={filterModel} disableChildrenFiltering />);
      expect(treeRows()).toEqual(["B root", "Z child", "A child", "A root"]);
      // A child that matches doesn't keep a root that doesn't.
      rerender(
        <DataGrid
          {...base}
          filterModel={{ items: [{ field: "name", operator: "contains", value: "Z child" }] }}
          disableChildrenFiltering
        />,
      );
      expect(treeRows()).toEqual([]);
    });

    it("disableChildrenSorting sorts top-level rows only", () => {
      const sortModel = [{ field: "name", sort: "asc" as const }];
      const { rerender } = render(<DataGrid {...base} sortModel={sortModel} />);
      expect(treeRows()).toEqual(["A root", "B root", "A child", "Z child"]);
      rerender(<DataGrid {...base} sortModel={sortModel} disableChildrenSorting />);
      expect(treeRows()).toEqual(["A root", "B root", "Z child", "A child"]);
    });
  });
});

describe("DataGrid columns, rows and pivot options (4.18.57)", () => {
  const rowEl = (id: number | string) =>
    grid().querySelector(`[data-ok-data-grid-body] > [data-ok-row-id="${id}"]`) as HTMLElement;
  const handleOf = (id: number | string) =>
    rowEl(id).querySelector("[data-ok-data-grid-reorder-handle]") as HTMLElement | null;
  const names = () =>
    [...grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]')].map(
      (row) => row.querySelector('[data-ok-field="name"]')?.textContent,
    );

  it("disableAutosize: a double click on a column's edge does nothing", () => {
    const onColumnWidthChange = vi.fn();
    const { rerender } = render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        onColumnWidthChange={onColumnWidthChange}
        disableAutosize
      />,
    );
    const edge = () => header("name").querySelector("[data-ok-data-grid-resize]") as Element;
    act(() => {
      edge().dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });
    expect(onColumnWidthChange).not.toHaveBeenCalled();
    expect(
      document.querySelector("[data-ok-data-grid]")?.hasAttribute("data-ok-disable-autosize"),
    ).toBe(true);
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        onColumnWidthChange={onColumnWidthChange}
      />,
    );
    act(() => {
      edge().dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });
    expect(onColumnWidthChange).toHaveBeenCalled();
  });

  it("keepColumnPositionIfDraggedOutside: a drop outside the grid keeps the new place", () => {
    const onColumnOrderChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        onColumnOrderChange={onColumnOrderChange}
        keepColumnPositionIfDraggedOutside
      />,
    );
    const from = header("name").getBoundingClientRect();
    const to = header("age").getBoundingClientRect();
    act(() => {
      header("name").dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientX: from.left + 10,
          clientY: from.top + 5,
        }),
      );
      document.dispatchEvent(
        new PointerEvent("pointermove", { clientX: to.left + 20, clientY: to.top + 5 }),
      );
      document.dispatchEvent(
        new PointerEvent("pointerup", { clientX: to.left + 20, clientY: to.bottom + 600 }),
      );
    });
    expect(onColumnOrderChange).toHaveBeenCalledExactlyOnceWith(["age", "name"]);
  });

  it("pinned section separators: a line by default, a shadow on request", () => {
    const props = {
      "aria-label": "People",
      rows: ROWS,
      columns: COLUMNS,
      pinnedColumns: { left: ["name"] },
      disableVirtualization: true,
    };
    const { rerender } = render(<DataGrid {...props} />);
    const edge = () => getComputedStyle(cell(1, "name"));
    expect(edge().clipPath).toBe("none");
    rerender(<DataGrid {...props} pinnedColumnsSectionSeparator="border-and-shadow" />);
    expect(
      document
        .querySelector("[data-ok-data-grid]")
        ?.getAttribute("data-ok-pinned-columns-section-separator"),
    ).toBe("border-and-shadow");
    expect(edge().clipPath).not.toBe("none");
    expect(edge().boxShadow.split("px").length).toBeGreaterThan(5);
    rerender(
      <DataGrid
        {...props}
        pinnedRows={{ top: [{ id: 90, name: "Top", age: 1 }] }}
        pinnedRowsSectionSeparator="border-and-shadow"
      />,
    );
    const top = grid().querySelector('[data-ok-data-grid-pinned-rows="top"]') as Element;
    expect(getComputedStyle(top).boxShadow).not.toBe("none");
  });

  it("isRowReorderable leaves out a row's handle; isValidRowReorder refuses drops", () => {
    const onRowOrderChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS.slice(0, 4)}
        columns={COLUMNS}
        rowReordering
        onRowOrderChange={onRowOrderChange}
        isRowReorderable={({ row }) => row.id !== 2}
        isValidRowReorder={({ targetRowIndex }) => targetRowIndex !== 3}
      />,
    );
    expect(handleOf(2)).toBeNull();
    expect(rowEl(2).getAttribute("data-ok-reorderable")).toBe("false");
    fireEvent.keyDown(handleOf(1) as HTMLElement, { key: "ArrowDown", altKey: true });
    expect(onRowOrderChange).toHaveBeenCalledOnce();
    expect(names()).toEqual(["Person 2", "Person 1", "Person 3", "Person 4"]);
    fireEvent.keyDown(handleOf(3) as HTMLElement, { key: "ArrowDown", altKey: true });
    expect(onRowOrderChange).toHaveBeenCalledOnce();
  });

  describe("tree data reordering", () => {
    interface File {
      id: string;
      path: string[];
      name: string;
    }
    const FILES: File[] = [
      { id: "d", path: ["docs"], name: "docs" },
      { id: "d1", path: ["docs", "a.md"], name: "a.md" },
      { id: "d2", path: ["docs", "b.md"], name: "b.md" },
      { id: "s", path: ["src"], name: "src" },
      { id: "s1", path: ["src", "c.ts"], name: "c.ts" },
    ];
    const FILE_COLUMNS: GridColDef<File>[] = [{ field: "name", headerName: "Name", width: 160 }];
    const order = () =>
      [...grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]')].map((row) =>
        row.getAttribute("data-ok-row-id"),
      );
    const base = {
      "aria-label": "Files",
      rows: FILES,
      columns: FILE_COLUMNS,
      treeData: true,
      getTreeDataPath: (row: File) => row.path,
      defaultGroupingExpansionDepth: -1,
      rowReordering: true,
      hideFooter: true,
      disableVirtualization: true,
    };

    it("moves a parent with its children among its siblings", () => {
      const onRowOrderChange = vi.fn();
      render(<DataGrid {...base} onRowOrderChange={onRowOrderChange} />);
      expect(order()).toEqual(["d", "d1", "d2", "s", "s1"]);
      fireEvent.keyDown(handleOf("d") as HTMLElement, { key: "ArrowDown", altKey: true });
      expect(order()).toEqual(["s", "s1", "d", "d1", "d2"]);
      expect(onRowOrderChange.mock.lastCall?.[0]).toMatchObject({
        oldParent: null,
        newParent: null,
      });
    });

    it("needs setTreeDataPath to move a row under another parent", async () => {
      const processRowUpdate = vi.fn((row: File) => row);
      const onRowOrderChange = vi.fn();
      const { rerender } = render(<DataGrid {...base} processRowUpdate={processRowUpdate} />);
      // d2 → below s: another parent (top level) without setTreeDataPath: refused.
      fireEvent.keyDown(handleOf("d2") as HTMLElement, { key: "ArrowDown", altKey: true });
      expect(order()).toEqual(["d", "d1", "d2", "s", "s1"]);
      rerender(
        <DataGrid
          {...base}
          processRowUpdate={processRowUpdate}
          onRowOrderChange={onRowOrderChange}
          setTreeDataPath={(path, row) => ({ ...row, path })}
        />,
      );
      await act(async () => {
        fireEvent.keyDown(handleOf("s1") as HTMLElement, { key: "ArrowUp", altKey: true });
        await tick();
      });
      expect(processRowUpdate.mock.calls[0]?.[0]).toEqual({
        id: "s1",
        path: ["c.ts"],
        name: "c.ts",
      });
      expect(onRowOrderChange.mock.lastCall?.[0]).toMatchObject({
        oldParent: "s",
        newParent: null,
      });
      expect(rowEl("s1").getAttribute("aria-level")).toBe("1");
    });
  });

  it("pivotingColDef overrides the pivot's columns", () => {
    interface Sale {
      id: number;
      region: string;
      units: number;
    }
    render(
      <DataGrid<Sale>
        aria-label="Sales"
        rows={[
          { id: 1, region: "North", units: 3 },
          { id: 2, region: "South", units: 4 },
        ]}
        columns={[
          { field: "region", headerName: "Region" },
          { field: "units", headerName: "Units", type: "number" },
        ]}
        pivotActive
        pivotModel={{
          rows: [{ field: "region" }],
          columns: [],
          values: [{ field: "units", aggFunc: "sum" }],
        }}
        pivotingColDef={(field) => ({ headerName: `Total ${field}`, width: 180 })}
        disableVirtualization
        hideFooter
      />,
    );
    const pivotHeader = grid().querySelector('[role="columnheader"][data-ok-field^="pivot:"]');
    expect(pivotHeader?.textContent).toContain("Total units");
  });

  it("pivotPanelOpen opens the pivot panel; clicks only report", async () => {
    const onPivotPanelOpenChange = vi.fn();
    const props = {
      "aria-label": "People",
      showToolbar: true,
      rows: ROWS,
      columns: COLUMNS,
      pivotModel: { rows: [], columns: [], values: [] },
      onPivotPanelOpenChange,
    };
    const { rerender } = render(<DataGrid {...props} pivotPanelOpen={false} />);
    const panel = () => document.querySelector('[id$="-pivot"][popover]') as HTMLElement;
    await userEvent.click(screen.getByRole("button", { name: "Pivot" }));
    expect(onPivotPanelOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(panel().hasAttribute("data-ok-open")).toBe(false);
    rerender(<DataGrid {...props} pivotPanelOpen />);
    await act(tick);
    expect(panel().hasAttribute("data-ok-open")).toBe(true);
    expect(
      document.querySelector("[data-ok-data-grid]")?.hasAttribute("data-ok-pivot-panel-open"),
    ).toBe(true);
    rerender(<DataGrid {...props} pivotPanelOpen={false} />);
    await act(tick);
    expect(panel().hasAttribute("data-ok-open")).toBe(false);
  });

  it("columns don't virtualize with auto row heights unless asked", () => {
    const wide: GridColDef<Row>[] = Array.from({ length: 30 }, (_, i) => ({
      field: i === 0 ? "name" : `c${i}`,
      headerName: `C${i}`,
      width: 120,
      valueGetter: (row: Row) => row.name,
    }));
    const props = {
      "aria-label": "Wide",
      rows: ROWS,
      columns: wide,
      getRowHeight: () => "auto" as const,
      style: { width: 300, height: 300 },
    };
    const cells = () => rowEl(1).querySelectorAll('[role="gridcell"]').length;
    const { rerender } = render(<DataGrid {...props} />);
    expect(cells()).toBe(30);
    rerender(<DataGrid {...props} virtualizeColumnsWithAutoRowHeight />);
    expect(cells()).toBeLessThan(30);
  });
});
