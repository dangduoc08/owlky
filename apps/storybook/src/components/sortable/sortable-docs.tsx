import { sortableOptions } from "@owlky/core";
import sortableApi from "@owlky/docs-content/api/sortable.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { moveBetweenLists, Scrollbar, Sortable } from "@owlky/react";
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

/** A vertical list of the "board" group (docs examples). */
const htmlList = (id: string, label: string, items: string[]) =>
  `<ul id="${id}" data-ok-sortable data-ok-layout="vertical" data-ok-group="board" aria-label="${label}">
${items.map((item) => htmlItem(item, false)).join("\n")}
</ul>`;

const MOVE_BUTTON = `<button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="sm" data-ok-sortable-move-to="done" aria-label="Move Design to Done"><span data-ok-button-label>Move to Done</span></button>`;

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
${["Sales", "Orders", "Visitors"].map((t) => htmlItem(t, false)).join("\n")}
  </ul>
</section>`,
    react: `import { Scrollbar, Sortable } from "@owlky/react";
import { useState } from "react";

export function Widgets() {
  const [widgets, setWidgets] = useState(["Sales", "Orders", "Visitors"]);
  return (
    <Scrollbar aria-label="Widgets list">
      <Sortable
        layout="horizontal"
        aria-label="Widgets"
        items={widgets}
        getKey={(widget) => widget}
        getItemLabel={(widget) => widget}
        renderItem={(widget) => <span>{widget}</span>}
        onReorder={setWidgets}
      />
    </Scrollbar>
  );
}`,
  },
  {
    id: "remove",
    title: "Let people remove items",
    body: "In React, pass `onRemove`: every item gets a remove button, and you update your data. In HTML, add a `data-ok-sortable-remove` button to each item; the script removes the item. Remove buttons appear when the pointer rests on an item or focus is inside it, and are always visible on touch screens.",
    html: `<ul id="tasks" data-ok-sortable data-ok-layout="vertical" aria-label="Tasks">
${htmlItem("Design")}
</ul>`,
    react: `import { Sortable } from "@owlky/react";
import { useState } from "react";

export function RemovableTasks() {
  const [tasks, setTasks] = useState(["Design", "Build", "Test"]);
  return (
    <Sortable
      layout="vertical"
      aria-label="Tasks"
      items={tasks}
      getKey={(task) => task}
      getItemLabel={(task) => task}
      renderItem={(task) => <span>{task}</span>}
      onReorder={setTasks}
      onRemove={(task) => setTasks((all) => all.filter((other) => other !== task))}
    />
  );
}`,
  },
  {
    id: "add",
    title: "Add items",
    body: 'Adding is up to you. In React, add to your data. In HTML, put a `<template data-ok-sortable-template>` with the new item\'s markup in the list, and a button with `data-ok-sortable-add="<list id>"`. The script clones the template and fires `ok:sortable:add`, where you fill in the new item.',
    html: `<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" data-ok-sortable-add="tasks">
  <span data-ok-button-label>Add task</span>
</button>

<ul id="tasks" data-ok-sortable data-ok-layout="vertical" aria-label="Tasks">
${TASKS.slice(0, 2)
  .map((t) => htmlItem(t))
  .join("\n")}
  <template data-ok-sortable-template>
${htmlItem("new task")}
  </template>
</ul>

<script type="module">
  document.addEventListener("ok:sortable:add", (event) => {
    event.detail.item.querySelector("span").textContent = "New task";
  });
</script>`,
    react: `import { Button, Sortable } from "@owlky/react";
import { useState } from "react";

