import { selectionControlColors, selectionControlSizes } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

afterEach(resetPage);

describe("radio snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(4));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    const group = host.querySelector<HTMLElement>("[data-ok-radio-group]");
    expect(group?.getAttribute("role")).toBe("radiogroup");
    expect(group?.hasAttribute("aria-label") || group?.hasAttribute("aria-labelledby")).toBe(true);
    const names = new Set<string>();
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-radio]")) {
      expect(selectionControlColors).toContain(root.dataset["okColor"]);
      expect(selectionControlSizes).toContain(root.dataset["okSize"]);
      const input = root.querySelector<HTMLInputElement>(":scope > input[type=radio]");
      expect(input).not.toBeNull();
      names.add(input?.name ?? "");
      expect(
        [...root.querySelectorAll(":scope > [data-ok-radio-icon]")].map((i) =>
          i.getAttribute("data-ok-radio-icon"),
        ),
      ).toEqual(["unchecked", "checked"]);
    }
    expect(names.size).toBe(1);
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

describe("radio CSS without JavaScript", () => {
  it("one per name stays checked; the checked one shows its color", async () => {
    const host = mount(snippets.find(([path]) => path.includes("basic"))?.[1] ?? "");
    const [a, b] = host.querySelectorAll<HTMLInputElement>("input");
    await userEvent.click(b as HTMLInputElement);
    expect(a?.checked).toBe(false);
    const root = b?.closest("[data-ok-radio]") as HTMLElement;
    expect(getComputedStyle(root).color).toBe("rgb(0, 167, 111)");
  });
});
