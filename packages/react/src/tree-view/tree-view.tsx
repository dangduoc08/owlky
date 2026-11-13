"use client";

import {
  altArrowRightLinear,
  applyTreeHighlight,
  childTreeItems,
  createTreeController,
  dangerCircleLinear,
  hasLazyChildren,
  nextTreeSelection,
  propagateTreeSelection,
  type TreeItemPosition,
  type TreeSelectionPropagation,
  type TreeViewExpansionTrigger,
  type TreeViewVariant,
  treeBranchIds,
  treeItemId,
  treeItemPosition,
  treeItemRange,
  treeViewAttributes,
  treeViewStyle,
  visibleTreeItems,
} from "@owlky/core";
import {
  Children,
  type CSSProperties,
  createContext,
  type ForwardedRef,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type MutableRefObject,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Checkbox } from "../checkbox/checkbox.js";
import { CircularProgress } from "../circular-progress/circular-progress.js";
import { Collapse } from "../collapse/collapse.js";
import { Icon } from "../utils/icon.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

type Selection = string | string[] | null;

interface TreeContextValue {
  expanded: readonly string[];
  selected: readonly string[];
  focusable: string | undefined;
  selectable: boolean;
  checkboxSelection: boolean;
  expandIcon: ReactNode;
  collapseIcon: ReactNode;
  endIcon: ReactNode;
  /** The item whose label is being edited. */
  editing: string | null;
  /** Items reorder: `false` marks the ones that can't move. */
  reordering: boolean;
}

const TreeContext = createContext<TreeContextValue | null>(null);

/** The default expand icon: a chevron that turns when the item opens (decorative). */
function Chevron() {
  return <Icon icon={altArrowRightLinear} data-ok-tree-chevron="" />;
}

/** The icon of an item whose children failed to load (decorative). */
function ErrorIcon() {
  return <Icon icon={dangerCircleLinear} data-ok-tree-error-icon="" />;
}

const toList = (value: Selection | undefined): string[] =>
  value == null ? [] : typeof value === "string" ? [value] : [...value];

/** The first item id among the children, for the tab order when nothing is selected. */
function firstItemId(children: ReactNode): string | undefined {
  for (const child of Children.toArray(children)) {
    if (isValidElement<TreeItemProps>(child) && typeof child.props.itemId === "string")
      return child.props.itemId;
  }
  return undefined;
}

/** One item of `getItemTree()`. */
export interface TreeViewItemTree {
  id: string;
  children: TreeViewItemTree[];
}

/** The tree's methods (MUI `apiRef`), from `useTreeViewApiRef()`. */
export interface TreeViewApi {
  /** Moves the focus to an item (expanded ancestors needed). */
  focusItem(itemId: string): void;
  /** The item's data (RichTreeView) or `{ id, label }` from its row. */
  getItem(itemId: string): unknown;
  /** The item's `li`. */
  getItemDOMElement(itemId: string): HTMLElement | null;
  /** The ids of an item's children (`null`: the root's), in order. */
  getItemOrderedChildrenIds(itemId: string | null): string[];
  /** Every item as `{ id, children }`. */
  getItemTree(): TreeViewItemTree[];
  /** Whether an item is expanded. */
  isItemExpanded(itemId: string): boolean;
  /** Expands (`shouldBeExpanded`, default: the other state) or collapses an item. */
  setItemExpansion(options: { itemId: string; shouldBeExpanded?: boolean }): void;
  /** Selects or deselects an item; `keepExistingSelection` adds to a multi selection. */
  selectItem(options: {
    itemId: string;
    keepExistingSelection?: boolean;
    shouldBeSelected?: boolean;
  }): void;
  /** Expands every item that has children. */
  expandAll(): void;
  /** Collapses every item. */
  collapseAll(): void;
  /** Expands the items down to `depth` levels (1: the root's items) and collapses the rest. */
  expandToDepth(depth: number): void;
  /** Expands an item and all its descendants. */
  expandSubtree(itemId: string): void;
  /** Starts (or with `null`, stops) editing an item's label (RichTreeView). */
  setEditedItem(itemId: string | null): void;
  /** Changes an item's label (RichTreeView). */
  updateItemLabel(itemId: string, label: string): void;
}