export function GrowingTasks() {
  const [tasks, setTasks] = useState(["Design", "Build"]);
  return (
    <>
      <Button onClick={() => setTasks((all) => [...all, \`Task \${all.length + 1}\`])}>Add task</Button>
      <Sortable
        layout="vertical"
        aria-label="Tasks"
        items={tasks}
        getKey={(task) => task}
        getItemLabel={(task) => task}
        renderItem={(task) => <span>{task}</span>}
        onReorder={setTasks}
      />
    </>
  );
}`,
  },
  {
    id: "lists",
    title: "Move items between lists",
    body: `Give lists the same group to let people move items between them, such as tasks on a board. In HTML, add \`data-ok-group\` and an \`id\` to each list; the script moves the items. In React, pass \`group\` and \`id\`, and update your data in \`onTransfer\`. The \`moveBetweenLists(lists, event)\` helper updates data kept as an object of arrays by list id.

People drag an item onto another list, even an empty one. With the keyboard, they grab an item, then press the Left or Right arrow key in vertical lists, or the Up or Down arrow key in horizontal lists. In a grid, the arrow keys move past the first or last item into the previous or next list. Focus stays on the moved item, and screen readers hear the list's name, such as "Moved to Done, position 1 of 2".

To limit where items go, set \`accept\` (\`data-ok-accept\` in HTML) to the groups a list takes items from. For example, a list in the group \`archive\` with \`accept="board"\` takes items from the board but gives none back.`,
    html: `<div>
${htmlList("todo", "To do", ["Design", "Build"])}
${htmlList("done", "Done", ["Test"])}
</div>`,
    react: `import { moveBetweenLists, Sortable } from "@owlky/react";
import { useState } from "react";

const LISTS = [
  { id: "todo", label: "To do" },
  { id: "done", label: "Done" },
];

export function Board() {
  const [lists, setLists] = useState<Record<string, string[]>>({
    todo: ["Design", "Build"],
    done: ["Test"],
  });
  return (
    <div>
      {LISTS.map((list) => (
        <Sortable
          key={list.id}
          id={list.id}
          group="board"
          layout="vertical"
          aria-label={list.label}
          items={lists[list.id] ?? []}
          getKey={(task) => task}
          getItemLabel={(task) => task}
          renderItem={(task) => <span>{task}</span>}
          onReorder={(items) => setLists((all) => ({ ...all, [list.id]: items }))}
          onTransfer={(event) => setLists((all) => moveBetweenLists(all, event))}
        />
      ))}
    </div>
  );
}`,
  },
  {
    id: "move-to",
    title: "Move items without dragging",
    body: `Some people can't drag, or use a screen reader on a touch screen. Give them a control that moves an item in one tap: a button or menu item inside the item with \`data-ok-sortable-move-to="<list id>"\` moves the item to the end of that list, in HTML and in React. For example, the **Kanban** story puts a **Move** menu on every card. Two taps also work: tap an item's handle, then a handle in another list.`,
    html: `<ul id="todo" data-ok-sortable data-ok-layout="vertical" data-ok-group="board" aria-label="To do">
${htmlItem("Design", false).replace("<span>Design</span>", `<span>Design</span>\n      ${MOVE_BUTTON}`)}
</ul>
<ul id="done" data-ok-sortable data-ok-layout="vertical" data-ok-group="board" aria-label="Done"></ul>`,
    react: `import { Button, moveBetweenLists, Sortable } from "@owlky/react";
import { useState } from "react";

export function MoveToDone() {
  const [lists, setLists] = useState<Record<string, string[]>>({ todo: ["Design"], done: [] });
  return (
    <>
      <Sortable
        id="todo"
        group="board"
        layout="vertical"
        aria-label="To do"
        items={lists["todo"] ?? []}
        getKey={(task) => task}
        getItemLabel={(task) => task}
        renderItem={(task) => (
          <>
            <span>{task}</span>
            <Button size="sm" data-ok-sortable-move-to="done" aria-label={\`Move \${task} to Done\`}>
              Move to Done
            </Button>
          </>
        )}
        onReorder={(items) => setLists((all) => ({ ...all, todo: items }))}
        onTransfer={(event) => setLists((all) => moveBetweenLists(all, event))}
      />
      <Sortable
        id="done"
        group="board"
        layout="vertical"
        aria-label="Done"
        items={lists["done"] ?? []}
        getKey={(task) => task}
        getItemLabel={(task) => task}
        renderItem={(task) => <span>{task}</span>}
        onReorder={(items) => setLists((all) => ({ ...all, done: items }))}
        onTransfer={(event) => setLists((all) => moveBetweenLists(all, event))}
      />
    </>
  );
}`,
  },
  {
    id: "disabled",
    title: "Keep items in place",
    body: `Disable an item to pin it, such as a summary that always comes first. A disabled item can't be dragged or grabbed, and other items never take its place: the keyboard moves them past it, and the pointer moves nothing while it is over it. In React, return \`true\` from \`isItemDisabled\`. In HTML, add \`data-ok-disabled\` to the item and \`disabled\` to its handle, so that the handle also leaves the tab order.`,
    html: `<ul id="widgets" data-ok-sortable data-ok-layout="vertical" aria-label="Widgets">
${htmlItem("Overview", false).replace("<li data-ok-sortable-item>", "<li data-ok-sortable-item data-ok-disabled>").replace('aria-pressed="false">', 'aria-pressed="false" disabled>')}
${htmlItem("Sales", false)}
${htmlItem("Orders", false)}
</ul>`,
    react: `import { Sortable } from "@owlky/react";
import { useState } from "react";

export function PinnedWidgets() {
  const [widgets, setWidgets] = useState(["Overview", "Sales", "Orders"]);
  return (
    <Sortable
      layout="vertical"
      aria-label="Widgets"
      items={widgets}
      getKey={(widget) => widget}
      getItemLabel={(widget) => widget}
      isItemDisabled={(widget) => widget === "Overview"}
      renderItem={(widget) => <span>{widget}</span>}
      onReorder={setWidgets}
    />
  );
}`,
  },
  {
    id: "swap",
    title: "Swap two items",
    body: `By default, a moved item pushes the items between its old and its new position by one place. With the swap strategy, the moved item and the item it is dropped on trade places, and every other item stays where it is. This suits layouts where each position means something, such as the slots of a dashboard.

While people drag, or choose a target with the arrow keys, the target slides to the item's place and gets a dashed outline. Nothing changes until the item is dropped. Moving back to the item's own place cancels the swap. In React, set \`strategy="swap"\`: \`onReorder\` gets the swapped items, the same result as \`arraySwap(items, from, to)\`. In HTML, add \`data-ok-strategy="swap"\` to the list. The script swaps the two items and fires \`ok:sortable:swap\` first.`,
    html: `<ul id="slots" data-ok-sortable data-ok-strategy="swap" aria-label="Dashboard slots">
${["Sales", "Orders", "Visitors", "Revenue"].map((t) => htmlItem(t, false)).join("\n")}
</ul>`,
    react: `import { Sortable } from "@owlky/react";
import { useState } from "react";

export function DashboardSlots() {
  const [widgets, setWidgets] = useState(["Sales", "Orders", "Visitors", "Revenue"]);
  return (
    <Sortable
      strategy="swap"
      aria-label="Dashboard slots"
      items={widgets}
      getKey={(widget) => widget}
      getItemLabel={(widget) => widget}
      renderItem={(widget) => <span>{widget}</span>}
      onReorder={setWidgets}
    />
  );
}`,
  },
  {
    id: "activator",
    title: "Drag from anywhere on an item",
    body: `By default, only the handle starts a drag, so the rest of an item stays free for its content, such as text people select or a page that scrolls on touch screens. To let people grab an item anywhere, set \`activator="item"\` in React or \`data-ok-activator="item"\` in HTML. Links, buttons and fields inside the item keep their own clicks. The handle stays: it is how keyboard users and people who tap instead of drag move the item.

On touch screens, a press on an item now starts a drag instead of scrolling the page. Leave room around the items, or keep the default, in long lists that people scroll with a finger.`,
    html: `<ul id="tasks" data-ok-sortable data-ok-layout="vertical" data-ok-activator="item" aria-label="Tasks">
${TASKS.slice(0, 3)
  .map((t) => htmlItem(t, false))
  .join("\n")}
</ul>`,
    react: `import { Sortable } from "@owlky/react";
import { useState } from "react";

export function GrabbableTasks() {
  const [tasks, setTasks] = useState(["Design", "Build", "Test"]);
  return (
    <Sortable
      layout="vertical"
      activator="item"
      aria-label="Tasks"
      items={tasks}
      getKey={(task) => task}
      getItemLabel={(task) => task}
      renderItem={(task) => <span>{task}</span>}
      onReorder={setTasks}
    />
  );
}`,
  },
  {
    id: "auto-scroll",
    title: "Scroll while dragging",
    body: 'When people drag an item near the edge of a scroll area, such as the **Scrollbar** around a list, or near the edge of the window, it scrolls. The closer the pointer gets to the edge, the faster it scrolls. To turn it off, set `autoScroll={false}` in React or `data-ok-auto-scroll="false"` in HTML. The keyboard always scrolls the moved item into view.',
    html: `<section data-ok-scrollbar aria-label="Tasks list" tabindex="0">
  <ul id="tasks" data-ok-sortable data-ok-layout="vertical" data-ok-auto-scroll="false" aria-label="Tasks">
${TASKS.slice(0, 2)
  .map((t) => htmlItem(t, false))
  .join("\n")}
  </ul>
</section>`,
    react: `import { Scrollbar, Sortable } from "@owlky/react";
import { useState } from "react";

export function FixedTasks() {
  const [tasks, setTasks] = useState(["Design", "Build"]);
  return (
    <Scrollbar aria-label="Tasks list">
      <Sortable
        layout="vertical"
        aria-label="Tasks"
        autoScroll={false}
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
    id: "drag-events",
    title: "Follow a drag",
    body: `Drag events tell you where an item is while it moves, for example to show a status or to save the order only once it is dropped. They fire for the pointer, the keyboard and taps alike:

- **Start:** an item is grabbed, or a pointer drag starts.
- **Over:** the item is about to move to a new position, in its list or in another one.
- **End:** the item is dropped.
- **Cancel:** the move is cancelled, such as with Escape, before the item goes back.

In React, pass \`onDragStart\`, \`onDragOver\`, \`onDragEnd\` and \`onDragCancel\`: each gets \`{ item, index, list }\`, where \`list\` is the list's \`id\`. In HTML, listen for \`ok:sortable:dragstart\`, \`ok:sortable:dragover\`, \`ok:sortable:dragend\` and \`ok:sortable:dragcancel\`, whose \`detail\` has the item element, its index and its list element.`,
    html: `<ul id="tasks" data-ok-sortable data-ok-layout="vertical" aria-label="Tasks">
${TASKS.slice(0, 2)
  .map((t) => htmlItem(t, false))
  .join("\n")}
</ul>
<p id="tasks-status" role="status"></p>

<script type="module">
  const status = document.getElementById("tasks-status");
  document.getElementById("tasks").addEventListener("ok:sortable:dragend", (event) => {
    const { item, index } = event.detail;
    status.textContent = \`\${item.querySelector("span").textContent} is now at position \${index + 1}.\`;
  });
</script>`,
    react: `import { Sortable } from "@owlky/react";
import { useState } from "react";

export function TrackedTasks() {
  const [tasks, setTasks] = useState(["Design", "Build"]);
  const [status, setStatus] = useState("");
  return (
    <>
      <Sortable
        layout="vertical"
        aria-label="Tasks"
        items={tasks}
        getKey={(task) => task}
        getItemLabel={(task) => task}
        renderItem={(task) => <span>{task}</span>}
        onReorder={setTasks}
        onDragEnd={({ item, index }) => setStatus(\`\${item} is now at position \${index + 1}.\`)}
      />
      <p role="status">{status}</p>
    </>
  );
}`,
  },
  {
    id: "messages",
    title: "Translate the announcements",
    body: `Screen readers hear every grab, move, drop, cancel and removal. Replace the English texts in your language. In React, pass \`messages\`, with a function per text that gets the position, the number of items and the list's name. In HTML, add \`data-ok-message-grabbed\`, \`-moved\`, \`-moved-to-list\`, \`-dropped\`, \`-cancelled\` or \`-removed\` to the list, with \`{position}\`, \`{total}\` and \`{list}\` where the values go.`,
    html: `<ul id="tasks" data-ok-sortable data-ok-layout="vertical" aria-label="Tâches"
  data-ok-message-grabbed="Élément saisi en position {position} sur {total}."
  data-ok-message-moved="Déplacé en position {position} sur {total}."
  data-ok-message-dropped="Déposé en position {position} sur {total}.">
${TASKS.slice(0, 2)
  .map((t) => htmlItem(t, false))
  .join("\n")}
</ul>`,
    react: `import { Sortable } from "@owlky/react";
import { useState } from "react";

export function FrenchTasks() {
  const [tasks, setTasks] = useState(["Design", "Build"]);
  return (
    <Sortable
      layout="vertical"
      aria-label="Tâches"
      items={tasks}
      getKey={(task) => task}
      getItemLabel={(task) => task}
      renderItem={(task) => <span>{task}</span>}
      onReorder={setTasks}
      messages={{
        grabbed: (position, total) => \`Élément saisi en position \${position} sur \${total}.\`,
        moved: (position, total) => \`Déplacé en position \${position} sur \${total}.\`,
        dropped: (position, total) => \`Déposé en position \${position} sur \${total}.\`,
      }}
    />
  );
}`,
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
- **\`ok:sortable:swap\`** (cancelable) fires before two items trade places in a list with \`data-ok-strategy="swap"\`, with \`detail: { from, to, item, target }\`. \`item\` is the moved item and \`target\` the one it is dropped on.
- **\`ok:sortable:dragstart\`**, **\`ok:sortable:dragover\`**, **\`ok:sortable:dragend\`** and **\`ok:sortable:dragcancel\`** follow a drag, with \`detail: { item, index, list }\`. They fire on the list that holds the item.
- **\`ok:sortable:transfer\`** (cancelable) fires on the list an item leaves, before the item moves to another list, with \`detail: { item, from, to, index }\`. \`from\` and \`to\` are the lists.
- **\`ok:sortable:remove\`** (cancelable) fires before an item is removed, with \`detail: { index, item }\`.
- **\`ok:sortable:add\`** fires after a new item is added from the template, with \`detail: { item, index }\`. Fill in its content here.
- **Instance:** \`runtime.get(element, "sortable")\` returns \`{ move(from, to), swap(from, to), remove(index), add(), transfer(index, to, toIndex) }\`. \`to\` is a list or its \`id\`. Without \`toIndex\`, the item goes to the end.
- **React:** \`onDragStart\`, \`onDragOver\`, \`onDragEnd\` and \`onDragCancel\` get \`{ item, index, list }\`. They replace the native HTML drag and drop handlers of the list element. \`onReorder(items)\`, \`onRemove(item, index)\` and \`onTransfer({ item, from, to, fromIndex, index })\`, where \`from\` and \`to\` are list ids. The \`arrayMove(items, from, to)\`, \`arraySwap(items, from, to)\` and \`moveBetweenLists(lists, event)\` helpers are exported too.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Focus a handle, grab the item, move it, then drop it. Focus stays on the handle while the item moves.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Every drag has a keyboard and a tap alternative, so people who can't drag can still reorder (WCAG 2.2, success criteria 2.1.1 and 2.5.7). Between lists, add a \`data-ok-sortable-move-to\` control, such as a **Move** menu, so that one tap is enough.
- Name the list with \`aria-label\`. Handles and remove buttons are named from each item, such as "Reorder Design"; set the item's label with \`getItemLabel\` in React or the buttons' \`aria-label\` in HTML.
- The handle has \`aria-pressed="true"\` while its item is grabbed.
- When the whole item starts a drag, keep the handle: it is the keyboard and single-tap path.
- Moves are announced in a polite live region. Translate the messages with \`messages\` in React or the \`data-ok-message-*\` attributes in HTML.
- A disabled item's handle is \`disabled\`, so it leaves the tab order and screen readers report it as unavailable.`,
  },
  apiReferenceSection(sortableApi),
];

function SlotsPreview() {
  const [widgets, setWidgets] = useState(["Sales", "Orders", "Visitors", "Revenue"]);
  return (
    <Preview className="block!">
      <Sortable
        strategy="swap"
        activator="item"
        aria-label="Dashboard slots"
        items={widgets}
        getKey={(widget) => widget}
        getItemLabel={(widget) => widget}
        renderItem={(widget) => <span>{widget}</span>}
        onReorder={setWidgets}
      />
    </Preview>
  );
}

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

const BOARD = [
  { id: "docs-todo", label: "To do" },
  { id: "docs-done", label: "Done" },
];

function BoardPreview() {
  const [lists, setLists] = useState<Record<string, string[]>>({
    "docs-todo": ["Design", "Build"],
    "docs-done": ["Test"],
  });
  return (
    <Preview>
      {BOARD.map((list) => (
        <Sortable
          key={list.id}
          id={list.id}
          group="docs-board"
          layout="vertical"
          aria-label={list.label}
          items={lists[list.id] ?? []}
          getKey={(task) => task}
          getItemLabel={(task) => task}
          renderItem={(task) => <span>{task}</span>}
          onReorder={(items) => setLists((all) => ({ ...all, [list.id]: items }))}
          onTransfer={(event) => setLists((all) => moveBetweenLists(all, event))}
        />
      ))}
    </Preview>
  );
}

const PREVIEWS = {
  overview: TasksPreview,
  swap: SlotsPreview,
  lists: BoardPreview,
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
          html: "data-ok-message-*",
          type: "Partial<SortableMessages>",
          description:
            "Translates the announcements: `grabbed`, `moved`, `movedToList`, `dropped`, `cancelled` and `removed`. Each gets the position, the number of items and the list's name.",
        },
        {
          react: "isItemDisabled",
          html: "data-ok-disabled",
          type: "(item: T, index: number) => boolean",
          description: "Items that can't move. Other items never take their place.",
        },
        {
          react: "onDragStart, onDragOver, onDragEnd, onDragCancel",
          html: "ok:sortable:dragstart, dragover, dragend, dragcancel",
          type: "(event: SortableDragEvent<T>) => void",
          description: "Follow a drag: `{ item, index, list }`, where `list` is the list's id.",
        },
        {
          react: "group",
          html: "data-ok-group",
          type: "string",
          description: "Connects lists: items move between lists of the same group.",
        },
        {
          react: "accept",
          html: "data-ok-accept",
          type: "string | string[]",
          description:
            "The groups the list takes items from, separated by spaces in HTML. Default: its own group.",
        },
        {
          react: "id",
          html: "id",
          type: "string",
          description: "Names the list in transfers and in `data-ok-sortable-move-to`.",
        },
        {
          react: "onTransfer",
          html: "ok:sortable:transfer",
          type: "(event: SortableTransferEvent<T>) => void",
          description:
            "Called when an item moves to another list. Without it, items never leave a React list.",
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
        [
          "Left / Right arrow (vertical lists), Up / Down arrow (horizontal lists)",
          "Move the grabbed item to the previous or next list of its group.",
        ],
        [
          "Arrow keys (swap lists)",
          "Choose the item to trade places with. Back on the item's own place, nothing is swapped.",
        ],
        ["Escape", "Cancels the move and puts the item back, in its first list."],
        ["Tab", "Leaves the list; a grabbed item is dropped where it is."],
      ]}
    />
  ),
};

/** Sortable docs page (ADR-0019). */
export function SortableDocs() {
  return <GuideDocs sections={sortableSections} previews={PREVIEWS} />;
}
