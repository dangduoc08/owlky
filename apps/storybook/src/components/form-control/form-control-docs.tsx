import {
  formControlOptions,
  formGroupOptions,
  formHelperTextOptions,
  formLabelOptions,
} from "@owlky/core";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
} from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const CHECKBOX_ICONS = `<span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.25" fill="none" stroke="currentColor" stroke-width="1.5"></rect></svg></span>
        <span data-ok-checkbox-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor"></rect><path data-ok-checkbox-mark d="m7.75 12.25 2.75 2.75 5.75-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
        <span data-ok-checkbox-icon="indeterminate" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor"></rect><path data-ok-checkbox-mark d="M8 12h8" stroke-width="2" stroke-linecap="round"></path></svg></span>`;

const RADIO_ICONS = `<span data-ok-radio-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" stroke-width="1.5"></circle></svg></span>
        <span data-ok-radio-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="currentColor" fill-rule="evenodd"></path></svg></span>`;

/** A labelled checkbox, as `FormControlLabel` + `Checkbox` render it. */
const htmlCheckbox = (name: string, label: string, { checked = false, invalid = false } = {}) =>
  `    <label data-ok-form-control-label data-ok-label-placement="end">
      <span data-ok-checkbox data-ok-color="primary" data-ok-size="medium">
        <input type="checkbox" data-ok-checkbox-input${invalid ? ' aria-invalid="true"' : ""} name="${name}"${checked ? " checked" : ""}>
        ${CHECKBOX_ICONS}
      </span>
      <span data-ok-form-control-label-text>${label}</span>
    </label>`;

/** A labelled radio, as `FormControlLabel` + `Radio` render it in a `RadioGroup`. */
const htmlRadio = (group: string, value: string, label: string, checked = false) =>
  `    <label data-ok-form-control-label data-ok-label-placement="end">
      <span data-ok-radio data-ok-color="primary" data-ok-size="medium">
        <input type="radio" data-ok-radio-input value="${value}" name="${group}"${checked ? " checked" : ""}>
        ${RADIO_ICONS}
      </span>
      <span data-ok-form-control-label-text>${label}</span>
    </label>`;

export const formControlSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A form control groups a control with its label and helper text, and shares their states: disabled, error, required and focused. It is made of four parts:

