import { autocompleteOptions } from "@owlky/core";
import { Autocomplete } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { checkboxOption, FRUITS } from "./autocomplete-examples.js";
import { ControllableDemo } from "./controllable-demo.js";

export const autocompleteSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "An autocomplete is a text field with a list of suggestions. As people type, the list shows the options whose label contains the text, ignoring case and accents. It follows the WAI-ARIA combobox pattern: focus stays in the field, and the arrow keys move a highlight through the list. It is built from components you already know: a **TextField**, **Chips** for several values, **IconButtons** to clear and open, and a **Popover** for the list.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<div data-ok-autocomplete>
  <div data-ok-text-field data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-full-width data-ok-margin="none">
    <label data-ok-text-field-label for="fruit">Fruit</label>
    <div data-ok-text-field-control>
      <input id="fruit" data-ok-text-field-input role="combobox" aria-autocomplete="list"
        aria-expanded="false" aria-controls="fruit-listbox" autocomplete="off" placeholder=" ">
      <span data-ok-text-field-adornment="end">
        <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-autocomplete-clear tabindex="-1" aria-label="Clear" hidden>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-autocomplete-toggle tabindex="-1" aria-label="Open" data-ok-label-open="Open" data-ok-label-close="Close">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </span>
      <fieldset data-ok-text-field-outline aria-hidden="true"><legend><span>Fruit</span></legend></fieldset>
    </div>
  </div>
  <div popover="manual" data-ok-popover data-ok-placement="bottom-start" data-ok-disable-auto-focus
    data-ok-disable-restore-focus data-ok-autocomplete-paper>
    <span data-ok-popover-arrow aria-hidden="true"></span>
    <ul role="listbox" id="fruit-listbox" aria-label="Fruit">
      <li role="option" id="fruit-option-0" data-ok-value="Apple" aria-selected="false">Apple</li>
      <li role="option" id="fruit-option-1" data-ok-value="Banana" aria-selected="false">Banana</li>
      <li role="option" id="fruit-option-2" data-ok-value="Cherry" aria-selected="false">Cherry</li>
    </ul>
    <div data-ok-autocomplete-no-options hidden>No options</div>
  </div>
</div>`,
    react: `import { Autocomplete } from "@owlky/react";

const fruits = ["Apple", "Banana", "Cherry"];

export function FruitPicker() {
  return <Autocomplete id="fruit" label="Fruit" options={fruits} />;
}`,
  },
  {
    id: "values",
    title: "Use options and values",
    body: "Pass `options` as strings, or as `{ value, label }` objects when the value you store differs from what people read, such as country codes. The value is the option's `value`: a string, or `null` when nothing is chosen. In HTML, each option is an `li[role=option]` with `data-ok-value`, and `aria-selected` marks the chosen one.",
    react: `import { Autocomplete } from "@owlky/react";

export function Country() {
  return (
    <Autocomplete
      label="Country"
      options={[
        { value: "AR", label: "Argentina" },
        { value: "DE", label: "Germany" },
      ]}
      defaultValue="DE"
    />
  );
}`,
  },
  {
    id: "controlled",
    title: "Control the value and the text",
    body: "The value and the input's text are two states. `value` and `onChange` hold the chosen option. `inputValue` and `onInputChange` hold what people type, for example to load options from a server. When the field loses focus, its text goes back to the chosen option's label.",
  },
  {
    id: "multiple",
    title: "Pick several values",
    body: 'Set `multiple` to keep several values, shown as chips in the field. Backspace in an empty field removes the last one, and each chip has a remove button. `limitTags` shows a number of chips while the field isn\'t focused, and "+3" for the rest. With `disableCloseOnSelect` and a `renderOption` that draws a checkbox, the list stays open while people pick. In HTML, a `<template data-ok-autocomplete-tag>` holds the chip for new values.',
    react: `import { Autocomplete, Checkbox } from "@owlky/react";

const fruits = ["Apple", "Banana", "Cherry", "Grape", "Mango"];

