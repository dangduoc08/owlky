import { tabOptions, tabsOptions } from "@owlky/core";
import tabsApi from "@owlky/docs-content/api/tabs.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Tab, Tabs } from "@owlky/react";
import colorsBoth from "../../../../../packages/html/src/components/tabs/examples/colors-both.html?raw";
import fullWidth from "../../../../../packages/html/src/components/tabs/examples/custom-full-width.html?raw";
import iconOnly from "../../../../../packages/html/src/components/tabs/examples/icon-icon-only.html?raw";
import iconStart from "../../../../../packages/html/src/components/tabs/examples/icon-start.html?raw";
import scrollableGroup from "../../../../../packages/html/src/components/tabs/examples/scrollable-group.html?raw";
import verticalGroup from "../../../../../packages/html/src/components/tabs/examples/vertical-group.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { snippetElement } from "../../helpers/snippet-markup.js";
import { DemoIcon } from "../shared/demo-icon.js";
import { TextDemo } from "./text-demo.js";
import { VerticalDemo } from "./vertical-demo.js";

export const tabsSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "Tabs switch between related views on the same page. Each tab names one panel, and only the selected tab's panel shows. A line under the selected tab marks it and slides to the next tab you pick. Use tabs for content at the same level, such as the sections of a profile. For steps that follow each other, use a **Stepper** instead.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<div data-ok-tabs data-ok-variant="standard" data-ok-orientation="horizontal">
  <div data-ok-tabs-scroller>
    <div role="tablist" data-ok-tabs-list aria-label="Account">
      <button type="button" role="tab" data-ok-tab id="tab-profile" aria-controls="panel-profile"
        aria-selected="true" tabindex="0"><span data-ok-tab-label>Profile</span></button>
      <button type="button" role="tab" data-ok-tab id="tab-billing" aria-controls="panel-billing"
        aria-selected="false" tabindex="-1"><span data-ok-tab-label>Billing</span></button>
    </div>
    <span data-ok-tabs-indicator></span>
  </div>
</div>
<div role="tabpanel" data-ok-tab-panel id="panel-profile" aria-labelledby="tab-profile" tabindex="0">Your name and photo.</div>
<div role="tabpanel" data-ok-tab-panel id="panel-billing" aria-labelledby="tab-billing" tabindex="0" hidden>Your plan and invoices.</div>`,
    react: `import { Tab, TabPanel, Tabs } from "@owlky/react";
import { useState } from "react";

export function Account() {
  const [tab, setTab] = useState("profile");
  return (
    <>
      <Tabs value={tab} onChange={setTab} aria-label="Account">
        <Tab value="profile" label="Profile" id="tab-profile" aria-controls="panel-profile" />
        <Tab value="billing" label="Billing" id="tab-billing" aria-controls="panel-billing" />
      </Tabs>
      <TabPanel id="panel-profile" aria-labelledby="tab-profile" hidden={tab !== "profile"}>
        Your name and photo.
      </TabPanel>
      <TabPanel id="panel-billing" aria-labelledby="tab-billing" hidden={tab !== "billing"}>
        Your plan and invoices.
      </TabPanel>
    </>
  );
}`,
  },
  {
    id: "panels",
    title: "Connect tabs to their panels",
    body: "Give each tab an `id` and an `aria-controls` that names its panel. Give each panel the matching `id` and an `aria-labelledby` that names its tab. Screen readers then announce which tab a panel belongs to. In HTML, the runtime shows the panel of the tab you select and hides the others with `hidden`. In React, the app owns the selection: pass `value` and `onChange`, and set `hidden` on the panels yourself. `defaultValue` keeps the selection inside `Tabs` when you don't need it.",
  },
  {
    id: "icons",
    title: "Add icons to tabs",
    body: "Pass an icon with `icon`. With a label, `iconPosition` puts the icon above (`top`, the default), below (`bottom`), before (`start`) or after (`end`) the label. Tabs with an icon above or below are 72px tall. Icon-only tabs have no visible text, so give each one an `aria-label`.",
    html: `${snippetElement(iconStart, "data-ok-tabs ")}

<!-- Icon only: name each tab -->
${snippetElement(iconOnly, "data-ok-tabs ")}`,
    react: `import { Tab, Tabs } from "@owlky/react";
