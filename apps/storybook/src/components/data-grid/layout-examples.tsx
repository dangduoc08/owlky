import { DataGrid, type GridColDef } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";

/** Budget lines: regions and teams repeat, so `rowSpanning` merges them; the total spans columns. */
export interface BudgetLine {
  id: string;
  region: string;
  team: string;
  item: string;
  amount: number;
}

export const BUDGET: BudgetLine[] = [
  { id: "b-1", region: "North", team: "Design", item: "Licenses", amount: 4200 },
  { id: "b-2", region: "North", team: "Design", item: "Travel", amount: 1800 },
  { id: "b-3", region: "North", team: "Engineering", item: "Servers", amount: 9600 },
  { id: "b-4", region: "North", team: "Engineering", item: "Training", amount: 2400 },
  { id: "b-5", region: "South", team: "Sales", item: "Events", amount: 7100 },
  { id: "b-6", region: "South", team: "Sales", item: "Travel", amount: 5300 },
  { id: "b-7", region: "South", team: "Support", item: "Tools", amount: 1500 },
  { id: "total", region: "Total", team: "", item: "", amount: 31900 },
];

const budgetColumns: GridColDef<BudgetLine>[] = [
  {
    field: "region",
    headerName: "Region",
    width: 140,
    // The total row's label spans the region, team and item columns.
    colSpan: ({ row }) => (row.id === "total" ? 3 : 1),
  },
  { field: "team", headerName: "Team", width: 160 },
  { field: "item", headerName: "Item", flex: 1, minWidth: 140 },
  {
    field: "amount",
    headerName: "Amount",
    type: "number",
    width: 140,
    valueFormatter: (value) => `USD ${Number(value).toLocaleString("en-US")}`,
  },
];

/** Tasks: long notes make rows grow (`"auto"`); done tasks can't be selected. */
export interface Task {
  id: string;
  title: string;
  owner: string;
  status: "To do" | "In progress" | "Done";
  notes: string;
}

export const TASKS: Task[] = [
  {
    id: "t-1",
    title: "Plan the launch",
    owner: "Ana Silva",
    status: "In progress",
    notes: "Draft the timeline, then share it with the sales and support teams for comments.",
  },
  {
    id: "t-2",
    title: "Fix the sign-up form",
    owner: "Bao Tran",
    status: "Done",
    notes: "Shipped.",
  },
  {
    id: "t-3",
    title: "Write the guide",
    owner: "Chloe Martin",
    status: "To do",
    notes:
      "Cover installation, the first steps and the most common questions. Keep each page short and add screenshots where they help.",
  },
  { id: "t-4", title: "Review the budget", owner: "Diego Lopez", status: "To do", notes: "—" },
  {
    id: "t-5",
    title: "Prepare the demo",
    owner: "Elif Kaya",
    status: "In progress",
    notes: "Use the new data set and rehearse twice before Friday.",
  },
];

const taskColumns: GridColDef<Task>[] = [
  {
    field: "title",
    headerName: "Task",
    width: 160,
    description: "What has to be done",
  },
  { field: "owner", headerName: "Owner", width: 140 },
  {
    field: "status",
    headerName: "Status",
    width: 130,
    description: "Done tasks can't be selected",
  },
  { field: "notes", headerName: "Notes", flex: 1, minWidth: 200, resizable: false },
];

/** Products: edits are checked (a name, a price above 0); archived stock can't be edited. */
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export const PRODUCTS: Product[] = [
  { id: "p-1", name: "Café table", category: "Furniture", price: 129, stock: 12 },
  { id: "p-2", name: "Crème lamp", category: "Lighting", price: 49.5, stock: 40 },
  { id: "p-3", name: "Garden chair", category: "Garden", price: 35, stock: 0 },
  { id: "p-4", name: "Hand trowel", category: "Tools", price: 12.9, stock: 88 },
  { id: "p-5", name: "Rattan basket", category: "Archived", price: 22, stock: 3 },
  { id: "p-6", name: "Façade light", category: "Lighting", price: 79, stock: 15 },
];

const CATEGORIES = ["Furniture", "Lighting", "Garden", "Tools", "Archived"];

const productColumns: GridColDef<Product>[] = [
  {
    field: "name",
    headerName: "Product",
    width: 180,
    editable: true,
    preProcessEditCellProps: ({ props }) => ({
      error: String(props.value ?? "").trim() === "" ? "Enter a name" : undefined,
    }),
  },
  {
    field: "category",
    headerName: "Category",
    type: "singleSelect",
    valueOptions: CATEGORIES,
    width: 150,
    editable: true,
  },
  {
    field: "price",
    headerName: "Price",
    type: "number",
    width: 130,
    editable: true,
    valueFormatter: (value) => `USD ${Number(value).toFixed(2)}`,
    preProcessEditCellProps: ({ props }) => ({
      error: Number(props.value) > 0 ? undefined : "Enter a price above 0",
    }),
  },
  { field: "stock", headerName: "Stock", type: "number", width: 110, editable: true },
];

export const layoutGroups: ReactGroup[] = [
  {
    title: "Spanning cells",
    content: (
      <DataGrid
        id="grid-spans"
        className="sb-grid-wide"
        aria-label="Budget"
        rows={BUDGET}
        columns={budgetColumns}
        rowSpanning
        disableColumnSorting
        hideFooter
      />
    ),
  },
  {
    title: "Row height and selection",
    content: (
      <DataGrid
        id="grid-tasks"
        className="sb-grid-wide"
        aria-label="Tasks"
        rows={TASKS}
        columns={taskColumns}
        checkboxSelection
        disableMultipleRowSelection
        isRowSelectable={({ row }) => row.status !== "Done"}
        getRowHeight={({ model }) => (model.notes.length > 40 ? "auto" : null)}
        autosizeOnMount
        hideFooter
      />
    ),
  },
];

export const validationGroups: ReactGroup[] = [
  {
    title: "Editing and validation",
    content: (
      <DataGrid
        id="grid-products"
        className="sb-grid-wide"
        aria-label="Products"
        rows={PRODUCTS}
        columns={productColumns}
        isCellEditable={({ row, field }) => !(field === "stock" && row.category === "Archived")}
        showToolbar
        ignoreDiacritics
        hideFooter
      />
    ),
  },
];
