import { listSubheaderColors } from "@owlky/core";
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
} from "../../test-utils.js";
import { components } from "../index.js";
import type { ListInstance } from "./list.js";

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

describe("list snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(6));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const list of host.querySelectorAll("[data-ok-list]")) {
      expect(list.localName).toBe("ul");
      for (const child of list.children) {
        expect(child.localName).toBe("li");
        expect(
          child.hasAttribute("data-ok-list-item") || child.hasAttribute("data-ok-list-subheader"),
        ).toBe(true);
      }
    }
    for (const sub of host.querySelectorAll<HTMLElement>("[data-ok-list-subheader]")) {
      expect(listSubheaderColors).toContain(sub.dataset["okColor"]);
      expect(sub.parentElement?.firstElementChild).toBe(sub);
    }
    for (const button of host.querySelectorAll("[data-ok-list-item-button]")) {
      expect(button.parentElement?.hasAttribute("data-ok-disable-padding")).toBe(true);
      // No controls inside a row button.
      expect(button.querySelector("input, button, a, select, textarea")).toBeNull();
    }
    for (const toggle of host.querySelectorAll("[aria-controls][aria-expanded]")) {
      const target = host.querySelector(`#${toggle.getAttribute("aria-controls")}`);
      expect(target?.hasAttribute("data-ok-list")).toBe(true);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

describe("list runtime", () => {
  const nested = (id: string) => `
    <ul data-ok-list>
      <li data-ok-list-item data-ok-disable-padding>
        <button type="button" data-ok-list-item-button aria-expanded="true" aria-controls="${id}">Inbox</button>
        <ul data-ok-list data-ok-disable-padding id="${id}">
          <li data-ok-list-item data-ok-disable-padding><button type="button" data-ok-list-item-button>Starred</button></li>
        </ul>
      </li>
    </ul>`;

  it("a click flips aria-expanded and the nested list's hidden; ok:list:toggle reports it", async () => {
    const host = mount(nested("n1"));
    start();
    const button = host.querySelector<HTMLElement>("[aria-controls]") as HTMLElement;
    const list = host.querySelector<HTMLElement>("#n1") as HTMLElement;
    const seen: unknown[] = [];
    host.addEventListener("ok:list:toggle", (event) => seen.push((event as CustomEvent).detail));
    await userEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(list.hidden).toBe(true);
    expect(getComputedStyle(list).display).toBe("none");
    expect(seen).toEqual([{ open: false, list }]);
    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(list.hidden).toBe(false);
  });

  it("toggle is cancelable; the instance method opens, closes and ignores foreign buttons", () => {
    const host = mount(nested("n2") + nested("n3"));
    const rt = start();
    const lists = host.querySelectorAll<HTMLElement>("[data-ok-list]");
    const first = lists[0] as HTMLElement;
    const button = first.querySelector("[aria-controls]") as HTMLElement;
    const instance = rt.get<ListInstance>(first, "list") as ListInstance;
    expect(instance.toggle(button, true)).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(instance.toggle(button, false)).toBe(true);
    expect((host.querySelector("#n2") as HTMLElement).hidden).toBe(true);
    first.addEventListener("ok:list:toggle", (event) => event.preventDefault(), { once: true });
    expect(instance.toggle(button)).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    const foreign = lists[2]?.querySelector("[aria-controls]") as HTMLElement;
    expect(instance.toggle(foreign)).toBe(false);
    expect(instance.toggle(first.querySelector("[data-ok-list-item]") as Element)).toBe(false);
  });

  it("ignores buttons that name no list, and React-owned lists", async () => {
    const host = mount(`
      <ul data-ok-list>
        <li data-ok-list-item data-ok-disable-padding>
          <button type="button" data-ok-list-item-button aria-expanded="false" aria-controls="missing">A</button>
        </li>
        <li data-ok-list-item data-ok-disable-padding>
          <button type="button" data-ok-list-item-button aria-expanded="false" aria-controls="">B</button>
        </li>
        <li data-ok-list-item data-ok-disable-padding>
          <button type="button" data-ok-list-item-button aria-expanded="false" aria-controls="plain">C</button>
          <div id="plain" hidden>Not a list</div>
        </li>
      </ul>
      <ul data-ok-list data-ok-runtime="off">
        <li data-ok-list-item data-ok-disable-padding>
          <button type="button" data-ok-list-item-button aria-expanded="true" aria-controls="react">R</button>
          <ul data-ok-list id="react"><li data-ok-list-item>x</li></ul>
        </li>
      </ul>`);
    start();
    for (const button of host.querySelectorAll<HTMLElement>("button"))
      await userEvent.click(button);
    const [a, b, c, r] = host.querySelectorAll("button");
    expect(a?.getAttribute("aria-expanded")).toBe("false");
    expect(b?.getAttribute("aria-expanded")).toBe("false");
    expect(c?.getAttribute("aria-expanded")).toBe("false");
    expect((host.querySelector("#plain") as HTMLElement).hidden).toBe(true);
    expect(r?.getAttribute("aria-expanded")).toBe("true");
  });
});
