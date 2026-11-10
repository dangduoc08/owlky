import { inputLabelOptions, selectOptions } from "@owlky/core";
import selectApi from "@owlky/docs-content/api/select.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import {
  Chip,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  TextField,
} from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" data-ok-select-icon><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;

interface HtmlSelectOptions {
  id: string;
  label?: string;
  options: readonly (readonly [value: string, text: string])[];
  value?: readonly string[];
  variant?: "outlined" | "filled" | "standard";
  size?: "medium" | "small";
  multiple?: boolean;
  /** Text the field shows (the selected options' text by default). */
  display?: string;
  /** Extra attributes on the field box. */
  attrs?: string;
  /** Extra attributes on the trigger. */
  trigger?: string;
  /** Markup before the trigger (templates, a start adornment). */
  before?: string;
  /** Markup after the arrow (an end adornment). */
  after?: string;
  indent?: string;
}

/** A listbox Select, as `Select` renders it (the field box: trigger, input, icon, notch, menu). */
function htmlSelect({
  id,
  label,
  options,
  value = [],
  variant = "outlined",
  size = "medium",
  multiple = false,
  display,
  attrs = "",
  trigger = "",
  before = "",
  after = "",
  indent = "  ",
}: HtmlSelectOptions): string {
  const text =
    display ??
    options
      .filter(([v]) => value.includes(v))
      .map(([, t]) => t)
      .join(", ");
  const labelled = label ? ` aria-labelledby="${id}-label"` : "";
  const lines = [
    `<div data-ok-select data-ok-variant="${variant}" data-ok-size="${size}" data-ok-color="default"${multiple ? " data-ok-multiple" : ""}${attrs}>`,
    ...(before ? [`  ${before}`] : []),
    `  <div data-ok-select-display role="combobox" tabindex="0" id="${id}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-listbox"${labelled}${trigger}>${text}</div>`,
    `  <input data-ok-select-input aria-hidden="true" tabindex="-1" placeholder=" " value="${value.join(",")}">`,
    `  ${ICON}`,
    ...(after ? [`  ${after}`] : []),
    ...(variant === "outlined"
      ? [
          `  <fieldset data-ok-select-outline aria-hidden="true">${label ? `<legend><span>${label}</span></legend>` : ""}</fieldset>`,
        ]
      : []),
    `  <div popover="manual" data-ok-popover data-ok-placement="bottom-start" id="${id}-menu" tabindex="-1">`,
    `    <span data-ok-popover-arrow aria-hidden="true"></span>`,
    `    <ul data-ok-select-listbox role="listbox" id="${id}-listbox"${labelled}${multiple ? ' aria-multiselectable="true"' : ""}>`,
    ...options.map(([v, t]) => {
      const on = value.includes(v);
      return `      <li role="option" tabindex="-1" data-ok-menu-item${on ? " data-ok-selected" : ""} aria-selected="${on}" data-ok-value="${v}">${t}</li>`;
    }),
    "    </ul>",
    "  </div>",
    "</div>",
  ];
  return lines.map((line) => indent + line).join("\n");
}

const AGES = [
  ["10", "Ten"],
  ["20", "Twenty"],
  ["30", "Thirty"],
] as const;

const WEIGHTS = [
  ["1", "1"],
  ["5", "5"],
  ["10", "10"],
] as const;

const NAMES = [
  ["Oliver Hansen", "Oliver Hansen"],
  ["Van Henry", "Van Henry"],
  ["April Tucker", "April Tucker"],
] as const;

const CHIP = (name: string) =>
  `<span data-ok-chip data-ok-variant="filled" data-ok-color="default" data-ok-size="small"><span data-ok-chip-action><span data-ok-chip-label>${name}</span></span></span>`;

export const selectSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A select lets people choose one or more options from a list. The field shows the current value. A press, or a key such as Arrow Down, opens a menu of options under it. It is made of these parts:

- **FormControl:** the root. It shares the variant, the size and the states with the select, its label and its helper text.
- **InputLabel:** the label. It rests inside the field and moves above it when the field has focus or a value.
- **Select:** the field. Its options are **MenuItem**s, shown in a menu on the page's top layer.
- **FormHelperText:** a hint or an error message under the field.

