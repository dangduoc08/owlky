/*
 * Tree view behavior (WAI-ARIA tree pattern, MUI X Tree View), shared by React and the HTML
 * runtime: focus movement, expansion and selection intent, typeahead, label editing (F2, double
 * click; Enter saves, Escape cancels), reordering (a pointer drag, or Ctrl / ⌘ + Shift + arrows).
 * The controller owns no state: it reports what the user asked (`onToggle`, `onSelect`,
 * `onEdit`, `onMove`) and the owner writes `aria-expanded`, `aria-selected`, `hidden`,
 * `tabindex` and the item order. It writes only the drag's transient attributes
 * (`data-ok-dragging`, `data-ok-drop-position`).
 */

import { createTypeahead } from "../menu/menu-navigation.js";

const ITEM = '[role="treeitem"]';

export interface TreeControllerOptions {
  /** Expand (`true`) or collapse (`false`) `item`. */
  onToggle(item: HTMLElement, id: string, expand: boolean): void;
  /**
   * Select `item`. `toggle`: add or remove it (Ctrl / ⌘ click, Space in multi-select, checkbox);
   * `range`: from the last selected item (Shift).
   */
  onSelect(item: HTMLElement, id: string, mode: { toggle: boolean; range: boolean }): void;
  /** A click on an item's row (MUI `onItemClick`). */
  onItemClick?(item: HTMLElement, id: string, event: MouseEvent): void;
  /** An item got the focus (MUI `onItemFocus`). */
  onItemFocus?(item: HTMLElement, id: string): void;
  /** Label editing: `start` (F2, double click), `commit` with the input's value, or `cancel`. */
  onEdit?(
    item: HTMLElement,
    id: string,
    action: "start" | "commit" | "cancel",
    value?: string,
  ): void;
  /** Move an item to `position` (index among the new parent's children, the item removed first). */
  onMove?(item: HTMLElement, id: string, position: TreeItemPosition): void;
}

/** Where an item sits: its parent's id (`null`: the root) and its index among the siblings. */
export interface TreeItemPosition {
  parentId: string | null;
  index: number;
}

export interface TreeController {
  destroy(): void;
}

/** The item's id (`data-ok-item-id`). */
export const treeItemId = (item: Element): string => item.getAttribute("data-ok-item-id") ?? "";

const isDisabled = (item: Element) => item.getAttribute("aria-disabled") === "true";
/** Disabled items are skipped by the focus unless the tree has `data-ok-disabled-items-focusable`. */
const focusableItem = (tree: Element, item: Element) =>
  !isDisabled(item) || tree.hasAttribute("data-ok-disabled-items-focusable");
const selectionDisabled = (tree: Element, item: Element) =>
  isDisabled(item) ||
  tree.hasAttribute("data-ok-disable-selection") ||
  item.hasAttribute("data-ok-disable-selection");
/** `data-ok-editable` on the item (or the whole tree), unless the item says `"false"`. */
export const isTreeItemEditable = (tree: Element, item: Element): boolean =>
  !isDisabled(item) &&
  item.getAttribute("data-ok-editable") !== "false" &&
  (item.hasAttribute("data-ok-editable") || tree.hasAttribute("data-ok-editable"));
/** With `data-ok-items-reordering` on the tree, unless the item has `data-ok-reorderable="false"`. */
export const isTreeItemReorderable = (tree: Element, item: Element): boolean =>
  tree.hasAttribute("data-ok-items-reordering") &&
  item.getAttribute("data-ok-reorderable") !== "false" &&
  !isDisabled(item);
const isExpandable = (item: Element) => item.hasAttribute("aria-expanded");
const isExpanded = (item: Element) => item.getAttribute("aria-expanded") === "true";

/** Items of `tree` a user can reach: those whose ancestors are all expanded (in order). */
export function visibleTreeItems(tree: Element): HTMLElement[] {
  return [...tree.querySelectorAll<HTMLElement>(ITEM)].filter((item) => {
    if (item.closest('[role="tree"]') !== tree) return false;
    let parent = item.parentElement?.closest(ITEM);
    while (parent && tree.contains(parent)) {
      if (!isExpanded(parent)) return false;
      parent = parent.parentElement?.closest(ITEM);
    }
    return true;
  });
}

/** The item's parent item, if any. */
export const parentTreeItem = (item: Element): HTMLElement | null =>
  item.parentElement?.closest<HTMLElement>(ITEM) ?? null;

