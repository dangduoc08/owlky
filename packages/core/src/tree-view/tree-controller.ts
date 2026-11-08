/*
 * Tree view behavior (WAI-ARIA tree pattern, MUI X Tree View), shared by React and the HTML
 * runtime: focus movement, expansion and selection intent, typeahead. The controller owns no
 * state: it reports what the user asked (`onToggle`, `onSelect`) and the owner writes
 * `aria-expanded`, `aria-selected`, `hidden` and `tabindex`.
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
}

export interface TreeController {
  destroy(): void;
}

/** The item's id (`data-ok-item-id`). */
export const treeItemId = (item: Element): string => item.getAttribute("data-ok-item-id") ?? "";

const isDisabled = (item: Element) => item.getAttribute("aria-disabled") === "true";
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
  const focus = (item: HTMLElement | null | undefined) => item?.focus();
  const select = (item: HTMLElement, toggle: boolean, range: boolean) => {
    if (!isDisabled(item) && !tree.hasAttribute("data-ok-disable-selection"))
      options.onSelect(item, treeItemId(item), { toggle, range });
  };
  const toggle = (item: HTMLElement, expand = !isExpanded(item)) => {
    if (isExpandable(item) && !isDisabled(item) && expand !== isExpanded(item))
      options.onToggle(item, treeItemId(item), expand);
  };
  const multi = () => tree.getAttribute("aria-multiselectable") === "true";

  tree.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element;
      const item = own(target);
      if (!item || !target.closest("[data-ok-tree-item-content]")) return;
      if (target.closest(ITEM) !== item) return;
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
      const item = own(event.target);
      if (!item || event.target !== item || event.altKey) return;
      const items = visibleTreeItems(tree);
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
