import { Tab, TabPanel, Tabs, Typography } from "@owlky/react";
import { useState } from "react";

const ITEMS = [
  ["one", "Item one"],
  ["two", "Item two"],
  ["three", "Item three"],
] as const;

/** Vertical tabs beside their panels: a standard and a segmented one. */
export function VerticalDemo() {
  const [value, setValue] = useState("one");
  const [custom, setCustom] = useState("one");
  return (
    <>
      <div className="sb-tabs-demo sb-tabs-demo-vertical">
        <Tabs value={value} onChange={setValue} orientation="vertical" aria-label="Vertical">
          {ITEMS.map(([id, label]) => (
            <Tab
              key={id}
              value={id}
              label={label}
              id={`tabs-vertical-tab-${id}`}
              aria-controls={`tabs-vertical-panel-${id}`}
            />
          ))}
        </Tabs>
        {ITEMS.map(([id, label]) => (
          <TabPanel
            key={id}
            id={`tabs-vertical-panel-${id}`}
            aria-labelledby={`tabs-vertical-tab-${id}`}
            hidden={value !== id}
          >
            <Typography variant="body2">{label}</Typography>
          </TabPanel>
        ))}
      </div>
      <div className="sb-tabs-demo sb-tabs-demo-vertical">
        <Tabs
          value={custom}
          onChange={setCustom}
          orientation="vertical"
          segmented
          aria-label="Segmented vertical"
        >
          {ITEMS.map(([id, label]) => (
            <Tab
              key={id}
              value={id}
              label={label}
              id={`tabs-segmented-tab-${id}`}
              aria-controls={`tabs-segmented-panel-${id}`}
            />
          ))}
        </Tabs>
        {ITEMS.map(([id, label]) => (
          <TabPanel
            key={id}
            id={`tabs-segmented-panel-${id}`}
            aria-labelledby={`tabs-segmented-tab-${id}`}
            hidden={custom !== id}
          >
            <Typography variant="body2">{label}</Typography>
          </TabPanel>
        ))}
      </div>
    </>
  );
}
