import type { GridGetRowsToExportParams } from "@owlky/core";
import { act, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { DataGrid, type GridApi, type GridColDef } from "./data-grid.js";

// Roadmap batch E (4.18.87–4.18.93, the ApexGrid audit).

interface Row {
  id: number;
  name: string;
  team: string;
  score: number;
}
const ROWS: Row[] = [
  { id: 1, name: "Ana", team: "Red", score: 30 },
  { id: 2, name: "Bao", team: "Blue", score: 9 },
  { id: 3, name: "Chloe", team: "Red", score: 12 },
  { id: 4, name: "Diego", team: "Blue", score: 41 },
  { id: 5, name: "Emma", team: "Red", score: 5 },
];
const COLUMNS: GridColDef<Row>[] = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "team", headerName: "Team" },
  { field: "score", headerName: "Score", type: "number" },
];

afterEach(() => vi.restoreAllMocks());

const bodyRows = () =>
  [...document.querySelectorAll<HTMLElement>('[data-ok-data-grid-body] > [role="row"]')].filter(
    (row) => !row.hidden,
  );
const nameCell = (index: number) =>
  (bodyRows()[index] as HTMLElement).querySelector<HTMLElement>(
    '[data-ok-field="name"]',
  ) as HTMLElement;
const box = (index: number) => within(bodyRows()[index] as HTMLElement).getByRole("checkbox");
const selected = () =>
  bodyRows()
    .filter((row) => row.getAttribute("aria-selected") === "true")
    .map((row) => row.getAttribute("data-ok-row-id"));

describe("DataGrid row range selection (4.18.87)", () => {
  it("Shift + click on rows and checkboxes selects the range from the last toggled row", async () => {
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
    await userEvent.click(nameCell(1));
    await userEvent.keyboard("{Shift>}");
    await userEvent.click(nameCell(3));
    await userEvent.keyboard("{/Shift}");
    expect(selected()).toEqual(["2", "3", "4"]);
    // A selected row clears the rows from the anchor up to it.
    await userEvent.keyboard("{Shift>}");
    await userEvent.click(nameCell(1));
    await userEvent.keyboard("{/Shift}");
    expect(selected()).toEqual(["2"]);
    // Checkboxes: Shift + click from the anchor (row 2) to row 5.
    await userEvent.keyboard("{Shift>}");
    await userEvent.click(box(4));
    await userEvent.keyboard("{/Shift}");
    expect(selected()).toEqual(["2", "3", "4", "5"]);
    expect(onRowSelectionModelChange).toHaveBeenLastCalledWith(["2", "3", "4", "5"]);
    // A plain click still toggles one row.
    await userEvent.click(box(0));
    expect(selected()).toEqual(["1", "2", "3", "4", "5"]);
    expect(window.getSelection()?.toString() ?? "").toBe("");
    await expectNoAxeViolations(document.body);
  });

  it("Shift + Up / Down extends and shrinks the selection; Shift + Space toggles the row", async () => {
    render(<DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} checkboxSelection />);
    act(() => nameCell(1).focus());
    await userEvent.keyboard("{Shift>} {/Shift}");
    expect(selected()).toEqual(["2"]);
    await userEvent.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    expect(selected()).toEqual(["2", "3", "4"]);
    expect(document.activeElement).toBe(nameCell(3));
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(selected()).toEqual(["2", "3"]);
    // Plain arrows only move.
    await userEvent.keyboard("{ArrowDown}");
    expect(selected()).toEqual(["2", "3"]);
  });

  it("single selection: Shift + arrows move the selection; ranges need several rows", async () => {
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        disableMultipleRowSelection
      />,
    );
    await userEvent.click(nameCell(0));
    await userEvent.keyboard("{Shift>}");
    await userEvent.click(nameCell(2));
    await userEvent.keyboard("{/Shift}");
    expect(selected()).toEqual(["3"]);
    act(() => nameCell(2).focus());
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(selected()).toEqual(["4"]);
  });

  it("unselectable rows stay out of a range; cell selection keeps Shift + arrows", async () => {
    const { rerender } = render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        isRowSelectable={({ id }) => id !== "3"}
      />,
    );
    await userEvent.click(nameCell(0));
    await userEvent.keyboard("{Shift>}");
    await userEvent.click(nameCell(3));
    // An unselectable row ignores Shift + click.
    await userEvent.click(nameCell(2));
    await userEvent.keyboard("{/Shift}");
    expect(selected()).toEqual(["1", "2", "4"]);
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        cellSelection
      />,
    );
    act(() => nameCell(0).focus());
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(selected()).toEqual(["1", "2", "4"]);
  });
});

