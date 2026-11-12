import { type Illustration as IllustrationData, illustrationOptions } from "@owlky/core";
import {
  backdrop,
  emptyContent,
  error404,
  groundShadow,
  signIn,
  sparkle,
} from "@owlky/core/illustrations";
import illustrationApi from "@owlky/docs-content/api/illustration.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Illustration, Upload } from "@owlky/react";
import { Caption, CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable } from "../../helpers/guide-tables.js";

export const illustrationsSections: GuideSection[] = [
  {
    id: "overview",
    title: "Illustrations in Owlky",
    body: `Owlky includes 16 flat illustrations for error pages, empty states, account flows and dashboards. Each one is inline SVG whose shapes name a color role, such as \`main\` or \`paper\`, instead of a color. The stylesheet turns those roles into theme colors, so every illustration follows light and dark mode, nested themes, the **Preset** menu in the toolbar and the \`color\` option.

- **Theme-aware:** the brand shapes use the primary palette, or another palette you choose. Neutral shapes follow the color scheme.
- **Small and private:** the pictures are data in your bundle. They need no image requests and work under a strict Content Security Policy.
- **Pay for what you use:** every illustration is its own export, so your bundle keeps only the ones you import.

The **All** story in the sidebar shows the whole set on one page. The other stories show it by category.`,
  },
  {
    id: "use",
    title: "Add an illustration",
    body: `In React, import the illustration from \`@owlky/core/illustrations\` and pass it to \`Illustration\`.

In HTML, you have two options:

- **Paste the SVG:** copy the snippet from the story's **Code** panel. It needs only the stylesheet.
- **Name the picture:** write an empty \`<svg data-ok-illustration="name">\` and load \`owlky-illustrations.js\` after \`owlky.js\`. The script draws the shapes with DOM methods. Use this option when you show the same picture on many pages.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>
<script src="${CDN}/owlky-illustrations.js" defer></script>

<!-- The script draws the "error-404" illustration inside this element -->
<svg data-ok-illustration="error-404" data-ok-color="primary" aria-hidden="true"></svg>`,
    react: `import { error404 } from "@owlky/core/illustrations";
import { Illustration } from "@owlky/react";

export function NotFound() {
  return <Illustration illustration={error404} />;
}`,
  },
  {
    id: "size",
    title: "Choose a size",
    body: `Every scene is drawn on the same 480 × 360 canvas, so pictures line up on a page. An illustration is 480px wide by default and never wider than its container, so it shrinks on small screens. The height follows the 4:3 canvas.

Set \`size\` to a number in pixels or to a CSS length, such as \`"20rem"\`. In HTML, \`data-ok-size\` needs the illustrations script. Without the script, set a \`width\` attribute or a CSS \`width\` instead.`,
    html: `<svg data-ok-illustration="empty-content" data-ok-color="primary" data-ok-size="240" aria-hidden="true"></svg>

<!-- Without the illustrations script -->
<svg data-ok-illustration="empty-content" data-ok-color="primary" width="240" viewBox="0 0 480 360" focusable="false" aria-hidden="true">
  <path d="M86 122C118 62 200 30 282 44c80 14 136 64 142 136 6 72-46 124-134 136-86 12-176-4-214-62-36-56-24-96 10-132Z" opacity="0.08" data-ok-tone="main" />
  <ellipse cx="240" cy="320" rx="190" ry="12" data-ok-tone="shadow" />
  <g transform="rotate(-10 240 96)">
    <rect x="204" y="40" width="72" height="92" rx="8" data-ok-tone="paper" />
    <rect x="204" y="40" width="72" height="92" rx="8" data-ok-tone="outline" data-ok-stroke stroke-width="3" />
    <path d="M218 64h44M218 80h32M218 96h40" data-ok-tone="line" data-ok-stroke stroke-width="6" />
  </g>
  <path d="M150 168h180l-14 26H164Z" data-ok-tone="darker" />
  <path d="M150 168 98 136l14 52 38 10Z" data-ok-tone="light" />
  <path d="M330 168l52-32-14 52-38 10Z" data-ok-tone="light" />
  <path d="M150 180h180v108a12 12 0 0 1-12 12H162a12 12 0 0 1-12-12Z" data-ok-tone="main" />
  <path d="M240 180h90v108a12 12 0 0 1-12 12h-78Z" data-ok-tone="dark" />
  <rect x="214" y="210" width="52" height="10" rx="5" opacity="0.6" data-ok-tone="lighter" />
  <path d="M110 82Q110 92 120 92Q110 92 110 102Q110 92 100 92Q110 92 110 82Z" data-ok-tone="accent-main" />
  <path d="M380 92Q380 100 388 100Q380 100 380 108Q380 100 372 100Q380 100 380 92Z" data-ok-tone="light" />
  <circle cx="410" cy="240" r="5" data-ok-tone="accent-light" />
  <circle cx="80" cy="240" r="4" data-ok-tone="light" />
</svg>`,
    react: `import { emptyContent } from "@owlky/core/illustrations";
import { Illustration } from "@owlky/react";

export function NoOrders() {
  return <Illustration illustration={emptyContent} size={240} />;
}`,
  },
  {
    id: "color",
    title: "Change colors and themes",
    body: `Each shape has a \`data-ok-tone\` attribute:

- **Brand tones:** \`lighter\`, \`light\`, \`main\`, \`dark\` and \`darker\` take the palette that \`color\` names. The default is \`primary\`, so they also follow the theme's preset.
- **Accent tones:** \`accent-light\`, \`accent-main\` and \`accent-dark\` use the warning palette for stars and highlights.
- **Neutral tones:** \`paper\`, \`neutral\`, \`outline\`, \`line\`, \`shadow\`, \`shade\` and \`ink\` follow the color scheme, so paper stays paper in dark mode.
- **Fixed tones:** \`white\`, \`grey-300\`, \`grey-500\`, \`grey-600\` and the skin tones \`skin-light\`, \`skin-medium\` and \`skin-deep\`.

To recolor one illustration, set \`color\` to \`secondary\`, \`info\`, \`success\`, \`warning\` or \`error\`. To recolor every illustration, change the palette with your theme, or set the skin tones \`--ok-illustration-skin-light\`, \`--ok-illustration-skin-medium\` and \`--ok-illustration-skin-deep\`. Inside a \`data-ok-theme\` or \`data-ok-preset\` scope, an illustration takes that scope's colors.`,
    html: `<svg data-ok-illustration="sign-in" data-ok-color="info" aria-hidden="true"></svg>

<!-- A dark section of a light page -->
<section data-ok-theme="dark">
  <svg data-ok-illustration="sign-in" data-ok-color="primary" aria-hidden="true"></svg>
</section>`,
    react: `import { signIn } from "@owlky/core/illustrations";
import { Illustration } from "@owlky/react";

export function SignInArt() {
  return <Illustration illustration={signIn} color="info" />;
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "In React, options are props of `Illustration`. In HTML, they are attributes of the `svg` element.",
  },
  {
    id: "bundles",
    title: "Load only the illustrations you need",
    body: `In React and in bundled HTML apps, import the illustrations you use from \`@owlky/core/illustrations\`. Each one adds about 0.7 to 1.6 kB gzip to your bundle. Pictures that share parts, such as people and sparkles, share that code. The \`illustrations\` export lists the whole set: import it only for a catalog.

\`owlky-illustrations.js\` and \`@owlky/html/illustrations\` register every illustration, about 10 kB gzip. To ship fewer, register your own set with \`createIllustration\`.`,
    html: `<script type="module">
  import { createIllustration, getRuntime } from "@owlky/html";
  import { error404, error500 } from "@owlky/core/illustrations";

  // Only these two pictures are bundled.
  getRuntime().register(createIllustration([error404, error500])).start();
</script>`,
    react: `// Only the illustrations you import are bundled.
import { error404, error500 } from "@owlky/core/illustrations";
import { Illustration } from "@owlky/react";

export function ErrorArt({ status }: { status: number }) {
  return <Illustration illustration={status === 404 ? error404 : error500} />;
}`,
  },
  {
    id: "custom",
    title: "Replace an illustration with your own",
    body: `Components that show an illustration accept your own content. For example, the upload's drop zone shows the \`upload\` illustration. Its \`placeholder\` replaces the illustration and the texts.

To keep your own art theme-aware, draw it as inline SVG with \`data-ok-tone\` on each shape inside an \`svg[data-ok-illustration]\` root, or describe it as data for \`Illustration\`. To match the style of the set, compose your data from the parts that \`@owlky/core/illustrations\` exports, such as \`backdrop()\`, \`groundShadow()\`, \`sparkle()\` and \`person()\`. They draw the same backdrop, shadow, sparkles and people as the built-in pictures. A picture in an \`<img>\` element, such as a file from an illustration library kept in your app, works too, but it keeps its own colors in every theme.`,
    html: `<div data-ok-upload-placeholder>
  <svg data-ok-illustration="my-art" data-ok-color="primary" aria-hidden="true" viewBox="0 0 480 360">
    <!-- The backdrop, ground shadow and sparkle of the set, as in the built-in snippets -->
    <path data-ok-tone="main" d="M86 122C118 62 200 30 282 44c80 14 136 64 142 136 6 72-46 124-134 136-86 12-176-4-214-62-36-56-24-96 10-132Z" opacity="0.08" />
    <ellipse data-ok-tone="shadow" cx="240" cy="320" rx="190" ry="12" />
    <rect data-ok-tone="main" x="180" y="120" width="120" height="180" rx="24" />
    <path data-ok-tone="accent-main" d="M120 88Q120 100 132 100Q120 100 120 112Q120 100 108 100Q120 100 120 88Z" />
  </svg>
  <div data-ok-upload-placeholder-text>
    <span data-ok-upload-title>Drop or select a file</span>
  </div>
</div>`,
    react: `import type { Illustration as IllustrationData } from "@owlky/core";
import { backdrop, groundShadow, sparkle } from "@owlky/core/illustrations";
import { Illustration, Upload } from "@owlky/react";

// The parts draw the backdrop, ground shadow and sparkles of the set around your own shapes.
const myArt: IllustrationData = {
  name: "my-art",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    { tag: "rect", tone: "main", attrs: { x: 180, y: 120, width: 120, height: 180, rx: 24 } },
    sparkle(120, 100, 12),
  ],
};

export function Attachments() {
  return (
    <Upload
      name="files"
      aria-label="Attachments"
      placeholder={<Illustration illustration={myArt} size={160} />}
    />
  );
}`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- **Decorative by default:** most illustrations repeat what the text next to them says. They render \`aria-hidden="true"\`, so screen readers skip them.
- **Meaningful pictures** need a name. In React, set \`title\`. In HTML, set \`role="img"\` and \`aria-label\`.
- **No focus stop:** illustrations render \`focusable="false"\` and never take keyboard focus.
- **No text in pictures:** the illustrations contain no words. Put headings and messages in real text next to them.
- **Contrast:** decorative art has no contrast requirement. If a picture carries meaning, check that its key shapes reach a contrast ratio of at least 3:1 with the background (WCAG 2.2, success criterion 1.4.11).`,
    html: `<!-- Decorative: the heading says the same thing -->
<svg data-ok-illustration="error-404" data-ok-color="primary" aria-hidden="true"></svg>
<h1>Page not found</h1>

<!-- Meaningful on its own: give it a name -->
<svg data-ok-illustration="order-complete" data-ok-color="primary" role="img" aria-label="Order complete"></svg>`,
    react: `import { error404, orderComplete } from "@owlky/core/illustrations";
import { Illustration } from "@owlky/react";

export function Pictures() {
  return (
    <>
      {/* Decorative: the heading says the same thing */}
      <Illustration illustration={error404} />
      <h1>Page not found</h1>

      {/* Meaningful on its own: give it a name */}
      <Illustration illustration={orderComplete} title="Order complete" />
    </>
  );
}`,
  },
  {
    id: "credits",
    title: "Credits",
    body: "The illustrations are original artwork drawn for Owlky in a flat style. They are released under the MIT license, like the rest of the library.",
  },
  apiReferenceSection(illustrationApi),
];

