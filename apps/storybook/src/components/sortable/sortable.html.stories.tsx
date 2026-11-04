import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { SORTABLE_CONTROLS } from "./sortable-examples.js";

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

const SETUP = `${htmlSetup(["button.css", "icon-button.css", "sortable.css"], true)}
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

const story = (layout: string, title: string): StoryObj =>
  snippetStory(snippets, layout, [[title, "group"]], SETUP, SORTABLE_CONTROLS);

const meta = { title: "HTML/Sortable", decorators: [withNumbering] } satisfies Meta;
export default meta;

export const Grid: StoryObj = story("grid", "Grid");
export const Vertical: StoryObj = story("vertical", "Vertical");
export const Horizontal: StoryObj = story("horizontal", "Horizontal");
