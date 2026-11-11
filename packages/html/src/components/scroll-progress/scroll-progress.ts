import {
  createScrollProgress,
  readScrollProgress,
  SCROLL_ATTRIBUTES,
  type ScrollProgressController,
  type ScrollProgressMode,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface ScrollProgressInstance extends ComponentInstance {
  /** How far the container (or the target) has been scrolled, from 0 to 1, measured now. */
  readonly progress: number;
  /** How the progress is drawn: `css` (the stylesheet), `native` (a scroll timeline) or `fallback` (this script, on scroll). */
  readonly mode: ScrollProgressMode;
  /** Measures and redraws now, for example after content changed size without a scroll. */
  update(): void;
}

/** Attributes that change what is followed: the runtime starts over when one changes. */
const OBSERVED = [
  SCROLL_ATTRIBUTES.axis,
  SCROLL_ATTRIBUTES.container,
  SCROLL_ATTRIBUTES.target,
  SCROLL_ATTRIBUTES.offset,
];

/**
 * Scroll progress — spec: specs/components/scroll-progress.md
 *
 * Markup:  <span role="progressbar" aria-hidden="true" data-ok-linear-progress
 *                data-ok-variant="determinate" data-ok-scroll-progress [data-ok-scroll-axis="x"]
 *                [data-ok-scroll-container="<id>"] [data-ok-scroll-target="<id>"]
 *                [data-ok-scroll-offset="start end, end start"]>
 *            <span data-ok-linear-progress-bar="1"></span></span>
 * (or a determinate Circular progress). Behavior: core `createScrollProgress` follows the page,
 * the container or the target; the progress's own runtime keeps running next to this one.
 */
export const scrollProgress = defineComponent<ScrollProgressInstance>({
  name: "scroll-progress",
  selector: "[data-ok-scroll-progress]",

  setup(element) {
    let controller: ScrollProgressController = createScrollProgress(
      element,
      readScrollProgress(element),
    );
    const observer = new MutationObserver(() => {
      controller.destroy();
      controller = createScrollProgress(element, readScrollProgress(element));
    });
    observer.observe(element, { attributes: true, attributeFilter: OBSERVED });
    return {
      get progress() {
        return controller.progress;
      },
      get mode() {
        return controller.mode;
      },
      update() {
        controller.update();
      },
      destroy() {
        observer.disconnect();
        controller.destroy();
      },
    };
  },
});
