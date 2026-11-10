import { Scrollbar, Sortable, Typography } from "@owlky/react";
import { useState } from "react";

type Widget = { id: string; title: string; pinned?: boolean };

const WIDGETS: Widget[] = [
  { id: "widget-overview", title: "Overview", pinned: true },
  { id: "widget-sales", title: "Sales" },
  { id: "widget-orders", title: "Orders" },
  { id: "widget-visitors", title: "Visitors" },
  { id: "widget-reviews", title: "Reviews" },
];

/** A pinned first item that can't move, and a status line that follows the drag events. */
export function DisabledItemsDemo() {
  const [widgets, setWidgets] = useState(WIDGETS);
  const [status, setStatus] = useState("Move a widget.");
  return (
    <>
      <Scrollbar aria-label="Dashboard widgets list">
        <Sortable
          id="sortable-disabled"
          layout="vertical"
          aria-label="Dashboard widgets"
          items={widgets}
          getKey={(widget) => widget.id}
          getItemLabel={(widget) => widget.title}
          isItemDisabled={(widget) => widget.pinned === true}
          renderItem={(widget) => (
            <Typography variant="subtitle2" component="span">
              {widget.pinned ? `${widget.title} (pinned)` : widget.title}
            </Typography>
          )}
          onReorder={setWidgets}
          onDragStart={({ item }) => setStatus(`Moving ${item.title}.`)}
          onDragEnd={({ item, index }) =>
            setStatus(`${item.title} is now at position ${index + 1}.`)
          }
          onDragCancel={({ item }) => setStatus(`${item.title} went back.`)}
        />
      </Scrollbar>
      <Typography
        id="sortable-disabled-status"
        variant="body2"
        component="p"
        color="textSecondary"
        role="status"
      >
        {status}
      </Typography>
    </>
  );
}
