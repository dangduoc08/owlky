import {
  type CarouselApi,
  carouselOptions,
  carouselStyle,
  createCarouselController,
  readSlidesToShow,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance } from "../../runtime/types.js";

/** The carousel instance: Embla's API (v8 names) on the root element. */
export interface CarouselInstance extends ComponentInstance, CarouselApi {}

const SIZE_ATTRIBUTES = [
  "data-ok-slides-to-show",
  "data-ok-slides-to-show-sm",
  "data-ok-slides-to-show-md",
  "data-ok-slides-to-show-lg",
  "data-ok-slides-to-show-xl",
  carouselOptions.options.slideSpacing.attr,
];

/** A dot's name and text for snap `index`, following the first dot's wording ("Go to slide 1"). */
function renumber(dot: Element, model: Element | undefined, index: number) {
  const n = String(index + 1);
  const label = model?.getAttribute("aria-label") ?? "Go to slide 1";
  dot.setAttribute("aria-label", /\d+/.test(label) ? label.replace(/\d+/, n) : `${label} ${n}`);
  if (dot.textContent?.trim()) dot.textContent = n;
}

/** Adds or removes dots so every dots group has one button per snap. */
function syncDots(root: HTMLElement, count: number) {
  for (const group of root.querySelectorAll<HTMLElement>("[data-ok-carousel-dots]")) {
    if (group.closest("[data-ok-carousel]") !== root) continue;
    const dots = [...group.querySelectorAll<HTMLElement>("[data-ok-carousel-dot]")];
    const model = dots[0];
    for (const extra of dots.slice(count)) extra.remove();
    for (let index = dots.length; index < count; index++) {
      let dot: HTMLElement;
      if (model) {
        dot = model.cloneNode(true) as HTMLElement;
        dot.removeAttribute("aria-current");
      } else {
        dot = document.createElement("button");
        dot.setAttribute("type", "button");
        dot.setAttribute("data-ok-carousel-dot", "");
      }
      renumber(dot, model, index);
      group.append(dot);
    }
  }
}

/**
 * Carousel — spec: specs/components/carousel.md (ADR-0033)
 *
 * Markup:  <section data-ok-carousel aria-roledescription="carousel" aria-label="…" data-ok-loop …>
 *            <div data-ok-carousel-viewport tabindex="0">
 *              <div data-ok-carousel-container>
 *                <div role="group" aria-roledescription="slide" aria-label="1 of 4"
 *                     data-ok-carousel-slide data-ok-snapped>…</div> …
 *              </div>
 *              <span data-ok-carousel-live aria-live="polite" aria-atomic="true"></span>
 *            </div>
 *            <div data-ok-carousel-arrows …><button data-ok-icon-button data-ok-carousel-prev …>…</div>
 *            <div data-ok-carousel-dots …><button type="button" data-ok-carousel-dot …></button> …</div>
 *          </section>
 * Behavior: core `createCarouselController`; the runtime writes the slide sizes (CSSOM) from
 *          `data-ok-slides-to-show[-sm|-md|-lg|-xl]` / `data-ok-slide-spacing` and keeps one dot
 *          per snap.
 * Events:  ok:carousel:select `{ index, previous }`, settle `{ index }`, scroll `{ progress }`,
 *          slidesinview `{ indexes }`, reinit `{ snapCount }`, autoplay / autoscroll `{ playing }`,
 *          slidefocus `{ index }`, pointerdown, pointerup.
 */
export const carousel = defineComponent<CarouselInstance>({
  name: "carousel",
  selector: "[data-ok-carousel]",

  setup(element, { emit }) {
    let written: string[] = [];
    const sizes = () => {
      written = syncCustomProperties(
        element,
        carouselStyle(
          readSlidesToShow(element),
          element.getAttribute(carouselOptions.options.slideSpacing.attr),
        ),
        written,
      );
    };
    sizes();
    const observer = new MutationObserver(sizes);
    observer.observe(element, { attributes: true, attributeFilter: SIZE_ATTRIBUTES });

    const controller = createCarouselController(element, {
      onSelect: (index, previous) => emit("select", { index, previous }),
      onSettle: (index) => emit("settle", { index }),
      onScroll: (progress) => emit("scroll", { progress }),
      onSlidesInView: (indexes) => emit("slidesinview", { indexes }),
      onReInit: (snapCount) => {
        syncDots(element, snapCount);
        emit("reinit", { snapCount });
      },
      onAutoplay: (playing) => emit("autoplay", { playing }),
      onAutoScroll: (playing) => emit("autoscroll", { playing }),
      onSlideFocus: (index) => emit("slidefocus", { index }),
      onPointerDown: () => emit("pointerdown"),
      onPointerUp: () => emit("pointerup"),
    });

    const { destroy, ...api } = controller;
    return {
      ...api,
      destroy() {
        observer.disconnect();
        destroy();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
