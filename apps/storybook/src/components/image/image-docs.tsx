import { imageOptions } from "@owlky/core";
import imageApi from "@owlky/docs-content/api/image.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Image } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

export const imageSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "Image shows a picture that the browser loads only when it nears the screen. A placeholder fills the space until the picture arrives, then the picture appears with a short blur effect. You can crop the picture to an aspect ratio and paint an overlay on it. Image is a native `img` in a `span`, so it works inside links and buttons. Without JavaScript every picture shows at once.",
    html: `<!-- Load once per page: the styles, and the script for the placeholder and the effect -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<span data-ok-image data-ok-ratio="4/3" data-ok-fit="cover" data-ok-position="center"
      data-ok-effect="blur">
  <span data-ok-image-placeholder aria-hidden="true"></span>
  <img src="beach.jpg" alt="A quiet beach at sunrise" loading="lazy" decoding="async">
</span>`,
    react: `import { Image } from "@owlky/react";

export function Beach() {
  return <Image src="beach.jpg" alt="A quiet beach at sunrise" ratio="4/3" />;
}`,
  },
  {
    id: "ratio",
    title: "Crop to an aspect ratio",
    body: "Set `ratio` to give the image a fixed shape, such as `16/9` for a cover or `1/1` for a tile. The image takes the full width of its container and the height that the ratio gives. The picture covers that box and is cropped to it. Use `fit` to show the whole picture instead (`contain`), and `position` to choose which part stays in view, such as `top` for portraits. Without `ratio`, the picture keeps its own shape: set `width` and `height` to the picture's size, so the page reserves the space before it loads and doesn't shift.",
    html: `<span data-ok-image data-ok-ratio="21/9" data-ok-fit="cover" data-ok-position="top"
      data-ok-effect="blur">
  <span data-ok-image-placeholder aria-hidden="true"></span>
  <img src="team.jpg" alt="The team on the office roof" loading="lazy" decoding="async">
</span>`,
    react: `import { Image } from "@owlky/react";

export function Team() {
  return <Image src="team.jpg" alt="The team on the office roof" ratio="21/9" position="top" />;
}`,
  },
  {
    id: "loading",
    title: "Control loading",
    body: 'Images load lazily by default (`loading="lazy"`), which saves data on long pages. Set `visibleByDefault` for pictures in the first screen, such as a hero: they load at once, with no placeholder and no effect. `effect` chooses how the picture appears: `blur` (the default), `opacity`, `black-and-white` or `none`. Set `placeholderSrc` to a small preview of the picture, which shows blurred while the full picture loads, or `disablePlaceholder` to show nothing. Pass `srcSet` and `sizes` so the browser picks the file that fits the screen. When people prefer reduced motion, the picture appears without the effect.',
    html: `<span data-ok-image data-ok-ratio="16/9" data-ok-fit="cover" data-ok-position="center"
      data-ok-effect="blur" data-ok-visible-by-default>
  <span data-ok-image-placeholder aria-hidden="true"></span>
  <img src="hero-1200.jpg" alt="Mountains above the clouds"
       srcset="hero-600.jpg 600w, hero-1200.jpg 1200w" sizes="100vw"
       loading="eager" decoding="async" fetchpriority="high">
</span>`,
    react: `import { Image } from "@owlky/react";

export function Hero() {
  return (
    <Image
      src="hero-1200.jpg"
      srcSet="hero-600.jpg 600w, hero-1200.jpg 1200w"
      sizes="100vw"
      alt="Mountains above the clouds"
      ratio="16/9"
      visibleByDefault
      fetchPriority="high"
    />
  );
}`,
  },
  {
    id: "overlay",
    title: "Add an overlay",
    body: "Set `overlay` to paint a layer over the picture, for example to keep white text on it readable. `dark` is a 48% dark grey. A palette color, such as `primary`, is a gradient from transparent at the top to the color at 80% at the bottom. Add `overlayFrom` for a gradient between two colors: from `overlayFrom` at the bottom to `overlay` at the top. In HTML, the overlay is a `span` that you add before the `img`.",
    html: `<span data-ok-image data-ok-ratio="1/1" data-ok-fit="cover" data-ok-position="center"
      data-ok-effect="blur" data-ok-overlay="info" data-ok-overlay-from="secondary">
  <span data-ok-image-placeholder aria-hidden="true"></span>
  <span data-ok-image-overlay aria-hidden="true"></span>
  <img src="city.jpg" alt="City lights at night" loading="lazy" decoding="async">
</span>`,
    react: `import { Image } from "@owlky/react";

export function City() {
  return (
    <Image src="city.jpg" alt="City lights at night" ratio="1/1" overlay="info" overlayFrom="secondary" />
  );
}`,
  },
  {
    id: "errors",
    title: "Handle errors",
    body: "When a picture fails to load, the placeholder stays and shows a broken-image icon. The picture's text alternative stays available to screen readers. Use `onError` in React, or the `ok:image:error` event in HTML, to log the failure or to try another source. Setting a new `src` loads the picture again.",
    html: `<script>
  document.addEventListener("ok:image:error", (event) => {
    const img = event.target.querySelector(":scope > img");
    img.src = "fallback.jpg";
  });
</script>`,
    react: `import { Image } from "@owlky/react";
import { useState } from "react";

export function Photo() {
  const [src, setSrc] = useState("photo.jpg");
  return <Image src={src} alt="A red bicycle" ratio="4/3" onError={() => setSrc("fallback.jpg")} />;
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
    body: "The picture's own attributes go to the `img`. In React they are props of `Image`, and `imgProps` passes any other attribute.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:image:load\`** fires when the picture loads. \`detail.src\` is the file the browser picked.
- **\`ok:image:error\`** fires when the picture fails to load. \`detail.src\` is the file that failed.
- **Instance:** \`runtime.get(element, "image")\` returns \`{ state }\`: \`loading\`, \`loaded\` or \`error\`.
- **React:** \`onLoad(event)\` and \`onError(event)\`, the image's events.
- **State:** the root's \`data-ok-state\` attribute holds the same state. Don't write it in your markup.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "An image isn't interactive and takes no focus. To make it a link or a button, put it inside an `a` or a `button` element.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- \`alt\` is required. Describe what the picture shows, in a short sentence. Use \`alt=""\` for decorative pictures, so screen readers skip them.
- Inside a link or a button, the \`alt\` text names it: describe where the link goes or what the button does.
- The placeholder, the overlay and the error icon are hidden from assistive technology.
- A broken picture keeps its \`alt\` text for screen readers. Sighted users see the icon.
- White text on a picture needs a contrast ratio of at least 4.5:1: add a \`dark\` overlay under it.
- When people prefer reduced motion, pictures appear without the transition.`,
  },
  apiReferenceSection(imageApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Image
        src="images/image-7.svg"
        alt="Sunrise over soft hills"
        ratio="4/3"
        style={{ width: "16rem", borderRadius: "var(--ok-radius-xl)" }}
      />
    </Preview>
  ),
  ratio: () => (
    <Preview>
      <Image
        src="images/image-9.svg"
        alt="Blue blossoms at twilight"
        ratio="21/9"
        position="top"
        style={{ width: "100%", borderRadius: "var(--ok-radius-xl)" }}
      />
    </Preview>
  ),
  overlay: () => (
    <Preview>
      <Image
        src="images/image-2.svg"
        alt="Neon chevrons in the dark"
        ratio="1/1"
        overlay="info"
        overlayFrom="secondary"
        style={{ width: "12rem", borderRadius: "var(--ok-radius-xl)" }}
      />
    </Preview>
  ),
  errors: () => (
    <Preview>
      <Image
        src="images/missing.svg"
        alt="Harbor at dawn, unavailable"
        ratio="4/3"
        style={{ width: "12rem", borderRadius: "var(--ok-radius-xl)" }}
      />
    </Preview>
  ),
  options: () => <OptionsTable schema={imageOptions} />,
  props: () => (
    <PropsTable
      label="Image attributes"
      rows={[
        {
          react: "src, srcSet, sizes",
          html: "img[src][srcset][sizes]",
          type: "string",
          description: "The picture and its other sizes, for the browser to pick from.",
        },
        {
          react: "alt",
          html: "img[alt]",
          type: "string",
          description: 'Text alternative (required). `""` for a decorative picture.',
        },
        {
          react: "width, height",
          html: "img[width][height]",
          type: "number",
          description: "The picture's size: reserves its shape before it loads.",
        },
        {
          react: "loading, decoding, fetchPriority",
          html: "img[loading][decoding][fetchpriority]",
          type: "string",
          description:
            "Native loading hints. Defaults: `lazy` (`eager` with `visibleByDefault`), `async`.",
        },
        {
          react: "placeholderSrc, placeholder",
          html: 'span[data-ok-image-placeholder] › img[alt=""]',
          type: "string, ReactNode",
          description: "A small preview, or other content, shown while the picture loads.",
        },
        {
          react: "imgProps, imgRef",
          html: "img",
          type: "object, Ref",
          description: "Other attributes and the ref of the `img` (`ref` is the root).",
        },
      ]}
    />
  ),
};

/** Image docs page (ADR-0019). */
export function ImageDocs() {
  return <GuideDocs sections={imageSections} previews={PREVIEWS} />;
}
