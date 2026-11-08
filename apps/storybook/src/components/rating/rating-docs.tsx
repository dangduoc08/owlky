import { ratingOptions } from "@owlky/core";
import { Rating } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { HoverDemo } from "./hover-demo.js";
import { HeartIcon } from "./rating-examples.js";

export const ratingSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: 'A rating lets people give a score, such as stars for a product, and shows a score as a row of icons. It is a group of native radio buttons drawn as icons: each value has a radio with a label such as "3 Stars", so the keyboard, screen readers and forms work as they do for any radio group. A last, hidden radio means no rating.',
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<span data-ok-rating data-ok-size="medium" data-ok-color="warning">
  <span data-ok-rating-item>
    <label data-ok-rating-icon data-ok-value="1" for="score-1">
      <svg aria-hidden="true" viewBox="0 0 24 24">…</svg><span data-ok-rating-label-text>1 Star</span>
    </label>
    <input type="radio" data-ok-rating-input id="score-1" name="score" value="1" checked>
  </span>
  <!-- … one item per value … -->
  <label data-ok-rating-empty for="score-empty">Empty</label>
  <input type="radio" data-ok-rating-input id="score-empty" name="score" value="">
</span>`,
    react: `import { Rating } from "@owlky/react";
import { useState } from "react";

export function Score() {
  const [value, setValue] = useState<number | null>(2);
  return <Rating name="score" value={value} onChange={setValue} />;
}`,
  },
  {
    id: "values",
    title: "Choose and clear a value",
    body: "Clicking an icon chooses its value. Clicking the chosen icon again clears the rating, so `onChange` receives `null`. `max` sets the number of icons (5 by default). Set `precision` to `0.5` (or `0.25`) for half values: each icon then holds two radios, and the left half of the icon is its own target.",
    html: `<!-- Precision 0.5: the half value comes first, as a clipped icon over the whole one -->
<label data-ok-rating-icon data-ok-value="0.5" data-ok-fraction="0.5" for="half-0.5">…</label>`,
    react: `<Rating name="half" defaultValue={2.5} precision={0.5} />`,
  },
  {
    id: "read-only",
    title: "Show a score",
    body: 'Set `readOnly` to show a score without radios. The rating is then one image named by its value, for example "2.5 Stars". `disabled` keeps the radios but dims them and ignores input.',
    html: `<span data-ok-rating data-ok-read-only role="img" aria-label="2 Stars">…icons…</span>`,
    react: `<Rating value={2} readOnly />`,
  },
  {
    id: "icons",
    title: "Change the icons and the color",
    body: "`icon` replaces the star and `emptyIcon` the empty one. `renderIcon` returns a different icon per value, for example faces from unhappy to happy, and works well with `highlightSelectedOnly`, which fills only the chosen icon. `color` picks the palette color of filled icons (`warning` by default). Name the values with `getLabelText`.",
    html: `<span data-ok-rating data-ok-color="info" data-ok-size="small">…</span>`,
    react: `<Rating
  name="likes"
  color="info"
  icon={<HeartIcon />}
  getLabelText={(value) => \`\${value} Hearts\`}
/>`,
  },
  {
    id: "hover",
    title: "Give feedback on hover",
    body: 'While the pointer is over the icons, they show the value under it, and that icon grows slightly. `onChangeActive` reports that value, or `null` when the pointer leaves, so you can show a label such as "Good". In HTML, listen to `ok:rating:active`.',
  },
  {
    id: "sizes",
    title: "Size",
    body: "`size` sets the icon size: `xxSmall` (12px), `xSmall` (16px), `small` (20px), `medium` (24px, the default) or `large` (28px).",
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the value and the content. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:rating:change\`** (cancelable) fires on the rating with \`detail.value\` and \`detail.previous\`. Call \`preventDefault()\` to keep the previous value.
- **\`ok:rating:active\`** fires with \`detail.value\`: the value under the pointer, or \`null\`.
- **Instance:** \`runtime.get(element, "rating")\` returns \`{ value, setValue(value) }\`. \`setValue\` doesn't fire events.
- **React:** \`onChange(value)\` and \`onChangeActive(value)\`; controlled with \`value\`, uncontrolled with \`defaultValue\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The rating is one radio group: Tab reaches the chosen value, and the arrow keys change it.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Every value has a label, such as "3 Stars". Pass \`getLabelText\` when your icons mean something else, or to translate it.
- The focused value shows a focus ring around its icon.
- Read-only ratings are one image with the value as its name.
- Icons are 24px by default, the minimum target size for pointers. Use the smaller sizes for read-only scores.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Rating name="docs-rating" defaultValue={2} />
    </Preview>
  ),
  values: () => (
    <Preview>
      <Rating name="docs-half" defaultValue={2.5} precision={0.5} />
    </Preview>
  ),
  "read-only": () => (
    <Preview>
      <Rating defaultValue={2} readOnly />
      <Rating defaultValue={2} name="docs-disabled" disabled />
    </Preview>
  ),
  icons: () => (
    <Preview>
      <Rating name="docs-hearts" defaultValue={3} color="info" icon={<HeartIcon />} />
    </Preview>
  ),
  hover: () => (
    <Preview>
      <HoverDemo />
    </Preview>
  ),
  options: () => <OptionsTable schema={ratingOptions} />,
  props: () => (
    <PropsTable
      label="Rating content props"
      rows={[
        {
          react: "value / defaultValue / onChange",
          html: "checked radio · ok:rating:change",
          type: "number | null",
          description: "The value; `null` is no rating.",
        },
        {
          react: "max / precision",
          html: "one item per value",
          type: "number",
          description: "Number of icons (5) and the smallest step (1, 0.5, 0.25).",
        },
        {
          react: "icon / emptyIcon / renderIcon",
          html: "svg in each label",
          type: "ReactNode",
          description: "The filled, empty or per-value icon.",
        },
        {
          react: "getLabelText / emptyLabelText",
          html: "span[data-ok-rating-label-text] / label[data-ok-rating-empty]",
          type: "string",
          description: 'Labels of the values ("2 Stars") and of no rating ("Empty").',
        },
        {
          react: "name",
          html: "name on the radios",
          type: "string",
          description: "Name of the radio group in a form.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the chosen value (or the first one)."],
        ["Right arrow / Up arrow", "Chooses the next value."],
        ["Left arrow / Down arrow", "Chooses the previous value, down to no rating."],
      ]}
    />
  ),
};

/** Rating docs page (ADR-0019). */
export function RatingDocs() {
  return <GuideDocs sections={ratingSections} previews={PREVIEWS} />;
}
