import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  Lightbox,
  type LightboxApi,
  type LightboxProps,
  type LightboxSlide,
  LightboxTrigger,
} from "./lightbox.js";

const picture = (fill: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800"><rect width="1600" height="800" fill="${fill}"/></svg>`,
  )}`;

const SLIDES: LightboxSlide[] = [
  {
    src: picture("teal"),
    alt: "Teal",
    width: 1600,
    height: 800,
    title: "Teal",
    description: "One",
  },
  { src: picture("navy"), alt: "Navy", width: 1600, height: 800, title: "Navy" },
  {
    type: "video",
    poster: picture("plum"),
    width: 640,
    height: 360,
    sources: [{ src: "clip.webm", type: "video/webm" }],
    tracks: [{ src: "clip.vtt", srcLang: "en", label: "English" }],
  },
];

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
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
const dialog = () => document.querySelector("[data-ok-lightbox]") as HTMLDialogElement;
const part = (selector: string) => dialog().querySelector(selector) as HTMLElement;
const counter = () => part("[data-ok-lightbox-counter]").textContent;

function Gallery(props: Partial<LightboxProps>) {
  return (
    <Lightbox slides={SLIDES} animationSwipe={0} {...props}>
      {SLIDES.map((_, index) => (
        <LightboxTrigger key={String(index)} index={index}>
          Open {index + 1}
        </LightboxTrigger>
      ))}
    </Lightbox>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

/** A lightbox whose slide the page controls (a button jumps to the first). */
function Controlled() {
  const [index, setIndex] = useState(1);
  return (
    <>
      <button type="button" onClick={() => setIndex(0)}>
        First
      </button>
      <Lightbox slides={SLIDES} animationSwipe={0} open index={index} onIndexChange={setIndex} />
    </>
  );
}

describe("Lightbox", () => {
  it("renders the dialog, the carousel, the toolbar and the thumbnails", () => {
    render(<Gallery />);
    const root = dialog();
    expect(root.tagName).toBe("DIALOG");
    expect(root.getAttribute("aria-label")).toBe("Lightbox");
    expect(root.getAttribute("data-ok-theme")).toBe("dark");
    expect(root.getAttribute("data-ok-runtime")).toBe("off");
    expect(root.getAttribute("data-ok-image-fit")).toBe("contain");
    const carousel = part("[data-ok-lightbox-carousel]");
    expect(carousel.getAttribute("aria-label")).toBe("Photo gallery");
    expect(carousel.hasAttribute("data-ok-loop")).toBe(true);
    expect(carousel.getAttribute("data-ok-duration")).toBe("0");
    const slides = [...root.querySelectorAll("[data-ok-lightbox-slide]")];
    expect(slides.map((s) => s.getAttribute("aria-label"))).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
    expect(slides[0]?.querySelector("h2")?.textContent).toBe("Teal");
    expect(slides[0]?.querySelector("[data-ok-lightbox-description-text]")?.textContent).toBe(
      "One",
    );
    expect(slides[1]?.querySelector("[data-ok-lightbox-caption='description']")).toBeNull();
    const image = slides[0]?.querySelector("img") as HTMLImageElement;
    expect(image.getAttribute("loading")).toBe("lazy");
    expect(image.getAttribute("width")).toBe("1600");
    const video = slides[2]?.querySelector("video") as HTMLVideoElement;
    expect(video.controls).toBe(true);
    expect(video.hasAttribute("playsinline")).toBe(true);
    expect(video.hasAttribute("data-ok-autoplay")).toBe(false);
    expect(video.querySelector("source")?.getAttribute("type")).toBe("video/webm");
    expect(video.querySelector("track")?.getAttribute("kind")).toBe("captions");
    expect(counter()).toBe("1 / 3");
    const thumbs = [...root.querySelectorAll("[data-ok-carousel-thumb]")];
    expect(thumbs).toHaveLength(3);
    expect(thumbs[2]?.querySelector("[data-ok-lightbox-thumbnail-play]")).not.toBeNull();
    expect(part("[data-ok-lightbox-thumbnails]").getAttribute("aria-label")).toBe("Thumbnails");
    expect(part("[data-ok-lightbox-thumbnails]").getAttribute("data-ok-orientation")).toBe(
      "horizontal",
    );
    expect(root.querySelectorAll("[data-ok-lightbox-label]")).toHaveLength(8);
  });

  it("opens at the trigger's slide, moves, and returns focus on close", async () => {
    const onOpenChange = vi.fn();
    const onIndexChange = vi.fn();
    render(<Gallery onOpenChange={onOpenChange} onIndexChange={onIndexChange} />);
    const trigger = screen.getByRole("button", { name: "Open 2" });
    await userEvent.click(trigger);
    expect(dialog().open).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(counter()).toBe("2 / 3");
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    await userEvent.keyboard("{ArrowRight}");
    await until(() => counter() === "3 / 3");
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await until(() => counter() === "1 / 3");
    await expectNoAxeViolations(dialog());
    await userEvent.keyboard("{Escape}");
    expect(dialog().open).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "escape");
    expect(document.activeElement).toBe(trigger);
    // A trigger click while the lightbox is open moves it.
    await userEvent.click(screen.getByRole("button", { name: "Open 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "close");
  });

  it("is controlled with open and index, and may refuse to close", async () => {
    render(<Controlled />);
    expect(dialog().open).toBe(true);
    expect(counter()).toBe("2 / 3");
    await userEvent.keyboard("{Escape}");
    expect(dialog().open).toBe(true);
    await userEvent.keyboard("{ArrowLeft}");
    await until(() => counter() === "1 / 3");
    await userEvent.keyboard("{ArrowRight}");
    await until(() => counter() === "2 / 3");
    act(() => {
      (document.querySelector("button") as HTMLButtonElement).click();
    });
    await until(() => counter() === "1 / 3");
  });

  it("renders inline, always open, without a close button", async () => {
    render(<Lightbox slides={SLIDES} inline finite style={{ width: 400 }} />);
    const root = dialog();
    expect(root.tagName).toBe("DIV");
    expect(root.hasAttribute("aria-label")).toBe(false);
    expect(root.hasAttribute("data-ok-inline")).toBe(true);
    expect(part("[data-ok-lightbox-close]").offsetParent).toBeNull();
    expect(part("[data-ok-carousel-prev]").getAttribute("aria-disabled")).toBe("true");
    await expectNoAxeViolations(root);
  });

  it("writes options as attributes and sizes as private properties", () => {
    render(
      <Lightbox
        slides={SLIDES}
        imageFit="cover"
        finite
        disableZoom
        download
        share
        rotate
        rotateButtons="clockwise"
        thumbnailsPosition="end"
        thumbnailsWidth={96}
        thumbnailsVignette={false}
        closeOnEscape={false}
        padding="5%"
        spacing={24}
        descriptionMaxLines={2}
        animationFade={100}
        animationZoom={200}
        slideshowDelay={1000}
        disableSwipeNavigation
        style={{ color: "red" }}
      />,
    );
    const root = dialog();
    for (const [name, value] of Object.entries({
      "data-ok-image-fit": "cover",
      "data-ok-finite": "",
      "data-ok-disable-zoom": "",
      "data-ok-download": "",
      "data-ok-rotate-buttons": "clockwise",
      "data-ok-thumbnails-position": "end",
      "data-ok-thumbnails-width": "96",
      "data-ok-thumbnails-vignette": "false",
      "data-ok-close-on-escape": "false",
    }))
      expect(root.getAttribute(name)).toBe(value);
    expect(root.style.getPropertyValue("--_ok-lightbox-padding")).toBe("5%");
    expect(root.style.getPropertyValue("--_ok-lightbox-spacing")).toBe("24px");
    expect(root.style.getPropertyValue("--_ok-lightbox-thumb-width")).toBe("96px");
    expect(root.style.getPropertyValue("--_ok-lightbox-lines")).toBe("2");
    expect(root.style.color).toBe("red");
    const carousel = part("[data-ok-lightbox-carousel]");
    expect(carousel.hasAttribute("data-ok-loop")).toBe(false);
    expect(carousel.getAttribute("data-ok-draggable")).toBe("false");
    expect(carousel.getAttribute("data-ok-autoplay-delay")).toBe("1000");
    expect(part("[data-ok-lightbox-thumbnails]").getAttribute("data-ok-orientation")).toBe(
      "vertical",
    );
    expect(part("[data-ok-carousel-prev]").getAttribute("aria-disabled")).toBe("true");
  });

  it("renders custom slides, icons, controls, labels and video settings", () => {
    const slides: LightboxSlide[] = [
      {
        src: picture("teal"),
        srcSet: [{ src: picture("teal"), width: 800, height: 400 }],
        rotation: 90,
        imageFit: "cover",
        download: { url: "/a.png", filename: "A.png" },
        share: { url: "https://example.com/a", title: "A", text: "Look" },
        key: "a",
      },
      { src: picture("navy"), download: false, share: false },
      {
        src: picture("red"),
        download: "/c.png",
        share: "https://example.com/c",
        thumbnail: "t.png",
      },
      { type: "map", zoomable: true, title: "", description: "" },
      { type: "note" },
      {
        type: "video",
        sources: [{ src: "a.mp4", type: "video/mp4", media: "(min-width: 600px)" }],
        autoPlay: true,
        muted: true,
        loop: true,
        controls: false,
      },
    ];
    render(
      <Lightbox
        slides={slides}
        labels={{ Close: "Fermer", Slide: "Image {index}/{total}" }}
        counterSeparator=" of "
        video={{ preload: "none" }}
        imageProps={(slide) => ({ title: slide.alt ?? "none" })}
        toolbarButtons={<button type="button">Info</button>}
        render={{
          slide: ({ slide }) => (slide.type === "map" ? <span>Map</span> : null),
          slideHeader: ({ index }) => <span data-header="">{index}</span>,
          slideFooter: ({ index }) => <span data-footer="">{index}</span>,
          controls: () => <span data-controls="" />,
          thumbnail: ({ index }) => (index === 3 ? <span>T</span> : undefined),
          iconPrev: () => <i data-icon="prev" />,
          iconNext: () => <i data-icon="next" />,
          iconClose: () => <i data-icon="close" />,
          iconZoomIn: () => <i data-icon="zoom-in" />,
          iconZoomOut: () => <i data-icon="zoom-out" />,
          iconSlideshowPlay: () => <i data-icon="play" />,
          iconSlideshowPause: () => <i data-icon="pause" />,
          iconEnterFullscreen: () => <i data-icon="enter" />,
          iconExitFullscreen: () => <i data-icon="exit" />,
          iconDownload: () => <i data-icon="download" />,
          iconShare: () => <i data-icon="share" />,
          iconRotateClockwise: () => <i data-icon="cw" />,
          iconRotateCounterClockwise: () => <i data-icon="ccw" />,
          iconCaptions: () => <i data-icon="captions" />,
          iconThumbnails: () => <i data-icon="thumbnails" />,
        }}
      />,
    );
    const root = dialog();
    const slideEls = [...root.querySelectorAll<HTMLElement>("[data-ok-lightbox-slide]")];
    expect(slideEls[0]?.getAttribute("aria-label")).toBe("Image 1/6");
    expect(slideEls[0]?.getAttribute("data-ok-rotation")).toBe("90");
    expect(slideEls[0]?.getAttribute("data-ok-image-fit")).toBe("cover");
    expect(slideEls[0]?.getAttribute("data-ok-download")).toBe("/a.png");
    expect(slideEls[0]?.getAttribute("data-ok-download-filename")).toBe("A.png");
    expect(slideEls[0]?.getAttribute("data-ok-share-title")).toBe("A");
    expect(slideEls[0]?.querySelector("img")?.getAttribute("srcset")).toContain("800w");
    expect(slideEls[0]?.querySelector("img")?.getAttribute("sizes")).toBe("100vw");
    expect(slideEls[0]?.querySelector("img")?.getAttribute("title")).toBe("none");
    expect(slideEls[1]?.getAttribute("data-ok-download")).toBe("false");
    expect(slideEls[1]?.getAttribute("data-ok-share")).toBe("false");
    expect(slideEls[2]?.getAttribute("data-ok-download")).toBe("/c.png");
    expect(slideEls[2]?.getAttribute("data-ok-share-url")).toBe("https://example.com/c");
    expect(
      slideEls[3]?.querySelector("[data-ok-lightbox-media][data-ok-zoomable]")?.textContent,
    ).toBe("Map");
    expect(slideEls[3]?.querySelector("h2")).toBeNull();
    expect(slideEls[4]?.querySelector("[data-ok-lightbox-zoom]")?.childElementCount).toBe(0);
    const video = slideEls[5]?.querySelector("video") as HTMLVideoElement;
    expect(video.hasAttribute("data-ok-autoplay")).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.controls).toBe(false);
    expect(video.getAttribute("preload")).toBe("none");
    expect(video.querySelector("source")?.getAttribute("media")).toBe("(min-width: 600px)");
    expect(root.querySelectorAll("[data-header]")).toHaveLength(6);
    expect(root.querySelectorAll("[data-footer]")).toHaveLength(6);
    expect(root.querySelector("[data-controls]")).not.toBeNull();
    expect(root.querySelectorAll("[data-icon]")).toHaveLength(15);
    expect(part("[data-ok-lightbox-close]").getAttribute("aria-label")).toBe("Fermer");
    expect(counter()).toBe("1 of 6");
    expect(screen.getByText("Info", { selector: "button" })).toBeTruthy();
    const thumbs = [...root.querySelectorAll("[data-ok-carousel-thumb]")];
    expect(thumbs[0]?.getAttribute("data-ok-rotation")).toBe("90");
    expect(thumbs[2]?.querySelector("img")?.getAttribute("src")).toBe("t.png");
    expect(thumbs[3]?.textContent).toBe("T");
    expect(thumbs[4]?.childElementCount).toBe(0);
  });

  it("reports zoom, rotation, captions, thumbnails, slideshow and clicks", async () => {
    const calls: string[] = [];
    const record = (name: string) => (value?: unknown, second?: unknown) => {
      calls.push(second === undefined ? `${name}:${value}` : `${name}:${value}:${second}`);
    };
    render(
      <Gallery
        rotate
        captionsShowToggle
        thumbnailsShowToggle
        onZoomChange={record("zoom")}
        onRotate={record("rotate")}
        onCaptionsChange={record("captions")}
        onThumbnailsChange={record("thumbnails")}
        onSlideshowChange={record("slideshow")}
        onSlideClick={record("click")}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open 1" }));
    await Promise.all(
      [...dialog().querySelectorAll("img")].map((img) => img.decode().catch(() => null)),
    );
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    await userEvent.click(screen.getByRole("button", { name: "Rotate clockwise" }));
    await userEvent.click(screen.getByRole("button", { name: "Hide captions" }));
    await userEvent.click(screen.getByRole("button", { name: "Hide thumbnails" }));
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    (part("[data-ok-snapped] [data-ok-lightbox-zoom]") as HTMLElement).click();
    expect(calls).toEqual([
      "zoom:2",
      "zoom:1",
      "rotate:0:90",
      "captions:false",
      "thumbnails:false",
      "slideshow:true",
      "slideshow:false",
      "click:0",
    ]);
  });

  it("replaces download and share with custom functions", async () => {
    const customDownload = vi.fn();
    const customShare = vi.fn();
    const onDownload = vi.fn();
    const onShare = vi.fn();
    Object.defineProperty(navigator, "share", { value: vi.fn(), configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    try {
      const { rerender } = render(
        <Gallery
          download
          share
          customDownload={customDownload}
          customShare={customShare}
          onDownload={onDownload}
          onShare={onShare}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: "Open 2" }));
      await userEvent.click(screen.getByRole("button", { name: "Download" }));
      await userEvent.click(screen.getByRole("button", { name: "Share" }));
      expect(customDownload).toHaveBeenCalledWith(SLIDES[1], 1);
      expect(customShare).toHaveBeenCalledWith(SLIDES[1], 1);
      expect(onDownload).toHaveBeenCalledWith(1);
      expect(onShare).toHaveBeenCalledWith(1);
      expect(click).not.toHaveBeenCalled();
      rerender(<Gallery download share open />);
      await userEvent.click(screen.getByRole("button", { name: "Download" }));
      await until(() => click.mock.calls.length === 1);
      await userEvent.click(screen.getByRole("button", { name: "Share" }));
      expect(navigator.share).toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(navigator, "share");
    }
  });

  it("reports fullscreen changes", async () => {
    let element: Element | null = null;
    vi.spyOn(document, "fullscreenEnabled", "get").mockReturnValue(true);
    vi.spyOn(document, "fullscreenElement", "get").mockImplementation(() => element);
    vi.spyOn(HTMLElement.prototype, "requestFullscreen").mockImplementation(async function (
      this: HTMLElement,
    ) {
      element = this;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    const onFullscreenChange = vi.fn();
    render(<Gallery onFullscreenChange={onFullscreenChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Open 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Enter Fullscreen" }));
    await until(() => onFullscreenChange.mock.calls.length === 1);
    expect(onFullscreenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Exit Fullscreen" })).toBeTruthy();
  });

  it("exposes the API, with open and close through the state", async () => {
    const apiRef = createRef<LightboxApi | null>();
    const onOpenChange = vi.fn();
    const { unmount } = render(<Gallery apiRef={apiRef} onOpenChange={onOpenChange} />);
    const api = apiRef.current as LightboxApi;
    act(() => api.open(2));
    expect(dialog().open).toBe(true);
    expect(api.index).toBe(2);
    expect(api.isOpen).toBe(true);
    act(() => api.open());
    act(() => api.close());
    expect(dialog().open).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "close");
    unmount();
    expect(apiRef.current).toBeNull();
  });

  it("re-reads the slides when they change", async () => {
    const { rerender } = render(<Gallery defaultOpen defaultIndex={1} />);
    expect(counter()).toBe("2 / 3");
    rerender(
      <Gallery defaultOpen defaultIndex={1} slides={[...SLIDES, SLIDES[0] as LightboxSlide]} />,
    );
    await until(() => counter() === "2 / 4");
    await nextFrame();
  });

  it("covers partial settings, custom renders, the last finite slide and browser closes", async () => {
    const onOpenChange = vi.fn();
    render(
      <Lightbox
        slides={[
          { src: picture("teal"), download: { url: "/d.png" }, share: {} },
          { src: "replaced.png" },
          { type: "note" },
        ]}
        finite
        defaultIndex={2}
        onOpenChange={onOpenChange}
        toolbarButtons={<LightboxTrigger index={0}>Go to the first</LightboxTrigger>}
        render={{
          slide: ({ slide }) =>
            slide.type === "note" ? (
              <b>Note</b>
            ) : "src" in slide && slide.src === "replaced.png" ? (
              <b>Own</b>
            ) : null,
        }}
      />,
    );
    const slides = [...dialog().querySelectorAll<HTMLElement>("[data-ok-lightbox-slide]")];
    expect(slides[0]?.getAttribute("data-ok-download")).toBe("/d.png");
    expect(slides[0]?.hasAttribute("data-ok-download-filename")).toBe(false);
    expect(slides[0]?.hasAttribute("data-ok-share-url")).toBe(false);
    expect(slides[1]?.querySelector("[data-ok-lightbox-zoom] > b")?.textContent).toBe("Own");
    expect(
      slides[2]?.querySelector("[data-ok-lightbox-media]")?.hasAttribute("data-ok-zoomable"),
    ).toBe(false);
    expect(part("[data-ok-carousel-next]").getAttribute("aria-disabled")).toBe("true");
    act(() => {
      (screen.getByText("Go to the first") as HTMLButtonElement).click();
    });
    expect(dialog().open).toBe(true);
    await until(() => counter() === "1 / 3");
    act(() => dialog().close());
    await until(() =>
      onOpenChange.mock.calls.some(([open, reason]) => !open && reason === "close"),
    );
    expect(dialog().open).toBe(false);
  });

  it("needs a Lightbox around its triggers", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<LightboxTrigger>Open</LightboxTrigger>)).toThrow(/inside <Lightbox>/);
  });

  it("lets trigger handlers cancel opening", async () => {
    render(
      <Lightbox slides={SLIDES}>
        <LightboxTrigger onClick={(event) => event.preventDefault()}>Open</LightboxTrigger>
      </Lightbox>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(dialog().open).toBe(false);
  });

  it("renders on the server like on the client, and in StrictMode", () => {
    const html = renderToString(<Gallery />);
    expect(html).toContain("data-ok-lightbox");
    const { container } = render(
      <StrictMode>
        <Gallery />
      </StrictMode>,
    );
    expect(container.querySelectorAll("[data-ok-lightbox-slide]")).toHaveLength(3);
    expect(
      renderToString(<Lightbox slides={[]} inline />).includes("data-ok-lightbox-counter-total"),
    ).toBe(true);
  });
});