describe("DataGrid rows to export (4.18.92)", () => {
  const filtered = { items: [{ field: "team", operator: "equals", value: "Red" }] };
  const names = (csv: string) =>
    csv
      .replace("﻿", "")
      .split("\r\n")
      .slice(1)
      .map((line) => line.split(",")[0]);

  it("source shortcuts and getRowsToExport for CSV and Excel", () => {
    const apiRef = { current: null as GridApi<Row> | null };
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        apiRef={apiRef}
        initialState={{
          filter: { filterModel: filtered },
          sorting: { sortModel: [{ field: "score", sort: "desc" }] },
          pagination: { paginationModel: { page: 0, pageSize: 2 } },
        }}
        rowSelectionModel={["5", "2", "3"]}
      />,
    );
    const api = apiRef.current as GridApi<Row>;
    expect(names(api.getDataAsCsv())).toEqual(["Ana", "Chloe", "Emma"]);
    expect(names(api.getDataAsCsv({ source: "selected" }))).toEqual(["Chloe", "Emma"]);
    expect(names(api.getDataAsCsv({ source: "page" }))).toEqual(["Ana", "Chloe"]);
    expect(names(api.getDataAsCsv({ source: "all" }))).toEqual([
      "Ana",
      "Bao",
      "Chloe",
      "Diego",
      "Emma",
    ]);
    const getRowsToExport = vi.fn(({ rowIds, apiRef: ref }: GridGetRowsToExportParams) =>
      ref.current ? [...rowIds].reverse() : [],
    );
    expect(names(api.getDataAsCsv({ getRowsToExport, source: "page" }))[0]).toBe("Emma");
    expect(getRowsToExport.mock.calls[0]?.[0]).toMatchObject({
      filteredSortedRowIds: ["1", "3", "5"],
      paginatedRowIds: ["1", "3"],
      selectedRowIds: ["5", "2", "3"],
    });
    const sheet = new TextDecoder().decode(api.getDataAsExcel({ source: "selected" }));
    expect(sheet).toContain("Chloe");
    expect(sheet).not.toContain("Ana");
  });

  it("csvOptions.source reaches the markup; print keeps the rows to export", () => {
    const print = vi.fn();
    const append = document.body.append.bind(document.body);
    vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
      append(...nodes);
      for (const node of nodes)
        if (node instanceof HTMLIFrameElement) (node.contentWindow as Window).print = print;
    });
    const apiRef = { current: null as GridApi<Row> | null };
    const { container } = render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        apiRef={apiRef}
        csvOptions={{ source: "selected", getRowsToExport: () => [] }}
        printOptions={{ source: "all" }}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-ok-csv-options")).toBe('{"source":"selected"}');
    expect(root.getAttribute("data-ok-print-options")).toBe('{"source":"all"}');
    act(() => (apiRef.current as GridApi<Row>).exportDataAsPrint({ getRowsToExport: () => ["2"] }));
    expect(print).toHaveBeenCalled();
    const frame = document.querySelector("iframe") as HTMLIFrameElement;
    const printed = frame.contentDocument?.querySelectorAll(
      '[data-ok-data-grid-body] > [role="row"]',
    );
    expect([...(printed ?? [])].map((row) => row.getAttribute("data-ok-row-id"))).toEqual(["2"]);
    frame.remove();
  });
});

