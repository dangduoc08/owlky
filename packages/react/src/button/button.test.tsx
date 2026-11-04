import { buttonColors, buttonSizes, buttonVariants } from "@minimal-tailwind/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Button } from "./button.js";

const Icon = () => (
  <svg data-testid="icon" aria-hidden="true" viewBox="0 0 24 24">
    <path d="M4 12h16" />
  </svg>
);

const css = (element: Element) => getComputedStyle(element);

describe("Button anatomy", () => {
  it("renders a native button with explicit defaults and a label part", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.dataset).toMatchObject({
      mtButton: "",
      mtVariant: "text",
      mtColor: "inherit",
      mtSize: "md",
    });
    expect(button.querySelector("[data-mt-button-label]")?.textContent).toBe("Save");
    expect(button.hasAttribute("aria-busy")).toBe(false);
  });

  it.each(buttonVariants)("variant %s", (variant) => {
    render(<Button variant={variant}>x</Button>);
    expect(screen.getByRole("button").dataset["mtVariant"]).toBe(variant);
  });

  it.each(buttonColors)("color %s", (color) => {
    render(<Button color={color}>x</Button>);
    expect(screen.getByRole("button").dataset["mtColor"]).toBe(color);
  });

  it.each(buttonSizes)("size %s", (size) => {
    render(<Button size={size}>x</Button>);
    expect(screen.getByRole("button").dataset["mtSize"]).toBe(size);
  });

  it("falls back to defaults for invalid values", () => {
    render(
      <Button variant={"<b>" as never} color={"__proto__" as never} size={"huge" as never}>
        x
      </Button>,
    );
    expect(screen.getByRole("button").dataset).toMatchObject({
      mtVariant: "text",
      mtColor: "inherit",
      mtSize: "md",
    });
  });

  it("supports fullWidth, a custom type and native props", () => {
    render(
      <Button fullWidth type="submit" className="custom" title="Save it">
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.dataset["mtFullWidth"]).toBe("");
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.className).toBe("custom");
    expect(button.title).toBe("Save it");
  });

  it("renders icons as decorative slots that don't change the accessible name", () => {
    render(
      <Button startIcon={<Icon />} endIcon={<Icon />}>
        Send
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Send" });
    const icons = button.querySelectorAll("[data-mt-button-icon]");
    expect([...icons].map((icon) => icon.getAttribute("data-mt-button-icon"))).toEqual([
      "start",
      "end",
    ]);
    for (const icon of icons) expect(icon.getAttribute("aria-hidden")).toBe("true");
  });

  it("forwards refs to the rendered element", () => {
    const buttonRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
    const linkRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
    render(
      <>
        <Button ref={buttonRef}>Button</Button>
        <Button ref={linkRef} href="/docs">
          Link
        </Button>
      </>,
    );
    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(linkRef.current).toBeInstanceOf(HTMLAnchorElement);
  });
});