/** The item's own child items. */
export const childTreeItems = (item: Element): HTMLElement[] =>
  [...item.querySelectorAll<HTMLElement>(ITEM)].filter((child) => parentTreeItem(child) === item);

/** The item's position: its parent's id and its index among its siblings. */
export function treeItemPosition(item: Element): TreeItemPosition {
  const parent = parentTreeItem(item);
  const siblings = parent
    ? childTreeItems(parent)
    : [...(item.closest('[role="tree"]')?.querySelectorAll(ITEM) ?? [])].filter(
        (i) => !parentTreeItem(i),
      );
  return {
    parentId: parent ? treeItemId(parent) : null,
    index: siblings.indexOf(item as HTMLElement),
  };
}

export type TreeDropPosition = "before" | "after" | "inside";

/**
 * The new position of `item` dropped `where` relative to `target` (index counted with the item
 * removed), or `null` when that isn't a move (onto itself, into its own subtree, no change).
 */
export function treeDropTarget(
  item: Element,
  target: Element,
  where: TreeDropPosition,
): TreeItemPosition | null {
  if (item === target || item.contains(target)) return null;
  const from = treeItemPosition(item);
  let next: TreeItemPosition;
  if (where === "inside") {
    next = { parentId: treeItemId(target), index: childTreeItems(target).length };
  } else {
    const at = treeItemPosition(target);
    let index = at.index + (where === "after" ? 1 : 0);
    if (at.parentId === from.parentId && from.index < index) index -= 1;
    next = { parentId: at.parentId, index };
  }
  return next.parentId === from.parentId && next.index === from.index ? null : next;
}

/** The keyboard alternative to dragging: Ctrl / ⌘ + Shift + an arrow. */
function keyboardMove(item: HTMLElement, key: string): TreeItemPosition | null {
  const from = treeItemPosition(item);
  const parent = parentTreeItem(item);
  const siblings = parent
    ? childTreeItems(parent)
    : [...(item.closest('[role="tree"]')?.querySelectorAll<HTMLElement>(ITEM) ?? [])].filter(
        (i) => !parentTreeItem(i),
      );
  switch (key) {
    case "ArrowUp":
      return from.index > 0 ? { parentId: from.parentId, index: from.index - 1 } : null;
    case "ArrowDown":
      return from.index < siblings.length - 1
        ? { parentId: from.parentId, index: from.index + 1 }
        : null;
    case "ArrowRight": {
      // Into the previous sibling, as its last child.
      const previous = siblings[from.index - 1];
      return previous
        ? { parentId: treeItemId(previous), index: childTreeItems(previous).length }
        : null;
    }
    case "ArrowLeft":
      // Out of the parent, right after it.
      return parent
        ? { ...treeItemPosition(parent), index: treeItemPosition(parent).index + 1 }
        : null;
    default:
      return null;
  }
}

/** Items between `a` and `b` (inclusive) in visible order. */
export function treeItemRange(tree: Element, a: Element, b: Element): HTMLElement[] {
  const items = visibleTreeItems(tree);
  const [from, to] = [items.indexOf(a as HTMLElement), items.indexOf(b as HTMLElement)].sort(
    (x, y) => x - y,
  );
  if ((from as number) < 0) return [b as HTMLElement];
  return items.slice(from, (to as number) + 1);
}

/**
 * Connects a `ul[role=tree]`: items are `li[role=treeitem][data-ok-item-id]` with their row in
 * `[data-ok-tree-item-content]` and children in `ul[role=group]`.
 */
