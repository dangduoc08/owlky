"use client";

import {
  createTreeController,
  nextTreeSelection,
  type TreeViewExpansionTrigger,
  type TreeViewVariant,
  treeItemId,
  treeItemRange,
  treeViewAttributes,
} from "@owlky/core";
import {
  Children,
  createContext,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Checkbox } from "../checkbox/checkbox.js";
import { Collapse } from "../collapse/collapse.js";
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
}

const TreeContext = createContext<TreeContextValue | null>(null);

/** The default expand icon: a chevron that turns when the item opens (decorative). */
function Chevron() {
  return (
    <svg
      data-ok-tree-chevron=""
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
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
  /** Several items can be selected (Ctrl / ⌘ click, Shift click, Space). */
  multiSelect?: boolean | undefined;
  /** Each item shows a checkbox for its selection (implies `multiSelect`). */
  checkboxSelection?: boolean | undefined;
  /** Items can only be expanded, not selected. */
  disableSelection?: boolean | undefined;
  /** What expands an item on click: `"content"` (default) or `"iconContainer"`. */
  expansionTrigger?: TreeViewExpansionTrigger | undefined;
  /** `"standard"` (default) or `"lines"` (dashed guides, round expand icons). */
  variant?: TreeViewVariant | undefined;
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

/**
 * SimpleTreeView — spec: specs/components/tree-view.md. A WAI-ARIA tree of `TreeItem`s.
 * Keyboard, clicks and typeahead are core's `createTreeController`; this component owns the
 * expanded and selected items.
 */
export const SimpleTreeView = forwardRef<HTMLUListElement, SimpleTreeViewProps>(
  function SimpleTreeView(
    {
      expandedItems,
      defaultExpandedItems = [],
      onExpandedItemsChange,
      onItemExpansionToggle,
      selectedItems,
      defaultSelectedItems = null,
      onSelectedItemsChange,
      multiSelect: multiProp,
      checkboxSelection,
      disableSelection,
      expansionTrigger,
      variant,
      expandIcon,
      collapseIcon,
      endIcon,
      children,
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
    // Items inside helper components aren't direct children: fall back to the first rendered one.
    const [domFirst, setDomFirst] = useState<string | undefined>(undefined);
    const focusable = selected[0] ?? firstItemId(children) ?? domFirst;

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
      ],
    );

    const treeRef = useRef<HTMLUListElement>(null);
    const mergedRef = useMergedRefs(ref, treeRef);
    const latest = useRef({
      expanded,
      selected,
      multi,
      setExpanded,
      setSelection,
      onItemExpansionToggle,
    });
    latest.current = {
      expanded,
      selected,
      multi,
      setExpanded,
      setSelection,
      onItemExpansionToggle,
    };
    const anchor = useRef<string | null>(null);

    useLayoutEffect(() => {
      const first = treeRef.current?.querySelector('[role="treeitem"]');
      const id = first?.getAttribute("data-ok-item-id") ?? undefined;
      if (id !== domFirst) setDomFirst(id);
    });

    useLayoutEffect(() => {
      const tree = treeRef.current as HTMLUListElement;
      const controller = createTreeController(tree, {
        onToggle: (_item, id, expand) => {
          const state = latest.current;
          state.onItemExpansionToggle?.(id, expand);
          state.setExpanded(
            expand ? [...state.expanded, id] : state.expanded.filter((v) => v !== id),
          );
        },
        onSelect: (item, id, mode) => {
          const state = latest.current;
          const from = anchor.current
            ? tree.querySelector(`[data-ok-item-id="${CSS.escape(anchor.current)}"]`)
            : null;
          const range = from ? treeItemRange(tree, from, item).map(treeItemId) : [id];
          const next = nextTreeSelection(state.selected, id, mode, state.multi, range);
          if (!mode.range) anchor.current = id;
          state.setSelection(state.multi ? next : (next[0] ?? null));
        },
      });
      return () => controller.destroy();
    }, []);

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
        })}
        aria-multiselectable={multi || undefined}
        data-ok-runtime="off"
        {...props}
      >
        <TreeContext.Provider value={context}>{children}</TreeContext.Provider>
      </ul>
    );
  },
);

export interface TreeItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "id"> {
  /** Identifies the item (unique in the tree). */
  itemId: string;
  /** The text of the row. */
  label: ReactNode;
  /** Can't be selected or expanded; still focusable. */
  disabled?: boolean | undefined;
  /** Child `TreeItem`s. */
  children?: ReactNode;
}

/** TreeItem — one row of a tree view, with optional child items. */
export const TreeItem = forwardRef<HTMLLIElement, TreeItemProps>(function TreeItem(
  { itemId, label, disabled, children, ...props },
  ref,
) {
  const tree = useContext(TreeContext);
  const branch = Children.toArray(children).some(isValidElement);
  const open = tree?.expanded.includes(itemId) ?? false;
  const selected = tree?.selected.includes(itemId) ?? false;
  const icon = branch ? (
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
      aria-selected={tree?.selectable ? selected : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={tree?.focusable === itemId ? 0 : -1}
      {...props}
    >
      <div data-ok-tree-item-content="">
        <span data-ok-tree-item-icon="">{icon}</span>
        {tree?.checkboxSelection && (
          <span data-ok-tree-item-checkbox="" aria-hidden="true">
            <Checkbox size="small" tabIndex={-1} checked={selected} disabled={disabled} readOnly />
          </span>
        )}
        <span data-ok-tree-item-label="">{label}</span>
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

export interface TreeViewBaseItem {
  id: string;
  label: ReactNode;
  disabled?: boolean | undefined;
  children?: readonly TreeViewBaseItem[] | undefined;
}

export interface RichTreeViewProps extends Omit<SimpleTreeViewProps, "children"> {
  /** The items, as data. */
  items: readonly TreeViewBaseItem[];
}

const renderItems = (items: readonly TreeViewBaseItem[]): ReactNode =>
  items.map((item) => (
    <TreeItem key={item.id} itemId={item.id} label={item.label} disabled={item.disabled}>
      {item.children?.length ? renderItems(item.children) : undefined}
    </TreeItem>
  ));

/** RichTreeView — a tree view built from data (`items`); same markup as SimpleTreeView. */
export const RichTreeView = forwardRef<HTMLUListElement, RichTreeViewProps>(function RichTreeView(
  { items, ...props },
  ref,
) {
  return (
    <SimpleTreeView ref={ref} {...props}>
      {renderItems(items)}
    </SimpleTreeView>
  );
});
