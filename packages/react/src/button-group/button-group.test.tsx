import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Button } from "../button/button.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { ButtonGroup } from "./button-group.js";

const css = (element: Element) => getComputedStyle(element);
const labels = ["One", "Two", "Three"];

describe("ButtonGroup", () => {
  it("renders a horizontal group by default", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ButtonGroup ref={ref} aria-label="Actions">
        {labels.map((label) => (
          <Button key={label}>{label}</Button>
        ))}
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Actions" });
    expect(group.dataset).toMatchObject({ mtButtonGroup: "", mtOrientation: "horizontal" });
    expect(ref.current).toBe(group);
  });

  it("passes variant, color, size and disabled to children; a child prop wins", () => {
    render(
      <ButtonGroup
        variant="contained"
        color="primary"
        size="lg"
        disabled
        orientation={"x" as never}
      >
        <Button>One</Button>
        <Button color="error" disabled={false}>
          Two
        </Button>
        plain text
        {null}
      </ButtonGroup>,
    );
    const one = screen.getByRole("button", { name: "One" }) as HTMLButtonElement;
    const two = screen.getByRole("button", { name: "Two" }) as HTMLButtonElement;
    expect(one.dataset).toMatchObject({ mtVariant: "contained", mtColor: "primary", mtSize: "lg" });
    expect(one.disabled).toBe(true);
    expect(two.dataset["mtColor"]).toBe("error");
    expect(two.disabled).toBe(false);
    expect(screen.getByRole("group").dataset["mtOrientation"]).toBe("horizontal");
    expect(screen.getByRole("group").textContent).toContain("plain text");
  });

  it("leaves children untouched when the group sets nothing", () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("button").dataset).toMatchObject({ mtVariant: "text", mtSize: "md" });
  });

  it("joins buttons: outer corners rounded, separators between, no gap", () => {
    render(
      <ButtonGroup variant="contained" color="primary">
        {labels.map((label) => (
          <Button key={label}>{label}</Button>
        ))}
      </ButtonGroup>,
    );
    const [first, middle, last] = screen.getAllByRole("button");
    expect(css(first as Element).borderTopLeftRadius).toBe("8px");
    expect(css(first as Element).borderTopRightRadius).toBe("0px");
    expect(css(middle as Element).borderTopLeftRadius).toBe("0px");
    expect(css(last as Element).borderTopRightRadius).toBe("8px");
    expect(css(first as Element).borderRightColor).toBe("rgba(0, 120, 103, 0.48)");
    expect(css(last as Element).borderRightColor).toBe("rgba(0, 0, 0, 0)");
    const a = (first as Element).getBoundingClientRect();
    const b = (middle as Element).getBoundingClientRect();
    expect(b.left).toBe(a.right);
  });

  it("stacks vertically with separators below", () => {
    render(
      <ButtonGroup orientation="vertical" variant="outlined">
        {labels.map((label) => (
          <Button key={label}>{label}</Button>
        ))}
      </ButtonGroup>,
    );
    const [first, second] = screen.getAllByRole("button");
    expect(css(screen.getByRole("group")).flexDirection).toBe("column");
    expect(css(first as Element).borderBottomColor).toBe("rgba(0, 0, 0, 0)");
    expect(css(first as Element).borderBottomLeftRadius).toBe("0px");
    expect(css(second as Element).borderTopLeftRadius).toBe("0px");
    expect((second as Element).getBoundingClientRect().top).toBe(
      (first as Element).getBoundingClientRect().bottom,
    );
  });

  it("uses variant-specific separators and drops the hover shadow", async () => {
    render(
      <>
        <ButtonGroup variant="soft" color="error">
          <Button>Soft</Button>
          <Button>S2</Button>
        </ButtonGroup>
        <ButtonGroup variant="text" color="black">
          <Button>Text</Button>
          <Button>T2</Button>
        </ButtonGroup>
        <ButtonGroup variant="contained" color="inherit">
          <Button>Neutral</Button>
          <Button>N2</Button>
        </ButtonGroup>
        <ButtonGroup variant="soft" color="white">
          <Button>White</Button>
          <Button>W2</Button>
        </ButtonGroup>
        <ButtonGroup variant="contained" disabled>
          <Button>Off</Button>
          <Button>O2</Button>
        </ButtonGroup>
      </>,
    );
    const right = (name: string) => css(screen.getByRole("button", { name })).borderRightColor;
    expect(right("Soft")).toBe("rgba(183, 29, 24, 0.24)");
    expect(right("Text")).toBe("rgba(0, 0, 0, 0.48)");
    expect(right("Neutral")).toBe("rgba(145, 158, 171, 0.32)");
    expect(right("White")).toBe("rgba(255, 255, 255, 0.24)");
    // Disabled tokens are color-mix(): engines serialize them as rgba() or color(srgb …).
    expect(right("Off")).toMatch(/^(rgba\(145, 158, 171|color\(srgb 0\.5686)/);
    const neutral = screen.getByRole("button", { name: "Neutral" });
    await userEvent.hover(neutral);
    await vi.waitFor(() => expect(css(neutral).backgroundColor).toBe("rgb(69, 79, 91)"));
    expect(css(neutral).boxShadow).toBe("none");
  });

  it("renders the same markup on the server and has no axe violations", async () => {
    const element = (
      <ButtonGroup aria-label="Pages" variant="outlined" color="info" size="sm">
        {labels.map((label) => (
          <Button key={label}>{label}</Button>
        ))}
      </ButtonGroup>
    );
    const server = document.createElement("div");
    server.innerHTML = renderToString(element);
    const { container } = render(element);
    expect(server.firstElementChild?.outerHTML).toBe(container.firstElementChild?.outerHTML);
    await expectNoAxeViolations();
  });
});
