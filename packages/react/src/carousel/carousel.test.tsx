import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  Carousel,
  type CarouselApi,
  CarouselArrows,
  CarouselDots,
  CarouselPlayButton,
  CarouselProgress,
  type CarouselProps,
  CarouselSlide,
  CarouselStage,
  CarouselThumb,
  CarouselThumbs,
  CarouselViewport,
} from "./carousel.js";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const root = () => document.querySelector("[data-ok-carousel]") as HTMLElement;
const viewport = () => document.querySelector("[data-ok-carousel-viewport]") as HTMLElement;
const slides = () => [...document.querySelectorAll<HTMLElement>("[data-ok-carousel-slide]")];
const snapped = () =>
  slides()
    .filter((slide) => slide.hasAttribute("data-ok-snapped"))
    .map((slide) => slide.getAttribute("aria-label"));
const dots = () => [...document.querySelectorAll<HTMLElement>("[data-ok-carousel-dot]")];

let parking: HTMLElement;
beforeEach(async () => {
  // Keep the pointer away from the carousels (hovering pauses autoplay).
  parking = document.createElement("div");
  parking.style.cssText = "position:fixed;right:0;bottom:0;width:8px;height:8px";
  document.body.append(parking);
  await userEvent.hover(parking);
});
afterEach(() => parking.remove());

function Demo({ count = 4, ...props }: Partial<CarouselProps> & { count?: number }) {
  return (
    <div style={{ width: 400 }}>
      <Carousel aria-label="Demo" align="start" duration={0} slidesToShow={2} {...props}>
        <CarouselStage>
          <CarouselViewport>
            {Array.from({ length: count }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static test slides.
              <CarouselSlide key={i}>
                <div style={{ height: 60 }}>Slide {i + 1}</div>
              </CarouselSlide>
            ))}
          </CarouselViewport>
          <CarouselArrows variant="number" placement="bottom-end" />
        </CarouselStage>
        <CarouselArrows color="primary" />
        <CarouselDots />
        <CarouselDots variant="number" color="warning" getLabel={(i) => `Slide ${i + 1}`} />
        <CarouselProgress />
        <CarouselProgress variant="autoplay" color="info" placement="top-end" />
        <CarouselThumbs orientation="vertical">
          {Array.from({ length: count }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static test thumbnails.
            <CarouselThumb key={i}>{i + 1}</CarouselThumb>
          ))}
        </CarouselThumbs>
        <CarouselPlayButton />
      </Carousel>
    </div>
  );
}

