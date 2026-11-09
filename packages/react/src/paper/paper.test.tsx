import { paperElevations, paperVariants } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Paper } from "./paper.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);

/** The computed value of `box-shadow: <value>` (engines serialize shadows differently). */
function shadowOf(value: string) {
  const probe = document.createElement("div");
  probe.style.boxShadow = value;
  document.body.append(probe);
  const shadow = css(probe).boxShadow;
  probe.remove();
  return shadow;
}

describe("Paper", () => {
  it("renders a div surface with the default options", () => {
    render(<Paper data-testid="p">Content</Paper>);
    const paper = screen.getByTestId("p");
    expect(paper.localName).toBe("div");
    expect({ ...paper.dataset }).toEqual({
      testid: "p",
      okPaper: "",
      okVariant: "elevation",
      okElevation: "1",
    });
    expect(paper.hasAttribute("role")).toBe(false);
    expect(css(paper).borderRadius).toBe("8px");
    expect(css(paper).backgroundColor).toBe("rgb(255, 255, 255)");
    expect(css(paper).boxShadow).toBe(shadowOf("var(--ok-elevation-1)"));
    expect(css(paper).borderStyle).toBe("none");
  });

  it.each(paperElevations)("elevation %s: --ok-elevation-<n>", (level) => {
    render(<Paper elevation={Number(level)} data-testid="p" />);
    const paper = screen.getByTestId("p");
    expect(paper.dataset["okElevation"]).toBe(level);
    expect(css(paper).boxShadow).toBe(
      level === "0" ? "none" : shadowOf(`var(--ok-elevation-${level})`),
    );
  });

  it.each(paperVariants)("variant %s", (variant) => {
    render(<Paper variant={variant} elevation={8} data-testid="p" />);
    const style = css(screen.getByTestId("p"));
    if (variant === "outlined") {
      expect(style.boxShadow).toBe("none");
      expect(style.borderStyle).toBe("solid");
      expect(style.borderTopWidth).toBe("1px");
    } else {
      expect(style.boxShadow).toBe(shadowOf("var(--ok-elevation-8)"));
      expect(style.borderStyle).toBe("none");
    }
  });

  it("square corners, on both variants", () => {
    render(
      <>
        <Paper square data-testid="a" />
        <Paper square variant="outlined" data-testid="b" />
      </>,
    );
    expect(screen.getByTestId("a").dataset["okSquare"]).toBe("");
    expect(css(screen.getByTestId("a")).borderRadius).toBe("0px");
    expect(css(screen.getByTestId("b")).borderRadius).toBe("0px");
  });

  it("component, ref, props and invalid values", () => {
    const ref = createRef<HTMLElement>();
    render(
      <ul>
        <Paper
          ref={ref}
          component="li"
          className="extra"
          aria-label="Card"
          variant={HOSTILE}
          elevation={HOSTILE}
          square={HOSTILE}
        >
          Item
        </Paper>
      </ul>,
    );
    const paper = ref.current as HTMLElement;
    expect(paper.localName).toBe("li");
    expect(paper.className).toBe("extra");
    expect(paper.getAttribute("aria-label")).toBe("Card");
    expect({ ...paper.dataset }).toEqual({ okPaper: "", okVariant: "elevation", okElevation: "1" });
    for (const elevation of [-1, 25, 2.5]) {
      const { container } = render(<Paper elevation={elevation} />);
      expect(container.querySelector("[data-ok-paper]")?.getAttribute("data-ok-elevation")).toBe(
        "1",
      );
    }
  });

  it("follows the color scheme: dark paper and text in a dark scope", () => {
    render(
      <div data-ok-theme="dark">
        <Paper data-testid="p">Dark</Paper>
      </div>,
    );
    const style = css(screen.getByTestId("p"));
    expect(style.backgroundColor).toBe("rgb(28, 37, 46)");
    expect(style.color).toBe("rgb(255, 255, 255)");
  });

  it("composes: a surface marker on the same element keeps the paper (Card contract)", () => {
    render(<Paper data-ok-card="" component="article" data-testid="p" />);
    const paper = screen.getByTestId("p");
    expect(paper.localName).toBe("article");
    expect(paper.hasAttribute("data-ok-card")).toBe(true);
    expect(paper.hasAttribute("data-ok-paper")).toBe(true);
  });

  it("renders on the server and has no axe violations", async () => {
    expect(renderToString(<Paper />)).toBe(
      '<div data-ok-paper="" data-ok-variant="elevation" data-ok-elevation="1"></div>',
    );
    expect(renderToString(<Paper component="section" square />)).toContain("<section");
    const { container } = render(
      <>
        <Paper>
          <p>Light</p>
        </Paper>
        <Paper variant="outlined">
          <p>Outlined</p>
        </Paper>
        <div data-ok-theme="dark">
          <Paper elevation={24}>
            <p>Dark</p>
          </Paper>
        </div>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
