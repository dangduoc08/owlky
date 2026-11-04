import { toggleButtonColors, toggleButtonSizes } from "@owlky/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import { type ToggleButtonInstance, toggleButton } from "./toggle-button.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

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
});

const BUTTON =
  '<button type="button" data-ok-toggle-button data-ok-color="primary" data-ok-size="md"';

describe("toggle button snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(8));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const button of host.querySelectorAll<HTMLElement>("[data-ok-toggle-button]")) {
      expect(toggleButtonColors).toContain(button.dataset["okColor"]);
      expect(toggleButtonSizes).toContain(button.dataset["okSize"]);
      expect(["true", "false"]).toContain(button.getAttribute("aria-pressed"));
      const group = button.closest("[data-ok-toggle-group]");
      if (group) expect(button.getAttribute("value")).toBeTruthy();
    }
    for (const group of host.querySelectorAll("[data-ok-toggle-group]")) {
      expect(group.getAttribute("role")).toBe("group");
      expect(group.getAttribute("aria-label")).toBeTruthy();
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

describe("standalone toggle button runtime", () => {
  it("toggles with click, Enter and Space and emits a cancelable change event", async () => {
    const host = mount(`${BUTTON} aria-label="Bold" aria-pressed="false"></button>`);
    start();
    const button = host.querySelector("button") as HTMLButtonElement;
    const events: boolean[] = [];
    button.addEventListener("ok:toggle-button:change", (event) => {
      const { detail, cancelable } = event as CustomEvent<{ pressed: boolean }>;
      expect(cancelable).toBe(true);
      events.push(detail.pressed);
    });
    await userEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(events).toEqual([true, false, true]);
    expect(runtime?.get<ToggleButtonInstance>(button, "toggle-button")?.pressed).toBe(true);
  });

  it("keeps the state when the change event is prevented", async () => {
    const host = mount(`${BUTTON} aria-label="x" aria-pressed="true"></button>`);
    start();
    const button = host.querySelector("button") as HTMLButtonElement;
    button.addEventListener("ok:toggle-button:change", (event) => event.preventDefault());
    await userEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("disabled buttons never toggle; setPressed changes state silently", async () => {
    const host = mount(`${BUTTON} aria-label="x" disabled></button>`);
    start();
    const button = host.querySelector("button") as HTMLButtonElement;
    const listener = vi.fn();
    button.addEventListener("ok:toggle-button:change", listener);
    const instance = runtime?.get<ToggleButtonInstance>(button, "toggle-button");
    expect(button.getAttribute("aria-pressed")).toBe("false"); // normalized on mount
    expect(instance?.toggle()).toBe(false);
    button.click();
    instance?.setPressed(true);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(listener).not.toHaveBeenCalled();
  });

  it("mounts buttons inserted later and ignores React-owned subtrees", async () => {
    start();
    const host = mount(
      `${BUTTON} aria-label="html"></button><div data-ok-runtime="off">${BUTTON} aria-label="react" aria-pressed="false"></button></div>`,
    );
    await settle();
    const [html, react] = host.querySelectorAll("button") as unknown as HTMLButtonElement[];
    (html as HTMLButtonElement).click();
    (react as HTMLButtonElement).click();
    expect(html?.getAttribute("aria-pressed")).toBe("true");
    expect(react?.getAttribute("aria-pressed")).toBe("false");
  });

  it("standalone buttons work without the group definition", () => {
    const host = mount(`${BUTTON} aria-label="x" aria-pressed="false"></button>`);
    runtime = createRuntime().register(toggleButton).start();
    (host.querySelector("button") as HTMLButtonElement).click();
    expect(host.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("toggle button inside a group without the group definition", () => {
  it("leaves the selection to the (missing) group", () => {
    const host = mount(
      `<div role="group" data-ok-toggle-group aria-label="g">${BUTTON} value="a" aria-label="a" aria-pressed="false"></button></div>`,
    );
    runtime = createRuntime().register(toggleButton).start();
    (host.querySelector("button") as HTMLButtonElement).click();
    expect(host.querySelector("button")?.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("toggle button CSS without JavaScript", () => {
  it("styles standalone sizes and the pressed state", () => {
    const host = mount(
      `${BUTTON} data-ok-size="lg" aria-label="a" aria-pressed="true"></button>`.replace(
        'data-ok-size="md" ',
        "",
      ),
    );
    const button = host.querySelector("button") as HTMLElement;
    expect(button.getBoundingClientRect().height).toBe(56);
    expect(getComputedStyle(button).color).toBe("rgb(0, 167, 111)");
    expect(getComputedStyle(button).borderTopColor).toBe("rgb(0, 167, 111)");
  });
});
