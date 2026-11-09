import { linkOptions } from "@owlky/core";
import { Link, Typography } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const LINK = "data-ok-typography data-ok-link";

export const linkSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A link takes the reader to another page or to another place on the same page. It is a Typography element with link styles: by default it keeps the font of the text around it, uses the primary color and is always underlined, so readers can tell it apart from the text without relying on color. It needs no JavaScript.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<p data-ok-typography data-ok-variant="body1">
  Read the <a href="/docs/setup" ${LINK} data-ok-variant="inherit" data-ok-color="primary" data-ok-underline="always">setup guide</a> before you start.
</p>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Link, Typography } from "@owlky/react";

export function Setup() {
  return (
    <Typography>
      Read the <Link href="/docs/setup">setup guide</Link> before you start.
    </Typography>
  );
}`,
  },
  {
    id: "style",
    title: "Set the color, style and underline",
    body: `Set \`color\` to a palette color, such as \`primary\` (the default) or \`error\`, to a text tone such as \`textSecondary\`, or to \`inherit\` to use the color of the text around the link. Set \`variant\` to a step of the type scale, such as \`body2\`. The default, \`inherit\`, keeps the surrounding font.

Set \`underline\` to \`always\` (the default), \`hover\` or \`none\`. Keep \`always\` for links inside running text: without an underline, a link in a sentence is told apart by its color only, which some readers can't see. Use \`hover\` or \`none\` where the context already shows that the text is a link, such as navigation menus and breadcrumbs.`,
    html: `<nav aria-label="Footer">
  <a href="/privacy" ${LINK} data-ok-variant="body2" data-ok-color="inherit" data-ok-underline="hover">Privacy</a>
  <a href="/terms" ${LINK} data-ok-variant="body2" data-ok-color="inherit" data-ok-underline="hover">Terms</a>
</nav>`,
    react: `import { Link } from "@owlky/react";

export function Footer() {
  return (
    <nav aria-label="Footer">
      <Link href="/privacy" variant="body2" color="inherit" underline="hover">
        Privacy
      </Link>
      <Link href="/terms" variant="body2" color="inherit" underline="hover">
        Terms
      </Link>
    </nav>
  );
}`,
  },
  {
    id: "new-tab",
    title: "Open a link in a new tab",
    body: `Add \`target="_blank"\` only when readers need to keep the current page, such as a form in progress. In React, the link then always gets \`rel="noopener noreferrer"\`, so the new page can't control the current one through \`window.opener\` and gets no referrer. Tokens that you pass in \`rel\` are kept. In HTML, write \`rel="noopener noreferrer"\` yourself. Tell screen reader users that the link opens a new tab, for example in its \`aria-label\`.

Owlky passes \`href\` to the element as you write it: validate addresses that come from users before you render them.`,
    html: `<a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer" aria-label="WCAG overview (opens in a new tab)" ${LINK} data-ok-variant="inherit" data-ok-color="primary" data-ok-underline="always">WCAG overview</a>`,
    react: `import { Link } from "@owlky/react";

export function Standards() {
  return (
    <Link
      href="https://www.w3.org/WAI/standards-guidelines/wcag/"
      target="_blank"
      aria-label="WCAG overview (opens in a new tab)"
    >
      WCAG overview
    </Link>
  );
}`,
  },
  {
    id: "button",
    title: "Use a link style for an action",
    body: `When the text runs an action instead of going to an address, render a button: screen readers announce it as a button, and Space activates it. In React, a \`Link\` without \`href\` and without \`component\` renders \`<button type="button">\`. You can also pass \`component="button"\`. In HTML, write a \`button\` with the same attributes.`,
    html: `<button type="button" ${LINK} data-ok-variant="body2" data-ok-color="primary" data-ok-underline="always">Show more details</button>`,
    react: `import { Link } from "@owlky/react";

export function MoreDetails() {
  return (
    <Link variant="body2" onClick={() => console.info("More details")}>
      Show more details
    </Link>
  );
}`,
  },
  {
    id: "routing",
    title: "Use a routing library",
    body: "To navigate on the client without a full page load, pass your router's link component in `component`, with the props it needs, such as `to`. Link adds its attributes to that component, which must pass them, and its `ref`, to the element it renders. In HTML, the router renders the `a` element: add the attributes to it.",
    react: `import { Link } from "@owlky/react";
import type { ComponentProps } from "react";

// Stands in for a router's link component, such as the one of React Router.
function RouterLink({ to, ...props }: { to: string } & ComponentProps<"a">) {
  return <a href={to} {...props} />;
}

export function Settings() {
  return (
    <Link component={RouterLink} to="/settings">
      Settings
    </Link>
  );
}`,
    html: `<!-- The router renders the element; add the link attributes to it. -->
<a href="/settings" ${LINK} data-ok-variant="inherit" data-ok-color="primary" data-ok-underline="always">Settings</a>`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. A link also takes the Typography options `align`, `gutterBottom` and `noWrap`. In HTML, write every attribute, including `data-ok-typography`: values that aren't listed get no link styles.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content, the element and the destination. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: "Link has no events or methods of its own. Use the element's native events, such as `click`.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Links and link buttons are native elements, so they keep the browser's keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Write link text that says where the link goes, such as "Download the 2025 report". Avoid "click here" and "read more".
- Keep \`underline="always"\` for links inside text. Color alone doesn't tell a link apart from the text around it.
- Palette colors use their main tone, which can be below a contrast ratio of 4.5:1 for small text. Use \`textPrimary\`, \`textSecondary\` or \`inherit\` on neutral text when you need that ratio.
- A focused link shows a 2px focus ring in the primary text color.
- Use a button, not a link without \`href\`, for actions: a link without \`href\` can't take focus.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview className="block!">
      <Typography>
        {"Read the "}
        <Link href="#docs-setup">setup guide</Link>
        {" before you start."}
      </Typography>
    </Preview>
  ),
  style: () => (
    <Preview>
      <nav aria-label="Footer" className="flex gap-4">
        <Link href="#docs-privacy" variant="body2" color="inherit" underline="hover">
          Privacy
        </Link>
        <Link href="#docs-terms" variant="body2" color="inherit" underline="hover">
          Terms
        </Link>
      </nav>
    </Preview>
  ),
  "new-tab": () => (
    <Preview>
      <Link
        href="https://www.w3.org/WAI/standards-guidelines/wcag/"
        target="_blank"
        aria-label="WCAG overview (opens in a new tab)"
      >
        WCAG overview
      </Link>
    </Preview>
  ),
  button: () => (
    <Preview>
      <Link variant="body2">Show more details</Link>
    </Preview>
  ),
  routing: () => (
    <Preview>
      <Link href="#docs-settings">Settings</Link>
    </Preview>
  ),
  options: () => <OptionsTable schema={linkOptions} />,
  props: () => (
    <PropsTable
      label="Link content props"
      rows={[
        {
          react: "children",
          type: "ReactNode",
          description: "The link text.",
        },
        {
          react: "href",
          type: "string",
          description:
            "The destination, passed to the element as given. Without `href` and `component`, the link renders a button.",
        },
        {
          react: "target / rel",
          type: "string",
          description:
            'Where the link opens and its relationship. With `target="_blank"`, `rel` always includes `noopener noreferrer`.',
        },
        {
          react: "component",
          type: "ElementType",
          description:
            "The element (or component) to render, such as `button` or a router's link. In HTML, write that element.",
        },
        {
          react: "ref",
          type: "HTMLElement",
          description: "The rendered element.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the link."],
        ["Enter", "Follows the link, or activates a link button."],
        ["Space", "Activates a link button."],
      ]}
    />
  ),
};

/** Link docs page (ADR-0019). */
export function LinkDocs() {
  return <GuideDocs sections={linkSections} previews={PREVIEWS} />;
}
