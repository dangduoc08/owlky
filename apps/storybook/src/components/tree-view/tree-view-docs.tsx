import { treeViewOptions } from "@owlky/core";
import { RichTreeView } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const ITEMS = [
  {
    id: "docs-design",
    label: "Design",
    children: [
      { id: "docs-wireframes", label: "Wireframes" },
      { id: "docs-mockups", label: "Mockups" },
    ],
  },
  { id: "docs-notes", label: "Notes" },
];

export const treeViewSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A tree view shows nested items that people expand and select, such as folders and files. It follows the WAI-ARIA tree pattern: one tab stop for the whole tree, and the arrow keys to move, open and close. `SimpleTreeView` takes `TreeItem` children. `RichTreeView` builds the same tree from data.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<ul data-ok-tree-view role="tree" aria-label="Projects" data-ok-variant="standard" data-ok-expansion-trigger="content">
  <li role="treeitem" data-ok-tree-item data-ok-item-id="design" aria-expanded="false" aria-selected="false" tabindex="0">
    <div data-ok-tree-item-content>
      <span data-ok-tree-item-icon><svg data-ok-tree-chevron aria-hidden="true" viewBox="0 0 24 24">…</svg></span>
      <span data-ok-tree-item-label>Design</span>
    </div>
    <ul role="group" data-ok-tree-item-group hidden>
      <li role="treeitem" data-ok-tree-item data-ok-item-id="mockups" aria-selected="false" tabindex="-1">…</li>
    </ul>
  </li>
</ul>`,
    react: `import { SimpleTreeView, TreeItem } from "@owlky/react";

export function Projects() {
  return (
    <SimpleTreeView aria-label="Projects">
      <TreeItem itemId="design" label="Design">
        <TreeItem itemId="mockups" label="Mockups" />
      </TreeItem>
    </SimpleTreeView>
  );
}`,
  },
  {
    id: "expand",
    title: "Expand items",
    body: "A click on an item's row opens or closes it. Set `expansionTrigger` to `iconContainer` so only the icon does, for example when a click on the row opens a page. `defaultExpandedItems` sets the items open at first. To control them, pass `expandedItems` and `onExpandedItemsChange`. `onItemExpansionToggle` reports each toggle.",
  },
  {
    id: "select",
    title: "Select items",
    body: "A click selects the item. Set `multiSelect` to select several: Ctrl or ⌘ click adds or removes one, and Shift click selects a range. `checkboxSelection` shows a checkbox on each item and implies `multiSelect`. Use `selectedItems` and `onSelectedItemsChange` to control the selection, or `disableSelection` when items are only for browsing.",
    react: `<SimpleTreeView aria-label="Export" multiSelect checkboxSelection defaultSelectedItems={["design"]}>
  …
</SimpleTreeView>`,
  },
  {
    id: "icons",
    title: "Change the icons and the look",
    body: "By default, items with children show a chevron that turns when they open. Pass `expandIcon` and `collapseIcon` for your own pair, and `endIcon` for items without children. Set `variant` to `lines` for dashed guides beside nested items, round tinted expand icons and compact rows.",
    react: `<SimpleTreeView
  aria-label="Outline"
  variant="lines"
  expandIcon={<PlusIcon />}
  collapseIcon={<MinusIcon />}
>
  …
</SimpleTreeView>`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the items and the state. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:tree-view:expand\`** (cancelable) fires on the tree with \`detail.itemId\` and \`detail.expanded\`.
- **\`ok:tree-view:select\`** (cancelable) fires with \`detail.selectedItems\`.
- **Instance:** \`runtime.get(element, "tree-view")\` returns \`{ expandedItems, selectedItems, setExpanded(id, expanded), setSelected(ids) }\`. The setters don't fire events.
- **React:** \`onExpandedItemsChange(ids)\`, \`onItemExpansionToggle(id, expanded)\` and \`onSelectedItemsChange(selection)\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Only one item is in the tab order: the selected one, or else the first.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Name the tree with \`aria-label\` or \`aria-labelledby\`.
- Items carry \`aria-expanded\` and \`aria-selected\`. A multi-select tree has \`aria-multiselectable\`.
- The focused item shows a focus ring. Item text uses the primary text color.
- Icons and selection checkboxes are decorative: the item's state is in its ARIA attributes.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <RichTreeView
        aria-label="Docs projects"
        items={ITEMS}
        defaultExpandedItems={["docs-design"]}
      />
    </Preview>
  ),
  select: () => (
    <Preview>
      <RichTreeView aria-label="Docs export" items={ITEMS} checkboxSelection />
    </Preview>
  ),
  icons: () => (
    <Preview>
      <RichTreeView
        aria-label="Docs outline"
        items={ITEMS}
        variant="lines"
        defaultExpandedItems={["docs-design"]}
      />
    </Preview>
  ),
  options: () => <OptionsTable schema={treeViewOptions} />,
  props: () => (
    <PropsTable
      label="Tree view content props"
      rows={[
        {
          react: "TreeItem itemId / label / disabled",
          html: "li[role=treeitem][data-ok-item-id] · span[data-ok-tree-item-label] · aria-disabled",
          type: "string · ReactNode · boolean",
          description: "One item.",
        },
        {
          react: "RichTreeView items",
          html: "nested items",
          type: "{ id, label, children? }[]",
          description: "The tree as data.",
        },
        {
          react: "expandedItems / defaultExpandedItems",
          html: 'aria-expanded="true" (and the group not hidden)',
          type: "string[]",
          description: "Open items.",
        },
        {
          react: "selectedItems / defaultSelectedItems",
          html: 'aria-selected="true"',
          type: "string | string[] | null",
          description: "Selected items.",
        },
        {
          react: "expandIcon / collapseIcon / endIcon",
          html: "svg in span[data-ok-tree-item-icon]",
          type: "ReactNode",
          description: "Icons of closed, open and leaf items.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Down arrow / Up arrow", "Focuses the next / previous visible item."],
        ["Right arrow", "Opens a closed item, or focuses the first child of an open one."],
        ["Left arrow", "Closes an open item, or focuses the parent."],
        ["Home / End", "Focuses the first / last visible item."],
        ["Enter", "Opens or closes the item (a leaf: selects it)."],
        ["Space", "Selects the item (multi-select: adds or removes it)."],
        ["*", "Opens every sibling of the focused item."],
        ["A letter", "Focuses the next item that starts with it."],
      ]}
    />
  ),
};

/** Tree view docs page (ADR-0019). */
export function TreeViewDocs() {
  return <GuideDocs sections={treeViewSections} previews={PREVIEWS} />;
}
