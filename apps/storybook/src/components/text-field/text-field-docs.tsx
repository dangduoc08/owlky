import { numberFieldOptions, textFieldOptions } from "@owlky/core";
import textFieldApi from "@owlky/docs-content/api/text-field.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import {
  FilledInput,
  IconButton,
  Input,
  InputAdornment,
  InputBase,
  NumberField,
  OutlinedInput,
  TextField,
} from "@owlky/react";
import { useState } from "react";
import copyButtonGroup from "../../../../../packages/html/src/components/text-field/examples/copy-to-clipboard-button.html?raw";
import numberHelperGroup from "../../../../../packages/html/src/components/text-field/examples/number-input-helper.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { SolarIcon, solarMarkup } from "../../helpers/solar-icons.js";
import { CopyButtonDemo, CopyDoubleClickDemo } from "./copy-demo.js";
import { PersonIcon } from "./text-field-examples.js";

const SEARCH_SVG = solarMarkup("magnifier-linear");

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
      <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="md" data-ok-edge="end" data-ok-text-field-reveal aria-label="Show password" aria-pressed="false">${solarMarkup("eye-linear")}</button>
    </span>
    <fieldset data-ok-text-field-outline aria-hidden="true"><legend><span>Password</span></legend></fieldset>
  </div>
</div>`,
    react: `import { IconButton, InputAdornment, TextField } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import eyeLinear from "@iconify-icons/solar/eye-linear";
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
            <Icon icon={eyeLinear} aria-hidden="true" />
          </IconButton>
        </InputAdornment>
      }
    />
  );
}`,
  },
  {
    id: "hidden-label",
    title: "Hide the label",
    body: "When the context already says what a field is for, such as a search field in a toolbar, set `hiddenLabel`. The label is hidden visually but still names the input for assistive technology, and the field is laid out as if it had no label: a filled field gets less padding above the value. Show a placeholder instead, so sighted users know what to type. An adornment that only decorates the field can let presses through to the input: set `disablePointerEvents` on it (HTML: `data-ok-disable-pointer-events`).",
    html: `<div data-ok-text-field data-ok-variant="filled" data-ok-size="small" data-ok-color="default" data-ok-margin="none" data-ok-hidden-label>
  <label data-ok-text-field-label for="search">Search</label>
  <div data-ok-text-field-control>
    <span data-ok-text-field-adornment="start" data-ok-disable-pointer-events>${SEARCH_SVG}</span>
    <input id="search" data-ok-text-field-input type="search" placeholder="Search orders">
  </div>
</div>`,
    react: `import { InputAdornment, TextField } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import magnifierLinear from "@iconify-icons/solar/magnifier-linear";

export function SearchField() {
  return (
    <TextField
      id="search"
      variant="filled"
      size="small"
      label="Search"
      hiddenLabel
      type="search"
      placeholder="Search orders"
      startAdornment={
        <InputAdornment position="start" disablePointerEvents>
          <Icon icon={magnifierLinear} aria-hidden="true" />
        </InputAdornment>
      }
    />
  );
}`,
  },
  {
    id: "standalone",
    title: "Use an input without a label",
    body: "For fields you build yourself, such as a search bar or a value inside another control, use a standalone input: the field without its label and helper text. `OutlinedInput`, `FilledInput` and `Input` draw the outlined, filled and standard looks. `InputBase` draws no box at all, so you style it yourself, and it shows no focus ring: give its container one, for example with `:focus-within`. In HTML, write the TextField markup without the label and add `data-ok-input-base` to the root. Leave out `data-ok-variant` for an InputBase.\n\nName every standalone input with `aria-label`, or with `aria-labelledby` that points at visible text. `OutlinedInput`'s `label` doesn't name the input: it only makes room in the outline for a label that you place yourself, and `notched` keeps that room open. `disableUnderline` removes the standard field's line. `inputComponent` renders your own element instead of the `<input>`, such as a masked input; it receives the input's props and `ref`. These props also work on `TextField`.",
    html: `<div data-ok-text-field data-ok-size="small" data-ok-color="default" data-ok-margin="none" data-ok-input-base>
  <div data-ok-text-field-control>
    <span data-ok-text-field-adornment="start" data-ok-disable-pointer-events>${SEARCH_SVG}</span>
    <input data-ok-text-field-input type="search" aria-label="Search orders" placeholder="Search orders">
  </div>
