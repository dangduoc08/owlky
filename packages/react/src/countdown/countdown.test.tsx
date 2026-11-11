import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Countdown } from "./countdown.js";

const NOW = "2026-11-09T12:00:00.000Z";
const values = (root: Element) =>
  [...root.querySelectorAll("[data-ok-countdown-value]")].map((value) => value.textContent);
const status = (root: Element) => root.querySelector("[data-ok-countdown-status]")?.textContent;
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(Date.parse(NOW));
  });
  afterEach(() => vi.useRealTimers());

  it("shows the time left to a date and counts down every second", async () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Countdown
        ref={ref}
        aria-label="Launch"
        date="2026-11-11T13:02:03Z"
        now={new Date(NOW)}
        data-testid="c"
      />,
    );
    const root = screen.getByRole("timer", { name: "Launch" });
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute("data-ok-countdown", "");
    expect(root).toHaveAttribute("data-ok-largest-unit", "days");
    expect(root).toHaveAttribute("data-ok-date", "2026-11-11T13:02:03Z");
    expect(root).toHaveAttribute("data-ok-now", NOW);
    expect(root).toHaveAttribute("data-ok-runtime", "off");
    expect(root).not.toHaveAttribute("data-ok-seconds");
    expect(values(root)).toEqual(["2", "01", "02", "03"]);
    expect(root.textContent).toContain("2 days");
    tick(1000);
    expect(values(root)).toEqual(["2", "01", "02", "02"]);
    expect(screen.getByRole("status").textContent).toBe("");
    vi.useRealTimers();
    await expectNoAxeViolations(root.parentElement as HTMLElement);
  });

  it("renders placeholders until it mounts when a date has no `now`", () => {
    const html = renderToString(<Countdown date="2026-11-09T12:01:00Z" />);
    expect(html).toContain(">--<");
    const { container } = render(<Countdown date="2026-11-09T12:01:00Z" />);
    expect(values(container)).toEqual(["0", "00", "01", "00"]);
  });

  it("matches the server markup with `now` or `seconds`", () => {
    const element = <Countdown date="2026-11-09T12:01:00Z" now={NOW} />;
    const html = renderToString(element);
    const host = document.createElement("div");
    host.innerHTML = html;
    expect(values(host)).toEqual(["0", "00", "01", "00"]);
    expect(renderToString(<Countdown seconds={90} largestUnit="minutes" />)).toContain(
      'data-ok-seconds="90"',
    );
  });

  it("counts seconds, announces on the cadence and completes once", () => {
    const onTick = vi.fn();
    const onComplete = vi.fn();
    const { container } = render(
      <Countdown
        seconds={65}
        largestUnit="seconds"
        labels={{ seconds: "s" }}
        completeLabel="Go"
        onTick={onTick}
        onComplete={onComplete}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-ok-complete-label", "Go");
    expect(values(root)).toEqual(["65"]);
    expect(root.textContent).toContain("65 s");
    tick(5000);
    expect(values(root)).toEqual(["60"]);
    expect(status(root)).toBe("");
    tick(1000);
    expect(status(root)).toBe("59 s");
    tick(29_000);
    expect(status(root)).toBe("30 s");
    tick(30_000);
    expect(status(root)).toBe("Go");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onTick).toHaveBeenLastCalledWith(0);
  });

  it("pauses and resumes from the `paused` prop", () => {
    const { container, rerender } = render(<Countdown seconds={10} largestUnit="seconds" paused />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-ok-paused", "");
    tick(3000);
    expect(values(root)).toEqual(["10"]);
    rerender(<Countdown seconds={10} largestUnit="seconds" />);
    expect(root).not.toHaveAttribute("data-ok-paused");
    tick(3000);
    expect(values(root)).toEqual(["7"]);
  });

  it("starts over when the seconds change; callbacks may change without a restart", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { container, rerender } = render(<Countdown seconds={10} onTick={first} />);
    tick(2000);
    rerender(<Countdown seconds={10} onTick={second} />);
    tick(1000);
    expect(second).toHaveBeenCalledWith(7);
    rerender(<Countdown seconds={20} onTick={second} />);
    expect(values(container.firstElementChild as Element).at(-1)).toBe("20");
  });

  it("falls back on unknown values and works in StrictMode", () => {
    const { container } = render(
      <StrictMode>
        <Countdown seconds={-4} largestUnit={"weeks" as never} />
      </StrictMode>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-ok-largest-unit", "days");
    expect(root).not.toHaveAttribute("data-ok-seconds");
    expect(values(root)).toEqual(["0", "00", "00", "00"]);
  });

  it("writes a Date or a number as given", () => {
    const { container } = render(
      <Countdown date={new Date("2026-11-09T12:00:10Z")} now={Date.parse(NOW)} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-ok-date", "2026-11-09T12:00:10.000Z");
    expect(root).toHaveAttribute("data-ok-now", String(Date.parse(NOW)));
  });
});
