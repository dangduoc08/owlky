import { toggleButtonOptions, toggleGroupOptions } from "@owlky/core";
import toggleButtonApi from "@owlky/docs-content/api/toggle-button.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { ToggleButton, ToggleButtonGroup } from "@owlky/react";
import { CDN, capitalize, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { SolarIcon, solarMarkup } from "../../helpers/solar-icons.js";

const FORMATS = ["bold", "italic", "underline"] as const;
type Format = (typeof FORMATS)[number];
const textIcon = (format: Format) => `text-${format}-linear` as const;

const htmlToggle = (value: Format, pressed: boolean, extra = "") =>
  `  <button type="button" data-ok-toggle-button data-ok-color="standard" data-ok-size="md" value="${value}" aria-pressed="${pressed}" aria-label="${capitalize(value)}"${extra}>\n    ${solarMarkup(textIcon(value))}\n  </button>`;

export const toggleButtonSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A toggle button stays pressed until it's pressed again, such as a bold button in a text editor. Group related toggle buttons to let people pick one option, such as a view, or several options, such as text formats. For a one-time action, use a **Button**.",
    html: `<!-- Load once per page, with the script for interactive components -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<button type="button" data-ok-toggle-button data-ok-color="standard" data-ok-size="md" aria-pressed="false" aria-label="Bold">
  ${solarMarkup("text-bold-linear")}
</button>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { ToggleButton } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import textBoldLinear from "@iconify-icons/solar/text-bold-linear";

export function BoldToggle() {
  return (
    <ToggleButton aria-label="Bold">
      <Icon icon={textBoldLinear} aria-hidden="true" />
    </ToggleButton>
  );
}`,
  },
  {
    id: "exclusive",
    title: "Let people pick one option",
    body: "Put the buttons in a group and set `exclusive`: pressing a button releases the others, and pressing the pressed button clears the choice. Give each button a `value`; the group's value is the pressed button's value, or `null`.",
    html: `<div role="group" data-ok-toggle-group data-ok-orientation="horizontal" data-ok-exclusive aria-label="Text format">
${htmlToggle("bold", true)}
${htmlToggle("italic", false)}
${htmlToggle("underline", false)}
</div>`,
    react: `import { ToggleButton, ToggleButtonGroup } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import textBoldLinear from "@iconify-icons/solar/text-bold-linear";
import textItalicLinear from "@iconify-icons/solar/text-italic-linear";
import textUnderlineLinear from "@iconify-icons/solar/text-underline-linear";
import { useState } from "react";

export function FormatPicker() {
  const [format, setFormat] = useState<string | null>("bold");
  return (
    <ToggleButtonGroup
      exclusive
      value={format}
      onChange={(next) => setFormat(next as string | null)}
      aria-label="Text format"
    >
      <ToggleButton value="bold" aria-label="Bold">
        <Icon icon={textBoldLinear} aria-hidden="true" />
      </ToggleButton>
      <ToggleButton value="italic" aria-label="Italic">
        <Icon icon={textItalicLinear} aria-hidden="true" />
      </ToggleButton>
      <ToggleButton value="underline" aria-label="Underline">
        <Icon icon={textUnderlineLinear} aria-hidden="true" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}`,
  },
  {
    id: "multiple",
    title: "Let people pick several options",
    body: "Without `exclusive`, each button toggles on its own and the group's value is the list of pressed values.",
    html: `<div role="group" data-ok-toggle-group data-ok-orientation="horizontal" aria-label="Text formats">
${htmlToggle("bold", true)}
${htmlToggle("italic", true)}
${htmlToggle("underline", false)}
</div>`,
    react: `import { ToggleButton, ToggleButtonGroup } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import textBoldLinear from "@iconify-icons/solar/text-bold-linear";
import textItalicLinear from "@iconify-icons/solar/text-italic-linear";
import textUnderlineLinear from "@iconify-icons/solar/text-underline-linear";

export function FormatToggles() {
  return (
    <ToggleButtonGroup defaultValue={["bold", "italic"]} aria-label="Text formats">
      <ToggleButton value="bold" aria-label="Bold">
        <Icon icon={textBoldLinear} aria-hidden="true" />
      </ToggleButton>
      <ToggleButton value="italic" aria-label="Italic">
        <Icon icon={textItalicLinear} aria-hidden="true" />
      </ToggleButton>
      <ToggleButton value="underline" aria-label="Underline">
        <Icon icon={textUnderlineLinear} aria-hidden="true" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}`,
  },
  {
    id: "react",
    title: "React to changes",
    body: "In React, handle `onChange`: it receives the requested value, and a controlled component keeps its value until you update it. In HTML, listen to `ok:toggle-group:change` (or `ok:toggle-button:change` for a standalone button) and call `preventDefault()` to keep the current state.",
    html: `<div role="group" data-ok-toggle-group data-ok-orientation="horizontal" data-ok-exclusive aria-label="Text format">
${htmlToggle("bold", true)}
${htmlToggle("italic", false)}
${htmlToggle("underline", false)}
</div>

<script type="module">
  document.addEventListener("ok:toggle-group:change", (event) => {
    // Always keep one format: refuse to clear the choice
    if (event.detail.value === null) event.preventDefault();
  });
</script>`,
    react: `import { ToggleButton, ToggleButtonGroup } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import textBoldLinear from "@iconify-icons/solar/text-bold-linear";
import textItalicLinear from "@iconify-icons/solar/text-italic-linear";
import textUnderlineLinear from "@iconify-icons/solar/text-underline-linear";
import { useState } from "react";

export function FormatPicker() {
  const [format, setFormat] = useState("bold");
  return (
    <ToggleButtonGroup
      exclusive
      value={format}
      onChange={(next) => {
        // Always keep one format: ignore a request to clear the choice
        if (typeof next === "string") setFormat(next);
      }}
      aria-label="Text format"
    >
      <ToggleButton value="bold" aria-label="Bold">
        <Icon icon={textBoldLinear} aria-hidden="true" />
      </ToggleButton>
      <ToggleButton value="italic" aria-label="Italic">
        <Icon icon={textItalicLinear} aria-hidden="true" />
      </ToggleButton>
      <ToggleButton value="underline" aria-label="Underline">
        <Icon icon={textUnderlineLinear} aria-hidden="true" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "The first table lists the options of a toggle button, the second those of a group. In React, the group's `color`, `size` and `disabled` pass to every child button. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and behavior. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `HTML events are cancelable: call \`preventDefault()\` to keep the current state.

- **\`ok:toggle-button:change\`** on a standalone button, with \`detail: { pressed }\`, the new state.
- **\`ok:toggle-group:change\`** on a group, with \`detail: { value, previous, button }\`.
- **Instances:** \`runtime.get(element, "toggle-button")\` returns \`{ pressed, setPressed(pressed) }\`, and \`runtime.get(element, "toggle-group")\` returns \`{ value, setValue(value) }\`. The setters don't emit events.
- **React:** \`onChange(selected)\` on a standalone \`ToggleButton\` and \`onChange(value)\` on a \`ToggleButtonGroup\`. Both work controlled and uncontrolled.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Toggle buttons are native buttons, so the browser provides the keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- \`aria-pressed\` tells assistive technology whether a button is pressed.
- A group has \`role="group"\`: give it an \`aria-label\` that names the choice, such as "Text format".
- Buttons that show only an icon need \`aria-label\`.
- Disabled buttons never change their state.`,
  },
  apiReferenceSection(toggleButtonApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <ToggleButton aria-label="Bold" defaultSelected>
        <SolarIcon name="text-bold-linear" />
      </ToggleButton>
    </Preview>
  ),
  exclusive: () => (
    <Preview>
      <ToggleButtonGroup exclusive defaultValue="bold" aria-label="Text format">
        {FORMATS.map((format) => (
          <ToggleButton key={format} value={format} aria-label={capitalize(format)}>
            <SolarIcon name={textIcon(format)} />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Preview>
  ),
  multiple: () => (
    <Preview>
      <ToggleButtonGroup defaultValue={["bold", "italic"]} aria-label="Text formats">
        {FORMATS.map((format) => (
          <ToggleButton key={format} value={format} aria-label={capitalize(format)}>
            <SolarIcon name={textIcon(format)} />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={toggleButtonOptions} />
      <OptionsTable schema={toggleGroupOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Toggle button content props"
      rows={[
        {
          react: "value",
          html: "value",
          type: "string",
          description: "Identifies the button in a group.",
        },
        {
          react: "selected / defaultSelected",
          html: "aria-pressed",
          type: "boolean",
          description: "Pressed state of a standalone button.",
        },
        {
          react: "value / defaultValue (group)",
          html: "aria-pressed on the buttons",
          type: "string | null | string[]",
          description: "Pressed values: one or `null` when `exclusive`, a list otherwise.",
        },
        {
          react: "onChange",
          html: "ok:toggle-group:change",
          type: "(value) => void",
          description: "Called with the requested value.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the next toggle button."],
        ["Enter / Space", "Presses or releases the focused button."],
      ]}
    />
  ),
};

/** Toggle button docs page (ADR-0019). */
export function ToggleButtonDocs() {
  return <GuideDocs sections={toggleButtonSections} previews={PREVIEWS} />;
}
