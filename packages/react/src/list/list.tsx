import {
  type ListItemAlignment,
  type ListSubheaderColor,
  listAttributes,
  listItemAttributes,
  listItemButtonAttributes,
  listItemTextAttributes,
  listSubheaderAttributes,
} from "@owlky/core";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  /** Compact rows: 4px less padding above and below every item. */
  dense?: boolean | undefined;
  /** No 8px padding above and below the list. */
  disablePadding?: boolean | undefined;
  /** Rendered first, usually a `ListSubheader`. */
  subheader?: ReactNode;
}

/**
 * List — spec: specs/components/list.md. A `<ul>`; wrap it in a `<nav>` for navigation. Nested
 * lists open and close from app state: the item button carries `aria-expanded` and
 * `aria-controls`, the nested list `hidden`.
 */
export const List = forwardRef<HTMLUListElement, ListProps>(function List(
  { dense, disablePadding, subheader, children, ...props },
  ref,
) {
  return (
    <ul ref={ref} {...listAttributes({ dense, disablePadding })} data-ok-runtime="off" {...props}>
      {subheader}
      {children}
    </ul>
  );
});

export interface ListItemProps extends LiHTMLAttributes<HTMLLIElement> {
  /** `flex-start` aligns the icon or avatar with the first line. Default `"center"`. */
  alignItems?: ListItemAlignment | undefined;
  dense?: boolean | undefined;
  /** No 16px padding on the sides. */
  disableGutters?: boolean | undefined;
  /** No padding: for an item that holds a `ListItemButton`. */
  disablePadding?: boolean | undefined;
  /** A 1px line below the item. */
  divider?: boolean | undefined;
  /** An action at the end of the row, such as an `IconButton`. */
  secondaryAction?: ReactNode;
}

/** A list row (`<li>`). */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  {
    alignItems,
    dense,
    disableGutters,
    disablePadding,
    divider,
    secondaryAction,
    children,
    ...props
  },
  ref,
) {
  return (
    <li
      ref={ref}
      {...listItemAttributes({ alignItems, dense, disableGutters, disablePadding, divider })}
      {...props}
    >
      {children}
      {secondaryAction != null && secondaryAction !== false && (
        <span data-ok-list-item-secondary-action="">{secondaryAction}</span>
      )}
    </li>
  );
});

export interface ListItemButtonOwnProps {
  alignItems?: ListItemAlignment | undefined;
  dense?: boolean | undefined;
  disableGutters?: boolean | undefined;
  divider?: boolean | undefined;
  /** Highlighted as the current choice. Add `aria-current` when it marks the current page. */
  selected?: boolean | undefined;
  children?: ReactNode;
}

export type ListItemButtonAsButtonProps = ListItemButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { href?: undefined };

export type ListItemButtonAsLinkProps = ListItemButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
    /** Renders an `<a>` with the row styling. */
    href: string;
    /** Removes `href` and sets `aria-disabled`, so the link can't be followed. */
    disabled?: boolean | undefined;
  };

export type ListItemButtonProps = ListItemButtonAsButtonProps | ListItemButtonAsLinkProps;

/** A clickable row: a `<button type="button">`, or an `<a>` when `href` is set. */
export const ListItemButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ListItemButtonProps
>(function ListItemButton(props, ref) {
  const { alignItems, dense, disableGutters, divider, selected, ...rest } = props;
  const attributes = listItemButtonAttributes({
    alignItems,
    dense,
    disableGutters,
    divider,
    selected,
  });
  if (rest.href !== undefined) {
    const { href, disabled, ...anchor } = rest as ListItemButtonAsLinkProps;
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        {...attributes}
        {...anchor}
        href={disabled === true ? undefined : href}
        role={disabled === true ? "link" : anchor.role}
        aria-disabled={disabled === true ? true : anchor["aria-disabled"]}
      />
    );
  }
  const { type = "button", ...button } = rest as ListItemButtonAsButtonProps;
  return <button ref={ref as Ref<HTMLButtonElement>} type={type} {...attributes} {...button} />;
});

/** An icon at the start of a row (decorative unless you label it). */
export const ListItemIcon = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function ListItemIcon(props, ref) {
    return <span ref={ref} data-ok-list-item-icon="" {...props} />;
  },
);

/** An `Avatar` at the start of a row. */
export const ListItemAvatar = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function ListItemAvatar(props, ref) {
    return <span ref={ref} data-ok-list-item-avatar="" {...props} />;
  },
);

export interface ListItemTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The main line. Defaults to `children`. */
  primary?: ReactNode;
  /** A second line in secondary text color. */
  secondary?: ReactNode;
  /** Starts 40px in, lined up with items that have an icon. */
  inset?: boolean | undefined;
  /** Renders `primary` and `secondary` as given, without the typography wrappers. */
  disableTypography?: boolean | undefined;
  children?: ReactNode;
}

const present = (node: ReactNode) => node != null && node !== false;

/** The text of a row: a primary line and an optional secondary line. */
export const ListItemText = forwardRef<HTMLSpanElement, ListItemTextProps>(function ListItemText(
  { primary, secondary, inset, disableTypography, children, ...props },
  ref,
) {
  const main = present(primary) ? primary : children;
  return (
    <span ref={ref} {...listItemTextAttributes({ inset })} {...props}>
      {disableTypography ? (
        <>
          {main}
          {secondary}
        </>
      ) : (
        <>
          {present(main) && <span data-ok-list-item-text-primary="">{main}</span>}
          {present(secondary) && <span data-ok-list-item-text-secondary="">{secondary}</span>}
        </>
      )}
    </span>
  );
});

export interface ListSubheaderProps extends LiHTMLAttributes<HTMLLIElement> {
  /** Default `"default"` (secondary text color). */
  color?: ListSubheaderColor | undefined;
  disableGutters?: boolean | undefined;
  /** Scrolls away with the list instead of sticking to the top. */
  disableSticky?: boolean | undefined;
  /** Starts 56px in, lined up with item text after an icon. */
  inset?: boolean | undefined;
}

/** A heading row of a list (`<li>`); point the list's `aria-labelledby` at its `id`. */
export const ListSubheader = forwardRef<HTMLLIElement, ListSubheaderProps>(function ListSubheader(
  { color, disableGutters, disableSticky, inset, ...props },
  ref,
) {
  return (
    <li
      ref={ref}
      {...listSubheaderAttributes({ color, disableGutters, disableSticky, inset })}
      {...props}
    />
  );
});

/**
 * The chevron at the end of a button that opens a nested list. It points down while the button's
 * `aria-expanded` is `false` and up while it is `true` (decorative).
 */
export const ListItemExpandIcon = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function ListItemExpandIcon({ children, ...props }, ref) {
    return (
      <span ref={ref} data-ok-list-item-expand-icon="" aria-hidden="true" {...props}>
        {children ?? (
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="m6 9 6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        )}
      </span>
    );
  },
);
