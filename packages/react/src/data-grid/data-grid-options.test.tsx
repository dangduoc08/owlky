import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { DataGrid, type GridApi, type GridColDef } from "./data-grid.js";

// Roadmap batch E (Data grid shoulds): footer and toolbar, layout, column options, selection
// options and the set filter.

interface Row {
  id: number;
  name: string;
  team: string;
  age: number;
}
const ROWS: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  team: ["Core", "Docs", "Design"][i % 3] as string,
  age: 20 + i,
}));
const COLUMNS: GridColDef<Row>[] = [
  { field: "name", headerName: "Name", width: 140 },
  { field: "team", headerName: "Team", width: 120 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

afterEach(() => vi.restoreAllMocks());

const grid = () => document.querySelector("[data-ok-data-grid-main]") as HTMLElement;
const footer = () => document.querySelector("[data-ok-data-grid-footer]") as HTMLElement;
const shownRows = () =>
  grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])');

describe("DataGrid footer and toolbar", () => {
  it("label names the grid and shows in the toolbar", async () => {
    render(<DataGrid label="People" showToolbar rows={ROWS.slice(0, 3)} columns={COLUMNS} />);
    expect(grid().getAttribute("aria-label")).toBe("People");
    expect(document.querySelector("[data-ok-data-grid-toolbar-label]")?.textContent).toBe("People");
    await expectNoAxeViolations(document.body);
  });

  it("label wins over aria-label; no toolbar, no toolbar label", () => {
    render(<DataGrid label="People" aria-label="Other" rows={ROWS} columns={COLUMNS} />);
    expect(grid().getAttribute("aria-label")).toBe("People");
    expect(document.querySelector("[data-ok-data-grid-toolbar-label]")).toBeNull();
  });

  it("hideFooterPagination shows every row and the row count, filtered as 'n of total'", () => {
    const { rerender } = render(
      <DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} hideFooterPagination />,
    );
    expect(shownRows()).toHaveLength(12);
    expect(footer().querySelector("[data-ok-table-pagination]")).toBeNull();
    expect(footer().querySelector("[data-ok-data-grid-row-count]")?.textContent).toBe(
      "Total Rows: 12",
    );
    expect(
      document.querySelector("[data-ok-data-grid]")?.hasAttribute("data-ok-hide-footer-pagination"),
    ).toBe(true);
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        hideFooterPagination
        filterModel={{ items: [{ field: "team", operator: "equals", value: "Docs" }] }}
      />,
    );
    expect(footer().querySelector("[data-ok-data-grid-row-count]")?.textContent).toBe(
      "Total Rows: 4 of 12",
    );
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        hideFooterPagination
        hideFooterRowCount
      />,
    );
    expect(footer().querySelector("[data-ok-data-grid-row-count]")).toBeNull();
  });

  it("the row count only shows without pagination", () => {
    render(<DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} />);
    expect(footer().querySelector("[data-ok-data-grid-row-count]")).toBeNull();
    expect(shownRows()).toHaveLength(5);
  });

  it("counts the selected rows first in the footer; hideFooterSelectedRowCount hides it", async () => {
    const { rerender } = render(
      <DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} checkboxSelection />,
    );
    expect(footer().querySelector("[data-ok-data-grid-selected-row-count]")).toBeNull();
    const boxes = screen.getAllByRole("checkbox", { name: "Select row" });
    await userEvent.click(boxes[0] as HTMLElement);
    const count = footer().firstElementChild as HTMLElement;
    expect(count.hasAttribute("data-ok-data-grid-selected-row-count")).toBe(true);
    expect(count.textContent).toBe("1 row selected");
    await userEvent.click(boxes[1] as HTMLElement);
    expect(count.textContent).toBe("2 rows selected");
    await expectNoAxeViolations(document.body);
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        hideFooterSelectedRowCount
      />,
    );
    expect(footer().querySelector("[data-ok-data-grid-selected-row-count]")).toBeNull();
  });

  it("tabNavigation: Tab moves between cells, then leaves the grid", async () => {
    render(
      <>
        <DataGrid
          aria-label="People"
          rows={ROWS.slice(0, 2)}
          columns={COLUMNS}
          hideFooter
          tabNavigation="all"
        />
        <input aria-label="after" />
      </>,
    );
    expect(
      document.querySelector("[data-ok-data-grid]")?.getAttribute("data-ok-tab-navigation"),
    ).toBe("all");
    const first = grid().querySelector(
      '[role="columnheader"][data-ok-field="name"]',
    ) as HTMLElement;
    first.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("data-ok-field")).toBe("team");
    await userEvent.keyboard("{Tab}{Tab}");
    expect(document.activeElement?.textContent).toBe("Person 1");
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement?.getAttribute("data-ok-field")).toBe("age");
    // The grid keeps one tab stop.
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    const last = grid().querySelector(
      '[data-ok-data-grid-body] > [role="row"]:last-child [data-ok-field="age"]',
    ) as HTMLElement;
    last.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("after");
  });
});