import { HeartIcon, PhoneIcon } from "lucide-react";

export function TabsIcons() {
  return (
    <Tabs aria-label="Contacts">
      <Tab icon={<PhoneIcon />} iconPosition="start" label="Calls" />
      <Tab icon={<HeartIcon />} aria-label="Favorites" />
    </Tabs>
  );
}`,
  },
  {
    id: "colors",
    title: "Color the selected tab",
    body: "`textColor` sets the color of the selected tab's text, and `indicatorColor` the color of the line. Both default to `inherit`, the text color. Use `primary` or `secondary` to match your brand. Tabs that aren't selected keep the secondary text color, which has a contrast ratio of at least 4.5:1 in both themes.",
    html: `${snippetElement(colorsBoth, 'data-ok-text-color="primary"')}`,
    react: `import { Tab, Tabs } from "@owlky/react";
import { useState } from "react";

export function TabsColors() {
  const [tab, setTab] = useState("calls");
  return (
    <Tabs value={tab} onChange={setTab} textColor="primary" indicatorColor="primary" aria-label="Contacts">
      <Tab value="calls" label="Calls" />
      <Tab value="favorites" label="Favorites" />
      <Tab value="nearby" label="Nearby" />
    </Tabs>
  );
}`,
  },
  {
    id: "scrollable",
    title: "Scroll many tabs",
    body: 'When tabs don\'t fit, set `variant` to `scrollable`. The tabs scroll inside their bar, and selecting a tab scrolls it into view. Scroll buttons appear at the edges that have more tabs. By default (`scrollButtons="auto"`) they show only when the tabs overflow, and only from 600px up: on phones, people swipe. Set `allowScrollButtonsMobile` to show them on phones too, `scrollButtons` to `false` to hide them, or `visibleScrollbar` to keep the scrollbar. In HTML, add the scroll buttons to the markup as the stories show.',
    html: `${snippetElement(scrollableGroup, "data-ok-tabs ")}`,
    react: `import { Tab, Tabs } from "@owlky/react";

const topics = ["Design", "Development", "Marketing", "Sales", "Support", "Finance", "Legal", "People"];

export function TabsScrollable() {
  return (
    <Tabs variant="scrollable" aria-label="Topics">
      {topics.map((topic) => (
        <Tab key={topic} value={topic} label={topic} />
      ))}
    </Tabs>
  );
}`,
  },
  {
    id: "layout",
    title: "Fill the width or stack the tabs",
    body: "Set `variant` to `fullWidth` to share the width between the tabs, or `centered` to center them. Set `orientation` to `vertical` to stack the tabs in a column, with the line on their right. Vertical tabs answer the Up and Down arrow keys. Long labels stay on one line, unless you set `wrapped` on the tab.",
    html: `${snippetElement(verticalGroup, "data-ok-tabs ")}`,
    react: `import { Tab, Tabs } from "@owlky/react";
import { useState } from "react";

export function TabsLayout() {
  const [tab, setTab] = useState("general");
  return (
    <Tabs orientation="vertical" value={tab} onChange={setTab} aria-label="Settings">
      <Tab value="general" label="General" />
      <Tab value="security" label="Security" />
      <Tab value="billing" label="Billing" />
    </Tabs>
  );
}`,
  },
  {
    id: "segmented",
    title: "Use the segmented look",
    body: "Set `segmented` to draw the tabs on a filled bar, with the selected tab on a raised pill instead of a line. The pill slides like the line does. It works with every variant and both orientations, for example as a compact switch between two or three views.",
    html: `${snippetElement(fullWidth, "data-ok-tabs ").replace("<div data-ok-tabs ", "<div data-ok-tabs data-ok-segmented ").replace("<div data-ok-tabs ", "<div data-ok-tabs data-ok-segmented ")}`,
    react: `import { Tab, Tabs } from "@owlky/react";

