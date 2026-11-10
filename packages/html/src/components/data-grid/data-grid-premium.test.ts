import { type GridGetRowsParams, gridCrc32 } from "@owlky/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { DataGridInstance } from "./data-grid.js";

const snippets = Object.fromEntries(
  Object.entries(
    import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
  ).map(([path, html]) => [(path.split("/").pop() as string).replace(".html", ""), html]),
) as Record<string, string>;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.restoreAllMocks();
});
const setup = (name: string, edit?: (root: HTMLElement) => void) => {
  const host = mount(snippets[name] as string);
  const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
  // The test page is narrow: every column renders.
  root.setAttribute("data-ok-disable-virtualization", "");
  edit?.(root);
  runtime = createRuntime()
    .register(...components)
    .start();
  const instance = runtime.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
  return { host, root, instance };
};
const bodyRows = (host: Element) => [
  ...host.querySelectorAll<HTMLElement>('[data-ok-data-grid-body] > [role="row"]:not([hidden])'),
];
const shownCells = (row: Element) =>
  [...row.querySelectorAll<HTMLElement>(':scope > [role="gridcell"]:not([hidden])')].map((c) =>
    c.textContent?.trim(),
  );
const texts = (host: Element) => bodyRows(host).map(shownCells);
const cell = (host: Element, rowId: string, field: string) =>
  host.querySelector<HTMLElement>(
    `[data-ok-row-id="${rowId}"] > [role="gridcell"][data-ok-field="${field}"]`,
  ) as HTMLElement;
const header = (host: Element, field: string) =>
  host.querySelector<HTMLElement>(
    `[data-ok-data-grid-header] [role="columnheader"][data-ok-field="${field}"]`,
  ) as HTMLElement;
const menuSelect = (host: Element, field: string, action: string) => {
  (header(host, field).querySelector("[data-ok-data-grid-menu-button]") as HTMLElement).click();
  const item = host.querySelector<HTMLElement>(
    `[data-ok-data-grid-action="${action}"]`,
  ) as HTMLElement;
  item.click();
  return item;
};
const key = (target: Element, k: string, init: KeyboardEventInit = { ctrlKey: true }) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: k, ...init }),
  );
const pressed = (target: Element, init: PointerEventInit = {}) => {
  target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, ...init }));
  document.dispatchEvent(new PointerEvent("pointerup"));
};

