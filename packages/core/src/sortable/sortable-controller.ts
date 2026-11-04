/**
 * Sortable list behavior — spec: specs/components/sortable.md. Reports intent (`onMove`,
 * `onRemove`); the owner changes its state (React) or the DOM (HTML runtime). Every step re-reads
 * the DOM, so owners that update asynchronously work too.
 */

const ITEM = "[data-ok-sortable-item]";
const HANDLE = "[data-ok-sortable-handle]";
const REMOVE = "[data-ok-sortable-remove]";
/** Pointer travel (px) before a press on the handle becomes a drag; shorter presses are clicks. */
const DRAG_THRESHOLD = 4;

/** Moves one element of a copy of `items` from `from` to `to`. */
export function arrayMove<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

export interface SortableMessages {
  grabbed(position: number, total: number): string;
  moved(position: number, total: number): string;
  dropped(position: number, total: number): string;
  cancelled(position: number, total: number): string;
  removed(position: number, total: number): string;
}

export const defaultSortableMessages: SortableMessages = {
  grabbed: (p, t) =>
    `Grabbed item at position ${p} of ${t}. Use the arrow keys to move it, Space to drop, Escape to cancel.`,
  moved: (p, t) => `Moved to position ${p} of ${t}.`,
  dropped: (p, t) => `Dropped at position ${p} of ${t}.`,
  cancelled: (p, t) => `Reorder cancelled. Back at position ${p} of ${t}.`,
  removed: (p, t) => `Removed the item at position ${p}. ${t} items left.`,
};

export interface SortableControllerOptions {
  /** The user asked to move the item at `from` to `to` (indexes among the items). */
  onMove?: ((from: number, to: number) => void) | undefined;
  /** The user asked to remove the item at `index`. */
  onRemove?: ((index: number) => void) | undefined;
  /** Announcement texts (localization). */
  messages?: Partial<SortableMessages> | undefined;
}

export interface SortableController {
  /** Index of the item grabbed with the keyboard or a tap, or -1. */
  readonly grabbed: number;
  setOptions(options: SortableControllerOptions): void;
  /** Ends any drag or grab and removes every listener. Idempotent. */
  destroy(): void;
}

const announcers = new WeakMap<Document, HTMLElement>();

/** One polite live region per document, created on first use (visually hidden by sortable.css). */
function announcer(doc: Document): HTMLElement {
  let region = announcers.get(doc);
  if (!region?.isConnected) {
    region = doc.createElement("div");
    region.setAttribute("data-ok-sortable-announcer", "");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    doc.body.append(region);
    announcers.set(doc, region);
  }
  return region;
}

interface Drag {
  pointerId: number;
  item: HTMLElement;
  startX: number;
  startY: number;
  startIndex: number;
  startLeft: number;
  startTop: number;
  x: number;
  y: number;
  active: boolean;
}

