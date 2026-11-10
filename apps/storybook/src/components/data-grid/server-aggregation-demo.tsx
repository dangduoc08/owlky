import { DataGrid } from "@owlky/react";
import { createCustomerSource, SERVER_AGGREGATION_GRID } from "./server-data.js";

// Created once: a new data source on every render would load again.
const source = createCustomerSource();

/** Server-side aggregation: the data source answers the footer's values (`aggregateRow`) too. */
export function ServerAggregationDemo() {
  return <DataGrid {...SERVER_AGGREGATION_GRID} rows={[]} dataSource={source} />;
}
