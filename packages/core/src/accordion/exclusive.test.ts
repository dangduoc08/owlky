import { afterEach, describe, expect, it } from "vitest";
import { supports } from "../dom/support.js";
import { closeOtherDetails } from "./exclusive.js";

const html = `
  <details name="g" open id="a"><summary>A</summary>a</details>
  <details name="g" open id="b"><summary>B</summary>b</details>
  <details name="other" open id="c"><summary>C</summary>c</details>
  <details open id="d"><summary>D</summary>d</details>`;

const host = document.createElement("div");
const get = (id: string) => host.querySelector(`#${id}`) as HTMLDetailsElement;
const mount = (root: ParentNode = document.body) => {
  host.innerHTML = html;
  root.append(host);
};
afterEach(() => host.remove());

describe("closeOtherDetails", () => {
  it("fallback: closes the other open members of the same group only", () => {
    mount();
    // Native exclusivity closed one of them on insertion where supported: reopen both.
    get("a").open = true;
    closeOtherDetails(get("a"), { forceFallback: true });
    expect(get("a").open).toBe(true);
    expect(get("b").open).toBe(false);
    expect(get("c").open).toBe(true);
    expect(get("d").open).toBe(true);
  });

  it("does nothing for closed, unnamed or natively exclusive details", () => {
    mount();
    get("b").removeAttribute("name");
    get("b").open = true;
    get("a").open = false;
    closeOtherDetails(get("a"), { forceFallback: true });
    closeOtherDetails(get("d"), { forceFallback: true });
    expect(get("b").open).toBe(true);
    get("b").setAttribute("name", "g");
    get("a").setAttribute("name", "g");
    get("a").open = true;
    get("b").open = true; // native: closes a
    closeOtherDetails(get("b"));
    expect(get("b").open).toBe(true);
    expect(get("a").open).toBe(!supports.detailsName);
  });

  it("stays inside the element's root (shadow DOM)", () => {
    const outer = document.createElement("details");
    outer.setAttribute("name", "g");
    outer.open = true;
    const shadowHost = document.createElement("div");
    document.body.append(outer, shadowHost);
    mount(shadowHost.attachShadow({ mode: "open" }));
    get("a").open = true;
    closeOtherDetails(get("a"), { forceFallback: true });
    expect(outer.open).toBe(true);
    expect(get("b").open).toBe(false);
    outer.remove();
    shadowHost.remove();
  });

  it("fallback loop closes same-name open members (engines without <details name>)", () => {
    // Every test engine closes the others natively first, so the loop runs on a fake tree.
    const make = (name: string, open: boolean) => {
      const el = { open, getAttribute: () => name, getRootNode: () => root };
      return el;
    };
    const items = [make("g", true), make("g", true), make("g", false), make("x", true)];
    const root = { querySelectorAll: () => items };
    closeOtherDetails(items[0] as unknown as HTMLDetailsElement, { forceFallback: true });
    expect(items.map((item) => item.open)).toEqual([true, false, false, true]);
  });
});
