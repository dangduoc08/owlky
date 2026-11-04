import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { CONTRAST_EXEMPT, implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const item = (page: Page, title: string) =>
  page.locator("details[data-ok-accordion]", {
    has: page.locator(`summary:text-is("${title}")`),
  });
const summary = (page: Page, title: string) => item(page, title).locator("summary");
const isOpen = (page: Page, title: string) =>
  item(page, title).evaluate((details) => (details as HTMLDetailsElement).open);

for (const impl of implementations) {
  test.describe(`accordion (${impl})`, () => {
    test("click / tap and keyboard toggle; disabled stays closed; the open item is a card", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "accordion", "simple"));
      const first = summary(page, "Accordion 1");
      if (isMobile) await first.tap();
      else await first.click();
      await expect.poll(() => isOpen(page, "Accordion 1")).toBe(true);
      await expect(item(page, "Accordion 1").locator("[data-ok-accordion-details]")).toBeVisible();
      const shadow = await item(page, "Accordion 1").evaluate(
        (el) => getComputedStyle(el).boxShadow,
      );
      expect(shadow).not.toBe("none");
      await first.focus();
      await page.keyboard.press("Enter");
      await expect.poll(() => isOpen(page, "Accordion 1")).toBe(false);
      await summary(page, "Disabled accordion").click({ force: true });
      expect(await isOpen(page, "Disabled accordion")).toBe(false);
    });

    for (const theme of ["light", "dark"] as const) {
      test(`open content meets AA contrast in every variant (${theme})`, async ({
        page,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "axe results are engine-independent.");
        for (const story of ["simple", "custom-styles"]) {
          await openStory(page, storyId(impl, "accordion", story), theme);
          await page.evaluate(async () => {
            for (const details of document.querySelectorAll<HTMLDetailsElement>(
              "details[data-ok-accordion]:not([data-ok-disabled])",
            ))
              details.open = true;
            await Promise.all(document.getAnimations().map((animation) => animation.finished));
          });
          let axe = new AxeBuilder({ page })
            .include("#storybook-root")
            .withRules(["color-contrast"]);
          for (const selector of CONTRAST_EXEMPT) axe = axe.exclude(selector);
          const { violations } = await axe.analyze();
          expect(
            violations.flatMap((v) => v.nodes.map((n) => n.target.join(" "))),
            story,
          ).toEqual([]);
        }
      });
    }

    test("controlled: one open at a time", async ({ page }) => {
      await openStory(page, storyId(impl, "accordion", "controlled"));
      await summary(page, "General settings").click();
      await expect.poll(() => isOpen(page, "General settings")).toBe(true);
      await summary(page, "Users").click();
      await expect.poll(() => isOpen(page, "Users")).toBe(true);
      expect(await isOpen(page, "General settings")).toBe(false);
    });
  });

  test.describe(`alert (${impl})`, () => {
    test("the close button dismisses the alert (React: onClose demo; HTML: runtime)", async ({
      page,
    }) => {
      test.skip(impl === "react", "The React story's onClose is a no-op: the owner unmounts.");
      await openStory(page, storyId(impl, "alert", "actions"));
      const alerts = page.locator("[data-ok-alert]");
      const count = await alerts.count();
      await page.getByRole("button", { name: "Close" }).first().click();
      await expect(alerts.first()).toBeHidden();
      expect(await page.locator("[data-ok-alert]:visible").count()).toBe(count - 1);
    });
  });

  test.describe(`accordion & alert responsive (${impl})`, () => {
    for (const viewport of viewports) {
      test(`${viewport.name}: no overflow, no clipping, targets ≥ 24px`, async ({
        page,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "Layout matrix runs once.");
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const [component, story] of [
          ["accordion", "simple"],
          ["accordion", "custom-styles"],
          ["alert", "description"],
          ["alert", "actions"],
        ] as const) {
          await openStory(page, storyId(impl, component, story));
          for (const details of await page.locator("details:not([data-ok-disabled])").all())
            await details.evaluate((el) => {
              (el as HTMLDetailsElement).open = true;
            });
          const problems = await page.evaluate(() => {
            const out: string[] = [];
            if (document.documentElement.scrollWidth > window.innerWidth)
              out.push("page overflows");
            for (const el of document.querySelectorAll<HTMLElement>(
              "#storybook-root summary, #storybook-root [data-ok-alert], #storybook-root button",
            )) {
              const box = el.getBoundingClientRect();
              if (box.width === 0) continue;
              if (box.right > window.innerWidth + 0.5) out.push(`${el.localName} beyond viewport`);
              if (el.scrollWidth > el.clientWidth + 1) out.push(`${el.localName} clipped`);
              if (el.localName !== "div" && (box.width < 24 || box.height < 24))
                out.push(`${el.localName} target ${box.width}×${box.height}`);
            }
            return out;
          });
          expect(problems, `${component}/${story}`).toEqual([]);
        }
      });
    }
  });
}
