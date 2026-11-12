/** Lazy module `modules/markdown.js` (ADR-0068): registers its components on the page's runtime. */
import { markdown } from "../components/markdown/markdown.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(markdown).start();
