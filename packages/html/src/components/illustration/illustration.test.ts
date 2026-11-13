import { illustrationColors, illustrationTones } from "@owlky/core";
import { error404, error500, illustrations } from "@owlky/core/illustrations";
import { afterEach, describe, expect, it } from "vitest";
import { getRuntime } from "../../runtime/global.js";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import { createIllustration, type IllustrationInstance, illustration } from "./illustration.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

let runtime: Runtime | undefined;
const start = (definition = illustration) => {
  runtime = createRuntime()
    .register(...components, definition)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const one = (host: Element) => host.querySelector("svg[data-ok-illustration]") as SVGSVGElement;
const css = (element: Element) => getComputedStyle(element);
/** The test page is 414px wide: a wider box gives the default width room. */
const wide = (html: string) => mount(`<div style="width: 600px">${html}</div>`);

describe("illustration snippets", () => {
  it("cover every story group (one per illustration)", () =>
    expect(snippets).toHaveLength(illustrations.length));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    const svg = one(host);
    expect(illustrations.map((item) => item.name)).toContain(svg.dataset["okIllustration"]);
    expect(illustrationColors).toContain(svg.dataset["okColor"]);
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.getAttribute("viewBox")).toMatch(/^0 0 \d+ \d+$/);
    for (const shape of svg.querySelectorAll(":not(g)"))
      expect(illustrationTones).toContain(shape.getAttribute("data-ok-tone"));
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations (light and dark)", async (_, html) => {
    const host = mount(
      `<div data-ok-theme="light">${html}</div><div data-ok-theme="dark">${html}</div>`,
    );
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("illustration CSS without JavaScript", () => {
  it("is 480px wide by default, never wider than its container, and keeps the 4:3 canvas", () => {
    const host = wide(
      `<svg data-ok-illustration="error-404" data-ok-color="primary" aria-hidden="true" viewBox="0 0 480 360"></svg>`,
    );
    expect(css(one(host)).width).toBe("480px");
    expect(css(one(host)).height).toBe("360px");
    const narrow = mount(
      `<div style="width: 120px"><svg data-ok-illustration="error-404" aria-hidden="true" viewBox="0 0 480 360"></svg></div>`,
    );
    expect(css(one(narrow)).width).toBe("120px");
    expect(css(one(narrow)).height).toBe("90px");
  });

  it("honors a width attribute", () => {
    const host = wide(
      `<svg data-ok-illustration="error-404" width="200" aria-hidden="true" viewBox="0 0 480 360"></svg>`,
    );
    expect(css(one(host)).width).toBe("200px");
  });
});

describe("illustration runtime", () => {
  it("draws a named placeholder with DOM methods", () => {
    const host = wide('<svg data-ok-illustration="error-404" data-ok-color="primary"></svg>');
    const before = host.innerHTML;
    start();
    const svg = one(host);
    expect(svg.getAttribute("viewBox")).toBe("0 0 480 360");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.children.length).toBe(error404.nodes.length);
    for (const child of svg.querySelectorAll("*")) {
      expect(child.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(child.hasAttribute("style")).toBe(false);
    }
    expect(host.innerHTML).not.toBe(before);
    expect(css(svg).width).toBe("480px");
    const instance = runtime?.get<IllustrationInstance>(svg, "illustration");
    expect(instance?.illustration).toBe(error404);
  });

  it("draws the same markup as the snippet (React render)", () => {
    const [, html] = snippets.find(([path]) => path.endsWith("errors-error-404.html")) as [
      string,
      string,
    ];
    const snippet = one(mount(html));
    const host = mount('<svg data-ok-illustration="error-404" data-ok-color="primary"></svg>');
    start();
    const drawn = one(host);
    expect(drawn.innerHTML.replace(/\s+/g, " ")).toBe(
      snippet.innerHTML.replace(/\s+/g, " ").replace(/> </g, "><").trim(),
    );
  });

  it("keeps authored artwork, a title and an author's accessible name", () => {
    const host = mount(`
      <svg data-ok-illustration="error-404" viewBox="0 0 10 10"><circle data-ok-tone="main" cx="5" cy="5" r="5"/></svg>
      <svg data-ok-illustration="error-500" role="img" aria-label="Server error"><title>Server error</title></svg>
      <svg data-ok-illustration="error-404" aria-labelledby="label"></svg><span id="label">Lost</span>`);
    start();
    const [authored, titled, labelled] = host.querySelectorAll("svg");
    expect(authored?.children).toHaveLength(1);
    expect(authored?.getAttribute("viewBox")).toBe("0 0 10 10");
    expect(authored?.getAttribute("aria-hidden")).toBe("true");
    expect(titled?.querySelector(":scope > title")?.textContent).toBe("Server error");
    expect(titled?.children.length).toBe(error500.nodes.length + 1);
    expect(titled?.hasAttribute("aria-hidden")).toBe(false);
    expect(labelled?.getAttribute("role")).toBe("img");
    expect(labelled?.hasAttribute("aria-hidden")).toBe(false);
  });

  it("leaves unknown names alone", () => {
    const host = mount('<svg data-ok-illustration="nope"></svg>');
    start();
    expect(one(host).children).toHaveLength(0);
    expect(runtime?.get<IllustrationInstance>(one(host), "illustration")?.illustration).toBe(
      undefined,
    );
  });

  it("applies data-ok-size through CSSOM and follows changes; invalid sizes fall back", async () => {
    const host = wide('<svg data-ok-illustration="error-404" data-ok-size="240"></svg>');
    start();
    const svg = one(host);
    expect(svg.style.getPropertyValue("--_ok-illustration-size")).toBe("240px");
    expect(css(svg).width).toBe("240px");
    expect(css(svg).height).toBe("180px");
    svg.setAttribute("data-ok-size", "10rem");
    await settle();
    expect(css(svg).width).toBe("160px");
    svg.setAttribute("data-ok-size", '"><img src=x onerror=alert(1)>');
    await settle();
    expect(svg.style.getPropertyValue("--_ok-illustration-size")).toBe("");
    expect(css(svg).width).toBe("480px");
  });

  it("redraws what it drew when the name changes, and cleans up on destroy", async () => {
    const host = mount('<svg data-ok-illustration="error-404" data-ok-size="100"></svg>');
    start();
    const svg = one(host);
    svg.setAttribute("data-ok-illustration", "error-500");
    await settle();
    expect(svg.children.length).toBe(error500.nodes.length);
    runtime?.destroy(host);
    expect(svg.style.getPropertyValue("--_ok-illustration-size")).toBe("");
  });

  it("invalid colors fall back to primary in CSS", () => {
    const host = mount(`
      <svg data-ok-illustration="error-404" data-ok-color="nope"></svg>
      <span style="color: var(--ok-palette-primary-main)">probe</span>`);
    start();
    const main = one(host).querySelector('[data-ok-tone="main"]:not([data-ok-stroke])') as Element;
    expect(css(main).fill).toBe(css(host.querySelector("span") as Element).color);
  });

  it("createIllustration draws only its own set", () => {
    const host = mount(
      '<svg data-ok-illustration="error-404"></svg><svg data-ok-illustration="error-500"></svg>',
    );
    start(createIllustration([error500]));
    const [first, second] = host.querySelectorAll("svg");
    expect(first?.children).toHaveLength(0);
    expect(second?.children.length).toBe(error500.nodes.length);
  });

  it("sizes authored artwork without its set and loads a lazy set once (ADR-0068 S5)", async () => {
    let loads = 0;
    let resolve: (set: typeof illustrations) => void = () => {};
    const lazy = createIllustration(() => {
      loads++;
      return new Promise((done) => {
        resolve = done;
      });
    });
    const host = wide(
      '<svg data-ok-illustration="error-404" data-ok-size="120" aria-hidden="true"><rect width="1" height="1"/></svg><svg data-ok-illustration="error-500" aria-hidden="true"></svg>',
    );
    start(lazy);
    const [authored, empty] = [...host.querySelectorAll("svg")] as [SVGSVGElement, SVGSVGElement];
    expect(authored.style.getPropertyValue("--_ok-illustration-size")).toBe("120px");
    await settle();
    const instance = runtime?.get<IllustrationInstance>(empty, "illustration");
    expect(loads).toBe(1);
    expect(empty.getAttribute("focusable")).toBe("false");
    expect(empty.children).toHaveLength(0);
    expect(instance?.illustration).toBeUndefined();
    resolve(illustrations);
    await settle();
    expect(loads).toBe(1);
    expect(instance?.illustration).toBe(error500);
    expect(empty.getAttribute("viewBox")).toBe(error500.viewBox);
    expect(empty.children.length).toBe(error500.nodes.length);
    expect(authored.querySelectorAll("rect")).toHaveLength(1);
  });
});

describe("@owlky/html/illustrations", () => {
  it("registers the illustration runtime on the page-wide runtime and starts it", async () => {
    const host = mount('<svg data-ok-illustration="error-404"></svg>');
    const entry = await import("../../illustrations.js");
    expect(entry.runtime).toBe(getRuntime());
    await settle();
    expect(one(host).children.length).toBe(error404.nodes.length);
    entry.runtime.stop();
  });
});
