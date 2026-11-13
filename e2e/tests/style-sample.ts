import { expect, type Page } from "@playwright/test";
import { openStory, storyId } from "./helpers.js";

/**
 * Stories that represent the components in each design style (ST6): `styles.spec.ts` scans them
 * with axe and `visual.spec.ts` keeps a baseline of each per style.
 */
export const STYLE_SAMPLE: { name: string; id: string; open?: (page: Page) => Promise<void> }[] = [
  { name: "button", id: storyId("react", "button", "contained") },
  { name: "text field", id: storyId("react", "text-field", "outlined") },
  { name: "chip", id: storyId("react", "chip", "soft") },
  { name: "alert", id: storyId("react", "alert", "standard") },
  { name: "card", id: storyId("react", "card", "basics") },
  { name: "tabs", id: storyId("react", "tabs", "colors") },
  { name: "data grid", id: storyId("react", "datagrid", "basic") },
  {
    name: "dialog",
    id: storyId("react", "dialog", "form"),
    // The paper, its title, text field and actions: open it before scanning.
    open: async (page) => {
      await page.getByRole("button", { name: "Form dialog" }).click();
      await expect(page.getByRole("dialog", { name: "Subscribe" })).toBeVisible();
    },
  },
];

/** Opens a sample story in one style and waits until the style's scope is on the page. */
export async function openStyled(
  page: Page,
  sample: (typeof STYLE_SAMPLE)[number],
  style: string,
  theme: "light" | "dark",
) {
  await openStory(page, sample.id, theme, "", `style:${style}`);
  await page.waitForFunction(
    (s) => (document.documentElement.dataset["okStyle"] ?? "soft") === s,
    style,
  );
  await sample.open?.(page);
}
