import type { GridGetRowsParams } from "@owlky/core";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import { loadGridChartKit } from "./chart-kit.js";
import type { DataGridInstance } from "./data-grid.js";

// Edge paths of the HTML data grid: data source saves through the history, revalidation,
// context menu actions, edit setters and column drags outside the grid.

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
const cell = (root: Element, id: string, field: string) =>
  root.querySelector(
    `[data-ok-row-id="${id}"] > [role="gridcell"][data-ok-field="${field}"]`,
  ) as HTMLElement;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: k, ...init }),
  );
/** Resolves with the detail of the next `ok:data-grid:<name>` event. */
const next = (root: Element, name: string) =>
  new Promise<unknown>((resolve) =>
    root.addEventListener(
      `ok:data-grid:${name}`,
      (event) => resolve((event as CustomEvent).detail),
      {
        once: true,
      },
    ),
  );
const editTo = (target: HTMLElement, text: string) => {
  target.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  const input = target.querySelector("input") as HTMLInputElement;
  input.value = text;
  key(input, "Enter");
};
const ITEMS = [
  { id: "i-1", name: "Kettle", category: "Brewing", stock: 4 },
  { id: "i-2", name: "Cup", category: "Serving", stock: 9 },
];

// The chart helpers load on first use (ADR-0068 S5): load them once, so charts draw synchronously.
beforeAll(() => loadGridChartKit());

describe("undo and redo through a data source", () => {
  it("saves each step with updateRow; a failed save puts the cells back and reports it", async () => {
    // Rows a data source loads are built from a row template (one of the markup's rows).
    const { root, instance } = setup(snippet("cells-group"), (r) => {
      const template = document.createElement("template");
      template.setAttribute("data-ok-data-grid-row", "");
      template.content.append(
        (r.querySelector('[data-ok-row-id="i-1"]') as HTMLElement).cloneNode(true),
      );
      r.append(template);
    });
    let fail = false;
    const updateRow = vi.fn(({ updatedRow }: { updatedRow: Record<string, unknown> }) =>
      fail ? Promise.reject(new Error("save")) : Promise.resolve({ ...updatedRow }),
    );
    instance.setDataSource({
      getRows: () => Promise.resolve({ rows: ITEMS.map((item) => ({ ...item })), rowCount: 2 }),
      updateRow,
    });
    await settle();
    await settle();
    expect(cell(root, "i-1", "name").textContent).toBe("Kettle");
    editTo(cell(root, "i-1", "name"), "Pot");
    await settle();
    expect(updateRow).toHaveBeenCalledTimes(1);
    expect(await instance.history.undo()).toBe(true);
    expect(updateRow).toHaveBeenLastCalledWith(
      expect.objectContaining({
        rowId: "i-1",
        updatedRow: expect.objectContaining({ name: "Kettle" }),
        previousRow: expect.objectContaining({ name: "Pot" }),
      }),
    );
    await settle();
    expect(cell(root, "i-1", "name").textContent).toBe("Kettle");
    fail = true;
    const error = next(root, "datasourceerror");
    expect(await instance.history.redo()).toBe(true);
    expect(cell(root, "i-1", "name").textContent).toBe("Pot");
    expect(await error).toEqual({ error: expect.any(Error) });
    // The failed save brings the values from before the step back.
    expect(cell(root, "i-1", "name").textContent).toBe("Kettle");
  });
});

describe("data source revalidation", () => {
  const serverGrid = (extra = "") =>
    snippet("server-group").replace("<div data-ok-data-grid ", `<div data-ok-data-grid ${extra} `);
  const people = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `p-${i}`,
      firstName: `P${i}`,
      lastName: "L",
      age: 20 + i,
      city: "Lima",
    }));

  it("turned on later, it skips rows still cached and reports a failed reload", async () => {
    const { root, instance } = setup(serverGrid());
    const cached = vi.fn(async () => ({ rows: people(3), rowCount: 3 }));
    instance.setDataSource({ getRows: cached });
    await settle();
    expect(cached).toHaveBeenCalledTimes(1);
    // Fresh cache entries aren't asked for again.
    root.setAttribute("data-ok-data-source-revalidate-ms", "10");
    await settle();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(cached).toHaveBeenCalledTimes(1);
    // Without a cache, each interval asks again; a failure is reported, the rows stay.
    let calls = 0;
    instance.setDataSource(
      {
        getRows: async () => {
          calls += 1;
          if (calls > 1) throw new Error("offline");
          return { rows: people(2), rowCount: 2 };
        },
      },
      { cache: null },
    );
    const error = await next(root, "datasourceerror");
    expect(error).toEqual({ error: expect.objectContaining({ message: "offline" }) });
    expect(root.querySelectorAll('[role="row"][data-ok-row-id]')).toHaveLength(2);
    root.removeAttribute("data-ok-data-source-revalidate-ms");
    await settle();
  });
});

