import { treeViewOptions } from "@owlky/core";
import treeViewApi from "@owlky/docs-content/api/tree-view.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { RichTreeView } from "@owlky/react";
import treeSnippet from "../../../../../packages/html/src/components/tree-view/examples/simple-group.html?raw";
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

${treeSnippet}`,
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
    body: "A click on an item's row opens or closes it. Set `expansionTrigger` to `iconContainer` so only the icon does, for example when a click on the row opens a page. `defaultExpandedItems` sets the items open at first. To control them, pass `expandedItems` and `onExpandedItemsChange`. `onItemExpansionToggle` reports each toggle. Each group of child items is a Collapse: its height animates as it opens and closes, and it opens at once when the user prefers reduced motion. In HTML, keep `data-ok-collapse` on the groups.",
  },
  {
    id: "select",
    title: "Select items",
    body: "A click selects the item. Set `multiSelect` to select several: Ctrl or ⌘ click adds or removes one, and Shift click selects a range. `checkboxSelection` shows a checkbox on each item and implies `multiSelect`. Use `selectedItems` and `onSelectedItemsChange` to control the selection, or `disableSelection` when items are only for browsing.",
    react: `import { SimpleTreeView, TreeItem } from "@owlky/react";

export function TreeViewSelect() {
  return (
    <SimpleTreeView aria-label="Export" multiSelect checkboxSelection defaultSelectedItems={["design"]}>
      <TreeItem itemId="design" label="Design">
        <TreeItem itemId="mockups" label="Mockups" />
        <TreeItem itemId="assets" label="Assets" />
      </TreeItem>
      <TreeItem itemId="development" label="Development">
        <TreeItem itemId="frontend" label="Frontend" />
      </TreeItem>
    </SimpleTreeView>
  );
}`,
  },
  {
    id: "icons",
    title: "Change the icons and the look",
    body: "By default, items with children show a chevron that turns when they open. Pass `expandIcon` and `collapseIcon` for your own pair, and `endIcon` for items without children. Set `variant` to `lines` for dashed guides beside nested items, round tinted expand icons and compact rows.",
    react: `import { SimpleTreeView, TreeItem } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import addLinear from "@iconify-icons/solar/add-linear";
import minusLinear from "@iconify-icons/solar/minus-linear";

export function TreeViewIcons() {
  return (
    <SimpleTreeView
      aria-label="Outline"
      variant="lines"
      expandIcon={<Icon icon={addLinear} aria-hidden="true" />}
      collapseIcon={<Icon icon={minusLinear} aria-hidden="true" />}
    >
      <TreeItem itemId="design" label="Design">
        <TreeItem itemId="mockups" label="Mockups" />
        <TreeItem itemId="assets" label="Assets" />
      </TreeItem>
      <TreeItem itemId="development" label="Development">
        <TreeItem itemId="frontend" label="Frontend" />
      </TreeItem>
    </SimpleTreeView>
  );
}`,
  },
  {
    id: "propagation",
    title: "Spread the selection and follow it",
    body: 'With `multiSelect`, set `selectionPropagation` to `{ parents: true, descendants: true }`: selecting an item selects its descendants, and a parent is selected exactly when all its children are. `onItemSelectionToggle(itemId, isSelected)` reports each item whose selection changed, `onItemClick(itemId)` each click on a row and `onItemFocus(itemId)` each item that gets the focus. Disabled items are skipped by the arrow keys unless you set `disabledItemsFocusable`. `disableSelection` on a `TreeItem` (or `isItemSelectionDisabled` on a `RichTreeView`) keeps an item from being selected while it still expands. In HTML, write `data-ok-selection-propagation="parents descendants"` on the tree, `data-ok-disable-selection` on an item, and listen to `ok:tree-view:selectiontoggle`, `ok:tree-view:itemclick` and `ok:tree-view:itemfocus`.',
    html: `<ul data-ok-tree-view role="tree" data-ok-variant="standard" data-ok-expansion-trigger="content" data-ok-multi-select aria-multiselectable="true" data-ok-selection-propagation="parents descendants" aria-label="Export">
  <li role="treeitem" data-ok-tree-item data-ok-item-id="design" aria-expanded="false" aria-selected="false" tabindex="0">
    <div data-ok-tree-item-content><span data-ok-tree-item-icon></span><span data-ok-tree-item-label>Design</span></div>
    <ul data-ok-collapse role="group" data-ok-tree-item-group hidden>
      <li role="treeitem" data-ok-tree-item data-ok-item-id="mockups" aria-selected="false" tabindex="-1">
        <div data-ok-tree-item-content><span data-ok-tree-item-icon></span><span data-ok-tree-item-label>Mockups</span></div>
      </li>
    </ul>
  </li>
