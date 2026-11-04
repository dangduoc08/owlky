import {
  compareCellValues,
  nextSortDirection,
  selectAllState,
  type TableSortDirection,
} from "@owlky/core";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from "@owlky/react";
import { useEffect, useRef, useState } from "react";
import data from "./table-data.json" with { type: "json" };

type Dessert = (typeof data.desserts)[number];

const COLUMNS: { id: keyof Dessert; label: string; numeric: boolean }[] = [
  { id: "name", label: "Dessert (100g serving)", numeric: false },
  { id: "calories", label: "Calories", numeric: true },
  { id: "fat", label: "Fat (g)", numeric: true },
  { id: "carbs", label: "Carbs (g)", numeric: true },
  { id: "protein", label: "Protein (g)", numeric: true },
];

/** Native checkbox (a Checkbox component will replace it); `indeterminate` is a DOM property. */
function SelectAll({
  selected,
  total,
  onChange,
}: {
  selected: number;
  total: number;
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const { checked, indeterminate } = selectAllState(selected, total);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      data-ok-table-select-all=""
      aria-label="Select all desserts"
      checked={checked}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
  );
}

export function SortingDemo() {
  const [order, setOrder] = useState<TableSortDirection>("asc");
  const [orderBy, setOrderBy] = useState<keyof Dessert>("calories");
  const [selected, setSelected] = useState<string[]>(["Eclair"]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const sign = order === "asc" ? 1 : -1;
  const sorted = [...data.desserts].sort(
    (a, b) => sign * compareCellValues(String(a[orderBy]), String(b[orderBy])),
  );
  const rows = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const sortBy = (id: keyof Dessert) => {
    setOrder(nextSortDirection(orderBy === id, order));
    setOrderBy(id);
  };
  const toggle = (name: string) =>
    setSelected((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name],
    );

  return (
    <>
      <TableContainer aria-label="Desserts">
        <Table id="desserts-sort">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <SelectAll
                  selected={selected.length}
                  total={data.desserts.length}
                  onChange={(checked) =>
                    setSelected(checked ? data.desserts.map((d) => d.name) : [])
                  }
                />
              </TableCell>
              {COLUMNS.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.numeric ? "right" : undefined}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : "asc"}
                    onClick={() => sortBy(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isSelected = selected.includes(row.name);
              return (
                <TableRow key={row.name} hover selected={isSelected}>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      data-ok-table-select=""
                      aria-label={`Select ${row.name}`}
                      checked={isSelected}
                      onChange={() => toggle(row.name)}
                    />
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">{row.calories}</TableCell>
                  <TableCell align="right">{row.fat}</TableCell>
                  <TableCell align="right">{row.carbs}</TableCell>
                  <TableCell align="right">{row.protein}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        count={data.desserts.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={setPage}
        onRowsPerPageChange={(next) => {
          setRowsPerPage(next);
          setPage(0);
        }}
      />
    </>
  );
}
