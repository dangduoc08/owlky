import { loader, type Monaco } from "@owlky/core/code-editor";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMonaco } from "./code-editor.js";
import { useTestWorkers } from "./test-utils.js";

/** Reports every value `useMonaco()` returns. */
function Probe({ onValue }: { onValue: (monaco: Monaco | null) => void }) {
  onValue(useMonaco());
  return null;
}

// Monaco isn't loaded yet in this file's page (one loader module per test file).
describe("useMonaco", () => {
  it("is null until Monaco loads, then returns it; unmounting stops waiting quietly", async () => {
    useTestWorkers();
    const error = vi.spyOn(console, "error");
    const values: (Monaco | null)[] = [];
    const early = render(<Probe onValue={(value) => values.push(value)} />);
    early.unmount();
    expect(values).toEqual([null]);
    await new Promise<void>((resolve) => {
      render(
        <Probe
          onValue={(value) => {
            if (value) resolve();
          }}
        />,
      );
    });
    expect(loader.getMonaco()).not.toBeNull();
    let seen: Monaco | null = null;
    render(<Probe onValue={(value) => (seen = value)} />);
    expect(seen).toBe(loader.getMonaco());
    expect(error).not.toHaveBeenCalledWith("Monaco couldn't load:", expect.anything());
    error.mockRestore();
  });
});
