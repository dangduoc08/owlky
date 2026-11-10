import { sortableOptions } from "@owlky/core";
import sortableApi from "@owlky/docs-content/api/sortable.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Scrollbar, Sortable } from "@owlky/react";
import { useState } from "react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const REMOVE = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 7l10 10M17 7 7 17" /></svg>`;
const HANDLE = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg>`;

const htmlItem = (label: string, removable = true) => `    <li data-ok-sortable-item>
      <span>${label}</span>
      <div data-ok-sortable-actions>${
        removable
          ? `
        <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-sortable-remove aria-label="Remove ${label}">${REMOVE}</button>`
          : ""
      }
        <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-sortable-handle aria-label="Reorder ${label}" aria-pressed="false">${HANDLE}</button>
      </div>
    </li>`;

const TASKS = ["Design", "Build", "Test", "Release"];

export const sortableSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A sortable list lets people put items in their own order, such as tasks by priority or widgets on a dashboard. Each item has a handle: drag it with a mouse, finger or pen, move it with the keyboard, or tap two handles to swap places. Items can also have a remove button.

Every move is announced to screen reader users, such as "Moved to position 2 of 4".`,
    html: `<!-- Load once per page, with the script for interactive components -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<section data-ok-scrollbar aria-label="Tasks list" tabindex="0">
  <ul id="tasks" data-ok-sortable data-ok-layout="vertical" aria-label="Tasks">
${TASKS.slice(0, 2)
  .map((t) => htmlItem(t, false))
  .join("\n")}
  </ul>
</section>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Scrollbar, Sortable } from "@owlky/react";
import { useState } from "react";

export function Tasks() {
  const [tasks, setTasks] = useState(["Design", "Build", "Test", "Release"]);
  return (
    <Scrollbar aria-label="Tasks list">
      <Sortable
        layout="vertical"
        aria-label="Tasks"
        items={tasks}
        getKey={(task) => task}
        getItemLabel={(task) => task}
        renderItem={(task) => <span>{task}</span>}
        onReorder={setTasks}
      />
    </Scrollbar>
  );
}`,
  },
  {
    id: "layout",
    title: "Choose a layout",
    body: "`grid` (the default) arranges items in columns that fit the width, `vertical` stacks them in one column and `horizontal` puts them in one row. Wrap a vertical or horizontal list in a **Scrollbar**: it scrolls the list and draws its frame.",
    html: `<section data-ok-scrollbar aria-label="Widgets list" tabindex="0">
  <ul id="widgets" data-ok-sortable data-ok-layout="horizontal" aria-label="Widgets">
    …
  </ul>
</section>`,
    react: `<Scrollbar aria-label="Widgets list">
  <Sortable layout="horizontal" aria-label="Widgets" … />
</Scrollbar>`,
  },
  {
    id: "remove",
    title: "Let people remove items",
    body: "In React, pass `onRemove`: every item gets a remove button, and you update your data. In HTML, add a `data-ok-sortable-remove` button to each item; the script removes the item. Remove buttons appear when the pointer rests on an item or focus is inside it, and are always visible on touch screens.",
    html: `<ul id="tasks" data-ok-sortable data-ok-layout="vertical" aria-label="Tasks">
${htmlItem("Design")}
</ul>`,
    react: `<Sortable
  …
  onRemove={(task) => setTasks((all) => all.filter((t) => t !== task))}
/>`,
  },
  {
    id: "add",
    title: "Add items",
    body: 'Adding is up to you. In React, add to your data. In HTML, put a `<template data-ok-sortable-template>` with the new item\'s markup in the list, and a button with `data-ok-sortable-add="<list id>"`. The script clones the template and fires `ok:sortable:add`, where you fill in the new item.',
    html: `<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" data-ok-sortable-add="tasks">
  <span data-ok-button-label>Add task</span>
</button>

<ul id="tasks" data-ok-sortable data-ok-layout="vertical" aria-label="Tasks">
  …
  <template data-ok-sortable-template>
${htmlItem("new task")}
  </template>