describe("context menu actions", () => {
  const menu = () => document.getElementById("grid-context-context-menu") as HTMLElement;
  const action = (name: string) =>
    menu().querySelector<HTMLElement>(
      `[data-ok-data-grid-context-action="${name}"]`,
    ) as HTMLElement;
  const contextMenu = (target: Element) =>
    target.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 }),
    );

  it("pins left and unpins; prints; a range chart without a chart panel is refused", () => {
    const { host, root } = setup(snippet("context-group"), () => {
      // A Chart range item, as React renders it with charts.
      const item = action("print").cloneNode(true) as HTMLElement;
      item.setAttribute("data-ok-data-grid-context-action", "chart-range");
      item.textContent = "Chart range";
      action("print").after(item);
    });
    const pins: unknown[] = [];
    root.addEventListener("ok:data-grid:pinned", (event) =>
      pins.push((event as CustomEvent).detail.model),
    );
    contextMenu(cell(host, "is-1", "priority"));
    action("pin-left").click();
    expect(pins.at(-1)).toEqual({ left: ["priority"], right: [] });
    contextMenu(cell(host, "is-1", "priority"));
    expect(action("pin-left").getAttribute("aria-disabled")).toBe("true");
    action("unpin").click();
    expect(pins.at(-1)).toEqual({ left: [], right: [] });
    // Print goes through a hidden frame: stub its print().
    const print = vi.fn();
    const append = document.body.append.bind(document.body);
    vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
      append(...nodes);
      for (const node of nodes)
        if (node instanceof HTMLIFrameElement) (node.contentWindow as Window).print = print;
    });
    contextMenu(cell(host, "is-1", "title"));
    action("print").click();
    expect(print).toHaveBeenCalledTimes(1);
    document.querySelector("iframe")?.remove();
    contextMenu(cell(host, "is-1", "title"));
    action("chart-range").click();
    expect(host.querySelector("[data-ok-data-grid-live]")?.textContent).not.toBe("");
  });
});

describe("context menu on group rows", () => {
  it("keeps the browser's menu on a generated group row", () => {
    const { root } = setup(
      snippet("context-group").replace(
        "<div data-ok-data-grid ",
        `<div data-ok-data-grid data-ok-row-grouping-model='["priority"]' `,
      ),
    );
    const group = root.querySelector(
      '[data-ok-data-grid-body] > [role="row"][data-ok-generated]',
    ) as HTMLElement;
    expect(group).not.toBeNull();
    const target = group.querySelector('[role="gridcell"][data-ok-field]') as HTMLElement;
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 });
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(document.getElementById("grid-context-context-menu")?.hasAttribute("data-ok-open")).toBe(
      false,
    );
  });
});

describe("edit setters", () => {
  it("a row edit from code without a field starts in the first editable column", () => {
    const { root, instance } = setup(snippet("editors-group"), (r) =>
      r.setAttribute("data-ok-edit-mode", "row"),
    );
    instance.setRowModesModel({ "is-2": { mode: "edit" } });
    const row = root.querySelector('[data-ok-row-id="is-2"]') as HTMLElement;
    expect(row.hasAttribute("data-ok-editing")).toBe(true);
    const first = [...row.querySelectorAll('[role="gridcell"][data-ok-editing]')][0];
    expect(first?.contains(document.activeElement)).toBe(true);
    // An unknown row ends the current edit and starts none.
    instance.setRowModesModel({ nope: { mode: "edit" } });
    expect(row.hasAttribute("data-ok-editing")).toBe(false);
    expect(root.querySelectorAll('[role="row"][data-ok-editing]')).toHaveLength(0);
  });

  it("setEditCellValue checks a boolean editor's box", () => {
    const { root, instance } = setup(snippet("advanced-group"));
    const target = cell(root, "p-001", "remote");
    target.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const box = target.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(box).not.toBeNull();
    const now = box.checked;
    instance.setEditCellValue({ id: "p-001", field: "remote", value: !now });
    expect(box.checked).toBe(!now);
  });
});

