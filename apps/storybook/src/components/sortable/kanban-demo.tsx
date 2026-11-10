import {
  Button,
  Menu,
  MenuItem,
  moveBetweenLists,
  Scrollbar,
  Sortable,
  Typography,
} from "@owlky/react";
import { useState } from "react";

type Task = { id: string; title: string };

const COLUMNS = [
  { id: "kanban-todo", title: "To do" },
  { id: "kanban-progress", title: "In progress" },
  { id: "kanban-review", title: "In review" },
  { id: "kanban-done", title: "Done" },
];

const INITIAL: Record<string, Task[]> = {
  "kanban-todo": [
    { id: "task-1", title: "Write the brief" },
    { id: "task-2", title: "Book the venue" },
    { id: "task-3", title: "Send invitations" },
  ],
  "kanban-progress": [
    { id: "task-4", title: "Design the poster" },
    { id: "task-5", title: "Plan the budget" },
  ],
  "kanban-review": [{ id: "task-6", title: "Pick the menu" }],
  "kanban-done": [],
};

/**
 * "Move to" choices for one task: every column (a single-pointer alternative to dragging). Choosing
 * the column the task is in does nothing.
 */
function MoveMenu({ task }: { task: Task }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menu = `${task.id}-menu`;
  return (
    <>
      <Button
        id={`${task.id}-move`}
        size="sm"
        aria-label={`Move ${task.title}`}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        aria-controls={menu}
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        Move
      </Button>
      <Menu
        id={menu}
        aria-labelledby={`${task.id}-move`}
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={() => setAnchor(null)}
      >
        {COLUMNS.map((other) => (
          <MenuItem key={other.id} data-ok-sortable-move-to={other.id}>
            {`Move to ${other.title}`}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/** A board: four lists in one group, so tasks move between columns. */
export function KanbanDemo() {
  const [lists, setLists] = useState(INITIAL);
  return (
    <Scrollbar aria-label="Board">
      <div className="sb-kanban">
        {COLUMNS.map((column) => (
          <section key={column.id} aria-labelledby={`${column.id}-title`}>
            <Typography variant="h6" component="h3" id={`${column.id}-title`}>
              {column.title}
            </Typography>
            <Sortable
              id={column.id}
              group="kanban"
              layout="vertical"
              aria-label={column.title}
              items={lists[column.id] ?? []}
              getKey={(task) => task.id}
              getItemLabel={(task) => task.title}
              renderItem={(task) => (
                <div className="sb-kanban-card">
                  <Typography variant="subtitle2" component="span">
                    {task.title}
                  </Typography>
                  <MoveMenu task={task} />
                </div>
              )}
              onReorder={(items) => setLists((all) => ({ ...all, [column.id]: items }))}
              onTransfer={(event) => setLists((all) => moveBetweenLists(all, event))}
            />
          </section>
        ))}
      </div>
    </Scrollbar>
  );
}
