/** Lazy module `modules/walktour.js` (ADR-0068): registers its components on the page's runtime. */
import { walktour } from "../components/walktour/walktour.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(walktour).start();