/** A ref for `apiRef` (MUI `useTreeViewApiRef`). */
export function useTreeViewApiRef(): MutableRefObject<TreeViewApi | undefined> {
  return useRef<TreeViewApi | undefined>(undefined);
}

export interface SimpleTreeViewProps
  extends Omit<HTMLAttributes<HTMLUListElement>, "onChange" | "defaultValue"> {
  /** Controlled expanded item ids. */
  expandedItems?: readonly string[] | undefined;
  /** Uncontrolled expanded item ids. Default none. */
  defaultExpandedItems?: readonly string[] | undefined;
  /** Called with the expanded ids after a toggle. */
  onExpandedItemsChange?: ((itemIds: string[]) => void) | undefined;
  /** Called when one item expands or collapses. */
  onItemExpansionToggle?: ((itemId: string, isExpanded: boolean) => void) | undefined;
  /** Controlled selection: an id (single), ids (`multiSelect`) or `null`. */
  selectedItems?: Selection | undefined;
  /** Uncontrolled selection. */
  defaultSelectedItems?: Selection | undefined;
  /** Called with the new selection (same shape as `selectedItems`). */
  onSelectedItemsChange?: ((itemIds: Selection) => void) | undefined;
  /** Called for each item whose selection changed. */
  onItemSelectionToggle?: ((itemId: string, isSelected: boolean) => void) | undefined;
  /** Called when an item's row is clicked. */
  onItemClick?: ((itemId: string) => void) | undefined;
  /** Called when an item gets the focus. */
  onItemFocus?: ((itemId: string) => void) | undefined;
  /** Several items can be selected (Ctrl / ⌘ click, Shift click, Space). */
  multiSelect?: boolean | undefined;
  /** Each item shows a checkbox for its selection (implies `multiSelect`). */
  checkboxSelection?: boolean | undefined;
  /** Items can only be expanded, not selected. */
  disableSelection?: boolean | undefined;
  /** Selecting an item also selects its descendants, and / or a parent whose children all are. */
  selectionPropagation?: TreeSelectionPropagation | undefined;
  /** Disabled items stay in the arrow-key focus order. */
  disabledItemsFocusable?: boolean | undefined;
  /** What expands an item on click: `"content"` (default) or `"iconContainer"`. */
  expansionTrigger?: TreeViewExpansionTrigger | undefined;
  /** `"standard"` (default) or `"lines"` (dashed guides, round expand icons). */
  variant?: TreeViewVariant | undefined;
  /** Indentation of each level of children: px or a CSS length. Default 12px. */
  itemChildrenIndentation?: number | string | undefined;
  /** Highlights the items whose label contains this text, and their ancestors. */
  highlight?: string | undefined;
  /** Receives the tree's methods (`useTreeViewApiRef()`). */
  apiRef?: MutableRefObject<TreeViewApi | undefined> | undefined;
  /** Icon of collapsed items (default: a chevron that turns). */
  expandIcon?: ReactNode;
  /** Icon of expanded items (with `expandIcon`). */
  collapseIcon?: ReactNode;
  /** Icon of items without children. */
  endIcon?: ReactNode;
  /** Names the tree (or use `aria-labelledby`). */
  "aria-label"?: string | undefined;
  children?: ReactNode;
}

/** What RichTreeView adds to the shared root (editing, reordering, lazy children, data). */
interface TreeRootExtras {
  editing?: string | null | undefined;
  onEditingChange?: ((itemId: string | null) => void) | undefined;
  onLabelCommit?: ((itemId: string, label: string) => void) | undefined;
  itemsReordering?: boolean | undefined;
  /** Applies a move; `false` when it was refused. */
  onMove?:
    | ((itemId: string, oldPosition: TreeItemPosition, newPosition: TreeItemPosition) => boolean)
    | undefined;
  onLazyExpand?: ((itemId: string) => void) | undefined;
  getItemData?: ((itemId: string) => unknown) | undefined;
  updateLabel?: ((itemId: string, label: string) => void) | undefined;
}

