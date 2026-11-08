import { describe, expect, it } from "vitest";
import {
  canTransfer,
  sideCheckedState,
  toggleAll,
  transferCountLabel,
  transferMove,
} from "./transfer-list.js";

const STATE = { left: ["a", "b", "c"], right: ["d"], checked: ["b", "d"] };

describe("transfer list rules", () => {
  it("moves checked items to the end of the other side and unchecks them", () => {
    expect(transferMove(STATE, "right")).toEqual({
      left: ["a", "c"],
      right: ["d", "b"],
      checked: ["d"],
    });
    expect(transferMove(STATE, "left")).toEqual({
      left: ["a", "b", "c", "d"],
      right: [],
      checked: ["b"],
    });
  });

  it("moves everything", () => {
    expect(transferMove(STATE, "all-right")).toEqual({
      left: [],
      right: ["d", "a", "b", "c"],
      checked: ["d"],
    });
    expect(transferMove(STATE, "all-left").right).toEqual([]);
  });

  it("knows when a move does nothing", () => {
    expect(canTransfer(STATE, "right")).toBe(true);
    expect(canTransfer({ ...STATE, checked: ["d"] }, "right")).toBe(false);
    expect(canTransfer({ ...STATE, right: [] }, "all-left")).toBe(false);
    expect(canTransfer(STATE, "all-right")).toBe(true);
  });

  it("select-all toggles a side; its state is true, false or mixed", () => {
    expect(toggleAll(["d"], ["a", "b"])).toEqual(["d", "a", "b"]);
    expect(toggleAll(["a", "b", "d"], ["a", "b"])).toEqual(["d"]);
    expect(toggleAll([], [])).toEqual([]);
    expect(sideCheckedState(["a"], ["a", "b"])).toBe("mixed");
    expect(sideCheckedState(["a", "b"], ["a", "b"])).toBe(true);
    expect(sideCheckedState([], ["a"])).toBe(false);
    expect(sideCheckedState([], [])).toBe(false);
  });

  it("count label", () => expect(transferCountLabel(1, 4)).toBe("1/4 selected"));
});
