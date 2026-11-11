import type { GridDataSource, GridGetRowsParams } from "@owlky/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { DataGridInstance } from "./data-grid.js";

// Roadmap batch E (4.18.87–4.18.93, the ApexGrid audit) in the HTML runtime.

const snippets = import.meta.glob("./examples/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const snippet = (name: string) => snippets[`./examples/${name}.html`] as string;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.restoreAllMocks();
});

const setup = (html: string, edit?: (root: HTMLElement) => void) => {
  const host = mount(html);
  const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
  root.setAttribute("data-ok-disable-virtualization", "");
  edit?.(root);
  runtime = createRuntime()
    .register(...components)
    .start();
  const instance = runtime.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
  return { host, root, instance };
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: k, ...init }),
  );
const rowsOf = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>('[data-ok-data-grid-body] > [role="row"]')].filter(
    (row) => !row.hidden,
  );
const cellAt = (root: Element, index: number, field = "age") =>
  (rowsOf(root)[index] as HTMLElement).querySelector<HTMLElement>(
    `[data-ok-field="${field}"]`,
  ) as HTMLElement;
const click = (target: Element, init: MouseEventInit = {}) =>
  target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
const boxAt = (root: Element, index: number) =>
  (rowsOf(root)[index] as HTMLElement).querySelector<HTMLInputElement>(
    "[data-ok-data-grid-checkbox] input",
  ) as HTMLInputElement;
/** A checkbox click: a dispatched click toggles it and fires its change, as a real one. */
const clickBox = (input: HTMLInputElement, init: MouseEventInit = {}) => click(input, init);

describe("HTML data grid row range selection (4.18.87)", () => {
  it("Shift + click on rows and checkboxes selects the range from the last toggled row", async () => {
    const { root, instance } = setup(snippet("basic-group"));
    const ids = rowsOf(root).map((row) => row.getAttribute("data-ok-row-id"));
    click(cellAt(root, 1));
    click(cellAt(root, 3), { shiftKey: true });
    expect(instance.selection).toEqual(ids.slice(1, 4));
    // A selected row clears the rows from the anchor up to it.
    click(cellAt(root, 1), { shiftKey: true });
    expect(instance.selection).toEqual([ids[1]]);
    clickBox(boxAt(root, 4), { shiftKey: true });
    expect(instance.selection).toEqual(ids.slice(1, 5));
    clickBox(boxAt(root, 0));
    expect(instance.selection).toEqual([...ids.slice(1, 5), ids[0]]);
    // Shift + press clears the text selection between the rows.
    const remove = vi.spyOn(window.getSelection() as Selection, "removeAllRanges");
    cellAt(root, 2).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, shiftKey: true }));
    expect(remove).toHaveBeenCalled();
    await expectNoAxeViolations(root);
  });

  it("Shift + Up / Down extends and shrinks; single selection moves; cell selection keeps it", () => {
    const { root, instance } = setup(snippet("basic-group"));
    const ids = rowsOf(root).map((row) => row.getAttribute("data-ok-row-id"));
    cellAt(root, 1).focus();
    key(cellAt(root, 1), " ", { shiftKey: true });
    expect(instance.selection).toEqual([ids[1]]);
    key(cellAt(root, 1), "ArrowDown", { shiftKey: true });
    key(cellAt(root, 2), "ArrowDown", { shiftKey: true });
    expect(instance.selection).toEqual(ids.slice(1, 4));
    key(cellAt(root, 3), "ArrowUp", { shiftKey: true });
    expect(instance.selection).toEqual(ids.slice(1, 3));
    root.setAttribute("data-ok-disable-multiple-row-selection", "");
    key(cellAt(root, 2), "ArrowDown", { shiftKey: true });
    expect(instance.selection).toEqual([ids[3]]);
    click(cellAt(root, 5), { shiftKey: true });
    expect(instance.selection).toEqual([ids[5]]);
    root.removeAttribute("data-ok-disable-multiple-row-selection");
    root.setAttribute("data-ok-cell-selection", "");
    cellAt(root, 0).focus();
    key(cellAt(root, 0), "ArrowDown", { shiftKey: true });
    expect(instance.selection).toEqual([ids[5]]);
  });
});

