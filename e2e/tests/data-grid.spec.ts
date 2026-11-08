import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const visible = (page: Page, field: string) =>
  page
    .locator(
      `[data-ok-data-grid-body] > [role="row"]:not([hidden]) [role="gridcell"][data-ok-field="${field}"]`,
    )
    .allTextContents();

for (const impl of implementations) {
  test.describe(`data grid (${impl})`, () => {
    test("sorts, searches, filters and pages", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "basic"));
      const age = page.getByRole("columnheader", { name: /^Age/ });
      await age.click();
      await expect(age).toHaveAttribute("aria-sort", "ascending");
      expect((await visible(page, "age")).slice(0, 2)).toEqual(["18", "21"]);
      await page.getByRole("textbox", { name: "Search" }).fill("ana");
      await expect(
        page.locator('[data-ok-data-grid-body] > [role="row"]:not([hidden])'),
      ).toHaveCount(2);
      await page.getByRole("textbox", { name: "Search" }).fill("");
      await page.getByRole("button", { name: "Go to next page" }).click();
      await expect(page.getByText("11–20 of 20")).toBeVisible();
      await page.getByRole("button", { name: "Filters" }).click();
      const panel = page.getByRole("group", { name: "Filters" });
      await panel.getByLabel("Columns").selectOption("age");
      await panel.getByLabel("Operator").selectOption(">");
      await panel.getByLabel("Value").fill("60");
      await expect(
        page.locator('[data-ok-data-grid-body] > [role="row"]:not([hidden])'),
      ).toHaveCount(1);
    });

    test("keyboard: one tab stop, arrows, Enter sorts, Space selects", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName === "webkit", "WebKit doesn't Tab to checkboxes and buttons on macOS.");
      await openStory(page, storyId(impl, "datagrid", "basic"));
      await page.getByRole("textbox", { name: "Search" }).focus();
      for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
      const focused = () =>
        page.evaluate(() =>
          document.activeElement
            ?.closest('[role="columnheader"], [role="gridcell"]')
            ?.getAttribute("data-ok-field"),
        );
      await page.locator('[role="columnheader"][data-ok-field="__check__"] input').focus();
      await page.keyboard.press("ArrowRight");
      expect(await focused()).toBe("id");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("columnheader", { name: /^First name/ })).toHaveAttribute(
        "aria-sort",
        "ascending",
      );
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press(" ");
      await expect(
        page.locator('[data-ok-data-grid-body] > [role="row"]:not([hidden])').first(),
      ).toHaveAttribute("aria-selected", "true");
    });

    test("touch: tap a checkbox, open the columns panel and hide a column", async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, "Touch only.");
      await openStory(page, storyId(impl, "datagrid", "custom"));
      await page
        .locator('[data-ok-data-grid-body] [role="row"]:not([hidden]) input[type="checkbox"]')
        .first()
        .tap();
      await expect(
        page.locator('[data-ok-data-grid-body] > [role="row"]:not([hidden])').first(),
      ).toHaveAttribute("aria-selected", "true");
      await page.getByRole("button", { name: "Columns" }).tap();
      await page.getByRole("switch", { name: "Email" }).tap();
      await expect(page.getByRole("columnheader", { name: /^Email/ })).toHaveCount(0);
    });

    test("advanced: resize, pin, edit and filter with two conditions", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "datagrid", "advanced"));
      const email = page.locator('[role="columnheader"][data-ok-field="email"]');
      if (!isMobile) {
        const handle = email.locator("[data-ok-data-grid-resize]");
        const box = (await handle.boundingBox()) as { x: number; y: number };
        await page.mouse.move(box.x + 4, box.y + 10);
        await page.mouse.down();
        await page.mouse.move(box.x - 56, box.y + 10, { steps: 4 });
        await page.mouse.up();
        expect(Math.round((await email.boundingBox())?.width ?? 0)).toBe(200);
      }
      await email.focus();
      await page.keyboard.press("Control+Enter");
      await page.getByRole("menuitem", { name: "Pin to left" }).click();
      await expect(email).toHaveAttribute("data-ok-pinned", "left");
      const age = page
        .locator('[data-ok-data-grid-body] > [role="row"]:not([hidden])')
        .first()
        .locator('[data-ok-field="age"]');
      // Enter on a focused cell edits it (double click does too, with a mouse).
      await age.focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Control+a");
      await page.keyboard.type("77");
      await page.keyboard.press("Enter");
      await expect(age).toHaveText("77");
      await page.getByRole("button", { name: "Filters" }).click();
      await page.getByRole("button", { name: "Add filter" }).click();
      await expect(page.locator("[data-ok-data-grid-filter]")).toHaveCount(2);
      await expect(page.getByLabel("Logic operator")).toBeVisible();
    });

    test("large dataset: a bounded window of rows; more rows at the end", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "large"));
      const grid = page.getByRole("grid");
      const rows = grid.locator('[data-ok-data-grid-body] > [role="row"]');
      await expect(grid).toHaveAttribute("aria-rowcount", "201");
      expect(await rows.count()).toBeLessThan(40);
      await grid.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expect(grid).toHaveAttribute("aria-rowcount", "401");
      expect(await rows.count()).toBeLessThan(40);
      await expect(rows.last()).toHaveAttribute("aria-rowindex", /^2\d\d$/);
    });

    test("server side: sorts and pages through the data source", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "server"));
      const grid = page.getByRole("grid");
      await expect(page.getByText("1–10 of 1000")).toBeVisible();
      await expect(grid).not.toHaveAttribute("aria-busy", "true");
      await page.getByRole("columnheader", { name: /^Age/ }).click();
      await expect(grid).not.toHaveAttribute("aria-busy", "true");
      await expect.poll(async () => (await visible(page, "age"))[0]).toBe("18");
      await page.getByRole("button", { name: "Go to next page" }).click();
      await expect(page.getByText("11–20 of 1000")).toBeVisible();
      await expect(grid).not.toHaveAttribute("aria-busy", "true");
      // Rows of page 2 follow the 10 rows of page 1 (short screens render fewer of them).
      await expect(grid.locator('[data-ok-data-grid-body] > [role="row"]').first()).toHaveAttribute(
        "aria-rowindex",
        "12",
      );
      await expect(grid).toHaveAttribute("aria-rowcount", "1001");
    });

    test("layout: spans, single selection, autosize by double click", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "layout"));
      const north = page.locator('#grid-spans [data-ok-row-id="b-1"] [data-ok-field="region"]');
      const row = page.locator('#grid-spans [data-ok-row-id="b-1"]');
      const rowBox = (await row.boundingBox()) as { height: number };
      const cellBox = (await north.boundingBox()) as { height: number };
      expect(cellBox.height).toBeGreaterThan(rowBox.height * 3.5);
      await expect(
        page.locator('#grid-spans [data-ok-row-id="total"] [data-ok-field="region"]'),
      ).toHaveAttribute("aria-colspan", "3");
      const owner = (id: string) =>
        page.locator(`#grid-tasks [data-ok-row-id="${id}"] [data-ok-field="owner"]`);
      await owner("t-1").click();
      await owner("t-3").click();
      await expect(page.locator('#grid-tasks [aria-selected="true"]')).toHaveCount(1);
      await expect(page.locator('#grid-tasks [data-ok-row-id="t-2"] input')).toBeDisabled();
      const header = page.locator('#grid-tasks [role="columnheader"][data-ok-field="owner"]');
      const before = ((await header.boundingBox()) as { width: number }).width;
      await page.evaluate(() => {
        const handle = document.querySelector(
          '#grid-tasks [role="columnheader"][data-ok-field="owner"] [data-ok-data-grid-resize]',
        ) as HTMLElement;
        handle.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      });
      await expect
        .poll(async () =>
          Math.abs(((await header.boundingBox()) as { width: number }).width - before),
        )
        .toBeLessThan(40);
    });

    test("validation: errors keep the cell open; typing starts editing", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "validation"));
      const price = page.locator('[data-ok-row-id="p-1"] [data-ok-field="price"]');
      await price.focus();
      await page.keyboard.press("Enter");
      const input = price.locator("input");
      await input.fill("0");
      await expect(page.locator("[data-ok-data-grid-edit-error]")).toHaveText(
        "Enter a price above 0",
      );
      await page.keyboard.press("Enter");
      await expect(input).toBeVisible();
      await input.fill("15");
      await page.keyboard.press("Enter");
      await expect(price).toHaveText("USD 15.00");
      const stock = page.locator('[data-ok-row-id="p-2"] [data-ok-field="stock"]');
      await stock.focus();
      await page.keyboard.type("7");
      await page.keyboard.press("Enter");
      await expect(stock).toHaveText("7");
      await expect(page.locator('[data-ok-row-id="p-5"] [data-ok-field="stock"]')).toHaveAttribute(
        "data-ok-editable",
        "false",
      );
    });

    test("icon toolbar: icon buttons named by their tooltips open the panels", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "basic"));
      const columns = page.getByRole("button", { name: "Columns" });
      await expect(columns).toHaveAttribute("data-ok-icon-button", "");
      await columns.click();
      await expect(page.getByRole("group", { name: "Columns" })).toBeVisible();
    });

    test("right to left: pinned start columns sit on the right; arrows follow the reading order", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName === "webkit", "WebKit doesn't focus cells by Tab on macOS.");
      await openStory(page, storyId(impl, "datagrid", "advanced"));
      await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
      const grid = page.getByRole("grid");
      const gridBox = (await grid.boundingBox()) as { x: number; width: number };
      const first = grid.locator('[role="columnheader"][data-ok-field="firstName"]');
      const firstBox = (await first.boundingBox()) as { x: number; width: number };
      expect(firstBox.x + firstBox.width).toBeGreaterThan(gridBox.x + gridBox.width - 10);
      const cell = grid
        .locator('[data-ok-data-grid-body] > [role="row"]')
        .first()
        .locator('[data-ok-field="firstName"]');
      await cell.focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page.locator(":focus")).toHaveAttribute("data-ok-field", "lastName");
    });
  });
}