</ul>
<script type="module">
  document.addEventListener("ok:tree-view:selectiontoggle", (event) => {
    console.log(event.detail.itemId, event.detail.selected);
  });
</script>`,
    react: `import { SimpleTreeView, TreeItem } from "@owlky/react";

export function ExportTree() {
  return (
    <SimpleTreeView
      aria-label="Export"
      multiSelect
      selectionPropagation={{ parents: true, descendants: true }}
      onItemSelectionToggle={(itemId, isSelected) => console.log(itemId, isSelected)}
    >
      <TreeItem itemId="design" label="Design">
        <TreeItem itemId="mockups" label="Mockups" />
        <TreeItem itemId="assets" label="Assets" disableSelection />
      </TreeItem>
    </SimpleTreeView>
  );
}`,
  },
  {
    id: "editing",
    title: "Edit labels",
    body: "On a `RichTreeView`, set `isItemEditable` to `true`, or to a function that picks the items. Press **F2** or double-click a label to edit it, **Enter** to save and **Escape** to cancel. Moving the focus away saves too. `onItemLabelChange(itemId, label)` reports the new label. In HTML, put `data-ok-editable` on the items (or on the tree for every item) and listen to `ok:tree-view:labelchange`: call `preventDefault()` to keep the old label.",
    html: `<script type="module">
  document.addEventListener("ok:tree-view:labelchange", (event) => {
    if (event.detail.label.trim() === "") event.preventDefault();
  });
</script>`,
    react: `import { RichTreeView } from "@owlky/react";

const items = [{ id: "notes", label: "Notes" }, { id: "drafts", label: "Drafts" }];

export function RenameTree() {
  return (
    <RichTreeView
      aria-label="Folders"
      items={items}
      isItemEditable={(item) => item.id !== "drafts"}
      onItemLabelChange={(itemId, label) => console.log(itemId, label)}
    />
  );
}`,
  },
  {
    id: "reorder",
    title: "Reorder items",
    body: 'Set `itemsReordering` on a `RichTreeView` to let people drag an item by its row. Drop it on the top or bottom edge of another row to place it before or after, or on the middle to make it a child. The keyboard does the same with **Ctrl + Shift** (**⌘ + Shift** on a Mac) and an arrow: up and down move it among its siblings, right moves it into the item above, and left moves it out of its parent. `isItemReorderable(itemId)` keeps some items in place, `canMoveItemToNewPosition` refuses a move by returning `false`, and `onItemPositionChange` reports each move with the old and new `{ parentId, index }`. In HTML, use `data-ok-items-reordering` on the tree, `data-ok-reorderable="false"` on an item, and the cancelable `ok:tree-view:move` event.',
    html: `<script type="module">
  document.addEventListener("ok:tree-view:move", (event) => {
    // Keep everything at the top level.
    if (event.detail.newPosition.parentId !== null) event.preventDefault();
  });
</script>`,
    react: `import { RichTreeView } from "@owlky/react";

const items = [
  { id: "inbox", label: "Inbox", children: [{ id: "invoices", label: "Invoices" }] },
  { id: "archive", label: "Archive" },
];

