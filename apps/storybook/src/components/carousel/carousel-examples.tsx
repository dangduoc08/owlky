import { carouselOptions } from "@owlky/core";
import {
  Button,
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
  Motion,
  MotionGroup,
  Typography,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

/*
 * Carousel stories: one per reference section (plus Drag free, Slides to scroll and Right to left,
 * beyond it). Images are original SVG artwork made for these stories
 * (`apps/storybook/public/carousel/`, same license as the repository), referenced relatively so
 * they work under the e2e server's sub-path. The `sb-carousel-*` classes are story-only demo markup
 * (`.storybook/preview.css`). The HTML snippets are generated from these examples.
 */

export const SLIDES = [
  ["Ocean waves at dusk", "The rise of remote work: benefits, challenges and future trends"],
  ["Golden marble swirl", "Understanding blockchain technology beyond cryptocurrency"],
  ["Violet nebula", "Mental health in the digital age: social media and well-being"],
  ["Emerald hills", "Sustainable fashion: how the industry is going green"],
  ["Coral reef", "Urban farming as an answer to food deserts"],
  ["Northern lights", "What drives our purchasing decisions?"],
  ["Desert dunes", "Renewable energy and the future of power"],
  ["Glacier blue", "Artificial intelligence in education"],
] as const;

const image = (index: number) => `carousel/slide-${index + 1}.svg`;

/** A picture slide with its number in a badge (as on the reference). */
function ImageSlide({
  index,
  className = "",
  parallax = false,
}: {
  index: number;
  className?: string;
  parallax?: boolean;
}) {
  return (
    <CarouselSlide>
      <div className={`sb-carousel-image ${className}`.trim()}>
        <Typography variant="subtitle2" component="span" className="sb-carousel-index">
          {index + 1}
        </Typography>
        <img
          src={image(index)}
          alt={SLIDES[index]?.[0] ?? ""}
          data-ok-carousel-parallax={parallax ? "" : undefined}
        />
      </div>
    </CarouselSlide>
  );
}
ImageSlide.displayName = "ImageSlide";

/** A card slide: picture, title and a link-like button (Dots number). */
function CardSlide({ index }: { index: number }) {
  return (
    <CarouselSlide>
      <div className="sb-carousel-card">
        <Typography variant="subtitle2" component="span" className="sb-carousel-index">
          {index + 1}
        </Typography>
        <img src={image(index)} alt="" />
        <div className="sb-carousel-card-content">
          <Typography variant="h5" component="h3">
            {SLIDES[index]?.[1]}
          </Typography>
          <Button size="sm" color="white" endIcon={<ArrowIcon />}>
            Learn more
          </Button>
        </div>
      </div>
    </CarouselSlide>
  );
}
CardSlide.displayName = "CardSlide";

function ArrowIcon({ direction = "next" }: { direction?: "prev" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "next" ? "M5 12h14m-6-6 6 6-6 6" : "M19 12H5m6-6-6 6 6 6"} />
    </svg>
  );
}
ArrowIcon.displayName = "ArrowIcon";

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