export function Favorites() {
  return (
    <Autocomplete
      label="Favorites"
      multiple
      disableCloseOnSelect
      limitTags={2}
      options={fruits}
      renderOption={(option, { selected }) => (
        <>
          <Checkbox size="small" checked={selected} readOnly tabIndex={-1} aria-hidden="true" />
          {option.label}
        </>
      )}
    />
  );
}`,
  },
  {
    id: "free-solo",
    title: "Accept any text",
    body: "Set `freeSolo` when the options are only suggestions: any text is a value, and Enter commits it. A free solo field has no open button. Add `disableClearable` for a search field without the clear button.",
  },
  {
    id: "look",
    title: "Change the look",
    body: "`variant` (`outlined`, `filled`, `standard`), `size` (`medium`, `small`), `label`, `placeholder`, `helperText` and `error` work as on a TextField. `renderOption` draws richer options, such as a code on a **Label** next to each country.",
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the options, the value and the texts. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:autocomplete:change\`** (cancelable) fires with \`detail.value\`.
- **\`ok:autocomplete:open\`** and **\`ok:autocomplete:close\`** fire with \`detail.reason\`.
- **Instance:** \`runtime.get(element, "autocomplete")\` returns \`{ value, setValue(value), isOpen, open(), close() }\`. \`setValue\` doesn't fire events.
- **React:** \`onChange(value)\`, \`onInputChange(text)\` and \`onOpenChange(open, reason)\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Focus stays in the field. The highlighted option is announced through `aria-activedescendant`.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Give the field a \`label\`: it names the combobox and the list.
- The clear and open buttons are named ("Clear", "Open" / "Close") and out of the tab order: the keys do the same in the field.
- Chips have named remove buttons ("Remove Apple").
- Options are 34px tall. The highlighted and the chosen options have their own background.
- "No options" is shown in the list when nothing matches.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <div className="sb-autocomplete">
        <Autocomplete id="docs-fruit" label="Fruit" options={FRUITS} />
      </div>
    </Preview>
  ),
  controlled: () => (
    <Preview>
      <ControllableDemo />
    </Preview>
  ),
  multiple: () => (
    <Preview>
      <div className="sb-autocomplete">
        <Autocomplete
          id="docs-favorites"
          label="Favorites"
          multiple
          disableCloseOnSelect
          limitTags={2}
          options={FRUITS}
          defaultValue={FRUITS.slice(0, 3)}
          renderOption={checkboxOption}
        />
      </div>
    </Preview>
  ),
  options: () => <OptionsTable schema={autocompleteOptions} />,
  props: () => (
    <PropsTable
      label="Autocomplete content props"
      rows={[
        {
          react: "options",
          html: "li[role=option][data-ok-value]",
          type: "(string | { value, label, disabled? })[]",
          description: "The choices.",
        },
        {
          react: "value / defaultValue / onChange",
          html: 'aria-selected="true" · chips · ok:autocomplete:change',
          type: "string | string[] | null",
          description: "The chosen option value(s), or typed text with `freeSolo`.",
        },
        {
          react: "inputValue / onInputChange",
          html: "value of the input",
          type: "string",
          description: "What people type.",
        },
        {
          react: "open / onOpenChange",
          html: "aria-expanded · ok:autocomplete:open / close",
          type: "boolean",
          description: "Whether the list shows.",
        },
        {
          react: "renderOption / filterOptions",
          html: "content of each option",
          type: "function",
          description: "Draw options; choose which match the text.",
        },
        {
          react: "noOptionsText / clearText / openText / closeText / getLimitTagsText",
          html: "texts in the markup, data-ok-label-open / -close",
          type: "string",
          description: "Texts and names (translate them here).",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Down arrow / Up arrow", "Opens the list, then highlights the next / previous option."],
        ["Page Down / Page Up", "Moves the highlight by five options."],
        ["Home / End", "Highlights the first / last option (not in free solo fields)."],
        ["Enter", "Picks the highlighted option (free solo: commits the text)."],
        ["Escape", "Closes the list."],
        ["Backspace", "In an empty multiple field, removes the last chip."],
      ]}
    />
  ),
};

/** Autocomplete docs page (ADR-0019). */
export function AutocompleteDocs() {
  return <GuideDocs sections={autocompleteSections} previews={PREVIEWS} />;
}
