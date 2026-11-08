import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";

/* Phase 4 (ADR-0027, ADR-0031) in the HTML runtime: toolbar, zoom, links, annotations, texts. */

const rows = (count: number) =>
  Array.from(
    { length: count },
    (_, i) => `<tr><th scope="row">D${i}</th><td>${(i * 7) % 11}</td></tr>`,
  ).join("");
const chart = (attrs: string, extra = "", count = 10, caption = "Visits") =>
  `<figure data-ok-chart data-ok-type="line" data-ok-legend="top" ${attrs}>
  <table data-ok-chart-data><caption>${caption}</caption>
    <thead><tr><th scope="col">Day</th><th scope="col" data-ok-color="info">Visits</th></tr></thead>
    <tbody>${rows(count)}</tbody>
  </table>${extra}
</figure>`;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.restoreAllMocks();
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
const get = (root: Element) => runtime?.get<ChartInstance>(root, "chart") as ChartInstance;
const roots = (host: Element) => [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")];
const plotOf = (root: Element) => root.querySelector("[data-ok-chart-plot]") as HTMLElement;
const titleOf = (root: Element) =>
  root.querySelector("[data-ok-chart-tooltip-title]")?.textContent ?? null;
/** Resolves when `target`'s text changes (asynchronous export failures). */
const textChanged = (target: Node) =>
  new Promise<void>((resolve) =>
    new MutationObserver((_, observer) => {
      observer.disconnect();
      resolve();
    }).observe(target, { childList: true, characterData: true, subtree: true }),
  );
const key = (target: HTMLElement, init: KeyboardEventInit) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));

