"use client";

import {
  defaultPaginationItemLabel,
  type PaginationColor,
  type PaginationItemData,
  type PaginationItemType,
  type PaginationShape,
  type PaginationSize,
  type PaginationVariant,
  paginationAttributes,
  paginationItems,
} from "@owlky/core";
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode, type Ref } from "react";
import { useControllableState } from "../utils/use-controllable-state.js";

type NavType = "first" | "previous" | "next" | "last";

const ICON_PATHS: Record<NavType, string> = {
  first: "m11 17-5-5 5-5M18 17l-5-5 5-5",
  previous: "m15 18-6-6 6-6",
  next: "m9 18 6-6-6-6",
  last: "m13 17 5-5-5-5M6 17l5-5-5-5",
};

function NavIcon({ type }: { type: NavType }) {
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
      <path d={ICON_PATHS[type]} />
    </svg>
  );
}

export type PaginationIcons = Partial<Record<NavType, ReactNode>>;

export interface PaginationItemProps
  extends Omit<ComponentPropsWithoutRef<"button">, "type" | "value"> {
  /** What the item is: a page, an ellipsis or a navigation button. Default `"page"`. */
  type?: PaginationItemType | undefined;
  /** Target page (1-based); `null` for ellipses. */
  page?: number | null | undefined;
  /** The current page (`aria-current="page"`). */
  selected?: boolean | undefined;
  /** Icon of a first / previous / next / last item (default chevrons). */
  icon?: ReactNode;
  /** Renders a link (`<a>`) instead of a button. */
  href?: string | undefined;
}

/**
 * One item: a page number, previous / next / first / last, or an ellipsis. Use it in
 * `renderItem` for custom content or links.
 */
export const PaginationItem = forwardRef<HTMLElement, PaginationItemProps>(function PaginationItem(
  { type = "page", page = null, selected = false, disabled, icon, href, children, ...props },
  ref,
) {
  if (type === "start-ellipsis" || type === "end-ellipsis") {
    return (
      <span ref={ref} data-ok-pagination-ellipsis="" aria-hidden="true">
        …
      </span>
    );
  }
  const content = children ?? (type === "page" ? page : (icon ?? <NavIcon type={type} />));
  const shared = {
    "data-ok-pagination-item": "",
    "data-ok-type": type,
    "aria-current": selected ? ("page" as const) : undefined,
  };
  if (href !== undefined) {
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        {...shared}
        href={disabled ? undefined : href}
        aria-disabled={disabled ? true : undefined}
        {...(props as ComponentPropsWithoutRef<"a">)}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      {...shared}
      value={type === "page" && page !== null ? page : undefined}
      disabled={disabled}
      {...props}
    >
      {content}
    </button>
  );
});

/** What `renderItem` receives: spread it onto a `PaginationItem`. */
export interface PaginationRenderItemParams extends PaginationItemData {
  "aria-label"?: string | undefined;
  icon?: ReactNode;
  onClick?: (() => void) | undefined;
}

export interface PaginationProps extends Omit<ComponentPropsWithoutRef<"nav">, "onChange"> {
  /** Total pages. Default 1. */
  count?: number | undefined;
  /** Controlled current page (1-based). */
  page?: number | undefined;
  /** Initial page when uncontrolled. Default 1. */
  defaultPage?: number | undefined;
  /** Called with the requested page. */
  onChange?: ((page: number) => void) | undefined;
  /** Default `"text"`. */
  variant?: PaginationVariant | undefined;
  /** Default `"standard"`. */
  color?: PaginationColor | undefined;
  /** Default `"circular"`. */
  shape?: PaginationShape | undefined;
  /** Default `"md"`. */
  size?: PaginationSize | undefined;
  disabled?: boolean | undefined;
  /** Pages always shown at each end. Default 1. */
  boundaryCount?: number | undefined;
  /** Pages always shown on each side of the current one. Default 1. */
  siblingCount?: number | undefined;
  /** Shows a button to the first page. */
  showFirstButton?: boolean | undefined;
  /** Shows a button to the last page. */
  showLastButton?: boolean | undefined;
  /** Hides the button to the previous page. */
  hidePrevButton?: boolean | undefined;
  /** Hides the button to the next page. */
  hideNextButton?: boolean | undefined;
  /** Accessible name of each item (default as MUI: "Go to page 3", "page 2", "Go to next page"). */
  getItemAriaLabel?:
    | ((type: PaginationItemType, page: number | null, selected: boolean) => string)
    | undefined;
  /** Renders each item (default `<PaginationItem {...item} />`). */
  renderItem?: ((item: PaginationRenderItemParams) => ReactNode) | undefined;
  /** Replaces the first / previous / next / last icons. */
  icons?: PaginationIcons | undefined;
}

/** Pagination — spec: specs/components/pagination.md */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    count = 1,
    page,
    defaultPage = 1,
    onChange,
    variant,
    color,
    shape,
    size,
    disabled = false,
    boundaryCount,
    siblingCount,
    showFirstButton,
    showLastButton,
    hidePrevButton,
    hideNextButton,
    getItemAriaLabel = defaultPaginationItemLabel,
    renderItem = (item) => <PaginationItem {...item} />,
    icons,
    "aria-label": label = "pagination navigation",
    ...props
  },
  ref,
) {
  const [current, setCurrent] = useControllableState({
    value: page,
    defaultValue: defaultPage,
    onChange,
  });
  const items = paginationItems({
    count,
    page: current,
    boundaryCount,
    siblingCount,
    showFirstButton,
    showLastButton,
    hidePrevButton,
    hideNextButton,
    disabled,
  });
  return (
    <nav
      ref={ref}
      aria-label={label}
      {...paginationAttributes({ variant, color, shape, size, disabled })}
      data-ok-runtime="off"
      {...props}
    >
      <ul>
        {items.map((item) => {
          const ellipsis = item.page === null;
          const target = item.page as number;
          return (
            <li key={item.type === "page" ? `page-${item.page}` : item.type}>
              {renderItem({
                ...item,
                "aria-label": ellipsis
                  ? undefined
                  : getItemAriaLabel(item.type, item.page, item.selected),
                icon: item.type === "page" || ellipsis ? undefined : icons?.[item.type as NavType],
                onClick: ellipsis ? undefined : () => setCurrent(target),
              })}
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
