/**
 * Gantt editing (ADR-0048 phase 2): drag a bar to move it, its edges to change its dates, its
 * progress handle to set progress; the same changes from the keyboard in an edit mode. The bar
 * previews through CSSOM; the change is reported on release (or Enter) and the preview is undone,
 * so the owner's render decides what stays (ADR-0004).
 */
import { ganttIsoDay } from "./gantt-date.js";
import type { GanttModel } from "./gantt-model.js";
import { ganttFill } from "./gantt-render.js";

export type GanttChangeSource = "drag" | "resize" | "progress" | "keyboard";

/** What an edit asks to change: ISO days (the end day included) and progress. */
export interface GanttTaskChange {
  readonly startTime: string;
  /** Absent for milestones. */
  readonly endTime?: string | undefined;
  readonly progress?: number | undefined;
}

/** A task as the editor needs it: day numbers (end exclusive) and the zoom. */
export interface GanttEditTask {
  readonly start: number;
  readonly end: number;
  readonly progress: number;
  readonly milestone: boolean;
  /** Pixels per day. */
  readonly density: number;
}

/** The texts the edit mode announces (`{…}` placeholders). */
export interface GanttEditText {
  /** `{name}`: entering the edit mode, with the keys. */
  readonly editing: string;
  /** `{start}`, `{end}`, `{progress}` after each step. */
  readonly draft: string;
  readonly saved: string;
  readonly cancelled: string;
}

export interface GanttEditCallbacks {
  /** A drag, a resize, a progress drag or the keyboard asks to change a task. */
  onTaskChange?(id: string, change: GanttTaskChange, source: GanttChangeSource): void;
  /** A double click, a double tap or F2 asks the owner to edit the task (its own form). */
  onTaskEdit?(id: string): void;
  /** The task's current values (`undefined`: not editable). */
  task?(id: string): GanttEditTask | undefined;
  /** Texts announced in the edit mode, and the date format of the drafts. */
  editText?(): GanttEditText;
  formatDay?(day: number): string;
}

interface Draft {
  id: string;
  start: number;
  end: number;
  progress: number;
  task: GanttEditTask;
  bar: HTMLElement;
  saved: [string, string, string];
}

const PROPS = ["--_ok-gantt-x", "--_ok-gantt-w", "--_ok-gantt-progress"] as const;
const THRESHOLD = 3;

/** Reads a behavior option on the root: absent → on, `"false"` → off. */
const allowed = (root: Element, attr: string) => root.getAttribute(attr) !== "false";

export interface GanttEditing {
  /** Keys of the edit mode (and Enter / F2 to start it). `true` when the key was handled. */
  key(event: KeyboardEvent, row: HTMLElement): boolean;
  /** Whether a press just ended a drag (the click that follows only focuses the row). */
  readonly dragging: boolean;
  destroy(): void;
}

