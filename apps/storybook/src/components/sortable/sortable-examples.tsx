import { sortableOptions } from "@owlky/core";
import { Button, Scrollbar, Sortable, type SortableLayout } from "@owlky/react";
import { useState } from "react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";

const initial = () => Array.from({ length: 12 }, (_, index) => index + 1);

/** The reference demo: numbered cards, "Add item" appends the next number. */
export function SortableDemo({
  layout,
  title,
  removable = true,
}: {
  layout: SortableLayout;
  title: string;
  /** Story control: render remove buttons (passes `onRemove`). */
  removable?: boolean;
}) {
  const [items, setItems] = useState(initial);
  return (
    <>
      <Button
        variant="contained"
        startIcon={<DemoIcon name="plus" />}
        onClick={() => setItems((current) => [...current, Math.max(0, ...current) + 1])}
      >
        Add item
      </Button>
      <Scrollbar>
        <Sortable
          aria-label={`${title} items`}
          layout={layout}
          items={items}
          getKey={(n) => n}
          getItemLabel={(n) => `item ${n}`}
          renderItem={(n) => <span>{n}</span>}
          onReorder={setItems}
          onRemove={
            removable
              ? (n) => setItems((current) => current.filter((item) => item !== n))
              : undefined
          }
        />
      </Scrollbar>
    </>
  );
}

export const LAYOUTS: [SortableLayout, string][] = [
  ["grid", "Grid"],
  ["vertical", "Vertical"],
  ["horizontal", "Horizontal"],
];

/** Story groups — the same markup as `packages/html/src/components/sortable/examples/<layout>-group.html`. */
export const sortableGroups = (layout: SortableLayout, title: string): ReactGroup[] => [
  { title, content: <SortableDemo layout={layout} title={title} /> },
];

/** Code panel source (the demo keeps state, so it is written out). */
export const sortableCode = (
  layout: SortableLayout,
  title: string,
) => `import "@owlky/styles/owlky.css";
import { Button, Scrollbar, Sortable } from "@owlky/react";
import { useState } from "react";
// PlusIcon: your own decorative SVG icon (aria-hidden="true").

export function ${title}Example() {
  const [items, setItems] = useState(() => Array.from({ length: 12 }, (_, i) => i + 1));
  return (
    <>
      <Button
        variant="contained"
        startIcon={<PlusIcon />}
        onClick={() => setItems((current) => [...current, Math.max(0, ...current) + 1])}
      >
        Add item
      </Button>
      <Scrollbar>
        <Sortable
          aria-label="${title} items"
          layout="${layout}"
          items={items}
          getKey={(n) => n}
          getItemLabel={(n) => \`item \${n}\`}
          renderItem={(n) => <span>{n}</span>}
          onReorder={setItems}
          onRemove={(n) => setItems((current) => current.filter((item) => item !== n))}
        />
      </Scrollbar>
    </>
  );
}
`;

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const SORTABLE_CONTROLS = { schema: sortableOptions, keys: ["layout"] } as const;
