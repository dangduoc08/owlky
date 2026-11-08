import { transferListOptions } from "@owlky/core";
import { TransferList } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const ITEMS = ["Apples", "Bananas", "Cherries", "Dates"].map((label, i) => ({
  value: `docs-${i}`,
  label,
}));

export const transferListSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A transfer list moves items between two lists, such as the columns you can add to a report and the ones you chose. People check items and press a move button. It is built from components you already know: each list is a **List** in a **Scrollbar**, each row a **Checkbox** with its label, and the move buttons are outlined **Buttons**. On screens under 600px the lists stack and the arrows turn to point at them.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<div data-ok-transfer-list data-ok-variant="simple">
  <section data-ok-transfer-list-panel data-ok-side="left">
    <section data-ok-scrollbar aria-label="Choices" tabindex="0">
      <ul data-ok-list data-ok-disable-padding>
        <li data-ok-list-item data-ok-disable-padding data-ok-value="apples">
          <label data-ok-transfer-list-option>
            <span data-ok-checkbox …><input type="checkbox">…</span><span>Apples</span>
          </label>
        </li>
      </ul>
    </section>
  </section>
  <div data-ok-transfer-list-actions>
    <button type="button" data-ok-button data-ok-variant="outlined" data-ok-size="sm"
      data-ok-transfer-list-move="right" aria-label="Move selected right">…</button>
  </div>
  <section data-ok-transfer-list-panel data-ok-side="right">…</section>
</div>`,
    react: `import { TransferList } from "@owlky/react";

const fruits = [
  { value: "apples", label: "Apples" },
  { value: "bananas", label: "Bananas" },
];

export function Fruits() {
  return <TransferList items={fruits} defaultLeft={["apples"]} />;
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
    html: `<div data-ok-transfer-list data-ok-variant="enhanced" data-ok-label-count="{checked}/{total} selected">…</div>`,
    react: `<TransferList items={fruits} variant="enhanced" titles={["Available", "Chosen"]} />`,
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
