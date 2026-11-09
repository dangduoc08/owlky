import {
  buttonKeyboardRows,
  buttonPropRows,
  buttonSections,
} from "@owlky/docs-content/components/button/sections";
import { colorsDocsSections } from "@owlky/docs-content/foundations/colors/sections";
import { getStartedSections } from "./get-started.js";
import { HOME_TAGLINE, homeSections } from "./home.js";
import type { SitePage } from "./types.js";

/* Every page of the website, in navigation order (ADR-0040 information architecture). */

export const SITE = {
  name: "Owlky",
  url: "https://owlky.com",
  github: "https://github.com/dangduoc08/owlky",
  description: HOME_TAGLINE,
} as const;

export const PAGES: readonly SitePage[] = [
  {
    path: "/",
    markdown: "/index.md",
    title: "Owlky",
    description: HOME_TAGLINE,
    group: "Overview",
    sections: homeSections,
  },
  {
    path: "/get-started/",
    markdown: "/get-started.md",
    title: "Get started",
    description:
      "Add Owlky to a page from a CDN, or install it from npm for HTML, React or Tailwind CSS.",
    group: "Overview",
    sections: getStartedSections,
  },
  {
    path: "/foundations/colors/",
    markdown: "/foundations/colors.md",
    title: "Colors",
    description:
      "Owlky's colors are CSS custom properties. Use them in your own styles, set them on components, or apply them as Tailwind CSS utilities, in both HTML and React.",
    group: "Foundations",
    guide: { sections: colorsDocsSections },
  },
  {
    path: "/components/button/",
    markdown: "/components/button.md",
    title: "Button",
    description:
      "Buttons start actions, such as saving or opening a dialog, and can also act as links. Choose how much a button stands out with its variant, and what it means with its color.",
    group: "Components",
    guide: {
      sections: buttonSections,
      component: "button",
      props: buttonPropRows,
      keyboard: buttonKeyboardRows,
    },
  },
];

export const pageAt = (path: string): SitePage => {
  const page = PAGES.find((candidate) => candidate.path === path);
  if (!page) throw new Error(`No page at ${path}`);
  return page;
};
