import { DataGrid, type GridColDef } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";

/* Issues with a priority and an optional due date (story data, not from the reference). */
export interface Issue {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  due: string | null;
  points: number;
}

export const ISSUES: Issue[] = [
  { id: "is-1", title: "Fix the login form", priority: "High", due: "2025-05-14", points: 3 },
  { id: "is-2", title: "Update the docs", priority: "Low", due: null, points: 2 },
  { id: "is-3", title: "Add dark mode", priority: "Medium", due: "2025-06-02", points: 8 },
  { id: "is-4", title: "Speed up search", priority: "High", due: "2025-05-21", points: 5 },
  { id: "is-5", title: "Clean up the logs", priority: "Low", due: "2025-07-01", points: 1 },
  { id: "is-6", title: "Plan the release", priority: "Medium", due: null, points: 3 },
];

/** Priorities by rank, not by name. */
export const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

const issueColumns: GridColDef<Issue>[] = [
  { field: "title", headerName: "Title", flex: 1, minWidth: 180 },
  {
    field: "priority",
    headerName: "Priority",
    width: 130,
    // High, Medium, Low: by rank.
    sortComparator: (a, b) => (PRIORITY_RANK[String(a)] ?? 3) - (PRIORITY_RANK[String(b)] ?? 3),
  },
  {
    field: "due",
    headerName: "Due",
    width: 140,
    // Issues without a due date stay last in both directions.
    getSortComparator: (direction) => (a, b) => {
      if (!a || !b) return a === b ? 0 : a ? -1 : 1;
      const order = String(a).localeCompare(String(b));
      return direction === "asc" ? order : -order;
    },
  },
  {
    field: "points",
    headerName: "Points",
    type: "number",
    width: 110,
    // The biggest issues first: a click sorts descending, then ascending.
    sortingOrder: ["desc", "asc", null],
  },
];

/**
 * Story groups beyond the reference's sections (roadmap batch E). Snippets: `node
 * apps/storybook/scripts/data-grid-snippets.mjs`.
 */
export const moreStories: Record<string, ReactGroup[]> = {
  sorting: [
    {
      title: "Sort order and comparators",
      content: (
        <DataGrid
          id="grid-sorting"
          aria-label="Issues"
          className="sb-grid"
          rows={ISSUES}
          columns={issueColumns}
          multipleColumnsSortingMode="always"
          hideFooter
          initialState={{ sorting: { sortModel: [{ field: "priority", sort: "asc" }] } }}
        />
      ),
    },
  ],
};

export const MORE_FILES = {
  sorting: [["Sort order and comparators", "group"]],
} as const;
