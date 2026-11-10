/**
 * Sortable list behavior — spec: specs/components/sortable.md, ADR-0053 (several lists). Reports
 * intent (`onMove`, `onTransfer`, `onRemove`) and drag events (`onDragStart` …); the owner changes
 * its state (React) or the DOM (HTML runtime). Every step re-reads the DOM, so owners that update
 * asynchronously work too. Items with `data-ok-disabled` don't move and aren't targets; lists
 * with `data-ok-auto-scroll="false"` don't scroll their containers while dragging. Lists with
 * `data-ok-strategy="swap"` preview a swap with the item under the pointer (or the arrow keys'
 * target) through transforms and report one `onSwap` on drop; `data-ok-activator="item"` starts
 * pointer drags anywhere on an item (the handle stays the keyboard and tap path).
 *
 * Lists register in a module-scoped registry per document; the grab or drag in progress is one
 * session per document, continued by the controller of whichever list holds the item. Intents go
 * to the owner of the list holding the item.
 */

const ITEM = "[data-ok-sortable-item]";
const LIST = "[data-ok-sortable]";
const HANDLE = "[data-ok-sortable-handle]";
const REMOVE = "[data-ok-sortable-remove]";
const MOVE_TO = "[data-ok-sortable-move-to]";
/** Content of an item that keeps its own presses when the whole item drags (`activator`). */
const INTERACTIVE =
  "a[href], button, input, select, textarea, label, summary, [contenteditable]:not([contenteditable='false']), [tabindex]";
/** Pointer travel (px) before a press on the handle becomes a drag; shorter presses are clicks. */
const DRAG_THRESHOLD = 4;
/** Frames an owner has to apply a transfer before it counts as refused. */
const TRANSFER_FRAMES = 8;
/** Auto scroll: the edge zone (a fifth of the container, at most this many px) and top speed. */
const SCROLL_ZONE = 80;
const SCROLL_SPEED = 20;

/** Moves one element of a copy of `items` from `from` to `to`. */
export function arrayMove<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

/** Swaps two elements of a copy of `items` (dnd-kit `arraySwap`, the `swap` strategy). */
export function arraySwap<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || to < 0 || from >= next.length || to >= next.length) return next;
  [next[from], next[to]] = [next[to] as T, next[from] as T];
  return next;
}

/** Where an item moves between lists: list ids and indexes (React `onTransfer`). */
export interface SortableTransferTarget {
  /** The list the item leaves. */
  from: string;
  /** The list the item enters. */
  to: string;
  /** The item's index in `from`. */
  fromIndex: number;
  /** The item's index in `to`. */
  index: number;
}

/**
 * Moves one item between the arrays of a record of lists (keyed by list id), as reported by a
 * transfer. Returns a new record; the other lists are kept as they are.
 */
export function moveBetweenLists<T>(
  lists: Readonly<Record<string, readonly T[]>>,
  { from, to, fromIndex, index }: SortableTransferTarget,
): Record<string, T[]> {
  const next: Record<string, T[]> = {};
  for (const [key, value] of Object.entries(lists)) next[key] = [...value];
  const source = next[from];
  if (!source || fromIndex < 0 || fromIndex >= source.length) return next;
  const [moved] = source.splice(fromIndex, 1);
  if (from === to) {
    source.splice(index, 0, moved as T);
    return next;
  }
  const target = next[to] ?? [];
  target.splice(Math.max(0, Math.min(target.length, index)), 0, moved as T);
  next[to] = target;
  return next;
}

/**
 * Announcement texts. Each gets the item's position, the number of items in its list and the
 * list's name (its `aria-label`).
 */
export interface SortableMessages {
  grabbed(position: number, total: number, list: string): string;
  moved(position: number, total: number, list: string): string;
  /** The item moved to another list. */
  movedToList(position: number, total: number, list: string): string;
  dropped(position: number, total: number, list: string): string;
  cancelled(position: number, total: number, list: string): string;
  removed(position: number, total: number, list: string): string;
}

export const defaultSortableMessages: SortableMessages = {
  grabbed: (p, t) =>
    `Grabbed item at position ${p} of ${t}. Use the arrow keys to move it, Space to drop, Escape to cancel.`,
  moved: (p, t) => `Moved to position ${p} of ${t}.`,
  movedToList: (p, t, l) => `Moved to ${l || "another list"}, position ${p} of ${t}.`,
  dropped: (p, t) => `Dropped at position ${p} of ${t}.`,
  cancelled: (p, t) => `Reorder cancelled. Back at position ${p} of ${t}.`,
  removed: (p, t) => `Removed the item at position ${p}. ${t} items left.`,
};

