import { CDN } from "@owlky/docs-content/guide/text";
import type { PageSection } from "./types.js";

/* Load Owlky from a CDN (ADR-0068, roadmap-size.md S6): the loader, preloading, self-hosting, CSP. */

const HEAD = `<link rel="stylesheet" href="${CDN}/owlky.css">
    <script src="${CDN}/owlky.js" defer></script>`;

/** A chart with its data: what the page shows before and after the chart module loads. */
const CHART = `<figure data-ok-chart data-ok-type="bar" data-ok-x-type="category">
      <table data-ok-chart-data>
        <caption>Deploys per weekday</caption>
        <thead>
          <tr><th scope="col">Day</th><th scope="col" data-ok-color="primary">Deploys</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">Mon</th><td>14</td></tr>
          <tr><th scope="row">Tue</th><td>22</td></tr>
          <tr><th scope="row">Wed</th><td>19</td></tr>
        </tbody>
      </table>
    </figure>`;

const page = (head: string, body: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Deploys</title>
    ${head}
  </head>
  <body>
    ${body}
  </body>
</html>`;

export const cdnSections: PageSection[] = [
  {
    id: "how",
    title: "How the script loads components",
    body: `A CDN page needs one stylesheet and one script. \`owlky.js\` holds the runtime and the components that most pages use, such as dialogs, menus, tabs and form controls. It is about 40 kB gzip. \`owlky.css\` holds the design tokens and the styles of those components, which is about 30 kB gzip.

Larger components load only on the pages that use them. When the page holds one of them, \`owlky.js\` loads its stylesheet and then its module from the \`modules/\` folder next to the script. The stylesheet comes first, so the component never runs on unstyled markup. The loader also handles markup that you add to the page later, for example with \`fetch\`, htmx or Turbo.

These components load as modules:

- **Data display:** Chart, Data grid, Gantt, Organization chart and Tree view.
- **Inputs:** Autocomplete, Date and time pickers, Phone input, Transfer list and Upload.
- **Content:** Carousel and Lightbox, Code editor, Editor, Illustrations, Map and Markdown.
- **Behavior:** Motion, Sortable and Walktour.

Until its stylesheet and module arrive, a component shows its markup as it is without JavaScript and without its own styles. A chart shows its data table, and a date picker shows its text field. Nothing on the page is hidden while it waits.`,
    code: [{ label: "index.html", language: "html", code: page(HEAD, CHART) }],
  },
  {
    id: "preload",
    title: "Load components ahead of use",
    body: `A module starts to load when its component appears, so a large component near the top of the page can render a moment after the rest. To start loading it with the page, name its module in \`data-ok-preload\` on the script. Separate several names with spaces.

Each component's page lists its module name in the **Import** table of its API reference. The names are \`autocomplete\`, \`carousel\`, \`chart\`, \`code-editor\`, \`data-grid\`, \`date-picker\`, \`editor\`, \`gantt\`, \`illustration\`, \`map\`, \`markdown\`, \`motion\`, \`organization-chart\`, \`phone-input\`, \`sortable\`, \`transfer-list\`, \`tree-view\`, \`upload\` and \`walktour\`.

To let the browser fetch a module even before \`owlky.js\` runs, also add a \`modulepreload\` link for its script and a \`preload\` link for its stylesheet. Both files have the module's name.

A component that shows on first paint, such as a chart at the top of the page, looks different once its stylesheet arrives. \`owlky.css\` already holds a chart's box and data table, so the page barely shifts. For the best result, also link the stylesheet in the \`<head>\`, after \`owlky.css\`. The loader doesn't add a stylesheet that the page links already.`,
    code: [
      {
        label: "index.html",
        language: "html",
        code: `<link rel="stylesheet" href="${CDN}/owlky.css">
<!-- Fetch the chart's stylesheet and module in parallel with owlky.js -->
<link rel="preload" as="style" href="${CDN}/modules/chart.css">
<link rel="modulepreload" href="${CDN}/modules/chart.js">
<script src="${CDN}/owlky.js" data-ok-preload="chart data-grid" defer></script>`,
      },
      {
        label: "index.html",
        language: "html",
        code: `<link rel="stylesheet" href="${CDN}/owlky.css">
<!-- A chart at the top of the page: its styles are there from the first paint -->
<link rel="stylesheet" href="${CDN}/modules/chart.css">
<script src="${CDN}/owlky.js" data-ok-preload="chart" defer></script>`,
      },
    ],
  },
  {
    id: "javascript",
    title: "Load components from JavaScript",
    body: `\`owlky.js\` exposes the page's runtime as \`window.Owlky\`. Call \`Owlky.load(name)\` to load a module yourself. It returns a promise that resolves when the module's components are registered, and it loads each module only once. \`Owlky.loaded(name)\` tells you whether a module has finished loading.

Use them before you work with a component's instance, for example to call methods on a chart that your script adds.`,
    code: [
      {
        label: "index.html",
        language: "html",
        code: `<button type="button" id="report" data-ok-button data-ok-variant="outlined" data-ok-color="primary" data-ok-size="md">
  <span data-ok-button-label>Show the report</span>
</button>

<script src="report.js" defer></script>`,
      },
      {
        label: "report.js",
        language: "ts",
        code: `const button = document.getElementById("report");

button.addEventListener("click", async () => {
  // Starts loading the chart module, or reuses the one already loaded
  await Owlky.load("chart");
  console.log(Owlky.loaded("chart")); // true
});`,
      },
    ],
  },
  {
    id: "errors",
    title: "Handle loading errors",
    body: `If a module can't load, for example because the network is down, \`owlky.js\` logs an error and dispatches \`ok:runtime:error\` on \`document\`. The event's \`detail\` holds:

- **\`module\`:** the module's name, such as \`chart\`.
- **\`url\`:** the address that failed to load.
- **\`error\`:** the error that the browser reported.

The component keeps its markup without JavaScript, so its content stays readable. \`owlky.js\` tries again once when the browser comes back online, and again on the next \`Owlky.load()\` call.`,
    code: [
      {
        label: "errors.js",
        language: "ts",
        code: `document.addEventListener("ok:runtime:error", (event) => {
  const { module, url } = event.detail;
  // Report it to your error tracker, or ask people to try again
  console.warn(\`Couldn't load the \${module} module from \${url}\`);
});`,
      },
    ],
  },
  {
    id: "esm",
    title: "Use an ES module script",
    body: `If your page loads its scripts as ES modules, use \`owlky.mjs\` instead of \`owlky.js\`. It holds the same components and loads the same modules, from the \`modules/\` folder next to it.

Module scripts are deferred by default. \`data-ok-preload\` and \`data-ok-modules\` work on the module script too. Load only one of the two files on a page.`,
    code: [
      {
        label: "index.html",
        language: "html",
        code: `<link rel="stylesheet" href="${CDN}/owlky.css">
<script type="module" src="${CDN}/owlky.mjs" data-ok-preload="chart"></script>`,
      },
    ],
  },
  {
    id: "self-host",
    title: "Host Owlky yourself",
    body: `To serve Owlky from your own site, copy the whole \`dist\` folder of the \`@owlky/html\` package. Keep its layout, because \`owlky.js\` finds the other files next to itself:

- **\`owlky.css\` and \`owlky.min.css\`:** the core stylesheet, readable or minified. It holds the tokens and the styles of the components in \`owlky.js\`.
- **\`owlky-all.css\` and \`owlky-all.min.css\`:** one stylesheet with every component, for pages that don't use the loader.
- **\`owlky.js\` and \`owlky.mjs\`:** the script, as a classic script or as an ES module.
- **\`modules/\`:** the modules of the larger components, their stylesheets and the code they share.
- **\`monaco/\`:** the code editor's engine, which loads only when a code editor appears.
- **\`owlky-map-worker.js\`:** the map engine's worker, which loads only when a map appears.

To serve the modules and their stylesheets from another folder, set \`data-ok-modules\` on the script to that folder. To serve the code editor's engine from another folder, set \`data-ok-monaco-path\`. Both folders must be on the page's origin when the page has a strict Content Security Policy.`,
    code: [
      {
        label: "Terminal",
        language: "bash",
        code: `npm install @owlky/html
# Copy the folder as it is, for example into your site's assets
cp -R node_modules/@owlky/html/dist public/owlky`,
      },
      {
        label: "index.html",
        language: "html",
        code: `<link rel="stylesheet" href="/owlky/owlky.css">
<!-- The modules live in another folder on the same origin -->
<script src="/owlky/owlky.js" data-ok-modules="/static/owlky-modules/" data-ok-monaco-path="/static/monaco/" defer></script>`,
      },
    ],
  },
  {
    id: "csp",
    title: "Use a strict Content Security Policy",
    body: `Owlky works under a strict Content Security Policy. Its scripts contain no inline code, the modules are ES modules that \`import()\` loads from the script's folder, and components write styles through the CSS object model instead of \`style\` attributes. Trusted Types need no policy, because Owlky never writes HTML from strings.

Host Owlky on your own origin, so that \`script-src 'self'\` and \`style-src 'self'\` cover it. To load it from a CDN instead, add the CDN's origin to \`script-src\` and \`style-src\`.

Two components need more:

- **Code editor:** its engine writes \`<style>\` elements and creates workers. It needs \`style-src 'unsafe-inline'\`, \`worker-src 'self'\` and its own Trusted Types policies. The Code editor page lists them.
- **Map:** the map engine runs in a worker from your origin, so it needs \`worker-src 'self'\`. It creates the worker with a URL, which Trusted Types allow only with a policy of your page.`,
    code: [
      {
        label: "index.html",
        language: "html",
        code: page(
          `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; require-trusted-types-for 'script'">
    <link rel="stylesheet" href="/owlky/owlky.css">
    <script src="/owlky/owlky.js" defer></script>`,
          CHART,
        ),
      },
    ],
  },
  {
    id: "next",
    title: "Next steps",
    body: `- Read [Use with a bundler](/get-started/bundlers/) to import only the components you use in an app.
- Open a component's page, such as [Button](/components/button/), for its examples, options and the **Import** table of its API reference.`,
  },
];
