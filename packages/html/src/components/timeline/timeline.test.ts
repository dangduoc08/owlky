import { afterEach, describe, expect, it } from "vitest";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

afterEach(resetPage);

describe("timeline snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(7));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const list of host.querySelectorAll("[data-ok-timeline]")) {
      expect(list.localName).toBe("ul");
      const items = [...list.children];
      items.forEach((item, index) => {
        expect(item.localName).toBe("li");
        expect(item.hasAttribute("data-ok-timeline-item")).toBe(true);
        const separator = item.querySelector(":scope > [data-ok-timeline-separator]");
        expect(separator?.querySelector(":scope > [data-ok-timeline-dot]")).not.toBeNull();
        // The last event has no connector.
        expect(separator?.querySelector("[data-ok-timeline-connector]") !== null).toBe(
          index < items.length - 1,
        );
        expect(item.querySelector(":scope > [data-ok-timeline-content]")).not.toBeNull();
      });
    }
    for (const svg of host.querySelectorAll("svg"))
      expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });

  it("CSS only: the content sits on its side without JavaScript", () => {
    const html = snippets.find(([path]) => path.includes("alternating"))?.[1] as string;
    const host = mount(`<div style="width: 600px">${html}</div>`);
    const items = host.querySelectorAll("[data-ok-timeline-item]");
    const side = (item: Element) =>
      (item.querySelector("[data-ok-timeline-content]") as Element).getBoundingClientRect().left >
      (item.querySelector("[data-ok-timeline-dot]") as Element).getBoundingClientRect().left;
    expect([...items].map(side)).toEqual([true, false, true]);
  });
});
