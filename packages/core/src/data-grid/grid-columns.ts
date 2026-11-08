/*
 * Pointer work on data grid headers, shared by React and the HTML runtime: dragging a column's
 * resize handle (`[data-ok-data-grid-resize]`) and dragging a header onto another to reorder.
 * Reports intent; the owner keeps widths and order.
 */

export interface GridColumnControlsOptions {
  /** A new width while dragging (`done` on release). */
  onResize(field: string, width: number, done: boolean): void;
  /** Dropped `field` onto the header of `target`. */
  onMove(field: string, target: string): void;
  /** Reordering allowed now (read on each drag). */
  canReorder(): boolean;
  /** Double click on a resize handle: fit the column to its content. */
  onAutosize?(field: string): void;
}

export interface GridColumnControls {
  destroy(): void;
}

const HEADER = '[role="columnheader"][data-ok-field]';
/** Pixels a header must travel before a press becomes a drag. */
const DRAG_THRESHOLD = 5;

export function createGridColumnControls(
  grid: HTMLElement,
  options: GridColumnControlsOptions,
): GridColumnControls {
  const abort = new AbortController();
  const { signal } = abort;
  const doc = grid.ownerDocument;

  grid.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0) return;
      const target = event.target as Element;
      const header = target.closest<HTMLElement>(HEADER);
      if (!header || !grid.contains(header)) return;
      const field = header.getAttribute("data-ok-field") as string;
      const handle = target.closest("[data-ok-data-grid-resize]");
      const startX = event.clientX;
      const startWidth = header.getBoundingClientRect().width;
      // Right to left, the handle is on the left edge: dragging left widens.
      const sign = getComputedStyle(header).direction === "rtl" ? -1 : 1;
      let dragging = false;
      if (!handle && (target.closest("button, input") || !options.canReorder())) return;
      if (handle) event.preventDefault();
      try {
        (target as Element).setPointerCapture?.(event.pointerId);
      } catch {
        // Synthetic events (tests) have no active pointer.
      }
      const move = (e: PointerEvent) => {
        const dx = (e.clientX - startX) * sign;
        if (handle) {
          options.onResize(field, startWidth + dx, false);
          return;
        }
        if (!dragging && Math.abs(dx) < DRAG_THRESHOLD) return;
        dragging = true;
        header.setAttribute("data-ok-dragging", "");
      };
      const up = (e: PointerEvent) => {
        doc.removeEventListener("pointermove", move);
        doc.removeEventListener("pointerup", up);
        if (handle) {
          options.onResize(field, startWidth + (e.clientX - startX) * sign, true);
          // The release ends on the header: its click must not sort.
          header.setAttribute("data-ok-just-dragged", "");
        } else if (dragging) {
          header.removeAttribute("data-ok-dragging");
          header.setAttribute("data-ok-just-dragged", "");
          const over = doc.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>(HEADER);
          const to = over?.getAttribute("data-ok-field");
          if (over && grid.contains(over) && to && to !== field) options.onMove(field, to);
        }
        setTimeout(() => header.removeAttribute("data-ok-just-dragged"), 0);
      };
      doc.addEventListener("pointermove", move, { signal });
      doc.addEventListener("pointerup", up, { signal });
    },
    { signal },
  );

  grid.addEventListener(
    "dblclick",
    (event) => {
      const handle = (event.target as Element).closest("[data-ok-data-grid-resize]");
      const field = handle?.closest(HEADER)?.getAttribute("data-ok-field");
      if (field) options.onAutosize?.(field);
    },
    { signal },
  );

  return {
    destroy() {
      abort.abort();
    },
  };
}

/**
 * Prints `content` alone: a hidden iframe gets clones of the page's stylesheets and of the
 * content (no markup strings), prints, then goes away.
 */
export function printGridContent(
  content: HTMLElement,
  title: string,
  /** Changes the copy before printing (parts left out, rows added). */
  prepare?: (copy: HTMLElement) => void,
): void {
  const doc = content.ownerDocument;
  const frame = doc.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("tabindex", "-1");
  frame.style.setProperty("position", "fixed");
  frame.style.setProperty("width", "0");
  frame.style.setProperty("height", "0");
  frame.style.setProperty("border", "0");
  doc.body.append(frame);
  const target = frame.contentDocument as Document;
  target.title = title;
  for (const sheet of doc.querySelectorAll('link[rel="stylesheet"], style'))
    target.head.append(target.importNode(sheet, true));
  for (const attribute of ["data-ok-theme", "data-ok-preset", "data-ok-font"]) {
    const value = doc.documentElement.getAttribute(attribute);
    if (value !== null) target.documentElement.setAttribute(attribute, value);
  }
  const copy = target.importNode(content, true);
  target.body.append(copy);
  prepare?.(copy);
  const view = frame.contentWindow as Window;
  view.addEventListener("afterprint", () => frame.remove(), { once: true });
  view.focus();
  view.print();
}

export interface GridPrintLayout {
  /** Default true. */
  hideToolbar?: boolean | undefined;
  /** Default true. */
  hideFooter?: boolean | undefined;
  /** Include the selection checkboxes. Default false. */
  includeCheckboxes?: boolean | undefined;
}

/**
 * Readies a print copy of a grid root: drops the toolbar and footer (unless kept), overlays,
 * menus and column controls; keeps the cells of `fields` (shown, even if hidden on screen) and
 * the checkbox column when asked; lets every row show (no fixed height, no window spacers).
 * `template` gives the column tracks of the printed fields.
 */
export function prepareGridPrint(
  copy: HTMLElement,
  layout: GridPrintLayout,
  fields: readonly string[],
  template: string,
): void {
  if (layout.hideToolbar !== false) copy.querySelector("[data-ok-data-grid-toolbar]")?.remove();
  if (layout.hideFooter !== false) copy.querySelector("[data-ok-data-grid-footer]")?.remove();
  for (const part of copy.querySelectorAll(
    "[popover], [data-ok-data-grid-loading], [data-ok-data-grid-overlay][hidden], template, [data-ok-data-grid-menu-button], [data-ok-data-grid-resize]",
  ))
    part.remove();
  const keep = new Set(fields);
  for (const cell of copy.querySelectorAll<HTMLElement>('[role="grid"] [data-ok-field]')) {
    const field = cell.getAttribute("data-ok-field") as string;
    const kept = field === "__check__" ? !!layout.includeCheckboxes : keep.has(field);
    if (!kept) cell.remove();
    else if (!cell.hasAttribute("data-ok-covered")) cell.hidden = false;
  }
  copy.style.setProperty("height", "auto");
  const main = copy.querySelector<HTMLElement>('[role="grid"]');
  main?.style.setProperty("--_ok-data-grid-columns", template);
  main?.style.setProperty("overflow", "visible");
  const body = copy.querySelector<HTMLElement>("[data-ok-data-grid-body]");
  body?.style.removeProperty("--_ok-data-grid-before");
  body?.style.removeProperty("--_ok-data-grid-after");
}
