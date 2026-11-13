import {
  createIcon,
  galleryRemoveLinear,
  type ImageState,
  imageLoadState,
  imageOptions,
  imageStyle,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** The broken-image icon, the same markup as React's `ImageErrorIcon` (built with DOM methods). */
function errorIcon(): SVGSVGElement {
  return createIcon(galleryRemoveLinear, { "data-ok-image-icon": "" });
}

export interface ImageInstance extends ComponentInstance {
  /** `loading`, `loaded` or `error`. */
  readonly state: ImageState;
}

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface ImageEvents {
  /** After the picture loaded. `src` is the source the browser picked (`currentSrc`). */
  load: EventSpec<{ src: string }>;
  /** After the picture failed to load. */
  error: EventSpec<{ src: string }>;
}

/**
 * Image — spec: specs/components/image.md
 *
 * Markup:  <span data-ok-image data-ok-ratio="16/9" data-ok-fit="cover" data-ok-position="center" data-ok-effect="blur">
 *            <span data-ok-image-placeholder aria-hidden="true"></span>
 *            <img src="…" alt="…" loading="lazy" decoding="async">
 *          </span>
 * CSS only, except the load state: `data-ok-state` (`loading` → `loaded` | `error`) from the
 * picture's `load` / `error` events (and `complete` at setup), `ok:image:load` /
 * `ok:image:error`, and a broken-image icon after an error. A new `src` / `srcset` loads again.
 * A custom `data-ok-ratio` (`16/10`, `1.6`) becomes `--_ok-image-ratio` (CSSOM).
 */
export const image = defineComponent<ComponentInstance, ImageEvents>({
  name: "image",
  selector: "[data-ok-image]",

  setup(element, { signal, emit }) {
    // A custom ratio is a private property (named ratios are CSS rules on the attribute).
    const { attr } = imageOptions.options.ratio;
    let written: string[] = [];
    const drawRatio = () => {
      written = syncCustomProperties(element, imageStyle(element.getAttribute(attr)), written);
    };
    drawRatio();
    const ratioObserver = new MutationObserver(drawRatio);
    ratioObserver.observe(element, { attributes: true, attributeFilter: [attr] });
    const img = element.querySelector<HTMLImageElement>(":scope > img");
    let current: ImageState = "loaded";
    const set = (next: ImageState) => {
      current = next;
      element.setAttribute("data-ok-state", next);
      const icon = element.querySelector(":scope > [data-ok-image-icon]");
      if (next !== "error") icon?.remove();
      else if (!icon) element.append(errorIcon());
    };
    if (!img)
      return {
        get state() {
          return current;
        },
        destroy() {
          ratioObserver.disconnect();
          syncCustomProperties(element, {}, written);
        },
      };
    set(imageLoadState(img));
    img.addEventListener(
      "load",
      () => {
        set("loaded");
        emit("load", { src: img.currentSrc });
      },
      { signal },
    );
    img.addEventListener(
      "error",
      () => {
        set("error");
        emit("error", { src: img.src });
      },
      { signal },
    );
    // A new source loads again (the events above report the result).
    const observer = new MutationObserver(() => set(imageLoadState(img)));
    observer.observe(img, { attributes: true, attributeFilter: ["src", "srcset", "sizes"] });
    return {
      get state() {
        return current;
      },
      destroy() {
        observer.disconnect();
        ratioObserver.disconnect();
        syncCustomProperties(element, {}, written);
        element.removeAttribute("data-ok-state");
        element.querySelector(":scope > [data-ok-image-icon]")?.remove();
      },
    };
  },
});