export function createTreeController(
  tree: HTMLElement,
  options: TreeControllerOptions,
): TreeController {
  const abort = new AbortController();
  const { signal } = abort;
  const typeahead = createTypeahead();
  const own = (target: EventTarget | null) => {
    const item = target instanceof Element ? target.closest<HTMLElement>(ITEM) : null;
    return item && item.closest('[role="tree"]') === tree ? item : null;
  };
  const focus = (item: HTMLElement | null | undefined) => {
    if (item && focusableItem(tree, item)) item.focus();
  };
  const select = (item: HTMLElement, toggle: boolean, range: boolean) => {
    if (!selectionDisabled(tree, item)) options.onSelect(item, treeItemId(item), { toggle, range });
  };
  /** Visible items the focus can land on. */
  const reachable = () => visibleTreeItems(tree).filter((item) => focusableItem(tree, item));
  const editing = (target: EventTarget | null) =>
    target instanceof HTMLInputElement && target.hasAttribute("data-ok-tree-item-label-input");
  const startEdit = (item: HTMLElement) => {
    if (isTreeItemEditable(tree, item)) options.onEdit?.(item, treeItemId(item), "start");
  };
  const finishEdit = (input: HTMLInputElement, action: "commit" | "cancel") => {
    const item = own(input);
    if (!item || input.hasAttribute("data-ok-finished")) return;
    // One answer per edit: blur after Enter / Escape must not commit again.
    input.setAttribute("data-ok-finished", "");
    options.onEdit?.(item, treeItemId(item), action, action === "commit" ? input.value : undefined);
    item.focus();
  };

  // Pointer reordering: the drag starts after a few pixels, the target row shows where it lands.
  let drag: {
    item: HTMLElement;
    x: number;
    y: number;
    id: number;
    started: boolean;
    target: HTMLElement | null;
    where: TreeDropPosition | null;
  } | null = null;
  let swallowClick = false;
  const clearDrop = () => {
    for (const el of tree.querySelectorAll("[data-ok-drop-position]"))
      el.removeAttribute("data-ok-drop-position");
  };
  const endDrag = () => {
    clearDrop();
    drag?.item.removeAttribute("data-ok-dragging");
    drag = null;
  };
  tree.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target as Element;
      const item = own(target);
      if (event.button !== 0 || !item || !target.closest("[data-ok-tree-item-content]")) return;
      if (
        target.closest("input, [data-ok-tree-item-checkbox]") ||
        !isTreeItemReorderable(tree, item)
      )
        return;
      drag = {
        item,
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
        started: false,
        target: null,
        where: null,
      };
    },
    { signal },
  );
  tree.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      if (!drag.started) {
        if (Math.abs(event.clientX - drag.x) < 4 && Math.abs(event.clientY - drag.y) < 4) return;
        drag.started = true;
        drag.item.setAttribute("data-ok-dragging", "");
        try {
          tree.setPointerCapture(event.pointerId);
        } catch {
          // Synthetic pointers can't be captured.
        }
      }
      const under = tree.ownerDocument.elementFromPoint(event.clientX, event.clientY);
      const row = under?.closest<HTMLElement>("[data-ok-tree-item-content]");
      const target = row ? own(row) : null;
      clearDrop();
      drag.target = null;
      drag.where = null;
      if (!target || !row || target === drag.item || drag.item.contains(target)) return;
      const box = row.getBoundingClientRect();
      const y = (event.clientY - box.top) / Math.max(1, box.height);
      const where: TreeDropPosition = y < 0.25 ? "before" : y > 0.75 ? "after" : "inside";
      if (!treeDropTarget(drag.item, target, where)) return;
      drag.target = target;
      drag.where = where;
      target.setAttribute("data-ok-drop-position", where);
    },
    { signal },
  );
  tree.addEventListener(
    "pointerup",
    (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const { item, started, target, where } = drag;
      endDrag();
      if (!started) return;
      swallowClick = true;
      const position = target && where ? treeDropTarget(item, target, where) : null;
      if (position) options.onMove?.(item, treeItemId(item), position);
    },
    { signal },
  );
  tree.addEventListener("pointercancel", endDrag, { signal });
  tree.addEventListener(
    "focusin",
    (event) => {
      const item = own(event.target);
      if (item && event.target === item) options.onItemFocus?.(item, treeItemId(item));
    },
    { signal },
  );
  tree.addEventListener(
    "focusout",
    (event) => {
      if (editing(event.target)) finishEdit(event.target as HTMLInputElement, "commit");
    },
    { signal },
  );
  tree.addEventListener(
    "dblclick",
    (event) => {
      const item = own(event.target);
      if (item && (event.target as Element).closest("[data-ok-tree-item-label]")) startEdit(item);
    },
    { signal },
  );
  const toggle = (item: HTMLElement, expand = !isExpanded(item)) => {
    if (isExpandable(item) && !isDisabled(item) && expand !== isExpanded(item))
      options.onToggle(item, treeItemId(item), expand);
  };
  const multi = () => tree.getAttribute("aria-multiselectable") === "true";

  tree.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element;
      if (swallowClick) {
        swallowClick = false;
        return;
      }
      const item = own(target);
      if (!item || !target.closest("[data-ok-tree-item-content]")) return;
      if (target.closest(ITEM) !== item || editing(target)) return;
      options.onItemClick?.(item, treeItemId(item), event);
      focus(item);
      const onIcon = target.closest("[data-ok-tree-item-icon]") !== null;
      const onCheckbox = target.closest("[data-ok-tree-item-checkbox]") !== null;
      const iconOnly = tree.getAttribute("data-ok-expansion-trigger") === "iconContainer";
      if (onCheckbox) {
        select(item, true, false);
        return;
      }
      if (!iconOnly || onIcon) toggle(item);
      if (iconOnly && onIcon) return;
      select(item, multi() && (event.ctrlKey || event.metaKey), multi() && event.shiftKey);
    },
    { signal },
  );

  tree.addEventListener(
    "keydown",
    (event) => {
      if (editing(event.target)) {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          finishEdit(event.target as HTMLInputElement, event.key === "Enter" ? "commit" : "cancel");
        }
        return;
      }
      const item = own(event.target);
      if (!item || event.target !== item || event.altKey) return;
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.startsWith("Arrow")) {
        if (!isTreeItemReorderable(tree, item)) return;
        event.preventDefault();
        const position = keyboardMove(item, event.key);
        if (position) options.onMove?.(item, treeItemId(item), position);
        return;
      }
      if (event.key === "F2") {
        event.preventDefault();
        startEdit(item);
        return;
      }
      const items = reachable();
      const index = items.indexOf(item);
      let handled = true;
      switch (event.key) {
        case "ArrowDown":
          focus(items[index + 1]);
          if (event.shiftKey && multi()) select(items[index + 1] ?? item, false, true);
          break;
        case "ArrowUp":
          focus(items[index - 1]);
          if (event.shiftKey && multi()) select(items[index - 1] ?? item, false, true);
          break;
        case "ArrowRight":
          if (isExpandable(item) && !isExpanded(item)) toggle(item, true);
          else if (isExpanded(item)) focus(childTreeItems(item)[0]);
          break;
        case "ArrowLeft":
          if (isExpanded(item)) toggle(item, false);
          else focus(parentTreeItem(item));
          break;
        case "Home":
          focus(items[0]);
          break;
        case "End":
          focus(items[items.length - 1]);
          break;
        case "Enter":
          if (isExpandable(item)) toggle(item);
          else select(item, multi(), false);
          break;
        case " ":
          select(item, multi(), multi() && event.shiftKey);
          break;
        case "*": {
          const parent = parentTreeItem(item);
          const siblings = parent
            ? childTreeItems(parent)
            : [...tree.querySelectorAll<HTMLElement>(ITEM)].filter((i) => !parentTreeItem(i));
          for (const sibling of siblings) toggle(sibling, true);
          break;
        }
        default: {
          const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey;
          const match = printable ? typeahead.match(items, item, event.key) : null;
          handled = match !== null;
          focus(match);
        }
      }
      if (handled) event.preventDefault();
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
 * The selection after a request: single select replaces it (selecting the selected item keeps
 * it); multi select replaces it too, unless `toggle` (add / remove) or `range` (`rangeIds`, from
 * the anchor to the item, replace the selection).
 */
