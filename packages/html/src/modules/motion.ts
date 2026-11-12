/** Lazy module `modules/motion.js` (ADR-0068): registers its components on the page's runtime. */
import { countUp } from "../components/count-up/count-up.js";
import { motion } from "../components/motion/motion.js";
import { motionBorder } from "../components/motion-border/motion-border.js";
import { motionGroup } from "../components/motion-group/motion-group.js";
import { motionText } from "../components/motion-text/motion-text.js";
import { scrollProgress } from "../components/scroll-progress/scroll-progress.js";
import { getRuntime } from "../runtime/global.js";

getRuntime()
  .register(motion, motionGroup, motionText, motionBorder, countUp, scrollProgress)
  .start();
