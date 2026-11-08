import { DataGrid, type GridColDef } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";

/* Tree data: a team, each person under their manager (the path is the chain of names). */
export interface TeamMember {
  id: string;
  path: string[];
  title: string;
  city: string;
}

export const TEAM: TeamMember[] = [
  { id: "m-1", path: ["Ana Silva"], title: "Head of product", city: "Lisbon" },
  { id: "m-2", path: ["Ana Silva", "Bao Tran"], title: "Design lead", city: "Hanoi" },
  { id: "m-3", path: ["Ana Silva", "Bao Tran", "Chloe Martin"], title: "Designer", city: "Lyon" },
  { id: "m-4", path: ["Ana Silva", "Bao Tran", "Diego Lopez"], title: "Designer", city: "Lima" },
  { id: "m-5", path: ["Ana Silva", "Elif Kaya"], title: "Engineering lead", city: "Izmir" },
  {
    id: "m-6",
    path: ["Ana Silva", "Elif Kaya", "Farid Haddad"],
    title: "Engineer",
    city: "Beirut",
  },
  { id: "m-7", path: ["Ana Silva", "Elif Kaya", "Grace Okafor"], title: "Engineer", city: "Lagos" },
  { id: "m-8", path: ["Hugo Moreau"], title: "Head of sales", city: "Nantes" },
  { id: "m-9", path: ["Hugo Moreau", "Ines Costa"], title: "Account manager", city: "Lisbon" },
];

const teamColumns: GridColDef<TeamMember>[] = [
  { field: "title", headerName: "Title", flex: 1, minWidth: 160 },
  { field: "city", headerName: "City", width: 140 },
];

/* Master-detail: orders, each with its lines in a panel. */
export interface Order {
  id: string;
  customer: string;
  date: string;
  total: number;
  lines: { product: string; quantity: number }[];
}

export const ORDERS: Order[] = [
  {
    id: "o-1001",
    customer: "Ana Silva",
    date: "2026-10-02",
    total: 129,
    lines: [{ product: "Café table", quantity: 1 }],
  },
  {
    id: "o-1002",
    customer: "Bao Tran",
    date: "2026-10-05",
    total: 99,
    lines: [
      { product: "Crème lamp", quantity: 2 },
      { product: "Hand trowel", quantity: 1 },
    ],
  },
  {
    id: "o-1003",
    customer: "Chloe Martin",
    date: "2026-10-11",
    total: 35,
    lines: [{ product: "Garden chair", quantity: 1 }],
  },
];

/** The detail panel of an order (story-only markup). */
export const orderDetail = ({ row }: { row: Order }) => (
  <div className="sb-grid-detail">
    <p>{`Order ${row.id} for ${row.customer}, placed on ${row.date}.`}</p>
    <ul>
      {row.lines.map((line) => (
        <li key={line.product}>{`${line.quantity} × ${line.product}`}</li>
      ))}
    </ul>
  </div>
);

const orderColumns: GridColDef<Order>[] = [
  { field: "id", headerName: "Order", width: 120 },
  { field: "customer", headerName: "Customer", flex: 1, minWidth: 140 },
  { field: "date", headerName: "Date", type: "date", width: 130 },
  {
    field: "total",
    headerName: "Total",
    type: "number",
    width: 120,
    valueFormatter: (value) => `USD ${Number(value).toFixed(2)}`,
  },
];

/* Row ordering and pinning: an agenda (moved by drag), with fixed first and last items. */
export interface AgendaItem {
  id: string;
  topic: string;
  owner: string;
  minutes: number;
}

export const AGENDA: AgendaItem[] = [
  { id: "a-1", topic: "Release notes", owner: "Ana Silva", minutes: 10 },
  { id: "a-2", topic: "Customer feedback", owner: "Bao Tran", minutes: 15 },
  { id: "a-3", topic: "Roadmap", owner: "Chloe Martin", minutes: 20 },
  { id: "a-4", topic: "Hiring", owner: "Diego Lopez", minutes: 10 },
];
const AGENDA_TOP: AgendaItem[] = [{ id: "a-start", topic: "Welcome", owner: "Host", minutes: 5 }];
const AGENDA_BOTTOM: AgendaItem[] = [
  { id: "a-end", topic: "Questions", owner: "Everyone", minutes: 10 },
];

