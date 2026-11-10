import { type GridDataSource, type GridGetRowsParams, gridCrc32 } from "@owlky/core";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { DataGrid, type GridApi, type GridColDef } from "./data-grid.js";

interface Sale {
  id: string;
  region: string;
  product: string;
  year: number;
  units: number;
  date: string;
}
const SALES: Sale[] = [
  { id: "1", region: "North", product: "Tea", year: 2024, units: 10, date: "2025-05-01" },
  { id: "2", region: "South", product: "Tea", year: 2025, units: 30, date: "2025-05-02" },
  { id: "3", region: "North", product: "Coffee", year: 2025, units: 5, date: "2025-05-03" },
  { id: "4", region: "East", product: "Juice", year: 2024, units: 20, date: "2025-05-04" },
];
const COLUMNS: GridColDef<Sale>[] = [
  { field: "region", headerName: "Region", width: 120 },
  { field: "product", headerName: "Product", width: 120, editable: true },
  { field: "year", headerName: "Year", type: "number", width: 90 },
  { field: "units", headerName: "Units", type: "number", width: 90, editable: true },
  { field: "date", headerName: "Date", type: "date", width: 210 },
];

afterEach(() => vi.restoreAllMocks());

const grid = () => screen.getByRole("treegrid", { hidden: true }) as HTMLElement;
const bodyRows = (root: ParentNode = document) => [
  ...root.querySelectorAll<HTMLElement>('[data-ok-data-grid-body] > [role="row"]:not([hidden])'),
];
const texts = (root: ParentNode = document) =>
  bodyRows(root).map((row) =>
    [...row.querySelectorAll<HTMLElement>('[role="gridcell"]')].map((c) => c.textContent),
  );
const cell = (rowId: string, field: string) =>
  document.querySelector<HTMLElement>(
    `[data-ok-row-id="${rowId}"] [role="gridcell"][data-ok-field="${field}"]`,
  ) as HTMLElement;
const menuItem = (action: string) =>
  document.querySelector<HTMLElement>(`[data-ok-data-grid-action="${action}"]`) as HTMLElement;
const openMenu = (field: string) =>
  fireEvent.click(
    document.querySelector(
      `[role="columnheader"][data-ok-field="${field}"] [data-ok-data-grid-menu-button]`,
    ) as HTMLElement,
  );

