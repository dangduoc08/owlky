/** Lazy module `modules/sortable.js` (ADR-0068): registers its components on the page's runtime. */
import { sortable } from "../components/sortable/sortable.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(sortable).start();
