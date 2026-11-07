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
  it("covers every story group", () => expect(snippets).toHaveLength(3));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const menu of host.querySelectorAll("[data-ok-menu]")) {
      expect(menu.getAttribute("role")).toBe("menu");
      expect(menu.parentElement?.hasAttribute("data-ok-popover")).toBe(true);
      expect(menu.hasAttribute("aria-labelledby") || menu.hasAttribute("aria-label")).toBe(true);
      for (const item of menu.children) {
        expect(item.getAttribute("role")).toBe("menuitem");
        expect(item.getAttribute("tabindex")).toBe("-1");
        expect(item.hasAttribute("data-ok-menu-item")).toBe(true);
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
    (host.querySelector("[data-ok-popover-open]") as HTMLElement).click();
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
