import {
  ORGANIZATION_CHART_LENGTHS,
  type OrganizationChartLength,
  organizationChartOptions,
  organizationChartStyle,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";

const { options } = organizationChartOptions;
const LENGTHS = Object.keys(ORGANIZATION_CHART_LENGTHS) as OrganizationChartLength[];
/** Attributes that change a length; the runtime rewrites the properties when one changes. */
const OBSERVED = LENGTHS.map((key) => options[key].attr);

/**
 * Organization chart — spec: specs/components/organization-chart.md
 *
 * Markup:  <ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid"
 *              aria-label="Organization chart">
 *            <li data-ok-organization-chart-node>
 *              <div data-ok-organization-chart-label>…</div>
 *              <ul data-ok-organization-chart-children>
 *                <li data-ok-organization-chart-node>…</li>
 *              </ul>
 *            </li>
 *          </ul>
 * The chart is CSS only. The runtime only turns the length options (`data-ok-line-height`,
 * `data-ok-line-width`, `data-ok-line-border-radius`, `data-ok-node-padding`) into private custom
 * properties (CSSOM, no style strings) and follows changes to them. Without JavaScript the
 * default lengths apply.
 */
export const organizationChart = defineComponent({
  name: "organization-chart",
  selector: "[data-ok-organization-chart]",

  setup(element) {
    let written: string[] = [];
    const sync = () => {
      const values: Partial<Record<OrganizationChartLength, string | null>> = {};
      for (const key of LENGTHS) values[key] = element.getAttribute(options[key].attr);
      written = syncCustomProperties(element, organizationChartStyle(values), written);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(element, { attributes: true, attributeFilter: OBSERVED });
    return {
      destroy() {
        observer.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