/** Resolves once `test` passes after a mutation of `target` (ResizeObserver work lands later). */
const whenMutated = (target: Element, test: () => boolean) =>
  new Promise<void>((resolve) => {
    if (test()) return resolve();
    const observer = new MutationObserver(() => {
      if (!test()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(target, { attributes: true, childList: true, subtree: true });
  });

describe("DataGrid layout options", () => {
  const root = () => document.querySelector("[data-ok-data-grid]") as HTMLElement;

  it("header heights: px × density on the root's private properties", () => {
    const { rerender } = render(
      <DataGrid
        aria-label="People"
        rows={ROWS.slice(0, 2)}
        columns={COLUMNS}
        columnHeaderHeight={40}
        columnGroupingModel={[{ groupId: "g", children: [{ field: "name" }, { field: "team" }] }]}
        columnGroupHeaderHeight={30}
        headerFilters
        hideFooter
      />,
    );
    expect(root().getAttribute("data-ok-column-header-height")).toBe("40");
    expect(root().style.getPropertyValue("--_ok-data-grid-header-height")).toBe("40px");
    expect(root().style.getPropertyValue("--_ok-data-grid-group-header-height")).toBe("30px");
    // The header filters follow the column headers' height unless they have their own.
    expect(root().style.getPropertyValue("--_ok-data-grid-header-filter-height")).toBe("40px");
    const name = grid().querySelector('[role="columnheader"][data-ok-field="name"]') as HTMLElement;
    expect(name.getBoundingClientRect().height).toBe(40);
    const group = document.querySelector(
      '[role="columnheader"][data-ok-group-id="g"]',
    ) as HTMLElement;
    expect(group.getBoundingClientRect().height).toBe(30);
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS.slice(0, 2)}
        columns={COLUMNS}
        density="compact"
        columnHeaderHeight={40}
        headerFilterHeight={60}
        hideFooter
      />,
    );
    expect(root().style.getPropertyValue("--_ok-data-grid-header-height")).toBe("28px");
    expect(root().style.getPropertyValue("--_ok-data-grid-header-filter-height")).toBe("42px");
    expect(root().style.getPropertyValue("--_ok-data-grid-group-header-height")).toBe("");
  });

  it("vertical borders, border spacing and autoHeight", async () => {
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS.slice(0, 3)}
        columns={COLUMNS}
        showCellVerticalBorder
        showColumnVerticalBorder
        getRowSpacing={() => ({ top: 4, bottom: 6 })}
        rowSpacingType="border"
        autoHeight
        hideFooter
      />,
    );
    const cell = grid().querySelector('[role="gridcell"][data-ok-field="name"]') as HTMLElement;
    expect(getComputedStyle(cell).borderInlineEndWidth).toBe("1px");
    const head = screen.getByRole("columnheader", { name: /^Name/ });
    expect(getComputedStyle(head).borderInlineEndWidth).toBe("1px");
    const row = cell.closest('[role="row"]') as HTMLElement;
    expect(getComputedStyle(row).paddingTop).toBe("4px");
    expect(getComputedStyle(row).paddingBottom).toBe("6px");
    expect(getComputedStyle(row).marginTop).toBe("0px");
    expect(root().hasAttribute("data-ok-auto-height")).toBe(true);
    expect(getComputedStyle(grid()).flexGrow).toBe("0");
    await expectNoAxeViolations(document.body);
  });

  it("margin spacing stays outside the row by default", () => {
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS.slice(0, 3)}
        columns={COLUMNS}
        getRowSpacing={() => ({ top: 4 })}
        hideFooter
      />,
    );
    const row = grid().querySelector('[data-ok-data-grid-body] > [role="row"]') as HTMLElement;
    expect(getComputedStyle(row).marginTop).toBe("4px");
    expect(getComputedStyle(row).paddingTop).toBe("0px");
    expect(root().hasAttribute("data-ok-row-spacing-type")).toBe(false);
  });

  it("autoPageSize fits the page to the grid's height and follows resizes", async () => {
    const onPaginationModelChange = vi.fn();
    render(
      <div style={{ height: "500px", display: "flex", flexDirection: "column" }}>
        <DataGrid
          aria-label="People"
          rows={ROWS}
          columns={COLUMNS}
          autoPageSize
          style={{ flex: "1 1 auto", minHeight: 0 }}
          onPaginationModelChange={onPaginationModelChange}
        />
      </div>,
    );
    const pagination = footer().querySelector("[data-ok-table-pagination]") as HTMLElement;
    // No rows per page choice.
    expect(pagination.querySelector("select")).toBeNull();
    const fits = () => {
      const header = grid().querySelector("[data-ok-data-grid-header]") as HTMLElement;
      return Math.floor((grid().clientHeight - header.offsetHeight) / 53);
    };
    await whenMutated(
      pagination,
      () => pagination.getAttribute("data-ok-rows-per-page") === String(fits()),
    );
    expect(shownRows()).toHaveLength(fits());
    expect(onPaginationModelChange).toHaveBeenLastCalledWith({ page: 0, pageSize: fits() });
    expect(grid().scrollHeight).toBeLessThanOrEqual(grid().clientHeight + 1);
    // A taller grid holds more rows.
    (root().parentElement as HTMLElement).style.height = "700px";
    await whenMutated(
      pagination,
      () => pagination.getAttribute("data-ok-rows-per-page") === String(fits()),
    );
    expect(shownRows()).toHaveLength(Math.min(fits(), 12));
  });
});