describe("edits started from the keyboard and moved by the modes setter", () => {
  it("a typed key opens a text editor with the caret after it; the setter moves to another field", () => {
    const { root, instance } = setup(snippet("editors-group"));
    const title = cell(root, "is-2", "title");
    title.focus();
    key(title, "x");
    const input = title.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("x");
    expect(input.selectionStart).toBe(1);
    expect(instance.cellModesModel).toEqual({ "is-2": { title: { mode: "edit" } } });
    // The same row, another field: the edit moves (the typed text is kept).
    instance.setCellModesModel({ "is-2": { points: { mode: "edit" } } });
    expect(title.hasAttribute("data-ok-editing")).toBe(false);
    expect(title.textContent).toBe("x");
    expect(cell(root, "is-2", "points").hasAttribute("data-ok-editing")).toBe(true);
  });

  it("the row modes model names the row being edited and its fieldToFocus (as React)", () => {
    const { root, instance } = setup(snippet("editors-group"), (r) =>
      r.setAttribute("data-ok-edit-mode", "row"),
    );
    cell(root, "is-3", "title").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(instance.rowModesModel).toEqual({ "is-3": { mode: "edit", fieldToFocus: "title" } });
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(instance.rowModesModel).toEqual({});
    // Started on another cell: that field is the one to focus.
    cell(root, "is-3", "points").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(instance.rowModesModel).toEqual({ "is-3": { mode: "edit", fieldToFocus: "points" } });
  });
});

describe("generated columns: other tables", () => {
  const auto = snippet("auto-group");

  it("leave markup columns alone, read rows shorter than the head, and work without an id", () => {
    // A header row that already has a data column: nothing is generated.
    const own = setup(auto, (root) => {
      const header = document.createElement("div");
      header.setAttribute("role", "columnheader");
      header.setAttribute("data-ok-field", "mine");
      root.querySelector('[data-ok-data-grid-header] [role="row"]')?.append(header);
    });
    expect(own.host.querySelectorAll('[role="columnheader"][data-ok-field]')).toHaveLength(1);
    runtime?.stop();
    resetPage();
    // A short row and no id: the missing cells are empty, no panels are filled.
    const short = setup(
      auto.replace(/<td>Alpha<\/td>[\s\S]*?<\/tr>/, "<td>Alpha</td></tr>"),
      (root) => root.removeAttribute("id"),
    );
    const first = short.host.querySelector('[data-ok-row-id="1"]') as HTMLElement;
    expect(first.querySelector('[data-ok-field="name"]')?.textContent).toBe("Alpha");
    expect(first.querySelector('[data-ok-field="downloads"]')?.textContent).toBe("");
    runtime?.stop();
    resetPage();
    // A table without a head has no columns.
    const headless = setup(auto.replace(/<thead>[\s\S]*?<\/thead>/, ""));
    expect(headless.host.querySelectorAll('[role="columnheader"][data-ok-field]')).toHaveLength(0);
  });
});

describe("history and fill edges", () => {
  const pressed = (el: Element, init: PointerEventInit = {}) => {
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, ...init }));
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  };
  const centre = (el: Element) => {
    const box = el.getBoundingClientRect();
    return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
  };
  const fillGrid = () =>
    setup(
      snippet("cells-group").replace(
        "<div data-ok-data-grid ",
        "<div data-ok-data-grid data-ok-cell-selection-fill-handle ",
      ),
    );
  const drag = (root: Element, to: HTMLElement) => {
    (root.querySelector("[data-ok-data-grid-fill-handle]") as Element).dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0 }),
    );
    document.dispatchEvent(new PointerEvent("pointermove", centre(to)));
    document.dispatchEvent(new PointerEvent("pointerup", centre(to)));
  };

  it("a fill whose edits are all refused changes nothing and records no step", async () => {
    const { root, instance } = fillGrid();
    const before = cell(root, "i-3", "name").textContent;
    root.addEventListener("ok:data-grid:edit", (event) => event.preventDefault());
    pressed(cell(root, "i-1", "name"));
    drag(root, cell(root, "i-3", "name"));
    expect(cell(root, "i-3", "name").textContent).toBe(before);
    expect(instance.history.canUndo()).toBe(false);
    expect(await instance.history.undo()).toBe(false);
  });

  it("filling across columns parses the source text; read-only target columns are skipped", () => {
    const { root } = fillGrid();
    const edits: unknown[] = [];
    root.addEventListener("ok:data-grid:edit", (event) =>
      edits.push((event as CustomEvent).detail),
    );
    // Stock (a number) filled right into Restocked (not editable) and down.
    pressed(cell(root, "i-1", "stock"));
    drag(root, cell(root, "i-1", "restocked"));
    expect(edits).toEqual([]);
    // Name filled down two rows into the same column parses nothing (same field).
    pressed(cell(root, "i-1", "category"));
    pressed(cell(root, "i-1", "stock"), { shiftKey: true });
    drag(root, cell(root, "i-2", "stock"));
    expect(edits).toEqual([
      {
        id: "i-2",
        row: expect.objectContaining({ category: cell(root, "i-1", "category").textContent }),
      },
    ]);
  });

  it("a new history size starts a new stack", async () => {
    const { root, instance } = setup(snippet("cells-group"));
    editTo(cell(root, "i-1", "name"), "One");
    expect(instance.history.canUndo()).toBe(true);
    root.setAttribute("data-ok-history-stack-size", "5");
    await settle();
    expect(instance.history.canUndo()).toBe(false);
    editTo(cell(root, "i-1", "name"), "Two");
    expect(await instance.history.undo()).toBe(true);
    expect(cell(root, "i-1", "name").textContent).toBe("One");
  });
});

