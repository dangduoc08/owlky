/** Lazy module `modules/illustration.js` (ADR-0068): registers its components on the page's runtime. */
import { illustration } from "../components/illustration/illustration.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(illustration).start();