/** A move between lists, reported to the owner of the list the item leaves. */
export interface SortableTransfer {
  /** The item's element. */
  item: HTMLElement;
  /** The list the item leaves. */
  from: HTMLElement;
  /** The list the item enters. */
  to: HTMLElement;
  /** The item's index in `from`. */
  fromIndex: number;
  /** The item's index in `to`. */
  index: number;
}

/** A drag event: the item, its index and its list (for `onDragOver`, where it is about to go). */
export interface SortableDragEvent {
  /** The dragged (or grabbed) item. */
  item: HTMLElement;
  /** Its index in `list`. */
  index: number;
  /** The list it is in, or about to enter. */
  list: HTMLElement;
}

export interface SortableControllerOptions {
  /** The user asked to move the item at `from` to `to` (indexes among the items). */
  onMove?: ((from: number, to: number) => void) | undefined;
  /** A list with `data-ok-strategy="swap"`: the items at `from` and `to` trade places. */
  onSwap?: ((from: number, to: number) => void) | undefined;
  /**
   * The user asked to move an item of this list to another list of its group. Return `false` to
   * refuse; without this option, items never leave the list.
   */
  onTransfer?: ((transfer: SortableTransfer) => unknown) | undefined;
  /** The user asked to remove the item at `index`. */
  onRemove?: ((index: number) => void) | undefined;
  /** Announcement texts (localization). */
  messages?: Partial<SortableMessages> | undefined;
  /** An item of this list was grabbed (keyboard, tap) or started a pointer drag. */
  onDragStart?: ((event: SortableDragEvent) => void) | undefined;
  /** The item held by this list is about to move to `index` in `list` (this list or another). */
  onDragOver?: ((event: SortableDragEvent) => void) | undefined;
  /** The item was dropped in this list. */
  onDragEnd?: ((event: SortableDragEvent) => void) | undefined;
  /** The move of the item held by this list was cancelled; it goes back to its start. */
  onDragCancel?: ((event: SortableDragEvent) => void) | undefined;
}

export interface SortableController {
  /** Index of the item grabbed with the keyboard or a tap in this list, or -1. */
  readonly grabbed: number;
  setOptions(options: SortableControllerOptions): void;
  /** Ends any drag or grab of this list and removes every listener. Idempotent. */
  destroy(): void;
}

interface Drag {
  /** Largest scroll offsets of the containers met, measured once (the dragged item's own
   *  transform would otherwise grow them while auto scrolling). */
  limits: Map<Element, { x: number; y: number }>;
  pointerId: number;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
  x: number;
  y: number;
}

/** The grab (keyboard, taps) or pointer drag in progress: one per document. */
interface Session {
  item: HTMLElement;
  /** The list holding the item now. */
  list: HTMLElement;
  startList: HTMLElement;
  startIndex: number;
  drag: Drag | null;
  /** A transfer the owner hasn't applied yet: returns true once it is resolved. */
  pending: (() => boolean) | null;
  /** Swap lists: the item the session's item would trade places with (previewed). */
  swap: HTMLElement | null;
}

interface Entry {
  list: HTMLElement;
  options(): SortableControllerOptions;
}

interface DocState {
  entries: Set<Entry>;
  session: Session | null;
  /** Owner updates may move or re-render the focused handle; focusout is ignored meanwhile. */
  refocusing: boolean;
  /**
   * A press inside a list is under way. Safari doesn't focus buttons on click, so pressing
   * another handle blurs to <body>: that focusout must not drop the grabbed item.
   */
  pressing: boolean;
  /** The click that ends a pointer drag is swallowed. */
  suppressClick: boolean;
  announcer: HTMLElement | null;
}

const documents = new WeakMap<Document, DocState>();

function docState(doc: Document): DocState {
  let state = documents.get(doc);
  if (!state) {
    state = {
      entries: new Set(),
      session: null,
      refocusing: false,
      pressing: false,
      suppressClick: false,
      announcer: null,
    };
    documents.set(doc, state);
  }
  return state;
}

/** One polite live region per document, created on first use (visually hidden by sortable.css). */
function announcer(doc: Document): HTMLElement {
  const state = docState(doc);
  let region = state.announcer;
  if (!region?.isConnected) {
    region = doc.createElement("div");
    region.setAttribute("data-ok-sortable-announcer", "");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    doc.body.append(region);
    state.announcer = region;
  }
  return region;
}

