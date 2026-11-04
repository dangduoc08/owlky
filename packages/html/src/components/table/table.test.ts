import { tablePaddings, tableSizes } from "@owlky/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import { type TableInstance, table } from "./table.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const label = (text: string, active = false) =>
  `<button type="button" data-ok-table-sort-label data-ok-direction="asc"${active ? " data-ok-active" : ""}>${text}<span data-ok-table-sort-icon aria-hidden="true"></span></button>`;

/** Name + number columns, a detail row under "Beta", a selection column. */
const TABLE = `
<table id="t" data-ok-table data-ok-size="medium" data-ok-padding="normal">
  <thead><tr>
    <th scope="col"><input type="checkbox" data-ok-table-select-all aria-label="All"></th>
    <th scope="col" aria-sort="ascending">${label("Name", true)}</th>
    <th scope="col">${label("Size")}</th>
    <th scope="col">Plain</th>
  </tr></thead>
  <tbody>
    <tr><td><input type="checkbox" data-ok-table-select aria-label="Alpha"></td><td>Alpha</td><td>1,000</td><td>x</td></tr>
    <tr><td><input type="checkbox" data-ok-table-select aria-label="Beta" checked></td><td>Beta</td><td data-ok-sort-value="5">five</td><td>
      <button type="button" data-ok-table-expand="beta-detail" aria-controls="beta-detail" aria-expanded="false" aria-label="More">+</button></td></tr>
    <tr data-ok-table-detail id="beta-detail" hidden><td colspan="4">Beta details</td></tr>
    <tr><td><input type="checkbox" data-ok-table-select aria-label="Gamma"></td><td>gamma</td><td>20</td><td>y</td></tr>
  </tbody>
</table>`;

const names = (host: Element) =>
  [...host.querySelectorAll("tbody > tr:not([data-ok-table-detail]) > td:nth-child(2)")].map(
    (cell) => cell.textContent,
  );
const header = (host: Element, text: string) =>
  [...host.querySelectorAll("th")].find((th) => th.textContent?.trim() === text) as HTMLElement;

describe("table snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(4));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const container of host.querySelectorAll("[data-ok-table-container]")) {
      expect(container.localName).toBe("section");
      expect(container.getAttribute("aria-label")).toBeTruthy();
      expect(container.getAttribute("tabindex")).toBe("0");
    }
    for (const element of host.querySelectorAll<HTMLElement>("[data-ok-table]")) {
      expect(element.localName).toBe("table");
      expect(tableSizes).toContain(element.dataset["okSize"]);
      expect(tablePaddings).toContain(element.dataset["okPadding"]);
      for (const th of element.querySelectorAll(":scope > thead > tr > th"))
        expect(th.getAttribute("scope")).toBe("col");
    }
    for (const sortLabel of host.querySelectorAll("[data-ok-table-sort-label]"))
      expect(sortLabel.closest("thead > tr:last-child > th")).not.toBeNull();
    for (const pagination of host.querySelectorAll("[data-ok-table-pagination]")) {
      const id = pagination.getAttribute("data-ok-table-pagination") as string;
      expect(host.querySelector(`table#${id}`)).not.toBeNull();
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations (with the runtime)", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("table runtime: sorting", () => {
  it("sorts numbers numerically (sort values win), flips, and moves detail rows along", async () => {
    const host = mount(TABLE);
    start();
    const sorts: unknown[] = [];
    host.addEventListener("ok:table:sort", (e) => sorts.push((e as CustomEvent).detail));
    const size = header(host, "Size").querySelector("button") as HTMLElement;
    await userEvent.click(size);
    expect(names(host)).toEqual(["Beta", "gamma", "Alpha"]);
    expect(header(host, "Size").getAttribute("aria-sort")).toBe("ascending");
    expect(header(host, "Name").hasAttribute("aria-sort")).toBe(false);
    expect(size.hasAttribute("data-ok-active")).toBe(true);
    expect(header(host, "Name").querySelector("button")?.hasAttribute("data-ok-active")).toBe(
      false,
    );
    // The detail row stays under its row.
    const rows = [...host.querySelectorAll("tbody > tr")];
    expect(rows[1]?.id).toBe("beta-detail");
    await userEvent.click(size);
    expect(names(host)).toEqual(["Alpha", "gamma", "Beta"]);
    expect(size.getAttribute("data-ok-direction")).toBe("desc");
    expect(header(host, "Size").getAttribute("aria-sort")).toBe("descending");
    await userEvent.click(header(host, "Name").querySelector("button") as HTMLElement);
    expect(names(host)).toEqual(["Alpha", "Beta", "gamma"]);
    expect(size.getAttribute("data-ok-direction")).toBe("asc");
    expect(sorts).toEqual([
      { column: 2, direction: "asc" },
      { column: 2, direction: "desc" },
      { column: 1, direction: "asc" },
    ]);
  });

  it("a prevented sort changes nothing; columns without a label can't sort", () => {
    const host = mount(TABLE);
    start();
    host.addEventListener("ok:table:sort", (e) => e.preventDefault());
    const instance = runtime?.get<TableInstance>(host.querySelector("table"), "table");
    expect(instance?.sort(2)).toBe(false);
    expect(names(host)).toEqual(["Alpha", "Beta", "gamma"]);
    expect(instance?.sort(3)).toBe(false);
    expect(instance?.sort(9)).toBe(false);
    expect(instance?.groups()).toHaveLength(3);
  });

  it("explicit direction, tables without a head, labels outside a header", () => {
    const host = mount(
      `${TABLE}<table data-ok-table id="bare"><tbody><tr><td>1</td></tr></tbody></table>${label("Loose")}`,
    );
    start();
    const instance = runtime?.get<TableInstance>(host.querySelector("table"), "table");
    expect(instance?.sort(1, "desc")).toBe(true);
    expect(names(host)).toEqual(["gamma", "Beta", "Alpha"]);
    expect(runtime?.get<TableInstance>(host.querySelector("#bare"), "table")?.sort(0)).toBe(false);
    (host.querySelector("table + table + button") as HTMLElement).click();
    expect(names(host)).toEqual(["gamma", "Beta", "Alpha"]);
  });
});

