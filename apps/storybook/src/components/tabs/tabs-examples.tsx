import { tabsOptions } from "@owlky/core";
import { Tab, Tabs, type TabsColor } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { SolarIcon } from "../../helpers/solar-icons.js";
import type { GroupFiles } from "../shared/snippets.js";

const ITEMS = ["Item one", "Item two", "Item three"];
const MANY = [
  "Item one",
  "Item two",
  "Item three",
  "Item four",
  "Item five",
  "Item six",
  "Item seven",
];
/** Tab value, icon and accessible name. */
const ICONS = [
  ["phone", "phone-linear", "Phone"],
  ["heart", "heart-linear", "Favorites"],
  ["headphones", "headphones-round-linear", "Music"],
] as const;

/** Three tabs with an icon and a label; the third one is disabled (as on the reference). */
function IconTabs({
  label,
  position,
}: {
  label: string;
  position: "top" | "bottom" | "start" | "end";
}) {
  return (
    <Tabs aria-label={label}>
      {ICONS.map(([value, icon], index) => (
        <Tab
          key={value}
          value={value}
          icon={<SolarIcon name={icon} />}
          iconPosition={position}
          label={ITEMS[index]}
          disabled={index === 2}
        />
      ))}
    </Tabs>
  );
}
IconTabs.displayName = "IconTabs";

/** Icon-only tabs (each named by its `aria-label`). */
function IconOnlyTabs({
  label,
  textColor,
  indicatorColor,
}: {
  label: string;
  textColor?: TabsColor;
  indicatorColor?: TabsColor;
}) {
  return (
    <Tabs aria-label={label} textColor={textColor} indicatorColor={indicatorColor}>
      {ICONS.map(([value, icon, name], index) => (
        <Tab
          key={value}
          value={value}
          icon={<SolarIcon name={icon} />}
          aria-label={name}
          disabled={index === 2}
        />
      ))}
    </Tabs>
  );
}
IconOnlyTabs.displayName = "IconOnlyTabs";

const COLORS: TabsColor[] = ["inherit", "primary", "secondary"];
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Story groups — the same examples, in the same order, as the HTML snippets
 * `packages/html/src/components/tabs/examples/<story>-<file>.html`. The `div.sb-tabs-narrow`
 * wrappers are story-only demo markup (`.storybook/preview.css`) that make scrolling visible.
 */
export const tabsStories: Record<string, ReactGroup[]> = {
  icon: [
    { title: "Icon only", content: <IconOnlyTabs label="Icon only" /> },
    { title: "Top icon", content: <IconTabs label="Top icon" position="top" /> },
    { title: "Bottom icon", content: <IconTabs label="Bottom icon" position="bottom" /> },
    { title: "Start icon", content: <IconTabs label="Start icon" position="start" /> },
    { title: "End icon", content: <IconTabs label="End icon" position="end" /> },
  ],
  colors: [
    {
      title: "Text color",
      content: COLORS.map((color) => (
        <IconOnlyTabs key={color} label={`${capitalize(color)} text`} textColor={color} />
      )),
    },
    {
      title: "Indicator color",
      content: COLORS.map((color) => (
        <IconOnlyTabs key={color} label={`${capitalize(color)} indicator`} indicatorColor={color} />
      )),
    },
    {
      title: "Text & indicator color",
      content: COLORS.map((color) => (
        <IconOnlyTabs
          key={color}
          label={`${capitalize(color)} text and indicator`}
          textColor={color}
          indicatorColor={color}
        />
      )),
    },
  ],
  scrollable: [
    {
      title: "Scrollable",
      content: (
        <div className="sb-tabs-narrow">
          <Tabs variant="scrollable" aria-label="Scrollable">
            {MANY.map((item) => (
              <Tab key={item} label={item} />
            ))}
          </Tabs>
        </div>
      ),
    },
  ],
  custom: [
    {
      title: "Dynamic width",
      content: (
        <Tabs segmented aria-label="Dynamic width">
          {MANY.slice(0, 4).map((item, index) => (
            <Tab key={item} label={item} disabled={index === 2} />
          ))}
        </Tabs>
      ),
    },
    {
      title: "Scrollable width",
      content: (
        <div className="sb-tabs-narrow">
          <Tabs segmented variant="scrollable" textColor="secondary" aria-label="Scrollable width">
            {MANY.slice(0, 4).map((item, index) => (
              <Tab key={item} label={item} disabled={index === 2} />
            ))}
          </Tabs>
        </div>
      ),
    },
    {
      title: "Full width",
      content: (
        <div className="sb-tabs-wide">
          <Tabs segmented variant="fullWidth" textColor="primary" aria-label="Full width">
            {MANY.slice(0, 4).map((item, index) => (
              <Tab key={item} label={item} disabled={index === 2} />
            ))}
          </Tabs>
        </div>
      ),
    },
  ],
};

export const TABS_FILES: Record<string, GroupFiles> = {
  icon: [
    ["Icon only", "icon-only"],
    ["Top icon", "top"],
    ["Bottom icon", "bottom"],
    ["Start icon", "start"],
    ["End icon", "end"],
  ],
  colors: [
    ["Text color", "text"],
    ["Indicator color", "indicator"],
    ["Text & indicator color", "both"],
  ],
  scrollable: [["Scrollable", "group"]],
  custom: [
    ["Dynamic width", "dynamic"],
    ["Scrollable width", "scrollable"],
    ["Full width", "full-width"],
  ],
  text: [["Text", "group"]],
  vertical: [["Vertical", "group"]],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const TABS_CONTROLS = {
  schema: tabsOptions,
  keys: ["centered", "selectionFollowsFocus"],
} as const;
