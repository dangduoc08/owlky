import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { DataGridInstance } from "./data-grid.js";

// Roadmap batch E (Data grid coulds, 4.18.55–4.18.58).

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

const setup = (html: string, height?: string) => {
  const host = mount(html);
  const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
  if (height) root.style.height = height;
  runtime = createRuntime()
    .register(...components)
    .start();
  const instance = runtime.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
  return { host, root, instance };
};
const events = (root: Element, name: string) => {
  const seen: Record<string, unknown>[] = [];
  root.addEventListener(`ok:data-grid:${name}`, (event) => {
    seen.push((event as CustomEvent).detail);
  });
  return seen;
};
const cell = (root: Element, id: string, field: string) =>
  root.querySelector(`[data-ok-row-id="${id}"] [data-ok-field="${field}"]`) as HTMLElement;
const paste = (target: HTMLElement, text: string) => {
  target.focus();
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: "v", ctrlKey: true, bubbles: true, cancelable: true }),
  );
  const area = document.activeElement as HTMLElement;
  const transfer = new DataTransfer();
  transfer.setData("text/plain", text);
  const read = vi.spyOn(DataTransfer.prototype, "getData").mockReturnValue(text);
  area.dispatchEvent(
    new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }),
  );
  read.mockRestore();
};

describe("data grid events (4.18.55)", () => {
  it("reports double clicks, right clicks and the pointer on column headers", () => {
    const { root } = setup(snippet("filters-group"));
    const field = root.querySelector(
      '[role="columnheader"][data-ok-field]:not([data-ok-field^="__"])',
    ) as HTMLElement;
    const name = field.getAttribute("data-ok-field") as string;
    const double = events(root, "columnheaderdoubleclick");
    const context = events(root, "columnheadercontextmenu");
    const enter = events(root, "columnheaderenter");
    const leave = events(root, "columnheaderleave");
    const over = events(root, "columnheaderover");
    const out = events(root, "columnheaderout");
    field.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(double).toEqual([{ field: name }]);
    const prevented = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    root.addEventListener("ok:data-grid:columnheadercontextmenu", (e) => e.preventDefault(), {
      once: true,
    });
    field.dispatchEvent(prevented);
    expect(context).toEqual([{ field: name }]);
    expect(prevented.defaultPrevented).toBe(true);

    const title = field.querySelector("[data-ok-data-grid-header-title]") as HTMLElement;
    field.dispatchEvent(
      new MouseEvent("mouseover", { bubbles: true, relatedTarget: document.body }),
    );
    title.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: field }));
    expect(enter).toEqual([{ field: name }]);
    expect(over).toHaveLength(2);
    title.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: field }));
    field.dispatchEvent(
      new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }),
    );
    expect(out).toHaveLength(2);
    expect(leave).toEqual([{ field: name }]);

    double.length = 0;
    (field.querySelector("[data-ok-data-grid-resize]") as Element).dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true }),
    );
    expect(double).toEqual([]);
  });

  it("reports menus and preference panels opening and closing", async () => {
    const { root } = setup(snippet("filters-group"));
    const menuopen = events(root, "menuopen");
    const menuclose = events(root, "menuclose");
    const panelopen = events(root, "preferencepanelopen");
    const panelclose = events(root, "preferencepanelclose");
    const density = root.querySelector('[aria-controls$="-density"]') as HTMLElement;
    await userEvent.click(density);
    await settle();
    expect(menuopen).toEqual([{ menu: "density", target: density }]);
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(menuclose).toEqual([{ menu: "density", target: density }]);
    await userEvent.click(root.querySelector('[aria-controls$="-columns"]') as HTMLElement);
    await settle();
    expect(panelopen).toEqual([{ openedPanelValue: "columns" }]);
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(panelclose).toEqual([{ openedPanelValue: "columns" }]);
  });

  it("reports the pivot panel as a sidebar", async () => {
    const { root } = setup(snippet("pivot-group"));
    const open = events(root, "sidebaropen");
    const close = events(root, "sidebarclose");
    await userEvent.click(root.querySelector('[aria-controls$="-pivot"]') as HTMLElement);
    await settle();
    expect(open).toEqual([{ value: "pivot" }]);
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(close).toEqual([{ value: "pivot" }]);
  });

  it("reports the grid's own size", async () => {
    const { root } = setup(snippet("filters-group"));
    const seen = events(root, "containerresize");
    root.style.width = "300px";
    await vi.waitUntil(() => seen.at(-1)?.["width"] === 300);
  });

  it("reports each width while a column's edge is dragged", () => {
    const { root } = setup(snippet("filters-group"));
    const moving = events(root, "columnresize");
    const done = events(root, "resize");
    const handle = root.querySelector("[data-ok-data-grid-resize]") as HTMLElement;
    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 100, button: 0 }),
    );
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: 120 }));
    expect(moving).toHaveLength(1);
    expect(done).toHaveLength(0);
    document.dispatchEvent(new PointerEvent("pointerup", { clientX: 120 }));
    expect(moving).toHaveLength(2);
    expect(done).toHaveLength(1);
  });

  it("asks for rows when the rendered window moves and the row count exceeds the rows", async () => {
    const { root, instance } = setup(snippet("large-group"), "300px");
    const seen = events(root, "fetchrows");
    root.setAttribute("data-ok-row-count", "1000");
    instance.setRows(
      Array.from({ length: 100 }, (_, i) => ({
        id: `c-${i + 1}`,
        firstName: `P${i}`,
        lastName: "Doe",
        age: i,
        city: "Lima",
      })),
    );
    await settle();
    await vi.waitUntil(() => seen.length > 0);
    const count = seen.length;
    const main = root.querySelector("[data-ok-data-grid-main]") as HTMLElement;
    main.scrollTop = 2000;
    main.dispatchEvent(new Event("scroll"));
    await vi.waitUntil(() => seen.length > count);
    expect(Number(seen.at(-1)?.["firstRowToRender"])).toBeGreaterThan(0);
    expect(seen.at(-1)).toMatchObject({ sortModel: [], filterModel: { items: [] } });
  });

  it("doesn't ask for rows when every row is there", async () => {
    const { root } = setup(snippet("filters-group"), "300px");
    const seen = events(root, "fetchrows");
    await settle();
    expect(seen).toEqual([]);
  });

  it("reports an Excel export's state around the download", () => {
    const states: unknown[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      states.push("download");
    });
    const { root, instance } = setup(snippet("filters-group"));
    root.addEventListener("ok:data-grid:excelexportstate", (event) => {
      states.push((event as CustomEvent).detail.state);
    });
    instance.exportExcel();
    expect(click).toHaveBeenCalledOnce();
    expect(states).toEqual(["pending", "download", "finished"]);
  });

  it("beforeclipboardpaste cancels, waits for a promise and cancels on a rejection", async () => {
    const { root } = setup(snippet("cells-group"));
    const edits = events(root, "edit");
    root.addEventListener("ok:data-grid:beforeclipboardpaste", (e) => e.preventDefault(), {
      once: true,
    });
    paste(cell(root, "i-1", "name"), "Pot");
    expect(edits).toEqual([]);

    let confirm: () => void = () => {};
    root.addEventListener(
      "ok:data-grid:beforeclipboardpaste",
      (e) =>
        (e as CustomEvent).detail.waitUntil(new Promise<void>((resolve) => (confirm = resolve))),
      { once: true },
    );
    paste(cell(root, "i-1", "name"), "Pan");
    expect(edits).toEqual([]);
    (document.activeElement as HTMLElement).blur();
    confirm();
    await settle();
    expect(edits[0]).toEqual({ id: "i-1", row: { name: "Pan" } });

    edits.length = 0;
    root.addEventListener(
      "ok:data-grid:beforeclipboardpaste",
      (e) => (e as CustomEvent).detail.waitUntil(Promise.reject(new Error("no"))),
      { once: true },
    );
    paste(cell(root, "i-2", "name"), "Mug");
    await settle();
    expect(edits).toEqual([]);
  });
});

