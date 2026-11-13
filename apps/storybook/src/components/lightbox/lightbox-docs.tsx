import { lightboxOptions } from "@owlky/core";
import lightboxApi from "@owlky/docs-content/api/lightbox.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Lightbox } from "@owlky/react";
import inlineExample from "../../../../../packages/html/src/components/lightbox/examples/inline-example.html?raw";
import lightboxExample from "../../../../../packages/html/src/components/lightbox/examples/lightbox-example.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { snippetElement } from "../../helpers/snippet-markup.js";
import { solarMarkup } from "../../helpers/solar-icons.js";

const LIGHTBOX = snippetElement(lightboxExample, "data-ok-lightbox ");

/** The full lightbox of the snippet, as `dialog#photos`, with extra root attributes. */
const htmlLightbox = (attrs = "") =>
  LIGHTBOX.replace(
    /^<dialog [^>]*>/,
    `<dialog id="photos" data-ok-lightbox data-ok-theme="dark" aria-label="Lightbox"${attrs ? ` ${attrs}` : ""}>`,
  );

/** The snippet's triggers, opening `#photos`. */
const TRIGGERS = lightboxExample
  .split("\n")
  .filter((line) => line.includes("data-ok-lightbox-trigger"))
  .map((line) => line.trim().replaceAll('"lightbox-lightbox"', '"photos"'))
  .join("\n");

import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { Gallery, SLIDES } from "./lightbox-examples.js";

export const lightboxSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A lightbox shows images and videos over the page, one at a time. People open it from a gallery, swipe or use the arrow keys to move between slides, zoom into details, start a slideshow, go fullscreen and close it with Escape. A toolbar, a counter, captions and a row of thumbnails come built in. The lightbox is a modal dialog, so the page behind it is inert and focus returns to the picture that opened it.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<!-- Each trigger opens the lightbox at its slide -->
${TRIGGERS}

${htmlLightbox()}`,
    react: `import { Lightbox, LightboxTrigger } from "@owlky/react";

const slides = [
  { src: "lake.jpg", alt: "Mountain lake", width: 2400, height: 1600, title: "Mountain lake" },
  { type: "video", poster: "clip.jpg", sources: [{ src: "clip.mp4", type: "video/mp4" }] },
];

export function Photos() {
  return (
    <Lightbox slides={slides}>
      <LightboxTrigger index={0}>
        <img src="lake.jpg" alt="Mountain lake" />
      </LightboxTrigger>
    </Lightbox>
  );
}`,
  },
  {
    id: "slides",
    title: "Describe the slides",
    body: 'In React, pass the slides as data. An image slide has a `src`, an `alt` text and, ideally, its natural `width` and `height`, so the lightbox knows how far it can zoom before the image gets blurry. Add `srcSet` for other sizes of the same image. A video slide has `type: "video"`, its `sources` and a `poster`, plus the usual video settings such as `muted` or `autoPlay` (the video plays when its slide becomes current). `title` and `description` become the captions. `thumbnail` sets another picture for the thumbnail. In HTML, write the same markup the React version renders: one slide per item, with the image or video inside `data-ok-lightbox-zoom`.',
    html: `<div role="group" aria-roledescription="slide" aria-label="5 of 5" data-ok-carousel-slide data-ok-lightbox-slide>
  <div data-ok-lightbox-zoom>
    <video data-ok-lightbox-video poster="clip.jpg" width="1280" height="720" controls playsinline>
      <source src="clip.mp4" type="video/mp4">
    </video>
  </div>
  <h2 data-ok-lightbox-caption="title">Color bands</h2>
  <div data-ok-lightbox-caption="description">
    <div data-ok-lightbox-description-text>A short clip.</div>
  </div>
</div>`,
    react: `import type { LightboxSlide } from "@owlky/react";

export const slides: LightboxSlide[] = [
  {
    src: "lake.jpg",
    alt: "Mountain lake",
    width: 2400,
    height: 1600,
    srcSet: [{ src: "lake-1200.jpg", width: 1200, height: 800 }],
    title: "Mountain lake",
    description: "Sunrise over the ridge.",
  },
  {
    type: "video",
    poster: "clip.jpg",
    width: 1280,
    height: 720,
    sources: [{ src: "clip.mp4", type: "video/mp4" }],
    title: "Color bands",
  },
];`,
  },
  {
    id: "open",
    title: "Open the lightbox",
    body: "Put a `LightboxTrigger` per picture inside `Lightbox`: it opens the lightbox at its `index`. In HTML, give the dialog an `id` and point each trigger at it with `data-ok-lightbox-open` and `data-ok-index`. To control the lightbox yourself, pass `open` with `onOpenChange`, and `index` with `onIndexChange`. `onOpenChange` receives the reason for closing: `escape`, `backdrop`, `pull` or `close` (the close button).",
    html: `<button type="button" data-ok-lightbox-trigger data-ok-lightbox-open="photos" data-ok-index="2"
  aria-haspopup="dialog"><img src="forest.jpg" alt="Forest in the fog"></button>

