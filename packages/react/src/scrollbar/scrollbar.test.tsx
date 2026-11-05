import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Scrollbar } from "./scrollbar.js";

const long = "Scrolling content. ".repeat(200);

describe("Scrollbar", () => {
  it("renders a named, focusable region that auto-hides by default", () => {
    render(<Scrollbar>{long}</Scrollbar>);
    const region = screen.getByRole("region", { name: "scrollable content" });
    expect(region.dataset["okScrollbar"]).toBe("");
    expect(region.hasAttribute("data-ok-auto-hide")).toBe(false);
    expect(region.tabIndex).toBe(0);
    expect(getComputedStyle(region).overflow).toBe("auto");
  });

  it("autoHide={false}, own name, tabIndex and ref", () => {
    const ref = createRef<HTMLElement>();
    render(
      <>
        <Scrollbar ref={ref} autoHide={false} aria-label="Notes" tabIndex={-1} />
        <h2 id="t">Title</h2>
        <Scrollbar aria-labelledby="t" />
      </>,
    );
    const notes = screen.getByRole("region", { name: "Notes" });
    expect(notes.dataset["okAutoHide"]).toBe("false");
    expect(notes.tabIndex).toBe(-1);
    expect(ref.current).toBe(notes);
    const titled = screen.getByRole("region", { name: "Title" });
    expect(titled.hasAttribute("aria-label")).toBe(false);
  });

  it("scrolls with the keyboard once focused", async () => {
    render(
      <Scrollbar style={{ height: 80 }}>
        <p>{long}</p>
      </Scrollbar>,
    );
    const region = screen.getByRole("region");
    region.focus();
    await userEvent.keyboard("{PageDown}");
    await expect.poll(() => region.scrollTop).toBeGreaterThan(0);
  });

  it("renders on the server with the same markup", () => {
    const html = renderToString(<Scrollbar autoHide={false}>x</Scrollbar>);
    expect(html).toContain('data-ok-scrollbar=""');
    expect(html).toContain('data-ok-auto-hide="false"');
    expect(html).toContain('aria-label="scrollable content"');
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Scrollbar style={{ height: 80 }}>
        <p>{long}</p>
      </Scrollbar>,
    );
    await expectNoAxeViolations(container);
  });
});