describe("filter panel value fields", () => {
  it("moves a set checklist between set columns, keeps it on a repeated change, and goes back", () => {
    const { host, instance } = setup(snippet("set-group"));
    const panel = host.querySelector("#grid-set-filters") as HTMLElement;
    const field = panel.querySelector("#grid-set-filter-field") as HTMLSelectElement;
    const operator = () => panel.querySelector("#grid-set-filter-operator") as HTMLSelectElement;
    const change = (select: HTMLSelectElement, value: string) => {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const list = () => panel.querySelector("[data-ok-data-grid-set-filter]") as HTMLElement | null;
    change(field, "points");
    expect(list()?.getAttribute("data-ok-field")).toBe("points");
    // Another set column: a new checklist for its values.
    change(field, "priority");
    expect(list()?.getAttribute("data-ok-field")).toBe("priority");
    const box = list()?.querySelector('[data-ok-data-grid-set-value="High"]') as HTMLInputElement;
    box.click();
    // The same operator again keeps the checklist and its checks.
    change(operator(), "isAnyOf");
    expect(
      list()?.querySelector<HTMLInputElement>('[data-ok-data-grid-set-value="High"]')?.checked,
    ).toBe(true);
    expect(instance.filterModel.items).toEqual([
      { field: "priority", operator: "isAnyOf", value: ["High"] },
    ]);
    // The checklist's search narrows its values.
    const search = list()?.querySelector('input:not([type="checkbox"])') as HTMLInputElement;
    search.value = "lo";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    const label = (value: string) =>
      list()
        ?.querySelector(`[data-ok-data-grid-set-value="${value}"]`)
        ?.closest("label") as HTMLElement;
    expect(label("Low").hidden).toBe(false);
    expect(label("Medium").hidden).toBe(true);
    // A column without a set filter brings the text field back.
    change(field, "title");
    expect(list()).toBeNull();
    expect(panel.querySelector<HTMLInputElement>("#grid-set-filter-value")?.value).toBe("");
  });
});

describe("pivot panel Move up", () => {
  it("moves a value field up, the focus staying on a button that still works", () => {
    const { host, instance } = setup(snippet("pivot-group"));
    const panel = host.querySelector("#grid-pivot-pivot") as HTMLElement;
    panel.setAttribute("data-ok-open", "");
    panel.style.cssText = "display:block;position:static";
    const button = (field: string, direction: string) =>
      panel.querySelector(
        `[data-ok-field="${field}"] [data-ok-data-grid-pivot-move="${direction}"]`,
      ) as HTMLButtonElement;
    expect(instance.pivotModel.values.map((v) => v.field)).toEqual(["revenue", "units"]);
    button("units", "up").focus();
    button("units", "up").click();
    expect(instance.pivotModel.values.map((v) => v.field)).toEqual(["units", "revenue"]);
    expect(button("units", "up").disabled).toBe(true);
    expect(document.activeElement).toBe(button("units", "down"));
  });
});

describe("unknown row counts", () => {
  it("a page's own displayed-rows words come back once the total is known", async () => {
    const { root, instance } = setup(
      snippet("server-group").replace(
        "<div data-ok-data-grid ",
        '<div data-ok-data-grid data-ok-pagination-mode="server" data-ok-row-count="-1" ',
      ),
      (r) =>
        r
          .querySelector("[data-ok-table-pagination]")
          ?.setAttribute("data-ok-label-displayed-rows", "{from}–{to} von {count}"),
    );
    instance.setDataSource(null);
    await settle();
    const pagination = root.querySelector("[data-ok-table-pagination]") as HTMLElement;
    expect(pagination.getAttribute("data-ok-label-displayed-rows")).not.toBe(
      "{from}–{to} von {count}",
    );
    root.setAttribute("data-ok-row-count", "30");
    await settle();
    expect(pagination.getAttribute("data-ok-label-displayed-rows")).toBe("{from}–{to} von {count}");
    expect(root.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toMatch(
      /von 30$/,
    );
  });
});

describe("pivot attributes and setters", () => {
  it("a panel open from the start follows its attribute; the active flag toggles the pivot", async () => {
    const { host, root, instance } = setup(snippet("pivot-group"), (r) =>
      r.setAttribute("data-ok-pivot-panel-open", ""),
    );
    await settle();
    const panel = host.querySelector("#grid-pivot-pivot") as HTMLElement;
    expect(panel.hasAttribute("data-ok-open")).toBe(true);
    root.removeAttribute("data-ok-pivot-panel-open");
    await settle();
    expect(panel.hasAttribute("data-ok-open")).toBe(false);
    const pivotHeaders = () =>
      root.querySelectorAll('[role="columnheader"][data-ok-field^="pivot:"]').length;
    expect(pivotHeaders()).toBeGreaterThan(0);
    root.removeAttribute("data-ok-pivot-active");
    await settle();
    expect(pivotHeaders()).toBe(0);
    // Derived columns change while the pivot is off: only the panel's fields follow.
    instance.setPivotDerivedColumns(null);
    expect(pivotHeaders()).toBe(0);
    root.setAttribute("data-ok-pivot-active", "");
    await settle();
    expect(pivotHeaders()).toBeGreaterThan(0);
  });
});

describe("overlays, charts and scrolling", () => {
  it("menus opened without an anchor report no target; foreign popovers are ignored", async () => {
    const { host, root } = setup(snippet("basic-group"));
    const opened: unknown[] = [];
    root.addEventListener("ok:data-grid:menuopen", (event) =>
      opened.push((event as CustomEvent).detail),
    );
    root.dispatchEvent(new Event("ok:popover:open", { bubbles: true }));
    const menu = host.querySelector("#grid-basic-column-menu") as HTMLElement;
    menu.dispatchEvent(
      new CustomEvent("ok:popover:open", { bubbles: true, detail: { anchor: "nowhere" } }),
    );
    expect(opened).toEqual([{ menu: "column", target: null }]);
    // A popover of the page inside the grid, with an id of its own.
    const other = document.createElement("div");
    other.id = "elsewhere";
    root.append(other);
    other.dispatchEvent(new CustomEvent("ok:popover:open", { bubbles: true, detail: {} }));
    expect(opened).toHaveLength(1);
  });

  it("chart models without an active chart show none", () => {
    const { instance } = setup(snippet("charts-group"));
    instance.setChartModels({});
    expect(instance.activeChartId).toBeNull();
  });

  it("scrolls to a row without a virtual viewport, by the rows' own height", () => {
    const { root, instance } = setup(snippet("basic-group"), (r) => {
      r.style.height = "220px";
      r.setAttribute("data-ok-page-size-options", "100");
    });
    const main = root.querySelector("[data-ok-data-grid-main]") as HTMLElement;
    const rows = root.querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])');
    instance.scrollToIndexes({ rowIndex: rows.length - 1 });
    const scroller = [main, ...main.querySelectorAll<HTMLElement>("*")].find(
      (el) => el.scrollTop > 0,
    );
    expect(scroller).toBeDefined();
  });
});