/** Story groups (one per story), in the same order as the HTML snippets `<story>-example.html`. */
export const carouselStories: Record<string, ReactGroup[]> = {
  align: [
    {
      title: "Align",
      content: (
        <Carousel
          className="sb-carousel"
          aria-label="Align"
          align="center"
          containScroll={false}
          slidesToShow="70%"
          slideSpacing={20}
        >
          <CarouselViewport>
            {range(4).map((i) => (
              <ImageSlide key={i} index={i} />
            ))}
          </CarouselViewport>
          <div className="sb-carousel-controls">
            <CarouselArrows />
            <CarouselDots />
          </div>
        </Carousel>
      ),
    },
  ],
  progress: [
    {
      title: "Progress",
      content: (
        <Carousel
          className="sb-carousel"
          aria-label="Progress"
          align="start"
          slidesToShow="70%"
          slideSpacing={20}
        >
          <CarouselViewport>
            {range(4).map((i) => (
              <ImageSlide key={i} index={i + 4} />
            ))}
          </CarouselViewport>
          <div className="sb-carousel-controls">
            <CarouselArrows />
            <CarouselProgress />
          </div>
        </Carousel>
      ),
    },
  ],
  opacity: [
    {
      title: "Opacity",
      content: (
        <Carousel
          className="sb-carousel"
          aria-label="Opacity"
          loop
          effect="opacity"
          slidesToShow="70%"
          slideSpacing={20}
        >
          <CarouselViewport>
            {range(4).map((i) => (
              <ImageSlide key={i} index={i} />
            ))}
          </CarouselViewport>
          <div className="sb-carousel-controls">
            <CarouselArrows />
            <CarouselDots />
          </div>
        </Carousel>
      ),
    },
  ],
  scale: [
    {
      title: "Scale",
      content: (
        <Carousel
          className="sb-carousel"
          aria-label="Scale"
          loop
          effect="scale"
          slidesToShow="70%"
          slideSpacing={20}
        >
          <CarouselViewport>
            {range(4).map((i) => (
              <ImageSlide key={i} index={i + 2} />
            ))}
          </CarouselViewport>
          <div className="sb-carousel-controls sb-carousel-center">
            <CarouselDots />
          </div>
        </Carousel>
      ),
    },
  ],
  fade: [
    {
      title: "Fade",
      content: (
        <Carousel className="sb-carousel" aria-label="Fade" effect="fade">
          <CarouselViewport>
            {range(4).map((i) => (
              <ImageSlide key={i} index={i} className="sb-carousel-wide" />
            ))}
          </CarouselViewport>
          <div className="sb-carousel-controls">
            <CarouselArrows />
            <CarouselDots />
          </div>
        </Carousel>
      ),
    },
  ],
  parallax: [
    {
      title: "Parallax",
      content: (
        <Carousel
          className="sb-carousel"
          aria-label="Parallax"
          loop
          effect="parallax"
          slidesToShow="70%"
          slideSpacing={20}
        >
          <CarouselStage>
            <CarouselViewport>
              {range(4).map((i) => (
                <ImageSlide key={i} index={i} parallax />
              ))}
            </CarouselViewport>
            <CarouselArrows variant="floating" />
          </CarouselStage>
          <div className="sb-carousel-controls sb-carousel-center">
            <CarouselDots />
          </div>
        </Carousel>
      ),
    },
  ],
  autoplay: [
    {
      title: "Autoplay",
      content: (
        <Carousel className="sb-carousel" aria-label="Autoplay" loop autoplay>
          <div className="sb-carousel-toolbar">
            <CarouselPlayButton />
          </div>
          <CarouselStage>
            <CarouselViewport className="sb-carousel-rounded">
              {range(4).map((i) => (
                <ImageSlide key={i} index={i + 4} className="sb-carousel-wide" />
              ))}
            </CarouselViewport>
            <CarouselProgress variant="autoplay" color="info" placement="top-end" />
            <CarouselDots color="white" placement="bottom-end" />
          </CarouselStage>
        </Carousel>
      ),
    },
  ],
  "auto-scroll": [
    {
      title: "Auto Scroll",
      content: (
        <Carousel className="sb-carousel" aria-label="Auto scroll" loop autoScroll>
          <div className="sb-carousel-toolbar">
            <CarouselPlayButton />
          </div>
          <CarouselStage>
            <CarouselViewport className="sb-carousel-rounded">
              {range(4).map((i) => (
                <ImageSlide key={i} index={i} className="sb-carousel-wide" />
              ))}
            </CarouselViewport>
            <CarouselProgress color="info" placement="top-end" />
          </CarouselStage>
        </Carousel>
      ),
    },
  ],
  "thumbs-x": [
    {
      title: "Thumbs-x",
      content: (
        <Carousel className="sb-carousel" aria-label="Thumbs x">
          <CarouselStage>
            <CarouselViewport className="sb-carousel-rounded">
              {range(8).map((i) => (
                <ImageSlide key={i} index={i} className="sb-carousel-wide" />
              ))}
            </CarouselViewport>
            <CarouselArrows variant="number" placement="bottom-end" />
          </CarouselStage>
          <CarouselThumbs className="sb-carousel-thumbs">
            {range(8).map((i) => (
              <CarouselThumb key={i}>
                <img src={image(i)} alt="" />
              </CarouselThumb>
            ))}
          </CarouselThumbs>
        </Carousel>
      ),
    },
  ],
  "thumbs-y": [
    {
      title: "Thumbs-y",
      content: (
        <Carousel className="sb-carousel" aria-label="Thumbs y">
          <CarouselStage>
            <CarouselViewport className="sb-carousel-rounded">
              {range(8).map((i) => (
                <ImageSlide key={i} index={(i + 4) % 8} className="sb-carousel-wide" />
              ))}
            </CarouselViewport>
            <CarouselArrows variant="number" placement="bottom-start" />
            <CarouselThumbs orientation="vertical" placement="end">
              {range(8).map((i) => (
                <CarouselThumb key={i}>
                  <img src={image((i + 4) % 8)} alt="" />
                </CarouselThumb>
              ))}
            </CarouselThumbs>
          </CarouselStage>
        </Carousel>
      ),
    },
  ],
  "variable-widths": [
    {
      title: "Variable widths",
      content: (
        <Carousel
          className="sb-carousel"
          aria-label="Variable widths"
          align="start"
          slidesToShow="auto"
          slideSpacing={20}
        >
          <CarouselViewport>
            {range(4).map((i) => (
              <ImageSlide key={i} index={i + 2} className={`sb-carousel-w-${(i % 3) + 1}`} />
            ))}
          </CarouselViewport>
          <div className="sb-carousel-controls">
            <CarouselArrows />
            <CarouselDots />
          </div>
        </Carousel>
      ),
    },
  ],
  "auto-height": [
    {
      title: "Auto height",
      content: (
        <Carousel className="sb-carousel" aria-label="Auto height" autoHeight>
          <div className="sb-carousel-toolbar">
            <CarouselArrows />
          </div>
          <CarouselViewport className="sb-carousel-rounded">
            {range(4).map((i) => (
              <ImageSlide key={i} index={i + 1} className={`sb-carousel-h-${i + 1}`} />
            ))}
          </CarouselViewport>
        </Carousel>
      ),
    },
  ],
  "y-axis": [
    {
      title: "Y-axis",
      content: (
        <Carousel className="sb-carousel sb-carousel-vertical" aria-label="Y axis" axis="y">
          <CarouselStage>
            <CarouselViewport className="sb-carousel-rounded">
              {range(4).map((i) => (
                <ImageSlide key={i} index={i + 3} className="sb-carousel-fill" />
              ))}
            </CarouselViewport>
            <CarouselDots color="warning" placement="top-end" />
            <CarouselArrows color="white" placement="bottom-end" />
          </CarouselStage>
        </Carousel>
      ),
    },
  ],
  "dots-number": [
    {
      title: "Dots number",
      content: (
        <Carousel
          className="sb-carousel"
          aria-label="Dots number"
          loop
          slidesToShow={{ xs: 1, sm: 2, md: 3 }}
          slideSpacing={20}
        >
          <CarouselStage>
            <CarouselViewport>
              {range(8).map((i) => (
                <CardSlide key={i} index={i} />
              ))}
            </CarouselViewport>
            <CarouselArrows variant="floating" />
          </CarouselStage>
          <div className="sb-carousel-controls sb-carousel-center">
            <CarouselDots variant="number" />
          </div>
        </Carousel>
      ),
    },
  ],
  animation: [
    {
      title: "Animation",
      content: (
        <Carousel className="sb-carousel" aria-label="Animation" loop>
          <CarouselStage>
            <CarouselViewport className="sb-carousel-rounded">
              {range(4).map((i) => (
                <CarouselSlide key={i}>
                  <div className="sb-carousel-hero">
                    <Typography variant="subtitle2" component="span" className="sb-carousel-index">
                      {i + 1}
                    </Typography>
                    <img src={image(i + 2)} alt="" />
                    <MotionGroup once={false} className="sb-carousel-hero-content">
                      <Motion variant="fadeInRight">
                        <Typography variant="h3">{SLIDES[i + 2]?.[1]}</Typography>
                      </Motion>
                      <Motion variant="fadeInRight">
                        <Typography
                          variant="body2"
                          className="sb-carousel-hero-text"
                        >{`Slide ${i + 1}: the title, this text and the button enter one after the other each time the slide comes into view.`}</Typography>
                      </Motion>
                      <Motion variant="fadeInRight">
                        <Button variant="contained" color="primary">
                          View more
                        </Button>
                      </Motion>
                    </MotionGroup>
                  </div>
                </CarouselSlide>
              ))}
            </CarouselViewport>
            <CarouselArrows variant="number" placement="top-end" />
          </CarouselStage>
        </Carousel>
      ),
    },
  ],
  custom: [
    {
      title: "Custom",
      content: (
        <Carousel
          className="sb-carousel"
          aria-label="Custom"
          align="start"
          slidesToShow={{ xs: 1, md: 2 }}
          slideSpacing={20}
        >
          <CarouselStage className="sb-carousel-inset">
            <CarouselViewport>
              {range(6).map((i) => (
                <ImageSlide key={i} index={i} />
              ))}
            </CarouselViewport>
            <CarouselArrows
              variant="floating"
              color="primary"
              prevIcon={<ArrowIcon direction="prev" />}
              nextIcon={<ArrowIcon />}
            />
          </CarouselStage>
          <div className="sb-carousel-panel">
            <CarouselArrows color="secondary" />
            <CarouselArrows
              variant="number"
              color="info"
              prevIcon={<ArrowIcon direction="prev" />}
              nextIcon={<ArrowIcon />}
            />
            <CarouselDots color="primary" />
            <CarouselDots variant="rounded" color="info" />
            <CarouselDots variant="number" color="warning" />
          </div>
        </Carousel>
      ),
    },
  ],
  "drag-free": [
    {
      title: "Drag free and wheel gestures",
      content: (
        <Carousel
          className="sb-carousel"
          aria-label="Drag free"
          align="start"
          dragFree
          wheelGestures
          forceWheelAxis="y"
          slidesToShow="auto"
          slideSpacing={20}
        >
          <CarouselViewport>
            {range(8).map((i) => (
              <ImageSlide key={i} index={i} className={`sb-carousel-w-${(i % 3) + 1}`} />
            ))}
          </CarouselViewport>
          <div className="sb-carousel-controls">
            <CarouselArrows />
            <CarouselProgress />
          </div>
        </Carousel>
      ),
    },
  ],
  "slides-to-scroll": [
    {
      title: "Slides to scroll and breakpoints",
      content: (
        <Carousel
          className="sb-carousel"
          aria-label="Slides to scroll"
          align="start"
          slidesToScroll="auto"
          slidesToShow={{ xs: 2, md: 4 }}
          slideSpacing={16}
          breakpoints={{ "(min-width: 900px)": { loop: true } }}
        >
          <CarouselViewport>
            {range(8).map((i) => (
              <ImageSlide key={i} index={i} className="sb-carousel-square" />
            ))}
          </CarouselViewport>
          <div className="sb-carousel-controls">
            <CarouselArrows variant="number" color="inherit" />
            <CarouselDots variant="rounded" />
          </div>
        </Carousel>
      ),
    },
  ],
  "right-to-left": [
    {
      title: "Right to left",
      content: (
        <div dir="rtl" className="sb-carousel">
          <Carousel aria-label="Right to left" loop slidesToShow="70%" slideSpacing={20}>
            <CarouselViewport>
              {range(4).map((i) => (
                <ImageSlide key={i} index={i + 4} />
              ))}
            </CarouselViewport>
            <div className="sb-carousel-controls">
              <CarouselArrows />
              <CarouselDots />
            </div>
          </Carousel>
        </div>
      ),
    },
  ],
};

/** Group title ↔ snippet file, per story (one example each). */
export const CAROUSEL_FILES: Record<string, GroupFiles> = Object.fromEntries(
  Object.entries(carouselStories).map(([story, groups]) => [
    story,
    groups.map((group) => [group.title, "example"] as const),
  ]),
);

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const CAROUSEL_CONTROLS = {
  schema: carouselOptions,
  keys: ["align", "containScroll", "loop", "dragFree", "skipSnaps", "duration"],
} as const;
