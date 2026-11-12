import { expect, type Page, test } from "@playwright/test";

/**
 * ADR-0068: owlky.js loads a heavy component's ES module from modules/ next to it when the page
 * holds one, `data-ok-preload` loads modules ahead of use, a failed module is reported and retried,
 * and the markup works before its module arrives. The pages have a strict CSP.
 */

/** Module files (not shared chunks) the page requested, by name. */
function moduleRequests(page: Page): string[] {
  const names: string[] = [];
  page.on("request", (request) => {
    const match = /\/packages\/html\/dist\/modules\/([\w-]+)\.js$/.exec(
      new URL(request.url()).pathname,
    );
    if (match?.[1]) names.push(match[1]);
  });
  return names;
}

/** Records CSP violations and `ok:runtime:error` events from the start of the page. */
async function record(page: Page) {
  await page.addInitScript(() => {
    const scope = window as unknown as { violations: string[]; loadErrors: string[] };
    scope.violations = [];
    scope.loadErrors = [];
    document.addEventListener("securitypolicyviolation", (event) =>
      scope.violations.push(`${event.violatedDirective}: ${event.blockedURI}`),
    );
    document.addEventListener("ok:runtime:error", (event) =>
      scope.loadErrors.push((event as CustomEvent<{ module: string }>).detail.module),
    );
  });
}

const recorded = (page: Page) =>
  page.evaluate(() => {
    const scope = window as unknown as { violations: string[]; loadErrors: string[] };
    return { violations: scope.violations, loadErrors: scope.loadErrors };
  });

/** Adds a second chart with DOM methods (the page's Trusted Types policy forbids innerHTML). */
const addChart = (page: Page) =>
  page.locator("#later").evaluate((host) => {
    const el = (tag: string, attrs: Record<string, string> = {}, text?: string) => {
      const node = document.createElement(tag);
      for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const figure = el("figure", {
      id: "later-chart",
      "data-ok-chart": "",
      "data-ok-type": "line",
      "data-ok-x-type": "category",
    });
    const table = el("table", { "data-ok-chart-data": "" });
    const head = el("tr");
    head.append(el("th", { scope: "col" }, "Day"));
    head.append(el("th", { scope: "col", "data-ok-color": "info" }, "Visits"));
    const body = el("tbody");
    for (const [day, value] of [
      ["Mon", "3"],
      ["Tue", "5"],
    ]) {
      const row = el("tr");
      row.append(el("th", { scope: "row" }, day), el("td", {}, value));
      body.append(row);
    }
    const thead = el("thead");
    thead.append(head);
    table.append(el("caption", {}, "Later"), thead, body);
    figure.append(table);
    host.append(figure);
  });

test.describe("CDN loader", () => {
  test("loads a heavy component's module when the page holds one", async ({ page }) => {
    await record(page);
    const requested = moduleRequests(page);
    await page.goto("/examples/loader/index.html");
    await expect(page.locator("#chart")).toHaveAttribute("data-ok-ready", "");
    await expect(page.locator("#chart [data-ok-chart-bar]").first()).toBeAttached();
    expect(requested).toEqual(["chart"]);
    expect(await page.evaluate(() => window.Owlky?.loaded("chart"))).toBe(true);
    expect(await page.evaluate(() => window.Owlky?.loaded("data-grid"))).toBe(false);
    // A root added later mounts at once: its module is already in.
    await addChart(page);
    await expect(page.locator("#later-chart")).toHaveAttribute("data-ok-ready", "");
    // A root of another module, added later, loads that module.
    await page.locator("#later").evaluate((host) => {
      const motion = document.createElement("div");
      motion.setAttribute("data-ok-motion", "");
      motion.setAttribute("data-ok-variant", "fadeIn");
      motion.textContent = "Moving";
      host.append(motion);
    });
    await expect.poll(() => page.evaluate(() => window.Owlky?.loaded("motion"))).toBe(true);
    expect(requested).toEqual(["chart", "motion"]);
    expect(await recorded(page)).toEqual({ violations: [], loadErrors: [] });
  });

  test("a light page loads only the modules data-ok-preload names", async ({ page }) => {
    await record(page);
    const requested = moduleRequests(page);
    await page.goto("/examples/loader/light.html");
    await page.waitForFunction(() => Boolean(window.Owlky));
    await page.evaluate(() => window.Owlky?.load("data-grid"));
    expect(requested).toEqual(["data-grid"]);
    expect(await page.evaluate(() => window.Owlky?.loaded("chart"))).toBe(false);
    // `load()` resolves at once for light components.
    expect(await page.evaluate(() => window.Owlky?.load("dialog").then(() => "ok"))).toBe("ok");
    expect(await recorded(page)).toEqual({ violations: [], loadErrors: [] });
  });

  test("reports a module that fails and retries when the browser is back online", async ({
    page,
    context,
  }) => {
    await record(page);
    let failures = 0;
    await page.route("**/packages/html/dist/modules/chart.js", async (route) => {
      if (failures === 0) {
        failures++;
        await route.abort("internetdisconnected");
      } else await route.continue();
    });
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/examples/loader/index.html");
    await expect.poll(async () => (await recorded(page)).loadErrors).toEqual(["chart"]);
    expect(errors.some((text) => text.includes('Failed to load module "chart"'))).toBe(true);
    // Without its module the chart is its data table, as without JavaScript.
    await expect(page.locator("#chart")).not.toHaveAttribute("data-ok-ready", "");
    await expect(page.getByRole("table", { name: "Deploys per weekday" })).toBeVisible();
    await context.setOffline(true);
    await context.setOffline(false);
    await expect(page.locator("#chart")).toHaveAttribute("data-ok-ready", "");
    expect(failures).toBe(1);
  });

  test("on a slow network, the markup works before its module arrives", async ({ page }) => {
    await record(page);
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/packages/html/dist/modules/chart.js", async (route) => {
      await held;
      await route.continue();
    });
    // Firefox and WebKit hold the load event for a pending module import: wait for the DOM only.
    await page.goto("/examples/loader/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.Owlky));
    // Light components work at once; the chart shows its data table until its module runs.
    await expect(page.getByRole("button", { name: "Light" })).toHaveCSS(
      "background-color",
      "rgb(0, 167, 111)",
    );
    await expect(page.getByRole("table", { name: "Deploys per weekday" })).toBeVisible();
    expect(await page.evaluate(() => window.Owlky?.loaded("chart"))).toBe(false);
    release();
    await expect(page.locator("#chart")).toHaveAttribute("data-ok-ready", "");
    expect(await recorded(page)).toEqual({ violations: [], loadErrors: [] });
  });
});