export function SortableFolders() {
  return (
    <RichTreeView
      aria-label="Folders"
      items={items}
      itemsReordering
      isItemReorderable={(itemId) => itemId !== "inbox"}
      onItemPositionChange={({ itemId, newPosition }) => console.log(itemId, newPosition)}
    />
  );
}`,
  },
  {
    id: "lazy",
    title: "Load children on demand",
    body: "Pass a `dataSource` to a `RichTreeView` to load items when they are needed. `getChildrenCount(item)` tells whether an item has children: `0` for none, a number, or `-1` when you don't know yet. `getTreeItems(parentId)` returns a promise of the children, or of the root's items when `parentId` is undefined and there are no `items`. While the children load, the item shows a progress indicator and is marked `aria-busy`. If loading fails, the item shows the error and loads again when it is expanded again. In HTML, mark the items with `data-ok-lazy` and an empty group, and pass the data source to the instance's `setDataSource()`: its items are `{ id, label, childrenCount }` and are built as text.",
    html: `<script type="module">
  const tree = document.querySelector("[data-ok-tree-view]");
  Owlky.runtime.get(tree, "tree-view").setDataSource({
    getTreeItems: (parentId) => fetch(\`/api/folders?parent=\${parentId ?? ""}\`).then((response) => response.json()),
  });
</script>`,
    react: `import { RichTreeView, type TreeViewBaseItem } from "@owlky/react";

type Folder = TreeViewBaseItem & { childCount: number };

const dataSource = {
  getChildrenCount: (folder: Folder) => folder.childCount,
  getTreeItems: (parentId?: string): Promise<Folder[]> =>
    fetch(\`/api/folders?parent=\${parentId ?? ""}\`).then((response) => response.json()),
};

export function RemoteFolders() {
  return <RichTreeView<Folder> aria-label="Folders" dataSource={dataSource} />;
}`,
  },
  {
    id: "methods",
    title: "Expand everything and highlight matches",
    body: "Pass a ref from `useTreeViewApiRef()` as `apiRef` to control the tree from your code. `expandAll()`, `collapseAll()`, `expandToDepth(depth)` and `expandSubtree(itemId)` open many items at once, and `focusItem`, `selectItem`, `setItemExpansion`, `getItem`, `getItemTree` and `setEditedItem` work on one. Set `highlight` to a search text: matching labels are marked and their ancestors' labels are bold, so people see where the matches are. In HTML, the instance has the same expansion methods, and `data-ok-highlight` or `highlight(query)` marks the matches.",
    html: `<script type="module">
  const tree = document.querySelector("[data-ok-tree-view]");
  const instance = Owlky.runtime.get(tree, "tree-view");
  instance.expandToDepth(2);
  document.querySelector("#tree-search").addEventListener("input", (event) => {
    instance.highlight(event.target.value);
  });
</script>`,
    react: `import { Button, RichTreeView, useTreeViewApiRef } from "@owlky/react";
import { useState } from "react";

const items = [
  { id: "design", label: "Design", children: [{ id: "mockups", label: "Mockups" }] },
  { id: "development", label: "Development", children: [{ id: "frontend", label: "Frontend" }] },
];

export function SearchableTree() {
  const apiRef = useTreeViewApiRef();
  const [query, setQuery] = useState("");
  return (
    <>
      <input aria-label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
      <Button onClick={() => apiRef.current?.expandAll()}>Expand all</Button>
      <RichTreeView aria-label="Projects" items={items} apiRef={apiRef} highlight={query} />
    </>
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
    body: "These props set the items and the state. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:tree-view:expand\`** (cancelable) fires on the tree with \`detail.itemId\` and \`detail.expanded\`.
- **\`ok:tree-view:select\`** (cancelable) fires with \`detail.selectedItems\`.
- **\`ok:tree-view:selectiontoggle\`** fires once per item whose selection changed, with \`detail.itemId\` and \`detail.selected\`. **\`ok:tree-view:itemclick\`** and **\`ok:tree-view:itemfocus\`** fire with \`detail.itemId\`.
- **\`ok:tree-view:labelchange\`** (cancelable) fires before an edited label is saved, with \`detail.itemId\` and \`detail.label\`.
- **\`ok:tree-view:move\`** (cancelable) fires before an item moves, and **\`ok:tree-view:positionchange\`** after it, with \`detail.itemId\`, \`detail.oldPosition\` and \`detail.newPosition\`.
- **Instance:** \`runtime.get(element, "tree-view")\` returns \`{ expandedItems, selectedItems, setExpanded(id, expanded), setSelected(ids), expandAll(), collapseAll(), expandToDepth(depth), expandSubtree(id), focusItem(id), getItemOrderedChildrenIds(id), setEditedItem(id), updateItemLabel(id, label), highlight(query), setDataSource(source) }\`. The setters don't fire events.
- **React:** \`onExpandedItemsChange(ids)\`, \`onItemExpansionToggle(id, expanded)\`, \`onSelectedItemsChange(selection)\`, \`onItemSelectionToggle(id, selected)\`, \`onItemClick(id)\`, \`onItemFocus(id)\`, \`onItemLabelChange(id, label)\`, \`onItemPositionChange(change)\` and the methods of \`apiRef\`.`,
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
- Icons and selection checkboxes are decorative: the item's state is in its ARIA attributes.
- Dragging is never the only way to reorder: Ctrl / ⌘ + Shift and the arrow keys move the focused item, and it keeps the focus after the move.
- An item that loads its children is marked \`aria-busy\`, and its progress indicator is named "Loading". The label input is named "Item label".
- The highlight is visual. Pair it with a text such as the number of matches when the search is the main task.`,
  },
  apiReferenceSection(treeViewApi),
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
        ["F2", "Edits the label of an editable item. Enter saves, Escape cancels."],
        [
          "Ctrl + Shift + arrows (⌘ + Shift on a Mac)",
          "Moves the item, with reordering: up and down among its siblings, right into the item above, left out of its parent.",
        ],
      ]}
    />
  ),
};

/** Tree view docs page (ADR-0019). */
export function TreeViewDocs() {
  return <GuideDocs sections={treeViewSections} previews={PREVIEWS} />;
}
