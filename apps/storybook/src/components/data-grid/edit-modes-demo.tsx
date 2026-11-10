import type { GridRowModesModel } from "@owlky/core";
import { DataGrid, type GridColDef, IconButton } from "@owlky/react";
import { useState } from "react";
import { DemoIcon } from "../shared/demo-icon.js";

/* Team members edited a row at a time with Edit, Save and Cancel buttons (story data). */
interface Member {
  id: string;
  name: string;
  role: string;
  hours: number;
}

const MEMBERS: Member[] = [
  { id: "m-1", name: "Ana Silva", role: "Designer", hours: 32 },
  { id: "m-2", name: "Bao Tran", role: "Developer", hours: 40 },
  { id: "m-3", name: "Chloe Martin", role: "Manager", hours: 36 },
  { id: "m-4", name: "Diego Ruiz", role: "Developer", hours: 24 },
];

/** Edit modes: the page keeps `rowModesModel`; the buttons of each row change it. */
export function EditModesDemo() {
  const [modes, setModes] = useState<GridRowModesModel>({});
  const editing = (id: string) => modes[id]?.mode === "edit";
  const columns: GridColDef<Member>[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 160, editable: true },
    { field: "role", headerName: "Role", width: 140, editable: true },
    { field: "hours", headerName: "Hours", type: "number", width: 110, editable: true },
    {
      field: "actions",
      headerName: "Actions",
      type: "actions",
      width: 120,
      renderCell: ({ row }) => (
        <>
          <IconButton
            size="sm"
            tabIndex={-1}
            aria-label={`Edit ${row.name}`}
            hidden={editing(row.id)}
            onClick={() => setModes({ [row.id]: { mode: "edit" } })}
          >
            <DemoIcon name="pen" />
          </IconButton>
          <IconButton
            size="sm"
            tabIndex={-1}
            aria-label={`Save ${row.name}`}
            hidden={!editing(row.id)}
            onClick={() => setModes({ [row.id]: { mode: "view" } })}
          >
            <DemoIcon name="check" />
          </IconButton>
          <IconButton
            size="sm"
            tabIndex={-1}
            aria-label={`Cancel ${row.name}`}
            hidden={!editing(row.id)}
            onClick={() => setModes({ [row.id]: { mode: "view", ignoreModifications: true } })}
          >
            <DemoIcon name="close" />
          </IconButton>
        </>
      ),
    },
  ];
  return (
    <DataGrid
      id="grid-edit-modes"
      aria-label="Team members"
      className="sb-grid"
      rows={MEMBERS}
      columns={columns}
      editMode="row"
      rowModesModel={modes}
      onRowModesModelChange={setModes}
      hideFooter
    />
  );
}
