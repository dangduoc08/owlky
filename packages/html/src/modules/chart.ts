/** Lazy module `modules/chart.js` (ADR-0068): registers its components on the page's runtime. */
import { chart } from "../components/chart/chart.js";
import { chartTrellis } from "../components/chart-trellis/chart-trellis.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(chart, chartTrellis).start();
