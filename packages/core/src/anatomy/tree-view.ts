import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  parseNumber,
  state,
  style,
} from "../options/define.js";

// --- Tree view ----------------------------------------------------------------------------------

export const treeViewVariants = ["standard", "lines"] as const;
export const treeViewExpansionTriggers = ["content", "iconContainer"] as const;
export type TreeViewVariant = (typeof treeViewVariants)[number];
export type TreeViewExpansionTrigger = (typeof treeViewExpansionTriggers)[number];

export const treeViewOptions = defineOptions("tree-view", "data-ok-tree-view", {
  variant: style(
    "data-ok-variant",
    treeViewVariants,
    "standard",
    "`lines` draws dashed guides beside children and round expand icons.",
  ),
  expansionTrigger: style(
    "data-ok-expansion-trigger",
    treeViewExpansionTriggers,
    "content",
    "What expands an item on click: the whole row, or only its icon.",
  ),
  multiSelect: flag(
    "data-ok-multi-select",
    "Several items can be selected (`aria-multiselectable`).",
  ),
  checkboxSelection: flag(
    "data-ok-checkbox-selection",
    "Each item shows a checkbox for its selection.",
  ),
  disableSelection: flag("data-ok-disable-selection", "Items can't be selected (only expanded)."),
  disabledItemsFocusable: flag(
    "data-ok-disabled-items-focusable",
    "Disabled items stay in the arrow-key focus order.",
  ),
  itemsReordering: flag(
    "data-ok-items-reordering",
    "Items can be dragged to a new position (or moved with Ctrl / ⌘ + Shift + arrows).",
  ),
  itemChildrenIndentation: number(
    "data-ok-item-children-indentation",
    12,
    "Indentation of each level of children: px or a CSS length.",
    { min: 0, units: ["px", "rem", "em"] },
  ),
  expanded: state("aria-expanded", "Expanded items (`expandedItems`).", "expand"),
  selected: state("aria-selected", "Selected items (`selectedItems`).", "select"),
});

export interface TreeViewAnatomyOptions {
  variant?: TreeViewVariant | undefined;
  expansionTrigger?: TreeViewExpansionTrigger | undefined;
  multiSelect?: boolean | undefined;
  checkboxSelection?: boolean | undefined;
  disableSelection?: boolean | undefined;
  disabledItemsFocusable?: boolean | undefined;
  itemsReordering?: boolean | undefined;
  itemChildrenIndentation?: number | string | undefined;
}

/** `data-ok-*` attributes of a tree view (`ul[role=tree]`). */
export const treeViewAttributes = (options: TreeViewAnatomyOptions = {}): DataAttributes =>
  optionAttributes(treeViewOptions, { ...options });

/** The indentation as `--_ok-tree-indent` (a number is px), or nothing when invalid. */
export const treeViewStyle = (
  indentation: unknown,
): Partial<Record<"--_ok-tree-indent", string>> => {
  const value = parseNumber(treeViewOptions.options.itemChildrenIndentation, indentation);
  return value === undefined
    ? {}
    : { "--_ok-tree-indent": typeof value === "number" ? `${value}px` : value };
};