describe("DataGrid row grouping and aggregation", () => {
  it("groups rows, counts them, aggregates inline and in a footer row", async () => {
    const onGrouping = vi.fn();
    const onAggregation = vi.fn();
    render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        initialState={{
          rowGrouping: { model: ["region"] },
          aggregation: { model: { units: "sum", year: "max", region: "size" } },
        }}
        onRowGroupingModelChange={onGrouping}
        onAggregationModelChange={onAggregation}
        groupingColDef={{ headerName: "Area" }}
      />,
    );
    const g = grid();
    expect(g.getAttribute("aria-rowcount")).toBe("5");
    expect(g.closest("[data-ok-data-grid]")?.getAttribute("data-ok-row-grouping-model")).toBe(
      '["region"]',
    );
    expect(texts()).toEqual([
      ["North(2)", "2", "", "2025", "15", ""],
      ["South(1)", "1", "", "2025", "30", ""],
      ["East(1)", "1", "", "2024", "20", ""],
    ]);
    const header = g.querySelector('[role="columnheader"][data-ok-field="units"]') as HTMLElement;
    expect(header.querySelector("[data-ok-data-grid-aggregation-label]")?.textContent).toBe("sum");
    expect(
      g.querySelector('[role="columnheader"][data-ok-field="__row_group_by_columns_group__"]')
        ?.textContent,
    ).toBe("Area");
    const footer = g.querySelector("[data-ok-data-grid-aggregation-row]") as HTMLElement;
    expect(footer.getAttribute("aria-rowindex")).toBe("5");
    expect([...footer.querySelectorAll('[role="gridcell"]')].map((c) => c.textContent)).toEqual([
      "",
      "4",
      "",
      "2025",
      "65",
      "",
    ]);
    // Opening a group shows its rows (the group column stays empty for them).
    const north = g.querySelector(
      '[data-ok-row-id="auto-generated-row-region/North"]',
    ) as HTMLElement;
    expect(north.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(north.querySelector("[data-ok-data-grid-tree-toggle]") as HTMLElement);
    expect(north.getAttribute("aria-expanded")).toBe("true");
    expect(texts().slice(1, 3)).toEqual([
      ["", "North", "Tea", "2024", "10", "2025-05-01"],
      ["", "North", "Coffee", "2025", "5", "2025-05-03"],
    ]);
    expect(bodyRows()[1]?.getAttribute("data-ok-parent")).toBe("auto-generated-row-region/North");
    // Sorting by an aggregated field orders the groups by their values.
    fireEvent.click(header);
    expect(texts().map((r) => r[0])).toEqual(["North(2)", "", "", "East(1)", "South(1)"]);
    fireEvent.click(header);
    expect(texts().map((r) => r[0])).toEqual(["South(1)", "East(1)", "North(2)", "", ""]);
    // Sorting by the grouped field orders the groups by name.
    fireEvent.click(
      g.querySelector('[role="columnheader"][data-ok-field="region"]') as HTMLElement,
    );
    expect(texts().map((r) => r[0])).toEqual(["East(1)", "North(2)", "", "", "South(1)"]);
    // Column menu: stop grouping, group by another field, change functions.
    openMenu("region");
    expect(menuItem("group").textContent).toBe("Stop grouping by Region");
    expect(menuItem("aggregate-size").hasAttribute("data-ok-selected")).toBe(true);
    expect(menuItem("aggregate-sum").hidden).toBe(true);
    expect(menuItem("aggregate-size").hidden).toBe(false);
    fireEvent.click(menuItem("group"));
    expect(onGrouping).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole("grid")).toBeTruthy();
    openMenu("product");
    expect(menuItem("group").textContent).toBe("Group by Product");
    fireEvent.click(menuItem("group"));
    expect(onGrouping).toHaveBeenLastCalledWith(["product"]);
    openMenu("units");
    expect(menuItem("aggregate-sum").hidden).toBe(false);
    fireEvent.click(menuItem("aggregate-avg"));
    expect(onAggregation).toHaveBeenLastCalledWith({ units: "avg", year: "max", region: "size" });
    openMenu("units");
    fireEvent.click(menuItem("aggregate-none"));
    expect(onAggregation).toHaveBeenLastCalledWith({ year: "max", region: "size" });
    await expectNoAxeViolations(document.body);
  });

  it("filters leaves (groups follow), scopes, positions and turned-off features", () => {
    const { rerender } = render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        rowGroupingModel={["region", "product"]}
        aggregationModel={{ units: "sum" }}
        filterModel={{ items: [{ field: "product", operator: "equals", value: "tea" }] }}
        defaultGroupingExpansionDepth={-1}
        hideFooter
      />,
    );
    // Counts and values follow the filter.
    expect(texts().map((r) => [r[0], r[4]])).toEqual([
      ["North(1)", "10"],
      ["Tea(1)", "10"],
      ["", "10"],
      ["South(1)", "30"],
      ["Tea(1)", "30"],
      ["", "30"],
    ]);
    // Row groups nest their ids.
    expect(bodyRows()[1]?.getAttribute("data-ok-row-id")).toBe(
      "auto-generated-row-region/North/product/Tea",
    );
    expect(document.querySelector("[data-ok-data-grid-aggregation-row]")?.textContent).toContain(
      "40",
    );
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        rowGroupingModel={["region"]}
        aggregationModel={{ units: "sum", date: "sum" }}
        aggregationRowsScope="all"
        filterModel={{ items: [{ field: "product", operator: "equals", value: "tea" }] }}
        getAggregationPosition={(group) => (group.isRoot ? null : "inline")}
        hideFooter
      />,
    );
    // Every row counts with scope "all"; date can't be summed; no footer.
    expect(texts().map((r) => r[4])).toEqual(["15", "30"]);
    expect(document.querySelector("[data-ok-data-grid-aggregation-row]")).toBeNull();
    expect(
      document.querySelector(
        '[role="columnheader"][data-ok-field="date"] [data-ok-data-grid-aggregation-label]',
      ),
    ).toBeNull();
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        rowGroupingModel={["region"]}
        aggregationModel={{ units: "sum" }}
        disableRowGrouping
        disableAggregation
        hideFooter
      />,
    );
    expect(screen.getByRole("grid")).toBeTruthy();
    expect(document.querySelector('[data-ok-data-grid-action="group"]')).toBeNull();
    expect(document.querySelector('[data-ok-data-grid-action="aggregate-sum"]')).toBeNull();
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS.map((c) => ({ ...c, aggregable: c.field !== "units" }))}
        rowGroupingModel={["region"]}
        aggregationModel={{ units: "sum" }}
        getAggregationPosition={() => null}
        hideFooter
      />,
    );
    expect(texts().map((r) => r[4])).toEqual(["", "", ""]);
  });

  it("exports data rows (CSV, Excel), selects data rows only, formats aggregates", async () => {
    const apiRef = createRef<GridApi<Sale> | null>() as { current: GridApi<Sale> | null };
    render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS.map((c) =>
          c.field === "units" ? { ...c, valueFormatter: (v) => `${v} u` } : c,
        )}
        apiRef={apiRef}
        checkboxSelection
        rowGroupingModel={["region"]}
        aggregationModel={{ units: "sum", region: "size" }}
        sortModel={[{ field: "units", sort: "asc" }]}
        hideFooter
      />,
    );
    expect(texts()[0]?.[5]).toBe("15 u");
    // Counts are plain numbers; group rows have no checkbox.
    expect(texts()[0]?.[2]).toBe("2");
    expect(bodyRows()[0]?.querySelector('input[type="checkbox"]')).toBeNull();
    const api = apiRef.current as GridApi<Sale>;
    expect(api.getDataAsCsv().split("\r\n").length).toBe(5);
    expect(api.getDataAsCsv()).toContain("North,Coffee,2025,5 u");
    const xlsx = api.getDataAsExcel({ fields: ["region", "units"] });
    expect([...xlsx.subarray(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(gridCrc32(xlsx)).toBeGreaterThan(0);
    // Select all selects the data rows.
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect((apiRef.current as GridApi<Sale>).getRowSelectionModel().sort()).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    api.exportDataAsExcel({ fileName: "sales" });
    expect((create.mock.calls[0] as [Blob])[0].type).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(click).toHaveBeenCalled();
    expect(api.getRowGroupingModel()).toEqual(["region"]);
    expect(api.getAggregationModel()).toEqual({ units: "sum", region: "size" });
  });

  it("exports to Excel from the toolbar and keeps the API in sync", async () => {
    const apiRef = createRef<GridApi<Sale> | null>() as { current: GridApi<Sale> | null };
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        apiRef={apiRef}
        showToolbar
        excelOptions={{ fileName: "report", sheetName: "Sales" }}
        hideFooter
      />,
    );
    const root = document.querySelector("[data-ok-data-grid]") as HTMLElement;
    expect(root.getAttribute("data-ok-excel-options")).toBe(
      '{"fileName":"report","sheetName":"Sales"}',
    );
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Download as Excel" }));
    expect(create).toHaveBeenCalledTimes(1);
    expect(click.mock.instances[0]).toBeInstanceOf(HTMLAnchorElement);
    expect((click.mock.instances[0] as unknown as HTMLAnchorElement).download).toBe("report.xlsx");
    const api = apiRef.current as GridApi<Sale>;
    act(() => api.setRowGroupingModel(["product"]));
    expect(texts().map((r) => r[0])).toEqual(["Tea(2)", "Coffee(1)", "Juice(1)"]);
    act(() => (apiRef.current as GridApi<Sale>).setAggregationModel({ units: "max" }));
    expect(texts()[0]?.[4]).toBe("30");
    const state = (apiRef.current as GridApi<Sale>).exportState();
    expect(state.rowGrouping).toEqual({ model: ["product"] });
    expect(state.aggregation).toEqual({ model: { units: "max" } });
    act(() =>
      (apiRef.current as GridApi<Sale>).restoreState({
        rowGrouping: { model: [] },
        aggregation: { model: { units: "min" } },
      }),
    );
    expect(screen.getByRole("grid")).toBeTruthy();
    expect(document.querySelector("[data-ok-data-grid-aggregation-row]")?.textContent).toContain(
      "5",
    );
  });

  it("shows one grouping column per grouped field (rowGroupingColumnMode)", async () => {
    const colDef = vi.fn(({ fields }: { fields: string[] }) =>
      fields[0] === "product" ? { headerName: "Item", hideDescendantCount: true } : {},
    );
    const { rerender } = render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        rowGroupingColumnMode="multiple"
        rowGroupingModel={["region", "product"]}
        groupingColDef={colDef}
        defaultGroupingExpansionDepth={1}
        hideFooter
      />,
    );
    const g = grid();
    expect(g.closest("[data-ok-data-grid]")?.getAttribute("data-ok-row-grouping-column-mode")).toBe(
      "multiple",
    );
    const titles = [...g.querySelectorAll('[role="columnheader"]')]
      .slice(0, 2)
      .map((h) => [h.getAttribute("data-ok-field"), h.textContent]);
    expect(titles).toEqual([
      ["__row_group_by_columns_group_region__", "Region"],
      ["__row_group_by_columns_group_product__", "Item"],
    ]);
    expect(colDef).toHaveBeenCalledWith({ fields: ["region"] });
    // Each group names itself in its own field's column (no count for products).
    expect(texts().map((r) => r.slice(0, 2))).toEqual([
      ["North(2)", ""],
      ["", "Tea"],
      ["", "Coffee"],
      ["South(1)", ""],
      ["", "Tea"],
      ["East(1)", ""],
      ["", "Juice"],
    ]);
    // A grouping column sorts its own field's groups by name.
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        rowGroupingColumnMode="multiple"
        rowGroupingModel={["region", "product"]}
        sortModel={[{ field: "__row_group_by_columns_group_product__", sort: "asc" }]}
        defaultGroupingExpansionDepth={1}
        hideFooter
      />,
    );
    expect(texts().map((r) => r[0] || r[1])).toEqual([
      "North(2)",
      "Coffee(1)",
      "Tea(1)",
      "South(1)",
      "Tea(1)",
      "East(1)",
      "Juice(1)",
    ]);
    await expectNoAxeViolations(document.body);
    // Back to one column.
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        rowGroupingModel={["region", "product"]}
        hideFooter
      />,
    );
    expect(
      [...g.querySelectorAll('[role="columnheader"]')].map((h) => h.getAttribute("data-ok-field")),
    ).toEqual(["__row_group_by_columns_group__", "region", "product", "year", "units", "date"]);
  });

  it("groups by groupingValueGetter, from the row's own value", () => {
    const getter = vi.fn((value: unknown) => (Number(value) >= 20 ? "20 or more" : "Under 20"));
    render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS.map((c) =>
          c.field === "units"
            ? { ...c, valueGetter: (row: Sale) => row.units * 100, groupingValueGetter: getter }
            : c,
        )}
        rowGroupingModel={["units"]}
        hideFooter
      />,
    );
    expect(texts().map((r) => r[0])).toEqual(["Under 20(2)", "20 or more(2)"]);
    // The value is row[field], not the valueGetter's.
    expect(getter).toHaveBeenCalledWith(10, SALES[0]);
    // HTML groups by the attribute React writes.
    expect(cell("1", "units").getAttribute("data-ok-grouping-value")).toBe("Under 20");
    expect(cell("1", "region").hasAttribute("data-ok-grouping-value")).toBe(false);
  });

  it("shows group footers where getAggregationPosition says", async () => {
    const position = vi.fn((group: { isRoot: boolean; groupingField?: string | undefined }) =>
      group.isRoot ? null : group.groupingField === "region" ? ("footer" as const) : "inline",
    );
    const { rerender } = render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        rowGroupingModel={["region"]}
        aggregationModel={{ units: "sum" }}
        getAggregationPosition={position}
        defaultGroupingExpansionDepth={-1}
        hideFooter
      />,
    );
    expect(position).toHaveBeenCalledWith({
      id: "auto-generated-row-region/North",
      depth: 0,
      isRoot: false,
      groupingField: "region",
      groupingKey: "North",
    });
    const root = grid().closest("[data-ok-data-grid]") as HTMLElement;
    expect(JSON.parse(root.getAttribute("data-ok-aggregation-position") as string)).toEqual({
      region: "footer",
      root: null,
    });
    // The group row shows no value; its footer follows its rows; no root footer.
    expect(texts().map((r) => [r[0], r[4]])).toEqual([
      ["North(2)", ""],
      ["", "10"],
      ["", "5"],
      ["", "15"],
      ["South(1)", ""],
      ["", "30"],
      ["", "30"],
      ["East(1)", ""],
      ["", "20"],
      ["", "20"],
    ]);
    const footer = bodyRows()[3] as HTMLElement;
    expect(footer.getAttribute("data-ok-row-id")).toBe(
      "auto-generated-group-footer-auto-generated-row-region/North",
    );
    expect(footer.hasAttribute("data-ok-data-grid-aggregation-row")).toBe(true);
    expect(footer.getAttribute("aria-level")).toBe("2");
    expect(footer.getAttribute("data-ok-parent")).toBe("auto-generated-row-region/North");
    expect(footer.querySelector("[data-ok-data-grid-tree-toggle]")).toBeNull();
    expect(document.querySelector("[data-ok-data-grid-pinned-rows]")).toBeNull();
    await expectNoAxeViolations(document.body);
    // A closed group hides its footer.
    fireEvent.click(
      document.querySelector(
        '[data-ok-row-id="auto-generated-row-region/North"] [data-ok-data-grid-tree-toggle]',
      ) as HTMLElement,
    );
    expect(texts()[1]?.[0]).toBe("South(1)");
    expect((footer as HTMLElement).hidden).toBe(true);
    // Pivoting ignores getAggregationPosition (MUI X).
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        pivotActive
        pivotModel={{
          rows: [{ field: "region" }],
          columns: [],
          values: [{ field: "units", aggFunc: "sum" }],
        }}
        getAggregationPosition={position}
        hideFooter
      />,
    );
    expect(root.hasAttribute("data-ok-aggregation-position")).toBe(false);
    expect(
      document.querySelector("[data-ok-data-grid-pinned-rows] [data-ok-data-grid-aggregation-row]"),
    ).not.toBeNull();
  });

  it("asks a data source for the aggregation and shows its values", async () => {
    const asked: GridGetRowsParams[] = [];
    const source: GridDataSource<Sale> = {
      getRows: async (params) => {
        asked.push(params);
        return {
          rows: SALES.slice(0, 2),
          rowCount: 4,
          aggregateRow: { units: { total: 65 } },
        };
      },
      getAggregatedValue: (row, field) =>
        ((row as Record<string, unknown>)[field] as { total?: number } | undefined)?.total ?? null,
    };
    const { rerender } = render(
      <DataGrid
        aria-label="Sales"
        rows={[]}
        columns={COLUMNS}
        dataSource={source}
        dataSourceCache={null}
        aggregationModel={{ units: "sum" }}
      />,
    );
    const footer = await screen.findByText("65");
    expect(footer.closest("[data-ok-data-grid-aggregation-row]")).not.toBeNull();
    expect(asked[0]?.aggregationModel).toEqual({ units: "sum" });
    // Without an aggregation the request has none.
    rerender(
      <DataGrid
        aria-label="Sales"
        rows={[]}
        columns={COLUMNS}
        dataSource={source}
        dataSourceCache={null}
      />,
    );
    await act(async () => {});
    expect(asked.at(-1)?.aggregationModel).toBeUndefined();
    expect(document.querySelector("[data-ok-data-grid-aggregation-row]")).toBeNull();
  });

  it("shows a server group's aggregated values (getAggregatedValue)", async () => {
    type Group = { id: string; region: string; units: number; count: number };
    const source: GridDataSource<Group> = {
      getRows: async (params) => ({
        rows:
          params.groupKeys?.length === 0
            ? [{ id: "g-north", region: "North", units: 15, count: 2 }]
            : [],
        aggregateRow: { units: 65 },
      }),
      getChildrenCount: (row) => row.count,
      getGroupKey: (row) => row.region,
      getAggregatedValue: (row, field) => (field === "units" ? `${(row as Group).units}!` : null),
    };
    render(
      <DataGrid
        aria-label="Sales"
        rows={[]}
        columns={[
          { field: "region", headerName: "Region" },
          { field: "units", headerName: "Units", type: "number" },
        ]}
        dataSource={source}
        dataSourceCache={null}
        rowGroupingModel={["region"]}
        aggregationModel={{ units: "sum" }}
      />,
    );
    expect(await screen.findByText("15!")).toBeTruthy();
    expect(await screen.findByText("65!")).toBeTruthy();
  });

  it("tree data generates rows for missing parents", () => {
    const files = [
      { id: "a", path: ["Docs", "A.txt"], size: 2 },
      { id: "b", path: ["Docs", "Deep", "B.txt"], size: 3 },
      { id: "c", path: ["C.txt"], size: 1 },
    ];
    render(
      <DataGrid
        aria-label="Files"
        disableVirtualization
        rows={files}
        columns={[{ field: "size", headerName: "Size", type: "number" }]}
        treeData
        getTreeDataPath={(row) => row.path}
        defaultGroupingExpansionDepth={-1}
        aggregationModel={{ size: "sum" }}
        checkboxSelection
        hideFooter
      />,
    );
    expect(texts().map((r) => r.slice(1))).toEqual([
      ["Docs(3)", "5"],
      ["A.txt", "2"],
      ["Deep(1)", "3"],
      ["B.txt", "3"],
      ["C.txt", "1"],
    ]);
    const docs = bodyRows()[0] as HTMLElement;
    expect(docs.getAttribute("data-ok-row-id")).toBe("auto-generated-row-Docs");
    expect(docs.hasAttribute("data-ok-generated")).toBe(true);
    expect(bodyRows()[3]?.getAttribute("data-ok-parent")).toBe("auto-generated-row-Docs/Deep");
    expect(document.querySelector("[data-ok-data-grid-aggregation-row]")?.textContent).toBe("6");
    // Left on a child goes to its generated parent.
    const child = bodyRows()[1]?.querySelector(
      '[data-ok-field="__tree_data_group__"]',
    ) as HTMLElement;
    child.focus();
    fireEvent.keyDown(child, { key: "ArrowLeft" });
    expect(document.activeElement?.closest("[data-ok-row-id]")).toBe(docs);
  });

  it("server-side row grouping asks for the grouped fields and group keys", async () => {
    const getRows = vi.fn(async (params: GridGetRowsParams) =>
      params.groupKeys?.length
        ? { rows: [{ id: "n1", region: "North", product: "Tea", year: 2024, units: 1, date: "" }] }
        : { rows: [{ id: "g-north", region: "North", product: "", year: 0, units: 0, date: "" }] },
    );
    const source: GridDataSource<Sale> = {
      getRows,
      getGroupKey: (row) => row.region,
      getChildrenCount: (row) => (row.id.startsWith("g-") ? 1 : 0),
    };
    render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={[]}
        columns={COLUMNS}
        dataSource={source}
        rowGroupingModel={["region"]}
      />,
    );
    await vi.waitUntil(() => document.querySelector('[data-ok-row-id="g-north"]'));
    expect(getRows.mock.calls[0]?.[0]).toMatchObject({ groupKeys: [], groupFields: ["region"] });
    fireEvent.click(
      document.querySelector(
        '[data-ok-row-id="g-north"] [data-ok-data-grid-tree-toggle]',
      ) as HTMLElement,
    );
    await vi.waitUntil(() => document.querySelector('[data-ok-row-id="n1"]'));
    expect(getRows.mock.calls.at(-1)?.[0]).toMatchObject({
      groupKeys: ["North"],
      groupFields: ["region"],
    });
    expect(
      document.querySelector(
        '[data-ok-row-id="g-north"] [data-ok-field="__row_group_by_columns_group__"]',
      )?.textContent,
    ).toBe("North");
  });
});