describe("data grid row grouping and aggregation (HTML)", () => {
  it("builds group rows, counts, aggregates and the footer like React", async () => {
    const { host, root, instance } = setup("grouping-group");
    const grid = host.querySelector('[role="treegrid"]') as HTMLElement;
    expect(grid).not.toBeNull();
    const rows = bodyRows(host);
    expect(rows.map((r) => r.getAttribute("data-ok-row-id"))).toEqual([
      "auto-generated-row-region/North",
      "auto-generated-row-region/South",
      "auto-generated-row-region/East",
      "auto-generated-row-region/West",
    ]);
    expect(shownCells(rows[0] as HTMLElement)).toEqual(["North(6)", "", "", "", "300", "1760"]);
    expect(
      header(host, "units").querySelector("[data-ok-data-grid-aggregation-label]")?.textContent,
    ).toBe("sum");
    const footer = host.querySelector("[data-ok-data-grid-aggregation-row]") as HTMLElement;
    expect(footer.getAttribute("aria-rowindex")).toBe("6");
    expect(grid.getAttribute("aria-rowcount")).toBe("6");
    // Open a group: its rows follow, numbered after it.
    (
      (rows[0] as HTMLElement).querySelector("[data-ok-data-grid-tree-toggle]") as HTMLElement
    ).click();
    const open = bodyRows(host);
    expect(open).toHaveLength(10);
    expect(open[1]?.getAttribute("data-ok-parent")).toBe("auto-generated-row-region/North");
    expect(open[1]?.getAttribute("aria-level")).toBe("2");
    expect(
      open[0]?.querySelector("[data-ok-data-grid-tree-toggle]")?.getAttribute("aria-label"),
    ).toBe("hide children");
    // Sorting by an aggregated value orders the groups.
    header(host, "revenue").click();
    expect(
      bodyRows(host)
        .filter((r) => r.hasAttribute("data-ok-generated"))
        .map((r) => shownCells(r)[5]),
    ).toEqual(["1760", "1770", "2098", "2119"]);
    header(host, "region").click();
    expect(
      bodyRows(host)
        .filter((r) => r.hasAttribute("data-ok-generated"))
        .map((r) => shownCells(r)[0]),
    ).toEqual(["East(6)", "North(6)", "South(6)", "West(6)"]);
    // Column menu: aggregation functions follow the type; grouping by another field.
    const onAggregation = vi.fn();
    root.addEventListener("ok:data-grid:aggregation", onAggregation);
    (
      header(host, "region").querySelector("[data-ok-data-grid-menu-button]") as HTMLElement
    ).click();
    const item = (a: string) =>
      host.querySelector<HTMLElement>(`[data-ok-data-grid-action="${a}"]`) as HTMLElement;
    expect(item("group").textContent).toBe("Stop grouping by Region");
    expect(item("aggregate-sum").hidden).toBe(true);
    expect(item("aggregate-size").hidden).toBe(false);
    expect(item("aggregate-none").hasAttribute("data-ok-selected")).toBe(true);
    item("aggregate-size").click();
    expect(onAggregation.mock.lastCall?.[0].detail.model).toEqual({
      units: "sum",
      revenue: "sum",
      region: "size",
    });
    expect(shownCells(bodyRows(host)[0] as HTMLElement)[1]).toBe("6");
    menuSelect(host, "units", "aggregate-avg");
    expect(instance.aggregationModel["units"]).toBe("avg");
    menuSelect(host, "units", "aggregate-none");
    expect(instance.aggregationModel["units"]).toBeUndefined();
    // Refused changes keep the model.
    root.addEventListener("ok:data-grid:rowgrouping", (e) => e.preventDefault(), { once: true });
    menuSelect(host, "product", "group");
    expect(instance.rowGroupingModel).toEqual(["region"]);
    menuSelect(host, "product", "group");
    expect(instance.rowGroupingModel).toEqual(["region", "product"]);
    expect(root.getAttribute("data-ok-row-grouping-model")).toBe('["region","product"]');
    menuSelect(host, "region", "group");
    menuSelect(host, "product", "group");
    expect(instance.rowGroupingModel).toEqual([]);
    expect(host.querySelector('[role="grid"]')).not.toBeNull();
    expect(header(host, "__row_group_by_columns_group__")).toBeNull();
    expect(bodyRows(host)[0]?.hasAttribute("aria-level")).toBe(false);
    await settle();
  });

  it("shows one grouping column per grouped field, like React", async () => {
    const { host, root, instance } = setup("grouping-multiple");
    const fields = () =>
      [...host.querySelectorAll('[data-ok-data-grid-header] [role="columnheader"]')]
        .map((h) => h.getAttribute("data-ok-field") as string)
        .filter((f) => f.startsWith("__"));
    expect(fields()).toEqual([
      "__row_group_by_columns_group_region__",
      "__row_group_by_columns_group_product__",
    ]);
    const north = bodyRows(host)[0] as HTMLElement;
    expect(shownCells(north).slice(0, 2)).toEqual(["North(6)", ""]);
    (north.querySelector("[data-ok-data-grid-tree-toggle]") as HTMLElement).click();
    expect(shownCells(bodyRows(host)[1] as HTMLElement).slice(0, 2)).toEqual(["", "Tea(2)"]);
    // A grouping column sorts its field's groups by name.
    instance.setSortModel([{ field: "__row_group_by_columns_group_product__", sort: "desc" }]);
    expect(
      bodyRows(host)
        .slice(1, 4)
        .map((r) => shownCells(r)[1]),
    ).toEqual(["Tea(2)", "Juice(2)", "Coffee(2)"]);
    // Grouping by another field adds its column, named after it.
    menuSelect(host, "year", "group");
    expect(fields()).toHaveLength(3);
    expect(header(host, "__row_group_by_columns_group_year__").textContent).toBe("Year");
    // One column again when the mode changes.
    root.setAttribute("data-ok-row-grouping-column-mode", "single");
    await settle();
    expect(fields()).toEqual(["__row_group_by_columns_group__"]);
    expect(shownCells(bodyRows(host)[0] as HTMLElement)[0]).toBe("North(6)");
    root.setAttribute("data-ok-row-grouping-column-mode", "multiple");
    await settle();
    expect(fields()).toHaveLength(3);
    instance.setRowGroupingModel([]);
    expect(fields()).toEqual([]);
    expect(host.querySelector('[role="grid"]')).not.toBeNull();
  });

  it("groups by the grouping values React writes, or a getter", () => {
    const { host, instance } = setup("grouping-value");
    const names = () =>
      bodyRows(host)
        .filter((r) => r.hasAttribute("data-ok-generated"))
        .map((r) => shownCells(r)[0]);
    expect(names()).toEqual(["Under 50 units(11)", "50 units or more(13)"]);
    instance.setGroupingValueGetter("units", (value) => (Number(value) % 2 ? "Odd" : "Even"));
    expect(names().map((n) => n?.replace(/\(\d+\)/, ""))).toEqual(["Even", "Odd"]);
    instance.setGroupingValueGetter(
      "units",
      (value) => new Date(2025, 0, Number(value) > 50 ? 2 : 1),
    );
    expect(names().map((n) => n?.replace(/\(\d+\)/, ""))).toEqual(["2025-01-01", "2025-01-02"]);
    instance.setGroupingValueGetter("units", null);
    expect(names()).toEqual(["Under 50 units(11)", "50 units or more(13)"]);
  });

  it("builds group footers from data-ok-aggregation-position, like React", async () => {
    const { host, root, instance } = setup("grouping-footers");
    const footers = () =>
      bodyRows(host).filter((r) => r.hasAttribute("data-ok-data-grid-aggregation-row"));
    // Every group open: a footer after each group's rows, none for the root.
    expect(footers()).toHaveLength(4);
    const north = footers()[0] as HTMLElement;
    expect(north.getAttribute("data-ok-row-id")).toBe(
      "auto-generated-group-footer-auto-generated-row-region/North",
    );
    expect(north.getAttribute("aria-level")).toBe("2");
    expect(shownCells(north)).toEqual(["", "", "", "", "300", "1760"]);
    expect(shownCells(bodyRows(host)[0] as HTMLElement)).toEqual(["North(6)", "", "", "", "", ""]);
    expect(bodyRows(host)[7]).toBe(north);
    expect(host.querySelector("[data-ok-data-grid-pinned-rows]")).toBeNull();
    // Closing a group drops its footer; the indexes follow.
    (
      (bodyRows(host)[0] as HTMLElement).querySelector(
        "[data-ok-data-grid-tree-toggle]",
      ) as HTMLElement
    ).click();
    expect(footers()).toHaveLength(3);
    expect(bodyRows(host)[1]?.getAttribute("aria-rowindex")).toBe("3");
    // Back to the defaults: values in the group rows, the root's in a footer row.
    root.removeAttribute("data-ok-aggregation-position");
    await settle();
    expect(footers()).toHaveLength(0);
    expect(shownCells(bodyRows(host)[0] as HTMLElement)).toEqual([
      "North(6)",
      "",
      "",
      "",
      "300",
      "1760",
    ]);
    expect(
      host.querySelector('[data-ok-row-id="auto-generated-group-footer-root"]'),
    ).not.toBeNull();
    root.setAttribute("data-ok-aggregation-position", '{"region":null,"root":"footer"}');
    await settle();
    expect(shownCells(bodyRows(host)[0] as HTMLElement)[4]).toBe("");
    instance.setAggregationModel({});
    expect(host.querySelector("[data-ok-data-grid-aggregation-row]")).toBeNull();
  });

  it("asks a data source for the aggregation and shows its values", async () => {
    const { host, root, instance } = setup("server-aggregation-group");
    const asked: GridGetRowsParams[] = [];
    let answer: (() => void) | undefined;
    instance.setDataSource({
      getRows: (params) =>
        new Promise((resolve) => {
          asked.push(params);
          answer = () =>
            resolve({
              rows: [{ id: "c-1", firstName: "Ana", lastName: "Silva", age: 40, city: "Lima" }],
              rowCount: 1,
              aggregateRow: { age: { value: 40 }, id: { value: 1 } },
            });
        }),
      getAggregatedValue: (row, field) =>
        ((row as Record<string, { value?: number }>)[field] as { value?: number }).value,
    });
    expect(asked[0]?.aggregationModel).toEqual({ age: "avg", id: "size" });
    answer?.();
    await settle();
    const footer = host.querySelector(
      '[data-ok-row-id="auto-generated-group-footer-root"]',
    ) as HTMLElement;
    expect(cell(host, "auto-generated-group-footer-root", "age").textContent).toBe("40");
    expect(cell(host, "auto-generated-group-footer-root", "id").textContent).toBe("1");
    expect(footer).not.toBeNull();
    // A new aggregation asks again.
    instance.setAggregationModel({ age: "max" });
    expect(asked.at(-1)?.aggregationModel).toEqual({ age: "max" });
    expect(root.getAttribute("data-ok-aggregation-model")).toBe('{"age":"max"}');
  });

  it("filters leaves, selects data rows, exports and keeps its state", () => {
    const { host, root, instance } = setup("grouping-group", (r) =>
      r.setAttribute("data-ok-aggregation-rows-scope", "all"),
    );
    instance.setFilterModel({ items: [{ field: "product", operator: "equals", value: "tea" }] });
    const rows = bodyRows(host);
    expect(rows.map((r) => shownCells(r)[0])).toEqual([
      "North(2)",
      "South(2)",
      "East(2)",
      "West(2)",
    ]);
    // Scope "all": every row of the group counts.
    expect(shownCells(rows[0] as HTMLElement)[4]).toBe("300");
    instance.setFilterModel({ items: [] });
    expect(instance.toCsv().split("\r\n")).toHaveLength(25);
    const xlsx = instance.toExcel({ fields: ["region"] });
    expect([...xlsx.subarray(0, 2)]).toEqual([0x50, 0x4b]);
    expect(gridCrc32(xlsx)).toBeGreaterThan(0);
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    (host.querySelector('[data-ok-data-grid-export="excel"]') as HTMLElement).click();
    expect((create.mock.calls[0] as [Blob])[0].type).toContain("spreadsheetml");
    expect((click.mock.instances[0] as unknown as HTMLAnchorElement).download).toBe("data.xlsx");
    instance.exportCsv({ fileName: "x" });
    expect((click.mock.instances[1] as unknown as HTMLAnchorElement).download).toBe("x.csv");
    const state = instance.exportState();
    expect(state.rowGrouping).toEqual({ model: ["region"] });
    expect(state.aggregation).toEqual({ model: { units: "sum", revenue: "sum" } });
    instance.restoreState({ rowGrouping: { model: [] }, aggregation: { model: { units: "max" } } });
    expect(host.querySelector('[role="grid"]')).not.toBeNull();
    expect(host.querySelector("[data-ok-data-grid-aggregation-row]")?.textContent?.trim()).toBe(
      "99",
    );
    instance.setAggregationModel({});
    expect(host.querySelector("[data-ok-data-grid-aggregation-row]")).toBeNull();
    expect(host.querySelector('[data-ok-data-grid-pinned-rows="bottom"]')).toBeNull();
    instance.setRowGroupingModel(["product"]);
    expect(bodyRows(host).map((r) => shownCells(r)[0])).toEqual([
      "Tea(8)",
      "Juice(8)",
      "Coffee(8)",
    ]);
    instance.setAggregationModel({ units: "sum", nope: "sum" } as never);
    expect(root.getAttribute("data-ok-aggregation-model")).toBe('{"units":"sum","nope":"sum"}');
  });

  it("groups a grid at runtime: the group column comes and goes", () => {
    const { host, root, instance } = setup("basic-group");
    root.toggleAttribute("data-ok-checkbox-selection", true);
    instance.setRowGroupingModel(["lastName"]);
    expect(header(host, "__row_group_by_columns_group__")?.getAttribute("aria-colindex")).toBe("2");
    const first = bodyRows(host)[0] as HTMLElement;
    expect(first.hasAttribute("data-ok-generated")).toBe(true);
    expect(first.querySelector('[data-ok-field="__check__"]')?.children).toHaveLength(0);
    // Generated rows can't be selected or edited.
    first.click();
    expect(instance.selection).toEqual([]);
    instance.setRowGroupingModel([]);
    expect(header(host, "__row_group_by_columns_group__")).toBeNull();
    expect(
      host.querySelector(
        '[data-ok-data-grid-body] [data-ok-field="__row_group_by_columns_group__"]',
      ),
    ).toBeNull();
  });

  it("keeps generated tree parents from the markup", () => {
    const { host } = setup("grouping-tree");
    const rows = bodyRows(host);
    expect(rows.map((r) => r.getAttribute("data-ok-row-id"))).toContain("auto-generated-row-Docs");
    const docs = rows.find((r) => r.getAttribute("data-ok-row-id") === "auto-generated-row-Docs");
    expect(docs?.getAttribute("aria-expanded")).toBe("true");
    const child = host.querySelector<HTMLElement>(
      '[data-ok-row-id="f-1"] [data-ok-field="__tree_data_group__"]',
    ) as HTMLElement;
    child.focus();
    key(child, "ArrowLeft", {});
    expect(document.activeElement?.closest("[data-ok-row-id]")).toBe(docs);
  });

  it("groups through a data source: grouped fields and group keys", async () => {
    const { host, instance } = setup("server-group", (root) =>
      root.setAttribute("data-ok-row-grouping-model", '["city"]'),
    );
    const getRows = vi.fn(async (params: GridGetRowsParams) => ({
      rows: params.groupKeys?.length
        ? [{ id: "c-1", firstName: "Ana", lastName: "Silva", age: 40, city: "Lima" }]
        : [{ id: "g-lima", firstName: "", lastName: "", age: 0, city: "Lima" }],
    }));
    instance.setDataSource({
      getRows,
      getGroupKey: (row) => String(row["city"]),
      getChildrenCount: (row) => (String(row["id"]).startsWith("g-") ? 1 : 0),
    });
    await vi.waitUntil(() => host.querySelector('[data-ok-row-id="g-lima"]'));
    expect(getRows.mock.calls[0]?.[0]).toMatchObject({ groupKeys: [], groupFields: ["city"] });
  });
});

