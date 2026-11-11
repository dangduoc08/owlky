import { dataGridOptions } from "@owlky/core";
import dataGridApi from "@owlky/docs-content/api/data-grid.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import autoGroup from "../../../../../packages/html/src/components/data-grid/examples/auto-group.html?raw";
import basicGroup from "../../../../../packages/html/src/components/data-grid/examples/basic-group.html?raw";
import cellsGroup from "../../../../../packages/html/src/components/data-grid/examples/cells-group.html?raw";
import cellsStatus from "../../../../../packages/html/src/components/data-grid/examples/cells-status.html?raw";
import chartsGroup from "../../../../../packages/html/src/components/data-grid/examples/charts-group.html?raw";
import chartsMultiple from "../../../../../packages/html/src/components/data-grid/examples/charts-multiple.html?raw";
import chartsRange from "../../../../../packages/html/src/components/data-grid/examples/charts-range.html?raw";
import columnsGroup from "../../../../../packages/html/src/components/data-grid/examples/columns-group.html?raw";
import contextGroup from "../../../../../packages/html/src/components/data-grid/examples/context-group.html?raw";
import dimensionsBorders from "../../../../../packages/html/src/components/data-grid/examples/dimensions-borders.html?raw";
import dimensionsPages from "../../../../../packages/html/src/components/data-grid/examples/dimensions-pages.html?raw";
import editorsGroup from "../../../../../packages/html/src/components/data-grid/examples/editors-group.html?raw";
import filtersGroup from "../../../../../packages/html/src/components/data-grid/examples/filters-group.html?raw";
import footerGroup from "../../../../../packages/html/src/components/data-grid/examples/footer-group.html?raw";
import groupingFooters from "../../../../../packages/html/src/components/data-grid/examples/grouping-footers.html?raw";
import groupingGroup from "../../../../../packages/html/src/components/data-grid/examples/grouping-group.html?raw";
import groupingMultiple from "../../../../../packages/html/src/components/data-grid/examples/grouping-multiple.html?raw";
import groupingValue from "../../../../../packages/html/src/components/data-grid/examples/grouping-value.html?raw";
import historyGroup from "../../../../../packages/html/src/components/data-grid/examples/history-group.html?raw";
import largeGroup from "../../../../../packages/html/src/components/data-grid/examples/large-group.html?raw";
import layoutTasks from "../../../../../packages/html/src/components/data-grid/examples/layout-tasks.html?raw";
import lazyGroup from "../../../../../packages/html/src/components/data-grid/examples/lazy-group.html?raw";
import modesGroup from "../../../../../packages/html/src/components/data-grid/examples/modes-group.html?raw";
import orderingGroup from "../../../../../packages/html/src/components/data-grid/examples/ordering-group.html?raw";
import pivotDerived from "../../../../../packages/html/src/components/data-grid/examples/pivot-derived.html?raw";
import pivotGroup from "../../../../../packages/html/src/components/data-grid/examples/pivot-group.html?raw";
import selectionGroups from "../../../../../packages/html/src/components/data-grid/examples/selection-groups.html?raw";
import selectionTree from "../../../../../packages/html/src/components/data-grid/examples/selection-tree.html?raw";
import serverAggregation from "../../../../../packages/html/src/components/data-grid/examples/server-aggregation-group.html?raw";
import serverGroup from "../../../../../packages/html/src/components/data-grid/examples/server-group.html?raw";
import setGroup from "../../../../../packages/html/src/components/data-grid/examples/set-group.html?raw";
import sortingGroup from "../../../../../packages/html/src/components/data-grid/examples/sorting-group.html?raw";
import validationGroup from "../../../../../packages/html/src/components/data-grid/examples/validation-group.html?raw";
import { CDN, GuideDocs, type GuideSection } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { snippetElement } from "../../helpers/snippet-markup.js";

/** An element of a grid snippet; the search field's placeholder reads "Search" here. */
const gridElement = (markup: string, match = "data-ok-data-grid ") =>
  snippetElement(markup, match).replaceAll('placeholder="Search…"', 'placeholder="Search"');

/**
 * The grid of a snippet with its first `rows` data rows (the markup stays complete: header,
 * toolbar, panels and templates), and extra root attributes.
 */
function gridOf(markup: string, { rows = 3, attrs = "" }: { rows?: number; attrs?: string } = {}) {
  const lines = gridElement(markup).split("\n");
  const out: string[] = [];
  let kept = 0;
  let skipUntil = "";
  for (const line of lines) {
    if (skipUntil) {
      if (line === skipUntil) skipUntil = "";
      continue;
    }
    const row = /^( *)<div role="row"[^>]*data-ok-row-id/.exec(line);
    if (row && !line.includes("</div>")) {
      kept++;
      if (kept > rows) {
        skipUntil = `${row[1]}</div>`;
        continue;
      }
    }
    out.push(line);
  }
  const grid = out.join("\n");
  return attrs ? grid.replace("<div data-ok-data-grid ", `<div data-ok-data-grid ${attrs} `) : grid;
}