describe("table runtime: edge cases", () => {
  it("tables without an id, a tbody or a cell in every row still sort safely", () => {
    const host = mount(`
      <table data-ok-table><thead><tr><th scope="col">${label("A")}</th><th scope="col">${label("B")}</th></tr></thead>
        <tbody><tr><td>b</td><td>2</td></tr><tr><td>a</td></tr><tr><td>c</td><td>1</td></tr></tbody></table>
      <table data-ok-table id="headonly"><thead><tr><th scope="col">${label("C")}</th></tr></thead></table>`);
    start();
    const [first, headOnly] = host.querySelectorAll("table");
    const instance = runtime?.get<TableInstance>(first as Element, "table");
    expect(instance?.sort(1)).toBe(true);
    expect([...host.querySelectorAll("tbody td:first-child")].map((td) => td.textContent)).toEqual([
      "a",
      "c",
      "b",
    ]);
    expect(runtime?.get<TableInstance>(headOnly as Element, "table")?.sort(0)).toBe(true);
    expect(runtime?.get<TableInstance>(headOnly as Element, "table")?.groups()).toEqual([]);
  });
});

describe("table runtime: selection and expand", () => {
  it("syncs rows with checkboxes at start, on change and with select-all", async () => {
    const host = mount(TABLE);
    start();
    const all = host.querySelector("[data-ok-table-select-all]") as HTMLInputElement;
    const box = (name: string) => host.querySelector(`[aria-label="${name}"]`) as HTMLInputElement;
    expect(box("Beta").closest("tr")?.hasAttribute("data-ok-selected")).toBe(true);
    expect(all.indeterminate).toBe(true);
    const events: number[] = [];
    host.addEventListener("ok:table:select", (e) =>
      events.push((e as CustomEvent<{ rows: unknown[] }>).detail.rows.length),
    );
    await userEvent.click(box("Alpha"));
    await userEvent.click(box("Gamma"));
    expect(all.checked).toBe(true);
    expect(all.indeterminate).toBe(false);
    await userEvent.click(all);
    expect(host.querySelectorAll("tr[data-ok-selected]")).toHaveLength(0);
    await userEvent.click(all);
    expect(host.querySelectorAll("tr[data-ok-selected]")).toHaveLength(3);
    expect(events).toEqual([2, 3, 0, 3]);
  });

  it("ignores checkboxes outside a table and nested tables' own checkboxes", async () => {
    const host = mount(
      `<input type="checkbox" data-ok-table-select aria-label="Loose">${TABLE.replace(
        "Beta details",
        '<table data-ok-table><tbody><tr><td><input type="checkbox" data-ok-table-select aria-label="Inner"></td></tr></tbody></table>',
      )}`,
    );
    start();
    await userEvent.click(host.querySelector('[aria-label="Loose"]') as HTMLElement);
    const all = host.querySelector("[data-ok-table-select-all]") as HTMLInputElement;
    expect(all.indeterminate).toBe(true);
  });

  it("the expand button opens and closes the detail row; expand can be prevented", async () => {
    const host = mount(TABLE);
    start();
    const button = host.querySelector("[data-ok-table-expand]") as HTMLElement;
    const detail = host.querySelector("#beta-detail") as HTMLTableRowElement;
    const events: unknown[] = [];
    host.addEventListener("ok:table:expand", (e) =>
      events.push((e as CustomEvent).detail.expanded),
    );
    await userEvent.click(button);
    expect(detail.hidden).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    await userEvent.click(button);
    expect(detail.hidden).toBe(true);
    host.addEventListener("ok:table:expand", (e) => e.preventDefault(), { once: true });
    await userEvent.click(button);
    expect(detail.hidden).toBe(true);
    expect(events).toEqual([true, false, true]);
    const instance = runtime?.get<TableInstance>(host.querySelector("table"), "table");
    (button.closest("tr") as HTMLTableRowElement).hidden = true; // paged out
    expect(instance?.expand(detail, true)).toBe(true);
    expect(detail.hidden).toBe(true);
  });

  it("ignores expand buttons whose target is missing or not a row", async () => {
    const host = mount(
      TABLE.replace('data-ok-table-expand="beta-detail"', 'data-ok-table-expand="nope"') +
        '<button type="button" data-ok-table-expand="t" aria-label="Loose">x</button>',
    );
    start();
    const spy = vi.fn();
    host.addEventListener("ok:table:expand", spy);
    for (const button of host.querySelectorAll<HTMLElement>("[data-ok-table-expand]"))
      await userEvent.click(button);
    expect(spy).not.toHaveBeenCalled();
    expect(components).toContain(table);
  });
});
