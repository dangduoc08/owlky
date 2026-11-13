import type { PageSection } from "./types.js";

/* Use Owlky with a bundler (ADR-0068, roadmap-size.md S6): entries, tree shaking, Next.js, styles. */

export const bundlerSections: PageSection[] = [
  {
    id: "packages",
    title: "Install the packages",
    body: `Install the stylesheet and the package for the way you build. Each package is split into entries, so your app bundles only the components it imports:

- **\`@owlky/styles\`:** the stylesheet, as one file or one file per component.
- **\`@owlky/react\`:** the React components. Support for more frameworks will follow.
- **\`@owlky/html\`:** the runtime that adds behavior to plain HTML markup.
- **\`@owlky/core\`:** the option schemas, attribute helpers and behavior that the other packages share. They depend on it, so you rarely install it yourself.`,
    code: [
      {
        label: "Terminal",
        language: "bash",
        code: `# React
npm install @owlky/react @owlky/styles

# Plain HTML markup with a bundler
npm install @owlky/html @owlky/styles`,
      },
    ],
  },
  {
    id: "react",
    title: "Import React components",
    body: `Import components from \`@owlky/react\`. The package has no side effects, so bundlers that tree-shake, such as Vite, webpack, Rollup and esbuild, keep only the components you use. A page with one button bundles about 8 kB gzip of Owlky code.

Every component also has its own entry, named after its docs page: \`@owlky/react/button\`, \`@owlky/react/dialog\` or \`@owlky/react/data-grid\`. An entry holds one component family. For example, \`@owlky/react/button\` exports \`Button\`, \`IconButton\`, \`Fab\` and \`ButtonGroup\`, and \`@owlky/react/date-picker\` exports every picker, field, calendar and clock. Entries bundle the same code as the package, so use them when your tools don't tree-shake, such as some development servers and test runners, or when you want the import to name the component. The **Import** table in each component's API reference lists its entries.`,
    code: [
      {
        label: "App.tsx",
        language: "tsx",
        code: `import { Button } from "@owlky/react";
// The same component from its own entry
import { Dialog, DialogContent, DialogTitle } from "@owlky/react/dialog";
import { useState } from "react";

export function App() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="welcome-title">
        <DialogTitle id="welcome-title">Welcome</DialogTitle>
        <DialogContent>Your workspace is ready.</DialogContent>
      </Dialog>
    </>
  );
}`,
      },
    ],
  },
  {
    id: "lazy",
    title: "Load large components on demand",
    body: "Some components are large, such as the data grid, the chart, the editor and the map. If only some pages or states of your app show one, load its entry with a dynamic `import()`. Your bundler then puts it in a separate file that the browser downloads when the component first renders.",
    code: [
      {
        label: "People.tsx",
        language: "tsx",
        code: `import { CircularProgress } from "@owlky/react";
import { lazy, Suspense } from "react";

// The data grid becomes its own file, downloaded on first render
const DataGrid = lazy(() =>
  import("@owlky/react/data-grid").then((module) => ({ default: module.DataGrid })),
);

const rows = [
  { id: 1, name: "Ana Lima", age: 34 },
  { id: 2, name: "Jonah Pereira", age: 41 },
];

export function People() {
  return (
    <Suspense fallback={<CircularProgress aria-label="Loading people" />}>
      <DataGrid
        aria-label="People"
        rows={rows}
        columns={[
          { field: "name", headerName: "Name", flex: 1 },
          { field: "age", headerName: "Age", type: "number" },
        ]}
      />
    </Suspense>
  );
}`,
      },
    ],
  },
  {
    id: "nextjs",
    title: "Use Owlky with Next.js",
    body: `Owlky's React components work in the App Router. Components that need state in the browser are client components, so you can render them from server components.

Add \`@owlky/react\` and \`@owlky/core\` to \`optimizePackageImports\` in your Next.js config. Next.js then rewrites imports from the package to the components' own files. Without it, Next.js may compile every component for each page in development, and it may bundle more than the page uses.`,
    code: [
      {
        label: "next.config.ts",
        language: "ts",
        code: `import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: {
    // Import only the Owlky components each page uses
    optimizePackageImports: ["@owlky/react", "@owlky/core"],
  },
};

export default config;`,
      },
      {
        label: "app/layout.tsx",
        language: "tsx",
        code: `import "@owlky/styles/owlky-all.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-ok-theme="light">
      <body>{children}</body>
    </html>
  );
}`,
      },
    ],
  },
  {
    id: "html",
    title: "Register HTML components",
    body: `With plain HTML markup, the runtime adds behavior to the components on the page. \`@owlky/html/auto\` registers every component and starts the runtime, which is the simplest setup.

To bundle less, register only the components your pages use. Each component's entry, such as \`@owlky/html/dialog\`, exports its runtime definitions and does nothing on import. Register them on the page's runtime, then start it. A definition that you register later, for example after a dynamic \`import()\`, sets up the matching components that are already on the page.`,
    code: [
      {
        label: "main.ts",
        language: "ts",
        code: `import "@owlky/styles/owlky-all.css";
import { getRuntime } from "@owlky/html";
import { dialog } from "@owlky/html/dialog";
import { tabs } from "@owlky/html/tabs";

const runtime = getRuntime().register(dialog, tabs).start();

// Load the data grid only on pages that have one
if (document.querySelector("[data-ok-data-grid]")) {
  const { dataGrid } = await import("@owlky/html/data-grid");
  runtime.register(dataGrid);
}`,
      },
    ],
  },
  {
    id: "styles",
    title: "Add the stylesheets",
    body: `Import the stylesheet once, in your app's entry file or root layout. Every rule has zero specificity, so your own styles always win. You have three choices:

- **Everything:** \`@owlky/styles/owlky-all.css\` holds the design tokens and every component. It is about 63 kB gzip.
- **The core and what you use:** \`@owlky/styles/owlky.css\` holds the tokens and the light components, such as buttons, form controls, dialogs and tables. It is about 29 kB gzip. Large components keep their styles in their own files, such as \`components/data-grid.css\` or \`components/chart.css\`, so import those after it.
- **Only what the page uses:** import the tokens and then each component's file, from \`@owlky/styles/components/\`.

Keep the order of the **Import** tables: some components restyle the components they compose, so a component's file comes after the files of the components inside it. For example, a button's loading spinner is a circular progress, so \`button.css\` comes after \`circular-progress.css\`. The data grid shows charts and date pickers, so \`chart.css\` comes before \`data-grid.css\`. The pickers' files come after it, so that a picker in a grid cell keeps its own look.`,
    code: [
      {
        label: "styles.ts",
        language: "ts",
        code: `// Everything
import "@owlky/styles/owlky-all.css";`,
      },
      {
        label: "styles.ts",
        language: "ts",
        code: `// The core, then the large components the app uses
import "@owlky/styles/owlky.css";
import "@owlky/styles/components/chart.css";
import "@owlky/styles/components/data-grid.css";
import "@owlky/styles/components/date-field.css";
import "@owlky/styles/components/date-calendar.css";
import "@owlky/styles/components/date-picker.css";`,
      },
      {
        label: "styles.ts",
        language: "ts",
        code: `// Only what the page uses: the tokens first, then the components
import "@owlky/styles/tokens.css";
import "@owlky/styles/components/paper.css";
import "@owlky/styles/components/typography.css";
// The stroke of component icons, shared by every component
import "@owlky/styles/components/icon.css";
import "@owlky/styles/components/circular-progress.css";
import "@owlky/styles/components/button.css";
import "@owlky/styles/components/dialog.css";`,
      },
    ],
  },
  {
    id: "next",
    title: "Next steps",
    body: `- Read [Load from a CDN](/get-started/cdn/) to use Owlky without a build step.
- Open a component's page, such as [Button](/components/button/), for its examples, options and the **Import** table of its API reference.`,
  },
];