/** Selection propagation (MUI `selectionPropagation`). */
export interface TreeSelectionPropagation {
  /** Selecting every child selects the parent; deselecting one deselects it. */
  parents?: boolean | undefined;
  /** Selecting or deselecting an item does the same to its descendants. */
  descendants?: boolean | undefined;
}

/** `"parents descendants"` (HTML) or an object; anything else → none. */
export function parseSelectionPropagation(value: unknown): TreeSelectionPropagation {
  if (typeof value === "string") {
    const words = value.split(/\s+/);
    return { parents: words.includes("parents"), descendants: words.includes("descendants") };
  }
  if (typeof value !== "object" || value === null) return {};
  const given = value as Record<string, unknown>;
  return { parents: given["parents"] === true, descendants: given["descendants"] === true };
}

/**
 * `next` with the propagation applied, from the tree's DOM: items added to the selection add
 * their descendants (and removed ones remove them); then each parent is selected exactly when
 * all its children are. Disabled items and items whose selection is disabled are left alone.
 */
export function propagateTreeSelection(
  tree: Element,
  previous: readonly string[],
  next: readonly string[],
  propagation: TreeSelectionPropagation,
): string[] {
  if (!propagation.parents && !propagation.descendants) return [...next];
  const all = [...tree.querySelectorAll<HTMLElement>(ITEM)].filter(
    (item) => item.closest('[role="tree"]') === tree,
  );
  const byId = new Map(all.map((item) => [treeItemId(item), item]));
  const selectable = (item: Element) => !selectionDisabled(tree, item);
  const result = new Set(next);
  if (propagation.descendants) {
    const added = next.filter((id) => !previous.includes(id));
    const removed = previous.filter((id) => !next.includes(id));
    const descendants = (id: string) =>
      [...(byId.get(id)?.querySelectorAll<HTMLElement>(ITEM) ?? [])]
        .filter(selectable)
        .map(treeItemId);
    for (const id of added) for (const child of descendants(id)) result.add(child);
    for (const id of removed) for (const child of descendants(id)) result.delete(child);
  }
  if (propagation.parents) {
    // Deepest parents first, so a change reaches the root.
    const parents = all.filter((item) => childTreeItems(item).length > 0).reverse();
    for (const parent of parents) {
      if (!selectable(parent)) continue;
      const children = childTreeItems(parent).filter(selectable);
      if (children.length === 0) continue;
      if (children.every((child) => result.has(treeItemId(child)))) result.add(treeItemId(parent));
      else result.delete(treeItemId(parent));
    }
  }
  return all.map(treeItemId).filter((id) => result.has(id));
}

