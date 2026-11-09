import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const decoration = (el: Element) => {
  const s = getComputedStyle(el);
  return { line: s.textDecorationLine, color: s.textDecorationColor, text: s.color };
};

for (const impl of implementations) {
  test.describe(`link (${impl})`, () => {
    for (const theme of ["light", "dark"] as const) {
      test(`basic links (${theme}): primary, inherited and body2, always underlined`, async ({
        page,
      }) => {
        await openStory(page, storyId(impl, "link", "basic-links"), theme);
        const links = page.locator("[data-ok-link]");
        await expect(links).toHaveCount(3);
        const styles = await links.evaluateAll((all) =>
          all.map((el) => {
            const probe = document.createElement("span");
            probe.style.color = "var(--ok-palette-primary-main)";
            el.parentElement?.append(probe);
            const primary = getComputedStyle(probe).color;
            const parent = getComputedStyle(el.parentElement as Element).color;
            probe.remove();
            const s = getComputedStyle(el);
            return {
              tag: el.localName,
              primary: s.color === primary,
              inherited: s.color === parent,
              underline: s.textDecorationLine,
            };
          }),
        );
        expect(styles.map((s) => s.underline)).toEqual(["underline", "underline", "underline"]);
        expect(styles.map((s) => s.tag)).toEqual(["a", "a", "a"]);
        expect(styles[0]?.primary).toBe(true);
        expect(styles[1]?.inherited).toBe(true);
        expect(styles[2]?.primary).toBe(true);
      });
    }

    test("underline: none, on hover, always", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "link", "underline"));
      const [none, hover, always] = [
        page.getByRole("link", { name: "No underline" }),
        page.getByRole("link", { name: "Underline on hover" }),
        page.getByRole("link", { name: "Underline always" }),
      ];
      expect((await none.evaluate(decoration)).line).toBe("none");
      expect((await hover.evaluate(decoration)).line).toBe("none");
      const resting = await always.evaluate(decoration);
      expect(resting.line).toBe("underline");
      // The resting underline is the main tone at 40 %, lighter than the text.
      expect(resting.color).not.toBe(resting.text);
      if (isMobile) return; // Touch devices have no hover: the underline stays as it is.
      await hover.hover();
      const hovered = await hover.evaluate(decoration);
      expect(hovered.line).toBe("underline");
      expect(hovered.color).toBe(hovered.text);
      await none.hover();
      expect((await none.evaluate(decoration)).line).toBe("none");
    });

    test("keyboard: Tab reaches each link with a focus ring; Enter follows it", async ({
      page,
      browserName,
    }) => {
      await openStory(page, storyId(impl, "link", "underline"));
      const first = page.getByRole("link", { name: "No underline" });
      await first.focus();
      await page.keyboard.press("Tab");
      const second = page.getByRole("link", { name: "Underline on hover" });
      await expect(second).toBeFocused();
      if (browserName !== "webkit") {
        const outline = await second.evaluate((el) => getComputedStyle(el).outlineStyle);
        expect(outline).toBe("solid");
      }
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#underline-hover$/);
    });

    test("accessibility: a button link, a new-tab link with rel, links in text", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "link", "accessibility"));
      const button = page.getByRole("button", { name: "Show more details" });
      await expect(button).toHaveAttribute("type", "button");
      if (isMobile) await button.tap();
      else await button.click();
      const tab = page.getByRole("link", { name: /opens in a new tab/ });
      await expect(tab).toHaveAttribute("target", "_blank");
      await expect(tab).toHaveAttribute("rel", "noopener noreferrer");
      const inText = page.locator("p [data-ok-link]");
      await expect(inText).toHaveCount(2);
      expect(
        await inText.evaluateAll((all) => all.map((el) => getComputedStyle(el).textDecorationLine)),
      ).toEqual(["underline", "underline"]);
    });

    test("breadcrumbs compose Links in the parent's color, underlined on hover", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "breadcrumbs", "text"));
      const home = page.getByRole("link", { name: "Home" });
      await expect(home).toHaveAttribute("data-ok-link", "");
      await expect(home).toHaveAttribute("data-ok-underline", "hover");
      const style = await home.evaluate((el) => {
        const item = el.closest("[data-ok-breadcrumbs]") as Element;
        return {
          color: getComputedStyle(el).color === getComputedStyle(item).color,
          line: getComputedStyle(el).textDecorationLine,
        };
      });
      expect(style).toEqual({ color: true, line: "none" });
      if (isMobile) return;
      await home.hover();
      expect(await home.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe(
        "underline",
      );
    });
  });
}
