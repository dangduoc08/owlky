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
    body: "`showToolbar` adds a search field and buttons that open the column list, the filter panel, the row height menu and the export menu. Search matches every word you type in any column. The filter panel keeps one filter: a column, an operator and a value. Each feature can be turned off, for example with `disableColumnFilter`.",
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
    body: `- **\`ok:data-grid:sort\`**, **\`ok:data-grid:filter\`**, **\`ok:data-grid:selection\`**, **\`ok:data-grid:columns\`** and **\`ok:data-grid:density\`** fire on the grid with the new model in \`detail\`. They're cancelable.
- **Instance:** \`runtime.get(element, "data-grid")\` returns \`{ sortModel, filterModel, selection, setSortModel(model), setFilterModel(model), setSelection(ids), exportCsv() }\`.`,
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
      ]}
    />
  ),
};

/** Data grid docs page (ADR-0019). */
export function DataGridDocs() {
  return <GuideDocs sections={dataGridSections} previews={PREVIEWS} />;
}
