import {
  applyTreeHighlight,
  childTreeItems,
  createTreeController,
  hasLazyChildren,
  nextTreeSelection,
  parentTreeItem,
  parseSelectionPropagation,
  propagateTreeSelection,
  type TreeItemPosition,
  treeBranchIds,
  treeItemId,
  treeItemPosition,
  treeItemRange,
  treeViewOptions,
  treeViewStyle,
  visibleTreeItems,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface TreeViewEvents {
  /** Before an item expands or collapses. Call `preventDefault()` to refuse. */
  expand: EventSpec<{ itemId: string; expanded: boolean }, true>;
  /** Before the selection changes. Call `preventDefault()` to keep the current one. */
  select: EventSpec<{ selectedItems: string[] }, true>;
  /** After an item's selection changed, once per item. */
  selectiontoggle: EventSpec<{ itemId: string; selected: boolean }>;
  /** An item's row was clicked. */
  itemclick: EventSpec<{ itemId: string }>;
  /** An item got the focus. */
  itemfocus: EventSpec<{ itemId: string }>;
  /** Before an edited label is saved. Call `preventDefault()` to keep the old one. */
  labelchange: EventSpec<{ itemId: string; label: string }, true>;
  /** Before an item moves. Call `preventDefault()` to refuse (MUI `canMoveItemToNewPosition`). */
  move: EventSpec<
    { itemId: string; oldPosition: TreeItemPosition; newPosition: TreeItemPosition },
    true
  >;
  /** After an item moved. */
  positionchange: EventSpec<{
    itemId: string;
    oldPosition: TreeItemPosition;
    newPosition: TreeItemPosition;
  }>;
}

/** An item the data source returns: built with text only. */
export interface TreeViewDataItem {
  id: string;
  label: string;
  disabled?: boolean | undefined;
  /** `0` none, `-1` unknown (expandable), or a count. */
  childrenCount?: number | undefined;
}

/** Loads children on demand (MUI `dataSource`). */
export interface TreeViewDataSource {
  /** The children of an item, or the root's items (`parentId` undefined). */
  getTreeItems(parentId?: string): Promise<readonly TreeViewDataItem[]>;
}

export interface TreeViewInstance extends ComponentInstance {
  /** Ids of the expanded items. */
  readonly expandedItems: string[];
  /** Ids of the selected items. */
  readonly selectedItems: string[];
  /** Expands or collapses an item without emitting events. */
  setExpanded(itemId: string, expanded: boolean): void;
  /** Selects exactly these items without emitting events. */
  setSelected(itemIds: readonly string[]): void;
  /** Expands every item that has children. */
  expandAll(): void;
  /** Collapses every item. */
  collapseAll(): void;
  /** Expands the items down to `depth` levels (1: the root's items) and collapses the rest. */
  expandToDepth(depth: number): void;
  /** Expands an item and all its descendants. */
  expandSubtree(itemId: string): void;
  /** Moves the focus to an item. */
  focusItem(itemId: string): void;
  /** The ids of an item's children (`null`: the root's), in order. */
  getItemOrderedChildrenIds(itemId: string | null): string[];
  /** Starts (or with `null`, stops) editing an item's label. */
  setEditedItem(itemId: string | null): void;
  /** Changes an item's label text without emitting events. */
  updateItemLabel(itemId: string, label: string): void;
  /** Highlights the items whose label contains `query`, and their ancestors (`""` clears). */
  highlight(query: string): void;
  /** Loads children on expand from `source` (items with `data-ok-lazy`), and the root's items if the tree is empty. */
  setDataSource(source: TreeViewDataSource | null): void;
}

const ITEM = '[role="treeitem"]';
const SVG = "http://www.w3.org/2000/svg";
const { itemChildrenIndentation } = treeViewOptions.options;

function chevron(): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("data-ok-tree-chevron", "");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 24 24");
  for (const [name, value] of [
    ["fill", "none"],
    ["stroke", "currentColor"],
    ["stroke-width", "2"],
    ["stroke-linecap", "round"],
    ["stroke-linejoin", "round"],
  ])
    svg.setAttribute(name as string, value as string);
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", "m9 18 6-6-6-6");
  svg.append(path);
  return svg;
}

