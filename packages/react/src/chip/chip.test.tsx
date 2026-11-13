import { chipColors, chipVariants } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Avatar } from "../avatar/avatar.js";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { Chip } from "./chip.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const rootOf = (el: Element) => el.closest("[data-ok-chip]") as HTMLElement;

/** A router link stand-in: its own `to` becomes the `href`. */
function RouterLink({ to, ...props }: { to: string } & Record<string, unknown>) {
  return <a href={`/app${to}`} data-router="" {...props} />;
}

describe("Chip", () => {
  it("renders a static filled chip of 32px", () => {
    render(<Chip label="Tag" />);
    const root = rootOf(screen.getByText("Tag"));
    expect(root.dataset).toMatchObject({
      okChip: "",
      okVariant: "filled",
      okColor: "default",
      okSize: "medium",
    });
    expect(root.querySelector("[data-ok-chip-action]")?.localName).toBe("span");
    expect(screen.queryByRole("button")).toBeNull();
    expect(css(root).height).toBe("32px");
    expect(css(root).borderRadius).toBe("9999px");
  });

  it("clickable: a button that reports clicks; hover darkens", async () => {
    const onClick = vi.fn();
    render(<Chip label="Filter" color="primary" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Filter" });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    const root = rootOf(button);
    await settled(root);
    expect(css(root).backgroundColor).toBe("rgb(79, 57, 246)");
    render(<Chip label="Clickable" clickable />);
    expect(screen.getByRole("button", { name: "Clickable" })).toBeDefined();
  });

  it("deletable: a named delete button, and Backspace / Delete on the chip", async () => {
    const onDelete = vi.fn();
    render(
      <>
        <Chip label="Paris" onDelete={onDelete} deleteLabel="Remove Paris" />
        <Chip label="Rome" onClick={() => {}} onDelete={onDelete} />
        <Chip label="Oslo" onClick={() => {}} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove Paris" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    screen.getByRole("button", { name: "Rome" }).focus();
    await userEvent.keyboard("{Backspace}");
    await userEvent.keyboard("{Delete}");
    expect(onDelete).toHaveBeenCalledTimes(3);
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(1);
    screen.getByRole("button", { name: "Oslo" }).focus();
    await userEvent.keyboard("{Backspace}");
    expect(onDelete).toHaveBeenCalledTimes(3);
  });

  it("avatar, icon and custom delete icon", () => {
    render(
      <>
        <Chip label="A" avatar={<Avatar>M</Avatar>} />
        <Chip
          label="B"
          icon={<i data-testid="icon" />}
          onDelete={() => {}}
          deleteIcon={<i data-testid="del" />}
        />
      </>,
    );
    const a = rootOf(screen.getByText("A"));
    const avatar = a.querySelector("[data-ok-avatar]") as HTMLElement;
    expect(css(avatar).width).toBe("24px");
    expect(screen.getByTestId("icon").parentElement?.hasAttribute("data-ok-chip-icon")).toBe(true);
    expect(screen.getByTestId("del").parentElement?.hasAttribute("data-ok-chip-delete")).toBe(true);
  });

  it.each(chipVariants)("variant %s", (variant) => {
    render(<Chip label="x" variant={variant} color="info" />);
    const root = rootOf(screen.getByText("x"));
    const style = css(root);
    if (variant === "filled") expect(style.backgroundColor).toBe("rgb(0, 105, 168)");
    if (variant === "outlined") expect(style.borderTopColor).toBe("rgb(0, 105, 168)");
    if (variant === "soft") expect(style.backgroundColor).toMatch(/0\.16\)$/);
  });

  it.each(chipColors)("color %s", (color) => {
    render(<Chip label="x" color={color} />);
    expect(rootOf(screen.getByText("x")).dataset["okColor"]).toBe(color);
  });

  it("small, disabled, invalid values and ref", async () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLSpanElement>();
    render(
      <>
        <Chip ref={ref} label="s" size="small" />
        <Chip label="d" disabled onClick={onClick} onDelete={() => {}} />
        <Chip label="h" variant={HOSTILE} color={HOSTILE} size={HOSTILE} />
      </>,
    );
    expect(css(ref.current as Element).height).toBe("24px");
    const disabled = screen.getByRole("button", { name: "d" }) as HTMLButtonElement;
    expect(disabled.disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Remove" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    await userEvent.click(disabled, { force: true });
    expect(onClick).not.toHaveBeenCalled();
    expect(rootOf(screen.getByText("h")).dataset).toMatchObject({
      okVariant: "filled",
      okColor: "default",
      okSize: "medium",
    });
  });

  it("link chips: an <a> with href, hover and focus like a button, rel on new tabs", async () => {
    const onClick = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
    const onDelete = vi.fn();
    render(
      <>
        <Chip label="Docs" color="primary" href="#docs" onClick={onClick} onDelete={onDelete} />
        <Chip label="New tab" href="https://example.com/" target="_blank" rel="external" />
        <Chip label="Same tab" href="#same" target="_self" />
      </>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.localName).toBe("a");
    expect(link.getAttribute("href")).toBe("#docs");
    expect(link.dataset["okChipAction"]).toBe("");
    expect(css(link).textDecorationLine).toBe("none");
    expect(css(link).cursor).toBe("pointer");
    await userEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
    const root = rootOf(link);
    await settled(root);
    expect(css(root).backgroundColor).toBe("rgb(79, 57, 246)");
    link.focus();
    await userEvent.keyboard("{Delete}");
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "New tab" }).getAttribute("rel")).toBe(
      "external noopener noreferrer",
    );
    expect(screen.getByRole("link", { name: "Same tab" }).hasAttribute("rel")).toBe(false);
    expect(screen.queryByRole("button", { name: "Docs" })).toBeNull();
  });

  it("link chips: disabled drops href; component renders a router link with actionProps", async () => {
    const onClick = vi.fn();
    render(
      <>
        <Chip label="Off" href="#off" onClick={onClick} disabled />
        <Chip label="Route" component={RouterLink} actionProps={{ to: "/settings" }} />
        <Chip label="Button" component="button" />
        <Chip label="Off button" onClick={onClick} disabled />
      </>,
    );
    const off = screen.getByRole("link", { name: "Off" });
    expect(off.hasAttribute("href")).toBe(false);
    expect(off.getAttribute("aria-disabled")).toBe("true");
    // Same disabled colors as a disabled button chip.
    const offButton = screen.getByRole("button", { name: "Off button" });
    expect(css(rootOf(off)).color).toBe(css(rootOf(offButton)).color);
    expect(css(rootOf(off)).backgroundColor).toBe(css(rootOf(offButton)).backgroundColor);
    off.click();
    expect(onClick).not.toHaveBeenCalled();
    const route = screen.getByRole("link", { name: "Route" });
    expect(route.getAttribute("href")).toBe("/app/settings");
    expect(route.dataset).toMatchObject({ router: "", okChipAction: "" });
    expect(screen.getByRole("button", { name: "Button" }).getAttribute("type")).toBe("button");
    await expectNoAxeViolations(document.body);
  });

  it("renders on the server and has no axe violations", async () => {
    expect(renderToString(<Chip label="x" onDelete={() => {}} />)).toContain("data-ok-chip-delete");
    const { container } = render(
      <>
        <Chip label="One" />
        <Chip label="Two" variant="soft" color="primary" onClick={() => {}} />
        <Chip label="Three" variant="outlined" onDelete={() => {}} deleteLabel="Remove Three" />
        <Chip label="Four" avatar={<Avatar>M</Avatar>} size="small" />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
