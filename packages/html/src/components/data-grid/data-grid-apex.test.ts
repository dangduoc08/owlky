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