In HTML, the select needs the JavaScript runtime: it opens the menu, moves focus through the options and writes the value. The value also sits in a hidden input, so the select works in a \`<form>\`. With \`native\`, the field is the browser's own \`<select>\` and needs no JavaScript.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<div data-ok-form-control>
  <label data-ok-form-label data-ok-input-label id="age-label">Age</label>
${htmlSelect({ id: "age", label: "Age", options: AGES, value: ["20"] })}
</div>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { FormControl, InputLabel, MenuItem, Select } from "@owlky/react";
import { useState } from "react";

export function Age() {
  const [age, setAge] = useState<string | number>(20);
  return (
    <FormControl>
      <InputLabel id="age-label">Age</InputLabel>
      <Select labelId="age-label" id="age" label="Age" value={age} onChange={setAge}>
        <MenuItem value={10}>Ten</MenuItem>
        <MenuItem value={20}>Twenty</MenuItem>
        <MenuItem value={30}>Thirty</MenuItem>
      </Select>
    </FormControl>
  );
}`,
  },
  {
    id: "label",
    title: "Label a select",
    body: "Put the select in a form control with an **InputLabel**. Give the label an `id` and pass it to the select's `labelId`: the field and its menu are named by it. Repeat the label text in `label`, so the outlined field leaves a gap in its outline for the floating label. Without a visible label, name the field with `aria-label`.",
    html: `<div data-ok-form-control>
  <label data-ok-form-label data-ok-input-label id="city-label">City</label>
${htmlSelect({
  id: "city",
  label: "City",
  options: [
    ["paris", "Paris"],
    ["rome", "Rome"],
  ],
})}
</div>`,
    react: `import { FormControl, InputLabel, MenuItem, Select } from "@owlky/react";

export function City() {
  return (
    <FormControl>
      <InputLabel id="city-label">City</InputLabel>
      <Select labelId="city-label" id="city" label="City" defaultValue="">
        <MenuItem value="paris">Paris</MenuItem>
        <MenuItem value="rome">Rome</MenuItem>
      </Select>
    </FormControl>
  );
}`,
  },
  {
    id: "variants",
    title: "Choose a variant and a size",
    body: "Set `variant` and `size` on the form control: the select, the label and the helper text follow it. The **Outlined** variant is the default. **Filled** tints the field and **Standard** draws a line under it. The `small` size is 40px high instead of 56px (outlined). A prop on the select itself overrides the form control's.",
    html: `<div data-ok-form-control data-ok-variant="filled">
  <label data-ok-form-label data-ok-input-label id="age-filled-label">Age</label>
${htmlSelect({ id: "age-filled", label: "Age", options: AGES, variant: "filled" })}
</div>
<div data-ok-form-control data-ok-variant="standard" data-ok-size="small">
  <label data-ok-form-label data-ok-input-label id="age-standard-label">Age</label>
${htmlSelect({ id: "age-standard", label: "Age", options: AGES, variant: "standard", size: "small" })}
</div>`,
    react: `import { FormControl, InputLabel, MenuItem, Select } from "@owlky/react";

export function Variants() {
  return (
    <>
      <FormControl variant="filled">
        <InputLabel id="age-filled-label">Age</InputLabel>
        <Select labelId="age-filled-label" id="age-filled" defaultValue="">
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
        </Select>
      </FormControl>
      <FormControl variant="standard" size="small">
        <InputLabel id="age-standard-label">Age</InputLabel>
        <Select labelId="age-standard-label" id="age-standard" defaultValue="">
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
        </Select>
      </FormControl>
    </>
  );
}`,
  },
  {
    id: "states",
    title: "Show help, errors and states",
    body: "Add a **FormHelperText** under the select and reference its `id` with `aria-describedby`. Set `error`, `disabled` or `required` on the form control: the field, the label and the helper text change together. `readOnly` keeps the value visible but the menu doesn't open. A disabled select is skipped by Tab.",
    html: `<div data-ok-form-control data-ok-error>
  <label data-ok-form-label data-ok-input-label id="plan-label">Plan</label>
${htmlSelect({
  id: "plan",
  label: "Plan",
  options: [
    ["free", "Free"],
    ["pro", "Pro"],
  ],
  attrs: " data-ok-error",
  trigger: ' aria-invalid="true" aria-describedby="plan-helper"',
})}
  <p data-ok-form-helper-text id="plan-helper">Choose a plan to continue</p>
</div>`,
    react: `import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@owlky/react";

export function Plan() {
  return (
    <FormControl error>
      <InputLabel id="plan-label">Plan</InputLabel>
      <Select
        labelId="plan-label"
        id="plan"
        label="Plan"
        defaultValue=""
        aria-describedby="plan-helper"
      >
        <MenuItem value="free">Free</MenuItem>
        <MenuItem value="pro">Pro</MenuItem>
      </Select>
      <FormHelperText id="plan-helper">Choose a plan to continue</FormHelperText>
    </FormControl>
  );
}`,
  },
  {
    id: "adornments",
    title: "Add a prefix or a unit",
    body: "Pass an `InputAdornment` in `startAdornment` or `endAdornment` to show an icon, a prefix or a unit inside the field. The start adornment comes before the value and keeps the label above the field. The end adornment comes before the arrow. In HTML, put the adornment element before the trigger or after the arrow icon.",
    html: `<div data-ok-form-control>
  <label data-ok-form-label data-ok-input-label id="weight-label">Weight</label>
${htmlSelect({ id: "weight", label: "Weight", options: WEIGHTS, value: ["5"], before: '<span data-ok-text-field-adornment="start">≈</span>', after: '<span data-ok-text-field-adornment="end">kg</span>' })}
</div>`,
    react: `import { FormControl, InputAdornment, InputLabel, MenuItem, Select } from "@owlky/react";

export function Weight() {
  return (
    <FormControl>
      <InputLabel id="weight-label">Weight</InputLabel>
      <Select
        labelId="weight-label"
        id="weight"
        label="Weight"
        defaultValue={5}
        startAdornment={<InputAdornment position="start">≈</InputAdornment>}
        endAdornment={<InputAdornment position="end">kg</InputAdornment>}
      >
        <MenuItem value={1}>1</MenuItem>
        <MenuItem value={5}>5</MenuItem>
        <MenuItem value={10}>10</MenuItem>
      </Select>
    </FormControl>
  );
}`,
  },
  {
    id: "multiple",
    title: "Choose several values",
    body: "Set `multiple`: the value is a list, each option toggles, and the menu stays open while people pick. The field shows the chosen options' text, separated by commas. To show chips instead, return **Chip**s from `renderValue`. In HTML, add a `<template data-ok-select-chip>` with one chip as the field box's first child: the runtime fills a copy for each value.",
    html: `<div data-ok-form-control>
  <label data-ok-form-label data-ok-input-label id="people-label">People</label>
${htmlSelect({ id: "people", label: "People", options: NAMES, value: ["Oliver Hansen", "Van Henry"], multiple: true, display: CHIP("Oliver Hansen") + CHIP("Van Henry"), before: `<template data-ok-select-chip>${CHIP("")}</template>` })}
</div>`,
    react: `import { Chip, FormControl, InputLabel, MenuItem, Select } from "@owlky/react";
import { useState } from "react";

const NAMES = ["Oliver Hansen", "Van Henry", "April Tucker"];

export function People() {
  const [people, setPeople] = useState<string[]>(["Oliver Hansen", "Van Henry"]);
  return (
    <FormControl>
      <InputLabel id="people-label">People</InputLabel>
      <Select
        labelId="people-label"
        id="people"
        label="People"
        multiple
        value={people}
        onChange={(value) => setPeople([...value])}
        renderValue={(selected) =>
          selected.map((name) => <Chip key={name} size="small" label={name} />)
        }
      >
        {NAMES.map((name) => (
          <MenuItem key={name} value={name}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}`,
  },
  {
    id: "placeholder",
    title: "Show a placeholder",
    body: 'An empty select shows nothing. With `displayEmpty`, it shows the option whose value is `""`, or what `renderValue` returns for the empty value, such as a placeholder. In HTML, a `<template data-ok-select-placeholder>` holds what an empty value shows. A select without an InputLabel needs an `aria-label`.',
    html: `<div data-ok-form-control>
${htmlSelect({ id: "names", options: NAMES, multiple: true, display: "<em>Choose people</em>", attrs: " data-ok-display-empty", trigger: ' aria-label="People"', before: "<template data-ok-select-placeholder><em>Choose people</em></template>" })}
</div>`,
    react: `import { FormControl, MenuItem, Select } from "@owlky/react";

export function Names() {
  return (
    <FormControl>
      <Select
        id="names"
        aria-label="People"
        multiple
        displayEmpty
        defaultValue={[]}
        renderValue={(selected) =>
          selected.length === 0 ? <em>Choose people</em> : selected.join(", ")
        }
      >
        <MenuItem value="Oliver Hansen">Oliver Hansen</MenuItem>
        <MenuItem value="Van Henry">Van Henry</MenuItem>
      </Select>
    </FormControl>
  );
}`,
  },
  {
    id: "grouping",
    title: "Group options",
    body: "Put a **ListSubheader** before each group of options. Subheaders aren't options: the keyboard skips them and assistive technology reads them as text.",
    html: `<div data-ok-form-control>
  <label data-ok-form-label data-ok-input-label id="grouped-label">Grouping</label>
  <div data-ok-select data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default">
    <div data-ok-select-display role="combobox" tabindex="0" id="grouped" aria-haspopup="listbox" aria-expanded="false" aria-controls="grouped-listbox" aria-labelledby="grouped-label"></div>
    <input data-ok-select-input aria-hidden="true" tabindex="-1" placeholder=" " value="">
    ${ICON}
    <fieldset data-ok-select-outline aria-hidden="true"><legend><span>Grouping</span></legend></fieldset>
    <div popover="manual" data-ok-popover data-ok-placement="bottom-start" id="grouped-menu" tabindex="-1">
      <span data-ok-popover-arrow aria-hidden="true"></span>
      <ul data-ok-select-listbox role="listbox" id="grouped-listbox" aria-labelledby="grouped-label">
        <li data-ok-list-subheader data-ok-color="default" role="presentation">Category 1</li>
        <li role="option" tabindex="-1" data-ok-menu-item aria-selected="false" data-ok-value="1">Option 1</li>
        <li data-ok-list-subheader data-ok-color="default" role="presentation">Category 2</li>
        <li role="option" tabindex="-1" data-ok-menu-item aria-selected="false" data-ok-value="2">Option 2</li>
      </ul>
    </div>
  </div>
</div>`,
    react: `import { FormControl, InputLabel, ListSubheader, MenuItem, Select } from "@owlky/react";

export function Grouped() {
  return (
    <FormControl>
      <InputLabel id="grouped-label">Grouping</InputLabel>
      <Select labelId="grouped-label" id="grouped" label="Grouping" defaultValue="">
        <ListSubheader>Category 1</ListSubheader>
        <MenuItem value={1}>Option 1</MenuItem>
        <ListSubheader>Category 2</ListSubheader>
        <MenuItem value={2}>Option 2</MenuItem>
      </Select>
    </FormControl>
  );
}`,
  },
  {
    id: "native",
    title: "Use the native select",
    body: "Set `native` and pass `<option>` elements: the field is the browser's `<select>`, with the platform's own menu, and it needs no JavaScript. It suits long lists on touch devices. With `multiple`, the options show as a list in the field. The InputLabel then names the select with `htmlFor`.",
    html: `<div data-ok-form-control>
  <label data-ok-form-label data-ok-input-label for="fruit">Fruit</label>
  <div data-ok-select data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default">
    <select data-ok-select-native id="fruit" name="fruit">
      <option value="apple">Apple</option>
      <option value="pear">Pear</option>
    </select>
    ${ICON}
    <fieldset data-ok-select-outline aria-hidden="true"><legend><span>Fruit</span></legend></fieldset>
  </div>
</div>`,
    react: `import { FormControl, InputLabel, Select } from "@owlky/react";

export function Fruit() {
  return (
    <FormControl>
      <InputLabel htmlFor="fruit">Fruit</InputLabel>
      <Select native id="fruit" name="fruit" label="Fruit" defaultValue="apple">
        <option value="apple">Apple</option>
        <option value="pear">Pear</option>
      </Select>
    </FormControl>
  );
}`,
  },
  {
    id: "text-field",
    title: "Use a select in a text field",
    body: "A **Text field** with `select` has the select inside its own field, label and helper text. Its select is native by default. Set `selectProps` to `{ native: false }` and pass **MenuItem**s for the listbox select. In HTML, the text field's control carries `data-ok-select` around the same parts.",
    html: `<div data-ok-text-field data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-margin="none">
  <label data-ok-text-field-label for="currency" id="currency-label">Currency</label>
  <div data-ok-text-field-control data-ok-select>
    <div data-ok-text-field-input data-ok-select-display role="combobox" tabindex="0" id="currency" aria-haspopup="listbox" aria-expanded="false" aria-controls="currency-listbox" aria-labelledby="currency-label">€</div>
    <input data-ok-select-input aria-hidden="true" tabindex="-1" placeholder=" " value="EUR">
    <svg aria-hidden="true" viewBox="0 0 24 24" data-ok-text-field-select-icon data-ok-select-icon><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    <fieldset data-ok-text-field-outline aria-hidden="true"><legend><span>Currency</span></legend></fieldset>
    <div popover="manual" data-ok-popover data-ok-placement="bottom-start" id="currency-menu" tabindex="-1">
      <span data-ok-popover-arrow aria-hidden="true"></span>
      <ul data-ok-select-listbox role="listbox" id="currency-listbox" aria-labelledby="currency-label">
        <li role="option" tabindex="-1" data-ok-menu-item aria-selected="false" data-ok-value="USD">$</li>
        <li role="option" tabindex="-1" data-ok-menu-item data-ok-selected aria-selected="true" data-ok-value="EUR">€</li>
      </ul>
    </div>
  </div>
</div>`,
    react: `import { MenuItem, TextField } from "@owlky/react";

export function Currency() {
  return (
    <TextField select selectProps={{ native: false }} id="currency" label="Currency" defaultValue="EUR">
      <MenuItem value="USD">$</MenuItem>
      <MenuItem value="EUR">€</MenuItem>
    </TextField>
  );
}`,
  },
  {
    id: "open",
    title: "Control the value and the open state",
    body: "In React, keep the value in state with `value` and `onChange`, and the menu with `open` and `onOpenChange`. `onOpenChange` receives the reason of a close: `escape`, `backdrop` (a press outside), `select`, `tab` or `toggle` (a press on the field). In HTML, a button with `data-ok-select-open` set to the field's `id` opens the select.",
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-select-open="size"><span data-ok-button-label>Open the select</span></button>
<div data-ok-form-control>
  <label data-ok-form-label data-ok-input-label id="size-label">Size</label>
${htmlSelect({
  id: "size",
  label: "Size",
  options: [
    ["s", "Small"],
    ["l", "Large"],
  ],
})}
</div>`,
    react: `import { Button, FormControl, InputLabel, MenuItem, Select } from "@owlky/react";
import { useState } from "react";

export function Size() {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("");
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open the select
      </Button>
      <FormControl>
        <InputLabel id="size-label">Size</InputLabel>
        <Select
          labelId="size-label"
          id="size"
          label="Size"
          open={open}
          onOpenChange={setOpen}
          value={size}
          onChange={setSize}
        >
          <MenuItem value="s">Small</MenuItem>
          <MenuItem value="l">Large</MenuItem>
        </Select>
      </FormControl>
    </>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default. In React, the select takes `variant`, `size`, `color`, `error`, `disabled`, `required` and `fullWidth` from its form control when it doesn't set them.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and the menu. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: 'In HTML, the select emits `ok:select:change` with `{ value }` before the value changes: call `preventDefault()` to refuse it. `ok:select:open` and `ok:select:close` (with `{ reason }`) follow the menu. The instance from `Owlky.runtime.get(element, "select")` has `value`, `setValue(value)`, `isOpen`, `open()` and `close()`. In React, use `onChange(value)` and `onOpenChange(open, reason)`.',
    html: `<script>
  document.addEventListener("ok:select:change", (event) => {
    console.log("New value:", event.detail.value);
  });
</script>`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The field takes focus with Tab. When the menu opens, focus moves to the selected option, or to the first one. It goes back to the field when the menu closes.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The field is a \`combobox\` with \`aria-haspopup="listbox"\` and \`aria-expanded\`. The menu is a \`listbox\` of \`option\`s with \`aria-selected\`. A multiple select's list has \`aria-multiselectable\`.
- Name the field with an InputLabel and \`labelId\`, or with \`aria-label\`. Reference the helper text with \`aria-describedby\`.
- \`error\`, \`required\`, \`disabled\` and \`readOnly\` set \`aria-invalid\`, \`aria-required\`, \`aria-disabled\` and \`aria-readonly\` on the field: the colors and the asterisk are visual only.
- The label, the value and the helper text keep a contrast ratio of at least 4.5:1 in the light and dark themes. A disabled field is dimmed.
- A checkbox in an option only shows its state: mark it \`inert\`, so the option stays the one control.`,
  },
  apiReferenceSection(selectApi),
];

