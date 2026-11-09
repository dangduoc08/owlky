import { dataGridOptions } from "@owlky/core";
import {
  Avatar,
  DataGrid,
  type GridColDef,
  IconButton,
  Label,
  LinearProgress,
  Rating,
  Typography,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";
import { layoutGroups, validationGroups } from "./layout-examples.js";
import { PHASE5_FILES, phase5Stories } from "./phase5-examples.js";
import { PHASE6_FILES, phase6Stories } from "./phase6-examples.js";

const FIRST = ["Ana", "Bao", "Chloe", "Diego", "Elif", "Farid", "Grace", "Hugo", "Ines", "Jonas"];
const LAST = [
  "Silva",
  "Tran",
  "Martin",
  "Lopez",
  "Kaya",
  "Haddad",
  "Okafor",
  "Moreau",
  "Costa",
  "Berg",
];

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
}

/** 20 people, deterministic (story data, not from the reference). */
export const PEOPLE: Person[] = Array.from({ length: 20 }, (_, i) => ({
  id: `p-${String(i + 1).padStart(3, "0")}`,
  firstName: FIRST[i % 10] as string,
  lastName: LAST[(i * 3) % 10] as string,
  age: 18 + ((i * 17) % 47),
}));

const basicColumns: GridColDef<Person>[] = [
  { field: "id", headerName: "ID", width: 110 },
  { field: "firstName", headerName: "First name", flex: 1, minWidth: 120 },
  { field: "lastName", headerName: "Last name", flex: 1, minWidth: 120 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
  {
    field: "fullName",
    headerName: "Full name",
    flex: 1,
    minWidth: 160,
    valueGetter: (row) => `${row.firstName} ${row.lastName}`,
  },
  {
    field: "actions",
    headerName: "Actions",
    type: "actions",
    width: 110,
    hideable: false,
    renderCell: ({ row }) => (
      <>
        <IconButton size="sm" tabIndex={-1} aria-label={`Edit ${row.firstName} ${row.lastName}`}>
          <DemoIcon name="pen" />
        </IconButton>
        <IconButton
          size="sm"
          color="error"
          tabIndex={-1}
          aria-label={`Delete ${row.firstName} ${row.lastName}`}
        >
          <DemoIcon name="trash" />
        </IconButton>
      </>
    ),
  },
];

const STATUS = ["online", "offline", "busy", "away"] as const;
const STATUS_COLOR = {
  online: "success",
  offline: "default",
  busy: "error",
  away: "warning",
} as const;

export interface Member {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
  rating: number;
  status: (typeof STATUS)[number];
  isAdmin: boolean;
  performance: number;
}

export const MEMBERS: Member[] = Array.from({ length: 20 }, (_, i) => {
  const first = FIRST[(i * 7) % 10] as string;
  const last = LAST[(i * 3 + 1) % 10] as string;
  const day = String(28 - i).padStart(2, "0");
  return {
    id: `m-${i + 1}`,
    name: `${first} ${last}`,
    email: `${first}.${last}@example.com`.toLowerCase(),
    lastLogin: `2026-10-${day}T${String(8 + (i % 10)).padStart(2, "0")}:15:00Z`,
    rating: ((i * 7) % 10) / 2,
    status: STATUS[i % 4] as Member["status"],
    isAdmin: i % 3 === 0,
    performance: (i * 37) % 100,
  };
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** UTC, so React and HTML (and every engine) show the same text. */
const formatDate = (iso: unknown) => {
  const date = new Date(iso as string);
  return `${String(date.getUTCDate()).padStart(2, "0")} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};
const formatTime = (iso: unknown) => {
  const date = new Date(iso as string);
  const hours = date.getUTCHours();
  return `${hours % 12 || 12}:${String(date.getUTCMinutes()).padStart(2, "0")} ${hours < 12 ? "am" : "pm"}`;
};

const customColumns: GridColDef<Member>[] = [
  {
    field: "name",
    headerName: "Name",
    flex: 1,
    minWidth: 180,
    renderCell: ({ row }) => (
      <>
        <Avatar size={32} alt="" color="primary">
          {row.name.charAt(0)}
        </Avatar>
        <span className="sb-grid-ellipsis">{row.name}</span>
      </>
    ),
  },
  { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
  {
    field: "lastLogin",
    headerName: "Last login",
    type: "dateTime",
    width: 130,
    align: "right",
    valueFormatter: (value) => `${formatDate(value)} ${formatTime(value)}`,
    renderCell: ({ value }) => (
      <span className="sb-grid-date">
        <Typography variant="body2" component="span">
          {formatDate(value)}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {formatTime(value)}
        </Typography>
      </span>
    ),
  },
  {
    field: "rating",
    headerName: "Rating",
    type: "number",
    width: 150,
    renderCell: ({ value, row }) => (
      <Rating
        name={`rating-${row.id}`}
        readOnly
        size="small"
        value={value as number}
        precision={0.5}
      />
    ),
  },
  {
    field: "status",
    headerName: "Status",
    type: "singleSelect",
    valueOptions: STATUS,
    width: 110,
    align: "center",
    renderCell: ({ row }) => (
      <Label variant="soft" color={STATUS_COLOR[row.status]}>
        {row.status}
      </Label>
    ),
  },
  {
    field: "isAdmin",
    headerName: "Admin",
    type: "boolean",
    width: 90,
    align: "center",
    valueFormatter: (value) => (value ? "yes" : "no"),
    renderCell: ({ value }) =>
      value ? (
        <span className="sb-grid-check" role="img" aria-label="yes">
          <DemoIcon name="check" />
        </span>
      ) : (
        <span aria-label="no" role="img">
          –
        </span>
      ),
  },
  {
    field: "performance",
    headerName: "Performance",
    type: "number",
    width: 160,
    valueFormatter: (value) => `${value}%`,
    renderCell: ({ value }) => (
      <span className="sb-grid-progress">
        <LinearProgress variant="determinate" value={value as number} aria-label="Performance" />
        <span>{`${value}%`}</span>
      </span>
    ),
  },
  {
    field: "actions",
    headerName: "Actions",
    type: "actions",
    width: 80,
    hideable: false,
    renderCell: ({ row }) => (
      <IconButton size="sm" tabIndex={-1} aria-label={`More actions for ${row.name}`}>
        <DemoIcon name="moreVertical" />
      </IconButton>
    ),
  },
];

const TEAMS = ["Design", "Engineering", "Sales", "Support"] as const;

export interface Employee extends Person {
  team: (typeof TEAMS)[number];
  remote: boolean;
  salary: number;
  email: string;
}

export const EMPLOYEES: Employee[] = PEOPLE.map((person, i) => ({
  ...person,
  team: TEAMS[i % 4] as Employee["team"],
  remote: i % 3 !== 0,
  salary: 42000 + ((i * 7919) % 50) * 1000,
  email: `${person.firstName}.${person.lastName}${i}@example.com`.toLowerCase(),
}));

const advancedColumns: GridColDef<Employee>[] = [
  { field: "firstName", headerName: "First name", width: 140, editable: true },
  { field: "lastName", headerName: "Last name", width: 140, editable: true },
  { field: "email", headerName: "Email", width: 260 },
  { field: "age", headerName: "Age", type: "number", width: 90, editable: true },
  {
    field: "team",
    headerName: "Team",
    type: "singleSelect",
    valueOptions: TEAMS,
    width: 140,
    editable: true,
  },
  {
    field: "remote",
    headerName: "Remote",
    type: "boolean",
    width: 110,
    editable: true,
    align: "center",
  },
  {
    field: "salary",
    headerName: "Salary",
    type: "number",
    width: 130,
    editable: true,
    valueFormatter: (value) => `USD ${Number(value).toLocaleString("en-US")}`,
  },
  {
    field: "actions",
    headerName: "Actions",
    type: "actions",
    width: 90,
    hideable: false,
    resizable: false,
    renderCell: ({ row }) => (
      <IconButton size="sm" tabIndex={-1} aria-label={`Delete ${row.firstName} ${row.lastName}`}>
        <DemoIcon name="trash" />
      </IconButton>
    ),
  },
];

/**
 * Story groups — the same examples as `packages/html/src/components/data-grid/examples/`. The
 * cell content helpers (`.sb-grid-*`) are story-only demo markup.
 */
export const dataGridStories: Record<string, ReactGroup[]> = {
  advanced: [
    {
      title: "Advanced",
      content: (
        <DataGrid
          id="grid-advanced"
          aria-label="Employees"
          className="sb-grid"
          rows={EMPLOYEES}
          columns={advancedColumns}
          showToolbar
          exportFileName="employees"
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            pinnedColumns: { left: ["firstName"], right: ["actions"] },
          }}
        />
      ),
    },
  ],
  basic: [
    {
      title: "Basic",
      content: (
        <DataGrid
          id="grid-basic"
          aria-label="People"
          className="sb-grid"
          rows={PEOPLE}
          columns={basicColumns}
          checkboxSelection
          showToolbar
          toolbarVariant="icon"
          exportFileName="people"
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      ),
    },
  ],
  custom: [
    {
      title: "Custom",
      content: (
        <DataGrid
          id="grid-custom"
          aria-label="Team members"
          className="sb-grid"
          rows={MEMBERS}
          columns={customColumns}
          checkboxSelection
          disableRowSelectionOnClick
          showToolbar
          exportFileName="members"
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      ),
    },
  ],
  layout: layoutGroups,
  validation: validationGroups,
  ...phase5Stories,
  ...phase6Stories,
};

export const DATA_GRID_FILES: Record<string, GroupFiles> = {
  advanced: [["Advanced", "group"]],
  basic: [["Basic", "group"]],
  custom: [["Custom", "group"]],
  layout: [
    ["Spanning cells", "spans"],
    ["Row height and selection", "tasks"],
  ],
  validation: [["Editing and validation", "group"]],
  ...PHASE5_FILES,
  ...PHASE6_FILES,
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const DATA_GRID_CONTROLS = {
  schema: dataGridOptions,
  keys: ["density", "disableColumnMenu", "disableColumnResize", "editMode"],
} as const;