describe("data grid pivot panel and derived columns (HTML)", () => {
  it("pivots by the year and quarter of a date, or by fields you derive", () => {
    const { host, instance } = setup("pivot-derived");
    const groups = () =>
      [...host.querySelectorAll('[data-ok-data-grid-group-row] > [role="columnheader"]')].map((c) =>
        c.textContent?.trim(),
      );
    expect(groups()).toEqual(["2024", "2025", "Q1", "Q2", "Q3", "Q4", "Q1", "Q2", "Q3", "Q4"]);
    expect(texts(host).map((r) => r[0])).toEqual(["AAPL", "MSFT", "GOOGL"]);
    // Fields you derive (null: none).
    instance.setPivotDerivedColumns((column) =>
      column.field === "date"
        ? [
            {
              field: "date-year",
              headerName: "Year",
              valueGetter: (raw) => (String(raw).startsWith("2024") ? "Last year" : "This year"),
            },
          ]
        : undefined,
    );
    expect(groups()).toEqual(["Last year", "This year"]);
    instance.setPivotDerivedColumns(null);
    expect(groups()).toEqual([]);
  });

  it("moves fields by dragging and by the Move buttons, like React", () => {
    const { host, instance } = setup("pivot-group");
    const panel = host.querySelector("#grid-pivot-pivot") as HTMLElement;
    const section = (name: string) =>
      panel.querySelector(`[data-ok-data-grid-pivot-section="${name}"]`) as HTMLElement;
    const fieldsOf = (name: string) =>
      [...section(name).querySelectorAll("[data-ok-data-grid-pivot-field]")].map((f) =>
        f.getAttribute("data-ok-field"),
      );
    const button = (field: string, direction: string) =>
      panel.querySelector(
        `[data-ok-field="${field}"] [data-ok-data-grid-pivot-move="${direction}"]`,
      ) as HTMLButtonElement;
    // Open the panel (the test page has no popover runtime styles for it).
    panel.setAttribute("data-ok-open", "");
    panel.style.cssText = "display:block;position:static";
    expect(fieldsOf("values")).toEqual(["revenue", "units"]);
    button("revenue", "down").focus();
    button("revenue", "down").click();
    expect(instance.pivotModel.values.map((v) => v.field)).toEqual(["units", "revenue"]);
    expect(fieldsOf("values")).toEqual(["units", "revenue"]);
    expect(button("revenue", "down").disabled).toBe(true);
    expect(document.activeElement).toBe(button("revenue", "up"));
    expect(button("product", "up").hidden).toBe(true);
    // Unused fields keep the columns' order.
    expect(fieldsOf("none")).toEqual(["product"]);
    // Drag the product into Rows, after Region.
    const handle = panel.querySelector(
      '[data-ok-field="product"] [data-ok-data-grid-pivot-handle]',
    ) as HTMLElement;
    const region = panel.querySelector(
      '[data-ok-data-grid-pivot-section="rows"] [data-ok-field="region"]',
    ) as HTMLElement;
    const from = handle.getBoundingClientRect();
    const to = region.getBoundingClientRect();
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: from.left + 2,
        clientY: from.top + 2,
      }),
    );
    const at = { bubbles: true, pointerId: 1, clientX: to.left + 4, clientY: to.bottom - 2 };
    document.dispatchEvent(new PointerEvent("pointermove", at));
    expect(region.getAttribute("data-ok-drop")).toBe("after");
    document.dispatchEvent(new PointerEvent("pointerup", at));
    expect(instance.pivotModel.rows).toEqual([{ field: "region" }, { field: "product" }]);
    expect(fieldsOf("rows")).toEqual(["region", "product"]);
    expect(
      (section("rows").querySelector("[data-ok-data-grid-pivot-empty]") as HTMLElement).hidden,
    ).toBe(true);
  });
});

