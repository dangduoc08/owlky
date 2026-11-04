import { accordionVariants } from "@owlky/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import { type AccordionInstance, accordion } from "./accordion.js";

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

const item = (title: string, extra = "", summaryExtra = "") =>
  `<details data-ok-accordion data-ok-variant="default" ${extra}><summary data-ok-accordion-summary ${summaryExtra}>${title}</summary><div data-ok-accordion-details>Body</div></details>`;
const nextToggle = (element: Element) =>
  new Promise<void>((resolve) =>
    element.addEventListener("toggle", () => resolve(), { once: true }),
  );

describe("accordion snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(4));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-accordion]")) {
      expect(root.localName).toBe("details");
      expect(accordionVariants).toContain(root.dataset["okVariant"]);
      const summary = root.firstElementChild as HTMLElement;
      expect(summary.localName).toBe("summary");
      expect(summary.dataset["okAccordionSummary"]).toBe("");
      expect(summary.querySelector("[data-ok-accordion-icon]")?.getAttribute("aria-hidden")).toBe(
        "true",
      );
      expect(root.querySelector(":scope > [data-ok-accordion-details]")).not.toBeNull();
      const disabled = root.hasAttribute("data-ok-disabled");
      expect(summary.getAttribute("aria-disabled")).toBe(disabled ? "true" : null);
      expect(summary.getAttribute("tabindex")).toBe(disabled ? "-1" : null);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations (closed and open)", async (_, html) => {
    const host = mount(html);
    await expectNoAxeViolations(host);
    // Disabled items never open (their content is inactive, WCAG 1.4.3 exception).
    for (const details of host.querySelectorAll<HTMLDetailsElement>(
      "details:not([data-ok-disabled])",
    ))
      details.open = true;
    // Opening animates the content (::details-content): read colors once it has settled.
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
    await expectNoAxeViolations(host);
  });
});

describe("accordion runtime", () => {
  it("works without the runtime (native <details>)", async () => {
    const host = mount(item("A"));
    await userEvent.click(host.querySelector("summary") as HTMLElement);
    expect((host.firstElementChild as HTMLDetailsElement).open).toBe(true);
  });

  it("summary click and keyboard toggle it with beforetoggle / toggle events", async () => {
    const host = mount(item("A"));
    start();
    const details = host.firstElementChild as HTMLDetailsElement;
    const events: string[] = [];
    details.addEventListener("ok:accordion:beforetoggle", (e) =>
      events.push(`before:${(e as CustomEvent).detail.open}`),
    );
    details.addEventListener("ok:accordion:toggle", (e) =>
      events.push(`toggle:${(e as CustomEvent).detail.open}`),
    );
    await userEvent.click(details.querySelector("summary") as HTMLElement);
    await settle();
    expect(details.open).toBe(true);
    (details.querySelector("summary") as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(details.open).toBe(false);
    await settle();
    expect(events).toEqual(["before:true", "toggle:true", "before:false", "toggle:false"]);
  });

  it("beforetoggle can be prevented; disabled never toggles", async () => {
    const host = mount(
      item("A") + item("D", "data-ok-disabled", 'aria-disabled="true" tabindex="-1"'),
    );
    start();
    const [a, d] = host.querySelectorAll("details");
    a?.addEventListener("ok:accordion:beforetoggle", (e) => e.preventDefault());
    a?.querySelector("summary")?.click();
    d?.querySelector("summary")?.click();
    expect(a?.open).toBe(false);
    expect(d?.open).toBe(false);
    expect(runtime?.get<AccordionInstance>(d as Element, "accordion")?.toggle(true)).toBe(false);
  });

  it("instance API: toggle(open?) and isOpen", () => {
    const host = mount(item("A"));
    start();
    const instance = runtime?.get<AccordionInstance>(host.firstElementChild, "accordion");
    expect(instance?.isOpen).toBe(false);
    expect(instance?.toggle()).toBe(true);
    expect(instance?.isOpen).toBe(true);
    expect(instance?.toggle(true)).toBe(true);
    expect(instance?.toggle(false)).toBe(true);
    expect(instance?.isOpen).toBe(false);
  });

  it("name: one open at a time, also for programmatic opens", async () => {
    const host = mount(item("A", 'name="g" open') + item("B", 'name="g"'));
    start();
    const [a, b] = host.querySelectorAll("details");
    b?.querySelector("summary")?.click();
    await settle();
    await settle();
    expect(b?.open).toBe(true);
    expect(a?.open).toBe(false);
  });

  it("ignores summaries outside an accordion and React roots", async () => {
    const host = mount(
      `<details><summary data-ok-accordion-summary>X</summary></details>${item("R", 'data-ok-runtime="off"')}`,
    );
    start();
    const spy = vi.fn();
    host.addEventListener("ok:accordion:beforetoggle", spy);
    for (const summary of host.querySelectorAll("summary")) summary.click();
    expect(spy).not.toHaveBeenCalled();
    expect([...host.querySelectorAll("details")].map((d) => d.open)).toEqual([true, true]);
  });

  it("is registered and releases its toggle listener on destroy", async () => {
    expect(components).toContain(accordion);
    const host = mount(item("A"));
    start();
    const spy = vi.fn();
    host.addEventListener("ok:accordion:toggle", spy);
    runtime?.destroy(host);
    const details = host.firstElementChild as HTMLDetailsElement;
    details.open = true;
    await nextToggle(details);
    expect(spy).not.toHaveBeenCalled();
  });
});