describe("HTML data grid rows to export (4.18.92)", () => {
  /** The first column's values of a CSV (the id column). */
  const firsts = (csv: string) =>
    csv
      .replace("﻿", "")
      .split("\r\n")
      .slice(1)
      .map((line) => line.split(",")[0]);

  it("source shortcuts, getRowsToExport, the markup's options and print", () => {
    const { root, instance } = setup(snippet("basic-group"));
    const all = instance.toCsv({ fields: ["id"] });
    const every = firsts(all);
    instance.setFilterModel({ items: [], quickFilterValues: ["an"] });
    const filtered = firsts(instance.toCsv({ fields: ["id"] }));
    expect(filtered.length).toBeLessThan(every.length);
    expect(firsts(instance.toCsv({ fields: ["id"], source: "all" }))).toEqual(every);
    expect(firsts(instance.toCsv({ fields: ["id"], source: "filtered" }))).toEqual(filtered);
    const shown = rowsOf(root).map((row) => row.getAttribute("data-ok-row-id"));
    instance.setSelection([shown[1] as string, "p-002"]);
    const chosen = filtered.filter((rowId) => rowId === shown[1] || rowId === "p-002");
    expect(firsts(instance.toCsv({ fields: ["id"], source: "selected" }))).toEqual(chosen);
    expect(firsts(instance.toCsv({ fields: ["id"], source: "page" }))).toHaveLength(shown.length);
    let seen: unknown = null;
    const picked = instance.toCsv({
      fields: ["id"],
      getRowsToExport: (params) => {
        seen = params.apiRef.current;
        return [params.rowIds[2] as string, "nope"];
      },
    });
    expect(seen).toBe(instance);
    expect(firsts(picked)).toEqual([every[2]]);
    root.setAttribute("data-ok-excel-options", '{"source":"selected"}');
    const sheet = new TextDecoder().decode(instance.toExcel());
    expect(sheet).toContain(shown[1] as string);
    root.setAttribute("data-ok-csv-options", '{"source":"all"}');
    expect(firsts(instance.toCsv({ fields: ["id"] }))).toEqual(every);
    // Print: the rows to export among the printed ones.
    const print = vi.fn();
    const append = document.body.append.bind(document.body);
    vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
      append(...nodes);
      for (const node of nodes)
        if (node instanceof HTMLIFrameElement) (node.contentWindow as Window).print = print;
    });
    instance.print({ source: "selected" });
    expect(print).toHaveBeenCalled();
    const frame = document.querySelector("iframe") as HTMLIFrameElement;
    const printed = frame.contentDocument?.querySelectorAll(
      '[data-ok-data-grid-body] > [role="row"]',
    );
    expect([...(printed ?? [])].map((row) => row.getAttribute("data-ok-row-id"))).toEqual(chosen);
    frame.remove();
  });
});

