import { render, screen } from "@testing-library/react";
import { type AnchorHTMLAttributes, createRef, forwardRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ButtonGroup } from "../button-group/button-group.js";
import { Fab } from "../fab/fab.js";
import { IconButton } from "../icon-button/icon-button.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { Button } from "./button.js";

/** A router link: takes `to`, renders an `<a href>` and marks itself. */
const RouterLink = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }
>(function RouterLink({ to, ...props }, ref) {
  return <a ref={ref} href={to} data-router="" {...props} />;
});

/** A Next.js-style link: needs `href` itself. */
const HrefLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  function HrefLink(props, ref) {
    return <a ref={ref} data-href-link="" {...props} />;
  },
);

const Icon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M4 12h16" />
  </svg>
);

describe("Button, IconButton and Fab: component and LinkComponent", () => {
  it("renders a router link through `component` with the button's attributes", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Button ref={ref} component={RouterLink} to="/docs" variant="contained" color="primary">
        Docs
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(ref.current).toBe(link);
    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.hasAttribute("data-router")).toBe(true);
    expect(link.dataset).toMatchObject({
      okButton: "",
      okVariant: "contained",
      okColor: "primary",
    });
    expect(link.hasAttribute("type")).toBe(false);
    expect(link.querySelector("[data-ok-button-label]")?.textContent).toBe("Docs");
  });

  it("renders the LinkComponent when href is set, and passes it href", () => {
    render(
      <>
        <Button href="/a" LinkComponent={HrefLink}>
          A
        </Button>
        <IconButton href="/b" LinkComponent={HrefLink} aria-label="B">
          <Icon />
        </IconButton>
        <Fab href="/c" LinkComponent={HrefLink} aria-label="C">
          <Icon />
        </Fab>
      </>,
    );
    for (const [name, href, part] of [
      ["A", "/a", "okButton"],
      ["B", "/b", "okIconButton"],
      ["C", "/c", "okFab"],
    ] as const) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toBe(href);
      expect(link.hasAttribute("data-href-link")).toBe(true);
      expect(link.dataset[part]).toBe("");
    }
  });

  it('`component="button"` with href still renders a link (MUI)', () => {
    render(
      <Button component="button" href="/x">
        X
      </Button>,
    );
    expect(screen.getByRole("link", { name: "X" }).tagName).toBe("A");
  });

  it("ignores LinkComponent without href", () => {
    render(<Button LinkComponent={HrefLink}>Plain</Button>);
    const button = screen.getByRole("button", { name: "Plain" });
    expect(button.tagName).toBe("BUTTON");
    expect(button.hasAttribute("LinkComponent")).toBe(false);
  });

  it("a disabled router link keeps its href, leaves the tab order and gets no pointer events", () => {
    render(
      <>
        <Button component={HrefLink} href="/off" disabled>
          Off
        </Button>
        <IconButton component={RouterLink} to="/icon" disabled aria-label="Icon off">
          <Icon />
        </IconButton>
        <Fab component={RouterLink} to="/fab" disabled aria-label="Fab off">
          <Icon />
        </Fab>
        <Button component={RouterLink} to="/busy" loading>
          Busy
        </Button>
      </>,
    );
    for (const name of ["Off", "Icon off", "Fab off", "Busy"]) {
      const link = screen.getByRole("link", { name });
      expect(link.hasAttribute("href")).toBe(true);
      expect(link.getAttribute("aria-disabled")).toBe("true");
      expect(link.getAttribute("tabindex")).toBe("-1");
      expect(getComputedStyle(link).pointerEvents).toBe("none");
    }
    expect(screen.getByRole("link", { name: "Busy" }).getAttribute("aria-busy")).toBe("true");
  });

  it("IconButton href renders an icon link (an inert link when disabled or loading)", () => {
    const ref = createRef<HTMLButtonElement | HTMLAnchorElement>();
    render(
      <>
        <IconButton ref={ref} href="/settings" aria-label="Settings" color="primary">
          <Icon />
        </IconButton>
        <IconButton href="/off" disabled aria-label="Disabled">
          <Icon />
        </IconButton>
        <IconButton href="/load" loading aria-label="Loading">
          <Icon />
        </IconButton>
      </>,
    );
    const link = screen.getByRole("link", { name: "Settings" });
    expect(ref.current).toBe(link);
    expect(link.getAttribute("href")).toBe("/settings");
    expect(getComputedStyle(link).textDecorationLine).toBe("none");
    for (const name of ["Disabled", "Loading"]) {
      const inert = screen.getByRole("link", { name });
      expect(inert.hasAttribute("href")).toBe(false);
      expect(inert.getAttribute("aria-disabled")).toBe("true");
      expect(inert.hasAttribute("disabled")).toBe(false);
    }
    expect(screen.getByRole("link", { name: "Loading" }).getAttribute("aria-busy")).toBe("true");
    // A disabled icon link looks like a disabled icon button.
    const disabledButton = render(
      <IconButton disabled aria-label="Native">
        <Icon />
      </IconButton>,
    ).getByRole("button", { name: "Native" });
    expect(getComputedStyle(screen.getByRole("link", { name: "Disabled" })).color).toBe(
      getComputedStyle(disabledButton).color,
    );
  });

  it("matches the HTML markup of an icon link", () => {
    const markup = renderToStaticMarkup(
      <IconButton href="/settings" aria-label="Settings">
        <Icon />
      </IconButton>,
    );
    expect(markup).toBe(
      '<a data-ok-icon-button="" data-ok-color="default" data-ok-size="md" aria-label="Settings" href="/settings"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16"></path></svg></a>',
    );
  });

  it("ButtonGroup renders its `component` and keeps role=group", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ButtonGroup ref={ref} component="nav" aria-label="Pages" variant="contained">
        <Button component={RouterLink} to="/one">
          One
        </Button>
        <Button href="/two">Two</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Pages" });
    expect(group.tagName).toBe("NAV");
    expect(ref.current).toBe(group);
    expect(group.dataset["okButtonGroup"]).toBe("");
    const one = screen.getByRole("link", { name: "One" });
    expect(one.dataset["okVariant"]).toBe("contained");
    expect(screen.getByRole("link", { name: "Two" }).dataset["okVariant"]).toBe("contained");
  });

  it("has no axe violations", async () => {
    render(
      <>
        <Button component={RouterLink} to="/docs">
          Docs
        </Button>
        <IconButton href="/settings" aria-label="Settings">
          <Icon />
        </IconButton>
        <Fab component={RouterLink} to="/new" aria-label="New">
          <Icon />
        </Fab>
      </>,
    );
    await expectNoAxeViolations();
  });
});
