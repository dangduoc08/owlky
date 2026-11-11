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
