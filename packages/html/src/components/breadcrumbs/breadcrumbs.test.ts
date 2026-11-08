import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
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
import type { BreadcrumbsInstance } from "./breadcrumbs.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

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

const trail = (attrs = "", labels = ["A", "B", "C", "D", "E"]) =>
  `<nav data-ok-breadcrumbs aria-label="breadcrumb" ${attrs}><ol data-ok-breadcrumbs-list>${labels
    .map((label, i) =>
      i === labels.length - 1
        ? `<li data-ok-breadcrumbs-item><span aria-current="page">${label}</span></li>`
        : `<li data-ok-breadcrumbs-item><a href="#${label}">${label}</a></li><li data-ok-breadcrumbs-separator aria-hidden="true">/</li>`,
    )
    .join("")}</ol></nav>`;

const visible = (host: Element) =>
  [...host.querySelectorAll("[data-ok-breadcrumbs-list] > li:not([hidden])")].map((li) =>
    li.hasAttribute("data-ok-breadcrumbs-separator")
      ? "|"
      : li.hasAttribute("data-ok-breadcrumbs-collapsed")
        ? "…"
        : (li.textContent ?? ""),
  );

describe("breadcrumbs snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(4));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const nav of host.querySelectorAll("[data-ok-breadcrumbs]")) {
      expect(nav.localName).toBe("nav");
      expect(nav.getAttribute("aria-label")).toBeTruthy();
      const list = nav.querySelector("ol") as HTMLOListElement;
      expect(list.hasAttribute("data-ok-breadcrumbs-list")).toBe(true);
      const children = [...list.children];
      children.forEach((li, i) => {
        expect(li.localName).toBe("li");
        // Items and separators alternate.
        expect(
          li.hasAttribute(i % 2 ? "data-ok-breadcrumbs-separator" : "data-ok-breadcrumbs-item"),
        ).toBe(true);
        if (i % 2) expect(li.getAttribute("aria-hidden")).toBe("true");
      });
      expect(list.lastElementChild?.querySelector('[aria-current="page"]')).not.toBeNull();
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

describe("breadcrumbs runtime", () => {
  it("collapses past data-ok-max-items and expands from the button", async () => {
    const host = mount(trail('data-ok-max-items="3" data-ok-expand-text="Show all"'));
    const rt = start();
    expect(visible(host)).toEqual(["A", "|", "…", "|", "E"]);
    const nav = host.querySelector("nav") as HTMLElement;
    const instance = rt.get<BreadcrumbsInstance>(nav, "breadcrumbs") as BreadcrumbsInstance;
    expect(instance.collapsed).toBe(true);
    const button = host.querySelector("[data-ok-breadcrumbs-expand]") as HTMLButtonElement;
    expect(button.type).toBe("button");
    expect(button.getAttribute("aria-label")).toBe("Show all");
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    await expectNoAxeViolations(host);
    const seen: Event[] = [];
    nav.addEventListener("ok:breadcrumbs:expand", (event) => seen.push(event));
    await userEvent.click(button);
    expect(seen).toHaveLength(1);
    expect(visible(host)).toEqual(["A", "|", "B", "|", "C", "|", "D", "|", "E"]);
    expect(document.activeElement?.textContent).toBe("B");
    expect(nav.hasAttribute("data-ok-expanded")).toBe(true);
    expect(instance.collapsed).toBe(false);
    expect(instance.expand()).toBe(true);
    // Re-mounting an expanded trail keeps it expanded.
    rt.destroy(host);
    rt.init(host);
    expect(visible(host)).toHaveLength(9);
  });

  it("defaults: 8 items, 1 before and 1 after; the default button name", () => {
    const labels = Array.from({ length: 9 }, (_, i) => `L${i}`);
    const host = mount(trail("", labels) + trail("", labels.slice(0, 8)));
    start();
    const [nine, eight] = host.querySelectorAll("nav") as unknown as HTMLElement[];
    expect(visible(nine as HTMLElement)).toEqual(["L0", "|", "…", "|", "L8"]);
    expect(nine?.querySelector("button")?.getAttribute("aria-label")).toBe("Show path");
    expect(visible(eight as HTMLElement)).toHaveLength(15);
  });

  it("before / after counts; invalid values use the defaults", () => {
    const host = mount(
      trail(
        'data-ok-max-items="2" data-ok-items-before-collapse="2" data-ok-items-after-collapse="2"',
      ) + trail('data-ok-max-items="x" data-ok-items-before-collapse="-3"'),
    );
    start();
    const [counted, invalid] = host.querySelectorAll("nav") as unknown as HTMLElement[];
    expect(visible(counted as HTMLElement)).toEqual(["A", "|", "B", "|", "…", "|", "D", "|", "E"]);
    expect(visible(invalid as HTMLElement)).toHaveLength(9);
  });

  it("expand is cancelable; markup collapsed by React is kept as is", () => {
    const host = mount(trail('data-ok-max-items="3"'));
    const rt = start();
    const nav = host.querySelector("nav") as HTMLElement;
    const instance = rt.get<BreadcrumbsInstance>(nav, "breadcrumbs") as BreadcrumbsInstance;
    nav.addEventListener("ok:breadcrumbs:expand", (event) => event.preventDefault(), {
      once: true,
    });
    expect(instance.expand()).toBe(false);
    expect(instance.collapsed).toBe(true);
    // A second mount doesn't collapse again (one button only).
    rt.destroy(host);
    rt.init(host);
    expect(host.querySelectorAll("[data-ok-breadcrumbs-collapsed]")).toHaveLength(1);
  });

  it("trails without separators or a list don't break", () => {
    const host = mount(`
      <nav data-ok-breadcrumbs data-ok-max-items="1" aria-label="a"><ol data-ok-breadcrumbs-list>
        <li data-ok-breadcrumbs-item><a href="#a">A</a></li><li data-ok-breadcrumbs-item><a href="#b">B</a></li><li data-ok-breadcrumbs-item><span aria-current="page">C</span></li>
      </ol></nav>
      <nav data-ok-breadcrumbs aria-label="b"></nav>`);
    const rt = start();
    const [first, empty] = host.querySelectorAll("nav") as unknown as HTMLElement[];
    expect(visible(first as HTMLElement)).toEqual(["A", "…", "C"]);
    const instance = rt.get<BreadcrumbsInstance>(
      first as Element,
      "breadcrumbs",
    ) as BreadcrumbsInstance;
    expect(instance.expand()).toBe(true);
    expect(visible(first as HTMLElement)).toEqual(["A", "B", "C"]);
    expect(rt.get<BreadcrumbsInstance>(empty as Element, "breadcrumbs")?.collapsed).toBe(false);
  });

  it("clicks elsewhere are ignored; React-owned trails are left alone", async () => {
    const host = mount(
      trail('data-ok-max-items="3"') + trail('data-ok-max-items="3" data-ok-runtime="off"'),
    );
    start();
    const [own, react] = host.querySelectorAll("nav") as unknown as HTMLElement[];
    await userEvent.click(own?.querySelector('[aria-current="page"]') as HTMLElement);
    expect(visible(own as HTMLElement)).toHaveLength(5);
    expect(visible(react as HTMLElement)).toHaveLength(9);
    await settle();
  });
});