describe("HTML data grid state with rows and statechange (4.18.91)", () => {
  const microtask = () => new Promise<void>((resolve) => queueMicrotask(resolve));
  const pinned = (root: Element, side: "top" | "bottom") =>
    [...root.querySelectorAll(`[data-ok-data-grid-pinned-rows="${side}"] > [role="row"]`)].map(
      (row) => row.getAttribute("data-ok-row-id"),
    );
  const bodyIds = (root: Element) =>
    rowsOf(root)
      .filter((row) => row.hasAttribute("data-ok-row-id"))
      .map((row) => row.getAttribute("data-ok-row-id"));

  it("pinned rows and the manual order: exported, restored, reported once settled", async () => {
    const { root, instance } = setup(snippet("ordering-group"));
    const changes: unknown[] = [];
    root.addEventListener("ok:data-grid:statechange", (event) =>
      changes.push((event as CustomEvent).detail.state),
    );
    expect(instance.exportState()).toMatchObject({
      pinnedRows: { top: ["a-start"], bottom: ["a-end"] },
    });
    expect(instance.exportState().rowOrder).toBeUndefined();
    expect(instance.exportState().rowSelection).toBeUndefined();
    const handle = rowsOf(root)[0]?.querySelector(
      "[data-ok-data-grid-reorder-handle]",
    ) as HTMLElement;
    key(handle, "ArrowDown", { altKey: true });
    await microtask();
    expect(changes).toHaveLength(1);
    expect(instance.exportState().rowOrder).toEqual({ orderedIds: ["a-2", "a-1", "a-3", "a-4"] });
    instance.restoreState({
      pinnedRows: { top: ["a-3"], bottom: ["a-end", "a-start"] },
      rowOrder: { orderedIds: ["a-4", "a-3", "a-2", "a-1"] },
    });
    expect(pinned(root, "top")).toEqual(["a-3"]);
    expect(pinned(root, "bottom")).toEqual(["a-end", "a-start"]);
    expect(bodyIds(root)).toEqual(["a-4", "a-2", "a-1"]);
    expect(root.querySelector('[data-ok-row-id="a-3"]')?.getAttribute("aria-rowindex")).toBe("2");
    await microtask();
    expect(changes).toHaveLength(2);
    expect(changes[1]).toMatchObject({
      pinnedRows: { top: ["a-3"], bottom: ["a-end", "a-start"] },
      rowOrder: { orderedIds: ["a-4", "a-2", "a-1"] },
    });
    // Unpinned rows go back to the body; no pinned rows left: no groups.
    instance.restoreState({ pinnedRows: { top: [], bottom: [] } });
    expect(root.querySelector("[data-ok-data-grid-pinned-rows]")).toBeNull();
    expect(bodyIds(root)).toHaveLength(6);
    // A pressed pointer holds the report until its release.
    root.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    instance.restoreState({ rowOrder: { orderedIds: ["a-1"] } });
    await microtask();
    const held = changes.length;
    document.dispatchEvent(new PointerEvent("pointerup"));
    await microtask();
    expect(changes.length).toBe(held + 1);
    await expectNoAxeViolations(root);
  });

  it("the selection and open detail panels", async () => {
    const basic = setup(snippet("basic-group"));
    basic.instance.restoreState({ rowSelection: { model: ["p-002", "p-003"] } });
    expect(basic.instance.selection).toEqual(["p-002", "p-003"]);
    expect(
      basic.root.querySelector('[data-ok-row-id="p-002"]')?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(basic.instance.exportState().rowSelection).toEqual({ model: ["p-002", "p-003"] });
    runtime?.stop();
    resetPage();
    const { root, instance } = setup(snippet("detail-group"));
    expect(instance.exportState().detailPanel).toEqual({ expandedRowIds: [] });
    instance.restoreState({ detailPanel: { expandedRowIds: ["o-1002"] } });
    expect(
      root
        .querySelector('[data-ok-row-id="o-1002"] [data-ok-data-grid-detail-toggle]')
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
    expect(root.querySelector('[data-ok-detail-for="o-1002"]')).not.toBeNull();
    expect(instance.exportState().detailPanel).toEqual({ expandedRowIds: ["o-1002"] });
    instance.restoreState({ detailPanel: { expandedRowIds: [] } });
    expect(instance.exportState().detailPanel).toEqual({ expandedRowIds: [] });
  });
});

describe("HTML data grid chart aggregation, combo and a second axis (4.18.88)", () => {
  const texts = (section: HTMLTableSectionElement) =>
    [...section.rows].map((tr) => [...tr.cells].map((cell) => (cell.textContent ?? "").trim()));

  it("aggregation merges the rows of a category; combo series and the opposite axis", () => {
    const { host, root, instance } = setup(snippet("charts-group"), (r) =>
      r.removeAttribute("data-ok-row-grouping-model"),
    );
    // Every row's region and revenue, to compare with the chart.
    const counts = new Map<string, number>();
    for (const row of root.querySelectorAll('[data-ok-data-grid-body] > [role="row"]')) {
      const region = (row.querySelector('[data-ok-field="region"]')?.textContent ?? "").trim();
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }
    instance.setChartModel({ dimension: "region", values: ["revenue"], aggregation: "count" });
    const region = host.querySelector("[data-ok-data-grid-chart]") as HTMLElement;
    const table = region.querySelector("table") as HTMLTableElement;
    expect(texts(table.tBodies[0] as HTMLTableSectionElement)).toEqual(
      [...counts].map(([key, count]) => [key, String(count)]),
    );
    instance.setChartModel({
      type: "combo",
      dimension: "region",
      values: ["revenue", "units"],
      aggregation: "sum",
      secondaryValues: ["units"],
      seriesTypes: { revenue: "area" },
    });
    const figure = region.querySelector("[data-ok-chart]") as HTMLElement;
    expect(figure.getAttribute("data-ok-type")).toBe("line");
    expect(figure.getAttribute("data-ok-yaxis")).toBe("; opposite title Units");
    const heads = [...((table.tHead as HTMLTableSectionElement).rows[0]?.cells ?? [])].slice(1);
    expect(
      heads.map((th) => [th.getAttribute("data-ok-type"), th.getAttribute("data-ok-y-axis")]),
    ).toEqual([
      ["area", "0"],
      ["line", "1"],
    ]);
    expect((host.querySelector("#grid-charts-chart-type") as HTMLSelectElement).value).toBe(
      "combo",
    );
    // Back to one axis: the attribute goes.
    instance.setChartModel({ dimension: "region", values: ["revenue"] });
    expect(figure.hasAttribute("data-ok-yaxis")).toBe(false);
  });
});

describe("HTML data grid server-side pivoting (4.18.93)", () => {
  /** Resolves once the grid holds a row with this id. */
  const rowAppears = (root: Element, rowId: string) =>
    new Promise<void>((resolve) => {
      const found = () => root.querySelector(`[data-ok-row-id="${rowId}"]`);
      if (found()) return resolve();
      const observer = new MutationObserver(() => {
        if (!found()) return;
        observer.disconnect();
        resolve();
      });
      observer.observe(root, { childList: true, subtree: true });
    });

  it("asks with the pivot model, builds the columns and rows from the response", async () => {
    const { root, instance } = setup(snippet("pivot-group"));
    const asked: GridGetRowsParams[] = [];
    const source: GridDataSource<Record<string, unknown>> = {
      getRows: async (params) => {
        asked.push(params);
        if (params.groupKeys?.length)
          return { rows: [{ id: "north-ana", region: "Ana", "2024>->revenue": 4 }] };
        return {
          rows: [
            { id: "north", region: "North", "2024>->revenue": 10, "2025>->revenue": 20, n: 1 },
            { id: "south", region: "South", "2025>->revenue": 7, n: 0 },
          ],
          pivotColumns: [{ group: "2024" }, { group: { year: 2025 } }],
        };
      },
      getChildrenCount: (row) => Number(row["n"] ?? 0),
      getGroupKey: (row) => String(row["region"]),
    };
    instance.setPivotModel({
      rows: [{ field: "region" }],
      columns: [{ field: "year" }],
      values: [{ field: "revenue", aggFunc: "sum" }],
    });
    instance.setDataSource(source, { cache: null });
    await rowAppears(root, "north");
    expect(asked.at(-1)).toMatchObject({
      groupKeys: [],
      groupFields: ["region"],
      pivotModel: { rows: [{ field: "region" }], columns: [{ field: "year" }] },
    });
    const groups = [...root.querySelectorAll("[data-ok-data-grid-group-row] [data-ok-group-id]")];
    expect(groups.map((g) => g.textContent?.trim())).toEqual(["2024", "2025"]);
    const cells = (rowId: string) =>
      [
        ...root.querySelectorAll(
          `[data-ok-row-id="${rowId}"] [role="gridcell"][data-ok-field^="pivot:"]`,
        ),
      ].map((cell) => cell.textContent);
    expect(cells("north")).toEqual(["10", "20"]);
    expect(cells("south")).toEqual(["", "7"]);
    expect(
      root.querySelector('[data-ok-row-id="north"] [data-ok-data-grid-tree-label]')?.textContent,
    ).toBe("North");
    (
      root.querySelector('[data-ok-row-id="north"] [data-ok-data-grid-tree-toggle]') as HTMLElement
    ).click();
    await rowAppears(root, "north-ana");
    expect(asked.at(-1)).toMatchObject({ groupKeys: ["North"], groupFields: ["region"] });
    expect(asked.at(-1)?.pivotModel).toBeDefined();
    // Turning the pivot off asks again without it.
    instance.setPivotActive(false);
    await Promise.resolve();
    expect(asked.at(-1)?.pivotModel).toBeUndefined();
  });
});

describe("HTML data grid range chart outline and handle (4.18.89)", () => {
  it("outlines the charted cells; the handle resizes; Escape restores; Alt + Shift + F1", async () => {
    const { root, instance } = setup(snippet("charts-range"));
    const cell = (rowId: string, field: string) =>
      root.querySelector(
        `[data-ok-row-id="${rowId}"] [role="gridcell"][data-ok-field="${field}"]`,
      ) as HTMLElement;
    expect(root.querySelector("[data-ok-chart-range]")).toBeNull();
    instance.createRangeChart({
      cellRange: { "s-01": { units: true, revenue: true }, "s-02": { units: true, revenue: true } },
    });
    const model = () => instance.chartModels[instance.activeChartId as string];
    expect(model()).toMatchObject({ rows: ["s-01", "s-02"], values: ["units", "revenue"] });
    expect(cell("s-01", "units").getAttribute("data-ok-chart-range")).toBe("series");
    expect(cell("s-01", "units").getAttribute("data-ok-chart-range-edge")).toBe("top left");
    const handle = cell("s-02", "revenue").querySelector(
      "[data-ok-data-grid-chart-handle]",
    ) as HTMLElement;
    expect(handle).not.toBeNull();
    cell("s-04", "revenue").scrollIntoView({ block: "nearest", inline: "nearest" });
    const to = cell("s-04", "revenue").getBoundingClientRect();
    handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    document.dispatchEvent(
      new PointerEvent("pointermove", { clientX: to.left + 4, clientY: to.top + 4 }),
    );
    document.dispatchEvent(new PointerEvent("pointerup"));
    expect(model()?.rows).toEqual(["s-01", "s-02", "s-03", "s-04"]);
    expect(
      cell("s-04", "revenue").querySelector("[data-ok-data-grid-chart-handle]"),
    ).not.toBeNull();
    // Escape puts the range back.
    const next = cell("s-04", "revenue").querySelector(
      "[data-ok-data-grid-chart-handle]",
    ) as HTMLElement;
    next.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    cell("s-01", "units").scrollIntoView({ block: "nearest", inline: "nearest" });
    const up = cell("s-01", "units").getBoundingClientRect();
    document.dispatchEvent(
      new PointerEvent("pointermove", { clientX: up.left + 4, clientY: up.top + 4 }),
    );
    expect(model()).toMatchObject({ rows: ["s-01"], values: ["units"] });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(model()?.rows).toHaveLength(4);
    // Keyboard: the selection becomes the range.
    instance.setCellSelectionModel({ "s-03": { region: true, revenue: true } });
    cell("s-03", "region").dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "F1", altKey: true, shiftKey: true }),
    );
    expect(model()).toMatchObject({ rows: ["s-03"], dimension: "region", values: ["revenue"] });
    expect(root.querySelector("[data-ok-data-grid-live]")?.textContent).toContain(
      "Chart range updated",
    );
    instance.setCellSelectionModel({ "s-03": { region: true } });
    cell("s-03", "region").dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "F1", altKey: true, shiftKey: true }),
    );
    expect(root.querySelector("[data-ok-data-grid-live]")?.textContent).toBe(
      "Select cells with numbers to create a chart",
    );
    // A chart that isn't a range chart: no outline.
    instance.setActiveChartId("regions");
    expect(root.querySelector("[data-ok-chart-range]")).toBeNull();
    await expectNoAxeViolations(root);
  });
});

