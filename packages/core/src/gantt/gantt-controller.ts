/**
 * Gantt controller (ADR-0048): keyboard focus on rows (roving `tabindex`), expand / collapse,
 * selection, zoom buttons, the tooltip and editing (`gantt-edit.ts`). It reads the rendered markup and reports intent; the
 * owner (React state, the HTML runtime) changes the data and renders, then calls `sync()`.
 */

import { createGanttEditing, type GanttEditCallbacks } from "./gantt-edit.js";

export interface GanttTooltipContent {
  readonly title: string;
  readonly rows: readonly (readonly [label: string, value: string])[];
}

export type GanttSelectionMode = "replace" | "toggle" | "range" | "all";

export interface GanttControllerCallbacks extends GanttEditCallbacks {
  /** The tab stop moves to a row. */
  onActiveChange?(id: string): void;
  /** A parent row asks to expand (`true`) or collapse. */
  onToggle?(id: string, expanded: boolean): void;
  /** The selection asks to become `ids`. */
  onSelectionChange?(ids: string[], mode: GanttSelectionMode): void;
  /** A zoom button: `1` in, `-1` out. */
  onZoom?(direction: 1 | -1): void;
  /** Tooltip content of a task (`undefined`: no tooltip). */
  tooltip?(id: string): GanttTooltipContent | undefined;
  /**
   * Every visible row in order (a virtualized Gantt renders only some of them): the keyboard and
   * range selection move through this list. Default: the rendered rows.
   */
  rowList?(): readonly GanttRowEntry[];
  /** The selected ids, also of rows a window doesn't render. Default: the rendered rows. */
  selection?(): readonly string[];
  /** The toolbar's download button. */
  onExport?(): void;
}

export interface GanttRowEntry {
  readonly id: string;
  readonly level: number;
}

export interface GanttController {
  /** After each render: focuses the active row if the controller moved it, hides a stale tooltip. */
  sync(): void;
  /** Scrolls a task's row and bar into view. */
  scrollToTask(id: string): boolean;
  hideTooltip(): void;
  destroy(): void;
}

const ROW = "[data-ok-gantt-row]";
const PAGE = 10;

const rowsOf = (root: Element) => [...root.querySelectorAll<HTMLElement>(ROW)];
const idOf = (row: Element) => row.getAttribute("data-ok-task-id") as string;
const levelOf = (row: Element) => Number(row.getAttribute("aria-level"));

