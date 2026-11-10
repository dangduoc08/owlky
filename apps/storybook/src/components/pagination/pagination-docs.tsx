import { paginationOptions } from "@owlky/core";
import paginationApi from "@owlky/docs-content/api/pagination.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Pagination } from "@owlky/react";
import { useState } from "react";
import { Caption, CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const PREV = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>`;
const FIRST = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17-5-5 5-5M18 17l-5-5 5-5" /></svg>`;
const LAST = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 17 5-5-5-5M6 17l5-5-5-5" /></svg>`;
const NEXT = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>`;

const htmlNav = (
  attrs: string,
) => `<nav aria-label="pagination navigation" data-ok-pagination ${attrs} data-ok-count="10" data-ok-page="1">
  <ul>
    <li><button type="button" data-ok-pagination-item data-ok-type="previous" aria-label="Go to previous page" disabled>${PREV}</button></li>
    <li><button type="button" data-ok-pagination-item data-ok-type="page" value="1" aria-label="page 1" aria-current="page">1</button></li>
    <li><button type="button" data-ok-pagination-item data-ok-type="next" aria-label="Go to next page">${NEXT}</button></li>
  </ul>
</nav>`;

const STYLE =
  'data-ok-variant="text" data-ok-color="standard" data-ok-shape="circular" data-ok-size="md"';

export const paginationSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `Pagination lets people move through content that is split into pages, such as search results or a long table. It shows the current page, nearby pages, the first and last pages, and previous and next buttons. Long ranges are shortened with an ellipsis.

In HTML, write the previous and next buttons; the script builds the page buttons from \`data-ok-count\` and \`data-ok-page\`.`,
    html: `<!-- Load once per page, with the script for interactive components -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${htmlNav(STYLE)}`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Pagination } from "@owlky/react";
import { useState } from "react";

export function Results() {
  const [page, setPage] = useState(1);
  return <Pagination count={10} page={page} onChange={setPage} />;
}`,
  },
  {
    id: "style",
    title: "Style the pages",
    body: "Choose how the current page stands out with `variant` (`text`, `outlined` or `soft`) and `color`. Set `shape` to `rounded` for square corners, and `size` to `sm`, `md` or `lg`.",
    html: htmlNav(
      'data-ok-variant="outlined" data-ok-color="primary" data-ok-shape="rounded" data-ok-size="md"',
    ),
    react: `import { Pagination } from "@owlky/react";

export function PaginationStyle() {
  return <Pagination count={10} variant="outlined" color="primary" shape="rounded" />;
}`,
  },
  {
    id: "ranges",
    title: "Control which pages are shown",
    body: "`siblingCount` sets how many pages appear on each side of the current page, and `boundaryCount` how many appear at each end. Both default to 1. Add first and last buttons with `showFirstButton` and `showLastButton` in React, or by writing those buttons in the HTML.",
    html: `<nav aria-label="pagination navigation" data-ok-pagination ${STYLE} data-ok-count="20" data-ok-page="10" data-ok-sibling-count="2" data-ok-boundary-count="1">
  <ul>
    <li><button type="button" data-ok-pagination-item data-ok-type="first" aria-label="Go to first page">${FIRST}</button></li>
    <li><button type="button" data-ok-pagination-item data-ok-type="previous" aria-label="Go to previous page">${PREV}</button></li>
    <li><button type="button" data-ok-pagination-item data-ok-type="next" aria-label="Go to next page">${NEXT}</button></li>
    <li><button type="button" data-ok-pagination-item data-ok-type="last" aria-label="Go to last page">${LAST}</button></li>
  </ul>
</nav>`,
    react: `import { Pagination } from "@owlky/react";

export function PaginationRanges() {
  return <Pagination count={20} defaultPage={10} siblingCount={2} showFirstButton showLastButton />;
}`,
  },
  {
    id: "table",
    title: "Page a table",
    body: 'In React, slice your rows for the current page. In HTML, point the pagination at a table with `data-ok-pagination="<table id>"` and set `data-ok-rows-per-page`: the script shows only that page\'s rows and counts the pages for you. For a rows-per-page menu and a "1–5 of 12" label, use the table\'s own `TablePagination` instead.',
    html: `<table id="orders" data-ok-table data-ok-size="medium" data-ok-padding="normal">
  <caption>Orders</caption>
  <thead>
    <tr><th scope="col">Order</th><th scope="col" data-ok-align="right">Total ($)</th></tr>
  </thead>
  <tbody>
    <tr><td>#1001</td><td data-ok-align="right">57.00</td></tr>
    <tr><td>#1002</td><td data-ok-align="right">94.00</td></tr>
    <tr><td>#1003</td><td data-ok-align="right">131.00</td></tr>
    <tr><td>#1004</td><td data-ok-align="right">168.00</td></tr>
    <tr><td>#1005</td><td data-ok-align="right">205.00</td></tr>
    <tr><td>#1006</td><td data-ok-align="right">42.00</td></tr>
    <tr><td>#1007</td><td data-ok-align="right">79.00</td></tr>
    <tr><td>#1008</td><td data-ok-align="right">116.00</td></tr>
    <tr><td>#1009</td><td data-ok-align="right">153.00</td></tr>
    <tr><td>#1010</td><td data-ok-align="right">190.00</td></tr>
    <tr><td>#1011</td><td data-ok-align="right">27.00</td></tr>
    <tr><td>#1012</td><td data-ok-align="right">64.00</td></tr>
  </tbody>