describe("data grid pivoting (HTML)", () => {
  it("builds the pivot from the rows and edits it in the panel", () => {
    const { host, root, instance } = setup("pivot-group");
    const grid = host.querySelector('[role="treegrid"]') as HTMLElement;
    const groups = [
      ...grid.querySelectorAll('[data-ok-data-grid-group-row] > [role="columnheader"]'),
    ].map((c) => c.textContent?.trim());
    expect(groups).toEqual(["2024", "2025"]);
    const headers = [
      ...grid.querySelectorAll(
        '[data-ok-data-grid-header] > [role="row"]:not([data-ok-data-grid-group-row]) > [role="columnheader"]',
      ),
    ];
    expect(headers.map((h) => h.textContent?.trim())).toEqual([
      "Group",
      "Revenue (sum)",
      "Units (avg)",
      "Revenue (sum)",
      "Units (avg)",
    ]);
    expect(texts(host).map((r) => r[0])).toEqual(["North", "South", "East", "West"]);
    expect(host.querySelector("[data-ok-data-grid-aggregation-row]")).not.toBeNull();
    // Sorting a pivot column orders the groups.
    (headers[1] as HTMLElement).click();
    expect(texts(host).map((r) => r[1])).toEqual(["1760", "1770", "", ""]);
    (headers[1] as HTMLElement).click();
    expect(texts(host)[0]?.[0]).toBe("East");
    // The panel: roles, functions and the switch (cancelable).
    const onPivot = vi.fn();
    root.addEventListener("ok:data-grid:pivot", onPivot);
    const role = host.querySelector<HTMLSelectElement>(
      "#grid-pivot-pivot-product",
    ) as HTMLSelectElement;
    role.value = "rows";
    role.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onPivot.mock.lastCall?.[0].detail.model.rows).toEqual([
      { field: "region" },
      { field: "product" },
    ]);
    expect(texts(host)[0]?.[0]).toBe("East(6)");
    const fn = host.querySelector<HTMLSelectElement>(
      "#grid-pivot-pivot-units-function",
    ) as HTMLSelectElement;
    fn.value = "max";
    fn.dispatchEvent(new Event("change", { bubbles: true }));
    expect(instance.pivotModel.values.find((v) => v.field === "units")?.aggFunc).toBe("max");
    root.addEventListener("ok:data-grid:pivot", (e) => e.preventDefault(), { once: true });
    role.value = "none";
    role.dispatchEvent(new Event("change", { bubbles: true }));
    expect(role.value).toBe("rows");
    const toggle = host.querySelector<HTMLInputElement>(
      "[data-ok-data-grid-pivot-switch]",
    ) as HTMLInputElement;
    toggle.click();
    expect(instance.pivotActive).toBe(false);
    expect(host.querySelector('[role="grid"]')).not.toBeNull();
    expect(header(host, "region")).not.toBeNull();
    expect(bodyRows(host)).toHaveLength(24);
    instance.setPivotActive(true);
    expect(header(host, "region")).toBeNull();
    expect(instance.toCsv().split("\r\n")[0]).toBe("﻿Region,Product,Year,Units,Revenue");
    instance.setPivotModel({ rows: [], columns: [], values: [{ field: "units", aggFunc: "sum" }] });
    expect(texts(host)).toEqual([]);
    expect(host.querySelector('[role="grid"]')).not.toBeNull();
    expect(instance.exportState().pivoting?.active).toBe(true);
    // Off, the panel still edits the model (shown when the pivot is on again).
    instance.setPivotActive(false);
    instance.setPivotActive(false);
    role.value = "columns";
    role.dispatchEvent(new Event("change", { bubbles: true }));
    expect(instance.pivotModel.columns.at(-1)).toEqual({ field: "product" });
    expect(header(host, "region")).not.toBeNull();
    instance.restoreState({
      pivoting: { model: { rows: [{ field: "region" }], columns: [], values: [] }, active: true },
      chartsIntegration: { model: { values: ["units"] } },
    });
    expect(instance.chartModel).toEqual({ values: ["units"] });
    expect(texts(host).map((r) => r[0])).toEqual(["North", "South", "East", "West"]);
  });
});

