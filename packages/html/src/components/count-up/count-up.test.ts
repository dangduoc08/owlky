import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { CountUpInstance } from "./count-up.js";

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.unstubAllGlobals();
});

const markup = (attrs: string) =>
  `<span data-ok-count-up ${attrs}><span data-ok-count-up-label>End</span><span aria-hidden="true"><span data-ok-count-up-value>0</span>k</span></span>`;
const value = (host: Element) => host.querySelector("[data-ok-count-up-value]")?.textContent;

function valueBecomes(host: Element, text: string): Promise<void> {
  return new Promise((resolve) => {
    if (value(host) === text) return resolve();
    const observer = new MutationObserver(() => {
      if (value(host) !== text) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(host, { subtree: true, characterData: true, childList: true });
  });
}

describe("count-up runtime", () => {
  it("counts to the end on mount; replay counts again", async () => {
    const host = mount(markup('data-ok-end="40" data-ok-trigger="mount" data-ok-duration="120"'));
    start();
    await valueBecomes(host, "40");
    const instance = runtime?.get<CountUpInstance>(host.firstElementChild, "count-up");
    instance?.replay();
    expect(value(host)).toBe("0");
    await valueBecomes(host, "40");
  });

  it("in view by default; start and decimals", async () => {
    const host = mount(
      markup('data-ok-start="2" data-ok-end="3" data-ok-decimals="1" data-ok-duration="60"'),
    );
    start();
    await valueBecomes(host, "3.0");
  });

  it("manual: data-ok-in starts the count; invalid values fall back", async () => {
    const host = mount(
      markup(
        'data-ok-end="x" data-ok-start="&lt;b&gt;" data-ok-decimals="-1" data-ok-duration="0" data-ok-trigger="manual"',
      ),
    );
    start();
    expect(value(host)).toBe("0");
    (host.firstElementChild as Element).setAttribute("data-ok-in", "");
    await settle();
    expect(value(host)).toBe("0");
    expect(host.querySelector("b")).toBeNull();
  });

  it("works without a value part (markup error) and stops cleanly", () => {
    const host = mount('<span data-ok-count-up data-ok-end="5" data-ok-trigger="mount">5</span>');
    start();
    expect(host.textContent).toBe("5");
    runtime?.stop();
  });
});
