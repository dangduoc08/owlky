import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
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