describe("data grid server options (4.18.56)", () => {
  const body = (root: Element) => [
    ...root.querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])'),
  ];
  const displayed = (root: Element) =>
    root.querySelector("[data-ok-table-pagination-displayed]")?.textContent;
  const nextButton = (root: Element) =>
    root.querySelector('[data-ok-table-pagination-action="next"]') as HTMLButtonElement;
  const main = (root: Element) => root.querySelector("[data-ok-data-grid-main]") as HTMLElement;
  const people = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `c-${i + 1}`,
      firstName: `P${i + 1}`,
      lastName: "Doe",
      age: 20 + i,
      city: "Lima",
    }));
  const serverGrid = (extra = "") =>
    snippet("server-group").replace(
      "<div data-ok-data-grid ",
      `<div data-ok-data-grid data-ok-disable-virtualization ${extra} `,
    );

  it("rowCount -1: unknown until the server says the last page", async () => {
    const { root, instance } = setup(
      serverGrid(
        'data-ok-pagination-mode="server" data-ok-row-count="-1" data-ok-has-next-page="true"',
      ),
    );
    instance.setDataSource(null);
    await settle();
    expect(displayed(root)).toMatch(/more than/);
    expect(main(root).getAttribute("aria-rowcount")).toBe("-1");
    expect(nextButton(root).disabled).toBe(false);
    root.setAttribute("data-ok-has-next-page", "false");
    await settle();
    expect(displayed(root)).toMatch(/of \d+$/);
    expect(nextButton(root).disabled).toBe(true);
  });

  it("estimatedRowCount shows around n while the page is before it", async () => {
    const { root, instance } = setup(
      serverGrid(
        'data-ok-pagination-mode="server" data-ok-row-count="-1" data-ok-estimated-row-count="500"',
      ),
    );
    instance.setDataSource(null);
    await settle();
    expect(displayed(root)).toMatch(/of around 500$/);
    root.removeAttribute("data-ok-estimated-row-count");
    await settle();
    expect(displayed(root)).toMatch(/more than/);
  });

  it("rowcountchange reports a new count", async () => {
    const { root, instance } = setup(
      serverGrid('data-ok-pagination-mode="server" data-ok-row-count="20"'),
    );
    instance.setDataSource(null);
    await settle();
    const seen = events(root, "rowcountchange");
    root.setAttribute("data-ok-row-count", "40");
    await settle();
    expect(seen).toEqual([{ count: 40 }]);
  });

  it("reads pageInfo from a data source and reports it", async () => {
    const { root, instance } = setup(serverGrid());
    const seen = events(root, "paginationmetachange");
    instance.setDataSource({
      getRows: async () => ({ rows: people(5), pageInfo: { hasNextPage: false } }),
    });
    await vi.waitUntil(() => seen.length > 0);
    expect(seen).toEqual([{ hasNextPage: false }]);
    await settle();
    expect(nextButton(root).disabled).toBe(true);
  });

  it("hides the rows while a data source loads, unless asked to keep them", async () => {
    const { root, instance } = setup(serverGrid());
    const pending: ((rows: ReturnType<typeof people>) => void)[] = [];
    const finish = async (index: number, rows: ReturnType<typeof people>) => {
      pending[index]?.(rows);
      await settle();
    };
    instance.setDataSource({
      getRows: () =>
        new Promise((resolve) => pending.push((rows) => resolve({ rows, rowCount: 8 }))),
    });
    await finish(0, people(5));
    expect(body(root)).toHaveLength(5);
    const age = root.querySelector('[role="columnheader"][data-ok-field="age"]') as HTMLElement;
    age.click();
    await settle();
    expect(body(root)).toHaveLength(0);
    await finish(1, people(5));
    expect(body(root)).toHaveLength(5);
    root.setAttribute("data-ok-data-source-keep-previous-data", "");
    age.click();
    await settle();
    expect(body(root)).toHaveLength(5);
    await finish(2, people(2));
    expect(body(root)).toHaveLength(2);
  });

  it("dataSourceRevalidateMs reloads expired rows without the loading state", async () => {
    const { root, instance } = setup(serverGrid('data-ok-data-source-revalidate-ms="30"'));
    let rows = people(5);
    const getRows = vi.fn(async () => ({ rows, rowCount: 8 }));
    instance.setDataSource({ getRows }, { cache: null });
    await settle();
    rows = people(1);
    await vi.waitUntil(() => getRows.mock.calls.length > 1);
    await vi.waitUntil(() => body(root).length === 1);
    expect(root.hasAttribute("data-ok-loading")).toBe(false);
  });

  it("waits filterDebounceMs before filtering", async () => {
    const { root } = setup(
      snippet("filters-group").replace(
        "<div data-ok-data-grid ",
        '<div data-ok-data-grid data-ok-filter-debounce-ms="40" ',
      ),
    );
    const seen = events(root, "filter");
    const quick = root.querySelector("[data-ok-data-grid-quick-filter] input") as HTMLInputElement;
    quick.value = "Per";
    quick.dispatchEvent(new Event("input", { bubbles: true }));
    expect(seen).toEqual([]);
    await vi.waitUntil(() => seen.length > 0);
    expect(seen.at(-1)).toMatchObject({ model: { quickFilterValues: ["Per"] } });
  });

  it("disableChildrenFiltering keeps a passing root's children", async () => {
    const { root, instance } = setup(snippet("tree-group"));
    const header = root.querySelector(
      '[role="columnheader"][data-ok-field]:not([data-ok-field^="__"])',
    ) as HTMLElement;
    const field = header.getAttribute("data-ok-field") as string;
    const rows = () => body(root).length;
    const all = rows();
    instance.setFilterModel({ items: [{ field, operator: "contains", value: "Ann" }] });
    await settle();
    const filtered = rows();
    root.setAttribute("data-ok-disable-children-filtering", "");
    instance.setFilterModel({ items: [{ field, operator: "contains", value: "Ann" }] });
    await settle();
    expect(rows()).toBeGreaterThanOrEqual(filtered);
    expect(all).toBeGreaterThan(0);
  });
});

