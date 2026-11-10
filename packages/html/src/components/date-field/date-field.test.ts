import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { DateFieldInstance } from "./date-field.js";

const snippets = import.meta.glob("../date-picker/examples/validation-states.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const VALIDATION = Object.values(snippets)[0] as string;

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

/** The snippet's clearable field, alone, with `edit` applied to its root before the runtime starts. */
function clearableField(edit: (root: HTMLElement) => void = () => {}) {
  const host = mount(VALIDATION);
  const root = (host.querySelector("#dv-clearable") as HTMLElement).closest(
    "[data-ok-date-field]",
  ) as HTMLElement;
  host.replaceChildren(root);
  edit(root);
  const rt = start();
  const instance = rt.get<DateFieldInstance>(root, "date-field") as DateFieldInstance;
  const spinbuttons = [...root.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
  return { host, root, instance, spinbuttons, texts: () => spinbuttons.map((s) => s.textContent) };
}

describe("date field (HTML): field API, leading zeros, button positions", () => {
  it("instance field API: sections, focus, selection by index, type, all and none", () => {
    const { root, instance, spinbuttons } = clearableField();
    expect(instance.getSections().map((s) => [s.type, s.value, s.placeholder])).toEqual([
      ["month", "05", "MM"],
      ["day", "25", "DD"],
      ["year", "2025", "YYYY"],
    ]);
    expect(instance.isFieldFocused()).toBe(false);
    expect(instance.getActiveSectionIndex()).toBeNull();
    instance.focusField("day");
    expect(document.activeElement).toBe(spinbuttons[1]);
    expect(instance.getActiveSectionIndex()).toBe(1);
    expect(instance.isFieldFocused()).toBe(true);
    instance.setSelectedSections(2);
    expect(document.activeElement).toBe(spinbuttons[2]);
    instance.setSelectedSections("all");
    const group = root.querySelector("[data-ok-date-field-sections]") as HTMLElement;
    expect(group.hasAttribute("data-ok-all-selected")).toBe(true);
    instance.setSelectedSections(null);
    expect(group.hasAttribute("data-ok-all-selected")).toBe(false);
  });

  it("pads unpadded digit sections unless data-ok-should-respect-leading-zeros", async () => {
    const padded = clearableField((root) => {
      root.setAttribute("data-ok-format", "M/D/YYYY");
      root.setAttribute("data-ok-value", "2025-05-07");
    });
    expect(padded.texts()).toEqual(["05", "07", "2025"]);
    runtime?.stop();
    resetPage();
    const kept = clearableField((root) => {
      root.setAttribute("data-ok-format", "M/D/YYYY");
      root.setAttribute("data-ok-value", "2025-05-07");
      root.setAttribute("data-ok-should-respect-leading-zeros", "");
    });
    expect(kept.texts()).toEqual(["5", "7", "2025"]);
    (kept.spinbuttons[1] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(kept.texts()[1]).toBe("8");
    expect(kept.instance.value).toBe("2025-05-08");
  });

  it("a clear button in the start adornment still clears", async () => {
    const { root, texts } = clearableField((field) => {
      field.setAttribute("data-ok-clear-button-position", "start");
      const end = field.querySelector('[data-ok-text-field-adornment="end"]') as HTMLElement;
      end.setAttribute("data-ok-text-field-adornment", "start");
      field.querySelector("[data-ok-text-field-control]")?.prepend(end);
    });
    const clear = root.querySelector("[data-ok-date-field-clear]") as HTMLElement;
    expect(clear.closest('[data-ok-text-field-adornment="start"]')).not.toBeNull();
    await userEvent.click(clear);
    expect(texts()).toEqual(["MM", "DD", "YYYY"]);
    expect(clear.hidden).toBe(true);
    await expectNoAxeViolations(root);
  });
});
