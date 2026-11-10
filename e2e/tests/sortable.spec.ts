import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["grid", "vertical", "horizontal"] as const;

const order = (page: Page) =>
  page
    .locator("[data-ok-sortable] > [data-ok-sortable-item] > span")
    .evaluateAll((spans) => spans.map((span) => span.textContent).join(","));
const handle = (page: Page, n: number) =>
  page.getByRole("button", { name: `Reorder item ${n}`, exact: true });

for (const impl of implementations) {
  test.describe(`sortable (${impl})`, () => {
    test("drags with the mouse onto another item", async ({ page, isMobile }) => {
      test.skip(isMobile, "Covered by taps on touch devices.");
      await openStory(page, storyId(impl, "sortable", "grid"));
      const from = await handle(page, 1).boundingBox();
      const to = await page.locator("[data-ok-sortable-item]").nth(2).boundingBox();
      if (!from || !to) throw new Error("no boxes");
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
      await expect(page.locator("[data-ok-dragging]").first()).toBeAttached();
      await page.mouse.up();
      await expect(page.locator("[data-ok-dragging]")).toHaveCount(0);
      expect((await order(page)).startsWith("2,3,1,4")).toBe(true);
    });

    test("reorders with the keyboard and announces it", async ({ page }) => {
      await openStory(page, storyId(impl, "sortable", "vertical"));
      await handle(page, 1).focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Space");
      expect((await order(page)).startsWith("2,3,1,4")).toBe(true);
      await expect(page.locator("[data-ok-sortable-announcer]")).toHaveText(
        /Dropped at position 3 of 12/,
      );
      await expect(handle(page, 1)).toBeFocused();
    });

    test("moves with two taps; removes and adds items", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "sortable", "horizontal"));
      const press = (locator: ReturnType<typeof handle>) =>
        isMobile ? locator.tap() : locator.click();
      await press(handle(page, 3));
      await press(handle(page, 1));
      expect((await order(page)).startsWith("3,1,2,4")).toBe(true);
      const remove = page.getByRole("button", { name: "Remove item 2", exact: true });
      if (!isMobile) await page.locator("[data-ok-sortable-item]").nth(2).hover();
      await press(remove);
      await expect(remove).toHaveCount(0);
      await press(page.getByRole("button", { name: "Add item" }));
      await expect(page.locator("[data-ok-sortable-item]")).toHaveCount(12);
      expect((await order(page)).endsWith(",13")).toBe(true);
      await expect(handle(page, 13)).toBeAttached();
    });
  });
}

for (const impl of implementations) {
  test.describe(`sortable disabled items, events, auto scroll (${impl})`, () => {
    test("a pinned item keeps its place; drag events update the status", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "sortable", "disabled-items"));
      const status = page.locator("#sortable-disabled-status");
      await expect(page.getByRole("button", { name: "Reorder Overview" })).toBeDisabled();
      const sales = page.getByRole("button", { name: "Reorder Sales", exact: true });
      if (isMobile) await sales.tap();
      else {
        await sales.focus();
        await page.keyboard.press("Space");
      }
      await expect(status).toHaveText("Moving Sales.");
      await sales.focus();
      await page.keyboard.press("ArrowUp"); // the pinned item can't be passed
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Space");
      await expect(status).toHaveText("Sales is now at position 3.");
      const titles = await page
        .locator("#sortable-disabled > li > span")
        .evaluateAll((spans) => spans.map((span) => span.textContent));
      expect(titles.slice(0, 3)).toEqual(["Overview (pinned)", "Orders", "Sales"]);
      await sales.focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("Escape");
      await expect(status).toHaveText("Sales went back.");
    });

    test("dragging near the Scrollbar's edge scrolls it", async ({ page, isMobile }) => {
      test.skip(isMobile, "Mouse drags only; touch drags use the same code path.");
      await openStory(page, storyId(impl, "sortable", "vertical"));
      const scrollbar = page.locator("[data-ok-scrollbar]:has(> [data-ok-sortable])");
      const frame = await scrollbar.boundingBox();
      const from = await handle(page, 1).boundingBox();
      if (!frame || !from) throw new Error("no boxes");
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(from.x + from.width / 2, frame.y + frame.height - 4, { steps: 12 });
      await expect
        .poll(() => scrollbar.evaluate((element) => element.scrollTop), { timeout: 5000 })
        .toBeGreaterThan(100);
      await page.mouse.up();
      expect((await order(page)).startsWith("1,")).toBe(false);
    });
  });
}

