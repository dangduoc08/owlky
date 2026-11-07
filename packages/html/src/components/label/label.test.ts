import { afterEach, describe, expect, it } from "vitest";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'/%3E";
const local = (html: string) => html.replaceAll(/src="avatars\/[^"]+"/g, `src="${PIXEL}"`);

afterEach(resetPage);

describe("label snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(5));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(local(html));
    const roots = host.querySelectorAll("[data-ok-label]");
    expect(roots.length).toBeGreaterThan(0);
    for (const root of roots) {
      expect(root.getAttribute("data-ok-variant")).not.toBeNull();
      expect(root.getAttribute("data-ok-color")).not.toBeNull();
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(local(html)));
  });
});
