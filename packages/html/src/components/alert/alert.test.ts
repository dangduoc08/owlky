import { alertSeverities, alertVariants } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
} from "../../test-utils.js";
import { components } from "../index.js";
import { type AlertInstance, alert } from "./alert.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

describe("alert snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(6));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-alert]")) {
      expect(root.getAttribute("role")).toBe("alert");
      expect(alertSeverities).toContain(root.dataset["okSeverity"]);
      expect(alertVariants).toContain(root.dataset["okVariant"]);
      expect(alertSeverities).toContain(root.dataset["okColor"]);
      expect(root.querySelector(":scope > [data-ok-alert-icon] > svg[aria-hidden]")).not.toBeNull();
      expect(root.querySelector(":scope > [data-ok-alert-message]")).not.toBeNull();
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

describe("alert runtime", () => {
  const html = (id: string) =>
    `<div id="${id}" role="alert" data-ok-alert data-ok-severity="info" data-ok-variant="standard" data-ok-color="info"><div data-ok-alert-message>Hi</div><div data-ok-alert-action><button type="button" data-ok-alert-close aria-label="Close">x</button></div></div>`;

  it("the close button emits a cancelable ok:alert:close, then hides the alert", async () => {
    const host = mount(html("a") + html("b"));
    runtime = createRuntime()
      .register(...components)
      .start();
    const [a, b] = host.querySelectorAll<HTMLElement>("[data-ok-alert]");
    b?.addEventListener("ok:alert:close", (event) => event.preventDefault());
    await userEvent.click(a?.querySelector("button") as HTMLElement);
    await userEvent.click(b?.querySelector("button") as HTMLElement);
    expect(a?.hidden).toBe(true);
    expect(b?.hidden).toBe(false);
    expect(runtime.get<AlertInstance>(b as Element, "alert")?.close()).toBe(false);
    expect(components).toContain(alert);
  });
});