</ul>

<script type="module">
  document.addEventListener("ok:sortable:add", (event) => {
    event.detail.item.querySelector("span").textContent = "New task";
  });
</script>`,
    react: `<Button onClick={() => setTasks((all) => [...all, \`Task \${all.length + 1}\`])}>
  Add task
</Button>`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "In React, the list is driven by your data; in HTML, by the markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:sortable:move\`** (cancelable) fires before an item moves, with \`detail: { from, to, item }\`.
- **\`ok:sortable:remove\`** (cancelable) fires before an item is removed, with \`detail: { index, item }\`.
- **\`ok:sortable:add\`** fires after a new item is added from the template, with \`detail: { item, index }\`. Fill in its content here.
- **Instance:** \`runtime.get(element, "sortable")\` returns \`{ move(from, to), remove(index) }\`.
- **React:** \`onReorder(items)\` and \`onRemove(item, index)\`. The \`arrayMove(items, from, to)\` helper is exported too.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Focus a handle, grab the item, move it, then drop it. Focus stays on the handle while the item moves.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Every drag has a keyboard and a tap alternative, so people who can't drag can still reorder (WCAG 2.2, success criteria 2.1.1 and 2.5.7).
- Name the list with \`aria-label\`. Handles and remove buttons are named from each item, such as "Reorder Design"; set the item's label with \`getItemLabel\` in React or the buttons' \`aria-label\` in HTML.
- The handle has \`aria-pressed="true"\` while its item is grabbed.
- Moves are announced in a polite live region. Translate the messages with \`messages\` in React.`,
  },
  apiReferenceSection(sortableApi),
];

function TasksPreview() {
  const [tasks, setTasks] = useState(TASKS);
  return (
    <Preview className="block!">
      <Scrollbar aria-label="Tasks list">
        <Sortable
          layout="vertical"
          aria-label="Tasks"
          items={tasks}
          getKey={(task) => task}
          getItemLabel={(task) => task}
          renderItem={(task) => <span>{task}</span>}
          onReorder={setTasks}
          onRemove={(task) => setTasks((all) => all.filter((t) => t !== task))}
        />
      </Scrollbar>
    </Preview>
  );
}

const PREVIEWS = {
  overview: TasksPreview,
  options: () => <OptionsTable schema={sortableOptions} />,
  props: () => (
    <PropsTable
      label="Sortable content props"
      rows={[
        {
          react: "items",
          html: "li[data-ok-sortable-item]",
          type: "T[]",
          description: "The items, in order.",
        },
        { react: "getKey", type: "(item: T) => Key", description: "A stable key for each item." },
        {
          react: "renderItem",
          html: "the item's markup",
          type: "(item: T, index: number) => ReactNode",
          description: "Renders an item's content.",
        },
        {
          react: "getItemLabel",
          html: "aria-label on the buttons",
          type: "(item: T, index: number) => string",
          description:
            'Names the handle and remove buttons, such as "Reorder Design". Default "Item <n>".',
        },
        {
          react: "onReorder",
          type: "(items: T[]) => void",
          description: "Called with the items in their new order.",
        },
        {
          react: "onRemove",
          html: "data-ok-sortable-remove",
          type: "(item: T, index: number) => void",
          description: "Adds remove buttons and is called when one is pressed.",
        },
        {
          react: "messages",
          type: "Partial<SortableMessages>",
          description:
            "Translates the announcements: `grabbed`, `moved`, `dropped`, `cancelled` and `removed`.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Space / Enter", "Grabs the focused item, or drops the grabbed one."],
        [
          "Arrow keys",
          "Move the grabbed item: up and down in a column, left and right in a row, both in a grid.",
        ],
        ["Escape", "Cancels the move and puts the item back."],
        ["Tab", "Leaves the list; a grabbed item is dropped where it is."],
      ]}
    />
  ),
};

/** Sortable docs page (ADR-0019). */
export function SortableDocs() {
  return <GuideDocs sections={sortableSections} previews={PREVIEWS} />;
}
