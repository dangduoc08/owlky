import { typographyOptions } from "@owlky/core";
import { Typography } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

export const typographySections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "Typography sets text in one step of the type scale, such as a page heading, body text or a caption. Each variant reads its font, size, weight and line height from the typography tokens, so the text follows the theme, the **Font** menu in the toolbar and the responsive heading sizes. It needs no JavaScript. The type scale itself is described in **Foundations › Typography**.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<h4 data-ok-typography data-ok-variant="h4" data-ok-gutter-bottom>Monthly report</h4>
<p data-ok-typography data-ok-variant="body1">Sales grew in every region this month.</p>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Typography } from "@owlky/react";

export function Report() {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Monthly report
      </Typography>
      <Typography>Sales grew in every region this month.</Typography>
    </>
  );
}`,
  },
  {
    id: "variants",
    title: "Choose a variant",
    body: `Set \`variant\` to a step of the type scale: \`h1\` to \`h6\` for headings, \`subtitle1\` and \`subtitle2\` for short emphasized lines, \`body1\` (the default) and \`body2\` for running text, \`caption\` and \`overline\` for small labels, and \`button\` for text that looks like a button label. Use \`inherit\` to keep the parent's font, for example inside a link.

Add \`gutterBottom\` for a bottom margin of 0.35em. The margin scales with the variant, so headings get more space than captions.`,
    html: `<h6 data-ok-typography data-ok-variant="subtitle2">Last updated</h6>
<span data-ok-typography data-ok-variant="caption">2 hours ago</span>`,
    react: `import { Typography } from "@owlky/react";

export function Updated() {
  return (
    <>
      <Typography variant="subtitle2">Last updated</Typography>
      <Typography variant="caption">2 hours ago</Typography>
    </>
  );
}`,
  },
  {
    id: "element",
    title: "Change the semantic element",
    body: `The style and the element are separate, so the heading levels of your page can follow its outline. In React, each variant renders a default element: \`h1\` to \`h6\` for headings, \`h6\` for subtitles, \`p\` for body text and \`span\` for the rest. Pass \`component\` to render another element once, or \`variantMapping\` to change the element of some variants. In HTML, write the element you need and add the attributes.`,
    html: `<h2 data-ok-typography data-ok-variant="h4">Recent orders</h2>
<label data-ok-typography data-ok-variant="caption" for="search">Search orders</label>
<input id="search" type="search">`,
    react: `import { Typography } from "@owlky/react";

export function Orders() {
  return (
    <>
      <Typography variant="h4" component="h2">
        Recent orders
      </Typography>
      <Typography variant="caption" component="label" htmlFor="search">
        Search orders
      </Typography>
      <input id="search" type="search" />
    </>
  );
}`,
  },
  {
    id: "color",
    title: "Set the color and alignment",
    body: `Without \`color\`, the text keeps its parent's color. Set \`color\` to a palette color, such as \`primary\` or \`error\`, for its main tone, or to \`textPrimary\`, \`textSecondary\` or \`textDisabled\` for the text tones of the theme. Set \`align\` to \`left\`, \`center\`, \`right\` or \`justify\`.`,
    html: `<p data-ok-typography data-ok-variant="body2" data-ok-color="textSecondary" data-ok-align="center">No orders yet</p>`,
    react: `import { Typography } from "@owlky/react";

export function Empty() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      No orders yet
    </Typography>
  );
}`,
  },
  {
    id: "no-wrap",
    title: "Keep text on one line",
    body: "Add `noWrap` to keep the text on one line: text that doesn't fit ends with an ellipsis. The element needs a width, so use a block element or set one. The full text stays in the DOM, so screen readers read all of it.",
    html: `<p data-ok-typography data-ok-variant="body2" data-ok-no-wrap>A file name that is far too long to fit.pdf</p>`,
    react: `import { Typography } from "@owlky/react";

export function FileName() {
  return (
    <Typography variant="body2" noWrap>
      A file name that is far too long to fit.pdf
    </Typography>
  );
}`,
  },
  {
    id: "tokens",
    title: "Use the type scale without the component",
    body: "When you can't add the attributes, such as for text that another library renders, read the same tokens in CSS: `--ok-typography-<variant>-font-family`, `-font-size`, `-font-weight`, `-line-height` and `-text-transform`. With Tailwind CSS, the `text-<variant>` utilities set the size, weight and line height.",
    html: `<style>
  .chart-title {
    font-family: var(--ok-typography-h6-font-family);
    font-size: var(--ok-typography-h6-font-size);
    font-weight: var(--ok-typography-h6-font-weight);
    line-height: var(--ok-typography-h6-line-height);
  }
</style>
<div class="chart-title">Visitors</div>`,
    react: `export function ChartTitle() {
  return <div className="text-h6 font-[family-name:var(--ok-typography-h6-font-family)]">Visitors</div>;
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. In HTML, a variant that isn't listed gets no type scale styles, so the text keeps its parent's font.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and the element. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: "Typography has no events or methods.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Typography doesn't take focus. Interactive elements that you render through `component`, such as a `label`, keep their native keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Pick the element for the page outline and the variant for the look: don't skip heading levels to get a smaller heading.
- Font sizes are in \`rem\`, so text scales with the browser's font size setting.
- The text tones \`textPrimary\` and \`textSecondary\` reach a contrast ratio of at least 4.5:1 on the theme's backgrounds. Palette colors use their main tone, which can be lower for small text, such as \`warning\` on white: keep them for large or short text.
- \`textDisabled\` is for inactive content only.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview className="block!">
      <Typography variant="h4" gutterBottom>
        Monthly report
      </Typography>
      <Typography>Sales grew in every region this month.</Typography>
    </Preview>
  ),
  variants: () => (
    <Preview className="block!">
      <Typography variant="subtitle2">Last updated</Typography>
      <Typography variant="caption">2 hours ago</Typography>
    </Preview>
  ),
  element: () => (
    <Preview className="flex-col items-start!">
      <Typography variant="h4" component="h2">
        Recent orders
      </Typography>
      <Typography variant="caption" component="label" htmlFor="typography-docs-search">
        Search orders
      </Typography>
      <input id="typography-docs-search" type="search" className="border border-current px-2" />
    </Preview>
  ),
  color: () => (
    <Preview className="block!">
      <Typography variant="body2" color="textSecondary" align="center">
        No orders yet
      </Typography>
    </Preview>
  ),
  "no-wrap": () => (
    <Preview className="block! max-w-60">
      <Typography variant="body2" noWrap>
        A file name that is far too long to fit.pdf
      </Typography>
    </Preview>
  ),
  tokens: () => (
    <Preview>
      <div className="text-h6 font-[family-name:var(--ok-typography-h6-font-family)]">Visitors</div>
    </Preview>
  ),
  options: () => <OptionsTable schema={typographyOptions} />,
  props: () => (
    <PropsTable
      label="Typography content props"
      rows={[
        {
          react: "children",
          type: "ReactNode",
          description: "The text.",
        },
        {
          react: "component",
          type: "ElementType",
          description:
            "The element (or component) to render, whatever the variant. In HTML, write that element.",
        },
        {
          react: "variantMapping",
          type: "Partial<Record<variant, ElementType>>",
          description:
            "The element per variant, over the default mapping (`h1`–`h6`, subtitles `h6`, body `p`, others `span`). In HTML, write that element.",
        },
        {
          react: "ref",
          type: "HTMLElement",
          description: "The rendered element.",
        },
      ]}
    />
  ),
};

/** Typography docs page (ADR-0019). */
export function TypographyDocs() {
  return <GuideDocs sections={typographySections} previews={PREVIEWS} />;
}