/** Attaches the Gantt's behavior to its root (`[data-ok-gantt]`). */
export function createGanttController(
  root: HTMLElement,
  callbacks: GanttControllerCallbacks = {},
): GanttController {
  let pendingFocus: string | undefined;
  let anchor: string | undefined;
  let tooltipFor: string | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  const editing = createGanttEditing(root, callbacks);
  const viewport = () => root.querySelector<HTMLElement>("[data-ok-gantt-viewport]");
  const tooltip = () => root.querySelector<HTMLElement>("[data-ok-gantt-tooltip]");
  const rowById = (id: string) =>
    rowsOf(root).find((row) => idOf(row) === id) as HTMLElement | undefined;
  const selectable = () =>
    root.querySelector('[data-ok-gantt-grid][aria-multiselectable="true"]') !== null;
  const selectedIds = () =>
    rowsOf(root)
      .filter((row) => row.getAttribute("aria-selected") === "true")
      .map(idOf);
  const entries = (): readonly GanttRowEntry[] =>
    callbacks.rowList?.() ?? rowsOf(root).map((row) => ({ id: idOf(row), level: levelOf(row) }));

  const activate = (id: string) => {
    pendingFocus = id;
    callbacks.onActiveChange?.(id);
    // Owners that render synchronously have already re-rendered; focus right away when possible.
    sync();
  };

  const select = (id: string, mode: GanttSelectionMode) => {
    const current = [...(callbacks.selection?.() ?? selectedIds())];
    let next: string[];
    if (mode === "toggle")
      next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    else if (mode === "range" && anchor !== undefined) {
      const ids = entries().map((entry) => entry.id);
      const a = ids.indexOf(anchor);
      const b = ids.indexOf(id);
      next = a < 0 ? [id] : ids.slice(Math.min(a, b), Math.max(a, b) + 1);
    } else if (mode === "all") next = entries().map((entry) => entry.id);
    else next = [id];
    if (mode !== "range" && mode !== "all") anchor = id;
    callbacks.onSelectionChange?.(next, mode);
  };

  const toggle = (row: HTMLElement, expanded?: boolean) => {
    const state = row.getAttribute("aria-expanded");
    if (state === null) return false;
    const want = expanded ?? state !== "true";
    if ((state === "true") === want) return false;
    callbacks.onToggle?.(idOf(row), want);
    return true;
  };

  const onClick = (event: MouseEvent) => {
    const target = event.target as Element;
    const zoom = target.closest?.("[data-ok-gantt-zoom]");
    if (zoom && root.contains(zoom)) {
      callbacks.onZoom?.(zoom.getAttribute("data-ok-gantt-zoom") === "in" ? 1 : -1);
      return;
    }
    if (target.closest?.("[data-ok-gantt-export]")) {
      callbacks.onExport?.();
      return;
    }
    const row = target.closest?.<HTMLElement>(ROW);
    if (!row || !root.contains(row)) return;
    pendingFocus = idOf(row);
    if (target.closest("[data-ok-gantt-toggle]")) toggle(row);
    if (selectable() && !editing.dragging)
      select(
        idOf(row),
        event.shiftKey ? "range" : event.ctrlKey || event.metaKey ? "toggle" : "replace",
      );
    activate(idOf(row));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const row = event.target as HTMLElement;
    if (!row.matches?.(ROW) || !root.contains(row)) return;
    // Owners may rebuild the row while handling the key: keep the focus on this task.
    pendingFocus = idOf(row);
    if (editing.key(event, row)) {
      pendingFocus = undefined;
      return;
    }
    const rows = entries();
    const id = idOf(row);
    const at = rows.findIndex((entry) => entry.id === id);
    const level = levelOf(row);
    let next: GanttRowEntry | undefined;
    switch (event.key) {
      case "ArrowDown":
        next = rows[at + 1];
        break;
      case "ArrowUp":
        next = rows[at - 1];
        break;
      case "PageDown":
        next = rows[Math.min(rows.length - 1, at + PAGE)];
        break;
      case "PageUp":
        next = rows[Math.max(0, at - PAGE)];
        break;
      case "Home":
        next = rows[0];
        break;
      case "End":
        next = rows[rows.length - 1];
        break;
      case "ArrowRight":
        if (!toggle(row, true)) {
          const child = rows[at + 1];
          if (row.getAttribute("aria-expanded") === "true" && child && child.level > level)
            next = child;
        }
        break;
      case "ArrowLeft":
        if (!toggle(row, false))
          for (let i = at - 1; i >= 0; i--)
            if ((rows[i] as GanttRowEntry).level < level) {
              next = rows[i];
              break;
            }
        break;
      case "Enter":
        toggle(row);
        break;
      case " ":
        if (!selectable()) return;
        select(id, event.shiftKey ? "range" : "toggle");
        break;
      case "a":
        if (!(event.ctrlKey || event.metaKey) || !selectable()) return;
        select(id, "all");
        break;
      default:
        pendingFocus = undefined;
        return;
    }
    event.preventDefault();
    if (next && next.id !== id) {
      if (event.shiftKey && selectable() && /^(Arrow|Page|Home|End)/.test(event.key))
        select(next.id, "range");
      activate(next.id);
    } else sync();
  };

  // Tooltip: hover on a bar, focus on a row; it stays while hovered (WCAG 1.4.13).
  const showTooltip = (row: HTMLElement) => {
    const element = tooltip();
    const bar = row.querySelector<HTMLElement>("[data-ok-gantt-bar]");
    const content = callbacks.tooltip?.(idOf(row));
    if (!element || !bar || !content || root.hasAttribute("data-ok-disable-tooltip")) return;
    clearTimeout(hideTimer);
    tooltipFor = idOf(row);
    const title = document.createElement("div");
    title.setAttribute("data-ok-gantt-tooltip-title", "");
    title.textContent = content.title;
    const lines = content.rows.map(([label, value]) => {
      const line = document.createElement("div");
      line.setAttribute("data-ok-gantt-tooltip-row", "");
      const name = document.createElement("span");
      name.textContent = label;
      const text = document.createElement("span");
      text.textContent = value;
      line.append(name, text);
      return line;
    });
    element.replaceChildren(title, ...lines);
    element.hidden = false;
    // Escape dismisses it wherever the focus is (WCAG 1.4.13).
    element.ownerDocument.addEventListener("keydown", onDocumentKey);
    const box = root.getBoundingClientRect();
    const target = bar.getBoundingClientRect();
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const centre = target.left + target.width / 2 - box.left;
    const x = Math.max(0, Math.min(box.width - width, centre - width / 2));
    const above = target.top - box.top - height - 8;
    const below = above < 0;
    const y = below ? target.bottom - box.top + 8 : above;
    element.setAttribute("data-ok-placement", below ? "bottom" : "top");
    element.style.setProperty("--_ok-gantt-tooltip-x", `${Math.round(x)}px`);
    element.style.setProperty("--_ok-gantt-tooltip-y", `${Math.round(y)}px`);
  };
  function onDocumentKey(event: KeyboardEvent) {
    if (event.key === "Escape") hideTooltip();
  }
  function hideTooltip() {
    clearTimeout(hideTimer);
    tooltipFor = undefined;
    root.ownerDocument.removeEventListener("keydown", onDocumentKey);
    const element = tooltip();
    if (element && !element.hidden) {
      element.hidden = true;
      element.replaceChildren();
    }
  }
  const scheduleHide = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideTooltip, 120);
  };
  const onPointerOver = (event: PointerEvent) => {
    const target = event.target as Element;
    if (target.closest?.("[data-ok-gantt-tooltip]")) {
      clearTimeout(hideTimer);
      return;
    }
    const bar = target.closest?.("[data-ok-gantt-bar]");
    const row = bar?.closest<HTMLElement>(ROW);
    if (row && root.contains(row)) showTooltip(row);
    else if (tooltipFor !== undefined) scheduleHide();
  };
  const onPointerLeave = () => {
    if (tooltipFor !== undefined) scheduleHide();
  };
  // Pointer presses focus rows too: their tooltip comes from hovering, not from the focus.
  let pressing = false;
  const onPointerDown = () => {
    pressing = true;
    setTimeout(() => {
      pressing = false;
    });
  };
  const onFocusIn = (event: FocusEvent) => {
    const row = event.target as HTMLElement;
    if (!row.matches?.(ROW) || !root.contains(row)) return;
    // Roving tab stop: a row focused another way (a screen reader, a script) becomes the active one.
    if (row.getAttribute("tabindex") !== "0") {
      pendingFocus = idOf(row);
      callbacks.onActiveChange?.(idOf(row));
    }
    if (!pressing) showTooltip(row);
  };
  const onFocusOut = (event: FocusEvent) => {
    // A row the owner removed while focused blurs late: the focus may already be back inside.
    const next = (event.relatedTarget as Node | null) ?? document.activeElement;
    if (!root.contains(next) || next === root) hideTooltip();
  };
  /** Scrolling moves the bars: a focused row's tooltip follows its bar, a hovered one closes. */
  const onScroll = () => {
    if (tooltipFor === undefined) return;
    const row = rowById(tooltipFor);
    if (row && document.activeElement === row) showTooltip(row);
    else hideTooltip();
  };

  /** Scrolls `row` (and, horizontally, its bar) into the viewport. */
  const reveal = (row: HTMLElement) => {
    const view = viewport() as HTMLElement;
    const box = view.getBoundingClientRect();
    const head = (view.querySelector("[data-ok-gantt-head]") as HTMLElement).offsetHeight;
    const rect = row.getBoundingClientRect();
    if (rect.top < box.top + head) view.scrollTop -= box.top + head - rect.top;
    else if (rect.bottom > box.bottom) view.scrollTop += rect.bottom - box.bottom;
    const target = row.querySelector("[data-ok-gantt-bar]") as HTMLElement;
    const cell = row.querySelector('[data-ok-gantt-cell="timeline"]') as HTMLElement;
    // The sticky task list covers the start of the viewport.
    const list = cell.getBoundingClientRect().left - box.left + view.scrollLeft;
    const left = box.left + list;
    const b = target.getBoundingClientRect();
    if (b.left < left) view.scrollLeft -= left - b.left + 16;
    else if (b.right > box.right && b.width < box.right - left)
      view.scrollLeft += b.right - box.right + 16;
  };

  function sync() {
    if (pendingFocus === undefined) return;
    const row = rowById(pendingFocus);
    if (!row) {
      // A row outside a virtualized window comes with the owner's next render; a row that went
      // away (collapsed) never does.
      const id = pendingFocus;
      if (!entries().some((entry) => entry.id === id)) pendingFocus = undefined;
      return;
    }
    if (row.getAttribute("tabindex") !== "0") return;
    pendingFocus = undefined;
    if (document.activeElement !== row) {
      row.focus({ preventScroll: true });
      reveal(row);
    }
  }

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("pointerover", onPointerOver);
  root.addEventListener("pointerleave", onPointerLeave);
  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  root.addEventListener("scroll", onScroll, true);

  return {
    sync,
    scrollToTask(id) {
      const row = rowById(id);
      if (!row) return false;
      reveal(row);
      return true;
    },
    hideTooltip,
    destroy() {
      editing.destroy();
      hideTooltip();
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("pointerover", onPointerOver);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      root.removeEventListener("scroll", onScroll, true);
    },
  };
}
