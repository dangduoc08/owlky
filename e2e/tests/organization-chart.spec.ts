import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/**
 * For every visible children list, how far its line from the parent and its children's lines to
 * their labels are from those labels' centers, across the bar's axis (x for top and bottom
 * charts, y for left and right ones, ADR-0052). The smallest distance per line counts.
 */
function connectorGaps(page: Page) {
  return page.evaluate(() => {
    const gaps: number[] = [];
    for (const list of document.querySelectorAll<HTMLElement>(
      "[data-ok-organization-chart-children]",
    )) {
      // Collapsed children (and lists inside them) draw no lines.
      if (list.getClientRects().length === 0) continue;
      const root = list.closest("[data-ok-organization-chart]") as Element;
      const direction = root.getAttribute("data-ok-direction");
      const vertical = direction !== "left" && direction !== "right";
      const center = (label: Element, across = vertical) => {
        const box = (label.firstElementChild ?? label).getBoundingClientRect();
        return across ? box.left + box.width / 2 : box.top + box.height / 2;
      };
      const lines = (element: Element, which: string, across = vertical) => {
        const style = getComputedStyle(element, which);
        if (style.content === "none") return [];
        const host = element.getBoundingClientRect();
        const start = across
          ? host.left + Number.parseFloat(style.left)
          : host.top + Number.parseFloat(style.top);
        const size = Number.parseFloat(across ? style.width : style.height);
        const sides: [number, number][] = across
          ? [
              [Number.parseFloat(style.borderLeftWidth), start],
              [-Number.parseFloat(style.borderRightWidth), start + size],
            ]
          : [
              [Number.parseFloat(style.borderTopWidth), start],
              [-Number.parseFloat(style.borderBottomWidth), start + size],
            ];
        return sides.filter(([width]) => width !== 0).map(([width, edge]) => edge + width / 2);
      };
      const gap = (values: number[], target: number) =>
        Math.min(Number.POSITIVE_INFINITY, ...values.map((value) => Math.abs(value - target)));
      const labelOf = (node: Element) =>
        node.querySelector(":scope > [data-ok-organization-chart-label]") as Element;
      gaps.push(gap(lines(list, "::before"), center(labelOf(list.parentElement as Element))));
      // Grouped leaves (a grid parent): each stub meets its label's center on the other axis.
      const parent = list.parentElement as Element;
      const across = getComputedStyle(parent).display === "grid" ? !vertical : vertical;
      for (const child of list.children)
        gaps.push(
          gap(
            [...lines(child, "::before", across), ...lines(child, "::after", across)],
            center(labelOf(child), across),
          ),
        );
    }
    return gaps;
  });
}

/** A node's toggle button, by its `data-ok-node-id`. */
const toggleOf = (page: Page, id: string) =>
  page.locator(`[data-ok-node-id="${id}"] > [data-ok-organization-chart-toggle]`);

