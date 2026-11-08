import { tabsOptions } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
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
import type { TabsInstance } from "./tabs.js";

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

const markup = (id: string, extra = "", tabs = ["One", "Two", "Three"], disabled = [2]) => `
  <div data-ok-tabs data-ok-variant="standard" data-ok-orientation="horizontal" ${extra}>
    <div data-ok-tabs-scroller>
      <div role="tablist" data-ok-tabs-list aria-label="${id}">
        ${tabs
          .map(
            (label, i) =>
              `<button type="button" role="tab" data-ok-tab id="${id}-t${i}" aria-controls="${id}-p${i}" value="v${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"${disabled.includes(i) ? " disabled" : ""}><span data-ok-tab-label>${label}</span></button>`,
          )
          .join("")}
      </div>
      <span data-ok-tabs-indicator></span>
    </div>
  </div>
  ${tabs.map((label, i) => `<div role="tabpanel" data-ok-tab-panel id="${id}-p${i}" aria-labelledby="${id}-t${i}" tabindex="0"${i === 0 ? "" : " hidden"}>${label} panel</div>`).join("")}`;

const tab = (host: Element, i: number) => host.querySelector(`[value="v${i}"]`) as HTMLElement;
const panel = (host: Element, id: string, i: number) =>
  host.querySelector(`#${id}-p${i}`) as HTMLElement;

