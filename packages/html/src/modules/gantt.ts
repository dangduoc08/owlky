/** Lazy module `modules/gantt.js` (ADR-0068): registers its components on the page's runtime. */
import { gantt } from "../components/gantt/gantt.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(gantt).start();