/** An indeterminate CircularProgress (same anatomy as circular-progress.css). */
function spinner(): HTMLElement {
  const root = document.createElement("span");
  for (const [name, value] of [
    ["data-ok-circular-progress", ""],
    ["data-ok-variant", "indeterminate"],
    ["data-ok-color", "inherit"],
    ["role", "progressbar"],
    ["aria-label", "Loading"],
  ])
    root.setAttribute(name as string, value as string);
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("data-ok-circular-progress-svg", "");
  svg.setAttribute("viewBox", "22 22 44 44");
  svg.setAttribute("aria-hidden", "true");
  const circle = document.createElementNS(SVG, "circle");
  circle.setAttribute("data-ok-circular-progress-circle", "");
  for (const [name, value] of [
    ["cx", "44"],
    ["cy", "44"],
    ["r", "20.2"],
    ["stroke-width", "3.6"],
  ])
    circle.setAttribute(name as string, value as string);
  svg.append(circle);
  root.append(svg);
  return root;
}

function errorIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("data-ok-tree-error-icon", "");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 24 24");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 15h-2v-2h2zm0-4h-2V7h2z");
  path.setAttribute("fill", "currentColor");
  svg.append(path);
  return svg;
}

const group = (item: Element) => item.querySelector<HTMLElement>(':scope > [role="group"]');
const content = (item: Element) =>
  item.querySelector<HTMLElement>(":scope > [data-ok-tree-item-content]");
const iconOf = (item: Element) =>
  item.querySelector<HTMLElement>(
    ":scope > [data-ok-tree-item-content] > [data-ok-tree-item-icon]",
  );
const labelOf = (item: Element) =>
  item.querySelector<HTMLElement>(
    ":scope > [data-ok-tree-item-content] > [data-ok-tree-item-label]",
  );

/** An empty child group (a Collapse), closed. */
function makeGroup(): HTMLElement {
  const ul = document.createElement("ul");
  ul.setAttribute("data-ok-collapse", "");
  ul.setAttribute("role", "group");
  ul.setAttribute("data-ok-tree-item-group", "");
  ul.hidden = true;
  return ul;
}

/** A tree item built with createElement / textContent (the data source's items). */
function buildItem(data: TreeViewDataItem, checkbox: Element | null): HTMLLIElement {
  const li = document.createElement("li");
  li.setAttribute("role", "treeitem");
  li.setAttribute("data-ok-tree-item", "");
  li.setAttribute("data-ok-item-id", String(data.id));
  li.tabIndex = -1;
  if (data.disabled) li.setAttribute("aria-disabled", "true");
  const row = document.createElement("div");
  row.setAttribute("data-ok-tree-item-content", "");
  const icon = document.createElement("span");
  icon.setAttribute("data-ok-tree-item-icon", "");
  row.append(icon);
  if (checkbox) row.append(checkbox.cloneNode(true));
  const label = document.createElement("span");
  label.setAttribute("data-ok-tree-item-label", "");
  label.textContent = String(data.label);
  row.append(label);
  li.append(row);
  if (hasLazyChildren(data.childrenCount)) {
    li.setAttribute("aria-expanded", "false");
    li.setAttribute("data-ok-lazy", "");
    icon.append(chevron());
    li.append(makeGroup());
  }
  return li;
}

/**
 * Tree view — spec: specs/components/tree-view.md
 *
 * Markup:  <ul data-ok-tree-view role="tree" aria-label="Files">
 *            <li role="treeitem" data-ok-tree-item data-ok-item-id="docs" aria-expanded="false" aria-selected="false" tabindex="0">
 *              <div data-ok-tree-item-content><span data-ok-tree-item-icon>…chevron…</span>
 *                <span data-ok-tree-item-label>Documents</span></div>
 *              <ul data-ok-collapse role="group" data-ok-tree-item-group hidden>…items…</ul>
 *            </li>
 *          </ul>
 * Behavior: core `createTreeController` (arrows, Home / End, `*`, typeahead, clicks, F2 editing,
 *          drag and keyboard reordering); the runtime applies `aria-expanded` + the group's
 *          `hidden`, `aria-selected`, the checkboxes of `data-ok-checkbox-selection`, the tab
 *          order, label edits (`data-ok-editable`), moves (`data-ok-items-reordering`), the
 *          selection propagation (`data-ok-selection-propagation="parents descendants"`), the
 *          highlight (`data-ok-highlight`), the indentation (CSSOM) and lazy children.
 * Events:  ok:tree-view:expand / select / labelchange / move (cancelable), selectiontoggle,
 *          itemclick, itemfocus, positionchange.
 */