describe("HTML data grid columns tool panel (4.18.90)", () => {
  it("searches, shows and hides all, pins, moves, groups, aggregates and resets", async () => {
    const { host, root, instance } = setup(snippet("columns-tool"));
    const panel = host.querySelector("#grid-columns-tool-columns") as HTMLElement;
    (host.querySelector('[aria-controls="grid-columns-tool-columns"]') as HTMLElement).click();
    // The popover focuses its first field a frame later.
    await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
    const items = () =>
      [...panel.querySelectorAll<HTMLElement>("[data-ok-data-grid-columns-item]")].map((item) =>
        item.getAttribute("data-ok-field"),
      );
    const change = (control: HTMLInputElement | HTMLSelectElement) =>
      control.dispatchEvent(new Event("change", { bubbles: true }));
    const search = panel.querySelector("#grid-columns-tool-columns-search") as HTMLInputElement;
    search.value = "ow";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    expect(
      [...panel.querySelectorAll<HTMLElement>("[data-ok-data-grid-columns-item]")]
        .filter((i) => !i.hidden)
        .map((i) => i.getAttribute("data-ok-field")),
    ).toEqual(["owner"]);
    search.value = "zz";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    expect(panel.querySelector<HTMLElement>("[data-ok-data-grid-columns-empty]")?.hidden).toBe(
      false,
    );
    search.value = "";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    const action = (name: string) =>
      (
        panel.querySelector(`[data-ok-data-grid-columns-action="${name}"]`) as HTMLButtonElement
      ).click();
    action("hide-all");
    expect(Object.values(instance.columnVisibilityModel).every((v) => v === false)).toBe(true);
    expect((panel.querySelector("input[data-ok-field]") as HTMLInputElement).checked).toBe(false);
    action("show-all");
    expect(Object.values(instance.columnVisibilityModel).every((v) => v === true)).toBe(true);
    const pin = panel.querySelector("#grid-columns-tool-columns-points-pin") as HTMLSelectElement;
    pin.value = "right";
    change(pin);
    expect(instance.pinnedColumns.right).toEqual(["points"]);
    const down = panel.querySelector(
      '[data-ok-data-grid-columns-item][data-ok-field="task"] [data-ok-data-grid-columns-move="down"]',
    ) as HTMLButtonElement;
    down.focus();
    down.click();
    expect(items().slice(0, 2)).toEqual(["team", "task"]);
    expect(document.activeElement).toBe(down);
    const group = panel.querySelector(
      '[data-ok-data-grid-columns-group="team"]',
    ) as HTMLInputElement;
    group.checked = true;
    change(group);
    expect(instance.rowGroupingModel).toEqual(["team"]);
    const values = panel.querySelector(
      "#grid-columns-tool-columns-points-aggregation",
    ) as HTMLSelectElement;
    values.value = "sum";
    change(values);
    expect(instance.aggregationModel).toEqual({ points: "sum" });
    values.value = "";
    change(values);
    expect(instance.aggregationModel).toEqual({});
    // Code changes show in the panel.
    instance.setColumnVisibilityModel({ owner: false });
    expect((panel.querySelector('input[data-ok-field="owner"]') as HTMLInputElement).checked).toBe(
      false,
    );
    instance.setAggregationModel({ points: "max" });
    expect(values.value).toBe("max");
    await expectNoAxeViolations(root);
    action("reset");
    expect(items()).toEqual(["task", "team", "owner", "points", "due"]);
    expect(instance.pinnedColumns.right ?? []).toEqual([]);
    expect(instance.rowGroupingModel).toEqual([]);
    expect(instance.aggregationModel).toEqual({});
    expect(search.value).toBe("");
    expect(group.checked).toBe(false);
    // Pivoting hides the sections.
    instance.setPivotModel({ rows: [{ field: "team" }], columns: [], values: [] });
    instance.setPivotActive(true);
    expect(
      [...panel.querySelectorAll<HTMLElement>("[data-ok-data-grid-columns-section]")].every(
        (section) => section.hidden,
      ),
    ).toBe(true);
  });

  it("code moves, the last place, unpinning, ungrouping; a column without a pin menu", async () => {
    const { host, instance } = setup(snippet("columns-tool"), (root) => {
      root.setAttribute("data-ok-row-grouping-model", '["team"]');
      root
        .querySelector("#grid-columns-tool-columns-due-pin")
        ?.closest("[data-ok-text-field]")
        ?.remove();
    });
    const panel = host.querySelector("#grid-columns-tool-columns") as HTMLElement;
    (host.querySelector('[aria-controls="grid-columns-tool-columns"]') as HTMLElement).click();
    await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
    const items = () =>
      [...panel.querySelectorAll("[data-ok-data-grid-columns-item]")].map((i) =>
        i.getAttribute("data-ok-field"),
      );
    instance.setColumnOrder(["due", "task", "team", "owner", "points"]);
    expect(items()).toEqual(["due", "task", "team", "owner", "points"]);
    const down = panel.querySelector(
      '[data-ok-data-grid-columns-item][data-ok-field="owner"] [data-ok-data-grid-columns-move="down"]',
    ) as HTMLButtonElement;
    down.focus();
    down.click();
    expect(items().at(-1)).toBe("owner");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Move up: Owner");
    instance.setPinnedColumns({ left: ["task"] });
    const pin = panel.querySelector("#grid-columns-tool-columns-task-pin") as HTMLSelectElement;
    expect(pin.value).toBe("left");
    pin.value = "none";
    pin.dispatchEvent(new Event("change", { bubbles: true }));
    expect(instance.pinnedColumns.left ?? []).toEqual([]);
    const group = panel.querySelector(
      '[data-ok-data-grid-columns-group="team"]',
    ) as HTMLInputElement;
    expect(group.checked).toBe(true);
    group.checked = false;
    group.dispatchEvent(new Event("change", { bubbles: true }));
    expect(instance.rowGroupingModel).toEqual([]);
  });
});

