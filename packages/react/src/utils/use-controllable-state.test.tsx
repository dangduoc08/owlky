import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useControllableState } from "./use-controllable-state.js";

function Probe({
  value,
  onChange,
  expose,
}: {
  value?: string | undefined;
  onChange: (value: string) => void;
  expose: (set: (next: string) => void) => void;
}) {
  const [current, setCurrent] = useControllableState({ value, defaultValue: "a", onChange });
  expose(setCurrent);
  return <output>{current}</output>;
}

describe("useControllableState", () => {
  it("ignores requests for the current value; reports and applies new ones when uncontrolled", () => {
    const onChange = vi.fn();
    let set: (next: string) => void = () => {};
    const { container } = render(<Probe onChange={onChange} expose={(s) => (set = s)} />);
    act(() => set("a"));
    expect(onChange).not.toHaveBeenCalled();
    act(() => set("b"));
    expect(onChange).toHaveBeenCalledWith("b");
    expect(container.textContent).toBe("b");
  });

  it("controlled: reports requests but keeps the owner's value", () => {
    const onChange = vi.fn();
    let set: (next: string) => void = () => {};
    const { container } = render(<Probe value="x" onChange={onChange} expose={(s) => (set = s)} />);
    act(() => set("y"));
    expect(onChange).toHaveBeenCalledWith("y");
    expect(container.textContent).toBe("x");
  });
});