const agendaColumns: GridColDef<AgendaItem>[] = [
  { field: "topic", headerName: "Topic", flex: 1, minWidth: 160 },
  { field: "owner", headerName: "Owner", width: 150 },
  { field: "minutes", headerName: "Minutes", type: "number", width: 110 },
];

/* Column groups: people with their details under two headers. */
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  city: string;
}

export const CONTACTS: Contact[] = [
  {
    id: "c-1",
    firstName: "Ana",
    lastName: "Silva",
    age: 34,
    email: "ana@example.com",
    city: "Lisbon",
  },
  {
    id: "c-2",
    firstName: "Bao",
    lastName: "Tran",
    age: 29,
    email: "bao@example.com",
    city: "Hanoi",
  },
  {
    id: "c-3",
    firstName: "Chloe",
    lastName: "Martin",
    age: 41,
    email: "chloe@example.com",
    city: "Lyon",
  },
  {
    id: "c-4",
    firstName: "Diego",
    lastName: "Lopez",
    age: 37,
    email: "diego@example.com",
    city: "Lima",
  },
];

const contactColumns: GridColDef<Contact>[] = [
  { field: "firstName", headerName: "First name", width: 140 },
  { field: "lastName", headerName: "Last name", width: 140 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
  { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
  { field: "city", headerName: "City", width: 130 },
];

export const phase5Stories: Record<string, ReactGroup[]> = {
  tree: [
    {
      title: "Tree data",
      content: (
        <DataGrid
          id="grid-tree"
          aria-label="Team"
          className="sb-grid-wide"
          rows={TEAM}
          columns={teamColumns}
          treeData
          getTreeDataPath={(row) => row.path}
          groupingColDef={{ headerName: "Name", width: 240 }}
          defaultGroupingExpansionDepth={1}
          hideFooter
        />
      ),
    },
  ],
  detail: [
    {
      title: "Master detail",
      content: (
        <DataGrid
          id="grid-orders"
          aria-label="Orders"
          className="sb-grid-wide"
          rows={ORDERS}
          columns={orderColumns}
          getDetailPanelContent={orderDetail}
          hideFooter
        />
      ),
    },
  ],
  ordering: [
    {
      title: "Row ordering and pinning",
      content: (
        <DataGrid
          id="grid-agenda"
          aria-label="Agenda"
          className="sb-grid-wide"
          rows={AGENDA}
          columns={agendaColumns}
          rowReordering
          pinnedRows={{ top: AGENDA_TOP, bottom: AGENDA_BOTTOM }}
          hideFooter
        />
      ),
    },
  ],
  groups: [
    {
      title: "Column groups",
      content: (
        <DataGrid
          id="grid-groups"
          aria-label="Contacts"
          className="sb-grid-wide"
          rows={CONTACTS}
          columns={contactColumns}
          columnGroupingModel={[
            {
              groupId: "person",
              headerName: "Person",
              description: "Who the contact is",
              children: [
                {
                  groupId: "name",
                  headerName: "Name",
                  children: [{ field: "firstName" }, { field: "lastName" }],
                },
                { field: "age" },
              ],
            },
            {
              groupId: "contact",
              headerName: "Contact",
              children: [{ field: "email" }, { field: "city" }],
            },
          ]}
          hideFooter
        />
      ),
    },
  ],
  list: [
    {
      title: "List view",
      content: (
        <DataGrid
          id="grid-list"
          aria-label="Contacts"
          className="sb-grid-wide"
          rows={CONTACTS}
          columns={contactColumns}
          listView
          listViewColumn={{
            field: "email",
            renderCell: ({ row }) => (
              <div className="sb-grid-card">
                <strong>{`${row.firstName} ${row.lastName}`}</strong>
                <span>{`${row.email} · ${row.city}`}</span>
              </div>
            ),
          }}
          hideFooter
        />
      ),
    },
  ],
};

export const PHASE5_FILES = {
  tree: [["Tree data", "group"]],
  detail: [["Master detail", "group"]],
  ordering: [["Row ordering and pinning", "group"]],
  groups: [["Column groups", "group"]],
  list: [["List view", "group"]],
} as const;
