import { sliderOptions } from "@owlky/core";
import sliderApi from "@owlky/docs-content/api/slider.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Slider } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { RangeDemo } from "./range-demo.js";

export const sliderSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: 'A slider picks a value, or a range of two values, along a track, such as a volume or a price range. Each thumb holds a native range input: the keyboard, screen readers and forms work as they do for `<input type="range">`. People drag a thumb, or press the track to move the nearest thumb there, with a mouse, a finger or a pen.',
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<span data-ok-slider data-ok-color="primary" data-ok-size="medium" data-ok-orientation="horizontal" data-ok-track="normal" data-ok-value-label-display="off">
  <span data-ok-slider-rail></span>
  <span data-ok-slider-track></span>
  <span data-ok-slider-thumb data-ok-index="0">
    <input type="range" min="0" max="100" step="1" value="30" aria-label="Volume">
  </span>
</span>`,
    react: `import { Slider } from "@owlky/react";
import { useState } from "react";

export function Volume() {
  const [value, setValue] = useState<number | number[]>(30);
  return <Slider aria-label="Volume" value={value} onChange={setValue} />;
}`,
  },
  {
    id: "steps",
    title: "Set steps and marks",
    body: '`min`, `max` and `step` set the values (0, 100 and 1 by default). `marks` draws a tick at every step (`true`), or at the values you list, each with an optional label below the track. Set `step` to `null` to allow only the marked values. In HTML, write one `data-ok-slider-mark` per mark and set `data-ok-step="0"` for marks only.',
    html: `<!-- data-ok-step="0": only the marked values -->
<span data-ok-slider data-ok-color="primary" data-ok-size="medium" data-ok-orientation="horizontal" data-ok-track="normal" data-ok-value-label-display="off" data-ok-step="0">
  <span data-ok-slider-rail></span>
  <span data-ok-slider-track></span>
  <span data-ok-slider-mark data-ok-value="0" data-ok-active></span>
  <span data-ok-slider-mark-label data-ok-value="0" aria-hidden="true">0°C</span>
  <span data-ok-slider-mark data-ok-value="20" data-ok-active></span>
  <span data-ok-slider-mark-label data-ok-value="20" aria-hidden="true">20°C</span>
  <span data-ok-slider-mark data-ok-value="100"></span>
  <span data-ok-slider-mark-label data-ok-value="100" aria-hidden="true">100°C</span>
  <span data-ok-slider-thumb data-ok-index="0">
    <input type="range" min="0" max="100" step="any" value="20" aria-label="Temperature">
  </span>
</span>`,
    react: `import { Slider } from "@owlky/react";

export function Temperature() {
  return (
    <Slider
      aria-label="Temperature"
      defaultValue={20}
      step={null}
      marks={[
        { value: 0, label: "0°C" },
        { value: 20, label: "20°C" },
        { value: 100, label: "100°C" },
      ]}
    />
  );
}`,
  },
  {
    id: "labels",
    title: "Show the value",
    body: '`valueLabelDisplay` shows the value in a bubble above the thumb: `auto` while the thumb is hovered, focused or dragged, `on` always. `valueLabelFormat` sets its text, and `getAriaValueText` what screen readers announce, such as "30°C". In HTML, `data-ok-label-value="{value}°C"` sets both.',
    html: `<!-- data-ok-label-value formats the bubble and aria-valuetext -->
<span data-ok-slider data-ok-color="primary" data-ok-size="medium" data-ok-orientation="horizontal" data-ok-track="normal" data-ok-value-label-display="auto" data-ok-label-value="{value}°C">
  <span data-ok-slider-rail></span>
  <span data-ok-slider-track></span>
  <span data-ok-slider-thumb data-ok-index="0">
    <input type="range" min="0" max="100" step="1" value="30" aria-label="Temperature" aria-valuetext="30°C">
    <span data-ok-slider-value-label aria-hidden="true">30°C</span>
  </span>
</span>`,
    react: `import { Slider } from "@owlky/react";

