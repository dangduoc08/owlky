"use client";

import {
  createTabsController,
  type Orientation,
  type TabIconPosition,
  type TabsColor,
  type TabsController,
  type TabsVariant,
  tabAttributes,
  tabsAttributes,
} from "@owlky/core";
import {
  type ButtonHTMLAttributes,
  Children,
  cloneElement,
  createContext,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

interface TabsContextValue {
  selected: string | false;
  /** The tab in the tab order: the selected one, else the first enabled one. */
  focusable: string | undefined;
}

const TabsContext = createContext<TabsContextValue | null>(null);

/** Chevron of the scroll buttons (decorative; the controller flips nothing, CSS rotates it). */
function ScrollIcon({ direction }: { direction: "start" | "end" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "start" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

export interface TabsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Controlled: the selected tab's `value` (`false`: none). */
  value?: string | false | undefined;
  /** Uncontrolled: the tab selected at first. Default: the first tab. */
  defaultValue?: string | false | undefined;
  /** Called with the `value` of the tab the user selects. */
  onChange?: ((value: string) => void) | undefined;
  /** Default `"standard"`. `scrollable` scrolls the tabs; `fullWidth` shares the width. */
  variant?: TabsVariant | undefined;
  /** Default `"horizontal"`. */
  orientation?: Orientation | undefined;
  /** Selected text color. Default `"inherit"` (the text color). */
  textColor?: TabsColor | undefined;
  /** Indicator color. Default `"inherit"` (the text color). */
  indicatorColor?: TabsColor | undefined;
  /** Scrollable: `"auto"` (default) shows them on overflow from 600px, `true` always, `false` never. */
  scrollButtons?: boolean | "auto" | undefined;
  /** Scrollable: show the scroll buttons below 600px too. */
  allowScrollButtonsMobile?: boolean | undefined;
  /** Scrollable: show the scrollbar. */
  visibleScrollbar?: boolean | undefined;
  /** Center the tabs (standard variant). */
  centered?: boolean | undefined;
  /** A filled bar with a raised pill behind the selected tab. */
  segmented?: boolean | undefined;
  /** Arrow keys select the tab they move to. Default: Enter / Space selects. */
  selectionFollowsFocus?: boolean | undefined;
  /** Names the tab list (or use `aria-labelledby`). */
  "aria-label"?: string | undefined;
  /** Names it with the id of a visible label. */
  "aria-labelledby"?: string | undefined;
  children?: ReactNode;
}

/**
 * Tabs — spec: specs/components/tabs.md. A tab list (WAI-ARIA tabs) with a sliding indicator.
 * Behavior (arrow keys, scroll buttons, the indicator) is core's `createTabsController`; this
 * component owns the selection. Pair each `Tab` with a `TabPanel` through `id` /
 * `aria-controls` / `aria-labelledby`.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value,
    defaultValue,
    onChange,
    variant,
    orientation = "horizontal",
    textColor,
    indicatorColor,
    scrollButtons = "auto",
    allowScrollButtonsMobile,
    visibleScrollbar,
    centered,
    segmented,
    selectionFollowsFocus,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    children,
    ...props
  },
  ref,
) {
  const items: { value: string; disabled: boolean }[] = [];
  const tabs = Children.map(children, (child) => {
    if (!isValidElement<TabProps>(child)) return child;
    const own = child.props.value ?? String(items.length);
    items.push({ value: own, disabled: Boolean(child.props.disabled) });
    return child.props.value === undefined ? cloneElement(child, { value: own }) : child;
  });
  const [current, setCurrent] = useControllableState<string | false>({
    value,
    defaultValue: defaultValue ?? items[0]?.value ?? false,
    onChange: onChange as ((next: string | false) => void) | undefined,
  });
  const selectedItem = items.find((item) => item.value === current && !item.disabled);
  const focusable = selectedItem?.value ?? items.find((item) => !item.disabled)?.value;
  const context = useMemo(() => ({ selected: current, focusable }), [current, focusable]);

  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);
  const controllerRef = useRef<TabsController | null>(null);
  const select = useRef(setCurrent);
  select.current = setCurrent;
  useLayoutEffect(() => {
    const controller = createTabsController(rootRef.current as HTMLDivElement, {
      onSelect: (_tab, next) => select.current(next),
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);
  // Every render may move or resize the selected tab: re-measure after the DOM is updated.
  useLayoutEffect(() => {
    controllerRef.current?.update();
  });

  const scrollable = variant === "scrollable" && scrollButtons !== false;
  return (
    <div
      ref={mergedRef}
      {...tabsAttributes({
        variant,
        orientation,
        textColor,
        indicatorColor,
        scrollButtons: scrollButtons === "auto" ? "auto" : scrollButtons ? "true" : "false",
        centered,
        allowScrollButtonsMobile,
        visibleScrollbar,
        segmented,
        selectionFollowsFocus,
      })}
      data-ok-runtime="off"
      {...props}
    >
      {scrollable && (
        <div data-ok-tabs-scroll-button="start" aria-hidden="true">
          <ScrollIcon direction="start" />
        </div>
      )}
      <div data-ok-tabs-scroller="">
        <div
          role="tablist"
          data-ok-tabs-list=""
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-orientation={orientation === "vertical" ? "vertical" : undefined}
        >
          <TabsContext.Provider value={context}>{tabs}</TabsContext.Provider>
        </div>
        <span data-ok-tabs-indicator="" />
      </div>
      {scrollable && (
        <div data-ok-tabs-scroll-button="end" aria-hidden="true">
          <ScrollIcon direction="end" />
        </div>
      )}
    </div>
  );
});

export interface TabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  /** Identifies the tab. Default: its position (`"0"`, `"1"`, …). */
  value?: string | undefined;
  /** The text of the tab. */
  label?: ReactNode;
  /** An icon (decorative `svg`); icon-only tabs need an `aria-label`. */
  icon?: ReactElement | undefined;
  /** With an icon and a label: where the icon goes. Default `"top"`. */
  iconPosition?: TabIconPosition | undefined;
  /** Long labels wrap onto two lines. */
  wrapped?: boolean | undefined;
}

/** Tab — spec: specs/components/tabs.md. A `button[role="tab"]` inside `Tabs`. */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, label, icon, iconPosition, wrapped, children, ...props },
  ref,
) {
  const tabs = useContext(TabsContext);
  const selected = tabs !== null && value !== undefined && tabs.selected === value;
  const inOrder = tabs === null || tabs.focusable === value;
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      {...tabAttributes({
        iconPosition: icon && label != null ? (iconPosition ?? "top") : undefined,
        wrapped,
      })}
      {...props}
      value={value}
      aria-selected={selected}
      tabIndex={selected || inOrder ? 0 : -1}
    >
      {icon}
      {label != null && <span data-ok-tab-label="">{label}</span>}
      {children}
    </button>
  );
});

export type TabPanelProps = HTMLAttributes<HTMLDivElement>;

/**
 * TabPanel — spec: specs/components/tabs.md. The content of one tab: `role="tabpanel"`, in the tab
 * order (it may hold no focusable content). Hide the others with `hidden`.
 */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(props, ref) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: WAI-ARIA tabs pattern: a panel without focusable content is in the tab order.
    <div ref={ref} role="tabpanel" data-ok-tab-panel="" tabIndex={0} {...props} />
  );
});