<script type="module">
  // Or open it from code, once the runtime has started.
  const photos = document.getElementById("photos");
  window.Owlky.get(photos, "lightbox").open(2);
</script>`,
    react: `import { useState } from "react";
import { Lightbox, type LightboxSlide } from "@owlky/react";

export function Controlled({ slides }: { slides: LightboxSlide[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  return (
    <Lightbox
      slides={slides}
      open={open}
      onOpenChange={setOpen}
      index={index}
      onIndexChange={setIndex}
    />
  );
}`,
  },
  {
    id: "toolbar",
    title: "Choose the toolbar buttons",
    body: "The zoom buttons, the slideshow button, the fullscreen button, the counter and the close button are on by default, like the thumbnails and the captions. Turn each one off with `disableZoom`, `disableSlideshow`, `disableFullscreen`, `disableTotal`, `disableThumbnails` and `disableCaptions`. Turn on more buttons with `download`, `share` and `rotate`, and add toggles for the captions and the thumbnails with `captionsShowToggle` and `thumbnailsShowToggle`. The share button uses the browser's share sheet and only shows where the browser offers one, and the fullscreen button only shows where fullscreen is available. In React, add your own buttons with `toolbarButtons`.",
    html: `${htmlLightbox(
      "data-ok-download data-ok-share data-ok-rotate data-ok-disable-slideshow data-ok-captions-show-toggle data-ok-thumbnails-show-toggle",
    )}`,
    react: `import { Lightbox, type LightboxSlide } from "@owlky/react";

const slides: LightboxSlide[] = [
  { src: "lake.jpg", alt: "Mountain lake", width: 2400, height: 1600, title: "Mountain lake" },
  { src: "forest.jpg", alt: "Forest in the fog", width: 2400, height: 1600, title: "Forest in the fog" },
];

export function LightboxToolbar() {
  return (
    <Lightbox
      slides={slides}
      download
      share
      rotate
      disableSlideshow
      captionsShowToggle
      thumbnailsShowToggle
    />
  );
}`,
  },
  {
    id: "custom-buttons",
    title: "Replace the buttons",
    body: `Replace any built-in button with your own, such as a labeled close button. In React, pass a function in \`render\`: \`buttonPrev\`, \`buttonNext\` and \`buttonClose\`, and for the toolbar \`buttonZoom\` (both zoom buttons), \`buttonSlideshow\`, \`buttonFullscreen\`, \`buttonDownload\`, \`buttonShare\`, \`buttonCaptions\` and \`buttonThumbnails\`. Each function gets the attributes that give the button its behavior and, where the button has a fixed name, its \`aria-label\`: spread them on your button. Return \`null\` to leave a button out. In HTML, write your button in place of the built-in one, with the same \`data-ok-lightbox-*\` or \`data-ok-carousel-*\` attribute.

\`render.slideContainer\` wraps the content of each slide, such as to add a frame or a watermark over the picture. The wrapper should fill the slide: give it \`display: contents\`, or a full-size flex box. In HTML, put your wrapper inside each slide.`,
    html: htmlLightbox().replace(
      /<button[^>]*data-ok-lightbox-close[^>]*>[\s\S]*?<\/button>/,
      '<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="sm" data-ok-lightbox-close><span data-ok-button-label>Close</span></button>',
    ),
    react: `import { Button, IconButton, Lightbox, type LightboxSlide } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import altArrowLeftLinear from "@iconify-icons/solar/alt-arrow-left-linear";
import altArrowRightLinear from "@iconify-icons/solar/alt-arrow-right-linear";

const slides: LightboxSlide[] = [
  { src: "lake.jpg", alt: "Mountain lake", width: 2400, height: 1600, title: "Mountain lake" },
  { src: "forest.jpg", alt: "Forest in the fog", width: 2400, height: 1600, title: "Forest in the fog" },
];

export function LightboxButtons() {
  return (
    <Lightbox
      slides={slides}
      render={{
        // The close button's attributes include its name: a visible label replaces it.
        buttonClose: ({ "aria-label": _name, ...attributes }) => (
          <Button variant="outlined" color="inherit" size="sm" {...attributes}>
            Close
          </Button>
        ),
        buttonPrev: (attributes) => (
          <IconButton {...attributes}>
            <Icon icon={altArrowLeftLinear} aria-hidden="true" />
          </IconButton>
        ),
        buttonNext: (attributes) => (
          <IconButton {...attributes}>
            <Icon icon={altArrowRightLinear} aria-hidden="true" />
          </IconButton>
        ),
        buttonShare: () => null,
        slideContainer: ({ children }) => <div style={{ display: "contents" }}>{children}</div>,
      }}
    />
  );
}`,
  },
  {
    id: "loading",
    title: "Show loading and error icons",
    body: `By default, a slide shows nothing while its picture loads. To show an icon while it loads, and another one when it fails to load, pass \`render.iconLoading\` and \`render.iconError\` in React. In HTML, add a \`template\` with \`data-ok-lightbox-icon="loading"\` or \`"error"\` to the lightbox: the script copies it into every image slide. The lightbox marks each image slide with \`data-ok-status\` (\`loading\`, \`complete\` or \`error\`) and shows the matching icon in the middle of the slide. The icons are decorative: screen readers still read the slide's name and its image's \`alt\` text.`,
    html: htmlLightbox().replace(
      /^(<dialog [^>]*>)/,
      `$1
  <template data-ok-lightbox-icon="loading"><span data-ok-circular-progress data-ok-variant="indeterminate" data-ok-color="inherit"><svg data-ok-circular-progress-svg viewBox="22 22 44 44" aria-hidden="true"><circle data-ok-circular-progress-circle cx="44" cy="44" r="20.2" stroke-width="3.6" /></svg></span></template>
  <template data-ok-lightbox-icon="error">${solarMarkup("gallery-remove-linear", { size: 48 })}</template>`,
    ),
    react: `import { CircularProgress, Lightbox, type LightboxSlide } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import galleryRemoveLinear from "@iconify-icons/solar/gallery-remove-linear";

const slides: LightboxSlide[] = [
  { src: "lake.jpg", alt: "Mountain lake", width: 2400, height: 1600, title: "Mountain lake" },
  { src: "forest.jpg", alt: "Forest in the fog", width: 2400, height: 1600, title: "Forest in the fog" },
];

export function LightboxLoading() {
  return (
    <Lightbox
      slides={slides}
      render={{
        iconLoading: () => <CircularProgress color="inherit" aria-hidden="true" />,
        iconError: () => <Icon icon={galleryRemoveLinear} width={48} height={48} aria-hidden="true" />,
      }}
    />
  );
}`,
  },
  {
    id: "zoom",
    title: "Zoom and pan",
    body: "Zoom in with the toolbar, the plus and minus keys, a double click or double tap, a pinch, or Ctrl and the mouse wheel. Then drag, use the arrow keys or the wheel to move around the image. An image zooms until one image pixel covers one screen pixel (`maxZoomPixelRatio`), so give images their natural `width` and `height`. `zoomInMultiplier` sets the size of each step, `doubleClickMaxStops` how many steps a double click goes through, and `scrollToZoom` lets the wheel zoom without Ctrl. Images that are no larger than the screen don't zoom.",
    html: `${htmlLightbox('data-ok-max-zoom-pixel-ratio="2" data-ok-zoom-in-multiplier="1.5" data-ok-scroll-to-zoom')}`,
    react: `import { Lightbox, type LightboxSlide } from "@owlky/react";

const slides: LightboxSlide[] = [
  { src: "lake.jpg", alt: "Mountain lake", width: 2400, height: 1600, title: "Mountain lake" },
  { src: "forest.jpg", alt: "Forest in the fog", width: 2400, height: 1600, title: "Forest in the fog" },
];

export function LightboxZoom() {
  return <Lightbox slides={slides} maxZoomPixelRatio={2} zoomInMultiplier={1.5} scrollToZoom />;
}`,
  },
  {
    id: "thumbnails",
    title: "Place the thumbnails",
    body: "Thumbnails sit at the `bottom` by default. Set `thumbnailsPosition` to `top`, `start` or `end` to move them, and change their size with `thumbnailsWidth`, `thumbnailsHeight`, `thumbnailsBorder`, `thumbnailsBorderRadius`, `thumbnailsPadding` and `thumbnailsGap` (in pixels). `thumbnailsImageFit` crops them to fill (`cover`) or shows the whole picture (`contain`). The row fades out at its edges unless `thumbnailsVignette` is `false`.",
    html: `${htmlLightbox('data-ok-thumbnails-position="end" data-ok-thumbnails-width="96" data-ok-thumbnails-height="64"')}`,
    react: `import { Lightbox, type LightboxSlide } from "@owlky/react";

const slides: LightboxSlide[] = [
  { src: "lake.jpg", alt: "Mountain lake", width: 2400, height: 1600, title: "Mountain lake" },
  { src: "forest.jpg", alt: "Forest in the fog", width: 2400, height: 1600, title: "Forest in the fog" },
];

export function LightboxThumbnails() {
  return (
    <Lightbox slides={slides} thumbnailsPosition="end" thumbnailsWidth={96} thumbnailsHeight={64} />
  );
}`,
  },
  {
    id: "inline",
    title: "Show it inline",
    body: "Set `inline` to place the lightbox in the page as a carousel, with the same toolbar, captions and thumbnails but no close button. In HTML, use a `div` with `data-ok-inline` instead of the dialog. It is 3:2 by default: change the size with your own CSS.",
    html: `${snippetElement(inlineExample, "data-ok-lightbox ")}`,
    react: `import { Lightbox, type LightboxSlide } from "@owlky/react";

const slides: LightboxSlide[] = [
  { src: "lake.jpg", alt: "Mountain lake", width: 2400, height: 1600, title: "Mountain lake" },
  { src: "forest.jpg", alt: "Forest in the fog", width: 2400, height: 1600, title: "Forest in the fog" },
];

export function LightboxInline() {
  return <Lightbox slides={slides} inline />;
}`,
  },
  {
    id: "close",
    title: "Close the lightbox",
    body: "Escape and the close button always close the lightbox, unless you set `closeOnEscape` to `false`. Set `closeOnBackdropClick` to close it with a click beside the image, and `closeOnPullDown` or `closeOnPullUp` to close it when people pull the slide down or up. `finite` stops the slides at both ends instead of looping, and `disableSwipeNavigation` keeps swipes from changing slides.",
    html: `${htmlLightbox("data-ok-close-on-backdrop-click data-ok-close-on-pull-down data-ok-finite")}`,
    react: `import { Lightbox, type LightboxSlide } from "@owlky/react";

const slides: LightboxSlide[] = [
  { src: "lake.jpg", alt: "Mountain lake", width: 2400, height: 1600, title: "Mountain lake" },
  { src: "forest.jpg", alt: "Forest in the fog", width: 2400, height: 1600, title: "Forest in the fog" },
];

export function LightboxClose() {
  return <Lightbox slides={slides} closeOnBackdropClick closeOnPullDown finite />;
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set content and callbacks. They aren't options, because HTML writes them as markup or listens to events.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:lightbox:open\`** and **\`ok:lightbox:close\`** fire on the dialog, with \`detail.reason\` when it closes. **\`beforeopen\`** and **\`beforeclose\`** come first and can be canceled.
- **Other events:** \`view\` (\`detail.index\`), \`click\` (\`detail.index\`), \`zoom\` (\`detail.zoom\`), \`rotate\` (\`detail.index\`, \`detail.rotation\`), \`fullscreen\`, \`slideshow\` (\`detail.playing\`), \`captions\` and \`thumbnails\` (\`detail.visible\`). **\`download\`** and **\`share\`** can be canceled to replace the default action.
- **Instance:** \`runtime.get(dialog, "lightbox")\` returns \`open(index)\`, \`close()\`, \`prev()\`, \`next()\`, \`goTo(index)\`, \`zoomIn()\`, \`zoomOut()\`, \`changeZoom(zoom)\`, \`rotateClockwise()\`, \`rotateCounterClockwise()\`, \`enterFullscreen()\`, \`exitFullscreen()\`, \`play()\`, \`pause()\`, \`showCaptions()\`, \`hideCaptions()\`, \`showThumbnails()\`, \`hideThumbnails()\`, \`download()\` and \`share()\`, and the current \`index\`, \`zoom\`, \`maxZoom\`, \`rotation\` and \`fullscreen\`.
- **React:** \`apiRef\` receives the same methods. Callbacks are \`onOpenChange(open, reason)\`, \`onIndexChange(index)\`, \`onSlideClick(index)\`, \`onZoomChange(zoom)\`, \`onRotate(index, rotation)\`, \`onFullscreenChange(fullscreen)\`, \`onSlideshowChange(playing)\`, \`onCaptionsChange(visible)\`, \`onThumbnailsChange(visible)\`, \`onDownload(index)\` and \`onShare(index)\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Keys work anywhere in the lightbox, except inside a video, whose own controls keep their keys.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The lightbox is a modal dialog named "Lightbox": the page behind it is inert, Tab stays inside, and focus returns to the trigger when it closes.
- Give every image an \`alt\` text. Triggers take their name from the picture inside them.
- Only the current slide is reachable: the others are inert, and a polite live region announces the slide people move to.
- Every toolbar button has a name, and toggles change their name with their state, such as **Enter Fullscreen** and **Exit Fullscreen**. Buttons that can't act, such as zooming past the limit, stay focusable and say they're unavailable.
- The slideshow never starts on its own when the system asks for reduced motion, and it has a pause button.
- Zoom levels and failures (a download that didn't work) are read out in a polite live region.`,
  },
  apiReferenceSection(lightboxApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Lightbox slides={SLIDES}>
        <Gallery />
      </Lightbox>
    </Preview>
  ),
  inline: () => (
    <Preview>
      <Lightbox slides={SLIDES.slice(0, 4)} inline className="sb-lightbox-inline" />
    </Preview>
  ),
  options: () => <OptionsTable schema={lightboxOptions} />,
  props: () => (
    <PropsTable
      label="Lightbox content props"
      rows={[
        {
          react: "slides",
          html: "the slides' markup",
          type: "LightboxSlide[]",
          description: 'Images, videos (`type: "video"`) or custom slides (`render.slide`).',
        },
        {
          react: "open / onOpenChange",
          html: "triggers, open(), close(), ok:lightbox:close",
          type: "boolean / (open, reason) => void",
          description: "Open state. Without `open`, `LightboxTrigger` and `defaultOpen` manage it.",
        },
        {
          react: "index / onIndexChange",
          html: "data-ok-index on triggers, goTo(), ok:lightbox:view",
          type: "number / (index) => void",
          description: "The current slide.",
        },
        {
          react: "labels",
          html: "the text in the markup; data-ok-labels (JSON) for messages",
          type: "Partial<LightboxLabels>",
          description: 'Texts and translations, such as `{ Close: "Fermer" }`.',
        },
        {
          react: "counterSeparator",
          html: "the text between the counter's numbers",
          type: "string",
          description: 'Default: " / ".',
        },
        {
          react: "video",
          html: "attributes of each video",
          type: "{ controls, autoPlay, muted, loop, … }",
          description:
            "Defaults of every video slide. Default: `{ controls: true, playsInline: true }`.",
        },
        {
          react: "imageProps",
          html: "attributes of each image",
          type: "img props, or (slide) => img props",
          description: "Extra attributes of every image, such as `crossOrigin`.",
        },
        {
          react: "toolbarButtons",
          html: "buttons in the toolbar",
          type: "ReactNode",
          description: "Your own toolbar buttons, before the counter.",
        },
        {
          react: "render",
          html: "your own markup",
          type: "{ slide, slideContainer, slideHeader, slideFooter, controls, thumbnail, button…, icon… }",
          description:
            "Custom slides, slide wrappers, extra content, replacement buttons, and icons (including `iconLoading` and `iconError`).",
        },
        {
          react: "customDownload / customShare",
          html: "cancel ok:lightbox:download / share",
          type: "(slide, index) => void",
          description: "Replace the default download or share.",
        },
        {
          react: "apiRef",
          html: 'runtime.get(dialog, "lightbox")',
          type: "RefObject<LightboxApi>",
          description: "The lightbox's methods.",
        },
        {
          react: "LightboxTrigger index",
          html: "data-ok-lightbox-open + data-ok-index",
          type: "number",
          description: "Opens the lightbox at that slide.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Right arrow / Left arrow", "Next / previous slide (mirrored right to left)."],
        ["Home / End", "First / last slide."],
        ["+ / -", "Zoom in / zoom out."],
        ["Ctrl + 0 (Command + 0 on macOS)", "Back to the whole image."],
        ["Arrow keys while zoomed", "Move around the image."],
        ["Escape", "Closes the lightbox (or leaves fullscreen first)."],
        ["Tab", "Moves through the toolbar, the navigation buttons and the thumbnails."],
      ]}
    />
  ),
};

/** Lightbox docs page (ADR-0019). */
export function LightboxDocs() {
  return <GuideDocs sections={lightboxSections} previews={PREVIEWS} />;
}
