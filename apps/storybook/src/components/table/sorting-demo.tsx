import {
  compareCellValues,
  nextSortDirection,
  selectAllState,
  type TableSortDirection,
} from "@owlky/core";
import {
  Checkbox,
  FormControlLabel,
  Scrollbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from "@owlky/react";
import { useState } from "react";
import data from "./table-data.json" with { type: "json" };

type Dessert = (typeof data.desserts)[number];

const COLUMNS: { id: keyof Dessert; label: string; numeric: boolean }[] = [
  { id: "name", label: "Dessert (100g serving)", numeric: false },
  { id: "calories", label: "Calories", numeric: true },
  { id: "fat", label: "Fat (g)", numeric: true },
  { id: "carbs", label: "Carbs (g)", numeric: true },
  { id: "protein", label: "Protein (g)", numeric: true },
];

/** The header checkbox: checked, clear or mixed from the selected rows. */
function SelectAll({
  selected,
  total,
  onChange,
}: {
  selected: number;
  total: number;
  onChange: (checked: boolean) => void;
}) {
  const { checked, indeterminate } = selectAllState(selected, total);
  return (
    <Checkbox
      size="small"
      data-ok-table-select-all=""
      aria-label="Select all desserts"
      checked={checked}
      indeterminate={indeterminate}
      onChange={onChange}
    />
  );
}

export function SortingDemo() {
  const [order, setOrder] = useState<TableSortDirection>("asc");
  const [orderBy, setOrderBy] = useState<keyof Dessert>("calories");
  const [selected, setSelected] = useState<string[]>(["Eclair"]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dense, setDense] = useState(false);

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
      <TableContainer>
        <Scrollbar aria-label="Desserts">
          <Table id="desserts-sort" size={dense ? "small" : "medium"}>
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
                      <Checkbox
                        size="small"
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
        </Scrollbar>
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
      {/* HTML: the switch's input carries data-ok-table-dense="desserts-sort". */}
      <FormControlLabel control={<Switch checked={dense} onChange={setDense} />} label="Dense" />
    </>
  );
}