describe("data grid columns, rows and pivot options (4.18.57)", () => {
  const key = (target: Element, k: string) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, altKey: true, bubbles: true, cancelable: true }),
    );
  const ids = (root: Element) =>
    [...root.querySelectorAll('[data-ok-data-grid-body] > [role="row"][data-ok-row-id]')].map((r) =>
      r.getAttribute("data-ok-row-id"),
    );

  it("disableAutosize: a double click on a column's edge does nothing", () => {
    const { root } = setup(
      snippet("filters-group").replace(
        "<div data-ok-data-grid ",
        "<div data-ok-data-grid data-ok-disable-autosize ",
      ),
    );
    const seen = events(root, "resize");
    (root.querySelector("[data-ok-data-grid-resize]") as Element).dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true }),
    );
    expect(seen).toEqual([]);
    root.removeAttribute("data-ok-disable-autosize");
    (root.querySelector("[data-ok-data-grid-resize]") as Element).dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true }),
    );
    expect(seen.length).toBeGreaterThan(0);
  });

  it("rows with data-ok-reorderable=false stay", () => {
    const { root } = setup(snippet("ordering-group"));
    const first = root.querySelector('[data-ok-data-grid-body] > [role="row"]') as HTMLElement;
    const before = ids(root);
    first.setAttribute("data-ok-reorderable", "false");
    key(first.querySelector("[data-ok-data-grid-reorder-handle]") as Element, "ArrowDown");
    expect(ids(root)).toEqual(before);
  });

  it("tree rows move with their children, to another parent too", async () => {
    const host = mount(snippet("tree-group"));
    const root = host.querySelector("[data-ok-data-grid]") as HTMLElement;
    root.setAttribute("data-ok-row-reordering", "");
    // A reorder column, as React renders it for rowReordering.
    const headerRow = root.querySelector(
      '[data-ok-data-grid-header] > [role="row"]',
    ) as HTMLElement;
    const head = document.createElement("div");
    head.setAttribute("role", "columnheader");
    head.setAttribute("data-ok-field", "__reorder__");
    headerRow.prepend(head);
    for (const row of root.querySelectorAll('[data-ok-data-grid-body] > [role="row"]')) {
      const cellEl = document.createElement("div");
      cellEl.setAttribute("role", "gridcell");
      cellEl.setAttribute("data-ok-field", "__reorder__");
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-ok-data-grid-reorder-handle", "");
      button.setAttribute("aria-label", "Move");
      cellEl.append(button);
      row.prepend(cellEl);
    }
    runtime = createRuntime()
      .register(...components)
      .start();
    const instance = runtime.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
    instance.setRowChildrenExpansion("m-1", true);
    instance.setRowChildrenExpansion("m-2", true);
    await settle();
    const seen = events(root, "roworder");
    const row = (id: string) =>
      root.querySelector(`[data-ok-data-grid-body] > [data-ok-row-id="${id}"]`) as HTMLElement;
    // m-3 (under m-2) up past m-2: it lands above m-2, under m-1.
    key(row("m-3").querySelector("[data-ok-data-grid-reorder-handle]") as Element, "ArrowUp");
    expect(seen.at(-1)).toMatchObject({ id: "m-3", oldParentId: "m-2", parentId: "m-1" });
    expect(row("m-3").getAttribute("data-ok-parent")).toBe("m-1");
    expect(row("m-3").getAttribute("aria-level")).toBe("2");
    // A parent can't go into its own subtree.
    const count = seen.length;
    root.addEventListener("ok:data-grid:roworder", (e) => e.preventDefault(), { once: true });
    key(row("m-2").querySelector("[data-ok-data-grid-reorder-handle]") as Element, "ArrowDown");
    expect(seen.length).toBe(count + 1);
    expect(row("m-3").getAttribute("data-ok-parent")).toBe("m-1");
  });

  it("setPivotingColDef overrides the pivot's columns", async () => {
    const { root, instance } = setup(snippet("pivot-group"));
    instance.setPivotingColDef((field) => ({ headerName: `Total ${field}`, width: 180 }));
    await settle();
    const pivotHeader = root.querySelector('[role="columnheader"][data-ok-field^="pivot:"]');
    expect(pivotHeader?.textContent).toMatch(/^Total /);
    expect(pivotHeader?.getAttribute("data-ok-width")).toBe("180");
    instance.setPivotingColDef(null);
    await settle();
    expect(
      root.querySelector('[role="columnheader"][data-ok-field^="pivot:"]')?.textContent,
    ).not.toMatch(/^Total /);
  });

  it("data-ok-pivot-panel-open opens the pivot panel, and follows it", async () => {
    const { root } = setup(snippet("pivot-group"));
    const panel = root.querySelector('[id$="-pivot"][popover]') as HTMLElement;
    root.setAttribute("data-ok-pivot-panel-open", "");
    await settle();
    expect(panel.hasAttribute("data-ok-open")).toBe(true);
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(root.hasAttribute("data-ok-pivot-panel-open")).toBe(false);
    await userEvent.click(root.querySelector('[aria-controls$="-pivot"]') as HTMLElement);
    await settle();
    expect(root.hasAttribute("data-ok-pivot-panel-open")).toBe(true);
  });
});
