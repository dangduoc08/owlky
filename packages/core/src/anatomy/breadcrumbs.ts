import { type DataAttributes, defineOptions, number, optionAttributes } from "../options/define.js";

// --- Breadcrumbs --------------------------------------------------------------------------------

export const breadcrumbsOptions = defineOptions("breadcrumbs", "data-ok-breadcrumbs", {
  maxItems: number("data-ok-max-items", 8, "More items than this collapse into an expand button.", {
    min: 1,
  }),
  itemsBeforeCollapse: number(
    "data-ok-items-before-collapse",
    1,
    "Collapsed: items shown before the expand button.",
    { min: 0 },
  ),
  itemsAfterCollapse: number(
    "data-ok-items-after-collapse",
    1,
    "Collapsed: items shown after the expand button.",
    { min: 0 },
  ),
});

export interface BreadcrumbsAnatomyOptions {
  maxItems?: number | undefined;
  itemsBeforeCollapse?: number | undefined;
  itemsAfterCollapse?: number | undefined;
}

/** `data-ok-*` attributes of a breadcrumbs `nav`. */
export const breadcrumbsAttributes = (options: BreadcrumbsAnatomyOptions = {}): DataAttributes =>
  optionAttributes(breadcrumbsOptions, { ...options });
