import {
  createTreeController,
  nextTreeSelection,
  treeItemId,
  treeItemRange,
  visibleTreeItems,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface TreeViewInstance extends ComponentInstance {
  /** Ids of the expanded items. */
  readonly expandedItems: string[];
  /** Ids of the selected items. */
  readonly selectedItems: string[];
  /** Expands or collapses an item without emitting events. */
  setExpanded(itemId: string, expanded: boolean): void;
  /** Selects exactly these items without emitting events. */
  setSelected(itemIds: readonly string[]): void;
}

const ITEM = '[role="treeitem"]';

/**
 * Tree view — spec: specs/components/tree-view.md
 *
 * Markup:  <ul data-ok-tree-view role="tree" aria-label="Files">
 *            <li role="treeitem" data-ok-tree-item data-ok-item-id="docs" aria-expanded="false" aria-selected="false" tabindex="0">
 *              <div data-ok-tree-item-content><span data-ok-tree-item-icon>…chevron…</span>
 *                <span data-ok-tree-item-label>Documents</span></div>
 *              <ul role="group" data-ok-tree-item-group hidden>…items…</ul>
 *            </li>
 *          </ul>
 * Behavior: core `createTreeController` (arrows, Home / End, `*`, typeahead, clicks); the runtime
 *          applies `aria-expanded` + the group's `hidden`, `aria-selected`, the checkboxes of
 *          `data-ok-checkbox-selection` and the tab order (the selected item, else the first).
 * Events:  ok:tree-view:expand (cancelable, `{ itemId, expanded }`),
 *          ok:tree-view:select (cancelable, `{ selectedItems }`).
 */
export const treeView = defineComponent<TreeViewInstance>({
  name: "tree-view",
  selector: "[data-ok-tree-view]",

  setup(element, { emit }) {
    const items = () =>
      [...element.querySelectorAll<HTMLElement>(ITEM)].filter(
        (item) => item.closest('[role="tree"]') === element,
      );
    const byId = (id: string) => items().find((item) => treeItemId(item) === id);
    const multi = () => element.getAttribute("aria-multiselectable") === "true";
    let anchor: string | null = null;

    const order = () => {
      const all = items();
      const selected = all.find((item) => item.getAttribute("aria-selected") === "true");
      const first = selected && visibleTreeItems(element).includes(selected) ? selected : all[0];
      for (const item of all) item.tabIndex = item === first ? 0 : -1;
    };

    const instance: TreeViewInstance = {
      get expandedItems() {
        return items()
          .filter((item) => item.getAttribute("aria-expanded") === "true")
          .map(treeItemId);
      },
      get selectedItems() {
        return items()
          .filter((item) => item.getAttribute("aria-selected") === "true")
          .map(treeItemId);
      },
      setExpanded(itemId, expanded) {
        const item = byId(itemId);
        if (!item?.hasAttribute("aria-expanded")) return;
        item.setAttribute("aria-expanded", String(expanded));
        const group = item.querySelector<HTMLElement>(':scope > [role="group"]');
        if (group) group.hidden = !expanded;
        order();
      },
      setSelected(itemIds) {
        for (const item of items()) {
          if (!item.hasAttribute("aria-selected")) continue;
          const on = itemIds.includes(treeItemId(item));
          item.setAttribute("aria-selected", String(on));
          const checkbox = item.querySelector<HTMLInputElement>(
            ":scope > [data-ok-tree-item-content] [data-ok-tree-item-checkbox] input",
          );
          if (checkbox) checkbox.checked = on;
        }
        order();
      },
      destroy() {
        controller.destroy();
      },
    };

    const controller = createTreeController(element, {
      onToggle: (_item, itemId, expanded) => {
        if (emit("expand", { itemId, expanded }, { cancelable: true }))
          instance.setExpanded(itemId, expanded);
      },
      onSelect: (item, itemId, mode) => {
        const from = anchor ? byId(anchor) : undefined;
        const range = from ? treeItemRange(element, from, item).map(treeItemId) : [itemId];
        const next = nextTreeSelection(instance.selectedItems, itemId, mode, multi(), range);
        if (!mode.range) anchor = itemId;
        if (emit("select", { selectedItems: next }, { cancelable: true }))
          instance.setSelected(next);
      },
    });
    order();
    return instance;
  },
});
