import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Accordion --------------------------------------------------------------------------------

export const accordionVariants = ["default", "outlined", "soft"] as const;
export type AccordionVariant = (typeof accordionVariants)[number];

export const accordionOptions = defineOptions("accordion", "data-ok-accordion", {
  variant: style(
    "data-ok-variant",
    accordionVariants,
    "default",
    "`default`: the open item becomes a card; `outlined`: bordered list; `soft`: filled items.",
  ),
  disableGutters: flag("data-ok-disable-gutters", "No margin around the open item."),
  disabled: flag(
    "data-ok-disabled",
    "Can't be toggled (summary `aria-disabled`, out of the tab order).",
  ),
  expanded: state("open", "Open state (`expanded` / `defaultExpanded`).", "toggle"),
});

export interface AccordionAnatomyOptions {
  variant?: AccordionVariant | undefined;
  disableGutters?: boolean | undefined;
  disabled?: boolean | undefined;
}

/** `data-ok-*` attributes of an accordion `<details>`. */
export const accordionAttributes = (options: AccordionAnatomyOptions = {}): DataAttributes =>
  optionAttributes(accordionOptions, { ...options });

export const accordionActionsOptions = defineOptions(
  "accordion-actions",
  "data-ok-accordion-actions",
  {
    disableSpacing: flag("data-ok-disable-spacing", "No space between the actions."),
  },
);

/** `data-ok-*` attributes of an accordion's actions row. */
export const accordionActionsAttributes = (
  options: { disableSpacing?: boolean | undefined } = {},
): DataAttributes => optionAttributes(accordionActionsOptions, { ...options });