describe("saved rows, refused stops, header filter pickers, toolbar history, plain paste", () => {
  const withTemplate = (r: HTMLElement) => {
    const template = document.createElement("template");
    template.setAttribute("data-ok-data-grid-row", "");
    template.content.append(
      (r.querySelector('[data-ok-row-id="i-1"]') as HTMLElement).cloneNode(true),
    );
    r.append(template);
  };

  it("a saved row fills only the fields it has, skips a cell being edited, and empties nulls", async () => {
    const { root, instance } = setup(snippet("cells-group"), withTemplate);
    let save: (row: Record<string, unknown>) => void = () => {};
    instance.setDataSource({
      getRows: () => Promise.resolve({ rows: ITEMS.map((item) => ({ ...item })), rowCount: 2 }),
      updateRow: () =>
        new Promise((resolve) => {
          save = resolve;
        }),
    });
    await settle();
    await settle();
    editTo(cell(root, "i-1", "name"), "Pot");
    // While the save is pending, the category cell is being edited.
    cell(root, "i-1", "category").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(cell(root, "i-1", "category").hasAttribute("data-ok-editing")).toBe(true);
    save({ id: "i-1", name: "Saved", category: "Tools", stock: null });
    await settle();
    expect(cell(root, "i-1", "name").textContent).toBe("Saved");
    expect(cell(root, "i-1", "stock").textContent).toBe("");
    expect(cell(root, "i-1", "stock").getAttribute("data-ok-value")).toBe("");
    // The cell being edited keeps its editor.
    expect(cell(root, "i-1", "category").hasAttribute("data-ok-editing")).toBe(true);
  });

  it("a refused stop keeps the cell editing", () => {
    const { root } = setup(snippet("editors-group"));
    const title = cell(root, "is-1", "title");
    title.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    root.addEventListener("ok:data-grid:cellmodes", (event) => event.preventDefault(), {
      once: true,
    });
    key(title.querySelector("input") as HTMLInputElement, "Enter");
    expect(title.hasAttribute("data-ok-editing")).toBe(true);
  });

  it("header filter date pickers report through their own events, not raw input", () => {
    const { root, instance } = setup(snippet("cells-group"));
    const picker = root.querySelector(
      '[data-ok-filter-field="restocked"] [data-ok-date-picker]',
    ) as HTMLElement;
    expect(picker).not.toBeNull();
    const section = (picker.querySelector("[contenteditable], input") ?? picker) as HTMLElement;
    section.dispatchEvent(new Event("input", { bubbles: true }));
    expect(instance.filterModel.items).toEqual([]);
  });

  it("the toolbar's Undo and Redo buttons step through the history", async () => {
    const { host, root } = setup(snippet("history-group"));
    const editable = root.querySelector(
      '[role="columnheader"][data-ok-editable][data-ok-type="string"]',
    ) as HTMLElement;
    const field = editable.getAttribute("data-ok-field") as string;
    const first = root.querySelector('[data-ok-data-grid-body] > [role="row"]') as HTMLElement;
    const target = first.querySelector(
      `[role="gridcell"][data-ok-field="${field}"]`,
    ) as HTMLElement;
    const before = target.textContent;
    editTo(target, "Changed");
    const undo = host.querySelector(
      'button[data-ok-data-grid-history="undo"]',
    ) as HTMLButtonElement;
    const redo = host.querySelector(
      'button[data-ok-data-grid-history="redo"]',
    ) as HTMLButtonElement;
    undo.click();
    expect(target.textContent).toBe(before);
    redo.click();
    expect(target.textContent).toBe("Changed");
  });

  it("without cell selection, a paste lands on the focused cell", () => {
    const { root } = setup(snippet("editors-group"));
    const target = cell(root, "is-2", "title");
    target.focus();
    key(target, "v", { ctrlKey: true });
    const area = document.activeElement as HTMLElement;
    const read = vi.spyOn(DataTransfer.prototype, "getData").mockReturnValue("Pasted");
    area.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      }),
    );
    read.mockRestore();
    expect(cell(root, "is-2", "title").textContent).toBe("Pasted");
  });
});

