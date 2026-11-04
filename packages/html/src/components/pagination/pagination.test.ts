import {
  paginationColors,
  paginationShapes,
  paginationSizes,
  paginationVariants,
} from "@owlky/core";
import { afterEach, describe, expect, it, vi } from "vitest";
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
import { type PaginationInstance, pagination } from "./pagination.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const nav = (attrs: string, buttons = ["previous", "next"]) => `
  <nav aria-label="Pages" data-ok-pagination ${attrs}><ul>${buttons
    .map(
      (type) =>
        `<li><button type="button" data-ok-pagination-item data-ok-type="${type}" aria-label="${type}">${type}</button></li>`,
    )
    .join("")}</ul></nav>`;

const pages = (host: Element) =>
  [...host.querySelectorAll<HTMLButtonElement>('[data-ok-type="page"]')].map(
    (b) => `${b.textContent}${b.getAttribute("aria-current") ? "*" : ""}`,
  );
const shape = (host: Element) =>
  [...host.querySelectorAll("li > *")].map((el) =>
    el.hasAttribute("data-ok-pagination-ellipsis")
      ? "…"
      : el.getAttribute("data-ok-type") === "page"
        ? `${el.textContent}${el.getAttribute("aria-current") ? "*" : ""}`
        : (el.getAttribute("data-ok-type") as string),
  );
const instanceOf = (host: Element) =>
  runtime?.get<PaginationInstance>(
    host.querySelector("[data-ok-pagination]"),
    "pagination",
  ) as PaginationInstance;

describe("pagination snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(10));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-pagination]")) {
      expect(root.localName).toBe("nav");
      expect(root.getAttribute("aria-label")).toBeTruthy();
      expect(paginationVariants).toContain(root.dataset["okVariant"]);
      expect(paginationColors).toContain(root.dataset["okColor"]);
      expect(paginationShapes).toContain(root.dataset["okShape"]);
      expect(paginationSizes).toContain(root.dataset["okSize"]);
      expect(root.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
      for (const item of root.querySelectorAll("li > *"))
        expect(
          item.matches(
            "[data-ok-pagination-item], [data-ok-pagination-ellipsis][aria-hidden='true']",
          ),
        ).toBe(true);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
  });

  it.each(snippets.filter(([path]) => !path.includes("table")))(
    "%s: the runtime rebuilds exactly the authored markup",
    (_, html) => {
      const host = mount(html);
      const before = host.innerHTML.replace(/\s+</g, "<").replace(/>\s+/g, ">");
      start();
      const after = host.innerHTML.replace(/\s+</g, "<").replace(/>\s+/g, ">");
      expect(after).toBe(before);
    },
  );
});

describe("pagination styles", () => {
  it.each([
    ["text", "primary", "background-color", "rgb(0, 167, 111)"],
    ["text", "standard", "background-color", "rgb(28, 37, 46)"],
    ["outlined", "error", "border-top-color", "rgb(255, 86, 48)"],
    ["soft", "info", "color", "rgb(0, 108, 156)"],
  ])("%s / %s: the current page uses the color (%s)", (variant, color, property, expected) => {
    const host = mount(
      `<nav aria-label="P" data-ok-pagination data-ok-variant="${variant}" data-ok-color="${color}"><ul><li><button type="button" data-ok-pagination-item data-ok-type="page" aria-current="page">1</button></li></ul></nav>`,
    );
    const current = host.querySelector("[aria-current]") as HTMLElement;
    expect(getComputedStyle(current).getPropertyValue(property)).toBe(expected);
  });
});

describe("pagination runtime", () => {
  it("page, previous / next / first / last clicks rebuild the range and emit change", async () => {
    const host = mount(
      nav('data-ok-count="10" data-ok-page="1"', ["first", "previous", "next", "last"]),
    );
    start();
    expect(shape(host)).toEqual([
      "first",
      "previous",
      "1*",
      "2",
      "3",
      "4",
      "5",
      "…",
      "10",
      "next",
      "last",
    ]);
    const events: number[] = [];
    host.addEventListener("ok:pagination:change", (e) =>
      events.push((e as CustomEvent).detail.page),
    );
    await userEvent.click(host.querySelector('[value="5"]') as HTMLElement);
    expect(shape(host)).toEqual([
      "first",
      "previous",
      "1",
      "…",
      "4",
      "5*",
      "6",
      "…",
      "10",
      "next",
      "last",
    ]);
    expect(host.querySelector("nav")?.getAttribute("data-ok-page")).toBe("5");
    await userEvent.click(host.querySelector('[aria-label="next"]') as HTMLElement);
    await userEvent.click(host.querySelector('[aria-label="last"]') as HTMLElement);
    expect((host.querySelector('[aria-label="next"]') as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(host.querySelector('[aria-label="previous"]') as HTMLElement);
    await userEvent.click(host.querySelector('[aria-label="first"]') as HTMLElement);
    expect(events).toEqual([5, 6, 10, 9, 1]);
    expect(instanceOf(host).page).toBe(1);
  });

  it("keeps focus on the clicked control (keyboard)", async () => {
    const host = mount(nav('data-ok-count="10"'));
    start();
    const next = host.querySelector('[aria-label="next"]') as HTMLElement;
    next.focus();
    await userEvent.keyboard("{Enter}");
    expect(document.activeElement).toBe(next);
    (host.querySelector('[value="4"]') as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    expect(document.activeElement?.getAttribute("value")).toBe("4");
    expect(document.activeElement?.getAttribute("aria-current")).toBe("page");
    // Previous becomes disabled on page 1: focus moves to the current page.
    instanceOf(host).setPage(2);
    const previous = host.querySelector('[aria-label="previous"]') as HTMLElement;
    previous.focus();
    await userEvent.keyboard("{Enter}");
    expect(document.activeElement?.getAttribute("aria-current")).toBe("page");
  });

  it("change can be prevented; out-of-range and current pages are refused", async () => {
    const host = mount(nav('data-ok-count="3"'));
    start();
    host.addEventListener("ok:pagination:change", (e) => e.preventDefault(), { once: true });
    await userEvent.click(host.querySelector('[value="2"]') as HTMLElement);
    expect(pages(host)).toEqual(["1*", "2", "3"]);
    const instance = instanceOf(host);
    expect([
      instance.setPage(0),
      instance.setPage(4),
      instance.setPage(1.5),
      instance.setPage(1),
    ]).toEqual([false, false, false, false]);
    expect(instance.setPage(3)).toBe(true);
    expect(instance.count).toBe(3);
  });

  it("sibling / boundary counts, label templates, disabled and refresh", () => {
    const host = mount(
      nav(
        'data-ok-count="11" data-ok-page="6" data-ok-sibling-count="0" data-ok-boundary-count="2" data-ok-label-page="Trang {page}" data-ok-label-current="Trang {page}, đang xem"',
      ),
    );
    start();
    expect(shape(host)).toEqual(["previous", "1", "2", "…", "6*", "…", "10", "11", "next"]);
    expect(host.querySelector('[aria-current="page"]')?.getAttribute("aria-label")).toBe(
      "Trang 6, đang xem",
    );
    expect(host.querySelector('[value="2"]')?.getAttribute("aria-label")).toBe("Trang 2");
    const root = host.querySelector("nav") as HTMLElement;
    root.setAttribute("data-ok-count", "4");
    root.setAttribute("data-ok-disabled", "");
    instanceOf(host).refresh();
    expect(pages(host)).toEqual(["1", "2", "3", "4*"]);
    expect([...host.querySelectorAll("button")].every((b) => b.disabled)).toBe(true);
  });

  it("invalid attributes fall back to defaults; markup without a list is ignored", () => {
    const host = mount(
      `${nav('data-ok-count="abc" data-ok-page="-3" data-ok-sibling-count="x" data-ok-boundary-count=""', [])}<nav data-ok-pagination aria-label="Empty"></nav>`,
    );
    start();
    expect(shape(host)).toEqual(["1*"]);
    const empty = runtime?.get<PaginationInstance>(
      host.querySelector('[aria-label="Empty"]'),
      "pagination",
    );
    expect(empty?.page).toBe(1);
    expect(empty?.setPage(1)).toBe(false);
    empty?.refresh();
  });

  it("ignores unknown item types and React roots; is registered", async () => {
    const host = mount(
      `${nav('data-ok-count="3"', ["bogus"])}${nav('data-ok-count="3" data-ok-runtime="off"')}`,
    );
    start();
    const spy = vi.fn();
    host.addEventListener("ok:pagination:change", spy);
    for (const button of host.querySelectorAll<HTMLElement>(
      '[aria-label="bogus"], [data-ok-runtime] [aria-label="next"]',
    ))
      await userEvent.click(button);
    // An item whose type was changed after rendering is ignored.
    const item = host.querySelector('[value="2"]') as HTMLElement;
    item.setAttribute("data-ok-type", "bogus");
    await userEvent.click(item);
    expect(spy).not.toHaveBeenCalled();
    expect(components).toContain(pagination);
  });
});
