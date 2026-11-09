import { CDN } from "@owlky/docs-content/guide/text";
import type { PageSection } from "./types.js";

/* Get started (ADR-0040): CDN, npm with HTML, React and Tailwind CSS. */

export const getStartedSections: PageSection[] = [
  {
    id: "choose",
    title: "Choose how to add Owlky",
    body: `Owlky is one design system that you can use in plain HTML or through a framework package. Every option renders the same markup with the same stylesheet, so components look and behave the same everywhere.

- **CDN:** add one stylesheet and one script to any HTML page. You don't need a build step.
- **npm with HTML:** install the packages and import them in your bundler's entry file.
- **Framework packages:** install a package such as \`@owlky/react\` to use components with your framework's API.
- **Tailwind CSS:** add the Owlky theme to Tailwind CSS v4 to use the design tokens as utility classes.`,
  },
  {
    id: "cdn",
    title: "Load Owlky from a CDN",
    body: "Add the stylesheet and the script to the `<head>` of every page. The script adds behavior to interactive components, such as dialogs and tabs. It also sets up components that you add to the page later. Components that only need CSS, such as buttons, work without it.",
    code: [
      {
        label: "index.html",
        language: "html",
        code: `<!doctype html>
<html lang="en" data-ok-theme="light">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>My app</title>
    <link rel="stylesheet" href="${CDN}/owlky.css">
    <script src="${CDN}/owlky.js" defer></script>
  </head>
  <body>
    <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md">
      <span data-ok-button-label>Get started</span>
    </button>
  </body>
</html>`,
      },
    ],
  },
  {
    id: "npm-html",
    title: "Install the HTML packages with npm",
    body: "If your project uses a bundler, install the stylesheet and the HTML runtime from npm. Import both once, in your entry file. Then write the same markup as with the CDN.",
    code: [
      {
        label: "Terminal",
        language: "bash",
        code: "npm install @owlky/styles @owlky/html",
      },
      {
        label: "main.ts",
        language: "ts",
        code: `import "@owlky/styles/owlky.css";
// Registers every component and starts the runtime
import "@owlky/html/auto";`,
      },
    ],
  },
  {
    id: "react",
    title: "Use the React package",
    body: "Install the React package and the stylesheet. Import the stylesheet once, in your app's entry file, and import components where you use them. Components that need state in the browser are client components, so they work in server-rendered apps too.",
    code: [
      {
        label: "Terminal",
        language: "bash",
        code: "npm install @owlky/react @owlky/styles",
      },
      {
        label: "App.tsx",
        language: "tsx",
        code: `import "@owlky/styles/owlky.css";
import { Button } from "@owlky/react";

export function App() {
  return (
    <Button variant="contained" color="primary">
      Get started
    </Button>
  );
}`,
      },
    ],
  },
  {
    id: "tailwind",
    title: "Use Tailwind CSS",
    body: "With Tailwind CSS v4, import the Owlky stylesheet and theme after Tailwind. Every design token then becomes a utility class, such as `bg-primary`, `text-text-secondary` or `rounded-md`. Owlky's own rules have zero specificity, so your utilities always win.",
    code: [
      {
        label: "app.css",
        language: "css",
        code: `@import "tailwindcss";
@import "@owlky/styles/owlky.css";
@import "@owlky/styles/theme.css";`,
      },
      {
        label: "index.html",
        language: "html",
        code: `<p class="rounded-md bg-primary-lighter px-2 text-primary-darker">Saved</p>`,
      },
    ],
  },
  {
    id: "theme",
    title: "Switch the theme",
    body: "Set `data-ok-theme` to `light`, `dark` or `system` on the `<html>` element or on any container. To change the theme, the primary color preset and the font from JavaScript, call `applyThemeSettings`. It writes the same attributes, so it works the same way in every setup.",
    code: [
      {
        label: "theme.ts",
        language: "ts",
        code: `import { applyThemeSettings } from "@owlky/html";

// Remembers the choice in localStorage
applyThemeSettings({ mode: "dark", preset: "cyan" }, { storage: localStorage });`,
      },
    ],
  },
  {
    id: "next",
    title: "Next steps",
    body: `- Read [Colors](/foundations/colors/) to use the palette and the theme colors in your own styles.
- Open [Button](/components/button/) for a complete component guide: examples, options, keyboard and accessibility.
- Coding agents can look up the exact components, options and tokens of your version with the \`@owlky/mcp\` server.`,
  },
];
