import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { getRuntime } from "../../runtime/global.js";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  snippets.find(([path]) => path.endsWith(`/${name}-group.html`))?.[1] as string;

const HOSTILE = '"><img src=x onerror=alert(1)>';
const LINE = `<figure data-ok-chart data-ok-type="line" data-ok-x-type="category" data-ok-curve="smooth" data-ok-legend="top" data-ok-fill="gradient" data-ok-marker-size="4">
  <table data-ok-chart-data><caption>Sales</caption>
    <thead><tr><th scope="col">Month</th><th scope="col" data-ok-color="primary-dark">Series A</th><th scope="col" data-ok-color="warning">Series B</th></tr></thead>
    <tbody>
      <tr><th scope="row">Jan</th><td>31</td><td>11</td></tr>
      <tr><th scope="row">Feb</th><td>40</td><td>32</td></tr>
      <tr><th scope="row">Mar</th><td>28</td><td>45</td></tr>
      <tr><th scope="row">Apr</th><td>64</td><td>34</td></tr>
    </tbody>
  </table>
</figure>`;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
const sized = (html: string, width = 600) => {
  const host = mount(html);
  host.style.width = `${width}px`;
  return host;
};
const parts = (host: Element) => ({
  root: host.querySelector("[data-ok-chart]") as HTMLElement,
  plot: host.querySelector("[data-ok-chart-plot]") as HTMLElement,
  svg: host.querySelector("[data-ok-chart-svg]") as SVGSVGElement,
  tip: host.querySelector("[data-ok-chart-tooltip]") as HTMLElement,
  legend: [...host.querySelectorAll<HTMLButtonElement>("[data-ok-chart-legend-item]")],
});
const instance = (host: Element) =>
  runtime?.get<ChartInstance>(parts(host).root, "chart") as ChartInstance;
const hoverAt = (
  plot: HTMLElement,
  x: number,
  y: number,
  pointerType = "mouse",
  type = "pointermove",
) => {
  const box = plot.getBoundingClientRect();
  plot.dispatchEvent(
    new PointerEvent(type, {
      clientX: box.left + x,
      clientY: box.top + y,
      pointerType,
      bubbles: true,
    }),
  );
};
/** Resolves on the next mutation of `target` (asynchronous redraws). */
const mutated = (target: Node, options: MutationObserverInit) =>
  new Promise<void>((resolve) => {
    new MutationObserver((_, observer) => {
      observer.disconnect();
      resolve();
    }).observe(target, options);
  });

/** Any change in the drawing (redraws patch the SVG in place). */
const DEEP: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
};

describe("chart snippets", () => {
  it("covers every story", () => expect(snippets).toHaveLength(92));

  it.each(snippets)(
    "%s: a figure with a data table, CSP-safe; readable without JavaScript",
    async (_, html) => {
      const host = sized(html);
      const root = host.querySelector("[data-ok-chart]") as HTMLElement;
      expect(root.localName).toBe("figure");
      expect(
        root.querySelector(":scope > table[data-ok-chart-data] > caption")?.textContent,
      ).not.toBe("");
      expect(root.hasAttribute("data-ok-ready")).toBe(false);
      expect(
        (root.querySelector("table") as HTMLElement).getBoundingClientRect().width,
      ).toBeGreaterThan(100);
      expectCspSafe(host, html);
      await expectNoAxeViolations(host);
    },
  );

  it.each(snippets)("%s: draws, accessible in light and dark", async (_, html) => {
    const host = sized(html);
    start();
    const { root, plot, svg } = parts(host);
    expect(root.hasAttribute("data-ok-ready")).toBe(true);
    // A no-data message joins the plot's name (4.18.65).
    expect(plot.getAttribute("aria-label")).toContain(
      root.querySelector("caption")?.textContent as string,
    );
    expect(svg.querySelectorAll("[data-ok-chart-series]").length).toBeGreaterThan(0);
    expectNamedButtons(host);
    await expectNoAxeViolations(host);
    document.documentElement.setAttribute("data-ok-theme", "dark");
    // A dark page under the chart: on the test page's white body, light legend text measured
    // white on white (or on a hover tint when the pointer rested on a legend item, as on CI).
    host.style.backgroundColor = "var(--ok-bg-default)";
    try {
      await expectNoAxeViolations(host);
    } finally {
      document.documentElement.removeAttribute("data-ok-theme");
    }
  });
});

