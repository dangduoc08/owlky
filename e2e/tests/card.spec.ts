import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Each card's shadow equals the token its options name (spec: card.md), resolved in its scope. */
function shadows(page: Page) {
  return page.locator("[data-ok-card]").evaluateAll((cards) =>
    cards.map((card) => {
      const probe = document.createElement("div");
      const level = card.getAttribute("data-ok-elevation");
      probe.style.boxShadow =
        card.getAttribute("data-ok-variant") === "outlined"
          ? "none"
          : card.hasAttribute("data-ok-raised")
            ? "var(--ok-elevation-8)"
            : level === "0"
              ? "none"
              : level === "1"
                ? "var(--ok-shadow-card)"
                : `var(--ok-elevation-${level})`;
      card.parentElement?.append(probe);
      const expected = getComputedStyle(probe).boxShadow;
      probe.remove();
      return getComputedStyle(card).boxShadow === expected;
    }),
  );
}

for (const impl of implementations) {
  test.describe(`card (${impl})`, () => {
    for (const theme of ["light", "dark"] as const) {
      test(`basics (${theme}): a Paper root with the card radius and shadow`, async ({ page }) => {
        await openStory(page, storyId(impl, "card", "basics"), theme);
        const card = page.locator("[data-ok-card]");
        await expect(card).toHaveCount(1);
        await expect(card).toHaveAttribute("data-ok-paper", "");
        expect(await shadows(page)).toEqual([true]);
        expect(await card.evaluate((c) => getComputedStyle(c).borderTopLeftRadius)).toBe("16px");
        expect(await card.evaluate((c) => getComputedStyle(c).backgroundColor)).toBe(
          theme === "light" ? "rgb(255, 255, 255)" : "rgb(28, 37, 46)",
        );
      });
    }

    test("outlined: a 1px outline and no shadow", async ({ page }) => {
      await openStory(page, storyId(impl, "card", "outlined"));
      const style = await page.locator("[data-ok-card]").evaluate((c) => {
        const s = getComputedStyle(c);
        return { shadow: s.boxShadow, width: s.borderTopWidth, border: s.borderTopStyle };
      });
      expect(style).toEqual({ shadow: "none", width: "1px", border: "solid" });
    });

    test("the Controls' variant, raised and square reach every card", async ({ page }) => {
      await openStory(page, storyId(impl, "card", "media"), "light", "raised:!true;square:!true");
      const cards = page.locator("[data-ok-card]");
      await expect(cards).toHaveCount(3);
      expect(await shadows(page)).toEqual([true, true, true]);
      expect(
        await cards.evaluateAll((all) => all.map((c) => getComputedStyle(c).borderTopLeftRadius)),
      ).toEqual(["0px", "0px", "0px"]);
    });

    test("complex interaction: the chevron shows and hides the method", async ({ page }) => {
      await openStory(page, storyId(impl, "card", "complex-interaction"));
      const expand = page.getByRole("button", { name: "Show the method" });
      const method = page.locator("#card-garden-method");
      await expect(expand).toHaveAttribute("aria-expanded", "false");
      await expect(method).toBeHidden();
      await expand.click();
      await expect(expand).toHaveAttribute("aria-expanded", "true");
      await expect(method).toBeVisible();
      await expect(method).toContainText("Method:");
      await expand.press("Enter");
      await expect(expand).toHaveAttribute("aria-expanded", "false");
      await expect(method).toBeHidden();
      // Header: title h6 and subheader in the header's content column, action at the end.
      const header = await page.locator("[data-ok-card-header]").evaluate((h) => ({
        padding: getComputedStyle(h).padding,
        title: h.querySelector("[data-ok-card-header-title]")?.textContent,
        action: h.lastElementChild?.hasAttribute("data-ok-card-header-action"),
      }));
      expect(header).toEqual({
        padding: "24px 24px 0px",
        title: "Golden flower bed",
        action: true,
      });
    });

    test("primary action: one button over media and content, tinted on focus", async ({ page }) => {
      await openStory(page, storyId(impl, "card", "primary-action"));
      const areas = page.locator("[data-ok-card-action-area]");
      await expect(areas).toHaveCount(2);
      const first = areas.first();
      await expect(first).toHaveAccessibleName(/^Teal smoke Smoke Smoke is a cloud/);
      const after = () => first.evaluate((a) => getComputedStyle(a, "::after").backgroundColor);
      expect(await after()).toBe("rgba(0, 0, 0, 0)");
      // Keyboard focus: back from the second area (Firefox keeps Tab out of the page's first control).
      await areas.nth(1).focus();
      await page.keyboard.press("Shift+Tab");
      await expect(first).toBeFocused();
      await expect.poll(after).not.toBe("rgba(0, 0, 0, 0)");
      expect(await first.evaluate((a) => getComputedStyle(a).outlineStyle)).toBe("solid");
    });

    test("active state: pressing a card makes it the chosen one", async ({ page }) => {
      await openStory(page, storyId(impl, "card", "active-state"));
      const areas = page.locator("[data-ok-card-action-area]");
      await expect(areas).toHaveCount(3);
      const pressed = () =>
        areas.evaluateAll((all) => all.map((a) => a.getAttribute("aria-pressed")));
      expect(await pressed()).toEqual(["true", "false", "false"]);
      await areas.nth(2).click();
      expect(await pressed()).toEqual(["false", "false", "true"]);
      const selected = await areas
        .nth(2)
        .evaluate((a) => getComputedStyle(a).backgroundColor !== "rgba(0, 0, 0, 0)");
      expect(selected).toBe(true);
      await areas.nth(1).focus();
      await page.keyboard.press("Space");
      expect(await pressed()).toEqual(["false", "true", "false"]);
    });
  });
}

test.describe("card on touch screens", () => {
  test.use({ hasTouch: true });
  for (const impl of implementations) {
    test(`complex interaction and active state work with taps (${impl})`, async ({ page }) => {
      await openStory(page, storyId(impl, "card", "complex-interaction"));
      await page.getByRole("button", { name: "Show the method" }).tap();
      await expect(page.locator("#card-garden-method")).toBeVisible();
      await openStory(page, storyId(impl, "card", "active-state"));
      await page.locator("[data-ok-card-action-area]").nth(1).tap();
      await expect(page.locator("[data-ok-card-action-area]").nth(1)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  }
});
