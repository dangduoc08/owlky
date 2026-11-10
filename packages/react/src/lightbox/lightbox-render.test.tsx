// Render functions for the slide container, the buttons and the loading / error icons
// (roadmap 4.18.81).
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { IconButton } from "../icon-button/icon-button.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { Lightbox, type LightboxRender, type LightboxSlide, LightboxTrigger } from "./lightbox.js";

const picture = (fill: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800"><rect width="1600" height="800" fill="${fill}"/></svg>`,
  )}`;

const SLIDES: LightboxSlide[] = [
  { src: picture("teal"), alt: "Teal", width: 1600, height: 800, title: "Teal" },
  { src: "data:image/png;base64,broken", alt: "Broken", width: 1600, height: 800 },
  { type: "note", text: "A custom slide" },
];

const dialog = () => document.querySelector("[data-ok-lightbox]") as HTMLDialogElement;
const counter = () => dialog().querySelector("[data-ok-lightbox-counter]")?.textContent;
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

const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M4 12h16" />
  </svg>
);

const RENDER: LightboxRender = {
  slide: ({ slide }) => (slide.type === "note" ? <p>{String(slide["text"])}</p> : undefined),
  slideContainer: ({ index, children }) => (
    <div className="frame" data-index={index} style={{ display: "contents" }}>
      {children}
    </div>
  ),
  buttonPrev: (attributes) => (
    <IconButton {...attributes} data-custom="">
      <Arrow />
    </IconButton>
  ),
  buttonNext: (attributes) => (
    <IconButton {...attributes}>
      <Arrow />
    </IconButton>
  ),
  buttonClose: (attributes) => (
    <IconButton {...attributes} data-custom="">
      <Arrow />
    </IconButton>
  ),
  buttonZoom: ({ zoomIn, zoomOut }) => (
    <>
      <IconButton {...zoomIn}>+</IconButton>
      <IconButton {...zoomOut}>-</IconButton>
    </>
  ),
  buttonSlideshow: (attributes) => (
    <IconButton {...attributes} aria-label="Slideshow">
      ▶
    </IconButton>
  ),
  buttonFullscreen: () => null,
  buttonDownload: (attributes) => <IconButton {...attributes}>↓</IconButton>,
  buttonShare: () => null,
  buttonCaptions: (attributes) => (
    <IconButton {...attributes} aria-label="Captions">
      C
    </IconButton>
  ),
  buttonThumbnails: (attributes) => (
    <IconButton {...attributes} aria-label="Thumbnails">
      T
    </IconButton>
  ),
  iconLoading: () => <span className="spinner">Loading</span>,
  iconError: () => <span className="broken">Broken</span>,
};

describe("Lightbox render functions", () => {
  it("replaces the buttons; the replacements keep their behavior", async () => {
    const onOpenChange = vi.fn();
    render(
      <Lightbox slides={SLIDES} animationSwipe={0} render={RENDER} onOpenChange={onOpenChange}>
        <LightboxTrigger index={0}>Open</LightboxTrigger>
      </Lightbox>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const back = screen.getByRole("button", { name: "Previous" });
    expect(back.hasAttribute("data-custom")).toBe(true);
    expect(back.hasAttribute("data-ok-carousel-prev")).toBe(true);
    expect(dialog().querySelector("[data-ok-lightbox-fullscreen]")).toBeNull();
    expect(dialog().querySelector("[data-ok-lightbox-share]")).toBeNull();
    expect(screen.getByRole("button", { name: "Zoom in" }).textContent).toBe("+");
    // Download is off by default (hidden by CSS), but its replacement is rendered.
    expect(dialog().querySelector("[data-ok-lightbox-download]")?.textContent).toBe("↓");
    expect(screen.getByRole("button", { name: "Slideshow" }).dataset).toMatchObject({
      okCarouselPlay: "",
      okLightboxSlideshow: "",
    });
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await until(() => counter() === "2 / 3");
    await userEvent.click(back);
    await until(() => counter() === "1 / 3");
    await expectNoAxeViolations(dialog());
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "close");
  });

  it("wraps every slide and shows the loading and error icons from the image's status", async () => {
    render(<Lightbox slides={SLIDES} animationSwipe={0} render={RENDER} open />);
    const slides = [...dialog().querySelectorAll<HTMLElement>("[data-ok-lightbox-slide]")];
    expect(
      slides.map((slide) => slide.querySelector(":scope > .frame")?.getAttribute("data-index")),
    ).toEqual(["0", "1", "2"]);
    // Images get both parts in their zoom frame; the custom slide gets none.
    const parts = (slide: HTMLElement) =>
      [...slide.querySelectorAll("[data-ok-lightbox-zoom] > [aria-hidden]")].map(
        (part) => part.getAttributeNames().find((name) => name.startsWith("data-ok-")) ?? "",
      );
    expect(parts(slides[0] as HTMLElement)).toEqual([
      "data-ok-lightbox-loading",
      "data-ok-lightbox-error",
    ]);
    expect(parts(slides[2] as HTMLElement)).toEqual([]);
    await until(() => slides[1]?.getAttribute("data-ok-status") === "error");
    const error = slides[1]?.querySelector("[data-ok-lightbox-error]") as HTMLElement;
    expect(getComputedStyle(error).display).toBe("flex");
    expect(error.textContent).toBe("Broken");
    await until(() => slides[0]?.getAttribute("data-ok-status") === "complete");
    const loading = slides[0]?.querySelector("[data-ok-lightbox-loading]") as HTMLElement;
    expect(getComputedStyle(loading).display).toBe("none");
  });

  it("renders no status parts without the icon functions", () => {
    render(<Lightbox slides={SLIDES.slice(0, 1)} open />);
    expect(
      dialog().querySelector("[data-ok-lightbox-loading], [data-ok-lightbox-error]"),
    ).toBeNull();
    expect(dialog().querySelector("[data-ok-lightbox-close]")).not.toBeNull();
  });
});
