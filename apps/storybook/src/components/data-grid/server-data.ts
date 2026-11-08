import { filterGridRows, type GridDataSource, sortGridRows } from "@owlky/core";
import type { DataGridProps, GridColDef } from "@owlky/react";

const FIRST = ["Ana", "Bao", "Chloe", "Diego", "Elif", "Farid", "Grace", "Hugo", "Ines", "Jonas"];
const LAST = [
  "Silva",
  "Tran",
  "Martin",
  "Lopez",
  "Kaya",
  "Haddad",
  "Okafor",
  "Moreau",
  "Costa",
  "Berg",
];
const CITIES = ["Lisbon", "Hanoi", "Lyon", "Lima", "Izmir", "Beirut", "Lagos", "Nantes"];

// A type alias (not an interface) so rows fit `Record<string, unknown>` (HTML `setRows`).
export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  city: string;
};

/** Customers `from` to `to` (deterministic: the same data in React, HTML and every run). */
export const makeCustomers = (from: number, to: number): Customer[] =>
  Array.from({ length: Math.max(to - from, 0) }, (_, k) => {
    const i = from + k;
    return {
      id: `c-${i + 1}`,
      firstName: FIRST[(i * 7) % 10] as string,
      lastName: LAST[(i * 13 + 3) % 10] as string,
      age: 18 + ((i * 31) % 60),
      city: CITIES[(i * 11) % 8] as string,
    };
  });

export const CUSTOMER_COLUMNS: GridColDef<Customer>[] = [
  { field: "id", headerName: "ID", width: 100 },
  { field: "firstName", headerName: "First name", flex: 1, minWidth: 120 },
  { field: "lastName", headerName: "Last name", flex: 1, minWidth: 120 },
  { field: "age", headerName: "Age", type: "number", width: 110 },
  { field: "city", headerName: "City", flex: 1, minWidth: 120 },
];

/** Props of the Large dataset grid (React demo, HTML snippet). */
export const LARGE_GRID: Omit<DataGridProps<Customer>, "rows"> = {
  id: "grid-large",
  "aria-label": "Customers, loaded while scrolling",
  className: "sb-grid",
  columns: CUSTOMER_COLUMNS,
  hideFooter: true,
};

/** Props of the Server side grid (React demo, HTML snippet). */
export const SERVER_GRID: Omit<DataGridProps<Customer>, "rows"> = {
  id: "grid-server",
  "aria-label": "Customers from the server",
  className: "sb-grid",
  columns: CUSTOMER_COLUMNS,
  showToolbar: true,
  pageSizeOptions: [10, 25, 50],
  initialState: { pagination: { paginationModel: { pageSize: 10 } } },
};

/** Rows added at each scroll end, and the most there are. */
export const LARGE_STEP = 200;
export const LARGE_TOTAL = 10_000;

/**
 * A pretend server with 1,000 customers: it sorts, filters and pages with the grid's own engine,
 * after `delay` ms.
 */
export function createCustomerSource(total = 1000, delay = 400): GridDataSource<Customer> {
  const all = makeCustomers(0, total);
  const value = (row: Customer, field: string) => row[field as keyof Customer];
  const text = (row: Customer, field: string) => String(row[field as keyof Customer]);
  return {
    getRows: (params) =>
      new Promise((resolve) => {
        setTimeout(() => {
          const filtered = filterGridRows(all, params.filterModel, CUSTOMER_COLUMNS, value, text);
          const sorted = sortGridRows(filtered, params.sortModel, CUSTOMER_COLUMNS, value);
          const { page, pageSize } = params.paginationModel ?? { page: 0, pageSize: sorted.length };
          resolve({
            rows: sorted.slice(page * pageSize, (page + 1) * pageSize),
            rowCount: sorted.length,
          });
        }, delay);
      }),
  };
}

/** Props of the Lazy loading grid (React demo, HTML snippet). */
export const LAZY_GRID: Omit<DataGridProps<Customer>, "rows"> = {
  id: "grid-lazy",
  "aria-label": "Customers, loaded as they scroll into view",
  className: "sb-grid",
  columns: CUSTOMER_COLUMNS,
  lazyLoading: true,
  hideFooter: true,
};

/** A pretend server of 10,000 customers that answers ranges of rows (lazy loading). */
export function createLazyCustomerSource(total = 10_000, delay = 300): GridDataSource<Customer> {
  return {
    getRows: (params) =>
      new Promise((resolve) => {
        setTimeout(() => {
          const start = params.start ?? 0;
          const end = Math.min(params.end ?? start + 50, total);
          resolve({ rows: makeCustomers(start, end), rowCount: total });
        }, delay);
      }),
  };
}
