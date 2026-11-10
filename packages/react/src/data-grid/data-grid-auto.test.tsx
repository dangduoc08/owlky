import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { DataGrid } from "./data-grid.js";

const RELEASES = [
  { id: 1, name: "Beta", downloads: 860, stable: false, releaseDate: "2025-03-02" },
  { id: 2, name: "Alpha", downloads: 120, stable: true, releaseDate: "2025-01-15" },
  { id: 3, name: "Fixes", downloads: 2975, stable: null, releaseDate: null },
];
const headers = () =>
  [...document.querySelectorAll<HTMLElement>('[role="columnheader"][data-ok-field]')].map((h) => [
    h.getAttribute("data-ok-field"),
    h.getAttribute("data-ok-type"),
    h.querySelector("[data-ok-data-grid-header-title]")?.textContent,
  ]);
const column = (field: string) =>
  [
    ...document.querySelectorAll<HTMLElement>(
      `[data-ok-data-grid-body] [role="gridcell"][data-ok-field="${field}"]`,
    ),
  ].map((c) => c.textContent);

describe("DataGrid generated columns (autoGenerate)", () => {
  it("makes typed columns from the rows when columns are left out", async () => {
    render(<DataGrid aria-label="Releases" rows={RELEASES} showToolbar hideFooter />);
    expect(headers()).toEqual([
      ["id", "number", "ID"],
      ["name", "string", "Name"],
      ["downloads", "number", "Downloads"],
      ["stable", "boolean", "Stable"],
      ["releaseDate", "date", "Release date"],
    ]);
    const root = document.querySelector("[data-ok-data-grid]") as HTMLElement;
    expect(root.hasAttribute("data-ok-auto-generate")).toBe(true);
    const cell = document.querySelector('[data-ok-field="downloads"][role="gridcell"]');
    expect(cell?.getAttribute("data-ok-align")).toBe("right");
    expect(cell?.getAttribute("data-ok-value")).toBe("860");
    // Number columns sort as numbers.
    fireEvent.click(screen.getByRole("columnheader", { name: /^Downloads/ }));
    expect(column("downloads")).toEqual(["120", "860", "2975"]);
    expect(column("stable")).toEqual(["true", "false", ""]);
    await expectNoAxeViolations(document.body);
  });

  it("generates for empty columns with autoGenerate only, and follows the rows", () => {
    const { rerender } = render(
      <DataGrid aria-label="Releases" rows={RELEASES} columns={[]} hideFooter />,
    );
    expect(headers()).toEqual([]);
    rerender(
      <DataGrid aria-label="Releases" rows={RELEASES} columns={[]} autoGenerate hideFooter />,
    );
    expect(headers()).toHaveLength(5);
    rerender(
      <DataGrid
        aria-label="Releases"
        rows={RELEASES}
        columns={[{ field: "name", headerName: "Release" }]}
        autoGenerate
        hideFooter
      />,
    );
    expect(headers()).toEqual([["name", "string", "Release"]]);
    expect(document.querySelector("[data-ok-auto-generate]")).toBeNull();
    rerender(<DataGrid aria-label="Releases" rows={[{ id: "a", city: "Hue" }]} hideFooter />);
    expect(headers()).toEqual([
      ["id", "string", "ID"],
      ["city", "string", "City"],
    ]);
    rerender(<DataGrid aria-label="Releases" rows={[]} hideFooter />);
    expect(headers()).toEqual([]);
  });
});