describe("chart runtime", () => {
  it("builds the legend, the plot and the tooltip in React's order and draws at the plot width", () => {
    const host = sized(LINE);
    start();
    const { root, plot, svg, tip, legend } = parts(host);
    expect(
      [...root.children].map((child) => Object.keys((child as HTMLElement).dataset)[0]),
    ).toEqual(["okChartLegend", "okChartPlot", "okChartData"]);
    expect(plot).toMatchObject({ tabIndex: 0 });
    expect(plot.getAttribute("role")).toBe("group");
    expect(plot.getAttribute("aria-roledescription")).toBe("chart");
    expect(svg.getAttribute("width")).toBe(String(plot.clientWidth));
    expect(svg.getAttribute("height")).toBe("320");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.querySelectorAll("[data-ok-chart-marker]")).toHaveLength(8);
    expect(tip.hidden).toBe(true);
    expect(tip.getAttribute("role")).toBe("status");
    expect(
      legend.map((b) => [
        b.type,
        b.textContent,
        b.getAttribute("aria-pressed"),
        b.dataset["okColor"],
      ]),
    ).toEqual([
      ["button", "Series A", "true", "primary-dark"],
      ["button", "Series B", "true", "warning"],
    ]);
  });

  it("init is idempotent; destroy removes what it built and shows the table again", () => {
    const host = sized(LINE);
    const rt = start();
    rt.init();
    expect(host.querySelectorAll("[data-ok-chart-plot]")).toHaveLength(1);
    rt.destroy(host);
    expect(host.querySelector("[data-ok-chart-plot]")).toBeNull();
    expect(host.querySelector("[data-ok-chart-legend]")).toBeNull();
    expect(parts(host).root.hasAttribute("data-ok-ready")).toBe(false);
  });

  it("charts inserted later are drawn (observer)", async () => {
    start();
    const host = sized("");
    host.insertAdjacentHTML("beforeend", LINE);
    await settle();
    expect(parts(host).root.hasAttribute("data-ok-ready")).toBe(true);
  });

  it("legend: toggles series (cancelable), keeps focus, emits the new hidden list", async () => {
    const host = sized(LINE);
    start();
    const events: unknown[] = [];
    host.addEventListener("ok:chart:toggle", (event) => events.push((event as CustomEvent).detail));
    const [a, b] = parts(host).legend as [HTMLButtonElement, HTMLButtonElement];
    await userEvent.click(a);
    expect(a.getAttribute("aria-pressed")).toBe("false");
    expect(document.activeElement).toBe(a);
    expect(parts(host).svg.querySelectorAll("[data-ok-chart-series]")).toHaveLength(1);
    expect(instance(host).hiddenSeries).toEqual([0]);
    expect(events).toEqual([{ index: 0, hidden: true, hiddenSeries: [0] }]);
    host.addEventListener("ok:chart:toggle", (event) => event.preventDefault(), { once: true });
    await userEvent.click(b);
    expect(b.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(a);
    expect(instance(host).hiddenSeries).toEqual([]);
    expect(events).toHaveLength(3);
  });

  it("pre-hidden series from the markup; setHiddenSeries sanitizes", () => {
    const host = sized(
      LINE.replace(
        "<table",
        '<div data-ok-chart-legend><button type="button" data-ok-chart-legend-item aria-pressed="true">A</button><button type="button" data-ok-chart-legend-item aria-pressed="false">B</button><button type="button" data-ok-chart-legend-item>Extra</button></div><table',
      ),
    );
    start();
    expect(instance(host).hiddenSeries).toEqual([1]);
    expect(parts(host).legend).toHaveLength(2);
    instance(host).setHiddenSeries([1, 1, -1, 0.5, 0]);
    expect(instance(host).hiddenSeries).toEqual([0, 1]);
    expect(parts(host).svg.querySelectorAll("[data-ok-chart-series]")).toHaveLength(0);
  });

  it("pointer: crosshair, bigger markers and tooltip; mouse leave hides; touch keeps it", () => {
    const host = sized(LINE);
    start();
    const { plot, svg, tip } = parts(host);
    const onActive = vi.fn();
    host.addEventListener("ok:chart:active", (event) => onActive((event as CustomEvent).detail));
    const x = Number(svg.querySelectorAll("[data-ok-chart-axis='x'] text")[3]?.getAttribute("x"));
    hoverAt(plot, x - 2, 100);
    expect(onActive).toHaveBeenLastCalledWith({ active: { kind: "index", index: 3 } });
    expect(svg.querySelector("[data-ok-chart-crosshair-line]")).not.toBeNull();
    expect(svg.querySelectorAll("[data-ok-chart-active-marker]")).toHaveLength(2);
    expect(tip.hidden).toBe(false);
    expect(tip.querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("Apr");
    expect(
      [...tip.querySelectorAll("[data-ok-chart-tooltip-row]")].map((row) => row.textContent),
    ).toEqual(["Series A64", "Series B34"]);
    expect(tip.style.getPropertyValue("--_ok-chart-tip-x")).toMatch(/^\d+px$/);
    hoverAt(plot, x + 1, 110);
    expect(onActive).toHaveBeenCalledTimes(1);
    plot.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "touch" }));
    expect(tip.hidden).toBe(false);
    plot.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
    expect(tip.hidden).toBe(true);
    expect(tip.childElementCount).toBe(0);
    hoverAt(plot, plot.clientWidth / 2, 100, "touch", "pointerdown");
    expect(tip.hidden).toBe(false);
  });

  it("keyboard: focus shows the first category, arrows / Home / End move, Escape hides", async () => {
    const host = sized(
      `<input aria-label="Before">${LINE.replace('data-ok-legend="top"', 'data-ok-legend="none"')}`,
    );
    start();
    const { plot, tip } = parts(host);
    (host.querySelector("input") as HTMLInputElement).focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(plot);
    expect(instance(host).active).toEqual({ kind: "index", index: 0 });
    await userEvent.keyboard("{ArrowRight}");
    expect(tip.querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("Feb");
    await userEvent.keyboard("{End}");
    expect(instance(host).active).toEqual({ kind: "index", index: 3 });
    await userEvent.keyboard("{Escape}");
    expect(tip.hidden).toBe(true);
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("a");
    expect(instance(host).active).toBeNull();
    await expectNoAxeViolations(host);
    plot.blur();
    expect(instance(host).active).toBeNull();
  });

  it("scatter: the nearest point under the pointer, once per point", () => {
    const host = sized(snippet("scatter"));
    start();
    const { plot, svg } = parts(host);
    const onActive = vi.fn();
    host.addEventListener("ok:chart:active", (event) => onActive((event as CustomEvent).detail));
    const [first, second] = [
      ...svg.querySelectorAll("[data-ok-chart-marker]"),
    ] as SVGCircleElement[];
    const at = (marker: SVGCircleElement | undefined) =>
      hoverAt(plot, Number(marker?.getAttribute("cx")), Number(marker?.getAttribute("cy")));
    at(first);
    at(first);
    at(second);
    expect(onActive).toHaveBeenCalledTimes(2);
    expect(onActive.mock.calls[1]?.[0]).toEqual({ active: { kind: "mark", mark: 1 } });
  });

  it("a hidden chart draws at the default width and keeps it until it is shown", () => {
    const host = sized(LINE);
    host.hidden = true;
    start();
    const { svg, plot } = parts(host);
    expect(svg.getAttribute("width")).toBe("640");
    instance(host).refresh();
    expect(svg.getAttribute("width")).toBe("640");
    instance(host).setActive({ kind: "index", index: 1 });
    expect(parts(host).tip.hidden).toBe(false);
    hoverAt(plot, 10, 10);
    expect(instance(host).active).toBeNull();
  });

  it("clicks outside the legend, or on look-alike buttons, change nothing", async () => {
    const host = sized(
      LINE.replace(
        "<caption>Sales</caption>",
        '<caption>Sales <button type="button" data-ok-chart-legend-item>Fake</button></caption>',
      ),
    );
    start();
    const toggled = vi.fn();
    host.addEventListener("ok:chart:toggle", toggled);
    await userEvent.click(parts(host).plot);
    host.querySelector<HTMLButtonElement>("caption button")?.click();
    expect(toggled).not.toHaveBeenCalled();
    expect(instance(host).hiddenSeries).toEqual([]);
  });

  it("setActive shows a category or point without an event; scatter points", () => {
    const host = sized(snippet("scatter"));
    start();
    const onActive = vi.fn();
    host.addEventListener("ok:chart:active", onActive);
    instance(host).setActive({ kind: "mark", mark: 0 });
    expect(parts(host).svg.querySelectorAll("[data-ok-chart-active-marker]")).toHaveLength(1);
    expect(parts(host).tip.hidden).toBe(false);
    instance(host).setActive(null);
    expect(parts(host).tip.hidden).toBe(true);
    expect(onActive).not.toHaveBeenCalled();
  });

  it("formatters and prefix / suffix attributes", () => {
    const host = sized(
      LINE.replace(
        "<figure data-ok-chart",
        '<figure data-ok-value-prefix="$" data-ok-value-suffix=" k" data-ok-locale="en-US" data-ok-y-title="Points" data-ok-chart',
      ),
    );
    start();
    const { svg } = parts(host);
    expect(svg.querySelector("[data-ok-chart-axis='y'] text")?.textContent).toBe("$0 k");
    expect(svg.querySelector("[data-ok-chart-axis-title]")?.textContent).toBe("Points");
    instance(host).setFormatters({ value: (value) => `${value} pts`, label: (x) => `M:${x}` });
    expect(parts(host).svg.querySelector("[data-ok-chart-axis='x'] text")?.textContent).toBe(
      "M:Jan",
    );
    instance(host).setActive({ kind: "index", index: 0 });
    expect(parts(host).tip.textContent).toBe("M:JanSeries A31 ptsSeries B11 pts");
  });

  it("redraws when the table, the options or the size change", async () => {
    const host = sized(LINE);
    start();
    const { root, svg } = parts(host);
    const cell = root.querySelector("tbody td") as HTMLElement;
    let redraw = mutated(svg, DEEP);
    cell.textContent = "500";
    await redraw;
    expect(svg.querySelector("[data-ok-chart-axis='y'] text:last-child")?.textContent).toBe("500");
    redraw = mutated(svg, DEEP);
    root.setAttribute("data-ok-type", "bar");
    await redraw;
    expect(svg.querySelectorAll("[data-ok-chart-bar]").length).toBeGreaterThan(0);
    redraw = mutated(svg, { attributes: true, attributeFilter: ["width"] });
    host.style.width = "400px";
    await redraw;
    expect(svg.getAttribute("width")).toBe("400");
    instance(host).refresh();
    expect(svg.getAttribute("width")).toBe("400");
  });

  it("legend appears and disappears with the series count", async () => {
    const host = sized(LINE);
    start();
    const { root } = parts(host);
    const redraw = mutated(root, { childList: true });
    for (const row of root.querySelectorAll("tr")) row.lastElementChild?.remove();
    await redraw;
    expect(root.querySelector("[data-ok-chart-legend]")).toBeNull();
  });

  it("legend items follow renamed series and fewer series", () => {
    const host = sized(LINE.replace('data-ok-legend="top"', 'data-ok-legend="right"'));
    start();
    const header = parts(host).root.querySelector("thead th:nth-child(2)") as HTMLElement;
    header.textContent = "Renamed";
    instance(host).refresh();
    expect(parts(host).legend[0]?.textContent).toBe("Renamed");
    expect(parts(host).legend[0]?.querySelector("[data-ok-chart-legend-marker]")).not.toBeNull();
  });

  it("hostile values never reach the DOM; missing tables and captions are tolerated", () => {
    const host =
      sized(`<figure data-ok-chart data-ok-type="${HOSTILE.replace(/"/g, "&quot;")}" data-ok-height="-4" data-ok-column-width="abc">
      <table data-ok-chart-data><thead><tr><th>X</th><th data-ok-color="${HOSTILE.replace(/"/g, "&quot;")}">${HOSTILE.replace(/</g, "&lt;")}</th></tr></thead>
      <tbody><tr><th>${HOSTILE.replace(/</g, "&lt;")}</th><td>${HOSTILE.replace(/</g, "&lt;")}</td></tr></tbody></table></figure>
      <figure data-ok-chart id="bare"></figure>`);
    start();
    expect(host.querySelectorAll("img")).toHaveLength(0);
    const { svg, plot } = parts(host);
    expect(svg.getAttribute("height")).toBe("320");
    expect(plot.hasAttribute("aria-label")).toBe(false);
    expect(svg.querySelector("[data-ok-chart-series]")?.getAttribute("data-ok-color")).toBe(
      "primary-dark",
    );
    const bare = host.querySelector("#bare") as HTMLElement;
    expect(bare.querySelector("linearGradient")).toBeNull();
    expect(bare.hasAttribute("data-ok-ready")).toBe(true);
  });

  it("gradient ids are unique per chart and use the element id when present", () => {
    const host = sized(
      LINE.replace('data-ok-type="line"', 'data-ok-type="area" id="sales:chart"') +
        LINE.replace('data-ok-type="line"', 'data-ok-type="area"'),
    );
    start();
    const ids = [...host.querySelectorAll("linearGradient")].map((g) => g.id);
    expect(ids[0]).toBe("ok-chart-saleschart-area-0");
    expect(new Set(ids).size).toBe(4);
  });

  it("coexists: the page-wide runtime mounts once; React-owned charts are left alone", () => {
    const host = sized(
      LINE + LINE.replace("<figure data-ok-chart", '<figure data-ok-runtime="off" data-ok-chart'),
    );
    runtime = getRuntime()
      .register(...components)
      .start();
    getRuntime()
      .register(...components)
      .start();
    expect(host.querySelectorAll("[data-ok-chart-plot]")).toHaveLength(1);
    expect(host.querySelectorAll("[data-ok-chart][data-ok-ready]")).toHaveLength(1);
  });
});

