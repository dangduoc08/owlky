import { transferListOptions } from "@owlky/core";
import { TransferList } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const ITEMS = ["Apples", "Bananas", "Cherries", "Dates"].map((label, i) => ({
  value: `docs-${i}`,
  label,
}));

const CHECKBOX_ICONS = [
  `<span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.25" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></span>`,
  `<span data-ok-checkbox-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" /><path data-ok-checkbox-mark d="m7.75 12.25 2.75 2.75 5.75-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>`,
  `<span data-ok-checkbox-icon="indeterminate" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" /><path data-ok-checkbox-mark d="M8 12h8" stroke-width="2" stroke-linecap="round" /></svg></span>`,
];
const ARROWS = {
  "all-right": ["Move all right", "m6 17 5-5-5-5M13 17l5-5-5-5"],
  right: ["Move selected right", "m9 18 6-6-6-6"],
  left: ["Move selected left", "m15 18-6-6 6-6"],
  "all-left": ["Move all left", "m11 17-5-5 5-5M18 17l-5-5 5-5"],
} as const;

const indent = (text: string, spaces: number) => text.replace(/^/gm, " ".repeat(spaces));
const checkbox = (input: string) =>
  `<span data-ok-checkbox data-ok-color="primary" data-ok-size="medium">
  <input type="checkbox" data-ok-checkbox-input${input}>
${CHECKBOX_ICONS.map((icon) => `  ${icon}`).join("\n")}
</span>`;

/** The markup React renders for `<TransferList id="fruits">` with one item on each side. */
function htmlTransferList(enhanced: boolean) {
  const [left, right] = enhanced ? ["Available", "Chosen"] : ["Choices", "Chosen"];
  const panel = (side: "left" | "right", title: string, value: string, label: string) => {
    const header = enhanced
      ? `\n  <div data-ok-transfer-list-header>
${indent(checkbox(` aria-label="Select all ${title.toLowerCase()}"`), 4)}
    <span data-ok-transfer-list-title>${title}</span>
    <span data-ok-transfer-list-count>0/1 selected</span>
  </div>`
      : "";
    return `<section data-ok-transfer-list-panel data-ok-side="${side}">${header}
  <section data-ok-scrollbar aria-label="${title}" tabindex="0">
    <ul data-ok-list data-ok-disable-padding>
      <li data-ok-list-item data-ok-disable-padding data-ok-value="${value}">
        <label data-ok-transfer-list-option>
${indent(checkbox(` id="fruits-${value}"`), 10)}
          <span>${label}</span>
        </label>
      </li>
    </ul>
  </section>
</section>`;
  };
  const moves = (
    enhanced ? (["right", "left"] as const) : (["all-right", "right", "left", "all-left"] as const)
  )
    .map((move) => {
      const [label, path] = ARROWS[move];
      const disabled = move === "right" || move === "left" ? " disabled" : "";
      return `  <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="sm" data-ok-transfer-list-move="${move}" aria-label="${label}"${disabled}>
    <span data-ok-button-label><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}" /></svg></span>
  </button>`;
    })
    .join("\n");
  return `<div id="fruits" data-ok-transfer-list data-ok-variant="${enhanced ? "enhanced" : "simple"}">
${indent(panel("left", left, "apples", "Apples"), 2)}
  <div data-ok-transfer-list-actions>
${moves}
  </div>
${indent(panel("right", right, "bananas", "Bananas"), 2)}
</div>`;
}

export const transferListSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A transfer list moves items between two lists, such as the columns you can add to a report and the ones you chose. People check items and press a move button. It is built from components you already know: each list is a **List** in a **Scrollbar**, each row a **Checkbox** with its label, and the move buttons are outlined **Buttons**. On screens under 600px the lists stack and the arrows turn to point at them.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${htmlTransferList(false)}`,
    react: `import { TransferList } from "@owlky/react";