export const dataGridSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A data grid shows rows of data in columns. People can sort a column, search and filter the rows, page through them, select rows with checkboxes, choose the columns and the row height, and download the rows as CSV. It follows the ARIA grid pattern: one Tab stop, and the arrow keys move between cells. Use the Table component instead for a static table without these features.",
    html: `<!-- Load once per page: the styles and the script -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<!-- The script sorts, filters and pages the rows it finds -->
${gridOf(basicGroup)}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const columns: GridColDef<Person>[] = [
  { field: "firstName", headerName: "First name", flex: 1 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

interface Person {
  id: number;
  firstName: string;
  age: number;
}

export function People({ rows }: { rows: Person[] }) {
  return <DataGrid aria-label="People" rows={rows} columns={columns} checkboxSelection showToolbar />;
}`,
  },
  {
    id: "columns",
    title: "Describe the columns",
    body: `Each column has a \`field\` and a \`headerName\`. Its \`type\` (\`string\`, \`number\`, \`date\`, \`dateTime\`, \`boolean\`, \`singleSelect\` or \`actions\`) decides how it sorts, which filter operators it offers and its alignment: numbers align right.
- **Width:** \`width\` in pixels (100 by default), or \`flex\` to share the free width, with \`minWidth\` as a floor.
- **Values:** \`valueGetter\` computes a value from the row, and \`valueFormatter\` turns it into the text that the cell shows, the search finds and the export writes.
- **Custom cells:** \`renderCell\` draws anything, such as an avatar or a rating. In HTML, write that markup in the cell, and put the raw value in \`data-ok-value\` so sorting and filtering use it.`,
    html: `<div role="gridcell" aria-colindex="5" data-ok-field="age" data-ok-align="right" data-ok-value="30" tabindex="-1">30</div>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const rows = [
  { id: 1, name: "Ana Lima", age: 34 },
  { id: 2, name: "Jonah Pereira", age: 41 },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "age", headerName: "Age", type: "number", valueFormatter: (value) => \`\${value} years\` },
];

export function People() {
  return <DataGrid aria-label="People" rows={rows} columns={columns} />;
}`,
  },
  {
    id: "toolbar",
    title: "Add a toolbar",
    body: "`showToolbar` adds a search field and buttons that open the column list, the filter panel, the row height menu and the export menu. Search matches every word you type in any column. Export downloads a CSV file or prints the grid as shown. Each feature can be turned off, for example with `disableColumnFilter`.",
    html: `${gridElement(basicGroup, "data-ok-data-grid-toolbar")}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const rows = [
  { id: 1, firstName: "Ana", lastName: "Lima", age: 34 },
  { id: 2, firstName: "Jonah", lastName: "Pereira", age: 17 },
  { id: 3, firstName: "Priya", lastName: "Raman", age: 65 },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "firstName", headerName: "First name", flex: 1 },
  { field: "lastName", headerName: "Last name", flex: 1 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

export function DataGridToolbar() {
  return (
    <DataGrid aria-label="People" rows={rows} columns={columns} showToolbar disableDensitySelector />
  );
}`,
  },
  {
    id: "state",
    title: "Control sorting, filtering, pages and selection",
    body: "Every state works controlled or uncontrolled, as in MUI X: `sortModel`, `filterModel`, `paginationModel`, `rowSelectionModel`, `columnVisibilityModel` and `density`, each with its `on…Change` callback, or `initialState` for the starting values. Shift + click on a header adds a column to the sort.",
    html: `<!-- HTML keeps the state in the page: listen to ok:data-grid:* events (see Events and methods). -->`,
    react: `import type { GridSortModel } from "@owlky/core";
import { DataGrid, type GridColDef } from "@owlky/react";
import { useState } from "react";

const rows = [
  { id: 1, firstName: "Ana", lastName: "Lima", age: 34 },
  { id: 2, firstName: "Jonah", lastName: "Pereira", age: 17 },
  { id: 3, firstName: "Priya", lastName: "Raman", age: 65 },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "firstName", headerName: "First name", flex: 1 },
  { field: "lastName", headerName: "Last name", flex: 1 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

export function People() {
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: "age", sort: "desc" }]);
  return (
    <DataGrid
      aria-label="People"
      rows={rows}
      columns={columns}
      sortModel={sortModel}
      onSortModelChange={setSortModel}
    />
  );
}`,
  },
  {
    id: "filters",
    title: "Combine filters",
    body: "**Add filter** in the filter panel adds another condition. From the second row, choose **And** (every condition must match, the default) or **Or** (any one is enough). The remove button deletes a condition. Set `disableMultipleColumnsFiltering` to keep a single condition.",
    html: `<!-- The filter panel's Add filter button copies the first row, with an And / Or field. -->`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const rows = [
  { id: 1, firstName: "Ana", lastName: "Lima", age: 34 },
  { id: 2, firstName: "Jonah", lastName: "Pereira", age: 17 },
  { id: 3, firstName: "Priya", lastName: "Raman", age: 65 },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "firstName", headerName: "First name", flex: 1 },
  { field: "lastName", headerName: "Last name", flex: 1 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

export function DataGridFilters() {
  return (
    <DataGrid
      aria-label="People"
      rows={rows}
      columns={columns}
      filterModel={{
        logicOperator: "or",
        items: [
          { field: "age", operator: "<", value: "20" },
          { field: "age", operator: ">", value: "60" },
        ],
      }}
    />
  );
}`,
  },
  {
    id: "layout",
    title: "Resize, move and pin columns",
    body: `- **Resize:** drag the end edge of a header, or press Alt + Left or Alt + Right on a focused header. A column never gets narrower than its \`minWidth\`. Set \`resizable: false\` on a column, or \`disableColumnResize\` on the grid, to turn it off.
- **Move:** drag a header onto another one, or choose **Move left** or **Move right** in the column menu. \`columnOrder\` and \`onColumnOrderChange\` control the order.
- **Pin:** choose **Pin to left** or **Pin to right** in the column menu. Pinned columns stay in view while the others scroll. Use \`pinnedColumns\` to pin columns from the start.`,
    html: `<!-- Pinned cells carry data-ok-pinned; the script keeps their offsets. -->
<div role="columnheader" data-ok-field="firstName" data-ok-pinned="left" tabindex="-1">
  <span data-ok-data-grid-header-title>First name</span>
</div>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const rows = [
  { id: 1, firstName: "Ana", lastName: "Lima", age: 34 },
  { id: 2, firstName: "Jonah", lastName: "Pereira", age: 17 },
  { id: 3, firstName: "Priya", lastName: "Raman", age: 65 },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "firstName", headerName: "First name", flex: 1 },
  { field: "lastName", headerName: "Last name", flex: 1 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

export function DataGridLayout() {
  return (
    <DataGrid
      aria-label="Employees"
      rows={rows}
      columns={columns}
      initialState={{ pinnedColumns: { left: ["firstName"], right: ["actions"] } }}
    />
  );
}`,
  },
  {
    id: "editing",
    title: "Edit cells and rows",
    body: 'Set `editable` on a column to let people change its cells: double-click a cell, or press Enter or F2. The field matches the column type: text, a number, a date, a list for `singleSelect` or a checkbox for `boolean`. Enter saves, Escape cancels, and leaving the cell saves. With `editMode="row"`, every editable cell of the row opens together. In React, `processRowUpdate` receives the new row: return it, or return a changed row. Throw or reject to refuse it. In HTML, listen to `ok:data-grid:edit` and call `preventDefault()` to refuse.',
    html: `<script>
  // Refuse ages above 120
  grid.addEventListener("ok:data-grid:edit", (event) => {
    if (event.detail.row.age > 120) event.preventDefault();
  });
</script>`,
    react: `import { DataGrid } from "@owlky/react";

const rows = [
  { id: 1, firstName: "Ana", lastName: "Lima", age: 34 },
  { id: 2, firstName: "Jonah", lastName: "Pereira", age: 17 },
  { id: 3, firstName: "Priya", lastName: "Raman", age: 65 },
];

// Your own save: send the row to your API and return what it stored
async function saveEmployee(row: (typeof rows)[number]) {
  const response = await fetch(\`/api/employees/\${row.id}\`, { method: "PUT", body: JSON.stringify(row) });
  return response.json();
}

export function DataGridEditing() {
  return (
    <DataGrid
      aria-label="Employees"
      rows={rows}
      columns={[{ field: "age", headerName: "Age", type: "number", editable: true }]}
      processRowUpdate={async (row) => saveEmployee(row)}
    />
  );
}`,
  },
  {
    id: "large",
    title: "Show large datasets",
    body: "The grid renders only the rows that are in view, plus a few above and below, so thousands of rows scroll smoothly. This works when the grid has a fixed height, such as `height: 520px` on the root: a grid that grows with its rows shows all of them. Set `disableVirtualization` to render every row of the page, for example before printing the page with the browser. To load more rows as people scroll, listen for the end of the rows. It's reported once for each number of rows, within `scrollEndThreshold` pixels (80 by default). Show `loading` while the next rows arrive.",
    html: `${gridElement(largeGroup, "data-ok-data-grid ").replace("<div data-ok-data-grid ", '<div data-ok-data-grid id="customers" style="height: 520px" ')}
<script type="module">
  const element = document.getElementById("customers");
  const grid = window.Owlky.get(element, "data-grid");
  // Your own loader: a page of rows from your API
  const fetchCustomers = async (start, count) =>
    (await fetch(\`/api/customers?start=\${start}&count=\${count}\`)).json();
  let rows = await fetchCustomers(0, 200);
  grid.setRows(rows);
  // Load 200 more rows at the end of the list
  element.addEventListener("ok:data-grid:scrollend", async () => {
    element.setAttribute("data-ok-loading", "");
    rows = [...rows, ...(await fetchCustomers(rows.length, 200))];
    grid.setRows(rows);
    element.removeAttribute("data-ok-loading");
  });
</script>`,
    react: `import { DataGrid } from "@owlky/react";
import { useEffect, useState } from "react";

interface Customer {
  id: number;
  name: string;
  city: string;
}

const columns = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "city", headerName: "City", flex: 1 },
];

// Your own loader: a page of rows from your API
async function fetchCustomers(start: number, count: number): Promise<Customer[]> {
  const response = await fetch(\`/api/customers?start=\${start}&count=\${count}\`);
  return response.json();
}

export function Customers() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const loadMore = async () => {
    setLoading(true);
    const more = await fetchCustomers(rows.length, 200);
    setRows((current) => [...current, ...more]);
    setLoading(false);
  };
  useEffect(() => {
    fetchCustomers(0, 200).then(setRows);
  }, []);
  return (
    <DataGrid
      aria-label="Customers"
      rows={rows}
      columns={columns}
      loading={loading}
      onRowsScrollEnd={loadMore}
      style={{ height: 520 }}
    />
  );
}`,
  },
  {
    id: "server",
    title: "Load rows from a server",
    body: 'A data source lets the server sort, filter and page the rows. The grid calls `getRows()` with the sort model, the filter model and the page, and shows the rows it returns. `rowCount` is the total number of rows on the server, for the pagination. Responses are kept in a cache, so going back to a page doesn\'t ask the server again. Pass `dataSourceCache={null}` to turn the cache off. While a request is pending, flat rows go away; pass `dataSourceKeepPreviousData` to keep them until the new rows arrive. Errors go to `onDataSourceError` in React and to `ok:data-grid:datasourceerror` in HTML. To handle the requests yourself, set `sortingMode`, `filterMode` and `paginationMode` to `"server"`, pass `rowCount`, and load the rows in the change callbacks. While data loads, `loadingVariant` picks a progress bar, a spinner or placeholder rows (`"skeleton"`).',
    html: `<script type="module">
  const element = document.getElementById("customers");
  const grid = window.Owlky.get(element, "data-grid");
  grid.setDataSource({
    // params: { sortModel, filterModel, paginationModel: { page, pageSize } }
    async getRows(params: object) {
      const response = await fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return response.json(); // { rows, rowCount }
    },
  });
</script>`,
    react: `import { DataGrid } from "@owlky/react";

const customers = {
  // params: { sortModel, filterModel, paginationModel: { page, pageSize } }
  async getRows(params: object) {
    const response = await fetch("/api/customers", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return response.json(); // { rows, rowCount }
  },
};

const columns = [{ field: "name", headerName: "Name", flex: 1 }];

export function Customers() {
  return <DataGrid aria-label="Customers" rows={[]} columns={columns} dataSource={customers} />;
}`,
  },
  {
    id: "server-aggregation",
    title: "Aggregate on the server",
    body: "With a data source, the server computes the aggregated values. When the grid aggregates, `getRows()` receives `aggregationModel` (field to function), and the response adds `aggregateRow`: the values of every row that passes the filters, for the footer row. For the rows of server-side grouping and tree data, `getAggregatedValue(row, field)` reads a parent row's value, and it also reads `aggregateRow`. By default the grid reads `row[field]`. A new aggregation asks the server again. In HTML, put the model in `data-ok-aggregation-model` and give the same data source to `setDataSource()`.",
    html: `${gridElement(serverAggregation)}
<script type="module">
  const grid = window.Owlky.get(document.getElementById("grid-server-aggregation"), "data-grid");
  grid.setDataSource({
    // params: { sortModel, filterModel, paginationModel, aggregationModel }
    async getRows(params) {
      const response = await fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return response.json(); // { rows, rowCount, aggregateRow }
    },
    getAggregatedValue: (row, field) => row[field],
  });
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

type Customer = { id: string; name: string; age: number };

const customers = {
  // params: { sortModel, filterModel, paginationModel, aggregationModel }
  async getRows(params: object) {
    const response = await fetch("/api/customers", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return response.json(); // { rows, rowCount, aggregateRow }
  },
  getAggregatedValue: (row: Record<string, unknown>, field: string) => row[field],
};

const columns: GridColDef<Customer>[] = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "age", headerName: "Age", type: "number" },
];
const noRows: Customer[] = [];

export function CustomersWithTotals() {
  return (
    <DataGrid
      aria-label="Customers, with their average age"
      rows={noRows}
      columns={columns}
      dataSource={customers}
      initialState={{ aggregation: { model: { age: "avg" } } }}
    />
  );
}`,
  },
  {
    id: "rows-from-data",
    title: "Build HTML rows from data",
    body: 'In HTML, the grid can build its rows from data instead of markup. Put one row inside `<template data-ok-data-grid-row>` in the grid: `setRows(rows)` copies it for each item, sets `data-ok-row-id` from `id`, and fills each cell with the value of its field as text. For cells with more than text, add `<template data-ok-data-grid-cell="<field>">`: its elements marked `data-ok-data-grid-value` receive the value. Values are always set as text, never as markup, so data from a server can\'t add scripts to the page.',
    html: `${gridElement(serverGroup, "data-ok-data-grid ").replace("<div data-ok-data-grid ", '<div data-ok-data-grid id="customers" ')}`,
  },
  {
    id: "selection",
    title: "Choose how rows are selected",
    body: "With `checkboxSelection`, people select rows with checkboxes, a click on the row, Space and Ctrl + A. To select a range, they click a row, then Shift + click another row or its checkbox: every row in between takes the clicked row's new state. On the keyboard, Shift + Space selects the focused row and Shift + Up or Shift + Down extends the selection to the next row, or shrinks it when that row is already selected. Ranges cover the rows that pass the filters, on every page, in the shown order. With `cellSelection`, Shift + arrows select cells instead. Set `disableMultipleRowSelection` to allow one row at a time: selecting a row clears the others, and the header has no **Select all** checkbox. To keep some rows from being selected, return `false` from `isRowSelectable` in React, or put `data-ok-selectable=\"false\"` on the row in HTML. Their checkbox is disabled. `checkboxSelectionVisibleOnly` makes **Select all** select the current page only. When rows go away, their ids leave the selection, unless you set `keepNonExistentRowsSelected`. Use it with server pagination, where the rows of other pages aren't loaded.",
    html: `${gridOf(layoutTasks, { attrs: "data-ok-disable-multiple-row-selection" })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const tasks = [
  { id: 1, title: "Write the brief", status: "Done" },
  { id: 2, title: "Review the design", status: "Open" },
];

const columns: GridColDef<(typeof tasks)[number]>[] = [
  { field: "title", headerName: "Task", flex: 1 },
  { field: "status", headerName: "Status" },
];

export function DataGridSelection() {
  return (
    <DataGrid
      aria-label="Tasks"
      rows={tasks}
      columns={columns}
      checkboxSelection
      disableMultipleRowSelection
      isRowSelectable={({ row }) => row.status !== "Done"}
    />
  );
}`,
  },
  {
    id: "spans",
    title: "Span cells and size rows",
    body: 'A cell can cover the next columns with `colSpan` on its column: a number, or a function of the cell, such as a total that spans three columns. With `rowSpanning`, neighbouring cells of a column with the same text merge into one tall cell. Rows are 52 pixels tall by default. Change it with `rowHeight`; the density still scales it. In React, `getRowHeight` sets the height of each row: a number, or `"auto"` to let long text wrap and the row grow. `getRowSpacing` adds space above and below rows. In HTML, put `data-ok-row-height` and `data-ok-spacing-top` / `data-ok-spacing-bottom` on the rows. Columns can fit their content: double-click the edge of a header, set `autosizeOnMount`, or call `autosizeColumns()`.',
    html: `<!-- A cell that spans the next two columns hides them -->
<div role="gridcell" aria-colindex="1" aria-colspan="3" data-ok-field="region">Total</div>
<div role="gridcell" aria-colindex="2" data-ok-field="team" hidden data-ok-covered></div>

<!-- Rows that grow with their text -->
<div role="row" data-ok-row-id="t-3" data-ok-row-height="auto">
  <div role="gridcell" aria-colindex="1" data-ok-field="task" tabindex="-1">Write the release notes, then send them to the team for review</div>
</div>`,
    react: `import { DataGrid } from "@owlky/react";

const lines = [
  { id: "a", region: "Europe", team: "Design", item: "Laptops", amount: 4000, notes: "Two laptops" },
  { id: "b", region: "Europe", team: "Design", item: "Licenses", amount: 1200, notes: "Yearly licenses for the design tools of the team" },
  { id: "total", region: "Total", team: "", item: "", amount: 5200, notes: "" },
];

export function DataGridSpans() {
  return (
    <DataGrid
      aria-label="Budget"
      rows={lines}
      columns={[
        { field: "region", headerName: "Region", colSpan: ({ row }) => (row.id === "total" ? 3 : 1) },
        { field: "team", headerName: "Team" },
        { field: "item", headerName: "Item" },
        { field: "amount", headerName: "Amount", type: "number" },
      ]}
      rowSpanning
      getRowHeight={({ model }) => (model.notes.length > 40 ? "auto" : null)}
    />
  );
}`,
  },
  {
    id: "api",
    title: "React to clicks and use the grid's methods",
    body: "React has `onRowClick`, `onRowDoubleClick`, `onCellClick`, `onCellDoubleClick`, `onCellKeyDown` and `onColumnHeaderClick`. In HTML, the same events fire on the grid as `ok:data-grid:rowclick`, `ok:data-grid:cellclick` and so on. The grid's methods are the same in both versions: pass a ref from `useGridApiRef()` as `apiRef` in React, or call `runtime.get(element, \"data-grid\")` in HTML. For example, `exportState()` returns the sort, filters, page, columns and density, and `restoreState()` applies them again. `restoreState()` checks what it receives, so a state from storage or a URL can't change anything else.",
    html: `<script type="module">
  const element = document.getElementById("people");
  const grid = window.Owlky.get(element, "data-grid");
  // Save the state as people change it, and restore it on the next visit
  grid.restoreState(JSON.parse(localStorage.getItem("people-grid") ?? "{}"));
  element.addEventListener("ok:data-grid:sort", () =>
    queueMicrotask(() => localStorage.setItem("people-grid", JSON.stringify(grid.exportState()))),
  );
</script>`,
    react: `import { Button, DataGrid, type GridColDef, useGridApiRef } from "@owlky/react";

const rows = [
  { id: 1, firstName: "Ana", lastName: "Lima", age: 34 },
  { id: 2, firstName: "Jonah", lastName: "Pereira", age: 17 },
  { id: 3, firstName: "Priya", lastName: "Raman", age: 65 },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "firstName", headerName: "First name", flex: 1 },
  { field: "lastName", headerName: "Last name", flex: 1 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

export function People() {
  const apiRef = useGridApiRef<(typeof rows)[number]>();
  return (
    <>
      <Button onClick={() => apiRef.current?.autosizeColumns()}>Fit columns</Button>
      <DataGrid aria-label="People" rows={rows} columns={columns} apiRef={apiRef} />
    </>
  );
}`,
  },
  {
    id: "state-persistence",
    title: "Save and restore the grid's state",
    body: "`exportState()` returns the grid's state as plain JSON: the sort, filters, page, columns, density, groups, aggregation, pivot and charts. It also holds the rows people work on. `rowSelection.model` lists the selected rows with checkbox selection, `detailPanel.expandedRowIds` the rows whose detail panel is open, `pinnedRows` the ids of the rows pinned to the `top` and the `bottom`, and `rowOrder.orderedIds` the order people gave the rows by moving them. `restoreState(state)` applies a saved state again. Pinned rows can come from the rows or the pinned rows, so restoring can pin a row of the body or put a pinned row back in it. To save the state as people change it, use `onStateChange` in React or the `ok:data-grid:statechange` event in HTML. Each one reports the new state once a change has settled: once per change, and only after a drag ends. Store the state where your app keeps settings, such as `localStorage`. `restoreState()` checks what it receives, so a state from storage or a URL can't change anything else.",
    html: `<script type="module">
  const element = document.getElementById("agenda");
  const grid = window.Owlky.get(element, "data-grid");
  // Restore the saved view, then save every settled change
  grid.restoreState(JSON.parse(localStorage.getItem("agenda-grid") ?? "{}"));
  element.addEventListener("ok:data-grid:statechange", (event) =>
    localStorage.setItem("agenda-grid", JSON.stringify(event.detail.state)),
  );
</script>`,
    react: `import { DataGrid, type GridColDef, type GridState } from "@owlky/react";

const rows = [
  { id: 1, title: "Welcome", speaker: "Ana Lima" },
  { id: 2, title: "Design systems", speaker: "Jonah Pereira" },
  { id: 3, title: "Accessible grids", speaker: "Priya Raman" },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "title", headerName: "Talk", flex: 1 },
  { field: "speaker", headerName: "Speaker", flex: 1 },
];

const saved: GridState = JSON.parse(localStorage.getItem("agenda-grid") ?? "{}");

export function Agenda() {
  return (
    <DataGrid
      aria-label="Agenda"
      rows={rows}
      columns={columns}
      checkboxSelection
      rowReordering
      initialState={saved}
      onStateChange={(state) => localStorage.setItem("agenda-grid", JSON.stringify(state))}
    />
  );
}`,
  },
  {
    id: "validation",
    title: "Check edited values",
    body: "Check a value while people type it, and keep the cell open until it's valid. In React, return `{ error }` from the column's `preProcessEditCellProps`: `true` marks the field as invalid, and a text also shows as a message under the cell. In HTML, listen to `ok:data-grid:validate` and set `event.detail.error`. Enter and leaving the cell keep it open while the value has an error. Escape cancels. `isCellEditable` in React, or `data-ok-editable=\"false\"` on a cell in HTML, makes single cells read-only. Typing a character on an editable cell starts editing with that character.",
    html: `<script type="module">
  const element = document.getElementById("products");
  element.addEventListener("ok:data-grid:validate", (event) => {
    const { field, value } = event.detail;
    if (field === "price" && !(Number(value) > 0)) event.detail.error = "Enter a price above 0";
  });
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const rows = [
  { id: 1, product: "Desk lamp", price: 49 },
  { id: 2, product: "Chair", price: 129 },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  {
    field: "price",
    headerName: "Price",
    type: "number",
    editable: true,
    preProcessEditCellProps: ({ props }) => ({
      error: Number(props.value) > 0 ? undefined : "Enter a price above 0",
    }),
  },
];

export function Prices() {
  return <DataGrid aria-label="Prices" rows={rows} columns={columns} />;
}`,
  },
  {
    id: "filter-options",
    title: "Tune filtering and search",
    body: 'The **is any of** operator keeps rows whose value is one of several values: type them separated by commas. A column\'s `filterOperators` replaces the operators of its type, for example with a range. Each operator returns a test for a value. In HTML, set them with `setFilterOperators(field, operators)`. Set `ignoreDiacritics` so that searches and filters ignore accents: "ha noi" finds "Hà Nội". `quickFilterLogicOperator="or"` keeps rows that match any word instead of every word. `quickFilterExcludeHiddenColumns` leaves hidden columns out of the search. To leave one column out, set its `getApplyQuickFilterFn` to `null` in React, or `data-ok-searchable="false"` on its header in HTML.',
    html: `${gridOf(validationGroup, { attrs: 'data-ok-ignore-diacritics data-ok-quick-filter-logic-operator="or"' })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const places = [
  { id: 1, city: "São Paulo", country: "Brazil" },
  { id: 2, city: "Zürich", country: "Switzerland" },
];

const columns: GridColDef<(typeof places)[number]>[] = [
  { field: "city", headerName: "City", flex: 1 },
  { field: "country", headerName: "Country", flex: 1 },
];

export function DataGridFilterOptions() {
  return (
    <DataGrid
      aria-label="Places"
      rows={places}
      columns={columns}
      ignoreDiacritics
      quickFilterLogicOperator="or"
    />
  );
}`,
  },
  {
    id: "export-options",
    title: "Export and print",
    body: "**Download as CSV** exports the filtered, sorted rows of every page and the shown columns. `csvOptions` changes the delimiter, the columns (`fields`, `allColumns`), the header line and the file name. **Print** prints every filtered row on its own page, without the toolbar, footer and checkboxes. `printOptions` keeps them or picks the columns. In HTML, pass the same options to `exportCsv(options)` and `print(options)`. Values in an HTML column can be formatted with `data-ok-format` on its header (`number`, `currency`, `percent`, `date` or `datetime`) and `Intl` options in `data-ok-format-options`, or with `setValueFormatter(field, format)`.",
    html: `<div role="columnheader" data-ok-field="price" data-ok-format="currency" data-ok-format-options='{"currency":"EUR"}'>
  <span data-ok-data-grid-header-title>Price</span>
</div>
<script type="module">
  const grid = window.Owlky.get(document.getElementById("products"), "data-grid");
  grid.exportCsv({ delimiter: ";", fileName: "products" });
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const rows = [
  { id: 1, firstName: "Ana", lastName: "Lima", age: 34 },
  { id: 2, firstName: "Jonah", lastName: "Pereira", age: 17 },
  { id: 3, firstName: "Priya", lastName: "Raman", age: 65 },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "firstName", headerName: "First name", flex: 1 },
  { field: "lastName", headerName: "Last name", flex: 1 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

export function DataGridExportOptions() {
  return (
    <DataGrid
      aria-label="Products"
      rows={rows}
      columns={columns}
      showToolbar
      csvOptions={{ delimiter: ";", fileName: "products" }}
      printOptions={{ hideFooter: false }}
    />
  );
}`,
  },
  {
    id: "rows-to-export",
    title: "Choose the rows to export",
    body: 'By default, CSV, Excel and print exports hold the rows that pass the filters, in the shown order. Set `source` in `csvOptions`, `excelOptions` or `printOptions` to export other rows: `"selected"` exports the selected rows among them, `"page"` the rows of the current page, and `"all"` every row in its original order, whatever the filters. For any other choice, give `getRowsToExport` a function that returns the ids of the rows to export, in order. It gets the grid\'s API in `apiRef` and the id lists `filteredSortedRowIds`, `rowIds`, `paginatedRowIds` and `selectedRowIds`, and it wins over `source`. Print only prints rows that pass the filters, because it copies the rows the grid shows. In HTML, write `source` in the JSON of `data-ok-csv-options`, `data-ok-excel-options` or `data-ok-print-options`, or pass the options to `toCsv`, `exportCsv`, `toExcel`, `exportExcel` and `print`. There, `apiRef.current` is the grid\'s instance.',
    html: `<script type="module">
  const grid = window.Owlky.get(document.getElementById("products"), "data-grid");
  // The selected rows, else every row that passes the filters.
  grid.exportCsv({
    fileName: "products",
    getRowsToExport: ({ selectedRowIds, filteredSortedRowIds }) =>
      selectedRowIds.length
        ? filteredSortedRowIds.filter((id) => selectedRowIds.includes(id))
        : filteredSortedRowIds,
  });
  grid.exportExcel({ fileName: "all-products", source: "all" });
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const rows = [
  { id: 1, product: "Desk", stock: 12 },
  { id: 2, product: "Chair", stock: 0 },
  { id: 3, product: "Lamp", stock: 31 },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "product", headerName: "Product", flex: 1 },
  { field: "stock", headerName: "Stock", type: "number", width: 110 },
];

export function DataGridRowsToExport() {
  return (
    <DataGrid
      aria-label="Products"
      rows={rows}
      columns={columns}
      checkboxSelection
      showToolbar
      csvOptions={{ source: "selected", fileName: "selected-products" }}
      excelOptions={{
        fileName: "products-in-stock",
        getRowsToExport: ({ filteredSortedRowIds, apiRef }) =>
          filteredSortedRowIds.filter((id) => {
            const api = apiRef.current as { getRow(id: string): { stock: number } | undefined };
            return (api.getRow(id)?.stock ?? 0) > 0;
          }),
      }}
    />
  );
}`,
  },
  {
    id: "languages",
    title: "Translate the grid and lay it out right to left",
    body: 'Locale packs translate every label: `enUS`, `viVN`, `frFR`, `deDE`, `esES`, `jaJP` and `zhCN`. Import the one you need. Pass it as `localeText` in React. In HTML, write the toolbar and menus in your language, and call `setLocaleText(pack)` for the text the grid writes itself, such as filter operators, empty states and the page range. With `dir="rtl"` on the page or a parent, the grid lays out right to left: columns pinned to the left stay at the start, which is the right side. The arrow keys follow the reading order. Set `toolbarVariant="icon"` to show the toolbar as icon buttons with tooltips.',
    html: `<script type="module">
  import { viVN } from "@owlky/core";
  window.Owlky.get(document.getElementById("people"), "data-grid").setLocaleText(viVN);
</script>`,
    react: `import { viVN } from "@owlky/core";
import { DataGrid, type GridColDef } from "@owlky/react";

const rows = [
  { id: 1, firstName: "Ana", lastName: "Lima", age: 34 },
  { id: 2, firstName: "Jonah", lastName: "Pereira", age: 17 },
  { id: 3, firstName: "Priya", lastName: "Raman", age: 65 },
];

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "firstName", headerName: "First name", flex: 1 },
  { field: "lastName", headerName: "Last name", flex: 1 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

export function Vietnamese() {
  return <DataGrid aria-label="Danh sách" rows={rows} columns={columns} localeText={viVN} />;
}`,
  },
  {
    id: "tree",
    title: "Show rows as a tree",
    body: "Set `treeData` and return each row's path from `getTreeDataPath`: the names of its ancestors, then its own. Parents that a path names without a row of their own get a generated row. A group column shows the names with a button that opens and closes the children. Right and Left open and close a row when its group cell has the focus. `defaultGroupingExpansionDepth` sets how many levels are open at first. Filters keep the parents of the rows that match, and sorting orders rows among their siblings. In HTML, rows carry `aria-level` and `data-ok-parent`, and the grid fires `ok:data-grid:expand`. With a data source, `getChildrenCount` and `getGroupKey` let the grid load children when a row opens.",
    html: `<div role="row" data-ok-row-id="m-2" data-ok-parent="m-1" aria-level="2" aria-expanded="false">
  <div role="gridcell" aria-colindex="1" data-ok-field="name" tabindex="-1">Design team</div>
</div>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const team = [
  { id: 1, path: ["Maya"], role: "CEO" },
  { id: 2, path: ["Maya", "Jonah"], role: "Design" },
  { id: 3, path: ["Maya", "Priya"], role: "Development" },
];

const columns: GridColDef<(typeof team)[number]>[] = [{ field: "role", headerName: "Role", flex: 1 }];

export function DataGridTree() {
  return (
    <DataGrid
      aria-label="Team"
      rows={team}
      columns={columns}
      treeData
      getTreeDataPath={(row) => row.path}
      groupingColDef={{ headerName: "Name" }}
      defaultGroupingExpansionDepth={1}
    />
  );
}`,
  },
  {
    id: "detail",
    title: "Show details under a row",
    body: '`getDetailPanelContent` returns what shows under a row when people open it, or `null` for rows without details. A button in the first column opens and closes the panel. `getDetailPanelHeight` sets a height in pixels; by default the content decides. In HTML, put each row\'s content in a `<template data-ok-data-grid-detail="<row id>">` inside the grid. The grid copies it when the panel opens and fires `ok:data-grid:detailpanel`.',
    html: `<template data-ok-data-grid-detail="o-1001">
  <p>Order o-1001 for Ana Silva.</p>
</template>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const orders = [
  { id: 1, customer: "Ana Lima", lines: ["Desk lamp", "Chair"] },
  { id: 2, customer: "Jonah Pereira", lines: ["Shelf"] },
];
type Order = (typeof orders)[number];

const columns: GridColDef<Order>[] = [{ field: "customer", headerName: "Customer", flex: 1 }];

function OrderLines({ order }: { order: Order }) {
  return (
    <ul>
      {order.lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

export function DataGridDetail() {
  return (
    <DataGrid
      aria-label="Orders"
      rows={orders}
      columns={columns}
      getDetailPanelContent={({ row }) => <OrderLines order={row} />}
    />
  );
}`,
  },
  {
    id: "ordering",
    title: "Move and pin rows",
    body: 'With `rowReordering`, each row gets a handle: drag it onto another row, or press Alt + Up or Alt + Down on it. A screen reader hears the new position. Moving is off while the rows are sorted or filtered. React reports moves with `onRowOrderChange`; HTML fires `ok:data-grid:roworder`, which you can cancel. `pinnedRows` keeps rows above or below the others while they scroll. Pinned rows aren\'t sorted, filtered or paged. In HTML, put them in `<div role="rowgroup" data-ok-data-grid-pinned-rows="top">` (or `bottom`).',
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const items = [
  { id: "a", topic: "Roadmap" },
  { id: "b", topic: "Hiring" },
];
const welcome = { id: "welcome", topic: "Welcome" };
const questions = { id: "questions", topic: "Questions" };

const columns: GridColDef<(typeof items)[number]>[] = [{ field: "topic", headerName: "Topic", flex: 1 }];

// Your own save: store the new position
function save(from: number, to: number) {
  void fetch("/api/agenda/order", { method: "POST", body: JSON.stringify({ from, to }) });
}

export function DataGridOrdering() {
  return (
    <DataGrid
      aria-label="Agenda"
      rows={items}
      columns={columns}
      rowReordering
      onRowOrderChange={({ oldIndex, targetIndex }) => save(oldIndex, targetIndex)}
      pinnedRows={{ top: [welcome], bottom: [questions] }}
    />
  );
}`,
  },
  {
    id: "groups",
    title: "Group column headers and show a list",
    body: "`columnGroupingModel` puts headers over groups of columns, on as many levels as you need. A group's `description` shows as its tooltip. When a column is hidden or moved, its group splits around it. Columns can't move out of their group. `listView` shows each row as one cell, such as a card on a small screen. `listViewColumn` says which field it shows, and `renderCell` builds its content. The headers and the other cells are hidden in list view.",
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const contacts = [
  { id: 1, firstName: "Ana", lastName: "Lima", email: "ana@example.com" },
  { id: 2, firstName: "Jonah", lastName: "Pereira", email: "jonah@example.com" },
];

const columns: GridColDef<(typeof contacts)[number]>[] = [
  { field: "firstName", headerName: "First name" },
  { field: "lastName", headerName: "Last name" },
  { field: "email", headerName: "Email", flex: 1 },
];

export function DataGridGroups() {
  return (
    <DataGrid
      aria-label="Contacts"
      rows={contacts}
      columns={columns}
      columnGroupingModel={[
        { groupId: "person", headerName: "Person", children: [{ field: "firstName" }, { field: "lastName" }] },
        { groupId: "contact", headerName: "Contact", children: [{ field: "email" }] },
      ]}
    />
  );
}`,
  },
  {
    id: "lazy",
    title: "Load rows as they scroll into view",
    body: "With `lazyLoading` and a data source, the grid asks for the rows that come into view, 50 at a time. Rows that haven't arrived show as placeholders. The data source answers `start` and `end`, and returns the total in `rowCount`. `lazyLoadingRequestThrottleMs` spaces the requests. Wide grids also render only the columns in view, when the columns have fixed widths. `rowBufferPx` and `columnBufferPx` set how much renders beyond the visible area. A data source's `updateRow` saves edited rows. Its answer is shown, and a failure brings the old values back. The cache keeps answers for five minutes, or for the `ttl` you pass to `createGridDataSourceCache`.",
    html: `${gridElement(lazyGroup, "data-ok-data-grid ").replace("<div data-ok-data-grid ", '<div data-ok-data-grid id="customers" ')}
<script type="module">
  const grid = window.Owlky.get(document.getElementById("customers"), "data-grid");
  grid.setDataSource({
    async getRows({ start, end }) {
      const response = await fetch(\`/api/customers?start=\${start}&end=\${end}\`);
      return response.json(); // { rows, rowCount }
    },
  });
</script>`,
    react: `import type { GridDataSource } from "@owlky/core";
import { DataGrid, type GridColDef } from "@owlky/react";

interface Customer {
  id: number;
  name: string;
}

const columns: GridColDef<Customer>[] = [{ field: "name", headerName: "Name", flex: 1 }];
const noRows: Customer[] = [];

// Your own server: it answers { rows, rowCount } for the rows asked for
const customers: GridDataSource<Customer> = {
  async getRows(params) {
    const response = await fetch("/api/customers", { method: "POST", body: JSON.stringify(params) });
    return response.json();
  },
};

export function DataGridLazy() {
  return <DataGrid aria-label="Customers" rows={noRows} columns={columns} dataSource={customers} lazyLoading />;
}`,
  },
  {
    id: "grouping",
    title: "Group rows and aggregate values",
    body: "`rowGroupingModel` lists the fields that group the rows, outermost first. The grid adds a row for each group, with the group's name, its number of rows and a button that opens it. People group and ungroup columns from the column menu. `aggregationModel` gives fields a function: `sum`, `avg` (rounded to two decimals), `min`, `max` or `size` (the number of rows). Group rows show their values, and a footer row shows the values of every filtered row. The column menu offers the functions that fit each column's type, and the header names the function in use. Sorting an aggregated column orders the groups by their values. Sorting a grouped column orders them by name. With a data source, the grid passes `groupFields` and `groupKeys`, and the server returns the groups of each level. In HTML, the models are the attributes `data-ok-row-grouping-model` and `data-ok-aggregation-model` (JSON), and the grid builds the group rows from the rows in the markup. In tree data, the grid adds a row for each parent that a path names without a row of its own.",
    html: `${gridOf(groupingGroup, { rows: 6 })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "Europe", product: "Lamp", year: 2024, units: 120, revenue: 5400 },
  { id: 2, region: "Europe", product: "Chair", year: 2025, units: 80, revenue: 10400 },
  { id: 3, region: "Asia", product: "Lamp", year: 2025, units: 200, revenue: 9000 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "year", headerName: "Year", type: "number" },
  { field: "units", headerName: "Units", type: "number" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridGrouping() {
  return (
    <DataGrid
      aria-label="Sales"
      rows={sales}
      columns={columns}
      initialState={{
        rowGrouping: { model: ["region"] },
        aggregation: { model: { units: "sum", revenue: "sum" } },
      }}
    />
  );
}`,
  },
  {
    id: "grouping-columns",
    title: "Show a grouping column per field",
    body: "By default, one grouping column holds the groups of every grouped field. Set `rowGroupingColumnMode` to `multiple` to give each grouped field its own grouping column, named after the field. Each group row shows its name in its field's column, so nested groups don't indent. `groupingColDef` can also be a function: the grid calls it for each grouping column with the fields that column groups by, so each column can have its own header name, width or `hideDescendantCount`. Sorting a grouping column, such as `__row_group_by_columns_group_region__`, orders the groups of its field by name. Server-side grouping keeps one column. In HTML, set `data-ok-row-grouping-column-mode=\"multiple\"`.",
    html: `${gridOf(groupingMultiple, { rows: 4 })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "Europe", product: "Lamp", units: 120, revenue: 5400 },
  { id: 2, region: "Europe", product: "Chair", units: 80, revenue: 10400 },
  { id: 3, region: "Asia", product: "Lamp", units: 200, revenue: 9000 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "units", headerName: "Units", type: "number" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridGroupingColumns() {
  return (
    <DataGrid
      aria-label="Sales by region and product"
      rows={sales}
      columns={columns}
      rowGroupingColumnMode="multiple"
      groupingColDef={({ fields }) => (fields[0] === "product" ? { hideDescendantCount: true } : {})}
      initialState={{
        rowGrouping: { model: ["region", "product"] },
        aggregation: { model: { revenue: "sum" } },
      }}
    />
  );
}`,
  },
  {
    id: "grouping-values",
    title: "Group by a computed value",
    body: "A column's `groupingValueGetter` returns the value its rows are grouped by, such as a decade for a year or a band for an amount. It receives the row's own value (`row[field]`, even when the column has a `valueGetter`) and the row, and returns a string, a number, a date or nothing. The cells still show their own values. In HTML, the value is the cell's `data-ok-grouping-value` attribute, which React writes for you. For rows you build from data, give the runtime a function with `setGroupingValueGetter(field, getter)`.",
    html: `${gridOf(groupingValue, { rows: 3 })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "Europe", product: "Lamp", units: 120, revenue: 5400 },
  { id: 2, region: "Europe", product: "Chair", units: 80, revenue: 10400 },
  { id: 3, region: "Asia", product: "Lamp", units: 200, revenue: 9000 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  {
    field: "units",
    headerName: "Units",
    type: "number",
    // Two groups instead of one per number of units
    groupingValueGetter: (value) => (Number(value) >= 100 ? "100 units or more" : "Under 100 units"),
  },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridGroupingValues() {
  return (
    <DataGrid
      aria-label="Sales by units"
      rows={sales}
      columns={columns}
      initialState={{
        rowGrouping: { model: ["units"] },
        aggregation: { model: { revenue: "sum" } },
      }}
    />
  );
}`,
  },
  {
    id: "group-footers",
    title: "Show totals in group footers",
    body: '`getAggregationPosition` decides where each group shows its aggregated values: `"inline"` in the group row, `"footer"` in a footer row after the group\'s rows, or `null` for nowhere. It receives the group, with its `groupingField` and `groupingKey`, or the root (`isRoot`, depth -1) for the footer row of every row. By default, groups show their values inline and the root in the footer row. A group footer shows while its group is open. In HTML, set `data-ok-aggregation-position` to JSON by level: `root` for the footer row of every row, and each grouped field for its groups, such as `{"root": null, "region": "footer"}`. React writes the attribute for you. The pivot ignores the positions.',
    html: `${gridOf(groupingFooters, { rows: 8 })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "Europe", product: "Lamp", units: 120, revenue: 5400 },
  { id: 2, region: "Europe", product: "Chair", units: 80, revenue: 10400 },
  { id: 3, region: "Asia", product: "Lamp", units: 200, revenue: 9000 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "units", headerName: "Units", type: "number" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridGroupFooters() {
  return (
    <DataGrid
      aria-label="Sales by region, with a total per region"
      rows={sales}
      columns={columns}
      defaultGroupingExpansionDepth={1}
      // A footer row per group, no footer row for every row
      getAggregationPosition={(group) => (group.isRoot ? null : "footer")}
      initialState={{
        rowGrouping: { model: ["region"] },
        aggregation: { model: { units: "sum", revenue: "sum" } },
      }}
    />
  );
}`,
  },
  {
    id: "pivot",
    title: "Pivot the rows",
    body: "A pivot summarizes the rows in a new table. `pivotModel` names the fields whose values become rows (`rows`), the fields whose values become columns (`columns`) and the fields to aggregate with their function (`values`). Set `pivotActive` to show it. The **Pivot** button in the toolbar opens a panel with a switch and four sections: **Not used**, **Rows**, **Columns** and **Values**. Drag a field by its handle to another section or to another place in its section. Without a mouse, pick a field's place in its list and move it with its **Move up** and **Move down** buttons, so you never need to drag. Each value field has a function. Filters work on the rows before the pivot. Exports keep the rows and columns of the data. In HTML, put the model in `data-ok-pivot-model` and add `data-ok-pivot-active`. The grid builds the pivot from the rows in the markup and fires `ok:data-grid:pivot`, which you can cancel.",
    html: `${gridOf(pivotGroup, { rows: 6 })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "Europe", product: "Lamp", year: 2024, units: 120, revenue: 5400 },
  { id: 2, region: "Europe", product: "Chair", year: 2025, units: 80, revenue: 10400 },
  { id: 3, region: "Asia", product: "Lamp", year: 2025, units: 200, revenue: 9000 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "year", headerName: "Year", type: "number" },
  { field: "units", headerName: "Units", type: "number" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridPivot() {
  return (
    <DataGrid
      aria-label="Revenue by region and year"
      rows={sales}
      columns={columns}
      showToolbar
      initialState={{
        pivoting: {
          active: true,
          model: {
            rows: [{ field: "region" }],
            columns: [{ field: "year" }],
            values: [{ field: "revenue", aggFunc: "sum" }],
          },
        },
      }}
    />
  );
}`,
  },
  {
    id: "pivot-derived",
    title: "Pivot by parts of a date",
    body: 'To group a pivot by year or quarter, the grid derives fields from your columns. By default, every `date` column gets a year field (`<field>-year`) and a quarter field (`<field>-quarter`, `Q1` to `Q4`), named "Date (Year)" and "Date (Quarter)". They show in the pivot panel and work in the pivot model like other fields. `getPivotDerivedColumns` replaces them: the grid calls it for each column, and it returns the columns to derive (each with a `valueGetter`), or nothing. Pass `null` for none. In HTML, the defaults work the same way. Give the runtime your own function with `setPivotDerivedColumns(getter)`: each derived field\'s `valueGetter` receives the source cell\'s value.',
    html: `${gridOf(pivotDerived, { rows: 4 })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

type Trade = { id: number; date: string; ticker: string; volume: number };

const trades: Trade[] = [
  { id: 1, date: "2024-03-14", ticker: "AAPL", volume: 5500 },
  { id: 2, date: "2024-08-02", ticker: "MSFT", volume: 3200 },
  { id: 3, date: "2025-01-20", ticker: "AAPL", volume: 4100 },
];

const columns: GridColDef<Trade>[] = [
  { field: "date", headerName: "Date", type: "date" },
  { field: "ticker", headerName: "Ticker" },
  { field: "volume", headerName: "Volume", type: "number" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// A month field instead of the default year and quarter
const monthOf = (column: GridColDef<Trade>): GridColDef<Trade>[] | undefined =>
  column.type === "date"
    ? [
        {
          field: \`\${column.field}-month\`,
          headerName: \`\${column.headerName} (Month)\`,
          valueGetter: (row) => months[Number(row.date.slice(5, 7)) - 1],
        },
      ]
    : undefined;

export function DataGridPivotDerived() {
  return (
    <DataGrid
      aria-label="Volume by ticker and month"
      rows={trades}
      columns={columns}
      showToolbar
      getPivotDerivedColumns={monthOf}
      initialState={{
        pivoting: {
          active: true,
          model: {
            rows: [{ field: "ticker" }],
            columns: [{ field: "date-month" }],
            values: [{ field: "volume", aggFunc: "sum" }],
          },
        },
      }}
    />
  );
}`,
  },
  {
    id: "cells",
    title: "Select cells and use the clipboard",
    body: "With `cellSelection`, people select cells in ranges: press a cell and drag, press another cell with Shift, or hold Shift and use the arrow keys. Ctrl or Cmd adds a range, or toggles one cell. Ctrl + A selects every cell of the page. Ctrl + C copies the selected cells as tab-separated text, which spreadsheets read. Without selected cells it copies the selected rows, or the focused cell. Ctrl + V pastes text into editable cells, from the selection's first cell or the focused cell. One copied value fills every selected cell. Each pasted row goes through `processRowUpdate` (HTML: a cancelable `ok:data-grid:edit`). `disableClipboardPaste` turns pasting off. The grid uses the browser's own copy and paste for these keys, so it never asks for clipboard permissions.",
    html: `${gridOf(cellsGroup)}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const items = [
  { id: 1, product: "Desk lamp", stock: 12, price: 49 },
  { id: 2, product: "Chair", stock: 4, price: 129 },
];

const columns: GridColDef<(typeof items)[number]>[] = [
  { field: "product", headerName: "Product", flex: 1, editable: true },
  { field: "stock", headerName: "Stock", type: "number", editable: true },
  { field: "price", headerName: "Price", type: "number", editable: true },
];

// Your own save: send the row to your API
async function save(row: (typeof items)[number]) {
  await fetch(\`/api/items/\${row.id}\`, { method: "PUT", body: JSON.stringify(row) });
  return row;
}

export function DataGridCells() {
  return (
    <DataGrid
      aria-label="Inventory"
      rows={items}
      columns={columns}
      cellSelection
      processRowUpdate={(row) => save(row)}
    />
  );
}`,
  },
  {
    id: "header-filters",
    title: "Filter from the headers",
    body: "`headerFilters` adds a row of fields under the column headers. Each field filters its column with the column type's first operator, and shows that operator as its label: text contains, a number equals, a date is. Booleans and choices get a list, dates get a date picker, and date times (`dateTime` columns) get a date time picker. The fields and the filter panel share one filter model. Up and Down move from a field to the cells. Date and date time filters in the filter panel use the same pickers.",
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const items = [
  { id: 1, product: "Desk lamp", stock: 12, price: 49 },
  { id: 2, product: "Chair", stock: 4, price: 129 },
];

const columns: GridColDef<(typeof items)[number]>[] = [
  { field: "product", headerName: "Product", flex: 1, editable: true },
  { field: "stock", headerName: "Stock", type: "number", editable: true },
  { field: "price", headerName: "Price", type: "number", editable: true },
];

export function DataGridHeaderFilters() {
  return <DataGrid aria-label="Inventory" rows={items} columns={columns} headerFilters />;
}`,
  },
  {
    id: "export-excel",
    title: "Export to Excel",
    body: "The **Export** menu downloads the filtered, sorted rows as an Excel workbook. Numbers, booleans and dates keep their type, with a date format. Text is written as text, never as a formula, because exported data may come from users. `excelOptions` sets the file name, the sheet name, the fields and whether to include the headers. In React, `apiRef.current.getDataAsExcel()` returns the file's bytes. In HTML, use `toExcel()` and `exportExcel()`, or the attribute `data-ok-excel-options` (JSON).",
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "Europe", product: "Lamp", year: 2024, units: 120, revenue: 5400 },
  { id: 2, region: "Europe", product: "Chair", year: 2025, units: 80, revenue: 10400 },
  { id: 3, region: "Asia", product: "Lamp", year: 2025, units: 200, revenue: 9000 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "year", headerName: "Year", type: "number" },
  { field: "units", headerName: "Units", type: "number" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridExportExcel() {
  return (
    <DataGrid
      aria-label="Sales"
      rows={sales}
      columns={columns}
      showToolbar
      excelOptions={{ fileName: "sales", sheetName: "2025" }}
    />
  );
}`,
  },
  {
    id: "charts",
    title: "Chart the rows",
    body: "With `chartsIntegration`, a chart follows the grid. `chartModel` sets its `type`, its `dimension` (the field that names the categories) and its `values` (number fields drawn as series). The types are `column`, `bar`, `line`, `area`, `pie`, `donut`, `radar` and `scatter`. When the rows are grouped, the chart shows the top-level groups with the aggregated values of the rows that pass the filters. Otherwise it shows the rows of the page. A scatter chart of rows whose category is a number column places each row at that number. The **Chart** button in the toolbar opens a panel to change the type, the category, the series, the stacking, the value labels and the legend. In HTML, the chart is a Chart component inside the grid, and the grid updates it through the chart's `updateSeries()` method.",
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "Europe", product: "Lamp", year: 2024, units: 120, revenue: 5400 },
  { id: 2, region: "Europe", product: "Chair", year: 2025, units: 80, revenue: 10400 },
  { id: 3, region: "Asia", product: "Lamp", year: 2025, units: 200, revenue: 9000 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "year", headerName: "Year", type: "number" },
  { field: "units", headerName: "Units", type: "number" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridCharts() {
  return (
    <DataGrid
      aria-label="Sales"
      rows={sales}
      columns={columns}
      showToolbar
      chartsIntegration
      initialState={{
        rowGrouping: { model: ["product"] },
        chartsIntegration: { model: { type: "column", values: ["revenue"] } },
      }}
    />
  );
}`,
  },
  {
    id: "charts-multiple",
    title: "Draw several charts",
    body: "One grid can drive several charts. `chartModels` holds one chart model per chart id, and each model's `label` names its chart. The charts show one after the other under the grid. The **Chart** list at the top of the chart panel picks the chart the panel edits, which is `activeChartId` (`onActiveChartIdChange` reports a switch). Each chart keeps its own type, series and configuration. In HTML, put the models in `data-ok-chart-models` (JSON) with one chart region per id, and the active one in `data-ok-active-chart-id`. The grid fires `ok:data-grid:chart` with the chart's `id`, and the cancelable `ok:data-grid:activechart` when the panel switches charts.",
    html: `${gridOf(chartsMultiple, { rows: 4 })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "Europe", product: "Lamp", units: 120, revenue: 5400 },
  { id: 2, region: "Europe", product: "Chair", units: 80, revenue: 10400 },
  { id: 3, region: "Asia", product: "Lamp", units: 200, revenue: 9000 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "units", headerName: "Units", type: "number" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridSeveralCharts() {
  return (
    <DataGrid
      aria-label="Sales by product"
      rows={sales}
      columns={columns}
      showToolbar
      chartsIntegration
      initialState={{
        rowGrouping: { model: ["product"] },
        aggregation: { model: { units: "sum", revenue: "sum" } },
        chartsIntegration: {
          charts: {
            revenue: { label: "Revenue by product", type: "column", values: ["revenue"] },
            units: { label: "Units by product", type: "line", values: ["units"] },
          },
        },
      }}
    />
  );
}`,
  },
  {
    id: "charts-configuration",
    title: "Configure the chart",
    body: `The chart model also holds the chart's configuration. Each setting applies only to the types that use it.

- **\`stacked\`:** stacks the series of a column, bar, line or area chart. It needs two series or more.
- **\`itemLabel\`:** \`"value"\` prints the values on the chart, such as the percentages on pie slices.
- **\`legend\`:** places the legend at the \`top\`, \`right\` or \`bottom\`, or hides it with \`none\`. A chart with one series has no legend.
- **\`colors\`:** palette names or shades, such as \`"info"\` or \`"primary-dark"\`, for the series in order. Pie and donut charts use them for the slices.
- **\`height\`, \`curve\`, \`showMark\`, \`seriesAxisLabel\`, \`showToolbar\` and \`animations\`:** the plot height in pixels, the line shape, point markers, the value axis title, a toolbar with downloads and animated updates.
- **\`startAngle\`, \`endAngle\` and \`donutSize\`:** the angles of pie and donut slices, and the size of the donut hole in percent.

When the grid is pivoted, a value field of the pivot draws one series per pivot column, named by its keys. Grouping, filtering, pivoting and editing redraw the chart, so it always shows what the grid shows.`,
    html: `<!-- The chart model is JSON. The instance's setChartModel(model) changes it from code. -->
${gridOf(chartsGroup, { rows: 6 })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "Europe", product: "Lamp", year: 2024, units: 120, revenue: 5400 },
  { id: 2, region: "Europe", product: "Chair", year: 2025, units: 80, revenue: 10400 },
  { id: 3, region: "Asia", product: "Lamp", year: 2025, units: 200, revenue: 9000 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "year", headerName: "Year", type: "number" },
  { field: "units", headerName: "Units", type: "number" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridChartsConfiguration() {
  return (
    <DataGrid
      aria-label="Revenue by region and product"
      rows={sales}
      columns={columns}
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
    />
  );
}`,
  },
  {
    id: "charts-range",
    title: "Chart a range of cells",
    body: "With `cellSelection` and `chartsIntegration`, people can chart the cells they select, as in a spreadsheet. Select the cells, then press Alt + F1 on a cell, or select **Chart from selection** in the chart panel. The first column of the range names the categories, unless it holds numbers: then the categories are the rows' positions. Each number column of the range becomes a series, named by its header. Rows with the same category merge into one, with the column's aggregation function or a sum. With several charts, the new chart is added after the others and the panel edits it, so you can pick its type right away. With one chart, the range replaces what the chart shows. The grid announces the new chart to screen readers. A range without numbers creates no chart, and the grid says so. From code, call `createRangeChart()`, with an optional `cellRange`, `chartType`, `label` and `id`. It returns the new chart's `id` and model, or `null` when the range holds no number. A range chart keeps its rows in the model's `rows`: it shows the ones that pass the filters, in the grid's sort order. In HTML, the grid builds the new chart's region itself and fires the cancelable `ok:data-grid:chart` first.",
    html: `${gridOf(chartsRange, { rows: 4 })}
<script type="module">
  const element = document.getElementById("grid-charts-range");
  const grid = window.Owlky.get(element, "data-grid");
  // Chart the region and revenue of the first two rows as a line chart
  grid.createRangeChart({
    cellRange: { "s-01": { region: true, revenue: true }, "s-02": { region: true, revenue: true } },
    chartType: "line",
  });
</script>`,
    react: `import { Button, DataGrid, type GridColDef, useGridApiRef } from "@owlky/react";

const sales = [
  { id: "s-01", region: "North", product: "Tea", units: 10, revenue: 40 },
  { id: "s-02", region: "South", product: "Juice", units: 47, revenue: 329 },
  { id: "s-03", region: "East", product: "Coffee", units: 84, revenue: 420 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "units", headerName: "Units", type: "number" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridRangeCharts() {
  const apiRef = useGridApiRef<(typeof sales)[number]>();
  return (
    <>
      <Button
        onClick={() =>
          apiRef.current?.createRangeChart({
            cellRange: { "s-01": { region: true, revenue: true }, "s-02": { region: true, revenue: true } },
            chartType: "line",
          })
        }
      >
        Chart two rows
      </Button>
      <DataGrid
        aria-label="Sales by region"
        rows={sales}
        columns={columns}
        apiRef={apiRef}
        showToolbar
        cellSelection
        chartsIntegration
        initialState={{
          chartsIntegration: {
            charts: { revenue: { label: "Revenue by region", dimension: "region", values: ["revenue"] } },
          },
        }}
      />
    </>
  );
}`,
  },
  {
    id: "charts-cross-filter",
    title: "Filter the grid from a chart",
    body: "Set `crossFilter` on a chart model, or turn on **Filter the grid** in the chart panel, to filter the grid from the chart. Clicking a bar, a point or a slice filters the grid to its category. Clicking it again clears the filter. On the keyboard, move to a category with the arrow keys in the chart, then press Enter or Space. The filter is an \"is any of\" item on the chart's category field: the grouping field when the chart shows groups, or else its `dimension`. It's part of the grid's filter model like any other filter, so the filter panel shows it, `onFilterModelChange` reports it, and in HTML the cancelable `ok:data-grid:filter` fires first. The chart itself shows the rows that pass the other filters, so it keeps every category and outlines the filtered ones. A filter on that field from the filter panel or from code shows on the chart the same way. The grid announces each change to screen readers. Pivoted grids, server-side filtering and scatter charts of a number column don't cross-filter.",
    html: `<!-- The chart model's crossFilter option, in data-ok-chart-models -->
${gridOf(chartsRange, { rows: 4 })}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "North", product: "Tea", revenue: 40 },
  { id: 2, region: "South", product: "Juice", revenue: 329 },
  { id: 3, region: "North", product: "Coffee", revenue: 420 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridCrossFilter() {
  return (
    <DataGrid
      aria-label="Sales by region"
      rows={sales}
      columns={columns}
      showToolbar
      chartsIntegration
      onFilterModelChange={(model) => console.log(model.items)}
      initialState={{
        chartsIntegration: {
          charts: {
            revenue: {
              label: "Revenue by region",
              dimension: "region",
              values: ["revenue"],
              crossFilter: true,
            },
          },
        },
      }}
    />
  );
}`,
  },
  {
    id: "charts-config",
    title: "Save and restore the charts",
    body: "`chartsToJSON()` returns every chart model, the active chart and the one chart's model as plain JSON: types, fields, range rows and configuration. Store it where your app keeps settings. `restoreCharts(config)` applies it again later. It checks what it receives and drops unknown keys and values, so a config from storage or a URL can't change anything else. It's the same object as the `chartsIntegration` part of `exportState()`, so `restoreState()` restores the charts too. In HTML, the grid adds and removes chart regions to match the restored charts.",
    html: `<script type="module">
  const element = document.getElementById("grid-charts-range");
  const grid = window.Owlky.get(element, "data-grid");
  // Restore the charts from the last visit, and save them when the chart panel changes them
  grid.restoreCharts(JSON.parse(localStorage.getItem("sales-charts") ?? "{}"));
  element.addEventListener("ok:data-grid:chart", () =>
    queueMicrotask(() => localStorage.setItem("sales-charts", JSON.stringify(grid.chartsToJSON()))),
  );
</script>`,
    react: `import { Button, DataGrid, type GridColDef, useGridApiRef } from "@owlky/react";

const sales = [
  { id: 1, region: "North", revenue: 40 },
  { id: 2, region: "South", revenue: 329 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function DataGridSavedCharts() {
  const apiRef = useGridApiRef<(typeof sales)[number]>();
  const save = () => {
    const config = apiRef.current?.chartsToJSON();
    localStorage.setItem("sales-charts", JSON.stringify(config));
  };
  const restore = () => {
    apiRef.current?.restoreCharts(JSON.parse(localStorage.getItem("sales-charts") ?? "{}"));
  };
  return (
    <>
      <Button onClick={save}>Save charts</Button>
      <Button onClick={restore}>Restore charts</Button>
      <DataGrid
        aria-label="Sales"
        rows={sales}
        columns={columns}
        apiRef={apiRef}
        showToolbar
        chartsIntegration
        initialState={{
          chartsIntegration: { charts: { revenue: { dimension: "region", values: ["revenue"] } } },
        }}
      />
    </>
  );
}`,
  },
  {
    id: "undo-redo",
    title: "Undo and redo edits",
    body: "Ctrl + Z (Cmd + Z on macOS) undoes the last saved edit, and Ctrl + Shift + Z or Ctrl + Y redoes it, while the focus is on a cell or a header. Each edited cell or row is one step, and so is each paste, whatever the number of cells it fills. Undo and redo save the rows again through `processRowUpdate` (HTML: a cancelable `ok:data-grid:edit`), so your server sees them like any edit. If a row changed in another way since the step, for example new `rows` from your code, the step can't apply and the steps before it are dropped. A refused save does the same. `historyStackSize` sets how many steps the grid keeps (30 by default; `0` turns undo and redo off). With `showToolbar`, the toolbar has **Undo** and **Redo** buttons. In React, `showHistoryControls={false}` hides them. In HTML, they're the toolbar buttons with `data-ok-data-grid-history`. `apiRef.current.history` (HTML: the instance's `history`) has `undo()`, `redo()`, `canUndo()`, `canRedo()` and `clear()`. `onUndo` and `onRedo` (HTML: `ok:data-grid:undo` and `ok:data-grid:redo`) report the ids of the rows that changed. Typing in a field keeps the field's own undo.",
    html: `${gridOf(historyGroup)}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const issues = [
  { id: 1, title: "Fix the login form", points: 3 },
  { id: 2, title: "Add dark mode", points: 8 },
];

const columns: GridColDef<(typeof issues)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1, editable: true },
  { field: "points", headerName: "Points", type: "number", editable: true },
];

// Your own save: send the row to your API
async function save(row: (typeof issues)[number]) {
  await fetch(\`/api/issues/\${row.id}\`, { method: "PUT", body: JSON.stringify(row) });
  return row;
}

export function Issues() {
  return (
    <DataGrid
      aria-label="Issues"
      rows={issues}
      columns={columns}
      showToolbar
      cellSelection
      historyStackSize={20}
      processRowUpdate={(row) => save(row)}
    />
  );
}`,
  },
  {
    id: "custom-editors",
    title: "Use your own editors and filter fields",
    body: 'A column\'s `renderEditCell` replaces the field that edits its cells, for example with a slider. The editor gets the edited `value`, the `error` of the value, and `api`: call `api.setEditCellValue({ id, field, value })` when the value changes. Enter saves, Escape cancels, and moving the focus out of the cell saves, like the built-in fields. The first control of the editor takes the focus. In HTML, write the editor in `<template data-ok-data-grid-edit-cell="<field>">` at the end of the grid. The grid copies it into the cell. A field marked `data-ok-data-grid-edit-input` holds the value, or call `setEditCellValue()` from a script. With `headerFilters`, a column\'s `renderHeaderFilter` replaces its filter field: call `applyFilterChanges(item)` with the column\'s filter item. In HTML, write that field in the header filter cell, and name its operator with `data-ok-filter-operator`, such as `">="`.',
    html: `${gridOf(editorsGroup)}
<script type="module">
  const element = document.getElementById("grid-editors");
  const grid = window.Owlky.get(element, "data-grid");
  const sliderOf = (id) =>
    element.querySelector(\`[data-ok-row-id="\${id}"] [data-ok-field="points"] [data-ok-slider]\`);
  // The template's Slider starts at the cell's value
  element.addEventListener("ok:data-grid:editstart", (event) => {
    const { id, field } = event.detail;
    if (field !== "points") return;
    const cell = sliderOf(id).closest("[data-ok-field]");
    window.Owlky.getOrCreate(sliderOf(id), "slider").setValue(Number(cell.dataset.okValue));
  });
  // Each move sets the edited value
  element.addEventListener("ok:slider:change", (event) => {
    const id = event.target.closest("[data-ok-row-id]").dataset.okRowId;
    grid.setEditCellValue({ id, field: "points", value: event.detail.value[0] });
  });
</script>`,
    react: `import { DataGrid, type GridColDef, Slider, TextField } from "@owlky/react";

const issues = [
  { id: 1, title: "Fix the login form", points: 3 },
  { id: 2, title: "Add dark mode", points: 8 },
];

const columns: GridColDef<(typeof issues)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1, editable: true },
  {
    field: "points",
    headerName: "Points",
    type: "number",
    width: 200,
    editable: true,
    renderEditCell: ({ id, field, value, api }) => (
      <Slider
        aria-label="Points"
        min={0}
        max={13}
        value={Number(value)}
        onChange={(next) => api.setEditCellValue({ id, field, value: next })}
      />
    ),
    renderHeaderFilter: ({ item, applyFilterChanges }) => (
      <TextField
        select
        size="small"
        label="At least"
        value={String(item.value ?? "")}
        onChange={(next) => applyFilterChanges({ ...item, operator: ">=", value: next })}
      >
        <option value="">any</option>
        <option value="5">5</option>
        <option value="8">8</option>
      </TextField>
    ),
  },
];

export function Issues() {
  return <DataGrid aria-label="Issues" rows={issues} columns={columns} headerFilters />;
}`,
  },
  {
    id: "edit-modes",
    title: "Start and stop editing from your code",
    body: '`cellModesModel` (cell editing) and `rowModesModel` (row editing) tell which cell or row is in edit mode. Set an entry\'s `mode` to `"edit"` to open it and to `"view"` to close it. Closing saves the values, unless the entry also has `ignoreModifications: true`. With `rowModesModel`, `fieldToFocus` picks the field that takes the focus. When people start or stop editing, the grid calls `onCellModesModelChange` or `onRowModesModelChange` with the next model. While you control the model, nothing changes until you pass it back, so you can refuse or delay an edit. The grid edits one cell or one row at a time. `apiRef` has `startCellEditMode`, `stopCellEditMode`, `startRowEditMode` and `stopRowEditMode` too. In HTML, call `setCellModesModel(model)` or `setRowModesModel(model)`, and read `cellModesModel` or `rowModesModel` on the instance. The cancelable `ok:data-grid:cellmodes` and `ok:data-grid:rowmodes` events report the starts and stops people make.',
    html: `${gridOf(modesGroup)}
<script type="module">
  const element = document.getElementById("grid-edit-modes");
  const grid = window.Owlky.get(element, "data-grid");
  // The Edit, Save and Cancel buttons of each row set the row modes model
  element.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ok-field=actions] button");
    if (!button) return;
    const id = button.closest("[data-ok-row-id]").dataset.okRowId;
    const label = button.getAttribute("aria-label");
    if (label.startsWith("Edit")) grid.setRowModesModel({ [id]: { mode: "edit" } });
    else if (label.startsWith("Save")) grid.setRowModesModel({ [id]: { mode: "view" } });
    else grid.setRowModesModel({ [id]: { mode: "view", ignoreModifications: true } });
  });
</script>`,
    react: `import type { GridRowModesModel } from "@owlky/core";
import { Button, DataGrid, type GridColDef } from "@owlky/react";
import { useState } from "react";

const members = [
  { id: "1", name: "Ana Silva", hours: 32 },
  { id: "2", name: "Bao Tran", hours: 40 },
];

export function Members() {
  const [modes, setModes] = useState<GridRowModesModel>({});
  const columns: GridColDef<(typeof members)[number]>[] = [
    { field: "name", headerName: "Name", flex: 1, editable: true },
    { field: "hours", headerName: "Hours", type: "number", editable: true },
    {
      field: "actions",
      headerName: "Actions",
      type: "actions",
      width: 200,
      renderCell: ({ row }) =>
        modes[row.id]?.mode === "edit" ? (
          <>
            <Button size="sm" onClick={() => setModes({ [row.id]: { mode: "view" } })}>
              Save
            </Button>
            <Button
              size="sm"
              onClick={() => setModes({ [row.id]: { mode: "view", ignoreModifications: true } })}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => setModes({ [row.id]: { mode: "edit" } })}>
            Edit
          </Button>
        ),
    },
  ];
  return (
    <DataGrid
      aria-label="Team members"
      rows={members}
      columns={columns}
      editMode="row"
      rowModesModel={modes}
      onRowModesModelChange={setModes}
    />
  );
}`,
  },
  {
    id: "status-bar",
    title: "Show figures of the selected cells",
    body: 'With `cellSelection` and `statusBar`, a bar under the grid shows figures of the selected cells, like a spreadsheet. **Count** is the number of selected cells with a value. With numbers in `number` columns, the bar also shows their **Sum**, **Average**, **Min** and **Max**, with at most 2 decimals. The figures come from the aggregation functions of those names, so a `sum` in React\'s `aggregationFunctions` changes the bar too. The bar is a polite live region (`role="status"`): screen readers read the new figures once the selection stops changing. Rename the figures with the locale keys `statusBarCount`, `statusBarSum`, `statusBarAvg`, `statusBarMin` and `statusBarMax`.',
    html: `${gridOf(cellsStatus)}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const sales = [
  { id: 1, region: "North", units: 10, revenue: 40 },
  { id: 2, region: "South", units: 47, revenue: 235 },
  { id: 3, region: "East", units: 84, revenue: 504 },
];

const columns: GridColDef<(typeof sales)[number]>[] = [
  { field: "region", headerName: "Region", flex: 1 },
  { field: "units", headerName: "Units", type: "number" },
  { field: "revenue", headerName: "Revenue", type: "number" },
];

export function SalesFigures() {
  return (
    <DataGrid aria-label="Sales figures" rows={sales} columns={columns} cellSelection statusBar />
  );
}`,
  },
  {
    id: "sorting",
    title: "Change how columns sort",
    body: 'A click on a header goes through ascending, descending and not sorted. `sortingOrder` changes that cycle for every column, and a column\'s own `sortingOrder` for that column. For example, `["desc", "asc", null]` sorts the biggest values first, and a cycle without `null` never goes back to not sorted. The column menu only offers the directions of the cycle. A column\'s `sortComparator` compares two values in ascending order, and the grid reverses it for descending. `getSortComparator(direction)` returns a comparator per direction that the grid uses as it is, for example to keep empty values last in both directions. In HTML, write the cycle as JSON in `data-ok-sorting-order` on the grid or on a header, and set comparators with `setSortComparator(field, { sortComparator, getSortComparator })`. HTML comparators get the cells\' values as text. With `multipleColumnsSortingMode="always"`, every click adds the column to the sort, without Shift.',
    html: `${gridOf(sortingGroup)}
<script type="module">
  const grid = window.Owlky.get(document.getElementById("grid-sorting"), "data-grid");
  const rank = { High: 0, Medium: 1, Low: 2 };
  // Priorities sort by rank, not by name
  grid.setSortComparator("priority", {
    sortComparator: (a, b) => (rank[a] ?? 3) - (rank[b] ?? 3),
  });
  // Issues without a due date stay last in both directions
  grid.setSortComparator("due", {
    getSortComparator: (direction) => (a, b) => {
      if (!a || !b) return a === b ? 0 : a ? -1 : 1;
      return direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
    },
  });
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const issues = [
  { id: 1, title: "Fix the login form", priority: "High", due: "2025-05-14", points: 3 },
  { id: 2, title: "Update the docs", priority: "Low", due: null, points: 2 },
  { id: 3, title: "Add dark mode", priority: "Medium", due: "2025-06-02", points: 8 },
];

const rank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

const columns: GridColDef<(typeof issues)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1 },
  {
    field: "priority",
    headerName: "Priority",
    // Priorities sort by rank, not by name
    sortComparator: (a, b) => (rank[String(a)] ?? 3) - (rank[String(b)] ?? 3),
  },
  {
    field: "due",
    headerName: "Due",
    // Issues without a due date stay last in both directions
    getSortComparator: (direction) => (a, b) => {
      if (!a || !b) return a === b ? 0 : a ? -1 : 1;
      const order = String(a).localeCompare(String(b));
      return direction === "asc" ? order : -order;
    },
  },
  // The biggest issues first
  { field: "points", headerName: "Points", type: "number", sortingOrder: ["desc", "asc", null] },
];

export function Issues() {
  return (
    <DataGrid
      aria-label="Issues"
      rows={issues}
      columns={columns}
      multipleColumnsSortingMode="always"
    />
  );
}`,
  },
  {
    id: "footer",
    title: "Change the footer and the Tab key",
    body: 'The footer shows "2 rows selected" while rows are selected, and the pagination. With `hideFooterPagination`, every row shows on one page and the footer shows the row count instead, such as "Total Rows: 6" ("Total Rows: 2 of 6" while filters hide rows). `hideFooterSelectedRowCount` and `hideFooterRowCount` hide the counts. `label` names the grid and shows at the start of the toolbar. By default, Tab moves into and out of the grid in one stop. `tabNavigation` makes Tab move from cell to cell: `content` through the body cells, `header` through the column headers and `all` through both. Tab past the last cell leaves the grid. In HTML, the grid writes both counts itself. Write the label in `span[data-ok-data-grid-toolbar-label]` at the start of the toolbar and in `aria-label` on the grid.',
    html: `${gridOf(footerGroup)}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const issues = [
  { id: 1, title: "Fix the login form", priority: "High", points: 3 },
  { id: 2, title: "Update the docs", priority: "Low", points: 2 },
  { id: 3, title: "Add dark mode", priority: "Medium", points: 8 },
];

const columns: GridColDef<(typeof issues)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1 },
  { field: "priority", headerName: "Priority" },
  { field: "points", headerName: "Points", type: "number" },
];

export function Issues() {
  return (
    <DataGrid
      label="Issues"
      rows={issues}
      columns={columns}
      showToolbar
      checkboxSelection
      // Every row on one page, with "Total Rows: 3" in the footer
      hideFooterPagination
      // Tab moves through the headers and the cells
      tabNavigation="all"
    />
  );
}`,
  },
  {
    id: "set-filter",
    title: "Filter with a checklist of values",
    body: 'A column with `filterVariant: "set"` filters with a checklist of its values, like a spreadsheet. It works for text, number and single select columns. The list holds each value of the column once, in the column\'s order, with a search field and **Select all**. **Select all** checks the values the search shows, or clears them when they\'re all checked. The checked values make an `isAnyOf` filter item, so the filter model stays the same as with the other operators: `{ field, operator: "isAnyOf", value: ["High", "Low"] }`. Clear every value to remove the filter. With `headerFilters`, the header filter is a button that shows the choice, such as "2 selected", and opens the checklist. In the filter panel, the checklist takes the value field\'s place while the operator is "is any of". In HTML, write `data-ok-filter-variant="set"` on the header cell. The grid copies the first checklist of the markup, such as a header filter\'s, for the panel.',
    html: `${gridOf(setGroup)}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const issues = [
  { id: 1, title: "Fix the login form", priority: "High", points: 3 },
  { id: 2, title: "Update the docs", priority: "Low", points: 2 },
  { id: 3, title: "Add dark mode", priority: "Medium", points: 8 },
];

const columns: GridColDef<(typeof issues)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1 },
  // A checklist of the priorities and of the points
  { field: "priority", headerName: "Priority", width: 200, filterVariant: "set" },
  { field: "points", headerName: "Points", type: "number", width: 200, filterVariant: "set" },
];

export function Issues() {
  return <DataGrid aria-label="Issues" rows={issues} columns={columns} showToolbar headerFilters />;
}`,
  },
  {
    id: "context-menu",
    title: "Open a menu on a cell",
    body: "Set `contextMenu` to give the cells a menu, like a spreadsheet. A right click opens it at the pointer. On the keyboard, press Shift + F10 or the Menu key on the focused cell. The menu offers **Copy** and **Paste**, **Export** (CSV, Excel and Print), **Chart from selection** with `cellSelection` and `chartsIntegration`, and **Pin column**. Items that the grid's options turn off are left out: **Paste** needs editable columns, and **Pin column** needs column pinning. With cell selection, a right click on a cell outside the selection selects that cell first. **Copy** copies what Ctrl + C copies: the selected cells, else the selected rows, else the cell. **Paste** reads the clipboard, so the browser may ask the person first. If it can't read it, the grid tells screen reader users to press Ctrl + V instead. Escape or a choice closes the menu and puts the focus back on the cell. Headers and fields being edited keep the browser's own menu. In React, `getContextMenuItems` returns the items for each cell: built-in names such as `\"copy\"`, `\"separator\"` for a line, and your own items with a `name`, a `label` and an `onClick` that gets the cell. In HTML, add `data-ok-context-menu` to the grid and your own items to the menu's markup, or add them in the cancelable `ok:data-grid:contextmenu` event, which gets the cell and the menu. `ok:data-grid:contextmenuselect` reports each choice.",
    html: `${gridOf(contextGroup)}
<script type="module">
  const element = document.getElementById("grid-context");
  // Add an item for the cell the menu opens on
  element.addEventListener("ok:data-grid:contextmenu", (event) => {
    const { menu } = event.detail;
    if (menu.querySelector('[data-ok-data-grid-context-action="details"]')) return;
    const item = document.createElement("li");
    item.setAttribute("role", "menuitem");
    item.setAttribute("tabindex", "-1");
    item.setAttribute("data-ok-menu-item", "");
    item.setAttribute("data-ok-data-grid-context-action", "details");
    item.textContent = "Show details";
    menu.append(item);
  });
  element.addEventListener("ok:data-grid:contextmenuselect", (event) => {
    if (event.detail.action === "details") console.log("Details of row", event.detail.id);
  });
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const issues = [
  { id: 1, title: "Fix the login form", priority: "High", points: 3 },
  { id: 2, title: "Update the docs", priority: "Low", points: 2 },
  { id: 3, title: "Add dark mode", priority: "Medium", points: 8 },
];

const columns: GridColDef<(typeof issues)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1, editable: true },
  { field: "priority", headerName: "Priority", width: 140 },
  { field: "points", headerName: "Points", type: "number", width: 110, editable: true },
];

export function Issues() {
  return (
    <DataGrid
      aria-label="Issues"
      rows={issues}
      columns={columns}
      contextMenu
      cellSelection
      getContextMenuItems={({ defaultItems }) => [
        ...defaultItems,
        "separator",
        // Your own item gets the cell it opened on
        { name: "details", label: "Show details", onClick: ({ row }) => console.log(row.title) },
      ]}
    />
  );
}`,
  },
  {
    id: "filter-groups",
    title: "Group filters with And and Or",
    body: "Set `filterGroups` to let people group filters in the filter panel, such as (Priority is High or Priority is Medium) and Points is more than 2. **Add group** adds a group with one filter, in the panel or inside another group. Each group has its own **Logic operator**: its filters and groups must all match (And), or any of them (Or). The group's place among its neighbours shows the operator that joins them. The remove button of a group removes it with everything in it, and a group whose last filter you remove goes away. Filters without a value don't count, so an empty filter never makes an Or match every row. The filter model keeps the groups in `groups`, nested up to eight levels, each with its own `items` and `logicOperator`. It's plain JSON, so you can store it with `exportState()` and apply it again with `restoreState()` or `filterModel`. Each group is a named group for screen readers, such as \"Filter group 1.2\", and every field in it is a native control. In HTML, add `data-ok-filter-groups` to the grid. The `ok:data-grid:filter` event carries the groups.",
    html: `${gridOf(filtersGroup)}`,
    react: `import { DataGrid, type GridColDef, type GridFilterModel } from "@owlky/react";

const issues = [
  { id: 1, title: "Fix the login form", priority: "High", points: 3 },
  { id: 2, title: "Update the docs", priority: "Low", points: 2 },
  { id: 3, title: "Add dark mode", priority: "Medium", points: 8 },
];

const columns: GridColDef<(typeof issues)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1 },
  { field: "priority", headerName: "Priority", width: 140 },
  { field: "points", headerName: "Points", type: "number", width: 110 },
];

// (Priority is High or Medium) and more than 2 points
const filterModel: GridFilterModel = {
  items: [{ field: "points", operator: ">", value: "2" }],
  groups: [
    {
      logicOperator: "or",
      items: [
        { field: "priority", operator: "equals", value: "High" },
        { field: "priority", operator: "equals", value: "Medium" },
      ],
    },
  ],
};

export function Issues() {
  return (
    <DataGrid
      aria-label="Issues"
      rows={issues}
      columns={columns}
      showToolbar
      filterGroups
      initialState={{ filter: { filterModel } }}
    />
  );
}`,
  },
  {
    id: "generated-columns",
    title: "Generate the columns from the data",
    body: 'Leave `columns` out and the grid makes one column per field of the rows, in the order the fields first appear. Each column\'s type comes from its values: numbers make a `number` column, `true` and `false` a `boolean` column, dates or `YYYY-MM-DD` text a `date` column, dates with a time a `dateTime` column, and anything else a `string` column. Empty values don\'t count. Headers come from the field names in sentence case: `releaseDate` becomes "Release date" and `id` becomes "ID". The columns share the width and are at least 120px wide. They sort, filter, hide and export like any column. With `autoGenerate`, an empty `columns` array generates them too. Columns you give always win. The grid looks at the first 200 rows. In HTML, add `data-ok-auto-generate` to a grid without columns and put the data in a `<table data-ok-data-grid-data>` inside it: a header cell per field, then one row per data row. The script reads the text of the cells ("42" is a number, "true" a boolean), builds the headers, the rows and the panels\' lists, and removes the table. To name a column yourself, write the field in the header cell\'s `data-ok-field` and the header as its text. A field named `id` gives the rows their ids. Without one, the rows are numbered from 1.',
    html: gridElement(autoGroup),
    react: `import { DataGrid } from "@owlky/react";

const releases = [
  { id: 1, name: "Alpha", downloads: 120, stable: false, releaseDate: "2025-01-15" },
  { id: 2, name: "Beta", downloads: 860, stable: false, releaseDate: "2025-03-02" },
  { id: 3, name: "First release", downloads: 4210, stable: true, releaseDate: "2025-05-20" },
];

export function Releases() {
  // No columns: ID and Downloads are numbers, Stable a boolean, Release date a date
  return <DataGrid aria-label="Releases" rows={releases} showToolbar />;
}`,
  },
  {
    id: "selection-propagation",
    title: "Select parents and children together",
    body: 'With tree data or grouped rows and `checkboxSelection`, a selection reaches related rows. Selecting a parent selects its children, and selecting all children selects the parent. A parent with only some selected children shows a mixed checkbox. Each group row of grouped rows gets a checkbox that selects its rows. Group rows never enter the selection model: their checkbox shows the state of their rows. `rowSelectionPropagation` turns each direction on or off: `{ descendants: true, parents: false }` keeps parents out. Only rows that pass the filters follow. `checkboxColDef` sets the checkbox column\'s `width`, `headerClassName` and `cellClassName`. `rowSelection={false}` turns selection off, so no checkboxes show and clicks select nothing. In HTML, write the propagation as JSON in `data-ok-row-selection-propagation` and `data-ok-row-selection="false"` to turn selection off.',
    html: `${gridOf(selectionTree)}
${gridOf(selectionGroups)}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const work = [
  { id: "design", path: ["Design"], name: "Design", points: 13 },
  { id: "icons", path: ["Design", "Icons"], name: "Icons", points: 5 },
  { id: "colors", path: ["Design", "Colors"], name: "Colors", points: 8 },
];

const columns: GridColDef<(typeof work)[number]>[] = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "points", headerName: "Points", type: "number" },
];

export function WorkBreakdown() {
  return (
    <DataGrid
      aria-label="Work breakdown"
      rows={work}
      columns={columns}
      treeData
      getTreeDataPath={(row) => row.path}
      defaultGroupingExpansionDepth={-1}
      checkboxSelection
      // Children follow their parent; parents stay as they are
      rowSelectionPropagation={{ descendants: true, parents: false }}
      checkboxColDef={{ width: 60 }}
    />
  );
}`,
  },
  {
    id: "column-options",
    title: "Set options per column",
    body: 'Each column can turn grid features off for itself. `hideSortIcons` hides the sort arrow, while the header still sorts. `disableColumnMenu` removes the column\'s menu. `disableReorder` keeps the column in its place: it doesn\'t drag, and other columns can\'t move past it. `disableExport` leaves it out of the CSV, Excel and print exports. `pinnable: false` hides the pin items of its menu. `cellClassName` and `headerClassName` add class names, as a string or from a function, so your CSS can style a column or single cells. `rowHeader: true` makes the column\'s cells row headers (`role="rowheader"`), so screen readers announce them with the other cells of the row. `display: "flex"` lays out cell content in a row, centered. With `rowSpanning`, `rowSpanValueGetter` returns the value that neighbouring cells compare to merge, such as the owner within a team. `pastedValueParser` turns pasted text into the cell\'s value. In HTML, write `data-ok-disable-reorder`, `data-ok-disable-export` and `data-ok-pinnable="false"` on the header, leave out the sort icon or the menu button, and write `role="rowheader"`, `class`, `data-ok-display` and `data-ok-row-span-value` on the cells. Set a paste parser with `setPastedValueParser(field, parser)`.',
    html: `${gridOf(columnsGroup)}
<script type="module">
  const grid = window.Owlky.get(document.getElementById("grid-columns"), "data-grid");
  // Pasted points such as "5 pts" become numbers
  grid.setPastedValueParser("points", (text) => Number.parseInt(text, 10));
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const tasks = [
  { id: 1, task: "Plan the sprint", team: "Core", owner: "Ana", points: 3, due: "2025-05-12" },
  { id: 2, task: "Fix the build", team: "Core", owner: "Ana", points: 5, due: "2025-05-14" },
  { id: 3, task: "Write the guide", team: "Docs", owner: "Ana", points: 2, due: "2025-05-16" },
];

const columns: GridColDef<(typeof tasks)[number]>[] = [
  // Row headers name their row; this column stays first and has no menu
  {
    field: "task",
    headerName: "Task",
    flex: 1,
    rowHeader: true,
    disableReorder: true,
    disableColumnMenu: true,
  },
  { field: "team", headerName: "Team", pinnable: false },
  {
    field: "owner",
    headerName: "Owner",
    // Owners merge within a team only
    rowSpanValueGetter: (value, row) => \`\${row.team}/\${String(value)}\`,
  },
  {
    field: "points",
    headerName: "Points",
    type: "number",
    hideSortIcons: true,
    // Big tasks get a class name of their own
    cellClassName: ({ value }) => (Number(value) >= 5 ? "big-task" : ""),
    // Pasted points such as "5 pts" become numbers
    pastedValueParser: (text) => Number.parseInt(text, 10),
  },
  // Left out of the CSV, Excel and print exports
  { field: "due", headerName: "Due", disableExport: true },
];

export function TeamTasks() {
  return <DataGrid aria-label="Team tasks" rows={tasks} columns={columns} rowSpanning showToolbar />;
}`,
  },
  {
    id: "dimensions",
    title: "Size the headers and draw cell borders",
    body: "`columnHeaderHeight` sets the height of the column headers, `columnGroupHeaderHeight` the height of the column group rows and `headerFilterHeight` the height of the header filter row, in pixels. The density scales them, like the rows: compact by 0.7 and comfortable by 1.3. The header filter row takes the column headers' height unless it has its own. `showCellVerticalBorder` draws a line between the cells and `showColumnVerticalBorder` between the column headers. `getRowSpacing` adds space above and below rows. By default, the space is a margin outside the row. With `rowSpacingType=\"border\"`, the space is inside the row, so the hover and selection colors cover it. `autoHeight` makes the grid grow with its rows instead of scrolling, so don't give it a height. In HTML, write the same options as attributes, and the spacing of each row in `data-ok-spacing-top` and `data-ok-spacing-bottom`.",
    html: `${gridOf(dimensionsBorders)}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const issues = [
  { id: 1, title: "Fix the login form", priority: "High", points: 3 },
  { id: 2, title: "Update the docs", priority: "Low", points: 2 },
  { id: 3, title: "Add dark mode", priority: "Medium", points: 8 },
];

const columns: GridColDef<(typeof issues)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1 },
  { field: "priority", headerName: "Priority" },
  { field: "points", headerName: "Points", type: "number" },
];

export function Issues() {
  return (
    <DataGrid
      aria-label="Issues"
      rows={issues}
      columns={columns}
      columnGroupingModel={[
        { groupId: "work", headerName: "Work", children: [{ field: "priority" }, { field: "points" }] },
      ]}
      columnHeaderHeight={44}
      columnGroupHeaderHeight={36}
      showCellVerticalBorder
      showColumnVerticalBorder
      // 4 pixels above and below each row, inside the row
      getRowSpacing={() => ({ top: 4, bottom: 4 })}
      rowSpacingType="border"
      autoHeight
      hideFooter
    />
  );
}`,
  },
  {
    id: "auto-page-size",
    title: "Fit the page size to the height",
    body: "With `autoPageSize`, each page holds as many rows as the grid's height shows without scrolling, and the footer drops its rows per page menu. The grid needs a height of its own, for example from a flex layout or a CSS `height`. It measures again when it's resized or its density changes, and keeps the current page when it can. `onPaginationModelChange` reports each new page size.",
    html: `${gridOf(dimensionsPages)}`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const tasks = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  title: \`Task \${i + 1}\`,
  priority: ["High", "Medium", "Low"][i % 3],
  points: (i % 5) + 1,
}));

const columns: GridColDef<(typeof tasks)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1 },
  { field: "priority", headerName: "Priority" },
  { field: "points", headerName: "Points", type: "number" },
];

export function Tasks() {
  return (
    // The grid needs a height: the page size follows it
    <DataGrid aria-label="Tasks" rows={tasks} columns={columns} autoPageSize style={{ height: 520 }} />
  );
}`,
  },
  {
    id: "fill-handle",
    title: "Fill cells by dragging",
    body: "With `cellSelection` and `cellSelectionFillHandle`, a small square shows at the bottom end corner of the selected cells. Drag it down, up, right or left: the selection repeats into the cells it passes, and the selection grows over them. From the keyboard, select the cells with Shift + arrows, then press Ctrl + D (Cmd + D on a Mac) to copy the first row into the others, or Ctrl + R (Cmd + R) to copy the first column. With one row selected, Ctrl + D copies the row above it. A cell in the same column gets the value itself; a cell in another column gets the text, read the way a paste reads it. Each changed row goes through `processRowUpdate`, and the whole fill is one undo step. Only editable cells change. In HTML, the cancelable `ok:data-grid:fill` reports the cells first, then each row fires `ok:data-grid:edit`.",
    html: `<!-- The grid's data-ok-cell-selection and data-ok-cell-selection-fill-handle -->
${gridOf(cellsGroup, { attrs: "data-ok-cell-selection-fill-handle" })}
<script>
  const grid = document.getElementById("grid-cells");
  grid.addEventListener("ok:data-grid:fill", (event) => {
    console.log("Cells to fill:", event.detail.cells.length);
  });
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";
import { useState } from "react";

type Task = { id: number; title: string; owner: string; points: number };

const initialTasks: Task[] = [
  { id: 1, title: "Fix the login form", owner: "Ana", points: 3 },
  { id: 2, title: "Update the docs", owner: "", points: 0 },
  { id: 3, title: "Add dark mode", owner: "", points: 0 },
];

const columns: GridColDef<Task>[] = [
  { field: "title", headerName: "Title", flex: 1 },
  { field: "owner", headerName: "Owner", editable: true },
  { field: "points", headerName: "Points", type: "number", editable: true },
];

export function Tasks() {
  const [tasks, setTasks] = useState(initialTasks);
  return (
    <DataGrid
      aria-label="Tasks"
      rows={tasks}
      columns={columns}
      cellSelection
      cellSelectionFillHandle
      processRowUpdate={(row) => {
        setTasks((current) => current.map((task) => (task.id === row.id ? row : task)));
        return row;
      }}
    />
  );
}`,
  },
  {
    id: "reorder-tree",
    title: "Reorder tree rows and pinned edges",
    body: "With `treeData` and `rowReordering`, a row moves with its children. Drag its handle above or below another row, or press Alt + Up or Alt + Down on the handle. The row joins the siblings of the row it lands next to. To let rows change parent, pass `setTreeDataPath`: the grid gives it the new path and saves each moved row through `processRowUpdate`. `isRowReorderable` keeps some rows in place (their handle goes away), and `isValidRowReorder` refuses some places. `pinnedColumnsSectionSeparator` and `pinnedRowsSectionSeparator` draw the edge of pinned columns and rows as a line (the default), a shadow, or both. `disableAutosize` turns off the double click on a column's edge. In HTML, tree rows change parent through `data-ok-parent`, and the cancelable `ok:data-grid:roworder` reports `detail.oldParentId` and `detail.parentId`.",
    html: `<!-- Rows with a reorder handle; the edge of pinned columns casts a shadow -->
${gridOf(orderingGroup, { attrs: 'data-ok-pinned-columns-section-separator="border-and-shadow"' })}
<script>
  const grid = document.getElementById("grid-agenda");
  grid.addEventListener("ok:data-grid:roworder", (event) => {
    // Tree rows report their old and new parent; this keeps rows out of the first place
    if (event.detail.targetIndex === 0) event.preventDefault();
  });
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";
import { useState } from "react";

type File = { id: string; path: string[]; size: number };

const initialFiles: File[] = [
  { id: "docs", path: ["docs"], size: 0 },
  { id: "intro", path: ["docs", "intro.md"], size: 12 },
  { id: "src", path: ["src"], size: 0 },
  { id: "main", path: ["src", "main.ts"], size: 40 },
];

const columns: GridColDef<File>[] = [{ field: "size", headerName: "Size (kB)", type: "number" }];

export function Files() {
  const [files, setFiles] = useState(initialFiles);
  return (
    <DataGrid
      aria-label="Files"
      rows={files}
      columns={columns}
      treeData
      getTreeDataPath={(row) => row.path}
      setTreeDataPath={(path, row) => ({ ...row, path })}
      defaultGroupingExpansionDepth={-1}
      rowReordering
      // Folders stay where they are
      isRowReorderable={({ row }) => row.size > 0}
      processRowUpdate={(row) => {
        setFiles((current) => current.map((file) => (file.id === row.id ? row : file)));
        return row;
      }}
      pinnedColumnsSectionSeparator="border-and-shadow"
    />
  );
}`,
  },
  {
    id: "unknown-row-count",
    title: "Page through rows of unknown length",
    body: 'When the server doesn\'t know the total, set `rowCount={-1}`. The pagination shows "1–25 of more than 25", and the next page stays available. `estimatedRowCount` shows "1–25 of around 500" instead, for as long as the estimate is ahead of the page. Pass `paginationMeta={{ hasNextPage: false }}` on the last page: the grid then fixes the total at the rows seen so far and turns the next page off. A data source can return `pageInfo: { hasNextPage }` in place of `rowCount`, and `onPaginationMetaChange` reports it. `onRowCountChange` reports each new count. `filterDebounceMs` and `columnFilterDebounceMs` make the quick filter, the filter panel and the header filters wait after each keystroke before they ask for rows. The field shows what people type at once. With tree data, `disableChildrenFiltering` and `disableChildrenSorting` limit filtering and sorting to the top-level rows.',
    html: `<!-- An unknown total: the grid's data-ok-pagination-mode="server" and data-ok-row-count="-1" -->
${gridOf(serverGroup, { attrs: 'data-ok-pagination-mode="server" data-ok-row-count="-1" data-ok-estimated-row-count="500"' })}
<script>
  const grid = document.getElementById("grid-server");
  grid.addEventListener("ok:data-grid:rowcountchange", (event) => {
    console.log("Row count:", event.detail.count);
  });
  // On the last page, tell the grid that no page follows
  grid.setAttribute("data-ok-has-next-page", "false");
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";
import { useState } from "react";

const allIssues = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  title: \`Issue \${i + 1}\`,
}));

const columns: GridColDef<(typeof allIssues)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1 },
];

export function Issues() {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const start = paginationModel.page * paginationModel.pageSize;
  const rows = allIssues.slice(start, start + paginationModel.pageSize);
  return (
    <DataGrid
      aria-label="Issues"
      rows={rows}
      columns={columns}
      paginationMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
      rowCount={-1}
      estimatedRowCount={500}
      paginationMeta={{ hasNextPage: start + paginationModel.pageSize < allIssues.length }}
    />
  );
}`,
  },
  {
    id: "listen",
    title: "Listen to the grid",
    body: "The grid reports what happens around its cells. Column headers report double clicks, right clicks and the pointer moving over them. Menus and panels report opening and closing, however they opened: the column menu, **Density**, **Export** and the cell menu as menus, **Columns** and **Filters** as preference panels, **Pivot** and **Chart** as sidebars. `onResize` reports the size of the grid, and `onColumnResize` reports each width while a column's edge is dragged. `onColumnWidthChange` still reports the width on release. `onBeforeClipboardPasteStart` runs before a paste writes any cell. Throw or return a promise that rejects to cancel the paste, for example after a confirmation. In HTML, these are events on the grid, and a listener passes a promise to `detail.waitUntil` to make a paste wait.",
    html: `${gridOf(filtersGroup)}
<script>
  const grid = document.getElementById("grid-filters");
  grid.addEventListener("ok:data-grid:menuopen", (event) => {
    console.log("Menu opened:", event.detail.menu);
  });
  grid.addEventListener("ok:data-grid:preferencepanelopen", (event) => {
    console.log("Panel opened:", event.detail.openedPanelValue);
  });
  grid.addEventListener("ok:data-grid:containerresize", (event) => {
    console.log("Grid size:", event.detail.width, event.detail.height);
  });
  grid.addEventListener("ok:data-grid:beforeclipboardpaste", (event) => {
    // Cancels the paste unless the visitor agrees
    if (!window.confirm("Paste these cells?")) event.preventDefault();
  });
</script>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const issues = [
  { id: 1, title: "Fix the login form", points: 3 },
  { id: 2, title: "Update the docs", points: 2 },
];

const columns: GridColDef<(typeof issues)[number]>[] = [
  { field: "title", headerName: "Title", flex: 1, editable: true },
  { field: "points", headerName: "Points", type: "number", editable: true },
];

export function Issues() {
  return (
    <DataGrid
      aria-label="Issues"
      rows={issues}
      columns={columns}
      showToolbar
      onMenuOpen={({ menu }) => console.log("Menu opened:", menu)}
      onPreferencePanelOpen={({ openedPanelValue }) =>
        console.log("Panel opened:", openedPanelValue)
      }
      onResize={({ width, height }) => console.log("Grid size:", width, height)}
      onBeforeClipboardPasteStart={() => {
        // Throwing cancels the paste
        if (!window.confirm("Paste these cells?")) throw new Error("Canceled");
      }}
    />
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props carry the data and the state. In HTML, the data is the markup and the state lives in the page.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:data-grid:sort\`**, **\`ok:data-grid:filter\`**, **\`ok:data-grid:selection\`**, **\`ok:data-grid:columns\`**, **\`ok:data-grid:density\`**, **\`ok:data-grid:order\`** and **\`ok:data-grid:pinned\`** fire on the grid with the new model in \`detail.model\`. They're cancelable.
- **\`ok:data-grid:resize\`** reports \`detail.field\` and \`detail.width\`. **\`ok:data-grid:edit\`** reports \`detail.id\` and the edited values in \`detail.row\`, and is cancelable.
- **Instance:** \`runtime.get(element, "data-grid")\` returns \`{ sortModel, filterModel, selection, columnVisibilityModel, columnOrder, pinnedColumns, columnWidths }\` with a setter for each (\`setSortModel(model)\`, \`setColumnWidth(field, width)\` and so on; setters fire no events), \`toCsv()\`, \`exportCsv()\`, \`setRows(rows)\` and \`setDataSource(source)\` (\`null\` stops it).
- **\`ok:data-grid:rowclick\`**, **\`ok:data-grid:rowdoubleclick\`**, **\`ok:data-grid:cellclick\`**, **\`ok:data-grid:celldoubleclick\`** and **\`ok:data-grid:columnheaderclick\`** report the row id, the field and the value. **\`ok:data-grid:editstart\`** and **\`ok:data-grid:editstop\`** report the cell and the reason. **\`ok:data-grid:validate\`** asks for an error in \`detail.error\`.
- **\`ok:data-grid:expand\`**, **\`ok:data-grid:detailpanel\`** and **\`ok:data-grid:roworder\`** report a row opening, a panel opening and a row moving. They're cancelable. \`setRowChildrenExpansion(id, open)\` and \`toggleDetailPanel(id)\` do the same from code.
- **More methods:** \`print(options)\`, \`autosizeColumns(options)\`, \`scrollToIndexes({ rowIndex, colIndex })\`, \`exportState()\`, \`restoreState(state)\`, \`setFilterOperators(field, operators)\`, \`setSortComparator(field, comparators)\`, \`setValueFormatter(field, format)\`, \`setGroupingValueGetter(field, getter)\`, \`setPivotDerivedColumns(getter)\` and \`setLocaleText(labels)\`. \`toCsv\` and \`exportCsv\` take CSV options.
- **\`ok:data-grid:rowgrouping\`**, **\`ok:data-grid:aggregation\`**, **\`ok:data-grid:cellselection\`** and **\`ok:data-grid:chart\`** fire with the new model in \`detail.model\`. **\`ok:data-grid:pivot\`** reports \`detail.model\` and \`detail.active\`. **\`ok:data-grid:activechart\`** reports the chart the panel switches to in \`detail.id\`. They're cancelable. **\`ok:data-grid:clipboardcopy\`** reports the copied text in \`detail.data\`, and the cancelable **\`ok:data-grid:clipboardpaste\`** the pasted cells. The instance has \`rowGroupingModel\`, \`aggregationModel\`, \`pivotModel\`, \`pivotActive\`, \`cellSelectionModel\` and \`chartModel\` with their setters, \`toExcel(options)\` and \`exportExcel(options)\`.
- **\`ok:data-grid:undo\`** and **\`ok:data-grid:redo\`** report the ids of the rows an undo or a redo changed, in \`detail.ids\`. The instance's \`history\` has \`undo()\`, \`redo()\`, \`canUndo()\`, \`canRedo()\` and \`clear()\`.
- **\`ok:data-grid:cellmodes\`** and **\`ok:data-grid:rowmodes\`** fire when people start or stop editing, with the next modes model in \`detail.model\`. They're cancelable. The instance has \`cellModesModel\` and \`rowModesModel\` with their setters, and \`setEditCellValue({ id, field, value })\`.
- **\`ok:data-grid:columnheaderdoubleclick\`**, **\`ok:data-grid:columnheadercontextmenu\`** (cancelable: \`preventDefault()\` closes the browser's menu), **\`ok:data-grid:columnheaderenter\`**, **\`ok:data-grid:columnheaderleave\`**, **\`ok:data-grid:columnheaderover\`** and **\`ok:data-grid:columnheaderout\`** report \`detail.field\`.
- **\`ok:data-grid:menuopen\`** and **\`ok:data-grid:menuclose\`** report \`detail.menu\` and \`detail.target\`. **\`ok:data-grid:preferencepanelopen\`** and **\`ok:data-grid:preferencepanelclose\`** report \`detail.openedPanelValue\`. **\`ok:data-grid:sidebaropen\`** and **\`ok:data-grid:sidebarclose\`** report \`detail.value\`.
- **\`ok:data-grid:containerresize\`** reports the grid's \`detail.width\` and \`detail.height\`. **\`ok:data-grid:columnresize\`** reports \`detail.field\` and \`detail.width\` while an edge is dragged.
- **\`ok:data-grid:fetchrows\`** reports \`detail.firstRowToRender\` and \`detail.lastRowToRender\` when the rendered rows change and \`data-ok-row-count\` is more than the rows in the grid. **\`ok:data-grid:excelexportstate\`** reports \`detail.state\`, \`pending\` then \`finished\`. **\`ok:data-grid:beforeclipboardpaste\`** is cancelable and takes a promise in \`detail.waitUntil(promise)\`.
- **\`ok:data-grid:statechange\`** reports \`exportState()\` in \`detail.state\` once a change has settled: once per change, and after a drag ends.
- **\`ok:data-grid:fill\`** reports the cells the fill handle (or Ctrl + D, Ctrl + R) is about to write, each with the cell it repeats, in \`detail.cells\`. It's cancelable.
- **\`ok:data-grid:roworder\`** also reports \`detail.oldParentId\` and \`detail.parentId\` for tree rows. \`setPivotingColDef(def)\` changes the pivot's columns (\`headerName\`, \`width\`, \`minWidth\`, \`maxWidth\`, \`align\`, \`headerAlign\`), and \`data-ok-pivot-panel-open\` opens the pivot panel.
- **\`ok:data-grid:rowcountchange\`** reports \`detail.count\`, and **\`ok:data-grid:paginationmetachange\`** reports a data source's \`detail.hasNextPage\`. \`setDataSource(source, { cache })\` replaces the cache of responses (\`null\` turns it off).
- **\`ok:data-grid:scrollend\`** reports \`detail.visibleRowsCount\` when people scroll to the end of the rows. **\`ok:data-grid:datasourceerror\`** reports \`detail.error\` when a data source fails.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The grid is one Tab stop. Arrow keys move between the header and the cells.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Give the grid a name with \`label\`, \`aria-label\` or \`aria-labelledby\`.
- Sortable headers carry \`aria-sort\`, selected rows \`aria-selected\`, and the grid tells its full row and column count.
- Buttons and checkboxes inside cells take part in the arrow-key navigation. Name them, such as "Edit Ana Silva".
- The menu button of each column appears on hover and focus, and always on touch screens.
- Merged cells report their span with \`aria-colspan\` and \`aria-rowspan\`. The cells they cover are hidden from assistive technologies, and the arrow keys skip them.
- An invalid edit sets \`aria-invalid\` on the field, and its message is announced and linked to the field with \`aria-describedby\`.
- Header descriptions describe their header. With the icon toolbar, each button is named by its tooltip.
- Group rows are tree rows: \`aria-level\`, \`aria-expanded\` and their position among their siblings. The grid is a \`treegrid\` while rows are grouped.
- Selected cells carry \`aria-selected\`. Header filter cells are named after their column, such as "Name filter".
- The status bar of the selected cells is a polite live region (\`role="status"\`). It changes only when its figures change.
- While rows load, the grid sets \`aria-busy\` and the loading overlay is a \`status\` named "Loading". The grid keeps the full row count and each row's index, also when only some rows are in the page.`,
  },
  apiReferenceSection(dataGridApi),
];

const PREVIEWS = {
  options: () => <OptionsTable schema={dataGridOptions} />,
  props: () => (
    <PropsTable
      label="Data grid props"
      rows={[
        {
          react: "rows / getRowId",
          html: "div[role=row][data-ok-row-id]",
          type: "R[]",
          description: "The data, one row per item.",
        },
        {
          react: "columns",
          html: "div[role=columnheader][data-ok-field]",
          type: "GridColDef[]",
          description: "The columns: field, header, type, width, values and cells.",
        },
        {
          react: "sortModel / onSortModelChange",
          html: "aria-sort · ok:data-grid:sort",
          type: "GridSortModel",
          description: "Sorted columns, in order.",
        },
        {
          react: "columns left out · autoGenerate",
          html: "data-ok-auto-generate · table[data-ok-data-grid-data]",
          type: "boolean",
          description: "Columns made from the rows' fields, typed from their values.",
        },
        {
          react: "contextMenu · getContextMenuItems",
          html: "data-ok-context-menu · ok:data-grid:contextmenu · contextmenuselect",
          type: "(params) => (name | GridContextMenuItemDef)[]",
          description: "A menu on the cells (right click, Shift + F10, Menu key) and its items.",
        },
        {
          react: "filterGroups · filterModel.groups",
          html: "data-ok-filter-groups",
          type: "GridFilterGroup[]",
          description: "Nested groups of filters, each with its own And / Or.",
        },
        {
          react: "filterModel / onFilterModelChange",
          html: "ok:data-grid:filter",
          type: "GridFilterModel",
          description: "The filter and the search words.",
        },
        {
          react: "sortingOrder · sortComparator · getSortComparator (column)",
          html: "data-ok-sorting-order · setSortComparator()",
          type: "(asc | desc | null)[] · (a, b, params1, params2) => number",
          description: "The sort cycle of a header, and a column's own comparison.",
        },
        {
          react: "paginationModel / pageSizeOptions",
          html: "TablePagination in the footer",
          type: "{ page, pageSize }",
          description: "The page and the rows per page.",
        },
        {
          react: "rowSelectionModel",
          html: "aria-selected · ok:data-grid:selection",
          type: "string[]",
          description: "Selected row ids.",
        },
        {
          react: "columnVisibilityModel",
          html: "hidden cells · ok:data-grid:columns",
          type: "Record<string, boolean>",
          description: "Hidden columns are false.",
        },
        {
          react: "columnOrder / onColumnOrderChange",
          html: "header order · ok:data-grid:order",
          type: "string[]",
          description: "The order of the columns (fields).",
        },
        {
          react: "pinnedColumns / onPinnedColumnsChange",
          html: "data-ok-pinned · ok:data-grid:pinned",
          type: "{ left, right }",
          description: "Columns that stay in view at each side.",
        },
        {
          react: "onColumnWidthChange · initialState.columns.dimensions",
          html: "ok:data-grid:resize",
          type: "(field, width) => void",
          description: "Widths set by resizing, in pixels.",
        },
        {
          react: "editMode · processRowUpdate · onProcessRowUpdateError",
          html: "data-ok-edit-mode · ok:data-grid:edit",
          type: "cell | row",
          description: "How editable cells open, and how edits are saved or refused.",
        },
        {
          react: "loading · onRowsScrollEnd",
          html: "data-ok-loading · ok:data-grid:scrollend",
          type: "boolean · ({ visibleRowsCount }) => void",
          description: "Progress while rows load, and the end of the rows for loading more.",
        },
        {
          react: "dataSource · dataSourceCache · onDataSourceError",
          html: "setDataSource() · ok:data-grid:datasourceerror",
          type: "{ getRows(params) }",
          description: "Rows from a server for the current sort, filter and page, with a cache.",
        },
        {
          react: "rows (any items)",
          html: "setRows() · <template data-ok-data-grid-row>",
          type: "R[]",
          description: "Rows built from data in HTML, as text.",
        },
        {
          react: "isRowSelectable",
          html: "data-ok-selectable on rows",
          type: "({ id, row }) => boolean",
          description: "Rows that can be selected.",
        },
        {
          react: "colSpan (column) · getRowHeight · getRowSpacing",
          html: "aria-colspan · data-ok-row-height · data-ok-spacing-*",
          type: "number · px | auto · { top, bottom }",
          description: "Cells that span columns, row heights and space between rows.",
        },
        {
          react: "description · renderHeader (column)",
          html: "a Tooltip on the header",
          type: "string · () => ReactNode",
          description: "The header's tooltip and custom header content.",
        },
        {
          react: "getRowClassName · getCellClassName",
          html: "class in the markup",
          type: "(params) => string",
          description: "Classes for your own styles.",
        },
        {
          react: "onRowClick · onCellClick · onColumnHeaderClick …",
          html: "ok:data-grid:rowclick · cellclick · columnheaderclick …",
          type: "(params, event) => void",
          description: "Clicks, double clicks and keys on rows, cells and headers.",
        },
        {
          react: "apiRef · useGridApiRef()",
          html: 'runtime.get(element, "data-grid")',
          type: "GridApi",
          description: "Methods: models, autosize, scrolling, state, CSV and print.",
        },
        {
          react: "isCellEditable · preProcessEditCellProps · valueParser · valueSetter",
          html: "data-ok-editable · ok:data-grid:validate",
          type: "functions",
          description: "Read-only cells, checks while typing, and how edits become values.",
        },
        {
          react: "historyStackSize · onUndo · onRedo · showHistoryControls",
          html: "data-ok-history-stack-size · ok:data-grid:undo · redo · data-ok-data-grid-history",
          type: "number · ({ ids }) => void · boolean",
          description: "Undo and redo of edits and pastes, and the toolbar's buttons.",
        },
        {
          react: "renderEditCell · renderHeaderFilter (column)",
          html: "template[data-ok-data-grid-edit-cell] · data-ok-filter-operator",
          type: "(params) => ReactNode",
          description: "Your own editor of a cell, and your own header filter field.",
        },
        {
          react: "cellModesModel · rowModesModel (+ on…Change)",
          html: "setCellModesModel() · setRowModesModel() · ok:data-grid:cellmodes · rowmodes",
          type: "{ [id]: { [field]: { mode } } } · { [id]: { mode } }",
          description: "Which cell or row is being edited, controlled.",
        },
        {
          react: "onCellEditStart · onCellEditStop · onRowEditStart · onRowEditStop",
          html: "ok:data-grid:editstart · editstop",
          type: "(params, reason) => void",
          description: "Editing started or stopped, and why.",
        },
        {
          react: "filterOperators · getApplyQuickFilterFn (column)",
          html: "setFilterOperators() · data-ok-searchable",
          type: "GridFilterOperator[] · null",
          description: "A column's filter operators, or leaving it out of the search.",
        },
        {
          react: "csvOptions · printOptions",
          html: "exportCsv(options) · print(options)",
          type: "object",
          description: "Delimiter, columns, header line, file name; printed parts.",
        },
        {
          react: "treeData · getTreeDataPath · groupingColDef",
          html: "aria-level · data-ok-parent · ok:data-grid:expand",
          type: "(row) => string[]",
          description: "Rows as a tree, and the group column.",
        },
        {
          react: "getDetailPanelContent · detailPanelExpandedRowIds",
          html: "template[data-ok-data-grid-detail]",
          type: "(params) => ReactNode",
          description: "Details under a row.",
        },
        {
          react: "rowReordering · onRowOrderChange · pinnedRows",
          html: "data-ok-row-reordering · ok:data-grid:roworder · pinned rowgroups",
          type: "boolean · { top, bottom }",
          description: "Rows people move, and rows that stay in view.",
        },
        {
          react: "columnGroupingModel · listViewColumn",
          html: "group header rows · data-ok-data-grid-list-cell",
          type: "GridColumnGroup[]",
          description: "Header groups, and the cell list view shows.",
        },
        {
          react: "rowGroupingModel · aggregationModel · aggregationFunctions",
          html: "data-ok-row-grouping-model · data-ok-aggregation-model",
          type: "string[] · Record<string, string>",
          description: "Fields that group the rows, and each field's function.",
        },
        {
          react: "pivotModel · pivotActive",
          html: "data-ok-pivot-model · data-ok-pivot-active",
          type: "{ rows, columns, values } · boolean",
          description: "The pivot, and whether it shows.",
        },
        {
          react: "cellSelectionModel · onClipboardCopy · processRowUpdate",
          html: "ok:data-grid:cellselection · clipboardcopy · edit",
          type: "Record<id, Record<field, true>>",
          description: "Selected cells, copied text and pasted rows.",
        },
        {
          react: "chartModel · excelOptions",
          html: "data-ok-chart-model · data-ok-excel-options",
          type: "{ type, dimension, values } · GridExcelOptions",
          description: "The chart of the rows, and the Excel file.",
        },
        {
          react: "apiRef createRangeChart() · chartsToJSON() · restoreCharts()",
          html: "createRangeChart() · chartsToJSON() · restoreCharts()",
          type: "GridRangeChartParams · GridChartsState",
          description: "A chart of the selected cells, and the charts' config as JSON.",
        },
        {
          react: "showToolbar · localeText · exportFileName",
          html: "the toolbar markup",
          type: "—",
          description: "Toolbar, labels and the CSV file name.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves into or out of the grid"],
        ["Arrow keys", "Move to the next cell"],
        ["Home / End", "First / last cell of the row"],
        ["Ctrl + Home / Ctrl + End", "First / last cell of the grid"],
        ["Page Up / Page Down", "Up / down one screen of rows"],
        ["Enter or Space on a header", "Sorts the column (Shift: adds it to the sort)"],
        ["Ctrl + Enter on a header", "Opens the column menu"],
        ["Space or Shift + Space on a row", "Selects or clears the row"],
        [
          "Shift + Up / Shift + Down on a row",
          "Extends the row selection to the row above / below (shrinks it over selected rows)",
        ],
        ["Ctrl + A", "Selects or clears every row"],
        ["Alt + Left / Alt + Right on a header", "Makes the column narrower / wider by 10 pixels"],
        ["Enter or F2 on an editable cell", "Edits the cell (Enter saves, Escape cancels)"],
        ["A character on an editable cell", "Edits the cell, starting with that character"],
        ["Left / Right, right to left", "Move in the reading order"],
        [
          "Right / Left on a tree row's group cell",
          "Opens / closes the row (Left on a child: its parent)",
        ],
        ["Alt + Up / Alt + Down on a row handle", "Moves the row up / down"],
        ["Shift + arrow keys (cell selection)", "Extends the selected range"],
        ["Alt + F1 on a cell (cell selection)", "Charts the selected cells"],
        ["Ctrl + C / Ctrl + V on a cell", "Copies the selection / pastes into editable cells"],
        [
          "Ctrl + D / Ctrl + R on a cell (cellSelectionFillHandle)",
          "Fills the selected cells down / right from the first row / column",
        ],
        ["Ctrl + Z on a cell or a header", "Undoes the last edit or paste"],
        ["Ctrl + Shift + Z or Ctrl + Y on a cell or a header", "Redoes it"],
        ["Shift + F10 or the Menu key on a cell (contextMenu)", "Opens the cell menu"],
        ["Up / Down in a header filter", "Moves to the cell above / below"],
        [
          "Tab / Shift + Tab with tabNavigation",
          "Moves to the next / previous cell or header, then out of the grid",
        ],
      ]}
    />
  ),
};

/** Data grid docs page (ADR-0019). */
export function DataGridDocs() {
  return <GuideDocs sections={dataGridSections} previews={PREVIEWS} />;
}