export function Temperature() {
  return (
    <Slider
      aria-label="Temperature"
      defaultValue={30}
      valueLabelDisplay="auto"
      valueLabelFormat={(value) => \`\${value}°C\`}
      getAriaValueText={(value) => \`\${value}°C\`}
    />
  );
}`,
  },
  {
    id: "range",
    title: "Pick a range",
    body: 'Pass two values to get two thumbs. Name each one with `getAriaLabel`, for example "Minimum price". A thumb that passes the other one swaps places with it, unless you set `disableSwap`. `onChange` fires while the value changes, and `onChangeCommitted` once a drag or a key press ends: use it for costly work such as a search.',
  },
  {
    id: "look",
    title: "Change the look",
    body: "`size` is `medium` (a 10px track) or `small` (6px). `color` is a palette color or `inherit`. `track` is `normal`, `inverted` (filled from the value to the end) or `false`. Set `orientation` to `vertical` for a slider that fills its container's height: give that container a height.",
    html: `<!-- A vertical slider fills its container's height -->
<div style="height: 200px">
  <span data-ok-slider data-ok-color="primary" data-ok-size="medium" data-ok-orientation="vertical" data-ok-track="normal" data-ok-value-label-display="off">
    <span data-ok-slider-rail></span>
    <span data-ok-slider-track></span>
    <span data-ok-slider-thumb data-ok-index="0">
      <input type="range" min="0" max="100" step="1" value="30" aria-label="Level" aria-orientation="vertical">
    </span>
  </span>
</div>`,
    react: `import { Slider } from "@owlky/react";

export function Level() {
  return (
    <div style={{ height: 200 }}>
      <Slider orientation="vertical" aria-label="Level" defaultValue={30} />
    </div>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't valid fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the value and the content. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:slider:change\`** (cancelable) fires while a thumb moves, with \`detail.value\` (one value per thumb) and \`detail.activeThumb\`.
- **\`ok:slider:commit\`** fires when a drag or a key press ends, with \`detail.value\`.
- **Instance:** \`runtime.get(element, "slider")\` returns \`{ value, setValue(value) }\`. \`setValue\` doesn't fire events.
- **React:** \`onChange(value, activeThumb)\` and \`onChangeCommitted(value)\`; controlled with \`value\`, uncontrolled with \`defaultValue\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Each thumb is in the tab order. With `step` set to `null`, the arrow keys move from mark to mark.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Name every thumb with \`aria-label\`, \`aria-labelledby\` or \`getAriaLabel\`.
- Give values a unit with \`getAriaValueText\` when the number alone isn't clear.
- Vertical sliders set \`aria-orientation="vertical"\` on their inputs.
- The focused thumb shows a ring and a halo. Mark labels use the secondary text color, with a contrast ratio of at least 4.5:1.
- Pressing anywhere on the track moves a thumb, so people don't need to hit the 20px thumb exactly.`,
  },
  apiReferenceSection(sliderApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Slider aria-label="Volume" defaultValue={30} />
    </Preview>
  ),
  steps: () => (
    <Preview>
      <Slider
        aria-label="Temperature"
        defaultValue={20}
        step={null}
        valueLabelDisplay="auto"
        marks={[
          { value: 0, label: "0°C" },
          { value: 20, label: "20°C" },
          { value: 37, label: "37°C" },
          { value: 100, label: "100°C" },
        ]}
      />
    </Preview>
  ),
  range: () => (
    <Preview>
      <RangeDemo />
    </Preview>
  ),
  options: () => <OptionsTable schema={sliderOptions} />,
  props: () => (
    <PropsTable
      label="Slider content props"
      rows={[
        {
          react: "value / defaultValue / onChange",
          html: "value of each input · ok:slider:change",
          type: "number | number[]",
          description: "One value, or two for a range.",
        },
        {
          react: "marks",
          html: "span[data-ok-slider-mark] / span[data-ok-slider-mark-label]",
          type: "boolean | { value, label? }[]",
          description: "Ticks on the track, with optional labels.",
        },
        {
          react: "valueLabelFormat / getAriaValueText",
          html: "data-ok-label-value",
          type: "(value, index) => …",
          description: "Text of the bubble and of `aria-valuetext`.",
        },
        {
          react: "getAriaLabel / aria-label / aria-labelledby",
          html: "aria-label / aria-labelledby on each input",
          type: "string",
          description: "Names of the thumbs.",
        },
        {
          react: "onChangeCommitted",
          html: "ok:slider:commit",
          type: "(value) => void",
          description: "A drag or a key press ended.",
        },
        {
          react: "name",
          html: "name on the inputs",
          type: "string",
          description: "Form field name.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the next thumb."],
        ["Right arrow / Up arrow", "Increases the value by one step."],
        ["Left arrow / Down arrow", "Decreases the value by one step."],
        ["Page Up / Page Down", "Increases / decreases the value by ten steps."],
        ["Home / End", "Sets the lowest / highest value."],
      ]}
    />
  ),
};

/** Slider docs page (ADR-0019). */
export function SliderDocs() {
  return <GuideDocs sections={sliderSections} previews={PREVIEWS} />;
}