const TreeRoot = forwardRef<HTMLUListElement, SimpleTreeViewProps & TreeRootExtras>(
  function TreeRoot(
    {
      expandedItems,
      defaultExpandedItems = [],
      onExpandedItemsChange,
      onItemExpansionToggle,
      selectedItems,
      defaultSelectedItems = null,
      onSelectedItemsChange,
      onItemSelectionToggle,
      onItemClick,
      onItemFocus,
      multiSelect: multiProp,
      checkboxSelection,
      disableSelection,
      selectionPropagation,
      disabledItemsFocusable,
      expansionTrigger,
      variant,
      itemChildrenIndentation,
      highlight,
      apiRef,
      expandIcon,
      collapseIcon,
      endIcon,
      editing = null,
      onEditingChange,
      onLabelCommit,
      itemsReordering,
      onMove,
      onLazyExpand,
      getItemData,
      updateLabel,
      children,
      style,
      ...props
    },
    ref,
  ) {
    const multi = Boolean(multiProp || checkboxSelection);
    const [expanded, setExpanded] = useControllableState<readonly string[]>({
      value: expandedItems,
      defaultValue: defaultExpandedItems,
      onChange: (next) => onExpandedItemsChange?.([...next]),
    });
    const [selection, setSelection] = useControllableState<Selection>({
      value: selectedItems,
      defaultValue: defaultSelectedItems,
      onChange: onSelectedItemsChange,
    });
    const selected = toList(selection);
    // The first focusable rendered item (helper components hide items from `children`).
    const [domFirst, setDomFirst] = useState<string | undefined>(undefined);
    const focusable = selected[0] ?? domFirst ?? firstItemId(children);

    const context = useMemo<TreeContextValue>(
      () => ({
        expanded,
        selected: toList(selection),
        focusable,
        selectable: !disableSelection,
        checkboxSelection: Boolean(checkboxSelection),
        expandIcon,
        collapseIcon,
        endIcon,
        editing,
        reordering: Boolean(itemsReordering),
      }),
      [
        expanded,
        selection,
        focusable,
        disableSelection,
        checkboxSelection,
        expandIcon,
        collapseIcon,
        endIcon,
        editing,
        itemsReordering,
      ],
    );

    const treeRef = useRef<HTMLUListElement>(null);
    const mergedRef = useMergedRefs(ref, treeRef);
    const state = {
      expanded,
      selected,
      multi,
      setExpanded,
      setSelection,
      onItemExpansionToggle,
      onItemSelectionToggle,
      onItemClick,
      onItemFocus,
      selectionPropagation,
      onEditingChange,
      onLabelCommit,
      onMove,
      onLazyExpand,
      getItemData,
      updateLabel,
    };
    const latest = useRef(state);
    latest.current = state;
    const anchor = useRef<string | null>(null);
    /** The item to focus once a move rendered (an item moved to another parent remounts). */
    const moved = useRef<string | null>(null);

    /** Replaces the selection, applying the propagation and reporting each toggled item. */
    const commitSelection = useCallback((next: string[]) => {
      const current = latest.current;
      const tree = treeRef.current as HTMLUListElement;
      const result =
        current.multi && current.selectionPropagation
          ? propagateTreeSelection(tree, current.selected, next, current.selectionPropagation)
          : next;
      for (const id of new Set([...current.selected, ...result]))
        if (current.selected.includes(id) !== result.includes(id))
          current.onItemSelectionToggle?.(id, result.includes(id));
      current.setSelection(current.multi ? result : (result[0] ?? null));
    }, []);
    const toggle = useCallback((id: string, expand: boolean) => {
      const current = latest.current;
      if (current.expanded.includes(id) === expand) return;
      current.onItemExpansionToggle?.(id, expand);
      if (expand) current.onLazyExpand?.(id);
      current.setExpanded(
        expand ? [...current.expanded, id] : current.expanded.filter((v) => v !== id),
      );
    }, []);

    useLayoutEffect(() => {
      const tree = treeRef.current as HTMLUListElement;
      const first = visibleTreeItems(tree).find(
        (item) => item.getAttribute("aria-disabled") !== "true" || disabledItemsFocusable,
      );
      const id = first?.getAttribute("data-ok-item-id") ?? undefined;
      if (id !== domFirst) setDomFirst(id);
      // The search highlight is written on the rendered items (same as the HTML runtime).
      applyTreeHighlight(tree, highlight ?? "");
      if (moved.current) {
        tree
          .querySelector<HTMLElement>(
            `[role="treeitem"][data-ok-item-id="${CSS.escape(moved.current)}"]`,
          )
          ?.focus();
        moved.current = null;
      }
    });

    useLayoutEffect(() => {
      const tree = treeRef.current as HTMLUListElement;
      const controller = createTreeController(tree, {
        onToggle: (_item, id, expand) => toggle(id, expand),
        onSelect: (item, id, mode) => {
          const current = latest.current;
          const from = anchor.current
            ? tree.querySelector(`[data-ok-item-id="${CSS.escape(anchor.current)}"]`)
            : null;
          const range = from ? treeItemRange(tree, from, item).map(treeItemId) : [id];
          const next = nextTreeSelection(current.selected, id, mode, current.multi, range);
          if (!mode.range) anchor.current = id;
          commitSelection(next);
        },
        onItemClick: (_item, id) => latest.current.onItemClick?.(id),
        onItemFocus: (_item, id) => latest.current.onItemFocus?.(id),
        onEdit: (_item, id, action, value) => {
          const current = latest.current;
          if (action === "start") current.onEditingChange?.(id);
          else {
            if (action === "commit") current.onLabelCommit?.(id, value ?? "");
            current.onEditingChange?.(null);
          }
        },
        onMove: (item, id, position) => {
          if (latest.current.onMove?.(id, treeItemPosition(item), position) !== true) return;
          moved.current = id;
          // Like the HTML runtime: the new parent opens to show the item.
          if (position.parentId !== null) toggle(position.parentId, true);
        },
      });
      return () => controller.destroy();
    }, [toggle, commitSelection]);

    useEffect(() => {
      if (!apiRef) return;
      const tree = () => treeRef.current as HTMLUListElement;
      const element = (id: string) =>
        tree().querySelector<HTMLElement>(`[role="treeitem"][data-ok-item-id="${CSS.escape(id)}"]`);
      const childrenOf = (id: string | null): HTMLElement[] => {
        if (id === null)
          return [...tree().querySelectorAll<HTMLElement>('[role="treeitem"]')].filter(
            (item) => item.parentElement === tree(),
          );
        const item = element(id);
        return item ? childTreeItems(item) : [];
      };
      const build = (items: HTMLElement[]): TreeViewItemTree[] =>
        items.map((item) => ({ id: treeItemId(item), children: build(childTreeItems(item)) }));
      apiRef.current = {
        focusItem: (id) => element(id)?.focus(),
        getItem: (id) =>
          latest.current.getItemData?.(id) ??
          (element(id)
            ? {
                id,
                label: element(id)?.querySelector(
                  ":scope > [data-ok-tree-item-content] [data-ok-tree-item-label]",
                )?.textContent,
              }
            : undefined),
        getItemDOMElement: element,
        getItemOrderedChildrenIds: (id) => childrenOf(id).map(treeItemId),
        getItemTree: () => build(childrenOf(null)),
        isItemExpanded: (id) => latest.current.expanded.includes(id),
        setItemExpansion: ({ itemId, shouldBeExpanded }) =>
          toggle(itemId, shouldBeExpanded ?? !latest.current.expanded.includes(itemId)),
        selectItem: ({ itemId, keepExistingSelection = false, shouldBeSelected }) => {
          const current = latest.current;
          const on = shouldBeSelected ?? !current.selected.includes(itemId);
          const base =
            keepExistingSelection && current.multi
              ? current.selected.filter((v) => v !== itemId)
              : [];
          commitSelection(on ? [...base, itemId] : base);
        },
        expandAll: () => latest.current.setExpanded(treeBranchIds(tree())),
        collapseAll: () => latest.current.setExpanded([]),
        expandToDepth: (depth) =>
          latest.current.setExpanded(
            treeBranchIds(tree(), { depth: Math.max(0, Math.floor(depth)) }),
          ),
        expandSubtree: (id) =>
          latest.current.setExpanded([
            ...new Set([...latest.current.expanded, ...treeBranchIds(tree(), { under: id })]),
          ]),
        setEditedItem: (id) => {
          // Stopping from the API cancels: the input's blur on unmount must not save it.
          tree()
            .querySelector("[data-ok-tree-item-label-input]")
            ?.setAttribute("data-ok-finished", "");
          latest.current.onEditingChange?.(id);
        },
        updateItemLabel: (id, label) => latest.current.updateLabel?.(id, label),
      };
      return () => {
        apiRef.current = undefined;
      };
    }, [apiRef, toggle, commitSelection]);

    return (
      <ul
        ref={mergedRef}
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: WAI-ARIA tree: a list with role="tree".
        role="tree"
        {...treeViewAttributes({
          variant,
          expansionTrigger,
          multiSelect: multi,
          checkboxSelection,
          disableSelection,
          disabledItemsFocusable,
          itemsReordering,
          itemChildrenIndentation,
        })}
        {...(highlight ? { "data-ok-highlight": highlight } : {})}
        {...(selectionPropagation &&
        (selectionPropagation.parents || selectionPropagation.descendants)
          ? {
              "data-ok-selection-propagation": [
                selectionPropagation.parents ? "parents" : "",
                selectionPropagation.descendants ? "descendants" : "",
              ]
                .filter(Boolean)
                .join(" "),
            }
          : {})}
        aria-multiselectable={multi || undefined}
        data-ok-runtime="off"
        style={{ ...(treeViewStyle(itemChildrenIndentation) as CSSProperties), ...style }}
        {...props}
      >
        <TreeContext.Provider value={context}>{children}</TreeContext.Provider>
      </ul>
    );
  },
);

