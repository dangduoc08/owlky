import { tableOptions, tableSortLabelOptions } from "@owlky/core";
import tableApi from "@owlky/docs-content/api/table.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import {
  Scrollbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { CollapsibleDemo } from "./collapsible-demo.js";
import { SortingDemo } from "./sorting-demo.js";
import data from "./table-data.json" with { type: "json" };

const CHEVRON = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>`;
const ARROW = `<span data-ok-table-sort-icon aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg></span>`;

export const tableSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A table shows data in rows and columns, such as orders or users. It's a native \`<table>\`, styled by Owlky, with the interactive parts tables often need: sortable columns, row selection, expandable rows and pagination.

Data stays yours. In React, you sort, select and page your data in state, as with any React table. In HTML, the script sorts, selects and pages the rows already in the page.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<section data-ok-table-container>
  <section data-ok-scrollbar aria-label="Orders" tabindex="0">
    <table data-ok-table data-ok-size="medium" data-ok-padding="normal">
      <thead>
        <tr>
          <th scope="col">Customer</th>
          <th scope="col" data-ok-align="right">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Jayvion Simon</td>
          <td data-ok-align="right">$83.74</td>
        </tr>
      </tbody>
    </table>
  </section>
</section>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import {
  Scrollbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@owlky/react";

interface Order {
  id: string;
  customer: string;
  total: string;
}

export function Orders({ orders }: { orders: Order[] }) {
  return (
    <TableContainer>
      <Scrollbar aria-label="Orders">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.customer}</TableCell>
                <TableCell align="right">{order.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );
}`,
  },
  {
    id: "scroll",
    title: "Scroll wide or long tables",
    body: "Put the table in a **Scrollbar** inside its `TableContainer`. Wide tables then scroll sideways instead of stretching the page, and the scrollbar area is a named region keyboard users can scroll. To keep the header visible while a tall table scrolls, set `stickyHeader` and limit the scrollbar area's height.",
    html: `<section data-ok-table-container>
  <section data-ok-scrollbar aria-label="Countries" tabindex="0" style="max-height: 440px">
    <table data-ok-table data-ok-size="medium" data-ok-padding="normal" data-ok-sticky-header>
      <thead>
        <tr><th scope="col">Country</th><th scope="col">Code</th><th scope="col" data-ok-align="right">Population</th></tr>
      </thead>
      <tbody>
        <tr><td>India</td><td>IN</td><td data-ok-align="right">1,324,171,354</td></tr>
        <tr><td>China</td><td>CN</td><td data-ok-align="right">1,403,500,365</td></tr>
        <tr><td>Italy</td><td>IT</td><td data-ok-align="right">60,483,973</td></tr>
        <tr><td>United States</td><td>US</td><td data-ok-align="right">327,167,434</td></tr>
        <tr><td>Canada</td><td>CA</td><td data-ok-align="right">37,602,103</td></tr>
        <tr><td>Australia</td><td>AU</td><td data-ok-align="right">25,475,400</td></tr>
        <tr><td>Germany</td><td>DE</td><td data-ok-align="right">83,019,200</td></tr>
        <tr><td>Ireland</td><td>IE</td><td data-ok-align="right">4,857,000</td></tr>
        <tr><td>Mexico</td><td>MX</td><td data-ok-align="right">126,577,691</td></tr>
        <tr><td>Japan</td><td>JP</td><td data-ok-align="right">126,317,000</td></tr>
      </tbody>
    </table>
  </section>
</section>`,
    react: `import { Scrollbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@owlky/react";

export function Countries() {
  return (
    <TableContainer>
      <Scrollbar aria-label="Countries" style={{ maxHeight: 440 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Country</TableCell>
              <TableCell>Code</TableCell>
              <TableCell align="right">Population</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow key="IN">
              <TableCell>India</TableCell>
              <TableCell>IN</TableCell>
              <TableCell align="right">1,324,171,354</TableCell>
            </TableRow>
            <TableRow key="CN">
              <TableCell>China</TableCell>
              <TableCell>CN</TableCell>
              <TableCell align="right">1,403,500,365</TableCell>
            </TableRow>
            <TableRow key="IT">
              <TableCell>Italy</TableCell>
              <TableCell>IT</TableCell>
              <TableCell align="right">60,483,973</TableCell>
            </TableRow>
            <TableRow key="US">
              <TableCell>United States</TableCell>
              <TableCell>US</TableCell>
              <TableCell align="right">327,167,434</TableCell>
            </TableRow>
            <TableRow key="CA">
              <TableCell>Canada</TableCell>
              <TableCell>CA</TableCell>
              <TableCell align="right">37,602,103</TableCell>
            </TableRow>
            <TableRow key="AU">
              <TableCell>Australia</TableCell>
              <TableCell>AU</TableCell>
              <TableCell align="right">25,475,400</TableCell>
            </TableRow>
            <TableRow key="DE">
              <TableCell>Germany</TableCell>
              <TableCell>DE</TableCell>
              <TableCell align="right">83,019,200</TableCell>
            </TableRow>
            <TableRow key="IE">
              <TableCell>Ireland</TableCell>
              <TableCell>IE</TableCell>
              <TableCell align="right">4,857,000</TableCell>
            </TableRow>
            <TableRow key="MX">
              <TableCell>Mexico</TableCell>
              <TableCell>MX</TableCell>
              <TableCell align="right">126,577,691</TableCell>
            </TableRow>
            <TableRow key="JP">
              <TableCell>Japan</TableCell>
              <TableCell>JP</TableCell>
              <TableCell align="right">126,317,000</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );
}`,
  },
  {
    id: "sort",
    title: "Sort and select rows",
    body: `Put a \`TableSortLabel\` in a header cell to make the column sortable. In React, keep the column and direction in state and sort your data; \`compareCellValues\` and \`nextSortDirection\` from \`@owlky/core\` help. In HTML, the script sorts the rows when a label is pressed.

For selection, add a column of small **Checkbox** components: put \`data-ok-table-select\` on each row's input and \`data-ok-table-select-all\` on the header's input. Selected rows are highlighted. To offer dense rows, add a **Switch** under the table; in HTML, give its input \`data-ok-table-dense\` with the table's id. Try sorting and selecting below.`,
    html: `<table id="desserts" data-ok-table data-ok-size="medium" data-ok-padding="normal">
  <thead>
    <tr>
      <th scope="col" data-ok-padding="checkbox"><span data-ok-checkbox data-ok-color="primary" data-ok-size="small"><input type="checkbox" data-ok-checkbox-input data-ok-table-select-all aria-label="Select all desserts"><!-- the three icon spans of a Checkbox --></span></th>
      <th scope="col" aria-sort="ascending"><button type="button" data-ok-table-sort-label data-ok-direction="asc" data-ok-active>Dessert${ARROW}</button></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-ok-padding="checkbox"><span data-ok-checkbox data-ok-color="primary" data-ok-size="small"><input type="checkbox" data-ok-checkbox-input data-ok-table-select aria-label="Select Eclair"><!-- the three icon spans of a Checkbox --></span></td>
      <td>Eclair</td>
    </tr>
  </tbody>
</table>`,
    react: `import { Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel } from "@owlky/react";
import { useState } from "react";

const desserts = [
  { name: "Cupcake", calories: 305 },
  { name: "Eclair", calories: 262 },
  { name: "Frozen yoghurt", calories: 159 },
];
type Column = "name" | "calories";

export function SortedDesserts() {
  const [orderBy, setOrderBy] = useState<Column>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const sortBy = (column: Column) => {
    setOrder(orderBy === column && order === "asc" ? "desc" : "asc");
    setOrderBy(column);
  };
  const rows = [...desserts].sort((a, b) => {
    const result = a[orderBy] < b[orderBy] ? -1 : a[orderBy] > b[orderBy] ? 1 : 0;
    return order === "asc" ? result : -result;
  });
  return (
    <Table>
      <TableHead>
        <TableRow>
          {(["name", "calories"] as const).map((column) => (
            <TableCell key={column} sortDirection={orderBy === column ? order : false}>
              <TableSortLabel
                active={orderBy === column}
                direction={orderBy === column ? order : "asc"}
                onClick={() => sortBy(column)}
              >
                {column === "name" ? "Dessert" : "Calories"}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.calories}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}`,
  },
  {
    id: "expand",
    title: "Show details in an expandable row",
    body: "A `TableExpandButton` opens a `TableDetailRow` below its row, for details that don't fit in the columns. In React, keep the open state in your component. In HTML, point the button at the detail row's `id`; the script opens and closes it.",
    html: `<table data-ok-table data-ok-size="medium" data-ok-padding="normal">
  <tbody>
    <tr>
      <td data-ok-padding="checkbox">
        <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-table-expand="eclair-details" aria-expanded="false" aria-controls="eclair-details" aria-label="Purchase history of Eclair">${CHEVRON}</button>
      </td>
      <td>Eclair</td>
    </tr>
    <tr id="eclair-details" data-ok-table-detail hidden>
      <td colspan="2">Bought 3 times this month, last on May 12.</td>
    </tr>
  </tbody>
</table>`,
    react: `import {
  Table,
  TableBody,
  TableCell,
  TableDetailRow,
  TableExpandButton,
  TableRow,
} from "@owlky/react";
import { useState } from "react";

export function TableExpand() {
  const [open, setOpen] = useState(false);
  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell padding="checkbox">
            <TableExpandButton
              expanded={open}
              controls="eclair-details"
              aria-label="Purchase history of Eclair"
              onClick={() => setOpen(!open)}
            />
          </TableCell>
          <TableCell>Eclair</TableCell>
        </TableRow>
        <TableDetailRow id="eclair-details" open={open} colSpan={2}>
          Bought 3 times this month, last on May 12.
        </TableDetailRow>
      </TableBody>
    </Table>
  );
}`,
  },
  {
    id: "paginate",
    title: "Split rows into pages",
    body: 'Place a `TablePagination` after the container for a rows-per-page menu, a "1–5 of 12" label and previous and next buttons. In HTML, link it to the table with `data-ok-table-pagination="<table id>"` and the script pages the rows. The rows-per-page menu is a native `<select>`. Set `selectProps` to `{ native: false }` for a **Select** styled like the other fields. For numbered pages, use a **Pagination** instead.',
    html: `<div data-ok-table-pagination="desserts">
  <label data-ok-table-pagination-rows>Rows per page:<select><option value="5" selected>5</option><option value="10">10</option></select></label>
  <span data-ok-table-pagination-displayed aria-live="polite">1–5 of 12</span>
<div data-ok-table-pagination-actions>
  <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-table-pagination-action="previous" aria-label="Go to previous page" title="Go to previous page" disabled><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
  <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-table-pagination-action="next" aria-label="Go to next page" title="Go to next page"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg></button>
</div>
</div>`,
    react: `import { Table, TableBody, TableCell, TablePagination, TableRow } from "@owlky/react";
import { useState } from "react";

const desserts = Array.from({ length: 12 }, (_, index) => \`Dessert \${index + 1}\`);

export function PagedDesserts() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const rows = desserts.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  return (
    <>
      <Table>
        <TableBody>
          {rows.map((name) => (
            <TableRow key={name}>
              <TableCell>{name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        count={desserts.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={setPage}
        onRowsPerPageChange={(next) => {
          setRowsPerPage(next);
          setPage(0);
        }}
      />
    </>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "The first table lists the table's options, the second those of a sort label. Cells can override the table's `size` and `padding`, and set `align`.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "In React, the table is made of parts that render the matching native elements.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:table:sort\`** (cancelable) fires before the rows are sorted, with \`detail: { column, direction }\`.
- **\`ok:table:select\`** fires after the selection changes, with \`detail.rows\`, the selected rows.
- **\`ok:table:expand\`** (cancelable) fires before a detail row opens or closes, with \`detail: { row, expanded }\`.
- **\`ok:table-pagination:change\`** (cancelable) fires before the page or rows per page change, with \`detail: { page, rowsPerPage }\`.
- **Instances:** \`runtime.get(table, "table")\` returns \`{ sort(column, direction?), expand(row, open?), groups() }\`. \`runtime.get(element, "table-pagination")\` returns \`{ page, rowsPerPage, lastPage, setPage(page), setRowsPerPage(rows), refresh() }\`.
- **React:** \`onClick\` on \`TableSortLabel\` and \`TableExpandButton\`, and \`onPageChange\` and \`onRowsPerPageChange\` on \`TablePagination\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Sort labels, checkboxes, expand buttons and page buttons are native controls.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Name the scrollbar area around the table with \`aria-label\`, such as "Orders". Header cells use \`scope="col"\`, and the sorted column has \`aria-sort\`.
- Give every checkbox and expand button a name that includes the row, such as "Select Eclair".
- The expand button has \`aria-expanded\` and \`aria-controls\`, which point to its detail row.
- The "1–5 of 12" label is a polite live region, so page changes are announced.
- Header text meets a contrast ratio of at least 4.5:1 in light and dark mode.`,
  },
  apiReferenceSection(tableApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview className="block!">
      <TableContainer>
        <Scrollbar aria-label="Desserts preview">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dessert</TableCell>
                <TableCell align="right">Calories</TableCell>
                <TableCell align="right">Protein (g)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.desserts.slice(0, 4).map((row) => (
                <TableRow key={row.name} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">{row.calories}</TableCell>
                  <TableCell align="right">{row.protein}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Preview>
  ),
  sort: () => (
    <Preview className="block!">
      <SortingDemo />
    </Preview>
  ),
  expand: () => (
    <Preview className="block!">
      <CollapsibleDemo />
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={tableOptions} />
      <OptionsTable schema={tableSortLabelOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Table parts"
      rows={[
        {
          react: "TableContainer",
          html: "section[data-ok-table-container]",
          type: "section props",
          description: "Holds the table. Put a Scrollbar inside it.",
        },
        {
          react: "Table",
          html: "table[data-ok-table]",
          type: "size, padding, stickyHeader",
          description: "The table.",
        },
        {
          react: "TableHead / TableBody / TableFooter",
          html: "thead / tbody / tfoot",
          type: "children",
          description: "The row groups. Cells in TableHead render as header cells.",
        },
        {
          react: "TableRow",
          html: "tr",
          type: "hover, selected",
          description: "A row; `hover` highlights it on hover, `selected` marks it as selected.",
        },
        {
          react: "TableCell",
          html: "td / th",
          type: "align, padding, size, sortDirection, scope",
          description: "A cell. Overrides the table's size and padding.",
        },
        {
          react: "TableSortLabel",
          html: "button[data-ok-table-sort-label]",
          type: "active, direction, hideSortIcon, icon",
          description: "The sortable title of a header cell.",
        },
        {
          react: "TableExpandButton",
          html: "button[data-ok-table-expand]",
          type: "expanded, controls",
          description: "Opens and closes a detail row.",
        },
        {
          react: "TableDetailRow",
          html: "tr[data-ok-table-detail]",
          type: "id, open, colSpan",
          description: "A row of details below another row. `colSpan` is required.",
        },
        {
          react: "TablePagination",
          html: "div[data-ok-table-pagination]",
          type: "count, page, rowsPerPage, rowsPerPageOptions",
          description: "Rows-per-page menu, range label and page buttons. `page` starts at 0.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the scrollbar area, then to each sort label, checkbox and button."],
        ["Arrow keys", "Scroll the focused scrollbar area."],
        ["Enter / Space", "Sorts by a column, or presses an expand or page button."],
        ["Space", "Checks or unchecks the focused checkbox."],
      ]}
    />
  ),
};

/** Table docs page (ADR-0019). */
export function TableDocs() {
  return <GuideDocs sections={tableSections} previews={PREVIEWS} />;
}
