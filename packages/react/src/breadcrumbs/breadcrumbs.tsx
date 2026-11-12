"use client";

import {
  BREADCRUMBS_EXPAND_TEXT,
  breadcrumbsAttributes,
  breadcrumbsCollapse,
  menuDotsLinear,
} from "@owlky/core";
import {
  Children,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "../utils/icon.js";

/** The "more" icon of the expand button (decorative). */
function MoreIcon() {
  return <Icon icon={menuDotsLinear} />;
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  /** Shown between items. Default `"/"`; `<BreadcrumbsDot />` draws a dot. */
  separator?: ReactNode;
  /** More items than this collapse into an expand button. Default 8. */
  maxItems?: number | undefined;
  /** Collapsed: items shown before the expand button. Default 1. */
  itemsBeforeCollapse?: number | undefined;
  /** Collapsed: items shown after the expand button. Default 1. */
  itemsAfterCollapse?: number | undefined;
  /** Accessible name of the expand button. Default `"Show path"`. */
  expandText?: string | undefined;
  /** Names the navigation landmark. Default `"breadcrumb"`. */
  "aria-label"?: string | undefined;
  /** Links (`a`) and the current page (`<span aria-current="page">`), in order. */
  children?: ReactNode;
}

/**
 * Breadcrumbs — spec: specs/components/breadcrumbs.md. A `nav` with an ordered list of links;
 * every child becomes an item, separators go between them. Long trails collapse into an expand
 * button (React state; the HTML runtime does the same).
 */
export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  {
    separator = "/",
    maxItems,
    itemsBeforeCollapse,
    itemsAfterCollapse,
    expandText = BREADCRUMBS_EXPAND_TEXT,
    "aria-label": ariaLabel = "breadcrumb",
    children,
    ...props
  },
  ref,
) {
  const items = Children.toArray(children).filter(isValidElement);
  const [expanded, setExpanded] = useState(false);
  const collapse = expanded
    ? null
    : breadcrumbsCollapse(items.length, { maxItems, itemsBeforeCollapse, itemsAfterCollapse });
  const listRef = useRef<HTMLOListElement>(null);
  const reveal = useRef<number | null>(null);

  // After expanding, focus moves to the first item that was hidden (it had the button's place).
  useLayoutEffect(() => {
    if (reveal.current === null) return;
    const item = listRef.current?.querySelectorAll("[data-ok-breadcrumbs-item]")[reveal.current];
    reveal.current = null;
    item?.querySelector<HTMLElement>("a, button, [tabindex]")?.focus();
  });

  const nodes: ReactNode[] = [];
  items.forEach((child, index) => {
    // `Children.toArray` gives every child a key.
    const key = String(child.key);
    if (collapse && index === collapse.start) {
      nodes.push(
        <li key="collapsed" data-ok-breadcrumbs-item="" data-ok-breadcrumbs-collapsed="">
          <button
            type="button"
            data-ok-breadcrumbs-expand=""
            aria-label={expandText}
            onClick={() => {
              reveal.current = index;
              setExpanded(true);
            }}
          >
            <MoreIcon />
          </button>
        </li>,
        <li key="collapsed-separator" data-ok-breadcrumbs-separator="" aria-hidden="true">
          {separator}
        </li>,
      );
    }
    const hidden = collapse !== null && index >= collapse.start && index < collapse.end;
    nodes.push(
      <li key={key} data-ok-breadcrumbs-item="" hidden={hidden || undefined}>
        {child}
      </li>,
    );
    if (index < items.length - 1)
      nodes.push(
        <li
          key={`separator-${key}`}
          data-ok-breadcrumbs-separator=""
          aria-hidden="true"
          hidden={hidden || undefined}
        >
          {separator}
        </li>,
      );
  });

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      {...breadcrumbsAttributes({ maxItems, itemsBeforeCollapse, itemsAfterCollapse })}
      {...(expanded ? { "data-ok-expanded": "" } : {})}
      data-ok-runtime="off"
      {...props}
    >
      <ol ref={listRef} data-ok-breadcrumbs-list="">
        {nodes}
      </ol>
    </nav>
  );
});

/** A dot separator for `Breadcrumbs` (`separator={<BreadcrumbsDot />}`). */
export function BreadcrumbsDot() {
  return <span data-ok-breadcrumbs-dot="" />;
}
