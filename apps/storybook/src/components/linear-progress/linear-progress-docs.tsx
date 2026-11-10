import { linearProgressOptions } from "@owlky/core";
import linearProgressApi from "@owlky/docs-content/api/linear-progress.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { LinearProgress } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const BARS = `<span data-ok-linear-progress-bar="1"></span><span data-ok-linear-progress-bar="2"></span>`;
const htmlProgress = (attrs: string, label: string, inner = BARS) =>
  `<span role="progressbar" aria-label="${label}" data-ok-linear-progress ${attrs}>${inner}</span>`;

export const linearProgressSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A linear progress indicator is a thin bar that shows that something is happening. It fills the width of its container, so it fits at the top of a card, a table or a page.

Use the **indeterminate** or **query** variant while you can't tell how long a task takes. Use the **determinate** or **buffer** variant when you know how far it has got. Each indicator is a \`progressbar\` for assistive technology: give it a name.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${htmlProgress('data-ok-variant="indeterminate" data-ok-color="primary"', "Loading orders")}`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { LinearProgress } from "@owlky/react";

export function LoadingOrders() {
  return <LinearProgress aria-label="Loading orders" />;
}`,
  },
  {
    id: "determinate",
    title: "Show how far a task has got",
    body: "Set `variant` to `determinate` and pass `value`, from `min` (default 0) to `max` (default 100). The determinate bar has one part. In HTML, the value is the `aria-valuenow` attribute: change it, and the runtime moves the bar. Values outside the range are clamped.",
    html: `${htmlProgress(
      'data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100"',
      "Upload",
      '<span data-ok-linear-progress-bar="1"></span>',
    )}

<script>
  // Later, as the upload goes on
  document.querySelector("[aria-label='Upload']").setAttribute("aria-valuenow", "80");
</script>`,
    react: `import { LinearProgress } from "@owlky/react";

export function Upload({ percent }: { percent: number }) {
  return <LinearProgress variant="determinate" value={percent} aria-label="Upload" />;
}`,
  },
  {
    id: "buffer",
    title: "Show what is buffered",
    body: "The `buffer` variant shows two values: `value` (how far playback or processing has got) and `valueBuffer` (how far loading has got). Dots move along the rest of the bar. In HTML, the buffer is the `data-ok-value-buffer` attribute, and the markup starts with a `data-ok-linear-progress-dashed` part.",
    html: htmlProgress(
      'data-ok-variant="buffer" data-ok-color="primary" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100" data-ok-value-buffer="45"',
      "Video",
      `<span data-ok-linear-progress-dashed></span>${BARS}`,
    ),
    react: `import { LinearProgress } from "@owlky/react";

export function LinearProgressBuffer() {
  return <LinearProgress variant="buffer" value={30} valueBuffer={45} aria-label="Video" />;
}`,
  },
  {
    id: "query",
    title: "Show a request before loading starts",
    body: "The `query` variant moves from the end to the start. Use it while a request waits for an answer, then switch to `determinate` once the progress is known.",
    html: htmlProgress('data-ok-variant="query" data-ok-color="primary"', "Searching"),
    react: `import { LinearProgress } from "@owlky/react";

export function LinearProgressQuery() {
  return <LinearProgress variant="query" aria-label="Searching" />;
}`,
  },
  {
    id: "colors",
    title: "Choose a color",
    body: "The default color is `primary`. Use another palette color, such as `success` or `error`, to match the context. Use `inherit` to take the text color of the surrounding element. The track behind the bar is the same color at 24% opacity.",
    html: htmlProgress('data-ok-variant="indeterminate" data-ok-color="inherit"', "Loading"),
    react: `import { LinearProgress } from "@owlky/react";

export function LinearProgressColors() {
  return <LinearProgress color="inherit" aria-label="Loading" />;
}`,
  },
  {
    id: "label",
    title: "Show the value as text",
    body: "Put the value next to the bar when people need the exact number. For values that aren't percentages, such as floors or steps, set `aria-valuetext` so assistive technology reads the same text.",
    html: `<div style="display: flex; align-items: center; gap: 8px">
  ${htmlProgress(
    'data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="3" aria-valuemin="0" aria-valuemax="5" aria-valuetext="Step 3 of 5"',
    "Setup",
    '<span data-ok-linear-progress-bar="1"></span>',
  )}
  <span>Step 3 of 5</span>
</div>`,
    react: `import { LinearProgress, Step } from "@owlky/react";

