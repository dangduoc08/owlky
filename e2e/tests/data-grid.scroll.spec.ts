import { expect, type Page, test } from "@playwright/test";
import { openStory, storyIds } from "./helpers.js";

/**
 * Sticky layers keep their place while the grid scrolls: no body cell (pinned, row-spanning, or a
 * control inside a cell) paints over the header (column groups, headers, header filters), and no
 * scrolling row paints over the pinned rows or the aggregation footer. Every data grid story, both
 * frameworks; desktop projects also try a narrow width (wide grids scroll sideways) and a phone.
 */
const STORIES = storyIds("components-datagrid--");
const SIZES = [
  { width: 1280, height: 800 },
  { width: 600, height: 800 },
  { width: 375, height: 812 },
];

/** Waits for grids that load after mount (data sources, lazy chunks). */
async function settled(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll("[data-ok-data-grid-main]")].every(
      (main) => main.getAttribute("aria-busy") !== "true",
    ),
  );
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/** Scrolls each grid to its corners and middle; returns the covered sticky cells. */
const covered = (page: Page) =>
  page.evaluate(async () => {
    const frame = () =>
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const problems: string[] = [];
    let checked = 0;
    let headers = 0;
    const mains = [...document.querySelectorAll<HTMLElement>("[data-ok-data-grid-main]")];
    for (const [g, main] of mains.entries()) {
      main.scrollIntoView({ block: "start", inline: "start" });
      const head = main.querySelector<HTMLElement>("[data-ok-data-grid-header]");
      if (head && !head.hidden) headers++;
      const maxX = main.scrollWidth - main.clientWidth;
      const maxY = main.scrollHeight - main.clientHeight;
      const xs = maxX > 1 ? [0, Math.round(maxX / 2), maxX] : [0];
      const ys = maxY > 1 ? [0, Math.round(maxY / 2), maxY] : [0];
      for (const y of ys)
        for (const x of xs) {
          // Right to left, scrollLeft runs from 0 to negative values.
          main.scrollTo(getComputedStyle(main).direction === "rtl" ? -x : x, y);
          await frame();
          await new Promise((resolve) => setTimeout(resolve, 50));
          await frame();
          const box = main.getBoundingClientRect();
          const view = {
            left: Math.max(box.left + main.clientLeft, 0),
            top: Math.max(box.top + main.clientTop, 0),
            right: Math.min(box.left + main.clientLeft + main.clientWidth, innerWidth),
            bottom: Math.min(box.top + main.clientTop + main.clientHeight, innerHeight),
          };
          const header = main.querySelector<HTMLElement>("[data-ok-data-grid-header]");
          const headerBottom = header?.getBoundingClientRect().bottom ?? view.top;
          const groups: [string, HTMLElement][] = [
            ...(header ? [["header", header] as [string, HTMLElement]] : []),
            ...[...main.querySelectorAll<HTMLElement>("[data-ok-data-grid-pinned-rows]")].map(
              (rows) =>
                [`pinned rows (${rows.getAttribute("data-ok-data-grid-pinned-rows")})`, rows] as [
                  string,
                  HTMLElement,
                ],
            ),
          ];
          for (const [name, group] of groups) {
            const cells = group.querySelectorAll<HTMLElement>(
              '[role="columnheader"], [role="gridcell"]',
            );
            for (const cell of cells) {
              if (cell.closest("[hidden]") || cell.hasAttribute("data-ok-covered")) continue;
              const r = cell.getBoundingClientRect();
              if (r.width < 4 || r.height < 4) continue;
              const cy = r.top + r.height / 2;
              // Pinned rows may sit under the header: only the header may cover them.
              if (cy <= view.top || cy >= view.bottom || (group !== header && cy < headerBottom))
                continue;
              // The center and both quarters: a control inside a body cell may cover only a part.
              for (const fraction of [0.25, 0.5, 0.75]) {
                const cx = r.left + r.width * fraction;
                if (cx <= view.left || cx >= view.right) continue;
                checked++;
                const hit = document.elementFromPoint(cx, cy);
                if (hit && group.contains(hit)) continue;
                if (hit && group !== header && header?.contains(hit)) continue;
                const what = hit
                  ? `${hit.closest("[data-ok-data-grid-body]") ? "body" : "other"} ${
                      hit
                        .closest("[role=gridcell], [role=columnheader]")
                        ?.getAttribute("data-ok-field") ?? hit.tagName.toLowerCase()
                    }${hit.closest("[data-ok-pinned]") ? " (pinned)" : ""}`
                  : "nothing";
                const field =
                  cell.getAttribute("data-ok-field") ??
                  cell.getAttribute("data-ok-filter-field") ??
                  cell.textContent?.trim().slice(0, 20);
                problems.push(
                  `grid ${g + 1} at (${Math.round(main.scrollLeft)}, ${Math.round(main.scrollTop)}): ${name} ${field} covered by ${what}`,
                );
              }
            }
          }
        }
      main.scrollTo(0, 0);
    }
    return { problems: [...new Set(problems)], checked, headers };
  });

for (const id of STORIES) {
  test(`${id}: nothing covers the header or pinned rows while scrolling`, async ({
    page,
  }, info) => {
    // The mobile project keeps its own phone viewport.
    const sizes = info.project.name === "mobile" ? [page.viewportSize()] : SIZES;
    const found: string[] = [];
    for (const size of sizes) {
      if (size) await page.setViewportSize(size);
      await openStory(page, id);
      await settled(page);
      const { problems, checked, headers } = await covered(page);
      const where = size ? `${size.width}×${size.height}` : "phone";
      found.push(...problems.map((problem) => `${where} ${problem}`));
      if (headers > 0 && checked === 0) found.push(`${where}: no sticky cell was checked`);
    }
    expect(found, found.slice(0, 20).join("\n")).toEqual([]);
  });
}
