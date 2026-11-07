import { afterEach, describe, expect, it } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import { createTypeahead, initialMenuItem, menuItems, menuKeyTarget } from "./menu-navigation.js";

afterEach(cleanupDom);

const markup = `
  <ul role="menu" id="m">
    <li role="menuitem" aria-disabled="true">Show some love</li>
    <li role="menuitem">Profile</li>
    <li role="menuitem">My account</li>
    <li role="menuitem" data-ok-selected>Preferences</li>
    <li role="menuitem">Logout</li>
    <li><ul role="menu"><li role="menuitem">Nested</li></ul></li>
  </ul>
  <ul role="menu" id="empty"></ul>`;

const setup = () => {
  mount(markup);
  const menu = document.getElementById("m") as HTMLElement;
  const items = menuItems(menu);
  return { menu, items };
};

describe("menu navigation", () => {
  it("lists enabled items of this menu only; initial = selected, else first", () => {
    const { menu, items } = setup();
    expect(items.map((i) => i.textContent)).toEqual([
      "Profile",
      "My account",
      "Preferences",
      "Logout",
    ]);
    expect(initialMenuItem(menu)?.textContent).toBe("Preferences");
    items[2]?.removeAttribute("data-ok-selected");
    expect(initialMenuItem(menu)?.textContent).toBe("Profile");
    expect(initialMenuItem(document.getElementById("empty") as HTMLElement)).toBeNull();
  });

  it("arrows wrap; Home / End; other keys → null", () => {
    const { menu, items } = setup();
    const [first, , , last] = items;
    expect(menuKeyTarget(menu, null, "ArrowDown")).toBe(first);
    expect(menuKeyTarget(menu, last as HTMLElement, "ArrowDown")).toBe(first);
    expect(menuKeyTarget(menu, first as HTMLElement, "ArrowUp")).toBe(last);
    expect(menuKeyTarget(menu, null, "ArrowUp")).toBe(last);
    expect(menuKeyTarget(menu, items[2] as HTMLElement, "ArrowUp")).toBe(items[1]);
    expect(menuKeyTarget(menu, items[1] as HTMLElement, "Home")).toBe(first);
    expect(menuKeyTarget(menu, first as HTMLElement, "End")).toBe(last);
    expect(menuKeyTarget(menu, first as HTMLElement, "Tab")).toBeNull();
    expect(menuKeyTarget(menu, first as HTMLElement, "p")).toBeNull();
    expect(
      menuKeyTarget(document.getElementById("empty") as HTMLElement, null, "ArrowDown"),
    ).toBeNull();
  });

  it("typeahead: prefix within the timeout, cycling a repeated letter, reset after it", () => {
    const { menu, items } = setup();
    let now = 0;
    const typeahead = createTypeahead(500, () => now);
    const [profile, account, preferences, logout] = items;
    expect(menuKeyTarget(menu, profile as HTMLElement, "p", typeahead)).toBe(preferences);
    now += 100;
    expect(menuKeyTarget(menu, preferences as HTMLElement, "p", typeahead)).toBe(profile);
    now += 1000;
    expect(menuKeyTarget(menu, profile as HTMLElement, "M", typeahead)).toBe(account);
    now += 100;
    expect(menuKeyTarget(menu, account as HTMLElement, "y", typeahead)).toBe(account);
    now += 1000;
    expect(menuKeyTarget(menu, null, "l", typeahead)).toBe(logout);
    now += 1000;
    expect(menuKeyTarget(menu, null, "z", typeahead)).toBeNull();
    expect(menuKeyTarget(menu, null, " ", typeahead)).toBeNull();
    expect(createTypeahead().match(items, null, "l")).toBe(logout);
  });
});
