import { textFieldOptions } from "@owlky/core";
import textFieldApi from "@owlky/docs-content/api/text-field.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { IconButton, InputAdornment, TextField } from "@owlky/react";
import { useState } from "react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { EyeIcon, PersonIcon } from "./text-field-examples.js";

const outline = (label: string) =>
  `<fieldset data-ok-text-field-outline aria-hidden="true"><legend><span>${label}</span></legend></fieldset>`;

export const textFieldSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A text field lets people enter and edit text: one line in an \`<input>\`, several lines in a \`<textarea>\`, or a choice in a \`<select>\`. The label sits inside the field and moves up when the field gets focus or a value. Helper text under the field gives a hint or an error message.

The field is built from native elements, so forms, autofill, the keyboard and assistive technology work as usual. It needs no JavaScript, except for growing textareas and the show-password button.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<div data-ok-text-field data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-margin="none">
  <label data-ok-text-field-label for="email">Email</label>
  <div data-ok-text-field-control>
    <!-- The placeholder tells the CSS whether the field is empty: keep at least a space -->
    <input id="email" data-ok-text-field-input type="email" name="email" autocomplete="email" placeholder=" ">
    ${outline("Email")}
  </div>
</div>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { TextField } from "@owlky/react";

export function Email() {
  return <TextField id="email" label="Email" type="email" name="email" autoComplete="email" />;
}`,
  },
  {
    id: "variants",
    title: "Choose a variant",
    body: "The variant sets the field's frame. `outlined` (the default) draws a border with a gap for the label, `filled` tints the background, and `standard` draws a line under the input. Use one variant throughout a form. In HTML, only the outlined variant has the `fieldset` with the label repeated in its `legend`: that is what leaves the gap in the border.",
    html: `<div data-ok-text-field data-ok-variant="filled" data-ok-size="medium" data-ok-color="default" data-ok-margin="none">
  <label data-ok-text-field-label for="city">City</label>
  <div data-ok-text-field-control>
    <input id="city" data-ok-text-field-input placeholder=" ">
  </div>
</div>`,
    react: `import { TextField } from "@owlky/react";

export function TextFieldVariants() {
  return <TextField id="city" variant="filled" label="City" />;
}`,
  },
  {
    id: "helper",
    title: "Show hints and errors",
    body: 'Pass `helperText` for a hint under the field. Set `error` to show an error: the field turns red, the input gets `aria-invalid`, and the helper text should say how to fix it. In HTML, give the helper text an `id` and point the input\'s `aria-describedby` at it, so screen readers read it with the field. The script sets `aria-invalid` from `data-ok-error`. Without the script, write `aria-invalid="true"` yourself.',
    html: `<div data-ok-text-field data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-margin="none" data-ok-error>
  <label data-ok-text-field-label for="phone">Phone</label>
  <div data-ok-text-field-control>
    <input id="phone" data-ok-text-field-input type="tel" aria-invalid="true" aria-describedby="phone-helper-text" placeholder=" " value="12">
    ${outline("Phone")}
  </div>
  <div data-ok-text-field-helper id="phone-helper-text">Enter at least 8 digits</div>
</div>`,
    react: `import { TextField } from "@owlky/react";

export function TextFieldHelper() {
  return (
    <TextField
      id="phone"
      label="Phone"
      type="tel"
      defaultValue="12"
      error
      helperText="Enter at least 8 digits"
    />
  );
}`,
  },
  {
    id: "adornments",
    title: "Add icons, units and buttons",
    body: "Put an `InputAdornment` at the start or the end of the input for an icon, a unit such as kg, or a button. A start adornment keeps the label above the field. In React, show or hide a password by keeping `type` in state; in HTML, give the end button `data-ok-text-field-reveal`, and the script switches the type and `aria-pressed`.",
    html: `<div data-ok-text-field data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-margin="none">
  <label data-ok-text-field-label for="password">Password</label>
  <div data-ok-text-field-control>
    <input id="password" data-ok-text-field-input type="password" autocomplete="current-password" placeholder=" ">
    <span data-ok-text-field-adornment="end">
      <!-- The script switches the input's type and aria-pressed -->
      <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="md" data-ok-edge="end" data-ok-text-field-reveal aria-label="Show password" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></button>
    </span>
    <fieldset data-ok-text-field-outline aria-hidden="true"><legend><span>Password</span></legend></fieldset>
  </div>
</div>`,
    react: `import { IconButton, InputAdornment, TextField } from "@owlky/react";
import { EyeIcon } from "lucide-react";
import { useState } from "react";

export function Password() {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      id="password"
      label="Password"
      type={shown ? "text" : "password"}
      autoComplete="current-password"
      endAdornment={
        <InputAdornment position="end">
          <IconButton edge="end" aria-label="Show password" aria-pressed={shown} onClick={() => setShown(!shown)}>
            <EyeIcon />
          </IconButton>
        </InputAdornment>
      }
    />
  );
}`,
  },
  {
    id: "select",
    title: "Let people choose from a list",
    body: "Set `select` and pass `<option>` elements to get a native `<select>` in the field's frame. The label always stays above it. A native select uses the system's list on every device, which works well on touch screens and with assistive technology. For a list in the page's own style, set `selectProps` to `{ native: false }` and pass **MenuItem**s: the field then holds a **Select** (see its page).",
    html: `<div data-ok-text-field data-ok-variant="outlined" data-ok-size="small" data-ok-color="default" data-ok-margin="none">
  <label data-ok-text-field-label for="currency">Currency</label>
  <div data-ok-text-field-control>
    <select id="currency" data-ok-text-field-input><option value="USD">$</option><option value="EUR" selected>€</option></select>
    <svg data-ok-text-field-select-icon aria-hidden="true" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" /></svg>
    ${outline("Currency")}
  </div>
</div>`,
    react: `import { TextField } from "@owlky/react";

export function TextFieldSelect() {
  return (
    <TextField id="currency" select size="small" label="Currency" defaultValue="EUR">
      <option value="USD">$</option>
      <option value="EUR">€</option>
    </TextField>
  );
}`,
  },
  {
    id: "multiline",
    title: "Accept several lines",
    body: "Set `multiline` for a textarea. With `rows`, it has a fixed height. Without `rows`, it grows with the text, from `minRows` (default 1) up to `maxRows`, and then scrolls. Growing needs a browser with `field-sizing` support; other browsers show `minRows` rows and scroll.",
    html: `<div data-ok-text-field data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-margin="none" data-ok-min-rows="2" data-ok-max-rows="6">
  <label data-ok-text-field-label for="bio">Bio</label>
  <div data-ok-text-field-control>
    <textarea id="bio" data-ok-text-field-input rows="2" placeholder=" "></textarea>
    ${outline("Bio")}
  </div>
</div>`,
    react: `import { TextField } from "@owlky/react";

export function TextFieldMultiline() {
  return <TextField id="bio" multiline minRows={2} maxRows={6} label="Bio" />;
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and behavior. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **HTML:** the input fires the native \`input\` and \`change\` events. There are no instance methods.
- **React:** \`onChange(value)\` is called with the new value. Use \`value\` to control the field, or \`defaultValue\` to let it keep its own state. The \`ref\` and every other prop, such as \`name\`, \`type\` or \`autoComplete\`, go to the input.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The field is a native input, textarea or select, so the browser provides the keyboard behavior: Tab moves focus, and a select opens with Space, Enter or the arrow keys.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The label is a \`<label for>\`, so it names the input. A field without a label needs \`aria-label\`. Don't use the placeholder as the only label: it disappears when people type.
- Helper text is linked with \`aria-describedby\`; an error also sets \`aria-invalid\`.
- Required fields show an asterisk. The asterisk is hidden from screen readers, which announce the input's \`required\` state instead.
- The resting label and the helper text use the secondary text color, and error text uses the error text tone: each has a contrast ratio of at least 4.5:1. The error border uses the brand error color.
- Focus shows as a 2px border, line or ring in the text color.
- Set \`autoComplete\` (such as \`email\` or \`current-password\`) so browsers and password managers can fill the field.`,
  },
  apiReferenceSection(textFieldApi),
];

