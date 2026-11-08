import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

for (const impl of implementations) {
  test.describe(`tabs (${impl})`, () => {
    test("text: a click selects and shows the panel; the line slides under the tab", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "tabs", "text"));
      const one = page.getByRole("tab", { name: "Item one" });
      const two = page.getByRole("tab", { name: "Item two" });
      await expect(one).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel", { name: "Item one" })).toBeVisible();
      await two.click();
      await expect(two).toHaveAttribute("aria-selected", "true");
      await expect(one).toHaveAttribute("tabindex", "-1");
      await expect(page.getByRole("tabpanel", { name: "Item two" })).toBeVisible();
      await expect(page.getByRole("tabpanel", { name: "Item one" })).toBeHidden();
      const line = page.locator("[data-ok-tabs-indicator]");
      await expect
        .poll(async () => {
          const [a, b] = await Promise.all([line.boundingBox(), two.boundingBox()]);
          return Math.round((a?.x ?? 0) - (b?.x ?? 0));
        })
        .toBe(0);
    });

    test("text: arrows move focus, Enter selects, the disabled tab is skipped", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "tabs", "text"));
      const one = page.getByRole("tab", { name: "Item one" });
      const two = page.getByRole("tab", { name: "Item two" });
      await one.focus();
      await page.keyboard.press("ArrowRight");
      await expect(two).toBeFocused();
      await expect(one).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("ArrowRight");
      await expect(one).toBeFocused();
      await page.keyboard.press("End");
      await expect(two).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(two).toHaveAttribute("aria-selected", "true");
    });

    test("vertical: Down / Up move focus between stacked tabs", async ({ page }) => {
      await openStory(page, storyId(impl, "tabs", "vertical"));
      const list = page.getByRole("tablist", { name: "Vertical", exact: true });
      await expect(list).toHaveAttribute("aria-orientation", "vertical");
      const first = list.getByRole("tab", { name: "Item one" });
      await first.focus();
      await page.keyboard.press("ArrowDown");
      await expect(list.getByRole("tab", { name: "Item two" })).toBeFocused();
      await page.keyboard.press("Space");
      await expect(page.getByRole("tabpanel", { name: "Item two" }).first()).toBeVisible();
    });

    test("scrollable: the end button scrolls the tabs, then the start button appears", async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "Scroll buttons are hidden below 600px (scrollButtons auto).");
      await openStory(page, storyId(impl, "tabs", "scrollable"));
      const root = page.locator("[data-ok-tabs]");
      const scroller = page.locator("[data-ok-tabs-scroller]");
      await expect(root).toHaveAttribute("data-ok-can-scroll-end", "");
      await page.locator('[data-ok-tabs-scroll-button="end"]').click();
      await expect.poll(() => scroller.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
      await expect(root).toHaveAttribute("data-ok-can-scroll-start", "");
      // Selecting the last tab from the keyboard scrolls it into view.
      await page.getByRole("tab", { name: "Item one" }).focus();
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      const last = page.getByRole("tab", { name: "Item seven" });
      await expect(last).toHaveAttribute("aria-selected", "true");
      await expect(last).toBeInViewport();
    });

    test("custom: the segmented pill sits behind the selected tab", async ({ page }) => {
      await openStory(page, storyId(impl, "tabs", "custom"));
      const bar = page.getByRole("tablist", { name: "Dynamic width" });
      const two = bar.getByRole("tab", { name: "Item two" });
      await two.click();
      const indicator = page
        .locator("[data-ok-tabs][data-ok-segmented] [data-ok-tabs-indicator]")
        .first();
      await expect
        .poll(async () => {
          const [a, b] = await Promise.all([indicator.boundingBox(), two.boundingBox()]);
          return (
            [Math.round(a?.x ?? 0), Math.round(a?.width ?? 0)].join() ===
            [Math.round(b?.x ?? 0), Math.round(b?.width ?? 0)].join()
          );
        })
        .toBe(true);
    });

    test("touch: a tap selects", async ({ page, isMobile }) => {
      test.skip(!isMobile, "Touch only.");
      await openStory(page, storyId(impl, "tabs", "text"));
      const two = page.getByRole("tab", { name: "Item two" });
      await two.tap();
      await expect(two).toHaveAttribute("aria-selected", "true");
    });
  });

  test.describe(`breadcrumbs (${impl})`, () => {
    test("text: a landmark with links and the current page", async ({ page }) => {
      await openStory(page, storyId(impl, "breadcrumbs", "text"));
      const nav = page.getByRole("navigation", { name: "breadcrumb" });
      await expect(nav.getByRole("link")).toHaveCount(2);
      await expect(nav.locator('[aria-current="page"]')).toHaveText("Accessories");
    });

    test("maxItems collapses the trail; the button expands it and focuses the first revealed link", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "breadcrumbs", "customized"), "light", "maxItems:2");
      const nav = page.getByRole("navigation", { name: "breadcrumb", exact: true });
      const expand = nav.getByRole("button", { name: "Show path" });
      await expect(nav.getByRole("link", { name: "Products" })).toBeHidden();
      await expand.click();
      const products = nav.getByRole("link", { name: "Products" });
      await expect(products).toBeVisible();
      await expect(products).toBeFocused();
      await expect(nav.getByRole("button")).toHaveCount(0);
    });

    test("touch: the expand button reacts to a tap", async ({ page, isMobile }) => {
      test.skip(!isMobile, "Touch only.");
      await openStory(page, storyId(impl, "breadcrumbs", "text"), "light", "maxItems:2");
      await page.getByRole("button", { name: "Show path" }).tap();
      await expect(page.getByRole("link", { name: "Catalog" })).toBeVisible();
    });
  });

  test.describe(`stepper (${impl})`, () => {
    const states = (page: import("@playwright/test").Page, index = 0) =>
      page
        .locator("[data-ok-stepper]")
        .nth(index)
        .locator("[data-ok-step]")
        .evaluateAll((steps) =>
          steps.map((s) =>
            ["active", "completed", "disabled"]
              .filter((n) => s.hasAttribute(`data-ok-${n}`))
              .join(),
          ),
        );

    test("horizontal: Next completes steps, Back returns, Reset starts over", async ({ page }) => {
      await openStory(page, storyId(impl, "stepper", "horizontal"));
      const back = page.getByRole("button", { name: "Back" });
      const next = page.getByRole("button", { name: "Next" });
      await expect(back).toBeDisabled();
      expect(await states(page)).toEqual(["active", "disabled", "disabled"]);
      await next.click();
      expect(await states(page)).toEqual(["completed", "active", "disabled"]);
      await expect(page.getByText("Name the project and invite the people")).toBeVisible();
      await expect(page.locator('[aria-current="step"]')).toContainText("Add details");
      await back.click();
      expect(await states(page)).toEqual(["active", "disabled", "disabled"]);
      for (let i = 0; i < 3; i++) await next.click();
      expect(await states(page)).toEqual(["completed", "completed", "completed"]);
      await expect(page.getByText("All steps completed.")).toBeVisible();
      await page.getByRole("button", { name: "Reset" }).click();
      expect(await states(page)).toEqual(["active", "disabled", "disabled"]);
    });

    test("vertical: the active step shows its content; Continue moves on", async ({ page }) => {
      await openStory(page, storyId(impl, "stepper", "vertical"));
      await expect(page.getByText("Pick the plan and the billing period")).toBeVisible();
      await expect(page.getByText("Name the project and invite")).toBeHidden();
      await page.getByRole("button", { name: "Continue" }).first().click();
      await expect(page.getByText("Name the project and invite")).toBeVisible();
      await expect(page.getByText("Pick the plan and the billing period")).toBeHidden();
    });

    test("customized: one Next moves both steppers", async ({ page }) => {
      await openStory(page, storyId(impl, "stepper", "customized"));
      await page.getByRole("button", { name: "Next" }).click();
      expect(await states(page, 0)).toEqual(["completed", "active", "disabled"]);
      expect(await states(page, 1)).toEqual(["completed", "active", "disabled"]);
    });

    test("mobile: Next / Back update the text, the dots and the bar; disabled at the ends", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "stepper", "mobile"));
      const bars = page.locator("[data-ok-mobile-stepper]");
      const text = bars.nth(0);
      await text.getByRole("button", { name: "Next" }).click();
      await expect(text.locator("[data-ok-mobile-stepper-text]")).toHaveText("2 / 3");
      const dots = bars.nth(1);
      await dots.getByRole("button", { name: "Next" }).click();
      await expect(dots.getByRole("img", { name: "Step 2 of 3" })).toBeVisible();
      const progress = bars.nth(2);
      await progress.getByRole("button", { name: "Next" }).click();
      await progress.getByRole("button", { name: "Next" }).click();
      await expect(progress.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
      await expect(progress.getByRole("button", { name: "Next" })).toBeDisabled();
      await expect(page.getByRole("heading", { name: "Review and confirm" })).toBeVisible();
    });

    test("touch: Next reacts to a tap", async ({ page, isMobile }) => {
      test.skip(!isMobile, "Touch only.");
      await openStory(page, storyId(impl, "stepper", "horizontal"));
      await page.getByRole("button", { name: "Next" }).tap();
      expect(await states(page)).toEqual(["completed", "active", "disabled"]);
    });
  });
}
