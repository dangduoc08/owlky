import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { DataGridInstance } from "./data-grid.js";
import autoHtml from "./examples/auto-group.html?raw";

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
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
const headers = (host: Element) =>
  [...host.querySelectorAll<HTMLElement>('[role="columnheader"][data-ok-field]')].map((h) => [
    h.getAttribute("data-ok-field"),
    h.getAttribute("data-ok-type"),
    h.querySelector("[data-ok-data-grid-header-title]")?.textContent,
  ]);
const column = (host: Element, field: string) =>
  [
    ...host.querySelectorAll<HTMLElement>(
      `[data-ok-data-grid-body] > [role="row"]:not([hidden]) [role="gridcell"][data-ok-field="${field}"]`,
    ),
  ].map((c) => c.textContent);

describe("data grid generated columns (HTML)", () => {
  it("builds the columns, rows and panels from the data table", async () => {
    const { host, instance } = setup(autoHtml);
    expect(headers(host)).toEqual([
      ["id", "number", "ID"],
      ["name", "string", "Name"],
      ["downloads", "number", "Downloads"],
      ["stable", "boolean", "Stable"],
      ["releaseDate", "date", "Release date"],
    ]);
    expect(host.querySelector("table[data-ok-data-grid-data]")).toBeNull();
    expect(host.querySelector('[role="grid"]')?.getAttribute("aria-colcount")).toBe("5");
    expect(column(host, "name")).toEqual(["Alpha", "Beta", "First release", "Fixes"]);
    const cell = host.querySelector('[data-ok-row-id="2"] [data-ok-field="downloads"]');
    expect(cell?.getAttribute("data-ok-value")).toBe("860");
    expect(cell?.getAttribute("data-ok-align")).toBe("right");
    // The panels list the columns.
    const field = document.getElementById("grid-auto-filter-field") as HTMLSelectElement;
    expect([...field.options].map((o) => o.textContent)).toEqual([
      "ID",
      "Name",
      "Downloads",
      "Stable",
      "Release date",
    ]);
    const operator = document.getElementById("grid-auto-filter-operator") as HTMLSelectElement;
    expect(operator.options[0]?.value).toBe("=");
    expect(
      [...(document.getElementById("grid-auto-columns")?.querySelectorAll("input") ?? [])].map(
        (input) => input.getAttribute("data-ok-field"),
      ),
    ).toEqual(["id", "name", "downloads", "stable", "releaseDate"]);
    // The generated columns sort, hide and take new rows.
    (host.querySelector('[role="columnheader"][data-ok-field="downloads"]') as HTMLElement).click();
    expect(column(host, "downloads")).toEqual(["120", "860", "2975", "4210"]);
    instance.setColumnVisibilityModel({ stable: false });
    await settle();
    expect(
      host.querySelector('[role="columnheader"][data-ok-field="stable"]')?.hasAttribute("hidden"),
    ).toBe(true);
    instance.setRows([
      { id: 9, name: "Next", downloads: 1, stable: true, releaseDate: "2026-01-01" },
    ]);
    await settle();
    expect(column(host, "name")).toEqual(["Next"]);
    await expectNoAxeViolations(host);
  });

  it("takes header names from data-ok-field cells, and leaves markup columns alone", () => {
    const named = autoHtml
      .replace("<th>name</th>", '<th data-ok-field="name">Release</th>')
      .replace("<th>releaseDate</th>", '<th data-ok-field="releaseDate"></th>');
    const { host } = setup(named);
    expect(headers(host)[1]).toEqual(["name", "string", "Release"]);
    expect(headers(host)[4]).toEqual(["releaseDate", "date", "Release date"]);
    runtime?.stop();
    resetPage();
    // Without the option the table stays and no column is made.
    const plain = setup(autoHtml, (root) => root.removeAttribute("data-ok-auto-generate"));
    expect(headers(plain.host)).toEqual([]);
    expect(plain.host.querySelector("table[data-ok-data-grid-data]")).not.toBeNull();
  });

  it("makes ids from the rows' order without an id column, and checkbox cells", () => {
    const noId = autoHtml
      .replace("<th>id</th>", "")
      .replace(/<td>\d<\/td>\n(\s*<td>(?:Alpha|Beta|First release|Fixes))/g, "$1");
    const { host } = setup(noId, (root) => {
      root.setAttribute("data-ok-checkbox-selection", "");
      const header = document.createElement("div");
      header.setAttribute("role", "columnheader");
      header.setAttribute("data-ok-field", "__check__");
      header.setAttribute("data-ok-data-grid-checkbox", "");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.setAttribute("aria-label", "Select all rows");
      header.append(box);
      root.querySelector('[data-ok-data-grid-header] [role="row"]')?.append(header);
    });
    expect(
      [...host.querySelectorAll("[data-ok-data-grid-body] > [role=row]")].map((r) =>
        r.getAttribute("data-ok-row-id"),
      ),
    ).toEqual(["1", "2", "3", "4"]);
    const first = host.querySelector('[data-ok-row-id="1"] [data-ok-field="__check__"] input');
    expect(first?.getAttribute("aria-label")).toBe("Select row");
    expect(
      host
        .querySelector('[data-ok-row-id="1"] [data-ok-field="name"]')
        ?.getAttribute("aria-colindex"),
    ).toBe("2");
  });
});
