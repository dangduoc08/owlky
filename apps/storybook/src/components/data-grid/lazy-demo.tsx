import { DataGrid } from "@owlky/react";
import { createLazyCustomerSource, LAZY_GRID } from "./server-data.js";

// One source for the page: the grid asks it for the rows that scroll into view.
const source = createLazyCustomerSource();

export function LazyDemo() {
  return <DataGrid {...LAZY_GRID} rows={[]} dataSource={source} />;
}
