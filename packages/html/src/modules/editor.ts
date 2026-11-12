/** Lazy module `modules/editor.js` (ADR-0068): registers its components on the page's runtime. */
import { editor } from "../components/editor/editor.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(editor).start();
