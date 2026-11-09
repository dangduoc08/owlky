import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) => snippets.find(([path]) => path.endsWith(`/${name}.html`))?.[1];

afterEach(resetPage);

/** The computed color of a `var(--ok-*)` value. */
function color(value: string) {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.append(probe);
  const result = getComputedStyle(probe).color;
  probe.remove();
  return result;
}

describe("form control snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(8));

  it.each(snippets)("%s: valid anatomy and linkage", (_, html) => {
    const host = mount(html);
    const roots = host.querySelectorAll<HTMLElement>("[data-ok-form-control]");
    expect(roots.length).toBeGreaterThan(0);
    for (const root of roots) {
      const label = root.querySelector<HTMLElement>(":scope > [data-ok-form-label]");
      expect(label).not.toBeNull();
      if (root.localName === "fieldset") expect(label?.localName).toBe("legend");
      else expect(label?.getAttribute("for")).toBeTruthy();
      // The asterisk follows the root's or the label's required state.
      const required =
        root.hasAttribute("data-ok-required") || label?.hasAttribute("data-ok-required");
      expect(label?.querySelector("[data-ok-form-label-asterisk][aria-hidden=true]") !== null).toBe(
        required,
      );
      // Every helper text is referenced by the root, the group or the control.
      for (const helper of root.querySelectorAll<HTMLElement>("[data-ok-form-helper-text]")) {
        expect(helper.localName).toBe("p");
        expect(host.querySelector(`[aria-describedby~="${helper.id}"]`)).not.toBeNull();
      }
      // Errors are exposed on the controls, not only in colors.
      if (root.hasAttribute("data-ok-error"))
        expect(root.querySelector('[aria-invalid="true"]')).not.toBeNull();
      // A disabled fieldset is natively disabled too.
      if (root.hasAttribute("data-ok-disabled"))
        expect(root.matches("fieldset:disabled")).toBe(true);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

describe("form control CSS without JavaScript", () => {
  it("a legend names the group; the label and helper text take the secondary text color", () => {
    const host = mount(snippet("checkboxes-group") ?? "");
    const [plain, error] = host.querySelectorAll<HTMLFieldSetElement>("fieldset");
    const legend = plain?.querySelector("legend") as HTMLElement;
    expect(getComputedStyle(legend).color).toBe(color("var(--ok-text-secondary)"));
    expect(getComputedStyle(legend).fontSize).toBe("14px");
    const helper = plain?.querySelector("p") as HTMLElement;
    expect(getComputedStyle(helper).color).toBe(color("var(--ok-text-secondary)"));
    expect(getComputedStyle(helper).marginTop).toBe("6px");
    // The root's error reaches its label and helper text.
    for (const part of error?.querySelectorAll("legend, p") ?? [])
      expect(getComputedStyle(part).color).toBe(color("var(--ok-palette-error-text)"));
  });

  it("a focused root colors its label with the root's color", () => {
    const host = mount(snippet("states-focused") ?? "");
    const legend = host.querySelector("legend") as HTMLElement;
    expect(getComputedStyle(legend).color).toBe(color("var(--ok-palette-primary-text)"));
    const root = host.querySelector("[data-ok-form-control]") as HTMLElement;
    root.removeAttribute("data-ok-color");
    expect(getComputedStyle(legend).color).toBe(color("var(--ok-text-primary)"));
    root.setAttribute("data-ok-color", '"><img src=x onerror=alert(1)>');
    expect(getComputedStyle(legend).color).toBe(color("var(--ok-text-primary)"));
  });

  it("a disabled fieldset turns off its controls and dims the label", async () => {
    const host = mount(snippet("states-disabled") ?? "");
    const legend = host.querySelector("legend") as HTMLElement;
    expect(getComputedStyle(legend).color).toBe(color("var(--ok-text-disabled)"));
    const push = host.querySelector<HTMLInputElement>('input[name="push"]') as HTMLInputElement;
    expect(push.matches(":disabled")).toBe(true);
    await userEvent.click(push, { force: true });
    expect(push.checked).toBe(false);
  });

  it("a standalone label toggles its control", async () => {
    const host = mount(snippet("standalone-group") ?? "");
    const input = host.querySelector<HTMLInputElement>("input") as HTMLInputElement;
    expect(input.checked).toBe(true);
    await userEvent.click(host.querySelector("label[data-ok-form-label]") as HTMLElement);
    expect(input.checked).toBe(false);
  });
});