const PREVIEWS = {
  adornments: () => (
    <Preview>
      <FormControl className="sb-select">
        <InputLabel id="docs-weight-label">Weight</InputLabel>
        <Select
          labelId="docs-weight-label"
          id="docs-weight"
          label="Weight"
          defaultValue={5}
          startAdornment={<InputAdornment position="start">≈</InputAdornment>}
          endAdornment={<InputAdornment position="end">kg</InputAdornment>}
        >
          <MenuItem value={1}>1</MenuItem>
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={10}>10</MenuItem>
        </Select>
      </FormControl>
    </Preview>
  ),
  overview: () => (
    <Preview>
      <FormControl className="sb-select">
        <InputLabel id="docs-age-label">Age</InputLabel>
        <Select labelId="docs-age-label" id="docs-age" label="Age" defaultValue={20}>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
    </Preview>
  ),
  variants: () => (
    <Preview>
      <FormControl variant="filled" className="sb-select">
        <InputLabel id="docs-filled-label">Age</InputLabel>
        <Select labelId="docs-filled-label" id="docs-filled" defaultValue="">
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
        </Select>
      </FormControl>
      <FormControl variant="standard" size="small" className="sb-select">
        <InputLabel id="docs-standard-label">Age</InputLabel>
        <Select labelId="docs-standard-label" id="docs-standard" defaultValue="">
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
        </Select>
      </FormControl>
    </Preview>
  ),
  states: () => (
    <Preview>
      <FormControl error className="sb-select">
        <InputLabel id="docs-plan-label">Plan</InputLabel>
        <Select
          labelId="docs-plan-label"
          id="docs-plan"
          label="Plan"
          defaultValue=""
          aria-describedby="docs-plan-helper"
        >
          <MenuItem value="free">Free</MenuItem>
          <MenuItem value="pro">Pro</MenuItem>
        </Select>
        <FormHelperText id="docs-plan-helper">Choose a plan to continue</FormHelperText>
      </FormControl>
    </Preview>
  ),
  multiple: () => (
    <Preview>
      <FormControl className="sb-select-wide">
        <InputLabel id="docs-people-label">People</InputLabel>
        <Select
          labelId="docs-people-label"
          id="docs-people"
          label="People"
          multiple
          defaultValue={["Oliver Hansen", "Van Henry"]}
          renderValue={(selected) =>
            selected.map((name) => <Chip key={name} size="small" label={name} />)
          }
        >
          {NAMES.map(([value, text]) => (
            <MenuItem key={value} value={value}>
              {text}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Preview>
  ),
  grouping: () => (
    <Preview>
      <FormControl className="sb-select">
        <InputLabel id="docs-grouped-label">Grouping</InputLabel>
        <Select labelId="docs-grouped-label" id="docs-grouped" label="Grouping" defaultValue="">
          <ListSubheader>Category 1</ListSubheader>
          <MenuItem value={1}>Option 1</MenuItem>
          <ListSubheader>Category 2</ListSubheader>
          <MenuItem value={2}>Option 2</MenuItem>
        </Select>
      </FormControl>
    </Preview>
  ),
  "text-field": () => (
    <Preview>
      <TextField
        select
        selectProps={{ native: false }}
        id="docs-currency"
        label="Currency"
        defaultValue="EUR"
      >
        <MenuItem value="USD">$</MenuItem>
        <MenuItem value="EUR">€</MenuItem>
      </TextField>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={selectOptions} />
      <OptionsTable schema={inputLabelOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Select content props"
      rows={[
        {
          react: "children",
          html: "li[role=option][data-ok-value] in the listbox",
          type: "ReactNode",
          description:
            "`MenuItem`s with a `value` (and `ListSubheader`s), or `<option>`s with `native`.",
        },
        {
          react: "value / defaultValue",
          html: "aria-selected on the options",
          type: "string | number | (string | number)[]",
          description:
            'The value: one value (`""` = none), or a list with `multiple`. Values compare as strings.',
        },
        {
          react: "onChange",
          html: "ok:select:change",
          type: "(value) => void",
          description: "Called with the new value, made of the options' own values.",
        },
        {
          react: "open / defaultOpen / onOpenChange",
          html: "open(), close(), ok:select:open / close",
          type: "boolean, (open, reason) => void",
          description: "The menu's open state and the reason of each close.",
        },
        {
          react: "renderValue",
          html: "template[data-ok-select-chip], template[data-ok-select-placeholder]",
          type: "(value) => ReactNode",
          description:
            "What the field shows. Default: the selected option's content, or the options' text separated by commas.",
        },
        {
          react: "label",
          html: "fieldset[data-ok-select-outline] legend",
          type: "ReactNode",
          description: "The text of the outline's gap, the same as the InputLabel's (outlined).",
        },
        {
          react: "labelId",
          html: "aria-labelledby",
          type: "string",
          description: "The `id` of the InputLabel that names the field and its menu.",
        },
        {
          react: "name / inputProps / inputRef",
          html: "input[data-ok-select-input]",
          type: "string, attributes, Ref",
          description: "The hidden input that holds the value in a form (or the native select).",
        },
        {
          react: "menuProps",
          html: "the popover's attributes",
          type: "{ placement, paperProps, listProps }",
          description: "Where the menu opens (default `bottom-start`) and the props of its parts.",
        },
        {
          react: "startAdornment / endAdornment",
          html: 'data-ok-text-field-adornment="start | end"',
          type: "ReactNode",
          description:
            "An `InputAdornment` inside the field: before the value, or before the arrow.",
        },
        {
          react: "displayProps",
          html: "the trigger's attributes",
          type: "HTMLAttributes",
          description: "Props of the field's `combobox` element.",
        },
        {
          react: "native",
          html: "select[data-ok-select-native]",
          type: "boolean",
          description: "The browser's `<select>` instead of the listbox.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        [
          "Arrow Down, Arrow Up, Enter, Space",
          "On the field: open the menu on the selected option",
        ],
        ["Home, End", "On the field: open the menu on the first or last option"],
        ["A letter", "On the field: open the menu on the next option that starts with it"],
        ["Arrow Down, Arrow Up", "In the menu: move to the next or previous option (wraps)"],
        ["Home, End", "In the menu: move to the first or last option"],
        ["A letter", "In the menu: move to the next option that starts with the typed text"],
        ["Enter, Space", "Choose the option (multiple: toggle it, the menu stays open)"],
        ["Escape", "Close the menu; focus goes back to the field"],
        ["Tab", "Close the menu; focus goes back to the field"],
      ]}
    />
  ),
};

export function SelectDocs() {
  return <GuideDocs sections={selectSections} previews={PREVIEWS} />;
}
