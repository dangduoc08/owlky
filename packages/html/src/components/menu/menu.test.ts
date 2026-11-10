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
import type { MenuInstance } from "./menu.js";

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

describe("menu snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(5));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const menu of host.querySelectorAll("[data-ok-menu]")) {
      expect(menu.getAttribute("role")).toBe("menu");
      const standalone = !menu.parentElement?.hasAttribute("data-ok-popover");
      if (standalone) expect(menu.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(menu.hasAttribute("aria-labelledby") || menu.hasAttribute("aria-label")).toBe(true);
      for (const child of menu.children) {
        const submenu = child.hasAttribute("data-ok-menu-submenu");
        const item = submenu ? child.firstElementChild : child;
        if (submenu) {
          expect(child.getAttribute("role")).toBe("none");
          expect(item?.getAttribute("aria-haspopup")).toBe("menu");
          const popover = child.querySelector(":scope > [data-ok-popover]");
          expect(item?.getAttribute("aria-controls")).toBe(popover?.id);
        }
        expect(item?.getAttribute("role")).toBe("menuitem");
        if (!standalone) expect(item?.getAttribute("tabindex")).toBe("-1");
        expect(item?.hasAttribute("data-ok-menu-item")).toBe(true);
      }
    }
    for (const trigger of host.querySelectorAll("[data-ok-popover-open]"))
      expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations, closed and open", async (_, html) => {
    const host = mount(html);
    start();
    await expectNoAxeViolations(host);
    (host.querySelector("[data-ok-popover-open]") as HTMLElement | null)?.click();
    await settle();
    await expectNoAxeViolations(host);
  });
});

const markup = `
  <button type="button" id="b" aria-haspopup="menu" data-ok-popover-open="m">Open</button>
  <div id="m" popover="manual" data-ok-popover data-ok-placement="bottom-start">
    <ul data-ok-menu role="menu" aria-labelledby="b">
      <li data-ok-menu-item role="menuitem" tabindex="-1" aria-disabled="true">Off</li>
      <li data-ok-menu-item role="menuitem" tabindex="-1">Profile</li>
      <li data-ok-menu-item role="menuitem" tabindex="-1" data-ok-selected>My account</li>
      <li data-ok-menu-item role="menuitem" tabindex="-1">Logout</li>
    </ul>
  </div>
  <input id="next" aria-label="Next">`;