describe("DataGrid pivoting", () => {
  const model = {
    rows: [{ field: "region" }],
    columns: [{ field: "year" }],
    values: [{ field: "units", aggFunc: "sum" }],
  };

  it("pivots by derived columns: the year and quarter of dates, or your own", () => {
    const { rerender } = render(
      <DataGrid
        id="d"
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        showToolbar
        pivotActive
        pivotModel={{
          rows: [{ field: "date-quarter" }],
          columns: [{ field: "date-year" }],
          values: [{ field: "units", aggFunc: "sum" }],
        }}
        hideFooter
      />,
    );
    expect(texts()).toEqual([["Q2", "65"]]);
    expect(
      [...grid().querySelectorAll('[data-ok-data-grid-group-row] [role="columnheader"]')].map(
        (c) => c.textContent,
      ),
    ).toEqual(["2025"]);
    // The panel lists them after the columns.
    expect(
      [...document.querySelectorAll("#d-pivot [data-ok-data-grid-pivot-field]")].map((f) =>
        f.getAttribute("data-ok-field"),
      ),
    ).toEqual(["region", "product", "year", "date", "date-quarter", "date-year", "units"]);
    expect(
      within(document.getElementById("d-pivot") as HTMLElement).getByLabelText("Date (Year)"),
    ).toBeTruthy();
    rerender(
      <DataGrid
        id="d"
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        showToolbar
        pivotActive
        getPivotDerivedColumns={(column) =>
          column.field === "units"
            ? [
                {
                  field: "units-band",
                  headerName: "Units band",
                  valueGetter: (row) => (row.units >= 20 ? "big" : "small"),
                },
              ]
            : undefined
        }
        pivotModel={{
          rows: [{ field: "units-band" }],
          columns: [],
          values: [{ field: "units", aggFunc: "sum" }],
        }}
        hideFooter
      />,
    );
    expect(texts()).toEqual([
      ["small", "15"],
      ["big", "50"],
    ]);
    expect(document.querySelector('#d-pivot [data-ok-field="date-year"]')).toBeNull();
    rerender(
      <DataGrid
        id="d"
        aria-label="Sales"
        rows={SALES}
        columns={COLUMNS}
        getPivotDerivedColumns={null}
        showToolbar
        pivotModel={model}
        hideFooter
      />,
    );
    expect(document.querySelector('#d-pivot [data-ok-field="date-year"]')).toBeNull();
  });

  it("moves fields between sections by dragging, and in order by buttons", async () => {
    const onModel = vi.fn();
    render(
      <DataGrid
        id="m"
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        showToolbar
        initialState={{
          pivoting: {
            model: { ...model, rows: [{ field: "region" }, { field: "product" }] },
            active: true,
          },
        }}
        onPivotModelChange={onModel}
        hideFooter
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Pivot" }));
    const panel = document.getElementById("m-pivot") as HTMLElement;
    const section = (name: string) =>
      panel.querySelector(`[data-ok-data-grid-pivot-section="${name}"]`) as HTMLElement;
    const fieldsOf = (name: string) =>
      [...section(name).querySelectorAll("[data-ok-data-grid-pivot-field]")].map((f) =>
        f.getAttribute("data-ok-field"),
      );
    expect(fieldsOf("rows")).toEqual(["region", "product"]);
    expect(
      section("rows").querySelector("[data-ok-data-grid-pivot-section-title]")?.textContent,
    ).toBe("Rows");
    expect(section("rows").getAttribute("aria-labelledby")).toBe("m-pivot-section-rows");
    const hint = section("columns").querySelector("[data-ok-data-grid-pivot-empty]") as HTMLElement;
    expect(hint.hidden).toBe(true);
    // Move buttons: hidden for unused fields, disabled at the ends.
    const button = (field: string, direction: string) =>
      panel.querySelector(
        `[data-ok-field="${field}"] [data-ok-data-grid-pivot-move="${direction}"]`,
      ) as HTMLButtonElement;
    expect(button("date", "up").hidden).toBe(true);
    expect(button("region", "up").disabled).toBe(true);
    expect(button("product", "down").disabled).toBe(true);
    expect(button("region", "down").getAttribute("aria-label")).toBe("Move down: Region");
    button("region", "down").focus();
    fireEvent.click(button("region", "down"));
    expect(onModel.mock.lastCall?.[0].rows).toEqual([{ field: "product" }, { field: "region" }]);
    expect(fieldsOf("rows")).toEqual(["product", "region"]);
    // At the end now: the other button keeps the focus.
    expect(document.activeElement).toBe(button("region", "up"));
    // Drag the year from Columns into Rows, before Product.
    const handle = panel.querySelector(
      '[data-ok-field="year"] [data-ok-data-grid-pivot-handle]',
    ) as HTMLElement;
    const box = (el: Element) => el.getBoundingClientRect();
    const product = panel.querySelector('[data-ok-field="product"]') as HTMLElement;
    const start = box(handle);
    act(() => {
      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          pointerId: 1,
          clientX: start.left + 2,
          clientY: start.top + 2,
        }),
      );
      const to = {
        clientX: box(product).left + 4,
        clientY: box(product).top + 2,
        pointerId: 1,
        bubbles: true,
      };
      document.dispatchEvent(new PointerEvent("pointermove", to));
      document.dispatchEvent(new PointerEvent("pointerup", to));
    });
    expect(onModel.mock.lastCall?.[0]).toMatchObject({
      rows: [{ field: "year" }, { field: "product" }, { field: "region" }],
      columns: [],
    });
    expect(
      (section("columns").querySelector("[data-ok-data-grid-pivot-empty]") as HTMLElement).hidden,
    ).toBe(false);
    await expectNoAxeViolations(panel);
  });

  it("shows the pivot, edits it in the panel and turns it off", async () => {
    const onModel = vi.fn();
    const onActive = vi.fn();
    const apiRef = createRef<GridApi<Sale> | null>() as { current: GridApi<Sale> | null };
    render(
      <DataGrid
        id="p"
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        apiRef={apiRef}
        showToolbar
        initialState={{ pivoting: { model, active: true } }}
        onPivotModelChange={onModel}
        onPivotActiveChange={onActive}
        hideFooter
      />,
    );
    const g = grid();
    expect(
      [...g.querySelectorAll('[data-ok-data-grid-group-row] [role="columnheader"]')].map(
        (c) => c.textContent,
      ),
    ).toEqual(["2024", "2025"]);
    const headers = [
      ...g.querySelectorAll(
        '[data-ok-data-grid-header] > [role="row"]:not([data-ok-data-grid-group-row]) [role="columnheader"]',
      ),
    ];
    expect(headers.map((h) => h.textContent)).toEqual(["Group", "Units (sum)", "Units (sum)"]);
    expect(headers[1]?.querySelector("[data-ok-data-grid-menu-button]")).toBeNull();
    expect(texts()).toEqual([
      ["North", "10", "5"],
      ["South", "", "30"],
      ["East", "20", ""],
    ]);
    expect(document.querySelector("[data-ok-data-grid-aggregation-row]")?.textContent).toBe("3035");
    // Sorting a pivot column orders the groups by its values.
    fireEvent.click(headers[2] as HTMLElement);
    expect(texts().map((r) => r[0])).toEqual(["North", "South", "East"]);
    // The panel: switch, roles and functions.
    await userEvent.click(screen.getByRole("button", { name: "Pivot" }));
    const panel = document.getElementById("p-pivot") as HTMLElement;
    const product = within(panel).getByLabelText("Product") as HTMLSelectElement;
    fireEvent.change(product, { target: { value: "columns" } });
    expect(onModel).toHaveBeenLastCalledWith({
      ...model,
      columns: [{ field: "year" }, { field: "product" }],
    });
    const fn = panel.querySelector("#p-pivot-units-function") as HTMLSelectElement;
    expect(fn.disabled).toBe(false);
    fireEvent.change(fn, { target: { value: "max" } });
    expect(onModel.mock.lastCall?.[0].values).toEqual([{ field: "units", aggFunc: "max" }]);
    fireEvent.click(within(panel).getByRole("switch", { name: "Pivot" }));
    expect(onActive).toHaveBeenLastCalledWith(false);
    await userEvent.keyboard("{Escape}");
    expect(panel.hasAttribute("data-ok-open")).toBe(false);
    expect(screen.getByRole("grid")).toBeTruthy();
    // Exports keep the data rows and columns.
    act(() => (apiRef.current as GridApi<Sale>).setPivotActive(true));
    expect((apiRef.current as GridApi<Sale>).getDataAsCsv().split("\r\n")[0]).toBe(
      "﻿Region,Product,Year,Units,Date",
    );
    expect((apiRef.current as GridApi<Sale>).exportState().pivoting?.active).toBe(true);
    act(() =>
      (apiRef.current as GridApi<Sale>).setPivotModel({ rows: [], columns: [], values: [] }),
    );
    expect(texts()).toEqual([]);
  });

  it("pivots filtered rows; without the model there's no Pivot button", () => {
    const { rerender } = render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS.map((c) =>
          c.field === "units" ? { ...c, valueFormatter: (v) => `${v}!` } : c,
        )}
        showToolbar
        pivotModel={{ ...model, values: [...model.values, { field: "units", aggFunc: "size" }] }}
        pivotActive
        filterModel={{ items: [{ field: "region", operator: "equals", value: "north" }] }}
        hideFooter
      />,
    );
    expect(texts()).toEqual([["North", "10!", "1", "5!", "1"]]);
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        showToolbar
        hideFooter
      />,
    );
    expect(screen.queryByRole("button", { name: "Pivot" })).toBeNull();
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        showToolbar
        pivotActive
        disablePivoting
        pivotModel={model}
        hideFooter
      />,
    );
    expect(screen.queryByRole("button", { name: "Pivot" })).toBeNull();
    expect(screen.getByRole("grid")).toBeTruthy();
  });
});

