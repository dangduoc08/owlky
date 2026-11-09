import { type OptionSpec, optionSchemas } from "@owlky/core";
import { expect, test } from "@playwright/test";
import { normalizeStory, openStory, storyId } from "./helpers.js";

/**
 * ADR-0015: every option offered in the stories' Controls exists in both implementations and
 * gives the same DOM — React through props, HTML through attributes. One story per component;
 * each option is set to a non-default value in both and the anatomies are compared.
 */
const CASES: [
  component: string,
  story: string,
  schema: keyof typeof optionSchemas,
  keys: string[],
][] = [
  ["button", "contained", "button", ["size", "disabled", "fullWidth", "disableElevation"]],
  ["icon-button", "colors", "icon-button", ["size", "edge", "disabled", "animate"]],
  ["fab", "default", "fab", ["size", "disabled", "animate"]],
  ["button-group", "outlined", "button-group", ["orientation", "size", "fullWidth", "disabled"]],
  ["toggle-button", "colors", "toggle-button", ["size", "color", "fullWidth", "disabled"]],
  ["accordion", "simple", "accordion", ["variant", "disableGutters"]],
  ["alert", "standard", "alert", ["variant", "color"]],
  ["drawer", "anchor", "drawer", ["hideBackdrop", "disableEscapeKeyDown"]],
  ["sortable", "grid", "sortable", ["layout"]],
  ["table", "basic", "table", ["size", "stickyHeader"]],
  ["pagination", "ranges", "pagination", ["variant", "color", "shape", "size", "disabled"]],
  ["scrollbar", "vertical", "scrollbar", ["autoHide"]],
  [
    "circular-progress",
    "determinate",
    "circular-progress",
    ["thickness", "enableTrackSlot", "disableShrink"],
  ],
  ["linear-progress", "buffer", "linear-progress", ["value", "valueBuffer"]],
  ["checkbox", "colors", "checkbox", ["color", "size", "disabled"]],
  ["switch", "colors", "switch", ["color", "size", "disabled"]],
  ["radio", "colors", "radio", ["color", "size", "disabled"]],
  ["avatar", "letter", "avatar", ["variant"]],
  ["badge", "standard", "badge", ["overlap", "invisible"]],
  ["chip", "filled", "chip", ["size", "disabled"]],
  ["divider", "variants", "divider", ["variant"]],
  ["list", "simple", "list", ["dense", "disablePadding"]],
  ["tooltip", "simple", "tooltip", ["arrow"]],
  ["tabs", "custom", "tabs", ["centered", "selectionFollowsFocus"]],
  ["timeline", "right", "timeline", ["position"]],
  [
    "organization-chart",
    "simple",
    "organization-chart",
    ["lineHeight", "lineWidth", "lineColor", "lineStyle", "lineBorderRadius", "nodePadding"],
  ],
  ["rating", "controlled", "rating", ["size", "color"]],
  ["chart", "column-multiple", "chart", ["curve", "legend"]],
  ["carousel", "align", "carousel", ["align", "loop", "dragFree", "containScroll"]],
  ["slider", "temperature", "slider", ["size", "color", "disabled"]],
  ["transfer-list", "simple", "transfer-list", ["disabled"]],
  ["tree-view", "simple", "tree-view", ["variant", "expansionTrigger"]],
  ["autocomplete", "playground", "autocomplete", ["openOnFocus", "autoHighlight"]],
  [
    "date-pickers",
    "calendars",
    "date-calendar",
    ["displayWeekNumber", "showDaysOutsideCurrentMonth", "disableHighlightToday", "yearsOrder"],
  ],
  ["date-pickers", "clocks", "time-clock", ["readOnly"]],
  [
    "date-pickers",
    "range-calendars",
    "date-range-calendar",
    ["disableDragEditing", "disableAutoMonthSwitching", "disableHighlightToday"],
  ],
  ["motion", "in-view", "motion", ["variant", "duration", "distance"]],
  ["motion", "text", "motion-text", ["variant", "duration", "stagger"]],
  ["motion", "background", "motion", ["paused", "duration"]],
  ["datagrid", "basic", "data-grid", ["density", "disableColumnMenu"]],
  ["datagrid", "advanced", "data-grid", ["disableColumnResize", "editMode"]],
  ["motion", "count-up-story", "count-up", ["duration"]],
  ["motion", "border", "motion-border", ["paused", "width", "duration"]],
  ["breadcrumbs", "text", "breadcrumbs", ["maxItems", "itemsBeforeCollapse", "itemsAfterCollapse"]],
  ["code-editor", "diff", "diff-editor", ["theme"]],
  [
    "text-field",
    "outlined",
    "text-field",
    ["size", "color", "error", "margin", "shrink", "disabled"],
  ],
];

/** A non-default value for the option, in Storybook's URL args syntax. */
function testValue(spec: OptionSpec): string {
  if (spec.kind === "style") {
    return spec.optional
      ? (spec.values[0] as string)
      : (spec.values.find((v) => v !== spec.default) as string);
  }
  if (spec.kind === "behavior") return spec.default ? "!false" : "!true";
  if (spec.kind === "number") return String((spec.default ?? 30) + 20);
  return "!true";
}

for (const [component, story, schemaName, keys] of CASES) {
  const schema = optionSchemas[schemaName];
  for (const key of keys) {
    const spec = schema.options[key as keyof typeof schema.options] as OptionSpec;
    const args = `${key}:${testValue(spec)}`;
    test(`${component} ${story}: option ${args} gives the same anatomy in React and HTML`, async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "Structure is browser-independent.");
      await openStory(page, storyId("react", component, story), "light", args);
      const react = await normalizeStory(page);
      await openStory(page, storyId("html", component, story), "light", args);
      const html = await normalizeStory(page);
      expect(react).toEqual(html);
      // The option really changed something (or is a runtime behavior read on action).
      await openStory(page, storyId("html", component, story));
      const pristine = await normalizeStory(page);
      if (spec.kind !== "behavior") expect(html).not.toEqual(pristine);
    });
  }
}
