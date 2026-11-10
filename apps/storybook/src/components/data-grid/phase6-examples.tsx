import { DataGrid, type GridColDef } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";

/* Sales by region and product (story data, not from the reference). */
export interface Sale {
  id: string;
  region: string;
  product: string;
  year: number;
  units: number;
  revenue: number;
}

const REGIONS = ["North", "South", "East", "West"];
const PRODUCTS = ["Tea", "Coffee", "Juice"];

/** 24 sales, deterministic. */
export const SALES: Sale[] = Array.from({ length: 24 }, (_, i) => {
  const units = 10 + ((i * 37) % 90);
  return {
    id: `s-${String(i + 1).padStart(2, "0")}`,
    region: REGIONS[i % 4] as string,
    product: PRODUCTS[(i * 5) % 3] as string,
    year: 2024 + (i % 2),
    units,
    revenue: units * (4 + ((i * 3) % 5)),
  };
});

const salesColumns: GridColDef<Sale>[] = [
  { field: "region", headerName: "Region", width: 130 },
  { field: "product", headerName: "Product", width: 130 },
  { field: "year", headerName: "Year", type: "number", width: 100 },
  { field: "units", headerName: "Units", type: "number", width: 110 },
  { field: "revenue", headerName: "Revenue", type: "number", width: 130 },
];

/* The same columns, with units grouped into two bands instead of one group per value. */
const bandColumns: GridColDef<Sale>[] = salesColumns.map((column) =>
  column.field === "units"
    ? {
        ...column,
        groupingValueGetter: (value) =>
          Number(value) >= 50 ? "50 units or more" : "Under 50 units",
      }
    : column,
);

/* Tree data with missing parents: the grid generates the "Docs" and "Images" folders. */
export interface FileEntry {
  id: string;
  path: string[];
  size: number;
}

export const FILES: FileEntry[] = [
  { id: "f-1", path: ["Docs", "Guide.pdf"], size: 320 },
  { id: "f-2", path: ["Docs", "Notes.txt"], size: 12 },
  { id: "f-3", path: ["Images", "Logo.svg"], size: 8 },
  { id: "f-4", path: ["Images", "Photos", "Beach.jpg"], size: 2048 },
  { id: "f-5", path: ["Readme.md"], size: 4 },
];

const fileColumns: GridColDef<FileEntry>[] = [
  { field: "size", headerName: "Size (kB)", type: "number", width: 140 },
];

/* Inventory: editable cells for range selection and pasting, a date for header filters. */
export interface Item {
  id: string;
  name: string;
  category: string;
  stock: number;
  restocked: string;
  counted: string;
  active: boolean;
}

const NAMES = ["Kettle", "Mug", "Teapot", "Grinder", "Filter", "Scale", "Tray", "Spoon"];
export const ITEMS: Item[] = NAMES.map((name, i) => ({
  id: `i-${i + 1}`,
  name,
  category: ["Brewing", "Serving", "Tools"][i % 3] as string,
  stock: 5 + ((i * 13) % 40),
  restocked: `2025-05-${String(1 + ((i * 4) % 28)).padStart(2, "0")}`,
  counted: `2025-05-${String(2 + ((i * 3) % 27)).padStart(2, "0")}T${String(8 + ((i * 3) % 10)).padStart(2, "0")}:${String((i * 15) % 60).padStart(2, "0")}:00`,
  active: i % 3 !== 2,
}));

const itemColumns: GridColDef<Item>[] = [
  { field: "name", headerName: "Name", width: 140, editable: true },
  {
    field: "category",
    headerName: "Category",
    type: "singleSelect",
    valueOptions: ["Brewing", "Serving", "Tools"],
    width: 140,
    editable: true,
  },
  { field: "stock", headerName: "Stock", type: "number", width: 110, editable: true },
  { field: "restocked", headerName: "Restocked", type: "date", width: 210 },
  {
    field: "counted",
    headerName: "Last counted",
    type: "dateTime",
    width: 280,
    // "2025-05-02 08:00": the same text on the server and in every time zone.
    valueFormatter: (value) => String(value).replace("T", " ").slice(0, 16),
  },
  { field: "active", headerName: "Active", type: "boolean", width: 120 },
];