const key = (target: Element, k: string, init: KeyboardEventInit = { ctrlKey: true }) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: k, ...init }),
  );
/** Ctrl + C on `target`, then the browser's copy on the text area: the copied text. */
const copy = (target: Element) => {
  key(target, "c");
  const transfer = new DataTransfer();
  const event = new ClipboardEvent("copy", {
    bubbles: true,
    cancelable: true,
    clipboardData: transfer,
  });
  const area = document.activeElement as HTMLTextAreaElement;
  if (area.tagName !== "TEXTAREA") return null;
  // Synthetic clipboard events can't always hold data (Firefox): watch what the grid writes.
  const written = vi.spyOn(DataTransfer.prototype, "setData");
  area.dispatchEvent(event);
  const data = written.mock.lastCall?.[1] ?? null;
  written.mockRestore();
  return data;
};
const paste = (target: Element, text: string) => {
  key(target, "v");
  const transfer = new DataTransfer();
  transfer.setData("text/plain", text);
  const area = document.activeElement as HTMLElement;
  const read = vi.spyOn(DataTransfer.prototype, "getData").mockReturnValue(text);
  area.dispatchEvent(
    new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }),
  );
  read.mockRestore();
  return area.tagName;
};
const pressed = (el: Element, init: PointerEventInit = {}) =>
  act(() => {
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, ...init }));
  });

