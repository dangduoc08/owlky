import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createSubmenuHover,
  createTypeahead,
  initialMenuItem,
  isSubmenuTrigger,
  menuItems,
  menuKeyTarget,
  openSubmenuTriggers,
  parentMenuTrigger,
  submenuKeyAction,
  submenuPlacement,
} from "./menu-navigation.js";

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

const nested = `
  <ul role="menu" id="root">
    <li role="menuitem" id="a">Copy</li>
    <li role="none" data-ok-menu-submenu>
      <div role="menuitem" id="t" aria-haspopup="menu" aria-expanded="false">Share</div>
      <div><ul role="menu" id="sub"><li role="menuitem" id="s1">Email</li></ul></div>
    </li>
    <li role="none" data-ok-menu-submenu>
      <div role="menuitem" id="t2" aria-haspopup="menu" aria-expanded="true" aria-disabled="true">Off</div>
      <div><ul role="menu" id="sub2"><li role="menuitem">Never</li></ul></div>
    </li>
  </ul>`;
const byId = (id: string) => document.getElementById(id) as HTMLElement;

describe("menu options", () => {
  it("variant, disableAutoFocusItem, disabledItemsFocusable, disableListWrap", () => {
    const { menu, items } = setup();
    menu.setAttribute("data-ok-variant", "menu");
    expect(initialMenuItem(menu)?.textContent).toBe("Profile");
    menu.setAttribute("data-ok-disable-auto-focus-item", "");
    expect(initialMenuItem(menu)).toBe(menu);
    menu.setAttribute("data-ok-disabled-items-focusable", "");
    expect(menuItems(menu)[0]?.textContent).toBe("Show some love");
    menu.removeAttribute("data-ok-disabled-items-focusable");
    menu.setAttribute("data-ok-disable-list-wrap", "");
    const [first, , , last] = items;
    expect(menuKeyTarget(menu, last as HTMLElement, "ArrowDown")).toBe(last);
    expect(menuKeyTarget(menu, first as HTMLElement, "ArrowUp")).toBe(first);
    expect(menuKeyTarget(menu, null, "ArrowUp")).toBe(last);
  });
});

describe("submenus", () => {
  it("triggers, parents, open triggers, keys and placement (mirrored right to left)", () => {
    mount(nested);
    const root = byId("root");
    const sub = byId("sub");
    expect(isSubmenuTrigger(byId("t"))).toBe(true);
    expect(isSubmenuTrigger(byId("a"))).toBe(false);
    expect(isSubmenuTrigger(null)).toBe(false);
    expect(parentMenuTrigger(sub)).toBe(byId("t"));
    expect(parentMenuTrigger(root)).toBeNull();
    expect(openSubmenuTriggers(root)).toEqual([]);
    byId("t").setAttribute("aria-expanded", "true");
    expect(openSubmenuTriggers(root)).toEqual([byId("t")]);
    expect(submenuKeyAction(root, byId("t"), "ArrowRight")).toBe("open");
    expect(submenuKeyAction(root, byId("t"), "Enter")).toBe("open");
    expect(submenuKeyAction(root, byId("t"), " ")).toBe("open");
    expect(submenuKeyAction(root, byId("t2"), "ArrowRight")).toBeNull();
    expect(submenuKeyAction(root, byId("a"), "ArrowRight")).toBeNull();
    expect(submenuKeyAction(root, byId("a"), "ArrowLeft")).toBeNull();
    expect(submenuKeyAction(sub, byId("s1"), "ArrowLeft")).toBe("close");
    expect(submenuPlacement(byId("t"))).toBe("right-start");
    root.setAttribute("dir", "rtl");
    expect(submenuKeyAction(root, byId("t"), "ArrowLeft")).toBe("open");
    expect(submenuKeyAction(sub, byId("s1"), "ArrowRight")).toBe("close");
    expect(submenuPlacement(byId("t"))).toBe("left-start");
  });

  it("hover intent: resting opens a trigger's submenu, another item closes it, moving on cancels", () => {
    vi.useFakeTimers();
    try {
      mount(nested);
      const onOpen = vi.fn();
      const onClose = vi.fn();
      const hover = createSubmenuHover({ onOpen, onClose });
      hover.over(byId("t"));
      vi.advanceTimersByTime(99);
      expect(onOpen).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onOpen).toHaveBeenCalledWith(byId("t"));
      byId("t").setAttribute("aria-expanded", "true");
      hover.over(byId("t"));
      hover.over(byId("s1"));
      vi.advanceTimersByTime(200);
      expect(onClose).not.toHaveBeenCalled();
      hover.over(byId("a"));
      hover.over(byId("t"));
      vi.advanceTimersByTime(200);
      expect(onClose).not.toHaveBeenCalled();
      hover.over(byId("a"));
      vi.advanceTimersByTime(100);
      expect(onClose).toHaveBeenCalledWith(byId("t"));
      hover.over(byId("t2"));
      hover.over(document.body);
      hover.over(byId("t"));
      hover.cancel();
      vi.advanceTimersByTime(200);
      expect(onOpen).toHaveBeenCalledTimes(1);
      // A menu that closed while the timer ran doesn't open a submenu.
      const paper = document.createElement("div");
      paper.setAttribute("data-ok-popover", "");
      byId("root").before(paper);
      paper.append(byId("root"));
      byId("t").setAttribute("aria-expanded", "false");
      hover.over(byId("t"));
      vi.advanceTimersByTime(100);
      expect(onOpen).toHaveBeenCalledTimes(1);
      paper.setAttribute("data-ok-open", "");
      hover.over(byId("t"));
      vi.advanceTimersByTime(100);
      expect(onOpen).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
