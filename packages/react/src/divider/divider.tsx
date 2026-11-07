import {
  type DividerTextAlign,
  type DividerVariant,
  dividerAttributes,
  type Orientation,
} from "@owlky/core";
import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from "react";

export interface DividerProps extends HTMLAttributes<HTMLElement> {
  /** Default `"fullWidth"`. */
  variant?: DividerVariant | undefined;
  /** Default `"horizontal"`. */
  orientation?: Orientation | undefined;
  /** With text: where the text sits. Default `"center"`. */
  textAlign?: DividerTextAlign | undefined;
  /** Vertical, in a flex row: stretch to the row's height. */
  flexItem?: boolean | undefined;
  /** Pinned to the bottom of the positioned parent. */
  absolute?: boolean | undefined;
  /** Text (or a chip) on the line. */
  children?: ReactNode;
}

/**
 * Divider — spec: specs/components/divider.md. An `<hr>` (a native separator); with children, a
 * `div role="separator"` with the text between two lines.
 */
export const Divider = forwardRef<HTMLElement, DividerProps>(function Divider(
  { variant, orientation, textAlign, flexItem, absolute, children, ...props },
  ref,
) {
  const attributes = dividerAttributes({ variant, orientation, textAlign, flexItem, absolute });
  const vertical = attributes["data-ok-orientation"] === "vertical";
  if (children == null || children === false) {
    return (
      <hr
        ref={ref as Ref<HTMLHRElement>}
        {...attributes}
        {...(vertical ? { "aria-orientation": "vertical" as const } : {})}
        {...props}
      />
    );
  }
  return (
    // biome-ignore lint/a11y/useSemanticElements: an <hr> can't hold the text; MUI uses a separator div too.
    <div
      ref={ref as Ref<HTMLDivElement>}
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      {...attributes}
      {...props}
    >
      <span data-ok-divider-text="">{children}</span>
    </div>
  );
});