const fruits = [
  { value: "apples", label: "Apples" },
  { value: "bananas", label: "Bananas" },
];

export function Fruits() {
  return <TransferList id="fruits" items={fruits} defaultLeft={["apples"]} />;
}`,
  },
  {
    id: "state",
    title: "Read and control the sides",
    body: "In React, pass every item in `items` and the values that start on the left in `defaultLeft`. The rest start on the right. To control both sides, pass `left` and `right` and update them from `onChange(left, right)`. Moved items go to the end of the other list and are unchecked. In HTML, listen to `ok:transfer-list:change`, or read `value` on the instance.",
  },
  {
    id: "enhanced",
    title: "Use the enhanced variant",
    body: 'Set `variant` to `enhanced` to give each list a title, a select-all checkbox and a count such as "1/4 selected". The select-all checkbox shows a mixed state when some items are checked. `titles` names the two lists ("Choices" and "Chosen" by default) and `getCountLabel` writes the count. In HTML, `data-ok-label-count` takes a template such as `{checked} of {total}`.',
    html: htmlTransferList(true),
    react: `import { TransferList } from "@owlky/react";

const fruits = [
  { value: "apples", label: "Apples" },
  { value: "bananas", label: "Bananas" },
];

export function Fruits() {
  return (
    <TransferList
      id="fruits"
      items={fruits}
      defaultLeft={["apples"]}
      variant="enhanced"
      titles={["Available", "Chosen"]}
    />
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
    body: "These props set the items and the labels. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:transfer-list:change\`** (cancelable) fires before a move, with \`detail.left\`, \`detail.right\` and \`detail.direction\`.
- **Instance:** \`runtime.get(element, "transfer-list")\` returns \`{ value, move(direction) }\`, where \`direction\` is \`right\`, \`left\`, \`all-right\` or \`all-left\`.
- **React:** \`onChange(left, right)\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Each list is a focusable scroll area. Rows are native checkboxes, and the move buttons are native buttons.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Each list is a region named by its title, so screen readers announce where a checkbox is.
- Move buttons have names such as "Move selected right". Pass \`buttonLabels\` to translate them.
- Buttons that would move nothing are disabled.
- Rows are 44px tall, and the whole row toggles its checkbox.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <TransferList id="docs-transfer" items={ITEMS} defaultLeft={["docs-0", "docs-1"]} />
    </Preview>
  ),
  enhanced: () => (
    <Preview>
      <TransferList
        id="docs-transfer-enhanced"
        items={ITEMS}
        defaultLeft={["docs-0", "docs-1"]}
        variant="enhanced"
      />
    </Preview>
  ),
  options: () => <OptionsTable schema={transferListOptions} />,
  props: () => (
    <PropsTable
      label="Transfer list content props"
      rows={[
        {
          react: "items",
          html: "li[data-ok-value] rows",
          type: "{ value, label }[]",
          description: "Every item, on either side.",
        },
        {
          react: "left / right / defaultLeft / onChange",
          html: "rows in each panel · ok:transfer-list:change",
          type: "string[]",
          description: "Values on each side.",
        },
        {
          react: "titles",
          html: "aria-label of each scroll area, enhanced titles",
          type: "[string, string]",
          description: 'Names of the lists. Default "Choices", "Chosen".',
        },
        {
          react: "getCountLabel",
          html: "data-ok-label-count",
          type: "(checked, total) => string",
          description: 'Enhanced counts. Default "1/4 selected".',
        },
        {
          react: "buttonLabels",
          html: "aria-label of each move button",
          type: "Record<direction, string>",
          description: "Names of the move buttons.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves through the lists, their checkboxes and the move buttons."],
        ["Space", "Checks or clears the focused item, or presses the focused button."],
      ]}
    />
  ),
};

/** Transfer list docs page (ADR-0019). */
export function TransferListDocs() {
  return <GuideDocs sections={transferListSections} previews={PREVIEWS} />;
}
