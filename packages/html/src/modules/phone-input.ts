/** Lazy module `modules/phone-input.js` (ADR-0068): registers its components on the page's runtime (image flags come from `flags/` next to `owlky.js`). */
import { phoneInput, setPhoneFlagsPath } from "../components/phone-input/phone-input.js";
import { getRuntime } from "../runtime/global.js";

// Image flags (`data-ok-flags="image"`) load from the `flags/` folder above this module unless the
// root names its own `data-ok-flags-path`.
setPhoneFlagsPath(new URL(/* @vite-ignore */ "../flags/", import.meta.url).href);
getRuntime().register(phoneInput).start();
