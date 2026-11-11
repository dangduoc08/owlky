import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { CountdownInstance } from "./countdown.js";

const NOW = Date.parse("2026-11-09T12:00:00Z");
let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  vi.setSystemTime(NOW);
});
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  vi.useRealTimers();
  resetPage();
});

const unit = (name: string, label = name) =>
  `<span data-ok-countdown-unit="${name}"><span data-ok-countdown-value>--</span> <span data-ok-countdown-label>${label}</span></span>`;
const markup = (attrs: string, units = ["days", "hours", "minutes", "seconds"]) =>
  `<span id="c" data-ok-countdown role="timer" aria-label="Sale" ${attrs}>${units.map((u) => unit(u)).join("")}<span data-ok-countdown-status role="status"></span></span>`;
const values = (host: Element) =>
  [...host.querySelectorAll("[data-ok-countdown-value]")].map((value) => value.textContent);
const status = (host: Element) => host.querySelector("[data-ok-countdown-status]")?.textContent;
const flush = async () => {
  // MutationObserver callbacks are microtasks.
  await Promise.resolve();
  await Promise.resolve();
};

describe("countdown runtime", () => {
  it("writes the time left to a date and counts down", async () => {
    const html = markup('data-ok-largest-unit="days" data-ok-date="2026-11-11T13:02:03Z"');
    const host = mount(html);
    expectCspSafe(host, html);
    const ticks: number[] = [];
    host.addEventListener("ok:countdown:tick", (event) =>
      ticks.push((event as CustomEvent<{ remaining: number }>).detail.remaining),
    );
    start();
    expect(values(host)).toEqual(["2", "01", "02", "03"]);
    vi.advanceTimersByTime(1000);
    expect(values(host)).toEqual(["2", "01", "02", "02"]);
    expect(ticks.at(-1)).toBe(2 * 86400 + 3600 + 122);
    const root = host.querySelector("[data-ok-countdown]") as HTMLElement;
    const instance = runtime?.get<CountdownInstance>(root, "countdown");
    expect(instance?.remaining).toBe(2 * 86400 + 3600 + 122);
    vi.useRealTimers();
    await expectNoAxeViolations(host);
  });

  it("runs its clock from data-ok-now, reads labels from the markup and announces", () => {
    const host = mount(
      `<span data-ok-countdown data-ok-largest-unit="seconds" data-ok-date="2026-01-01T00:00:00Z" data-ok-now="2025-12-31T23:59:29Z" data-ok-complete-label="Bonne année">${unit("seconds", "s")}<span data-ok-countdown-status role="status"></span></span>`,
    );
    const complete = vi.fn();
    host.addEventListener("ok:countdown:complete", complete);
    start();
    expect(values(host)).toEqual(["31"]);
    vi.advanceTimersByTime(1000);
    expect(status(host)).toBe("30 s");
    vi.advanceTimersByTime(20_000);
    expect(status(host)).toBe("10 s");
    vi.advanceTimersByTime(10_000);
    expect(status(host)).toBe("Bonne année");
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("pauses with data-ok-paused, the toggle trigger and the instance", async () => {
    const host = mount(
      `${markup('data-ok-largest-unit="seconds" data-ok-seconds="10" data-ok-paused', ["seconds"])}<button type="button" data-ok-countdown-toggle="c">Pause</button><button type="button" data-ok-countdown-toggle="missing">Other</button><button type="button" data-ok-countdown-toggle="">Empty</button><button type="button" data-ok-countdown-restart="c">Restart</button>`,
    );
    start();
    const root = host.querySelector("[data-ok-countdown]") as HTMLElement;
    const [toggle, other, , restart] = host.querySelectorAll("button");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    vi.advanceTimersByTime(3000);
    expect(values(host)).toEqual(["10"]);
    (toggle as HTMLButtonElement).click();
    await flush();
    expect(root.hasAttribute("data-ok-paused")).toBe(false);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    vi.advanceTimersByTime(2000);
    expect(values(host)).toEqual(["8"]);
    (other as HTMLButtonElement).click();
    (host.querySelectorAll("button")[2] as HTMLButtonElement).click();
    const instance = runtime?.get<CountdownInstance>(root, "countdown") as CountdownInstance;
    instance.pause();
    await flush();
    expect(instance.paused).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(values(host)).toEqual(["8"]);
    instance.resume();
    await flush();
    vi.advanceTimersByTime(1000);
    expect(values(host)).toEqual(["7"]);
    (restart as HTMLButtonElement).click();
    expect(values(host)).toEqual(["10"]);
    (toggle as HTMLButtonElement).click();
    await flush();
    expect(instance.paused).toBe(true);
    instance.restart();
    await flush();
    expect(instance.paused).toBe(false);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("starts over when the date or the seconds change", async () => {
    const host = mount(
      markup('data-ok-largest-unit="minutes" data-ok-seconds="90"', ["minutes", "seconds"]),
    );
    start();
    expect(values(host)).toEqual(["1", "30"]);
    const root = host.querySelector("[data-ok-countdown]") as HTMLElement;
    root.setAttribute("data-ok-seconds", "125");
    await flush();
    expect(values(host)).toEqual(["2", "05"]);
    root.setAttribute("data-ok-date", "2026-11-09T12:00:05Z");
    await flush();
    expect(values(host)).toEqual(["0", "05"]);
  });

  it("ignores hostile values and stops with the runtime", () => {
    const host = mount(
      `${markup('data-ok-largest-unit="&quot;&gt;&lt;img onerror&gt;" data-ok-date="javascript:alert(1)" data-ok-seconds="-3"')}<span data-ok-countdown data-ok-seconds="5"><span data-ok-countdown-unit="weeks"><span data-ok-countdown-value>x</span></span><span data-ok-countdown-unit="seconds"><span data-ok-countdown-label> </span></span></span>`,
    );
    start();
    expect(values(host).slice(0, 4)).toEqual(["0", "00", "00", "00"]);
    expect(values(host)[4]).toBe("x");
    expect(host.querySelector("img")).toBeNull();
    const root = host.querySelector("[data-ok-countdown]") as HTMLElement;
    runtime?.stop();
    root.setAttribute("data-ok-seconds", "9");
    vi.advanceTimersByTime(2000);
    expect(values(host)[3]).toBe("00");
  });
});