export function createGanttEditing(root: HTMLElement, callbacks: GanttEditCallbacks): GanttEditing {
  let draft: Draft | undefined;
  let gesture:
    | { mode: "move" | "start" | "end" | "progress"; x: number; moved: boolean; pointer: number }
    | undefined;
  let justDragged = false;
  const editable = () => root.hasAttribute("data-ok-editable");
  const status = () => root.querySelector<HTMLElement>("[data-ok-gantt-status]");
  const announce = (text: string) => {
    const element = status();
    if (element) element.textContent = text;
  };

  const begin = (row: HTMLElement): Draft | undefined => {
    const id = row.getAttribute("data-ok-task-id") as string;
    const task = callbacks.task?.(id);
    const bar = row.querySelector<HTMLElement>("[data-ok-gantt-bar]");
    if (!task || !bar || bar.getAttribute("data-ok-type") === "summary") return undefined;
    return {
      id,
      start: task.start,
      end: task.end,
      progress: task.progress,
      task,
      bar,
      saved: PROPS.map((name) => bar.style.getPropertyValue(name)) as Draft["saved"],
    };
  };

  /** Writes the draft onto the bar (positions relative to the task's own). */
  const preview = (d: Draft) => {
    const { task, bar } = d;
    const x = Number.parseFloat(d.saved[0]) + (d.start - task.start) * task.density;
    bar.style.setProperty(PROPS[0], `${Math.round(x * 100) / 100}px`);
    if (!task.milestone) {
      bar.style.setProperty(PROPS[1], `${Math.max(2, (d.end - d.start) * task.density)}px`);
      bar.style.setProperty(PROPS[2], `${d.progress}%`);
    }
    bar.setAttribute("data-ok-dragging", "");
  };
  const restore = (d: Draft) => {
    PROPS.forEach((name, i) => {
      if (d.saved[i]) d.bar.style.setProperty(name, d.saved[i]);
      else d.bar.style.removeProperty(name);
    });
    d.bar.removeAttribute("data-ok-dragging");
  };
  const changed = (d: Draft) =>
    d.start !== d.task.start || d.end !== d.task.end || d.progress !== d.task.progress;
  const report = (d: Draft, source: GanttChangeSource) => {
    restore(d);
    if (!changed(d)) return;
    const change: GanttTaskChange = d.task.milestone
      ? { startTime: ganttIsoDay(d.start) }
      : { startTime: ganttIsoDay(d.start), endTime: ganttIsoDay(d.end - 1), progress: d.progress };
    callbacks.onTaskChange?.(d.id, change, source);
  };
  const describe = (d: Draft) => {
    const text = callbacks.editText?.();
    const format = callbacks.formatDay ?? ganttIsoDay;
    if (!text) return;
    announce(
      ganttFill(text.draft, {
        start: format(d.start),
        end: format(d.task.milestone ? d.start : d.end - 1),
        progress: Math.round(d.progress),
      }),
    );
  };

  // Keyboard edit mode.
  const key = (event: KeyboardEvent, row: HTMLElement): boolean => {
    if (!editable()) return false;
    const id = row.getAttribute("data-ok-task-id") as string;
    if (event.key === "F2") {
      if (!callbacks.task?.(id)) return false;
      event.preventDefault();
      callbacks.onTaskEdit?.(id);
      return true;
    }
    if (!draft) {
      if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey) return false;
      const next = begin(row);
      if (!next) return false;
      event.preventDefault();
      draft = next;
      row.setAttribute("data-ok-editing", "");
      const text = callbacks.editText?.();
      if (text)
        announce(
          ganttFill(text.editing, {
            name: (row.querySelector("[data-ok-gantt-name]") as HTMLElement).textContent as string,
          }),
        );
      return true;
    }
    const d = draft;
    const days = d.end - d.start;
    const rtl = getComputedStyle(row).direction === "rtl" ? -1 : 1;
    const step = event.key === "ArrowRight" ? rtl : event.key === "ArrowLeft" ? -rtl : 0;
    const done = (save: boolean) => {
      draft = undefined;
      row.removeAttribute("data-ok-editing");
      const text = callbacks.editText?.();
      if (text) announce(save ? text.saved : text.cancelled);
      if (save) report(d, "keyboard");
      else restore(d);
    };
    if (step && event.shiftKey) {
      if (!d.task.milestone && allowed(root, "data-ok-task-resize"))
        d.end = Math.max(d.start + 1, d.end + step);
    } else if (step) {
      if (allowed(root, "data-ok-task-drag")) {
        d.start += step;
        d.end = d.start + days;
      }
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      if (!d.task.milestone && allowed(root, "data-ok-progress-drag"))
        d.progress = Math.min(
          100,
          Math.max(0, Math.round(d.progress + (event.key === "PageUp" ? 10 : -10))),
        );
    } else if (event.key === "Enter") {
      event.preventDefault();
      done(true);
      return true;
    } else if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      done(false);
      return event.key === "Escape";
    } else if (event.key.startsWith("Arrow") || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      return true;
    } else return false;
    event.preventDefault();
    preview(d);
    describe(d);
    return true;
  };

  // Pointer: move, resize, progress.
  const onPointerDown = (event: PointerEvent) => {
    if (!editable() || draft || event.button !== 0) return;
    const target = event.target as Element;
    const bar = target.closest?.<HTMLElement>("[data-ok-gantt-bar]");
    const row = bar?.closest<HTMLElement>("[data-ok-gantt-row]");
    if (!bar || !row || !root.contains(row)) return;
    const handle = target.closest("[data-ok-gantt-handle]")?.getAttribute("data-ok-gantt-handle");
    const mode = handle === "start" || handle === "end" || handle === "progress" ? handle : "move";
    const attr =
      mode === "progress"
        ? "data-ok-progress-drag"
        : mode === "move"
          ? "data-ok-task-drag"
          : "data-ok-task-resize";
    if (!allowed(root, attr)) return;
    const next = begin(row);
    if (!next) return;
    draft = next;
    gesture = { mode, x: event.clientX, moved: false, pointer: event.pointerId };
    // Synthetic or finished pointers can't be captured: the drag then follows root events.
    try {
      bar.setPointerCapture(event.pointerId);
    } catch {}
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!draft || !gesture || event.pointerId !== gesture.pointer) return;
    const dx = event.clientX - gesture.x;
    if (!gesture.moved && Math.abs(dx) < THRESHOLD) return;
    gesture.moved = true;
    const d = draft;
    const { task } = d;
    const rtl = getComputedStyle(d.bar).direction === "rtl" ? -1 : 1;
    const days = Math.round((dx * rtl) / task.density);
    if (gesture.mode === "move") {
      d.start = task.start + days;
      d.end = task.end + days;
    } else if (gesture.mode === "start") {
      d.start = Math.min(task.end - 1, task.start + days);
    } else if (gesture.mode === "end") {
      d.end = Math.max(task.start + 1, task.end + days);
    } else {
      const width = (task.end - task.start) * task.density;
      d.progress = Math.min(
        100,
        Math.max(0, Math.round(task.progress + ((dx * rtl) / width) * 100)),
      );
    }
    preview(d);
  };
  const finish = (event: PointerEvent, cancel: boolean) => {
    if (!draft || !gesture || event.pointerId !== gesture.pointer) return;
    const d = draft;
    const g = gesture;
    draft = undefined;
    gesture = undefined;
    if (!g.moved) return;
    justDragged = true;
    setTimeout(() => {
      justDragged = false;
    });
    if (cancel) restore(d);
    else report(d, g.mode === "move" ? "drag" : g.mode === "progress" ? "progress" : "resize");
  };
  const onPointerUp = (event: PointerEvent) => finish(event, false);
  const onPointerCancel = (event: PointerEvent) => finish(event, true);
  const onDoubleClick = (event: MouseEvent) => {
    if (!editable()) return;
    const row = (event.target as Element).closest?.<HTMLElement>("[data-ok-gantt-row]");
    if (!row || !root.contains(row)) return;
    const id = row.getAttribute("data-ok-task-id") as string;
    if (callbacks.task?.(id)) callbacks.onTaskEdit?.(id);
  };
  const onDocumentKey = (event: KeyboardEvent) => {
    // Escape cancels a drag wherever the focus is.
    if (event.key === "Escape" && draft && gesture) {
      const d = draft;
      draft = undefined;
      gesture = undefined;
      restore(d);
    }
  };

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerCancel);
  root.addEventListener("dblclick", onDoubleClick);
  root.ownerDocument.addEventListener("keydown", onDocumentKey);
  return {
    key,
    get dragging() {
      return justDragged;
    },
    destroy() {
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerCancel);
      root.removeEventListener("dblclick", onDoubleClick);
      root.ownerDocument.removeEventListener("keydown", onDocumentKey);
    },
  };
}

/** The editable view of a model item (`undefined` for summaries and unknown ids). */
export function ganttEditTask(
  model: GanttModel,
  id: string,
  density: number,
): GanttEditTask | undefined {
  const item = model.byId.get(id);
  if (!item || item.kind === "summary") return undefined;
  return {
    start: item.start,
    end: item.end,
    progress: item.progress,
    milestone: item.kind === "milestone",
    density,
  };
}