/** Task titles of a Kanban column, in order. */
const column = (page: Page, label: string) =>
  page
    .getByRole("list", { name: label, exact: true })
    .locator(":scope > [data-ok-sortable-item] .sb-kanban-card > span")
    .evaluateAll((spans) => spans.map((span) => span.textContent).join(","));
const taskHandle = (page: Page, title: string) =>
  page.getByRole("button", { name: `Reorder ${title}`, exact: true });

for (const impl of implementations) {
  test.describe(`sortable kanban (${impl})`, () => {
    test("drags a task into the empty column with the mouse", async ({ page, isMobile }) => {
      test.skip(isMobile, "Covered by the Move menu on touch devices.");
      await openStory(page, storyId(impl, "sortable", "kanban"));
      const done = page.getByRole("list", { name: "Done", exact: true });
      await done.scrollIntoViewIfNeeded();
      const from = await taskHandle(page, "Write the brief").boundingBox();
      const to = await done.boundingBox();
      if (!from || !to) throw new Error("no boxes");
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 16 });
      await expect(done).toHaveAttribute("data-ok-dragging", "");
      await page.mouse.up();
      await expect(page.locator("[data-ok-dragging]")).toHaveCount(0);
      expect(await column(page, "Done")).toBe("Write the brief");
      expect(await column(page, "To do")).toBe("Book the venue,Send invitations");
    });

    test("moves a task to the next column with the keyboard and announces it", async ({ page }) => {
      await openStory(page, storyId(impl, "sortable", "kanban"));
      await taskHandle(page, "Book the venue").focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("ArrowRight");
      await expect(page.locator("[data-ok-sortable-announcer]")).toHaveText(
        "Moved to In progress, position 2 of 3.",
      );
      await expect(taskHandle(page, "Book the venue")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Space");
      expect(await column(page, "In progress")).toBe(
        "Design the poster,Plan the budget,Book the venue",
      );
      await expect(taskHandle(page, "Book the venue")).toHaveAttribute("aria-pressed", "false");
    });

    test("the Move menu moves a task in one tap per step", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "sortable", "kanban"));
      const press = (locator: ReturnType<typeof taskHandle>) =>
        isMobile ? locator.tap() : locator.click();
      await press(page.getByRole("button", { name: "Move Pick the menu", exact: true }));
      await press(page.getByRole("menuitem", { name: "Move to Done" }).first());
      await expect(
        page
          .getByRole("list", { name: "Done", exact: true })
          .locator(":scope > [data-ok-sortable-item] .sb-kanban-card > span"),
      ).toHaveText(["Pick the menu"]);
      expect(await column(page, "In review")).toBe("");
      await expect(page.locator("[data-ok-sortable-announcer]")).toHaveText(
        "Moved to Done, position 1 of 1.",
      );
    });
  });
}

