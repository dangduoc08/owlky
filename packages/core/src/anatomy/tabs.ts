import {
  type DataAttributes,
  defineOptions,
  flag,
  native,
  optionAttributes,
  state,
  style,
} from "../options/define.js";
import { type Orientation, orientations } from "./button-group.js";

// --- Tabs ---------------------------------------------------------------------------------------

export const tabsVariants = ["standard", "scrollable", "fullWidth"] as const;
export const tabsColors = ["inherit", "primary", "secondary"] as const;
export const tabsScrollButtons = ["auto", "true", "false"] as const;
export const tabIconPositions = ["top", "bottom", "start", "end"] as const;

export type TabsVariant = (typeof tabsVariants)[number];
export type TabsColor = (typeof tabsColors)[number];
export type TabsScrollButtons = (typeof tabsScrollButtons)[number];
export type TabIconPosition = (typeof tabIconPositions)[number];

export const tabsOptions = defineOptions("tabs", "data-ok-tabs", {
  variant: style(
    "data-ok-variant",
    tabsVariants,
    "standard",
    "`scrollable` scrolls the tabs (with scroll buttons); `fullWidth` shares the width.",
  ),
  orientation: style(
    "data-ok-orientation",
    orientations,
    "horizontal",
    "A row of tabs, or a column (also `aria-orientation`).",
  ),
  textColor: style(
    "data-ok-text-color",
    tabsColors,
    "inherit",
    "Text color of the selected tab (`inherit`: the text color).",
  ),
  indicatorColor: style(
    "data-ok-indicator-color",
    tabsColors,
    "inherit",
    "Color of the selection line (`inherit`: the text color).",
  ),
  scrollButtons: style(
    "data-ok-scroll-buttons",
    tabsScrollButtons,
    "auto",
    "Scrollable: `auto` shows them on overflow from 600px; `true` always; `false` never.",
  ),
  centered: flag("data-ok-centered", "Center the tabs (standard variant)."),
  allowScrollButtonsMobile: flag(
    "data-ok-allow-scroll-buttons-mobile",
    "Scrollable: show the scroll buttons below 600px too.",
  ),
  visibleScrollbar: flag("data-ok-visible-scrollbar", "Scrollable: show the scrollbar."),
  segmented: flag(
    "data-ok-segmented",
    "A filled bar where the selected tab is a raised pill (instead of a line).",
  ),
  selectionFollowsFocus: flag(
    "data-ok-selection-follows-focus",
    "Arrow keys select the tab they move to (otherwise Enter / Space selects).",
  ),
  value: state("aria-selected", "Selected tab (`value` / `defaultValue`).", "change"),
});

export interface TabsAnatomyOptions {
  variant?: TabsVariant | undefined;
  orientation?: Orientation | undefined;
  textColor?: TabsColor | undefined;
  indicatorColor?: TabsColor | undefined;
  scrollButtons?: TabsScrollButtons | undefined;
  centered?: boolean | undefined;
  allowScrollButtonsMobile?: boolean | undefined;
  visibleScrollbar?: boolean | undefined;
  segmented?: boolean | undefined;
  selectionFollowsFocus?: boolean | undefined;
}

/** `data-ok-*` attributes of a tabs root (the tab list carries `role="tablist"`). */
export const tabsAttributes = (options: TabsAnatomyOptions = {}): DataAttributes =>
  optionAttributes(tabsOptions, { ...options });

export const tabOptions = defineOptions("tab", "data-ok-tab", {
  iconPosition: style(
    "data-ok-icon-position",
    tabIconPositions,
    "top",
    "With an icon and a label: where the icon goes.",
    { optional: true },
  ),
  wrapped: flag("data-ok-wrapped", "Long labels wrap onto two lines."),
  disabled: native("disabled", "Native `disabled`: can't be selected or focused."),
});

export interface TabAnatomyOptions {
  iconPosition?: TabIconPosition | undefined;
  wrapped?: boolean | undefined;
}

/** `data-ok-*` attributes of a tab (`role="tab"`, `aria-selected` and `tabindex` by the owner). */
export const tabAttributes = (options: TabAnatomyOptions = {}): DataAttributes =>
  optionAttributes(tabOptions, { ...options });