describe("chart runtime: polar charts (phase 2)", () => {
  it("pie: draws slices with percentages from the table; the legend hides categories", async () => {
    const host = sized(snippet("pie"));
    start();
    const { root, svg, legend } = parts(host);
    expect(svg.querySelectorAll("[data-ok-chart-slice]")).toHaveLength(4);
    expect(
      [...svg.querySelectorAll("[data-ok-chart-data-label]")].map((label) => label.textContent),
    ).toEqual(["28.4%", "35.5%", "8.4%", "27.7%"]);
    expect(legend.map((item) => item.textContent)).toEqual([
      "Series A",
      "Series B",
      "Series C",
      "Series D",
    ]);
    const toggles: unknown[] = [];
    root.addEventListener("ok:chart:toggle", (event) =>
      toggles.push((event as CustomEvent).detail),
    );
    await userEvent.click(legend[1] as HTMLButtonElement);
    expect(toggles).toEqual([{ index: 1, hidden: true, hiddenSeries: [1] }]);
    expect(svg.querySelectorAll("[data-ok-chart-slice]")).toHaveLength(3);
    expect(instance(host).hiddenSeries).toEqual([1]);
  });

  it("pie: pointer and keyboard activate slices", () => {
    const host = sized(snippet("pie"));
    start();
    const { plot, svg, tip } = parts(host);
    hoverAt(plot, plot.clientWidth / 2 + 30, 80);
    expect(instance(host).active).toEqual({ kind: "index", index: 0 });
    expect(svg.querySelector("[data-ok-chart-active-slice]")).not.toBeNull();
    expect(tip.querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("Series A");
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(instance(host).active).toEqual({ kind: "index", index: 3 });
  });

  it("donut and radial bar: totals and center labels from attributes", async () => {
    const host = sized(`${snippet("donut")}${snippet("radial-bar")}${snippet("stroked-gauge")}`);
    start();
    const centers = [...host.querySelectorAll("[data-ok-chart-center]")].map((c) => c.textContent);
    expect(centers).toEqual(["Total155", "Total2,324", "75%Median ratio"]);
    const [donut, radial] = [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")];
    // Changing the total label redraws.
    const redrawn = mutated(donut as HTMLElement, {
      attributeFilter: ["data-ok-ready"],
      subtree: true,
      childList: true,
    });
    (donut as HTMLElement).setAttribute("data-ok-total-label", "Sum");
    await redrawn;
    await settle();
    expect(donut?.querySelector("[data-ok-chart-center-label]")?.textContent).toBe("Sum");
    expect(radial?.querySelectorAll("[data-ok-chart-track]")).toHaveLength(2);
    const dashed = host.querySelectorAll("[data-ok-chart]")[2] as HTMLElement;
    expect(dashed.querySelector("[data-ok-chart-radial]")?.getAttribute("stroke-dasharray")).toBe(
      "4",
    );
    expect(dashed.querySelector("[data-ok-chart-legend]")).toBeNull();
  });

  it("radar: web, shapes and a tooltip per category", () => {
    const host = sized(snippet("radar"));
    start();
    const { plot, svg, tip } = parts(host);
    expect(svg.querySelectorAll("[data-ok-chart-series][data-ok-type='radar']")).toHaveLength(3);
    expect(svg.querySelectorAll("line[data-ok-chart-web]")).toHaveLength(6);
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(tip.querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("2011");
    expect(tip.querySelectorAll("[data-ok-chart-tooltip-row]")).toHaveLength(3);
  });

  it("hostile option values fall back", () => {
    const host = sized(
      snippet("semi-circle-gauge")
        .replace('data-ok-start-angle="-90"', `data-ok-start-angle='${HOSTILE}'`)
        .replace("<figure", `<figure data-ok-dash-array="-4" data-ok-total-label='${HOSTILE}'`),
    );
    start();
    const { svg } = parts(host);
    expect(svg.querySelector("[data-ok-chart-radial]")?.hasAttribute("stroke-dasharray")).toBe(
      false,
    );
    expect(host.querySelector("img")).toBeNull();
    // An invalid start angle falls back to 0: the gauge runs from 12 o'clock to 3 o'clock.
    expect(svg.querySelector("[data-ok-chart-center-label]")?.textContent).toBe(
      "Used of 24 Mb / 50 Mb",
    );
  });
});

describe("chart runtime: phase 3", () => {
  const rows = (root: Element) =>
    [...root.querySelectorAll("tbody tr")].map((tr) =>
      [...tr.children].map((cell) => cell.textContent).join(" "),
    );

  it("box plot: two-row table read back, colors from attributes; hostile colors fall back", () => {
    const host = sized(
      snippet("box-plot").replace(
        'data-ok-box-lower-color="error"',
        `data-ok-box-lower-color='${HOSTILE}'`,
      ),
    );
    start();
    const { svg, plot, tip } = parts(host);
    expect(svg.querySelectorAll("[data-ok-chart-box='upper'][data-ok-color='info']")).toHaveLength(
      7,
    );
    // An invalid lower color falls back to a lighter tone of the series color.
    expect(svg.querySelector("[data-ok-chart-box='lower']")?.getAttribute("data-ok-color")).toBe(
      "primary-main",
    );
    hoverAt(plot, 300, 150);
    expect(tip.querySelectorAll("[data-ok-chart-tooltip-row]")).toHaveLength(5);
    expect(host.querySelector("img")).toBeNull();
  });

  it("heatmap and treemap: cells, keyboard between them", async () => {
    const host = sized(snippet("heatmap"));
    start();
    const { svg, plot, tip } = parts(host);
    expect(svg.querySelectorAll("[data-ok-chart-cell]")).toHaveLength(42);
    plot.focus();
    await userEvent.keyboard("{Home}");
    await userEvent.keyboard("{ArrowDown}");
    expect(tip.textContent).toBe("10:00Metric 524");
    expect(svg.querySelectorAll("[data-ok-chart-active-cell]")).toHaveLength(1);
    resetPage();
    runtime?.stop();
    const tree = sized(snippet("treemap"));
    start();
    expect(parts(tree).svg.querySelectorAll("[data-ok-chart-tag-label]")).toHaveLength(2);
  });

  it("sparklines: the container's height, at least data-ok-height (CSSOM)", async () => {
    const host = sized(`<div>${snippet("sparklines")}</div>`);
    const box = host.firstElementChild as HTMLElement;
    box.style.height = "80px";
    const root = box.querySelector("[data-ok-chart]") as HTMLElement;
    root.style.width = "240px";
    start();
    const { plot, svg } = parts(box);
    expect(plot.style.getPropertyValue("--_ok-chart-height")).toBe("48px");
    expect(svg.getAttribute("height")).toBe("80");
    expect(host.querySelector("[data-ok-chart-legend]")).toBeNull();
    // A taller container: the next resize redraws at its height.
    const redraw = mutated(svg, { attributes: true, attributeFilter: ["height"] });
    box.style.height = "100px";
    await redraw;
    expect(svg.getAttribute("height")).toBe("100");
    // Without data-ok-height: the CSS default (40px) and no custom property.
    root.removeAttribute("data-ok-height");
    box.style.height = "";
    instance(box).refresh();
    expect(plot.style.getPropertyValue("--_ok-chart-height")).toBe("");
  });

  it("updateSeries rewrites the table in place, keeps the active category and hidden series", () => {
    const host = sized(LINE);
    start();
    const { root, plot, tip } = parts(host);
    const chart = instance(host);
    chart.setHiddenSeries([1]);
    hoverAt(plot, 590, 100);
    expect(tip.querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("Apr");
    const firstRow = root.querySelector("tbody tr");
    chart.updateSeries(
      [
        { name: "Series A", data: [1, 2, 3, 99] },
        { name: "Series B", data: [4, 5, 6, 7] },
      ],
      ["Feb", "Mar", "Apr", "May"],
    );
    expect(tip.textContent).toBe("MaySeries A99");
    expect(chart.hiddenSeries).toEqual([1]);
    expect(rows(root)).toEqual(["Feb 1 4", "Mar 2 5", "Apr 3 6", "May 99 7"]);
    // The author's first header stays; rows are reused.
    expect(root.querySelector("thead th")?.textContent).toBe("Month");
    expect(root.querySelector("tbody tr")).toBe(firstRow);
    // Without categories: the current ones; fewer rows.
    chart.updateSeries([{ name: "Only", data: [5, 6] }]);
    expect(rows(root)).toEqual(["Feb 5", "Mar 6", "Apr ", "May "]);
    expect(root.querySelectorAll("thead th")).toHaveLength(2);
  });

  it("appendData slides a window; table edits make the table the source again", async () => {
    const host = sized(LINE);
    start();
    const { root, svg } = parts(host);
    const chart = instance(host);
    const line = svg.querySelector("[data-ok-chart-line]");
    chart.appendData([{ data: [70] }, { data: [71] }], { categories: ["May"], limit: 4 });
    expect(rows(root)).toEqual(["Feb 40 32", "Mar 28 45", "Apr 64 34", "May 70 71"]);
    // The drawing is patched: the same line element.
    expect(svg.querySelector("[data-ok-chart-line]")).toBe(line);
    chart.appendData([{ data: [1] }], { categories: ["Jun"], limit: 0 });
    expect(rows(root).at(-1)).toBe("Jun 1 ");
    chart.appendData([]);
    expect(rows(root)).toHaveLength(5);
    const redraw = mutated(svg, DEEP);
    (root.querySelector("tbody td") as HTMLElement).textContent = "500";
    await redraw;
    expect(svg.querySelector("[data-ok-chart-axis='y'] text:last-child")?.textContent).toBe("500");
    chart.appendData([{ data: [2] }, { data: [3] }], { categories: ["Jul"] });
    expect(rows(root)[0]).toBe("Feb 500 32");
  });

  it("multi-value tables round-trip: range areas and bubbles", () => {
    const host = sized(snippet("range-area"));
    start();
    const chart = instance(host);
    const { root } = parts(host);
    const before = rows(root);
    chart.appendData([{ data: [{ y: [100, 200] }] }, { data: [150] }], { categories: ["Mon"] });
    expect(rows(root).at(-1)).toBe("Mon 100 ms 200 ms 150 ms");
    expect(root.querySelectorAll("thead tr")).toHaveLength(2);
    chart.refresh();
    expect(rows(root).slice(0, before.length)).toEqual(before);
    resetPage();
    runtime?.stop();
    const bubbles = sized(snippet("bubble"));
    start();
    const { svg } = parts(bubbles);
    expect(svg.querySelectorAll("[data-ok-chart-bubble]")).toHaveLength(12);
    instance(bubbles).updateSeries([{ name: "Gateway", data: [[1, 2, 3]] }]);
    expect(svg.querySelectorAll("[data-ok-chart-bubble]")).toHaveLength(1);
    expect(rows(parts(bubbles).root)).toEqual(["1 2 3"]);
  });

  it("a table without a head or body is created; rows lose stray cells", () => {
    const host = sized(
      `<figure data-ok-chart data-ok-type="bar"><table data-ok-chart-data><caption>T</caption><tr><td>X</td><td>A</td></tr></table></figure>`,
    );
    start();
    const { root } = parts(host);
    instance(host).updateSeries([{ name: "A", data: [1] }], ["a"]);
    expect(root.querySelector("thead tr")?.textContent).toBe("XA");
    expect(rows(root)).toEqual(["a 1"]);
    instance(host).updateSeries([{ name: "B", data: [{ y: [1, 2] }], type: "rangeArea" }], ["b"]);
    expect(rows(root)).toEqual(["b 1 2"]);
    expect(root.querySelector("tbody th")?.getAttribute("scope")).toBe("row");
    // A header cell in a value position becomes a data cell.
    const body = root.querySelector("tbody") as HTMLTableSectionElement;
    ((body.rows[0] as HTMLTableRowElement).cells[1] as HTMLElement).replaceWith(
      document.createElement("th"),
    );
    instance(host).updateSeries([{ name: "A", data: [3] }], ["c"]);
    expect([...(body.rows[0]?.cells ?? [])].map((c) => c.localName)).toEqual(["th", "td"]);
  });
});
