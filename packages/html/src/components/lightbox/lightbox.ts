import {
  type CarouselApi,
  createLightboxController,
  type LightboxApi,
  type LightboxCloseReason,
  type LightboxLabels,
  lightboxOptions,
  lightboxStyle,
  readNumber,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance } from "../../runtime/types.js";

/** Why the lightbox closed: the controller's reasons, a trigger or the API. */
export type LightboxHtmlCloseReason = LightboxCloseReason | "api" | "native";

/** The lightbox instance (`runtime.get(root, "lightbox")`). */
export interface LightboxInstance extends ComponentInstance, Omit<LightboxApi, "open" | "close"> {
  /** Opens at `index`. Returns `false` if `ok:lightbox:beforeopen` was prevented. */
  open(index?: number, trigger?: HTMLElement | null): boolean;
  /** Closes it. Returns `false` if `ok:lightbox:beforeclose` was prevented. */
  close(reason?: LightboxHtmlCloseReason): boolean;
}

const byId = (from: Element, id: string): Element | null =>
  (from.getRootNode() as Document | ShadowRoot).getElementById(id);

const o = lightboxOptions.options;
const SIZE_OPTIONS = [
  "padding",
  "spacing",
  "thumbnailsWidth",
  "thumbnailsHeight",
  "thumbnailsBorder",
  "thumbnailsBorderRadius",
  "thumbnailsPadding",
  "thumbnailsGap",
  "descriptionMaxLines",
  "animationFade",
  "animationZoom",
] as const;

/** Labels for the live region from `data-ok-labels` (JSON); anything invalid is ignored. */
function readLabels(element: Element): Partial<LightboxLabels> {
  const text = element.getAttribute("data-ok-labels");
  if (!text || text.length > 4000) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as Partial<LightboxLabels>) : {};
  } catch {
    return {};
  }
}

/**
 * Lightbox — spec: specs/components/lightbox.md (ADR-0032)
 *
 * Markup:  <button type="button" data-ok-lightbox-trigger data-ok-lightbox-open="lb" data-ok-index="0"
 *                  aria-haspopup="dialog"><img src="…" alt="…"></button> …
 *          <dialog id="lb" data-ok-lightbox data-ok-theme="dark" aria-label="Lightbox" …options>
 *            <section data-ok-carousel data-ok-lightbox-carousel aria-roledescription="carousel" …>
 *              <div data-ok-carousel-stage>
 *                <div data-ok-carousel-viewport tabindex="0"><div data-ok-carousel-container>
 *                  <div data-ok-carousel-slide data-ok-lightbox-slide role="group" …>
 *                    <div data-ok-lightbox-zoom><img data-ok-lightbox-image …></div>
 *                    <h2 data-ok-lightbox-caption="title">…</h2> …
 *                </div></div>
 *                <div data-ok-lightbox-toolbar>…buttons, counter, close…</div>
 *                <button data-ok-carousel-prev data-ok-lightbox-nav …> <button data-ok-carousel-next …>
 *              </div>
 *              <div data-ok-carousel-thumbs data-ok-lightbox-thumbnails …>…</div>
 *              <span data-ok-lightbox-live aria-live="polite"></span>
 *            </section>
 *          </dialog>
 * Triggers: [data-ok-lightbox-open="id"] (+ data-ok-index), [data-ok-lightbox-close] inside.
 * Behavior: core `createLightboxController` over the Carousel instance; the runtime writes the
 *          sizes of the numeric options (CSSOM). `data-ok-inline` on a `div` root: always open.
 * Events:  ok:lightbox:beforeopen (cancelable, detail.index), open, beforeclose (cancelable,
 *          detail.reason), close, view { index }, click { index }, zoom { zoom },
 *          rotate { index, rotation }, fullscreen { fullscreen }, slideshow { playing },
 *          captions { visible }, thumbnails { visible }, download / share (cancelable, { index }).
 */
