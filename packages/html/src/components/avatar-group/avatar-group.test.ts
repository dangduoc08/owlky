import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import { avatarGroup } from "./avatar-group.js";

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const avatar = (letter: string) =>
  `<span data-ok-avatar data-ok-variant="circular" data-ok-color="default">${letter}</span>`;

describe("avatar group runtime", () => {
  it("a numeric data-ok-spacing becomes the overlap in px and follows changes", async () => {
    const group = mount(
      `<div data-ok-avatar-group data-ok-spacing="12">${avatar("A")}${avatar("B")}</div>`,
    ).firstElementChild as HTMLElement;
    runtime = createRuntime()
      .register(...components)
      .start();
    const second = group.children[1] as HTMLElement;
    expect(getComputedStyle(second).marginInlineStart).toBe("-12px");
    group.setAttribute("data-ok-spacing", "0");
    await settle();
    expect(getComputedStyle(second).marginInlineStart).toBe("0px");
    group.setAttribute("data-ok-spacing", "small");
    await settle();
    expect(group.style.getPropertyValue("--_ok-overlap")).toBe("");
    expect(getComputedStyle(second).marginInlineStart).toBe("-16px");
    group.setAttribute("data-ok-spacing", "24");
    await settle();
    group.setAttribute("data-ok-spacing", '"><img src=x onerror=alert(1)>');
    await settle();
    expect(getComputedStyle(second).marginInlineStart).toBe("-8px");
    group.setAttribute("data-ok-spacing", "30");
    await settle();
    runtime.destroy(group);
    expect(group.style.length).toBe(0);
    expect(components).toContain(avatarGroup);
  });
});