/**
 * SimpleTreeView — spec: specs/components/tree-view.md. A WAI-ARIA tree of `TreeItem`s.
 * Keyboard, clicks and typeahead are core's `createTreeController`; this component owns the
 * expanded and selected items.
 */
export const SimpleTreeView = forwardRef<HTMLUListElement, SimpleTreeViewProps>(
  function SimpleTreeView(props, ref) {
    return <TreeRoot ref={ref} {...props} />;
  },
);

export interface TreeItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "id"> {
  /** Identifies the item (unique in the tree). */
  itemId: string;
  /** The text of the row. */
  label: ReactNode;
  /** Can't be selected or expanded (and isn't focusable unless `disabledItemsFocusable`). */
  disabled?: boolean | undefined;
  /** The item can't be selected, but still expands. */
  disableSelection?: boolean | undefined;
  /** Child `TreeItem`s. */
  children?: ReactNode;
}

interface TreeItemInternals {
  /** Has children to load (lazy loading): expandable without child items yet. */
  lazy?: boolean | undefined;
  loading?: boolean | undefined;
  /** The message when the children couldn't be loaded. */
  error?: string | undefined;
  editable?: boolean | undefined;
  reorderable?: boolean | undefined;
}

/** The label input while an item is being edited: focused with its text selected. */
function LabelInput({ value }: { value: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      data-ok-tree-item-label-input=""
      defaultValue={value}
      aria-label="Item label"
    />
  );
}

