import {
  behavior,
  type DataAttributes,
  defineOptions,
  optionAttributes,
} from "../options/define.js";

// --- Scrollbar --------------------------------------------------------------------------------

export const scrollbarOptions = defineOptions("scrollbar", "data-ok-scrollbar", {
  autoHide: behavior(
    "data-ok-auto-hide",
    true,
    "The thumb shows on hover and focus only; `false` keeps it visible.",
  ),
});

/** `data-ok-*` attributes of a scroll area (`autoHide` is written only when turned off). */
export const scrollbarAttributes = (
  options: { autoHide?: boolean | undefined } = {},
): DataAttributes => ({
  ...optionAttributes(scrollbarOptions),
  ...(options.autoHide === false ? { [scrollbarOptions.options.autoHide.attr]: "false" } : {}),
});