describe("toolbar and zoom", () => {
  it("renders zoom tools and downloads; buttons zoom, pan and reset", async () => {
    const host = sized(chart("data-ok-zoom data-ok-toolbar"));
    start();
    const [root] = roots(host) as [HTMLElement];
    const toolbar = root.querySelector("[data-ok-chart-toolbar]") as HTMLElement;
    expect(root.firstElementChild).toBe(toolbar);
    expect(toolbar.getAttribute("aria-label")).toBe("Chart tools");
    const tool = (name: string) =>
      toolbar.querySelector(`[data-ok-chart-tool="${name}"]`) as HTMLButtonElement;
    expect(
      [...toolbar.querySelectorAll("[data-ok-chart-tool]")].map((b) =>
        b.getAttribute("data-ok-chart-tool"),
      ),
    ).toEqual(["zoomIn", "zoomOut", "reset", "pan", "svg", "png", "csv"]);
    expect(tool("reset").disabled).toBe(true);
    const events: unknown[] = [];
    root.addEventListener("ok:chart:zoom", (e) => events.push((e as CustomEvent).detail));
    await userEvent.click(tool("zoomIn"));
    expect(get(root).zoomRange).toEqual({ min: 2, max: 7 });
    expect(events).toEqual([{ range: { min: 2, max: 7 }, reason: "user" }]);
    expect(tool("reset").disabled).toBe(false);
    expect(root.querySelectorAll("[data-ok-chart-tick]").length).toBeGreaterThan(0);
    await userEvent.click(tool("zoomOut"));
    expect(get(root).zoomRange).toBeNull();
    await userEvent.click(tool("pan"));
    expect(tool("pan").getAttribute("aria-pressed")).toBe("true");
    get(root).setZoomRange({ min: 1, max: 3 });
    expect(events).toHaveLength(2);
    await userEvent.click(tool("reset"));
    expect(get(root).zoomRange).toBeNull();
    await expectNoAxeViolations(host);
    // Removing the attribute removes the toolbar.
    root.removeAttribute("data-ok-toolbar");
    await settle();
    expect(root.querySelector("[data-ok-chart-toolbar]")).toBeNull();
  });

  it("a canceled zoom event refuses the change; downloads report failures", async () => {
    const host = sized(chart("data-ok-zoom data-ok-toolbar"));
    start();
    const [root] = roots(host) as [HTMLElement];
    root.addEventListener("ok:chart:zoom", (e) => e.preventDefault());
    await userEvent.click(root.querySelector('[data-ok-chart-tool="zoomIn"]') as HTMLElement);
    expect(get(root).zoomRange).toBeNull();
    // Without a gesture the download is refused and announced.
    const activation = vi
      .spyOn(navigator, "userActivation", "get")
      .mockReturnValue({ isActive: false } as UserActivation);
    const status = root.querySelector("[data-ok-chart-status]") as HTMLElement;
    let changed = textChanged(status);
    (root.querySelector('[data-ok-chart-tool="csv"]') as HTMLElement).click();
    await changed;
    expect(root.querySelector("[data-ok-chart-status]")?.textContent).toBe("The download failed.");
    get(root).setLocaleText({ exportFailed: "Lỗi", toolbar: "Công cụ", zoomIn: "Phóng to" });
    expect(root.querySelector("[data-ok-chart-toolbar]")?.getAttribute("aria-label")).toBe(
      "Công cụ",
    );
    expect(root.querySelector('[data-ok-chart-tool="zoomIn"]')?.getAttribute("aria-label")).toBe(
      "Phóng to",
    );
    changed = textChanged(status);
    (root.querySelector('[data-ok-chart-tool="svg"]') as HTMLElement).click();
    await changed;
    // The status is cleared first, then set.
    if (status.textContent === "") await textChanged(status);
    expect(status.textContent).toBe("Lỗi");
    // With a gesture, the file downloads.
    activation.mockRestore();
    const saved = new Promise<string>((resolve) => {
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
        this: HTMLAnchorElement,
      ) {
        resolve(this.download);
      });
    });
    await userEvent.click(root.querySelector('[data-ok-chart-tool="csv"]') as HTMLElement);
    expect(await saved).toBe("visits.csv");
    vi.spyOn(navigator, "userActivation", "get").mockReturnValue({
      isActive: false,
    } as UserActivation);
    await expect(get(root).exportChart("svg")).rejects.toThrow();
  });

  it("keys zoom, pan and reset; Escape hides the tooltip first", async () => {
    const host = sized(chart("data-ok-zoom"));
    start();
    const [root] = roots(host) as [HTMLElement];
    const plot = plotOf(root);
    plot.focus();
    key(plot, { key: "+" });
    expect(get(root).zoomRange).toEqual({ min: 2, max: 7 });
    key(plot, { key: "ArrowRight", shiftKey: true });
    expect(get(root).zoomRange).toEqual({ min: 3, max: 8 });
    // Ctrl + key is the browser's.
    expect(key(plot, { key: "-", ctrlKey: true })).toBe(true);
    key(plot, { key: "Home" });
    expect(titleOf(root)).toBe("D3");
    key(plot, { key: "Escape" });
    expect(titleOf(root)).toBeNull();
    key(plot, { key: "Escape" });
    expect(get(root).zoomRange).toBeNull();
    // Nothing to reset: Escape is not handled.
    expect(key(plot, { key: "Escape" })).toBe(true);
  });

  it("a mouse drag zooms with a selection preview; live data at the end follows", async () => {
    const host = sized(chart("data-ok-zoom"));
    start();
    const [root] = roots(host) as [HTMLElement];
    const plot = plotOf(root);
    const box = plot.getBoundingClientRect();
    const fire = (type: string, x: number) =>
      plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: box.left + x,
          clientY: box.top + 100,
          pointerId: 1,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
    fire("pointerdown", box.width * 0.5);
    fire("pointermove", box.width * 0.98);
    expect(root.querySelector("[data-ok-chart-selection]")).not.toBeNull();
    fire("pointerup", box.width * 0.98);
    expect(root.querySelector("[data-ok-chart-selection]")).toBeNull();
    const range = get(root).zoomRange as { min: number; max: number };
    expect(range.max).toBe(9);
    get(root).appendData([{ data: [3, 4] }], { categories: ["D10", "D11"] });
    expect(get(root).zoomRange).toEqual({ min: range.min + 2, max: 11 });
  });
});

