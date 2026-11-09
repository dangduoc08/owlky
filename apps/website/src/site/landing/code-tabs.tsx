"use client";

import { Tab, TabPanel, Tabs } from "@owlky/react";
import { type ReactNode, useState } from "react";

/* HTML | React tabs around code blocks highlighted at build time (the server passes them in). */

export function CodeTabs({
  id,
  panels,
}: {
  id: string;
  panels: readonly { label: string; code: ReactNode }[];
}) {
  const [value, setValue] = useState(panels[0]?.label ?? "");
  return (
    <div data-landing-code-tabs="">
      <Tabs value={value} onChange={setValue} aria-label="Code language">
        {panels.map(({ label }) => (
          <Tab
            key={label}
            value={label}
            label={label}
            id={`${id}-tab-${label}`}
            aria-controls={`${id}-panel-${label}`}
          />
        ))}
      </Tabs>
      {panels.map(({ label, code }) => (
        <TabPanel
          key={label}
          id={`${id}-panel-${label}`}
          aria-labelledby={`${id}-tab-${label}`}
          hidden={value !== label}
        >
          {code}
        </TabPanel>
      ))}
    </div>
  );
}
