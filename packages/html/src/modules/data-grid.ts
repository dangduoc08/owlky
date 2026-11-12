/** Lazy module `modules/data-grid.js` (ADR-0068): registers its components on the page's runtime. */
import { dataGrid } from "../components/data-grid/data-grid.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(dataGrid).start();