export function createSortableController(
  list: HTMLElement,
  initialOptions: SortableControllerOptions = {},
): SortableController {
  let options = initialOptions;
  const listeners = new AbortController();
  const { signal } = listeners;
  const doc = list.ownerDocument;
  const view = doc.defaultView as Window;

  let grabbed: HTMLElement | null = null;
  let grabStart = -1;
  let drag: Drag | null = null;
  let suppressClick = false;
  /** Owner updates may move or re-render the focused handle; focusout is ignored meanwhile. */
  let refocusing = false;
  /**
   * A press inside the list is under way. Safari doesn't focus buttons on click, so pressing
   * another handle blurs to <body>: that focusout must not drop the grabbed item.
   */
  let pressing = false;

  const items = () =>
    Array.from(list.children).filter((child): child is HTMLElement => child.matches(ITEM));
  const indexOf = (item: HTMLElement) => items().indexOf(item);
  const itemOf = (target: Element | null | undefined) => {
    const item = target?.closest<HTMLElement>(ITEM);
    return item?.parentElement === list ? item : null;
  };
  const handleOf = (item: HTMLElement) => item.querySelector<HTMLElement>(HANDLE);
  const message = (key: keyof SortableMessages, position: number) => {
    const text = (options.messages?.[key] ?? defaultSortableMessages[key])(
      position,
      items().length,
    );
    announcer(doc).textContent = text;
  };

  /** Asks the owner to move `item` to `to` (clamped). Returns the target index, or -1. */
  function move(item: HTMLElement, to: number): number {
    const from = indexOf(item);
    const target = Math.max(0, Math.min(items().length - 1, to));
    if (from === -1 || target === from) return -1;
    // Moving the focused node blurs it (Firefox fires focusout during the move): not a "leave".
    holdFocus();
    options.onMove?.(from, target);
    return target;
  }

  /** Ignores focusout until the owner has had a frame to update and focus was restored. */
  function holdFocus() {
    if (refocusing) return;
    refocusing = true;
    view.requestAnimationFrame(() =>
      view.requestAnimationFrame(() => {
        refocusing = false;
      }),
    );
  }

  /** Keeps focus on `item`'s handle once the owner has moved (or re-rendered) it. */
  function keepFocus(item: HTMLElement) {
    holdFocus();
    const restore = () => {
      const handle = item.isConnected ? handleOf(item) : null;
      if (handle && doc.activeElement !== handle) handle.focus();
      handle?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    };
    restore();
    view.requestAnimationFrame(restore);
  }

  function grab(item: HTMLElement) {
    grabbed = item;
    grabStart = indexOf(item);
    item.setAttribute("data-ok-grabbed", "");
    handleOf(item)?.setAttribute("aria-pressed", "true");
    message("grabbed", grabStart + 1);
  }

  function release() {
    const item = grabbed;
    if (!item) return null;
    item.removeAttribute("data-ok-grabbed");
    handleOf(item)?.setAttribute("aria-pressed", "false");
    grabbed = null;
    grabStart = -1;
    return item;
  }

  function drop() {
    const item = release();
    if (item) message("dropped", indexOf(item) + 1);
  }

  function cancelGrab() {
    const start = grabStart;
    const item = release() as HTMLElement;
    move(item, start);
    keepFocus(item);
    message("cancelled", start + 1);
  }

  // --- pointer dragging ---------------------------------------------------------------------

  function follow(state: Drag) {
    const { item } = state;
    item.style.transform = "";
    const origin = item.getBoundingClientRect();
    const x = state.startLeft + (state.x - state.startX) - origin.left;
    const y = state.startTop + (state.y - state.startY) - origin.top;
    item.style.transform = `translate(${x}px, ${y}px)`;
  }

  function endDrag(state: Drag) {
    state.item.style.transform = "";
    state.item.removeAttribute("data-ok-dragging");
    list.removeAttribute("data-ok-dragging");
    drag = null;
  }

  function cancelDrag(state: Drag) {
    endDrag(state);
    move(state.item, state.startIndex);
    message("cancelled", state.startIndex + 1);
  }

  list.addEventListener(
    "pointerdown",
    (event) => {
      suppressClick = false;
      pressing = true;
      const handle = (event.target as Element).closest(HANDLE);
      const item = itemOf(handle);
      if (!item || event.button !== 0 || !event.isPrimary) return;
      const box = item.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        item,
        startX: event.clientX,
        startY: event.clientY,
        startIndex: indexOf(item),
        startLeft: box.left,
        startTop: box.top,
        x: event.clientX,
        y: event.clientY,
        active: false,
      };
      try {
        // Keeps the moves coming when the pointer leaves the handle (touch, fast drags).
        (handle as Element).setPointerCapture(event.pointerId);
      } catch {
        // Synthetic or already-released pointers can't be captured; list listeners still work.
      }
    },
    { signal },
  );

  list.addEventListener(
    "pointermove",
    (event) => {
      const state = drag;
      if (!state || event.pointerId !== state.pointerId) return;
      state.x = event.clientX;
      state.y = event.clientY;
      if (!state.active) {
        if (Math.hypot(state.x - state.startX, state.y - state.startY) < DRAG_THRESHOLD) return;
        state.active = true;
        release();
        state.item.setAttribute("data-ok-dragging", "");
        list.setAttribute("data-ok-dragging", "");
        message("grabbed", state.startIndex + 1);
      }
      follow(state);
      // The dragged item ignores pointer events (CSS), so this finds the item underneath.
      const over = itemOf(doc.elementFromPoint(state.x, state.y));
      if (over && over !== state.item && move(state.item, indexOf(over)) !== -1) follow(state);
    },
    { signal },
  );

  // The press ends after its click has been handled.
  doc.addEventListener(
    "pointerup",
    () => {
      if (pressing) view.setTimeout(() => (pressing = false));
    },
    { signal, capture: true },
  );

  list.addEventListener(
    "pointerup",
    (event) => {
      const state = drag;
      if (!state || event.pointerId !== state.pointerId) return;
      if (state.active) {
        suppressClick = true;
        endDrag(state);
        message("dropped", indexOf(state.item) + 1);
      } else {
        drag = null;
      }
    },
    { signal },
  );

  list.addEventListener(
    "pointercancel",
    (event) => {
      const state = drag;
      if (!state || event.pointerId !== state.pointerId) return;
      if (state.active) cancelDrag(state);
      else drag = null;
    },
    { signal },
  );

  // --- clicks: grab / drop / move to another item, remove -----------------------------------

  list.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element;
      const removed = itemOf(target.closest(REMOVE));
      if (removed) {
        if (grabbed === removed) release();
        const all = items();
        const index = all.indexOf(removed);
        const next = all[index + 1] ?? all[index - 1];
        options.onRemove?.(index);
        message("removed", index + 1);
        if (next) keepFocus(next);
        return;
      }
      const item = itemOf(target.closest(HANDLE));
      if (!item) return;
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      if (!grabbed) {
        grab(item);
      } else if (grabbed === item) {
        drop();
      } else {
        const moving = release() as HTMLElement;
        const to = move(moving, indexOf(item));
        keepFocus(moving);
        message("dropped", to + 1);
      }
    },
    { signal },
  );

  // --- keyboard -----------------------------------------------------------------------------

  /** Number of grid columns: items sharing the first item's row. */
  const columns = () => {
    const all = items();
    const top = (all[0] as HTMLElement).offsetTop;
    return all.filter((item) => item.offsetTop === top).length;
  };

  list.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && drag?.active) {
        event.preventDefault();
        cancelDrag(drag);
        return;
      }
      if (!grabbed || itemOf((event.target as Element).closest(HANDLE)) !== grabbed) return;
      if (event.key === "Escape") {
        event.preventDefault();
        cancelGrab();
        return;
      }
      const layout = list.getAttribute("data-ok-layout");
      const row = layout === "grid" || layout === null ? columns() : 1;
      const deltas: Record<string, number> =
        layout === "vertical"
          ? { ArrowUp: -1, ArrowDown: 1 }
          : layout === "horizontal"
            ? { ArrowLeft: -1, ArrowRight: 1 }
            : { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -row, ArrowDown: row };
      const delta = deltas[event.key];
      if (delta === undefined) return;
      event.preventDefault();
      const item = grabbed;
      const to = move(item, indexOf(item) + delta);
      if (to === -1) return;
      keepFocus(item);
      message("moved", to + 1);
    },
    { signal },
  );

  list.addEventListener(
    "focusout",
    (event) => {
      if (!grabbed || refocusing || pressing) return;
      const next = event.relatedTarget;
      if (next instanceof Node && list.contains(next)) return;
      drop();
    },
    { signal },
  );

  return {
    get grabbed() {
      return grabbed ? indexOf(grabbed) : -1;
    },
    setOptions(next) {
      options = next;
    },
    destroy() {
      if (signal.aborted) return;
      release();
      if (drag) endDrag(drag);
      listeners.abort();
    },
  };
}
