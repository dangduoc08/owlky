import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type CarouselController,
  createCarouselController,
} from "../carousel/carousel-controller.js";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  createLightboxController,
  LIGHTBOX_FLAGS,
  type LightboxController,
  type LightboxControllerOptions,
  lightboxCarouselOptions,
} from "./lightbox-controller.js";

/* Core tests have no stylesheet: the layout the controller relies on, with fixed sizes. */
const CSS = `
[data-ok-lightbox]{position:fixed;inset:0;width:400px;height:300px;max-width:none;max-height:none;margin:0;padding:0;border:0}
[data-ok-lightbox][data-ok-inline]{position:relative}
[data-ok-carousel-viewport]{width:400px;height:200px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none}
[data-ok-carousel][data-ok-scrolling] [data-ok-carousel-viewport]{scroll-snap-type:none}
[data-ok-carousel-container]{display:flex;height:100%}
[data-ok-carousel-slide]{position:relative;flex:0 0 100%;height:100%;display:flex;overflow:hidden;order:var(--_ok-carousel-order,0);scroll-snap-align:var(--_ok-carousel-snap-align,start);scroll-snap-stop:always}
[data-ok-lightbox-zoom]{display:flex;align-items:center;justify-content:center;width:100%;height:100%}
[data-ok-lightbox-image]{display:block;max-width:100%;max-height:100%}
[data-ok-lightbox-media]{width:200px;height:100px}
[data-ok-lightbox-caption]{position:absolute;inset:0 0 auto;margin:0}
`;

