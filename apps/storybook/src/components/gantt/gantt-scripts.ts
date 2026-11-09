import { getRuntime } from "@owlky/html";

interface GanttApi {
  readonly tasks: readonly {
    id: string;
    name: string;
    startTime?: unknown;
    endTime?: unknown;
    progress?: number;
    type?: string;
  }[];
  updateTask(id: string, change: { startTime: string; endTime?: string; progress?: number }): void;
}
interface DialogApi {
  open(): boolean;
  close(): boolean;
}

/**
 * Editing (HTML): drags and the keyboard write the table through the runtime; `ok:gantt:edit`
 * (double click, double tap, F2) opens the form, and Save writes it with `updateTask`.
 */
export function editingScript(row: HTMLElement) {
  const runtime = getRuntime();
  const element = row.querySelector("[data-ok-gantt]") as HTMLElement;
  const dialogElement = row.querySelector("#gantt-edit-dialog") as HTMLElement;
  const field = (id: string) => row.querySelector(`#${id}`) as HTMLInputElement;
  let editing: string | undefined;
  const onEdit = (event: Event) => {
    const { id } = (event as CustomEvent<{ id: string }>).detail;
    const gantt = runtime.get(element, "gantt") as unknown as GanttApi;
    const task = gantt.tasks.find((item) => item.id === id);
    if (!task) return;
    editing = id;
    (row.querySelector("#gantt-edit-title") as HTMLElement).textContent = `Edit ${task.name}`;
    field("gantt-edit-start").value = String(task.startTime ?? "");
    field("gantt-edit-end").value = String(task.endTime ?? task.startTime ?? "");
    field("gantt-edit-progress").value = String(task.progress ?? 0);
    (runtime.get(dialogElement, "dialog") as unknown as DialogApi).open();
  };
  const onClick = (event: Event) => {
    const button = (event.target as Element).closest("[data-ok-dialog-actions] [data-ok-button]");
    if (!button) return;
    const dialog = runtime.get(dialogElement, "dialog") as unknown as DialogApi;
    const save = button.textContent?.trim() === "Save";
    if (save && editing) {
      const gantt = runtime.get(element, "gantt") as unknown as GanttApi;
      const milestone = gantt.tasks.find((task) => task.id === editing)?.type === "milestone";
      const progress = Math.min(100, Math.max(0, Number(field("gantt-edit-progress").value) || 0));
      gantt.updateTask(
        editing,
        milestone
          ? { startTime: field("gantt-edit-start").value }
          : {
              startTime: field("gantt-edit-start").value,
              endTime: field("gantt-edit-end").value,
              progress,
            },
      );
    }
    editing = undefined;
    dialog.close();
  };
  element.addEventListener("ok:gantt:edit", onEdit);
  dialogElement.addEventListener("click", onClick);
  return () => {
    element.removeEventListener("ok:gantt:edit", onEdit);
    dialogElement.removeEventListener("click", onClick);
  };
}

/** The script as shown in the Code panel. */
export const EDITING_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

// Drags and the keyboard edit the table through the runtime (ok:gantt:taskchange, cancelable).
// A double click, a double tap or F2 fires ok:gantt:edit: open your own form.
const runtime = getRuntime();
const gantt = document.querySelector("[data-ok-gantt]");
const dialog = document.querySelector("#gantt-edit-dialog");
const field = (id) => document.getElementById(id);
let editing;

gantt.addEventListener("ok:gantt:edit", (event) => {
  const task = runtime.get(gantt, "gantt").tasks.find((item) => item.id === event.detail.id);
  editing = task.id;
  document.getElementById("gantt-edit-title").textContent = \`Edit \${task.name}\`;
  field("gantt-edit-start").value = task.startTime ?? "";
  field("gantt-edit-end").value = task.endTime ?? task.startTime ?? "";
  field("gantt-edit-progress").value = task.progress ?? 0;
  runtime.get(dialog, "dialog").open();
});

dialog.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ok-dialog-actions] [data-ok-button]");
  if (!button) return;
  if (button.textContent.trim() === "Save" && editing) {
    const task = runtime.get(gantt, "gantt").tasks.find((item) => item.id === editing);
    runtime.get(gantt, "gantt").updateTask(
      editing,
      task.type === "milestone"
        ? { startTime: field("gantt-edit-start").value }
        : {
            startTime: field("gantt-edit-start").value,
            endTime: field("gantt-edit-end").value,
            progress: Math.min(100, Math.max(0, Number(field("gantt-edit-progress").value) || 0)),
          },
    );
  }
  editing = undefined;
  runtime.get(dialog, "dialog").close();
});`;
