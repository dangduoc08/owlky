import { Alert, Button, Pagination } from "@owlky/react";
import { Caption, CDN, type GuideSection, GuideSections, Preview } from "../helpers/guide.js";

export const introductionSections: GuideSection[] = [
  {
    id: "why",
    title: "Why Owlky?",
    body: `Owlky is a UI component library for dashboards and web apps. It gives your product a polished, consistent interface without locking you into one way of building it.

- **One design system everywhere.** Every component has a single markup structure, a single stylesheet and a single set of design tokens. Use it in plain HTML or through a framework package, and it looks and behaves the same.
- **Accessible by default.** Components follow the WAI-ARIA patterns, work with the keyboard and meet WCAG 2.2 level AA.
- **Easy to theme.** Every color, size and shadow is a CSS variable. Switch to dark mode, change the primary color or bring your own brand with a few lines of CSS.
- **Built on the platform.** Components use native elements, such as \`<button>\` and \`<dialog>\`, so browser features like form submission, find-in-page and focus handling keep working.
- **Small.** The complete stylesheet is about 34 kB, gzipped. The script for every interactive component is about 88 kB, and the npm packages let you load only what you use.`,
  },
  {
    id: "how",
    title: "How it works",
    body: `Owlky is built in layers, so the same component can be used in many environments:

- **Markup and styles.** Each component is HTML with \`data-ok-*\` attributes, styled by one prebuilt stylesheet. This layer works on any page.
- **Behavior.** Interactive components, such as dialogs and tables, share one behavior core. On a plain HTML page, a small script connects it to your markup.
- **Framework packages.** A framework package renders the same markup and uses the same behavior core, with the API you expect from your framework.

Because every layer is shared, you can move between environments, or mix them on one page, without visual differences.`,
  },
  {
    id: "packages",
    title: "Packages",
    body: `- **\`@owlky/styles\`:** the prebuilt stylesheet, which needs no build step, and a theme for Tailwind CSS v4.
- **\`@owlky/tokens\`:** the design tokens, as CSS variables and as JavaScript values.
- **\`@owlky/html\`:** HTML snippets and the script that adds behavior to them. Also available from a CDN.
- **Framework packages:** components for a specific framework, such as \`@owlky/react\`. Support for more frameworks will follow.
- **\`@owlky/core\`:** the shared behavior core. Framework packages include it, so you rarely install it yourself.`,
  },
  {
    id: "install",
    title: "Install Owlky",
    body: "Choose how you build your app. For a plain HTML page, add the stylesheet and the script from the CDN. For a framework, install its package and the stylesheet from npm.",
    html: `<!-- In the <head> of every page -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>`,
    react: `# In your terminal
npm install @owlky/react @owlky/styles

// In your app's entry file
import "@owlky/styles/owlky.css";`,
  },
  {
    id: "first",
    title: "Add your first component",
    body: "Copy an example from any story's **Code** panel, or write it yourself. Whichever way you build, the result is the same button.",
    html: `<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md">
  <span data-ok-button-label>Get started</span>
</button>`,
    react: `import { Button } from "@owlky/react";

export function GetStarted() {
  return (
    <Button variant="contained" color="primary">
      Get started
    </Button>
  );
}`,
  },
  {
    id: "theme",
    title: "Make it yours",
    body: `Every design value is a CSS variable that starts with \`--ok-\`. To change one, set it in your own CSS, for the whole page or for one part of it. Your values always win, because Owlky's own rules have zero specificity.

For dark mode, set \`data-ok-theme="dark"\` on the \`<html>\` element or on any container. Use \`system\` to follow the operating system. The **Foundations** pages describe every token.`,
    html: `<style>
  :root {
    --ok-palette-primary-main: #2065d1;
    --ok-palette-primary-dark: #103996;
    --ok-palette-primary-contrast-text: #ffffff;
    --ok-radius-md: 10px;
  }
</style>

<html data-ok-theme="dark">…</html>`,
    react: `/* In your main CSS file */
:root {
  --ok-palette-primary-main: #2065d1;
  --ok-palette-primary-dark: #103996;
  --ok-palette-primary-contrast-text: #ffffff;
  --ok-radius-md: 10px;
}

// In a component: a dark section
<section data-ok-theme="dark">…</section>`,
  },
  {
    id: "storybook",
    title: "Find your way around",
    body: `- **Foundations** explains the design tokens: colors, typography, shadows, spacing, icons and theme settings. Each page is a guide with live examples.
- **Components** lists every component. Each story shows one example. Choose plain HTML or a framework with the **Framework** menu in the toolbar: the example and its source switch together.
- Open the **Code** panel to copy an example's source, with the imports you need.
- Use the **Controls** panel to change a component's options, and the toolbar to switch the theme, primary color, font and text size for every story.`,
  },
  {
    id: "support",
    title: "Browser support",
    body: "Owlky supports Chrome and Edge 114 and later, Firefox 128 and later, and Safari 17 and later. When a browser lacks a newer feature, Owlky detects it and uses a fallback that still works.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Every component is tested with axe, in light and dark mode, and with the keyboard.
- Focus is always visible, and dialogs and drawers return focus to where it was.
- Neutral text meets a contrast ratio of at least 4.5:1 in every theme.
- Some things depend on your content: give icon-only buttons and scrollable regions a name, as each component's examples show.`,
  },
];

function FirstPreview() {
  return (
    <Preview>
      <Button variant="contained" color="primary">
        Get started
      </Button>
    </Preview>
  );
}

function AboutPreview() {
  return (
    <Preview className="flex-col items-stretch!">
      <Caption>A few Owlky components, rendered live</Caption>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="contained" color="primary">
          Save
        </Button>
        <Button variant="outlined">Cancel</Button>
        <Button variant="soft" color="info">
          Share
        </Button>
      </div>
      <Alert severity="success">Your changes were saved.</Alert>
      <Pagination count={5} color="primary" aria-label="Example pages" />
    </Preview>
  );
}

function ThemePreview() {
  return (
    <Preview className="items-stretch! gap-6!">
      {(["light", "dark"] as const).map((theme) => (
        <div
          key={theme}
          data-ok-theme={theme}
          className="flex min-w-[12rem] flex-1 flex-col items-start gap-3 rounded-2xl p-6"
          style={{ backgroundColor: "var(--ok-bg-default)", color: "var(--ok-text-primary)" }}
        >
          <Caption>{theme === "light" ? "Light theme" : "Dark theme"}</Caption>
          <Button variant="contained" color="primary">
            Get started
          </Button>
        </div>
      ))}
    </Preview>
  );
}

/** The Introduction page's guide (the page title and summary are in introduction.mdx). */
export function IntroductionGuide() {
  return (
    <GuideSections
      sections={introductionSections}
      previews={{ why: AboutPreview, first: FirstPreview, theme: ThemePreview }}
    />
  );
}
