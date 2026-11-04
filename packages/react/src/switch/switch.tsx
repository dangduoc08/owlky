import { type PaletteColorName, type SwitchSize, switchAttributes } from "@minimal-tailwind/core";
import { type ChangeEvent, type ComponentPropsWithoutRef, forwardRef, type ReactNode } from "react";

export interface SwitchProps
  extends Omit<ComponentPropsWithoutRef<"input">, "type" | "size" | "color" | "role"> {
  /** Visible label. Without it, pass `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** Track color when on. Default `"primary"`. */
  color?: PaletteColorName | undefined;
  /** Default `"md"`. */
  size?: SwitchSize | undefined;
  /** Called with the new checked state (controlled or uncontrolled). */
  onCheckedChange?: ((checked: boolean) => void) | undefined;
}

/**
 * Switch — spec: specs/components/switch.md. A native `<input type="checkbox" role="switch">`,
 * so `checked`/`defaultChecked`, forms, keyboard and focus work natively. The ref, `name`,
 * `value` and other input props go to the input; `className` and `style` go to the root label.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, color, size, className, style, onChange, onCheckedChange, ...inputProps },
  ref,
) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };
  return (
    <label className={className} style={style} {...switchAttributes({ color, size })}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        data-mt-switch-input=""
        onChange={handleChange}
        {...inputProps}
      />
      <span data-mt-switch-track="" aria-hidden="true">
        <span data-mt-switch-thumb="" />
      </span>
      {label != null && <span data-mt-switch-label="">{label}</span>}
    </label>
  );
});