/** A 1600 × 800 picture: displayed at 400 × 200, it zooms up to 4. */
const PICTURE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800"><rect width="1600" height="800" fill="teal"/></svg>',
)}`;

type Kind = "image" | "video" | "custom" | "zoomable" | "plain" | "bare";

interface Setup {
  kinds?: Kind[];
  attrs?: string;
  inline?: boolean;
  slideAttrs?: (i: number) => string;
  toolbar?: string;
}

function slideContent(kind: Kind, i: number) {
  if (kind === "video")
    return `<video data-ok-lightbox-video controls${i === 1 ? " data-ok-autoplay" : ""}><source src="clip.webm" type="video/webm"></video>`;
  if (kind === "custom") return `<div data-ok-lightbox-media><p>Custom ${i}</p></div>`;
  if (kind === "zoomable") return `<div data-ok-lightbox-media data-ok-zoomable>Map ${i}</div>`;
  if (kind === "plain") return `<p>Text ${i}</p>`;
  return `<img data-ok-lightbox-image src="${PICTURE}" alt="Picture ${i + 1}" width="1600" height="800">`;
}

const TOOLBAR = `
  <button type="button" data-ok-lightbox-zoom-in aria-label="Zoom in"></button>
  <button type="button" data-ok-lightbox-zoom-out aria-label="Zoom out"></button>
  <button type="button" data-ok-lightbox-rotate-ccw aria-label="Rotate counterclockwise"></button>
  <button type="button" data-ok-lightbox-rotate-cw aria-label="Rotate clockwise"></button>
  <button type="button" data-ok-carousel-play data-ok-lightbox-slideshow>Play</button>
  <button type="button" data-ok-lightbox-fullscreen>Fullscreen</button>
  <button type="button" data-ok-lightbox-download aria-label="Download"></button>
  <button type="button" data-ok-lightbox-share aria-label="Share"></button>
  <button type="button" data-ok-lightbox-captions>Captions</button>
  <button type="button" data-ok-lightbox-thumbnails-toggle>Thumbnails</button>
  <span data-ok-lightbox-counter><span data-ok-lightbox-counter-current>1</span> / <span data-ok-lightbox-counter-total>0</span></span>
  <button type="button" data-ok-lightbox-close aria-label="Close"></button>`;

function markup({
  kinds = ["image", "image", "image"],
  attrs = "",
  inline = false,
  slideAttrs = () => "",
  toolbar = TOOLBAR,
}: Setup) {
  const slides = kinds
    .map(
      (kind, i) =>
        `<div role="group" aria-roledescription="slide" aria-label="${i + 1} of ${kinds.length}" data-ok-carousel-slide data-ok-lightbox-slide${i === 0 ? " data-ok-snapped" : ""} ${slideAttrs(i)}>${kind === "bare" ? `<div data-ok-lightbox-media data-ok-zoomable>Bare ${i}</div>` : `<div data-ok-lightbox-zoom>${slideContent(kind, i)}</div>`}<h2 data-ok-lightbox-caption="title">Title ${i + 1}</h2></div>`,
    )
    .join("");
  const thumbs = kinds
    .map(
      (_, i) =>
        `<button type="button" data-ok-carousel-thumb aria-label="${i + 1} of ${kinds.length}"></button>`,
    )
    .join("");
  const tag = inline ? "div" : "dialog";
  return `<button type="button" id="trigger">Open</button>
  <${tag} data-ok-lightbox aria-label="Lightbox" data-ok-animation-swipe="0" ${inline ? "data-ok-inline" : ""} ${attrs}>
    <section data-ok-carousel data-ok-lightbox-carousel aria-roledescription="carousel" aria-label="Photo gallery" data-ok-loop data-ok-duration="0">
      <div data-ok-carousel-stage>
        <div data-ok-carousel-viewport tabindex="0"><div data-ok-carousel-container>${slides}</div>
          <span data-ok-carousel-live aria-live="polite"></span></div>
        <div data-ok-lightbox-toolbar>${toolbar}</div>
        <button type="button" data-ok-carousel-prev data-ok-lightbox-nav aria-label="Previous"></button>
        <button type="button" data-ok-carousel-next data-ok-lightbox-nav aria-label="Next"></button>
      </div>
      <div data-ok-carousel-thumbs data-ok-lightbox-thumbnails data-ok-orientation="horizontal">${thumbs}</div>
      <span data-ok-lightbox-live aria-live="polite"></span>
    </section>
  </${tag}>`;
}

interface Events {
  dismiss: string[];
  view: number[];
  click: number[];
  zoom: number[];
  rotate: [number, number][];
  fullscreen: boolean[];
  captions: boolean[];
  thumbnails: boolean[];
  external: number;
}

let style: HTMLStyleElement;
const cleanups: (() => void)[] = [];
beforeEach(() => {
  style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);
});
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  style.remove();
  cleanupDom();
  vi.restoreAllMocks();
});

async function setup(options: Setup = {}, extra: Partial<LightboxControllerOptions> = {}) {
  const host = mount(markup(options));
  const root = host.querySelector<HTMLElement>("[data-ok-lightbox]") as HTMLElement;
  const section = root.querySelector<HTMLElement>("[data-ok-carousel]") as HTMLElement;
  const carousel: CarouselController = createCarouselController(section);
  const events: Events = {
    dismiss: [],
    view: [],
    click: [],
    zoom: [],
    rotate: [],
    fullscreen: [],
    captions: [],
    thumbnails: [],
    external: 0,
  };
  const controller: LightboxController = createLightboxController(root, {
    carousel: () => carousel,
    onDismiss: (reason) => events.dismiss.push(reason),
    onExternalClose: () => events.external++,
    onView: (index) => events.view.push(index),
    onSlideClick: (index) => events.click.push(index),
    onZoom: (zoom) => events.zoom.push(zoom),
    onRotate: (index, rotation) => events.rotate.push([index, rotation]),
    onFullscreen: (on) => events.fullscreen.push(on),
    onCaptions: (visible) => events.captions.push(visible),
    onThumbnails: (visible) => events.thumbnails.push(visible),
    ...extra,
  });
  cleanups.push(() => {
    controller.destroy();
    carousel.destroy();
  });
  await Promise.all(
    [...root.querySelectorAll("img")].map((img) => img.decode().catch(() => undefined)),
  );
  const slides = [...root.querySelectorAll<HTMLElement>("[data-ok-carousel-slide]")];
  const q = <E extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<E>(selector) as E;
  return {
    host,
    root,
    section,
    carousel,
    controller,
    events,
    slides,
    q,
    trigger: host.querySelector<HTMLElement>("#trigger") as HTMLElement,
    viewport: q("[data-ok-carousel-viewport]"),
    live: q("[data-ok-lightbox-live]"),
    frame: (i: number) =>
      slides[i]?.querySelector<HTMLElement>("[data-ok-lightbox-zoom]") as HTMLElement,
  };
}

const until = (test: () => boolean, timeout = 3000) =>
  new Promise<void>((resolve, reject) => {
    const start = performance.now();
    const check = () => {
      if (test()) resolve();
      else if (performance.now() - start > timeout) reject(new Error("timeout"));
      else requestAnimationFrame(check);
    };
    check();
  });
const flush = async () => {
  await Promise.resolve();
  await nextFrame();
};

function pointer(
  target: Element,
  type: string,
  x: number,
  y: number,
  { id = 1, pointerType = "mouse", button = 0 } = {},
) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerId: id,
      pointerType,
      button,
    }),
  );
}

const key = (target: Element, name: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", {
    key: name,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
};

describe("lightboxCarouselOptions", () => {
  it("maps the lightbox options onto the carousel", () => {
    expect(lightboxCarouselOptions({})).toEqual({
      loop: true,
      stopOnLastSnap: false,
      draggable: true,
      duration: 25,
      autoplayDelay: 3000,
      playOnInit: false,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      stopOnFocusIn: false,
    });
    expect(
      lightboxCarouselOptions({
        finite: true,
        disableSwipeNavigation: true,
        slideshowDelay: 1000,
        animationSwipe: 200,
      }),
    ).toMatchObject({
      loop: false,
      stopOnLastSnap: true,
      draggable: false,
      duration: 10,
      autoplayDelay: 1000,
    });
    expect(lightboxCarouselOptions({ slideshowDelay: -1, animationSwipe: -1 })).toMatchObject({
      duration: 25,
      autoplayDelay: 3000,
    });
  });
});

describe("open and close", () => {
  it("opens modally at a slide, writes the state and focuses the slides", async () => {
    const { root, controller, slides, q, viewport, trigger, events } = await setup();
    trigger.focus();
    expect(root.hasAttribute(LIGHTBOX_FLAGS.ready)).toBe(true);
    expect(slides.map((s) => s.inert)).toEqual([false, true, true]);
    expect(q("[data-ok-lightbox-counter-total]").textContent).toBe("3");
    controller.open(2, trigger);
    expect(controller.isOpen).toBe(true);
    expect((root as HTMLDialogElement).open).toBe(true);
    expect(controller.index).toBe(2);
    expect(events.view).toEqual([2]);
    expect(slides.map((s) => s.inert)).toEqual([true, true, false]);
    expect(q("[data-ok-lightbox-counter-current]").textContent).toBe("3");
    expect(document.activeElement).toBe(viewport);
    controller.open(1); // Already open: moves only.
    expect(controller.index).toBe(1);
    controller.close();
    expect(controller.isOpen).toBe(false);
    expect((root as HTMLDialogElement).open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    controller.close();
  });

  it("asks to close on Escape and with the close button, and follows closeOnEscape", async () => {
    const { root, controller, q, events } = await setup();
    controller.open(0);
    root.dispatchEvent(new Event("cancel", { cancelable: true }));
    q("[data-ok-lightbox-close]").click();
    expect(events.dismiss).toEqual(["escape", "close"]);
    root.setAttribute("data-ok-close-on-escape", "false");
    await flush();
    controller.close();
    controller.open(0);
    root.dispatchEvent(new Event("cancel", { cancelable: true }));
    expect(events.dismiss).toEqual(["escape", "close"]);
  });

  it("reports a close made by the browser", async () => {
    const { root, controller, events } = await setup();
    controller.open(0);
    (root as HTMLDialogElement).close();
    await until(() => events.external === 1);
    expect(controller.isOpen).toBe(false);
  });

  it("works without showModal (fallback)", async () => {
    const { root, controller } = await setup({}, { forceFallback: true });
    controller.open(1);
    expect(root.hasAttribute("data-ok-fallback")).toBe(true);
    controller.close();
    expect(root.hasAttribute("data-ok-fallback")).toBe(false);
  });

  it("is always open inline, without a modal", async () => {
    const { root, controller, q, events, viewport } = await setup({ inline: true });
    expect(controller.isOpen).toBe(true);
    expect(root.hasAttribute("open")).toBe(false);
    q("[data-ok-lightbox-close]").click();
    expect(events.dismiss).toEqual(["close"]);
    key(viewport, "ArrowRight");
    await until(() => controller.index === 1);
  });
});

describe("navigation", () => {
  it("follows the carousel and resets the zoom", async () => {
    const { controller, carousel, events, q } = await setup();
    controller.open(0);
    controller.zoomIn();
    expect(controller.zoom).toBe(2);
    carousel.scrollNext(true);
    await until(() => controller.index === 1);
    expect(events.view.at(-1)).toBe(1);
    expect(controller.zoom).toBe(1);
    expect(q("[data-ok-lightbox-counter-current]").textContent).toBe("2");
    controller.next();
    await until(() => controller.index === 2);
    controller.prev();
    await until(() => controller.index === 1);
    controller.goTo(99, true);
    expect(controller.index).toBe(2);
    controller.goTo(Number.NaN, true);
    expect(controller.index).toBe(0);
  });

  it("answers the arrow keys, Home and End anywhere, mirrored right to left", async () => {
    const { root, controller, q } = await setup();
    controller.open(0);
    const zoomIn = q("[data-ok-lightbox-zoom-in]");
    key(zoomIn, "ArrowRight");
    await until(() => controller.index === 1);
    key(zoomIn, "ArrowLeft");
    await until(() => controller.index === 0);
    key(zoomIn, "End");
    await until(() => controller.index === 2);
    key(zoomIn, "Home");
    await until(() => controller.index === 0);
    root.setAttribute("dir", "rtl");
    key(zoomIn, "ArrowLeft");
    await until(() => controller.index === 1);
    root.removeAttribute("dir");
    // Ignored: modifiers, other keys, fields and videos, handled events.
    expect(key(zoomIn, "ArrowRight", { altKey: true }).defaultPrevented).toBe(false);
    expect(key(zoomIn, "ArrowRight", { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(key(zoomIn, "ArrowUp").defaultPrevented).toBe(false);
    expect(key(zoomIn, "0").defaultPrevented).toBe(false);
    expect(key(zoomIn, "a").defaultPrevented).toBe(false);
    const field = document.createElement("input");
    q("[data-ok-lightbox-toolbar]").append(field);
    expect(key(field, "ArrowRight").defaultPrevented).toBe(false);
    const handled = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    handled.preventDefault();
    zoomIn.dispatchEvent(handled);
    expect(controller.index).toBe(1);
    controller.close();
    expect(key(zoomIn, "ArrowRight").defaultPrevented).toBe(false);
  });

  it("handles keys on the viewport before the carousel does", async () => {
    const { controller, viewport } = await setup();
    controller.open(0);
    key(viewport, "ArrowRight");
    await until(() => controller.index === 1);
    await flush();
    expect(controller.index).toBe(1);
  });

  it("reports no view when the carousel settles after the lightbox closed", async () => {
    const { controller, slides, events } = await setup();
    controller.open(0);
    controller.close();
    const views = events.view.length;
    slides[0]?.removeAttribute("data-ok-snapped");
    slides[1]?.setAttribute("data-ok-snapped", "");
    await flush();
    expect(events.view).toHaveLength(views);
    expect(controller.index).toBe(0);
  });

  it("hides the navigation with one slide", async () => {
    const { q } = await setup({ kinds: ["image"] });
    expect(q("[data-ok-carousel-prev]").hidden).toBe(true);
  });

  it("re-reads the slides on sync and when the current slide changes", async () => {
    const { controller, slides, events } = await setup();
    slides[0]?.removeAttribute("data-ok-snapped");
    slides[2]?.setAttribute("data-ok-snapped", "");
    controller.sync();
    expect(controller.index).toBe(2);
    controller.sync();
    expect(events.view).toEqual([2]);
  });
});

describe("zoom", () => {
  it("zooms with the buttons up to the image's pixels, and disables them at the limits", async () => {
    const { root, controller, q, frame, live, events } = await setup();
    controller.open(0);
    const zoomIn = q("[data-ok-lightbox-zoom-in]");
    const zoomOut = q("[data-ok-lightbox-zoom-out]");
    expect(controller.maxZoom).toBe(4);
    expect(controller.zoomDisabled).toBe(false);
    expect(zoomOut.getAttribute("aria-disabled")).toBe("true");
    zoomIn.click();
    expect(controller.zoom).toBe(2);
    expect(root.hasAttribute(LIGHTBOX_FLAGS.zoomed)).toBe(true);
    expect(frame(0).style.getPropertyValue("--_ok-lightbox-scale")).toBe("2");
    expect(live.textContent).toBe("Zoom 200%");
    zoomIn.click();
    expect(controller.zoom).toBe(4);
    expect(zoomIn.getAttribute("aria-disabled")).toBe("true");
    zoomIn.click();
    expect(controller.zoom).toBe(4);
    zoomOut.click();
    zoomOut.click();
    expect(controller.zoom).toBe(1);
    expect(frame(0).style.getPropertyValue("--_ok-lightbox-scale")).toBe("");
    expect(events.zoom).toEqual([2, 4, 2, 1]);
    controller.zoomIn();
    controller.zoomOut();
    controller.changeZoom(3, true, 500, 500);
    expect(controller.zoom).toBe(3);
    expect(controller.offsetX).toBe(400);
    expect(controller.offsetY).toBe(200);
    expect(root.hasAttribute(LIGHTBOX_FLAGS.zooming)).toBe(true);
    controller.changeZoom(99);
    expect(controller.zoom).toBe(4);
  });

  it("answers + and -, Ctrl + 0, and the arrow keys pan while zoomed", async () => {
    const { controller, viewport } = await setup();
    controller.open(0);
    key(viewport, "+");
    expect(controller.zoom).toBe(2);
    key(viewport, "=");
    expect(controller.zoom).toBe(4);
    key(viewport, "-");
    expect(controller.zoom).toBe(2);
    key(viewport, "ArrowRight");
    expect(controller.offsetX).toBe(-50);
    expect(controller.index).toBe(0);
    key(viewport, "ArrowLeft");
    key(viewport, "ArrowDown");
    expect(controller.offsetY).toBe(-50);
    key(viewport, "ArrowUp");
    expect(controller.offsetY).toBe(0);
    expect(key(viewport, "ArrowUp", { ctrlKey: true }).defaultPrevented).toBe(false);
    key(viewport, "Home");
    key(viewport, "End");
    await flush();
    expect(controller.index).toBe(0);
    key(viewport, "0", { metaKey: true });
    expect(controller.zoom).toBe(1);
  });

  it("doesn't zoom videos, custom slides, small images, or with disableZoom", async () => {
    const { root, controller, q, slides } = await setup({ kinds: ["image", "video", "custom"] });
    controller.open(1);
    expect(controller.zoomDisabled).toBe(true);
    expect(q("[data-ok-lightbox-zoom-in]").getAttribute("aria-disabled")).toBe("true");
    expect(q("[data-ok-lightbox-rotate-cw]").getAttribute("aria-disabled")).toBe("true");
    controller.zoomIn();
    expect(controller.zoom).toBe(1);
    controller.changeZoom(2);
    expect(controller.zoom).toBe(1);
    controller.goTo(2, true);
    expect(controller.zoomDisabled).toBe(true);
    controller.goTo(0, true);
    controller.zoomIn();
    root.setAttribute("data-ok-disable-zoom", "");
    await flush();
    expect(controller.zoom).toBe(1);
    expect(controller.zoomDisabled).toBe(true);
    root.removeAttribute("data-ok-disable-zoom");
    await flush();
    // An image shown at its own size can't zoom.
    const image = slides[0]?.querySelector("img") as HTMLImageElement;
    image.style.width = "1600px";
    image.style.maxWidth = "none";
    image.style.flex = "none";
    expect(controller.zoomDisabled).toBe(true);
  });

  it("zooms custom zoomable slides up to maxZoom", async () => {
    const { root, controller } = await setup({
      kinds: ["zoomable", "image"],
      attrs: 'data-ok-max-zoom="3"',
    });
    controller.open(0);
    controller.zoomIn();
    controller.zoomIn();
    expect(controller.zoom).toBe(3);
    root.setAttribute("data-ok-zoom-in-multiplier", "1.5");
    controller.zoomOut();
    expect(controller.zoom).toBe(2);
  });

  it("zooms with Ctrl + wheel and pans with the wheel", async () => {
    const { root, controller, frame } = await setup();
    controller.open(0);
    const wheel = (init: WheelEventInit) => {
      const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...init });
      frame(0).dispatchEvent(event);
      return event;
    };
    expect(wheel({ deltaY: 100 }).defaultPrevented).toBe(false);
    expect(
      wheel({ deltaY: -400, ctrlKey: true, clientX: 200, clientY: 100 }).defaultPrevented,
    ).toBe(true);
    expect(controller.zoom).toBe(2);
    expect(root.hasAttribute(LIGHTBOX_FLAGS.zooming)).toBe(true);
    wheel({ deltaX: 30, deltaY: 20 });
    expect(controller.offsetX).toBe(-30);
    expect(controller.offsetY).toBe(-20);
    await until(() => !root.hasAttribute(LIGHTBOX_FLAGS.zooming));
    root.setAttribute("data-ok-scroll-to-zoom", "");
    wheel({ deltaY: 400 });
    expect(controller.zoom).toBe(1);
    root.setAttribute("data-ok-disable-zoom", "");
    expect(wheel({ deltaY: -400, ctrlKey: true }).defaultPrevented).toBe(false);
  });

  it("steps through zooms on double clicks and double taps", async () => {
    const { controller, frame, slides } = await setup();
    controller.open(0);
    const image = slides[0]?.querySelector("img") as HTMLImageElement;
    const box = image.getBoundingClientRect();
    image.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
        clientX: box.left + 300,
        clientY: box.top + 100,
      }),
    );
    expect(controller.zoom).toBe(2);
    expect(controller.offsetX).toBe(-100);
    frame(0).dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    expect(controller.zoom).toBe(4);
    frame(0).dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    expect(controller.zoom).toBe(1);
    // Touch: two quick taps at the same place.
    const tap = (x: number, id: number) => {
      pointer(frame(0), "pointerdown", x, 50, { id, pointerType: "touch" });
      pointer(frame(0), "pointerup", x, 50, { id, pointerType: "touch" });
    };
    tap(100, 2);
    expect(controller.zoom).toBe(1);
    tap(102, 3);
    expect(controller.zoom).toBe(2);
    tap(300, 4);
    tap(100, 5); // Too far from the last tap.
    expect(controller.zoom).toBe(2);
    // Nothing on slides that can't zoom, or with disableZoom.
    controller.changeZoom(1);
    frame(0).closest("[data-ok-lightbox]")?.setAttribute("data-ok-disable-zoom", "");
    frame(0).dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    expect(controller.zoom).toBe(1);
  });

  it("ignores double clicks on other slides, fields and while closed", async () => {
    const { controller, frame } = await setup({ kinds: ["image", "video"] });
    frame(0).dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    expect(controller.zoom).toBe(1);
    controller.open(1);
    frame(1)
      .querySelector("video")
      ?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    frame(0).dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    expect(controller.zoom).toBe(1);
    // A double tap on a slide that can't zoom does nothing.
    pointer(frame(1), "pointerdown", 10, 10, { pointerType: "touch" });
    pointer(frame(1), "pointerup", 10, 10, { pointerType: "touch" });
    pointer(frame(1), "pointerdown", 10, 10, { pointerType: "touch" });
    pointer(frame(1), "pointerup", 10, 10, { pointerType: "touch" });
    expect(controller.zoom).toBe(1);
  });

  it("pans a zoomed image with the pointer and pinches with two", async () => {
    const { root, controller, frame } = await setup();
    controller.open(0);
    controller.changeZoom(2, true);
    pointer(frame(0), "pointerdown", 200, 100);
    expect(root.hasAttribute(LIGHTBOX_FLAGS.zooming)).toBe(true);
    pointer(frame(0), "pointermove", 150, 80);
    expect(controller.offsetX).toBe(-50);
    expect(controller.offsetY).toBe(-20);
    pointer(frame(0), "pointermove", 140, 80, { id: 9 }); // Another pointer: ignored.
    pointer(frame(0), "pointerup", 150, 80);
    expect(root.hasAttribute(LIGHTBOX_FLAGS.zooming)).toBe(false);
    controller.changeZoom(1);
    // Pinch.
    pointer(frame(0), "pointerdown", 150, 100, { id: 1, pointerType: "touch" });
    pointer(frame(0), "pointerdown", 250, 100, { id: 2, pointerType: "touch" });
    pointer(frame(0), "pointermove", 300, 100, { id: 2, pointerType: "touch" });
    expect(controller.zoom).toBeCloseTo(1.5);
    pointer(frame(0), "pointerdown", 260, 100, { id: 3, pointerType: "touch" }); // A third: ignored.
    pointer(frame(0), "pointercancel", 260, 100, { id: 3, pointerType: "touch" });
    pointer(frame(0), "pointerup", 300, 100, { id: 2, pointerType: "touch" });
    pointer(frame(0), "pointerup", 150, 100, { id: 1, pointerType: "touch" });
    expect(root.hasAttribute(LIGHTBOX_FLAGS.zooming)).toBe(false);
    // Presses with another button, outside the current slide, or while closed are ignored.
    pointer(frame(0), "pointerdown", 150, 100, { button: 2 });
    pointer(frame(1), "pointerdown", 150, 100);
    pointer(frame(0), "pointermove", 150, 100);
    controller.close();
    pointer(frame(0), "pointerdown", 150, 100);
    expect(controller.zoom).toBe(1);
  });

  it("re-measures the zoom limits once images load and on resize", async () => {
    const { root, controller, slides } = await setup();
    controller.open(0);
    controller.changeZoom(4);
    (root.querySelector("[data-ok-carousel-viewport]") as HTMLElement).style.width = "800px";
    await until(() => controller.zoom < 4 || controller.offsetX === 0);
    slides[1]?.querySelector("img")?.dispatchEvent(new Event("load"));
    expect(controller.isOpen).toBe(true);
  });
});

describe("unusual slides", () => {
  it("handles slides without media or without a zoom frame", async () => {
    const { root, controller, q, live } = await setup({
      kinds: ["plain", "bare", "image"],
      attrs: "data-ok-download data-ok-rotate",
    });
    controller.open(0);
    expect(controller.zoomDisabled).toBe(true);
    await controller.download();
    expect(live.textContent).toBe("The file could not be downloaded.");
    controller.goTo(1, true);
    controller.zoomIn();
    expect(controller.zoom).toBe(2);
    expect(root.hasAttribute(LIGHTBOX_FLAGS.zoomed)).toBe(true);
    controller.goTo(2, true);
    // Rotating without thumbnails.
    q("[data-ok-lightbox-thumbnails]").remove();
    controller.rotateClockwise();
    expect(controller.rotation).toBe(90);
  });

  it("resets a zoom that is no longer possible", async () => {
    const { root, controller } = await setup();
    controller.open(0);
    controller.zoomIn();
    root.setAttribute("data-ok-max-zoom-pixel-ratio", "0.1");
    controller.zoomIn();
    expect(controller.zoom).toBe(1);
  });

  it("counts slides added later", async () => {
    const { root, q, slides } = await setup();
    const copy = slides[2]?.cloneNode(true) as HTMLElement;
    root.querySelector("[data-ok-carousel-container]")?.append(copy);
    await until(() => q("[data-ok-lightbox-counter-total]").textContent === "4");
  });
});

describe("pull to close", () => {
  it("closes when the slide is pulled far enough down", async () => {
    const { root, controller, frame, events } = await setup({
      attrs: "data-ok-close-on-pull-down",
    });
    controller.open(0);
    pointer(frame(0), "pointerdown", 200, 50);
    pointer(frame(0), "pointermove", 202, 55); // Too short to decide.
    pointer(frame(0), "pointermove", 205, 150);
    expect(root.hasAttribute(LIGHTBOX_FLAGS.pulling)).toBe(true);
    expect(root.style.getPropertyValue("--_ok-lightbox-pull")).toBe("100px");
    pointer(frame(0), "pointerup", 205, 150);
    expect(events.dismiss).toEqual(["pull"]);
    expect(root.hasAttribute(LIGHTBOX_FLAGS.pulling)).toBe(false);
    // A short pull, a sideways move, a cancel, or the wrong direction don't close.
    pointer(frame(0), "pointerdown", 200, 50);
    pointer(frame(0), "pointermove", 200, 80);
    pointer(frame(0), "pointerup", 200, 80);
    pointer(frame(0), "pointerdown", 200, 50);
    pointer(frame(0), "pointermove", 300, 60);
    pointer(frame(0), "pointerup", 300, 60);
    pointer(frame(0), "pointerdown", 200, 50);
    pointer(frame(0), "pointermove", 200, 200);
    pointer(frame(0), "pointercancel", 200, 200);
    pointer(frame(0), "pointerdown", 200, 150);
    pointer(frame(0), "pointermove", 200, 20);
    pointer(frame(0), "pointerup", 200, 20);
    expect(events.dismiss).toEqual(["pull"]);
  });

  it("closes when pulled up with closeOnPullUp", async () => {
    const { controller, frame, events } = await setup({ attrs: "data-ok-close-on-pull-up" });
    controller.open(0);
    pointer(frame(0), "pointerdown", 200, 200);
    pointer(frame(0), "pointermove", 200, 20);
    pointer(frame(0), "pointerup", 200, 20);
    expect(events.dismiss).toEqual(["pull"]);
  });
});

describe("clicks", () => {
  it("reports slide clicks and closes on clicks beside the image with closeOnBackdropClick", async () => {
    const { root, controller, frame, slides, events, q } = await setup();
    controller.open(0);
    frame(0).click();
    expect(events.click).toEqual([0]);
    expect(events.dismiss).toEqual([]);
    root.setAttribute("data-ok-close-on-backdrop-click", "");
    await flush();
    ((slides[0] as HTMLElement).querySelector("img") as HTMLElement).click();
    ((slides[0] as HTMLElement).querySelector("h2") as HTMLElement).click();
    expect(events.dismiss).toEqual([]);
    frame(0).click();
    expect(events.dismiss).toEqual(["backdrop"]);
    // A press captured by the viewport: the click lands there.
    pointer(frame(0), "pointerdown", 10, 10, { button: 1 });
    q("[data-ok-carousel-viewport]").click();
    expect(events.dismiss).toEqual(["backdrop", "backdrop"]);
    // Other slides, the toolbar and handled clicks don't count.
    frame(1).click();
    q("[data-ok-lightbox-toolbar]").click();
    const handled = new MouseEvent("click", { bubbles: true, cancelable: true });
    handled.preventDefault();
    frame(0).dispatchEvent(handled);
    // Disabled buttons do nothing.
    q("[data-ok-lightbox-zoom-out]").click();
    expect(events.click).toEqual([0, 0, 0, 0, 0]);
    expect(controller.zoom).toBe(1);
  });
});

describe("rotate", () => {
  it("rotates the current image and its thumbnail by quarter turns", async () => {
    const { root, controller, q, slides, events } = await setup({ attrs: "data-ok-rotate" });
    controller.open(0);
    controller.zoomIn();
    q("[data-ok-lightbox-rotate-cw]").click();
    expect(slides[0]?.getAttribute("data-ok-rotation")).toBe("90");
    expect(root.querySelector("[data-ok-carousel-thumb]")?.getAttribute("data-ok-rotation")).toBe(
      "90",
    );
    expect(controller.rotation).toBe(90);
    expect(controller.zoom).toBe(1);
    // Quarter turns zoom against the swapped sides.
    expect(controller.maxZoom).toBe(4);
    controller.changeZoom(2);
    expect(controller.offsetX).toBe(0);
    q("[data-ok-lightbox-rotate-ccw]").click();
    expect(slides[0]?.hasAttribute("data-ok-rotation")).toBe(false);
    controller.rotateCounterClockwise();
    controller.rotateClockwise();
    expect(events.rotate).toEqual([
      [0, 90],
      [0, 0],
      [0, 270],
      [0, 0],
    ]);
    root.removeAttribute("data-ok-rotate");
    controller.rotateClockwise();
    expect(events.rotate).toHaveLength(4);
  });
});

describe("fullscreen", () => {
  it("enters and leaves fullscreen and follows the document", async () => {
    let element: Element | null = null;
    vi.spyOn(document, "fullscreenEnabled", "get").mockReturnValue(true);
    vi.spyOn(document, "fullscreenElement", "get").mockImplementation(() => element);
    const { root, controller, q, events } = await setup();
    const request = vi.spyOn(root, "requestFullscreen").mockImplementation(async () => {
      element = root;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    const exit = vi.spyOn(document, "exitFullscreen").mockImplementation(async () => {
      element = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    controller.open(0);
    expect(controller.fullscreenDisabled).toBe(false);
    q("[data-ok-lightbox-fullscreen]").click();
    await until(() => controller.fullscreen);
    expect(root.hasAttribute(LIGHTBOX_FLAGS.fullscreen)).toBe(true);
    await controller.enterFullscreen(); // Already.
    expect(request).toHaveBeenCalledTimes(1);
    q("[data-ok-lightbox-fullscreen]").click();
    await until(() => !controller.fullscreen);
    await controller.exitFullscreen(); // Already left.
    document.dispatchEvent(new Event("fullscreenchange")); // No change.
    expect(events.fullscreen).toEqual([true, false]);
    // Closing leaves fullscreen.
    await controller.enterFullscreen();
    controller.close();
    await until(() => !controller.fullscreen);
    expect(exit).toHaveBeenCalledTimes(2);
  });

  it("enters fullscreen on open with fullscreenAuto, and announces failures", async () => {
    vi.spyOn(document, "fullscreenEnabled", "get").mockReturnValue(true);
    const { root, controller, live } = await setup({ attrs: "data-ok-fullscreen-auto" });
    const request = vi
      .spyOn(root, "requestFullscreen")
      .mockRejectedValue(new TypeError("Permissions check failed"));
    vi.spyOn(document, "exitFullscreen").mockRejectedValue(new TypeError("Not in fullscreen"));
    controller.open(0);
    expect(request).toHaveBeenCalled();
    await until(() => live.textContent === "Fullscreen is not available.");
    root.setAttribute("data-ok-disable-fullscreen", "");
    await controller.enterFullscreen();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("hides the button where fullscreen isn't available", async () => {
    vi.spyOn(document, "fullscreenEnabled", "get").mockReturnValue(false);
    const { controller, q } = await setup();
    expect(q("[data-ok-lightbox-fullscreen]").hidden).toBe(true);
    expect(controller.fullscreenDisabled).toBe(true);
    await controller.enterFullscreen();
    expect(controller.fullscreen).toBe(false);
  });
});

describe("download", () => {
  it("saves the current image under its file name, or a custom URL and name", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { controller, q, root } = await setup({
      attrs: "data-ok-download",
      slideAttrs: (i) =>
        i === 1
          ? 'data-ok-download="/files/photo.png" data-ok-download-filename="My photo.png"'
          : "",
    });
    const links: HTMLAnchorElement[] = [];
    click.mockImplementation(function (this: HTMLAnchorElement) {
      links.push(this);
    });
    controller.open(1);
    q("[data-ok-lightbox-download]").click();
    await until(() => links.length === 1);
    expect(links[0]?.href).toBe(new URL("/files/photo.png", document.baseURI).href);
    expect(links[0]?.download).toBe("My photo.png");
    expect(links[0]?.isConnected).toBe(false);
    controller.goTo(0, true);
    await controller.download();
    expect(links[1]?.href.startsWith("data:image/svg+xml")).toBe(true);
    expect(links[1]?.download).toBe("download");
    root.removeAttribute("data-ok-download");
    await controller.download();
    expect(links).toHaveLength(2);
  });

  it("fetches files from other origins, and announces failures", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(new Blob(["x"]), { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 404 }));
    const { controller, live } = await setup({
      attrs: "data-ok-download",
      slideAttrs: () => 'data-ok-download="https://cdn.example.com/photo.jpg"',
    });
    controller.open(0);
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    await controller.download();
    expect(fetch).toHaveBeenCalledWith("https://cdn.example.com/photo.jpg", { mode: "cors" });
    expect(live.textContent).toBe("");
    await until(() => revoke.mock.calls.length === 1);
    await controller.download();
    expect(live.textContent).toBe("The file could not be downloaded.");
  });

  it("refuses unsafe URLs, honors data-ok-download=false and custom downloads", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const custom = vi.fn(() => false as const);
    const { controller, q, live } = await setup(
      {
        attrs: 'data-ok-download data-ok-labels="x"',
        kinds: ["image", "image", "custom"],
        slideAttrs: (i) =>
          i === 0
            ? 'data-ok-download="javascript:alert(1)"'
            : i === 1
              ? 'data-ok-download="false"'
              : "",
      },
      { labels: { "Download failed": "Échec" } },
    );
    controller.open(0);
    await controller.download();
    expect(live.textContent).toBe("Échec");
    controller.goTo(1, true);
    expect(q("[data-ok-lightbox-download]").getAttribute("aria-disabled")).toBe("true");
    await controller.download();
    controller.goTo(2, true);
    await controller.download(); // A custom slide has no source.
    expect(click).not.toHaveBeenCalled();
    controller.destroy();
    const again = await setup({ attrs: "data-ok-download" }, { onDownload: custom });
    again.controller.open(0);
    await again.controller.download();
    expect(custom).toHaveBeenCalledWith(0, again.slides[0]);
    expect(click).not.toHaveBeenCalled();
  });
});

describe("download videos", () => {
  it("saves a video's first source", async () => {
    const links: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      links.push(this.download);
    });
    const { controller, slides } = await setup({
      kinds: ["video", "video"],
      attrs: "data-ok-download",
    });
    controller.open(0);
    await controller.download();
    const video = slides[1]?.querySelector("video") as HTMLVideoElement;
    video.replaceChildren();
    video.setAttribute("src", "movie.webm");
    controller.goTo(1, true);
    await controller.download();
    expect(links).toEqual(["clip.webm", "movie.webm"]);
  });
});

describe("share", () => {
  it("shares the slide through navigator.share and handles refusals", async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    cleanups.push(() => {
      Reflect.deleteProperty(navigator, "share");
    });
    const { controller, q, live } = await setup({
      attrs: "data-ok-share",
      slideAttrs: (i) =>
        i === 1
          ? 'data-ok-share-url="https://example.com/p/2" data-ok-share-title="Two" data-ok-share-text="Look"'
          : i === 2
            ? 'data-ok-share="false"'
            : "",
    });
    expect(q("[data-ok-lightbox-share]").hidden).toBe(false);
    controller.open(1);
    q("[data-ok-lightbox-share]").click();
    await until(() => share.mock.calls.length === 1);
    expect(share).toHaveBeenCalledWith({
      url: "https://example.com/p/2",
      title: "Two",
      text: "Look",
    });
    share.mockRejectedValueOnce(new DOMException("Canceled", "AbortError"));
    await controller.share();
    expect(live.textContent).toBe("");
    share.mockRejectedValueOnce(new Error("Denied"));
    await controller.share();
    expect(live.textContent).toBe("The slide could not be shared.");
    controller.goTo(0, true);
    await controller.share();
    expect(share.mock.calls.at(-1)?.[0].url?.startsWith("data:image/svg+xml")).toBe(true);
    controller.goTo(2, true);
    await controller.share();
    expect(share).toHaveBeenCalledTimes(4);
  });

  it("hides the button without the Web Share API, and lets owners share", async () => {
    const custom = vi.fn(() => false as const);
    const { controller, q, root } = await setup({ attrs: "data-ok-share" }, { onShare: custom });
    expect(q("[data-ok-lightbox-share]").hidden).toBe(true);
    controller.open(0);
    await controller.share();
    expect(custom).toHaveBeenCalledWith(0, root.querySelector("[data-ok-carousel-slide]"));
    const plain = await setup({ attrs: "data-ok-share" });
    plain.controller.open(0);
    await plain.controller.share(); // No API: nothing to do.
    plain.root.removeAttribute("data-ok-share");
    await plain.controller.share();
    expect(custom).toHaveBeenCalledTimes(1);
  });
});

describe("captions, thumbnails and slideshow", () => {
  it("toggles the captions and the thumbnails", async () => {
    const { root, controller, q, events } = await setup({ attrs: "data-ok-captions-hidden" });
    expect(controller.captionsVisible).toBe(false);
    q("[data-ok-lightbox-captions]").click();
    expect(root.hasAttribute("data-ok-captions-hidden")).toBe(false);
    controller.hideCaptions();
    controller.hideCaptions();
    controller.showCaptions();
    expect(events.captions).toEqual([true, false, true]);
    q("[data-ok-lightbox-thumbnails-toggle]").click();
    expect(controller.thumbnailsVisible).toBe(false);
    controller.showThumbnails();
    controller.hideThumbnails();
    expect(events.thumbnails).toEqual([false, true, false]);
  });

  it("plays the slideshow and starts it on open with slideshowAutoplay", async () => {
    const { root, controller, carousel } = await setup({
      attrs: 'data-ok-slideshow-autoplay data-ok-slideshow-delay="50"',
    });
    expect(root.querySelector("[data-ok-carousel]")?.getAttribute("data-ok-autoplay-delay")).toBe(
      "50",
    );
    controller.open(0);
    expect(controller.playing).toBe(true);
    await until(() => controller.index === 1);
    controller.pause();
    expect(carousel.autoplay.isPlaying()).toBe(false);
    controller.play();
    expect(controller.playing).toBe(true);
    root.setAttribute("data-ok-disable-slideshow", "");
    await flush();
    expect(controller.playing).toBe(false);
    controller.play();
    expect(controller.playing).toBe(false);
    root.removeAttribute("data-ok-disable-slideshow");
    controller.play();
    controller.close();
    expect(controller.playing).toBe(false);
  });

  it("never starts the slideshow on its own with reduced motion", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: query.includes("reduce"),
          addEventListener() {},
          removeEventListener() {},
        }) as never,
    );
    const { controller } = await setup({ attrs: "data-ok-slideshow-autoplay" });
    controller.open(0);
    expect(controller.playing).toBe(false);
  });
});

describe("options and videos", () => {
  it("writes the carousel options and the thumbnails orientation from the root", async () => {
    const { root, section, q } = await setup();
    expect(section.hasAttribute("data-ok-loop")).toBe(true);
    expect(section.getAttribute("data-ok-duration")).toBe("0");
    root.setAttribute("data-ok-finite", "");
    root.setAttribute("data-ok-disable-swipe-navigation", "");
    root.setAttribute("data-ok-thumbnails-position", "start");
    await flush();
    expect(section.hasAttribute("data-ok-loop")).toBe(false);
    expect(section.hasAttribute("data-ok-stop-on-last-snap")).toBe(true);
    expect(section.getAttribute("data-ok-draggable")).toBe("false");
    expect(q("[data-ok-lightbox-thumbnails]").getAttribute("data-ok-orientation")).toBe("vertical");
    root.setAttribute("data-ok-thumbnails-position", "top");
    await flush();
    expect(q("[data-ok-lightbox-thumbnails]").getAttribute("data-ok-orientation")).toBe(
      "horizontal",
    );
  });

  it("plays videos that autoplay when current and pauses the others", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const { controller, slides } = await setup({ kinds: ["image", "video", "video"] });
    const second = slides[1]?.querySelector("video") as HTMLVideoElement;
    const third = slides[2]?.querySelector("video") as HTMLVideoElement;
    controller.open(1);
    expect(play).toHaveBeenCalledTimes(1);
    vi.spyOn(second, "paused", "get").mockReturnValue(false);
    const pause = vi.spyOn(second, "pause").mockImplementation(() => {});
    controller.goTo(2, true);
    expect(pause).toHaveBeenCalled();
    expect(play).toHaveBeenCalledTimes(1);
    expect(third.paused).toBe(true);
    play.mockRejectedValueOnce(new DOMException("Refused", "NotAllowedError"));
    controller.goTo(1, true);
    await flush();
  });

  it("cleans up on destroy", async () => {
    const { root, controller } = await setup();
    controller.open(0);
    controller.changeZoom(2);
    controller.destroy();
    controller.destroy();
    expect(root.hasAttribute(LIGHTBOX_FLAGS.ready)).toBe(false);
    expect(root.hasAttribute(LIGHTBOX_FLAGS.zoomed)).toBe(false);
    expect((root as HTMLDialogElement).open).toBe(false);
  });

  it("works without a carousel", async () => {
    const host = mount('<dialog data-ok-lightbox aria-label="Empty"></dialog>');
    const root = host.querySelector<HTMLElement>("dialog") as HTMLElement;
    const controller = createLightboxController(root, { carousel: () => null });
    cleanups.push(() => controller.destroy());
    controller.open(3);
    controller.next();
    controller.prev();
    controller.zoomIn();
    controller.play();
    await controller.download();
    expect(controller.index).toBe(0);
    expect(controller.playing).toBe(false);
    controller.close();
  });
});
