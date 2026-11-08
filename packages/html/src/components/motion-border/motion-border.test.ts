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
});
