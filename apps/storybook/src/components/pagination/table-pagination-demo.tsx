import { TablePagination } from "@owlky/react";
import { useState } from "react";

/** The reference's "Table" section: the table pagination on its own (server-side count). */
export function TablePaginationDemo() {
  const [page, setPage] = useState(2);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  return (
    <TablePagination
      count={100}
      page={page}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[5, 10, 25]}
      onPageChange={setPage}
      onRowsPerPageChange={(next) => {
        setRowsPerPage(next);
        setPage(0);
      }}
      selectProps={{ native: false }}
    />
  );
}