describe("HTML data grid batch E edges", () => {
  it("pins body rows of a selection grid and back; ignores unknown ids", () => {
    const { root, instance } = setup(snippet("basic-group"));
    instance.restoreState({ pinnedRows: { top: ["p-002", "nope"], bottom: [] } });
    const top = root.querySelector('[data-ok-data-grid-pinned-rows="top"]') as HTMLElement;
    expect(top.querySelector('[data-ok-row-id="p-002"]')?.hasAttribute("aria-selected")).toBe(
      false,
    );
    expect(instance.exportState().pinnedRows).toEqual({ top: ["p-002"], bottom: [] });
    const moved = top.querySelector('[data-ok-row-id="p-002"]') as HTMLElement;
    instance.restoreState({ pinnedRows: {} });
    expect(root.querySelector("[data-ok-data-grid-pinned-rows]")).toBeNull();
    // Back in the body (at its end, on the last page), selectable again.
    expect(moved.getAttribute("aria-selected")).toBe("false");
    // An unselectable row ignores Shift + click.
    const row = root.querySelector('[data-ok-row-id="p-004"]') as HTMLElement;
    row.setAttribute("data-ok-selectable", "false");
    row
      .querySelector('[data-ok-field="age"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    expect(instance.selection).toEqual([]);
  });

  it("server pivot rows without group keys; values through getAggregatedValue", async () => {
    const { root, instance } = setup(snippet("pivot-group"));
    instance.setPivotModel({
      rows: [],
      columns: [],
      values: [{ field: "revenue", aggFunc: "sum" }],
    });
    instance.setDataSource(
      {
        getRows: async () => ({ rows: [{ id: "all", total: 42 }], pivotColumns: [] }),
        getAggregatedValue: (row, field) =>
          field === "revenue" ? (row as Record<string, unknown>)["total"] : null,
      },
      { cache: null },
    );
    await new Promise<void>((resolve) => {
      const done = () => root.querySelector('[data-ok-row-id="all"]');
      const observer = new MutationObserver(() => {
        if (done()) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(root, { childList: true, subtree: true });
    });
    expect(
      root.querySelector('[data-ok-row-id="all"] [role="gridcell"][data-ok-field^="pivot:"]')
        ?.textContent,
    ).toBe("42");
  });

  it("Alt + Shift + F1 off a range chart does nothing; a range chart without a label", () => {
    const { root, instance } = setup(snippet("charts-range"));
    const cell = root.querySelector(
      '[data-ok-row-id="s-01"] [role="gridcell"][data-ok-field="units"]',
    ) as HTMLElement;
    instance.setCellSelectionModel({ "s-01": { units: true } });
    const press = () =>
      cell.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "F1", altKey: true, shiftKey: true }),
      );
    press();
    expect(root.querySelector("[data-ok-data-grid-live]")?.textContent ?? "").toBe("");
    instance.setChartModels({
      ...instance.chartModels,
      plain: { type: "column", dimension: null, values: ["units"], rows: ["s-02"] },
    });
    instance.setActiveChartId("plain");
    press();
    expect(root.querySelector("[data-ok-data-grid-live]")?.textContent).toBe(
      "Chart range updated: Chart of the data",
    );
  });
});