export function LinearProgressLabel() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <LinearProgress
        variant="determinate"
        value={3}
        max={5}
        aria-valuetext="Step 3 of 5"
        aria-label="Setup"
      />
      <span>Step 3 of 5</span>
    </div>
  );
}`,
  },
  {
    id: "rtl",
    title: "Use right-to-left layouts",
    body: 'Set `dir="rtl"` on the page, on a section or on the bar itself. Every variant then fills from the right, the way people read in languages such as Arabic and Hebrew. No option is needed, because the bar follows the direction of its text.',
    html: `<div dir="rtl">
  ${htmlProgress(
    'data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"',
    "Upload",
    '<span data-ok-linear-progress-bar="1"></span>',
  )}
</div>`,
    react: `import { LinearProgress } from "@owlky/react";

export function RightToLeftProgress() {
  return (
    <div dir="rtl">
      <LinearProgress variant="determinate" value={60} aria-label="Upload" />
    </div>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed or aren't valid numbers fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props name the indicator. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **HTML:** there are no events or instance methods. Change \`aria-valuenow\`, \`aria-valuemin\`, \`aria-valuemax\` or \`data-ok-value-buffer\`, and the runtime moves the bars. It writes private CSS custom properties through the CSS object model, so it works under a strict Content Security Policy.
- **React:** render with a new \`value\`. The bar positions are set with the \`style\` prop. On server-rendered pages with a Content Security Policy that blocks inline styles, the bars move to their values once the page hydrates.
- The bar eases to a new value in 300ms. If the value changes many times per second, the bar trails behind it.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Progress indicators don't take focus and have no keyboard interaction.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Each indicator has \`role="progressbar"\`. Name it with \`aria-label\` or \`aria-labelledby\`.
- Determinate and buffer indicators report their value with \`aria-valuenow\`, \`aria-valuemin\` and \`aria-valuemax\`. The buffer value is visual only.
- When an indicator stands for a region that is loading, set \`aria-busy="true"\` on that region until it's ready, and point the region's \`aria-describedby\` at the indicator.
- With reduced motion turned on, the bars sweep at half speed, the dots stop and values change without easing.
- Brand colors follow the design. Light colors such as \`warning\` have a contrast ratio below 3:1 on white, so don't rely on the bar alone to tell people something important.
- In a right-to-left page or section (\`dir="rtl"\`), the bar fills from right to left.`,
  },
  apiReferenceSection(linearProgressApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview className="flex-col items-stretch!">
      <LinearProgress aria-label="Loading orders" />
    </Preview>
  ),
  determinate: () => (
    <Preview className="flex-col items-stretch!">
      <LinearProgress variant="determinate" value={40} aria-label="Upload" />
    </Preview>
  ),
  buffer: () => (
    <Preview className="flex-col items-stretch!">
      <LinearProgress variant="buffer" value={30} valueBuffer={45} aria-label="Video" />
    </Preview>
  ),
  rtl: () => (
    <Preview className="flex-col items-stretch!">
      <div dir="rtl" className="flex flex-col gap-4">
        <LinearProgress variant="determinate" value={60} aria-label="Upload" />
        <LinearProgress variant="buffer" value={40} valueBuffer={60} aria-label="Video" />
        <LinearProgress aria-label="Loading" />
      </div>
    </Preview>
  ),
  query: () => (
    <Preview className="flex-col items-stretch!">
      <LinearProgress variant="query" aria-label="Searching" />
    </Preview>
  ),
  colors: () => (
    <Preview className="flex-col items-stretch!">
      {(["inherit", "primary", "secondary", "info", "success", "warning", "error"] as const).map(
        (color) => (
          <LinearProgress
            key={color}
            variant="determinate"
            value={60}
            color={color}
            aria-label="Upload"
          />
        ),
      )}
    </Preview>
  ),
  label: () => (
    <Preview className="flex-nowrap!">
      <LinearProgress
        variant="determinate"
        value={3}
        max={5}
        aria-valuetext="Step 3 of 5"
        aria-label="Setup"
      />
      <span className="shrink-0">Step 3 of 5</span>
    </Preview>
  ),
  options: () => <OptionsTable schema={linearProgressOptions} />,
  props: () => (
    <PropsTable
      label="Linear progress content props"
      rows={[
        {
          react: "aria-label",
          html: "aria-label",
          type: "string",
          description: 'Name of the indicator, such as "Loading orders".',
        },
        {
          react: "aria-labelledby",
          html: "aria-labelledby",
          type: "string",
          description: "The id of a visible label that names the indicator.",
        },
        {
          react: "aria-valuetext",
          html: "aria-valuetext",
          type: "string",
          description: "The value as text, for values that aren't percentages.",
        },
        {
          react: "ref",
          type: "HTMLSpanElement",
          description: "The `progressbar` element.",
        },
      ]}
    />
  ),
};

/** Linear progress docs page (ADR-0019). */
export function LinearProgressDocs() {
  return <GuideDocs sections={linearProgressSections} previews={PREVIEWS} />;
}
