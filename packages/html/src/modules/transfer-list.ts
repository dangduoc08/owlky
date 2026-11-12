/** Lazy module `modules/transfer-list.js` (ADR-0068): registers its components on the page's runtime. */
import { transferList } from "../components/transfer-list/transfer-list.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(transferList).start();
