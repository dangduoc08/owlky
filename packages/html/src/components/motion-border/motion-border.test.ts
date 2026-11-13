import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

describe("motion-border runtime", () => {
  it("writes the width and the duration through CSSOM, again when they change", async () => {
    const host = mount(
      '<div data-ok-motion-border data-ok-shape="circle" data-ok-width="4" data-ok-duration="3000">A</div><div data-ok-motion-border data-ok-width="-2">B</div>',
    );
    runtime = createRuntime()
      .register(...components)
      .start();
    const [a, b] = host.querySelectorAll<HTMLElement>("[data-ok-motion-border]");
    expect(getComputedStyle(a as Element).borderTopWidth).toBe("4px");
    expect(getComputedStyle(a as Element).animationDuration).toBe("3s");
    expect((b as HTMLElement).style.getPropertyValue("--_ok-motion-border-width")).toBe("2px");
    expect((b as HTMLElement).style.getPropertyValue("--_ok-motion-border-duration")).toBe("");
    (a as HTMLElement).setAttribute("data-ok-width", "1");
    (a as HTMLElement).removeAttribute("data-ok-duration");
    await settle();
    expect(getComputedStyle(a as Element).borderTopWidth).toBe("1px");
    expect((a as HTMLElement).style.getPropertyValue("--_ok-motion-border-duration")).toBe("");
    runtime.stop();
    expect((a as HTMLElement).style.getPropertyValue("--_ok-motion-border-width")).toBe("");
  });

  it("reads the colors from the attributes, unknown second lights stay out", async () => {
    const host = mount(
      '<div data-ok-motion-border data-ok-color="secondary" data-ok-secondary-color="warning">A</div><div data-ok-motion-border data-ok-color="info" data-ok-secondary-color="&quot;&gt;&lt;img onerror&gt;">B</div>',
    );
    runtime = createRuntime()
      .register(...components)
      .start();
    const [a, b] = host.querySelectorAll<HTMLElement>("[data-ok-motion-border]");
    expect(getComputedStyle(a as Element).backgroundImage).toMatch(
      /rgb\(187, 77, 0\).*rgb\(127, 34, 254\)/,
    );
    const hostile = getComputedStyle(b as Element).backgroundImage;
    expect(hostile).toMatch(/conic-gradient\(.*rgb\(0, 105, 168\)/);
    expect(hostile).not.toContain("onerror");
    (a as HTMLElement).removeAttribute("data-ok-secondary-color");
    await settle();
    expect(getComputedStyle(a as Element).backgroundImage).not.toContain("rgb(187, 77, 0)");
  });
});
