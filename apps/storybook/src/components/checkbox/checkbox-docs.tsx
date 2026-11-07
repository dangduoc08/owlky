import { checkboxOptions, formControlLabelOptions } from "@owlky/core";
import { Checkbox, FormControlLabel } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { IndeterminateDemo } from "./indeterminate-demo.js";

const ICONS = `<span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.25" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></span>
    <span data-ok-checkbox-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" /><path data-ok-checkbox-mark d="m7.75 12.25 2.75 2.75 5.75-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
    <span data-ok-checkbox-icon="indeterminate" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" /><path data-ok-checkbox-mark d="M8 12h8" stroke-width="2" stroke-linecap="round" /></svg></span>`;

const htmlCheckbox = (root: string, input: string, label: string, placement = "end") =>
  `<label data-ok-form-control-label data-ok-label-placement="${placement}">
  <span data-ok-checkbox ${root}>
    <input type="checkbox" data-ok-checkbox-input${input}>
    ${ICONS}
  </span>
  <span data-ok-form-control-label-text>${label}</span>
</label>`;

export const checkboxSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A checkbox lets people choose any number of options from a list, or accept a single statement such as terms of use. It is a native \`<input type="checkbox">\`, so forms submit it, and the keyboard and assistive technology work as usual.

Put each checkbox in a **form control label**, so the text names it and clicking the text toggles it. For a setting that applies at once, use a **Switch** instead.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${htmlCheckbox('data-ok-color="primary" data-ok-size="medium"', ' name="newsletter" checked', "Send me the newsletter")}`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Checkbox, FormControlLabel } from "@owlky/react";

export function Newsletter() {
  return (
    <FormControlLabel
      label="Send me the newsletter"
      control={<Checkbox name="newsletter" defaultChecked />}
    />
  );
}`,
  },
  {
    id: "state",
    title: "Read and set the checked state",
    body: "In React, use `checked` with `onChange(checked)` to control the checkbox, or `defaultChecked` to let it keep its own state. `onChange` receives the new checked state. The `ref` and every other prop, such as `name`, `value` or `aria-label`, go to the input, so form libraries can register it. In HTML, read `input.checked` and listen for the native `change` event.",
    html: `<script type="module">
  const input = document.querySelector("[name='newsletter']");
  // Save the setting whenever the user changes it
  input.addEventListener("change", () => saveSetting("newsletter", input.checked));
</script>`,
    react: `export function Newsletter() {
  const [subscribed, setSubscribed] = useState(true);
  return (
    <FormControlLabel
      label="Send me the newsletter"
      control={<Checkbox checked={subscribed} onChange={setSubscribed} />}
    />
  );
}`,
  },
  {
    id: "colors",
    title: "Choose a color and size",
    body: "The color shows when the box is checked or mixed. The default is `primary`. Use `default` for the text color, or another palette color to match the context. The `small` size has a 36px target and a 20px box, for dense layouts such as tables. The default `medium` size has a 40px target and a 24px box.",
    html: htmlCheckbox(
      'data-ok-color="secondary" data-ok-size="small"',
      " checked",
      "Secondary, small",
    ),
    react: `<FormControlLabel
  label="Secondary, small"
  control={<Checkbox color="secondary" size="small" defaultChecked />}
