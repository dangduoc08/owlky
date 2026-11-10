import { selectionControlColors, selectionControlSizes } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

afterEach(resetPage);

describe("switch snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(6));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-switch]")) {
      expect(selectionControlColors).toContain(root.dataset["okColor"]);
      expect(selectionControlSizes).toContain(root.dataset["okSize"]);
      const parts = [...root.children].map((child) =>
        child.localName === "input"
          ? `input:${child.getAttribute("role")}`
          : child.hasAttribute("data-ok-switch-track")
            ? "track"
            : child.hasAttribute("data-ok-switch-thumb")
              ? "thumb"
              : "?",
      );
      expect(parts).toEqual(["input:switch", "track", "thumb"]);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

describe("switch CSS without JavaScript", () => {
  it("toggles natively, through its label too", async () => {
    const host = mount(
      `<label data-ok-form-control-label data-ok-label-placement="end"><span data-ok-switch data-ok-color="primary" data-ok-size="medium"><input type="checkbox" role="switch" data-ok-switch-input><span data-ok-switch-track aria-hidden="true"></span><span data-ok-switch-thumb aria-hidden="true"></span></span><span data-ok-form-control-label-text>Wi-Fi</span></label>`,
    );
    const input = host.querySelector("input") as HTMLInputElement;
    await userEvent.click(host.querySelector("[data-ok-form-control-label-text]") as Element);
    expect(input.checked).toBe(true);
    const track = host.querySelector("[data-ok-switch-track]") as Element;
    getComputedStyle(track).backgroundColor;
    await Promise.all(track.getAnimations().map((a) => a.finished));
    expect(getComputedStyle(track).backgroundColor).toBe("rgb(0, 167, 111)");
  });
});

describe("switch thumb icons", () => {
  it("the icon for the state shows; an icon alone shows in both states", async () => {
    const host = mount(snippets.find(([path]) => path.includes("customization"))?.[1] as string);
    const [both, , alone] = [...host.querySelectorAll<HTMLElement>("[data-ok-switch]")];
    const shown = (root: Element | undefined, part: string) =>
      getComputedStyle(root?.querySelector(`[data-ok-switch-${part}]`) as Element).display !==
      "none";
    expect(shown(both, "icon")).toBe(false);
    expect(shown(both, "checked-icon")).toBe(true);
    await userEvent.click(both?.querySelector("input") as HTMLInputElement);
    expect(shown(both, "icon")).toBe(true);
    expect(shown(both, "checked-icon")).toBe(false);
    expect(shown(alone, "icon")).toBe(true);
    const svg = alone?.querySelector("svg") as SVGElement;
    expect(svg.getBoundingClientRect().width).toBeGreaterThan(0);
  });
});
