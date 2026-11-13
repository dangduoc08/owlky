import { defaultTheme, themeToCss } from "@owlky/tokens";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import type { Monaco } from "./loader.js";
import { applyTheme, OWLKY_THEMES, owlkyTheme, schemeOf, themeClient, toHex } from "./theme.js";

const style = document.createElement("style");
beforeEach(() => {
  style.textContent = themeToCss(defaultTheme);
  document.head.append(style);
});
afterEach(() => {
  style.remove();
  cleanupDom();
  document.documentElement.removeAttribute("data-ok-theme");
  document.documentElement.classList.remove("dark");
});

function fakeMonaco() {
  const defineTheme = vi.fn();
  const setTheme = vi.fn();
  return {
    monaco: { editor: { defineTheme, setTheme } } as unknown as Monaco,
    defineTheme,
    setTheme,
  };
}
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("toHex", () => {
  it("converts computed colors", () => {
    expect(toHex("rgb(97, 95, 255)")).toBe("#615fff");
    expect(toHex("rgba(97, 95, 255, 0.5)")).toBe("#615fff80");
    expect(toHex("rgb(0 167 111 / 50%)")).toBe("#00a76f80");
    expect(toHex("color(srgb 1 0 0.5 / 0.2)")).toBe("#ff008033");
    expect(toHex("color(srgb 0 0 0)")).toBe("#000000");
    expect(toHex("color(srgb 1e999 0 0)")).toBeNull();
    expect(toHex("oklch(0.5 0.1 120)")).toBeNull();
  });
});

describe("Owlky themes", () => {
  it("are built from the tokens of the scope and scheme", () => {
    const host = mount('<div id="a"></div><div data-ok-theme="dark"><div id="b"></div></div>');
    const light = owlkyTheme(host.querySelector("#a") as Element, "light");
    const dark = owlkyTheme(host.querySelector("#b") as Element, "dark");
    expect(light.base).toBe("vs");
    expect(dark.base).toBe("vs-dark");
    expect(light.colors["editor.background"]).toBe("#ffffff");
    expect(dark.colors["editor.background"]).toBe("#18181b");
    // Syntax colors are the AA `-text` tones of each scheme.
    expect(light.rules.find((rule) => rule.token === "keyword")?.foreground).toBe("7008e7");
    expect(dark.rules.find((rule) => rule.token === "keyword")?.foreground).toBe("c4b4ff");
    // The probe is removed.
    expect(host.querySelector("[data-ok-theme='light']")).toBeNull();
  });

  it("follow token overrides of the scope", () => {
    // A color override reaches nested scopes when it is declared on them too (ADR-0072): the
    // theme's probe is a `data-ok-theme` scope inside the element.
    const host = mount(
      '<style>#o, #o [data-ok-theme] { --ok-palette-primary-main: #078DEE; }</style><div id="o"><div id="a"></div></div>',
    );
    const theme = owlkyTheme(host.querySelector("#a") as Element, "light");
    expect(theme.colors["editorCursor.foreground"]).not.toBe("#615fff");
  });

  it("reads the scheme of nested scopes", () => {
    const host = mount(
      '<div data-ok-theme="dark"><div id="d"></div><div data-ok-theme="light"><div id="l"></div></div></div>',
    );
    expect(schemeOf(host.querySelector("#d") as Element)).toBe("dark");
    expect(schemeOf(host.querySelector("#l") as Element)).toBe("light");
  });

  it("auto applies the scope's Owlky theme; other names go to Monaco", () => {
    const host = mount('<div data-ok-theme="dark"><div id="a"></div></div>');
    const element = host.querySelector("#a") as Element;
    const { monaco, defineTheme, setTheme } = fakeMonaco();
    expect(applyTheme(monaco, element, "auto")).toBe(OWLKY_THEMES.dark);
    expect(defineTheme).toHaveBeenCalledTimes(2);
    expect(setTheme).toHaveBeenLastCalledWith("owlky-dark");
    expect(applyTheme(monaco, element, "owlky-light")).toBe("owlky-light");
    expect(applyTheme(monaco, element, "vs-dark")).toBe("vs-dark");
    expect(defineTheme).toHaveBeenCalledTimes(4);
    expect(setTheme).toHaveBeenLastCalledWith("vs-dark");
  });
});

describe("themeClient", () => {
  it("re-applies the current editor's theme when scopes change", async () => {
    const host = mount('<div id="a"></div><div id="b" data-ok-theme="dark"></div>');
    const { monaco, setTheme } = fakeMonaco();
    const a = themeClient({
      element: host.querySelector("#a") as Element,
      monaco,
      theme: () => "auto",
    });
    const b = themeClient({
      element: host.querySelector("#b") as Element,
      monaco,
      theme: () => "auto",
    });
    a.use();
    expect(setTheme).toHaveBeenLastCalledWith("owlky-light");
    b.use();
    expect(setTheme).toHaveBeenLastCalledWith("owlky-dark");
    // A scope change re-applies the current (last used) editor's theme once.
    setTheme.mockClear();
    (host.querySelector("#b") as Element).setAttribute("data-ok-theme", "light");
    await flush();
    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenLastCalledWith("owlky-light");

    // Releasing the current editor hands the theme to the remaining one.
    b.release();
    setTheme.mockClear();
    document.documentElement.classList.add("dark");
    await flush();
    expect(setTheme).toHaveBeenLastCalledWith("owlky-dark");
    // Without editors nothing is observed any more.
    a.release();
    setTheme.mockClear();
    document.documentElement.setAttribute("data-ok-theme", "light");
    await flush();
    expect(setTheme).not.toHaveBeenCalled();
  });

  it("batches changes and skips them once every editor is gone", async () => {
    const host = mount('<div id="a"></div>');
    const { monaco, setTheme } = fakeMonaco();
    const element = host.querySelector("#a") as Element;
    const a = themeClient({ element, monaco, theme: () => "auto" });
    const b = themeClient({ element, monaco, theme: () => "vs" });
    a.use();
    // Releasing an editor that isn't current keeps the current one.
    b.release();
    setTheme.mockClear();
    // Two observers in one task: one refresh.
    document.documentElement.setAttribute("data-ok-theme", "dark");
    document.documentElement.classList.add("dark");
    await flush();
    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenLastCalledWith("owlky-dark");
    // A change scheduled just before the last editor goes away is dropped.
    setTheme.mockClear();
    document.documentElement.setAttribute("data-ok-theme", "light");
    await Promise.resolve();
    a.release();
    await flush();
    expect(setTheme).not.toHaveBeenCalled();
  });
});
