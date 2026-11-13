"use client";

import {
  altArrowLeftLinear,
  altArrowRightLinear,
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
  createElement,
  type ElementType,
  type ForwardRefExoticComponent,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Icon } from "../utils/icon.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

interface TabsContextValue {
  selected: string | false;
  /** The tab in the tab order: the selected one, else the first enabled one. */
  focusable: string | undefined;
  /** `id`s of the tabs and panels, from a `TabContext`. */
  prefix: string | undefined;
}

const TabsContext = createContext<TabsContextValue | null>(null);

/** Provided by `TabContext`: the selected value and the `id` prefix of its tabs and panels. */
const TabContextContext = createContext<{ value: string | false; prefix: string } | null>(null);

const tabId = (prefix: string, value: string) => `${prefix}-tab-${value}`;
const panelId = (prefix: string, value: string) => `${prefix}-panel-${value}`;

export interface TabContextProps {
  /** The selected tab's `value`. */
  value: string | false;
  /** `Tabs` and the `TabPanel`s that go with it. */
  children?: ReactNode;
}

/**
 * TabContext — spec: specs/components/tabs.md (MUI Lab). Shares the selected `value` between a
 * `Tabs` and its `TabPanel value="…"`s, and links them (`id`, `aria-controls`,
 * `aria-labelledby`). Keep the value in state and set it from `Tabs onChange`.
 */
export function TabContext({ value, children }: TabContextProps) {
  const prefix = useId();
  const context = useMemo(() => ({ value, prefix }), [value, prefix]);
  return <TabContextContext.Provider value={context}>{children}</TabContextContext.Provider>;
}

/** Chevron of the scroll buttons (decorative; the controller flips nothing, CSS rotates it). */
function ScrollIcon({ direction }: { direction: "start" | "end" }) {
  return <Icon icon={direction === "start" ? altArrowLeftLinear : altArrowRightLinear} />;
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
  const shared = useContext(TabContextContext);
  const items: { value: string; disabled: boolean }[] = [];
  let links = false;
  const tabs = Children.map(children, (child) => {
    if (!isValidElement<TabProps>(child)) return child;
    const own = child.props.value ?? String(items.length);
    items.push({ value: own, disabled: Boolean(child.props.disabled) });
    if (child.props.href !== undefined || child.props.component !== undefined) links = true;
    return child.props.value === undefined ? cloneElement(child, { value: own }) : child;
  });
  const [current, setCurrent] = useControllableState<string | false>({
    value: value ?? shared?.value,
    defaultValue: defaultValue ?? items[0]?.value ?? false,
    onChange: onChange as ((next: string | false) => void) | undefined,
  });
  const selectedItem = items.find((item) => item.value === current && !item.disabled);
  const focusable = selectedItem?.value ?? items.find((item) => !item.disabled)?.value;
  const prefix = shared?.prefix;
  const context = useMemo(
    () => ({ selected: current, focusable, prefix }),
    [current, focusable, prefix],
  );

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
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the root is named only with link tabs, as role="navigation".
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
      // Link tabs: a navigation landmark around plain links (aria-current="page").
      role={links ? "navigation" : undefined}
      aria-label={links ? ariaLabel : undefined}
      aria-labelledby={links ? ariaLabelledBy : undefined}
      {...props}
    >
      {scrollable && (
        <div data-ok-tabs-scroll-button="start" aria-hidden="true">
          <ScrollIcon direction="start" />
        </div>
      )}
      <div data-ok-tabs-scroller="">
        {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: named only as a tablist (link tabs name the root). */}
        <div
          role={links ? undefined : "tablist"}
          data-ok-tabs-list=""
          aria-label={links ? undefined : ariaLabel}
          aria-labelledby={links ? undefined : ariaLabelledBy}
          aria-orientation={!links && orientation === "vertical" ? "vertical" : undefined}
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
  /**
   * Makes the tab a link (`a[href]`): the navigation pattern. The selected link gets
   * `aria-current="page"`, the tab list becomes plain links in a `navigation` landmark.
   */
  href?: string | undefined;
  /** The element or component to render, such as a router link (its own props pass through). */
  component?: ElementType | undefined;
}

/**
 * Tab — spec: specs/components/tabs.md. A `button[role="tab"]` inside `Tabs`; with `href` or
 * `component`, a link (`aria-current="page"` when selected).
 */
export const Tab = forwardRef<HTMLElement, TabProps>(function Tab(
  { value, label, icon, iconPosition, wrapped, href, component, children, ...props },
  ref,
) {
  const tabs = useContext(TabsContext);
  const selected = tabs !== null && value !== undefined && tabs.selected === value;
  const inOrder = tabs === null || tabs.focusable === value;
  const attributes = tabAttributes({
    iconPosition: icon && label != null ? (iconPosition ?? "top") : undefined,
    wrapped,
  });
  const content = (
    <>
      {icon as ReactNode}
      {label != null && <span data-ok-tab-label="">{label as ReactNode}</span>}
      {children as ReactNode}
    </>
  );
  if (href !== undefined || component !== undefined) {
    return createElement(
      component ?? "a",
      {
        ref,
        ...(href === undefined ? {} : { href }),
        ...attributes,
        "data-ok-value": value,
        ...props,
        "aria-current": selected ? "page" : undefined,
      },
      content,
    );
  }
  const prefix = tabs?.prefix;
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      role="tab"
      id={prefix && value !== undefined ? tabId(prefix, value) : undefined}
      aria-controls={prefix && value !== undefined ? panelId(prefix, value) : undefined}
      {...attributes}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      value={value}
      aria-selected={selected}
      tabIndex={selected || inOrder ? 0 : -1}
    >
      {content}
    </button>
  );
}) as ForwardRefExoticComponent<TabProps & Record<string, unknown> & RefAttributes<HTMLElement>>;

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * In a `TabContext`: the tab this panel belongs to. The panel then links itself to its tab and
   * hides itself while another tab is selected.
   */
  value?: string | undefined;
  /** With `value`: keep the children rendered while the panel is hidden. Default `false`. */
  keepMounted?: boolean | undefined;
}

/**
 * TabPanel — spec: specs/components/tabs.md. The content of one tab: `role="tabpanel"`, in the tab
 * order (it may hold no focusable content). Hide the others with `hidden`, or give each a `value`
 * inside a `TabContext`.
 */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, keepMounted = false, children, ...props },
  ref,
) {
  const shared = useContext(TabContextContext);
  const linked = shared !== null && value !== undefined;
  const hidden = linked ? shared.value !== value : undefined;
  return (
    <div
      ref={ref}
      role="tabpanel"
      data-ok-tab-panel=""
      // biome-ignore lint/a11y/noNoninteractiveTabindex: WAI-ARIA tabs pattern: a panel without focusable content is in the tab order.
      tabIndex={0}
      id={linked ? panelId(shared.prefix, value) : undefined}
      aria-labelledby={linked ? tabId(shared.prefix, value) : undefined}
      hidden={hidden}
      {...props}
    >
      {hidden && !keepMounted ? null : children}
    </div>
  );
});