export function TabsSegmented() {
  return (
    <Tabs segmented variant="fullWidth" aria-label="View">
      <Tab label="Day" />
      <Tab label="Week" />
      <Tab label="Month" />
    </Tabs>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default. The first table lists the options of `Tabs`, the second those of each `Tab`.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and the selection. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:tabs:change\`** (cancelable) fires on the tabs root before a selection, with \`detail.value\`, \`detail.previous\` and \`detail.tab\`. Call \`preventDefault()\` to keep the current tab.
- **Instance:** \`runtime.get(element, "tabs")\` returns \`{ value, setValue(value), select(tab) }\`. \`setValue\` doesn't fire the event.
- **React:** \`onChange(value)\` receives the value of the tab the user picks. A tab's value is its \`value\` prop, or its position (\`"0"\`, \`"1"\`, …) when it has none.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Only the selected tab is in the tab order. The arrow keys move focus between the tabs and skip disabled ones. By default, focus moves without selecting, and Enter or Space selects. Set `selectionFollowsFocus` to select a tab as soon as focus reaches it, which suits panels that render instantly.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Name the tab list with \`aria-label\` or \`aria-labelledby\`, for example after the heading above it.
- Connect every tab and panel through \`aria-controls\` and \`aria-labelledby\`, as shown above.
- Panels are in the tab order (\`tabindex="0"\`), so keyboard users reach panels that hold only text. Remove it when the panel starts with a focusable element.
- Every tab and the selected panel show a focus ring for keyboard users.
- Disabled tabs are skipped by the arrow keys and announced as unavailable.`,
  },
  apiReferenceSection(tabsApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <TextDemo />
    </Preview>
  ),
  icons: () => (
    <Preview>
      <Tabs aria-label="Contacts with icons">
        <Tab icon={<DemoIcon name="phone" />} iconPosition="start" label="Calls" />
        <Tab icon={<DemoIcon name="heart" />} iconPosition="start" label="Favorites" />
      </Tabs>
      <Tabs aria-label="Contacts with icons only">
        <Tab icon={<DemoIcon name="phone" />} aria-label="Calls" />
        <Tab icon={<DemoIcon name="heart" />} aria-label="Favorites" />
      </Tabs>
    </Preview>
  ),
  colors: () => (
    <Preview>
      <Tabs textColor="primary" indicatorColor="primary" aria-label="Primary">
        <Tab label="Calls" />
        <Tab label="Favorites" />
      </Tabs>
      <Tabs textColor="secondary" indicatorColor="secondary" aria-label="Secondary">
        <Tab label="Calls" />
        <Tab label="Favorites" />
      </Tabs>
    </Preview>
  ),
  layout: () => (
    <Preview>
      <VerticalDemo />
    </Preview>
  ),
  segmented: () => (
    <Preview>
      <Tabs segmented aria-label="View">
        <Tab label="Day" />
        <Tab label="Week" />
        <Tab label="Month" />
      </Tabs>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={tabsOptions} />
      <OptionsTable schema={tabOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Tabs content props"
      rows={[
        {
          react: "value / defaultValue",
          html: 'aria-selected="true" on a tab',
          type: "string | false",
          description: "The selected tab's value. `false` selects none.",
        },
        {
          react: "onChange",
          html: "ok:tabs:change",
          type: "(value: string) => void",
          description: "Called with the value of the tab the user selects.",
        },
        {
          react: "Tab value",
          html: "value on the tab",
          type: "string",
          description: "Identifies the tab. Default: its position.",
        },
        {
          react: "Tab label",
          html: "span[data-ok-tab-label]",
          type: "ReactNode",
          description: "The text of the tab.",
        },
        {
          react: "Tab icon",
          html: "svg in the tab",
          type: "ReactElement",
          description: "A decorative icon. Icon-only tabs need an `aria-label`.",
        },
        {
          react: "TabPanel",
          html: 'div[role="tabpanel"][data-ok-tab-panel]',
          type: "component",
          description: "The content of one tab. Hide the others with `hidden`.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus into the tab list (the selected tab), then to the panel."],
        ["Right arrow / Left arrow", "Horizontal tabs: focuses the next / previous tab, wrapping."],
        ["Down arrow / Up arrow", "Vertical tabs: focuses the next / previous tab, wrapping."],
        ["Home / End", "Focuses the first / last tab."],
        ["Enter / Space", "Selects the focused tab."],
      ]}
    />
  ),
};

/** Tabs docs page (ADR-0019). */
export function TabsDocs() {
  return <GuideDocs sections={tabsSections} previews={PREVIEWS} />;
}
