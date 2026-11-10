import {
  carouselArrowsOptions,
  carouselDotsOptions,
  carouselOptions,
  carouselProgressOptions,
  carouselThumbsOptions,
} from "@owlky/core";
import carouselApi from "@owlky/docs-content/api/carousel.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import {
  Carousel,
  CarouselArrows,
  CarouselDots,
  CarouselPlayButton,
  CarouselProgress,
  CarouselSlide,
  CarouselStage,
  CarouselThumb,
  CarouselThumbs,
  CarouselViewport,
} from "@owlky/react";
import alignExample from "../../../../../packages/html/src/components/carousel/examples/align-example.html?raw";
import autoplayExample from "../../../../../packages/html/src/components/carousel/examples/autoplay-example.html?raw";
import customExample from "../../../../../packages/html/src/components/carousel/examples/custom-example.html?raw";
import dragFreeExample from "../../../../../packages/html/src/components/carousel/examples/drag-free-example.html?raw";
import parallaxExample from "../../../../../packages/html/src/components/carousel/examples/parallax-example.html?raw";
import rtlExample from "../../../../../packages/html/src/components/carousel/examples/right-to-left-example.html?raw";
import slidesToScrollExample from "../../../../../packages/html/src/components/carousel/examples/slides-to-scroll-example.html?raw";
import thumbsExample from "../../../../../packages/html/src/components/carousel/examples/thumbs-x-example.html?raw";
import yAxisExample from "../../../../../packages/html/src/components/carousel/examples/y-axis-example.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { snippetElement } from "../../helpers/snippet-markup.js";
import { SLIDES } from "./carousel-examples.js";

const PICTURES = [0, 1, 2, 3, 4];

/** A picture slide for the previews. */
function Picture({ index }: { index: number }) {
  return (
    <CarouselSlide>
      <div className="sb-carousel-image">
        <img src={`carousel/slide-${index + 1}.svg`} alt={SLIDES[index]?.[0] ?? ""} />
      </div>
    </CarouselSlide>
  );
}

export const carouselSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A carousel shows a set of slides one view at a time. People swipe on touch screens, scroll with a trackpad, drag with a mouse, press the arrow keys, or use the controls: arrows, dots, thumbnails and a progress bar. The slides sit in a native scroll container that snaps to each slide, so the carousel scrolls and snaps even before JavaScript loads. The runtime adds the rest: animated moves, loops, effects, autoplay and the state of the controls.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<section data-ok-carousel aria-roledescription="carousel" aria-label="Featured photos"
  data-ok-loop data-ok-slides-to-show="70%" data-ok-slide-spacing="20">
  <div data-ok-carousel-viewport tabindex="0">
    <div data-ok-carousel-container>
      <div role="group" aria-roledescription="slide" aria-label="1 of 3" data-ok-carousel-slide data-ok-snapped><img src="photo-1.jpg" alt="Mountain lake"></div>
      <div role="group" aria-roledescription="slide" aria-label="2 of 3" data-ok-carousel-slide><img src="photo-2.jpg" alt="Forest in the fog"></div>
      <div role="group" aria-roledescription="slide" aria-label="3 of 3" data-ok-carousel-slide><img src="photo-3.jpg" alt="Desert road"></div>
    </div>
    <span data-ok-carousel-live aria-live="polite" aria-atomic="true"></span>
  </div>
  <div data-ok-carousel-dots data-ok-variant="circular">
    <button type="button" data-ok-carousel-dot aria-label="Go to slide 1" aria-current="true"></button>
    <button type="button" data-ok-carousel-dot aria-label="Go to slide 2"></button>
    <button type="button" data-ok-carousel-dot aria-label="Go to slide 3"></button>
  </div>
</section>`,
    react: `import { Carousel, CarouselDots, CarouselSlide, CarouselViewport } from "@owlky/react";

