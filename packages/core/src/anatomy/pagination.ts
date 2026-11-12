import { paletteColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Pagination -------------------------------------------------------------------------------

export const paginationVariants = ["text", "outlined", "soft"] as const;
export const paginationColors = ["standard", ...paletteColorNames] as const;
export const paginationShapes = ["circular", "rounded"] as const;
export const paginationSizes = ["sm", "md", "lg"] as const;
export type PaginationVariant = (typeof paginationVariants)[number];
export type PaginationColor = (typeof paginationColors)[number];
export type PaginationShape = (typeof paginationShapes)[number];
export type PaginationSize = (typeof paginationSizes)[number];

export const paginationOptions = defineOptions("pagination", "data-ok-pagination", {
  variant: style("data-ok-variant", paginationVariants, "text", "Look of the current page."),
  color: style(
    "data-ok-color",
    paginationColors,
    "standard",
    "Color of the current page (`standard` = neutral).",
  ),
  shape: style("data-ok-shape", paginationShapes, "circular", "Round or 8px corners."),
  size: style("data-ok-size", paginationSizes, "md", "Item size: 26 / 32 / 40px."),
  disabled: flag("data-ok-disabled", "Every item is disabled."),
  page: state(
    "data-ok-page",
    "Current page, 1-based (`page` / `defaultPage` + `onChange(page)`).",
    "change",
  ),
});

export interface PaginationAnatomyOptions {
  variant?: PaginationVariant | undefined;
  color?: PaginationColor | undefined;
  shape?: PaginationShape | undefined;
  size?: PaginationSize | undefined;
  disabled?: boolean | undefined;
}

/** `data-ok-*` attributes of a pagination `<nav>`. */
export const paginationAttributes = (options: PaginationAnatomyOptions = {}): DataAttributes =>
  optionAttributes(paginationOptions, { ...options });
