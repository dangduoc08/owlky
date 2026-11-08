"use client";

import {
  defaultRatingLabel,
  nextRating,
  type PaletteColorName,
  type RatingSize,
  ratingAttributes,
  ratingValues,
  roundRating,
} from "@owlky/core";
import {
  forwardRef,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from "react";
import { useControllableState } from "../utils/use-controllable-state.js";

/** The default icon: a star (decorative). */
export function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 2.5 14.9 8.4l6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9Z" />
    </svg>
  );
}

export interface RatingProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "onChange" | "defaultValue" | "color"> {
  /** Controlled value (`null`: no rating). */
  value?: number | null | undefined;
  /** Uncontrolled initial value. Default `null`. */
  defaultValue?: number | null | undefined;
  /** Called with the chosen value; clicking the current value clears it (`null`). */
  onChange?: ((value: number | null) => void) | undefined;
  /** Called with the value under the pointer, or `null` when it leaves. */
  onChangeActive?: ((value: number | null) => void) | undefined;
  /** Number of icons. Default 5. */
  max?: number | undefined;
  /** Smallest step: 1 (default), 0.5 or 0.25. */
  precision?: number | undefined;
  /** Default `"medium"` (24px). */
  size?: RatingSize | undefined;
  /** Filled icon color. Default `"warning"`. */
  color?: PaletteColorName | undefined;
  /** Shows the value only (`role="img"`). */
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Only the selected icon is filled. */
  highlightSelectedOnly?: boolean | undefined;
  /** Name of the radio group (default: generated). */
  name?: string | undefined;
  /** Filled icon (default a star). */
  icon?: ReactNode;
  /** Empty icon (default: `icon`, greyed). */
  emptyIcon?: ReactNode;
  /** An icon per value (overrides `icon` / `emptyIcon`), for example faces. */
  renderIcon?: ((value: number) => ReactNode) | undefined;
  /** Accessible label of each value. Default "2 Stars". */
  getLabelText?: ((value: number) => string) | undefined;
  /** Label of the "no rating" radio. Default "Empty". */
  emptyLabelText?: string | undefined;
}

/**
 * Rating — spec: specs/components/rating.md. A radio group drawn as icons (MUI Rating): native
 * radios carry the value, the keyboard and the labels; icons show it.
 */
export const Rating = forwardRef<HTMLSpanElement, RatingProps>(function Rating(
  {
    value,
    defaultValue = null,
    onChange,
    onChangeActive,
    max = 5,
    precision = 1,
    size,
    color,
    readOnly,
    disabled,
    highlightSelectedOnly,
    name,
    icon,
    emptyIcon,
    renderIcon,
    getLabelText = defaultRatingLabel,
    emptyLabelText = "Empty",
    ...props
  },
  ref,
) {
  const id = useId();
  const group = name ?? `rating-${id}`;
  const [current, setCurrent] = useControllableState<number | null>({
    value: value === undefined ? undefined : roundRating(value, precision),
    defaultValue: roundRating(defaultValue, precision),
    onChange,
  });
  const [hover, setHover] = useState<number | null>(null);
  // WebKit forwards a label click to the radio with `detail` 0, like Space: track the press.
  const pressed = useRef(false);
  const values = ratingValues(max, precision);
  const shown = hover ?? current;
  const filled = (v: number) =>
    shown !== null && (highlightSelectedOnly ? v === shown : v <= shown + 1e-9);

  const report = (next: number | null) => {
    if (next === hover) return;
    setHover(next);
    onChangeActive?.(next);
  };
  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const label = (event.target as Element).closest("[data-ok-rating-icon]");
    report(label ? Number(label.getAttribute("data-ok-value")) : null);
  };

  const iconFor = (v: number) => {
    if (renderIcon) return renderIcon(v);
    const full = icon ?? <StarIcon />;
    if (emptyIcon === undefined) return full;
    return (
      <>
        <span data-ok-rating-icon-filled="">{full}</span>
        <span data-ok-rating-icon-empty="">{emptyIcon}</span>
      </>
    );
  };

  const whole = Array.from({ length: Math.ceil(values[values.length - 1] ?? 0) }, (_, i) => i + 1);
  const items = whole.map((star) => {
    const parts = values.filter((v) => v > star - 1 + 1e-9 && v <= star + 1e-9);
    return (
      <span key={star} data-ok-rating-item="">
        {parts.map((v) => {
          const fraction = Number((v - (star - 1)).toFixed(2));
          const attrs = {
            "data-ok-rating-icon": "",
            "data-ok-value": String(v),
            ...(fraction < 1 ? { "data-ok-fraction": String(fraction) } : {}),
            ...(filled(v) ? { "data-ok-filled": "" } : {}),
            ...(hover === v ? { "data-ok-hover": "" } : {}),
          };
          if (readOnly)
            return (
              <span key={v} {...attrs}>
                {iconFor(v)}
              </span>
            );
          const inputId = `${group}-${v}`;
          return [
            <label key={`l${v}`} htmlFor={inputId} {...attrs}>
              {iconFor(v)}
              <span data-ok-rating-label-text="">{getLabelText(v)}</span>
            </label>,
            <input
              key={`i${v}`}
              type="radio"
              data-ok-rating-input=""
              id={inputId}
              name={group}
              value={v}
              checked={current === v}
              disabled={disabled}
              onChange={() => setCurrent(v)}
              onClick={(event) => {
                // A pointer click on the current value clears it (not Space on the keyboard).
                const pointer = event.detail > 0 || pressed.current;
                pressed.current = false;
                if (pointer && current === v) setCurrent(nextRating(current, v));
              }}
            />,
          ];
        })}
      </span>
    );
  });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: press tracking only; the radios are the controls.
    <span
      ref={ref}
      {...ratingAttributes({ size, color, highlightSelectedOnly, readOnly, disabled })}
      data-ok-runtime="off"
      {...(readOnly
        ? { role: "img", "aria-label": current === null ? emptyLabelText : getLabelText(current) }
        : {})}
      onPointerMove={readOnly || disabled ? undefined : onPointerMove}
      onPointerLeave={readOnly || disabled ? undefined : () => report(null)}
      {...props}
      onPointerDown={(event) => {
        pressed.current = true;
        props.onPointerDown?.(event);
      }}
      onKeyDown={(event) => {
        pressed.current = false;
        props.onKeyDown?.(event);
      }}
    >
      {items}
      {!readOnly && (
        <>
          <label data-ok-rating-empty="" htmlFor={`${group}-empty`}>
            {emptyLabelText}
          </label>
          <input
            type="radio"
            data-ok-rating-input=""
            id={`${group}-empty`}
            name={group}
            value=""
            checked={current === null}
            disabled={disabled}
            onChange={() => setCurrent(null)}
          />
        </>
      )}
    </span>
  );
});
