import { lightboxOptions } from "@owlky/core";
import {
  Lightbox,
  type LightboxImageSlide,
  type LightboxSlide,
  LightboxTrigger,
  type LightboxVideoSlide,
} from "@owlky/react";

/*
 * Lightbox stories. Pictures and the video are original artwork made for these stories
 * (`apps/storybook/public/lightbox/`, same license as the repository), referenced relatively so
 * they work under the e2e server's sub-path. `sb-lightbox-gallery` is story-only demo layout
 * (`.storybook/preview.css`). The HTML snippets are generated from these examples.
 */

export const SLIDES: LightboxSlide[] = [
  {
    src: "lightbox/photo-1.svg",
    alt: "Mountain lake at sunrise",
    width: 2400,
    height: 1600,
    title: "Mountain lake",
    description: "Sunrise over the ridge, seen from the eastern shore.",
  },
  {
    src: "lightbox/photo-2.svg",
    alt: "Neon arches",
    width: 2400,
    height: 1600,
    title: "Neon arches",
    description: "Four arches of light in a night market.",
  },
  {
    src: "lightbox/photo-3.svg",
    alt: "Forest in the fog",
    width: 2400,
    height: 1600,
    title: "Forest in the fog",
    description: "Morning fog between the pines.",
  },
  {
    src: "lightbox/photo-4.svg",
    alt: "Desert road",
    width: 2400,
    height: 1600,
    title: "Desert road",
    description: "A straight road toward the setting sun.",
  },
  {
    type: "video",
    poster: "lightbox/video-poster.svg",
    width: 1280,
    height: 720,
    sources: [{ src: "lightbox/video.webm", type: "video/webm" }],
    tracks: [{ src: "lightbox/video.vtt", srcLang: "en", label: "English" }],
    title: "Color bands",
    description: "A short animated clip.",
  },
];

/** Opens the lightbox at each slide: the slide's picture (or the video's poster) as a button. */
export function Gallery({ slides = SLIDES }: { slides?: LightboxSlide[] }) {
  return (
    <div className="sb-lightbox-gallery">
      {slides.map((slide, index) => (
        <LightboxTrigger key={String(index)} index={index}>
          {slide.type === "video" ? (
            <img
              src={(slide as LightboxVideoSlide).poster}
              alt={`${String(slide.title)} (video)`}
            />
          ) : (
            <img src={(slide as LightboxImageSlide).src} alt={(slide as LightboxImageSlide).alt} />
          )}
        </LightboxTrigger>
      ))}
    </div>
  );
}

/** The reference's demo: a gallery that opens the lightbox with every feature on. */
export function LightboxDemo() {
  return (
    <Lightbox slides={SLIDES}>
      <Gallery />
    </Lightbox>
  );
}

/** Inline: the lightbox as a carousel in the page. */
export function InlineDemo() {
  return <Lightbox slides={SLIDES.slice(0, 4)} inline />;
}

/** Download, share and rotate buttons, captions and thumbnails toggles, pull down to close. */
export function ToolbarDemo() {
  const slides = SLIDES.slice(0, 4);
  return (
    <Lightbox
      slides={slides}
      download
      share
      rotate
      captionsShowToggle
      thumbnailsShowToggle
      closeOnBackdropClick
      closeOnPullDown
    >
      <Gallery slides={slides} />
    </Lightbox>
  );
}

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const LIGHTBOX_CONTROLS = {
  schema: lightboxOptions,
  keys: [
    "disableZoom",
    "disableTotal",
    "disableCaptions",
    "disableSlideshow",
    "disableThumbnails",
    "disableFullscreen",
  ],
} as const;

export const INLINE_CONTROLS = {
  schema: lightboxOptions,
  keys: ["finite", "imageFit", "thumbnailsPosition", "descriptionTextAlign"],
} as const;

export const TOOLBAR_CONTROLS = {
  schema: lightboxOptions,
  keys: ["rotateButtons", "finite", "slideshowAutoplay", "slideshowDelay"],
} as const;