describe("toolbar changes and other axes", () => {
  it("rebuilds the tools when zoom turns on; ignores unknown tools; pans with the pan tool", async () => {
    const host = sized(chart("data-ok-toolbar"));
    start();
    const [root] = roots(host) as [HTMLElement];
    const names = () =>
      [...root.querySelectorAll("[data-ok-chart-tool]")].map((b) =>
        b.getAttribute("data-ok-chart-tool"),
      );
    expect(names()).toEqual(["svg", "png", "csv"]);
    root.setAttribute("data-ok-zoom", "");
    await settle();
    expect(names()).toEqual(["zoomIn", "zoomOut", "reset", "pan", "svg", "png", "csv"]);
    // A look-alike button added by the page does nothing.
    const fake = document.createElement("button");
    fake.setAttribute("data-ok-chart-tool", "nope");
    root.querySelector("[data-ok-chart-toolbar]")?.append(fake);
    fake.click();
    expect(get(root).zoomRange).toBeNull();
    // The pan tool: a mouse drag moves the window.
    get(root).setZoomRange({ min: 2, max: 4 });
    await userEvent.click(root.querySelector('[data-ok-chart-tool="pan"]') as HTMLElement);
    const plot = plotOf(root);
    const box = plot.getBoundingClientRect();
    const fire = (type: string, x: number) =>
      plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: box.left + x,
          clientY: box.top + 80,
          pointerId: 1,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
    fire("pointerdown", box.width * 0.8);
    fire("pointermove", box.width * 0.3);
    fire("pointerup", box.width * 0.3);
    expect((get(root).zoomRange as { min: number }).min).toBeGreaterThan(2);
  });

  it("zooms numeric axes by value", () => {
    const host =
      sized(`<figure data-ok-chart data-ok-type="scatter" data-ok-x-type="numeric" data-ok-zoom>
  <table data-ok-chart-data><caption>Points</caption>
    <thead><tr><th scope="col">X</th><th scope="col">Y</th></tr></thead>
    <tbody><tr><th scope="row">0</th><td>1</td></tr><tr><th scope="row">10</th><td>2</td></tr><tr><th scope="row">20</th><td>3</td></tr></tbody>
  </table>
</figure>`);
    start();
    const [root] = roots(host) as [HTMLElement];
    key(plotOf(root), { key: "+" });
    expect(get(root).zoomRange).toEqual({ min: 5, max: 15 });
  });
});

describe("linked charts", () => {
  it("a group shares the active category and the zoom", async () => {
    const host = sized(
      `${chart('id="a" data-ok-group="g" data-ok-zoom')}${chart('id="b" data-ok-group="g"', "", 10, "Other")}`,
    );
    start();
    const [a, b] = roots(host) as [HTMLElement, HTMLElement];
    const plot = plotOf(a);
    plot.focus();
    key(plot, { key: "End" });
    expect(titleOf(b)).toBe("D9");
    key(plot, { key: "+" });
    expect(get(b).zoomRange).toEqual({ min: 2, max: 7 });
    const events: unknown[] = [];
    b.addEventListener("ok:chart:zoom", (e) => events.push((e as CustomEvent).detail));
    key(plot, { key: "0" });
    expect(events).toEqual([{ range: null, reason: "group" }]);
    plot.blur();
    expect(titleOf(b)).toBeNull();
  });

  it("a brush chart zooms its target and follows it", async () => {
    const host = sized(
      `${chart('id="target"')}${chart('data-ok-brush-target="target"', "", 10, "Overview")}`,
    );
    start();
    const [target, brush] = roots(host) as [HTMLElement, HTMLElement];
    expect(brush.querySelectorAll("[data-ok-chart-handle]")).toHaveLength(2);
    const plot = plotOf(brush);
    plot.focus();
    key(plot, { key: "+" });
    expect(get(target).zoomRange).toEqual({ min: 2, max: 7 });
    get(target).setZoomRange({ min: 0, max: 3 });
    const selection = brush.querySelector("[data-ok-chart-selection]") as SVGRectElement;
    const full = plot.getBoundingClientRect().width;
    expect(Number(selection.getAttribute("width"))).toBeLessThan(full / 2);
    // A brush drag on the plot moves the selection (the target follows).
    const box = plot.getBoundingClientRect();
    const x = Number(selection.getAttribute("x")) + Number(selection.getAttribute("width")) / 2;
    const fire = (type: string, at: number) =>
      plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: box.left + at,
          clientY: box.top + 50,
          pointerId: 1,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
    fire("pointerdown", x);
    fire("pointermove", x + box.width / 4);
    fire("pointerup", x + box.width / 4);
    expect((get(target).zoomRange as { min: number }).min).toBeGreaterThan(0);
  });
});

