import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Gantt,
  type GanttTask,
  TextField,
} from "@owlky/react";
import { useState } from "react";

const TASKS: GanttTask[] = [
  { id: "plan", name: "Plan" },
  {
    id: "scope",
    name: "Scope",
    parentId: "plan",
    startTime: "2025-03-03",
    endTime: "2025-03-05",
    progress: 100,
  },
  {
    id: "design",
    name: "Design",
    parentId: "plan",
    startTime: "2025-03-06",
    endTime: "2025-03-12",
    progress: 40,
    dependency: "scope",
  },
  {
    id: "build",
    name: "Build",
    startTime: "2025-03-13",
    endTime: "2025-03-21",
    progress: 0,
    dependency: "design",
  },
  { id: "launch", name: "Launch", startTime: "2025-03-24", type: "milestone", dependency: "build" },
];

interface Draft {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  progress: string;
}

/**
 * Drag bars, their edges or their progress handles, or press Enter on a row and use the arrow
 * keys. A double click, a double tap or F2 opens a form: the single-pointer way to the same edits.
 */
export function EditingGanttDemo() {
  const [tasks, setTasks] = useState(TASKS);
  const [draft, setDraft] = useState<Draft | null>(null);
  const update = (id: string, change: Partial<GanttTask>) =>
    setTasks((list) => list.map((task) => (task.id === id ? { ...task, ...change } : task)));
  const edit = (id: string) => {
    const task = tasks.find((item) => item.id === id) as GanttTask;
    setDraft({
      id,
      name: task.name,
      startTime: String(task.startTime ?? ""),
      endTime: String(task.endTime ?? task.startTime ?? ""),
      progress: String(task.progress ?? 0),
    });
  };
  const save = () => {
    if (draft) {
      const milestone = tasks.find((task) => task.id === draft.id)?.type === "milestone";
      update(
        draft.id,
        milestone
          ? { startTime: draft.startTime }
          : {
              startTime: draft.startTime,
              endTime: draft.endTime,
              progress: Math.min(100, Math.max(0, Number(draft.progress) || 0)),
            },
      );
    }
    setDraft(null);
  };
  return (
    <>
      <Gantt
        label="Editable plan"
        tasks={tasks}
        view="day"
        today="2025-03-10"
        editable
        onTaskChange={update}
        onTaskEdit={edit}
      />
      <Dialog
        id="gantt-edit-dialog"
        aria-labelledby="gantt-edit-title"
        open={draft !== null}
        onOpenChange={(open) => !open && setDraft(null)}
      >
        <DialogTitle id="gantt-edit-title">{`Edit ${draft?.name ?? "task"}`}</DialogTitle>
        <DialogContent>
          <TextField
            id="gantt-edit-start"
            type="date"
            label="Start"
            shrink
            fullWidth
            margin="dense"
            value={draft?.startTime ?? ""}
            onChange={(value) => draft && setDraft({ ...draft, startTime: String(value) })}
          />
          <TextField
            id="gantt-edit-end"
            type="date"
            label="End"
            shrink
            fullWidth
            margin="dense"
            value={draft?.endTime ?? ""}
            onChange={(value) => draft && setDraft({ ...draft, endTime: String(value) })}
          />
          <TextField
            id="gantt-edit-progress"
            type="number"
            label="Progress (%)"
            fullWidth
            margin="dense"
            value={draft?.progress ?? ""}
            onChange={(value) => draft && setDraft({ ...draft, progress: String(value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDraft(null)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={save}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