const itemsOf = (list: Element) =>
  Array.from(list.children).filter((child): child is HTMLElement => child.matches(ITEM));
const handleOf = (item: HTMLElement) => item.querySelector<HTMLElement>(HANDLE);
const isDisabled = (item: Element) => item.hasAttribute("data-ok-disabled");
const swaps = (list: Element) => list.getAttribute("data-ok-strategy") === "swap";
/** An element's box without the transform the controller gave it. */
function restingBox(element: HTMLElement): DOMRect {
  const transform = element.style.transform;
  element.style.transform = "";
  const box = element.getBoundingClientRect();
  element.style.transform = transform;
  return box;
}

/** Pixels per frame toward the edge `position` is close to, signed (0 outside the zones). */
function edgeSpeed(position: number, start: number, end: number): number {
  const zone = Math.min((end - start) / 5, SCROLL_ZONE);
  const near = (distance: number) => Math.ceil(SCROLL_SPEED * Math.min(1, distance / zone));
  if (position < start + zone) return -near(start + zone - position);
  if (position > end - zone) return near(position - (end - zone));
  return 0;
}
const groupOf = (list: Element) => list.getAttribute("data-ok-group") || null;

/** Whether `target` takes items from `source` (ADR-0053: groups and `accept`). */
function accepts(target: Element, source: Element): boolean {
  const group = groupOf(source);
  if (!group) return false;
  const accept = target.getAttribute("data-ok-accept");
  return accept === null ? groupOf(target) === group : accept.split(/\s+/).includes(group);
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
  const shared = docState(doc);
  const entry: Entry = { list, options: () => options };
  shared.entries.add(entry);
  /** Listeners of the pointer press in progress (on the document). */
  let press: AbortController | null = null;

  const entryOf = (element: Element) => {
    for (const candidate of shared.entries) if (candidate.list === element) return candidate;
    return undefined;
  };
  /** Registered, connected lists in document order. */
  const lists = () =>
    [...shared.entries]
      .map((candidate) => candidate.list)
      .filter((element) => element.isConnected)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const indexOf = (item: HTMLElement) =>
    item.parentElement ? itemsOf(item.parentElement).indexOf(item) : -1;
  /** The item of a registered list that contains `target`, if any. */
  const itemIn = (owner: Element, target: Element | null | undefined) => {
    const item = target?.closest<HTMLElement>(ITEM);
    return item?.parentElement === owner ? item : null;
  };
  const say = (owner: HTMLElement, key: keyof SortableMessages, position: number) => {
    const messages = entryOf(owner)?.options().messages;
    const text = (messages?.[key] ?? defaultSortableMessages[key])(
      position,
      itemsOf(owner).length,
      owner.getAttribute("aria-label") ?? "",
    );
    announcer(doc).textContent = text;
  };

  type DragKey = "onDragStart" | "onDragOver" | "onDragEnd" | "onDragCancel";
  /** Calls a drag callback of the owner of `owner` (the list holding the item). */
  const notify = (owner: HTMLElement, key: DragKey, event: SortableDragEvent) =>
    entryOf(owner)?.options()[key]?.(event);
  /** `onDragEnd` for an item where it is now. */
  const ended = (item: HTMLElement) => {
    const owner = item.parentElement as HTMLElement;
    notify(owner, "onDragEnd", { item, index: indexOf(item), list: owner });
  };

  /** Ignores focusout until the owner has had a frame to update and focus was restored. */
  function holdFocus() {
    if (shared.refocusing) return;
    shared.refocusing = true;
    view.requestAnimationFrame(() =>
      view.requestAnimationFrame(() => {
        shared.refocusing = false;
      }),
    );
  }

  /** Keeps focus on `item`'s handle once the owner has moved (or re-rendered) it. */
  function keepFocus(item: HTMLElement) {
    holdFocus();
    const restore = (late: boolean) => {
      const handle = item.isConnected ? handleOf(item) : null;
      if (!handle) return;
      // A frame later, only a focus the owner's update lost (or one still in the item) comes
      // back: never one the user has moved on.
      const active = doc.activeElement;
      if (late && active && active !== doc.body && !item.contains(active)) return;
      if (active !== handle) handle.focus();
      handle.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    };
    restore(false);
    view.requestAnimationFrame(() => restore(true));
  }

  /** Asks the owner of `owner` to move `item` to `to` (clamped). Returns the target index, or -1. */
  function moveWithin(owner: HTMLElement, item: HTMLElement, to: number): number {
    const from = indexOf(item);
    const target = Math.max(0, Math.min(itemsOf(owner).length - 1, to));
    if (from === -1 || target === from) return -1;
    // Moving the focused node blurs it (Firefox fires focusout during the move): not a "leave".
    holdFocus();
    entryOf(owner)?.options().onMove?.(from, target);
    return target;
  }

  /**
   * Asks the owner of `from` to move `item` into `to` at `index` (ADR-0053). `done` gets the
   * item's element in `to` once the owner has applied it (the same node, or React's new one), or
   * `null` when it was refused. Returns the pending check, or `null` when refused at once.
   */
  function transfer(
    item: HTMLElement,
    from: HTMLElement,
    to: HTMLElement,
    toIndex: number,
    done: (moved: HTMLElement | null) => void,
  ): (() => boolean) | null {
    const fromIndex = indexOf(item);
    if (from === to || fromIndex === -1 || !entryOf(to) || !accepts(to, from)) return null;
    const index = Math.max(0, Math.min(itemsOf(to).length, toIndex));
    holdFocus();
    const onTransfer = entryOf(from)?.options().onTransfer;
    if (!onTransfer || onTransfer({ item, from, to, fromIndex, index }) === false) return null;
    let finished = false;
    let frames = 0;
    const observer = new MutationObserver(() => check());
    const finish = (moved: HTMLElement | null) => {
      finished = true;
      observer.disconnect();
      done(moved);
    };
    function check(): boolean {
      if (finished) return true;
      if (item.parentElement === to) finish(item);
      else if (!item.isConnected) {
        const all = itemsOf(to);
        finish(all[index] ?? all[all.length - 1] ?? null);
      }
      return finished;
    }
    const tick = () => {
      if (check()) return;
      if (++frames > TRANSFER_FRAMES) finish(null);
      else view.requestAnimationFrame(tick);
    };
    if (!check()) {
      observer.observe(to, { childList: true });
      view.requestAnimationFrame(tick);
    }
    return check;
  }

  // --- session ------------------------------------------------------------------------------

  /** Writes the session's flags on its item (again, when the owner rendered a new element). */
  function mark(session: Session) {
    if (session.drag) {
      session.item.setAttribute("data-ok-dragging", "");
      session.list.setAttribute("data-ok-dragging", "");
    } else {
      session.item.setAttribute("data-ok-grabbed", "");
      handleOf(session.item)?.setAttribute("aria-pressed", "true");
    }
  }

  function unmark(session: Session) {
    preview(session, null);
    session.item.removeAttribute("data-ok-grabbed");
    session.item.removeAttribute("data-ok-dragging");
    session.item.style.transform = "";
    handleOf(session.item)?.setAttribute("aria-pressed", "false");
    for (const element of lists()) element.removeAttribute("data-ok-dragging");
  }

  function grab(item: HTMLElement) {
    const owner = item.parentElement as HTMLElement;
    const session: Session = {
      item,
      list: owner,
      startList: owner,
      startIndex: indexOf(item),
      drag: null,
      pending: null,
      swap: null,
    };
    shared.session = session;
    mark(session);
    say(owner, "grabbed", session.startIndex + 1);
    notify(owner, "onDragStart", { item, index: session.startIndex, list: owner });
  }

  /** Ends the session without announcing. Returns it. */
  function release(): Session | null {
    const session = shared.session;
    if (!session) return null;
    unmark(session);
    shared.session = null;
    return session;
  }

  function drop(session: Session) {
    const swapped = commitSwap(session);
    release();
    if (swapped !== -1) keepFocus(session.item);
    finish(session, swapped);
  }

  /** Announces the drop and reports `onDragEnd` (at `swapped` after a swap). */
  function finish(session: Session, swapped: number) {
    const index = swapped === -1 ? indexOf(session.item) : swapped;
    say(session.list, "dropped", index + 1);
    notify(session.list, "onDragEnd", { item: session.item, index, list: session.list });
  }

  // --- swap strategy ----------------------------------------------------------------------------

  /**
   * Previews the swap of the session's item with `target` (`null`: none): the target moves to
   * the item's place and, without a pointer drag, the item to the target's.
   */
  function preview(session: Session, target: HTMLElement | null) {
    const previous = session.swap;
    if (previous === target) return;
    if (previous) {
      previous.style.transform = "";
      previous.removeAttribute("data-ok-swap-target");
    }
    session.swap = target;
    if (!session.drag) session.item.style.transform = "";
    if (!target) return;
    const a = restingBox(session.item);
    const b = target.getBoundingClientRect();
    target.setAttribute("data-ok-swap-target", "");
    target.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    if (!session.drag)
      session.item.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px)`;
  }

  /** Asks the owner to apply the previewed swap. Returns the item's new index, or -1. */
  function commitSwap(session: Session): number {
    const target = session.swap;
    if (!target || target.parentElement !== session.list) return -1;
    const from = indexOf(session.item);
    const to = indexOf(target);
    preview(session, null);
    holdFocus();
    entryOf(session.list)?.options().onSwap?.(from, to);
    return to;
  }

  /** Moves the session's item to `to` at `index`; it stays grabbed (or dragged) there. */
  function transferSession(session: Session, to: HTMLElement, index: number, focus: boolean) {
    preview(session, null);
    notify(session.list, "onDragOver", { item: session.item, index, list: to });
    const pending = transfer(session.item, session.list, to, index, (moved) => {
      if (shared.session !== session) return;
      session.pending = null;
      if (!moved) return;
      if (moved !== session.item) unmark(session);
      session.list.removeAttribute("data-ok-dragging");
      session.item = moved;
      session.list = to;
      mark(session);
      if (session.drag) follow(moved, session.drag);
      if (focus) keepFocus(moved);
      say(to, "movedToList", indexOf(moved) + 1);
    });
    if (pending && shared.session === session && !pending()) session.pending = pending;
    return pending !== null;
  }

  /** Puts the session's item back where it started. */
  function restore(session: Session, focus: boolean) {
    const { item, startList, startIndex } = session;
    const announce = (element: HTMLElement) => {
      if (focus) keepFocus(element);
      say(startList, "cancelled", startIndex + 1);
    };
    if (session.list === startList) {
      moveWithin(startList, item, startIndex);
      announce(item);
      return;
    }
    const pending = transfer(item, session.list, startList, startIndex, (moved) =>
      announce(moved ?? item),
    );
    if (!pending) announce(item);
  }

  /** `onDragCancel` where the item is, before it goes back. */
  const cancelled = (session: Session) =>
    notify(session.list, "onDragCancel", {
      item: session.item,
      index: indexOf(session.item),
      list: session.list,
    });

  function cancelGrab(session: Session) {
    release();
    cancelled(session);
    restore(session, true);
  }

  // --- pointer dragging ---------------------------------------------------------------------

  function follow(item: HTMLElement, drag: Drag) {
    item.style.transform = "";
    const origin = item.getBoundingClientRect();
    const x = drag.startLeft + (drag.x - drag.startX) - origin.left;
    const y = drag.startTop + (drag.y - drag.startY) - origin.top;
    item.style.transform = `translate(${x}px, ${y}px)`;
  }

  /** The registered list whose box (or Scrollbar) `target` is in. */
  function listAt(target: Element | null): HTMLElement | null {
    const scrollbar = target?.closest("[data-ok-scrollbar]");
    const candidate =
      target?.closest<HTMLElement>(LIST) ??
      scrollbar?.querySelector<HTMLElement>(`:scope > ${LIST}`);
    return candidate && entryOf(candidate) ? candidate : null;
  }

  /** One drag step: follow the pointer, then move the item to what is under it. */
  function step(session: Session) {
    const drag = session.drag as Drag;
    follow(session.item, drag);
    if (session.pending && !session.pending()) return;
    // The dragged item ignores pointer events (CSS), so this finds what is underneath.
    const under = doc.elementFromPoint(drag.x, drag.y);
    const owner = listAt(under);
    if (!owner) return;
    const over = itemIn(owner, under);
    // Disabled items are never targets (dnd-kit `disabled`).
    if (over && isDisabled(over)) return;
    if (owner === session.list && swaps(owner)) {
      // Hit test on resting boxes: the previewed target covers the item's own place.
      const hit = itemsOf(owner).find((element) => {
        const box = restingBox(element);
        return drag.x >= box.left && drag.x < box.right && drag.y >= box.top && drag.y < box.bottom;
      });
      if (!hit || hit === session.swap || isDisabled(hit)) return;
      const target = hit === session.item ? null : hit;
      if (!target && !session.swap) return;
      notify(owner, "onDragOver", { item: session.item, index: indexOf(hit), list: owner });
      preview(session, target);
      return;
    }
    if (owner === session.list) {
      if (!over || over === session.item) return;
      notify(owner, "onDragOver", { item: session.item, index: indexOf(over), list: owner });
      if (moveWithin(owner, session.item, indexOf(over)) !== -1) follow(session.item, drag);
      return;
    }
    if (!accepts(owner, session.list)) return;
    transferSession(session, owner, over ? indexOf(over) : itemsOf(owner).length, false);
  }

  function endDrag(session: Session) {
    press?.abort();
    press = null;
    const swapped = commitSwap(session);
    release();
    finish(session, swapped);
  }

  function cancelDrag(session: Session) {
    press?.abort();
    press = null;
    release();
    cancelled(session);
    restore(session, false);
  }

  // --- auto scroll ----------------------------------------------------------------------------

  /** Containers around `item` that scroll on `axis`, nearest first, then the page. */
  function scrollers(item: HTMLElement, axis: "x" | "y"): Element[] {
    const found: Element[] = [];
    const page = doc.scrollingElement as Element;
    for (let element = item.parentElement; element && element !== page; ) {
      const overflow = view.getComputedStyle(element)[axis === "x" ? "overflowX" : "overflowY"];
      if (/auto|scroll|overlay/.test(overflow)) found.push(element);
      element = element.parentElement;
    }
    found.push(page);
    return found;
  }

  /** Scrolls the nearest container (per axis) the pointer is near the edge of. */
  function autoScroll(session: Session): boolean {
    const drag = session.drag as Drag;
    if (session.list.getAttribute("data-ok-auto-scroll") === "false") return false;
    const page = doc.scrollingElement as Element;
    let scrolled = false;
    for (const axis of ["x", "y"] as const) {
      for (const element of scrollers(session.item, axis)) {
        const box =
          element === page
            ? { left: 0, top: 0, right: view.innerWidth, bottom: view.innerHeight }
            : element.getBoundingClientRect();
        const [position, start, end, crossIn] =
          axis === "x"
            ? [drag.x, box.left, box.right, drag.y >= box.top && drag.y <= box.bottom]
            : [drag.y, box.top, box.bottom, drag.x >= box.left && drag.x <= box.right];
        const speed = crossIn ? edgeSpeed(position, start, end) : 0;
        if (!speed) continue;
        let limit = drag.limits.get(element);
        if (!limit) {
          limit = {
            x: element.scrollWidth - element.clientWidth,
            y: element.scrollHeight - element.clientHeight,
          };
          drag.limits.set(element, limit);
        }
        const key = axis === "x" ? "scrollLeft" : "scrollTop";
        const before = element[key];
        const next = Math.max(0, Math.min(limit[axis], before + speed));
        if (Math.abs(next - before) < 1) continue;
        element[key] = next;
        scrolled = true;
        break;
      }
    }
    return scrolled;
  }

  /** Auto scrolls every frame while the drag lasts; items move under the pointer meanwhile. */
  function scrollLoop(session: Session, until: AbortSignal) {
    const tick = () => {
      if (until.aborted || shared.session !== session) return;
      if (autoScroll(session)) step(session);
      view.requestAnimationFrame(tick);
    };
    view.requestAnimationFrame(tick);
  }

  list.addEventListener(
    "pointerdown",
    (event) => {
      shared.suppressClick = false;
      shared.pressing = true;
      const target = event.target as Element;
      let handle: Element | null = target.closest(HANDLE);
      let item = itemIn(list, handle);
      if (!item && list.getAttribute("data-ok-activator") === "item") {
        // The whole item drags, except from controls inside it (they keep their presses).
        item = itemIn(list, target);
        const control = target.closest(INTERACTIVE);
        if (item && control && item.contains(control)) item = null;
        handle = item;
      }
      if (!item || isDisabled(item) || event.button !== 0 || !event.isPrimary) return;
      if (shared.session?.drag) return;
      // No text selection or native image drag from the item's content.
      if (handle === item && event.pointerType === "mouse") event.preventDefault();
      const box = item.getBoundingClientRect();
      const drag: Drag = {
        limits: new Map(),
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: box.left,
        startTop: box.top,
        x: event.clientX,
        y: event.clientY,
      };
      try {
        // Keeps the moves coming when the pointer leaves the handle (touch, fast drags).
        (handle as Element).setPointerCapture(event.pointerId);
      } catch {
        // Synthetic or already-released pointers can't be captured; document listeners still work.
      }
      press?.abort();
      press = new AbortController();
      const local = { signal: press.signal };
      let session: Session | null = null;
      doc.addEventListener(
        "pointermove",
        (move) => {
          if (move.pointerId !== drag.pointerId) return;
          drag.x = move.clientX;
          drag.y = move.clientY;
          if (!session) {
            if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < DRAG_THRESHOLD) return;
            if (!item.isConnected) return;
            release();
            const owner = item.parentElement as HTMLElement;
            session = {
              item,
              list: owner,
              startList: owner,
              startIndex: indexOf(item),
              drag,
              pending: null,
              swap: null,
            };
            shared.session = session;
            mark(session);
            say(owner, "grabbed", session.startIndex + 1);
            notify(owner, "onDragStart", { item, index: session.startIndex, list: owner });
            scrollLoop(session, (press as AbortController).signal);
          }
          step(session);
        },
        local,
      );
      doc.addEventListener(
        "pointerup",
        (up) => {
          if (up.pointerId !== drag.pointerId) return;
          if (session && shared.session === session) {
            // The click that follows (same task) is swallowed; none may follow (released elsewhere).
            shared.suppressClick = true;
            view.setTimeout(() => (shared.suppressClick = false));
            endDrag(session);
          } else {
            press?.abort();
            press = null;
          }
        },
        local,
      );
      doc.addEventListener(
        "pointercancel",
        (cancel) => {
          if (cancel.pointerId !== drag.pointerId) return;
          if (session && shared.session === session) cancelDrag(session);
          else {
            press?.abort();
            press = null;
          }
        },
        local,
      );
      // Escape during a drag: the focus may be anywhere (React re-renders a moved item).
      doc.addEventListener(
        "keydown",
        (key) => {
          if (key.key !== "Escape" || !session || shared.session !== session) return;
          key.preventDefault();
          cancelDrag(session);
        },
        local,
      );
    },
    { signal },
  );

  // The press ends after its click has been handled.
  doc.addEventListener(
    "pointerup",
    () => {
      if (shared.pressing) view.setTimeout(() => (shared.pressing = false));
    },
    { signal, capture: true },
  );

  // --- clicks: grab / drop / move to another item or list, remove ---------------------------

  list.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element;
      const removed = itemIn(list, target.closest(REMOVE));
      if (removed) {
        if (shared.session?.item === removed) release();
        const all = itemsOf(list);
        const index = all.indexOf(removed);
        const next = all[index + 1] ?? all[index - 1];
        options.onRemove?.(index);
        say(list, "removed", index + 1);
        if (next) keepFocus(next);
        return;
      }
      const trigger = target.closest(MOVE_TO);
      const moving = itemIn(list, trigger);
      if (moving) {
        if (isDisabled(moving)) return;
        const to = doc.getElementById(
          (trigger as Element).getAttribute("data-ok-sortable-move-to") as string,
        );
        if (!to || to === list) return;
        if (shared.session?.item === moving) release();
        transfer(moving, list, to, itemsOf(to).length, (moved) => {
          if (!moved) return;
          keepFocus(moved);
          say(to, "movedToList", indexOf(moved) + 1);
        });
        return;
      }
      const item = itemIn(list, target.closest(HANDLE));
      if (!item || isDisabled(item)) return;
      if (shared.suppressClick) {
        shared.suppressClick = false;
        return;
      }
      const session = shared.session;
      if (!session) {
        grab(item);
      } else if (session.drag) {
        return;
      } else if (session.item === item) {
        drop(session);
      } else if (session.list === list && swaps(list)) {
        notify(list, "onDragOver", { item: session.item, index: indexOf(item), list });
        preview(session, item);
        drop(session);
      } else if (session.list === list) {
        release();
        notify(list, "onDragOver", { item: session.item, index: indexOf(item), list });
        const to = moveWithin(list, session.item, indexOf(item));
        keepFocus(session.item);
        say(list, "dropped", to + 1);
        notify(list, "onDragEnd", { item: session.item, index: to, list });
      } else if (accepts(list, session.list)) {
        release();
        const index = indexOf(item);
        notify(session.list, "onDragOver", { item: session.item, index, list });
        const pending = transfer(session.item, session.list, list, index, (moved) => {
          if (!moved) return;
          keepFocus(moved);
          say(list, "movedToList", indexOf(moved) + 1);
          ended(moved);
        });
        if (!pending) {
          say(session.list, "dropped", indexOf(session.item) + 1);
          ended(session.item);
        }
      } else {
        drop(session);
        grab(item);
      }
    },
    { signal },
  );

  // --- keyboard -----------------------------------------------------------------------------

  /** Number of grid columns: items sharing the first item's row. */
  const columns = () => {
    const all = itemsOf(list);
    const top = (all[0] as HTMLElement).offsetTop;
    return all.filter((item) => item.offsetTop === top).length;
  };

  /** The previous (-1) or next (1) list of the page that takes the session's item. */
  function neighbor(session: Session, direction: -1 | 1): HTMLElement | null {
    const all = lists();
    const at = all.indexOf(session.list);
    for (let index = at + direction; index >= 0 && index < all.length; index += direction) {
      const candidate = all[index] as HTMLElement;
      if (accepts(candidate, session.list)) return candidate;
    }
    return null;
  }

  list.addEventListener(
    "keydown",
    (event) => {
      const session = shared.session;
      if (!session || session.drag || session.list !== list) return;
      if (itemIn(list, (event.target as Element).closest(HANDLE)) !== session.item) return;
      if (event.key === "Escape") {
        event.preventDefault();
        cancelGrab(session);
        return;
      }
      const layout = list.getAttribute("data-ok-layout");
      const grid = layout === "grid" || layout === null;
      const row = grid ? columns() : 1;
      const deltas: Record<string, number> =
        layout === "vertical"
          ? { ArrowUp: -1, ArrowDown: 1 }
          : layout === "horizontal"
            ? { ArrowLeft: -1, ArrowRight: 1 }
            : { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -row, ArrowDown: row };
      // Keys that move the item to the previous / next list of its group (ADR-0053).
      const across: Record<string, -1 | 1> =
        layout === "vertical"
          ? { ArrowLeft: -1, ArrowRight: 1 }
          : layout === "horizontal"
            ? { ArrowUp: -1, ArrowDown: 1 }
            : {};
      const index = indexOf(session.item);
      const last = itemsOf(list).length - 1;
      const swap = swaps(list);
      // Swap lists: the keys move the previewed target; the item stays in its place.
      const at = swap && session.swap ? indexOf(session.swap) : index;
      let direction = across[event.key];
      if (grid && event.key === "ArrowLeft" && at === 0) direction = -1;
      if (grid && event.key === "ArrowRight" && at === last) direction = 1;
      const delta = deltas[event.key];
      if (direction === undefined && delta === undefined) return;
      event.preventDefault();
      if (session.pending) return;
      if (direction !== undefined) {
        const to = neighbor(session, direction);
        if (!to) return;
        transferSession(session, to, grid ? (direction === 1 ? 0 : itemsOf(to).length) : at, true);
        return;
      }
      // Disabled items are skipped: the item jumps past them (or stays when none is left).
      const all = itemsOf(list);
      const sign = Math.sign(delta as number);
      let target = Math.max(0, Math.min(last, at + (delta as number)));
      const blocked = (i: number) => i >= 0 && i <= last && isDisabled(all[i] as HTMLElement);
      while (target !== at && target !== index && blocked(target)) target += sign;
      if (target < 0 || target > last || target === at) return;
      notify(list, "onDragOver", { item: session.item, index: target, list });
      if (swap) {
        preview(session, target === index ? null : (all[target] as HTMLElement));
        say(list, "moved", target + 1);
        return;
      }
      const to = moveWithin(list, session.item, target);
      keepFocus(session.item);
      say(list, "moved", to + 1);
    },
    { signal },
  );

  list.addEventListener(
    "focusout",
    (event) => {
      const session = shared.session;
      if (!session || session.drag || session.list !== list) return;
      if (shared.refocusing || shared.pressing || session.pending) return;
      const next = event.relatedTarget;
      if (next instanceof Node && list.contains(next)) return;
      drop(session);
    },
    { signal },
  );

  return {
    get grabbed() {
      const session = shared.session;
      return session && !session.drag && session.list === list ? indexOf(session.item) : -1;
    },
    setOptions(next) {
      options = next;
    },
    destroy() {
      if (signal.aborted) return;
      const session = shared.session;
      if (session && (session.list === list || press)) release();
      press?.abort();
      press = null;
      shared.entries.delete(entry);
      listeners.abort();
    },
  };
}