describe("DataGrid cell selection and clipboard", () => {
  it("status bar: count, sum, average, min and max of the selected cells (polite)", async () => {
    const { rerender } = render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        cellSelection
        statusBar
        hideFooter
      />,
    );
    const bar = document.querySelector("[data-ok-data-grid-status-bar]") as HTMLElement;
    expect(bar.getAttribute("role")).toBe("status");
    expect(bar.textContent).toBe("");
    expect(bar.closest("[data-ok-data-grid]")?.hasAttribute("data-ok-status-bar")).toBe(true);
    pressed(cell("1", "region"));
    pressed(cell("4", "units"), { shiftKey: true });
    document.dispatchEvent(new PointerEvent("pointerup"));
    const items = () =>
      [...bar.querySelectorAll("[data-ok-data-grid-status-item]")].map((item) => [
        item.getAttribute("data-ok-data-grid-status-item"),
        item.textContent,
      ]);
    // 4 rows × 4 columns; years and units are numbers: 2024 + 2025 + 2025 + 2024 + 65 units.
    expect(items()).toEqual([
      ["count", "Count: 16"],
      ["sum", "Sum: 8,163"],
      ["avg", "Average: 1,020.38"],
      ["min", "Min: 5"],
      ["max", "Max: 2,025"],
    ]);
    // Text cells only: the count.
    pressed(cell("1", "region"));
    document.dispatchEvent(new PointerEvent("pointerup"));
    expect(items()).toEqual([["count", "Count: 1"]]);
    await expectNoAxeViolations(document.body);
    // The grid's aggregation functions and labels.
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        cellSelectionModel={{ "2": { units: true } }}
        cellSelection
        statusBar
        localeText={{ statusBarCount: "Cells", statusBarSum: "Total" }}
        aggregationFunctions={{ sum: { apply: (values) => `${values.length} value` } }}
        hideFooter
      />,
    );
    expect(items()).toEqual([
      ["count", "Cells: 1"],
      ["sum", "Total: 1 value"],
    ]);
    // Without cell selection: no status bar.
    rerender(<DataGrid aria-label="Sales" rows={SALES} columns={COLUMNS} statusBar hideFooter />);
    expect(document.querySelector("[data-ok-data-grid-status-bar]")).toBeNull();
  });

  it("selects ranges by press, Shift, Ctrl and keys, with edges", () => {
    const onCells = vi.fn();
    render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        cellSelection
        onCellSelectionModelChange={onCells}
        hideFooter
      />,
    );
    pressed(cell("1", "region"));
    expect(onCells).toHaveBeenLastCalledWith({ "1": { region: true } });
    pressed(cell("2", "product"), { shiftKey: true });
    expect(onCells).toHaveBeenLastCalledWith({
      "1": { region: true, product: true },
      "2": { region: true, product: true },
    });
    document.dispatchEvent(new PointerEvent("pointerup"));
    expect(cell("1", "region").getAttribute("aria-selected")).toBe("true");
    expect(cell("1", "region").getAttribute("data-ok-range-edge")).toBe("top left");
    expect(cell("2", "product").getAttribute("data-ok-range-edge")).toBe("right bottom");
    expect(cell("3", "region").hasAttribute("aria-selected")).toBe(false);
    pressed(cell("4", "units"), { ctrlKey: true });
    expect(onCells.mock.lastCall?.[0]["4"]).toEqual({ units: true });
    pressed(cell("4", "units"), { ctrlKey: true });
    expect(onCells.mock.lastCall?.[0]["4"]).toBeUndefined();
    document.dispatchEvent(new PointerEvent("pointerup"));
    // Shift + arrows extend from the focused cell; Ctrl + A selects every cell.
    cell("3", "year").focus();
    fireEvent.keyDown(cell("3", "year"), { key: "ArrowDown", shiftKey: true });
    expect(onCells).toHaveBeenLastCalledWith({ "3": { year: true }, "4": { year: true } });
    fireEvent.keyDown(document.activeElement as Element, { key: "a", ctrlKey: true });
    expect(Object.keys(onCells.mock.lastCall?.[0])).toEqual(["1", "2", "3", "4"]);
    expect(onCells.mock.lastCall?.[0]["4"]).toEqual({
      region: true,
      product: true,
      year: true,
      units: true,
      date: true,
    });
  });

  it("copies cells, selected rows or the focused cell", () => {
    const onCopy = vi.fn();
    const { rerender } = render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        cellSelectionModel={{ "1": { region: true, units: true }, "2": { units: true } }}
        cellSelection
        onClipboardCopy={onCopy}
        hideFooter
      />,
    );
    cell("2", "year").focus();
    expect(copy(cell("2", "year"))).toBe("North\t10\r\n\t30");
    expect(onCopy).toHaveBeenCalledWith("North\t10\r\n\t30");
    expect(document.activeElement).toBe(cell("2", "year"));
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        checkboxSelection
        rowSelectionModel={["3"]}
        clipboardCopyCellDelimiter=","
        hideFooter
      />,
    );
    expect(copy(cell("2", "year"))).toBe("North,Coffee,2025,5,2025-05-03");
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS.map((c) =>
          c.field === "units" ? { ...c, valueFormatter: (v) => `${v} u` } : c,
        )}
        ignoreValueFormatterDuringExport
        rowSelectionModel={[]}
        hideFooter
      />,
    );
    cell("4", "units").focus();
    expect(copy(cell("4", "units"))).toBe("20");
    // A header has nothing to copy.
    const header = document.querySelector(
      '[role="columnheader"][data-ok-field="units"]',
    ) as HTMLElement;
    header.focus();
    key(header, "c");
    expect(document.activeElement).toBe(header);
  });

  it("pastes into editable cells from the focused cell or the selection", async () => {
    const processRowUpdate = vi.fn((row: Sale) => row);
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const { rerender } = render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        processRowUpdate={processRowUpdate}
        onClipboardPasteStart={onStart}
        onClipboardPasteEnd={onEnd}
        hideFooter
      />,
    );
    cell("1", "product").focus();
    expect(paste(cell("1", "product"), "Mint\tX\t7\nLime\t\t8\nMore\t\t9\nGone")).toBe("TEXTAREA");
    await vi.waitUntil(() => onEnd.mock.calls.length > 0);
    expect(onStart).toHaveBeenCalledWith({
      data: [["Mint", "X", "7"], ["Lime", "", "8"], ["More", "", "9"], ["Gone"]],
    });
    // Year isn't editable; the pasted block stops at the last row.
    expect(processRowUpdate.mock.calls.map((c) => [c[0].product, c[0].year, c[0].units])).toEqual([
      ["Mint", 2024, 7],
      ["Lime", 2025, 8],
      ["More", 2025, 9],
      ["Gone", 2024, 20],
    ]);
    expect(cell("1", "product").textContent).toBe("Mint");
    // One value fills the selected cells; a custom splitter.
    processRowUpdate.mockClear();
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        cellSelection
        cellSelectionModel={{ "2": { units: true }, "3": { units: true, year: true } }}
        splitClipboardPastedText={(text) => [[text.toUpperCase()]]}
        processRowUpdate={processRowUpdate}
        hideFooter
      />,
    );
    cell("2", "region").focus();
    paste(cell("2", "region"), "42");
    await vi.waitUntil(() => processRowUpdate.mock.calls.length === 2);
    expect(processRowUpdate.mock.calls.map((c) => c[0].units)).toEqual([42, 42]);
    // Turned off, or nowhere to paste: nothing happens.
    processRowUpdate.mockClear();
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        disableClipboardPaste
        processRowUpdate={processRowUpdate}
        hideFooter
      />,
    );
    cell("2", "units").focus();
    expect(paste(cell("2", "units"), "1")).not.toBe("TEXTAREA");
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        processRowUpdate={processRowUpdate}
        hideFooter
      />,
    );
    const header = document.querySelector(
      '[role="columnheader"][data-ok-field="units"]',
    ) as HTMLElement;
    header.focus();
    paste(header, "1");
    await new Promise((r) => setTimeout(r, 10));
    expect(processRowUpdate).not.toHaveBeenCalled();
  });
});

