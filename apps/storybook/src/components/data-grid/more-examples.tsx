import { DataGrid, type GridColDef, Slider, TextField } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { EditModesDemo } from "./edit-modes-demo.js";

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

/* The same issues, with a slider to edit the points and a list to filter them. */
const editorColumns: GridColDef<Issue>[] = [
  { field: "title", headerName: "Title", flex: 1, minWidth: 180, editable: true },
  {
    field: "priority",
    headerName: "Priority",
    type: "singleSelect",
    valueOptions: ["High", "Medium", "Low"],
    width: 140,
    editable: true,
  },
  {
    field: "points",
    headerName: "Points",
    type: "number",
    width: 200,
    editable: true,
    // A slider edits the points (Enter saves, Escape cancels).
    renderEditCell: ({ id, field, value, api }) => (
      <Slider
        aria-label="Points"
        min={0}
        max={13}
        size="small"
        value={Number(value)}
        onChange={(next) => api.setEditCellValue({ id, field, value: next })}
      />
    ),
    // "At least": a list of minimums instead of the number field.
    renderHeaderFilter: ({ item, applyFilterChanges }) => (
      <TextField
        id="grid-editors-points-filter"
        select
        size="small"
        label="At least"
        data-ok-filter-operator=">="
        value={String(item.value ?? "")}
        onChange={(next) => applyFilterChanges({ ...item, operator: ">=", value: next })}
      >
        <option value="">any</option>
        <option value="3">3</option>
        <option value="5">5</option>
        <option value="8">8</option>
      </TextField>
    ),
  },
];

/* Editable issues: edits and pastes can be undone. */
const historyColumns: GridColDef<Issue>[] = [
  { field: "title", headerName: "Title", flex: 1, minWidth: 180, editable: true },
  {
    field: "priority",
    headerName: "Priority",
    type: "singleSelect",
    valueOptions: ["High", "Medium", "Low"],
    width: 140,
    editable: true,
  },
  { field: "points", headerName: "Points", type: "number", width: 110, editable: true },
];

/* Two dozen tasks for the page size story (story data). */
export const TASKS: Issue[] = Array.from({ length: 24 }, (_, i) => ({
  id: `task-${i + 1}`,
  title: `Task ${i + 1}`,
  priority: (["High", "Medium", "Low"] as const)[i % 3] as Issue["priority"],
  due: null,
  points: (i % 5) + 1,
}));

/* Tasks by team and owner for the column options story (story data). */
export interface TeamTask {
  id: string;
  task: string;
  team: string;
  owner: string;
  points: number;
  due: string;
}

export const TEAM_TASKS: TeamTask[] = [
  { id: "tt-1", task: "Plan the sprint", team: "Core", owner: "Ana", points: 3, due: "2025-05-12" },
  { id: "tt-2", task: "Fix the build", team: "Core", owner: "Ana", points: 5, due: "2025-05-14" },
  { id: "tt-3", task: "Write the guide", team: "Docs", owner: "Ana", points: 2, due: "2025-05-16" },
  { id: "tt-4", task: "Review the API", team: "Docs", owner: "Bao", points: 8, due: "2025-05-20" },
  {
    id: "tt-5",
    task: "Draw the icons",
    team: "Design",
    owner: "Bao",
    points: 5,
    due: "2025-05-21",
  },
];

const teamColumns: GridColDef<TeamTask>[] = [
  // Row headers name their row; this column stays first and has no menu.
  {
    field: "task",
    headerName: "Task",
    flex: 1,
    minWidth: 160,
    rowHeader: true,
    disableReorder: true,
    disableColumnMenu: true,
  },
  { field: "team", headerName: "Team", width: 120, pinnable: false },
  {
    field: "owner",
    headerName: "Owner",
    width: 130,
    // Owners merge within a team only.
    rowSpanValueGetter: (value, row) => `${row.team}/${String(value)}`,
  },
  {
    field: "points",
    headerName: "Points",
    type: "number",
    width: 110,
    hideSortIcons: true,
    display: "flex",
    headerClassName: "sb-grid-points",
    // Big tasks stand out.
    cellClassName: ({ value }) => (Number(value) >= 5 ? "sb-grid-big" : ""),
  },
  // Left out of the CSV, Excel and print exports.
  { field: "due", headerName: "Due", width: 130, disableExport: true },
];

/* Read-only issues for the footer, layout and selection stories. */
const plainColumns: GridColDef<Issue>[] = [
  { field: "title", headerName: "Title", flex: 1, minWidth: 180 },
  { field: "priority", headerName: "Priority", width: 130 },
  { field: "points", headerName: "Points", type: "number", width: 110 },
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
  editors: [
    {
      title: "Custom edit and filter fields",
      content: (
        <DataGrid
          id="grid-editors"
          aria-label="Issues"
          className="sb-grid"
          rows={ISSUES}
          columns={editorColumns}
          headerFilters
          hideFooter
        />
      ),
    },
  ],
  modes: [{ title: "Edit modes", content: <EditModesDemo /> }],
  history: [
    {
      title: "Undo and redo",
      content: (
        <DataGrid
          id="grid-history"
          aria-label="Issues"
          className="sb-grid"
          rows={ISSUES}
          columns={historyColumns}
          showToolbar
          cellSelection
          historyStackSize={20}
          hideFooter
        />
      ),
    },
  ],
  footer: [
    {
      title: "Footer, label and Tab navigation",
      content: (
        // Every row shows with its count; selected rows are counted; Tab moves between cells.
        <DataGrid
          id="grid-footer"
          label="Issues"
          className="sb-grid"
          rows={ISSUES}
          columns={plainColumns}
          showToolbar
          checkboxSelection
          hideFooterPagination
          tabNavigation="all"
        />
      ),
    },
  ],
  columns: [
    {
      title: "Column options",
      content: (
        <DataGrid
          id="grid-columns"
          aria-label="Team tasks"
          className="sb-grid-wide"
          rows={TEAM_TASKS}
          columns={teamColumns}
          rowSpanning
          showToolbar
          hideFooter
        />
      ),
    },
  ],
  dimensions: [
    {
      title: "Header heights, borders and row spacing",
      content: (
        // Lower headers, lines between cells and headers, 4px of space inside each row.
        <DataGrid
          id="grid-dimensions"
          aria-label="Issues"
          className="sb-grid-wide"
          rows={ISSUES}
          columns={plainColumns}
          columnGroupingModel={[
            {
              groupId: "work",
              headerName: "Work",
              children: [{ field: "priority" }, { field: "points" }],
            },
          ]}
          columnHeaderHeight={44}
          columnGroupHeaderHeight={36}
          showCellVerticalBorder
          showColumnVerticalBorder
          getRowSpacing={() => ({ top: 4, bottom: 4 })}
          rowSpacingType="border"
          autoHeight
          hideFooter
        />
      ),
    },
    {
      title: "Page size from the height",
      content: (
        // As many rows per page as the grid's height holds.
        <DataGrid
          id="grid-pages"
          aria-label="Tasks"
          className="sb-grid"
          rows={TASKS}
          columns={plainColumns}
          autoPageSize
        />
      ),
    },
  ],
};

export const MORE_FILES = {
  sorting: [["Sort order and comparators", "group"]],
  editors: [["Custom edit and filter fields", "group"]],
  modes: [["Edit modes", "group"]],
  history: [["Undo and redo", "group"]],
  footer: [["Footer, label and Tab navigation", "group"]],
  columns: [["Column options", "group"]],
  dimensions: [
    ["Header heights, borders and row spacing", "borders"],
    ["Page size from the height", "pages"],
  ],
} as const;