/>`,
  },
  {
    id: "placement",
    title: "Place the label",
    body: "By default, the text follows the box (`end`). Set `labelPlacement` to `start`, `top` or `bottom` to move it. The label's negative margin lines the box up with the content edge.",
    html: htmlCheckbox('data-ok-color="primary" data-ok-size="medium"', "", "Top", "top"),
    react: `<FormControlLabel label="Top" labelPlacement="top" control={<Checkbox />} />`,
  },
  {
    id: "icons",
    title: "Use your own icons",
    body: "Pass `icon` and `checkedIcon` (and `indeterminateIcon`) to replace the box. In HTML, put your SVG inside the matching `data-ok-checkbox-icon` span. Icons follow the text color, so they take the checkbox's colors. Keep them decorative with `aria-hidden`: the label names the checkbox.",
    html: `<span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24">…</svg></span>`,
    react: `<Checkbox icon={<HeartIcon />} checkedIcon={<HeartFilledIcon />} aria-label="Favorite" />`,
  },
  {
    id: "indeterminate",
    title: "Select all with a parent checkbox",
    body: `A parent checkbox shows a dash (mixed) when only some of its children are checked. In React, compute the state with \`selectAllState\` from \`@owlky/core\` and pass \`checked\` and \`indeterminate\`. In HTML, list the children's ids in the parent's \`aria-controls\`: the script checks or clears all of them, and keeps the parent's state in step.

Set \`data-ok-indeterminate\` (or \`indeterminate\` in React) for a mixed state of your own. A click by the user clears it, as with native checkboxes.`,
    html: `${htmlCheckbox('data-ok-color="primary" data-ok-size="medium"', ' aria-controls="tea coffee"', "All drinks")}
${htmlCheckbox('data-ok-color="primary" data-ok-size="medium"', ' id="tea" checked', "Tea")}
${htmlCheckbox('data-ok-color="primary" data-ok-size="medium"', ' id="coffee"', "Coffee")}`,
    react: `const { checked, indeterminate } = selectAllState(selected.length, drinks.length);

<FormControlLabel
  label="All drinks"
  control={
    <Checkbox
      checked={checked}
      indeterminate={indeterminate}
      onChange={(next) => setSelected(next ? drinks : [])}
    />
  }
/>`,
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
    body: `- **HTML:** the input fires the native \`change\` event when the user toggles it. A parent's \`change\` updates its children without firing their \`change\` events. There are no instance methods.
- **React:** \`onChange(checked)\` is called with the new state.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The checkbox is a native input, so the browser provides the keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Every checkbox needs a name: a form control label, or \`aria-label\` / \`aria-labelledby\` on the input.
- The mixed state sets the input's \`indeterminate\`, so screen readers announce "mixed". A parent lists its children in \`aria-controls\`.
- Focus is shown with a 2px ring inside the target. The target is at least 36 × 36px.
- The unchecked box uses the secondary text color, with a contrast ratio of at least 4.5:1. Brand colors of checked boxes follow the design, so light colors such as \`warning\` are below 3:1 on white.
- Group related checkboxes under a heading or a \`<fieldset>\` with a \`<legend>\`.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <FormControlLabel label="Send me the newsletter" control={<Checkbox defaultChecked />} />
    </Preview>
  ),
  colors: () => (
    <Preview>
      <FormControlLabel label="Default" control={<Checkbox color="default" defaultChecked />} />
      <FormControlLabel
        label="Secondary, small"
        control={<Checkbox color="secondary" size="small" defaultChecked />}
      />
    </Preview>
  ),
  placement: () => (
    <Preview>
      {(["top", "start", "bottom", "end"] as const).map((placement) => (
        <FormControlLabel
          key={placement}
          label={placement}
          labelPlacement={placement}
          control={<Checkbox />}
        />
      ))}
    </Preview>
  ),
  indeterminate: () => (
    <Preview className="flex-col items-start!">
      <IndeterminateDemo />
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={checkboxOptions} />
      <OptionsTable schema={formControlLabelOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Checkbox content props"
      rows={[
        {
          react: "icon / checkedIcon / indeterminateIcon",
          html: 'data-ok-checkbox-icon="…"',
          type: "ReactNode",
          description: "Decorative icons that replace the box.",
        },
        {
          react: "onChange",
          html: "change event",
          type: "(checked: boolean) => void",
          description: "Called with the new checked state.",
        },
        {
          react: "name / value / required / id",
          html: "on the input",
          type: "string / boolean",
          description: "Native form attributes, passed to the input.",
        },
        {
          react: "ref",
          type: "HTMLInputElement",
          description: "The input itself.",
        },
        {
          react: "label (FormControlLabel)",
          html: "data-ok-form-control-label-text",
          type: "ReactNode",
          description: "The visible text that names the control.",
        },
        {
          react: "control (FormControlLabel)",
          type: "ReactElement",
          description:
            "The checkbox. `disabled`, `required`, `checked`, `onChange` and `value` on the label are passed to it.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the checkbox."],
        ["Space", "Toggles it."],
      ]}
    />
  ),
};

/** Checkbox docs page (ADR-0019). */
export function CheckboxDocs() {
  return <GuideDocs sections={checkboxSections} previews={PREVIEWS} />;
}
