import { DataGrid } from "@owlky/react";
import { useState } from "react";
import {
  type Customer,
  LARGE_GRID,
  LARGE_STEP,
  LARGE_TOTAL,
  makeCustomers,
} from "./server-data.js";

/** Large dataset: 200 rows at first, 200 more each time the rows are scrolled to their end. */
export function LargeDemo() {
  const [rows, setRows] = useState<Customer[]>(() => makeCustomers(0, LARGE_STEP));
  const [loading, setLoading] = useState(false);
  return (
    <DataGrid
      {...LARGE_GRID}
      rows={rows}
      loading={loading}
      onRowsScrollEnd={() => {
        if (rows.length >= LARGE_TOTAL) return;
        setLoading(true);
        // Pretend to fetch the next rows.
        setTimeout(() => {
          setRows((current) => [
            ...current,
            ...makeCustomers(current.length, current.length + LARGE_STEP),
          ]);
          setLoading(false);
        }, 300);
      }}
    />
  );
}
