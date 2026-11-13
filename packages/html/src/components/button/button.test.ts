import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

// Browser-mode test: snippets are loaded with Vite glob imports (no Node fs).
const snippets = import.meta.glob("./examples/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const entries = Object.entries(snippets);

afterEach(resetPage);

const css = (element: Element) => getComputedStyle(element);

describe("button snippets", () => {
  it("covers every variant × group", () => {
    expect(entries).toHaveLength(28);
  });

  it.each(entries)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    const roots = host.querySelectorAll<HTMLElement>("[data-ok-button]");
    expect(roots.length).toBeGreaterThan(0);
    for (const root of roots) {
      expect(root.querySelectorAll(":scope > [data-ok-button-label]")).toHaveLength(1);
      for (const name of ["okVariant", "okColor", "okSize"])
        expect(root.dataset[name]).toBeTruthy();
      if (root instanceof HTMLButtonElement) expect(root.getAttribute("type")).toBe("button");
      else expect(root.getAttribute("href")).toBe("/docs");
      for (const icon of root.querySelectorAll("[data-ok-button-icon]")) {
        expect(icon.getAttribute("aria-hidden")).toBe("true");
      }
      if (root.hasAttribute("data-ok-loading")) {
        expect((root as HTMLButtonElement).disabled).toBe(true);
        expect(root.getAttribute("aria-busy")).toBe("true");
        expect(root.querySelector("[data-ok-button-loader]")?.getAttribute("aria-hidden")).toBe(
          "true",
        );
      }
    }
  });

  it.each(entries)("%s: no inline handlers, styles or scripts (CSP-safe)", (_, html) => {
    const host = mount(html);
    for (const element of host.querySelectorAll("*")) {
      for (const { name } of element.attributes) {
        expect(name.startsWith("on"), `${element.tagName} ${name}`).toBe(false);
        expect(name).not.toBe("style");
      }
    }
    expect(html).not.toMatch(/<script|javascript:/i);
  });

  it.each(entries)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });

  it("scans the resting colors even when an earlier test left the pointer on a button", async () => {
    const host = mount(snippets["./examples/soft-colors.html"] as string);
    const primary = host.querySelector('[data-ok-color="primary"]') as HTMLElement;
    await userEvent.hover(primary);
    expect(primary.matches(":hover")).toBe(true);
    await expectNoAxeViolations(host);
    expect(primary.matches(":hover")).toBe(false);
  });
});

describe("button CSS without JavaScript", () => {
  it("styles contained, outlined and soft from the tokens", () => {
    const host = mount(
      [
        '<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary"><span data-ok-button-label>a</span></button>',
        '<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="error"><span data-ok-button-label>b</span></button>',
        '<button type="button" data-ok-button data-ok-variant="soft" data-ok-color="inherit"><span data-ok-button-label>c</span></button>',
      ].join(""),
    );
    const [contained, outlined, soft] = host.querySelectorAll("button") as unknown as HTMLElement[];
    expect(css(contained as Element).backgroundColor).toBe("rgb(97, 95, 255)");
    expect(css(outlined as Element).borderTopColor).toBe("rgba(231, 0, 11, 0.48)");
    expect(css(soft as Element).backgroundColor).toBe("rgba(113, 113, 123, 0.16)");
  });

  it("treats unknown or missing modifier values as the defaults", () => {
    const host = mount(
      '<button type="button" data-ok-button data-ok-variant="bogus" data-ok-color="nope" data-ok-size="huge"><span data-ok-button-label>x</span></button>' +
        '<button type="button" data-ok-button><span data-ok-button-label>y</span></button>',
    );
    for (const button of host.querySelectorAll("button")) {
      expect(css(button).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(button.getBoundingClientRect().height).toBe(36);
      expect(css(button).color).toBe("rgb(39, 39, 42)");
    }
  });

  it("disabled buttons don't activate", () => {
    const host = mount(
      '<button type="button" data-ok-button disabled><span data-ok-button-label>x</span></button>',
    );
    let clicks = 0;
    const button = host.querySelector("button") as HTMLButtonElement;
    button.addEventListener("click", () => clicks++);
    button.click();
    expect(clicks).toBe(0);
  });

  it("a disabled router link that keeps its href gets no pointer events", () => {
    const host = mount(
      '<a href="/docs" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Docs</span></a>' +
        '<a href="/docs" aria-disabled="true" tabindex="-1" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Off</span></a>',
    );
    const [link, off] = [
      ...host.querySelectorAll<HTMLElement>("[data-ok-button]"),
    ] as HTMLElement[];
    expect(css(link as HTMLElement).pointerEvents).toBe("auto");
    expect(css(off as HTMLElement).pointerEvents).toBe("none");
    expect(css(off as HTMLElement).backgroundColor).not.toBe(
      css(link as HTMLElement).backgroundColor,
    );
  });
});
