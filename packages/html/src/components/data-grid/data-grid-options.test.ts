import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { DataGridInstance } from "./data-grid.js";

// Roadmap batch E (Data grid shoulds): footer and toolbar, layout, column options, selection
// options and the set filter.

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

const setup = (html: string) => {
  const host = mount(html);
  runtime = createRuntime()
    .register(...components)
    .start();
  const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
  const instance = runtime.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
  return { host, root, instance };
};
const footer = (host: Element) => host.querySelector("[data-ok-data-grid-footer]") as HTMLElement;
const shown = (host: Element) =>
  host.querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])');

describe("data grid footer and toolbar", () => {
  it("shows every row and the row count without pagination; filters count 'n of total'", async () => {
    const { host, instance } = setup(snippet("footer-group"));
    expect(shown(host)).toHaveLength(6);
    const count = () => footer(host).querySelector("[data-ok-data-grid-row-count]")?.textContent;
    expect(count()).toBe("Total Rows: 6");
    instance.setFilterModel({ items: [{ field: "priority", operator: "equals", value: "High" }] });
    expect(count()).toBe("Total Rows: 2 of 6");
    expect(shown(host)).toHaveLength(2);
    await expectNoAxeViolations(host);
  });

  it("counts the selected rows first in the footer, as React renders it", async () => {
    const { host, root } = setup(snippet("footer-group"));
    const boxes = host.querySelectorAll<HTMLInputElement>(
      '[data-ok-data-grid-body] [data-ok-data-grid-checkbox] input[type="checkbox"]',
    );
    await userEvent.click(boxes[0] as HTMLInputElement);
    const first = footer(host).firstElementChild as HTMLElement;
    expect(first.hasAttribute("data-ok-data-grid-selected-row-count")).toBe(true);
    expect(first.textContent).toBe("1 row selected");
    await userEvent.click(boxes[1] as HTMLInputElement);
    expect(first.textContent).toBe("2 rows selected");
    root.setAttribute("data-ok-hide-footer-selected-row-count", "");
    await settle();
    expect(footer(host).querySelector("[data-ok-data-grid-selected-row-count]")).toBeNull();
    root.setAttribute("data-ok-hide-footer-row-count", "");
    await settle();
    expect(footer(host).querySelector("[data-ok-data-grid-row-count]")).toBeNull();
  });

  it("the hide-footer-pagination flag hides the pagination and shows every row", async () => {
    const { host, root } = setup(snippet("basic-group"));
    expect(shown(host)).toHaveLength(10);
    root.setAttribute("data-ok-hide-footer-pagination", "");
    await settle();
    expect(shown(host)).toHaveLength(20);
    expect((footer(host).querySelector("[data-ok-table-pagination]") as HTMLElement).hidden).toBe(
      true,
    );
    expect(footer(host).querySelector("[data-ok-data-grid-row-count]")?.textContent).toBe(
      "Total Rows: 20",
    );
    root.removeAttribute("data-ok-hide-footer-pagination");
    await settle();
    expect(shown(host)).toHaveLength(10);
    expect(footer(host).querySelector("[data-ok-data-grid-row-count]")).toBeNull();
  });

  it("Tab moves from header to header, then into the cells (tabNavigation all)", async () => {
    const { host } = setup(snippet("footer-group"));
    const title = host.querySelector<HTMLElement>(
      '[role="columnheader"][data-ok-field="title"]',
    ) as HTMLElement;
    title.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("data-ok-field")).toBe("priority");
    await userEvent.keyboard("{Tab}{Tab}");
    // The first body cell holds the row's checkbox.
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Select row");
    expect(host.querySelectorAll('[data-ok-data-grid-main] [tabindex="0"]')).toHaveLength(1);
  });
});