describe("data grid cell selection, clipboard and header filters (HTML)", () => {
  const copy = (target: Element) => {
    key(target, "c");
    const area = document.activeElement as HTMLElement;
    if (area.tagName !== "TEXTAREA") return null;
    // Synthetic clipboard events can't always hold data (Firefox): watch what the grid writes.
    const written = vi.spyOn(DataTransfer.prototype, "setData");
    area.dispatchEvent(
      new ClipboardEvent("copy", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      }),
    );
    const data = written.mock.lastCall?.[1] ?? null;
    written.mockRestore();
    return data;
  };
  const paste = (target: Element, text: string) => {
    key(target, "v");
    const area = document.activeElement as HTMLElement;
    if (area.tagName !== "TEXTAREA") return false;
    const transfer = new DataTransfer();
    const read = vi.spyOn(DataTransfer.prototype, "getData").mockReturnValue(text);
    area.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }),
    );
    read.mockRestore();
    return true;
  };

  it("status bar: figures of the selected cells, written when they change", async () => {
    const { host, root, instance } = setup("cells-status");
    const bar = host.querySelector("[data-ok-data-grid-status-bar]") as HTMLElement;
    const items = () =>
      [...bar.querySelectorAll("[data-ok-data-grid-status-item]")].map((item) => [
        item.getAttribute("data-ok-data-grid-status-item"),
        item.textContent,
      ]);
    expect(items()).toEqual([]);
    pressed(cell(host, "s-01", "units"));
    pressed(cell(host, "s-03", "units"), { shiftKey: true });
    expect(items()).toEqual([
      ["count", "Count: 3"],
      ["sum", "Sum: 141"],
      ["avg", "Average: 47"],
      ["min", "Min: 10"],
      ["max", "Max: 84"],
    ]);
    // Unchanged figures keep the same nodes (no new announcement).
    const first = bar.firstElementChild;
    instance.setCellSelectionModel({ ...instance.cellSelectionModel });
    root.setAttribute("data-ok-density", "compact");
    await settle();
    expect(bar.firstElementChild).toBe(first);
    pressed(cell(host, "s-01", "region"));
    expect(items()).toEqual([["count", "Count: 1"]]);
    instance.setLocaleText({ statusBarCount: "Cells" });
    instance.setCellSelectionModel({ "s-02": { region: true, product: true } });
    expect(items()).toEqual([["count", "Cells: 2"]]);
    // Off without the flag (or without cell selection).
    root.removeAttribute("data-ok-status-bar");
    instance.setCellSelectionModel({ "s-02": { region: true } });
    expect(items()).toEqual([]);
  });

  it("selects ranges, copies them and pastes into editable cells", () => {
    const { host, root, instance } = setup("cells-group");
    const onCells = vi.fn();
    root.addEventListener("ok:data-grid:cellselection", onCells);
    pressed(cell(host, "i-1", "name"));
    pressed(cell(host, "i-2", "stock"), { shiftKey: true });
    expect(instance.cellSelectionModel).toEqual({
      "i-1": { name: true, category: true, stock: true },
      "i-2": { name: true, category: true, stock: true },
    });
    expect(cell(host, "i-1", "name").getAttribute("data-ok-range-edge")).toBe("top left");
    expect(cell(host, "i-2", "stock").getAttribute("aria-selected")).toBe("true");
    pressed(cell(host, "i-3", "name"), { ctrlKey: true });
    expect(instance.cellSelectionModel["i-3"]).toEqual({ name: true });
    // Ctrl + drag adds a range to the cells before.
    cell(host, "i-4", "name").dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0, ctrlKey: true }),
    );
    const box = cell(host, "i-4", "category").getBoundingClientRect();
    document.dispatchEvent(
      new PointerEvent("pointermove", { clientX: box.left + 4, clientY: box.top + 4 }),
    );
    document.dispatchEvent(new PointerEvent("pointerup"));
    expect(instance.cellSelectionModel["i-4"]).toEqual({ name: true, category: true });
    expect(instance.cellSelectionModel["i-3"]).toEqual({ name: true });
    instance.setCellSelectionModel({
      "i-1": { name: true, category: true, stock: true },
      "i-2": { name: true, category: true, stock: true },
      "i-3": { name: true },
    });
    cell(host, "i-1", "name").focus();
    const onCopy = vi.fn();
    root.addEventListener("ok:data-grid:clipboardcopy", onCopy);
    expect(copy(cell(host, "i-1", "name"))).toBe(
      "Kettle\tBrewing\t5\r\nMug\tServing\t18\r\nTeapot\t\t",
    );
    expect(onCopy).toHaveBeenCalledTimes(1);
    // One value fills the selection; the edit events can refuse a row.
    const edits = vi.fn((event: Event) => {
      if ((event as CustomEvent).detail.id === "i-2") event.preventDefault();
    });
    root.addEventListener("ok:data-grid:edit", edits);
    expect(paste(cell(host, "i-1", "name"), "Pot")).toBe(true);
    expect(edits.mock.calls.map((c) => (c[0] as CustomEvent).detail)).toEqual([
      { id: "i-1", row: { name: "Pot", category: "Pot", stock: null } },
      { id: "i-2", row: { name: "Pot", category: "Pot", stock: null } },
      { id: "i-3", row: { name: "Pot" } },
    ]);
    expect(cell(host, "i-1", "name").textContent).toBe("Pot");
    expect(cell(host, "i-2", "name").textContent).toBe("Mug");
    // Without a selection: from the focused cell, block by block.
    instance.setCellSelectionModel({});
    edits.mockClear();
    cell(host, "i-4", "category").focus();
    root.addEventListener("ok:data-grid:clipboardpaste", (e) => e.preventDefault(), { once: true });
    paste(cell(host, "i-4", "category"), "Tools");
    expect(edits).not.toHaveBeenCalled();
    paste(cell(host, "i-4", "category"), "Tools\t7\nServing\t8");
    expect(edits.mock.calls.map((c) => (c[0] as CustomEvent).detail)).toEqual([
      { id: "i-4", row: { category: "Tools", stock: 7 } },
      { id: "i-5", row: { category: "Serving", stock: 8 } },
    ]);
    cell(host, "i-4", "stock").focus();
    expect(copy(cell(host, "i-4", "stock"))).toBe("7");
    // Ctrl + A selects every cell; turned off, presses select nothing.
    key(cell(host, "i-4", "stock"), "a");
    expect(Object.keys(instance.cellSelectionModel)).toHaveLength(8);
    root.removeAttribute("data-ok-cell-selection");
    pressed(cell(host, "i-1", "name"));
    expect(Object.keys(instance.cellSelectionModel)).toHaveLength(8);
    root.setAttribute("data-ok-disable-clipboard-paste", "");
    expect(paste(cell(host, "i-4", "stock"), "1")).toBe(false);
  });

  it("filters with the header fields; Up / Down leave them", async () => {
    const { host, instance } = setup("cells-group");
    const row = host.querySelector("[data-ok-data-grid-header-filters]") as HTMLElement;
    expect(row.getAttribute("aria-rowindex")).toBe("2");
    expect(bodyRows(host)[0]?.getAttribute("aria-rowindex")).toBe("3");
    const name = row.querySelector<HTMLInputElement>(
      "#grid-cells-header-filter-name",
    ) as HTMLInputElement;
    name.value = "te";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    expect(instance.filterModel.items).toEqual([
      { field: "name", operator: "contains", value: "te" },
    ]);
    expect(bodyRows(host)).toHaveLength(2);
    const active = row.querySelector<HTMLSelectElement>(
      "#grid-cells-header-filter-active",
    ) as HTMLSelectElement;
    active.value = "true";
    active.dispatchEvent(new Event("change", { bubbles: true }));
    expect(bodyRows(host)).toHaveLength(1);
    name.value = "";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    active.value = "";
    active.dispatchEvent(new Event("change", { bubbles: true }));
    expect(instance.filterModel.items).toEqual([]);
    // The panel's filters show in the header fields.
    instance.setFilterModel({ items: [{ field: "name", operator: "contains", value: "mu" }] });
    (host.querySelector('[role="columnheader"][data-ok-field="name"]') as HTMLElement).click();
    expect(name.value).toBe("mu");
    // Dates: the header's date picker.
    const month = row.querySelector<HTMLElement>(
      '[role="spinbutton"][aria-label="Month"]',
    ) as HTMLElement;
    await userEvent.click(month);
    await userEvent.keyboard("05052025");
    await settle();
    expect(instance.filterModel.items.at(-1)).toEqual({
      field: "restocked",
      operator: "is",
      value: "2025-05-05",
    });
    name.focus();
    key(name, "ArrowDown", {});
    expect(document.activeElement?.closest("[data-ok-data-grid-body]")).not.toBeNull();
    // Hidden columns hide their filter field.
    instance.setColumnVisibilityModel({ stock: false });
    expect((row.querySelector('[data-ok-filter-field="stock"]') as HTMLElement).hidden).toBe(true);
    instance.setPinnedColumns({ left: ["category"] });
    expect(
      row.querySelector('[data-ok-filter-field="category"]')?.getAttribute("data-ok-pinned"),
    ).toBe("left");
  });

  it("filters dates with a date picker in the filter panel", async () => {
    const { host, instance } = setup("cells-group");
    (host.querySelector('[data-ok-popover-open="grid-cells-filters"]') as HTMLElement).click();
    await settle();
    const panel = host.querySelector("#grid-cells-filters") as HTMLElement;
    const field = panel.querySelector<HTMLSelectElement>(
      "#grid-cells-filter-field",
    ) as HTMLSelectElement;
    field.value = "restocked";
    field.dispatchEvent(new Event("change", { bubbles: true }));
    const picker = panel.querySelector("[data-ok-date-picker]") as HTMLElement;
    expect(picker).not.toBeNull();
    await settle();
    const month = picker.querySelector<HTMLElement>(
      '[role="spinbutton"][aria-label="Month"]',
    ) as HTMLElement;
    await userEvent.click(month);
    await userEvent.keyboard("05092025");
    await settle();
    expect(instance.filterModel.items[0]).toEqual({
      field: "restocked",
      operator: "is",
      value: "2025-05-09",
    });
    const operator = panel.querySelector<HTMLSelectElement>(
      "#grid-cells-filter-operator",
    ) as HTMLSelectElement;
    operator.value = "isEmpty";
    operator.dispatchEvent(new Event("change", { bubbles: true }));
    expect(panel.querySelector("[data-ok-date-picker]")).toBeNull();
    expect(panel.querySelector<HTMLInputElement>("#grid-cells-filter-value")?.disabled).toBe(true);
  });

  it("filters date times with a date time picker in the panel and the header filters", async () => {
    const { host, instance } = setup("cells-group");
    const header = host.querySelector(
      '[data-ok-data-grid-header-filters] [data-ok-filter-field="counted"]',
    ) as HTMLElement;
    expect(header.querySelector("[data-ok-date-picker]")?.getAttribute("data-ok-value-type")).toBe(
      "date-time",
    );
    await userEvent.click(
      header.querySelector('[role="spinbutton"][aria-label="Month"]') as HTMLElement,
    );
    await userEvent.keyboard("050220250800a");
    await settle();
    expect(instance.filterModel.items).toEqual([
      { field: "counted", operator: "is", value: "2025-05-02T08:00:00" },
    ]);
    expect(bodyRows(host).map((row) => row.getAttribute("data-ok-row-id"))).toEqual(["i-1"]);
    instance.setFilterModel({ items: [] });
    // The panel: a date column's picker gives way to a date time picker, then to the text field.
    (host.querySelector('[data-ok-popover-open="grid-cells-filters"]') as HTMLElement).click();
    await settle();
    const panel = host.querySelector("#grid-cells-filters") as HTMLElement;
    const field = panel.querySelector<HTMLSelectElement>(
      "#grid-cells-filter-field",
    ) as HTMLSelectElement;
    const choose = (value: string) => {
      field.value = value;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const picker = () => panel.querySelector<HTMLElement>("[data-ok-date-picker]");
    choose("restocked");
    expect(picker()?.hasAttribute("data-ok-value-type")).toBe(false);
    choose("counted");
    expect(picker()?.getAttribute("data-ok-value-type")).toBe("date-time");
    expect(panel.querySelector("#grid-cells-filter-value")).not.toBeNull();
    await settle();
    const operator = panel.querySelector<HTMLSelectElement>(
      "#grid-cells-filter-operator",
    ) as HTMLSelectElement;
    operator.value = "after";
    operator.dispatchEvent(new Event("change", { bubbles: true }));
    await userEvent.click(
      picker()?.querySelector('[role="spinbutton"][aria-label="Month"]') as HTMLElement,
    );
    await userEvent.keyboard("052020250100p");
    await settle();
    expect(instance.filterModel.items[0]).toEqual({
      field: "counted",
      operator: "after",
      value: "2025-05-20T13:00:00",
    });
    choose("name");
    expect(picker()).toBeNull();
    expect(panel.querySelector("#grid-cells-filter-value")?.tagName).toBe("INPUT");
  });
});

