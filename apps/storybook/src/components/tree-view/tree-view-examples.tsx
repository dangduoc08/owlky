import { treeViewOptions } from "@owlky/core";
import { RichTreeView, SimpleTreeView, TreeItem, type TreeViewBaseItem } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";

const PROJECTS: TreeViewBaseItem[] = [
  {
    id: "design",
    label: "Design",
    children: [
      { id: "design-wireframes", label: "Wireframes" },
      { id: "design-mockups", label: "Mockups" },
      { id: "design-assets", label: "Assets" },
    ],
  },
  {
    id: "development",
    label: "Development",
    children: [
      { id: "development-frontend", label: "Frontend" },
      { id: "development-backend", label: "Backend" },
    ],
  },
];

/** A nested outline: Main › Notes, Drafts (› Ideas, Plans), Archive, Shared with me. */
function Outline() {
  return (
    <TreeItem itemId="main" label="Main">
      <TreeItem itemId="notes" label="Notes" />
      <TreeItem itemId="drafts" label="Drafts">
        <TreeItem itemId="drafts-ideas" label="Ideas" />
        <TreeItem itemId="drafts-plans" label="Plans">
          <TreeItem itemId="drafts-plans-q1" label="First quarter" />
        </TreeItem>
      </TreeItem>
      <TreeItem itemId="archive" label="Archive" />
      <TreeItem itemId="shared" label="Shared with me" />
    </TreeItem>
  );
}
Outline.displayName = "Outline";

/** Story groups — the same examples as `packages/html/src/components/tree-view/examples/`. */
export const treeViewStories: Record<string, ReactGroup[]> = {
  simple: [
    {
      title: "Simple tree view",
      content: (
        <SimpleTreeView aria-label="Projects">
          <TreeItem itemId="design" label="Design">
            <TreeItem itemId="design-wireframes" label="Wireframes" />
            <TreeItem itemId="design-mockups" label="Mockups" />
            <TreeItem itemId="design-assets" label="Assets" />
          </TreeItem>
          <TreeItem itemId="development" label="Development">
            <TreeItem itemId="development-frontend" label="Frontend" />
            <TreeItem itemId="development-backend" label="Backend" />
          </TreeItem>
        </SimpleTreeView>
      ),
    },
  ],
  rich: [
    {
      title: "Rich tree view",
      content: <RichTreeView aria-label="Projects from data" items={PROJECTS} />,
    },
  ],
  "custom-icons": [
    {
      title: "Custom icons",
      content: (
        <SimpleTreeView
          aria-label="Outline with icons"
          defaultExpandedItems={["main", "drafts"]}
          expandIcon={<DemoIcon name="plusSquare" />}
          collapseIcon={<DemoIcon name="minusSquare" />}
          endIcon={<DemoIcon name="xSquare" />}
        >
          <Outline />
        </SimpleTreeView>
      ),
    },
  ],
  checkbox: [
    {
      title: "Checkbox selection",
      content: <RichTreeView aria-label="Projects to export" items={PROJECTS} checkboxSelection />,
    },
  ],
  "custom-styling": [
    {
      title: "Custom styling",
      content: (
        <SimpleTreeView
          aria-label="Styled outline"
          variant="lines"
          defaultExpandedItems={["main"]}
          defaultSelectedItems="main"
        >
          <Outline />
        </SimpleTreeView>
      ),
    },
  ],
};

export const TREE_VIEW_FILES: Record<string, GroupFiles> = Object.fromEntries(
  Object.entries(treeViewStories).map(([story, groups]) => [
    story,
    groups.map((group) => [group.title, "group"] as const),
  ]),
);

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const TREE_VIEW_CONTROLS = {
  schema: treeViewOptions,
  keys: ["variant", "expansionTrigger"],
} as const;