export const phase6Stories: Record<string, ReactGroup[]> = {
  grouping: [
    {
      title: "Row grouping and aggregation",
      content: (
        <DataGrid
          id="grid-grouping"
          aria-label="Sales by region"
          className="sb-grid-wide"
          rows={SALES}
          columns={salesColumns}
          showToolbar
          exportFileName="sales"
          initialState={{
            rowGrouping: { model: ["region"] },
            aggregation: { model: { units: "sum", revenue: "sum" } },
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          pageSizeOptions={[25, 50]}
        />
      ),
    },
    {
      title: "Multiple grouping columns",
      content: (
        <DataGrid
          id="grid-grouping-multiple"
          aria-label="Sales by region and product"
          className="sb-grid-wide"
          rows={SALES}
          columns={salesColumns}
          rowGroupingColumnMode="multiple"
          initialState={{
            rowGrouping: { model: ["region", "product"] },
            aggregation: { model: { revenue: "sum" } },
          }}
          hideFooter
        />
      ),
    },
    {
      title: "Grouping value getter",
      content: (
        <DataGrid
          id="grid-grouping-value"
          aria-label="Sales by units"
          className="sb-grid-wide"
          rows={SALES}
          columns={bandColumns}
          initialState={{
            rowGrouping: { model: ["units"] },
            aggregation: { model: { revenue: "sum" } },
          }}
          hideFooter
        />
      ),
    },
    {
      title: "Group footers",
      content: (
        <DataGrid
          id="grid-grouping-footers"
          aria-label="Sales by region, with a total per region"
          className="sb-grid-wide"
          rows={SALES}
          columns={salesColumns}
          initialState={{
            rowGrouping: { model: ["region"] },
            aggregation: { model: { units: "sum", revenue: "sum" } },
          }}
          defaultGroupingExpansionDepth={1}
          getAggregationPosition={(group) => (group.isRoot ? null : "footer")}
          hideFooter
        />
      ),
    },
    {
      title: "Generated parents",
      content: (
        <DataGrid
          id="grid-files"
          aria-label="Files"
          className="sb-grid"
          rows={FILES}
          columns={fileColumns}
          treeData
          getTreeDataPath={(row) => row.path}
          defaultGroupingExpansionDepth={-1}
          groupingColDef={{ headerName: "File", width: 240 }}
          hideFooter
        />
      ),
    },
  ],
  pivot: [
    {
      title: "Pivoting",
      content: (
        <DataGrid
          id="grid-pivot"
          aria-label="Revenue by region and year"
          className="sb-grid-wide"
          rows={SALES}
          columns={salesColumns}
          showToolbar
          exportFileName="sales"
          initialState={{
            pivoting: {
              active: true,
              model: {
                rows: [{ field: "region" }],
                columns: [{ field: "year" }],
                values: [
                  { field: "revenue", aggFunc: "sum" },
                  { field: "units", aggFunc: "avg" },
                ],
              },
            },
          }}
          hideFooter
        />
      ),
    },
  ],
  cells: [
    {
      title: "Cell selection, clipboard and header filters",
      content: (
        <DataGrid
          id="grid-cells"
          aria-label="Inventory"
          className="sb-grid-wide"
          rows={ITEMS}
          columns={itemColumns}
          cellSelection
          headerFilters
          showToolbar
          exportFileName="inventory"
          hideFooter
        />
      ),
    },
  ],
  charts: [
    {
      title: "Charts integration",
      content: (
        <DataGrid
          id="grid-charts"
          aria-label="Sales"
          className="sb-grid-wide"
          rows={SALES}
          columns={salesColumns}
          showToolbar
          chartsIntegration
          initialState={{
            rowGrouping: { model: ["product"] },
            aggregation: { model: { revenue: "sum" } },
            chartsIntegration: { model: { type: "column", values: ["revenue"] } },
          }}
          hideFooter
        />
      ),
    },
    {
      title: "Pivot chart",
      content: (
        <DataGrid
          id="grid-charts-pivot"
          aria-label="Revenue by region and product"
          className="sb-grid-wide"
          rows={SALES}
          columns={salesColumns}
          showToolbar
          chartsIntegration
          initialState={{
            pivoting: {
              active: true,
              model: {
                rows: [{ field: "region" }],
                columns: [{ field: "product" }],
                values: [{ field: "revenue", aggFunc: "sum" }],
              },
            },
            chartsIntegration: {
              model: { type: "column", values: ["revenue"], stacked: true, legend: "bottom" },
            },
          }}
          hideFooter
        />
      ),
    },
    {
      title: "Donut chart",
      content: (
        <DataGrid
          id="grid-charts-donut"
          aria-label="Units by product"
          className="sb-grid-wide"
          rows={SALES}
          columns={salesColumns}
          showToolbar
          chartsIntegration
          initialState={{
            rowGrouping: { model: ["product"] },
            aggregation: { model: { units: "sum" } },
            chartsIntegration: {
              model: { type: "donut", values: ["units"], itemLabel: "value", legend: "right" },
            },
          }}
          hideFooter
        />
      ),
    },
  ],
};

export const PHASE6_FILES = {
  grouping: [
    ["Row grouping and aggregation", "group"],
    ["Multiple grouping columns", "multiple"],
    ["Grouping value getter", "value"],
    ["Group footers", "footers"],
    ["Generated parents", "tree"],
  ],
  pivot: [["Pivoting", "group"]],
  cells: [["Cell selection, clipboard and header filters", "group"]],
  charts: [
    ["Charts integration", "group"],
    ["Pivot chart", "pivot"],
    ["Donut chart", "donut"],
  ],
} as const;
