import { breadcrumbsOptions } from "@owlky/core";
import breadcrumbsApi from "@owlky/docs-content/api/breadcrumbs.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Breadcrumbs, BreadcrumbsDot, Link } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { DemoIcon } from "../shared/demo-icon.js";

export const breadcrumbsSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: 'Breadcrumbs show where the current page sits in your site and link back to each level above it. They are a `nav` landmark with an ordered list of links: Link components in the parent\'s color, underlined on hover (`color="inherit"`, `underline="hover"`). The last item is the current page: it isn\'t a link, and it carries `aria-current="page"`. Separators go between the items and screen readers skip them.',
    html: `<!-- Load once per page: the styles and the runtime (for long trails) -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<nav data-ok-breadcrumbs aria-label="breadcrumb">
  <ol data-ok-breadcrumbs-list>
    <li data-ok-breadcrumbs-item><a href="/" data-ok-typography data-ok-link data-ok-variant="inherit" data-ok-color="inherit" data-ok-underline="hover">Home</a></li>
    <li data-ok-breadcrumbs-separator aria-hidden="true">/</li>
    <li data-ok-breadcrumbs-item><a href="/catalog" data-ok-typography data-ok-link data-ok-variant="inherit" data-ok-color="inherit" data-ok-underline="hover">Catalog</a></li>
    <li data-ok-breadcrumbs-separator aria-hidden="true">/</li>
    <li data-ok-breadcrumbs-item><span aria-current="page">Accessories</span></li>
  </ol>
</nav>`,
    react: `import { Breadcrumbs, Link } from "@owlky/react";

export function Trail() {
  return (
    <Breadcrumbs>
      <Link href="/" color="inherit" underline="hover">
        Home
      </Link>
      <Link href="/catalog" color="inherit" underline="hover">
        Catalog
      </Link>
      <span aria-current="page">Accessories</span>
    </Breadcrumbs>
  );
}`,
  },
  {
    id: "icons",
    title: "Add icons and change the separator",
    body: 'Put a decorative `svg` before the text of an item. Icons are 20px and follow the item\'s color. In React, every child of `Breadcrumbs` becomes an item and the separator goes between them. Pass `separator` to replace the slash with text, an icon or `<BreadcrumbsDot />`. In HTML, write each separator in its own `li` with `aria-hidden="true"`, and use `<span data-ok-breadcrumbs-dot></span>` for a dot.',
    html: `<li data-ok-breadcrumbs-item>
  <a href="/" data-ok-typography data-ok-link data-ok-variant="inherit" data-ok-color="inherit" data-ok-underline="hover"><svg aria-hidden="true" viewBox="0 0 24 24">…</svg>Home</a>
</li>
<li data-ok-breadcrumbs-separator aria-hidden="true"><span data-ok-breadcrumbs-dot></span></li>`,
    react: `import { Breadcrumbs, BreadcrumbsDot, Link } from "@owlky/react";

export function Trail() {
  return (
    <Breadcrumbs separator={<BreadcrumbsDot />}>
      <Link href="/" color="inherit" underline="hover">
        <HomeIcon />
        Home
      </Link>
      <span aria-current="page">Desk lamp</span>
    </Breadcrumbs>
  );
}`,
  },
  {
    id: "collapse",
    title: "Collapse long trails",
    body: 'A trail with more than `maxItems` items (8 by default) collapses. It keeps `itemsBeforeCollapse` items at the start and `itemsAfterCollapse` at the end (1 each by default), and replaces the others with a button. Pressing the button shows the whole trail and moves focus to the first item that was hidden. In HTML, the runtime collapses the trail when it starts. `data-ok-expand-text` names the button (default "Show path").',
    html: `<nav data-ok-breadcrumbs aria-label="breadcrumb" data-ok-max-items="3" data-ok-expand-text="Show the full path">
  <ol data-ok-breadcrumbs-list>…</ol>
</nav>`,
    react: `<Breadcrumbs maxItems={3} expandText="Show the full path">
  <Link href="/" color="inherit" underline="hover">Home</Link>
  <Link href="/catalog" color="inherit" underline="hover">Catalog</Link>
  <Link href="/catalog/lighting" color="inherit" underline="hover">Lighting</Link>
  <Link href="/catalog/lighting/desk" color="inherit" underline="hover">Desk</Link>
  <span aria-current="page">Desk lamp</span>
</Breadcrumbs>`,
  },
  {
    id: "wrap",
    title: "Fit narrow screens",
    body: "The trail wraps onto more lines when it doesn't fit, with 4px between lines and 16px between items. Long item text wraps inside the item instead of overflowing. On phones, a collapsed trail keeps the context short.",
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't valid fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:breadcrumbs:expand\`** (cancelable) fires on the \`nav\` before a collapsed trail expands.
- **Instance:** \`runtime.get(element, "breadcrumbs")\` returns \`{ collapsed, expand() }\`.
- **React:** the expanded state stays inside \`Breadcrumbs\`. A new \`key\` collapses the trail again.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Breadcrumbs use native links and a native button, so they need no extra keys.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The \`nav\` is a landmark. Its default name is "breadcrumb". With several trails on a page, give each one its own \`aria-label\`.
- Mark the current page with \`aria-current="page"\` and leave it out of the links.
- Separators are hidden from screen readers. Decorative icons need \`aria-hidden="true"\`.
- Item text uses the secondary text color and the current page the primary one, both with a contrast ratio of at least 4.5:1.
- Links and the expand button show a focus ring for keyboard users. The expand button is at least 24px tall.`,
  },
  apiReferenceSection(breadcrumbsApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Breadcrumbs aria-label="Preview breadcrumb">
        <Link href="#home" color="inherit" underline="hover">
          Home
        </Link>
        <Link href="#catalog" color="inherit" underline="hover">
          Catalog
        </Link>
        <span aria-current="page">Accessories</span>
      </Breadcrumbs>
    </Preview>
  ),
  icons: () => (
    <Preview>
      <Breadcrumbs separator={<BreadcrumbsDot />} aria-label="Breadcrumb with icons">
        <Link href="#home" color="inherit" underline="hover">
          <DemoIcon name="home" />
          Home
        </Link>
        <Link href="#products" color="inherit" underline="hover">
          <DemoIcon name="cube" />
          Products
        </Link>
        <span aria-current="page">Desk lamp</span>
      </Breadcrumbs>
    </Preview>
  ),
  collapse: () => (
    <Preview>
      <Breadcrumbs maxItems={3} aria-label="Collapsed breadcrumb">
        <Link href="#home" color="inherit" underline="hover">
          Home
        </Link>
        <Link href="#catalog" color="inherit" underline="hover">
          Catalog
        </Link>
        <Link href="#lighting" color="inherit" underline="hover">
          Lighting
        </Link>
        <Link href="#desk" color="inherit" underline="hover">
          Desk
        </Link>
        <span aria-current="page">Desk lamp</span>
      </Breadcrumbs>
    </Preview>
  ),
  options: () => <OptionsTable schema={breadcrumbsOptions} />,
  props: () => (
    <PropsTable
      label="Breadcrumbs content props"
      rows={[
        {
          react: "children",
          html: "li[data-ok-breadcrumbs-item]",
          type: "ReactNode",
          description: "Links (`a`) and the current page (`span[aria-current]`), in order.",
        },
        {
          react: "separator",
          html: "li[data-ok-breadcrumbs-separator]",
          type: "ReactNode",
          description: "Shown between items. Default `/`.",
        },
        {
          react: "expandText",
          html: "data-ok-expand-text",
          type: "string",
          description: 'Name of the expand button. Default "Show path".',
        },
        {
          react: "aria-label",
          html: "aria-label",
          type: "string",
          description: 'Name of the landmark. Default "breadcrumb".',
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the next link or to the expand button."],
        ["Enter", "Follows the focused link, or expands a collapsed trail."],
        ["Space", "Expands a collapsed trail (on the expand button)."],
      ]}
    />
  ),
};

/** Breadcrumbs docs page (ADR-0019). */
export function BreadcrumbsDocs() {
  return <GuideDocs sections={breadcrumbsSections} previews={PREVIEWS} />;
}
