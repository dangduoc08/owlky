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
      // Two pinned columns fill a phone's width: the columns in between wouldn't render.
      if (isMobile) await page.setViewportSize({ width: 1024, height: 900 });
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

    test("server-side aggregation: the footer shows the server's values", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "server-aggregation"));
      const footer = page.locator('[data-ok-row-id="auto-generated-group-footer-root"]');
      await expect(footer.locator('[data-ok-field="id"]')).toHaveText("1000");
      await expect(footer.locator('[data-ok-field="age"]')).toHaveText(/^\d+(\.\d+)?$/);
      await page.getByRole("textbox", { name: "Search" }).fill("Lima");
      await expect(footer.locator('[data-ok-field="id"]')).not.toHaveText("1000");
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

    test("tree data, detail panels, row moves, groups, list view", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "tree-data"));
      const member = (id: string) => page.locator(`[role="row"][data-ok-row-id="${id}"]`);
      await expect(member("m-3")).toBeHidden();
      await member("m-2").locator("[data-ok-data-grid-tree-toggle]").click();
      await expect(member("m-3")).toBeVisible();
      await expect(member("m-3")).toHaveAttribute("aria-level", "3");

      await openStory(page, storyId(impl, "datagrid", "master-detail"));
      await page.locator('[data-ok-row-id="o-1002"] [data-ok-data-grid-detail-toggle]').click();
      await expect(page.locator('[data-ok-detail-for="o-1002"]')).toContainText("2 × Crème lamp");

      await openStory(page, storyId(impl, "datagrid", "ordering"));
      const handle = page.locator('[data-ok-row-id="a-1"] [data-ok-data-grid-reorder-handle]');
      await handle.focus();
      await page.keyboard.press("Alt+ArrowDown");
      await expect(page.locator('[data-ok-data-grid-body] > [role="row"]').nth(1)).toHaveAttribute(
        "data-ok-row-id",
        "a-1",
      );
      await expect(page.locator("[data-ok-data-grid-live]")).toHaveText(
        "Row moved to position 2 of 4",
      );

      await openStory(page, storyId(impl, "datagrid", "column-groups"));
      await expect(page.locator('[data-ok-group-id="person"]')).toHaveAttribute(
        "aria-colspan",
        "3",
      );

      await openStory(page, storyId(impl, "datagrid", "list-view"));
      await expect(page.locator("[data-ok-data-grid-list-cell]").first()).toContainText(
        "Ana Silva",
      );
    });

    test("lazy loading: rows load as they scroll into view", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "lazy-loading"));
      const grid = page.locator("[data-ok-data-grid-main]");
      await expect(grid).toHaveAttribute("aria-rowcount", "10001");
      await grid.evaluate((element) => {
        element.scrollTop = 53 * 5000;
      });
      await expect(
        page.locator('[data-ok-data-grid-body] > [role="row"]:not([data-ok-loading-row])').first(),
      ).toHaveAttribute("aria-rowindex", /^4\d\d\d|^5\d\d\d/);
      expect(await page.locator('[data-ok-data-grid-body] > [role="row"]').count()).toBeLessThan(
        40,
      );
    });

    test("row grouping, aggregation and pivoting", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "row-grouping"));
      const grouping = page.locator("#grid-grouping");
      const north = grouping.locator('[data-ok-row-id="auto-generated-row-region/North"]');
      await expect(north).toContainText("North(6)");
      await north.locator("[data-ok-data-grid-tree-toggle]").click();
      await expect(north).toHaveAttribute("aria-expanded", "true");
      await expect(
        grouping.locator('[data-ok-parent="auto-generated-row-region/North"]'),
      ).toHaveCount(6);
      await expect(grouping.locator("[data-ok-data-grid-aggregation-row]")).toHaveCount(1);
      // One grouping column per field: a product group names itself in the second one.
      const multiple = page.locator("#grid-grouping-multiple");
      await multiple
        .locator(
          '[data-ok-row-id="auto-generated-row-region/North"] [data-ok-data-grid-tree-toggle]',
        )
        .click();
      await expect(
        multiple.locator(
          '[data-ok-row-id="auto-generated-row-region/North/product/Tea"] [data-ok-field="__row_group_by_columns_group_product__"]',
        ),
      ).toHaveText("Tea(2)");
      // Grouping values: two bands of units.
      await expect(
        page.locator('#grid-grouping-value [data-ok-generated][aria-level="1"]'),
      ).toHaveText([/^Under 50 units\(11\)/, /^50 units or more\(13\)/]);
      // Tree data: generated parents.
      await expect(
        page.locator('[data-ok-row-id="auto-generated-row-Images/Photos"]'),
      ).toContainText("Photos");

      await openStory(page, storyId(impl, "datagrid", "pivoting"));
      await expect(
        page.locator('#grid-pivot [data-ok-data-grid-group-row] [role="columnheader"]'),
      ).toHaveText(["2024", "2025"]);
      await page.locator('#grid-pivot [aria-controls="grid-pivot-pivot"]').click();
      const panel = page.locator("#grid-pivot-pivot");
      // Move up / Move down reorder the values (no dragging needed).
      await panel.getByRole("button", { name: "Move down: Revenue" }).click();
      await expect(
        panel
          .locator('[data-ok-data-grid-pivot-section="values"] [data-ok-data-grid-pivot-field]')
          .first(),
      ).toHaveAttribute("data-ok-field", "units");
      await expect(
        page
          .locator(
            '#grid-pivot [data-ok-data-grid-header] > [role="row"]:not([data-ok-data-grid-group-row]) > [role="columnheader"]',
          )
          .nth(1),
      ).toHaveText(/^Units/);
      // Drag the product from Not used into Rows (mouse and touch: pointer events).
      const handle = panel.locator('[data-ok-field="product"] [data-ok-data-grid-pivot-handle]');
      const region = panel.locator(
        '[data-ok-data-grid-pivot-section="rows"] [data-ok-field="region"]',
      );
      const from = (await handle.boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      const to = (await region.boundingBox()) as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      await handle.dispatchEvent("pointerdown", {
        button: 0,
        pointerId: 7,
        clientX: from.x + 2,
        clientY: from.y + 2,
      });
      await page.evaluate(
        ({ x, y }) => {
          for (const type of ["pointermove", "pointerup"])
            document.dispatchEvent(
              new PointerEvent(type, { bubbles: true, pointerId: 7, clientX: x, clientY: y }),
            );
        },
        { x: to.x + 4, y: to.y + to.height - 2 },
      );
      await expect(
        panel.locator('[data-ok-data-grid-pivot-section="rows"] [data-ok-data-grid-pivot-field]'),
      ).toHaveCount(2);
      await page.keyboard.press("Escape");
      await page.locator('#grid-pivot [aria-controls="grid-pivot-pivot"]').click();
      await panel.getByRole("switch", { name: "Pivot" }).click();
      await expect(page.getByRole("grid", { name: "Revenue by region and year" })).toBeVisible();
      // Derived columns: the year and quarter of a date.
      await expect(
        page
          .locator('#grid-pivot-derived [data-ok-data-grid-group-row] [role="columnheader"]')
          .first(),
      ).toHaveText("2024");
    });

    test("cell selection, clipboard and header filters", async ({ page, browserName, context }) => {
      await openStory(page, storyId(impl, "datagrid", "cell-selection"));
      const name = (id: string) => page.locator(`[data-ok-row-id="${id}"] [data-ok-field="name"]`);
      await name("i-1").click();
      await page.locator('[data-ok-row-id="i-2"] [data-ok-field="stock"]').click({
        modifiers: ["Shift"],
      });
      await expect(name("i-2")).toHaveAttribute("aria-selected", "true");
      await expect(page.locator('[role="gridcell"][aria-selected="true"]')).toHaveCount(6);
      if (browserName === "chromium") {
        // The browser's own copy: what the clipboard holds afterwards.
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        await page.keyboard.press("ControlOrMeta+c");
        expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
          /^Kettle\tBrewing\t5\r?\nMug\tServing\t18$/,
        );
        await name("i-4").click();
        await page.keyboard.press("ControlOrMeta+v");
        await expect(name("i-4")).toHaveText("Kettle");
      }
      const filter = page.locator("#grid-cells-header-filter-name");
      await filter.fill("teapot");
      await expect(
        page.locator('[data-ok-data-grid-body] > [role="row"]:not([hidden])'),
      ).toHaveCount(1);
      // Status bar: figures of the selected cells, also from the keyboard (Shift + arrows).
      const status = page.locator("#grid-cells-status [data-ok-data-grid-status-bar]");
      await expect(status).toHaveAttribute("role", "status");
      const units = (id: string) =>
        page.locator(`#grid-cells-status [data-ok-row-id="${id}"] [data-ok-field="units"]`);
      await units("s-01").click();
      await page.keyboard.press("Shift+ArrowDown");
      await page.keyboard.press("Shift+ArrowDown");
      await expect(status).toHaveText(/Count: 3\s*Sum: 141\s*Average: 47\s*Min: 10\s*Max: 84/);
    });

    test("charts integration follows the grid", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "charts"));
      const grid = page.locator("#grid-charts");
      const table = grid.locator("[data-ok-data-grid-chart] [data-ok-chart-data] tbody tr");
      await expect(table).toHaveCount(3);
      await expect(grid.locator("[data-ok-data-grid-chart] [data-ok-chart-svg]")).toBeVisible();
      await grid.getByRole("button", { name: "Chart" }).click();
      await page.locator("#grid-charts-chart-type").selectOption("line");
      const figure = grid.locator("[data-ok-data-grid-chart] [data-ok-chart]");
      await expect(figure).toHaveAttribute("data-ok-type", "line");
      await page.locator("#grid-charts-chart-type").selectOption("pie");
      await expect(figure.locator("[data-ok-chart-slice]")).toHaveCount(3);
      // The pivot chart stacks one series per product; the donut prints its values.
      const pivot = page.locator("#grid-charts-pivot [data-ok-data-grid-chart] [data-ok-chart]");
      await expect(pivot).toHaveAttribute("data-ok-stacked", "");
      await expect(pivot.locator("[data-ok-chart-legend-item]")).toHaveCount(3);
      const donut = page.locator("#grid-charts-donut [data-ok-data-grid-chart] [data-ok-chart]");
      await expect(donut.locator("[data-ok-chart-slice]")).toHaveCount(3);
      await expect(donut.locator("[data-ok-chart-data-label]")).toHaveCount(3);
      // Several charts: the panel's Chart select picks the chart it edits.
      await page.keyboard.press("Escape");
      const several = page.locator("#grid-charts-multiple");
      const charts = several.locator("[data-ok-data-grid-chart] [data-ok-chart]");
      await expect(charts).toHaveCount(2);
      await expect(charts.nth(1)).toHaveAttribute("data-ok-type", "line");
      await several.getByRole("button", { name: "Chart" }).click();
      await page.locator("#grid-charts-multiple-chart-active").selectOption("units");
      await page.locator("#grid-charts-multiple-chart-type").selectOption("area");
      await expect(charts.nth(1)).toHaveAttribute("data-ok-type", "area");
      await expect(charts.nth(0)).toHaveAttribute("data-ok-type", "bar");
    });

    test("sorting: comparators, a sort cycle and adding columns without Shift", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "datagrid", "sorting"));
      // Priorities by rank (the initial sort).
      expect(await visible(page, "priority")).toEqual([
        "High",
        "High",
        "Medium",
        "Medium",
        "Low",
        "Low",
      ]);
      // Points: descending first; every click adds to the sort.
      const points = page.getByRole("columnheader", { name: /^Points/ });
      await points.click();
      await expect(points).toHaveAttribute("aria-sort", "descending");
      expect(await visible(page, "points")).toEqual(["5", "3", "8", "3", "2", "1"]);
      // Due: empty dates last in both directions.
      const due = page.getByRole("columnheader", { name: /^Due/ });
      await page.getByRole("columnheader", { name: /^Priority/ }).click();
      await page.getByRole("columnheader", { name: /^Priority/ }).click();
      await points.click();
      await points.click();
      await due.click();
      expect((await visible(page, "due")).slice(-2)).toEqual(["", ""]);
      await due.click();
      expect((await visible(page, "due")).slice(-2)).toEqual(["", ""]);
      expect((await visible(page, "due"))[0]).toBe("2025-07-01");
    });

    test("custom editors: a slider edits by keyboard; a list filters the header", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "datagrid", "editors"));
      const points = page.locator(
        '[data-ok-row-id="is-1"] [role="gridcell"][data-ok-field="points"]',
      );
      await points.click();
      await page.keyboard.press("Enter");
      const slider = page.getByRole("slider", { name: "Points" });
      await expect(slider).toBeFocused();
      // Keyboard alternative to dragging: arrows move the thumb, Enter saves.
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      await expect(points).toHaveText("5");
      await expect(points).toBeFocused();
      await page.locator("#grid-editors-points-filter").selectOption("5");
      expect(await visible(page, "points")).toEqual(["5", "8", "5"]);
    });

    test("edit modes: Edit, Save and Cancel buttons drive row editing", async ({ page }) => {
      await openStory(page, storyId(impl, "datagrid", "edit-modes"));
      const hours = page.locator('[data-ok-row-id="m-2"] [data-ok-field="hours"]');
      await page.getByRole("button", { name: "Edit Bao Tran" }).click();
      const field = page.getByRole("spinbutton", { name: "Edit Hours" });
      await field.fill("38");
      await page.getByRole("button", { name: "Save Bao Tran" }).click();
      await expect(hours).toHaveText("38");
      await expect(page.getByRole("button", { name: "Edit Bao Tran" })).toBeVisible();
      await page.getByRole("button", { name: "Edit Bao Tran" }).click();
      await page.getByRole("spinbutton", { name: "Edit Hours" }).fill("10");
      await page.getByRole("button", { name: "Cancel Bao Tran" }).click();
      await expect(hours).toHaveText("38");
      await expect(page.getByRole("button", { name: "Save Bao Tran" })).toBeHidden();
    });
  });
}
