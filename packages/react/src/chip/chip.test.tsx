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
    expect(css(root).borderRadius).toBe("10px");
  });

  it("clickable: a button that reports clicks; hover darkens", async () => {
    const onClick = vi.fn();
    render(<Chip label="Filter" color="primary" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Filter" });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    const root = rootOf(button);
    await settled(root);
    expect(css(root).backgroundColor).toBe("rgb(0, 120, 103)");
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
    if (variant === "filled") expect(style.backgroundColor).toBe("rgb(0, 184, 217)");
    if (variant === "outlined") expect(style.borderTopColor).toBe("rgb(0, 184, 217)");
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
