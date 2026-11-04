import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { mount, resetPage } from "../../test-utils.js";

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
    const roots = host.querySelectorAll<HTMLElement>("[data-mt-button]");
    expect(roots.length).toBeGreaterThan(0);
    for (const root of roots) {
      expect(root.querySelectorAll(":scope > [data-mt-button-label]")).toHaveLength(1);
      for (const name of ["mtVariant", "mtColor", "mtSize"])
        expect(root.dataset[name]).toBeTruthy();
      if (root instanceof HTMLButtonElement) expect(root.getAttribute("type")).toBe("button");
      else expect(root.getAttribute("href")).toBe("/docs");
      for (const icon of root.querySelectorAll("[data-mt-button-icon]")) {
        expect(icon.getAttribute("aria-hidden")).toBe("true");
      }
      if (root.hasAttribute("data-mt-loading")) {
        expect((root as HTMLButtonElement).disabled).toBe(true);
        expect(root.getAttribute("aria-busy")).toBe("true");
        expect(root.querySelector("[data-mt-button-loader]")?.getAttribute("aria-hidden")).toBe(
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
    const host = mount(html);
    // Brand-colored text follows the reference look (ADR-0014): exempt from color-contrast only.
    const exempt = [
      '[data-mt-button][data-mt-color]:not([data-mt-color="inherit"]):not([data-mt-variant="soft"])',
    ];
    const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
    const all = await axe.run(host, {
      runOnly: { type: "tag", values: tags },
      rules: { "color-contrast": { enabled: false } },
    });
    const contrast = await axe.run(
      { include: [host], exclude: exempt.map((selector) => [selector]) },
      { runOnly: { type: "rule", values: ["color-contrast"] } },
    );
    const violations = [...all.violations, ...contrast.violations];
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual(
      [],
    );
  });
});

describe("button CSS without JavaScript", () => {
  it("styles contained, outlined and soft from the tokens", () => {
    const host = mount(
      [
        '<button type="button" data-mt-button data-mt-variant="contained" data-mt-color="primary"><span data-mt-button-label>a</span></button>',
        '<button type="button" data-mt-button data-mt-variant="outlined" data-mt-color="error"><span data-mt-button-label>b</span></button>',
        '<button type="button" data-mt-button data-mt-variant="soft" data-mt-color="inherit"><span data-mt-button-label>c</span></button>',
      ].join(""),
    );
    const [contained, outlined, soft] = host.querySelectorAll("button") as unknown as HTMLElement[];
    expect(css(contained as Element).backgroundColor).toBe("rgb(0, 167, 111)");
    expect(css(outlined as Element).borderTopColor).toBe("rgba(255, 86, 48, 0.48)");
    expect(css(soft as Element).backgroundColor).toBe("rgba(145, 158, 171, 0.16)");
  });

  it("treats unknown or missing modifier values as the defaults", () => {
    const host = mount(
      '<button type="button" data-mt-button data-mt-variant="bogus" data-mt-color="nope" data-mt-size="huge"><span data-mt-button-label>x</span></button>' +
        '<button type="button" data-mt-button><span data-mt-button-label>y</span></button>',
    );
    for (const button of host.querySelectorAll("button")) {
      expect(css(button).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(button.getBoundingClientRect().height).toBe(36);
      expect(css(button).color).toBe("rgb(28, 37, 46)");
    }
  });

  it("disabled buttons don't activate", () => {
    const host = mount(
      '<button type="button" data-mt-button disabled><span data-mt-button-label>x</span></button>',
    );
    let clicks = 0;
    const button = host.querySelector("button") as HTMLButtonElement;
    button.addEventListener("click", () => clicks++);
    button.click();
    expect(clicks).toBe(0);
  });
});