/**
 * Ids of expandable items: every one, those down to `depth` (0 = the root's items), or those
 * in the subtree of `under` (itself included). For `expandAll`, `expandToDepth`, `expandSubtree`.
 */
export function treeBranchIds(
  tree: Element,
  options: { depth?: number | undefined; under?: string | undefined } = {},
): string[] {
  const root = options.under
    ? tree.querySelector(`${ITEM}[data-ok-item-id="${CSS.escape(options.under)}"]`)
    : tree;
  if (!root) return [];
  const items = [
    ...(root === tree ? [] : [root as HTMLElement]),
    ...root.querySelectorAll<HTMLElement>(ITEM),
  ].filter((item) => item.closest('[role="tree"]') === tree && isExpandable(item));
  if (options.depth === undefined) return items.map(treeItemId);
  const depth = (item: Element) => {
    let level = 0;
    for (let parent = parentTreeItem(item); parent; parent = parentTreeItem(parent)) level += 1;
    return level;
  };
  return items.filter((item) => depth(item) < (options.depth as number)).map(treeItemId);
}

/**
 * Search highlight: items whose label contains `query` (case-insensitive) and their ancestors.
 * An empty query matches nothing.
 */
export function treeHighlight(
  tree: Element,
  query: string,
): { matches: string[]; ancestors: string[] } {
  const text = query.trim().toLocaleLowerCase();
  const matches: string[] = [];
  const ancestors = new Set<string>();
  if (!text) return { matches, ancestors: [] };
  for (const item of tree.querySelectorAll<HTMLElement>(ITEM)) {
    if (item.closest('[role="tree"]') !== tree) continue;
    const label = item.querySelector(
      ":scope > [data-ok-tree-item-content] [data-ok-tree-item-label]",
    );
    if (!label?.textContent?.toLocaleLowerCase().includes(text)) continue;
    matches.push(treeItemId(item));
    for (let parent = parentTreeItem(item); parent; parent = parentTreeItem(parent))
      ancestors.add(treeItemId(parent));
  }
  // Ancestors in document order.
  const order = [...tree.querySelectorAll(ITEM)].map(treeItemId);
  return { matches, ancestors: order.filter((id) => ancestors.has(id) && !matches.includes(id)) };
}

/** Writes the highlight attributes (`data-ok-highlighted`, `data-ok-highlighted-ancestor`). */
export function applyTreeHighlight(tree: Element, query: string): void {
  const { matches, ancestors } = treeHighlight(tree, query);
  for (const item of tree.querySelectorAll<HTMLElement>(ITEM)) {
    if (item.closest('[role="tree"]') !== tree) continue;
    const id = treeItemId(item);
    item.toggleAttribute("data-ok-highlighted", matches.includes(id));
    item.toggleAttribute("data-ok-highlighted-ancestor", ancestors.includes(id));
  }
}

/** A child count that says "children to load" (MUI's data source: `-1` = unknown, `> 0`). */
export const hasLazyChildren = (count: unknown): boolean =>
  typeof count === "number" && (count === -1 || count > 0);

export function nextTreeSelection(
  current: readonly string[],
  id: string,
  mode: { toggle: boolean; range: boolean },
  multi: boolean,
  rangeIds: readonly string[] = [id],
): string[] {
  if (!multi) return [id];
  if (mode.range) return [...rangeIds];
  if (mode.toggle) return current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
  return [id];
}