export const lightbox = defineComponent<LightboxInstance>({
  name: "lightbox",
  selector: "[data-ok-lightbox]",

  setup(element, { emit, runtime }) {
    let written: string[] = [];
    const sizes = () => {
      const values: Record<string, unknown> = {};
      for (const key of SIZE_OPTIONS) {
        const value = element.getAttribute(o[key].attr);
        if (value !== null) values[key] = readNumber(element, o[key]);
      }
      written = syncCustomProperties(element, lightboxStyle(values), written);
    };
    sizes();
    const observer = new MutationObserver(sizes);
    observer.observe(element, {
      attributes: true,
      attributeFilter: SIZE_OPTIONS.map((key) => o[key].attr),
    });

    const carouselElement = element.querySelector("[data-ok-lightbox-carousel]");
    const carousel = () =>
      (runtime.getOrCreate(carouselElement, "carousel") as CarouselApi | undefined) ?? null;
    carousel();
    const onAutoplay = (event: Event) => {
      if (event.target === carouselElement)
        emit("slideshow", { playing: (event as CustomEvent<{ playing: boolean }>).detail.playing });
    };
    carouselElement?.addEventListener("ok:carousel:autoplay", onAutoplay);

    let instance: LightboxInstance;
    const controller = createLightboxController(element, {
      carousel,
      onDismiss: (reason) => instance.close(reason),
      onExternalClose: () => emit("close", { reason: "native" }),
      onView: (index) => emit("view", { index }),
      onSlideClick: (index) => emit("click", { index }),
      onZoom: (zoom) => emit("zoom", { zoom }),
      onRotate: (index, rotation) => emit("rotate", { index, rotation }),
      onFullscreen: (fullscreen) => emit("fullscreen", { fullscreen }),
      onCaptions: (visible) => emit("captions", { visible }),
      onThumbnails: (visible) => emit("thumbnails", { visible }),
      onDownload: (index) =>
        emit("download", { index }, { cancelable: true }) ? undefined : false,
      onShare: (index) => (emit("share", { index }, { cancelable: true }) ? undefined : false),
      get labels() {
        return readLabels(element);
      },
    });

    // The controller's getters and methods, with open / close going through the events.
    const { open, close, destroy } = controller;
    instance = Object.create(controller) as LightboxInstance;
    Object.defineProperties(instance, {
      open: {
        value(index = controller.index, trigger: HTMLElement | null = null) {
          if (controller.isOpen && element.hasAttribute(o.inline.attr)) {
            controller.goTo(index);
            return true;
          }
          if (!emit("beforeopen", { index, trigger }, { cancelable: true })) return false;
          const wasOpen = controller.isOpen;
          open(index, trigger);
          if (!wasOpen) emit("open", { index, trigger });
          return true;
        },
      },
      close: {
        value(reason: LightboxHtmlCloseReason = "api") {
          if (!controller.isOpen || element.hasAttribute(o.inline.attr)) return true;
          if (!emit("beforeclose", { reason }, { cancelable: true })) return false;
          close();
          emit("close", { reason });
          return true;
        },
      },
      destroy: {
        value() {
          observer.disconnect();
          carouselElement?.removeEventListener("ok:carousel:autoplay", onAutoplay);
          destroy();
          syncCustomProperties(element, {}, written);
        },
      },
    });
    if (element.hasAttribute("data-ok-open")) instance.open();
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-lightbox-open]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-ok-lightbox-open") as string;
        const instance = runtime.getOrCreate<LightboxInstance>(byId(trigger, id), "lightbox");
        if (!instance) {
          console.warn(`[owlky] No lightbox with id "${id}" for this trigger.`, trigger);
          return;
        }
        event.preventDefault();
        const index = Number(trigger.getAttribute("data-ok-index") ?? 0);
        instance.open(
          Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0,
          trigger as HTMLElement,
        );
      },
    },
  ],
});
