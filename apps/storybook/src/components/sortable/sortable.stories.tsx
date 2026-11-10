import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { DisabledItemsDemo } from "./disabled-demo.js";
import disabledSource from "./disabled-demo.tsx?raw";
import { KanbanDemo } from "./kanban-demo.js";
import kanbanSource from "./kanban-demo.tsx?raw";
import { SortableDocs } from "./sortable-docs.js";
import {
  SORTABLE_CONTROLS,
  SortableDemo,
  sortableCode,
  sortableGroups,
} from "./sortable-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/sortable/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

/** Demo numbering for added items: the app's job (see the Code panel). */
function numberNewItem(event: Event) {
  const { item } = (event as CustomEvent<{ item: HTMLElement }>).detail;
  const list = item.parentElement as HTMLElement;
  const numbers = [...list.querySelectorAll(":scope > [data-ok-sortable-item] > span")].map(
    (span) => Number(span.textContent),
  );
  const next = Math.max(0, ...numbers) + 1;
  (item.querySelector("span") as HTMLElement).textContent = String(next);
  item
    .querySelector("[data-ok-sortable-remove]")
    ?.setAttribute("aria-label", `Remove item ${next}`);
  item
    .querySelector("[data-ok-sortable-handle]")
    ?.setAttribute("aria-label", `Reorder item ${next}`);
}

const withNumbering: Decorator = (Story) => {
  useEffect(() => {
    document.addEventListener("ok:sortable:add", numberNewItem);
    return () => document.removeEventListener("ok:sortable:add", numberNewItem);
  }, []);
  return <Story />;
};

const SETUP = `${htmlSetup(["button.css", "icon-button.css", "scrollbar.css", "sortable.css", "typography.css"], true)}
<script>
  // New items come from the <template>: fill their content when they are added.
  document.addEventListener("ok:sortable:add", (event) => {
    const { item } = event.detail;
    const numbers = [...item.parentElement.querySelectorAll(":scope > [data-ok-sortable-item] > span")]
      .map((span) => Number(span.textContent));
    const next = Math.max(0, ...numbers) + 1;
    item.querySelector("span").textContent = next;
    item.querySelector("[data-ok-sortable-remove]").ariaLabel = \`Remove item \${next}\`;
    item.querySelector("[data-ok-sortable-handle]").ariaLabel = \`Reorder item \${next}\`;
  });
</script>`;

const htmlStory = (layout: string, title: string): StoryObj =>
  snippetStory(snippets, layout, [[title, "group"]], SETUP, SORTABLE_CONTROLS);

const controls: StoryControls = { ...SORTABLE_CONTROLS, target: SortableDemo };

const story = (layout: "grid" | "vertical" | "horizontal", title: string): StoryObj =>
  frameworkStory({
    html: htmlStory(layout, title),
    react: reactGroupsStory(sortableGroups(layout, title), controls, sortableCode(layout, title)),
  });

// The numbering decorator only reacts to the HTML runtime's ok:sortable:add event.
const meta = {
  title: "Components/Sortable",
  decorators: [withNumbering],
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: SortableDocs,
      description: {
        component:
          "Sortable lists let people reorder items by dragging, with the keyboard or with two taps, and optionally remove them.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Grid: StoryObj = story("grid", "Grid");
export const Vertical: StoryObj = story("vertical", "Vertical");
export const Horizontal: StoryObj = story("horizontal", "Horizontal");

/** Several lists in one group (no Controls: the demo keeps the board's state). */
export const Kanban: StoryObj = frameworkStory({
  html: snippetStory(
    snippets,
    "kanban",
    [["Kanban", "group"]],
    htmlSetup(
      [
        "button.css",
        "icon-button.css",
        "list.css",
        "popover.css",
        "menu.css",
        "scrollbar.css",
        "sortable.css",
        "typography.css",
      ],
      true,
    ),
  ),
  react: reactGroupsStory([{ title: "Kanban", content: <KanbanDemo /> }], undefined, kanbanSource),
});

/** The status line follows the drag events: the app's job (see the Code panel). */
const DISABLED_SCRIPT_SOURCE = `// Drag events report the item element, its index and its list.
const status = document.getElementById("sortable-disabled-status");
const title = (item) => item.querySelector("span").textContent;
const list = document.getElementById("sortable-disabled");
list.addEventListener("ok:sortable:dragstart", (event) => {
  status.textContent = \`Moving \${title(event.detail.item)}.\`;
});
list.addEventListener("ok:sortable:dragend", (event) => {
  const { item, index } = event.detail;
  status.textContent = \`\${title(item)} is now at position \${index + 1}.\`;
});
list.addEventListener("ok:sortable:dragcancel", (event) => {
  status.textContent = \`\${title(event.detail.item)} went back.\`;
});`;

type DragDetail = { item: HTMLElement; index: number };

/** The same script, run on the story's row. */
function disabledScript(row: HTMLElement) {
  const status = row.querySelector("#sortable-disabled-status") as HTMLElement;
  const list = row.querySelector("#sortable-disabled") as HTMLElement;
  const title = (item: HTMLElement) => item.querySelector("span")?.textContent ?? "";
  const handlers: [string, (detail: DragDetail) => string][] = [
    ["dragstart", ({ item }) => `Moving ${title(item)}.`],
    ["dragend", ({ item, index }) => `${title(item)} is now at position ${index + 1}.`],
    ["dragcancel", ({ item }) => `${title(item)} went back.`],
  ];
  const listeners = handlers.map(([name, text]) => {
    const listener = (event: Event) => {
      status.textContent = text((event as CustomEvent<DragDetail>).detail);
    };
    list.addEventListener(`ok:sortable:${name}`, listener);
    return [name, listener] as const;
  });
  return () => {
    for (const [name, listener] of listeners)
      list.removeEventListener(`ok:sortable:${name}`, listener);
  };
}

/** A pinned item that can't move, and drag events (no Controls: the demo keeps state). */
export const DisabledItems: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "disabled-items",
      [["Disabled items", "group"]],
      htmlSetup(["scrollbar.css", "icon-button.css", "sortable.css", "typography.css"], true),
      undefined,
      { group: { script: disabledScript, scriptSource: DISABLED_SCRIPT_SOURCE } },
    ),
    react: reactGroupsStory(
      [{ title: "Disabled items", content: <DisabledItemsDemo /> }],
      undefined,
      disabledSource,
    ),
  }),
  name: "Disabled items",
};
