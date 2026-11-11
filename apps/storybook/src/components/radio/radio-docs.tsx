import { formControlLabelOptions, radioGroupOptions, radioOptions } from "@owlky/core";
import formControlLabelApi from "@owlky/docs-content/api/form-control-label.json" with {
  type: "json",
};
import radioApi from "@owlky/docs-content/api/radio.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { FormControlLabel, Radio, RadioGroup } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { ColorPickerDemo } from "./color-picker-demo.js";

const ICONS = `<span data-ok-radio-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></span>
      <span data-ok-radio-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="currentColor" fill-rule="evenodd" /></svg></span>`;

const htmlRadio = (
  value: string,
  label: string,
  checked = false,
  { placement = "end", color = "primary", size = "medium" } = {},
) =>
  `  <label data-ok-form-control-label data-ok-label-placement="${placement}">
    <span data-ok-radio data-ok-color="${color}" data-ok-size="${size}">
      <input type="radio" data-ok-radio-input name="delivery" value="${value}"${checked ? " checked" : ""}>
      ${ICONS}
    </span>
    <span data-ok-form-control-label-text>${label}</span>
  </label>`;

export const radioSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `Radio buttons let people pick exactly one option from a short list, such as a delivery method. Show every option at once; for long lists, use a text field with \`select\`. For a single on/off choice, use a **Checkbox** or a **Switch**.

Radios are native \`<input type="radio">\` elements in a \`radiogroup\`. The browser keeps one of them checked and moves between them with the arrow keys. They need no JavaScript.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<div role="radiogroup" data-ok-radio-group aria-label="Delivery">
${htmlRadio("standard", "Standard", true)}
${htmlRadio("express", "Express")}
</div>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { FormControlLabel, Radio, RadioGroup } from "@owlky/react";
import { useState } from "react";

export function Delivery() {
  const [delivery, setDelivery] = useState("standard");
  return (
    <RadioGroup name="delivery" value={delivery} onChange={setDelivery} aria-label="Delivery">
      <FormControlLabel value="standard" label="Standard" control={<Radio />} />
      <FormControlLabel value="express" label="Express" control={<Radio />} />
    </RadioGroup>
  );
}`,
  },
  {
    id: "layout",
    title: "Lay out the group",
    body: "A group stacks its radios in a column. Set `row` to place them side by side; they wrap on narrow screens. Use `labelPlacement` on each form control label to move the text to the `start`, `top` or `bottom`.",
    html: `<!-- Side by side, with the text before each radio -->
<div role="radiogroup" data-ok-radio-group data-ok-row aria-label="Delivery">
${htmlRadio("standard", "Standard", true, { placement: "start" })}
${htmlRadio("express", "Express", false, { placement: "start" })}
</div>`,
    react: `import { FormControlLabel, Radio, RadioGroup } from "@owlky/react";

export function Delivery() {
  return (
    // Side by side, with the text before each radio
    <RadioGroup row name="delivery" defaultValue="standard" aria-label="Delivery">
      <FormControlLabel value="standard" label="Standard" labelPlacement="start" control={<Radio />} />
      <FormControlLabel value="express" label="Express" labelPlacement="start" control={<Radio />} />
    </RadioGroup>
  );
}`,
  },
  {
    id: "colors",
    title: "Choose a color and size",
    body: "The color shows on the selected radio. The default is `primary`; `default` uses the text color. The `small` size has a 36px target and a 20px circle.",
    html: `<div role="radiogroup" data-ok-radio-group aria-label="Delivery">
${htmlRadio("standard", "Standard", true, { color: "secondary", size: "small" })}
${htmlRadio("express", "Express", false, { color: "secondary", size: "small" })}
</div>`,
    react: `import { FormControlLabel, Radio, RadioGroup } from "@owlky/react";

export function Delivery() {
  return (
    <RadioGroup name="delivery" defaultValue="standard" aria-label="Delivery">
      <FormControlLabel value="standard" label="Standard" control={<Radio color="secondary" size="small" />} />
      <FormControlLabel value="express" label="Express" control={<Radio color="secondary" size="small" />} />
    </RadioGroup>
  );
}`,
  },
  {
    id: "color-picker",
    title: "Pick a color",
    body: `Set \`swatch\` to a color to turn a radio into a color swatch, and put the swatches in a row to make a color picker. The swatch shows the color, and the selected one grows, casts a shadow and shows a check mark, so the selection doesn't depend on color alone.

- **Colors:** use a CSS color, such as \`#FF9800\`, \`rgb(0 150 136)\` or \`teal\`, or a token such as \`var(--ok-palette-primary-main)\`. Values that aren't colors are ignored, and the swatch stays grey. The check mark is white or black, whichever contrasts more with a \`#hex\` or \`rgb()\` color.
- **Names:** name each radio after its color with \`aria-label\`, such as "Orange". Screen readers would otherwise read only a value like "#FF9800".
- **Shape and size:** \`shape\` is \`circular\` (the default) or \`rounded\`. The \`small\` size has a 28px target.

In HTML, \`data-ok-swatch\` holds the color, and the script paints it. Without the script, the swatches are grey, and picking a color still works.`,
    html: `<div role="radiogroup" data-ok-radio-group data-ok-row aria-label="Color">
  <span data-ok-radio data-ok-color="primary" data-ok-size="medium" data-ok-swatch="#FF9800">
    <input type="radio" data-ok-radio-input name="color" value="#FF9800" aria-label="Orange" checked>
    <span data-ok-radio-swatch aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
  </span>
  <span data-ok-radio data-ok-color="primary" data-ok-size="medium" data-ok-swatch="#673AB7">
    <input type="radio" data-ok-radio-input name="color" value="#673AB7" aria-label="Deep purple">
    <span data-ok-radio-swatch aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
  </span>
  <span data-ok-radio data-ok-color="primary" data-ok-size="medium" data-ok-swatch="#009688">
    <input type="radio" data-ok-radio-input name="color" value="#009688" aria-label="Teal">
    <span data-ok-radio-swatch aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
  </span>
</div>`,
    react: `import { Radio, RadioGroup } from "@owlky/react";
import { useState } from "react";

const COLORS = [
  { name: "Orange", value: "#FF9800" },
  { name: "Deep purple", value: "#673AB7" },
  { name: "Teal", value: "#009688" },
];

export function ColorField() {
  const [color, setColor] = useState("#FF9800");
  return (
    <RadioGroup row name="color" aria-label="Color" value={color} onChange={setColor}>
      {COLORS.map(({ name, value }) => (
        <Radio key={value} value={value} swatch={value} aria-label={name} />
      ))}
    </RadioGroup>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default. The form control label has its own options.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and behavior. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **HTML:** the newly checked input fires the native \`change\` event. Read the group's value with \`form.elements.delivery.value\` or \`querySelector("input:checked")\`.
- **React:** \`RadioGroup\` calls \`onChange(value)\` with the selected radio's value. Use \`value\` to control it, or \`defaultValue\`. A \`Radio\` outside a group calls \`onChange(checked)\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Radios are native inputs, so the browser provides the keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Name the group with \`aria-label\` or \`aria-labelledby\`, and each radio with a form control label (or \`aria-label\`).
- Only the checked radio is in the tab order; the arrow keys move the selection.
- Focus is shown with a 2px ring inside the target. The target is at least 36 × 36px (28 × 28px for small swatches).
- Color swatches need a name each (the color's name, not its code). The selected swatch is larger and shows a check mark. In forced colors mode, swatches keep their color and the selected one gets an outline.
- Unselected radios use the secondary text color, with a contrast ratio of at least 4.5:1. Brand colors of selected radios follow the design.`,
  },
  apiReferenceSection(radioApi),
  apiReferenceSection(formControlLabelApi, {
    id: "api-form-control-label",
    title: "Form control label API reference",
  }),
];