describe("menu runtime", () => {
  it("opens on the selected item; arrows, Home, End and typeahead move focus", async () => {
    const host = mount(markup);
    start();
    const trigger = host.querySelector("#b") as HTMLElement;
    await userEvent.click(trigger);
    expect(document.activeElement?.textContent).toBe("My account");
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("Logout");
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("Profile");
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement?.textContent).toBe("Logout");
    await userEvent.keyboard("{Home}");
    expect(document.activeElement?.textContent).toBe("Profile");
    await userEvent.keyboard("{End}");
    expect(document.activeElement?.textContent).toBe("Logout");
    await userEvent.keyboard("m");
    expect(document.activeElement?.textContent).toBe("My account");
    await userEvent.keyboard("{Control>}p{/Control}");
    expect(document.activeElement?.textContent).toBe("My account");
    await userEvent.keyboard("{Shift}");
    expect(document.activeElement?.textContent).toBe("My account");
  });

  it("Enter and a click choose an item: ok:menu:select, then it closes and focus returns", async () => {
    const host = mount(markup);
    start();
    const trigger = host.querySelector("#b") as HTMLElement;
    const popover = host.querySelector("#m") as HTMLElement;
    const chosen: string[] = [];
    host.addEventListener("ok:menu:select", (e) =>
      chosen.push(((e as CustomEvent).detail.item as Element).textContent ?? ""),
    );
    await userEvent.click(trigger);
    await userEvent.keyboard("{Enter}");
    expect(chosen).toEqual(["My account"]);
    expect(popover.hasAttribute("data-ok-open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
    await userEvent.click(trigger);
    await userEvent.click(host.querySelector("li:nth-child(4)") as HTMLElement);
    expect(chosen).toEqual(["My account", "Logout"]);
    await userEvent.click(trigger);
    (host.querySelector("li") as HTMLElement).click();
    expect(chosen).toHaveLength(2);
    host.addEventListener("ok:menu:select", (e) => e.preventDefault(), { once: true });
    await userEvent.keyboard(" ");
    expect(chosen).toHaveLength(3);
    expect(popover.hasAttribute("data-ok-open")).toBe(true);
  });

  it("Tab closes it; select() works without a popover", async () => {
    const host = mount(markup);
    const rt = start();
    const popover = host.querySelector("#m") as HTMLElement;
    await userEvent.click(host.querySelector("#b") as HTMLElement);
    await userEvent.keyboard("{Tab}");
    expect(popover.hasAttribute("data-ok-open")).toBe(false);
    const loose = mount(
      `<ul data-ok-menu role="menu" aria-label="L"><li role="menuitem" tabindex="-1">A</li></ul>`,
    );
    const menu = loose.querySelector("ul") as HTMLElement;
    const instance = rt.getOrCreate<MenuInstance>(menu, "menu") as MenuInstance;
    expect(instance.select(menu.firstElementChild as Element)).toBe(true);
    menu.focus();
    (menu.firstElementChild as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(menu.firstElementChild);
  });
});

const nested = `
  <button type="button" id="b" aria-haspopup="menu" data-ok-popover-open="m">Open</button>
  <div id="m" popover="manual" data-ok-popover data-ok-placement="bottom-start">
    <ul data-ok-menu role="menu" aria-labelledby="b">
      <li data-ok-menu-item role="menuitem" tabindex="-1">New</li>
      <li role="none" data-ok-menu-submenu>
        <div data-ok-menu-item role="menuitem" tabindex="-1" id="t" aria-haspopup="menu" aria-expanded="false" aria-controls="s">Share</div>
        <div id="s" popover="manual" data-ok-popover data-ok-placement="right-start">
          <ul data-ok-menu role="menu" aria-labelledby="t">
            <li data-ok-menu-item role="menuitem" tabindex="-1">Email</li>
            <li role="none" data-ok-menu-submenu>
              <div data-ok-menu-item role="menuitem" tabindex="-1" id="t2" aria-haspopup="menu" aria-expanded="false" aria-controls="s2">More</div>
              <div id="s2" popover="manual" data-ok-popover data-ok-placement="right-start">
                <ul data-ok-menu role="menu" aria-labelledby="t2">
                  <li data-ok-menu-item role="menuitem" tabindex="-1">Fax</li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </li>
      <li data-ok-menu-item role="menuitem" tabindex="-1">Delete</li>
    </ul>
  </div>
  <input id="next" aria-label="Next">`;

describe("submenus", () => {
  const open = (host: HTMLElement, id: string) =>
    (host.querySelector(`#${id}`) as HTMLElement).hasAttribute("data-ok-open");

  it("keyboard: ArrowRight / Enter open, ArrowLeft / Escape close, a choice closes every menu", async () => {
    const host = mount(nested);
    start();
    const chosen: string[] = [];
    host.addEventListener("ok:menu:select", (e) =>
      chosen.push(String((e as CustomEvent<{ item: Element }>).detail.item.textContent)),
    );
    await userEvent.click(host.querySelector("#b") as HTMLElement);
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    const share = host.querySelector("#t") as HTMLElement;
    expect(open(host, "s")).toBe(true);
    expect(share.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.textContent).toBe("Email");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(open(host, "s2")).toBe(true);
    expect(document.activeElement?.textContent).toBe("Fax");
    await userEvent.keyboard("{Escape}");
    expect(open(host, "s2")).toBe(false);
    expect(host.querySelector("#t2")?.getAttribute("aria-expanded")).toBe("false");
    await userEvent.keyboard("{ArrowLeft}");
    expect(open(host, "s")).toBe(false);
    expect(document.activeElement).toBe(share);
    await userEvent.keyboard(" ");
    expect(open(host, "s")).toBe(true);
    share.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.textContent).toBe("Email");
    share.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(open(host, "s")).toBe(false);
    await userEvent.keyboard("{ArrowUp}{ArrowRight}{Enter}");
    expect(chosen).toEqual(["Email"]);
    expect(open(host, "s")).toBe(false);
    expect(open(host, "m")).toBe(false);
  });

  it("clicks open; Tab, a press outside and closing the menu close every submenu", async () => {
    const host = mount(nested);
    start();
    await userEvent.click(host.querySelector("#b") as HTMLElement);
    await userEvent.click(host.querySelector("#t") as HTMLElement);
    expect(open(host, "s")).toBe(true);
    await userEvent.keyboard("{Tab}");
    expect(open(host, "s")).toBe(false);
    expect(open(host, "m")).toBe(false);
    await userEvent.click(host.querySelector("#b") as HTMLElement);
    await userEvent.click(host.querySelector("#t") as HTMLElement);
    await userEvent.click(host.querySelector("#next") as HTMLElement);
    expect(open(host, "s")).toBe(false);
    expect(open(host, "m")).toBe(false);
    await userEvent.click(host.querySelector("#b") as HTMLElement);
    await userEvent.click(host.querySelector("#t") as HTMLElement);
    await userEvent.click(host.querySelector("#b") as HTMLElement);
    expect(open(host, "s")).toBe(false);
    expect(host.querySelector("#t")?.getAttribute("aria-expanded")).toBe("false");
  });

  it("hover opens without moving focus and closes on another item; right to left mirrors", async () => {
    const host = mount(nested);
    start();
    await userEvent.click(host.querySelector("#b") as HTMLElement);
    const active = document.activeElement;
    await userEvent.hover(host.querySelector("#t") as HTMLElement);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(open(host, "s")).toBe(true);
    expect(document.activeElement).toBe(active);
    await userEvent.hover(host.querySelector("li") as HTMLElement);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(open(host, "s")).toBe(false);
    host.setAttribute("dir", "rtl");
    (host.querySelector("#t") as HTMLElement).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(open(host, "s")).toBe(true);
    expect(host.querySelector("#s")?.getAttribute("data-ok-placement")).toBe("left-start");
    await userEvent.keyboard("{ArrowRight}");
    expect(open(host, "s")).toBe(false);
    await expectNoAxeViolations(host);
  });

  it("menu options: variant, disableAutoFocusItem, disableListWrap", async () => {
    const host = mount(markup);
    start();
    const menu = host.querySelector("[data-ok-menu]") as HTMLElement;
    menu.setAttribute("data-ok-variant", "menu");
    await userEvent.click(host.querySelector("#b") as HTMLElement);
    expect(document.activeElement?.textContent).toBe("Profile");
    await userEvent.keyboard("{Escape}");
    menu.setAttribute("data-ok-disable-auto-focus-item", "");
    menu.setAttribute("tabindex", "-1");
    menu.setAttribute("data-ok-disable-list-wrap", "");
    await userEvent.click(host.querySelector("#b") as HTMLElement);
    expect(document.activeElement).toBe(menu);
    await userEvent.keyboard("{ArrowUp}{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("Logout");
  });
});