describe("annotations, legend values, texts", () => {
  it("draws annotations from the list and redraws on edits; the list is hidden but readable", async () => {
    const host = sized(
      chart(
        "",
        `<ul data-ok-chart-annotations><li data-ok-annotation="x" data-ok-x="D3" data-ok-color="error">Deploy</li></ul>`,
      ),
    );
    start();
    const [root] = roots(host) as [HTMLElement];
    expect(root.querySelector("[data-ok-chart-annotation-label]")?.textContent).toBe("Deploy");
    const list = root.querySelector("[data-ok-chart-annotations]") as HTMLElement;
    expect(list.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    const changed = new Promise<void>((resolve) =>
      new MutationObserver((_, o) => {
        o.disconnect();
        resolve();
      }).observe(root.querySelector("svg") as SVGElement, {
        subtree: true,
        characterData: true,
        childList: true,
      }),
    );
    (list.firstElementChild as HTMLElement).textContent = "Release";
    await changed;
    expect(root.querySelector("[data-ok-chart-annotation-label]")?.textContent).toBe("Release");
    await expectNoAxeViolations(host);
  });

  it("shows legend values, formats data labels, reads part labels from the table", async () => {
    const host =
      sized(`<figure data-ok-chart data-ok-type="donut" data-ok-legend-values data-ok-donut-size="50" data-ok-data-labels>
  <table data-ok-chart-data><caption>Storage</caption>
    <thead><tr><th scope="col">Type</th><th scope="col">GB</th></tr></thead>
    <tbody><tr><th scope="row">A</th><td>3</td></tr><tr><th scope="row">B</th><td>1</td></tr></tbody>
  </table>
</figure>
<figure data-ok-chart data-ok-type="boxPlot">
  <table data-ok-chart-data><caption>Spread</caption>
    <thead><tr><th scope="col" rowspan="2">X</th><th scope="colgroup" colspan="5">S</th></tr>
    <tr><th scope="col" data-ok-part="min">Nhỏ nhất</th><th scope="col" data-ok-part="q1">Q1</th><th scope="col" data-ok-part="median">Giữa</th><th scope="col" data-ok-part="q3">Q3</th><th scope="col" data-ok-part="max">Max</th></tr></thead>
    <tbody><tr><th scope="row">a</th><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td></tr></tbody>
  </table>
</figure>`);
    start();
    const [donut, box] = roots(host) as [HTMLElement, HTMLElement];
    expect(
      [...donut.querySelectorAll("[data-ok-chart-legend-value]")].map((n) => n.textContent),
    ).toEqual(["3", "1"]);
    get(donut).setFormatters({ dataLabel: (value) => `${Math.round(value)} pct` });
    expect(donut.querySelector("[data-ok-chart-data-label]")?.textContent).toBe("75 pct");
    get(donut).updateSeries([{ name: "GB", data: [2, 2] }]);
    expect(
      [...donut.querySelectorAll("[data-ok-chart-legend-value]")].map((n) => n.textContent),
    ).toEqual(["2", "2"]);
    const plot = plotOf(box);
    plot.focus();
    key(plot, { key: "Home" });
    expect(box.querySelector("[data-ok-chart-tooltip-row]")?.textContent).toBe("Nhỏ nhất1");
    // API updates keep the table's labels; locale text overrides them.
    get(box).updateSeries([{ name: "S", data: [{ y: [2, 3, 4, 5, 6] }] }]);
    expect(box.querySelector("[data-ok-part=median]")?.textContent).toBe("Giữa");
    get(box).setLocaleText({ median: "Trung vị" });
    expect(box.querySelector("[data-ok-part=median]")?.textContent).toBe("Trung vị");
  });

  it("reads color ranges and candle colors", () => {
    const host =
      sized(`<figure data-ok-chart data-ok-type="heatmap" data-ok-color-ranges="0 5 info; 6 20 error">
  <table data-ok-chart-data><caption>Heat</caption>
    <thead><tr><th scope="col">X</th><th scope="col">Row</th></tr></thead>
    <tbody><tr><th scope="row">a</th><td>3</td></tr><tr><th scope="row">b</th><td>9</td></tr></tbody>
  </table>
</figure>`);
    start();
    const [root] = roots(host) as [HTMLElement];
    expect(
      [...root.querySelectorAll("[data-ok-chart-cell]")].map((c) =>
        c.getAttribute("data-ok-color"),
      ),
    ).toEqual(["info", "error"]);
    root.setAttribute("data-ok-color-ranges", "0 20 success");
    return settle().then(() => {
      expect(root.querySelector("[data-ok-chart-cell]")?.getAttribute("data-ok-color")).toBe(
        "success",
      );
    });
  });

  it("destroy removes the toolbar and unlinks", () => {
    const host = sized(chart('id="x" data-ok-group="g" data-ok-toolbar'));
    const rt = start();
    const [root] = roots(host) as [HTMLElement];
    expect(root.querySelector("[data-ok-chart-toolbar]")).not.toBeNull();
    rt.stop();
    runtime = undefined;
    expect(root.querySelector("[data-ok-chart-toolbar]")).toBeNull();
  });
});