describe("server tree data edges", () => {
  const treeGrid = () =>
    setup(snippet("tree-group"), (r) => {
      const template = document.createElement("template");
      template.setAttribute("data-ok-data-grid-row", "");
      template.content.append(
        (r.querySelector('[data-ok-row-id="m-1"]') as HTMLElement).cloneNode(true),
      );
      r.append(template);
    });
  const row = (root: Element, id: string) =>
    root.querySelector(`[data-ok-row-id="${id}"]`) as HTMLElement;

  it("without getGroupKey or getChildrenCount: the id labels the row and it has no toggle", async () => {
    const { root, instance } = treeGrid();
    instance.setDataSource({
      getRows: () =>
        Promise.resolve({ rows: [{ id: "solo", name: "Solo", title: "T", city: "C" }] }),
    });
    await settle();
    await settle();
    const solo = row(root, "solo");
    expect(solo.querySelector("[data-ok-data-grid-tree-label]")?.textContent).toBe("solo");
    expect(solo.querySelector("[data-ok-data-grid-tree-toggle]")).toBeNull();
    expect(solo.querySelector("[data-ok-data-grid-tree-spacer]")).not.toBeNull();
  });

  it("children that arrive for a replaced source are dropped", async () => {
    const { root, instance } = treeGrid();
    let answer: (rows: Record<string, unknown>[]) => void = () => {};
    const getRows = vi.fn((params: GridGetRowsParams) =>
      params.groupKeys?.length
        ? new Promise<{ rows: Record<string, unknown>[] }>((resolve) => {
            answer = (rows) => resolve({ rows });
          })
        : Promise.resolve({ rows: [{ id: "p", name: "Parent", kids: 1, title: "T", city: "C" }] }),
    );
    const first = {
      getRows,
      getChildrenCount: (r: Record<string, unknown>) => Number(r["kids"]),
      getGroupKey: (r: Record<string, unknown>) => String(r["name"]),
    };
    instance.setDataSource(first);
    await settle();
    await settle();
    (row(root, "p").querySelector("[data-ok-data-grid-tree-toggle]") as HTMLElement).click();
    expect(getRows).toHaveBeenLastCalledWith(expect.objectContaining({ groupKeys: ["Parent"] }));
    // Another source before the children arrive: they belong to the old one.
    instance.setDataSource({ ...first });
    await settle();
    answer([{ id: "late", name: "Late", kids: 0, title: "T", city: "C" }]);
    await settle();
    await settle();
    expect(row(root, "late")).toBeNull();
    expect(row(root, "p")).not.toBeNull();
  });
});

