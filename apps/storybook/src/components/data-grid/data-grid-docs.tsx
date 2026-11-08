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
- **Instance:** \`runtime.get(element, "data-grid")\` returns \`{ sortModel, filterModel, selection, columnVisibilityModel, columnOrder, pinnedColumns, columnWidths }\` with a setter for each (\`setSortModel(model)\`, \`setColumnWidth(field, width)\` and so on; setters fire no events), \`toCsv()\` and \`exportCsv()\`.`,
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
- The menu button of each column appears on hover and focus, and always on touch screens.`,
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
