import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { DataGrid, type GridColDef } from "./data-grid.js";

// Roadmap batch E (Data grid shoulds): footer and toolbar, layout, column options, selection
// options and the set filter.

interface Row {
  id: number;
  name: string;
  team: string;
  age: number;
}
const ROWS: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  team: ["Core", "Docs", "Design"][i % 3] as string,
  age: 20 + i,
}));
const COLUMNS: GridColDef<Row>[] = [
  { field: "name", headerName: "Name", width: 140 },
  { field: "team", headerName: "Team", width: 120 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

afterEach(() => vi.restoreAllMocks());

const grid = () => document.querySelector("[data-ok-data-grid-main]") as HTMLElement;
const footer = () => document.querySelector("[data-ok-data-grid-footer]") as HTMLElement;
const shownRows = () =>
  grid().querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])');

describe("DataGrid footer and toolbar", () => {
  it("label names the grid and shows in the toolbar", async () => {
    render(<DataGrid label="People" showToolbar rows={ROWS.slice(0, 3)} columns={COLUMNS} />);
    expect(grid().getAttribute("aria-label")).toBe("People");
    expect(document.querySelector("[data-ok-data-grid-toolbar-label]")?.textContent).toBe("People");
    await expectNoAxeViolations(document.body);
  });

  it("label wins over aria-label; no toolbar, no toolbar label", () => {
    render(<DataGrid label="People" aria-label="Other" rows={ROWS} columns={COLUMNS} />);
    expect(grid().getAttribute("aria-label")).toBe("People");
    expect(document.querySelector("[data-ok-data-grid-toolbar-label]")).toBeNull();
  });

  it("hideFooterPagination shows every row and the row count, filtered as 'n of total'", () => {
    const { rerender } = render(
      <DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} hideFooterPagination />,
    );
    expect(shownRows()).toHaveLength(12);
    expect(footer().querySelector("[data-ok-table-pagination]")).toBeNull();
    expect(footer().querySelector("[data-ok-data-grid-row-count]")?.textContent).toBe(
      "Total Rows: 12",
    );
    expect(
      document.querySelector("[data-ok-data-grid]")?.hasAttribute("data-ok-hide-footer-pagination"),
    ).toBe(true);
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        hideFooterPagination
        filterModel={{ items: [{ field: "team", operator: "equals", value: "Docs" }] }}
      />,
    );
    expect(footer().querySelector("[data-ok-data-grid-row-count]")?.textContent).toBe(
      "Total Rows: 4 of 12",
    );
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        hideFooterPagination
        hideFooterRowCount
      />,
    );
    expect(footer().querySelector("[data-ok-data-grid-row-count]")).toBeNull();
  });

  it("the row count only shows without pagination", () => {
    render(<DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} />);
    expect(footer().querySelector("[data-ok-data-grid-row-count]")).toBeNull();
    expect(shownRows()).toHaveLength(5);
  });

  it("counts the selected rows first in the footer; hideFooterSelectedRowCount hides it", async () => {
    const { rerender } = render(
      <DataGrid aria-label="People" rows={ROWS} columns={COLUMNS} checkboxSelection />,
    );
    expect(footer().querySelector("[data-ok-data-grid-selected-row-count]")).toBeNull();
    const boxes = screen.getAllByRole("checkbox", { name: "Select row" });
    await userEvent.click(boxes[0] as HTMLElement);
    const count = footer().firstElementChild as HTMLElement;
    expect(count.hasAttribute("data-ok-data-grid-selected-row-count")).toBe(true);
    expect(count.textContent).toBe("1 row selected");
    await userEvent.click(boxes[1] as HTMLElement);
    expect(count.textContent).toBe("2 rows selected");
    await expectNoAxeViolations(document.body);
    rerender(
      <DataGrid
        aria-label="People"
        rows={ROWS}
        columns={COLUMNS}
        checkboxSelection
        hideFooterSelectedRowCount
      />,
    );
    expect(footer().querySelector("[data-ok-data-grid-selected-row-count]")).toBeNull();
  });

  it("tabNavigation: Tab moves between cells, then leaves the grid", async () => {
    render(
      <>
        <DataGrid
          aria-label="People"
          rows={ROWS.slice(0, 2)}
          columns={COLUMNS}
          hideFooter
          tabNavigation="all"
        />
        <input aria-label="after" />
      </>,
    );
    expect(
      document.querySelector("[data-ok-data-grid]")?.getAttribute("data-ok-tab-navigation"),
    ).toBe("all");
    const first = grid().querySelector(
      '[role="columnheader"][data-ok-field="name"]',
    ) as HTMLElement;
    first.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("data-ok-field")).toBe("team");
    await userEvent.keyboard("{Tab}{Tab}");
    expect(document.activeElement?.textContent).toBe("Person 1");
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement?.getAttribute("data-ok-field")).toBe("age");
    // The grid keeps one tab stop.
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    const last = grid().querySelector(
      '[data-ok-data-grid-body] > [role="row"]:last-child [data-ok-field="age"]',
    ) as HTMLElement;
    last.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("after");
  });
});