describe("DataGrid phase 6 API", () => {
  it("reads and sets cell selection and chart models", () => {
    const apiRef = createRef<GridApi<Sale> | null>() as { current: GridApi<Sale> | null };
    render(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        apiRef={apiRef}
        cellSelection
        chartsIntegration
        hideFooter
      />,
    );
    act(() => apiRef.current?.setCellSelectionModel({ "1": { units: true } }));
    expect(apiRef.current?.getCellSelectionModel()).toEqual({ "1": { units: true } });
    expect(cell("1", "units").getAttribute("aria-selected")).toBe("true");
    act(() => apiRef.current?.setChartModel({ dimension: "region", values: ["units"] }));
    expect((document.querySelector("[data-ok-data-grid-chart]") as HTMLElement).hidden).toBe(false);
    expect(apiRef.current?.exportState().chartsIntegration).toEqual({
      model: { dimension: "region", values: ["units"] },
    });
  });
});

describe("DataGrid header filters", () => {
  it("filters through a row of fields under the headers", async () => {
    const onFilter = vi.fn();
    render(
      <DataGrid
        id="h"
        aria-label="Sales"
        disableVirtualization
        rows={SALES.map((s, i) => ({ ...s, active: i % 2 === 0, kind: i % 2 ? "B" : "A" }))}
        columns={[
          ...COLUMNS,
          { field: "active", headerName: "Active", type: "boolean" },
          { field: "kind", headerName: "Kind", type: "singleSelect", valueOptions: ["A", "B"] },
          { field: "x", headerName: "X", filterable: false },
        ]}
        headerFilters
        onFilterModelChange={onFilter}
        hideFooter
      />,
    );
    const row = document.querySelector("[data-ok-data-grid-header-filters]") as HTMLElement;
    expect(row.getAttribute("aria-rowindex")).toBe("2");
    expect(screen.getByRole("grid").getAttribute("aria-rowcount")).toBe("6");
    expect(bodyRows()[0]?.getAttribute("aria-rowindex")).toBe("3");
    expect(row.querySelector('[data-ok-filter-field="x"]')?.getAttribute("role")).toBe(
      "presentation",
    );
    const region = row.querySelector("#h-header-filter-region") as HTMLInputElement;
    expect(region.labels?.[0]?.textContent).toBe("contains");
    expect(region.closest('[role="columnheader"]')?.getAttribute("aria-label")).toBe(
      "Region filter",
    );
    fireEvent.change(region, { target: { value: "nor" } });
    expect(onFilter).toHaveBeenLastCalledWith({
      items: [{ field: "region", operator: "contains", value: "nor" }],
    });
    expect(bodyRows()).toHaveLength(2);
    const units = row.querySelector("#h-header-filter-units") as HTMLInputElement;
    fireEvent.change(units, { target: { value: "10" } });
    expect(bodyRows()).toHaveLength(1);
    fireEvent.change(units, { target: { value: "" } });
    fireEvent.change(region, { target: { value: "" } });
    expect(onFilter).toHaveBeenLastCalledWith({ items: [] });
    const active = row.querySelector("#h-header-filter-active") as HTMLSelectElement;
    fireEvent.change(active, { target: { value: "true" } });
    expect(bodyRows()).toHaveLength(2);
    fireEvent.change(active, { target: { value: "" } });
    const kind = row.querySelector("#h-header-filter-kind") as HTMLSelectElement;
    expect([...kind.options].map((o) => o.text)).toEqual(["any", "A", "B"]);
    fireEvent.change(kind, { target: { value: "B" } });
    expect(bodyRows()).toHaveLength(2);
    fireEvent.change(kind, { target: { value: "" } });
    // Up / Down leave a field for the cells.
    region.focus();
    fireEvent.keyDown(region, { key: "ArrowDown" });
    expect(document.activeElement?.closest("[data-ok-data-grid-body]")).not.toBeNull();
    // Dates: a date picker.
    const month = within(row).getByRole("spinbutton", { name: "Month" });
    await userEvent.click(month);
    await userEvent.keyboard("05032025");
    expect(onFilter.mock.lastCall?.[0].items).toEqual([
      { field: "date", operator: "is", value: "2025-05-03" },
    ]);
    expect(bodyRows()).toHaveLength(1);
    await expectNoAxeViolations(document.body);
  });
});

