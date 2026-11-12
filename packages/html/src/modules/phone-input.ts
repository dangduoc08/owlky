/** Lazy module `modules/phone-input.js` (ADR-0068): registers its components on the page's runtime. */
import { phoneInput } from "../components/phone-input/phone-input.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(phoneInput).start();
