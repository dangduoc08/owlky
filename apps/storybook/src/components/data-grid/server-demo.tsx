import { DataGrid } from "@owlky/react";
import { createCustomerSource, SERVER_GRID } from "./server-data.js";

// Created once: a new data source on every render would load again.
const source = createCustomerSource();

/** Server side: the data source sorts, filters and pages 1,000 rows, after a short delay. */
export function ServerDemo() {
  return <DataGrid {...SERVER_GRID} rows={[]} dataSource={source} />;
}