export function FeaturedPhotos({ photos }: { photos: { src: string; alt: string }[] }) {
  return (
    <Carousel aria-label="Featured photos" loop slidesToShow="70%" slideSpacing={20}>
      <CarouselViewport>
        {photos.map((photo) => (
          <CarouselSlide key={photo.src}>
            <img src={photo.src} alt={photo.alt} />
          </CarouselSlide>
        ))}
      </CarouselViewport>
      <CarouselDots />
    </Carousel>
  );
}`,
  },
  {
    id: "anatomy",
    title: "Build a carousel from its parts",
    body: "`Carousel` is a labelled `section` that holds every part. `CarouselViewport` is the scroll container and holds the `CarouselSlide`s. Add the controls you need anywhere inside the carousel: `CarouselArrows`, `CarouselDots`, `CarouselProgress`, `CarouselThumbs` with a `CarouselThumb` per slide, and `CarouselPlayButton`. You can use several sets at once, for example arrows on the slides and dots under them. To lay controls over the slides, wrap the viewport and those controls in a `CarouselStage` and give each control a `placement`, such as `bottom-end`.",
    html: `${snippetElement(thumbsExample, "data-ok-carousel ")}`,
    react: `import {
  Carousel,
  CarouselArrows,
  CarouselSlide,
  CarouselStage,
  CarouselThumb,
  CarouselThumbs,
  CarouselViewport,
} from "@owlky/react";

const photos = [
  { src: "photo-1.jpg", alt: "Mountain lake" },
  { src: "photo-2.jpg", alt: "Forest in the fog" },
  { src: "photo-3.jpg", alt: "Desert road" },
];

export function CarouselAnatomy() {
  return (
    <Carousel aria-label="Gallery">
      <CarouselStage>
        <CarouselViewport>
          {photos.map((photo) => (
            <CarouselSlide key={photo.src}>
              <img src={photo.src} alt={photo.alt} />
            </CarouselSlide>
          ))}
        </CarouselViewport>
        <CarouselArrows variant="number" placement="bottom-end" />
      </CarouselStage>
      <CarouselThumbs>
        {photos.map((photo) => (
          <CarouselThumb key={photo.src}>
            <img src={photo.src} alt="" />
          </CarouselThumb>
        ))}
      </CarouselThumbs>
    </Carousel>
  );
}`,
  },
  {
    id: "sizes",
    title: "Size and space the slides",
    body: 'By default each slide fills the view. Set `slidesToShow` to a number of slides (`3`, `1.5`), a share of the view (`"70%"`) or `auto` to keep each slide\'s own width. Pass one value per breakpoint for responsive carousels, such as `{ xs: 1, sm: 2, md: 3 }`: in HTML, write `data-ok-slides-to-show`, `data-ok-slides-to-show-sm` and so on. `slideSpacing` sets the gap between slides in pixels. `slidesToScroll` moves several slides per step, or as many as fit with `auto`.',
    html: `${snippetElement(slidesToScrollExample, "data-ok-carousel ")}`,
    react: `import { Carousel, CarouselSlide, CarouselViewport } from "@owlky/react";

const photos = [
  { src: "photo-1.jpg", alt: "Mountain lake" },
  { src: "photo-2.jpg", alt: "Forest in the fog" },
  { src: "photo-3.jpg", alt: "Desert road" },
];

export function CarouselSizes() {
  return (
    <Carousel
      aria-label="Articles"
      slidesToShow={{ xs: 1, sm: 2, md: 3 }}
      slideSpacing={20}
      slidesToScroll="auto"
    >
      <CarouselViewport>
        {photos.map((photo) => (
          <CarouselSlide key={photo.src}>
            <img src={photo.src} alt={photo.alt} />
          </CarouselSlide>
        ))}
      </CarouselViewport>
    </Carousel>
  );
}`,
  },
  {
    id: "align",
    title: "Align and contain the slides",
    body: "`align` places the selected slides at the `start`, `center` (the default) or `end` of the view, or at a fraction of it, such as `0.1`. `containScroll` decides what happens at both ends: `trimSnaps` (the default) stops at the first and last slide without empty space, `keepSnaps` keeps a stop for every slide, and `false` leaves space so that even the first and last slides can reach their alignment. `startIndex` selects a slide when the carousel loads.",
    html: `${snippetElement(alignExample, "data-ok-carousel ")}`,
    react: `import { Carousel, CarouselSlide, CarouselViewport } from "@owlky/react";

const photos = [
  { src: "photo-1.jpg", alt: "Mountain lake" },
  { src: "photo-2.jpg", alt: "Forest in the fog" },
  { src: "photo-3.jpg", alt: "Desert road" },
];

