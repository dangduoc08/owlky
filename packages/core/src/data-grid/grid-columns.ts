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
      let dragging = false;
      if (!handle && (target.closest("button, input") || !options.canReorder())) return;
      if (handle) event.preventDefault();
      try {
        (target as Element).setPointerCapture?.(event.pointerId);
      } catch {
        // Synthetic events (tests) have no active pointer.
      }
      const move = (e: PointerEvent) => {
        const dx = e.clientX - startX;
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
          options.onResize(field, startWidth + (e.clientX - startX), true);
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
export function printGridContent(content: HTMLElement, title: string): void {
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
  target.body.append(target.importNode(content, true));
  const view = frame.contentWindow as Window;
  view.addEventListener("afterprint", () => frame.remove(), { once: true });
  view.focus();
  view.print();
}