</div>
<div data-ok-text-field data-ok-variant="outlined" data-ok-size="small" data-ok-color="default" data-ok-margin="none" data-ok-input-base>
  <div data-ok-text-field-control>
    <input data-ok-text-field-input aria-label="Quantity" inputmode="numeric" placeholder="0">
    <fieldset data-ok-text-field-outline aria-hidden="true"></fieldset>
  </div>
</div>`,
    react: `import { InputAdornment, InputBase, OutlinedInput } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import magnifierLinear from "@iconify-icons/solar/magnifier-linear";

export function StandaloneInputs() {
  return (
    <>
      <InputBase
        size="small"
        type="search"
        aria-label="Search orders"
        placeholder="Search orders"
        startAdornment={
          <InputAdornment position="start" disablePointerEvents>
            <Icon icon={magnifierLinear} aria-hidden="true" />
          </InputAdornment>
        }
      />
      <OutlinedInput size="small" aria-label="Quantity" inputMode="numeric" placeholder="0" />
    </>
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
    id: "copy",
    title: "Copy text to the clipboard",
    body: `Put a copy button in the end adornment to let people copy what the field holds. In React, call \`copy(text)\` from \`useCopyToClipboard()\` in the button's click handler. In HTML, give the button \`data-ok-clipboard-copy\`, and the script copies the input of the text field around it.

Browsers only allow a copy while the page handles a click or a key press, and some refuse it, for example when a permission policy blocks the clipboard. Without the Clipboard API, Owlky uses the browser's copy command instead. \`copy()\` never throws: it resolves \`{ ok: true }\`, or \`{ ok: false, reason }\` with the reason \`gesture\`, \`unsupported\` or \`denied\`. Tell people the result either way, because nothing on the screen changes after a copy. A toast does this, and the toaster's live region announces the message to screen readers. In HTML, \`data-ok-clipboard-toast\` and \`data-ok-clipboard-error-toast\` name the \`<template>\` toasts to show.

To copy other text, set the trigger's value to the \`id\` of the element to copy, or put the text in \`data-ok-clipboard-text\`. With \`data-ok-clipboard-trigger="dblclick"\`, a double click copies instead of a click. A double click needs a pointer, so also offer a button that copies the same text for keyboard users.`,
    html: `<!-- Load once per page: the script copies and shows the toasts -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${copyButtonGroup.trimEnd()}`,
    react: `import { IconButton, InputAdornment, TextField, Toaster, toast, useCopyToClipboard } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import copyLinear from "@iconify-icons/solar/copy-linear";
import { useState } from "react";

export function CopyLink() {
  const [value, setValue] = useState("https://www.npmjs.com/package/@owlky/react");
  const { copy } = useCopyToClipboard();
  const onCopy = async () => {
    const result = await copy(value);
    // The toaster's live region announces the result.
    if (result.ok) toast.success("Copied!");
    else toast.error("Couldn't copy. Select the text and copy it yourself.");
  };
  return (
    <>
      <TextField
        id="copy-link"
        fullWidth
        label="Link"
        value={value}
        onChange={setValue}
        endAdornment={
          <InputAdornment position="end">
            <IconButton edge="end" aria-label="Copy" onClick={onCopy}>
              <Icon icon={copyLinear} aria-hidden="true" />
            </IconButton>
          </InputAdornment>
        }
      />
      <Toaster closeButton />
    </>
  );
}`,
  },
  {
    id: "number",
    title: "Enter a number",
    body: `Use \`NumberField\` for a number that people adjust as often as they type it, such as a quantity or a number of guests. The value sits between a decrement and an increment button, and the input is a spin button: Arrow Up and Arrow Down change the value by \`step\`, Page Up and Page Down by \`largeStep\`, and Home and End go to \`min\` and \`max\`. Hold Shift for \`largeStep\`, or Alt for \`smallStep\`.

The value is a number, or \`null\` when the field is empty. People can type freely: \`onValueChange(value, details)\` reports each text that is a number, and the field shows the value again when they press Enter or leave it. A value outside \`min\` and \`max\` is clamped then, unless you set \`allowOutOfRange\`. A button turns off when the value reaches its bound, and both turn off when the field is disabled or read-only.

In HTML, add \`data-ok-number-field\` and the bounds to a text field root, \`role="spinbutton"\` and the \`aria-value*\` attributes to its input, and the two buttons in its adornments. The script keeps the value, the text, the \`aria-value*\` attributes and the buttons in step, and fires \`ok:number-field:change\` and \`ok:number-field:commit\`.`,
    html: `<!-- Load once per page: the script handles the buttons and the keys -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${numberHelperGroup.trimEnd()}`,
    react: `import { NumberField } from "@owlky/react";
import { useState } from "react";

export function Bedrooms() {
  const [bedrooms, setBedrooms] = useState<number | null>(0);
  return (
    <NumberField
      id="number-helper"
      label="Bedrooms"
      value={bedrooms}
      onValueChange={setBedrooms}
      min={0}
      max={10}
      helperText="Helper text"
    />
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default. The second table lists the options a number field adds to its text field root.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and behavior. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **HTML:** the input fires the native \`input\` and \`change\` events. A number field fires \`ok:number-field:change\` with \`detail.value\` and \`detail.reason\` (\`preventDefault()\` refuses the value) and \`ok:number-field:commit\`. Its instance has \`getValue()\`, \`setValue(value)\`, \`stepUp(amount)\` and \`stepDown(amount)\`. After each copy, a copy trigger fires \`ok:clipboard:copy\` with \`detail.text\`, \`detail.ok\` and, when the copy failed, \`detail.reason\`. Its instance method \`copy()\` copies as a press does.
- **React:** \`onChange(value)\` is called with the new value. \`useCopyToClipboard()\` returns \`copy(text)\` and \`copiedText\`, the text of the last successful copy. \`NumberField\` calls \`onValueChange(value, details)\` and \`onValueCommitted(value, details)\`. Use \`value\` to control the field, or \`defaultValue\` to let it keep its own state. The \`ref\` and every other prop, such as \`name\`, \`type\` or \`autoComplete\`, go to the input.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The field is a native input, textarea or select, so the browser provides the keyboard behavior: Tab moves focus, and a select opens with Space, Enter or the arrow keys. A number field's input is a spin button with these keys. Its buttons aren't in the tab order, because the keys do the same.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The label is a \`<label for>\`, so it names the input. A field without a label needs \`aria-label\`. Don't use the placeholder as the only label: it disappears when people type.
- Helper text is linked with \`aria-describedby\`; an error also sets \`aria-invalid\`.
- Required fields show an asterisk. The asterisk is hidden from screen readers, which announce the input's \`required\` state instead.
- The resting label and the helper text use the secondary text color, and error text uses the error text tone: each has a contrast ratio of at least 4.5:1. The error border uses the brand error color.
- Focus shows as a 2px border, line or ring in the text color.
- Set \`autoComplete\` (such as \`email\` or \`current-password\`) so browsers and password managers can fill the field.
- A number field's input has the \`spinbutton\` role, so screen readers announce its value, minimum and maximum. Its buttons are named "Decrease" and "Increase" (\`decrementLabel\` and \`incrementLabel\` translate them) and point at the input with \`aria-controls\`.
- A copy changes nothing on the screen: announce its result, for example with a toast, whose live region screen readers read. Give icon-only copy buttons a name such as "Copy", and offer a button wherever a double click copies.`,
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
            <SolarIcon name="eye-linear" />
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
  "hidden-label": () => (
    <Preview>
      <TextField
        variant="filled"
        size="small"
        label="Search"
        hiddenLabel
        type="search"
        placeholder="Search orders"
        startAdornment={
          <InputAdornment position="start" disablePointerEvents>
            <SolarIcon name="magnifier-linear" />
          </InputAdornment>
        }
      />
    </Preview>
  ),
  standalone: () => (
    <Preview>
      <InputBase
        size="small"
        type="search"
        aria-label="Search orders"
        placeholder="Search orders"
        startAdornment={
          <InputAdornment position="start" disablePointerEvents>
            <SolarIcon name="magnifier-linear" />
          </InputAdornment>
        }
      />
      <OutlinedInput size="small" aria-label="Quantity" inputMode="numeric" placeholder="0" />
      <FilledInput size="small" aria-label="Note" placeholder="Note" />
      <Input aria-label="Title" placeholder="Title" />
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
  copy: () => (
    <Preview>
      <CopyButtonDemo />
      <CopyDoubleClickDemo />
    </Preview>
  ),
  number: () => (
    <Preview>
      <NumberField size="small" aria-label="Quantity" defaultValue={0} min={0} />
      <NumberField label="Bedrooms" defaultValue={0} min={0} max={10} helperText="Up to 10" />
      <NumberField label="Bedrooms" defaultValue={0} min={0} disabled />
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={textFieldOptions} />
      <OptionsTable schema={numberFieldOptions} />
    </>
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        [
          "Arrow Up / Arrow Down",
          "Number field: steps up or down by step. With Shift: largeStep. With Alt: smallStep.",
        ],
        ["Page Up / Page Down", "Number field: steps up or down by largeStep."],
        ["Home / End", "Number field: goes to min or max. Without that bound, moves the caret."],
        ["Enter", "Number field: shows the typed number as the field's value."],
      ]}
    />
  ),
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
          react: "component",
          html: "any element",
          type: "ElementType",
          description: "The root element. Default `div`.",
        },
        {
          react: "InputAdornment component",
          html: "any element",
          type: "ElementType",
          description: "The adornment's element. Default `span`.",
        },
        {
          react: "InputAdornment disablePointerEvents",
          html: "data-ok-disable-pointer-events",
          type: "boolean",
          description: "Presses on the adornment go through to the input.",
        },
        {
          react: "InputBase / OutlinedInput / FilledInput / Input",
          html: "data-ok-input-base (no data-ok-variant for InputBase)",
          type: "component",
          description: "The field without a label and helper text; name it with `aria-label`.",
        },
        {
          react: "OutlinedInput label",
          html: "fieldset › legend › span",
          type: "ReactNode",
          description: "Room in the outline for a label you place yourself (with `notched`).",
        },
        {
          react: "inputComponent",
          html: "any element with data-ok-text-field-input",
          type: "ElementType",
          description: "Rendered instead of the `<input>`, with the input's props and `ref`.",
        },
        {
          react: "NumberField value / defaultValue",
          html: "the input's value",
          type: "number | null",
          description: "The number; `null` when the field is empty.",
        },
        {
          react: "onValueChange / onValueCommitted",
          html: "ok:number-field:change / ok:number-field:commit",
          type: "(value, details) => void",
          description:
            "Each new value with `details.reason`, and the end of a change (a step, Enter, leaving the input).",
        },
        {
          react: "decrementLabel / incrementLabel",
          html: "aria-label on the buttons",
          type: "string",
          description: "The buttons' names. Default `Decrease` and `Increase`.",
        },
        {
          html: "data-ok-number-field-decrement / data-ok-number-field-increment",
          type: "attribute",
          description: "The buttons in the adornments that step the value.",
        },
        {
          react: "useCopyToClipboard()",
          html: "data-ok-clipboard-copy",
          type: "hook / attribute",
          description:
            "Copies text on a press: `copy(text)` in React. In HTML, the input of the text field around the button, or the element the value names.",
        },
        {
          html: "data-ok-clipboard-text / data-ok-clipboard-trigger",
          type: "attribute",
          description: "Text to copy instead of an element's. `dblclick` copies on a double click.",
        },
        {
          html: "data-ok-clipboard-toast / data-ok-clipboard-error-toast",
          type: "attribute",
          description:
            "The `<template>` toast to show after a copy, or when the browser refuses it.",
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