describe("Carousel", () => {
  it("renders the anatomy and the initial state", async () => {
    render(<Demo />);
    const element = root();
    expect(element.tagName).toBe("SECTION");
    expect(element.getAttribute("aria-roledescription")).toBe("carousel");
    expect(element.getAttribute("data-ok-runtime")).toBe("off");
    expect(element.getAttribute("data-ok-slides-to-show")).toBe("2");
    expect(element.style.getPropertyValue("--_ok-carousel-basis-xs")).toContain("calc(");
    expect(screen.getByRole("region", { name: "Demo" })).toBe(element);
    expect(slides().map((s) => s.getAttribute("aria-label"))).toEqual([
      "1 of 4",
      "2 of 4",
      "3 of 4",
      "4 of 4",
    ]);
    expect(slides()[0]?.getAttribute("role")).toBe("group");
    expect(snapped()).toEqual(["1 of 4"]);
    expect(dots()).toHaveLength(6);
    expect(
      screen.getAllByRole("button", { name: "Previous slide" })[0]?.getAttribute("aria-disabled"),
    ).toBe("true");
    expect(document.querySelector("[data-ok-carousel-counter]")?.textContent).toBe("1/3");
    expect(screen.getByRole("button", { name: "Slide 2" }).textContent).toBe("2");
    expect(
      screen
        .getAllByRole("button", { name: "Go to slide 1" })[1]
        ?.hasAttribute("data-ok-carousel-thumb"),
    ).toBe(true);
    expect(document.querySelector("[data-ok-carousel-live]")?.getAttribute("aria-live")).toBe(
      "polite",
    );
    expect(element.hasAttribute("data-ok-ready")).toBe(true);
    await expectNoAxeViolations();
  });

  it("moves with the controls and reports changes", async () => {
    const onSelect = vi.fn();
    const onSettle = vi.fn();
    const onScroll = vi.fn();
    render(<Demo onSelect={onSelect} onSettle={onSettle} onScroll={onScroll} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Next slide" })[1] as HTMLElement);
    expect(onSelect).toHaveBeenLastCalledWith(1, 0);
    expect(onSettle).toHaveBeenLastCalledWith(1);
    expect(onScroll).toHaveBeenCalled();
    expect(snapped()).toEqual(["2 of 4"]);
    expect(document.querySelector("[data-ok-carousel-counter]")?.textContent).toBe("2/3");
    expect(dots()[1]?.getAttribute("aria-current")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Slide 3" }));
    expect(onSelect).toHaveBeenLastCalledWith(2, 1);
    expect(
      screen.getAllByRole("button", { name: "Next slide" })[0]?.getAttribute("aria-disabled"),
    ).toBe("true");
    expect(document.querySelector("[data-ok-carousel-live]")?.textContent).toBe("slide 3 of 4");
  });

  it("exposes the API through apiRef", () => {
    const apiRef = createRef<CarouselApi>();
    const onReInit = vi.fn();
    const { unmount } = render(<Demo apiRef={apiRef} onReInit={onReInit} />);
    const api = apiRef.current as CarouselApi;
    expect(api.scrollSnapList()).toEqual([0, 0.5, 1]);
    act(() => api.scrollTo(2, true));
    expect(api.selectedScrollSnap()).toBe(2);
    expect(api.canScrollNext()).toBe(false);
    expect(onReInit).toHaveBeenCalledWith(3);
    unmount();
    expect(apiRef.current).toBeNull();
  });

  it("keeps the current slide when a looping carousel resizes", async () => {
    const apiRef = createRef<CarouselApi>();
    render(<Demo apiRef={apiRef} count={5} loop slidesToShow={1} slideSpacing={24} />);
    const api = apiRef.current as CarouselApi;
    const host = root().parentElement as HTMLElement;
    expect(root().hasAttribute("data-ok-looping")).toBe(true);
    act(() => api.scrollTo(2, true));
    for (const width of [300, 520, 400]) {
      const view = viewport();
      host.style.width = `${width}px`;
      // The browser re-snaps to the slide; its scroll event may come before the ResizeObserver.
      view.scrollLeft +=
        (slides()[2] as HTMLElement).getBoundingClientRect().left -
        view.getBoundingClientRect().left;
      view.dispatchEvent(new Event("scroll"));
      for (let i = 0; i < 4; i++) await nextFrame();
      expect(api.selectedScrollSnap()).toBe(2);
      expect(snapped()).toEqual(["3 of 5"]);
      const offset =
        (slides()[2] as HTMLElement).getBoundingClientRect().left -
        view.getBoundingClientRect().left;
      expect(Math.abs(offset)).toBeLessThan(2);
    }
  });

  it("re-renders the dots when the number of snaps changes", async () => {
    const { rerender } = render(<Demo />);
    expect(dots()).toHaveLength(6);
    rerender(<Demo count={6} />);
    for (let i = 0; i < 120 && dots().length !== 10; i++) await nextFrame();
    expect(dots()).toHaveLength(10);
    expect(document.querySelector("[data-ok-carousel-counter]")?.textContent).toBe("1/5");
  });

  it("writes every option as attributes", () => {
    render(
      <Carousel
        aria-label="Options"
        align={0.1}
        axis="y"
        containScroll={false}
        effect="fade"
        loop
        dragFree
        skipSnaps
        autoHeight
        heightEvent="slidesInView"
        wheelGestures
        forceWheelAxis="y"
        draggable={false}
        focus={false}
        active={false}
        startIndex={1}
        slidesToScroll="auto"
        slidesToShow={{ xs: "70%", md: 3 }}
        slideSpacing="1rem"
        duration={30}
        dragThreshold={5}
        inViewThreshold={0.5}
        autoplay
        autoplayDelay={3000}
        autoplayJump
        autoScroll
        autoScrollSpeed={3}
        autoScrollStartDelay={0}
        autoScrollDirection="backward"
        playOnInit={false}
        stopOnInteraction={false}
        stopOnMouseEnter={false}
        stopOnFocusIn={false}
        stopOnLastSnap
        breakpoints={{ "(min-width: 900px)": { loop: false } }}
        style={{ color: "red" }}
      >
        <CarouselViewport containerProps={{ className: "row" }}>
          <CarouselSlide aria-label="First">A</CarouselSlide>
          <CarouselSlide>B</CarouselSlide>
        </CarouselViewport>
      </Carousel>,
    );
    const element = root();
    expect(element.getAttribute("data-ok-align")).toBe("0.1");
    expect(element.getAttribute("data-ok-contain-scroll")).toBe("false");
    expect(element.getAttribute("data-ok-slides-to-scroll")).toBe("auto");
    expect(element.getAttribute("data-ok-slides-to-show")).toBe("70%");
    expect(element.getAttribute("data-ok-slides-to-show-md")).toBe("3");
    expect(element.getAttribute("data-ok-draggable")).toBe("false");
    expect(element.getAttribute("data-ok-play-on-init")).toBe("false");
    expect(element.getAttribute("data-ok-start-index")).toBe("1");
    expect(element.getAttribute("data-ok-breakpoints")).toBe(
      '{"(min-width: 900px)":{"loop":false}}',
    );
    expect(element.style.color).toBe("red");
    expect(element.style.getPropertyValue("--_ok-carousel-spacing")).toBe("1rem");
    expect(document.querySelector(".row")?.hasAttribute("data-ok-carousel-container")).toBe(true);
    expect(slides()[0]?.getAttribute("aria-label")).toBe("First");
    expect(snapped()).toEqual(["2 of 2"]);
  });

  it("measures again when a function align changes", () => {
    const first = vi.fn((view: number, size: number) => (view - size) / 2);
    const second = vi.fn(() => 0);
    const { rerender } = render(<Demo align={first} />);
    expect(first).toHaveBeenCalled();
    rerender(<Demo align={first} />);
    rerender(<Demo align={second} />);
    expect(second).toHaveBeenCalled();
    expect(root().hasAttribute("data-ok-align")).toBe(true);
  });

  it("plays and pauses autoplay with the play button", async () => {
    const onAutoplayChange = vi.fn();
    render(<Demo autoplay playOnInit={false} onAutoplayChange={onAutoplayChange} />);
    const play = screen.getByRole("button", { name: "Play" });
    expect(play.hasAttribute("data-ok-button")).toBe(true);
    await userEvent.click(play);
    expect(onAutoplayChange).toHaveBeenLastCalledWith(true);
    expect(root().hasAttribute("data-ok-playing")).toBe(true);
    expect(screen.getByRole("button", { name: "Pause" })).toBe(play);
    await userEvent.click(play);
    expect(onAutoplayChange).toHaveBeenLastCalledWith(false);
    await expectNoAxeViolations();
  });

  it("reports auto scroll, slides in view and slide focus", async () => {
    const onAutoScrollChange = vi.fn();
    const onSlidesInView = vi.fn();
    const onSlideFocus = vi.fn();
    render(
      <div style={{ width: 400 }}>
        <Carousel
          aria-label="Focus"
          autoScroll
          autoScrollStartDelay={5000}
          onAutoScrollChange={onAutoScrollChange}
          onSlidesInView={onSlidesInView}
          onSlideFocus={onSlideFocus}
        >
          <CarouselViewport>
            <CarouselSlide>
              <button type="button">One</button>
            </CarouselSlide>
            <CarouselSlide>
              <button type="button">Two</button>
            </CarouselSlide>
          </CarouselViewport>
        </Carousel>
      </div>,
    );
    expect(onAutoScrollChange).toHaveBeenCalledWith(true);
    await vi.waitFor(() => expect(onSlidesInView).toHaveBeenCalled());
    viewport().focus();
    await userEvent.tab();
    expect(onSlideFocus).toHaveBeenCalledWith(0);
    expect(onAutoScrollChange).toHaveBeenLastCalledWith(false);
  });

  it("works with custom labels and icons", () => {
    render(
      <Carousel aria-label="Labels" loop>
        <CarouselViewport>
          <CarouselSlide>A</CarouselSlide>
        </CarouselViewport>
        <CarouselArrows
          variant="floating"
          prevLabel="Back"
          nextLabel="Forward"
          prevIcon={<svg aria-hidden="true" data-testid="prev" />}
          nextIcon={<svg aria-hidden="true" data-testid="next" />}
        />
        <CarouselThumbs>
          <CarouselThumb aria-label="First picture">1</CarouselThumb>
        </CarouselThumbs>
        <CarouselPlayButton playLabel="Start" pauseLabel="Stop" variant="soft" />
      </Carousel>,
    );
    expect(
      screen.getByRole("button", { name: "Back" }).querySelector("[data-testid='prev']"),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "Forward" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "First picture" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start" }).getAttribute("data-ok-variant")).toBe(
      "soft",
    );
  });

  it("renders parts outside a carousel", () => {
    render(
      <>
        <CarouselSlide>Lonely</CarouselSlide>
        <CarouselArrows />
        <CarouselDots />
        <CarouselThumb>1</CarouselThumb>
      </>,
    );
    expect(screen.getByRole("group", { name: "1 of 1" })).toBeTruthy();
    expect(dots()).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Go to slide 1" }).getAttribute("aria-current")).toBe(
      "true",
    );
  });

  it("forwards refs and survives StrictMode", () => {
    const ref = createRef<HTMLElement>();
    const stage = createRef<HTMLDivElement>();
    const view = createRef<HTMLDivElement>();
    const slide = createRef<HTMLDivElement>();
    const arrows = createRef<HTMLDivElement>();
    const dotsRef = createRef<HTMLDivElement>();
    const progress = createRef<HTMLSpanElement>();
    const thumbs = createRef<HTMLDivElement>();
    const thumb = createRef<HTMLButtonElement>();
    const play = createRef<HTMLButtonElement>();
    render(
      <StrictMode>
        <Carousel ref={ref} aria-label="Refs">
          <CarouselStage ref={stage}>
            <CarouselViewport ref={view}>
              <CarouselSlide ref={slide}>A</CarouselSlide>
              text is ignored
            </CarouselViewport>
          </CarouselStage>
          <CarouselArrows ref={arrows} />
          <CarouselDots ref={dotsRef} />
          <CarouselProgress ref={progress} />
          <CarouselThumbs ref={thumbs}>
            <CarouselThumb ref={thumb}>1</CarouselThumb>
          </CarouselThumbs>
          <CarouselPlayButton ref={play} />
        </Carousel>
      </StrictMode>,
    );
    for (const item of [ref, stage, view, slide, arrows, dotsRef, progress, thumbs, thumb, play])
      expect(item.current).toBeInstanceOf(HTMLElement);
    expect(root().hasAttribute("data-ok-ready")).toBe(true);
  });

  it("renders on the server", () => {
    const html = renderToString(<Demo loop />);
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain('data-ok-carousel-slide=""');
    expect(html).toContain("data-ok-loop");
    expect(renderToString(<Demo count={0} />)).toContain("data-ok-carousel-viewport");
  });

  it("ignores hostile values", () => {
    render(
      <Carousel
        aria-label="Hostile"
        align={'"><img src=x onerror=alert(1)>' as never}
        slidesToShow={"<b>" as never}
        slideSpacing={"1px; color: red" as never}
        breakpoints={{
          "(min-width: 1px)": { loop: "<script>" as never, __proto__: { x: 1 } } as never,
        }}
      >
        <CarouselViewport>
          <CarouselSlide>A</CarouselSlide>
        </CarouselViewport>
      </Carousel>,
    );
    expect(root().getAttribute("data-ok-align")).toBe("center");
    expect(root().hasAttribute("data-ok-slides-to-show")).toBe(false);
    expect(root().style.getPropertyValue("--_ok-carousel-spacing")).toBe("");
    expect(({} as Record<string, unknown>)["x"]).toBeUndefined();
    expect(document.querySelector("img")).toBeNull();
  });

  it("has the Embla v9 aliases and reports resizes and slide changes", async () => {
    const apiRef = createRef<CarouselApi>();
    const onResize = vi.fn();
    const onSlidesChanged = vi.fn();
    const { rerender } = render(
      <Demo apiRef={apiRef} onResize={onResize} onSlidesChanged={onSlidesChanged} />,
    );
    const api = apiRef.current as CarouselApi;
    act(() => api.goTo(2, true));
    expect(api.selectedSnap()).toBe(2);
    expect(api.snapIndex(-1)).toBe(1);
    expect(api.canGoToNext()).toBe(false);
    expect(api.canGoToPrev()).toBe(true);
    act(() => api.goToPrev(true));
    expect(api.previousSnap()).toBe(2);
    act(() => api.goToNext(true));
    expect(api.snapList()).toEqual([0, 0.5, 1]);
    rerender(
      <Demo apiRef={apiRef} count={5} onResize={onResize} onSlidesChanged={onSlidesChanged} />,
    );
    await new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (onSlidesChanged.mock.calls.length > 0) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      if (onSlidesChanged.mock.calls.length > 0) resolve();
    });
    expect(onSlidesChanged.mock.calls[0]?.[0]?.[0]?.type).toBe("childList");
    // The `onResize` prop is the carousel's, not React's media event.
    expect(root().getAttribute("onresize")).toBeNull();
  });
});
