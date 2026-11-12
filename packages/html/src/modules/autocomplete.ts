/** Lazy module `modules/autocomplete.js` (ADR-0068): registers its components on the page's runtime. */
import { autocomplete } from "../components/autocomplete/autocomplete.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(autocomplete).start();
