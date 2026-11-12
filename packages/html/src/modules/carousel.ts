/** Lazy module `modules/carousel.js` (ADR-0068): registers its components on the page's runtime. */
import { carousel } from "../components/carousel/carousel.js";
import { lightbox } from "../components/lightbox/lightbox.js";
import { getRuntime } from "../runtime/global.js";

getRuntime().register(carousel, lightbox).start();