test.describe("sortable swap strategy and whole-item drags (docs preview)", () => {
  const open = async (page: Page) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      "/apps/storybook/storybook-static/iframe.html?id=components-sortable--docs&viewMode=docs&globals=a11y.manual:!true",
    );
    const list = page.getByRole("list", { name: "Dashboard slots" }).first();
    await list.waitFor();
    // The preview sits far down the docs page: mouse moves need it in the middle of the viewport
    // (near an edge, the drag would scroll the page under the pointer).
    // The docs page renders its other previews and code blocks after a while, which grows the
    // page above the list: wait until its height holds still for half a second.
    await page.waitForFunction(
      () => {
        const w = window as unknown as { __height?: number; __since?: number };
        const height = document.documentElement.scrollHeight;
        if (w.__height !== height) {
          w.__height = height;
          w.__since = performance.now();
        }
        return performance.now() - (w.__since ?? 0) > 500;
      },
      undefined,
      { polling: 100, timeout: 15_000 },
    );
    await list.evaluate((element) => element.scrollIntoView({ block: "center" }));
    return list;
  };
  const slots = (list: ReturnType<Page["locator"]>) =>
    list
      .locator(":scope > [data-ok-sortable-item] > span")
      .evaluateAll((spans) => spans.map((span) => span.textContent).join(","));

  test("drags an item by its content onto another: the two trade places", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Mouse drags; taps are covered by the keyboard and tap tests.");
    const list = await open(page);
    const from = await list.locator("[data-ok-sortable-item] > span").first().boundingBox();
    const to = await list.locator("[data-ok-sortable-item]").nth(3).boundingBox();
    if (!from || !to) throw new Error("no boxes");
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
    await expect(list.locator("[data-ok-swap-target]")).toHaveCount(1);
    await page.mouse.up();
    await expect(list.locator("[data-ok-swap-target]")).toHaveCount(0);
    await expect.poll(() => slots(list)).toBe("Revenue,Orders,Visitors,Sales");
  });

  test("swaps with the keyboard and two taps", async ({ page, isMobile }) => {
    const list = await open(page);
    const handle = (name: string) => list.getByRole("button", { name: `Reorder ${name}` });
    await handle("Sales").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await expect.poll(() => slots(list)).toBe("Visitors,Orders,Sales,Revenue");
    await expect(handle("Sales")).toBeFocused();
    const press = (locator: ReturnType<typeof handle>) =>
      isMobile ? locator.tap() : locator.click();
    await press(handle("Orders"));
    await press(handle("Revenue"));
    await expect.poll(() => slots(list)).toBe("Visitors,Revenue,Sales,Orders");
  });
});

for (const viewport of viewports) {
  test.describe(`sortable responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const story of STORIES) {
      test(`${story}: no overflow, items fit, targets ≥ 24px, React matches HTML`, async ({
        browser,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.touch,
          isMobile: viewport.touch,
        });
        const results: Record<string, unknown> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "sortable", story));
          await page.evaluate(() => document.fonts.ready);
          const m = await page.evaluate(() => {
            const list = document.querySelector("[data-ok-sortable]") as HTMLElement;
            const box = list.getBoundingClientRect();
            const items = [...list.querySelectorAll<HTMLElement>("[data-ok-sortable-item]")].map(
              (item) => {
                const r = item.getBoundingClientRect();
                return [Math.round(r.width), Math.round(r.height)];
              },
            );
            const targets = [...list.querySelectorAll("button")].map((b) => {
              const r = b.getBoundingClientRect();
              return Math.min(r.width, r.height);
            });
            return {
              overflow: document.documentElement.scrollWidth > window.innerWidth,
              list: [Math.round(box.width), Math.round(box.height)],
              listInside: box.left >= 0 && box.right <= window.innerWidth + 0.5,
              items,
              smallestTarget: Math.min(...targets),
            };
          });
          expect(m.overflow, `${impl} page overflow`).toBe(false);
          expect(m.listInside, `${impl} list in viewport`).toBe(true);
          expect(m.smallestTarget).toBeGreaterThanOrEqual(24);
          results[impl] = m;
          if (viewport.touch) {
            await handle(page, 2).tap();
            await expect(handle(page, 2)).toHaveAttribute("aria-pressed", "true");
          }
          await page.close();
        }
        expect(results["react"]).toEqual(results["html"]);
        await context.close();
      });
    }
  });
}
