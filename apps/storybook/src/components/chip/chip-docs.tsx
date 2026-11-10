import { chipOptions } from "@owlky/core";
import chipApi from "@owlky/docs-content/api/chip.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Avatar, Chip } from "@owlky/react";
import { useState } from "react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const DELETE = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7z" fill="currentColor" /></svg>`;

export const chipSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A chip is a compact element for an attribute, a filter, a choice or a small action, such as a tag on a post or an active filter. A chip can show an avatar or an icon, be clickable, and have a delete button.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<span data-ok-chip data-ok-variant="soft" data-ok-color="primary" data-ok-size="medium">
  <span data-ok-chip-action><span data-ok-chip-label>Design</span></span>
</span>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Chip } from "@owlky/react";

export function Tag() {
  return <Chip variant="soft" color="primary" label="Design" />;
}`,
  },
  {
    id: "actions",
    title: "Make a chip clickable or deletable",
    body: "A clickable chip is a button: pass `onClick` in React, or use a `<button data-ok-chip-action>` in HTML. Pass `onDelete` to add a delete button; Backspace or Delete on the focused chip deletes it too. In HTML, the delete button fires a cancelable `ok:chip:delete` event, then the script hides the chip. In React, remove the chip from your state in `onDelete`.",
    html: `<span data-ok-chip data-ok-variant="filled" data-ok-color="default" data-ok-size="medium">
  <button type="button" data-ok-chip-action><span data-ok-chip-label>Paris</span></button>
  <button type="button" data-ok-chip-delete aria-label="Remove Paris">${DELETE}</button>
</span>`,
    react: `import { Chip } from "@owlky/react";
import { useState } from "react";

export function Cities() {
  const [cities, setCities] = useState(["Paris", "Rome"]);
  const [shown, setShown] = useState<string | null>(null);
  return (
    <>
      {cities.map((city) => (
        <Chip
          key={city}
          label={city}
          deleteLabel={\`Remove \${city}\`}
          onClick={() => setShown(city)}
          onDelete={() => setCities(cities.filter((other) => other !== city))}
        />
      ))}
      <p>{shown ? \`Showing \${shown}\` : "Pick a city"}</p>
    </>
  );
}`,
  },
  {
    id: "variants",
    title: "Choose a variant, color and size",
    body: "The variant is `filled` (default), `outlined` or `soft`. Colors are `default` (neutral), the palette colors, `black` and `white`. The `small` size is 24px high, for dense lists such as table cells.",
    html: `<span data-ok-chip data-ok-variant="outlined" data-ok-color="info" data-ok-size="small">
  <span data-ok-chip-action>
    <span data-ok-avatar data-ok-variant="circular" data-ok-color="default">M</span>
    <span data-ok-chip-label>Mia</span>
  </span>
</span>`,
    react: `import { Avatar, Chip } from "@owlky/react";

export function MiaChip() {
  return (
    <Chip variant="outlined" color="info" size="small" avatar={<Avatar>M</Avatar>} label="Mia" />
  );
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
    body: `- **\`ok:chip:delete\`** (cancelable) fires when the delete button is pressed, or Backspace / Delete is pressed on the chip's button. If you don't call \`preventDefault()\`, the chip is then hidden.
- **Instance:** \`runtime.get(element, "chip")\` returns \`{ delete() }\`.
- **React:** \`onDelete()\` and \`onClick(event)\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Clickable chips and delete buttons are native buttons.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The label names a clickable chip. Name each delete button with what it removes, such as "Remove Paris" (React: \`deleteLabel\`, default "Remove").
- The chip's button and its delete button are two tab stops, so keyboard users can reach both.
- Focus is shown with a 2px outline. The delete button's target is 24 × 24px.
- Neutral chips meet a contrast ratio of at least 4.5:1, and soft chips use the accessible text tone. Filled and outlined brand colors follow the design.`,
  },
  apiReferenceSection(chipApi),
];

function CitiesPreview() {
  const [cities, setCities] = useState(["Paris", "Rome", "Tokyo"]);
  return (
    <Preview>
      {cities.map((city) => (
        <Chip
          key={city}
          label={city}
          deleteLabel={`Remove ${city}`}
          onClick={() => {}}
          onDelete={() => setCities(cities.filter((c) => c !== city))}
        />
      ))}
    </Preview>
  );
}

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Chip variant="soft" color="primary" label="Design" />
    </Preview>
  ),
  actions: CitiesPreview,
  variants: () => (
    <Preview>
      <Chip variant="outlined" color="info" size="small" avatar={<Avatar>M</Avatar>} label="Mia" />
      <Chip variant="soft" color="success" label="Active" />
    </Preview>
  ),
  options: () => <OptionsTable schema={chipOptions} />,
  props: () => (
    <PropsTable
      label="Chip content props"
      rows={[
        {
          react: "label",
          html: "data-ok-chip-label",
          type: "ReactNode",
          description: "The chip's text.",
        },
        {
          react: "avatar / icon",
          html: "data-ok-avatar / data-ok-chip-icon",
          type: "ReactNode",
          description: "An avatar or an icon before the label.",
        },
        {
          react: "onClick / clickable",
          html: "button[data-ok-chip-action]",
          type: "function / boolean",
          description: "Makes the chip a button.",
        },
        {
          react: "onDelete",
          html: "button[data-ok-chip-delete]",
          type: "() => void",
          description: "Adds a delete button.",
        },
        {
          react: "deleteIcon",
          html: "the delete button's svg",
          type: "ReactNode",
          description: "Replaces the delete icon.",
        },
        {
          react: "deleteLabel",
          html: "aria-label",
          type: "string",
          description: 'Name of the delete button. Default "Remove".',
        },
        {
          react: "disabled",
          html: "disabled on the buttons",
          type: "boolean",
          description: "Disables the chip.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves to the chip's button, then to its delete button."],
        ["Enter / Space", "Presses the focused button."],
        ["Backspace / Delete", "Deletes the chip whose button has focus."],
      ]}
    />
  ),
};

/** Chip docs page (ADR-0019). */
export function ChipDocs() {
  return <GuideDocs sections={chipSections} previews={PREVIEWS} />;
}