</table>

<nav aria-label="Orders pages" data-ok-pagination="orders" ${STYLE} data-ok-rows-per-page="5" data-ok-page="1">
  <ul>
    <li><button type="button" data-ok-pagination-item data-ok-type="previous" aria-label="Go to previous page">${PREV}</button></li>
    <li><button type="button" data-ok-pagination-item data-ok-type="next" aria-label="Go to next page">${NEXT}</button></li>
  </ul>
</nav>`,
    react: `import { Pagination, Table, TableBody, TableCell, TableHead, TableRow } from "@owlky/react";
import { useState } from "react";

const ROWS_PER_PAGE = 5;
const orders = Array.from({ length: 12 }, (_, i) => ({ id: 1001 + i, total: ((i * 37) % 200) + 20 }));

export function Orders() {
  const [page, setPage] = useState(1);
  const rows = orders.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell align="right">Total ($)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((order) => (
            <TableRow key={order.id}>
              <TableCell>#{order.id}</TableCell>
              <TableCell align="right">{order.total.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        count={Math.ceil(orders.length / ROWS_PER_PAGE)}
        page={page}
        onChange={setPage}
        aria-label="Orders pages"
      />
    </>
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
    body: "These props set the range, the labels and the buttons.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:pagination:change\`** (cancelable) fires when a page is requested, with \`detail.page\` (1-based).
- **Instance:** \`runtime.get(element, "pagination")\` returns \`{ page, count, setPage(page), refresh() }\`. Call \`refresh()\` after you change \`data-ok-count\`.
- **React:** \`onChange(page)\`. A controlled pagination refuses a change by keeping \`page\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Every item is a native button, so the browser provides the keyboard behavior. Focus stays on the button you pressed while the pages update.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The pagination is a \`<nav>\` landmark: give it an \`aria-label\` that says what it pages, such as "Orders pages". The default is "pagination navigation".
- The current page has \`aria-current="page"\`, and every button has a name such as "Go to page 3".
- Ellipses are hidden from assistive technology.
- Translate the labels with \`getItemAriaLabel\` in React, or \`data-ok-label-page\` and \`data-ok-label-current\` in HTML.`,
  },
  apiReferenceSection(paginationApi),
];

function ControlledPreview() {
  const [page, setPage] = useState(1);
  return (
    <Preview className="flex-col items-start!">
      <Pagination count={10} page={page} onChange={setPage} aria-label="Results pages" />
      <Caption>Current page: {page}</Caption>
    </Preview>
  );
}

const PREVIEWS = {
  overview: ControlledPreview,
  style: () => (
    <Preview className="flex-col items-start!">
      <Pagination
        count={10}
        variant="outlined"
        color="primary"
        shape="rounded"
        aria-label="Outlined pages"
      />
      <Pagination count={10} variant="soft" color="primary" aria-label="Soft pages" />
    </Preview>
  ),
  ranges: () => (
    <Preview>
      <Pagination
        count={20}
        defaultPage={10}
        siblingCount={2}
        showFirstButton
        showLastButton
        aria-label="Long range pages"
      />
    </Preview>
  ),
  options: () => <OptionsTable schema={paginationOptions} />,
  props: () => (
    <PropsTable
      label="Pagination content props"
      rows={[
        {
          react: "count",
          html: "data-ok-count",
          type: "number",
          description: "Number of pages. Default 1.",
        },
        {
          react: "page / defaultPage",
          html: "data-ok-page",
          type: "number",
          description: "Current page, starting at 1.",
        },
        {
          react: "siblingCount",
          html: "data-ok-sibling-count",
          type: "number",
          description: "Pages on each side of the current one. Default 1.",
        },
        {
          react: "boundaryCount",
          html: "data-ok-boundary-count",
          type: "number",
          description: "Pages at each end. Default 1.",
        },
        {
          react: "showFirstButton / showLastButton",
          html: 'data-ok-type="first" / "last"',
          type: "boolean",
          description: "Shows the first and last buttons. In HTML, write the buttons.",
        },
        {
          react: "hidePrevButton / hideNextButton",
          html: 'data-ok-type="previous" / "next"',
          type: "boolean",
          description: "Hides the previous and next buttons. In HTML, leave them out.",
        },
        {
          react: "getItemAriaLabel",
          html: "data-ok-label-page, data-ok-label-current",
          type: "(type, page, selected) => string",
          description: 'Button names. HTML templates use "{page}", such as "Go to page {page}".',
        },
        {
          react: "renderItem",
          type: "(item) => ReactNode",
          description: "Renders each item, for example as a link with `PaginationItem` and `href`.",
        },
        {
          react: "icons",
          html: "the SVG in the buttons",
          type: "{ first, previous, next, last }",
          description: "Replaces the navigation icons.",
        },
        {
          html: 'data-ok-pagination="<table id>"',
          type: "string",
          description: "Pages the rows of that table (with `data-ok-rows-per-page`, default 10).",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab / Shift+Tab", "Moves focus between the page buttons."],
        ["Enter / Space", "Goes to the focused page."],
      ]}
    />
  ),
};

/** Pagination docs page (ADR-0019). */
export function PaginationDocs() {
  return <GuideDocs sections={paginationSections} previews={PREVIEWS} />;
}
