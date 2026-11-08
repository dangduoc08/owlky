import { dataGridOptions } from "@owlky/core";
import { CDN, GuideDocs, type GuideSection } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

export const dataGridSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A data grid shows rows of data in columns. People can sort a column, search and filter the rows, page through them, select rows with checkboxes, choose the columns and the row height, and download the rows as CSV. It follows the ARIA grid pattern: one Tab stop, and the arrow keys move between cells. Use the Table component instead for a static table without these features.",
    html: `<!-- Load once per page: the styles and the script -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<!-- Copy the markup of the Basic story: the script sorts, filters and pages the rows it finds. -->
<div data-ok-data-grid data-ok-density="standard">…</div>`,
    react: `import { DataGrid, type GridColDef } from "@owlky/react";

const columns: GridColDef<Person>[] = [
  { field: "firstName", headerName: "First name", flex: 1 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
];

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
    react: `{ field: "age", headerName: "Age", type: "number", valueFormatter: (value) => \`\${value} years\` }`,
  },
  {
    id: "toolbar",
    title: "Add a toolbar",
    body: "`showToolbar` adds a search field and buttons that open the column list, the filter panel, the row height menu and the export menu. Search matches every word you type in any column. Export downloads a CSV file or prints the grid as shown. Each feature can be turned off, for example with `disableColumnFilter`.",
    html: `<div data-ok-data-grid-toolbar>…</div>`,
    react: `<DataGrid aria-label="People" rows={rows} columns={columns} showToolbar disableDensitySelector />`,
  },
  {
    id: "state",
    title: "Control sorting, filtering, pages and selection",
    body: "Every state works controlled or uncontrolled, as in MUI X: `sortModel`, `filterModel`, `paginationModel`, `rowSelectionModel`, `columnVisibilityModel` and `density`, each with its `on…Change` callback, or `initialState` for the starting values. Shift + click on a header adds a column to the sort.",
    html: `<!-- HTML keeps the state in the page: listen to ok:data-grid:* events (see Events and methods). -->`,
    react: `const [sortModel, setSortModel] = useState<GridSortModel>([{ field: "age", sort: "desc" }]);

<DataGrid aria-label="People" rows={rows} columns={columns} sortModel={sortModel} onSortModelChange={setSortModel} />`,
  },
  {
    id: "filters",
    title: "Combine filters",
    body: "**Add filter** in the filter panel adds another condition. From the second row, choose **And** (every condition must match, the default) or **Or** (any one is enough). The remove button deletes a condition. Set `disableMultipleColumnsFiltering` to keep a single condition.",
    html: `<!-- The filter panel's Add filter button copies the first row, with an And / Or field. -->`,
    react: `<DataGrid
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
/>`,
  },
  {
    id: "layout",
    title: "Resize, move and pin columns",
    body: `- **Resize:** drag the end edge of a header, or press Alt + Left or Alt + Right on a focused header. A column never gets narrower than its \`minWidth\`. Set \`resizable: false\` on a column, or \`disableColumnResize\` on the grid, to turn it off.
- **Move:** drag a header onto another one, or choose **Move left** or **Move right** in the column menu. \`columnOrder\` and \`onColumnOrderChange\` control the order.
- **Pin:** choose **Pin to left** or **Pin to right** in the column menu. Pinned columns stay in view while the others scroll. Use \`pinnedColumns\` to pin columns from the start.`,
    html: `<!-- Pinned cells carry data-ok-pinned; the script keeps their offsets. -->
<div role="columnheader" data-ok-field="firstName" data-ok-pinned="left" tabindex="-1">…</div>`,
    react: `<DataGrid
  aria-label="Employees"
  rows={rows}
  columns={columns}
  initialState={{ pinnedColumns: { left: ["firstName"], right: ["actions"] } }}
/>`,
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
    react: `<DataGrid
  aria-label="Employees"
  rows={rows}
  columns={[{ field: "age", headerName: "Age", type: "number", editable: true }]}
  processRowUpdate={async (row) => saveEmployee(row)}
/>`,
  },
  {
    id: "large",
    title: "Show large datasets",
    body: "The grid renders only the rows that are in view, plus a few above and below, so thousands of rows scroll smoothly. This works when the grid has a fixed height, such as `height: 520px` on the root: a grid that grows with its rows shows all of them. Set `disableVirtualization` to render every row of the page, for example before printing the page with the browser. To load more rows as people scroll, listen for the end of the rows. It's reported once for each number of rows, within `scrollEndThreshold` pixels (80 by default). Show `loading` while the next rows arrive.",
    html: `<div data-ok-data-grid id="customers" style="height: 520px">…</div>
<script type="module">
  const element = document.getElementById("customers");
  const grid = window.Owlky.get(element, "data-grid");
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
    react: `function Customers() {
  const [rows, setRows] = useState(firstCustomers);
  const [loading, setLoading] = useState(false);
  const loadMore = async () => {
    setLoading(true);
    const more = await fetchCustomers(rows.length, 200);
    setRows((current) => [...current, ...more]);
    setLoading(false);
  };
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
    body: 'A data source lets the server sort, filter and page the rows. The grid calls `getRows()` with the sort model, the filter model and the page, and shows the rows it returns. `rowCount` is the total number of rows on the server, for the pagination. Responses are kept in a cache, so going back to a page doesn\'t ask the server again. Pass `dataSourceCache={null}` to turn the cache off. Errors go to `onDataSourceError` in React and to `ok:data-grid:datasourceerror` in HTML. To handle the requests yourself, set `sortingMode`, `filterMode` and `paginationMode` to `"server"`, pass `rowCount`, and load the rows in the change callbacks. While data loads, `loadingVariant` picks a progress bar, a spinner or placeholder rows (`"skeleton"`).',
    html: `<script type="module">
  const element = document.getElementById("customers");
  const grid = window.Owlky.get(element, "data-grid");
  grid.setDataSource({
    // params: { sortModel, filterModel, paginationModel: { page, pageSize } }
    async getRows(params) {
      const response = await fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return response.json(); // { rows, rowCount }
    },
  });
</script>`,
    react: `const customers = {
  // params: { sortModel, filterModel, paginationModel: { page, pageSize } }
  async getRows(params) {
    const response = await fetch("/api/customers", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return response.json(); // { rows, rowCount }
  },
};

export function Customers() {
  return <DataGrid aria-label="Customers" rows={[]} columns={columns} dataSource={customers} />;
}`,
  },
  {
    id: "rows-from-data",
    title: "Build HTML rows from data",
    body: 'In HTML, the grid can build its rows from data instead of markup. Put one row inside `<template data-ok-data-grid-row>` in the grid: `setRows(rows)` copies it for each item, sets `data-ok-row-id` from `id`, and fills each cell with the value of its field as text. For cells with more than text, add `<template data-ok-data-grid-cell="<field>">`: its elements marked `data-ok-data-grid-value` receive the value. Values are always set as text, never as markup, so data from a server can\'t add scripts to the page.',
    html: `<div data-ok-data-grid id="customers">
  …
  <template data-ok-data-grid-row>
    <div role="row" data-ok-row-id="">
      <div role="gridcell" aria-colindex="1" data-ok-field="name" tabindex="-1"></div>
      <div role="gridcell" aria-colindex="2" data-ok-field="city" tabindex="-1"></div>
    </div>
  </template>
  <template data-ok-data-grid-cell="city">
    <svg aria-hidden="true" viewBox="0 0 24 24">…</svg>
    <span data-ok-data-grid-value></span>
  </template>
</div>`,
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
    body: `- Give the grid a name with \`aria-label\` or \`aria-labelledby\`.
- Sortable headers carry \`aria-sort\`, selected rows \`aria-selected\`, and the grid tells its full row and column count.
- Buttons and checkboxes inside cells take part in the arrow-key navigation. Name them, such as "Edit Ana Silva".
- The menu button of each column appears on hover and focus, and always on touch screens.
- While rows load, the grid sets \`aria-busy\` and the loading overlay is a \`status\` named "Loading". The grid keeps the full row count and each row's index, also when only some rows are in the page.`,
  },
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
          react: "filterModel / onFilterModelChange",
          html: "ok:data-grid:filter",
          type: "GridFilterModel",
          description: "The filter and the search words.",
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
        ["Space on a row", "Selects or clears the row"],
        ["Ctrl + A", "Selects or clears every row"],
        ["Alt + Left / Alt + Right on a header", "Makes the column narrower / wider by 10 pixels"],
        ["Enter or F2 on an editable cell", "Edits the cell (Enter saves, Escape cancels)"],
      ]}
    />
  ),
};

/** Data grid docs page (ADR-0019). */
export function DataGridDocs() {
  return <GuideDocs sections={dataGridSections} previews={PREVIEWS} />;
}