describe("DataGrid state with rows and onStateChange (4.18.91)", () => {
  const microtask = () => new Promise<void>((resolve) => queueMicrotask(resolve));
  const pinnedIds = (side: "top" | "bottom") =>
    [...document.querySelectorAll(`[data-ok-data-grid-pinned-rows="${side}"] > [role="row"]`)].map(
      (row) => row.getAttribute("data-ok-row-id"),
    );

  it("exports and restores the selection, open panels, pinned rows and the row order", async () => {
    const apiRef = { current: null as GridApi<Row> | null };
    const onStateChange = vi.fn();
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        apiRef={apiRef}
        checkboxSelection
        rowReordering
        getDetailPanelContent={({ row }) => <p>{`About ${row.name}`}</p>}
        pinnedRows={{ top: [{ id: 90, name: "Top", team: "-", score: 0 }] }}
        onStateChange={onStateChange}
      />,
    );
    await act(microtask);
    expect(onStateChange).not.toHaveBeenCalled();
    const api = () => apiRef.current as GridApi<Row>;
    expect(api().exportState()).toMatchObject({
      rowSelection: { model: [] },
      detailPanel: { expandedRowIds: [] },
      pinnedRows: { top: ["90"], bottom: [] },
    });
    expect(api().exportState().rowOrder).toBeUndefined();
    await userEvent.click(nameCell(1));
    await act(microtask);
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange.mock.calls[0]?.[0].rowSelection).toEqual({ model: ["2"] });
    act(() =>
      api().restoreState({
        rowSelection: { model: ["3", "4"] },
        detailPanel: { expandedRowIds: ["1"] },
        pinnedRows: { top: ["2"], bottom: ["90"] },
        rowOrder: { orderedIds: ["5", "4", "3", "1"] },
      }),
    );
    await act(microtask);
    expect(pinnedIds("top")).toEqual(["2"]);
    expect(pinnedIds("bottom")).toEqual(["90"]);
    expect(
      bodyRows()
        .filter((row) => row.hasAttribute("data-ok-row-id"))
        .map((row) => row.getAttribute("data-ok-row-id")),
    ).toEqual(["5", "4", "3", "1"]);
    expect(document.querySelector('[data-ok-detail-for="1"]')).not.toBeNull();
    expect(selected()).toEqual(["4", "3"]);
    expect(
      document
        .querySelector('[data-ok-row-id="1"] [data-ok-data-grid-detail-toggle]')
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
    const state = api().exportState();
    expect(state.rowSelection).toEqual({ model: ["3", "4"] });
    expect(state.detailPanel).toEqual({ expandedRowIds: ["1"] });
    expect(state.pinnedRows).toEqual({ top: ["2"], bottom: ["90"] });
    expect(state.rowOrder).toEqual({ orderedIds: ["5", "4", "3", "1"] });
    expect(onStateChange).toHaveBeenLastCalledWith(state);
    const calls = onStateChange.mock.calls.length;
    // A pressed pointer holds the report until its release.
    const root = document.querySelector("[data-ok-data-grid]") as HTMLElement;
    root.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    act(() => api().setRowSelectionModel([]));
    await act(microtask);
    expect(onStateChange).toHaveBeenCalledTimes(calls);
    act(() => {
      document.dispatchEvent(new PointerEvent("pointerup"));
    });
    await act(microtask);
    expect(onStateChange).toHaveBeenCalledTimes(calls + 1);
  });

  it("initialState starts with them; new pinnedRows replace restored pins", () => {
    const pins = { top: [{ id: 90, name: "Top", team: "-", score: 0 }] };
    const { rerender } = render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        getDetailPanelContent={({ row }) => <p>{`About ${row.name}`}</p>}
        pinnedRows={pins}
        initialState={{
          rowSelection: { model: ["1"] },
          detailPanel: { expandedRowIds: ["2"] },
          pinnedRows: { top: ["3"] },
          rowOrder: { orderedIds: ["5", "4"] },
        }}
      />,
    );
    expect(pinnedIds("top")).toEqual(["3"]);
    expect(selected()).toEqual(["1"]);
    expect(nameCell(0).textContent).toBe("Emma");
    expect(document.querySelector('[data-ok-detail-for="2"]')).not.toBeNull();
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        pinnedRows={{ ...pins }}
      />,
    );
    expect(pinnedIds("top")).toEqual(["90"]);
  });
});

describe("DataGrid chart aggregation, combo and a second axis (4.18.88)", () => {
  const tableRows = () =>
    [...document.querySelectorAll("[data-ok-data-grid-chart] [data-ok-chart-data] tbody tr")].map(
      (tr) => [...tr.children].map((cell) => (cell.textContent ?? "").trim()),
    );
  const heads = () => [
    ...document.querySelectorAll("[data-ok-data-grid-chart] [data-ok-chart-data] thead th"),
  ];

  it("aggregation merges the filtered rows of a category, without grouping", () => {
    const { rerender } = render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        chartsIntegration
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 2 } } }}
        chartModel={{ dimension: "team", values: ["score"], aggregation: "count" }}
      />,
    );
    // Every filtered row counts, not only the page's.
    expect(tableRows()).toEqual([
      ["Red", "3"],
      ["Blue", "2"],
    ]);
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        chartsIntegration
        filterModel={{ items: [{ field: "score", operator: ">", value: "6" }] }}
        chartModel={{ dimension: "team", values: ["score"], aggregation: "median" }}
      />,
    );
    expect(tableRows()).toEqual([
      ["Red", "21"],
      ["Blue", "25"],
    ]);
  });

  it("combo charts draw a type per value; secondary values get the opposite axis", async () => {
    render(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={[...COLUMNS, { field: "bonus", headerName: "Bonus", type: "number" }]}
        chartsIntegration
        showToolbar
        chartModel={{
          type: "combo",
          dimension: "name",
          values: ["score", "bonus"],
          secondaryValues: ["bonus"],
          seriesAxisLabel: "Points",
        }}
      />,
    );
    const types = heads().map((th) => [
      th.getAttribute("data-ok-type"),
      th.getAttribute("data-ok-y-axis"),
    ]);
    expect(types.slice(1)).toEqual([
      ["bar", "0"],
      ["line", "1"],
    ]);
    const figure = document.querySelector(
      "[data-ok-data-grid-chart] [data-ok-chart]",
    ) as HTMLElement;
    expect(figure.getAttribute("data-ok-type")).toBe("line");
    expect(figure.getAttribute("data-ok-yaxis")).toBe("title Points; opposite title Bonus");
    await userEvent.click(within(document.body).getByRole("button", { name: "Chart" }));
    const select = document.querySelector('select[id$="-chart-type"]') as HTMLSelectElement;
    expect(select.value).toBe("combo");
    expect([...select.options].map((o) => o.textContent)).toContain("Combo");
  });
});
