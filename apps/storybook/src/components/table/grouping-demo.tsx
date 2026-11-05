import {
  Scrollbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@owlky/react";
import { useState } from "react";
import data from "./table-data.json" with { type: "json" };

const number = new Intl.NumberFormat("en-US");

export function GroupingDemo() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rows = data.countries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  return (
    <>
      {/* The container's max-height (your CSS) makes the sticky header useful. */}
      <TableContainer>
        <Scrollbar aria-label="Countries">
          <Table id="countries" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell align="center" colSpan={2}>
                  Country
                </TableCell>
                <TableCell align="center" colSpan={3}>
                  Details
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>ISO Code</TableCell>
                <TableCell align="right">Population</TableCell>
                <TableCell align="right">Size (km²)</TableCell>
                <TableCell align="right">Density</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.code} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.code}</TableCell>
                  <TableCell align="right">{number.format(row.population)}</TableCell>
                  <TableCell align="right">{number.format(row.size)}</TableCell>
                  <TableCell align="right">{(row.population / row.size).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
      <TablePagination
        count={data.countries.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 25, 100]}
        onPageChange={setPage}
        onRowsPerPageChange={(next) => {
          setRowsPerPage(next);
          setPage(0);
        }}
      />
    </>
  );
}