describe("tabs snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(14));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-tabs]")) {
      expect(tabsOptions.options.variant.values).toContain(root.dataset["okVariant"]);
      const list = root.querySelector('[role="tablist"]') as HTMLElement;
      expect(list.hasAttribute("data-ok-tabs-list")).toBe(true);
      expect(list.hasAttribute("aria-label") || list.hasAttribute("aria-labelledby")).toBe(true);
      const tabs = [...list.children];
      expect(tabs.every((t) => t.getAttribute("role") === "tab" && t.localName === "button")).toBe(
        true,
      );
      expect(tabs.filter((t) => t.getAttribute("tabindex") === "0")).toHaveLength(1);
      expect(tabs.filter((t) => t.getAttribute("aria-selected") === "true").length).toBeLessThan(2);
      for (const t of tabs)
        expect(t.textContent?.trim() || t.getAttribute("aria-label"), t.outerHTML).toBeTruthy();
      expect(root.querySelector("[data-ok-tabs-indicator]")).not.toBeNull();
      const buttons = root.querySelectorAll(":scope > [data-ok-tabs-scroll-button]");
      expect(buttons.length).toBe(root.dataset["okVariant"] === "scrollable" ? 2 : 0);
      for (const button of buttons) expect(button.getAttribute("aria-hidden")).toBe("true");
    }
    for (const svg of host.querySelectorAll("svg"))
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    for (const target of host.querySelectorAll('[role="tab"][aria-controls]')) {
      const id = target.getAttribute("aria-controls");
      expect(host.querySelector(`#${id}`)?.getAttribute("aria-labelledby")).toBe(target.id);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("tabs runtime", () => {
  it("a click selects: aria-selected, tab order, panels; ok:tabs:change reports it", async () => {
    const host = mount(markup("a"));
    start();
    const seen: unknown[] = [];
    host.addEventListener("ok:tabs:change", (event) => seen.push((event as CustomEvent).detail));
    await userEvent.click(tab(host, 1));
    expect(tab(host, 1).getAttribute("aria-selected")).toBe("true");
    expect(tab(host, 0).getAttribute("aria-selected")).toBe("false");
    expect([tab(host, 0).tabIndex, tab(host, 1).tabIndex]).toEqual([-1, 0]);
    expect([panel(host, "a", 0).hidden, panel(host, "a", 1).hidden]).toEqual([true, false]);
    expect(seen).toEqual([{ value: "v1", previous: "v0", tab: tab(host, 1) }]);
    // The indicator moves under the new tab (CSSOM, no style attribute string).
    const line = host.querySelector<HTMLElement>("[data-ok-tabs-indicator]") as HTMLElement;
    expect(line.style.getPropertyValue("--_ok-tabs-indicator-start")).toBe(
      `${tab(host, 1).offsetLeft}px`,
    );
    // Again on the selected tab: nothing fires.
    await userEvent.click(tab(host, 1));
    expect(seen).toHaveLength(1);
  });

  it("keyboard: arrows move focus, Enter / Space select, disabled tabs are skipped", async () => {
    const host = mount(markup("k"));
    start();
    tab(host, 0).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab(host, 1));
    expect(tab(host, 0).getAttribute("aria-selected")).toBe("true");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab(host, 0));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(tab(host, 1));
    await userEvent.keyboard(" ");
    expect(tab(host, 1).getAttribute("aria-selected")).toBe("true");
    await userEvent.keyboard("{Home}{Enter}");
    expect(tab(host, 0).getAttribute("aria-selected")).toBe("true");
  });

  it("selection follows focus with data-ok-selection-follows-focus", async () => {
    const host = mount(markup("f", "data-ok-selection-follows-focus"));
    start();
    tab(host, 0).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tab(host, 1).getAttribute("aria-selected")).toBe("true");
    expect(panel(host, "f", 1).hidden).toBe(false);
  });

  it("change is cancelable; the instance selects, sets and ignores what isn't its tab", () => {
    const host = mount(markup("c") + markup("d"));
    const rt = start();
    const root = host.querySelector("[data-ok-tabs]") as HTMLElement;
    const instance = rt.get<TabsInstance>(root, "tabs") as TabsInstance;
    expect(instance.value).toBe("v0");
    root.addEventListener("ok:tabs:change", (event) => event.preventDefault(), { once: true });
    expect(instance.select(tab(host, 1))).toBe(false);
    expect(instance.value).toBe("v0");
    expect(instance.select(tab(host, 1))).toBe(true);
    expect(instance.value).toBe("v1");
    expect(instance.select(tab(host, 1))).toBe(true);
    expect(instance.select(tab(host, 2))).toBe(false); // disabled
    const foreign = host.querySelectorAll('[role="tab"]')[3] as HTMLElement;
    expect(instance.select(foreign)).toBe(false);
    instance.setValue("v0");
    expect(instance.value).toBe("v0");
    expect(panel(host, "c", 0).hidden).toBe(false);
    instance.setValue("missing");
    expect(instance.value).toBe("v0");
  });

  it("tabs without values use positions; no selection and no panels still work", async () => {
    const host = mount(`
      <div data-ok-tabs data-ok-orientation="horizontal">
        <div data-ok-tabs-scroller>
          <div role="tablist" data-ok-tabs-list aria-label="Plain">
            <button type="button" role="tab" data-ok-tab aria-selected="false" tabindex="-1" disabled>A</button>
            <button type="button" role="tab" data-ok-tab aria-selected="false" tabindex="0">B</button>
            <button type="button" role="tab" data-ok-tab aria-selected="false" tabindex="-1">C</button>
          </div>
        </div>
      </div>`);
    const rt = start();
    const instance = rt.get<TabsInstance>(
      host.querySelector("[data-ok-tabs]"),
      "tabs",
    ) as TabsInstance;
    expect(instance.value).toBeNull();
    const [, b, c] = host.querySelectorAll<HTMLElement>('[role="tab"]') as unknown as HTMLElement[];
    await userEvent.click(c as HTMLElement);
    expect(instance.value).toBe("2");
    expect((b as HTMLElement).tabIndex).toBe(-1);
    instance.setValue("1");
    expect((b as HTMLElement).getAttribute("aria-selected")).toBe("true");
  });

  it("vertical tabs answer Up / Down", async () => {
    const host = mount(
      markup("v", "").replace('data-ok-orientation="horizontal"', 'data-ok-orientation="vertical"'),
    );
    start();
    tab(host, 1).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(tab(host, 0));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(tab(host, 1));
  });

  it("scroll buttons page a scrollable bar", async () => {
    const labels = Array.from({ length: 10 }, (_, i) => `Item number ${i}`);
    const host = mount(
      `<div style="width: 360px">${markup("s", 'data-ok-scroll-buttons="auto"', labels, [])
        .replace('data-ok-variant="standard"', 'data-ok-variant="scrollable"')
        .replace(
          "<div data-ok-tabs-scroller>",
          '<div data-ok-tabs-scroll-button="start" aria-hidden="true"></div><div data-ok-tabs-scroller>',
        )
        .replace(
          /<\/span>\s*<\/div>\s*<\/div>/,
          '</span></div><div data-ok-tabs-scroll-button="end" aria-hidden="true"></div></div>',
        )}</div>`,
    );
    start();
    const root = host.querySelector<HTMLElement>("[data-ok-tabs]") as HTMLElement;
    const scroller = root.querySelector<HTMLElement>("[data-ok-tabs-scroller]") as HTMLElement;
    expect(root.hasAttribute("data-ok-can-scroll-end")).toBe(true);
    (root.querySelector('[data-ok-tabs-scroll-button="end"]') as HTMLElement).click();
    await expect.poll(() => scroller.scrollLeft > 0).toBe(true);
    await expect.poll(() => root.hasAttribute("data-ok-can-scroll-start")).toBe(true);
  });

  it("idempotent init, cleanup on removal, React-owned tabs are left alone", async () => {
    const host = mount(markup("r", 'data-ok-runtime="off"') + markup("x"));
    const rt = start();
    rt.init();
    rt.init();
    const owned = host.querySelector("[data-ok-tabs]") as HTMLElement;
    expect(rt.get(owned, "tabs")).toBeUndefined();
    await userEvent.click(tab(owned, 1));
    expect(tab(owned, 1).getAttribute("aria-selected")).toBe("false");
    const other = host.querySelectorAll<HTMLElement>("[data-ok-tabs]")[1] as HTMLElement;
    const otherTab = other.querySelector('[value="v1"]') as HTMLElement;
    other.remove();
    await settle();
    otherTab.click();
    expect(otherTab.getAttribute("aria-selected")).toBe("false");
  });

  it("hostile values: unknown ids and markup in values don't inject", async () => {
    const host = mount(
      markup("h")
        .replace(
          'aria-controls="h-p1"',
          'aria-controls="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"',
        )
        .replace('value="v1"', 'value="&lt;img src=x&gt;"'),
    );
    start();
    const second = host.querySelectorAll<HTMLElement>('[role="tab"]')[1] as HTMLElement;
    await userEvent.click(second);
    expect(second.getAttribute("aria-selected")).toBe("true");
    expect(host.querySelector("img")).toBeNull();
  });
});