const TreeItemImpl = forwardRef<HTMLLIElement, TreeItemProps & TreeItemInternals>(function TreeItem(
  {
    itemId,
    label,
    disabled,
    disableSelection,
    lazy,
    loading,
    error,
    editable,
    reorderable,
    children,
    ...props
  },
  ref,
) {
  const tree = useContext(TreeContext);
  const branch = Boolean(lazy) || Children.toArray(children).some(isValidElement);
  const open = tree?.expanded.includes(itemId) ?? false;
  const selected = tree?.selected.includes(itemId) ?? false;
  const editing = tree?.editing === itemId;
  const icon = loading ? (
    <CircularProgress color="inherit" aria-label="Loading" />
  ) : error !== undefined ? (
    <ErrorIcon />
  ) : branch ? (
    tree?.expandIcon !== undefined ? (
      <>
        <span data-ok-tree-expand-icon="">{tree.expandIcon}</span>
        <span data-ok-tree-collapse-icon="">{tree.collapseIcon ?? tree.expandIcon}</span>
      </>
    ) : (
      <Chevron />
    )
  ) : (
    tree?.endIcon
  );
  return (
    <li
      ref={ref}
      role="treeitem"
      data-ok-tree-item=""
      data-ok-item-id={itemId}
      aria-expanded={branch ? open : undefined}
      aria-selected={tree?.selectable && !disableSelection ? selected : undefined}
      aria-disabled={disabled || undefined}
      {...(disableSelection ? { "data-ok-disable-selection": "" } : {})}
      {...(lazy ? { "data-ok-lazy": "" } : {})}
      {...(loading ? { "aria-busy": true } : {})}
      {...(error !== undefined ? { "data-ok-error": "" } : {})}
      {...(editable ? { "data-ok-editable": "" } : {})}
      {...(tree?.reordering && reorderable === false ? { "data-ok-reorderable": "false" } : {})}
      tabIndex={tree?.focusable === itemId ? 0 : -1}
      {...props}
    >
      <div data-ok-tree-item-content="">
        <span data-ok-tree-item-icon="">{icon}</span>
        {tree?.checkboxSelection && !disableSelection && (
          <span data-ok-tree-item-checkbox="" aria-hidden="true">
            <Checkbox size="small" tabIndex={-1} checked={selected} disabled={disabled} readOnly />
          </span>
        )}
        <span data-ok-tree-item-label="" hidden={editing || undefined}>
          {label}
        </span>
        {editing && <LabelInput value={typeof label === "string" ? label : ""} />}
        {error !== undefined && <span data-ok-tree-item-error="">{error}</span>}
      </div>
      {branch && (
        // The group opens and closes with a Collapse (MUI X's default group transition).
        <Collapse component="ul" in={open} role="group" data-ok-tree-item-group="">
          {children}
        </Collapse>
      )}
    </li>
  );
});

