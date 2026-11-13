import type { PageSection } from "./types.js";

/*
 * Home (ADR-0040). `homeSections` is the page's Markdown copy (llms.txt, `/index.md`); the landing
 * page itself renders `LANDING` (src/site/landing/). Facts that change (component and test
 * counts) are counted by scripts/prepare.mjs, never written here.
 */

export const HOME_TAGLINE =
  "An accessible UI component library for dashboards and web apps, in plain HTML or through framework packages.";

export const homeSections: PageSection[] = [
  {
    id: "benefits",
    title: "Why Owlky",
    body: `- **One design system everywhere.** Every component has a single markup structure, a single stylesheet and a single set of design tokens. Use it in plain HTML or through a framework package, and it looks and behaves the same.
- **Accessible by default.** Components follow the WAI-ARIA patterns, work with the keyboard and meet WCAG 2.2 level AA.
- **Themes and tokens.** Every color, radius and shadow is a CSS variable. Switch to dark mode, or bring your own brand color and font.
- **Large components included.** A data grid, charts, date and time pickers, a rich text editor, a code editor and maps use the same tokens as the buttons.
- **Ready for AI coding agents.** The hosted Owlky MCP server at \`owlky.com/mcp\` gives agents the exact options, examples and tokens, and checks their markup. Every page is also available as Markdown.
- **Built on the platform.** Components use native elements, such as \`<button>\` and \`<dialog>\`, so browser features like form submission, find-in-page and focus handling keep working.`,
  },
  {
    id: "how",
    title: "How it works",
    body: `Each component is HTML with \`data-ok-*\` attributes, styled by one prebuilt stylesheet. Interactive components share one behavior core: on a plain HTML page, a small script connects it to your markup, and framework packages render the same markup with the API you expect from your framework.

This website is built with Owlky too. Use the **Theme** menu in the header of the docs pages to see every page change.`,
  },
  {
    id: "start",
    title: "Get started",
    body: `- [Get started](/get-started/) shows how to add Owlky from a CDN, from npm, with React and with Tailwind CSS.
- [Colors](/foundations/colors/) explains the palette and the theme colors.
- [Button](/components/button/) is a complete component guide, with live examples.`,
  },
];

/** Where the home page links (internal paths must exist: the website e2e checks them). */
export const LINKS = {
  getStarted: "/get-started/",
  components: "/components/button/",
  colors: "/foundations/colors/",
  search: "/search/",
  llms: "/llms.txt",
  github: "https://github.com/dangduoc08/owlky",
  issues: "https://github.com/dangduoc08/owlky/issues",
  roadmap: "https://github.com/dangduoc08/owlky/blob/main/docs/roadmap.md",
  license: "https://github.com/dangduoc08/owlky/blob/main/LICENSE",
  /** A component's spec (the docs pages of most components are still in Storybook). */
  spec: (name: string) =>
    `https://github.com/dangduoc08/owlky/blob/main/specs/components/${name}.md`,
} as const;

/** Components with a page on this website; the others link to their spec on GitHub. */
export const COMPONENT_PAGES: Record<string, string> = { button: "/components/button/" };

export const componentHref = (name: string) => COMPONENT_PAGES[name] ?? LINKS.spec(name);

/** The components tiles of "And much more", in this order (names from the MCP manifest). */
export const FEATURED_COMPONENTS = [
  "button",
  "text-field",
  "select",
  "autocomplete",
  "checkbox",
  "switch",
  "slider",
  "rating",
  "dialog",
  "drawer",
  "menu",
  "tooltip",
  "tabs",
  "stepper",
  "accordion",
  "table",
  "data-grid",
  "chart",
  "date-picker",
  "editor",
  "code-editor",
  "map",
  "upload",
  "carousel",
  "tree-view",
  "timeline",
  "walktour",
  "organization-chart",
] as const;

export const WORKS_WITH = ["HTML", "React", "Tailwind CSS", "Next.js", "Vite"] as const;

export const PRINCIPLES = [
  {
    title: "Native first",
    text: "Dialogs are `<dialog>` elements, menus use the `popover` attribute and inputs stay native. Form submission, find-in-page and focus handling keep working.",
  },
  {
    title: "Behavior written once",
    text: "Keyboard, focus and state logic lives in one framework-free core. The HTML runtime and the React components both run it, so they behave the same.",
  },
  {
    title: "A token for every value",
    text: "Colors, radii, shadows, spacing and type are CSS variables. Change one variable and every component that uses it follows, in light and dark themes.",
  },
  {
    title: "Styles you can override",
    text: "Every component rule sits in a cascade layer behind `:where()`, so it has zero specificity. One class of yours is enough to change a component.",
  },
  {
    title: "No build step required",
    text: "Add one stylesheet and one script from a CDN to any HTML page. Framework packages and Tailwind CSS are there when your project needs them.",
  },
] as const;

export const FAQ = [
  {
    question: "Is Owlky free to use?",
    answer:
      "Yes. Owlky is open source under the MIT license. You can use it in personal and commercial projects, change it and share it.",
  },
  {
    question: "Which frameworks does Owlky support?",
    answer:
      "Every component works in plain HTML with one stylesheet and one script. The React package supports React 18.3 and 19. More framework packages are planned, and they will render the same markup.",
  },
  {
    question: "Which browsers are supported?",
    answer:
      "Chrome and Edge 114, Firefox 128 and Safari 17, and every later version. Newer browser features are detected, and each one has a documented fallback.",
  },
  {
    question: "How do I change colors and fonts?",
    answer:
      "Set a theme (light, dark or system) with a data attribute on any element, or with one function call. For your own brand color and font, override the CSS variables or create a theme from your palette.",
  },
  {
    question: "How does Owlky work with AI coding agents?",
    answer:
      "Connect your editor to the hosted Owlky MCP server at `https://owlky.com/mcp` and sign in with GitHub or Google. It answers with the exact options, examples and design tokens, and it checks the markup that your agent writes. The docs are also available as Markdown in `llms.txt`.",
  },
  {
    question: "What's next on the roadmap?",
    answer:
      "The first public release, 0.1.0, then more framework packages, more docs pages on this website and free page blocks. The roadmap is public on GitHub.",
  },
] as const;
