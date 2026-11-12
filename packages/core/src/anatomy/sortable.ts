import {
  behavior,
  type DataAttributes,
  defineOptions,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Sortable ---------------------------------------------------------------------------------

export const sortableLayouts = ["grid", "vertical", "horizontal"] as const;
export type SortableLayout = (typeof sortableLayouts)[number];
export const sortableStrategies = ["sort", "swap"] as const;
export type SortableStrategy = (typeof sortableStrategies)[number];
export const sortableActivators = ["handle", "item"] as const;
export type SortableActivator = (typeof sortableActivators)[number];

export const sortableOptions = defineOptions("sortable", "data-ok-sortable", {
  layout: style(
    "data-ok-layout",
    sortableLayouts,
    "grid",
    "Grid, one column or one scrolling row.",
  ),
  items: state("data-ok-sortable-item", "Item order (`items` + `onReorder`).", "move"),
  autoScroll: behavior(
    "data-ok-auto-scroll",
    true,
    "While dragging near the edge of a scroll area or the window, it scrolls; `false` turns it off.",
  ),
  strategy: style(
    "data-ok-strategy",
    sortableStrategies,
    "sort",
    "`sort` shifts the items between the old and the new position; `swap` trades the places of two items.",
    { optional: true },
  ),
  activator: style(
    "data-ok-activator",
    sortableActivators,
    "handle",
    "Where a pointer drag starts: the `handle`, or anywhere on the `item` (the handle stays for keys and taps).",
    { optional: true },
  ),
});

/** `data-ok-*` attributes of a sortable list (`autoScroll` is written only when turned off). */
export const sortableAttributes = (
  options: {
    layout?: SortableLayout | undefined;
    autoScroll?: boolean | undefined;
    strategy?: SortableStrategy | undefined;
    activator?: SortableActivator | undefined;
  } = {},
): DataAttributes => ({
  ...optionAttributes(sortableOptions, {
    layout: options.layout,
    strategy: options.strategy,
    activator: options.activator,
  }),
  ...(options.autoScroll === false ? { [sortableOptions.options.autoScroll.attr]: "false" } : {}),
});