/** TreeItem — one row of a tree view, with optional child items. */
export const TreeItem = forwardRef<HTMLLIElement, TreeItemProps>(function TreeItem(props, ref) {
  return <TreeItemImpl ref={ref} {...props} />;
});

export interface TreeViewBaseItem {
  id: string;
  label: ReactNode;
  disabled?: boolean | undefined;
  children?: readonly TreeViewBaseItem[] | undefined;
}

/** Loads children on demand (MUI `dataSource`). */
export interface TreeViewDataSource<R = TreeViewBaseItem> {
  /** How many children an item has: `0` none, `-1` unknown (expandable), or a count. */
  getChildrenCount(item: R): number;
  /** The children of an item, or the root's items (`parentId` undefined). */
  getTreeItems(parentId?: string): Promise<readonly R[]>;
}

/** MUI's position change report. */
export interface TreeViewItemPositionChange {
  itemId: string;
  oldPosition: TreeItemPosition;
  newPosition: TreeItemPosition;
}

export interface RichTreeViewProps<R = TreeViewBaseItem>
  extends Omit<SimpleTreeViewProps, "children"> {
  /** The items, as data (or loaded by `dataSource`). */
  items?: readonly R[] | undefined;
  /** An item's id. Default `item.id`. */
  getItemId?: ((item: R) => string) | undefined;
  /** An item's label. Default `item.label`. */
  getItemLabel?: ((item: R) => ReactNode) | undefined;
  /** An item's children. Default `item.children`. */
  getItemChildren?: ((item: R) => readonly R[] | undefined) | undefined;
  /** Whether an item is disabled. Default `item.disabled`. */
  isItemDisabled?: ((item: R) => boolean) | undefined;
  /** Whether an item can't be selected (it still expands). */
  isItemSelectionDisabled?: ((item: R) => boolean) | undefined;
  /** Labels can be edited (F2, double click; Enter saves, Escape cancels): every item or some. */
  isItemEditable?: boolean | ((item: R) => boolean) | undefined;
  /** Called with an item's new label. */
  onItemLabelChange?: ((itemId: string, label: string) => void) | undefined;
  /** Items can be dragged to a new position (or moved with Ctrl / ⌘ + Shift + arrows). */
  itemsReordering?: boolean | undefined;
  /** Whether an item can be moved. Default every item. */
  isItemReorderable?: ((itemId: string) => boolean) | undefined;
  /** Refuses a move by returning `false`. */
  canMoveItemToNewPosition?: ((change: TreeViewItemPositionChange) => boolean) | undefined;
  /** Called after an item moved. */
  onItemPositionChange?: ((change: TreeViewItemPositionChange) => void) | undefined;
  /** Loads the root's items (without `items`) and children on expand. */
  dataSource?: TreeViewDataSource<R> | undefined;
  /** Text of an item whose children failed to load. Default "Couldn't load the items". */
  dataSourceErrorLabel?: string | undefined;
}