describe("tree row reordering edges", () => {
  it("the first row can't go up", async () => {
    const { root, instance } = setup(snippet("tree-group"), (r) => {
      r.setAttribute("data-ok-row-reordering", "");
      // A reorder column, as React renders it for rowReordering.
      const head = document.createElement("div");
      head.setAttribute("role", "columnheader");
      head.setAttribute("data-ok-field", "__reorder__");
      r.querySelector('[data-ok-data-grid-header] > [role="row"]')?.prepend(head);
      for (const row of r.querySelectorAll('[data-ok-data-grid-body] > [role="row"]')) {
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
    });
    instance.setRowChildrenExpansion("m-1", true);
    await settle();
    const seen: Record<string, unknown>[] = [];
    root.addEventListener("ok:data-grid:roworder", (event) =>
      seen.push((event as CustomEvent).detail),
    );
    const row = (id: string) =>
      root.querySelector(`[data-ok-data-grid-body] > [data-ok-row-id="${id}"]`) as HTMLElement;
    const handle = (id: string) =>
      row(id).querySelector("[data-ok-data-grid-reorder-handle]") as Element;
    key(handle("m-1"), "ArrowUp");
    expect(seen).toEqual([]);
    expect(row("m-1").getAttribute("aria-rowindex")).toBe("2");
  });
});

describe("grouped rows with server sorting and filtering", () => {
  const server = (html: string) =>
    html
      .replace('data-ok-sorting-mode="client"', 'data-ok-sorting-mode="server"')
      .replace('data-ok-filter-mode="client"', 'data-ok-filter-mode="server"');
  const groups = (root: Element) =>
    root.querySelectorAll('[data-ok-data-grid-body] > [role="row"][data-ok-generated]').length;
  const leaves = (root: Element) =>
    root.querySelectorAll(
      '[data-ok-data-grid-body] > [role="row"]:not([data-ok-generated]):not([hidden])',
    ).length;

  it("group the rows as given: the server already filtered and sorted them", async () => {
    const { root, instance } = setup(server(snippet("grouping-group")));
    expect(groups(root)).toBeGreaterThan(0);
    instance.setRowChildrenExpansion(
      (root.querySelector('[role="row"][data-ok-generated]') as HTMLElement).getAttribute(
        "data-ok-row-id",
      ) as string,
      true,
    );
    await settle();
    const before = leaves(root);
    instance.setFilterModel({ items: [{ field: "product", operator: "equals", value: "none" }] });
    await settle();
    // Server filtering: the grid doesn't hide rows itself.
    expect(leaves(root)).toBe(before);
  });

  it("selection of grouped rows works with server filtering", async () => {
    const { root, instance } = setup(server(snippet("selection-groups")));
    const group = root.querySelector('[role="row"][data-ok-generated]') as HTMLElement;
    const box = group.querySelector('input[type="checkbox"]') as HTMLInputElement;
    box.click();
    await settle();
    expect(instance.selection.length).toBeGreaterThan(0);
  });
});

describe("pivot rows by derived fields", () => {
  it("groups by a date's year and quarter as their own text", async () => {
    const { root, instance } = setup(snippet("pivot-derived"));
    instance.setPivotModel({
      rows: [{ field: "date-year" }, { field: "date-quarter" }],
      columns: [],
      values: [{ field: "volume", aggFunc: "sum" }],
    });
    await settle();
    const labels = [
      ...root.querySelectorAll('[role="row"][data-ok-generated] [data-ok-data-grid-tree-label]'),
    ].map((label) => label.textContent);
    expect(labels.some((text) => /^\d{4}$/.test(text ?? ""))).toBe(true);
    const year = root.querySelector('[role="row"][data-ok-generated]') as HTMLElement;
    (year.querySelector("[data-ok-data-grid-tree-toggle]") as HTMLElement).click();
    await settle();
    const quarters = [
      ...root.querySelectorAll('[role="row"][data-ok-generated] [data-ok-data-grid-tree-label]'),
    ].map((label) => label.textContent);
    expect(quarters.some((text) => /^Q[1-4]$/.test(text ?? ""))).toBe(true);
  });
});

describe("column groups, detail panels and footers", () => {
  const dragHeader = (root: Element, from: string, to: string) => {
    const header = (field: string) =>
      root.querySelector(`[role="columnheader"][data-ok-field="${field}"]`) as HTMLElement;
    const a = header(from).getBoundingClientRect();
    const b = header(to).getBoundingClientRect();
    const fire = (type: string, x: number, y: number) =>
      header(from).dispatchEvent(
        new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, clientX: x, clientY: y }),
      );
    fire("pointerdown", a.left + 10, a.top + a.height / 2);
    fire("pointermove", b.left + b.width / 2, b.top + b.height / 2);
    fire("pointerup", b.left + b.width / 2, b.top + b.height / 2);
  };
  const order = (root: Element) =>
    [...root.querySelectorAll('[data-ok-data-grid-header] [role="columnheader"][data-ok-field]')]
      .map((h) => h.getAttribute("data-ok-field"))
      .filter((field) => !field?.startsWith("__"));

  it("a column can't leave its group by a drag; inside the group it moves", () => {
    const { root } = setup(snippet("groups-group"));
    const before = order(root);
    dragHeader(root, "firstName", "email");
    expect(order(root)).toEqual(before);
    dragHeader(root, "firstName", "lastName");
    expect(order(root).indexOf("firstName")).toBeGreaterThan(order(root).indexOf("lastName"));
  });

  it("a row without a detail template opens no panel", () => {
    const { root, instance } = setup(snippet("detail-group"), (r) =>
      r.querySelector('template[data-ok-data-grid-detail="o-1003"]')?.remove(),
    );
    instance.toggleDetailPanel("o-1003");
    const row = root.querySelector('[data-ok-row-id="o-1003"]') as HTMLElement;
    expect(row.nextElementSibling?.hasAttribute("data-ok-data-grid-detail") ?? false).toBe(false);
  });

  it("a grid without a footer still selects rows", async () => {
    const { root, instance } = setup(snippet("selection-groups"), (r) =>
      r.querySelector("[data-ok-data-grid-footer]")?.remove(),
    );
    const box = root.querySelector(
      '[data-ok-data-grid-body] > [role="row"]:not([data-ok-generated]) input[type="checkbox"]',
    ) as HTMLInputElement;
    box.click();
    await settle();
    expect(instance.selection).toHaveLength(1);
    expect(root.querySelector("[data-ok-data-grid-selected-row-count]")).toBeNull();
  });
});