const MY_ART: IllustrationData = {
  name: "my-art",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    { tag: "rect", tone: "main", attrs: { x: 180, y: 120, width: 120, height: 180, rx: 24 } },
    sparkle(120, 100, 12),
  ],
};

const SIZES = [120, 180, 240];
const COLORS = ["primary", "info", "warning", "error"] as const;

const PREVIEWS = {
  overview: () => (
    <Preview>
      {[error404, emptyContent, signIn].map((picture) => (
        <Illustration key={picture.name} illustration={picture} size={200} />
      ))}
    </Preview>
  ),
  size: () => (
    <Preview className="items-end! gap-6!">
      {SIZES.map((size) => (
        <span key={size} className="flex flex-col items-center gap-2">
          <Illustration illustration={emptyContent} size={size} />
          <Caption>{size}px</Caption>
        </span>
      ))}
    </Preview>
  ),
  color: () => (
    <Preview className="gap-6!">
      {COLORS.map((color) => (
        <span key={color} className="flex flex-col items-center gap-2">
          <Illustration illustration={signIn} color={color} size={160} />
          <Caption>{color}</Caption>
        </span>
      ))}
    </Preview>
  ),
  options: () => <OptionsTable schema={illustrationOptions} />,
  custom: () => (
    <Preview>
      <Upload
        name="docs-illustration-upload"
        aria-label="Attachments"
        placeholder={<Illustration illustration={MY_ART} size={160} />}
      />
    </Preview>
  ),
};

/** Illustrations docs page (ADR-0019, ADR-0041). */
export function IllustrationsDocs() {
  return <GuideDocs sections={illustrationsSections} previews={PREVIEWS} />;
}
