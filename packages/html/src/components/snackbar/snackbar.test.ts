import { describe, expect, it } from "vitest";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

describe("snackbar snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(6));

  it.each(snippets)("%s: one toaster; every trigger has a template with one toast", (_, html) => {
    const host = mount(html);
    expect(host.querySelectorAll("section[data-ok-toaster]")).toHaveLength(1);
    expect(host.querySelector("[data-ok-toaster-list][aria-live='polite']")).not.toBeNull();
    for (const trigger of host.querySelectorAll("[data-ok-toast-open]")) {
      const template = host.querySelector(`#${trigger.getAttribute("data-ok-toast-open")}`);
      expect(template).toBeInstanceOf(HTMLTemplateElement);
      expect(
        (template as HTMLTemplateElement).content.querySelectorAll("[data-ok-toast]"),
      ).toHaveLength(1);
    }
    resetPage();
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
    resetPage();
  });
});
