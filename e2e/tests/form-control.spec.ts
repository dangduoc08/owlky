import { expect, type Locator, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** The computed color of a `var(--ok-*)` value in the page's theme. */
function tokenColor(page: Page, value: string) {
  return page.evaluate((v) => {
    const probe = document.createElement("span");
    probe.style.color = v;
    document.querySelector("#storybook-root")?.append(probe);
    const result = getComputedStyle(probe).color;
    probe.remove();
    return result;
  }, value);
}

const colorOf = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).color);

for (const impl of implementations) {
  test.describe(`form control (${impl})`, () => {
    for (const theme of ["light", "dark"] as const) {
      test(`checkbox group (${theme}): names, linkage and the shared error state`, async ({
        page,
      }) => {
        await openStory(page, storyId(impl, "form-control", "checkboxes"), theme);
        const assign = page.getByRole("group", { name: "Assign responsibility" });
        await expect(assign).toHaveAccessibleDescription("Be careful");
        const pick = page.getByRole("group", { name: "Pick two" });
        await expect(pick).toHaveAccessibleDescription("You can display an error");
        expect(await colorOf(assign.locator("legend"))).toBe(
          await tokenColor(page, "var(--ok-text-secondary)"),
        );
        const error = await tokenColor(page, "var(--ok-palette-error-text)");
        expect(await colorOf(pick.locator("legend"))).toBe(error);
        expect(await colorOf(pick.locator("[data-ok-form-helper-text]"))).toBe(error);
        await expect(pick.locator("[data-ok-form-label-asterisk]")).toHaveAttribute(
          "aria-hidden",
          "true",
        );
        await expect(pick.getByRole("checkbox", { name: "Gilad Gray" })).toHaveAttribute(
          "aria-invalid",
          "true",
        );
      });
    }

    test("radio group: legend names the group; arrow keys select", async ({ page }) => {
      await openStory(page, storyId(impl, "form-control", "radios"));
      const group = page.getByRole("radiogroup", { name: "Gender" });
      await expect(group.getByRole("radio", { name: "Female", exact: true })).toBeChecked();
      await page.keyboard.press("Tab");
      await expect(group.getByRole("radio", { name: "Female", exact: true })).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(group.getByRole("radio", { name: "Male", exact: true })).toBeChecked();
    });

    test("show error: the radio group is invalid and described by the message", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "form-control", "show-error"));
      const group = page.getByRole("radiogroup");
      await expect(group).toHaveAttribute("aria-invalid", "true");
      await expect(group).toHaveAccessibleDescription("Sorry, wrong answer!");
    });

    test("states: a disabled fieldset turns its controls off; required and focused labels", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "form-control", "states"));
      const disabled = page.getByRole("group", { name: "Notifications" });
      for (const name of ["Email", "Push"])
        await expect(disabled.getByRole("checkbox", { name })).toBeDisabled();
      await disabled.getByText("Push").click({ force: true });
      await expect(disabled.getByRole("checkbox", { name: "Push" })).not.toBeChecked();
      expect(await colorOf(disabled.locator("legend"))).toBe(
        await tokenColor(page, "var(--ok-text-disabled)"),
      );
      await expect(page.getByRole("radiogroup", { name: "Plan" })).toHaveAttribute(
        "aria-required",
        "true",
      );
      expect(await colorOf(page.getByRole("group", { name: "Theme" }).locator("legend"))).toBe(
        await tokenColor(page, "var(--ok-palette-primary-text)"),
      );
    });

    test("standalone control: the label toggles the switch (pointer and touch)", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "form-control", "standalone"));
      const control = page.getByRole("switch", { name: "Email notifications" });
      await expect(control).toHaveAccessibleDescription("Get an email when someone mentions you.");
      await expect(control).toBeChecked();
      const label = page.locator("label[data-ok-form-label]");
      if (isMobile) await label.tap();
      else await label.click();
      await expect(control).not.toBeChecked();
    });

    test("the Controls' error and focused reach every root and its parts", async ({ page }) => {
      await openStory(
        page,
        storyId(impl, "form-control", "switches"),
        "light",
        "error:!true;focused:!true",
      );
      const root = page.locator("[data-ok-form-control]");
      await expect(root).toHaveAttribute("data-ok-error", "");
      await expect(root).toHaveAttribute("data-ok-focused", "");
      const error = await tokenColor(page, "var(--ok-palette-error-text)");
      expect(await colorOf(root.locator("legend"))).toBe(error);
      expect(await colorOf(root.locator("p"))).toBe(error);
    });
  });
}