for (const impl of implementations) {
  test.describe(`organization chart (${impl})`, () => {
    test("every line down starts at its label's center", async ({ page }) => {
      for (const story of [
        "simple",
        "standard",
        "group",
        "lines",
        "direction",
        "grouped-leaves",
        "collapsible",
        "search",
        "lazy-children",
        "zoom-pan",
        "selection",
        "keyboard-breadcrumb",
      ]) {
        await openStory(page, storyId(impl, "organization-chart", story));
        const gaps = await connectorGaps(page);
        expect(gaps.length).toBeGreaterThan(0);
        for (const gap of gaps) expect(gap, story).toBeLessThan(1.5);
      }
    });

    test("a card's menu opens from its button, by pointer and keyboard", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "organization-chart", "standard"));
      const button = page.getByRole("button", { name: "Actions for Priya Raman" });
      await button.scrollIntoViewIfNeeded();
      if (isMobile) await button.tap();
      else await button.click();
      const menu = page.getByRole("menu", { name: "Actions for Priya Raman" });
      await expect(menu).toBeVisible();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(menu.getByRole("menuitem")).toHaveText(["Delete", "Edit"]);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(button).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("menuitem").first()).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(menu.getByRole("menuitem").nth(1)).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(menu).toBeHidden();
    });

    test("wide charts scroll inside their area, from the first node", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await openStory(page, storyId(impl, "organization-chart", "group"));
      const area = page.getByRole("region", { name: "Organization chart by team, scrollable" });
      const sizes = await area.evaluate((el) => ({
        scroll: el.scrollWidth,
        client: el.clientWidth,
        page: document.documentElement.scrollWidth,
      }));
      expect(sizes.scroll).toBeGreaterThan(sizes.client);
      expect(sizes.page).toBeLessThanOrEqual(375);
      // The first team is reachable at the start (not cut off by centering).
      const first = await page
        .getByText("Product design", { exact: true })
        .evaluate((el) => el.getBoundingClientRect().left);
      const start = await area.evaluate((el) => el.getBoundingClientRect().left);
      expect(first).toBeGreaterThanOrEqual(start);
      // The keyboard scrolls the focused area.
      await area.focus();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => area.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    });

    test("the disabled root action can't be pressed", async ({ page }) => {
      await openStory(page, storyId(impl, "organization-chart", "group"));
      await expect(page.getByRole("button", { name: "Actions for Maya Lindqvist" })).toBeDisabled();
    });

    test("toggles collapse and expand branches by pointer, label and keyboard", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "organization-chart", "collapsible"));
      // Elias starts collapsed: his toggle names the three people it hides.
      await expect(page.getByRole("button", { name: "Elias Novak's reports 3" })).toBeVisible();
      // The name changes with the count: follow the toggles by node from here.
      const elias = toggleOf(page, "elias");
      await expect(elias).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByText("Sofia Marchetti", { exact: true })).toBeHidden();
      await elias.scrollIntoViewIfNeeded();
      if (isMobile) await elias.tap();
      else await elias.click();
      await expect(elias).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByText("Sofia Marchetti", { exact: true })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Elias Novak's reports", exact: true }),
      ).toHaveCount(1);
      // A click on a card toggles it too.
      await page.getByText("Jonah Pereira", { exact: true }).click();
      await expect(page.getByText("Aiko Tanaka", { exact: true })).toBeHidden();
      await expect(page.getByRole("button", { name: "Jonah Pereira's reports 1" })).toBeVisible();
      const jonah = toggleOf(page, "jonah");
      await expect(jonah).toHaveAttribute("aria-expanded", "false");
      // Keyboard: the toggle is a button.
      await jonah.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByText("Aiko Tanaka", { exact: true })).toBeVisible();
      await page.keyboard.press("Space");
      await expect(page.getByText("Aiko Tanaka", { exact: true })).toBeHidden();
      await expect(jonah).toBeFocused();
      // The methods: collapse all, then the leads only.
      await page.getByRole("button", { name: "Collapse all" }).click();
      await expect(page.getByText("Priya Raman", { exact: true })).toBeHidden();
      await expect(page.getByRole("button", { name: "Maya Lindqvist's reports 10" })).toBeVisible();
      await page.getByRole("button", { name: "Show the leads only" }).click();
      await expect(page.getByText("Priya Raman", { exact: true })).toBeVisible();
      await expect(page.getByText("Elias Novak", { exact: true })).toBeHidden();
      await page.getByRole("button", { name: "Expand all" }).click();
      await expect(page.getByText("Tomás Rivera", { exact: true })).toBeVisible();
      const gaps = await connectorGaps(page);
      for (const gap of gaps) expect(gap).toBeLessThan(1.5);
    });

    test("every direction lays the tree out from its side, in tree order", async ({ page }) => {
      await openStory(page, storyId(impl, "organization-chart", "direction"));
      const boxes = await page.evaluate(() =>
        [...document.querySelectorAll("[data-ok-organization-chart]")].map((chart) => {
          const box = (text: string) => {
            const label = [...chart.querySelectorAll("[data-ok-organization-chart-label]")].find(
              (element) => element.textContent?.includes(text),
            ) as Element;
            const rect = label.getBoundingClientRect();
            return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
          };
          return {
            name: chart.getAttribute("aria-label"),
            lead: box("Team lead"),
            engineer: box("Engineer"),
            designer: box("Designer"),
            writer: box("Writer"),
          };
        }),
      );
      const by = (name: string) => boxes.find((entry) => entry.name === name) as (typeof boxes)[0];
      const up = by("Chart growing upward");
      expect(up.engineer.bottom).toBeLessThan(up.lead.top);
      expect(up.designer.left).toBeLessThan(up.writer.left);
      const right = by("Chart growing to the right");
      expect(right.engineer.left).toBeGreaterThan(right.lead.right);
      expect(right.designer.top).toBeLessThan(right.writer.top);
      const left = by("Chart growing to the left");
      expect(left.engineer.right).toBeLessThan(left.lead.left);
      // Right to left mirrors the inline axis: "left" grows toward the left.
      const rtl = by("Right-to-left chart");
      expect(rtl.engineer.right).toBeLessThan(rtl.lead.left);
      // Reading order stays the tree order.
      const chart = page.getByRole("list", { name: "Chart growing upward" });
      await expect(chart.getByRole("listitem").first()).toContainText("Team lead");
    });

    test("a node's line options style its lines, or its branch's in node mode", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "organization-chart", "lines"));
      const lines = await page.evaluate(() => {
        const color = (root: Element, value: string) => {
          const probe = document.createElement("span");
          probe.style.color = value;
          root.append(probe);
          const result = getComputedStyle(probe).color;
          probe.remove();
          return result;
        };
        /** The line down from the node whose label holds `text` (its children list's `::before`). */
        const stem = (root: Element, text: string) => {
          const label = [...root.querySelectorAll("[data-ok-organization-chart-label]")].find(
            (element) => element.textContent?.trim().startsWith(text),
          ) as Element;
          const list = (label.parentElement as Element).querySelector(
            ":scope > [data-ok-organization-chart-children]",
          ) as Element;
          const style = getComputedStyle(list, "::before");
          return `${style.borderLeftColor} ${style.borderLeftStyle}`;
        };
        const perNode = document.querySelector('[aria-label="Lines per node"]') as Element;
        const branch = document.querySelector('[aria-label="Lines by branch"]') as Element;
        const error = color(perNode, "var(--ok-palette-error-light)");
        const info = color(branch, "var(--ok-palette-info-light)");
        return {
          engineer: stem(perNode, "Engineer") === `${error} dashed`,
          lead: stem(perNode, "Team lead") === `${color(perNode, "var(--ok-divider)")} solid`,
          // Priya's branch: her own line, and two levels below her.
          priya: stem(branch, "Priya Raman") === `${info} dashed`,
          sofia: stem(branch, "Sofia Marchetti") === `${info} dashed`,
        };
      });
      expect(lines).toEqual({ engineer: true, lead: true, priya: true, sofia: true });
    });

    test("grouped leaves stack in one column per lead and open as one", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "organization-chart", "grouped-leaves"));
      const column = (chart: string, names: string[]) =>
        Promise.all(
          names.map((name) =>
            page
              .getByRole("list", { name: chart, exact: true })
              .getByText(name, { exact: true })
              .evaluate((element) => {
                const box = element.getBoundingClientRect();
                return { left: box.left, top: box.top, bottom: box.bottom };
              }),
          ),
        );
      const [aiko, oskar, zara] = await column("Grouped leaves", [
        "Aiko Tanaka",
        "Oskar Berg",
        "Zara Okafor",
      ]);
      expect(oskar?.top).toBeGreaterThan(aiko?.bottom ?? 0);
      expect(zara?.top).toBeGreaterThan(oskar?.bottom ?? 0);
      // Left charts: a row after the lead.
      const [left1, left2] = await column("Grouped leaves, growing to the right", [
        "Aiko Tanaka",
        "Oskar Berg",
      ]);
      expect(Math.abs((left1?.top ?? 0) - (left2?.top ?? 0))).toBeLessThan(1);
      expect(left2?.left).toBeGreaterThan(left1?.left ?? 0);
      // Collapsible: Priya's group starts collapsed and opens as a column.
      const chart = page.getByRole("list", { name: "Collapsible grouped leaves" });
      const priya = chart.locator(
        '[data-ok-node-id="priya"] > [data-ok-organization-chart-toggle]',
      );
      await expect(priya).toHaveAccessibleName("Priya Raman's reports 4");
      await priya.scrollIntoViewIfNeeded();
      if (isMobile) await priya.tap();
      else await priya.click();
      await expect(chart.getByText("Noah Brennan", { exact: true })).toBeVisible();
      const [elias, noah] = await column("Collapsible grouped leaves", [
        "Elias Novak",
        "Noah Brennan",
      ]);
      expect(noah?.top).toBeGreaterThan(elias?.bottom ?? 0);
      const gaps = await connectorGaps(page);
      for (const gap of gaps) expect(gap).toBeLessThan(1.5);
    });

    test("zoom: the toolbar, keys and Ctrl + wheel; fit, center, pan; focus stays in view", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "organization-chart", "zoom-pan"));
      const chart = page.getByRole("list", { name: "Zoomable organization chart" });
      const area = page.getByRole("region", { name: "Zoomable chart, scrollable" });
      const toolbar = page.getByRole("group", { name: "Zoom" });
      const level = toolbar.getByRole("status");
      await expect(level).toHaveText("100%");
      const press = async (name: string) => {
        const button = toolbar.getByRole("button", { name });
        if (isMobile) await button.tap();
        else await button.click();
      };
      await press("Zoom in");
      await expect(level).toHaveText("125%");
      await expect(chart).toHaveAttribute("data-ok-zoom", "1.25");
      expect(await chart.evaluate((element) => getComputedStyle(element).zoom)).toBe("1.25");
      await press("Fit to screen");
      const fitted = Number.parseFloat((await level.textContent()) ?? "");
      expect(fitted).toBeLessThan(100);
      const fits = await area.evaluate((element) => {
        const root = element.querySelector("[data-ok-organization-chart] > li") as Element;
        const box = root.getBoundingClientRect();
        return box.width <= element.clientWidth + 1 && box.height <= element.clientHeight + 1;
      });
      expect(fits).toBe(true);
      await press("Reset zoom");
      await expect(level).toHaveText("100%");
      // Keys on the focused scroll area.
      await area.focus();
      await page.keyboard.press("+");
      await expect(level).toHaveText("125%");
      await page.keyboard.press("-");
      await expect(level).toHaveText("100%");
      await page.keyboard.press("+");
      await page.keyboard.press("+");
      await page.keyboard.press("+");
      await expect(level).toHaveText("195%");
      // The zoomed chart scrolls inside its area, never the page.
      expect(await area.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
        true,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      // Under zoom, Tab brings each focused toggle into view.
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("Tab");
        const focused = page.locator(":focus");
        if ((await focused.getAttribute("data-ok-organization-chart-toggle")) === null) break;
        await expect(focused).toBeInViewport();
      }
      await page.keyboard.press("0");
      // A plain wheel scrolls; Ctrl + wheel zooms the chart, not the page.
      if (!isMobile) {
        const box = (await area.boundingBox()) as { x: number; y: number };
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.keyboard.down("Control");
        await page.mouse.wheel(0, -200);
        await page.keyboard.up("Control");
        await expect
          .poll(async () => Number.parseFloat((await level.textContent()) ?? ""))
          .toBeGreaterThan(100);
        // A mouse drag on a card pans the area.
        await press("Zoom in");
        // Vertically: the 400px area always overflows (a wide screen may fit the width).
        const card = chart.getByText("Priya Raman", { exact: true });
        await card.scrollIntoViewIfNeeded();
        const before = await area.evaluate((element) => element.scrollTop);
        // Drag toward the side the area can still scroll to.
        const room = await area.evaluate(
          (element) => element.scrollHeight - element.clientHeight - element.scrollTop,
        );
        const start = (await card.boundingBox()) as { x: number; y: number };
        await page.mouse.move(start.x + 5, start.y + 5);
        await page.mouse.down();
        await page.mouse.move(start.x + 5, start.y + (room > 0 ? -60 : 60), { steps: 5 });
        await page.mouse.up();
        const after = await area.evaluate((element) => element.scrollTop);
        if (room > 0) expect(after).toBeGreaterThan(before);
        else expect(after).toBeLessThan(before);
        await expect(chart).not.toHaveAttribute("data-ok-panning");
      }
      // Center on a person in a collapsed branch: it opens and the person comes into view.
      await page.getByRole("button", { name: "Center on Tomás Rivera" }).click();
      const tomas = chart.getByText("Tomás Rivera", { exact: true });
      await expect(tomas).toBeVisible();
      await expect(tomas).toBeInViewport();
    });

    test("a collapsible left-to-right chart toggles toward its children", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "organization-chart", "direction"));
      const chart = page.getByRole("list", { name: "Collapsible chart growing to the right" });
      const engineer = chart.locator('[data-ok-node-id="b"] > [data-ok-organization-chart-toggle]');
      await expect(engineer).toHaveAccessibleName("Engineer's reports 1");
      await expect(engineer).toHaveAttribute("aria-expanded", "false");
      await engineer.scrollIntoViewIfNeeded();
      if (isMobile) await engineer.tap();
      else await engineer.click();
      const intern = chart.getByText("Intern", { exact: true });
      await expect(intern).toBeVisible();
      const [toggleBox, internBox] = [await engineer.boundingBox(), await intern.boundingBox()];
      expect(internBox?.x).toBeGreaterThan((toggleBox?.x ?? 0) + (toggleBox?.width ?? 0));
      await engineer.focus();
      await page.keyboard.press("Enter");
      await expect(intern).toBeHidden();
      await expect(engineer).toBeFocused();
      const gaps = await connectorGaps(page);
      for (const gap of gaps) expect(gap).toBeLessThan(1.5);
    });

    test("hovering a card highlights its path to the root and fades the others", async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "Hover needs a mouse.");
      await openStory(page, storyId(impl, "organization-chart", "search"));
      const chart = page.getByRole("list", { name: "Searchable organization chart" });
      const opacity = (id: string) =>
        chart
          .locator(`[data-ok-node-id="${id}"] > [data-ok-organization-chart-label]`)
          .evaluate((label) => getComputedStyle(label).opacity);
      await chart.getByText("Aiko Tanaka", { exact: true }).hover();
      await expect.poll(() => opacity("leila")).toBe("0.3");
      expect(await opacity("aiko")).toBe("1");
      expect(await opacity("jonah")).toBe("1");
      expect(await opacity("maya")).toBe("1");
      // Jonah's bar segment runs from the CEO's line to his own, in the highlight color.
      const meets = await chart.evaluate((root) => {
        const jonah = root.querySelector('[data-ok-node-id="jonah"]') as HTMLElement;
        const list = jonah.parentElement as HTMLElement;
        const segment = getComputedStyle(jonah.firstElementChild as Element, "::before");
        const stem = getComputedStyle(list, "::before");
        const start = jonah.getBoundingClientRect().left + Number.parseFloat(segment.left);
        const end = start + Number.parseFloat(segment.width);
        const line = list.getBoundingClientRect().left + Number.parseFloat(stem.left);
        return {
          gap: Math.abs(end - (line + Number.parseFloat(stem.borderLeftWidth))),
          same: segment.borderTopColor === stem.borderLeftColor,
        };
      });
      expect(meets.gap).toBeLessThan(1.5);
      expect(meets.same).toBe(true);
      await page.mouse.move(1, 1);
      await expect.poll(() => opacity("leila")).toBe("1");
    });

    test("the search opens, scrolls to and highlights a person, and says so", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await openStory(page, storyId(impl, "organization-chart", "search"));
      const zara = page.locator('[data-ok-node-id="zara"]');
      await expect(page.getByText("Zara Okafor", { exact: true }).last()).toBeHidden();
      const field = page.getByRole("combobox", { name: "Find a person" });
      await field.click();
      await field.fill("Zara");
      await page.getByRole("option", { name: "Zara Okafor" }).click();
      await expect(zara).toHaveAttribute("data-ok-highlighted", "");
      await expect(page.getByRole("status")).toHaveText("Zara Okafor is highlighted in the chart.");
      const label = zara.locator(":scope > [data-ok-organization-chart-label]");
      await expect(label).toBeInViewport();
      const area = page.getByRole("region", { name: "Searchable organization chart, scrollable" });
      await expect.poll(() => area.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      await expect(
        page.locator('[data-ok-node-id="leila"] > [data-ok-organization-chart-toggle]'),
      ).toHaveAttribute("aria-expanded", "true");
      // Nothing fades for a search result.
      expect(
        await page
          .locator('[data-ok-node-id="jonah"] > [data-ok-organization-chart-label]')
          .evaluate((element) => getComputedStyle(element).opacity),
      ).toBe("1");
      // Clearing the field removes the highlight.
      await field.focus();
      await page.getByRole("button", { name: "Clear" }).click({ force: true });
      await expect(page.locator("[data-ok-highlighted]")).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveText("");
    });

    test("lazy children load on the first expand", async ({ page }) => {
      await openStory(page, storyId(impl, "organization-chart", "lazy-children"));
      const priya = toggleOf(page, "priya");
      await expect(priya).toHaveAccessibleName("Priya Raman's reports");
      await expect(priya).toHaveAttribute("aria-expanded", "false");
      await priya.scrollIntoViewIfNeeded();
      await priya.click();
      await expect(priya).toHaveAttribute("aria-busy", "true");
      await expect(page.getByText("Elias Novak", { exact: true })).toBeVisible();
      await expect(priya).not.toHaveAttribute("aria-busy", "true");
      await expect(priya).toHaveAttribute("aria-expanded", "true");
      // Loaded nodes collapse like the others.
      const elias = toggleOf(page, "elias");
      await elias.click();
      await expect(page.getByText("Sofia Marchetti", { exact: true })).toBeHidden();
      await expect(page.getByRole("button", { name: "Elias Novak's reports 3" })).toBeVisible();
      // Collapsed again and reopened: no second load.
      await priya.click();
      await priya.click();
      await expect(priya).not.toHaveAttribute("aria-busy", "true");
      await expect(page.getByText("Elias Novak", { exact: true })).toBeVisible();
    });

    test("selection: pointer, Space and the buttons; the status names the people", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "organization-chart", "selection"));
      const tree = page.getByRole("tree", { name: "Selectable organization chart" });
      await expect(tree).toHaveAttribute("aria-multiselectable", "true");
      const item = (id: string) => page.locator(`[data-ok-node-id="${id}"]`);
      await expect(item("priya")).toHaveAttribute("aria-selected", "true");
      const card = item("jonah").locator("> [data-ok-organization-chart-label]");
      await card.scrollIntoViewIfNeeded();
      if (isMobile) await card.tap();
      else await card.click();
      await expect(item("jonah")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("status")).toHaveText("Selected: Priya Raman, Jonah Pereira");
      // Space on the focused node deselects it.
      await expect(item("jonah")).toBeFocused();
      await page.keyboard.press("Space");
      await expect(item("jonah")).toHaveAttribute("aria-selected", "false");
      await expect(page.getByRole("status")).toHaveText("Selected: Priya Raman");
      await page.getByRole("button", { name: "Select the leads" }).click();
      for (const id of ["jonah", "priya", "leila"])
        await expect(item(id)).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("status")).toHaveText(
        "Selected: Jonah Pereira, Priya Raman, Leila Haddad",
      );
      await page.getByRole("button", { name: "Clear selection" }).click();
      await expect(page.locator("[data-ok-selected]")).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveText("No one is selected.");
    });

    test("keyboard: one tab stop, arrows, typeahead; the breadcrumb follows the selection", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "organization-chart", "keyboard-breadcrumb"));
      const item = (id: string) => page.locator(`[data-ok-node-id="${id}"]`);
      const crumbs = page.getByRole("navigation", { name: "Path to the selected person" });
      await expect(crumbs.locator("li[data-ok-breadcrumbs-item]")).toHaveText([
        "Maya Lindqvist",
        "Priya Raman",
        "Elias Novak",
        "Sofia Marchetti",
      ]);
      await expect(page.locator('[data-ok-organization-chart] [tabindex="0"]')).toHaveCount(1);
      // The selected node holds the tab stop.
      await item("sofia").focus();
      await expect(item("sofia")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(item("tomas")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(item("sofia")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(item("sofia")).toHaveAttribute("aria-expanded", "false");
      await page.keyboard.press("ArrowRight");
      await expect(item("sofia")).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Home");
      await expect(item("maya")).toBeFocused();
      await page.keyboard.press("z");
      await expect(item("zara")).toBeFocused();
      await page.keyboard.press("Space");
      await expect(item("zara")).toHaveAttribute("aria-selected", "true");
      await expect(item("sofia")).toHaveAttribute("aria-selected", "false");
      await expect(crumbs.locator("li[data-ok-breadcrumbs-item]")).toHaveText([
        "Maya Lindqvist",
        "Leila Haddad",
        "Zara Okafor",
      ]);
      await expect(crumbs.locator('[aria-current="location"]')).toHaveText("Zara Okafor");
      // A manager in the trail selects them.
      await crumbs.getByRole("button", { name: "Leila Haddad" }).click();
      await expect(item("leila")).toHaveAttribute("aria-selected", "true");
      await expect(crumbs.locator("li[data-ok-breadcrumbs-item]")).toHaveText([
        "Maya Lindqvist",
        "Leila Haddad",
      ]);
      // Shift+Tab leaves the tree in one step, to its scroll area (Firefox keeps the focus when
      // Tab leaves the page's last control).
      await item("leila").focus();
      await page.keyboard.press("Shift+Tab");
      await expect(
        page.getByRole("region", { name: "Organization chart with a breadcrumb, scrollable" }),
      ).toBeFocused();
    });
  });
}
