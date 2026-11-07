import { formControlLabelOptions, radioGroupOptions, radioOptions } from "@owlky/core";
import { FormControlLabel, Radio, RadioGroup } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const ICONS = `<span data-ok-radio-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></span>
      <span data-ok-radio-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="currentColor" fill-rule="evenodd" /></svg></span>`;

const htmlRadio = (value: string, label: string, checked = false) =>
  `  <label data-ok-form-control-label data-ok-label-placement="end">
    <span data-ok-radio data-ok-color="primary" data-ok-size="medium">
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
    html: `<div role="radiogroup" data-ok-radio-group data-ok-row aria-label="Delivery">…</div>`,
    react: `<RadioGroup row name="delivery" defaultValue="standard" aria-label="Delivery">…</RadioGroup>`,
  },
  {
    id: "colors",
    title: "Choose a color and size",
    body: "The color shows on the selected radio. The default is `primary`; `default` uses the text color. The `small` size has a 36px target and a 20px circle.",
    html: `<span data-ok-radio data-ok-color="secondary" data-ok-size="small">…</span>`,
    react: `<Radio color="secondary" size="small" value="a" />`,
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
- Focus is shown with a 2px ring inside the target. The target is at least 36 × 36px.
- Unselected radios use the secondary text color, with a contrast ratio of at least 4.5:1. Brand colors of selected radios follow the design.`,
  },
];

const PREVIEWS = {
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
