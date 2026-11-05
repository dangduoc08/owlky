import {
  Pagination,
  Scrollbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@owlky/react";
import { useState } from "react";
import data from "./table-data.json" with { type: "json" };

const ROWS_PER_PAGE = 5;

export function PaginationDemo() {
  const [page, setPage] = useState(1);
  const rows = data.desserts.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  return (
    <>
      <TableContainer>
        <Scrollbar aria-label="Desserts">
          <Table id="desserts-paged">
            <TableHead>
              <TableRow>
                <TableCell>Dessert (100g serving)</TableCell>
                <TableCell align="right">Calories</TableCell>
                <TableCell align="right">Fat (g)</TableCell>
                <TableCell align="right">Carbs (g)</TableCell>
                <TableCell align="right">Protein (g)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">{row.calories}</TableCell>
                  <TableCell align="right">{row.fat}</TableCell>
                  <TableCell align="right">{row.carbs}</TableCell>
                  <TableCell align="right">{row.protein}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
      <Pagination
        count={Math.ceil(data.desserts.length / ROWS_PER_PAGE)}
        page={page}
        onChange={setPage}
      />
    </>
  );
}