/** Each table row's cell texts, joined (the chart rewrites cells in place). */
const rowTexts = (section: HTMLTableSectionElement) =>
  [...section.rows].map((r) => [...r.cells].map((c) => c.textContent?.trim()).join(""));
const chartParts = (host: Element) => {
  const region = host.querySelector("[data-ok-data-grid-chart]") as HTMLElement;
  const table = region.querySelector("table") as HTMLTableElement;
  return {
    region,
    figure: region.querySelector("[data-ok-chart]") as HTMLElement,
    head: () => rowTexts(table.tHead as HTMLTableSectionElement),
    body: () => rowTexts(table.tBodies[0] as HTMLTableSectionElement),
    colors: () =>
      [...table.querySelectorAll("tbody td")].map((td) => td.getAttribute("data-ok-color")),
  };
};
const change = (field: HTMLInputElement | HTMLSelectElement, value?: string) => {
  if (value !== undefined) field.value = value;
  else (field as HTMLInputElement).checked = !(field as HTMLInputElement).checked;
  field.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("data grid charts integration (HTML)", () => {
  it("writes the chart's table from the top-level groups and follows the panel", () => {
    const { host, root, instance } = setup("charts-group");
    const region = host.querySelector("[data-ok-data-grid-chart]") as HTMLElement;
    expect(region.hidden).toBe(false);
    const table = region.querySelector("table") as HTMLTableElement;
    const body = () => rowTexts(table.tBodies[0] as HTMLTableSectionElement);
    expect(body()).toEqual(["Tea2,497", "Juice2,592", "Coffee2,658"]);
    const onChart = vi.fn();
    root.addEventListener("ok:data-grid:chart", onChart);
    const type = host.querySelector<HTMLSelectElement>(
      "#grid-charts-chart-type",
    ) as HTMLSelectElement;
    type.value = "bar";
    type.dispatchEvent(new Event("change", { bubbles: true }));
    const figure = region.querySelector("[data-ok-chart]") as HTMLElement;
    expect(figure.hasAttribute("data-ok-horizontal")).toBe(true);
    type.value = "area";
    type.dispatchEvent(new Event("change", { bubbles: true }));
    expect(figure.getAttribute("data-ok-type")).toBe("area");
    const units = host.querySelector<HTMLInputElement>(
      '[data-ok-data-grid-chart-value="units"]',
    ) as HTMLInputElement;
    units.click();
    expect(onChart.mock.lastCall?.[0].detail.model.values).toEqual(["revenue", "units"]);
    expect(rowTexts(table.tHead as HTMLTableSectionElement)).toEqual(["CategoryRevenueUnits"]);
    units.click();
    instance.setRowGroupingModel([]);
    expect(region.hidden).toBe(true);
    const dimension = host.querySelector<HTMLSelectElement>(
      "#grid-charts-chart-dimension",
    ) as HTMLSelectElement;
    dimension.value = "product";
    dimension.dispatchEvent(new Event("change", { bubbles: true }));
    expect(region.hidden).toBe(false);
    dimension.value = "";
    dimension.dispatchEvent(new Event("change", { bubbles: true }));
    expect(instance.chartModel.dimension).toBeNull();
    dimension.value = "product";
    dimension.dispatchEvent(new Event("change", { bubbles: true }));
    expect(body()).toHaveLength(24);
    instance.setChartModel({ values: [] });
    expect(region.hidden).toBe(true);
    expect(instance.chartModel).toEqual({ values: [] });
    expect(instance.exportState().chartsIntegration).toEqual({ model: { values: [] } });
    instance.setChartModel({});
    expect(region.hidden).toBe(true);
  });
});

describe("data grid several charts (HTML)", () => {
  it("draws one chart per id and the panel edits the one picked, like React", () => {
    const { host, root, instance } = setup("charts-multiple");
    const regions = [...host.querySelectorAll<HTMLElement>("[data-ok-data-grid-chart]")];
    expect(regions.map((r) => r.getAttribute("data-ok-chart-id"))).toEqual(["revenue", "units"]);
    const figure = (i: number) => regions[i]?.querySelector("[data-ok-chart]") as HTMLElement;
    expect(figure(1).getAttribute("data-ok-type")).toBe("line");
    expect(regions.every((r) => !r.hidden)).toBe(true);
    const onChart = vi.fn();
    root.addEventListener("ok:data-grid:chart", onChart);
    const type = host.querySelector<HTMLSelectElement>(
      "#grid-charts-multiple-chart-type",
    ) as HTMLSelectElement;
    expect(type.value).toBe("column");
    type.value = "area";
    type.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onChart.mock.lastCall?.[0].detail).toMatchObject({
      id: "revenue",
      model: { type: "area" },
    });
    expect(figure(0).getAttribute("data-ok-type")).toBe("area");
    expect(JSON.parse(root.getAttribute("data-ok-chart-models") as string).revenue.type).toBe(
      "area",
    );
    // Switching charts (cancelable) shows the other chart's model in the panel.
    const active = host.querySelector<HTMLSelectElement>(
      "#grid-charts-multiple-chart-active",
    ) as HTMLSelectElement;
    root.addEventListener("ok:data-grid:activechart", (e) => e.preventDefault(), { once: true });
    active.value = "units";
    active.dispatchEvent(new Event("change", { bubbles: true }));
    expect(instance.activeChartId).toBe("revenue");
    expect(active.value).toBe("revenue");
    active.value = "units";
    active.dispatchEvent(new Event("change", { bubbles: true }));
    expect(instance.activeChartId).toBe("units");
    expect(type.value).toBe("line");
    expect(instance.chartModel.label).toBe("Units by product");
    instance.setChartModel({ ...instance.chartModel, type: "bar" });
    expect(figure(1).hasAttribute("data-ok-horizontal")).toBe(true);
    expect(instance.exportState().chartsIntegration).toMatchObject({
      activeChartId: "units",
      charts: { units: { type: "bar" } },
    });
    instance.setChartModels({ revenue: { values: ["units"] } });
    expect(instance.activeChartId).toBe("revenue");
    instance.setActiveChartId("nope");
    expect(instance.activeChartId).toBe("revenue");
    instance.restoreState({
      chartsIntegration: { charts: { units: { type: "pie" } }, activeChartId: "units" },
    });
    expect(instance.chartModels).toEqual({ units: { type: "pie" } });
  });
});