export function CarouselAlign() {
  return (
    <Carousel aria-label="Centered" align="center" containScroll={false} startIndex={1}>
      <CarouselViewport>
        {photos.map((photo) => (
          <CarouselSlide key={photo.src}>
            <img src={photo.src} alt={photo.alt} />
          </CarouselSlide>
        ))}
      </CarouselViewport>
    </Carousel>
  );
}`,
  },
  {
    id: "loop",
    title: "Loop, drag and scroll",
    body: "Set `loop` to make the first slide follow the last one. The carousel reorders the slides visually instead of copying them, so screen readers and the Tab key still meet each slide once, in order. Loops need content at least one view and two steps long; shorter carousels stop at their ends. `dragFree` lets slides glide with momentum instead of snapping, `skipSnaps` lets a strong swipe pass several slides, `draggable` turns dragging off, and `wheelGestures` moves one slide per mouse wheel or trackpad gesture.",
    html: `${snippetElement(dragFreeExample, "data-ok-carousel ")}`,
    react: `import { Carousel, CarouselSlide, CarouselViewport } from "@owlky/react";

const photos = [
  { src: "photo-1.jpg", alt: "Mountain lake" },
  { src: "photo-2.jpg", alt: "Forest in the fog" },
  { src: "photo-3.jpg", alt: "Desert road" },
];

export function CarouselLoop() {
  return (
    <Carousel aria-label="Products" loop dragFree wheelGestures>
      <CarouselViewport>
        {photos.map((photo) => (
          <CarouselSlide key={photo.src}>
            <img src={photo.src} alt={photo.alt} />
          </CarouselSlide>
        ))}
      </CarouselViewport>
    </Carousel>
  );
}`,
  },
  {
    id: "effects",
    title: "Add an effect",
    body: "`effect` changes how slides move. `fade` stacks the slides and cross-fades between them. `opacity` and `scale` dim or shrink the slides away from the selected one while you scroll. `parallax` moves a layer inside each slide more slowly than the slide: mark that layer with `data-ok-carousel-parallax`, inside a box that clips it. `autoHeight` makes the carousel as tall as the selected slide.",
    html: `${snippetElement(parallaxExample, "data-ok-carousel ")}`,
    react: `import { Carousel, CarouselSlide, CarouselViewport } from "@owlky/react";

export function CarouselEffects() {
  return (
    <Carousel aria-label="Parallax" loop effect="parallax" slidesToShow="70%">
      <CarouselViewport>
        <CarouselSlide>
          <div className="frame">
            <img data-ok-carousel-parallax="" src="photo-1.jpg" alt="Mountain lake" />
          </div>
        </CarouselSlide>
      </CarouselViewport>
    </Carousel>
  );
}`,
  },
  {
    id: "autoplay",
    title: "Play slides automatically",
    body: "`autoplay` moves to the next slide every `autoplayDelay` milliseconds, and `autoScroll` scrolls continuously at `autoScrollSpeed` pixels per frame. Both pause while the pointer is over the carousel, and stop when a swipe, a drag or keyboard focus reaches it, so people can read at their own pace. Always add a `CarouselPlayButton`: its label switches between **Play** and **Pause**. Neither starts on its own when the system asks for reduced motion. Set `playOnInit` to `false` to wait for the button.",
    html: `${snippetElement(autoplayExample, "data-ok-carousel ")}`,
    react: `import { Carousel, CarouselPlayButton, CarouselSlide, CarouselViewport } from "@owlky/react";

const photos = [
  { src: "photo-1.jpg", alt: "Mountain lake" },
  { src: "photo-2.jpg", alt: "Forest in the fog" },
  { src: "photo-3.jpg", alt: "Desert road" },
];

export function CarouselAutoplay() {
  return (
    <Carousel aria-label="News" loop autoplay autoplayDelay={5000}>
      <CarouselPlayButton />
      <CarouselViewport>
        {photos.map((photo) => (
          <CarouselSlide key={photo.src}>
            <img src={photo.src} alt={photo.alt} />
          </CarouselSlide>
        ))}
      </CarouselViewport>
    </Carousel>
  );
}`,
  },
  {
    id: "controls",
    title: "Style the controls",
    body: 'Arrows come in three variants: `basic` icon buttons, `floating` square buttons on both sides of the slides, and `number`, with a counter such as **2/8** between them. Dots are `circular`, `rounded` (the selected dot stretches) or `number`. Give any control a `color` from the palette, or `white` over pictures. `CarouselProgress` shows the scroll position, or the time until the next slide with `variant="autoplay"`. Thumbnails scroll to keep the selected one in view, in a row or a column (`orientation`).',
    html: `${snippetElement(customExample, "data-ok-carousel ")}`,
    react: `import { CarouselArrows, CarouselDots, CarouselProgress } from "@owlky/react";

