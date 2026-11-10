import {
  type ChipColor,
  type ChipVariant,
  chipAttributes,
  linkRel,
  type SelectionControlSize,
} from "@owlky/core";
import {
  createElement,
  type ElementType,
  forwardRef,
  type HTMLAttributeAnchorTarget,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

/** Default delete icon (decorative, same SVG as the HTML snippets). */
function DeleteIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8.46 7.05 12 10.59l3.54-3.54 1.41 1.41L13.41 12l3.54 3.54-1.41 1.41L12 13.41l-3.54 3.54-1.41-1.41L10.59 12 7.05 8.46z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color" | "onClick"> {
  /** The chip's text. */
  label: ReactNode;
  /** Default `"filled"`. */
  variant?: ChipVariant | undefined;
  /** `default` (neutral), palette, `black` / `white`. Default `"default"`. */
  color?: ChipColor | undefined;
  /** `medium` (32px) or `small` (24px). Default `"medium"`. */
  size?: SelectionControlSize | undefined;
  /** An `Avatar` before the label. */
  avatar?: ReactNode;
  /** An icon before the label (when there's no avatar). */
  icon?: ReactNode;
  /** Makes the chip a button (also implied by `onClick`). */
  clickable?: boolean | undefined;
  /** Called when the chip is pressed (its button, or its link with `href`). */
  onClick?(event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>): void;
  /** Makes the chip a link: its action is an `<a>` with this URL. */
  href?: string | undefined;
  /** Where the link opens, such as `_blank`. A new tab always gets `rel="noopener noreferrer"`. */
  target?: HTMLAttributeAnchorTarget | undefined;
  /** The link's relationship to the current page. */
  rel?: string | undefined;
  /** The element or component of the action, such as a router link. Default: `a` with `href`, else `button`. */
  component?: ElementType | undefined;
  /** Other props of the action element, such as a router link's `to`. */
  actionProps?: Record<string, unknown> | undefined;
  /** Renders a delete button that calls it (and Backspace / Delete on the focused chip). */
  onDelete?: (() => void) | undefined;
  /** Replaces the delete icon. */
  deleteIcon?: ReactNode;
  /** Name of the delete button. Default `"Remove"`. */
  deleteLabel?: string | undefined;
  /** Disables the chip's buttons. */
  disabled?: boolean | undefined;
}

/**
 * Chip — spec: specs/components/chip.md. A compact element for an attribute, a filter or an
 * action. Clickable chips are buttons; a delete button is separate, with its own name.
 */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  {
    label,
    variant,
    color,
    size,
    avatar,
    icon,
    clickable,
    onClick,
    href,
    target,
    rel,
    component,
    actionProps,
    onDelete,
    deleteIcon,
    deleteLabel = "Remove",
    disabled,
    ...props
  },
  ref,
) {
  const media = avatar ?? (icon != null ? <span data-ok-chip-icon="">{icon}</span> : null);
  const inner = (
    <>
      {media}
      <span data-ok-chip-label="">{label}</span>
    </>
  );
  const link = href !== undefined || (component !== undefined && component !== "button");
  const button = !link && (clickable === true || onClick !== undefined || component === "button");
  const safeRel = linkRel(target, rel);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (onDelete && (event.key === "Backspace" || event.key === "Delete")) {
      event.preventDefault();
      onDelete();
    }
  };
  return (
    <span ref={ref} {...chipAttributes({ variant, color, size })} data-ok-runtime="off" {...props}>
      {link ? (
        createElement(
          component ?? "a",
          {
            ...actionProps,
            "data-ok-chip-action": "",
            ...(href === undefined || disabled === true ? {} : { href }),
            ...(target === undefined ? {} : { target }),
            ...(safeRel === undefined ? {} : { rel: safeRel }),
            // A disabled link has no `href` (it can't be followed) and says so.
            ...(disabled === true ? { role: "link", "aria-disabled": true } : {}),
            onClick: disabled === true ? undefined : onClick,
            onKeyDown,
          },
          inner,
        )
      ) : button ? (
        <button
          type="button"
          data-ok-chip-action=""
          disabled={disabled}
          onClick={onClick}
          onKeyDown={onKeyDown}
        >
          {inner}
        </button>
      ) : (
        <span data-ok-chip-action="">{inner}</span>
      )}
      {onDelete && (
        <button
          type="button"
          data-ok-chip-delete=""
          aria-label={deleteLabel}
          disabled={disabled}
          onClick={() => onDelete()}
        >
          {deleteIcon ?? <DeleteIcon />}
        </button>
      )}
    </span>
  );
});
