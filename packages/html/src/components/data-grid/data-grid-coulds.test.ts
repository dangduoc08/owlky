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