export function CarouselControls() {
  return (
    <>
      <CarouselArrows variant="floating" color="primary" />
      <CarouselDots variant="number" color="warning" />
      <CarouselProgress variant="autoplay" color="info" />
    </>
  );
}`,
  },
  {
    id: "direction",
    title: "Scroll vertically or right to left",
    body: 'Set `axis` to `y` for a vertical carousel and give it a height, for example with a class. The arrows turn to point up and down, and the Up and Down arrow keys move it. Right to left needs nothing: put the carousel in an element with `dir="rtl"`, and swipes, arrow keys and arrows follow the reading direction.',
    html: `${snippetElement(yAxisExample, "data-ok-carousel ")}

${snippetElement(rtlExample, "data-ok-carousel ")}`,
    react: `import { Carousel, CarouselSlide, CarouselViewport } from "@owlky/react";

const photos = [
  { src: "photo-1.jpg", alt: "Mountain lake" },
  { src: "photo-2.jpg", alt: "Forest in the fog" },
  { src: "photo-3.jpg", alt: "Desert road" },
];

export function CarouselDirection() {
  return (
    <Carousel aria-label="Stories" axis="y" className="stories">
      <CarouselViewport>
        {photos.map((photo) => (
          <CarouselSlide key={photo.src}>
            <img src={photo.src} alt={photo.alt} />
          </CarouselSlide>
        ))}
      </CarouselViewport>
    </Carousel>
  );
}`,
  },
  {
    id: "api",
    title: "Control the carousel from code",
    body: `The carousel's methods follow Embla Carousel. Both the version 8 names (\`scrollNext()\`, \`scrollTo()\`, \`selectedScrollSnap()\`) and the version 9 names work, so code written for either version runs unchanged:

