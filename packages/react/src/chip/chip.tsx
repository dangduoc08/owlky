import {
  type ChipColor,
  type ChipVariant,
  chipAttributes,
  type SelectionControlSize,
} from "@owlky/core";
import {
  forwardRef,
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
  /** Called when the chip is pressed. */
  onClick?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined;
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
  const button = clickable === true || onClick !== undefined;
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (onDelete && (event.key === "Backspace" || event.key === "Delete")) {
      event.preventDefault();
      onDelete();
    }
  };
  return (
    <span ref={ref} {...chipAttributes({ variant, color, size })} data-ok-runtime="off" {...props}>
      {button ? (
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