const PREVIEWS = {
  "color-picker": () => (
    <Preview>
      <ColorPickerDemo />
    </Preview>
  ),
  overview: () => (
    <Preview>
      <RadioGroup name="docs-delivery" defaultValue="standard" aria-label="Delivery">
        <FormControlLabel value="standard" label="Standard" control={<Radio />} />
        <FormControlLabel value="express" label="Express" control={<Radio />} />
      </RadioGroup>
    </Preview>
  ),
  layout: () => (
    <Preview>
      <RadioGroup row name="docs-row" defaultValue="standard" aria-label="Delivery">
        <FormControlLabel value="standard" label="Standard" control={<Radio />} />
        <FormControlLabel value="express" label="Express" control={<Radio />} />
      </RadioGroup>
    </Preview>
  ),
  colors: () => (
    <Preview>
      <RadioGroup row name="docs-colors" defaultValue="secondary" aria-label="Colors">
        <FormControlLabel value="default" label="Default" control={<Radio color="default" />} />
        <FormControlLabel
          value="secondary"
          label="Secondary, small"
          control={<Radio color="secondary" size="small" />}
        />
      </RadioGroup>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={radioOptions} />
      <OptionsTable schema={radioGroupOptions} />
      <OptionsTable schema={formControlLabelOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Radio content props"
      rows={[
        {
          react: "value",
          html: "value",
          type: "string",
          description: "Identifies the radio in its group and in the submitted form.",
        },
        {
          react: "name (RadioGroup)",
          html: "name on every input",
          type: "string",
          description: "The radios' shared name (default: a generated one).",
        },
        {
          react: "icon / checkedIcon",
          html: 'data-ok-radio-icon="…"',
          type: "ReactNode",
          description: "Decorative icons that replace the circle.",
        },
        {
          react: "swatch",
          html: "data-ok-swatch",
          type: "string",
          description:
            "A color swatch instead of the circle: a CSS color or a `var(--ok-…)` token.",
        },
        {
          react: "ref",
          type: "HTMLInputElement",
          description: "The input itself (RadioGroup: the group element).",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus into the group, to the checked radio."],
        ["Arrow keys", "Select the next or previous radio."],
        ["Space", "Selects the focused radio."],
      ]}
    />
  ),
};

/** Radio docs page (ADR-0019). */
export function RadioDocs() {
  return <GuideDocs sections={radioSections} previews={PREVIEWS} />;
}