describe("DataGrid charts integration and date filters", () => {
  it("draws several charts, and the panel edits the one picked (MUI X)", async () => {
    const onModels = vi.fn();
    const onActive = vi.fn();
    const apiRef = createRef<GridApi<Sale> | null>() as { current: GridApi<Sale> | null };
    render(
      <DataGrid
        id="mc"
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        apiRef={apiRef}
        showToolbar
        chartsIntegration
        rowGroupingModel={["region"]}
        initialState={{
          chartsIntegration: {
            charts: {
              units: { label: "Units", values: ["units"] },
              years: { label: "Years", type: "line", values: ["year"] },
            },
          },
        }}
        onChartModelsChange={onModels}
        onActiveChartIdChange={onActive}
        hideFooter
      />,
    );
    const regions = [...document.querySelectorAll<HTMLElement>("[data-ok-data-grid-chart]")];
    expect(regions.map((r) => r.getAttribute("data-ok-chart-id"))).toEqual(["units", "years"]);
    expect(regions.map((r) => r.querySelector("figure")?.id)).toEqual([
      "mc-chart-units",
      "mc-chart-years",
    ]);
    expect(regions[1]?.querySelector("figure")?.getAttribute("data-ok-type")).toBe("line");
    expect(regions[0]?.querySelector("caption")?.textContent).toBe("Units");
    const root = grid().closest("[data-ok-data-grid]") as HTMLElement;
    expect(root.getAttribute("data-ok-active-chart-id")).toBe("units");
    expect(JSON.parse(root.getAttribute("data-ok-chart-models") as string).years.type).toBe("line");
    await userEvent.click(screen.getByRole("button", { name: "Chart" }));
    const panel = document.getElementById("mc-charts") as HTMLElement;
    const active = panel.querySelector("#mc-chart-active") as HTMLSelectElement;
    expect([...active.options].map((o) => o.textContent)).toEqual(["Units", "Years"]);
    fireEvent.change(within(panel).getByLabelText("Chart type"), { target: { value: "bar" } });
    expect(onModels.mock.lastCall?.[0].units.type).toBe("bar");
    expect(regions[0]?.querySelector("figure")?.hasAttribute("data-ok-horizontal")).toBe(true);
    fireEvent.change(active, { target: { value: "years" } });
    expect(onActive).toHaveBeenLastCalledWith("years");
    expect((within(panel).getByLabelText("Chart type") as HTMLSelectElement).value).toBe("line");
    act(() =>
      (apiRef.current as GridApi<Sale>).setChartModel({
        label: "Years",
        type: "area",
        values: ["year"],
      }),
    );
    expect(regions[1]?.querySelector("figure")?.getAttribute("data-ok-type")).toBe("area");
    expect((apiRef.current as GridApi<Sale>).exportState().chartsIntegration).toMatchObject({
      activeChartId: "years",
      charts: { years: { type: "area" } },
    });
    act(() => (apiRef.current as GridApi<Sale>).setActiveChartId("units"));
    expect(root.getAttribute("data-ok-active-chart-id")).toBe("units");
    act(() =>
      (apiRef.current as GridApi<Sale>).setChartModels({
        only: { values: ["units"] },
        "bad id!": {},
      }),
    );
    expect(
      [...document.querySelectorAll("[data-ok-data-grid-chart]")].map((r) =>
        r.getAttribute("data-ok-chart-id"),
      ),
    ).toEqual(["only"]);
    await expectNoAxeViolations(document.body);
  });

  it("charts the top-level groups or the page's rows", async () => {
    const onChart = vi.fn();
    const { rerender } = render(
      <DataGrid
        id="c"
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        showToolbar
        chartsIntegration
        rowGroupingModel={["region"]}
        initialState={{ chartsIntegration: { model: { values: ["units"] } } }}
        onChartModelChange={onChart}
        hideFooter
      />,
    );
    const region = document.querySelector("[data-ok-data-grid-chart]") as HTMLElement;
    expect(region.hidden).toBe(false);
    const table = region.querySelector("table") as HTMLTableElement;
    expect(
      [...(table.tBodies[0] as HTMLTableSectionElement).rows].map((r) => r.textContent),
    ).toEqual(["North15", "South30", "East20"]);
    await userEvent.click(screen.getByRole("button", { name: "Chart" }));
    const panel = document.getElementById("c-charts") as HTMLElement;
    fireEvent.change(within(panel).getByLabelText("Chart type"), { target: { value: "bar" } });
    expect(onChart).toHaveBeenLastCalledWith({ values: ["units"], type: "bar" });
    expect(region.querySelector("figure")?.hasAttribute("data-ok-horizontal")).toBe(true);
    fireEvent.change(within(panel).getByLabelText("Chart type"), { target: { value: "line" } });
    expect(region.querySelector("figure")?.getAttribute("data-ok-type")).toBe("line");
    fireEvent.click(within(panel).getByRole("switch", { name: "Series: Year" }));
    expect(onChart.mock.lastCall?.[0].values).toEqual(["units", "year"]);
    fireEvent.click(within(panel).getByRole("switch", { name: "Series: Units" }));
    expect(onChart.mock.lastCall?.[0].values).toEqual(["year"]);
    fireEvent.change(within(panel).getByLabelText("Category"), { target: { value: "product" } });
    expect(onChart.mock.lastCall?.[0].dimension).toBe("product");
    fireEvent.change(within(panel).getByLabelText("Category"), { target: { value: "" } });
    expect(onChart.mock.lastCall?.[0].dimension).toBeNull();
    await userEvent.keyboard("{Escape}");
    expect(panel.hasAttribute("data-ok-open")).toBe(false);
    // Without grouping: one category per row of the page (needs a dimension).
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        chartsIntegration
        chartModel={{ type: "area", dimension: "product", values: ["units", "nope"] }}
        hideFooter
      />,
    );
    expect(
      [...(document.querySelector("[data-ok-data-grid-chart] tbody") as HTMLElement).children].map(
        (r) => r.textContent,
      ),
    ).toEqual(["Tea10", "Tea30", "Coffee5", "Juice20"]);
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        chartsIntegration
        chartModel={{ dimension: "nope", values: ["units"] }}
        hideFooter
      />,
    );
    expect((document.querySelector("[data-ok-data-grid-chart]") as HTMLElement).hidden).toBe(true);
  });

  it("offers every chart type with stacking, value labels and a legend", async () => {
    const onChart = vi.fn();
    render(
      <DataGrid
        id="t"
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        showToolbar
        chartsIntegration
        rowGroupingModel={["region"]}
        initialState={{ chartsIntegration: { model: { values: ["units"] } } }}
        onChartModelChange={onChart}
        hideFooter
      />,
    );
    const figure = () => document.querySelector("[data-ok-data-grid-chart] figure") as HTMLElement;
    await userEvent.click(screen.getByRole("button", { name: "Chart" }));
    const panel = document.getElementById("t-charts") as HTMLElement;
    const type = within(panel).getByLabelText("Chart type") as HTMLSelectElement;
    expect([...type.options].map((o) => o.textContent)).toEqual([
      "Column",
      "Bar",
      "Line",
      "Area",
      "Pie",
      "Donut",
      "Radar",
      "Scatter",
    ]);
    // Stacking needs two series of a stackable type.
    const stacked = within(panel).getByRole("switch", { name: "Stacked" }) as HTMLInputElement;
    expect(stacked.disabled).toBe(true);
    fireEvent.click(within(panel).getByRole("switch", { name: "Series: Year" }));
    expect(stacked.disabled).toBe(false);
    fireEvent.click(stacked);
    expect(onChart).toHaveBeenLastCalledWith({ values: ["units", "year"], stacked: true });
    expect(figure().hasAttribute("data-ok-stacked")).toBe(true);
    fireEvent.click(within(panel).getByRole("switch", { name: "Show values" }));
    expect(onChart.mock.lastCall?.[0].itemLabel).toBe("value");
    expect(figure().hasAttribute("data-ok-data-labels")).toBe(true);
    fireEvent.change(within(panel).getByLabelText("Legend"), { target: { value: "right" } });
    expect(figure().getAttribute("data-ok-legend")).toBe("right");
    for (const [value, drawn] of [
      ["pie", "pie"],
      ["donut", "donut"],
      ["radar", "radar"],
      ["scatter", "scatter"],
      ["column", "bar"],
    ] as const) {
      fireEvent.change(type, { target: { value } });
      expect(figure().getAttribute("data-ok-type")).toBe(drawn);
      expect(figure().hasAttribute("data-ok-stacked")).toBe(value === "column");
      expect(stacked.disabled).toBe(value !== "column");
    }
    fireEvent.click(within(panel).getByRole("switch", { name: "Show values" }));
    expect(onChart.mock.lastCall?.[0].itemLabel).toBe("none");
    fireEvent.click(within(panel).getByRole("switch", { name: "Series: Year" }));
    expect(onChart.mock.lastCall?.[0].values).toEqual(["units"]);
    await expectNoAxeViolations(panel);
  });

  it("follows filters, rows and pivots, and draws scatter points of a number dimension", async () => {
    const apiRef = createRef<GridApi<Sale> | null>() as { current: GridApi<Sale> | null };
    const { rerender } = render(
      <DataGrid
        apiRef={apiRef}
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        chartsIntegration
        rowGroupingModel={["region"]}
        chartModel={{ type: "pie", values: ["units"], colors: ["info", "error"] }}
        hideFooter
      />,
    );
    const body = () =>
      [...(document.querySelector("[data-ok-data-grid-chart] tbody") as HTMLElement).children].map(
        (r) => r.textContent,
      );
    const colors = () =>
      [...document.querySelectorAll("[data-ok-data-grid-chart] tbody td")].map((td) =>
        td.getAttribute("data-ok-color"),
      );
    expect(body()).toEqual(["North15", "South30", "East20"]);
    expect(colors()).toEqual(["info", "error", "info"]);
    // Groups aggregate the rows that pass the filters.
    act(() =>
      apiRef.current?.setFilterModel({
        items: [{ field: "product", operator: "equals", value: "Tea" }],
      }),
    );
    expect(body()).toEqual(["North10", "South30"]);
    act(() => apiRef.current?.setFilterModel({ items: [] }));
    // New rows redraw the chart (the Chart's update path: new series).
    rerender(
      <DataGrid
        apiRef={apiRef}
        aria-label="Sales"
        disableVirtualization
        rows={SALES.map((r) => (r.id === "2" ? { ...r, units: 31 } : r))}
        columns={COLUMNS}
        chartsIntegration
        rowGroupingModel={["region"]}
        chartModel={{ type: "pie", values: ["units"], colors: ["info", "error"] }}
        hideFooter
      />,
    );
    expect(body()).toEqual(["North15", "South31", "East20"]);
    // Pivot: a value field stands for its pivot columns, one series per key.
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        chartsIntegration
        pivotActive
        pivotModel={{
          rows: [{ field: "region" }],
          columns: [{ field: "year" }],
          values: [{ field: "units", aggFunc: "sum" }],
        }}
        chartModel={{ values: ["units"], stacked: true, seriesAxisLabel: "Units" }}
        hideFooter
      />,
    );
    const figure = document.querySelector("[data-ok-data-grid-chart] figure") as HTMLElement;
    expect(document.querySelector("[data-ok-data-grid-chart] thead")?.textContent).toBe(
      "Category20242025",
    );
    expect(body()).toEqual(["North105", "South30", "East20"]);
    expect(figure.hasAttribute("data-ok-stacked")).toBe(true);
    expect(figure.getAttribute("data-ok-y-title")).toBe("Units");
    // Rows with a number dimension: a scatter chart of [x, y] points.
    rerender(
      <DataGrid
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        chartsIntegration
        chartModel={{ type: "scatter", dimension: "year", values: ["units"] }}
        hideFooter
      />,
    );
    const scatter = document.querySelector("[data-ok-data-grid-chart] figure") as HTMLElement;
    expect(scatter.getAttribute("data-ok-x-type")).toBe("numeric");
    expect(scatter.querySelectorAll("[data-ok-chart-marker]")).toHaveLength(4);
  });

  it("filters dates with a date picker in the filter panel", async () => {
    const onFilter = vi.fn();
    render(
      <DataGrid
        id="d"
        aria-label="Sales"
        disableVirtualization
        rows={SALES}
        columns={COLUMNS}
        showToolbar
        initialState={{
          filter: {
            filterModel: { items: [{ field: "date", operator: "after", value: "2025-05-02" }] },
          },
        }}
        onFilterModelChange={onFilter}
        hideFooter
      />,
    );
    expect(bodyRows()).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    const panel = document.getElementById("d-filters") as HTMLElement;
    const month = within(panel).getByRole("spinbutton", { name: "Month" });
    expect(month.textContent).toBe("05");
    await userEvent.click(month);
    await userEvent.keyboard("05012025");
    expect(onFilter).toHaveBeenLastCalledWith({
      items: [{ field: "date", operator: "after", value: "2025-05-01" }],
    });
    fireEvent.change(within(panel).getByLabelText("Operator"), { target: { value: "isEmpty" } });
    expect(within(panel).queryByRole("spinbutton", { name: "Month" })).toBeNull();
  });

  it("filters date times with a date time picker in the panel and the header filters", async () => {
    type Timed = Sale & { at: string };
    const onFilter = vi.fn();
    const rows: Timed[] = SALES.map((s, i) => ({ ...s, at: `2025-05-0${i + 1}T09:30:00` }));
    const columns: GridColDef<Timed>[] = [
      { field: "region", headerName: "Region", width: 120 },
      { field: "units", headerName: "Units", type: "number", width: 90 },
      { field: "at", headerName: "At", type: "dateTime", width: 300 },
    ];
    render(
      <DataGrid
        id="t"
        aria-label="Sales"
        disableVirtualization
        rows={rows}
        columns={columns}
        showToolbar
        headerFilters
        initialState={{
          filter: {
            filterModel: { items: [{ field: "at", operator: "after", value: "2025-05-02T09:30" }] },
          },
        }}
        onFilterModelChange={onFilter}
        hideFooter
      />,
    );
    expect(bodyRows()).toHaveLength(2);
    // Header filter: a date time picker showing the item's value.
    const cell = document.querySelector(
      '[data-ok-data-grid-header-filters] [data-ok-filter-field="at"]',
    ) as HTMLElement;
    const picker = cell.querySelector("[data-ok-date-picker]") as HTMLElement;
    expect(picker.getAttribute("data-ok-value-type")).toBe("date-time");
    expect(within(cell).getByRole("spinbutton", { name: "Hours" }).textContent).toBe("09");
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    const panel = document.getElementById("t-filters") as HTMLElement;
    const month = within(panel).getByRole("spinbutton", { name: "Month" });
    expect(month.textContent).toBe("05");
    expect(within(panel).getByRole("spinbutton", { name: "Minutes" }).textContent).toBe("30");
    await userEvent.click(month);
    await userEvent.keyboard("050320251000a");
    expect(onFilter).toHaveBeenLastCalledWith({
      items: [{ field: "at", operator: "after", value: "2025-05-03T10:00:00" }],
    });
    expect(bodyRows()).toHaveLength(1);
    // No value for isEmpty; another column type brings the text field back.
    fireEvent.change(within(panel).getByLabelText("Operator"), { target: { value: "isEmpty" } });
    expect(within(panel).queryByRole("spinbutton", { name: "Month" })).toBeNull();
    fireEvent.change(within(panel).getByLabelText("Operator"), { target: { value: "is" } });
    fireEvent.change(within(panel).getByLabelText("Columns"), { target: { value: "region" } });
    expect(within(panel).queryByRole("spinbutton", { name: "Month" })).toBeNull();
    expect(panel.querySelector("#t-filter-value")?.tagName).toBe("INPUT");
    await userEvent.keyboard("{Escape}");
    // Header filter: a whole date time filters with its operator ("is").
    await userEvent.click(within(cell).getByRole("spinbutton", { name: "Month" }));
    await userEvent.keyboard("050420250930a");
    expect(onFilter.mock.lastCall?.[0].items).toContainEqual({
      field: "at",
      operator: "is",
      value: "2025-05-04T09:30:00",
    });
    await expectNoAxeViolations(document.body);
  });

  it("renders on the server", () => {
    expect(() =>
      renderToString(
        <DataGrid
          aria-label="Sales"
          disableVirtualization
          rows={SALES}
          columns={COLUMNS}
          showToolbar
          rowGroupingModel={["region"]}
          aggregationModel={{ units: "sum" }}
          headerFilters
          cellSelection
          chartsIntegration
          chartModel={{ values: ["units"] }}
          pivotModel={{ rows: [], columns: [], values: [] }}
        />,
      ),
    ).not.toThrow();
  });
});
