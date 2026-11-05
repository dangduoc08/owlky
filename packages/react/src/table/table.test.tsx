import { render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Scrollbar } from "../scrollbar/scrollbar.js";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableDetailRow,
  TableExpandButton,
  TableFooter,
  TableHead,
  TablePagination,
  type TablePaginationProps,
  TableRow,
  TableSortLabel,
} from "./table.js";

function Example({ size }: { size?: "medium" | "small" }) {
  const [open, setOpen] = useState(false);
  return (
    <TableContainer aria-label="Desserts">
      <Table size={size} stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" aria-label="Details" />
            <TableCell sortDirection="asc">
              <TableSortLabel active direction="asc">
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel hideSortIcon>Calories</TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow hover selected>
            <TableCell padding="checkbox">
              <TableExpandButton
                expanded={open}
                controls="eclair-details"
                aria-label="Details of Eclair"
                onClick={() => setOpen(!open)}
              />
            </TableCell>
            <TableCell scope="row">Eclair</TableCell>
            <TableCell align="right" size="small">
              262
            </TableCell>
          </TableRow>
          <TableDetailRow id="eclair-details" open={open} colSpan={3}>
            Details
          </TableDetailRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}

describe("Table anatomy", () => {
  it("renders the parts with explicit defaults and the right cell elements", () => {
    render(<Example />);
    const table = screen.getByRole("table");
    expect(table.dataset).toMatchObject({
      okTable: "",
      okSize: "medium",
      okPadding: "normal",
      okStickyHeader: "",
      okRuntime: "off",
    });
    const region = screen.getByRole("region", { name: "Desserts" });
    expect(region.localName).toBe("section");
    expect(region.tabIndex).toBe(0);
    const [select, name, calories] = screen.getAllByRole("columnheader");
    expect(select?.dataset["okPadding"]).toBe("checkbox");
    expect(name?.getAttribute("scope")).toBe("col");
    expect(name?.getAttribute("aria-sort")).toBe("ascending");
    expect(calories?.dataset["okAlign"]).toBe("right");
    expect(calories?.hasAttribute("aria-sort")).toBe(false);
    const rowHeader = screen.getByRole("rowheader", { name: "Eclair" });
    expect(rowHeader.localName).toBe("th");
    expect(rowHeader.parentElement?.dataset).toMatchObject({ okHover: "", okSelected: "" });
    expect(screen.getByText("262").dataset).toMatchObject({ okAlign: "right", okSize: "small" });
    expect(screen.getByText("Total").localName).toBe("td");
    expect(screen.getByText("Total").closest("tfoot")).not.toBeNull();
  });

  it("sort labels: active, direction, hidden icon and a custom icon", () => {
    render(
      <>
        <Example />
        <TableSortLabel direction="desc" icon={<i data-testid="icon" />}>
          Custom
        </TableSortLabel>
      </>,
    );
    const name = screen.getByRole("button", { name: "Name" });
    expect(name.dataset).toMatchObject({ okTableSortLabel: "", okActive: "", okDirection: "asc" });
    expect(name.querySelector("[data-ok-table-sort-icon][aria-hidden='true'] svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Calories" }).dataset["okHideSortIcon"]).toBe("");
    expect(screen.getByTestId("icon").parentElement?.dataset["okTableSortIcon"]).toBe("");
    expect(screen.getByRole("button", { name: "Custom" }).dataset["okDirection"]).toBe("desc");
  });

  it("renders the same markup on the server and forwards refs", () => {
    const html = renderToString(<Example />);
    const server = document.createElement("div");
    server.innerHTML = html;
    const { container } = render(<Example />);
    expect(server.innerHTML).toBe(container.innerHTML);
    const refs = {
      table: { current: null as HTMLTableElement | null },
      row: { current: null as HTMLTableRowElement | null },
    };
    render(
      <Table ref={refs.table}>
        <TableBody>
          <TableRow ref={refs.row}>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(refs.table.current?.localName).toBe("table");
    expect(refs.row.current?.localName).toBe("tr");
  });
});

describe("Table behavior", () => {
  it("the expand button opens and closes its detail row; no axe violations", async () => {
    render(<Example size="small" />);
    const button = screen.getByRole("button", { name: "Details of Eclair" });
    const detail = document.getElementById("eclair-details") as HTMLTableRowElement;
    expect(button.dataset).toMatchObject({ okIconButton: "", okTableExpand: "eclair-details" });
    expect(button.getAttribute("aria-controls")).toBe("eclair-details");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(detail.hidden).toBe(true);
    expect(detail.dataset["okTableDetail"]).toBe("");
    expect(detail.querySelector("td")?.colSpan).toBe(3);
    await userEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(detail.hidden).toBe(false);
    await expectNoAxeViolations();
  });

  it("sort labels are buttons: click and keyboard", async () => {
    const onClick = vi.fn();
    render(<TableSortLabel onClick={onClick}>Name</TableSortLabel>);
    const button = screen.getByRole("button", { name: "Name" });
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});

function Pagination(props: Partial<TablePaginationProps>) {
  return <TablePagination count={12} page={0} rowsPerPage={5} onPageChange={() => {}} {...props} />;
}

describe("TablePagination", () => {
  it("renders the select, the displayed rows and named page buttons", () => {
    render(<Pagination rowsPerPageOptions={[5, 10, { label: "All", value: -1 }]} />);
    const root = screen.getByText("1–5 of 12").parentElement as HTMLElement;
    expect(root.dataset).toMatchObject({ okTablePagination: "", okRuntime: "off" });
    expect(screen.getByText("1–5 of 12").getAttribute("aria-live")).toBe("polite");
    const select = screen.getByRole("combobox", { name: "Rows per page:" }) as HTMLSelectElement;
    expect(select.value).toBe("5");
    expect([...select.options].map((o) => o.textContent)).toEqual(["5", "10", "All"]);
    const previous = screen.getByRole("button", { name: "Go to previous page" });
    expect(previous.dataset).toMatchObject({
      okIconButton: "",
      okTablePaginationAction: "previous",
    });
    expect(previous.title).toBe("Go to previous page");
    expect((previous as HTMLButtonElement).disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Go to next page" }) as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(screen.queryByRole("button", { name: "Go to first page" })).toBeNull();
  });

  it("reports page and rows-per-page changes (value first)", async () => {
    const onPageChange = vi.fn();
    const onRowsPerPageChange = vi.fn();
    render(
      <Pagination
        page={1}
        rowsPerPageOptions={[5, 10]}
        showFirstButton
        showLastButton
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />,
    );
    for (const name of ["first", "previous", "next", "last"])
      await userEvent.click(screen.getByRole("button", { name: `Go to ${name} page` }));
    expect(onPageChange.mock.calls).toEqual([[0], [0], [2], [2]]);
    await userEvent.selectOptions(screen.getByRole("combobox"), "10");
    expect(onRowsPerPageChange).toHaveBeenCalledWith(10);
  });

  it("last page, unknown count, all rows, one option, custom labels and disabled", () => {
    const { rerender } = render(<Pagination page={2} />);
    expect(
      (screen.getByRole("button", { name: "Go to next page" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByText("11–12 of 12")).not.toBeNull();
    rerender(<Pagination count={-1} page={1} showLastButton onPageChange={() => {}} />);
    expect(screen.getByText("6–10 of more than 10")).not.toBeNull();
    expect(
      (screen.getByRole("button", { name: "Go to next page" }) as HTMLButtonElement).disabled,
    ).toBe(false);
    rerender(<Pagination rowsPerPage={-1} rowsPerPageOptions={[5]} />);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("1–12 of 12")).not.toBeNull();
    rerender(
      <Pagination
        disabled
        labelRowsPerPage="Rows:"
        labelDisplayedRows={({ from, to }) => `${from}-${to}`}
        getItemAriaLabel={(type) => `${type} page`}
        rowsPerPageOptions={[5, 10]}
      />,
    );
    expect((screen.getByRole("combobox", { name: "Rows:" }) as HTMLSelectElement).disabled).toBe(
      true,
    );
    expect(screen.getByText("1-5")).not.toBeNull();
    const next = screen.getByRole("button", { name: "next page" }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it("has no axe violations next to a table", async () => {
    const { container } = render(
      <div>
        <Example />
        <Pagination rowsPerPageOptions={[5, 10]} />
      </div>,
    );
    expect(within(container).getAllByRole("button").length).toBeGreaterThan(3);
    await expectNoAxeViolations();
  });
});

describe("TableContainer with a Scrollbar", () => {
  it("the Scrollbar is the only scrolling, focusable region", () => {
    render(
      <TableContainer data-testid="container">
        <Scrollbar aria-label="Desserts">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Eclair</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>,
    );
    const container = screen.getByTestId("container");
    expect(container.hasAttribute("tabindex")).toBe(false);
    expect(getComputedStyle(container).overflow).toBe("visible");
    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Desserts" }).dataset["okScrollbar"]).toBe("");
  });
});
