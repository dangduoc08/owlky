import type { PageSection } from "./types.js";

/* Home (ADR-0040): benefits first, then how it works and where to go next. */

export const HOME_TAGLINE =
  "An accessible UI component library for dashboards and web apps, in plain HTML or through framework packages.";

export const homeSections: PageSection[] = [
  {
    id: "benefits",
    title: "Why Owlky",
    body: `- **One design system everywhere.** Every component has a single markup structure, a single stylesheet and a single set of design tokens. Use it in plain HTML or through a framework package, and it looks and behaves the same.
- **Accessible by default.** Components follow the WAI-ARIA patterns, work with the keyboard and meet WCAG 2.2 level AA.
- **Easy to theme.** Every color, size and shadow is a CSS variable. Switch to dark mode, change the primary color or bring your own brand with a few lines of CSS.
- **Built on the platform.** Components use native elements, such as \`<button>\` and \`<dialog>\`, so browser features like form submission, find-in-page and focus handling keep working.`,
  },
  {
    id: "how",
    title: "How it works",
    body: `Each component is HTML with \`data-ok-*\` attributes, styled by one prebuilt stylesheet. Interactive components share one behavior core: on a plain HTML page, a small script connects it to your markup, and framework packages render the same markup with the API you expect from your framework.

This website is built with Owlky too. Use the **Theme**, **Preset** and **Font** menus in the header to see every page change.`,
  },
  {
    id: "start",
    title: "Get started",
    body: `- [Get started](/get-started/) shows how to add Owlky from a CDN, from npm, with React and with Tailwind CSS.
- [Colors](/foundations/colors/) explains the palette and the theme colors.
- [Button](/components/button/) is a complete component guide, with live examples.`,
  },
];