/** The normalized tree RichTreeView renders (data accessors applied, moves and labels kept). */
interface TreeNode<R> {
  id: string;
  item: R;
  /** `undefined`: not loaded yet (lazy) or a leaf. */
  children: TreeNode<R>[] | undefined;
  lazy: boolean;
}

/** RichTreeView — a tree view built from data (`items`); same markup as SimpleTreeView. */
function RichTreeViewImpl<R = TreeViewBaseItem>(
  {
    items,
    getItemId,
    getItemLabel,
    getItemChildren,
    isItemDisabled,
    isItemSelectionDisabled,
    isItemEditable,
    onItemLabelChange,
    itemsReordering,
    isItemReorderable,
    canMoveItemToNewPosition,
    onItemPositionChange,
    dataSource,
    dataSourceErrorLabel = "Couldn't load the items",
    ...props
  }: RichTreeViewProps<R>,
  ref: ForwardedRef<HTMLUListElement>,
) {
  const base = (item: R) => item as unknown as TreeViewBaseItem;
  const idOf = (item: R) => getItemId?.(item) ?? base(item).id;
  const normalize = (list: readonly R[] | undefined): TreeNode<R>[] =>
    (list ?? []).map((item) => {
      const kids = getItemChildren
        ? getItemChildren(item)
        : (base(item).children as R[] | undefined);
      return {
        id: idOf(item),
        item,
        children: kids?.length ? normalize(kids) : undefined,
        lazy:
          dataSource !== undefined &&
          !kids?.length &&
          hasLazyChildren(dataSource.getChildrenCount(item)),
      };
    });
  const [nodes, setNodes] = useState<TreeNode<R>[]>(() => normalize(items));
  const [source, setSource] = useState(items);
  if (source !== items) {
    setSource(items);
    setNodes(normalize(items));
  }
  const [labels, setLabels] = useState<ReadonlyMap<string, string>>(new Map());
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set());
  const [errors, setErrors] = useState<ReadonlyMap<string, string>>(new Map());

  const find = (list: TreeNode<R>[], id: string): TreeNode<R> | undefined => {
    for (const node of list) {
      if (node.id === id) return node;
      const inner = node.children && find(node.children, id);
      if (inner) return inner;
    }
    return undefined;
  };
  /** A copy of `list` with `id`'s node replaced by `change(node)`. */
  const update = (
    list: TreeNode<R>[],
    id: string,
    change: (node: TreeNode<R>) => TreeNode<R>,
  ): TreeNode<R>[] =>
    list.map((node) =>
      node.id === id
        ? change(node)
        : node.children
          ? { ...node, children: update(node.children, id, change) }
          : node,
    );

  const load = (parentId?: string) => {
    if (!dataSource) return;
    const key = parentId ?? "";
    setLoading((prev) => new Set(prev).add(key));
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    dataSource.getTreeItems(parentId).then(
      (children) => {
        setNodes((prev) =>
          parentId === undefined
            ? normalize(children)
            : update(prev, parentId, (node) => ({
                ...node,
                children: normalize(children),
                lazy: false,
              })),
        );
        setLoading((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      },
      (reason: unknown) => {
        setErrors((prev) =>
          new Map(prev).set(
            key,
            reason instanceof Error && reason.message ? reason.message : dataSourceErrorLabel,
          ),
        );
        setLoading((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      },
    );
  };
  // Without `items`, the data source loads the root's items once.
  const rootLoaded = useRef(false);
  useEffect(() => {
    if (items === undefined && dataSource && !rootLoaded.current) {
      rootLoaded.current = true;
      load();
    }
  });

  const onMove = (itemId: string, oldPosition: TreeItemPosition, newPosition: TreeItemPosition) => {
    const change = { itemId, oldPosition, newPosition };
    if (canMoveItemToNewPosition?.(change) === false) return false;
    setNodes((prev) => {
      const moving = find(prev, itemId);
      if (!moving) return prev;
      const without = (list: TreeNode<R>[]): TreeNode<R>[] =>
        list
          .filter((node) => node.id !== itemId)
          .map((node) => {
            if (!node.children) return node;
            const kids = without(node.children);
            return { ...node, children: kids.length ? kids : undefined };
          });
      const insert = (list: TreeNode<R>[]) => {
        const next = [...list];
        next.splice(Math.min(newPosition.index, next.length), 0, moving);
        return next;
      };
      const rest = without(prev);
      return newPosition.parentId === null
        ? insert(rest)
        : update(rest, newPosition.parentId, (node) => ({
            ...node,
            children: insert(node.children ?? []),
          }));
    });
    onItemPositionChange?.(change);
    return true;
  };

  const editable = (item: R) =>
    typeof isItemEditable === "function" ? isItemEditable(item) : isItemEditable === true;
  const labelOf = (node: TreeNode<R>) =>
    labels.get(node.id) ?? (getItemLabel ? getItemLabel(node.item) : base(node.item).label);
  const render = (list: readonly TreeNode<R>[]): ReactNode =>
    list.map((node) => (
      <TreeItemImpl
        key={node.id}
        itemId={node.id}
        label={labelOf(node)}
        disabled={isItemDisabled ? isItemDisabled(node.item) : base(node.item).disabled}
        disableSelection={isItemSelectionDisabled?.(node.item) || undefined}
        lazy={node.lazy}
        loading={loading.has(node.id) || undefined}
        error={errors.get(node.id)}
        editable={editable(node.item) || undefined}
        reorderable={itemsReordering ? (isItemReorderable?.(node.id) ?? true) : undefined}
      >
        {node.children ? render(node.children) : undefined}
      </TreeItemImpl>
    ));
  const setLabel = (itemId: string, label: string) => {
    setLabels((prev) => new Map(prev).set(itemId, label));
    onItemLabelChange?.(itemId, label);
  };
  return (
    <TreeRoot
      ref={ref}
      {...props}
      aria-busy={loading.has("") || undefined}
      editing={editing}
      onEditingChange={setEditing}
      onLabelCommit={setLabel}
      itemsReordering={itemsReordering}
      onMove={onMove}
      onLazyExpand={(itemId) => {
        const node = find(nodes, itemId);
        if (node && (node.lazy || errors.has(itemId)) && !loading.has(itemId)) load(itemId);
      }}
      getItemData={(itemId) => find(nodes, itemId)?.item}
      updateLabel={setLabel}
    >
      {render(nodes)}
    </TreeRoot>
  );
}

/** RichTreeView — a tree view built from data (`items`); same markup as SimpleTreeView. */
export const RichTreeView = forwardRef(RichTreeViewImpl) as <R = TreeViewBaseItem>(
  props: RichTreeViewProps<R> & { ref?: Ref<HTMLUListElement> },
) => ReactNode;