describe("Button behavior", () => {
  it("activates with click, Enter and Space", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button");
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("does not activate when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"), { force: true });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading disables the button, sets aria-busy and keeps the label as its name", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Submit
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.dataset).toMatchObject({ mtLoading: "", mtLoadingPosition: "center" });
    const loader = button.querySelector("[data-mt-button-loader]");
    expect(loader?.getAttribute("aria-hidden")).toBe("true");
    expect(loader?.querySelector("[data-mt-button-spinner]")).not.toBeNull();
    await userEvent.click(button, { force: true });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("uses a custom loading indicator without changing the accessible name", () => {
    render(
      <Button loading loadingIndicator="Loading…">
        Fetch data
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Fetch data" });
    expect(button.querySelector("[data-mt-button-loader]")?.textContent).toBe("Loading…");
    expect(button.querySelector("[data-mt-button-spinner]")).toBeNull();
  });

  it("loading start/end replaces the matching icon", () => {
    render(
      <>
        <Button loading loadingPosition="start" startIcon={<Icon />}>
          Start
        </Button>
        <Button loading loadingPosition="end" endIcon={<Icon />}>
          End
        </Button>
      </>,
    );
    const start = screen.getByRole("button", { name: "Start" });
    const end = screen.getByRole("button", { name: "End" });
    expect(start.dataset["mtLoadingPosition"]).toBe("start");
    expect(css(start.querySelector('[data-mt-button-icon="start"]') as Element).display).toBe(
      "none",
    );
    expect(css(end.querySelector('[data-mt-button-icon="end"]') as Element).display).toBe("none");
  });

  it("renders a link when href is set, and an inert link when disabled or loading", () => {
    render(
      <>
        <Button href="/docs" target="_blank" rel="noopener noreferrer">
          Docs
        </Button>
        <Button href="/docs" disabled>
          Disabled link
        </Button>
        <Button href="/docs" loading>
          Loading link
        </Button>
      </>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    for (const name of ["Disabled link", "Loading link"]) {
      const inert = screen.getByRole("link", { name });
      expect(inert.hasAttribute("href")).toBe(false);
      expect(inert.getAttribute("aria-disabled")).toBe("true");
    }
    expect(screen.getByRole("link", { name: "Loading link" }).getAttribute("aria-busy")).toBe(
      "true",
    );
  });

  it("passes href through untouched (never builds or rewrites URLs)", () => {
    render(<Button href="https://example.com/a?b=c#d">Out</Button>);
    expect(screen.getByRole("link").getAttribute("href")).toBe("https://example.com/a?b=c#d");
  });
});

describe("Button styles (shipped CSS)", () => {
  it("applies variant colors from the tokens", () => {
    render(
      <>
        <Button variant="contained" color="primary">
          contained
        </Button>
        <Button variant="outlined" color="primary">
          outlined
        </Button>
        <Button variant="soft" color="primary">
          soft
        </Button>
        <Button variant="contained" color="black">
          black
        </Button>
      </>,
    );
    expect(css(screen.getByRole("button", { name: "contained" })).backgroundColor).toBe(
      "rgb(0, 167, 111)",
    );
    expect(css(screen.getByRole("button", { name: "outlined" })).borderTopColor).toBe(
      "rgba(0, 167, 111, 0.48)",
    );
    expect(css(screen.getByRole("button", { name: "soft" })).backgroundColor).toBe(
      "rgba(0, 167, 111, 0.16)",
    );
    expect(css(screen.getByRole("button", { name: "black" })).backgroundColor).toBe("rgb(0, 0, 0)");
  });

  it.each([
    ["sm", 30],
    ["md", 36],
    ["lg", 48],
    ["xl", 56],
  ] as const)("size %s is %ipx tall", (size, height) => {
    render(<Button size={size}>x</Button>);
    expect(screen.getByRole("button").getBoundingClientRect().height).toBe(height);
  });

  it("darkens contained buttons on hover", async () => {
    render(
      <Button variant="contained" color="primary">
        hover me
      </Button>,
    );
    const button = screen.getByRole("button");
    await userEvent.hover(button);
    await vi.waitFor(() => expect(css(button).backgroundColor).toBe("rgb(0, 120, 103)"));
  });

  it("hides the label visually but not from the accessibility tree while loading", () => {
    render(<Button loading>Submit</Button>);
    const label = screen.getByText("Submit");
    expect(css(label).color).toBe("rgba(0, 0, 0, 0)");
    expect(css(label).visibility).toBe("visible");
  });
});

describe("Button SSR and accessibility", () => {
  it("renders on the server with the same markup as the client", () => {
    const element = (
      <Button
        variant="soft"
        color="info"
        size="lg"
        startIcon={<Icon />}
        loading
        loadingPosition="start"
      >
        Server
      </Button>
    );
    const html = renderToString(element);
    const { container } = render(element);
    const server = document.createElement("div");
    server.innerHTML = html;
    expect(server.firstElementChild?.outerHTML).toBe(container.firstElementChild?.outerHTML);
  });

  it("has no axe violations across variants, colors and states", async () => {
    render(
      <>
        {buttonVariants.map((variant) =>
          (["inherit", "primary", "error"] as const).map((color) => (
            <Button key={`${variant}-${color}`} variant={variant} color={color}>
              {variant} {color}
            </Button>
          )),
        )}
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
        <Button href="/docs">Link</Button>
      </>,
    );
    await expectNoAxeViolations();
  });
});