describe("data grid charts integration: every chart type (HTML)", () => {
  it("offers every chart type with stacking, value labels and a legend", () => {
    const { host, root, instance } = setup("charts-group");
    const { figure } = chartParts(host);
    const q = <E extends Element>(selector: string) => host.querySelector<E>(selector) as E;
    const type = q<HTMLSelectElement>("#grid-charts-chart-type");
    expect([...type.options].map((o) => o.value)).toEqual([
      "column",
      "bar",
      "line",
      "area",
      "pie",
      "donut",
      "radar",
      "scatter",
    ]);
    const stacked = q<HTMLInputElement>("[data-ok-data-grid-chart-stacked]");
    expect(stacked.disabled).toBe(true);
    change(q<HTMLInputElement>('[data-ok-data-grid-chart-value="units"]'));
    expect(stacked.disabled).toBe(false);
    change(stacked);
    expect(instance.chartModel).toEqual({
      type: "column",
      values: ["revenue", "units"],
      stacked: true,
    });
    expect(figure.hasAttribute("data-ok-stacked")).toBe(true);
    change(q<HTMLInputElement>("[data-ok-data-grid-chart-item-label]"));
    expect(instance.chartModel.itemLabel).toBe("value");
    expect(figure.hasAttribute("data-ok-data-labels")).toBe(true);
    change(q<HTMLSelectElement>("#grid-charts-chart-legend"), "right");
    expect(figure.getAttribute("data-ok-legend")).toBe("right");
    for (const [value, drawn] of [
      ["pie", "pie"],
      ["donut", "donut"],
      ["radar", "radar"],
      ["scatter", "scatter"],
      ["column", "bar"],
    ] as const) {
      change(type, value);
      expect(figure.getAttribute("data-ok-type")).toBe(drawn);
      expect(figure.hasAttribute("data-ok-stacked")).toBe(value === "column");
      expect(stacked.disabled).toBe(value !== "column");
    }
    change(q<HTMLInputElement>("[data-ok-data-grid-chart-item-label]"));
    expect(instance.chartModel.itemLabel).toBe("none");
    // The panel shows models set from JavaScript; a canceled change puts it back.
    instance.setChartModel({ type: "line", values: ["revenue"], legend: "bottom", showMark: true });
    expect(type.value).toBe("line");
    expect(q<HTMLSelectElement>("#grid-charts-chart-legend").value).toBe("bottom");
    expect(q<HTMLInputElement>('[data-ok-data-grid-chart-value="units"]').checked).toBe(false);
    expect(figure.getAttribute("data-ok-marker-size")).toBe("4");
    expect(figure.hasAttribute("data-ok-data-labels")).toBe(false);
    root.addEventListener("ok:data-grid:chart", (event) => event.preventDefault(), { once: true });
    change(type, "area");
    expect(type.value).toBe("line");
    expect(figure.getAttribute("data-ok-type")).toBe("line");
  });

  it("follows filters, grouping and pivots, and draws scatter points of a number dimension", () => {
    const { host, instance } = setup("charts-group");
    const chart = chartParts(host);
    instance.setChartModel({ type: "pie", values: ["revenue"], colors: ["info", "error"] });
    expect(chart.body()).toEqual(["Tea2,497", "Juice2,592", "Coffee2,658"]);
    expect(chart.colors()).toEqual(["info", "error", "info"]);
    // Groups aggregate the rows that pass the filters.
    instance.setFilterModel({ items: [{ field: "region", operator: "equals", value: "North" }] });
    expect(chart.body()).toEqual(["Tea510", "Juice842", "Coffee408"]);
    instance.setFilterModel({ items: [] });
    instance.setRowGroupingModel(["region"]);
    expect(
      chart
        .body()
        .map((r) => r.replace(/[\d,]/g, ""))
        .sort(),
    ).toEqual(["East", "North", "South", "West"]);
    // Pivot: a value field stands for its pivot columns, one series per key.
    instance.setChartModel({ values: ["revenue"], stacked: true, seriesAxisLabel: "Revenue" });
    instance.setPivotModel({
      rows: [{ field: "region" }],
      columns: [{ field: "year" }],
      values: [{ field: "revenue", aggFunc: "sum" }],
    });
    instance.setPivotActive(true);
    expect(chart.head()).toEqual(["Category20242025"]);
    expect(chart.figure.hasAttribute("data-ok-stacked")).toBe(true);
    expect(chart.figure.getAttribute("data-ok-y-title")).toBe("Revenue");
    instance.setPivotActive(false);
    expect(chart.head()).toEqual(["CategoryRevenue"]);
    expect(chart.figure.hasAttribute("data-ok-stacked")).toBe(false);
    // Rows with a number dimension: a scatter chart of [x, y] points.
    instance.setRowGroupingModel([]);
    instance.setChartModel({ type: "scatter", dimension: "units", values: ["revenue"] });
    expect(chart.figure.getAttribute("data-ok-x-type")).toBe("numeric");
    expect(chart.body()).toHaveLength(24);
    instance.setChartModel({ type: "radar", dimension: "product", values: ["revenue"] });
    expect(chart.figure.getAttribute("data-ok-x-type")).toBe("category");
  });

  it("builds the pivot chart of its snippet", () => {
    const { host } = setup("charts-pivot");
    const chart = chartParts(host);
    expect(chart.region.hidden).toBe(false);
    expect(chart.head()).toEqual(["CategoryCoffeeJuiceTea"]);
    expect(chart.body()).toHaveLength(4);
    expect(chart.figure.getAttribute("data-ok-legend")).toBe("bottom");
    expect(
      (host.querySelector("[data-ok-data-grid-chart-stacked]") as HTMLInputElement).disabled,
    ).toBe(false);
  });

  it("writes the data table itself without the chart runtime", () => {
    const host = mount(snippets["charts-donut"] as string);
    runtime = createRuntime()
      .register(...components.filter((c) => c.name !== "chart"))
      .start();
    const root = host.querySelector("[data-ok-data-grid]") as HTMLElement;
    const instance = runtime.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
    const chart = chartParts(host);
    expect(chart.figure.getAttribute("data-ok-type")).toBe("donut");
    instance.setChartModel({ type: "bar", values: ["units", "revenue"], colors: ["success"] });
    expect(chart.head()).toEqual(["CategoryUnitsRevenue"]);
    expect(chart.figure.hasAttribute("data-ok-horizontal")).toBe(true);
    expect(
      [...host.querySelectorAll("[data-ok-data-grid-chart] thead th[data-ok-color]")].map((th) =>
        th.getAttribute("data-ok-color"),
      ),
    ).toEqual(["success", "success"]);
  });
});

