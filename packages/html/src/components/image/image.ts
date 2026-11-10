import { type ImageState, imageLoadState } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

const SVG = "http://www.w3.org/2000/svg";

/** The broken-image icon, the same markup as React's `ImageErrorIcon` (built with DOM methods). */
function errorIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("data-ok-image-icon", "");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  const shapes: [string, Record<string, string>][] = [
    [
      "path",
      {
        d: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z",
        stroke: "currentColor",
        "stroke-width": "1.5",
      },
    ],
    ["path", { d: "m4 16 4.5-4.5 3 3L15 11l5 5", stroke: "currentColor", "stroke-width": "1.5" }],
    ["circle", { cx: "9", cy: "8.5", r: "1.5", fill: "currentColor" }],
    [
      "path",
      { d: "m3 3 18 18", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round" },
    ],
  ];
  for (const [tag, attributes] of shapes) {
    const shape = document.createElementNS(SVG, tag);
    for (const [name, value] of Object.entries(attributes)) shape.setAttribute(name, value);
    svg.append(shape);
  }
  return svg;
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
 */
export const image = defineComponent<ComponentInstance, ImageEvents>({
  name: "image",
  selector: "[data-ok-image]",

  setup(element, { signal, emit }) {
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
        element.removeAttribute("data-ok-state");
        element.querySelector(":scope > [data-ok-image-icon]")?.remove();
      },
    };
  },
});
