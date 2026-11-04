import {
  type ButtonSize,
  type ButtonVariant,
  buttonGroupAttributes,
  type ColorName,
  type Orientation,
} from "@minimal-tailwind/core";
import {
  Children,
  cloneElement,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactElement,
} from "react";
import type { ButtonProps } from "../button/button.js";

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Passed to every child Button that doesn't set its own. */
  variant?: ButtonVariant | undefined;
  color?: ColorName | undefined;
  size?: ButtonSize | undefined;
  disabled?: boolean | undefined;
  /** Default `"horizontal"`. */
  orientation?: Orientation | undefined;
}

type ShareableProps = Pick<ButtonProps, "variant" | "color" | "size" | "disabled">;

/**
 * ButtonGroup — spec: specs/components/button-group.md. A `role="group"` that joins its Buttons.
 * Group props are copied to the direct child elements (a child's own prop wins), so the group
 * stays a server component and the markup matches the HTML snippets.
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { variant, color, size, disabled, orientation, children, ...props },
  ref,
) {
  const shared: ShareableProps = { variant, color, size, disabled };
  return (
    // biome-ignore lint/a11y/useSemanticElements: a group of buttons, not form fields (<fieldset> would add form semantics and default styles).
    <div ref={ref} role="group" {...buttonGroupAttributes({ orientation })} {...props}>
      {Children.map(children, (child) => {
        if (!isValidElement<ShareableProps>(child)) return child;
        const own = child.props;
        const merged: ShareableProps = {};
        for (const key of ["variant", "color", "size", "disabled"] as const) {
          const value = own[key] ?? shared[key];
          if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
        }
        return cloneElement(child as ReactElement<ShareableProps>, merged);
      })}
    </div>
  );
});