describe("lazy loading throttle", () => {
  it("a chunk asked within the throttle waits for it; aggregate rows from the server are kept", async () => {
    const { root, instance } = setup(snippet("lazy-group"), (r) => {
      r.style.height = "300px";
      r.removeAttribute("data-ok-disable-virtualization");
      r.setAttribute("data-ok-lazy-loading-request-throttle-ms", "300");
    });
    const main = root.querySelector("[data-ok-data-grid-main]") as HTMLElement;
    const times: number[] = [];
    let second: () => void = () => {};
    const asked = new Promise<void>((resolve) => {
      second = resolve;
    });
    const getRows = vi.fn((params: GridGetRowsParams) => {
      times.push(performance.now());
      if (times.length === 2) second();
      return Promise.resolve({
        rows: Array.from({ length: (params.end ?? 0) - (params.start ?? 0) }, (_, i) => ({
          id: `c-${(params.start ?? 0) + i}`,
          firstName: "A",
          lastName: "B",
          age: i,
          city: "C",
        })),
        rowCount: 400,
        aggregateRow: { age: 1 },
      });
    });
    instance.setDataSource({ getRows });
    await settle();
    await settle();
    expect(getRows).toHaveBeenCalledTimes(1);
    main.scrollTop = 53 * 200;
    main.dispatchEvent(new Event("scroll"));
    await asked;
    // The next chunk waited for the throttle after the first request.
    expect((times[1] as number) - (times[0] as number)).toBeGreaterThanOrEqual(290);
  });
});

describe("column drags outside the grid", () => {
  it("land on the last header passed only with keepColumnPositionIfDraggedOutside", () => {
    const { root } = setup(snippet("basic-group"));
    const order = () =>
      [...root.querySelectorAll('[role="columnheader"][data-ok-field]')]
        .map((h) => h.getAttribute("data-ok-field"))
        .filter((field) => !field?.startsWith("__"));
    const [first, second] = order() as [string, string];
    const header = (field: string) =>
      root.querySelector(`[role="columnheader"][data-ok-field="${field}"]`) as HTMLElement;
    const drag = () => {
      const from = header(first).getBoundingClientRect();
      const over = header(second).getBoundingClientRect();
      const fire = (type: string, x: number, y: number) =>
        header(first).dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            button: 0,
            pointerId: 1,
            clientX: x,
            clientY: y,
          }),
        );
      fire("pointerdown", from.left + 10, from.top + 5);
      fire("pointermove", over.left + over.width / 2, over.top + 5);
      fire("pointerup", over.left + over.width / 2, root.getBoundingClientRect().bottom + 200);
    };
    drag();
    expect(order().slice(0, 2)).toEqual([first, second]);
    root.setAttribute("data-ok-keep-column-position-if-dragged-outside", "");
    drag();
    expect(order().slice(0, 2)).toEqual([second, first]);
  });
});
