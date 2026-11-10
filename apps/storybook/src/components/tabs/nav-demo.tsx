import { Tab, Tabs } from "@owlky/react";
import { useState } from "react";

const PAGES = [
  { value: "overview", label: "Overview" },
  { value: "activity", label: "Activity" },
  { value: "settings", label: "Settings" },
];

/** Tabs as links: a navigation landmark, the current page marked with `aria-current`. */
export function NavTabsDemo() {
  const [page, setPage] = useState("overview");
  return (
    <Tabs value={page} onChange={setPage} aria-label="Project pages">
      {PAGES.map((item) => (
        <Tab key={item.value} value={item.value} label={item.label} href={`#${item.value}`} />
      ))}
    </Tabs>
  );
}