describe("data grid phase 6 edges (HTML)", () => {
  it("turns features off with attributes, pivots without a panel", () => {
    const { host, root, instance } = setup("grouping-group", (r) => {
      r.setAttribute("data-ok-disable-column-resize", "");
      r.setAttribute("data-ok-disable-aggregation", "");
    });
    expect(host.querySelector("[data-ok-data-grid-aggregation-row]")).toBeNull();
    expect(header(host, "units").querySelector("[data-ok-data-grid-aggregation-label]")).toBeNull();
    root.removeAttribute("data-ok-disable-aggregation");
    instance.setRowGroupingModel(["region"]);
    expect(host.querySelector("[data-ok-data-grid-aggregation-row]")).not.toBeNull();
    // A pivot from code: no panel, no resize handles.
    instance.setPivotModel({
      rows: [{ field: "product" }],
      columns: [],
      values: [{ field: "units", aggFunc: "sum" }],
    });
    instance.setPivotActive(true);
    expect(instance.pivotActive).toBe(true);
    expect(texts(host).map((r) => r[0])).toEqual(["Tea", "Juice", "Coffee"]);
    expect(header(host, "pivot:units/sum")?.querySelector("[data-ok-data-grid-resize]")).toBeNull();
    expect(host.querySelector("[data-ok-data-grid-group-row]")).toBeNull();
    instance.setPivotActive(false);
    expect(header(host, "region")).not.toBeNull();
    root.setAttribute("data-ok-disable-row-grouping", "");
    instance.setRowGroupingModel(["product"]);
    expect(host.querySelector('[role="grid"]')).not.toBeNull();
  });

  it("pivots grids with special columns and header filters", () => {
    const basic = setup("basic-group");
    basic.instance.setPivotModel({
      rows: [{ field: "lastName" }],
      columns: [],
      values: [{ field: "age", aggFunc: "max" }],
    });
    basic.instance.setPivotActive(true);
    const checkboxHeader = basic.host.querySelector(
      '[data-ok-data-grid-header] [role="columnheader"][data-ok-field="__check__"]',
    );
    expect(checkboxHeader?.getAttribute("aria-colindex")).toBe("1");
    expect(
      header(basic.host, "__row_group_by_columns_group__")?.getAttribute("aria-colindex"),
    ).toBe("2");
    expect(
      bodyRows(basic.host)[0]?.querySelector('[data-ok-field="__check__"]')?.children,
    ).toHaveLength(0);
    runtime?.stop();
    resetPage();
    const cells = setup("cells-group");
    cells.instance.setPivotModel({
      rows: [{ field: "category" }],
      columns: [{ field: "active" }],
      values: [{ field: "stock", aggFunc: "sum" }],
    });
    cells.instance.setPivotActive(true);
    expect(
      cells.host.querySelector("[data-ok-data-grid-header-filters]")?.getAttribute("aria-rowindex"),
    ).toBe("3");
    expect(texts(cells.host).map((r) => r[0])).toEqual(["Brewing", "Serving", "Tools"]);
    cells.instance.restoreState({ pivoting: { active: false } });
    expect(
      cells.host.querySelector("[data-ok-data-grid-header-filters]")?.getAttribute("aria-rowindex"),
    ).toBe("2");
  });

  it("copies selected rows, skips generated rows, marks only drawn cells", () => {
    const { host, root, instance } = setup("basic-group", (r) =>
      r.setAttribute("data-ok-cell-selection", ""),
    );
    instance.setSelection(["p-002", "p-001"]);
    const first = cell(host, "p-001", "lastName");
    first.focus();
    key(first, "c");
    const area = document.activeElement as HTMLElement;
    const written = vi.spyOn(DataTransfer.prototype, "setData");
    area.dispatchEvent(
      new ClipboardEvent("copy", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      }),
    );
    expect(String(written.mock.lastCall?.[1]).split("\r\n")).toHaveLength(2);
    written.mockRestore();
    // Unknown rows and fields in a model are skipped.
    instance.setCellSelectionModel({ nope: { x: true }, "p-001": { nope: true, age: true } });
    expect(cell(host, "p-001", "age").getAttribute("aria-selected")).toBe("true");
    // A generated row's cell has nothing to copy.
    instance.setSelection([]);
    instance.setCellSelectionModel({});
    instance.setRowGroupingModel(["lastName"]);
    const group = bodyRows(host)[0]?.querySelector(
      '[role="gridcell"][data-ok-field="age"]',
    ) as HTMLElement;
    group.focus();
    key(group, "c");
    expect(document.activeElement).toBe(group);
    // Ctrl + A on an empty page selects nothing.
    instance.setFilterModel({ items: [{ field: "lastName", operator: "equals", value: "zzz" }] });
    key(header(host, "age"), "a");
    expect(instance.cellSelectionModel).toEqual({});
    root.removeAttribute("data-ok-cell-selection");
  });
});