function PasswordPreview() {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      label="Password"
      type={shown ? "text" : "password"}
      autoComplete="current-password"
      startAdornment={
        <InputAdornment position="start">
          <PersonIcon />
        </InputAdornment>
      }
      endAdornment={
        <InputAdornment position="end">
          <IconButton
            edge="end"
            aria-label="Show password"
            aria-pressed={shown}
            onClick={() => setShown(!shown)}
          >
            <EyeIcon />
          </IconButton>
        </InputAdornment>
      }
    />
  );
}

const PREVIEWS = {
  overview: () => (
    <Preview>
      <TextField label="Email" type="email" autoComplete="email" />
    </Preview>
  ),
  variants: () => (
    <Preview>
      <TextField label="Outlined" />
      <TextField variant="filled" label="Filled" />
      <TextField variant="standard" label="Standard" />
    </Preview>
  ),
  helper: () => (
    <Preview>
      <TextField label="Phone" type="tel" helperText="Include the area code" />
      <TextField
        label="Phone"
        type="tel"
        error
        defaultValue="12"
        helperText="Enter at least 8 digits"
      />
    </Preview>
  ),
  adornments: () => (
    <Preview>
      <PasswordPreview />
      <TextField label="Weight" endAdornment={<InputAdornment position="end">kg</InputAdornment>} />
    </Preview>
  ),
  select: () => (
    <Preview>
      <TextField id="currency" select size="small" label="Currency" defaultValue="EUR">
        <option value="USD">$</option>
        <option value="EUR">€</option>
      </TextField>
    </Preview>
  ),
  multiline: () => (
    <Preview className="block!">
      <TextField multiline minRows={2} maxRows={6} label="Bio" fullWidth />
    </Preview>
  ),
  options: () => <OptionsTable schema={textFieldOptions} />,
  props: () => (
    <PropsTable
      label="Text field content props"
      rows={[
        {
          react: "label",
          html: "data-ok-text-field-label",
          type: "ReactNode",
          description: "The floating label (a `<label for>`).",
        },
        {
          react: "helperText",
          html: "data-ok-text-field-helper",
          type: "ReactNode",
          description: "Text under the field, linked with `aria-describedby`.",
        },
        {
          react: "startAdornment / endAdornment",
          html: 'data-ok-text-field-adornment="start | end"',
          type: "ReactNode",
          description: "An `InputAdornment` before or after the input.",
        },
        {
          react: "multiline / rows",
          html: "textarea, rows",
          type: "boolean / number",
          description: "A textarea; `rows` fixes its height.",
        },
        {
          react: "select / children",
          html: "select › option",
          type: "boolean / ReactNode",
          description: "A native select with its options.",
        },
        {
          react: "value / defaultValue / onChange",
          html: "value, input event",
          type: "string",
          description: "The value; `onChange(value)` gets the new one.",
        },
        {
          react: "type / name / placeholder / autoComplete",
          html: "on the input",
          type: "string",
          description: "Native attributes, passed to the input.",
        },
        {
          html: "data-ok-text-field-reveal",
          type: "attribute",
          description: "On a button in the field: shows or hides a password (HTML).",
        },
        { react: "ref", type: "HTMLInputElement", description: "The input, textarea or select." },
      ]}
    />
  ),
};

/** Text field docs page (ADR-0019). */
export function TextFieldDocs() {
  return <GuideDocs sections={textFieldSections} previews={PREVIEWS} />;
}
