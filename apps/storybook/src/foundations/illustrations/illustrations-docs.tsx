import { type Illustration as IllustrationData, illustrationOptions } from "@owlky/core";
import { emptyContent, error404, signIn } from "@owlky/core/illustrations";
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

The stories in the sidebar show the whole set by category.`,
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
<svg data-ok-illustration="empty-content" data-ok-color="primary" width="240" aria-hidden="true" viewBox="0 0 480 360">…</svg>`,
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
    body: `In React and in bundled HTML apps, import the illustrations you use from \`@owlky/core/illustrations\`. Each one adds about 1 kB gzip or less to your bundle. The \`illustrations\` export lists the whole set: import it only for a catalog.

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

To keep your own art theme-aware, draw it as inline SVG with \`data-ok-tone\` on each shape inside an \`svg[data-ok-illustration]\` root, or describe it as data for \`Illustration\`. A picture in an \`<img>\` element, such as a file from an illustration library kept in your app, works too, but it keeps its own colors in every theme.`,
    html: `<div data-ok-upload-placeholder>
  <svg data-ok-illustration="my-art" data-ok-color="primary" aria-hidden="true" viewBox="0 0 480 360">
    <circle data-ok-tone="lighter" cx="240" cy="180" r="120" />
    <rect data-ok-tone="main" x="180" y="120" width="120" height="120" rx="24" />
  </svg>
  <div data-ok-upload-placeholder-text>…</div>
</div>`,
    react: `import type { Illustration as IllustrationData } from "@owlky/core";
import { Illustration, Upload } from "@owlky/react";

const myArt: IllustrationData = {
  name: "my-art",
  viewBox: "0 0 480 360",
  nodes: [
    { tag: "circle", tone: "lighter", attrs: { cx: 240, cy: 180, r: 120 } },
    { tag: "rect", tone: "main", attrs: { x: 180, y: 120, width: 120, height: 120, rx: 24 } },
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
    body: "The illustrations are original artwork drawn for Owlky in the flat style of the Minimal dashboard. They are released under the MIT license, like the rest of the library.",
  },
];

const MY_ART: IllustrationData = {
  name: "my-art",
  viewBox: "0 0 480 360",
  nodes: [
    { tag: "circle", tone: "lighter", attrs: { cx: 240, cy: 180, r: 120 } },
    { tag: "rect", tone: "main", attrs: { x: 180, y: 120, width: 120, height: 120, rx: 24 } },
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

/** Illustrations docs page (ADR-0019, ADR-0040). */
export function IllustrationsDocs() {
  return <GuideDocs sections={illustrationsSections} previews={PREVIEWS} />;
}
