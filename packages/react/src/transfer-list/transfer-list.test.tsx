import { render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { TransferList } from "./transfer-list.js";

const ITEMS = ["A", "B", "C", "D"].map((label) => ({ value: label.toLowerCase(), label }));
const side = (name: "left" | "right") =>
  [...document.querySelectorAll(`[data-ok-side="${name}"] [data-ok-value]`)].map((row) =>
    row.getAttribute("data-ok-value"),
  );
const button = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;
const box = (label: string) => screen.getByRole("checkbox", { name: label });

function Demo() {
  const [sides, setSides] = useState({ left: ["a"], right: ["b"] });
  return (
    <TransferList
      items={ITEMS.slice(0, 2)}
      left={sides.left}
      right={sides.right}
      onChange={(left, right) => setSides({ left, right })}
    />
  );
}

describe("TransferList", () => {
  it("two named lists of checkable rows and four move buttons", async () => {
    render(<TransferList id="t" items={ITEMS} defaultLeft={["a", "b"]} />);
    const root = document.querySelector("[data-ok-transfer-list]") as HTMLElement;
    expect({ ...root.dataset }).toEqual({
      okTransferList: "",
      okVariant: "simple",
      okRuntime: "off",
    });
    expect(screen.getByRole("region", { name: "Choices" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Chosen" })).toBeTruthy();
    expect([side("left"), side("right")]).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
    expect(
      ["Move all right", "Move selected right", "Move selected left", "Move all left"].map(
        (name) => button(name).disabled,
      ),
    ).toEqual([false, true, true, false]);
    await expectNoAxeViolations();
  });

  it("looks like the reference: 220px cards, 44px rows, 14px semibold labels", () => {
    render(<TransferList items={ITEMS} />);
    const panel = document.querySelector("[data-ok-transfer-list-panel]") as HTMLElement;
    expect(panel.getBoundingClientRect().width).toBe(220);
    expect(getComputedStyle(panel).borderRadius).toBe("18px");
    const row = document.querySelector("[data-ok-transfer-list-option]") as HTMLElement;
    expect(row.getBoundingClientRect().height).toBe(44);
    expect(getComputedStyle(row).fontWeight).toBe("600");
  });

  it("check and move: selected right / left, all; moved rows are unchecked", async () => {
    const onChange = vi.fn();
    render(
      <StrictMode>
        <TransferList items={ITEMS} defaultLeft={["a", "b"]} onChange={onChange} />
      </StrictMode>,
    );
    await userEvent.click(box("A"));
    await userEvent.click(box("B"));
    await userEvent.click(box("B"));
    expect((box("B") as HTMLInputElement).checked).toBe(false);
    expect(button("Move selected right").disabled).toBe(false);
    await userEvent.click(button("Move selected right"));
    expect(onChange).toHaveBeenLastCalledWith(["b"], ["c", "d", "a"]);
    expect((box("A") as HTMLInputElement).checked).toBe(false);
    await userEvent.click(button("Move all left"));
    expect(side("left")).toEqual(["b", "c", "d", "a"]);
    await userEvent.click(button("Move all right"));
    expect(side("right")).toEqual(["b", "c", "d", "a"]);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("controlled sides", async () => {
    render(<Demo />);
    await userEvent.click(button("Move all right"));
    expect(side("right")).toEqual(["b", "a"]);
  });

  it("enhanced: titles, select-all with a mixed state, counts", async () => {
    render(
      <TransferList
        items={ITEMS}
        defaultLeft={["a", "b"]}
        variant="enhanced"
        titles={["Available", "Picked"]}
        getCountLabel={(c, t) => `${c} of ${t}`}
        buttonLabels={{ right: "Add" }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Move all right" })).toBeNull();
    const all = box("Select all available") as HTMLInputElement;
    await userEvent.click(box("A"));
    expect(all.indeterminate).toBe(true);
    expect(screen.getAllByText("1 of 2")).toHaveLength(1);
    await userEvent.click(all);
    expect(all.checked).toBe(true);
    await userEvent.click(all);
    expect((box("A") as HTMLInputElement).checked).toBe(false);
    await userEvent.click(box("B"));
    await userEvent.click(button("Add"));
    expect(side("right")).toEqual(["c", "d", "b"]);
    await expectNoAxeViolations();
  });

  it("disabled: nothing can be checked or moved", () => {
    render(<TransferList items={ITEMS} disabled />);
    expect(screen.getAllByRole("checkbox").every((c) => (c as HTMLInputElement).disabled)).toBe(
      true,
    );
    expect(screen.getAllByRole("button").every((b) => (b as HTMLButtonElement).disabled)).toBe(
      true,
    );
  });

  it("stacks below 600px, side by side above", () => {
    render(<TransferList items={ITEMS} />);
    const root = document.querySelector("[data-ok-transfer-list]") as HTMLElement;
    expect(getComputedStyle(root).flexDirection).toBe(innerWidth >= 600 ? "row" : "column");
  });

  it("unknown values show as text; passes ref and props", () => {
    const ref = createRef<HTMLDivElement>();
    render(<TransferList ref={ref} className="mine" items={[]} defaultLeft={["ghost"]} />);
    expect(ref.current?.className).toBe("mine");
    expect(screen.getByText("ghost")).toBeTruthy();
  });

  it("server render matches the client markup", () => {
    const element = <TransferList id="s" items={ITEMS} defaultLeft={["a"]} variant="enhanced" />;
    const html = renderToString(element);
    const { container } = render(element);
    const server = document.createElement("div");
    server.innerHTML = html;
    expect(container.firstElementChild?.isEqualNode(server.firstElementChild)).toBe(true);
  });
});
