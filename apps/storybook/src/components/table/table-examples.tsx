import { tableOptions } from "@owlky/core";
import {
  Scrollbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";
import { CollapsibleDemo } from "./collapsible-demo.js";
import { GroupingDemo } from "./grouping-demo.js";
import { PaginationDemo } from "./pagination-demo.js";
import { SortingDemo } from "./sorting-demo.js";
import data from "./table-data.json" with { type: "json" };

/**
 * The "Basic" story — the same markup as
 * `packages/html/src/components/table/examples/basic-group.html`.
 */
export const basicGroups: ReactGroup[] = [
  {
    title: "Basic",
    content: (
      <TableContainer>
        <Scrollbar aria-label="Nutrition">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dessert (100g serving)</TableCell>
                <TableCell align="right">Calories</TableCell>
                <TableCell align="right">Fat (g)</TableCell>
                <TableCell align="right">Carbs (g)</TableCell>
                <TableCell align="right">Protein (g)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.desserts.slice(0, 5).map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">{row.calories}</TableCell>
                  <TableCell align="right">{row.fat}</TableCell>
                  <TableCell align="right">{row.carbs}</TableCell>
                  <TableCell align="right">{row.protein}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    ),
  },
];

/** Stateful stories (React keeps the data; HTML lets the runtime sort, select and page). */
export const sortingGroups: ReactGroup[] = [
  { title: "Sorting & selecting", content: <SortingDemo /> },
];
export const groupingGroups: ReactGroup[] = [
  { title: "Grouping & fixed header", content: <GroupingDemo /> },
];
export const paginationGroups: ReactGroup[] = [
  { title: "Pagination with API", content: <PaginationDemo /> },
];
export const collapsibleGroups: ReactGroup[] = [
  { title: "Collapsible", content: <CollapsibleDemo /> },
];

export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const TABLE_CONTROLS = {
  schema: tableOptions,
  keys: ["size", "stickyHeader"],
} as const;
