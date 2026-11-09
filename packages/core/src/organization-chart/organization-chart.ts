import { organizationChartOptions } from "../anatomy/anatomy.js";
import { parseNumber } from "../options/define.js";

/** The length options of an organization chart and the private custom property each one sets. */
export const ORGANIZATION_CHART_LENGTHS = {
  lineHeight: "--_ok-org-line-height",
  lineWidth: "--_ok-org-line-width",
  lineBorderRadius: "--_ok-org-line-radius",
  nodePadding: "--_ok-org-node-padding",
} as const;

export type OrganizationChartLength = keyof typeof ORGANIZATION_CHART_LENGTHS;

export type OrganizationChartStyle = Partial<
  Record<(typeof ORGANIZATION_CHART_LENGTHS)[OrganizationChartLength], string>
>;

/**
 * Private custom properties of an organization chart root for the given lengths (React `style`,
 * the HTML runtime through CSSOM). A number is in px; a string may carry a unit (`"2rem"`).
 * Invalid or missing values are left out, so the stylesheet's defaults apply.
 */
export function organizationChartStyle(
  values: Partial<Record<OrganizationChartLength, unknown>>,
): OrganizationChartStyle {
  const style: OrganizationChartStyle = {};
  for (const key of Object.keys(ORGANIZATION_CHART_LENGTHS) as OrganizationChartLength[]) {
    const value = parseNumber(organizationChartOptions.options[key], values[key]);
    if (value !== undefined)
      style[ORGANIZATION_CHART_LENGTHS[key]] = typeof value === "number" ? `${value}px` : value;
  }
  return style;
}
