import { circularProgressOptions } from "@owlky/core";
import { Button, CircularProgress } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const SVG = `<svg data-ok-circular-progress-svg aria-hidden="true" viewBox="22 22 44 44"><circle data-ok-circular-progress-circle cx="44" cy="44" r="20.2" stroke-width="3.6" /></svg>`;
const htmlProgress = (attrs: string, label = "Loading") =>
  `<span role="progressbar" aria-label="${label}" data-ok-circular-progress ${attrs}>\n  ${SVG}\n</span>`;

export const circularProgressSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A circular progress indicator shows that something is happening. Use the **indeterminate** variant while you can't tell how long a task takes, such as loading data. Use the **determinate** variant when you know how far the task has got, such as an upload.

Each indicator is a \`progressbar\` for assistive technology. Give it a name that says what is loading.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${htmlProgress('data-ok-variant="indeterminate" data-ok-color="primary"', "Loading orders")}`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { CircularProgress } from "@owlky/react";

export function LoadingOrders() {
  return <CircularProgress aria-label="Loading orders" />;
}`,
  },
  {
    id: "determinate",
    title: "Show how far a task has got",
    body: "Set `variant` to `determinate` and pass `value`, from `min` (default 0) to `max` (default 100). In HTML, the value is the `aria-valuenow` attribute: change it, and the runtime redraws the arc. Values outside the range are clamped.",
    html: `${htmlProgress('data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"', "Upload")}

<script>
  // Later, as the upload goes on
  document.querySelector("[aria-label='Upload']").setAttribute("aria-valuenow", "80");
</script>`,
    react: `export function Upload({ percent }: { percent: number }) {
  return <CircularProgress variant="determinate" value={percent} aria-label="Upload" />;
}`,
  },
  {
    id: "colors",
    title: "Choose a color",
    body: "The default color is `primary`. Use another palette color, such as `success` or `error`, to match the context. Use `inherit` to take the text color of the surrounding element, for example inside a button.",
    html: htmlProgress('data-ok-variant="indeterminate" data-ok-color="inherit"'),
    react: `<CircularProgress color="inherit" aria-label="Loading" />`,
  },
  {
    id: "size",
    title: "Change the size and thickness",
    body: "The default size is 40px. Set `size` to a number of pixels, or to a CSS length in `px`, `rem` or `em` so the indicator scales with the text. `thickness` sets the stroke width, as a fraction of 44 units of the size (default 3.6). Set `enableTrackSlot` to draw a faint full circle behind the arc.",
    html: htmlProgress(
      'data-ok-variant="determinate" data-ok-color="primary" data-ok-size="3rem" data-ok-thickness="5" data-ok-track-slot aria-valuenow="70" aria-valuemin="0" aria-valuemax="100"',
      "Storage used",
    ),
    react: `<CircularProgress
  variant="determinate"
  value={70}
  size="3rem"
  thickness={5}
  enableTrackSlot
  aria-label="Storage used"
/>`,
  },
  {
    id: "label",
    title: "Show the value as text",
    body: "Put the value next to the indicator when people need the exact number. Keep the text outside the indicator, and point `aria-labelledby` or `aria-describedby` at it if it names the task.",
    html: `<div style="display: flex; align-items: center; gap: 8px">
  ${htmlProgress('data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"', "Upload").replaceAll("\n", "\n  ")}
  <span>45%</span>
</div>`,
    react: `<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <CircularProgress variant="determinate" value={45} aria-label="Upload" />
  <span>45%</span>
</div>`,
  },
  {
    id: "delay",
    title: "Avoid flashing for fast tasks",
    body: "If a task usually finishes in less than a second, wait about a second before showing the indicator. Fast tasks then don't flash a spinner. Under heavy load on the main thread, the shrinking arc can stutter: set `disableShrink` to keep a fixed arc that only spins.",
    html: htmlProgress(
      'data-ok-variant="indeterminate" data-ok-color="primary" data-ok-disable-shrink',
    ),
    react: `<CircularProgress disableShrink aria-label="Loading" />`,
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
    body: `- **HTML:** there are no events or instance methods. Change \`aria-valuenow\`, \`aria-valuemin\`, \`aria-valuemax\`, \`data-ok-size\` or \`data-ok-thickness\`, and the runtime redraws the indicator. It writes private CSS custom properties through the CSS object model, so it works under a strict Content Security Policy.
- **React:** render with a new \`value\`. The size and the arc are set with the \`style\` prop. On server-rendered pages with a Content Security Policy that blocks inline styles, the determinate arc and custom sizes appear once the page hydrates.`,
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
- Determinate indicators report their value with \`aria-valuenow\`, \`aria-valuemin\` and \`aria-valuemax\`. For values that aren't percentages, such as "Step 3 of 5", add \`aria-valuetext\`.
- When an indicator stands for a region that is loading, set \`aria-busy="true"\` on that region until it's ready, and point the region's \`aria-describedby\` at the indicator.
- With reduced motion turned on, the arc stops shrinking and spins slowly, so activity stays visible.
- Brand colors follow the design. Light colors such as \`warning\` have a contrast ratio below 3:1 on white, so don't rely on the indicator alone to tell people something important.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <CircularProgress aria-label="Loading orders" />
    </Preview>
  ),
  determinate: () => (
    <Preview>
      {[25, 60, 100].map((value) => (
        <CircularProgress key={value} variant="determinate" value={value} aria-label="Upload" />
      ))}
    </Preview>
  ),
  colors: () => (
    <Preview>
      {(["primary", "secondary", "info", "success", "warning", "error"] as const).map((color) => (
        <CircularProgress key={color} color={color} aria-label="Loading" />
      ))}
      <Button variant="outlined" loading>
        Saving
      </Button>
    </Preview>
  ),
  size: () => (
    <Preview>
      <CircularProgress
        variant="determinate"
        value={70}
        size="3rem"
        thickness={5}
        enableTrackSlot
        aria-label="Storage used"
      />
      <CircularProgress size={24} aria-label="Loading" />
    </Preview>
  ),
  label: () => (
    <Preview>
      <CircularProgress variant="determinate" value={45} aria-label="Upload" />
      <span>45%</span>
    </Preview>
  ),
  delay: () => (
    <Preview>
      <CircularProgress disableShrink aria-label="Loading" />
    </Preview>
  ),
  options: () => <OptionsTable schema={circularProgressOptions} />,
  props: () => (
    <PropsTable
      label="Circular progress content props"
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

/** Circular progress docs page (ADR-0019). */
export function CircularProgressDocs() {
  return <GuideDocs sections={circularProgressSections} previews={PREVIEWS} />;
}
