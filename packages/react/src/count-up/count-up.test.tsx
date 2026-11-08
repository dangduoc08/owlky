import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { CountUp } from "./count-up.js";

const value = (root: Element) => root.querySelector("[data-ok-count-up-value]")?.textContent;

/** Resolves once the shown value reads `text`. */
function valueBecomes(root: Element, text: string): Promise<void> {
  return new Promise((resolve) => {
    if (value(root) === text) return resolve();
    const observer = new MutationObserver(() => {
      if (value(root) !== text) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(root, { subtree: true, characterData: true, childList: true });
  });
}

describe("CountUp", () => {
  it("reads the end value; shows the start, then counts on mount", async () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <p>
        Users:{" "}
        <CountUp
          ref={ref}
          data-testid="c"
          end={200}
          suffix="k"
          prefix="~"
          trigger="mount"
          duration={150}
        />
      </p>,
    );
    const root = screen.getByTestId("c");
    expect(ref.current).toBe(root);
    expect(root.getAttribute("data-ok-count-up")).toBe("");
    expect(root.getAttribute("data-ok-end")).toBe("200");
    expect(root.querySelector("[data-ok-count-up-label]")?.textContent).toBe("~200k");
    expect(root.querySelector("[aria-hidden='true']")?.textContent).toMatch(/^~\d+k$/);
    await valueBecomes(root, "200");
    expect(getComputedStyle(root).fontVariantNumeric).toBe("tabular-nums");
    expect(screen.getByText("~200k").getBoundingClientRect().width).toBeLessThanOrEqual(1);
    await expectNoAxeViolations();
  });

  it("in view by default; decimals and start", async () => {
    render(<CountUp data-testid="c" start={1} end={2.5} decimals={1} duration={60} />);
    const root = screen.getByTestId("c");
    expect(root.getAttribute("data-ok-trigger")).toBe("inView");
    expect(value(root)).toBe("1.0");
    await valueBecomes(root, "2.5");
  });

  it("manual: counts when in turns on; invalid numbers fall back", async () => {
    const { rerender } = render(
      <CountUp
        data-testid="c"
        end={Number.NaN}
        start={Number.NaN}
        decimals={-2}
        duration={-1}
        trigger="manual"
        in={false}
        amount={-3}
      />,
    );
    const root = screen.getByTestId("c");
    expect(value(root)).toBe("0");
    expect(root.hasAttribute("data-ok-in")).toBe(false);
    rerender(<CountUp data-testid="c" end={5} trigger="manual" in duration={0} once={false} />);
    expect(root.hasAttribute("data-ok-in")).toBe(true);
    expect(root.getAttribute("data-ok-once")).toBe("false");
    await valueBecomes(root, "5");
  });

  it("SSR renders the start value", () => {
    const html = renderToString(<CountUp end={9} start={3} />);
    expect(html).toContain('data-ok-count-up-value="">3<');
  });
});