describe("DataGrid column options", () => {
  interface Task {
    id: string;
    task: string;
    team: string;
    owner: string;
    points: number;
  }
  const TASKS: Task[] = [
    { id: "t1", task: "Plan", team: "Core", owner: "Ana", points: 3 },
    { id: "t2", task: "Build", team: "Core", owner: "Ana", points: 5 },
    { id: "t3", task: "Guide", team: "Docs", owner: "Ana", points: 2 },
  ];
  const columns: GridColDef<Task>[] = [
    {
      field: "task",
      headerName: "Task",
      rowHeader: true,
      disableReorder: true,
      disableColumnMenu: true,
      headerClassName: "head-task",
    },
    { field: "team", headerName: "Team", pinnable: false, disableExport: true },
    {
      field: "owner",
      headerName: "Owner",
      rowSpanValueGetter: (value, row) => `${row.team}/${String(value)}`,
      headerClassName: ({ field }) => `head-${field}`,
    },
    {
      field: "points",
      headerName: "Points",
      type: "number",
      hideSortIcons: true,
      display: "flex",
      editable: true,
      cellClassName: ({ value }) => (Number(value) >= 5 ? "big" : ""),
      pastedValueParser: (value) => Number.parseInt(value, 10) * 10,
    },
  ];
  const cell = (id: string, field: string) =>
    grid().querySelector(`[data-ok-row-id="${id}"] [data-ok-field="${field}"]`) as HTMLElement;
  const headerOf = (field: string) =>
    grid().querySelector(
      `[data-ok-data-grid-header] [role="columnheader"][data-ok-field="${field}"]`,
    ) as HTMLElement;

  it("row headers, class names, display, opt-out attributes and no sort icon or menu", async () => {
    render(
      <DataGrid
        aria-label="Tasks"
        rows={TASKS}
        columns={columns}
        getCellClassName={({ field }) => (field === "points" ? "num" : "")}
        hideFooter
      />,
    );
    expect(screen.getAllByRole("rowheader").map((c) => c.textContent)).toEqual([
      "Plan",
      "Build",
      "Guide",
    ]);
    expect(cell("t2", "points").className).toBe("big num");
    expect(cell("t1", "points").className).toBe("num");
    expect(cell("t1", "points").getAttribute("data-ok-display")).toBe("flex");
    expect(getComputedStyle(cell("t1", "points")).display).toBe("flex");
    expect(headerOf("task").className).toBe("head-task");
    expect(headerOf("owner").className).toBe("head-owner");
    expect(headerOf("task").hasAttribute("data-ok-disable-reorder")).toBe(true);
    expect(headerOf("team").getAttribute("data-ok-pinnable")).toBe("false");
    expect(headerOf("team").hasAttribute("data-ok-disable-export")).toBe(true);
    expect(headerOf("task").querySelector("[data-ok-data-grid-menu-button]")).toBeNull();
    expect(headerOf("team").querySelector("[data-ok-data-grid-menu-button]")).not.toBeNull();
    // Still sortable, without the arrow.
    expect(headerOf("points").getAttribute("aria-sort")).toBe("none");
    expect(headerOf("points").querySelector("[data-ok-data-grid-sort-icon]")).toBeNull();
    // Arrow keys reach row headers like cells.
    cell("t1", "task").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cell("t2", "task"));
    await expectNoAxeViolations(document.body);
  });

  it("rowSpanValueGetter decides which neighbours merge", () => {
    render(<DataGrid aria-label="Tasks" rows={TASKS} columns={columns} rowSpanning hideFooter />);
    expect(cell("t1", "owner").getAttribute("aria-rowspan")).toBe("2");
    expect(cell("t1", "owner").getAttribute("data-ok-row-span-value")).toBe("Core/Ana");
    expect(cell("t2", "owner").hasAttribute("data-ok-covered")).toBe(true);
    // Another team: no merge with the Ana above.
    expect(cell("t3", "owner").hasAttribute("data-ok-covered")).toBe(false);
  });

  it("disableReorder keeps the column in place; pinnable false hides the pin items", async () => {
    const onColumnOrderChange = vi.fn();
    render(
      <DataGrid
        aria-label="Tasks"
        rows={TASKS}
        columns={columns}
        hideFooter
        onColumnOrderChange={onColumnOrderChange}
      />,
    );
    // Team can't move left: the Task column would shift.
    headerOf("team").focus();
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(screen.getByRole("menuitem", { name: "Move left" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    for (const name of ["Pin to left", "Pin to right", "Unpin"])
      expect(screen.queryByRole("menuitem", { name })).toBeNull();
    await userEvent.click(screen.getByRole("menuitem", { name: "Move right" }));
    expect(onColumnOrderChange).toHaveBeenLastCalledWith(["task", "owner", "team", "points"]);
    headerOf("owner").focus();
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(screen.getByRole("menuitem", { name: "Move left" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(screen.getByRole("menuitem", { name: "Pin to left" })).toBeTruthy();
  });

  it("disableExport leaves the column out of the CSV", () => {
    const apiRef = { current: null } as { current: GridApi<Task> | null };
    render(
      <DataGrid aria-label="Tasks" rows={TASKS} columns={columns} apiRef={apiRef} hideFooter />,
    );
    const csv = apiRef.current?.getDataAsCsv() as string;
    expect(csv.split("\r\n")[0]).toBe("﻿Task,Owner,Points");
  });

  it("pastedValueParser turns pasted text into the value", async () => {
    const processRowUpdate = vi.fn((row: Task) => row);
    render(
      <DataGrid
        aria-label="Tasks"
        rows={TASKS}
        columns={columns}
        cellSelection
        processRowUpdate={processRowUpdate}
        hideFooter
      />,
    );
    const target = cell("t1", "points");
    target.focus();
    // Ctrl + V moves the focus to the grid's text area, which takes the browser's paste.
    target.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "v", ctrlKey: true }),
    );
    const transfer = new DataTransfer();
    transfer.setData("text/plain", "4");
    const read = vi.spyOn(DataTransfer.prototype, "getData").mockReturnValue("4");
    (document.activeElement as HTMLElement).dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }),
    );
    read.mockRestore();
    await vi.waitUntil(() => processRowUpdate.mock.calls.length > 0);
    expect(processRowUpdate.mock.calls[0]?.[0]).toMatchObject({ id: "t1", points: 40 });
  });
});