- **Move:** \`goToNext()\`, \`goToPrev()\` and \`goTo(index)\`. Pass \`true\` as the second argument to jump without animation. In a looping carousel, \`goTo(index, false, "forward")\` or \`"backward"\` picks the way round; without it, the carousel takes the shortest way.
- **Read:** \`canGoToNext()\`, \`canGoToPrev()\`, \`selectedSnap()\`, \`previousSnap()\` and \`snapList()\`. \`snapIndex(offset)\` returns the selected snap moved by \`offset\`, such as \`snapIndex(1)\` for the next one. It wraps around in a looping carousel.

Three events report changes around the slides. **Resize** fires when the viewport or a slide changes size, **slides changed** when slides are added or removed, and **pointer move** while a pressed pointer moves. Cancel one to skip what the carousel does next: it doesn't measure again after a cancelled resize or slide change, and it doesn't scroll for a cancelled pointer move. In React, pass \`onResize\` or \`onSlidesChanged\` and return \`false\` to cancel; use the native \`onPointerMove\` for pointer moves. In HTML, listen for \`ok:carousel:resize\`, \`ok:carousel:slideschanged\` or \`ok:carousel:pointermove\` and call \`preventDefault()\`.`,
    html: `${snippetElement(yAxisExample, "data-ok-carousel ").replace("data-ok-carousel ", 'id="stories" data-ok-carousel ')}
<button type="button" id="stories-next">Next story</button>
<p id="stories-status" role="status"></p>

<script type="module">
  const root = document.getElementById("stories");
  const status = document.getElementById("stories-status");
  document.getElementById("stories-next").addEventListener("click", () => {
    const carousel = window.Owlky.get(root, "carousel");
    carousel.goTo(carousel.snapIndex(1));
  });
  root.addEventListener("ok:carousel:resize", (event) => {
    status.textContent = \`\${event.detail.entries.length} parts changed size.\`;
  });
</script>`,
    react: `import { Carousel, type CarouselApi, CarouselSlide, CarouselViewport } from "@owlky/react";
import { useRef, useState } from "react";

const photos = [
  { src: "photo-1.jpg", alt: "Mountain lake" },
  { src: "photo-2.jpg", alt: "Forest in the fog" },
  { src: "photo-3.jpg", alt: "Desert road" },
];

export function CarouselControls() {
  const apiRef = useRef<CarouselApi>(null);
  const [status, setStatus] = useState("");
  const next = () => {
    const api = apiRef.current;
    if (api) api.goTo(api.snapIndex(1));
  };
  return (
    <>
      <Carousel
        aria-label="Stories"
        loop
        apiRef={apiRef}
        onResize={(entries) => setStatus(\`\${entries.length} parts changed size.\`)}
      >
        <CarouselViewport>
          {photos.map((photo) => (
            <CarouselSlide key={photo.src}>
              <img src={photo.src} alt={photo.alt} />
            </CarouselSlide>
          ))}
        </CarouselViewport>
      </Carousel>
      <button type="button" onClick={next}>
        Next story
      </button>
      <p role="status">{status}</p>
    </>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: 'Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren\'t listed fall back to the default. The first table lists the options of `Carousel`, the next ones those of the arrows, dots, progress bar and thumbnails. `breakpoints` changes behavior options per media query, such as `{ "(min-width: 900px)": { loop: true } }` (in HTML, the same JSON in `data-ok-breakpoints`).',
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set content and callbacks. They aren't options, because HTML writes them as markup or listens to events.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:carousel:select\`** fires on the root when the selected slide changes, with \`detail.index\` and \`detail.previous\`. **\`ok:carousel:settle\`** fires when scrolling stops.
- **Other events:** \`scroll\` (\`detail.progress\`), \`slidesinview\` (\`detail.indexes\`), \`reinit\` (\`detail.snapCount\`), \`autoplay\` and \`autoscroll\` (\`detail.playing\`), \`slidefocus\` (\`detail.index\`), \`pointerdown\` and \`pointerup\`. The cancelable \`pointermove\`, \`resize\` (\`detail.entries\`) and \`slideschanged\` (\`detail.records\`) skip what the carousel does next when you call \`preventDefault()\`.
- **Instance:** \`runtime.get(element, "carousel")\` returns \`scrollNext()\`, \`scrollPrev()\`, \`scrollTo(index)\` (pass \`true\` as the second argument to jump without animation), \`canScrollNext()\`, \`canScrollPrev()\`, \`selectedScrollSnap()\`, \`previousScrollSnap()\`, \`scrollSnapList()\`, \`scrollProgress()\`, \`slidesInView()\`, \`reInit()\`, and \`autoplay\` and \`autoScroll\` with \`play()\`, \`stop()\`, \`reset()\` and \`isPlaying()\`. The Embla version 9 names work too: \`goToNext()\`, \`goToPrev()\`, \`goTo(index, jump, direction)\`, \`canGoToNext()\`, \`canGoToPrev()\`, \`selectedSnap()\`, \`previousSnap()\`, \`snapList()\` and \`snapIndex(offset)\`.
- **React:** \`apiRef\` receives the same methods. Callbacks are \`onSelect(index, previous)\`, \`onSettle(index)\`, \`onScroll(progress)\`, \`onSlidesInView(indexes)\`, \`onReInit(snapCount)\`, \`onAutoplayChange(playing)\`, \`onAutoScrollChange(playing)\`, \`onSlideFocus(index)\`, \`onResize(entries)\` and \`onSlidesChanged(records)\` (return \`false\` to skip the measure that follows).`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The viewport is in the tab order and answers the arrow keys, Home and End. Arrows, dots and thumbnails are buttons. Pressing Tab into a slide's content scrolls to that slide.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Name every carousel with \`aria-label\` or \`aria-labelledby\`. Slides are named "1 of 5" by default: pass \`aria-label\` on a slide to describe it instead.
- A polite live region announces the slide people move to. It stays quiet while the carousel plays on its own.
- Arrows stay focusable at the ends and say they're unavailable (\`aria-disabled\`), so focus never jumps to the page.
- Autoplay and auto scroll pause on hover, stop on focus and interaction, never start with reduced motion, and come with a play and pause button.
- Faded-out slides are hidden from everyone, and loops never duplicate slides.
- Dots and thumbnails are at least 24 by 24 pixels.`,
  },
  apiReferenceSection(carouselApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Carousel
        className="sb-carousel"
        aria-label="Featured photos"
        loop
        slidesToShow="70%"
        slideSpacing={20}
      >
        <CarouselViewport>
          {PICTURES.map((i) => (
            <Picture key={i} index={i} />
          ))}
        </CarouselViewport>
        <div className="sb-carousel-controls sb-carousel-center">
          <CarouselDots />
        </div>
      </Carousel>
    </Preview>
  ),
  anatomy: () => (
    <Preview>
      <Carousel className="sb-carousel" aria-label="Gallery">
        <CarouselStage>
          <CarouselViewport className="sb-carousel-rounded">
            {PICTURES.map((i) => (
              <Picture key={i} index={i} />
            ))}
          </CarouselViewport>
          <CarouselArrows variant="number" placement="bottom-end" />
        </CarouselStage>
        <CarouselThumbs className="sb-carousel-thumbs">
          {PICTURES.map((i) => (
            <CarouselThumb key={i}>
              <img src={`carousel/slide-${i + 1}.svg`} alt="" />
            </CarouselThumb>
          ))}
        </CarouselThumbs>
      </Carousel>
    </Preview>
  ),
  autoplay: () => (
    <Preview>
      <Carousel className="sb-carousel" aria-label="News" loop autoplay playOnInit={false}>
        <div className="sb-carousel-toolbar">
          <CarouselPlayButton />
        </div>
        <CarouselStage>
          <CarouselViewport className="sb-carousel-rounded">
            {PICTURES.map((i) => (
              <Picture key={i} index={i} />
            ))}
          </CarouselViewport>
          <CarouselProgress variant="autoplay" color="info" placement="top-end" />
        </CarouselStage>
      </Carousel>
    </Preview>
  ),
  controls: () => (
    <Preview className="flex-col">
      <Carousel className="sb-carousel" aria-label="Controls" slidesToShow={2} slideSpacing={16}>
        <CarouselViewport>
          {PICTURES.map((i) => (
            <Picture key={i} index={i} />
          ))}
        </CarouselViewport>
        <div className="sb-carousel-panel">
          <CarouselArrows color="secondary" />
          <CarouselArrows variant="number" color="info" />
          <CarouselDots variant="rounded" color="primary" />
          <CarouselDots variant="number" color="warning" />
          <CarouselProgress color="primary" />
        </div>
      </Carousel>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={carouselOptions} />
      <OptionsTable schema={carouselArrowsOptions} />
      <OptionsTable schema={carouselDotsOptions} />
      <OptionsTable schema={carouselProgressOptions} />
      <OptionsTable schema={carouselThumbsOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Carousel content props"
      rows={[
        {
          react: "align (function)",
          html: "—",
          type: "(viewSize, snapSize, index) => number",
          description: "Offset of the selected slides from the start of the view, in pixels.",
        },
        {
          react: "breakpoints",
          html: "data-ok-breakpoints (JSON)",
          type: "Record<string, options>",
          description: "Behavior options per media query. Unknown keys and values are ignored.",
        },
        {
          react: "apiRef",
          html: 'runtime.get(root, "carousel")',
          type: "RefObject<CarouselApi>",
          description: "The carousel's methods.",
        },
        {
          react: "onSelect",
          html: "ok:carousel:select",
          type: "(index: number, previous: number) => void",
          description: "The selected slide (or group of slides) changed.",
        },
        {
          react: "CarouselSlide aria-label",
          html: "aria-label on the slide",
          type: "string",
          description: 'Names the slide. Default: "1 of 5".',
        },
        {
          react: "CarouselArrows prevLabel / nextLabel",
          html: "aria-label on the buttons",
          type: "string",
          description: 'Default: "Previous slide" and "Next slide".',
        },
        {
          react: "CarouselArrows prevIcon / nextIcon",
          html: "svg in the buttons",
          type: "ReactElement",
          description: "Replace the chevrons (decorative).",
        },
        {
          react: "CarouselDots getLabel",
          html: "aria-label on the dots",
          type: "(index: number) => string",
          description: 'Names each dot. Default: "Go to slide 1".',
        },
        {
          react: "CarouselPlayButton playLabel / pauseLabel",
          html: "span[data-ok-carousel-play-label]",
          type: "ReactNode",
          description: "The button's two labels. It also takes every Button prop.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Right arrow / Left arrow", "Next / previous slide (mirrored right to left)."],
        ["Down arrow / Up arrow", "Next / previous slide in a vertical carousel."],
        ["Home / End", "First / last slide."],
        ["Tab", "Moves to the controls and into the slides; a focused slide scrolls into view."],
        ["Enter / Space", "Presses the focused arrow, dot, thumbnail or play button."],
      ]}
    />
  ),
};

/** Carousel docs page (ADR-0019). */
export function CarouselDocs() {
  return <GuideDocs sections={carouselSections} previews={PREVIEWS} />;
}