- **FormControl:** the root. It holds the shared states, and its element is usually a \`fieldset\` for a group of controls.
- **FormLabel:** the label, in the secondary text color. In a \`fieldset\`, it is the \`legend\`.
- **FormGroup:** a column or a row of labelled checkboxes or switches. Radios use a **RadioGroup**.
- **FormHelperText:** a hint or an error message under the controls.

Form controls need no JavaScript. In HTML, the states are attributes on the root that the parts' styles read. In React, \`FormControl\` also shares them through a context. A **Text field** has its own label and helper text, so it doesn't go inside a form control.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<fieldset data-ok-form-control aria-describedby="assign-helper">
  <legend data-ok-form-label>Assign responsibility</legend>
  <div data-ok-form-group>
${htmlCheckbox("gilad", "Gilad Gray", { checked: true })}
${htmlCheckbox("jason", "Jason Killian")}
  </div>
  <p data-ok-form-helper-text id="assign-helper">Be careful</p>
</fieldset>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
} from "@owlky/react";

export function Responsibility() {
  return (
    <FormControl component="fieldset" aria-describedby="assign-helper">
      <FormLabel component="legend">Assign responsibility</FormLabel>
      <FormGroup>
        <FormControlLabel label="Gilad Gray" control={<Checkbox name="gilad" defaultChecked />} />
        <FormControlLabel label="Jason Killian" control={<Checkbox name="jason" />} />
      </FormGroup>
      <FormHelperText id="assign-helper">Be careful</FormHelperText>
    </FormControl>
  );
}`,
  },
  {
    id: "radio-group",
    title: "Label a radio group",
    body: "Wrap a **RadioGroup** in a form control. Use a `fieldset` root with a `legend` label, so the browser names the group. Also point the radio group's `aria-labelledby` at the label's `id`. To use a `div` root instead, set the label's `component` to `span` and keep `aria-labelledby`: a `div` doesn't name its content.",
    html: `<fieldset data-ok-form-control>
  <legend data-ok-form-label id="gender-label">Gender</legend>
  <div role="radiogroup" data-ok-radio-group aria-labelledby="gender-label">
${htmlRadio("gender", "female", "Female", true)}
${htmlRadio("gender", "male", "Male")}
  </div>
</fieldset>`,
    react: `import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@owlky/react";

export function Gender() {
  return (
    <FormControl component="fieldset">
      <FormLabel component="legend" id="gender-label">
        Gender
      </FormLabel>
      <RadioGroup name="gender" defaultValue="female" aria-labelledby="gender-label">
        <FormControlLabel label="Female" control={<Radio value="female" />} />
        <FormControlLabel label="Male" control={<Radio value="male" />} />
      </RadioGroup>
    </FormControl>
  );
}`,
  },
  {
    id: "error",
    title: "Show an error",
    body: "Add `error` to the form control. The label and the helper text turn to the error color, which keeps a contrast ratio of at least 4.5:1. Color alone doesn't reach assistive technology, so also set `aria-invalid` on the radio group or on each checkbox, and reference the helper text with `aria-describedby` so the message is read with the controls.",
    html: `<fieldset data-ok-form-control data-ok-error>
  <legend data-ok-form-label id="quiz-label">Pick the right answer</legend>
  <div role="radiogroup" data-ok-radio-group aria-labelledby="quiz-label" aria-describedby="quiz-helper" aria-invalid="true">
${htmlRadio("quiz", "one", "Exactly one option")}
${htmlRadio("quiz", "many", "Many options", true)}
  </div>
  <p data-ok-form-helper-text id="quiz-helper">Sorry, wrong answer!</p>
</fieldset>`,
    react: `import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from "@owlky/react";
import { useState } from "react";

export function Quiz() {
  const [answer, setAnswer] = useState("many");
  const wrong = answer !== "one";
  return (
    <FormControl component="fieldset" error={wrong}>
      <FormLabel component="legend" id="quiz-label">
        Pick the right answer
      </FormLabel>
      <RadioGroup
        name="quiz"
        value={answer}
        onChange={setAnswer}
        aria-labelledby="quiz-label"
        aria-describedby="quiz-helper"
        aria-invalid={wrong}
      >
        <FormControlLabel label="Exactly one option" control={<Radio value="one" />} />
        <FormControlLabel label="Many options" control={<Radio value="many" />} />
      </RadioGroup>
      <FormHelperText id="quiz-helper">{wrong ? "Sorry, wrong answer!" : "You got it!"}</FormHelperText>
    </FormControl>
  );
}`,
  },
  {
    id: "states",
    title: "Mark as required or disabled",
    body: `- **Required:** add \`required\`. The label shows an asterisk, which assistive technology skips. Set \`aria-required\` on a radio group, or \`required\` on an input, so the requirement is announced. In HTML, write the asterisk in the label.
- **Disabled:** add \`disabled\`. The label turns grey. On a \`fieldset\` root, Owlky also sets the native \`disabled\` attribute, which turns off every control inside. On a \`div\` root, set \`disabled\` on each control too.
- **Focused:** add \`focused\` to show the label in the focus color, which \`color\` sets. The default is the text color.`,
    html: `<fieldset data-ok-form-control data-ok-required>
  <legend data-ok-form-label id="plan-label">Plan<span data-ok-form-label-asterisk aria-hidden="true">*</span></legend>
  <div role="radiogroup" data-ok-radio-group data-ok-row aria-labelledby="plan-label" aria-required="true">
${htmlRadio("plan", "free", "Free")}
${htmlRadio("plan", "pro", "Pro")}
  </div>
</fieldset>

<!-- The native disabled attribute turns off every control inside -->
<fieldset data-ok-form-control data-ok-disabled disabled>
  <legend data-ok-form-label>Notifications</legend>
  <div data-ok-form-group>
${htmlCheckbox("email", "Email", { checked: true })}
  </div>
</fieldset>`,
    react: `import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
} from "@owlky/react";

export function Settings() {
  return (
    <>
      <FormControl component="fieldset" required>
        <FormLabel component="legend" id="plan-label">
          Plan
        </FormLabel>
        <RadioGroup name="plan" row aria-labelledby="plan-label" aria-required="true">
          <FormControlLabel label="Free" control={<Radio value="free" />} />
          <FormControlLabel label="Pro" control={<Radio value="pro" />} />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" disabled>
        <FormLabel component="legend">Notifications</FormLabel>
        <FormGroup>
          <FormControlLabel label="Email" control={<Checkbox name="email" defaultChecked />} />
        </FormGroup>
      </FormControl>
    </>
  );
}`,
  },
  {
    id: "standalone",
    title: "Label a single control",
    body: "A control that has no label of its own, such as a **Switch**, takes a FormLabel with `htmlFor` (`for` in HTML) pointing at its input's `id`. Clicking the label then toggles the control. The control sits under its label; give the helper text an `id` and reference it from the input.",
    html: `<div data-ok-form-control>
  <label data-ok-form-label for="mentions">Email notifications</label>
  <span data-ok-switch data-ok-color="primary" data-ok-size="medium">
    <input type="checkbox" role="switch" data-ok-switch-input id="mentions" aria-describedby="mentions-helper" checked>
    <span data-ok-switch-track aria-hidden="true"></span>
    <span data-ok-switch-thumb aria-hidden="true"></span>
  </span>
  <p data-ok-form-helper-text id="mentions-helper">Get an email when someone mentions you.</p>
</div>`,
    react: `import { FormControl, FormHelperText, FormLabel, Switch } from "@owlky/react";

export function Mentions() {
  return (
    <FormControl>
      <FormLabel htmlFor="mentions">Email notifications</FormLabel>
      <Switch id="mentions" defaultChecked aria-describedby="mentions-helper" />
      <FormHelperText id="mentions-helper">Get an email when someone mentions you.</FormHelperText>
    </FormControl>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default. The form control's states reach its label and helper text. A state set on a part, such as `error` on one FormHelperText, applies to that part only. `size` and `variant` are shared with an input composed inside the form control; `outlined` and `filled` indent the helper text.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the elements of each part. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: "Form controls have no events or methods. Listen to the native `change` event of the controls inside, or to their React `onChange`. In React, `useFormControl()` returns the enclosing form control's states, or `undefined` outside one, so your own input can follow them.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Labels and helper texts don't take focus. The controls inside keep their native keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Name a group of controls with a \`fieldset\` and its \`legend\`, or with \`aria-labelledby\` on the group pointing at the label's \`id\`.
- Reference the helper text from the controls or the group with \`aria-describedby\`, so it is read with them.
- Expose errors with \`aria-invalid\` and requirements with \`aria-required\` or \`required\` on the controls: the colors and the asterisk are visual only.
- Labels and helper texts use the secondary text color, and errors the error text color, with a contrast ratio of at least 4.5:1 in the light and dark themes. Disabled labels are dimmed, like the disabled controls.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <FormControl component="fieldset" aria-describedby="docs-assign-helper">
        <FormLabel component="legend">Assign responsibility</FormLabel>
        <FormGroup>
          <FormControlLabel label="Gilad Gray" control={<Checkbox name="gilad" defaultChecked />} />
          <FormControlLabel label="Jason Killian" control={<Checkbox name="jason" />} />
        </FormGroup>
        <FormHelperText id="docs-assign-helper">Be careful</FormHelperText>
      </FormControl>
    </Preview>
  ),
  "radio-group": () => (
    <Preview>
      <FormControl component="fieldset">
        <FormLabel component="legend" id="docs-gender-label">
          Gender
        </FormLabel>
        <RadioGroup name="docs-gender" defaultValue="female" aria-labelledby="docs-gender-label">
          <FormControlLabel label="Female" control={<Radio value="female" />} />
          <FormControlLabel label="Male" control={<Radio value="male" />} />
        </RadioGroup>
      </FormControl>
    </Preview>
  ),
  error: () => (
    <Preview>
      <FormControl component="fieldset" error>
        <FormLabel component="legend" id="docs-quiz-label">
          Pick the right answer
        </FormLabel>
        <RadioGroup
          name="docs-quiz"
          defaultValue="many"
          aria-labelledby="docs-quiz-label"
          aria-describedby="docs-quiz-helper"
          aria-invalid="true"
        >
          <FormControlLabel label="Exactly one option" control={<Radio value="one" />} />
          <FormControlLabel label="Many options" control={<Radio value="many" />} />
        </RadioGroup>
        <FormHelperText id="docs-quiz-helper">Sorry, wrong answer!</FormHelperText>
      </FormControl>
    </Preview>
  ),
  states: () => (
    <Preview>
      <FormControl component="fieldset" required>
        <FormLabel component="legend" id="docs-plan-label">
          Plan
        </FormLabel>
        <RadioGroup name="docs-plan" row aria-labelledby="docs-plan-label" aria-required="true">
          <FormControlLabel label="Free" control={<Radio value="free" />} />
          <FormControlLabel label="Pro" control={<Radio value="pro" />} />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" disabled>
        <FormLabel component="legend">Notifications</FormLabel>
        <FormGroup>
          <FormControlLabel label="Email" control={<Checkbox name="email" defaultChecked />} />
        </FormGroup>
      </FormControl>
    </Preview>
  ),
  standalone: () => (
    <Preview>
      <FormControl>
        <FormLabel htmlFor="docs-mentions">Email notifications</FormLabel>
        <Switch id="docs-mentions" defaultChecked aria-describedby="docs-mentions-helper" />
        <FormHelperText id="docs-mentions-helper">
          Get an email when someone mentions you.
        </FormHelperText>
      </FormControl>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={formControlOptions} />
      <OptionsTable schema={formLabelOptions} />
      <OptionsTable schema={formGroupOptions} />
      <OptionsTable schema={formHelperTextOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Form control content props"
      rows={[
        {
          react: "FormControl component",
          html: "the element",
          type: "ElementType",
          description:
            "The root element, such as `fieldset` for a group of controls. Default `div`.",
        },
        {
          react: "FormLabel component",
          html: "the element",
          type: "ElementType",
          description:
            "`label` (default, with `htmlFor`), `legend` inside a `fieldset`, or `span` for a label referenced by `aria-labelledby`.",
        },
        {
          react: "FormLabel htmlFor",
          html: "for",
          type: "string",
          description: "The `id` of the input that the label names.",
        },
        {
          react: "FormLabel required",
          html: "span[data-ok-form-label-asterisk]",
          type: "boolean",
          description:
            "Shows the asterisk. React shows it when the form control is required too; `false` hides it.",
        },
        {
          react: "FormHelperText component",
          html: "the element",
          type: "ElementType",
          description: "The helper text's element. Default `p`.",
        },
        {
          react: "useFormControl()",
          html: "the root's attributes",
          type: "FormControlState | undefined",
          description:
            "The enclosing form control's `color`, `size`, `variant`, `margin`, `fullWidth`, `disabled`, `error`, `required` and `focused`.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the controls inside the form control, in order."],
        ["Space", "Toggles the focused checkbox or switch, or selects the focused radio."],
        ["Arrow keys", "Move between the radios of a radio group."],
      ]}
    />
  ),
};

/** Form control docs page (ADR-0019). */
export function FormControlDocs() {
  return <GuideDocs sections={formControlSections} previews={PREVIEWS} />;
}