export const treeView = defineComponent<TreeViewInstance, TreeViewEvents>({
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
    let source: TreeViewDataSource | null = null;

    const order = () => {
      const all = items();
      const visible = visibleTreeItems(element);
      const focusable = (item: Element) =>
        item.getAttribute("aria-disabled") !== "true" ||
        element.hasAttribute("data-ok-disabled-items-focusable");
      const selected = all.find((item) => item.getAttribute("aria-selected") === "true");
      const first =
        selected && visible.includes(selected) ? selected : (visible.find(focusable) ?? all[0]);
      for (const item of all) item.tabIndex = item === first ? 0 : -1;
    };

    /** Lazy children: the item shows a spinner, then its children or an error. */
    const loadChildren = (item: HTMLElement | null) => {
      if (!source) return;
      const parentId = item ? treeItemId(item) : undefined;
      const icon = item ? iconOf(item) : null;
      // The icon comes back after loading (a chevron again after an error icon).
      const previous = item?.hasAttribute("data-ok-error")
        ? [chevron()]
        : icon
          ? [...icon.childNodes]
          : [];
      if (item) {
        item.setAttribute("aria-busy", "true");
        item.removeAttribute("data-ok-error");
        content(item)?.querySelector("[data-ok-tree-item-error]")?.remove();
        icon?.replaceChildren(spinner());
      } else element.setAttribute("aria-busy", "true");
      const checkbox = element.querySelector("[data-ok-tree-item-checkbox]");
      source.getTreeItems(parentId).then(
        (children) => {
          const target = item ? (group(item) ?? item.appendChild(makeGroup())) : element;
          target.append(...children.map((child) => buildItem(child, checkbox)));
          if (item) {
            item.removeAttribute("aria-busy");
            item.removeAttribute("data-ok-lazy");
            icon?.replaceChildren(...previous);
          } else element.removeAttribute("aria-busy");
          applyHighlight();
          order();
        },
        (reason: unknown) => {
          if (!item) {
            element.removeAttribute("aria-busy");
            return;
          }
          item.removeAttribute("aria-busy");
          item.setAttribute("data-ok-error", "");
          icon?.replaceChildren(errorIcon());
          const message = document.createElement("span");
          message.setAttribute("data-ok-tree-item-error", "");
          message.textContent =
            reason instanceof Error && reason.message ? reason.message : "Couldn't load the items";
          content(item)?.append(message);
        },
      );
    };

    const applyHighlight = () =>
      applyTreeHighlight(element, element.getAttribute("data-ok-highlight") ?? "");
    let written: string[] = [];
    const drawStyle = () => {
      written = syncCustomProperties(
        element,
        treeViewStyle(element.getAttribute(itemChildrenIndentation.attr) ?? undefined),
        written,
      );
    };
    const observer = new MutationObserver(() => {
      drawStyle();
      applyHighlight();
    });
    observer.observe(element, {
      attributes: true,
      attributeFilter: [itemChildrenIndentation.attr, "data-ok-highlight"],
    });

    const setExpandedTo = (ids: readonly string[]) => {
      for (const item of items())
        if (item.hasAttribute("aria-expanded"))
          instance.setExpanded(treeItemId(item), ids.includes(treeItemId(item)));
    };

    /** Edits a label in place: the label is hidden behind an input until saved or cancelled. */
    const startEdit = (item: HTMLElement) => {
      const label = labelOf(item);
      if (!label || content(item)?.querySelector("[data-ok-tree-item-label-input]")) return;
      const input = document.createElement("input");
      input.setAttribute("data-ok-tree-item-label-input", "");
      input.setAttribute("aria-label", "Item label");
      input.value = label.textContent ?? "";
      label.hidden = true;
      label.after(input);
      input.focus();
      input.select();
    };
    const endEdit = (item: HTMLElement) => {
      const input = content(item)?.querySelector("[data-ok-tree-item-label-input]");
      // Removing a focused input blurs it: mark it answered so the blur doesn't save it.
      input?.setAttribute("data-ok-finished", "");
      input?.remove();
      const label = labelOf(item);
      if (label) label.hidden = false;
    };

    /** Moves an item's `li` into its new parent, turning leaves into branches and back. */
    const moveItem = (item: HTMLElement, position: TreeItemPosition) => {
      const oldParent = parentTreeItem(item);
      const parent = position.parentId === null ? null : byId(position.parentId);
      if (position.parentId !== null && !parent) return;
      let target: HTMLElement = element;
      if (parent) {
        target = group(parent) ?? parent.appendChild(makeGroup());
        if (!parent.hasAttribute("aria-expanded")) {
          parent.setAttribute("aria-expanded", "false");
          iconOf(parent)?.replaceChildren(chevron());
        }
      }
      item.remove();
      const siblings = parent ? childTreeItems(parent) : items().filter((i) => !parentTreeItem(i));
      const before = siblings[position.index];
      if (before) before.before(item);
      else target.append(item);
      if (oldParent && childTreeItems(oldParent).length === 0) {
        group(oldParent)?.remove();
        oldParent.removeAttribute("aria-expanded");
        iconOf(oldParent)?.replaceChildren();
      }
      if (parent) instance.setExpanded(treeItemId(parent), true);
      item.focus();
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
        const children = group(item);
        if (children) children.hidden = !expanded;
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
      expandAll: () => setExpandedTo(treeBranchIds(element)),
      collapseAll: () => setExpandedTo([]),
      expandToDepth: (depth) =>
        setExpandedTo(treeBranchIds(element, { depth: Math.max(0, Math.floor(depth)) })),
      expandSubtree(itemId) {
        for (const id of treeBranchIds(element, { under: itemId })) instance.setExpanded(id, true);
      },
      focusItem: (itemId) => byId(itemId)?.focus(),
      getItemOrderedChildrenIds(itemId) {
        if (itemId === null)
          return items()
            .filter((i) => !parentTreeItem(i))
            .map(treeItemId);
        const item = byId(itemId);
        return item ? childTreeItems(item).map(treeItemId) : [];
      },
      setEditedItem(itemId) {
        for (const item of items()) endEdit(item);
        const item = itemId === null ? undefined : byId(itemId);
        if (item) startEdit(item);
      },
      updateItemLabel(itemId, label) {
        const target = byId(itemId);
        const span = target ? labelOf(target) : null;
        if (span) span.textContent = label;
        applyHighlight();
      },
      highlight(query) {
        element.setAttribute("data-ok-highlight", query);
        applyHighlight();
      },
      setDataSource(next) {
        source = next;
        if (source && items().length === 0) loadChildren(null);
      },
      destroy() {
        controller.destroy();
        observer.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };

    const controller = createTreeController(element, {
      onToggle: (item, itemId, expanded) => {
        if (!emit("expand", { itemId, expanded }, { cancelable: true })) return;
        instance.setExpanded(itemId, expanded);
        if (expanded && (item.hasAttribute("data-ok-lazy") || item.hasAttribute("data-ok-error")))
          loadChildren(item);
      },
      onSelect: (item, itemId, mode) => {
        const from = anchor ? byId(anchor) : undefined;
        const range = from ? treeItemRange(element, from, item).map(treeItemId) : [itemId];
        const current = instance.selectedItems;
        let next = nextTreeSelection(current, itemId, mode, multi(), range);
        if (multi())
          next = propagateTreeSelection(
            element,
            current,
            next,
            parseSelectionPropagation(element.getAttribute("data-ok-selection-propagation") ?? ""),
          );
        if (!mode.range) anchor = itemId;
        if (!emit("select", { selectedItems: next }, { cancelable: true })) return;
        instance.setSelected(next);
        for (const id of new Set([...current, ...next]))
          if (current.includes(id) !== next.includes(id))
            emit("selectiontoggle", { itemId: id, selected: next.includes(id) });
      },
      onItemClick: (_item, itemId) => emit("itemclick", { itemId }),
      onItemFocus: (_item, itemId) => emit("itemfocus", { itemId }),
      onEdit: (item, itemId, action, value) => {
        if (action === "start") {
          startEdit(item);
          return;
        }
        endEdit(item);
        if (
          action === "commit" &&
          value !== undefined &&
          emit("labelchange", { itemId, label: value }, { cancelable: true })
        )
          instance.updateItemLabel(itemId, value);
      },
      onMove: (item, itemId, newPosition) => {
        const detail = { itemId, oldPosition: treeItemPosition(item), newPosition };
        if (!emit("move", detail, { cancelable: true })) return;
        moveItem(item, newPosition);
        emit("positionchange", detail);
      },
    });
    drawStyle();
    applyHighlight();
    order();
    return instance;
  },
});
