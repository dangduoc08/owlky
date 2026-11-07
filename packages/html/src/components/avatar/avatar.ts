import { avatarOptions, parseNumber, progressSize } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";

const { size } = avatarOptions.options;

/** Replaces a broken image with the first letter of its `alt` (built with textContent). */
function fallBack(img: HTMLImageElement) {
  // Only called for `[data-ok-avatar] > img`; a second error finds the fallback already there.
  const avatar = img.parentElement as HTMLElement;
  img.hidden = true;
  const letter = img.alt.trim()[0]?.toUpperCase();
  const others = [...avatar.childNodes].some(
    (node) => node !== img && (node.nodeType === Node.ELEMENT_NODE || node.textContent?.trim()),
  );
  if (letter && !others) {
    const span = document.createElement("span");
    span.setAttribute("data-ok-avatar-fallback", "");
    span.setAttribute("aria-hidden", "true");
    span.textContent = letter;
    avatar.append(span);
  }
}

/**
 * Avatar — spec: specs/components/avatar.md
 *
 * Markup:  <span data-ok-avatar data-ok-variant="circular" data-ok-color="default" data-ok-size="56">
 *            <img src="…" alt="Jayvion Simon">
 *          </span>
 * CSS only, except: `data-ok-size` becomes `--_ok-avatar-size` (CSSOM), and an image that fails
 * to load is hidden and replaced by the first letter of its `alt`.
 */
export const avatar = defineComponent({
  name: "avatar",
  selector: "[data-ok-avatar]",

  setup(element) {
    let written: string[] = [];
    const draw = () => {
      const value = parseNumber(size, element.getAttribute(size.attr));
      written = syncCustomProperties(
        element,
        value !== undefined ? { "--_ok-avatar-size": progressSize(value) as string } : {},
        written,
      );
    };
    draw();
    // An image that failed before the runtime started.
    const img = element.querySelector<HTMLImageElement>(":scope > img");
    if (img?.complete && img.naturalWidth === 0 && img.getAttribute("src")) fallBack(img);
    const observer = new MutationObserver(draw);
    observer.observe(element, { attributes: true, attributeFilter: [size.attr] });
    return {
      destroy() {
        observer.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
  },

  delegate: [
    {
      // `error` doesn't bubble: listen in the capture phase.
      event: "error",
      capture: true,
      selector: "[data-ok-avatar] > img",
      handle(img) {
        fallBack(img as HTMLImageElement);
      },
    },
  ],
});
