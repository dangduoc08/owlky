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
