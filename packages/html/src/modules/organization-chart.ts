/** Lazy module `modules/organization-chart.js` (ADR-0068): registers its components on the page's runtime. */
import { organizationChart } from "../components/organization-chart/organization-chart.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(organizationChart).start();
