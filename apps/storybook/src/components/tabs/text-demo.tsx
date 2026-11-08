import { Tab, TabPanel, Tabs } from "@owlky/react";
import { useState } from "react";

const ITEMS = [
  ["one", "Item one"],
  ["two", "Item two"],
  ["three", "Item three"],
] as const;

/** Text tabs, each with its panel. */
export function TextDemo() {
  const [value, setValue] = useState("one");
  return (
    <div className="sb-tabs-demo">
      <Tabs value={value} onChange={setValue} aria-label="Text">
        {ITEMS.map(([id, label], index) => (
          <Tab
            key={id}
            value={id}
            label={label}
            id={`tabs-text-tab-${id}`}
            aria-controls={`tabs-text-panel-${id}`}
            disabled={index === 2}
          />
        ))}
      </Tabs>
      {ITEMS.map(([id, label]) => (
        <TabPanel
          key={id}
          id={`tabs-text-panel-${id}`}
          aria-labelledby={`tabs-text-tab-${id}`}
          hidden={value !== id}
        >
          {label}
        </TabPanel>
      ))}
    </div>
  );
}
