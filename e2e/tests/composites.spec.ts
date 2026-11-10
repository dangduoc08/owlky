import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const filled = (page: Page, index = 0) =>
  page
    .locator("[data-ok-rating]")
    .nth(index)
    .locator("[data-ok-rating-icon]")
    .evaluateAll((icons) => icons.map((icon) => icon.hasAttribute("data-ok-filled")));

for (const impl of implementations) {
  test.describe(`timeline (${impl})`, () => {
    test("alternating: content switches sides; the last event has no connector", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "timeline", "alternating"));
      const items = page.locator("[data-ok-timeline-item]");
      await expect(items).toHaveCount(3);
      const sides = await items.evaluateAll((all) =>
        all.map(
          (item) =>
            (item.querySelector("[data-ok-timeline-content]") as Element).getBoundingClientRect()
              .left >
            (item.querySelector("[data-ok-timeline-dot]") as Element).getBoundingClientRect().left,
        ),
      );
      expect(sides).toEqual([true, false, true]);
      await expect(page.locator("[data-ok-timeline-connector]")).toHaveCount(2);
    });
  });

  test.describe(`rating (${impl})`, () => {
    test("controlled: click chooses, keyboard moves, a second click clears", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "rating", "controlled"));
      const icons = page.locator("[data-ok-rating-icon]");
      if (isMobile) await icons.nth(3).tap();
      else await icons.nth(3).click();
      await page.mouse.move(0, 0);
      expect(await filled(page)).toEqual([true, true, true, true, false]);
      await page.getByRole("radio", { name: "4 Stars" }).press("ArrowLeft");
      expect(await filled(page)).toEqual([true, true, true, false, false]);
      if (!isMobile) {
        await icons.nth(2).click();
        await page.mouse.move(0, 0);
        expect(await filled(page)).toEqual([false, false, false, false, false]);
      }
    });

    test("hover feedback previews the value under the pointer", async ({ page, isMobile }) => {
      test.skip(isMobile, "Hover needs a pointer.");
      await openStory(page, storyId(impl, "rating", "hover"));
      await page.locator("[data-ok-rating-icon]").nth(8).hover();
      expect(await filled(page)).toEqual([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
      ]);
    });

    test("read only is one named image", async ({ page }) => {
      await openStory(page, storyId(impl, "rating", "read-only"));
      await expect(page.getByRole("img", { name: "2 Stars" })).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(0);
    });
  });

  test.describe(`slider (${impl})`, () => {
    test("volume: drag the thumb, arrows step, Home / End", async ({ page }) => {
      await openStory(page, storyId(impl, "slider", "volume"));
      const input = page.getByRole("slider", { name: "Volume" });
      const rail = page.locator("[data-ok-slider-rail]");
      const box = (await rail.boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();
      await expect(input).toHaveValue("70");
      await input.press("ArrowRight");
      await expect(input).toHaveValue("71");
      await input.press("Home");
      await expect(input).toHaveValue("0");
      await input.press("End");
      await expect(input).toHaveValue("100");
    });

    test("restricted values: keys move between the marks", async ({ page }) => {
      await openStory(page, storyId(impl, "slider", "restricted"));
      const input = page.getByRole("slider", { name: "Restricted values" });
      await input.press("ArrowRight");
      await expect(input).toHaveValue("37");
      await expect(input).toHaveAttribute("aria-valuetext", "37°C");
    });

    test("range: pressing the track moves the closest thumb", async ({ page }) => {
      await openStory(page, storyId(impl, "slider", "range"));
      const rail = page.locator("[data-ok-slider-rail]");
      const box = (await rail.boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
      await expect(page.getByRole("slider", { name: "Maximum price" })).toHaveValue("800");
      await expect(page.getByRole("slider", { name: "Minimum price" })).toHaveValue("200");
    });

    test("touch: a tap on the track moves the thumb", async ({ page, isMobile }) => {
      test.skip(!isMobile, "Touch only.");
      await openStory(page, storyId(impl, "slider", "volume"));
      const rail = page.locator("[data-ok-slider-rail]");
      const box = (await rail.boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      await page.touchscreen.tap(box.x + box.width * 0.9, box.y + box.height / 2);
      await expect(page.getByRole("slider", { name: "Volume" })).toHaveValue("90");
    });
  });

  test.describe(`transfer list (${impl})`, () => {
    test("simple: check, move right, move all left", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "transfer-list", "simple"));
      const left = page.getByRole("region", { name: "Choices" });
      const right = page.getByRole("region", { name: "Chosen" });
      const apples = left.getByRole("checkbox", { name: "Apples" });
      if (isMobile) await apples.tap();
      else await apples.check();
      await page.getByRole("button", { name: "Move selected right" }).click();
      await expect(right.getByText("Apples")).toBeVisible();
      await expect(right.getByRole("checkbox", { name: "Apples" })).not.toBeChecked();
      await page.getByRole("button", { name: "Move all left" }).click();
      await expect(right.getByRole("checkbox")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Move all left" })).toBeDisabled();
    });

    test("enhanced: select all shows the count, moves the side", async ({ page }) => {
      await openStory(page, storyId(impl, "transfer-list", "enhanced"));
      await page.getByRole("checkbox", { name: "Select all choices" }).check();
      await expect(page.getByText("4/4 selected")).toBeVisible();
      await page.getByRole("button", { name: "Move selected right" }).click();
      await expect(page.getByRole("region", { name: "Chosen" }).getByRole("checkbox")).toHaveCount(
        8,
      );
    });
  });

  test.describe(`tree view (${impl})`, () => {
    test("simple: click opens and selects; keys move, open and close", async ({ page }) => {
      await openStory(page, storyId(impl, "tree-view", "simple"));
      const design = page.getByRole("treeitem", { name: /^Design/ });
      await design.locator("[data-ok-tree-item-content]").first().click();
      await expect(design).toHaveAttribute("aria-expanded", "true");
      await expect(design).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("treeitem", { name: "Wireframes" })).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(design).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(design).toHaveAttribute("aria-expanded", "false");
      await page.keyboard.press("d");
      await expect(page.getByRole("treeitem", { name: /^Development/ })).toBeFocused();
    });

    test("checkbox selection selects several items", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "tree-view", "checkbox"));
      for (const name of [/^Design/, /^Development/]) {
        const box = page
          .getByRole("treeitem", { name })
          .locator("[data-ok-tree-item-checkbox] input")
          .first();
        if (isMobile) await box.tap();
        else await box.click();
      }
      await expect(page.locator('[role="treeitem"][aria-selected="true"]')).toHaveCount(2);
    });
  });

  test.describe(`autocomplete (${impl})`, () => {
    test("combo box: type, pick with the keyboard, clear", async ({ page }) => {
      await openStory(page, storyId(impl, "autocomplete", "playground"));
      const input = page.getByRole("combobox", { name: "Combo box" });
      await input.click();
      await input.pressSequentially("ap");
      await expect(input).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator("#ac-combo-listbox [role=option]:not([hidden])")).toHaveCount(3);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(input).toHaveValue("Apple");
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await input.hover();
      await page.getByRole("button", { name: "Clear" }).first().click();
      await expect(input).toHaveValue("");
    });

    test("multiple: pick adds a chip, Backspace removes it", async ({ page }) => {
      await openStory(page, storyId(impl, "autocomplete", "playground"));
      const input = page.getByRole("combobox", { name: "Multiple select" });
      // Focus shows every chip (limitTags) and moves the input: the press still opens the list.
      await input.click();
      await page.getByRole("option", { name: "Kiwi" }).click();
      await expect(page.getByRole("button", { name: "Remove Kiwi" })).toBeVisible();
      await input.press("Backspace");
      await expect(page.getByRole("button", { name: "Remove Kiwi" })).toHaveCount(0);
    });

    test("touch: a tap opens the list and picks", async ({ page, isMobile }) => {
      test.skip(!isMobile, "Touch only.");
      await openStory(page, storyId(impl, "autocomplete", "playground"));
      await page.getByRole("combobox", { name: "Combo box" }).tap();
      await page.getByRole("option", { name: "Banana" }).tap();
      await expect(page.getByRole("combobox", { name: "Combo box" })).toHaveValue("Banana");
    });

    test("grouped: headings follow the filter", async ({ page }) => {
      await openStory(page, storyId(impl, "autocomplete", "grouped"));
      const input = page.getByRole("combobox", { name: "With categories" });
      await input.click();
      await input.pressSequentially("pea");
      await expect(
        page.locator("#ac-grouped-listbox [data-ok-list-subheader]:not([hidden])"),
      ).toHaveText(["P"]);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(input).toHaveValue("Peach");
    });

    test("asynchronous: loading text, then the loaded options", async ({ page }) => {
      await openStory(page, storyId(impl, "autocomplete", "asynchronous"));
      const input = page.getByRole("combobox", { name: "Asynchronous" });
      await input.click();
      await expect(page.getByText("Loading…")).toBeVisible();
      await expect(page.getByRole("option", { name: "Inception" })).toBeVisible();
      await expect(page.getByText("Loading…")).toBeHidden();
    });

    test("single value rendering: the value is a chip, the input stays empty", async ({ page }) => {
      await openStory(page, storyId(impl, "autocomplete", "single-value"));
      const input = page.getByRole("combobox", { name: "Fruit" });
      await expect(input).toHaveValue("");
      await input.click();
      await page.getByRole("option", { name: "Kiwi" }).click();
      await expect(page.getByRole("button", { name: "Remove Kiwi" })).toBeVisible();
      await expect(input).toHaveValue("");
    });

    test("virtualization: few options drawn, End reaches the last", async ({ page }) => {
      await openStory(page, storyId(impl, "autocomplete", "virtualization"));
      const input = page.getByRole("combobox", { name: "10,000 options" });
      await input.click();
      const drawn = page.locator("#ac-virtual-listbox [role=option]");
      await expect(drawn.first()).toHaveText("Option 1");
      expect(await drawn.count()).toBeLessThan(40);
      await page.keyboard.press("End");
      await expect(page.locator("#ac-virtual-option-9999")).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(input).toHaveValue("Option 10000");
    });
  });
}
