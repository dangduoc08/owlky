/** Lazy module `modules/upload.js` (ADR-0068): registers its components on the page's runtime. */
import { upload } from "../components/upload/upload.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(upload).start();
